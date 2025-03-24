/**
 * Utility functions for formatting various data types in the HCBS Revenue Management System backend.
 * This file provides standardized formatting functions for consistent data presentation
 * across the application, including currency, numbers, dates, identifiers, and other 
 * common data types used in healthcare financial operations.
 */

import { format } from 'date-fns'; // version 2.30+
import { ValidationError } from '../errors/validation-error';
import { isEmpty } from './string';
import { roundToDecimal, roundCurrency } from './math';
import { formatDate, formatDisplayDate } from './date';

// Default formatting options
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_CURRENCY_DISPLAY = 'symbol';
export const DEFAULT_DECIMAL_PLACES = 2;
export const DEFAULT_PERCENTAGE_DECIMAL_PLACES = 1;

/**
 * Formats a number as currency with proper symbol and decimal places
 * 
 * @param value - The number or string value to format as currency
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options?: {
    currency?: string;
    locale?: string;
    decimals?: number;
    display?: 'symbol' | 'code' | 'name';
  }
): string {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    // Return formatted zero amount
    const currency = options?.currency || DEFAULT_CURRENCY;
    const locale = options?.locale || DEFAULT_LOCALE;
    const display = options?.display || DEFAULT_CURRENCY_DISPLAY;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: display
    }).format(0);
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return formatCurrency(0, options);
  }

  // Prepare formatting options
  const currency = options?.currency || DEFAULT_CURRENCY;
  const locale = options?.locale || DEFAULT_LOCALE;
  const decimals = options?.decimals ?? DEFAULT_DECIMAL_PLACES;
  const display = options?.display || DEFAULT_CURRENCY_DISPLAY;
  
  // Round the value to the specified number of decimal places
  const roundedValue = roundToDecimal(numValue, decimals);
  
  // Format using Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: display,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(roundedValue);
}

/**
 * Formats a number with thousands separators and specified decimal places
 * 
 * @param value - The number or string value to format
 * @param decimals - Number of decimal places (default: DEFAULT_DECIMAL_PLACES)
 * @param locale - Locale for formatting (default: DEFAULT_LOCALE)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = DEFAULT_DECIMAL_PLACES,
  locale: string = DEFAULT_LOCALE
): string {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '0';
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return '0';
  }

  // Round the value to the specified number of decimal places
  const roundedValue = roundToDecimal(numValue, decimals);
  
  // Format using Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(roundedValue);
}

/**
 * Formats a number as a percentage with specified decimal places
 * 
 * @param value - The number or string value to format as percentage
 * @param decimals - Number of decimal places (default: DEFAULT_PERCENTAGE_DECIMAL_PLACES)
 * @param locale - Locale for formatting (default: DEFAULT_LOCALE)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = DEFAULT_PERCENTAGE_DECIMAL_PLACES,
  locale: string = DEFAULT_LOCALE
): string {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '0%';
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return '0%';
  }

  // Convert to decimal form if value is already a percentage (e.g., 50 → 0.5)
  const decimalValue = numValue > 1 && numValue <= 100 ? numValue / 100 : numValue;
  
  // Format using Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(decimalValue);
}

/**
 * Formats a number in compact notation (e.g., 1K, 1M) for display in reports
 * 
 * @param value - The number or string value to format
 * @param locale - Locale for formatting (default: DEFAULT_LOCALE)
 * @returns Compact formatted number string
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  locale: string = DEFAULT_LOCALE
): string {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '0';
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return '0';
  }

  // Format using Intl.NumberFormat with compact notation
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(numValue);
}

/**
 * Formats a currency value in compact notation (e.g., $1K, $1M) for display in reports
 * 
 * @param value - The number or string value to format as compact currency
 * @param options - Formatting options
 * @returns Compact formatted currency string
 */
export function formatCompactCurrency(
  value: number | string | null | undefined,
  options?: {
    currency?: string;
    locale?: string;
    display?: 'symbol' | 'code' | 'name';
  }
): string {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatCompactCurrency(0, options);
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return formatCompactCurrency(0, options);
  }

  // Prepare formatting options
  const currency = options?.currency || DEFAULT_CURRENCY;
  const locale = options?.locale || DEFAULT_LOCALE;
  const display = options?.display || DEFAULT_CURRENCY_DISPLAY;
  
  // Format using Intl.NumberFormat with compact notation
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: display,
    notation: 'compact',
    compactDisplay: 'short'
  }).format(numValue);
}

