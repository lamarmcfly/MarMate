import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  /**
   * Icon to display at the top of the empty state
   */
  icon?: ReactNode;
  
  /**
   * Main title text
   */
  title: string;
  
  /**
   * Optional description text
   */
  description?: string | ReactNode;
  
  /**
   * Optional action button or element
   */
  action?: ReactNode;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
  
  /**
   * Optional additional CSS classes for the container
   */
  containerClassName?: string;
  
  /**
   * Optional additional CSS classes for the icon
   */
  iconClassName?: string;
  
  /**
   * Optional additional CSS classes for the title
   */
  titleClassName?: string;
  
  /**
   * Optional additional CSS classes for the description
   */
  descriptionClassName?: string;
  
  /**
   * Optional additional CSS classes for the action
   */
  actionClassName?: string;
}

/**
 * EmptyState component for displaying when there is no content to show
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  containerClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className={cn(
        'max-w-md mx-auto',
        containerClassName
      )}>
        {icon && (
          <div className={cn(
            'mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 mb-6',
            iconClassName
          )}>
            {icon}
          </div>
        )}
        
        <h3 className={cn(
          'text-lg font-medium text-neutral-900 dark:text-neutral-100',
          titleClassName
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            'mt-2 text-sm text-neutral-600 dark:text-neutral-400',
            descriptionClassName
          )}>
            {description}
          </p>
        )}
        
        {action && (
          <div className={cn(
            'mt-6',
            actionClassName
          )}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
