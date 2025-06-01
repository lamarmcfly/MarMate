import React, { ReactNode } from 'react';
import { toast, Toast as HotToast, Toaster } from 'react-hot-toast';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import Button from './Button';

// Define toast variants for styling
const toastVariants = cva(
  'relative flex w-full max-w-md items-center justify-between rounded-lg p-4 shadow-lg transition-all duration-300 ease-out',
  {
    variants: {
      type: {
        default: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700',
        success: 'bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-400 border border-success-200 dark:border-success-800',
        error: 'bg-error-50 dark:bg-error-900/20 text-error-800 dark:text-error-400 border border-error-200 dark:border-error-800',
        warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400 border border-warning-200 dark:border-warning-800',
        info: 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400 border border-primary-200 dark:border-primary-800',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  }
);

// Define icon variants
const iconVariants = cva(
  'flex-shrink-0 h-6 w-6',
  {
    variants: {
      type: {
        default: 'text-neutral-500 dark:text-neutral-400',
        success: 'text-success-600 dark:text-success-400',
        error: 'text-error-600 dark:text-error-400',
        warning: 'text-warning-600 dark:text-warning-400',
        info: 'text-primary-600 dark:text-primary-400',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  }
);

// Props for the custom Toast component
export interface ToastProps extends VariantProps<typeof toastVariants> {
  /**
   * The message content of the toast.
   */
  message: string | ReactNode;
  /**
   * The type of toast (determines color and default icon).
   */
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  /**
   * Custom icon to display. Overrides default icon for the type.
   */
  icon?: ReactNode;
  /**
   * An action button to display within the toast.
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /**
   * The toast object provided by react-hot-toast.
   */
  t: HotToast;
  /**
   * Optional additional class name.
   */
  className?: string;
}

/**
 * A customizable toast notification component.
 * Designed to be used with `react-hot-toast`'s `toast.custom` function.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'default',
  icon,
  action,
  t,
  className,
}) => {
  // Determine the icon based on type if no custom icon is provided
  const defaultIcon = React.useMemo(() => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={iconVariants({ type })} />;
      case 'error':
        return <XCircleIcon className={iconVariants({ type })} />;
      case 'warning':
        return <ExclamationCircleIcon className={iconVariants({ type })} />;
      case 'info':
        return <InformationCircleIcon className={iconVariants({ type })} />;
      default:
        return null;
    }
  }, [type]);

  return (
    <div
      className={cn(
        toastVariants({ type }),
        t.visible ? 'animate-enter' : 'animate-leave',
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3 mr-2">
        {/* Icon */}
        {(icon || defaultIcon) && (
          <div className="flex-shrink-0">
            {icon || defaultIcon}
          </div>
        )}
        {/* Message content */}
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Action button */}
        {action && (
          <Button
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={() => {
              action.onClick();
              toast.dismiss(t.id); // Dismiss toast after action
            }}
            className={cn(
              'px-2 py-1',
              type === 'success' && 'text-success-600 hover:bg-success-100 dark:text-success-400 dark:hover:bg-success-900/30',
              type === 'error' && 'text-error-600 hover:bg-error-100 dark:text-error-400 dark:hover:bg-error-900/30',
              type === 'warning' && 'text-warning-600 hover:bg-warning-100 dark:text-warning-400 dark:hover:bg-warning-900/30',
              type === 'info' && 'text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/30',
              type === 'default' && 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700',
            )}
          >
            {action.label}
          </Button>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className={cn(
            'rounded-full p-1 transition-colors',
            type === 'default' && 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700',
            type === 'success' && 'text-success-600 hover:bg-success-100 dark:text-success-400 dark:hover:bg-success-900/30',
            type === 'error' && 'text-error-600 hover:bg-error-100 dark:text-error-400 dark:hover:bg-error-900/30',
            type === 'warning' && 'text-warning-600 hover:bg-warning-100 dark:text-warning-400 dark:hover:bg-warning-900/30',
            type === 'info' && 'text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/30',
          )}
          aria-label="Close"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Helper functions to show different types of toasts
 */
export const showToast = {
  /**
   * Show a default toast notification
   */
  default: (message: string | ReactNode, options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>) => {
    return toast.custom((t) => (
      <Toast message={message} t={t} type="default" {...options} />
    ), { duration: 4000 });
  },

  /**
   * Show a success toast notification
   */
  success: (message: string | ReactNode, options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>) => {
    return toast.custom((t) => (
      <Toast message={message} t={t} type="success" {...options} />
    ), { duration: 4000 });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string | ReactNode, options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>) => {
    return toast.custom((t) => (
      <Toast message={message} t={t} type="error" {...options} />
    ), { duration: 5000 }); // Errors stay a bit longer
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string | ReactNode, options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>) => {
    return toast.custom((t) => (
      <Toast message={message} t={t} type="warning" {...options} />
    ), { duration: 5000 });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string | ReactNode, options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>) => {
    return toast.custom((t) => (
      <Toast message={message} t={t} type="info" {...options} />
    ), { duration: 4000 });
  },

  /**
   * Show a toast with a promise
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string | ReactNode;
      success: string | ReactNode | ((data: T) => string | ReactNode);
      error: string | ReactNode | ((err: any) => string | ReactNode);
    },
    options?: Omit<Partial<ToastProps>, 'message' | 't' | 'type'>
  ) => {
    return toast.promise(
      promise,
      {
        loading: {
          render: (t) => (
            <Toast message={loading} t={t} type="default" {...options} />
          ),
        },
        success: {
          render: (result) => {
            const message = typeof success === 'function' ? success(result.data) : success;
            return <Toast message={message} t={result} type="success" {...options} />;
          },
        },
        error: {
          render: (result) => {
            const message = typeof error === 'function' ? error(result.data) : error;
            return <Toast message={message} t={result} type="error" {...options} />;
          },
        },
      }
    );
  },
};

/**
 * Custom Toaster component with predefined settings
 */
export const CustomToaster: React.FC<React.ComponentProps<typeof Toaster>> = (props) => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: '!p-0 !bg-transparent !shadow-none',
      }}
      {...props}
    />
  );
};

export default Toast;
