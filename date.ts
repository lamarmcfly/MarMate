/**
 * Date utility functions for formatting and manipulating dates
 */

import { format, formatDistance, formatRelative, isValid, parseISO, differenceInDays, 
         differenceInMonths, differenceInYears, addDays, addMonths, isAfter, isBefore, 
         isEqual, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Default date format used throughout the application
 */
export const DEFAULT_DATE_FORMAT = 'MMM d, yyyy';

/**
 * Default datetime format used throughout the application
 */
export const DEFAULT_DATETIME_FORMAT = 'MMM d, yyyy h:mm a';

/**
 * Parses a date string into a Date object
 * @param dateString - The date string to parse
 * @returns A Date object or null if invalid
 */
export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  
  if (dateString instanceof Date) {
    return isValid(dateString) ? dateString : null;
  }
  
  try {
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Formats a date using the specified format
 * @param date - The date to format
 * @param formatStr - The format string (defaults to DEFAULT_DATE_FORMAT)
 * @returns The formatted date string or fallback if date is invalid
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = DEFAULT_DATE_FORMAT,
  fallback: string = 'Invalid date'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return fallback;
  
  try {
    return format(parsedDate, formatStr, { locale: enUS });
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Formats a date as a datetime
 * @param date - The date to format
 * @returns The formatted datetime string
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  fallback: string = 'Invalid date'
): string {
  return formatDate(date, DEFAULT_DATETIME_FORMAT, fallback);
}

/**
 * Formats a date as a time
 * @param date - The date to format
 * @returns The formatted time string
 */
export function formatTime(
  date: Date | string | null | undefined,
  fallback: string = 'Invalid time'
): string {
  return formatDate(date, 'h:mm a', fallback);
}

/**
 * Formats a date as a relative time (e.g., "2 hours ago")
 * @param date - The date to format
 * @param baseDate - The base date to compare against (defaults to now)
 * @returns The relative time string
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  baseDate: Date = new Date(),
  fallback: string = 'Invalid date'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return fallback;
  
  try {
    return formatDistance(parsedDate, baseDate, {
      addSuffix: true,
      locale: enUS
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return fallback;
  }
}

/**
 * Formats a date as a relative time, but uses calendar words like "today", "yesterday"
 * @param date - The date to format
 * @param baseDate - The base date to compare against (defaults to now)
 * @returns The relative calendar time string
 */
export function formatCalendarTime(
  date: Date | string | null | undefined,
  baseDate: Date = new Date(),
  fallback: string = 'Invalid date'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return fallback;
  
  try {
    return formatRelative(parsedDate, baseDate, { locale: enUS });
  } catch (error) {
    console.error('Error formatting calendar time:', error);
    return fallback;
  }
}

/**
 * Formats a date for display in a user-friendly way based on how far in the past it is
 * - Today: "Today at 2:30 PM"
 * - Yesterday: "Yesterday at 2:30 PM"
 * - Within 7 days: "Monday at 2:30 PM"
 * - Within current year: "Feb 15 at 2:30 PM"
 * - Older: "Feb 15, 2022"
 * @param date - The date to format
 * @returns The smart formatted date string
 */
export function formatSmartDate(
  date: Date | string | null | undefined,
  fallback: string = 'Invalid date'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return fallback;
  
  const now = new Date();
  const daysDiff = differenceInDays(now, parsedDate);
  const monthsDiff = differenceInMonths(now, parsedDate);
  const yearsDiff = differenceInYears(now, parsedDate);
  
  try {
    if (daysDiff < 1) {
      return `Today at ${format(parsedDate, 'h:mm a')}`;
    } else if (daysDiff < 2) {
      return `Yesterday at ${format(parsedDate, 'h:mm a')}`;
    } else if (daysDiff < 7) {
      return formatRelative(parsedDate, now, { locale: enUS });
    } else if (yearsDiff < 1) {
      return format(parsedDate, 'MMM d \'at\' h:mm a', { locale: enUS });
    } else {
      return format(parsedDate, 'MMM d, yyyy', { locale: enUS });
    }
  } catch (error) {
    console.error('Error formatting smart date:', error);
    return fallback;
  }
}

/**
 * Date range utilities
 */

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Checks if a date is within a date range (inclusive)
 * @param date - The date to check
 * @param range - The date range
 * @returns True if the date is within the range
 */
export function isDateInRange(date: Date | string | null | undefined, range: DateRange): boolean {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;
  
  return (
    (isAfter(parsedDate, range.start) || isEqual(parsedDate, range.start)) &&
    (isBefore(parsedDate, range.end) || isEqual(parsedDate, range.end))
  );
}

/**
 * Creates a date range for today
 * @returns A date range for today
 */
export function getTodayRange(): DateRange {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today)
  };
}

/**
 * Creates a date range for yesterday
 * @returns A date range for yesterday
 */
export function getYesterdayRange(): DateRange {
  const yesterday = addDays(new Date(), -1);
  return {
    start: startOfDay(yesterday),
    end: endOfDay(yesterday)
  };
}

/**
 * Creates a date range for the last N days
 * @param days - The number of days
 * @returns A date range for the last N days
 */
export function getLastNDaysRange(days: number): DateRange {
  const today = new Date();
  const pastDate = addDays(today, -days);
  return {
    start: startOfDay(pastDate),
    end: endOfDay(today)
  };
}

/**
 * Creates a date range for the current month
 * @returns A date range for the current month
 */
export function getCurrentMonthRange(): DateRange {
  const today = new Date();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today)
  };
}

/**
 * Creates a date range for the current year
 * @returns A date range for the current year
 */
export function getCurrentYearRange(): DateRange {
  const today = new Date();
  return {
    start: startOfYear(today),
    end: endOfYear(today)
  };
}

/**
 * Formats a date range as a string
 * @param range - The date range to format
 * @param formatStr - The format string for each date
 * @returns The formatted date range string
 */
export function formatDateRange(
  range: DateRange,
  formatStr: string = DEFAULT_DATE_FORMAT
): string {
  return `${formatDate(range.start, formatStr)} - ${formatDate(range.end, formatStr)}`;
}

/**
 * Calculates the duration of a date range in days
 * @param range - The date range
 * @returns The number of days in the range
 */
export function getDateRangeDuration(range: DateRange): number {
  return differenceInDays(range.end, range.start) + 1; // +1 to include both start and end days
}

/**
 * Checks if two date ranges overlap
 * @param range1 - The first date range
 * @param range2 - The second date range
 * @returns True if the ranges overlap
 */
export function doDateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
  return (
    isDateInRange(range1.start, range2) ||
    isDateInRange(range1.end, range2) ||
    isDateInRange(range2.start, range1) ||
    isDateInRange(range2.end, range1)
  );
}
