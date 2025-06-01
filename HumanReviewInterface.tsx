import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  EyeIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

// --- Types ---
export interface StaticAnalysisIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  line: number | string; // Can be a range like "10-15"
  description: string;
  suggestion?: string;
}

export interface HumanReviewTask {
  id: string;
  projectId: string;
  codeGenerationSessionId: string;
  filePath: string;
  reasonForReview: string;
  codeContentForReview: string;
  staticAnalysisResults?: {
    quality_score: number;
    issues: StaticAnalysisIssue[];
    summary?: string;
  };
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ReviewSubmitData {
  taskId: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  comments: string;
  updatedCode: string;
}

interface HumanReviewInterfaceProps {
  reviewTask: HumanReviewTask | null;
  isLoadingTask?: boolean; // True if the reviewTask data is being fetched
  isLoadingSubmission?: boolean; // True if the review is currently being submitted
  onSubmitReview: (data: ReviewSubmitData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

// --- Form Schema ---
const reviewFormSchema = z.object({
  reviewDecision: z.enum(['approved', 'rejected', 'changes_requested'], {
    required_error: 'Please select a review decision.',
  }),
  reviewComments: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

// --- Helper Functions ---
const getLanguage = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
    py: 'python', java: 'java', cs: 'csharp', go: 'go', rb: 'ruby',
    php: 'php', html: 'xml', css: 'css', scss: 'scss', json: 'json',
    md: 'markdown', sql: 'sql', yaml: 'yaml', yml: 'yaml', sh: 'bash',
    dockerfile: 'dockerfile', xml: 'xml',
  };
  return languageMap[extension] || 'plaintext';
};

const severityColorMap: Record<StaticAnalysisIssue['severity'], string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-500',
  high: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400 border-error-500',
  medium: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border-warning-500',
  low: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400 border-info-500',
  info: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 border-neutral-500',
};

const qualityScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
  if (score >= 60) return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
  return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400';
};

// --- Component ---
const HumanReviewInterface: React.FC<HumanReviewInterfaceProps> = ({
  reviewTask,
  isLoadingTask = false,
  isLoadingSubmission = false,
  onSubmitReview,
  onCancel,
  className,
}) => {
  const { theme } = useTheme();
  const [codeContent, setCodeContent] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid: isReviewFormValid },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      reviewComments: '',
    },
  });

  useEffect(() => {
    if (reviewTask) {
      setCodeContent(reviewTask.codeContentForReview);
      setEditMode(false); // Reset edit mode when task changes
      reset({ reviewComments: '', reviewDecision: undefined }); // Reset form
    }
  }, [reviewTask, reset]);

  const handleFormSubmit = async (data: ReviewFormData) => {
    if (!reviewTask) return;
    await onSubmitReview({
      taskId: reviewTask.id,
      decision: data.reviewDecision,
      comments: data.reviewComments || '',
      updatedCode: codeContent,
    });
  };

  if (isLoadingTask) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading review task...</span>
      </div>
    );
  }

  if (!reviewTask) {
    return (
      <Card className={cn("p-6", className)}>
        <EmptyState
          icon={<DocumentTextIcon className="w-12 h-12" />}
          title="No Review Task Loaded"
          description="Please select a task to review."
        />
      </Card>
    );
  }

  const syntaxHighlighterStyle = theme === 'dark' ? atomOneDark : atomOneLight;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
            <CodeBracketIcon className="w-6 h-6 mr-2 text-primary-500" />
            Code Review: <span className="ml-1 font-mono text-primary-600 dark:text-primary-400">{reviewTask.filePath}</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Task ID: {reviewTask.id} | Created: {new Date(reviewTask.createdAt).toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode(!editMode)}
          icon={editMode ? <EyeIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
          disabled={isLoadingSubmission}
        >
          {editMode ? 'View Code' : 'Edit Code'}
        </Button>
      </Card.Header>

      <Card.Body className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Code Editor / Viewer */}
          <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-700">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-warning-500" />
                Reason for Review:
              </h3>
              <p className="mt-1 text-sm text-warning-700 dark:text-warning-400 italic">
                {reviewTask.reasonForReview}
              </p>
            </div>
            <div className="h-[400px] md:h-[500px] lg:h-[600px] overflow-auto">
              {editMode ? (
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-0 focus:ring-0 resize-none"
                  placeholder="Enter code here..."
                  disabled={isLoadingSubmission}
                />
              ) : (
                <SyntaxHighlighter
                  language={getLanguage(reviewTask.filePath)}
                  style={syntaxHighlighterStyle}
                  customStyle={{ margin: 0, height: '100%', padding: '1rem', overflow: 'auto' }}
                  showLineNumbers
                  wrapLongLines
                >
                  {codeContent}
                </SyntaxHighlighter>
              )}
            </div>
          </div>

          {/* Static Analysis & Review Form */}
          <div className="lg:col-span-1">
            {/* Static Analysis Results */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center mb-3">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                Static Analysis
              </h3>
              {reviewTask.staticAnalysisResults ? (
                <>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Quality Score: </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-sm font-semibold",
                      qualityScoreColor(reviewTask.staticAnalysisResults.quality_score)
                    )}>
                      {reviewTask.staticAnalysisResults.quality_score}/100
                    </span>
                  </div>
                  {reviewTask.staticAnalysisResults.summary && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 italic">
                      {reviewTask.staticAnalysisResults.summary}
                    </p>
                  )}
                  {reviewTask.staticAnalysisResults.issues.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {reviewTask.staticAnalysisResults.issues.map((issue, index) => (
                        <div key={index} className={cn("p-2 border-l-4 text-xs rounded", severityColorMap[issue.severity])}>
                          <p className="font-semibold">
                            {issue.severity.toUpperCase()} (Line {issue.line}): <span className="font-normal">{issue.description}</span>
                          </p>
                          {issue.suggestion && (
                            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                              <em>Suggestion:</em> {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">No issues found by static analysis.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">No static analysis results available.</p>
              )}
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Review Decision <span className="text-error-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'approved', label: 'Approve', icon: <CheckCircleIcon className="w-5 h-5 text-success-500 mr-2" /> },
                    { value: 'changes_requested', label: 'Request Changes', icon: <ExclamationTriangleIcon className="w-5 h-5 text-warning-500 mr-2" /> },
                    { value: 'rejected', label: 'Reject', icon: <XCircleIcon className="w-5 h-5 text-error-500 mr-2" /> },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center p-2 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('reviewDecision')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800"
                        disabled={isLoadingSubmission}
                      />
                      {option.icon}
                      <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.reviewDecision && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                    {errors.reviewDecision.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reviewComments" className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Comments (optional)
                </label>
                <textarea
                  id="reviewComments"
                  {...register('reviewComments')}
                  rows={4}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75 resize-y"
                  placeholder="Provide feedback or reasons for your decision..."
                  disabled={isLoadingSubmission}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoadingSubmission}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoadingSubmission}
                  loadingText="Submitting..."
                  disabled={isLoadingSubmission || !isReviewFormValid}
                >
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default HumanReviewInterface;
