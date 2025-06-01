import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Dropdown from '@/components/ui/Dropdown';
import Tabs from '@/components/ui/Tabs';
import {
  CodeBracketIcon,
  DocumentTextIcon,
  PlayIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CubeTransparentIcon,
  ServerStackIcon,
  CircleStackIcon,
  CpuChipIcon,
  CodeBracketSquareIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import specificationService, { Specification, CodeGenerationResponse } from '@/api/specification';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

// --- Types ---
interface GeneratedFile {
  file_path: string;
  file_type: string;
  content: string;
  purpose: string;
  staticAnalysis?: {
    issues: any[];
    quality_score: number;
    recommendations: string[];
  };
  commit_info?: {
    sha: string;
    url: string;
    committed_at: string;
  };
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string; // Only for files
  analysis?: any; // Store static analysis results here
}

// --- Form Schema ---
const codeGenFormSchema = z.object({
  specId: z.string().min(1, 'Please select a project specification.'),
  frontendFramework: z.string().optional(),
  backendFramework: z.string().optional(),
  database: z.string().optional(),
  repositoryOwner: z.string().optional(),
  repositoryName: z.string().optional(),
  repositoryBranch: z.string().optional().default('main'),
});

type CodeGenFormData = z.infer<typeof codeGenFormSchema>;

// --- File Tree Component ---
interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFilePath: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, selectedFilePath }) => {
  const renderNode = (node: FileNode) => (
    <li key={node.path} className="py-0.5">
      {node.type === 'directory' ? (
        <div className="flex items-center text-neutral-700 dark:text-neutral-300 font-medium">
          <FolderOpenIcon className="w-4 h-4 mr-2 text-neutral-500" />
          {node.name}
        </div>
      ) : (
        <button
          onClick={() => onFileSelect(node)}
          className={cn(
            'flex items-center w-full text-left px-2 py-1 rounded-md transition-colors',
            selectedFilePath === node.path
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
          )}
        >
          <CodeBracketSquareIcon className="w-4 h-4 mr-2 text-neutral-500" />
          {node.name}
          {node.analysis?.issues?.length > 0 && (
            <span className="ml-2 text-error-500 text-xs">({node.analysis.issues.length} issues)</span>
          )}
        </button>
      )}
      {node.children && node.children.length > 0 && (
        <ul className="ml-4 mt-1 border-l border-neutral-200 dark:border-neutral-700">
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );

  return (
    <div className="overflow-y-auto h-full">
      <ul className="py-2">
        {files.map(renderNode)}
      </ul>
    </div>
  );
};

// --- Code Generation Page Component ---
const CodeGenerationPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { specId: urlSpecId } = useParams<{ specId?: string }>();
  const queryClient = useQueryClient();

  // --- State ---
  const [activeTab, setActiveTab] = useState<'generate' | 'results'>('generate');
  const [selectedFileNode, setSelectedFileNode] = useState<FileNode | null>(null);
  const [codeGenerationSessionId, setCodeGenerationSessionId] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<FileNode[]>([]);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // --- Form Setup ---
  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<CodeGenFormData>({
    resolver: zodResolver(codeGenFormSchema),
    defaultValues: {
      specId: urlSpecId || '',
      frontendFramework: 'react',
      backendFramework: 'express',
      database: 'postgresql',
      repositoryOwner: '',
      repositoryName: '',
      repositoryBranch: 'main',
    }
  });

  // --- Watch form values ---
  const specId = watch('specId');
  const useGitHub = watch('repositoryOwner') && watch('repositoryName');

  // --- Set specId from URL if provided ---
  useEffect(() => {
    if (urlSpecId) {
      setValue('specId', urlSpecId);
    }
  }, [urlSpecId, setValue]);

  // --- Queries & Mutations ---

  // Fetch user specifications
  const { data: specificationsData, isLoading: isLoadingSpecs } = useQuery(
    ['specifications'],
    () => specificationService.getUserSpecifications(),
    {
      onError: (error: any) => {
        toast.error(`Failed to load specifications: ${error.message}`);
      }
    }
  );

  // Fetch selected specification details
  const { data: specificationData, isLoading: isLoadingSpecDetails } = useQuery(
    ['specification', specId],
    () => specificationService.getSpecification(specId),
    {
      enabled: !!specId,
      onError: (error: any) => {
        toast.error(`Failed to load specification details: ${error.message}`);
      }
    }
  );

  // Generate code mutation
  const generateCodeMutation = useMutation(
    (data: CodeGenFormData) => specificationService.generateCode({
      specId: data.specId,
      frameworks: {
        frontend: data.frontendFramework,
        backend: data.backendFramework,
        database: data.database,
      },
      repositoryInfo: useGitHub ? {
        owner: data.repositoryOwner!,
        name: data.repositoryName!,
        branch: data.repositoryBranch,
      } : undefined,
    }),
    {
      onSuccess: (response) => {
        const sessionId = response.data.session_id;
        setCodeGenerationSessionId(sessionId);
        setIsPolling(true);
        setActiveTab('results');
        toast.success('Code generation started!');
      },
      onError: (error: any) => {
        toast.error(`Failed to start code generation: ${error.message}`);
      }
    }
  );

  // Poll for code generation status
  const { data: codeGenStatusData, isLoading: isLoadingStatus, error: codeGenStatusError } = useQuery(
    ['codeGenStatus', codeGenerationSessionId],
    () => specificationService.checkCodeGenerationStatus(codeGenerationSessionId!),
    {
      enabled: !!codeGenerationSessionId && isPolling,
      refetchInterval: isPolling ? 3000 : false, // Poll every 3 seconds while in progress
      onSuccess: (response) => {
        if (response.data.status === 'completed') {
          setIsPolling(false);
          toast.success('Code generation completed!');
          
          // Process generated files into a tree structure
          if (response.data.files) {
            const fileTree = buildFileTree(response.data.files);
            setGeneratedFiles(fileTree);
          }
        } else if (response.data.status === 'failed') {
          setIsPolling(false);
          toast.error(`Code generation failed: ${response.data.error_message || 'Unknown error'}`);
        }
      },
      onError: (error: any) => {
        setIsPolling(false);
        toast.error(`Failed to check code generation status: ${error.message}`);
      }
    }
  );

  // --- Helper Functions ---

  // Build file tree from flat list of files
  const buildFileTree = (files: GeneratedFile[]): FileNode[] => {
    const root: Record<string, FileNode> = {};

    // Sort files to ensure directories are processed first
    const sortedFiles = [...files].sort((a, b) => {
      const aDepth = a.file_path.split('/').length;
      const bDepth = b.file_path.split('/').length;
      return aDepth - bDepth;
    });

    sortedFiles.forEach(file => {
      const pathParts = file.file_path.split('/');
      let currentLevel = root;

      // Process each part of the path
      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1;
        const currentPath = pathParts.slice(0, index + 1).join('/');

        if (isLastPart) {
          // This is a file
          currentLevel[part] = {
            name: part,
            path: currentPath,
            type: 'file',
            content: file.content,
            analysis: file.staticAnalysis,
          };
        } else {
          // This is a directory
          if (!currentLevel[part]) {
            currentLevel[part] = {
              name: part,
              path: currentPath,
              type: 'directory',
              children: {},
            };
          }
          currentLevel = currentLevel[part].children as Record<string, FileNode>;
        }
      });
    });

    // Convert the nested object structure to an array structure
    const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
      return Object.values(obj).map(node => {
        if (node.type === 'directory' && node.children) {
          const childrenArray = convertToArray(node.children as Record<string, FileNode>);
          return { ...node, children: childrenArray };
        }
        return node;
      }).sort((a, b) => {
        // Sort directories first, then files
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });
    };

    return convertToArray(root);
  };

  // Determine language for syntax highlighting based on file extension
  const getLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      go: 'go',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      md: 'markdown',
      sql: 'sql',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sh: 'bash',
      bash: 'bash',
      dockerfile: 'dockerfile',
    };

    return languageMap[extension] || 'text';
  };

  // Handle form submission
  const onSubmit = (data: CodeGenFormData) => {
    generateCodeMutation.mutate(data);
  };

  // Handle file selection in the file tree
  const handleFileSelect = (file: FileNode) => {
    setSelectedFileNode(file);
  };

  // --- Framework Options ---
  const frontendFrameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'nextjs', label: 'Next.js' },
  ];

  const backendFrameworks = [
    { value: 'express', label: 'Express.js' },
    { value: 'nestjs', label: 'NestJS' },
    { value: 'fastapi', label: 'FastAPI' },
    { value: 'django', label: 'Django' },
    { value: 'flask', label: 'Flask' },
    { value: 'spring', label: 'Spring Boot' },
  ];

  const databases = [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'redis', label: 'Redis' },
  ];

  // --- Status and Progress Indicators ---
  const getStatusIndicator = () => {
    if (!codeGenerationSessionId) return null;
    
    const status = codeGenStatusData?.data.status || 'pending';
    
    let statusText = '';
    let statusIcon = <Spinner size="sm" />;
    let statusClass = 'text-primary-600 dark:text-primary-400';
    
    switch (status) {
      case 'pending':
        statusText = 'Preparing code generation...';
        break;
      case 'in_progress':
        statusText = 'Generating code...';
        break;
      case 'completed':
        statusText = 'Code generation completed!';
        statusIcon = <CheckCircleIcon className="w-5 h-5" />;
        statusClass = 'text-success-600 dark:text-success-400';
        break;
      case 'failed':
        statusText = `Code generation failed: ${codeGenStatusData?.data.error_message || 'Unknown error'}`;
        statusIcon = <ExclamationCircleIcon className="w-5 h-5" />;
        statusClass = 'text-error-600 dark:text-error-400';
        break;
    }
    
    return (
      <div className={`flex items-center ${statusClass} text-sm font-medium`}>
        <span className="mr-2">{statusIcon}</span>
        {statusText}
      </div>
    );
  };

  // --- Determine if form is submittable ---
  const isSubmitting = generateCodeMutation.isLoading || isPolling;
  const canSubmit = isValid && !isSubmitting;

  // --- Tab Configuration ---
  const tabItems = [
    {
      id: 'generate',
      label: 'Generate Code',
      icon: <CodeBracketIcon className="w-5 h-5" />,
    },
    {
      id: 'results',
      label: 'Results',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      disabled: !codeGenerationSessionId,
    },
  ];

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Code Generation</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Generate code from your project specifications
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabItems as any}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'generate' | 'results')}
          variant="pills"
        />
      </div>

      {/* Generate Code Tab */}
      {activeTab === 'generate' && (
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
              <CodeBracketIcon className="w-6 h-6 mr-2 text-primary-500" />
              Generate Code from Specification
            </h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Specification Selection */}
              <div>
                <label htmlFor="specId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Project Specification <span className="text-error-500">*</span>
                </label>
                <select
                  id="specId"
                  className={`w-full rounded-md border ${
                    errors.specId ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                  } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                  {...register('specId')}
                  disabled={isLoadingSpecs || isSubmitting}
                >
                  <option value="">Select a specification</option>
                  {specificationsData?.data.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.project_name} (v{spec.version})
                    </option>
                  ))}
                </select>
                {errors.specId && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                    {errors.specId.message}
                  </p>
                )}
              </div>

              {/* Framework Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Frontend Framework */}
                <div>
                  <label htmlFor="frontendFramework" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Frontend Framework
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CubeTransparentIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <select
                      id="frontendFramework"
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 sm:text-sm"
                      {...register('frontendFramework')}
                      disabled={isSubmitting}
                    >
                      {frontendFrameworks.map((framework) => (
                        <option key={framework.value} value={framework.value}>
                          {framework.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Backend Framework */}
                <div>
                  <label htmlFor="backendFramework" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Backend Framework
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ServerStackIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <select
                      id="backendFramework"
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 sm:text-sm"
                      {...register('backendFramework')}
                      disabled={isSubmitting}
                    >
                      {backendFrameworks.map((framework) => (
                        <option key={framework.value} value={framework.value}>
                          {framework.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Database */}
                <div>
                  <label htmlFor="database" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Database
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CircleStackIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <select
                      id="database"
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 sm:text-sm"
                      {...register('database')}
                      disabled={isSubmitting}
                    >
                      {databases.map((db) => (
                        <option key={db.value} value={db.value}>
                          {db.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GitHub Repository (Optional) */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    GitHub Repository (Optional)
                  </h3>
                  <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    Optional
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  If provided, the generated code will be committed to this repository.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Repository Owner */}
                  <div>
                    <label htmlFor="repositoryOwner" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Repository Owner
                    </label>
                    <input
                      id="repositoryOwner"
                      type="text"
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
                      placeholder="github-username"
                      {...register('repositoryOwner')}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Repository Name */}
                  <div>
                    <label htmlFor="repositoryName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Repository Name
                    </label>
                    <input
                      id="repositoryName"
                      type="text"
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
                      placeholder="my-project"
                      {...register('repositoryName')}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Repository Branch */}
                  <div>
                    <label htmlFor="repositoryBranch" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Branch
                    </label>
                    <input
                      id="repositoryBranch"
                      type="text"
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
                      placeholder="main"
                      {...register('repositoryBranch')}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={<PlayIcon className="w-5 h-5" />}
                  isLoading={isSubmitting}
                  loadingText="Generating..."
                  disabled={!canSubmit}
                >
                  Generate Code
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div>
          {/* Status Indicator */}
          <Card className="mb-6">
            <Card.Body>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CpuChipIcon className="w-6 h-6 mr-3 text-primary-500" />
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      Code Generation Status
                    </h3>
                    {getStatusIndicator()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                  onClick={() => queryClient.invalidateQueries(['codeGenStatus', codeGenerationSessionId])}
                  disabled={isLoadingStatus || !codeGenerationSessionId}
                >
                  Refresh
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Results Content */}
          {isLoadingStatus && !codeGenStatusData ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading code generation status...</span>
            </div>
          ) : codeGenStatusError ? (
            <Card>
              <Card.Body>
                <EmptyState
                  icon={<ExclamationCircleIcon className="w-12 h-12 text-error-500" />}
                  title="Error Loading Results"
                  description={`Failed to load code generation results: ${(codeGenStatusError as Error).message}`}
                  action={
                    <Button
                      variant="primary"
                      onClick={() => queryClient.invalidateQueries(['codeGenStatus', codeGenerationSessionId])}
                    >
                      Try Again
                    </Button>
                  }
                />
              </Card.Body>
            </Card>
          ) : codeGenStatusData?.data.status === 'completed' && generatedFiles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* File Tree */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <Card.Header>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                      <FolderOpenIcon className="w-5 h-5 mr-2 text-primary-500" />
                      Generated Files
                    </h3>
                  </Card.Header>
                  <Card.Body className="p-0 h-[calc(100vh-300px)] overflow-auto">
                    <FileTree 
                      files={generatedFiles} 
                      onFileSelect={handleFileSelect}
                      selectedFilePath={selectedFileNode?.path || null}
                    />
                  </Card.Body>
                </Card>
              </div>

              {/* Code Preview */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                        <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2 text-primary-500" />
                        {selectedFileNode ? selectedFileNode.path : 'Code Preview'}
                      </h3>
                      {selectedFileNode?.analysis && (
                        <div className="flex items-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">
                            Quality Score:
                          </span>
                          <span 
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              selectedFileNode.analysis.quality_score >= 80 
                                ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                                : selectedFileNode.analysis.quality_score >= 60
                                ? "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                                : "bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400"
                            )}
                          >
                            {selectedFileNode.analysis.quality_score}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0 h-[calc(100vh-300px)] overflow-auto">
                    {selectedFileNode ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          language={getLanguage(selectedFileNode.name)}
                          style={theme === 'dark' ? atomOneDark : atomOneLight}
                          customStyle={{ margin: 0, borderRadius: 0, height: '100%' }}
                          showLineNumbers={true}
                        >
                          {selectedFileNode.content || '// No content'}
                        </SyntaxHighlighter>

                        {/* Issues Panel (if any) */}
                        {selectedFileNode.analysis?.issues?.length > 0 && (
                          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800">
                            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                              Issues ({selectedFileNode.analysis.issues.length})
                            </h4>
                            <ul className="space-y-2">
                              {selectedFileNode.analysis.issues.map((issue: any, index: number) => (
                                <li key={index} className="text-sm p-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-750">
                                  <div className="flex items-center">
                                    <div 
                                      className={cn(
                                        "w-2 h-2 rounded-full mr-2",
                                        issue.severity === 'high' ? "bg-error-500" : 
                                        issue.severity === 'medium' ? "bg-warning-500" : "bg-info-500"
                                      )}
                                    ></div>
                                    <span className="font-medium">{issue.type}</span>
                                    <span className="ml-2 text-neutral-500 dark:text-neutral-400">Line {issue.line}</span>
                                  </div>
                                  <p className="mt-1 text-neutral-700 dark:text-neutral-300">{issue.message}</p>
                                  {issue.suggestion && (
                                    <p className="mt-1 text-success-600 dark:text-success-400 text-xs">
                                      Suggestion: {issue.suggestion}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<DocumentMagnifyingGlassIcon className="w-10 h-10" />}
                        title="No File Selected"
                        description="Select a file from the tree to view its content"
                      />
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          ) : codeGenStatusData?.data.status === 'failed' ? (
            <Card>
              <Card.Body>
                <EmptyState
                  icon={<ExclamationCircleIcon className="w-12 h-12 text-error-500" />}
                  title="Code Generation Failed"
                  description={codeGenStatusData.data.error_message || 'An unknown error occurred during code generation.'}
                  action={
                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('generate')}
                    >
                      Try Again
                    </Button>
                  }
                />
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <div className="flex flex-col items-center justify-center py-12">
                  {codeGenStatusData?.data.status === 'pending' || codeGenStatusData?.data.status === 'in_progress' ? (
                    <>
                      <Spinner size="lg" className="mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        Generating Code
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
                        Please wait while we generate code based on your specification. This may take a few minutes depending on the complexity.
                      </p>
                    </>
                  ) : (
                    <EmptyState
                      icon={<CodeBracketIcon className="w-12 h-12" />}
                      title="No Generated Code Yet"
                      description="Start the code generation process to see results here."
                      action={
                        <Button
                          variant="primary"
                          onClick={() => setActiveTab('generate')}
                        >
                          Generate Code
                        </Button>
                      }
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeGenerationPage;
