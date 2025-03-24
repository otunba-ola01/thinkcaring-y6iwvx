/**
 * General-purpose formatting utility functions for the HCBS Revenue Management System frontend.
 * This file provides reusable helper functions for formatting various data types consistently
 * across the application, complementing the more specialized formatting utilities for dates, 
 * numbers, and currencies.
 */

import { formatCurrency, formatCompactCurrency } from './currency';
import { formatDate, formatDisplayDate, formatRelativeDate } from './date';
import { formatNumber, formatPercentage, formatCompactNumber, isNumeric } from './number';
import { isEmpty, truncate, maskString, formatPhoneNumber, capitalize } from './string';

/**
 * Formats a value based on its type and format specification
 * 
 * @param value - The value to format
 * @param formatType - The type of formatting to apply (currency, number, date, etc.)
 * @param options - Additional formatting options
 * @returns Formatted value as a string
 */
export const formatValue = (
  value: any,
  formatType: string,
  options: Record<string, any> = {}
): string => {
  // Return empty string for null or undefined values
  if (value === null || value === undefined) {
    return '';
  }

  // Apply formatting based on format type
  switch (formatType) {
    case 'currency':
      return formatCurrency(value, options);
    case 'compactCurrency':
      return formatCompactCurrency(value, options);
    case 'number':
      return formatNumber(value, options);
    case 'compactNumber':
      return formatCompactNumber(value, options);
    case 'percentage':
      return formatPercentage(value, options);
    case 'date':
      return formatDate(value, options.format);
    case 'displayDate':
      return formatDisplayDate(value);
    case 'relativeDate':
      return formatRelativeDate(value);
    case 'string':
    default:
      return String(value);
  }
};

/**
 * Formats a data field for display based on field type and configuration
 * 
 * @param value - The field value to format
 * @param fieldConfig - Field configuration containing format type, options, and display settings
 * @returns Formatted field value as a string
 */
export const formatDataField = (
  value: any,
  fieldConfig: {
    format?: string;
    formatOptions?: Record<string, any>;
    prefix?: string;
    suffix?: string;
    emptyValue?: string;
    truncate?: number;
  }
): string => {
  // Return empty value for null or undefined values
  if (value === null || value === undefined) {
    return fieldConfig.emptyValue || '';
  }

  // Extract format information from field config
  const formatType = fieldConfig.format || 'string';
  const formatOptions = fieldConfig.formatOptions || {};

  // Format the value
  let formattedValue = formatValue(value, formatType, formatOptions);

  // Add prefix/suffix if specified
  if (fieldConfig.prefix) {
    formattedValue = fieldConfig.prefix + formattedValue;
  }

  if (fieldConfig.suffix) {
    formattedValue += fieldConfig.suffix;
  }

  // Truncate if needed
  if (fieldConfig.truncate && formattedValue.length > fieldConfig.truncate) {
    formattedValue = truncate(formattedValue, fieldConfig.truncate);
  }

  return formattedValue;
};

/**
 * Formats an address object into a single-line or multi-line string
 * 
 * @param address - The address object to format
 * @param singleLine - Whether to format as a single line (default: false)
 * @returns Formatted address string
 */
