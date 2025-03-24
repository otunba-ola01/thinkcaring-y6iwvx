/**
 * Date Utility Functions
 * 
 * This file provides a comprehensive set of date-related helper functions
 * for consistent date handling across the HCBS Revenue Management System.
 * These utilities are particularly important for financial reporting,
 * claim processing, and billing workflows.
 */

// Import date-fns functions - v2.30+
import {
  format,
  parse,
  isValid,
  parseISO,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  differenceInDays,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from 'date-fns';
import { enUS } from 'date-fns/locale'; // v2.30+

// Import date configuration constants
import {
  DEFAULT_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
  API_DATE_FORMAT,
  DATE_LOCALE,
  DATE_RANGE_PRESETS
} from '../config/date.config';

/**
 * Formats a date object or string to the specified format
 * 
 * @param date - Date to format
 * @param formatStr - Format string to use (defaults to DEFAULT_DATE_FORMAT)
 * @returns Formatted date string or empty string if date is invalid
 */
export const formatDate = (
  date: Date | string | null | undefined,
  formatStr: string = DEFAULT_DATE_FORMAT
): string => {
  // Return empty string for null, undefined, or empty string
  if (date === null || date === undefined || (typeof date === 'string' && date === '')) {
    return '';
  }

  try {
    let dateObj: Date;
    
    // If date is a string, attempt to parse it
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }

    // Return empty string if date is invalid
    if (!isValid(dateObj)) {
      return '';
    }

    // Format the date using the specified format
    return format(dateObj, formatStr, { locale: DATE_LOCALE });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a date for display using the application's display date format
 * 
 * @param date - Date to format
 * @returns Formatted date string for display or empty string if date is invalid
 */
export const formatDisplayDate = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, DISPLAY_DATE_FORMAT);
};

/**
 * Formats a date for API requests using the application's API date format
 * 
 * @param date - Date to format
 * @returns Formatted date string for API or empty string if date is invalid
 */
export const formatApiDate = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, API_DATE_FORMAT);
};

/**
 * Parses a date string into a Date object using the specified format
 * 
 * @param dateStr - Date string to parse
 * @param formatStr - Format string to use for parsing (defaults to DEFAULT_DATE_FORMAT)
 * @returns Parsed Date object or null if parsing fails
 */
export const parseDate = (
  dateStr: string | null | undefined,
  formatStr: string = DEFAULT_DATE_FORMAT
): Date | null => {
  // Return null for null, undefined, or empty string
  if (dateStr === null || dateStr === undefined || dateStr === '') {
    return null;
  }

  try {
    // First, try to parse as ISO string
    let parsed = parseISO(dateStr);
    if (isValid(parsed)) {
      return parsed;
    }

    // If that fails, try with the specified format
    parsed = parse(dateStr, formatStr, new Date(), { locale: DATE_LOCALE });
    
    // Check if the parsed date is valid
    if (isValid(parsed)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Parses a display-formatted date string into a Date object
 * 
 * @param dateStr - Display-formatted date string to parse
 * @returns Parsed Date object or null if parsing fails
 */
export const parseDisplayDate = (
  dateStr: string | null | undefined
): Date | null => {
  return parseDate(dateStr, DISPLAY_DATE_FORMAT);
};

/**
 * Parses an API-formatted date string into a Date object
 * 
 * @param dateStr - API-formatted date string to parse
 * @returns Parsed Date object or null if parsing fails
 */
export const parseApiDate = (
  dateStr: string | null | undefined
): Date | null => {
  return parseDate(dateStr, API_DATE_FORMAT);
};

/**
 * Checks if a value is a valid date
 * 
 * @param value - Value to check
 * @returns True if value is a valid date, false otherwise
 */
export const isValidDate = (value: any): boolean => {
  // Return false for null or undefined
  if (value === null || value === undefined) {
    return false;
  }

  // If value is a Date object, check if it's valid
  if (value instanceof Date) {
    return isValid(value);
  }

  // If value is a string, try to parse it
  if (typeof value === 'string') {
    // Return false for empty string
    if (value === '') {
      return false;
    }
    
    // Try to parse as ISO string
    const date = parseISO(value);
    return isValid(date);
  }

  return false;
};

/**
 * Gets the start and end dates for a predefined time period
 * 
 * @param period - Predefined period identifier (today, yesterday, last7days, etc.)
 * @returns Object containing start and end dates for the specified period
 */
export const getDateRangeForPeriod = (
  period: string
): { startDate: Date; endDate: Date } => {
  const today = new Date();
  let startDate: Date = startOfDay(today);
  let endDate: Date = endOfDay(today);

  switch (period.toLowerCase()) {
    case 'today':
      // Already set to today
      break;

    case 'yesterday':
      startDate = startOfDay(subDays(today, 1));
      endDate = endOfDay(subDays(today, 1));
      break;

    case 'last7days':
    case 'last7days':
      startDate = startOfDay(subDays(today, 6));
      // endDate already set to today
      break;

    case 'last30days':
    case 'last30days':
      startDate = startOfDay(subDays(today, 29));
      // endDate already set to today
      break;

    case 'thisweek':
    case 'thisweek':
      startDate = startOfWeek(today, { locale: enUS });
      endDate = endOfWeek(today, { locale: enUS });
      break;

    case 'lastweek':
    case 'lastweek':
      startDate = startOfWeek(subDays(today, 7), { locale: enUS });
      endDate = endOfWeek(subDays(today, 7), { locale: enUS });
      break;

    case 'thismonth':
    case 'thismonth':
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;

    case 'lastmonth':
    case 'lastmonth':
      startDate = startOfMonth(subDays(startOfMonth(today), 1));
      endDate = endOfMonth(subDays(startOfMonth(today), 1));
      break;

    case 'thisyear':
    case 'thisyear':
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;

    case 'lastyear':
    case 'lastyear':
      startDate = startOfYear(subDays(startOfYear(today), 1));
      endDate = endOfYear(subDays(startOfYear(today), 1));
      break;

    case 'custom':
    default:
      // Return today by default for custom or unknown periods
      break;
  }

  return { startDate, endDate };
};

/**
 * Gets a human-readable label for a date range
 * 
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Human-readable label for the date range or empty string if dates are invalid
 */
export const getDateRangeLabel = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
): string => {
  // Check if both dates are valid
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return '';
  }

  const formattedStartDate = formatDisplayDate(startDate);
  const formattedEndDate = formatDisplayDate(endDate);

  // If start and end dates are the same day
  if (formattedStartDate === formattedEndDate) {
    return formattedStartDate;
  }

  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * Calculates the number of days between two dates
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between the dates or 0 if dates are invalid
 */
export const calculateDateDifference = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  // Check if both dates are valid
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return 0;
  }

  // Convert to Date objects if they're strings
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate as Date;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate as Date;

  // Calculate and return the absolute difference in days
  return Math.abs(differenceInDays(end, start));
};

