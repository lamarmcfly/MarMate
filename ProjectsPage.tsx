import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import Pagination from '@/components/ui/Pagination';
import { formatDate, formatRelativeTime } from '@/utils/date';
import projectService, { Project, ProjectStatus, ProjectFilterOptions } from '@/api/project';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

// Status badge mapping
const statusBadgeMap: Record<ProjectStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  [ProjectStatus.DRAFT]: { label: 'Draft', variant: 'default' },
  [ProjectStatus.ACTIVE]: { label: 'Active', variant: 'info' },
  [ProjectStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [ProjectStatus.ARCHIVED]: { label: 'Archived', variant: 'warning' },
};

// Sort options
const sortOptions = [
  { value: 'updated_at-desc', label: 'Last Updated' },
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'created_at-asc', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
];

// Filter options
const filterOptions = [
  { value: 'all', label: 'All Projects' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.DRAFT, label: 'Drafts' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
];

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('updated_at-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [itemsPerPage] = useState<number>(10);

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Prepare filter options for API
  const getFilterOptions = (): ProjectFilterOptions => {
    const [sortBy, sortDirection] = selectedSort.split('-');
    
    const options: ProjectFilterOptions = {
      sort_by: sortBy as 'name' | 'created_at' | 'updated_at' | 'status',
      sort_direction: sortDirection as 'asc' | 'desc',
      page: currentPage,
      limit: itemsPerPage,
    };

    if (debouncedSearchQuery) {
      options.search = debouncedSearchQuery;
    }

    if (selectedFilter !== 'all') {
      options.status = selectedFilter as ProjectStatus;
    }

    return options;
  };

  // Fetch projects
  const {
    data: projectsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['projects', selectedFilter, selectedSort, debouncedSearchQuery, currentPage, itemsPerPage],
    () => projectService.getProjects(getFilterOptions()),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
      onError: (err: any) => {
        toast.error(`Failed to load projects: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Create project mutation
  const createProjectMutation = useMutation(
    (data: { name: string; description?: string }) => projectService.createProject(data),
    {
      onSuccess: () => {
        toast.success('Project created successfully');
        queryClient.invalidateQueries(['projects']);
        setIsCreateModalOpen(false);
        setProjectToEdit(null);
      },
      onError: (err: any) => {
        toast.error(`Failed to create project: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Update project mutation
  const updateProjectMutation = useMutation(
    ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      projectService.updateProject(id, data),
    {
      onSuccess: () => {
        toast.success('Project updated successfully');
        queryClient.invalidateQueries(['projects']);
        setIsCreateModalOpen(false);
        setProjectToEdit(null);
      },
      onError: (err: any) => {
        toast.error(`Failed to update project: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Delete project mutation
  const deleteProjectMutation = useMutation(
    (id: string) => projectService.deleteProject(id),
    {
      onSuccess: () => {
        toast.success('Project deleted successfully');
        queryClient.invalidateQueries(['projects']);
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
      },
      onError: (err: any) => {
        toast.error(`Failed to delete project: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Archive project mutation
  const archiveProjectMutation = useMutation(
    (id: string) => projectService.archiveProject(id),
    {
      onSuccess: () => {
        toast.success('Project archived successfully');
        queryClient.invalidateQueries(['projects']);
      },
      onError: (err: any) => {
        toast.error(`Failed to archive project: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Clone project mutation
  const cloneProjectMutation = useMutation(
    ({ id, name }: { id: string; name: string }) => projectService.cloneProject(id, name),
    {
      onSuccess: (data) => {
        toast.success('Project cloned successfully');
        queryClient.invalidateQueries(['projects']);
        // Navigate to the new project
        navigate(`/projects/${data.data.id}`);
      },
      onError: (err: any) => {
        toast.error(`Failed to clone project: ${err.message || 'Unknown error'}`);
      },
    }
  );

  // Handle project create/edit
  const handleCreateOrUpdateProject = (data: { name: string; description?: string }) => {
    if (projectToEdit) {
      updateProjectMutation.mutate({ id: projectToEdit.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  // Handle project delete
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  // Handle project archive
  const handleArchiveProject = (project: Project) => {
    archiveProjectMutation.mutate(project.id);
  };

  // Handle project clone
  const handleCloneProject = (project: Project) => {
    const newName = `${project.name} (Copy)`;
    cloneProjectMutation.mutate({ id: project.id, name: newName });
  };

  // Handle project click
  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  // Handle edit project
  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project
    setProjectToEdit(project);
    setIsCreateModalOpen(true);
  };

  // Handle delete project click
  const handleDeleteProjectClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  // Render project card
  const renderProjectCard = (project: Project) => {
    const statusBadge = statusBadgeMap[project.status];

    return (
      <Card
        key={project.id}
        variant="interactive"
        className="transition-all duration-200 hover:shadow-md"
        onClick={() => handleProjectClick(project)}
      >
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <FolderIcon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white truncate max-w-xs">
                {project.name}
              </h3>
              {project.description && (
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Updated {formatRelativeTime(project.updated_at)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Dropdown
              trigger={
                <button
                  className="p-2 rounded-full text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
              }
              items={[
                {
                  label: 'Edit',
                  icon: <PencilIcon className="w-4 h-4" />,
                  onClick: (e) => handleEditProject(project, e),
                },
                {
                  label: 'Clone',
                  icon: <DocumentDuplicateIcon className="w-4 h-4" />,
                  onClick: (e) => {
                    e.stopPropagation();
                    handleCloneProject(project);
                  },
                },
                {
                  label: 'Archive',
                  icon: <ArchiveBoxIcon className="w-4 h-4" />,
                  onClick: (e) => {
                    e.stopPropagation();
                    handleArchiveProject(project);
                  },
                  disabled: project.status === ProjectStatus.ARCHIVED,
                },
                {
                  label: 'Delete',
                  icon: <TrashIcon className="w-4 h-4" />,
                  onClick: (e) => handleDeleteProjectClick(project, e),
                  variant: 'danger',
                },
              ]}
              align="right"
            />
          </div>
        </div>
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Created {formatDate(project.created_at, 'MMM d, yyyy')}</span>
              </div>
              {project.stats && (
                <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span>{project.stats.completion_percentage}% Complete</span>
                </div>
              )}
            </div>
            <div>
              {project.spec_id && (
                <Badge variant="default">Has Specification</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Projects</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your AI-assisted software projects
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="w-5 h-5" />}
          onClick={() => {
            setProjectToEdit(null);
            setIsCreateModalOpen(true);
          }}
        >
          New Project
        </Button>
      </div>

      {/* Filters and search */}
      <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-white sm:text-sm"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative inline-block text-left">
              <Dropdown
                trigger={
                  <Button
                    variant="outline"
                    size="md"
                    icon={<FunnelIcon className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    {filterOptions.find((option) => option.value === selectedFilter)?.label || 'Filter'}
                  </Button>
                }
                items={filterOptions.map((option) => ({
                  label: option.label,
                  onClick: () => setSelectedFilter(option.value),
                  active: selectedFilter === option.value,
                }))}
              />
            </div>

            <div className="relative inline-block text-left">
              <Dropdown
                trigger={
                  <Button
                    variant="outline"
                    size="md"
                    icon={<ArrowsUpDownIcon className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    {sortOptions.find((option) => option.value === selectedSort)?.label || 'Sort'}
                  </Button>
                }
                items={sortOptions.map((option) => ({
                  label: option.label,
                  onClick: () => setSelectedSort(option.value),
                  active: selectedSort === option.value,
                }))}
              />
            </div>

            <Button
              variant="outline"
              size="md"
              icon={<ArrowPathIcon className="w-5 h-5" />}
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading projects...</span>
          </div>
        ) : isError ? (
          <div className="bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-400 p-4 rounded-md">
            <h3 className="text-lg font-medium">Error loading projects</h3>
            <p className="mt-1">{(error as Error)?.message || 'An unknown error occurred'}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : projectsData?.data.projects.length === 0 ? (
          <EmptyState
            icon={<FolderIcon className="w-12 h-12" />}
            title="No projects found"
            description={
              debouncedSearchQuery
                ? `No projects match "${debouncedSearchQuery}". Try a different search term.`
                : selectedFilter !== 'all'
                ? `No ${selectedFilter.toLowerCase()} projects found. Try a different filter.`
                : "You don't have any projects yet. Create your first project to get started."
            }
            action={
              <Button
                variant="primary"
                icon={<PlusIcon className="w-5 h-5" />}
                onClick={() => {
                  setProjectToEdit(null);
                  setIsCreateModalOpen(true);
                }}
              >
                Create Project
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {projectsData?.data.projects.map((project) => renderProjectCard(project))}
            </div>

            {/* Pagination */}
            {projectsData?.data.total_pages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={projectsData.data.total_pages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setProjectToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateProject}
        project={projectToEdit}
        isLoading={createProjectMutation.isLoading || updateProjectMutation.isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteProjectMutation.isLoading}
      />
    </div>
  );
};

export default ProjectsPage;