/**
 * Formats a phone number string into a standardized format (XXX) XXX-XXXX
 * 
 * @param phoneNumber - The phone number string to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (isEmpty(phoneNumber)) {
    return '';
  }

  // Remove all non-digit characters
  const cleaned = (phoneNumber as string).replace(/\D/g, '');
  
  // Check if the resulting string has 10 digits (standard US phone)
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // If not 10 digits, return the original cleaned number
  return cleaned;
}

/**
 * Formats a Social Security Number into XXX-XX-XXXX format with optional masking
 * 
 * @param ssn - The SSN string to format
 * @param mask - Whether to mask the first 5 digits with X (default: false)
 * @returns Formatted SSN
 */
export function formatSSN(ssn: string | null | undefined, mask: boolean = false): string {
  if (isEmpty(ssn)) {
    return '';
  }

  // Remove all non-digit characters
  const cleaned = (ssn as string).replace(/\D/g, '');
  
  // Check if the resulting string has 9 digits (standard SSN)
  if (cleaned.length === 9) {
    let formatted: string;
    
    if (mask) {
      // Mask first 5 digits if requested (XXX-XX-1234)
      formatted = `XXX-XX-${cleaned.substring(5, 9)}`;
    } else {
      // Format as XXX-XX-XXXX
      formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5, 9)}`;
    }
    
    return formatted;
  }
  
  // If not 9 digits, return the original cleaned number
  return cleaned;
}

/**
 * Formats a Medicaid ID according to state-specific rules
 * 
 * @param medicaidId - The Medicaid ID to format
 * @param stateCode - Two-letter state code for state-specific formatting
 * @returns Formatted Medicaid ID
 */
export function formatMedicaidID(medicaidId: string | null | undefined, stateCode?: string): string {
  if (isEmpty(medicaidId)) {
    return '';
  }

  // Clean input by removing spaces and special characters
  const cleaned = (medicaidId as string).replace(/[\s-]/g, '');
  
  // Apply state-specific formatting if stateCode is provided
  if (stateCode) {
    switch (stateCode.toUpperCase()) {
      case 'NY': // New York example
        // Format as AA-NNNNNNN-A if it matches the pattern
        if (/^[A-Za-z]{2}\d{7}[A-Za-z]$/.test(cleaned)) {
          return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 9)}-${cleaned.substring(9, 10)}`;
        }
        break;
        
      case 'CA': // California example
        // Format as NNNNNNNNN if it's just digits
        if (/^\d{9}$/.test(cleaned)) {
          return cleaned;
        }
        break;
        
      case 'TX': // Texas example
        // Format as XXXXXXXXX if it's 9 characters
        if (cleaned.length === 9) {
          return cleaned;
        }
        break;
        
      // Add more state-specific formatting as needed
    }
  }
  
  // If no state-specific rules applied or no state provided, apply generic formatting
  if (cleaned.length > 0) {
    // No specific formatting - return cleaned ID
    return cleaned;
  }
  
  return '';
}

/**
 * Formats an address object into a single-line or multi-line string
 * 
 * @param address - Address object with street, city, state, zip
 * @param multiline - Whether to format as multiple lines (default: false)
 * @returns Formatted address string
 */
export function formatAddress(
  address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null | undefined,
  multiline: boolean = false
): string {
  if (!address) {
    return '';
  }

  const { street1, street2, city, state, zipCode, country } = address;
  
  // Validate that we have at least minimal address information
  if (isEmpty(street1) || isEmpty(city) || isEmpty(state)) {
    return '';
  }
  
  // Build address components array
  const components: string[] = [];
  
  if (!isEmpty(street1)) {
    components.push(street1 as string);
  }
  
  if (!isEmpty(street2)) {
    components.push(street2 as string);
  }
  
  const cityStateZip = [
    city,
    state,
    zipCode
  ].filter(part => !isEmpty(part)).join(', ');
  
  if (!isEmpty(cityStateZip)) {
    components.push(cityStateZip);
  }
  
  if (!isEmpty(country) && country !== 'USA' && country !== 'US') {
    components.push(country as string);
  }
  
  // Join components with the appropriate separator
  if (multiline) {
    return components.join('\n');
  } else {
    return components.join(', ');
  }
}

