import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// Card variants using class-variance-authority
const cardVariants = cva(
  // Base styles applied to all variants
  'rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm',
        outlined: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
        elevated: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md',
        flat: 'bg-white dark:bg-neutral-800',
        ghost: 'bg-neutral-50 dark:bg-neutral-900',
        interactive: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow duration-200',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-3xl',
      },
      border: {
        none: 'border-0',
        default: 'border border-neutral-200 dark:border-neutral-700',
        accent: 'border border-primary-500 dark:border-primary-400',
        dashed: 'border border-dashed border-neutral-300 dark:border-neutral-600',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      radius: 'lg',
      border: 'default',
    },
  }
);

// Header variants
const headerVariants = cva(
  'border-b border-neutral-200 dark:border-neutral-700',
  {
    variants: {
      padding: {
        none: '',
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
        xl: 'px-8 py-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

// Footer variants
const footerVariants = cva(
  'border-t border-neutral-200 dark:border-neutral-700',
  {
    variants: {
      padding: {
        none: '',
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
        xl: 'px-8 py-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

// Body variants
const bodyVariants = cva(
  '',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

// Props interface for Card
export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  header?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  footerClassName?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  isInteractive?: boolean;
  as?: React.ElementType;
}

// Card component with forwardRef for ref forwarding
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      radius,
      border,
      header,
      footer,
      headerClassName,
      footerClassName,
      bodyClassName,
      noPadding = false,
      isInteractive = false,
      as: Component = 'div',
      children,
      ...props
    },
    ref
  ) => {
    // If interactive, override variant
    const effectiveVariant = isInteractive ? 'interactive' : variant;
    
    // If noPadding is true, override padding
    const effectivePadding = noPadding ? 'none' : padding;
    
    // Combine all classes for card
    const cardClasses = cn(
      cardVariants({ 
        variant: effectiveVariant, 
        padding: effectivePadding,
        radius,
        border,
      }),
      className
    );

    // Determine header, body, and footer classes
    const headerClasses = cn(
      headerVariants({ padding: effectivePadding }),
      headerClassName
    );
    
    const bodyClasses = cn(
      bodyVariants({ padding: effectivePadding }),
      bodyClassName
    );
    
    const footerClasses = cn(
      footerVariants({ padding: effectivePadding }),
      footerClassName
    );

    return (
      <Component
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {header && (
          <div className={headerClasses}>
            {header}
          </div>
        )}
        
        <div className={bodyClasses}>
          {children}
        </div>
        
        {footer && (
          <div className={footerClasses}>
            {footer}
          </div>
        )}
      </Component>
    );
  }
);

// Display name for dev tools
Card.displayName = 'Card';

export default Card;
