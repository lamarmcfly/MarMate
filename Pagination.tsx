import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current page number (1-based)
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  
  /**
   * Maximum number of page buttons to show
   * @default 5
   */
  maxVisiblePages?: number;
  
  /**
   * Whether to show the first/last page buttons
   * @default true
   */
  showFirstLastButtons?: boolean;
  
  /**
   * Whether to show the previous/next buttons
   * @default true
   */
  showPrevNextButtons?: boolean;
  
  /**
   * Custom label for the previous button
   * @default "Previous"
   */
  prevLabel?: string;
  
  /**
   * Custom label for the next button
   * @default "Next"
   */
  nextLabel?: string;
  
  /**
   * Custom label for the first page button
   * @default "First"
   */
  firstLabel?: string;
  
  /**
   * Custom label for the last page button
   * @default "Last"
   */
  lastLabel?: string;
  
  /**
   * Whether the pagination is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Size variant for the pagination
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({
    currentPage,
    totalPages,
    onPageChange,
    maxVisiblePages = 5,
    showFirstLastButtons = true,
    showPrevNextButtons = true,
    prevLabel = 'Previous',
    nextLabel = 'Next',
    firstLabel = 'First',
    lastLabel = 'Last',
    isLoading = false,
    size = 'md',
    className,
    ...props
  }, ref) => {
    // Ensure current page is within bounds
    const page = Math.max(1, Math.min(currentPage, totalPages));
    
    // No need to render pagination if there's only one page
    if (totalPages <= 1) {
      return null;
    }
    
    // Calculate the range of page numbers to display
    const getPageRange = (): number[] => {
      // If we can show all pages
      if (totalPages <= maxVisiblePages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      // Calculate the start and end of the page range
      let start = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let end = start + maxVisiblePages - 1;
      
      // Adjust if end is beyond totalPages
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };
    
    const pageRange = getPageRange();
    
    // Size classes
    const sizeClasses = {
      sm: {
        button: 'h-8 w-8 text-xs',
        text: 'px-2 py-1 text-xs',
      },
      md: {
        button: 'h-10 w-10 text-sm',
        text: 'px-3 py-2 text-sm',
      },
      lg: {
        button: 'h-12 w-12 text-base',
        text: 'px-4 py-2 text-base',
      },
    };
    
    // Button base classes
    const buttonBaseClasses = cn(
      'relative inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
      'hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      sizeClasses[size].button
    );
    
    // Current page button classes
    const currentPageClasses = cn(
      'relative inline-flex items-center justify-center rounded-md border border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
      'focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      sizeClasses[size].button
    );
    
    // Text button classes (for prev/next with labels)
    const textButtonClasses = cn(
      'relative inline-flex items-center rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
      'hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      sizeClasses[size].text
    );
    
    return (
      <nav
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        aria-label="Pagination"
        {...props}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* First page button */}
          {showFirstLastButtons && (
            <button
              type="button"
              className={buttonBaseClasses}
              onClick={() => onPageChange(1)}
              disabled={page === 1 || isLoading}
              aria-label={firstLabel}
              title={firstLabel}
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          
          {/* Previous page button */}
          {showPrevNextButtons && (
            <button
              type="button"
              className={textButtonClasses}
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isLoading}
              aria-label={prevLabel}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">{prevLabel}</span>
            </button>
          )}
          
          {/* Page numbers */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            {pageRange.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page ? currentPageClasses : buttonBaseClasses}
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          
          {/* Mobile page indicator */}
          <div className="sm:hidden flex items-center">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Page {page} of {totalPages}
            </span>
          </div>
          
          {/* Next page button */}
          {showPrevNextButtons && (
            <button
              type="button"
              className={textButtonClasses}
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isLoading}
              aria-label={nextLabel}
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
            </button>
          )}
          
          {/* Last page button */}
          {showFirstLastButtons && (
            <button
              type="button"
              className={buttonBaseClasses}
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages || isLoading}
              aria-label={lastLabel}
              title={lastLabel}
            >
              <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
