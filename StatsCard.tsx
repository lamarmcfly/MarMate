import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';

// StatsCard variants for color
const statsCardVariants = cva(
  'flex flex-col justify-between h-full',
  {
    variants: {
      color: {
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        success: 'text-success-600 dark:text-success-400',
        error: 'text-error-600 dark:text-error-400',
        warning: 'text-warning-600 dark:text-warning-400',
        info: 'text-info-600 dark:text-info-400', // Assuming info color exists or maps to primary
        neutral: 'text-neutral-600 dark:text-neutral-400',
      },
    },
    defaultVariants: {
      color: 'primary',
    },
  }
);

export interface StatsCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  title: string;
  value: number | string;
  change?: number; // Percentage change, e.g., 5 for +5%, -2 for -2%
  icon?: ReactNode;
  isLoading?: boolean;
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      icon,
      isLoading = false,
      color,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(statsCardVariants({ color }), className);

    const isPositiveChange = change && change > 0;
    const isNegativeChange = change && change < 0;
    const changeColorClass = isPositiveChange
      ? 'text-success-600 dark:text-success-400'
      : isNegativeChange
      ? 'text-error-600 dark:text-error-400'
      : 'text-neutral-500 dark:text-neutral-400';

    const changeIcon = isPositiveChange ? (
      <ArrowUpIcon className="h-4 w-4" />
    ) : isNegativeChange ? (
      <ArrowDownIcon className="h-4 w-4" />
    ) : null;

    const formattedChange = change
      ? new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Math.abs(change) / 100)
      : null;

    return (
      <Card ref={ref} className={cn('p-5', className)} {...props}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</h3>
          {icon && (
            <div className={cn('p-2 rounded-full bg-current/10', statsCardVariants({ color }))}>
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          {isLoading ? (
            <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
          )}
          {change !== undefined && (
            <div className={cn('flex items-center text-sm font-medium', changeColorClass)}>
              {isLoading ? (
                <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              ) : (
                <>
                  {changeIcon}
                  {formattedChange && <span className="ml-1">{formattedChange}</span>}
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;
