/**
 * Unit tests for date utility functions
 * 
 * These tests verify the correctness of date utility functions used throughout the
 * HCBS Revenue Management System for consistent date handling, especially important
 * for financial reporting, billing periods, and claim management.
 */

import { 
  formatDate, 
  formatDisplayDate, 
  formatApiDate, 
  parseDate, 
  parseDisplayDate, 
  parseApiDate, 
  isValidDate, 
  getDateRangeForPeriod, 
  getDateRangeLabel, 
  calculateDateDifference, 
  isDateInRange, 
  getAgingBucket, 
  formatRelativeDate 
} from '../../../utils/date';

import {
  DEFAULT_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
  API_DATE_FORMAT,
  DATE_RANGE_PRESETS
} from '../../../config/date.config';

import {
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from 'date-fns';

describe('formatDate', () => {
  it('should format Date object with default format', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(formatDate(date)).toBe('2023-05-15');
  });

  it('should format Date object with custom format', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(formatDate(date, 'MM/dd/yyyy')).toBe('05/15/2023');
  });

  it('should format ISO date string', () => {
    expect(formatDate('2023-05-15T00:00:00.000Z')).toBe('2023-05-15');
  });

  it('should return empty string for null input', () => {
    expect(formatDate(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(formatDate('')).toBe('');
  });

  it('should return empty string for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('formatDisplayDate', () => {
  it('should format Date object to display format', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(formatDisplayDate(date)).toBe('05/15/2023');
  });

  it('should format ISO date string to display format', () => {
    expect(formatDisplayDate('2023-05-15T00:00:00.000Z')).toBe('05/15/2023');
  });

  it('should return empty string for null input', () => {
    expect(formatDisplayDate(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(formatDisplayDate(undefined)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(formatDisplayDate('')).toBe('');
  });

  it('should return empty string for invalid date string', () => {
    expect(formatDisplayDate('not-a-date')).toBe('');
  });
});

describe('formatApiDate', () => {
  it('should format Date object to API format', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(formatApiDate(date)).toBe('2023-05-15');
  });

  it('should format ISO date string to API format', () => {
    expect(formatApiDate('2023-05-15T00:00:00.000Z')).toBe('2023-05-15');
  });

  it('should return empty string for null input', () => {
    expect(formatApiDate(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(formatApiDate(undefined)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(formatApiDate('')).toBe('');
  });

  it('should return empty string for invalid date string', () => {
    expect(formatApiDate('not-a-date')).toBe('');
  });
});

describe('parseDate', () => {
  it('should parse valid date string with default format', () => {
    const dateStr = '2023-05-15';
    const parsedDate = parseDate(dateStr);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2023);
    expect(parsedDate?.getMonth()).toBe(4); // May (0-based)
    expect(parsedDate?.getDate()).toBe(15);
  });

  it('should parse valid date string with custom format', () => {
    const dateStr = '05/15/2023';
    const parsedDate = parseDate(dateStr, 'MM/dd/yyyy');
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2023);
    expect(parsedDate?.getMonth()).toBe(4); // May (0-based)
    expect(parsedDate?.getDate()).toBe(15);
  });

  it('should return null for null input', () => {
    expect(parseDate(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseDate(undefined)).toBeNull();
  });

  it('should return null for empty string input', () => {
    expect(parseDate('')).toBeNull();
  });

  it('should return null for invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('should return null for date string with incorrect format', () => {
    expect(parseDate('15/05/2023')).toBeNull(); // Incorrect format for default
  });
});

describe('parseDisplayDate', () => {
  it('should parse valid display-formatted date string', () => {
    const dateStr = '05/15/2023';
    const parsedDate = parseDisplayDate(dateStr);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2023);
    expect(parsedDate?.getMonth()).toBe(4); // May (0-based)
    expect(parsedDate?.getDate()).toBe(15);
  });

  it('should return null for null input', () => {
    expect(parseDisplayDate(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseDisplayDate(undefined)).toBeNull();
  });

  it('should return null for empty string input', () => {
    expect(parseDisplayDate('')).toBeNull();
  });

  it('should return null for invalid date string', () => {
    expect(parseDisplayDate('not-a-date')).toBeNull();
  });
});

describe('parseApiDate', () => {
  it('should parse valid API-formatted date string', () => {
    const dateStr = '2023-05-15';
    const parsedDate = parseApiDate(dateStr);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2023);
    expect(parsedDate?.getMonth()).toBe(4); // May (0-based)
    expect(parsedDate?.getDate()).toBe(15);
  });

  it('should return null for null input', () => {
    expect(parseApiDate(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseApiDate(undefined)).toBeNull();
  });

  it('should return null for empty string input', () => {
    expect(parseApiDate('')).toBeNull();
  });

  it('should return null for invalid date string', () => {
    expect(parseApiDate('not-a-date')).toBeNull();
  });
});

describe('isValidDate', () => {
  it('should return true for valid Date object', () => {
    expect(isValidDate(new Date())).toBe(true);
  });

  it('should return true for valid date string', () => {
    expect(isValidDate('2023-05-15')).toBe(true);
  });

  it('should return false for invalid Date object', () => {
    expect(isValidDate(new Date('invalid-date'))).toBe(false);
  });

  it('should return false for invalid date string', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('should return false for null input', () => {
    expect(isValidDate(null)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(isValidDate(undefined)).toBe(false);
  });

  it('should return false for empty string input', () => {
    expect(isValidDate('')).toBe(false);
  });

  it('should return false for non-date values (number, object, etc.)', () => {
    expect(isValidDate(123)).toBe(false);
    expect(isValidDate({})).toBe(false);
    expect(isValidDate([])).toBe(false);
    expect(isValidDate(true)).toBe(false);
  });
});

describe('getDateRangeForPeriod', () => {
  // Mock the current date to ensure consistent test results
  const originalDate = global.Date;
  const mockDate = new Date(2023, 4, 15); // May 15, 2023

  beforeAll(() => {
    // @ts-ignore
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(mockDate);
        }
        // @ts-ignore
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  it('should return today\'s start and end for "today" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('today');
    expect(startDate).toEqual(startOfDay(mockDate));
    expect(endDate).toEqual(endOfDay(mockDate));
  });

  it('should return yesterday\'s start and end for "yesterday" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('yesterday');
    const yesterday = subDays(mockDate, 1);
    expect(startDate).toEqual(startOfDay(yesterday));
    expect(endDate).toEqual(endOfDay(yesterday));
  });

  it('should return correct date range for "last7days" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('last7days');
    const sixDaysAgo = subDays(mockDate, 6);
    expect(startDate).toEqual(startOfDay(sixDaysAgo));
    expect(endDate).toEqual(endOfDay(mockDate));
  });

  it('should return correct date range for "last30days" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('last30days');
    const twentyNineDaysAgo = subDays(mockDate, 29);
    expect(startDate).toEqual(startOfDay(twentyNineDaysAgo));
    expect(endDate).toEqual(endOfDay(mockDate));
  });

  it('should return correct date range for "thisWeek" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('thisWeek');
    expect(startDate).toEqual(startOfWeek(mockDate, { weekStartsOn: 0 }));
    expect(endDate).toEqual(endOfWeek(mockDate, { weekStartsOn: 0 }));
  });

  it('should return correct date range for "lastWeek" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('lastWeek');
    const lastWeek = subDays(mockDate, 7);
    expect(startDate).toEqual(startOfWeek(lastWeek, { weekStartsOn: 0 }));
    expect(endDate).toEqual(endOfWeek(lastWeek, { weekStartsOn: 0 }));
  });

  it('should return correct date range for "thisMonth" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('thisMonth');
    expect(startDate).toEqual(startOfMonth(mockDate));
    expect(endDate).toEqual(endOfMonth(mockDate));
  });

  it('should return correct date range for "lastMonth" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('lastMonth');
    const lastMonth = subDays(startOfMonth(mockDate), 1);
    expect(startDate).toEqual(startOfMonth(lastMonth));
    expect(endDate).toEqual(endOfMonth(lastMonth));
  });

  it('should return correct date range for "thisYear" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('thisYear');
    expect(startDate).toEqual(startOfYear(mockDate));
    expect(endDate).toEqual(endOfYear(mockDate));
  });

  it('should return correct date range for "lastYear" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('lastYear');
    const lastYear = subDays(startOfYear(mockDate), 1);
    expect(startDate).toEqual(startOfYear(lastYear));
    expect(endDate).toEqual(endOfYear(lastYear));
  });

  it('should return today as default for "custom" period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('custom');
    expect(startDate).toEqual(startOfDay(mockDate));
    expect(endDate).toEqual(endOfDay(mockDate));
  });

  it('should return today as default for unknown period', () => {
    const { startDate, endDate } = getDateRangeForPeriod('unknown');
    expect(startDate).toEqual(startOfDay(mockDate));
    expect(endDate).toEqual(endOfDay(mockDate));
  });
});

