/**
 * Date Configuration
 * 
 * This file contains date-related constants and utility functions for the HCBS Revenue
 * Management System. It centralizes date handling to ensure consistency across the application.
 */

import { format, parse, isValid } from 'date-fns'; // date-fns v2.30+
import { enUS } from 'date-fns/locale'; // date-fns v2.30+

/**
 * Default date format used throughout the application
 * Format: yyyy-MM-dd (e.g., 2023-05-15)
 */
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Date format used for API requests and responses
 * Format: yyyy-MM-dd (e.g., 2023-05-15)
 */
export const API_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * User-friendly date format for display
 * Format: MM/dd/yyyy (e.g., 05/15/2023)
 */
export const DISPLAY_DATE_FORMAT = 'MM/dd/yyyy';

/**
 * Abbreviated date format for space-constrained UI elements
 * Format: MM/dd (e.g., 05/15)
 */
export const SHORT_DATE_FORMAT = 'MM/dd';

/**
 * Full date format with day name for detailed views
 * Format: EEEE, MMMM d, yyyy (e.g., Monday, May 15, 2023)
 */
export const LONG_DATE_FORMAT = 'EEEE, MMMM d, yyyy';

/**
 * Format for displaying date and time
 * Format: MM/dd/yyyy h:mm a (e.g., 05/15/2023 2:30 PM)
 */
export const DATETIME_FORMAT = 'MM/dd/yyyy h:mm a';

/**
 * Format for displaying time only
 * Format: h:mm a (e.g., 2:30 PM)
 */
export const TIME_FORMAT = 'h:mm a';

/**
 * Starting month for fiscal year calculations (0-based)
 * 6 represents July
 */
export const FISCAL_YEAR_START_MONTH = 6; // July (0-based month index)

/**
 * Locale configuration for date formatting
 */
export const DATE_LOCALE = enUS;

/**
 * Configuration for date picker components
 */
export const DATE_PICKER_CONFIG = {
  format: DISPLAY_DATE_FORMAT,
  mask: '__/__/____',
  minDate: new Date(1900, 0, 1), // January 1, 1900
  maxDate: new Date(2100, 11, 31), // December 31, 2100
};

/**
 * Predefined date range options for date range pickers
 */
export const DATE_RANGE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7Days' },
  { label: 'Last 30 Days', value: 'last30Days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Quarter', value: 'thisQuarter' },
  { label: 'Last Quarter', value: 'lastQuarter' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
  { label: 'Custom Range', value: 'custom' },
];

/**
 * Formats a date object or string to the specified format
 * 
 * @param date - Date to format (Date object, string, null, or undefined)
 * @param formatStr - Format string to use (defaults to DEFAULT_DATE_FORMAT)
 * @returns Formatted date string or empty string if date is invalid
 */
export const formatDate = (
  date: Date | string | null | undefined,
  formatStr: string = DEFAULT_DATE_FORMAT
): string => {
  // Return empty string for null, undefined, or empty string
  if (date === null || date === undefined || date === '') {
    return '';
  }

  try {
    let dateObj: Date;
    
    // If date is a string, attempt to parse it
    if (typeof date === 'string') {
      // First try to parse as ISO string
      dateObj = new Date(date);
      if (!isValid(dateObj)) {
        // If not valid, try to parse using the default format
        dateObj = parse(date, DEFAULT_DATE_FORMAT, new Date(), { locale: DATE_LOCALE });
      }
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
    let parsed = new Date(dateStr);
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
 * Checks if a value is a valid date
 * 
 * @param value - Value to check
 * @param formatStr - Format string to use for parsing if value is a string (defaults to DEFAULT_DATE_FORMAT)
 * @returns True if value is a valid date, false otherwise
 */
export const isValidDate = (
  value: any,
  formatStr: string = DEFAULT_DATE_FORMAT
): boolean => {
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
    const date = new Date(value);
    if (isValid(date)) {
      return true;
    }

    // Try with the specified format
    const parsed = parse(value, formatStr, new Date(), { locale: DATE_LOCALE });
    return isValid(parsed);
  }

  return false;
};