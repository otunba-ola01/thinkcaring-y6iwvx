/**
 * Utility functions for currency formatting, parsing, and calculations in the HCBS Revenue Management System.
 * This file provides specialized functions for handling monetary values with precision and consistent
 * formatting throughout the application, ensuring accurate financial data representation.
 */

import { parseNumber, round, isNumeric } from './number';

// Default currency code (USD for United States Dollar)
export const DEFAULT_CURRENCY = 'USD';

// Default locale for currency formatting
export const DEFAULT_CURRENCY_LOCALE = 'en-US';

// Default number of decimal places for currency values
export const DEFAULT_CURRENCY_DECIMALS = 2;

/**
 * Formats a number as a currency string with the specified currency code and locale.
 * 
 * @param value - The number to format as currency
 * @param options - Formatting options
 * @returns The formatted currency string
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    decimals?: number;
  } = {}
): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatCurrency(0, options);
  }
  
  // Parse string values to numbers
  const numValue = typeof value === 'string' ? parseNumber(value) : value;
  
  // Set default options
  const currency = options.currency || DEFAULT_CURRENCY;
  const locale = options.locale || DEFAULT_CURRENCY_LOCALE;
  const decimals = options.decimals !== undefined ? options.decimals : DEFAULT_CURRENCY_DECIMALS;
  
  // Format using Intl.NumberFormat for consistency and localization support
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(numValue);
};

/**
 * Formats a number as a compact currency string (e.g., $1K, $1M) for display in dashboards.
 * 
 * @param value - The number to format as compact currency
 * @param options - Formatting options
 * @returns The formatted compact currency string
 */
export const formatCompactCurrency = (
  value: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    decimals?: number;
  } = {}
): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatCompactCurrency(0, options);
  }
  
  // Parse string values to numbers
  const numValue = typeof value === 'string' ? parseNumber(value) : value;
  
  // Set default options (compact notation typically uses fewer decimals)
  const currency = options.currency || DEFAULT_CURRENCY;
  const locale = options.locale || DEFAULT_CURRENCY_LOCALE;
  const decimals = options.decimals !== undefined ? options.decimals : 1; // Default to 1 decimal for compact
  
  // Format using Intl.NumberFormat with compact notation
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(numValue);
};

/**
 * Parses a currency string to a number, removing currency symbols and formatting.
 * 
 * @param value - The currency string to parse
 * @param defaultValue - The default value to return if parsing fails (default: 0)
 * @returns The parsed number value
 */
export const parseCurrency = (
  value: string | number | null | undefined,
  defaultValue = 0
): number => {
  // If value is already a number, return it (unless it's NaN)
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  
  // Return default value for null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  // If value is a string, clean it and convert to number
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and other non-numeric characters
    // Keep only numbers, decimal point, and negative sign
    const cleanedValue = value.replace(/[^0-9.-]/g, '');
    const parsedValue = parseNumber(cleanedValue);
    
    return isNaN(parsedValue) ? defaultValue : parsedValue;
  }
  
  // For other types, try to convert to number or use default
  return defaultValue;
};

/**
 * Calculates tax amount based on a value and tax rate.
 * 
 * @param value - The base value
 * @param taxRate - The tax rate percentage (e.g., 7.5 for 7.5%)
 * @returns The calculated tax amount
 */
export const calculateTax = (
  value: number | string,
  taxRate: number | string
): number => {
  // Parse input values to numbers
  const numValue = parseNumber(value);
  const numTaxRate = parseNumber(taxRate);
  
  // Calculate tax (value * taxRate / 100)
  const tax = numValue * (numTaxRate / 100);
  
  // Round to currency precision
  return round(tax, DEFAULT_CURRENCY_DECIMALS);
};

/**
 * Calculates total amount including tax.
 * 
 * @param value - The base value
 * @param taxRate - The tax rate percentage (e.g., 7.5 for 7.5%)
 * @returns The total amount including tax
 */
export const calculateTotal = (
  value: number | string,
  taxRate: number | string
): number => {
  // Parse base value to number
  const numValue = parseNumber(value);
  
  // Calculate tax amount
  const tax = calculateTax(numValue, taxRate);
  
  // Calculate total (value + tax)
  const total = numValue + tax;
  
  // Round to currency precision
  return round(total, DEFAULT_CURRENCY_DECIMALS);
};

/**
 * Calculates subtotal from an array of line items with quantity and price.
 * 
 * @param items - Array of line items with quantity and price
 * @returns The calculated subtotal
 */
export const calculateSubtotal = (
  items: Array<{ quantity: number; price: number; }>
): number => {
  // Check for null or empty array
  if (!items || items.length === 0) {
    return 0;
  }
  
  // Calculate subtotal by summing quantity * price for each item
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  // Round to currency precision
  return round(subtotal, DEFAULT_CURRENCY_DECIMALS);
};

/**
 * Formats a range of currency values (e.g., '$1,000 - $2,000').
 * 
 * @param minValue - The minimum value of the range
 * @param maxValue - The maximum value of the range
 * @param options - Formatting options
 * @returns The formatted currency range
 */
export const formatCurrencyRange = (
  minValue: number | string | null | undefined,
  maxValue: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    decimals?: number;
    separator?: string;
  } = {}
): string => {
  // Parse input values to numbers
  const numMinValue = parseNumber(minValue);
  const numMaxValue = parseNumber(maxValue);
  
  // Format each value as currency
  const formattedMin = formatCurrency(numMinValue, options);
  const formattedMax = formatCurrency(numMaxValue, options);
  
  // Use specified separator or default to ' - '
  const separator = options.separator || ' - ';
  
  // Combine with separator
  return `${formattedMin}${separator}${formattedMax}`;
};

/**
 * Formats the difference between two currency values with a sign indicator.
 * 
 * @param currentValue - The current value
 * @param previousValue - The previous value for comparison
 * @param options - Formatting options
 * @returns The formatted currency difference with sign
 */
export const formatCurrencyDifference = (
  currentValue: number | string | null | undefined,
  previousValue: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    decimals?: number;
    showPositiveSign?: boolean;
  } = {}
): string => {
  // Parse input values to numbers
  const numCurrentValue = parseNumber(currentValue);
  const numPreviousValue = parseNumber(previousValue);
  
  // Calculate difference
  const difference = numCurrentValue - numPreviousValue;
  
  // Determine sign
  let sign = '';
  if (difference > 0) {
    sign = options.showPositiveSign !== false ? '+' : ''; // Show + by default
  } else if (difference < 0) {
    sign = '-';
  }
  
  // Format the absolute difference
  const formattedDifference = formatCurrency(Math.abs(difference), options);
  
  // Return signed difference
  return `${sign}${formattedDifference}`;
};

/**
 * Rounds a number to currency precision (typically 2 decimal places) without formatting.
 * 
 * @param value - The number to round
 * @param decimals - The number of decimal places (default: DEFAULT_CURRENCY_DECIMALS)
 * @returns The number rounded to currency precision
 */
export const roundToCurrencyPrecision = (
  value: number | string,
  decimals = DEFAULT_CURRENCY_DECIMALS
): number => {
  // Parse value to number
  const numValue = parseNumber(value);
  
  // Round to specified decimal places
  return round(numValue, decimals);
};