describe('getDateRangeLabel', () => {
  it('should return label for same start and end date', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(getDateRangeLabel(date, date)).toBe('05/15/2023');
  });

  it('should return label for different start and end dates', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(getDateRangeLabel(startDate, endDate)).toBe('05/15/2023 - 05/20/2023');
  });

  it('should return empty string for null start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(getDateRangeLabel(null, endDate)).toBe('');
  });

  it('should return empty string for null end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(getDateRangeLabel(startDate, null)).toBe('');
  });

  it('should return empty string for undefined start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(getDateRangeLabel(undefined, endDate)).toBe('');
  });

  it('should return empty string for undefined end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(getDateRangeLabel(startDate, undefined)).toBe('');
  });

  it('should return empty string for invalid start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    // @ts-ignore - Testing with invalid date
    expect(getDateRangeLabel(new Date('invalid'), endDate)).toBe('');
  });

  it('should return empty string for invalid end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    // @ts-ignore - Testing with invalid date
    expect(getDateRangeLabel(startDate, new Date('invalid'))).toBe('');
  });
});

describe('calculateDateDifference', () => {
  it('should calculate difference between two Date objects', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(calculateDateDifference(startDate, endDate)).toBe(5);
  });

  it('should calculate difference between two date strings', () => {
    expect(calculateDateDifference('2023-05-15', '2023-05-20')).toBe(5);
  });

  it('should calculate difference with start date after end date (absolute value)', () => {
    const startDate = new Date(2023, 4, 20); // May 20, 2023
    const endDate = new Date(2023, 4, 15); // May 15, 2023
    expect(calculateDateDifference(startDate, endDate)).toBe(5);
  });

  it('should calculate difference with same start and end date returns 0', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    expect(calculateDateDifference(date, date)).toBe(0);
  });

  it('should return 0 for null start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(calculateDateDifference(null, endDate)).toBe(0);
  });

  it('should return 0 for null end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(calculateDateDifference(startDate, null)).toBe(0);
  });

  it('should return 0 for undefined start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(calculateDateDifference(undefined, endDate)).toBe(0);
  });

  it('should return 0 for undefined end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(calculateDateDifference(startDate, undefined)).toBe(0);
  });

  it('should return 0 for invalid start date', () => {
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(calculateDateDifference('not-a-date', endDate)).toBe(0);
  });

  it('should return 0 for invalid end date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(calculateDateDifference(startDate, 'not-a-date')).toBe(0);
  });
});