/**
 * Formats a person's name from separate fields or an object
 * 
 * @param firstName - First name or object containing name components
 * @param lastName - Last name (if firstName is a string)
 * @param middleName - Optional middle name (if firstName is a string)
 * @param suffix - Optional suffix like Jr., Sr., etc. (if firstName is a string)
 * @returns Formatted name
 */
export function formatName(
  firstName: string | {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    suffix?: string;
  } | null | undefined,
  lastName?: string,
  middleName?: string,
  suffix?: string
): string {
  // Handle object input
  if (firstName !== null && typeof firstName === 'object') {
    lastName = firstName.lastName;
    middleName = firstName.middleName;
    suffix = firstName.suffix;
    firstName = firstName.firstName;
  }
  
  // Handle empty inputs
  if (isEmpty(firstName) && isEmpty(lastName)) {
    return '';
  }
  
  // Build name components
  const components: string[] = [];
  
  if (!isEmpty(firstName)) {
    components.push(firstName as string);
  }
  
  if (!isEmpty(middleName)) {
    components.push(middleName as string);
  }
  
  if (!isEmpty(lastName)) {
    components.push(lastName as string);
  }
  
  if (!isEmpty(suffix)) {
    components.push(suffix as string);
  }
  
  return components.join(' ');
}

/**
 * Formats a claim number with proper prefix and padding
 * 
 * @param claimNumber - The claim number to format
 * @param prefix - Prefix to add to the claim number (default: 'CLM-')
 * @param padding - Number of digits to pad the numeric portion to (default: 6)
 * @returns Formatted claim number
 */
export function formatClaimNumber(
  claimNumber: string | number | null | undefined,
  prefix: string = 'CLM-',
  padding: number = 6
): string {
  if (claimNumber === null || claimNumber === undefined || claimNumber === '') {
    return '';
  }
  
  // Convert to string if it's a number
  const claimStr = typeof claimNumber === 'number' 
    ? claimNumber.toString() 
    : claimNumber;
  
  // Extract numeric portion if it has a prefix already
  const numericPortion = claimStr.replace(/^[A-Za-z\-]+/, '');
  
  // Pad the numeric portion with leading zeros
  const paddedNumber = numericPortion.padStart(padding, '0');
  
  // Return formatted claim number
  return `${prefix}${paddedNumber}`;
}

/**
 * Formats a service code according to standard healthcare code formats
 * 
 * @param code - The service code to format
 * @param codeType - The type of code ('CPT', 'HCPCS', 'REVENUE', etc.)
 * @returns Formatted service code
 */
export function formatServiceCode(
  code: string | null | undefined,
  codeType?: string
): string {
  if (isEmpty(code)) {
    return '';
  }
  
  // Clean the input by removing spaces and special characters
  const cleaned = (code as string).replace(/[\s-]/g, '');
  
  // Format based on code type
  if (codeType) {
    switch (codeType.toUpperCase()) {
      case 'CPT': // Current Procedural Terminology
        // CPT codes are typically 5 digits
        if (/^\d{5}$/.test(cleaned)) {
          return cleaned;
        }
        break;
        
      case 'HCPCS': // Healthcare Common Procedure Coding System
        // HCPCS Level II codes are typically a letter followed by 4 digits
        if (/^[A-Z]\d{4}$/.test(cleaned.toUpperCase())) {
          return cleaned.toUpperCase();
        }
        break;
        
      case 'REVENUE': // Revenue codes
        // Revenue codes are typically 4 digits
        if (/^\d{4}$/.test(cleaned)) {
          return cleaned;
        }
        // If it's 3 digits, pad with a leading zero
        else if (/^\d{3}$/.test(cleaned)) {
          return cleaned.padStart(4, '0');
        }
        break;
    }
  }
  
  // If no specific formatting applied, return the cleaned code
  return cleaned;
}