export const formatAddress = (
  address: {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null | undefined,
  singleLine: boolean = false
): string => {
  // Return empty string for null or undefined address
  if (!address) {
    return '';
  }

  // Extract address components
  const { street, street2, city, state, zip, country } = address;

  // Filter out empty components
  const components: string[] = [];
  
  if (street) components.push(street);
  if (street2) components.push(street2);
  
  if (city || state || zip) {
    const cityStateZip: string[] = [];
    if (city) cityStateZip.push(city);
    if (state) cityStateZip.push(state);
    if (zip) cityStateZip.push(zip);
    
    components.push(cityStateZip.join(', '));
  }
  
  if (country) components.push(country);

  // Return formatted address
  if (singleLine) {
    return components.join(', ');
  } else {
    if (components.length <= 1) {
      return components.join('');
    }
    
    const streetParts = [street, street2].filter(Boolean).join('\n');
    const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
    
    const parts = [streetParts, cityStateZip];
    if (country) {
      parts.push(country);
    }
    
    return parts.filter(Boolean).join('\n');
  }
};

/**
 * Formats a name object or separate name parts into a full name string
 * 
 * @param firstName - First name or name object containing name parts
 * @param lastName - Last name (if firstName is a string)
 * @param middleName - Middle name or initial (optional)
 * @param suffix - Name suffix like Jr., Sr., III, etc. (optional)
 * @returns Formatted full name
 */
export const formatName = (
  firstName: { firstName?: string; lastName?: string; middleName?: string; suffix?: string } | string,
  lastName?: string,
  middleName?: string,
  suffix?: string
): string => {
  let first = '';
  let last = '';
  let middle = '';
  let nameSuffix = '';

  // Extract name parts from object or parameters
  if (typeof firstName === 'object' && firstName !== null) {
    first = firstName.firstName || '';
    last = firstName.lastName || '';
    middle = firstName.middleName || '';
    nameSuffix = firstName.suffix || '';
  } else {
    first = firstName || '';
    last = lastName || '';
    middle = middleName || '';
    nameSuffix = suffix || '';
  }

  // Build name parts array and filter out empty parts
  const nameParts = [];
  
  if (first) nameParts.push(first);
  if (middle) nameParts.push(middle);
  if (last) nameParts.push(last);
  if (nameSuffix) nameParts.push(nameSuffix);

  return nameParts.join(' ');
};

/**
 * Formats a phone number with optional extension
 * 
 * @param phone - The phone number to format
 * @param extension - The phone extension (optional)
 * @returns Formatted phone with extension
 */
export const formatPhoneWithExt = (
  phone: string | null | undefined,
  extension?: string | null
): string => {
  // Return empty string for empty phone
  if (isEmpty(phone)) {
    return '';
  }

  // Use formatPhoneNumber from string utils for consistent formatting
  const formattedPhone = formatPhoneNumber(phone as string);
  
  // Add extension if provided
  if (extension && extension.trim()) {
    return `${formattedPhone} ext. ${extension}`;
  }
  
  return formattedPhone;
};

/**
 * Formats a file size in bytes to a human-readable string
 * 
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted file size (e.g., '1.5 MB')
 */
export const formatFileSize = (
  bytes: number | null | undefined,
  decimals: number = 2
): string => {
  // Return '0 Bytes' for null, undefined, or zero bytes
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 Bytes';
  }

  // Define units and calculate the appropriate unit
  const k = 1024;
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Format the number with the calculated unit
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${units[i]}`;
};

/**
 * Formats an array of items into a string with a specified separator and conjunction
 * 
 * @param items - The array of items to format
 * @param separator - The separator to use between items (default: ', ')
 * @param conjunction - The conjunction to use before the last item (default: none)
 * @returns Formatted list string
 */
export const formatList = (
  items: Array<any> | null | undefined,
  separator: string = ', ',
  conjunction?: string
): string => {
  // Return empty string for null, undefined, or empty array
  if (!items || items.length === 0) {
    return '';
  }

  // Convert all items to strings
  const stringItems = items.map(item => String(item));
  
  // Join items with separator and conjunction
  if (conjunction && stringItems.length > 1) {
    const lastItem = stringItems.pop();
    return `${stringItems.join(separator)}${separator}${conjunction} ${lastItem}`;
  } else {
    return stringItems.join(separator);
  }
};

/**
 * Formats a duration in minutes to a human-readable string
 * 
 * @param minutes - The duration in minutes
 * @param showSeconds - Whether to include seconds in the output (default: false)
 * @returns Formatted duration string (e.g., '2h 30m')
 */
export const formatDuration = (
  minutes: number | null | undefined,
  showSeconds: boolean = false
): string => {
  // Return '0m' for null, undefined, or zero minutes
  if (minutes === null || minutes === undefined || minutes === 0) {
    return '0m';
  }

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const seconds = Math.floor((minutes * 60) % 60);
  
  // Build the duration string
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  result += `${mins}m`;
  
  if (showSeconds && seconds > 0) {
    result += ` ${seconds}s`;
  }
  
  return result;
};

/**
 * Formats a status code into a human-readable status label
 * 
 * @param status - The status code to format
 * @param statusMap - Optional mapping of status codes to display labels
 * @returns Formatted status label
 */
export const formatStatus = (
  status: string | null | undefined,
  statusMap?: Record<string, string>
): string => {
  // Return empty string for empty status
  if (isEmpty(status)) {
    return '';
  }

  // Use status map if provided
  if (statusMap && statusMap[status as string]) {
    return statusMap[status as string];
  }
  
  // Otherwise, format the status string
  // Convert to string, capitalize each word, and replace underscores and hyphens with spaces
  return String(status)
    .split(/[-_]/)
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Formats an ID with a specified prefix and padding
 * 
 * @param id - The ID to format
 * @param prefix - Prefix to add before the ID (optional)
 * @param padding - Number of digits to pad the ID to (default: 0, no padding)
 * @returns Formatted ID (e.g., 'CLM-0001')
 */
export const formatId = (
  id: string | number | null | undefined,
  prefix?: string,
  padding: number = 0
): string => {
  // Return empty string for empty ID
  if (id === null || id === undefined || id === '') {
    return '';
  }

  // Convert to string if it's a number
  const idStr = typeof id === 'number' ? id.toString() : id;
  
  // Pad with leading zeros if padding is specified
  let paddedId = idStr;
  if (padding > 0) {
    paddedId = idStr.padStart(padding, '0');
  }
  
  // Add prefix if specified
  if (prefix) {
    return `${prefix}${paddedId}`;
  }
  
  return paddedId;
};

/**
 * Formats a boolean value as a string with custom true/false labels
 * 
 * @param value - The boolean value to format
 * @param trueLabel - The label to use for true values (default: 'Yes')
 * @param falseLabel - The label to use for false values (default: 'No')
 * @returns Formatted boolean string
 */
export const formatBoolean = (
  value: boolean | string | number | null | undefined,
  trueLabel: string = 'Yes',
  falseLabel: string = 'No'
): string => {
  // Convert value to boolean
  const boolValue = value === true || value === 1 || value === '1' || value === 'true';
  
  // Return appropriate label
  return boolValue ? trueLabel : falseLabel;
};

/**
 * Formats sensitive data with appropriate masking based on data type
 * 
 * @param value - The sensitive data to format
 * @param dataType - The type of sensitive data (ssn, creditCard, phone, email)
 * @param showFull - Whether to show the full data without masking (default: false)
 * @returns Masked sensitive data
 */
export const formatSensitiveData = (
  value: string | null | undefined,
  dataType: string,
  showFull: boolean = false
): string => {
  // Return empty string for empty value
  if (isEmpty(value)) {
    return '';
  }

  // Return unmasked value if showFull is true
  if (showFull) {
    return value as string;
  }

  // Apply masking based on data type
  switch (dataType.toLowerCase()) {
    case 'ssn':
      // Mask all but last 4 digits (XXX-XX-1234)
      return maskString(value as string, 0, 4, 'X');
    case 'creditcard':
      // Mask all but last 4 digits (XXXX-XXXX-XXXX-1234)
      return maskString(value as string, 0, 4, 'X');
    case 'phone':
      // Mask middle digits ((XXX) XXX-1234)
      const digits = (value as string).replace(/\D/g, '');
      if (digits.length === 10) {
        const firstPart = digits.slice(0, 3);
        const lastPart = digits.slice(6);
        return `(${firstPart}) XXX-${lastPart}`;
      }
      return maskString(value as string, 0, 4, 'X');
    case 'email':
      // Mask username portion (xx...xx@domain.com)
      const parts = (value as string).split('@');
      if (parts.length === 2) {
        const username = parts[0];
        const domain = parts[1];
        if (username.length <= 2) {
          return `${username}@${domain}`;
        }
        return `${username.charAt(0)}${maskString(username.slice(1, -1), 0, 0, 'x')}${username.charAt(username.length - 1)}@${domain}`;
      }
      return maskString(value as string, 2, 2, 'x');
    default:
      // Default masking
      return maskString(value as string, 0, 4, 'X');
  }
};