describe('isDateInRange', () => {
  it('should return true for date within range', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, startDate, endDate)).toBe(true);
  });

  it('should return true for date equal to start date', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, startDate, endDate)).toBe(true);
  });

  it('should return true for date equal to end date', () => {
    const date = new Date(2023, 4, 20); // May 20, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, startDate, endDate)).toBe(true);
  });

  it('should return false for date before range', () => {
    const date = new Date(2023, 4, 10); // May 10, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, startDate, endDate)).toBe(false);
  });

  it('should return false for date after range', () => {
    const date = new Date(2023, 4, 25); // May 25, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, startDate, endDate)).toBe(false);
  });

  it('should work with date strings instead of Date objects', () => {
    expect(isDateInRange('2023-05-17', '2023-05-15', '2023-05-20')).toBe(true);
    expect(isDateInRange('2023-05-10', '2023-05-15', '2023-05-20')).toBe(false);
  });

  it('should return false for null date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(null, startDate, endDate)).toBe(false);
  });

  it('should return false for null start date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, null, endDate)).toBe(false);
  });

  it('should return false for null end date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(isDateInRange(date, startDate, null)).toBe(false);
  });

  it('should return false for undefined date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(undefined, startDate, endDate)).toBe(false);
  });

  it('should return false for undefined start date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, undefined, endDate)).toBe(false);
  });

  it('should return false for undefined end date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(isDateInRange(date, startDate, undefined)).toBe(false);
  });

  it('should return false for invalid date', () => {
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange('not-a-date', startDate, endDate)).toBe(false);
  });

  it('should return false for invalid start date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const endDate = new Date(2023, 4, 20); // May 20, 2023
    expect(isDateInRange(date, 'not-a-date', endDate)).toBe(false);
  });

  it('should return false for invalid end date', () => {
    const date = new Date(2023, 4, 17); // May 17, 2023
    const startDate = new Date(2023, 4, 15); // May 15, 2023
    expect(isDateInRange(date, startDate, 'not-a-date')).toBe(false);
  });
});

