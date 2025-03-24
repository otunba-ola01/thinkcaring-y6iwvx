/**
 * Date utility functions for the HCBS Revenue Management System.
 * Provides standardized date manipulation, formatting, and calculations 
 * for financial operations, reporting, and user interfaces.
 * 
 * @module date
 */

import { 
  format, parse, isValid, differenceInDays, differenceInMonths, 
  differenceInYears, addDays, addMonths, addYears, startOfDay, 
  endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, isBefore, 
  isAfter, isSameDay, parseISO, formatISO 
} from 'date-fns'; // version 2.30+

import { 
  utcToZonedTime, zonedTimeToUtc 
} from 'date-fns-tz'; // version 2.0+

import { 
  ISO8601Date, DateRange, DateRangePreset, TimeInterval 
} from '../types/common.types';

import { ValidationError } from '../errors/validation-error';

/**
 * Default date format string used for internal operations
 */
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Default datetime format string used for internal operations
 */
export const DEFAULT_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * Default date format string used for UI display
 */
export const DEFAULT_DISPLAY_DATE_FORMAT = 'MM/dd/yyyy';

/**
 * Default datetime format string used for UI display
 */
export const DEFAULT_DISPLAY_DATETIME_FORMAT = 'MM/dd/yyyy h:mm a';

/**
 * Default timezone used for date operations
 */
export const DEFAULT_TIME_ZONE = 'America/New_York';

/**
 * Formats a date to ISO8601 format (YYYY-MM-DD)
 * 
 * @param date - The date to format
 * @returns Formatted ISO8601 date string or null if input is invalid
 */
export function formatDate(date: Date | string | number | null | undefined): ISO8601Date | null {
  if (date === null || date === undefined) {
    return null;
  }

  let dateObj: Date;
  
  if (typeof date === 'string') {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return null;
    }
    dateObj = parsedDate;
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
    if (!isValid(dateObj)) {
      return null;
    }
  } else if (date instanceof Date) {
    if (!isValid(date)) {
      return null;
    }
    dateObj = date;
  } else {
    return null;
  }

  return format(dateObj, DEFAULT_DATE_FORMAT);
}

/**
 * Parses a string date into a Date object
 * 
 * @param dateString - The date string to parse
 * @param format - The format of the date string (defaults to DEFAULT_DATE_FORMAT)
 * @returns Parsed Date object or null if parsing fails
 */
export function parseDate(dateString: string | null | undefined, formatString?: string): Date | null {
  if (dateString === null || dateString === undefined) {
    return null;
  }

  const dateFormat = formatString || DEFAULT_DATE_FORMAT;
  
  try {
    // First try parsing with the specified format
    const parsedDate = parse(dateString, dateFormat, new Date());
    
    if (isValid(parsedDate)) {
      return parsedDate;
    }
    
    // If that fails, try parsing as ISO format
    const isoParsed = parseISO(dateString);
    
    if (isValid(isoParsed)) {
      return isoParsed;
    }
    
    return null;
  } catch (error) {
    // If any error occurs during parsing, return null
    return null;
  }
}

/**
 * Formats a date for display in the UI (MM/DD/YYYY)
 * 
 * @param date - The date to format
 * @param formatString - Optional custom format string (defaults to DEFAULT_DISPLAY_DATE_FORMAT)
 * @returns Formatted date string for display or empty string if input is invalid
 */
export function formatDisplayDate(
  date: Date | string | number | null | undefined, 
  formatString?: string
): string {
  if (date === null || date === undefined) {
    return '';
  }

  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  return format(dateObj, formatString || DEFAULT_DISPLAY_DATE_FORMAT);
}

/**
 * Formats a date and time for display in the UI (MM/DD/YYYY h:mm a)
 * 
 * @param date - The date to format
 * @param formatString - Optional custom format string (defaults to DEFAULT_DISPLAY_DATETIME_FORMAT)
 * @param timeZone - Optional timezone (defaults to DEFAULT_TIME_ZONE)
 * @returns Formatted date and time string for display or empty string if input is invalid
 */
export function formatDisplayDateTime(
  date: Date | string | number | null | undefined, 
  formatString?: string,
  timeZone?: string
): string {
  if (date === null || date === undefined) {
    return '';
  }

  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  const tz = timeZone || DEFAULT_TIME_ZONE;
  const zonedDate = utcToZonedTime(dateObj, tz);
  
  return format(zonedDate, formatString || DEFAULT_DISPLAY_DATETIME_FORMAT);
}

/**
 * Checks if a value is a valid date
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date, false otherwise
 */
