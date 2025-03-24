/**
 * Utility functions for string manipulation and validation used throughout the HCBS Revenue Management System.
 * This file provides reusable string operations with type safety, error handling, and performance optimizations
 * for common string processing tasks.
 */

import { ErrorCode } from '../types/error.types';

/**
 * Checks if a string is empty, null, or undefined
 * 
 * @param str - The string to check
 * @returns True if string is empty, null, or undefined, false otherwise
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return str === null || str === undefined || str.trim() === '';
};

/**
 * Checks if a string is not empty, null, or undefined
 * 
 * @param str - The string to check
 * @returns True if string has content, false otherwise
 */
export const isNotEmpty = (str: string | null | undefined): boolean => {
  return !isEmpty(str);
};

/**
 * Capitalizes the first letter of a string
 * 
 * @param str - The string to capitalize
 * @returns String with first letter capitalized or empty string if input is invalid
 */
export const capitalize = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  return safeStr.charAt(0).toUpperCase() + safeStr.slice(1);
};

/**
 * Truncates a string to a specified length with optional suffix
 * 
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the resulting string including suffix (default: 30)
 * @param suffix - The suffix to append to truncated string (default: '...')
 * @returns Truncated string or original string if shorter than maxLength
 */
export const truncate = (str: string | null | undefined, maxLength: number = 30, suffix: string = '...'): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // If maxLength is invalid, use default
  if (maxLength <= 0) {
    maxLength = 30;
  }
  
  // If string is shorter than maxLength, return original
  if (safeStr.length <= maxLength) {
    return safeStr;
  }
  
  // Truncate string and append suffix
  return safeStr.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Removes all non-digit characters from a string
 * 
 * @param str - The string to process
 * @returns String with only digits or empty string if input is invalid
 */
export const removeNonDigits = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  return (str as string).replace(/\D/g, '');
};

/**
 * Removes all special characters from a string
 * 
 * @param str - The string to process
 * @param allowedChars - String of allowed special characters to keep (default: '')
 * @returns String without special characters or empty string if input is invalid
 */
export const removeSpecialCharacters = (str: string | null | undefined, allowedChars: string = ''): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Escape special characters in allowedChars for use in regex
  const escapedAllowedChars = allowedChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // Create regex pattern that excludes alphanumeric and allowed special characters
  const pattern = new RegExp(`[^a-zA-Z0-9${escapedAllowedChars}]`, 'g');
  
  return safeStr.replace(pattern, '');
};

/**
 * Normalizes a string by removing special characters, extra spaces, and converting to lowercase
 * 
 * @param str - The string to normalize
 * @returns Normalized string or empty string if input is invalid
 */
export const normalizeString = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Convert to lowercase, replace multiple spaces with single space, and trim
  return safeStr.toLowerCase().replace(/\s+/g, ' ').trim();
};

/**
 * Converts a camelCase string to snake_case
 * 
 * @param str - The camelCase string to convert
 * @returns snake_case string or empty string if input is invalid
 */
export const camelToSnakeCase = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace capital letters with underscore followed by lowercase letter
  return safeStr.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * Converts a snake_case string to camelCase
 * 
 * @param str - The snake_case string to convert
 * @returns camelCase string or empty string if input is invalid
 */
export const snakeToCamelCase = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace underscore followed by letter with uppercase letter
  return safeStr.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Converts a kebab-case string to camelCase
 * 
 * @param str - The kebab-case string to convert
 * @returns camelCase string or empty string if input is invalid
 */
export const kebabToCamelCase = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace hyphen followed by letter with uppercase letter
  return safeStr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Converts a camelCase string to kebab-case
 * 
 * @param str - The camelCase string to convert
 * @returns kebab-case string or empty string if input is invalid
 */
export const camelToKebabCase = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace capital letters with hyphen followed by lowercase letter
  return safeStr.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/**
 * Formats a template string by replacing placeholders with values
 * 
 * @param template - The template string with placeholders in format ${key}
 * @param values - Object with key-value pairs to replace placeholders
 * @returns Formatted string with placeholders replaced or empty string if template is invalid
 */
export const formatTemplate = (template: string | null | undefined, values: Record<string, any>): string => {
  if (isEmpty(template)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeTemplate = template as string;
  
  // If values is null or undefined, return original template
  if (values === null || values === undefined) {
    return safeTemplate;
  }
  
  // Replace placeholders in format ${key} with corresponding values
  return safeTemplate.replace(/\${(\w+)}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : `\${${key}}`;
  });
};

