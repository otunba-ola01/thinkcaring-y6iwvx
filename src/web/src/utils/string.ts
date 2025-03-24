/**
 * Utility functions for string manipulation and formatting
 * 
 * This module provides a collection of utility functions for common string operations
 * used throughout the HCBS Revenue Management System frontend.
 * 
 * @packageDocumentation
 * @version 1.0.0
 */

/**
 * Checks if a string is empty, null, or undefined
 * @param str - The string to check
 * @returns True if the string is empty, null, or undefined
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return str === null || str === undefined || str.length === 0;
};

/**
 * Checks if a string is not empty (has at least one character)
 * @param str - The string to check
 * @returns True if the string has at least one character
 */
export const isNotEmpty = (str: string | null | undefined): boolean => {
  return !isEmpty(str);
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 */
export const capitalize = (str: string): string => {
  if (isEmpty(str)) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts a string to camelCase
 * @param str - The string to convert
 * @returns String in camelCase format
 */
export const camelCase = (str: string): string => {
  if (isEmpty(str)) return '';
  
  // Replace non-alphanumeric characters with spaces
  const normalized = str.replace(/[^a-zA-Z0-9]+/g, ' ');
  
  // Split by spaces, capitalize each word except first, then join
  const words = normalized.split(' ').filter(Boolean);
  return words.map((word, index) => {
    if (index === 0) return word.toLowerCase();
    return capitalize(word.toLowerCase());
  }).join('');
};

/**
 * Converts a string to snake_case
 * @param str - The string to convert
 * @returns String in snake_case format
 */
export const snakeCase = (str: string): string => {
  if (isEmpty(str)) return '';
  
  // Replace non-alphanumeric characters with spaces, convert to lowercase, replace spaces with underscores
  return str.replace(/[^a-zA-Z0-9]+/g, ' ').toLowerCase().replace(/\s+/g, '_');
};

/**
 * Converts a string to kebab-case
 * @param str - The string to convert
 * @returns String in kebab-case format
 */
export const kebabCase = (str: string): string => {
  if (isEmpty(str)) return '';
  
  // Replace non-alphanumeric characters with spaces, convert to lowercase, replace spaces with hyphens
  return str.replace(/[^a-zA-Z0-9]+/g, ' ').toLowerCase().replace(/\s+/g, '-');
};

/**
 * Truncates a string to a specified length with an optional suffix
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the resulting string
 * @param suffix - The suffix to add to truncated strings (default: '...')
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number, suffix: string = '...'): string => {
  if (isEmpty(str)) return '';
  if (str.length <= maxLength) return str;
  
  return str.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Formats a phone number string into a standardized format
 * @param phone - The phone number to format
 * @returns Formatted phone number (e.g., '(123) 456-7890')
 */
export const formatPhoneNumber = (phone: string): string => {
  if (isEmpty(phone)) return '';
  
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if we have 10 digits (US phone number)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return the original string if it doesn't fit the expected pattern
  return phone;
};

/**
 * Formats a Social Security Number into a standardized format
 * @param ssn - The SSN to format
 * @returns Formatted SSN (e.g., 'XXX-XX-1234')
 */
export const formatSSN = (ssn: string): string => {
  if (isEmpty(ssn)) return '';
  
  // Remove non-digit characters
  const digits = ssn.replace(/\D/g, '');
  
  // Check if we have 9 digits (SSN length)
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  
  // Return the original string if it doesn't fit the expected pattern
  return ssn;
};

/**
 * Formats a Medicaid ID into a standardized format
 * @param id - The Medicaid ID to format
 * @returns Formatted Medicaid ID
 */
export const formatMedicaidID = (id: string): string => {
  if (isEmpty(id)) return '';
  
  // Remove any non-alphanumeric characters and convert to uppercase
  return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

/**
 * Masks a string for privacy, showing only specified characters
 * @param str - The string to mask
 * @param visibleStart - Number of characters to show at the beginning (default: 0)
 * @param visibleEnd - Number of characters to show at the end (default: 0)
 * @param maskChar - Character to use for masking (default: '*')
 * @returns Masked string (e.g., '12****89')
 */
export const maskString = (
  str: string, 
  visibleStart: number = 0, 
  visibleEnd: number = 0, 
  maskChar: string = '*'
): string => {
  if (isEmpty(str)) return '';
  
  const start = str.slice(0, visibleStart);
  const end = visibleEnd > 0 ? str.slice(-visibleEnd) : '';
  const maskLength = Math.max(0, str.length - visibleStart - visibleEnd);
  const mask = maskChar.repeat(maskLength);
  
  return start + mask + end;
};

/**
 * Removes special characters from a string
 * @param str - The string to clean
 * @returns String with special characters removed
 */
export const removeSpecialChars = (str: string): string => {
  if (isEmpty(str)) return '';
  
  return str.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Converts a string to a URL-friendly slug
 * @param str - The string to slugify
 * @returns URL-friendly slug
 */
export const slugify = (str: string): string => {
  if (isEmpty(str)) return '';
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

/**
 * Escapes HTML special characters in a string
 * @param str - The string to escape
 * @returns HTML-escaped string
 */
export const escapeHtml = (str: string): string => {
  if (isEmpty(str)) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Unescapes HTML special characters in a string
 * @param str - The string to unescape
 * @returns Unescaped string
 */
export const unescapeHtml = (str: string): string => {
  if (isEmpty(str)) return '';
  
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Replaces placeholders in a template string with values from an object
 * @param template - The template string with placeholders (e.g., "Hello {{name}}")
 * @param data - Object containing values to replace placeholders
 * @param openTag - Opening tag for placeholders (default: '{{')
 * @param closeTag - Closing tag for placeholders (default: '}}')
 * @returns Processed template string
 */
export const template = (
  template: string, 
  data: Record<string, any>, 
  openTag: string = '{{', 
  closeTag: string = '}}'
): string => {
  if (isEmpty(template)) return '';
  
  // Escape special characters in tags for regex
  const escapedOpenTag = openTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedCloseTag = closeTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create the regex pattern
  const pattern = new RegExp(`${escapedOpenTag}\\s*([\\w.]+)\\s*${escapedCloseTag}`, 'g');
  
  // Replace each placeholder with its value
  return template.replace(pattern, (match, key) => {
    const keys = key.split('.');
    let value = data;
    
    for (const k of keys) {
      if (value === undefined || value === null) return match;
      value = value[k];
    }
    
    return value !== undefined && value !== null ? String(value) : match;
  });
};

/**
 * Validates if a string is a valid email address
 * @param email - The email to validate
 * @returns True if the string is a valid email address
 */
export const isEmail = (email: string): boolean => {
  if (isEmpty(email)) return false;
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string is a valid URL
 * @param url - The URL to validate
 * @returns True if the string is a valid URL
 */
export const isUrl = (url: string): boolean => {
  if (isEmpty(url)) return false;
  
  try {
    // Use the URL constructor for validation
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string contains only alphanumeric characters
 * @param str - The string to validate
 * @returns True if the string contains only alphanumeric characters
 */
export const isAlphanumeric = (str: string): boolean => {
  if (isEmpty(str)) return false;
  
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Counts the number of words in a string
 * @param str - The string to count words in
 * @returns Number of words in the string
 */
export const countWords = (str: string): number => {
  if (isEmpty(str)) return 0;
  
  // Split by whitespace and filter out empty strings
  return str.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Counts the number of characters in a string, optionally excluding whitespace
 * @param str - The string to count characters in
 * @param excludeWhitespace - Whether to exclude whitespace characters (default: false)
 * @returns Number of characters in the string
 */
export const countChars = (str: string, excludeWhitespace: boolean = false): number => {
  if (isEmpty(str)) return 0;
  
  if (excludeWhitespace) {
    return str.replace(/\s+/g, '').length;
  }
  
  return str.length;
};