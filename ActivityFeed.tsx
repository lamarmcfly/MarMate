import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  CodeBracketIcon, 
  BugAntIcon, 
  FolderIcon, 
  ArrowPathIcon,
  UserIcon,
  Cog6ToothIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import EmptyState, { EmptyStateProps } from '@/components/ui/EmptyState';

// Define the structure of an activity item
export interface Activity {
  id: string;
  user_id: string;
  interaction_type: string; // e.g., 'project_created', 'spec_generated', 'code_committed', 'debug_session_started', 'conversation_started'
  interaction_data: Record<string, any>; // JSONB data, e.g., { projectId: '...', projectName: '...' }
  created_at: string;
  session_id?: string; // For linking to conversations/debug sessions
}

interface ActivityFeedProps {
  activities: Activity[];
  emptyStateProps?: EmptyStateProps;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, emptyStateProps, className = '' }) => {
  if (!activities || activities.length === 0) {
    return emptyStateProps ? <EmptyState {...emptyStateProps} /> : null;
  }

  const getActivityDetails = (activity: Activity) => {
    let icon: React.ElementType = LinkIcon; // Default icon
    let title: string = 'Unknown Activity';
    let description: React.ReactNode = null;
    let link: string | null = null;

    switch (activity.interaction_type) {
      case 'project_created':
        icon = FolderIcon;
        title = `Project "${activity.interaction_data.projectName || 'Untitled Project'}" created`;
        description = activity.interaction_data.description;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}` : null;
        break;
      case 'conversation_started':
        icon = ChatBubbleLeftRightIcon;
        title = `Conversation started for "${activity.interaction_data.projectName || 'Untitled Project'}"`;
        description = `Initial prompt: "${activity.interaction_data.initialPrompt?.substring(0, 50)}..."`;
        link = activity.interaction_data.conversationId ? `/conversation/${activity.interaction_data.conversationId}` : null;
        break;
      case 'spec_generated':
        icon = DocumentTextIcon;
        title = `Specification generated for "${activity.interaction_data.projectName || 'Untitled Project'}"`;
        description = `Version ${activity.interaction_data.version || 1} of the project specification is ready.`;
        link = activity.interaction_data.specId ? `/specification/${activity.interaction_data.specId}` : null;
        break;
      case 'code_generated':
        icon = CodeBracketIcon;
        title = `Code generated for "${activity.interaction_data.projectName || 'Untitled Project'}"`;
        description = `${activity.interaction_data.filesGenerated || 0} files generated.`;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}/code` : null; // Assuming a code view
        break;
      case 'debug_session_started':
        icon = BugAntIcon;
        title = `Debug session started for "${activity.interaction_data.projectName || 'Untitled Project'}"`;
        description = `Issue: "${activity.interaction_data.issueDescription?.substring(0, 50)}..."`;
        link = activity.interaction_data.debugSessionId ? `/debug/${activity.interaction_data.debugSessionId}` : null; // Assuming a debug view
        break;
      case 'user_login':
        icon = UserIcon;
        title = `User logged in`;
        description = `User ${activity.interaction_data.email} logged in from ${activity.interaction_data.ipAddress || 'unknown IP'}.`;
        break;
      case 'settings_updated':
        icon = Cog6ToothIcon;
        title = `Settings updated`;
        description = `User updated their ${activity.interaction_data.settingCategory || 'account'} settings.`;
        link = '/settings';
        break;
      case 'project_updated':
        icon = FolderIcon;
        title = `Project "${activity.interaction_data.projectName || 'Untitled Project'}" updated`;
        description = `Status changed to ${activity.interaction_data.newStatus || 'updated'}.`;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}` : null;
        break;
      case 'task_completed':
        icon = CheckCircleIcon;
        title = `Task "${activity.interaction_data.taskName || 'Untitled Task'}" completed`;
        description = `In project "${activity.interaction_data.projectName || 'Unknown Project'}"`;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}/tasks` : null;
        break;
      case 'task_assigned':
        icon = UserIcon;
        title = `Task "${activity.interaction_data.taskName || 'Untitled Task'}" assigned`;
        description = `To ${activity.interaction_data.assigneeName || 'you'} in project "${activity.interaction_data.projectName || 'Unknown Project'}"`;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}/tasks` : null;
        break;
      case 'repository_connected':
        icon = CodeBracketIcon;
        title = `Repository connected to project`;
        description = `${activity.interaction_data.repositoryUrl || 'Repository'} connected to "${activity.interaction_data.projectName || 'Untitled Project'}"`;
        link = activity.interaction_data.projectId ? `/projects/${activity.interaction_data.projectId}` : null;
        break;
      default:
        // Generic activity handling
        if (activity.interaction_type.includes('project')) {
          icon = FolderIcon;
        } else if (activity.interaction_type.includes('conversation')) {
          icon = ChatBubbleLeftRightIcon;
        } else if (activity.interaction_type.includes('code')) {
          icon = CodeBracketIcon;
        } else if (activity.interaction_type.includes('spec')) {
          icon = DocumentTextIcon;
        }
        
        title = activity.interaction_type.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        description = Object.entries(activity.interaction_data || {})
          .filter(([key]) => !['id', 'userId'].includes(key))
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
    }

    return { icon, title, description, link };
  };

  return (
    <div className={cn("overflow-y-auto max-h-[500px]", className)}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700"></div>
        
        {/* Activities */}
        <ul className="relative">
          {activities.map((activity, index) => {
            const { icon: Icon, title, description, link } = getActivityDetails(activity);
            
            const ActivityContent = () => (
              <>
                <div className="flex items-center">
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center z-10">
                      <Icon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {title}
                    </p>
                    {description && (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              </>
            );
            
            return (
              <li 
                key={activity.id} 
                className={cn(
                  "relative py-4 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
                  index !== activities.length - 1 && "border-b border-neutral-200 dark:border-neutral-700"
                )}
              >
                {link ? (
                  <Link to={link} className="block">
                    <ActivityContent />
                  </Link>
                ) : (
                  <ActivityContent />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;
