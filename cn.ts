import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that combines class names conditionally and merges Tailwind CSS classes intelligently.
 * 
 * This function combines the power of `clsx` for conditional class joining with `tailwind-merge`
 * to properly handle Tailwind CSS class conflicts (e.g., merging 'px-2 px-4' into just 'px-4').
 * 
 * @param inputs - Any number of class values (strings, objects with boolean values, arrays, etc.)
 * @returns A string of merged class names
 * 
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-500') // => 'text-red-500 bg-blue-500'
 * 
 * // Conditional classes
 * cn('text-white', isActive && 'bg-blue-500', !isActive && 'bg-gray-500')
 * 
 * // With Tailwind conflicts (the second px value wins)
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