export function isValidDate(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (value instanceof Date) {
    return isValid(value);
  }
  
  if (typeof value === 'string') {
    const parsedDate = parseISO(value);
    return isValid(parsedDate);
  }
  
  if (typeof value === 'number') {
    const dateObj = new Date(value);
    return isValid(dateObj);
  }
  
  return false;
}

/**
 * Calculates the difference between two dates in days, months, or years
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param unit - The unit of time for the difference calculation (days, months, years)
 * @returns Difference between dates in the specified unit
 * @throws ValidationError if either date is invalid
 */
export function calculateDateDifference(
  startDate: Date | string | number,
  endDate: Date | string | number,
  unit: 'days' | 'months' | 'years' = 'days'
): number {
  let startDateObj: Date;
  let endDateObj: Date;
  
  if (typeof startDate === 'string') {
    startDateObj = parseISO(startDate);
  } else if (typeof startDate === 'number') {
    startDateObj = new Date(startDate);
  } else {
    startDateObj = startDate;
  }
  
  if (typeof endDate === 'string') {
    endDateObj = parseISO(endDate);
  } else if (typeof endDate === 'number') {
    endDateObj = new Date(endDate);
  } else {
    endDateObj = endDate;
  }
  
  if (!isValid(startDateObj) || !isValid(endDateObj)) {
    throw new ValidationError('Invalid date provided for difference calculation');
  }
  
  switch (unit) {
    case 'days':
      return differenceInDays(endDateObj, startDateObj);
    case 'months':
      return differenceInMonths(endDateObj, startDateObj);
    case 'years':
      return differenceInYears(endDateObj, startDateObj);
    default:
      return differenceInDays(endDateObj, startDateObj);
  }
}

/**
 * Adds a specified amount of time to a date
 * 
 * @param date - The base date
 * @param amount - The amount to add
 * @param unit - The unit of time to add (days, months, years)
 * @returns New date with the added time
 * @throws ValidationError if the date is invalid
 */
export function addToDate(
  date: Date | string | number,
  amount: number,
  unit: 'days' | 'months' | 'years' = 'days'
): Date {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    throw new ValidationError('Invalid date provided for addition');
  }
  
  switch (unit) {
    case 'days':
      return addDays(dateObj, amount);
    case 'months':
      return addMonths(dateObj, amount);
    case 'years':
      return addYears(dateObj, amount);
    default:
      return addDays(dateObj, amount);
  }
}

/**
 * Generates a date range based on a preset identifier
 * 
 * @param preset - The date range preset
 * @returns Start and end dates for the specified preset
 * @throws ValidationError if the preset is not recognized
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const today = new Date();
  let startDate: Date;
  let endDate: Date;
  
  switch (preset) {
    case DateRangePreset.TODAY:
      startDate = startOfDay(today);
      endDate = endOfDay(today);
      break;
      
    case DateRangePreset.YESTERDAY:
      startDate = startOfDay(addDays(today, -1));
      endDate = endOfDay(addDays(today, -1));
      break;
      
    case DateRangePreset.THIS_WEEK:
      startDate = startOfWeek(today, { weekStartsOn: 0 }); // 0 = Sunday
      endDate = endOfWeek(today, { weekStartsOn: 0 });
      break;
      
    case DateRangePreset.LAST_WEEK:
      startDate = startOfWeek(addDays(today, -7), { weekStartsOn: 0 });
      endDate = endOfWeek(addDays(today, -7), { weekStartsOn: 0 });
      break;
      
    case DateRangePreset.THIS_MONTH:
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
      
    case DateRangePreset.LAST_MONTH:
      startDate = startOfMonth(addMonths(today, -1));
      endDate = endOfMonth(addMonths(today, -1));
      break;
      
    case DateRangePreset.THIS_QUARTER:
      startDate = startOfQuarter(today);
      endDate = endOfQuarter(today);
      break;
      
    case DateRangePreset.LAST_QUARTER:
      startDate = startOfQuarter(addMonths(today, -3));
      endDate = endOfQuarter(addMonths(today, -3));
      break;
      
    case DateRangePreset.THIS_YEAR:
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;
      
    case DateRangePreset.LAST_YEAR:
      startDate = startOfYear(addYears(today, -1));
      endDate = endOfYear(addYears(today, -1));
      break;
      
    case DateRangePreset.LAST_30_DAYS:
      startDate = startOfDay(addDays(today, -29)); // 30 days including today
      endDate = endOfDay(today);
      break;
      
    case DateRangePreset.LAST_60_DAYS:
      startDate = startOfDay(addDays(today, -59)); // 60 days including today
      endDate = endOfDay(today);
      break;
      
    case DateRangePreset.LAST_90_DAYS:
      startDate = startOfDay(addDays(today, -89)); // 90 days including today
      endDate = endOfDay(today);
      break;
      
    default:
      throw new ValidationError(`Unrecognized date range preset: ${preset}`);
  }
  
  return {
    startDate: format(startDate, DEFAULT_DATE_FORMAT),
    endDate: format(endDate, DEFAULT_DATE_FORMAT)
  };
}

/**
 * Gets the start date of a specified time period
 * 
 * @param date - The reference date
 * @param interval - The time interval (day, week, month, quarter, year)
 * @returns Start date of the period
 * @throws ValidationError if the date is invalid
 */
