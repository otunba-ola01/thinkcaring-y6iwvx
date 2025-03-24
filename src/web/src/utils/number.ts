/**
 * Utility functions for number manipulation, formatting, and validation.
 * This file provides reusable helper functions for common number operations,
 * with a focus on type safety, precision, and consistent formatting for financial data.
 */

// Default locale for number formatting, using US English as the standard
export const DEFAULT_LOCALE = 'en-US';

// Default number of decimal places for financial values
export const DEFAULT_DECIMAL_PLACES = 2;

/**
 * Checks if a value is a valid number or can be converted to a number.
 * 
 * @param value - The value to check
 * @returns True if the value is numeric, false otherwise
 */
export const isNumeric = (value: any): boolean => {
  // Return false for null or undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Check if value is a number type (but not NaN)
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  
  // If value is a string, try to parse it as a number
  if (typeof value === 'string') {
    // Remove thousands separators if present
    const parsedValue = parseFloat(value.replace(/,/g, ''));
    return !isNaN(parsedValue);
  }
  
  // For all other types, return false
  return false;
};

/**
 * Parses a value to a number, with fallback to default value if parsing fails.
 * 
 * @param value - The value to parse
 * @param defaultValue - The default value to return if parsing fails (default: 0)
 * @returns The parsed number or the default value
 */
export const parseNumber = (value: any, defaultValue = 0): number => {
  // Return default value for null or undefined
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // If value is already a number, return it (unless it's NaN)
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  
  // If value is a string, clean it and convert to number
  if (typeof value === 'string') {
    // Remove all non-numeric characters except decimal point and negative sign
    const cleanedValue = value.replace(/[^0-9.-]/g, '');
    const parsedValue = parseFloat(cleanedValue);
    
    return isNaN(parsedValue) ? defaultValue : parsedValue;
  }
  
  // For all other types, try to convert to number or use default
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? defaultValue : parsedValue;
};

/**
 * Rounds a number to a specified number of decimal places.
 * 
 * @param value - The number to round
 * @param decimals - The number of decimal places (default: DEFAULT_DECIMAL_PLACES)
 * @returns The rounded number
 */
export const round = (value: number, decimals = DEFAULT_DECIMAL_PLACES): number => {
  if (isNaN(value)) {
    return 0;
  }
  
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Interface for number formatting options
 */
interface FormatNumberOptions {
  /** Number of decimal places to display (default: DEFAULT_DECIMAL_PLACES) */
  decimals?: number;
  /** Locale to use for formatting (default: DEFAULT_LOCALE) */
  locale?: string;
  /** Style of number format ('decimal', 'currency', etc.) */
  style?: string;
  /** Currency code for currency formatting (e.g., 'USD') */
  currency?: string;
}

/**
 * Formats a number with thousand separators and decimal places.
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns The formatted number string
 */
export const formatNumber = (
  value: number | string | null | undefined,
  options: FormatNumberOptions = {}
): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatNumber(0, options);
  }
  
  // Parse string values to numbers
  const numValue = typeof value === 'string' ? parseNumber(value) : value;
  
  // Set default options
  const decimals = options.decimals !== undefined ? options.decimals : DEFAULT_DECIMAL_PLACES;
  const locale = options.locale || DEFAULT_LOCALE;
  
  // Format using Intl.NumberFormat for consistency and localization support
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    style: options.style || 'decimal',
    currency: options.currency,
  });
  
  return formatter.format(numValue);
};

/**
 * Formats a number in compact notation (e.g., 1K, 1M) for display in dashboards.
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns The formatted compact number string
 */