/**
 * Formats a file size in bytes to a human-readable string
 * 
 * @param bytes - The file size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  
  // Define size units
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  // If the size is 0, return '0 B'
  if (bytes === 0) {
    return '0 B';
  }
  
  // Calculate the appropriate unit
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // Don't go beyond the largest unit we have
  const unitIndex = Math.min(i, units.length - 1);
  
  // Calculate the value in the selected unit
  const size = bytes / Math.pow(1024, unitIndex);
  
  // Format with appropriate precision
  // Use 2 decimal places for MB and larger, 0 for KB and B
  const precision = unitIndex >= 2 ? 2 : 0;
  
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

/**
 * Formats a duration in minutes to a human-readable string
 * 
 * @param minutes - The duration in minutes
 * @returns Formatted duration (e.g., "1h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return '0m';
  }
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    // If less than an hour, just show minutes
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    // If even hours, just show hours
    return `${hours}h`;
  } else {
    // Show both hours and minutes
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Formats a boolean value as a string with custom labels
 * 
 * @param value - The boolean value to format
 * @param trueLabel - Label to use for true values (default: 'Yes')
 * @param falseLabel - Label to use for false values (default: 'No')
 * @returns Formatted boolean value
 */
export function formatBoolean(
  value: boolean | string | number | null | undefined,
  trueLabel: string = 'Yes',
  falseLabel: string = 'No'
): string {
  // Convert various input types to boolean
  const boolValue = value === true || 
                    value === 1 || 
                    value === '1' || 
                    value === 'true' || 
                    value === 'yes' || 
                    value === 'y';
  
  return boolValue ? trueLabel : falseLabel;
}

/**
 * Formats an array of items into a comma-separated string
 * 
 * @param items - Array of items to format
 * @param separator - Separator to use between items (default: ', ')
 * @param formatter - Optional function to format each item
 * @returns Formatted list string
 */
export function formatList<T>(
  items: T[] | null | undefined,
  separator: string = ', ',
  formatter?: (item: T) => string
): string {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }
  
  // Map items to strings, applying formatter if provided
  const strings = items.map(item => {
    if (item === null || item === undefined) {
      return '';
    }
    
    return formatter ? formatter(item) : String(item);
  });
  
  // Filter out empty strings and join with separator
  return strings.filter(str => str !== '').join(separator);
}

/**
 * Formats a JSON object as a string with optional indentation
 * 
 * @param data - The data to format as JSON
 * @param space - Indentation spaces or string (default: 2)
 * @returns Formatted JSON string
 */
export function formatJSON(
  data: object | null | undefined,
  space: number | string = 2
): string {
  if (data === null || data === undefined) {
    return '';
  }
  
  try {
    return JSON.stringify(data, null, space);
  } catch (error) {
    return '';
  }
}

/**
 * Formats an enum value to a human-readable string
 * 
 * @param value - The enum value to format
 * @param enumMapping - Mapping of enum values to display strings
 * @returns Formatted enum value
 */
export function formatEnum(
  value: string | null | undefined,
  enumMapping: Record<string, string>
): string {
  if (isEmpty(value)) {
    return '';
  }
  
  const stringValue = value as string;
  
  // Return mapped value if it exists, otherwise return original value
  return enumMapping[stringValue] || stringValue;
}

/**
 * Formats an error object into a consistent error message string
 * 
 * @param error - The error object or string to format
 * @returns Formatted error message
 */
export function formatError(error: Error | string | null | undefined): string {
  if (error === null || error === undefined) {
    return 'An unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof ValidationError && error.validationErrors && error.validationErrors.length > 0) {
    // Format validation errors
    const errorMessages = error.validationErrors.map(err => {
      return `${err.field ? `${err.field}: ` : ''}${err.message}`;
    });
    
    return errorMessages.join('; ');
  }
  
  // Return error message property for Error objects
  return error.message || 'An unknown error occurred';
}