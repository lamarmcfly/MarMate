import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// Badge variants using class-variance-authority
const badgeVariants = cva(
  // Base styles applied to all variants
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
        success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
        warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
        error: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
        info: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
      outline: {
        true: 'bg-transparent border',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        outline: true,
        className: 'border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
      },
      {
        variant: 'success',
        outline: true,
        className: 'border-success-500 text-success-700 dark:border-success-700 dark:text-success-400',
      },
      {
        variant: 'warning',
        outline: true,
        className: 'border-warning-500 text-warning-700 dark:border-warning-700 dark:text-warning-400',
      },
      {
        variant: 'error',
        outline: true,
        className: 'border-error-500 text-error-700 dark:border-error-700 dark:text-error-400',
      },
      {
        variant: 'info',
        outline: true,
        className: 'border-primary-500 text-primary-700 dark:border-primary-700 dark:text-primary-400',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      outline: false,
    },
  }
);

// Props interface for Badge
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
  as?: React.ElementType;
}

// Badge component with forwardRef for ref forwarding
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      outline,
      icon,
      as: Component = 'span',
      children,
      ...props
    },
    ref
  ) => {
    // Combine all classes
    const badgeClasses = cn(
      badgeVariants({ variant, size, outline }),
      className
    );

    return (
      <Component
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
        {children}
      </Component>
    );
  }
);

// Display name for dev tools
Badge.displayName = 'Badge';

export default Badge;