export const formatCompactNumber = (
  value: number | string | null | undefined,
  options: FormatNumberOptions = {}
): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatCompactNumber(0, options);
  }
  
  // Parse string values to numbers
  const numValue = typeof value === 'string' ? parseNumber(value) : value;
  
  // Set default options (compact notation typically uses fewer decimals)
  const decimals = options.decimals !== undefined ? options.decimals : 1;
  const locale = options.locale || DEFAULT_LOCALE;
  
  // Format using Intl.NumberFormat with compact notation
  const formatter = new Intl.NumberFormat(locale, {
    notation: 'compact' as const,
    compactDisplay: 'short' as const,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(numValue);
};

/**
 * Formats a number as a percentage with the % symbol.
 * 
 * @param value - The number to format as percentage (e.g., 0.25 for 25%)
 * @param options - Formatting options
 * @returns The formatted percentage string
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  options: FormatNumberOptions = {}
): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return formatPercentage(0, options);
  }
  
  // Parse string values to numbers
  const numValue = typeof value === 'string' ? parseNumber(value) : value;
  
  // Set default options (percentages typically use 1 decimal place)
  const decimals = options.decimals !== undefined ? options.decimals : 1;
  const locale = options.locale || DEFAULT_LOCALE;
  
  // Format using Intl.NumberFormat with percent style
  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  // For percentage formatting, we provide the decimal value (e.g., 0.25 for 25%)
  return formatter.format(numValue);
};

/**
 * Clamps a number between minimum and maximum values.
 * 
 * @param value - The number to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped number
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

/**
 * Calculates the sum of an array of numbers.
 * 
 * @param values - Array of numbers to sum
 * @returns The sum of the values
 */
export const sum = (values: Array<number | string | null | undefined>): number => {
  if (!values || values.length === 0) {
    return 0;
  }
  
  // Convert all values to numbers, filter out NaN
  const numbers = values
    .map(val => parseNumber(val))
    .filter(val => !isNaN(val));
  
  // Calculate sum using reduce
  return numbers.reduce((acc, val) => acc + val, 0);
};

/**
 * Calculates the average of an array of numbers.
 * 
 * @param values - Array of numbers to average
 * @returns The average of the values
 */
export const average = (values: Array<number | string | null | undefined>): number => {
  if (!values || values.length === 0) {
    return 0;
  }
  
  // Convert all values to numbers, filter out NaN
  const numbers = values
    .map(val => parseNumber(val))
    .filter(val => !isNaN(val));
  
  if (numbers.length === 0) {
    return 0;
  }
  
  // Calculate sum and divide by count
  const total = numbers.reduce((acc, val) => acc + val, 0);
  return total / numbers.length;
};

/**
 * Calculates the percentage of a value relative to a total.
 * 
 * @param value - The value to calculate percentage for
 * @param total - The total value
 * @returns The calculated percentage
 */
export const percentage = (value: number | string, total: number | string): number => {
  const numValue = parseNumber(value);
  const numTotal = parseNumber(total);
  
  // Avoid division by zero
  if (numTotal === 0) {
    return 0;
  }
  
  // Calculate percentage and round to 2 decimal places
  return round((numValue / numTotal) * 100, 2);
};

/**
 * Generates a random integer between min and max (inclusive).
 * 
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer
 */
export const randomInteger = (min: number, max: number): number => {
  // Ensure min and max are integers
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);
  
  // Swap min and max if min > max
  if (minInt > maxInt) {
    [minInt, maxInt] = [maxInt, minInt];
  }
  
  // Generate random integer
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
};

/**
 * Converts a number to a fixed precision without rounding.
 * This is useful for financial calculations where truncation is preferred over rounding.
 * 
 * @param value - The number to convert
 * @param precision - The number of decimal places (default: DEFAULT_DECIMAL_PLACES)
 * @returns The number with fixed precision
 */
export const toFixedPrecision = (value: number, precision = DEFAULT_DECIMAL_PLACES): number => {
  if (isNaN(value)) {
    return 0;
  }
  
  // Convert to string to manipulate decimal places
  const valueStr = value.toString();
  
  // Split by decimal point
  const parts = valueStr.split('.');
  
  // If no decimal part, return the original value
  if (parts.length === 1) {
    return value;
  }
  
  // Get integer part and truncated decimal part
  const integerPart = parts[0];
  const decimalPart = parts[1].slice(0, precision);
  
  // Combine parts and convert back to number
  return parseFloat(`${integerPart}.${decimalPart}`);
};