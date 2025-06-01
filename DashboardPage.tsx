import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  BoltIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatRelativeTime } from '@/utils/date';
import projectService, { Project, ProjectStatus } from '@/api/project';
import conversationService from '@/api/conversation';
import { useAuth } from '@/contexts/AuthContext';
import ProjectProgressChart from '@/components/dashboard/ProjectProgressChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import StatsCard from '@/components/dashboard/StatsCard';

// Status badge mapping
const statusBadgeMap: Record<ProjectStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  [ProjectStatus.DRAFT]: { label: 'Draft', variant: 'default' },
  [ProjectStatus.ACTIVE]: { label: 'Active', variant: 'info' },
  [ProjectStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [ProjectStatus.ARCHIVED]: { label: 'Archived', variant: 'warning' },
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recent projects
  const { 
    data: recentProjectsData, 
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useQuery(
    ['projects', { limit: 4, sort_by: 'updated_at', sort_direction: 'desc' }],
    () => projectService.getProjects({ 
      limit: 4, 
      sort_by: 'updated_at', 
      sort_direction: 'desc',
      status: [ProjectStatus.ACTIVE, ProjectStatus.DRAFT]
    }),
    {
      keepPreviousData: true,
      staleTime: 60000, // 1 minute
    }
  );

  // Fetch recent conversations
  const { 
    data: recentConversationsData, 
    isLoading: isLoadingConversations 
  } = useQuery(
    ['conversations', { limit: 5 }],
    () => conversationService.getRecentConversations(5),
    {
      keepPreviousData: true,
      staleTime: 60000, // 1 minute
    }
  );

  // Fetch user stats
  const { 
    data: userStatsData, 
    isLoading: isLoadingStats 
  } = useQuery(
    ['user-stats'],
    () => projectService.getUserStats(),
    {
      keepPreviousData: true,
      staleTime: 300000, // 5 minutes
    }
  );

  // Fetch activity feed
  const { 
    data: activityData, 
    isLoading: isLoadingActivity 
  } = useQuery(
    ['activity-feed', { limit: 10 }],
    () => projectService.getUserActivity(10),
    {
      keepPreviousData: true,
      staleTime: 60000, // 1 minute
    }
  );

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchProjects();
    setIsRefreshing(false);
  };

  // Navigate to create new project
  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  // Navigate to create new conversation
  const handleCreateConversation = () => {
    navigate('/conversation');
  };

  // Navigate to project
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // Navigate to conversation
  const handleConversationClick = (conversationId: string) => {
    navigate(`/conversation/${conversationId}`);
  };

  // Render project card
  const renderProjectCard = (project: Project) => {
    const statusBadge = statusBadgeMap[project.status];

    return (
      <Card
        key={project.id}
        variant="interactive"
        className="h-full transition-all duration-200 hover:shadow-md"
        onClick={() => handleProjectClick(project.id)}
      >
        <div className="p-4">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatRelativeTime(project.updated_at)}
            </span>
          </div>
        </div>
        {project.stats && (
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                <span>{project.stats.completion_percentage}% Complete</span>
              </div>
              <div>
                {project.stats.specifications_count > 0 && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {project.stats.specifications_count} spec{project.stats.specifications_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Loading state
  const isLoading = isLoadingProjects || isLoadingConversations || isLoadingStats || isLoadingActivity;

  // Stats data
  const stats = [
    {
      name: 'Total Projects',
      value: userStatsData?.data?.projects_count || 0,
      change: userStatsData?.data?.projects_change || 0,
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'primary',
    },
    {
      name: 'Active Conversations',
      value: userStatsData?.data?.active_conversations_count || 0,
      change: userStatsData?.data?.conversations_change || 0,
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: 'info',
    },
    {
      name: 'Completed Specs',
      value: userStatsData?.data?.completed_specifications_count || 0,
      change: userStatsData?.data?.specifications_change || 0,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      color: 'success',
    },
    {
      name: 'Generated Files',
      value: userStatsData?.data?.generated_files_count || 0,
      change: userStatsData?.data?.files_change || 0,
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'warning',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Welcome section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Here's an overview of your AI-assisted software projects
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.name}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color as any}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={<PlusIcon className="w-5 h-5" />}
            onClick={handleCreateProject}
          >
            New Project
          </Button>
          <Button
            variant="outline"
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            onClick={handleCreateConversation}
          >
            Start Conversation
          </Button>
          <Button
            variant="outline"
            icon={<ArrowPathIcon className="w-5 h-5" />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            loadingText="Refreshing..."
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Recent projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent projects */}
          <Card>
            <Card.Header className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Recent Projects
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/projects')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {isLoadingProjects ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : recentProjectsData?.data.projects.length === 0 ? (
                <EmptyState
                  icon={<DocumentTextIcon className="w-10 h-10" />}
                  title="No projects yet"
                  description="Create your first project to get started"
                  action={
                    <Button
                      variant="primary"
                      icon={<PlusIcon className="w-5 h-5" />}
                      onClick={handleCreateProject}
                    >
                      Create Project
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentProjectsData?.data.projects.map((project) => renderProjectCard(project))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Project progress chart */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Project Progress
              </h2>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="h-80">
                  <ProjectProgressChart 
                    data={userStatsData?.data?.project_progress || []}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Right column: Activity feed and recent conversations */}
        <div className="space-y-6">
          {/* Activity feed */}
          <Card className="h-auto lg:h-[calc(100%-16rem)]">
            <Card.Header>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Recent Activity
              </h2>
            </Card.Header>
            <Card.Body className="p-0">
              {isLoadingActivity ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <ActivityFeed 
                  activities={activityData?.data?.activities || []}
                  emptyStateProps={{
                    icon: <ClockIcon className="w-10 h-10" />,
                    title: "No recent activity",
                    description: "Your recent actions will appear here"
                  }}
                />
              )}
            </Card.Body>
          </Card>

          {/* Recent conversations */}
          <Card>
            <Card.Header className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Recent Conversations
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/conversation')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {isLoadingConversations ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : recentConversationsData?.data.conversations.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<ChatBubbleLeftRightIcon className="w-10 h-10" />}
                    title="No conversations yet"
                    description="Start a conversation to generate specifications"
                    action={
                      <Button
                        variant="primary"
                        icon={<PlusIcon className="w-5 h-5" />}
                        onClick={handleCreateConversation}
                      >
                        Start Conversation
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {recentConversationsData?.data.conversations.map((conversation) => (
                    <li 
                      key={conversation.id}
                      className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer transition-colors"
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {conversation.project_name}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                            {conversation.last_message || 'No messages yet'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatRelativeTime(conversation.updated_at)}
                          </span>
                          {conversation.spec_ready && (
                            <Badge 
                              variant="success" 
                              size="sm" 
                              className="mt-1"
                              icon={<CheckCircleIcon className="w-3 h-3" />}
                            >
                              Spec Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Tips and resources */}
      <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-800">
              <BoltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium text-primary-800 dark:text-primary-300">
              Pro Tip
            </h3>
            <p className="mt-1 text-sm text-primary-700 dark:text-primary-400">
              Start with a detailed project description to get the most accurate specifications. 
              The AI assistant works best when you provide clear requirements and constraints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
