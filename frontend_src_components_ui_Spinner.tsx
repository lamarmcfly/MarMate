import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// Spinner variants using class-variance-authority
const spinnerVariants = cva(
  // Base styles applied to all variants
  'animate-spin rounded-full border-current border-t-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-[2px]',
        sm: 'h-4 w-4 border-[2px]',
        md: 'h-6 w-6 border-[2px]',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-[4px]',
      },
      color: {
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        white: 'text-white',
        neutral: 'text-neutral-600 dark:text-neutral-400',
        success: 'text-success-600 dark:text-success-400',
        error: 'text-error-600 dark:text-error-400',
        warning: 'text-warning-600 dark:text-warning-400',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

// Props interface extending variant props
export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

// Spinner component with forwardRef for ref forwarding
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, label = 'Loading...', ...props }, ref) => {
    // Combine all classes
    const spinnerClasses = cn(spinnerVariants({ size, color }), className);

    return (
      <div
        ref={ref}
        className={spinnerClasses}
        role="status"
        aria-label={label}
        aria-busy="true"
        aria-live="polite"
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

// Display name for dev tools
Spinner.displayName = 'Spinner';

export default Spinner;