/**
 * Checks if a date is within a specified range
 * 
 * @param date - Date to check
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns True if date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  // Check if all dates are valid
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }

  // Convert to Date objects if they're strings
  const dateObj = typeof date === 'string' ? parseISO(date) : date as Date;
  const startObj = typeof startDate === 'string' ? parseISO(startDate) : startDate as Date;
  const endObj = typeof endDate === 'string' ? parseISO(endDate) : endDate as Date;

  // Check if date is between start and end dates (inclusive)
  return (
    (isAfter(dateObj, startObj) || dateObj.getTime() === startObj.getTime()) &&
    (isBefore(dateObj, endObj) || dateObj.getTime() === endObj.getTime())
  );
};

/**
 * Determines the aging bucket for a date based on days elapsed
 * 
 * @param date - Date to check
 * @returns Aging bucket label ('0-30', '31-60', '61-90', '90+') or empty string if date is invalid
 */
export const getAgingBucket = (
  date: Date | string | null | undefined
): string => {
  // Check if date is valid
  if (!isValidDate(date)) {
    return '';
  }

  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? parseISO(date) : date as Date;
  
  // Calculate days elapsed from date to today
  const today = new Date();
  const daysElapsed = differenceInDays(today, dateObj);

  // Determine bucket based on days elapsed
  if (daysElapsed <= 30) {
    return '0-30';
  } else if (daysElapsed <= 60) {
    return '31-60';
  } else if (daysElapsed <= 90) {
    return '61-90';
  } else {
    return '90+';
  }
};

/**
 * Formats a date relative to today (e.g., 'Today', 'Yesterday', '5 days ago')
 * 
 * @param date - Date to format
 * @returns Relative date string or empty string if date is invalid
 */
export const formatRelativeDate = (
  date: Date | string | null | undefined
): string => {
  // Check if date is valid
  if (!isValidDate(date)) {
    return '';
  }

  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? parseISO(date) : date as Date;
  
  // Calculate days elapsed from date to today
  const today = new Date();
  const daysElapsed = differenceInDays(today, dateObj);

  // Format based on days elapsed
  if (daysElapsed === 0) {
    return 'Today';
  } else if (daysElapsed === 1) {
    return 'Yesterday';
  } else if (daysElapsed <= 30) {
    return `${daysElapsed} days ago`;
  } else {
    return formatDisplayDate(dateObj);
  }
};