export function getStartOfPeriod(date: Date | string | number, interval: TimeInterval): Date {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    throw new ValidationError('Invalid date provided for period calculation');
  }
  
  switch (interval) {
    case TimeInterval.DAILY:
      return startOfDay(dateObj);
    case TimeInterval.WEEKLY:
      return startOfWeek(dateObj, { weekStartsOn: 0 });
    case TimeInterval.MONTHLY:
      return startOfMonth(dateObj);
    case TimeInterval.QUARTERLY:
      return startOfQuarter(dateObj);
    case TimeInterval.YEARLY:
      return startOfYear(dateObj);
    default:
      throw new ValidationError(`Unrecognized time interval: ${interval}`);
  }
}

/**
 * Gets the end date of a specified time period
 * 
 * @param date - The reference date
 * @param interval - The time interval (day, week, month, quarter, year)
 * @returns End date of the period
 * @throws ValidationError if the date is invalid
 */
export function getEndOfPeriod(date: Date | string | number, interval: TimeInterval): Date {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    throw new ValidationError('Invalid date provided for period calculation');
  }
  
  switch (interval) {
    case TimeInterval.DAILY:
      return endOfDay(dateObj);
    case TimeInterval.WEEKLY:
      return endOfWeek(dateObj, { weekStartsOn: 0 });
    case TimeInterval.MONTHLY:
      return endOfMonth(dateObj);
    case TimeInterval.QUARTERLY:
      return endOfQuarter(dateObj);
    case TimeInterval.YEARLY:
      return endOfYear(dateObj);
    default:
      throw new ValidationError(`Unrecognized time interval: ${interval}`);
  }
}

/**
 * Compares two dates and determines their relationship
 * 
 * @param date1 - First date for comparison
 * @param date2 - Second date for comparison
 * @returns -1 if date1 is before date2, 0 if equal, 1 if date1 is after date2
 * @throws ValidationError if either date is invalid
 */
export function compareDates(date1: Date | string | number, date2: Date | string | number): number {
  let date1Obj: Date;
  let date2Obj: Date;
  
  if (typeof date1 === 'string') {
    date1Obj = parseISO(date1);
  } else if (typeof date1 === 'number') {
    date1Obj = new Date(date1);
  } else {
    date1Obj = date1;
  }
  
  if (typeof date2 === 'string') {
    date2Obj = parseISO(date2);
  } else if (typeof date2 === 'number') {
    date2Obj = new Date(date2);
  } else {
    date2Obj = date2;
  }
  
  if (!isValid(date1Obj) || !isValid(date2Obj)) {
    throw new ValidationError('Invalid date provided for comparison');
  }
  
  if (isBefore(date1Obj, date2Obj)) {
    return -1;
  } else if (isSameDay(date1Obj, date2Obj)) {
    return 0;
  } else {
    return 1;
  }
}

/**
 * Checks if a date falls within a specified date range
 * 
 * @param date - Date to check
 * @param dateRange - Date range to check against
 * @param inclusive - Whether to include the range boundaries (default: true)
 * @returns True if the date is within the range, false otherwise
 * @throws ValidationError if any date is invalid
 */
export function isDateInRange(
  date: Date | string | number,
  dateRange: DateRange,
  inclusive: boolean = true
): boolean {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  const startDate = parseISO(dateRange.startDate);
  const endDate = parseISO(dateRange.endDate);
  
  if (!isValid(dateObj) || !isValid(startDate) || !isValid(endDate)) {
    throw new ValidationError('Invalid date provided for range check');
  }
  
  if (inclusive) {
    return (!isBefore(dateObj, startOfDay(startDate)) && 
            !isAfter(dateObj, endOfDay(endDate)));
  } else {
    return (isAfter(dateObj, startOfDay(startDate)) && 
            isBefore(dateObj, endOfDay(endDate)));
  }
}

/**
 * Determines the aging bucket for a given number of days
 * Used for accounts receivable aging reports
 * 
 * @param days - Number of days to categorize
 * @returns Aging bucket label (e.g., '0-30', '31-60', etc.)
 */