/**
 * Generates a random string of specified length
 * 
 * @param length - The length of the random string (default: 10)
 * @param charset - The character set to use for generating the random string
 *                 (default: alphanumeric characters)
 * @returns Random string of specified length
 */
export const generateRandomString = (length: number = 10, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string => {
  // Ensure valid length
  if (length <= 0) {
    length = 10;
  }
  
  let result = '';
  const charsetLength = charset.length;
  
  // Generate random string by selecting random characters from charset
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  
  return result;
};

/**
 * Masks a portion of a string with a mask character
 * 
 * @param str - The string to mask
 * @param startPos - Starting position for masking (default: 0)
 * @param endPos - Ending position for masking (default: string length)
 * @param maskChar - Character to use for masking (default: '*')
 * @returns Masked string or empty string if input is invalid
 */
export const maskString = (
  str: string | null | undefined, 
  startPos: number = 0, 
  endPos?: number, 
  maskChar: string = '*'
): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Set default end position if not provided
  if (endPos === undefined || endPos < 0) {
    endPos = safeStr.length;
  }
  
  // Ensure valid positions
  startPos = Math.max(0, startPos);
  endPos = Math.min(safeStr.length, endPos);
  
  // If start is after end or both are at the beginning, return original string
  if (startPos >= endPos || (startPos === 0 && endPos === 0)) {
    return safeStr;
  }
  
  // Create masked version
  const prefix = safeStr.substring(0, startPos);
  const maskedPart = maskChar.repeat(endPos - startPos);
  const suffix = safeStr.substring(endPos);
  
  return prefix + maskedPart + suffix;
};

/**
 * Counts occurrences of a substring within a string
 * 
 * @param str - The string to search in
 * @param searchString - The substring to search for
 * @returns Number of occurrences or 0 if input is invalid
 */
export const countOccurrences = (str: string | null | undefined, searchString: string): number => {
  if (isEmpty(str) || isEmpty(searchString)) {
    return 0;
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Split by searchString and count resulting segments minus 1
  return safeStr.split(searchString).length - 1;
};

/**
 * Checks if a string contains only numeric characters
 * 
 * @param str - The string to check
 * @returns True if string contains only numeric characters, false otherwise
 */
export const isNumeric = (str: string | null | undefined): boolean => {
  if (isEmpty(str)) {
    return false;
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Use regex to test if string contains only digits
  return /^\d+$/.test(safeStr);
};

/**
 * Checks if a string contains only alphabetic characters
 * 
 * @param str - The string to check
 * @returns True if string contains only alphabetic characters, false otherwise
 */
export const isAlpha = (str: string | null | undefined): boolean => {
  if (isEmpty(str)) {
    return false;
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Use regex to test if string contains only letters
  return /^[a-zA-Z]+$/.test(safeStr);
};

/**
 * Checks if a string contains only alphanumeric characters
 * 
 * @param str - The string to check
 * @returns True if string contains only alphanumeric characters, false otherwise
 */
export const isAlphanumeric = (str: string | null | undefined): boolean => {
  if (isEmpty(str)) {
    return false;
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Use regex to test if string contains only letters and digits
  return /^[a-zA-Z0-9]+$/.test(safeStr);
};

/**
 * Escapes HTML special characters in a string
 * 
 * @param str - The string to escape
 * @returns HTML-escaped string or empty string if input is invalid
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace special characters with HTML entities
  return safeStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Unescapes HTML entities in a string
 * 
 * @param str - The string to unescape
 * @returns Unescaped string or empty string if input is invalid
 */
export const unescapeHtml = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  // Replace HTML entities with corresponding characters
  return safeStr
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

/**
 * Converts a string to a URL-friendly slug
 * 
 * @param str - The string to convert
 * @returns URL-friendly slug or empty string if input is invalid
 */
export const slugify = (str: string | null | undefined): string => {
  if (isEmpty(str)) {
    return '';
  }
  
  // Type assertion is safe here since we've checked for empty string
  const safeStr = str as string;
  
  return safeStr
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace special chars with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-+/g, '-');        // Replace multiple hyphens with single hyphen
};