describe('getAgingBucket', () => {
  // Mock the current date to ensure consistent test results
  const originalDate = global.Date;
  const mockDate = new Date(2023, 4, 15); // May 15, 2023

  beforeAll(() => {
    // @ts-ignore
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(mockDate);
        }
        // @ts-ignore
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  it('should return "0-30" for date within 0-30 days', () => {
    const date = new Date(2023, 4, 1); // May 1, 2023 (14 days ago)
    expect(getAgingBucket(date)).toBe('0-30');
  });

  it('should return "31-60" for date within 31-60 days', () => {
    const date = new Date(2023, 3, 1); // April 1, 2023 (44 days ago)
    expect(getAgingBucket(date)).toBe('31-60');
  });

  it('should return "61-90" for date within 61-90 days', () => {
    const date = new Date(2023, 2, 1); // March 1, 2023 (75 days ago)
    expect(getAgingBucket(date)).toBe('61-90');
  });

  it('should return "90+" for date older than 90 days', () => {
    const date = new Date(2023, 1, 1); // February 1, 2023 (103 days ago)
    expect(getAgingBucket(date)).toBe('90+');
  });

  it('should work with date string instead of Date object', () => {
    expect(getAgingBucket('2023-05-01')).toBe('0-30');
  });

  it('should return empty string for null date', () => {
    expect(getAgingBucket(null)).toBe('');
  });

  it('should return empty string for undefined date', () => {
    expect(getAgingBucket(undefined)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(getAgingBucket('not-a-date')).toBe('');
  });
});

describe('formatRelativeDate', () => {
  // Mock the current date to ensure consistent test results
  const originalDate = global.Date;
  const mockDate = new Date(2023, 4, 15); // May 15, 2023

  beforeAll(() => {
    // @ts-ignore
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(mockDate);
        }
        // @ts-ignore
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  it('should return "Today" for today\'s date', () => {
    const date = new Date(2023, 4, 15); // May 15, 2023 (today)
    expect(formatRelativeDate(date)).toBe('Today');
  });

  it('should return "Yesterday" for yesterday\'s date', () => {
    const date = new Date(2023, 4, 14); // May 14, 2023 (yesterday)
    expect(formatRelativeDate(date)).toBe('Yesterday');
  });

  it('should return "X days ago" for date within 30 days', () => {
    const date = new Date(2023, 4, 5); // May 5, 2023 (10 days ago)
    expect(formatRelativeDate(date)).toBe('10 days ago');
  });

  it('should return formatted date for date older than 30 days', () => {
    const date = new Date(2023, 3, 1); // April 1, 2023 (44 days ago)
    expect(formatRelativeDate(date)).toBe('04/01/2023');
  });

  it('should work with date string instead of Date object', () => {
    expect(formatRelativeDate('2023-05-15')).toBe('Today');
  });

  it('should return empty string for null date', () => {
    expect(formatRelativeDate(null)).toBe('');
  });

  it('should return empty string for undefined date', () => {
    expect(formatRelativeDate(undefined)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatRelativeDate('not-a-date')).toBe('');
  });
});