export function getAgeBucketFromDays(days: number): string {
  if (days < 0) {
    return 'Current';
  } else if (days <= 30) {
    return '0-30';
  } else if (days <= 60) {
    return '31-60';
  } else if (days <= 90) {
    return '61-90';
  } else {
    return '91+';
  }
}

/**
 * Gets the current fiscal year based on a specified start month
 * 
 * @param fiscalYearStartMonth - Month when fiscal year starts (1-12, default: 1)
 * @returns Fiscal year information object with year, startDate, and endDate
 */
export function getCurrentFiscalYear(fiscalYearStartMonth: number = 1): {
  year: number;
  startDate: Date;
  endDate: Date;
} {
  // Validate fiscal year start month (1-12)
  const startMonth = Math.max(1, Math.min(12, fiscalYearStartMonth));
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  let fiscalYear: number;
  
  // Determine fiscal year based on current month and fiscal year start month
  if (currentMonth < startMonth) {
    // We're in the previous calendar year's fiscal year
    fiscalYear = currentYear - 1;
  } else {
    // We're in the current calendar year's fiscal year
    fiscalYear = currentYear;
  }
  
  // Create start date (first day of fiscal year)
  const startDate = new Date(fiscalYear, startMonth - 1, 1);
  
  // Create end date (last day of fiscal year, which is day before start of next fiscal year)
  const endDate = new Date(fiscalYear + 1, startMonth - 1, 1);
  endDate.setDate(endDate.getDate() - 1);
  
  return {
    year: fiscalYear,
    startDate,
    endDate
  };
}

/**
 * Generates an array of date periods (e.g., months, quarters) within a date range
 * 
 * @param dateRange - Start and end dates defining the overall range
 * @param interval - Time interval for the periods (month, quarter, year)
 * @returns Array of period objects with startDate, endDate, and label
 * @throws ValidationError if dateRange is invalid
 */
export function getDatePeriods(
  dateRange: DateRange,
  interval: TimeInterval
): Array<{ startDate: Date; endDate: Date; label: string }> {
  const startDate = parseISO(dateRange.startDate);
  const endDate = parseISO(dateRange.endDate);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    throw new ValidationError('Invalid date range provided for period generation');
  }
  
  const periods: Array<{ startDate: Date; endDate: Date; label: string }> = [];
  
  // Start from the beginning of the period that contains startDate
  let currentDate = getStartOfPeriod(startDate, interval);
  
  // Generate periods until we reach or pass the end date
  while (!isAfter(currentDate, endDate)) {
    const periodStart = currentDate;
    let periodEnd: Date;
    let label: string;
    
    switch (interval) {
      case TimeInterval.MONTHLY:
        periodEnd = endOfMonth(currentDate);
        label = format(currentDate, 'MMM yyyy'); // "Jan 2023"
        currentDate = addDays(endOfMonth(currentDate), 1); // Start of next month
        break;
        
      case TimeInterval.QUARTERLY:
        periodEnd = endOfQuarter(currentDate);
        label = `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${format(currentDate, 'yyyy')}`; // "Q1 2023"
        currentDate = addDays(endOfQuarter(currentDate), 1); // Start of next quarter
        break;
        
      case TimeInterval.YEARLY:
        periodEnd = endOfYear(currentDate);
        label = format(currentDate, 'yyyy'); // "2023"
        currentDate = addDays(endOfYear(currentDate), 1); // Start of next year
        break;
        
      default:
        periodEnd = endOfMonth(currentDate);
        label = format(currentDate, 'MMM yyyy');
        currentDate = addDays(endOfMonth(currentDate), 1);
    }
    
    periods.push({
      startDate: periodStart,
      endDate: periodEnd,
      label
    });
  }
  
  return periods;
}

/**
 * Formats a date for database storage
 * 
 * @param date - The date to format
 * @returns Formatted date string for database or null if input is invalid
 */
export function formatDateForDatabase(date: Date | string | number | null | undefined): string | null {
  if (date === null || date === undefined) {
    return null;
  }

  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return null;
  }
  
  return formatISO(dateObj);
}

/**
 * Gets the timezone offset in minutes for a specified timezone
 * 
 * @param timeZone - The timezone to get the offset for (defaults to DEFAULT_TIME_ZONE)
 * @returns Timezone offset in minutes
 */
export function getTimezoneOffset(timeZone?: string): number {
  const tz = timeZone || DEFAULT_TIME_ZONE;
  const now = new Date();
  const tzDate = utcToZonedTime(now, tz);
  
  // Calculate difference in minutes
  return (tzDate.getTime() - now.getTime()) / (1000 * 60);
}