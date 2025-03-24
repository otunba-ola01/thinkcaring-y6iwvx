import { z } from 'zod'; // version 3.21+
import { ValidationError } from '../errors/validation-error';
import { ErrorCode, ValidationErrorDetail } from '../types/error.types';
import { logger } from './logger';

/**
 * Validates data against a Zod schema and returns the validated data or throws a ValidationError
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context description for error logging
 * @returns Validated and typed data if validation succeeds
 * @throws ValidationError if validation fails
 */
export function validateSchema<T>(schema: z.ZodType<T>, data: any, context: string): T {
  try {
    const result = schema.parse(data);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.debug(`Validation failed for ${context}`, { error: error.format() });
      throw ValidationError.fromZodError(error);
    }
    // If it's not a ZodError, rethrow it
    throw error;
  }
}

/**
 * Asynchronously validates data against a Zod schema and returns the validated data or throws a ValidationError
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context description for error logging
 * @returns Promise resolving to validated and typed data if validation succeeds
 * @throws ValidationError if validation fails
 */
export async function validateSchemaAsync<T>(schema: z.ZodType<T>, data: any, context: string): Promise<T> {
  try {
    const result = await schema.parseAsync(data);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.debug(`Async validation failed for ${context}`, { error: error.format() });
      throw ValidationError.fromZodError(error);
    }
    // If it's not a ZodError, rethrow it
    throw error;
  }
}

/**
 * Checks if a string is a valid UUID
 * 
 * @param value - String to check
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // UUID regex pattern (RFC 4122)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Checks if a string is a valid date in YYYY-MM-DD format
 * 
 * @param value - String to check
 * @returns True if the string is a valid date, false otherwise
 */
export function isValidDate(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // YYYY-MM-DD format regex
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(value)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Checks if a string is a valid email address
 * 
 * @param value - String to check
 * @returns True if the string is a valid email, false otherwise
 */
export function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Email regex pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(value);
}

/**
 * Checks if a string is a valid US phone number
 * 
 * @param value - String to check
 * @returns True if the string is a valid phone number, false otherwise
 */
export function isValidPhoneNumber(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Check if we have 10 digits (US phone number)
  return digitsOnly.length === 10;
}

/**
 * Checks if a value is a valid currency amount
 * 
 * @param value - Number or string to check
 * @returns True if the value is a valid currency amount, false otherwise
 */
export function isValidCurrency(value: number | string): boolean {
  // If it's a string, try to convert to a number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return false;
    }
    value = parsed;
  }
  
  // Check if it's a finite number
  if (typeof value !== 'number' || !isFinite(value)) {
    return false;
  }
  
  // Check if it has at most 2 decimal places
  const decimalPlaces = String(value).split('.')[1]?.length || 0;
  return decimalPlaces <= 2;
}

/**
 * Checks if a value is a valid percentage (0-100)
 * 
 * @param value - Number or string to check
 * @returns True if the value is a valid percentage, false otherwise
 */
export function isValidPercentage(value: number | string): boolean {
  // If it's a string, try to convert to a number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return false;
    }
    value = parsed;
  }
  
  // Check if it's a finite number
  if (typeof value !== 'number' || !isFinite(value)) {
    return false;
  }
  
  // Check if it's between 0 and 100 inclusive
  return value >= 0 && value <= 100;
}

/**
 * Creates a ValidationError with the specified details
 * 
 * @param message - Error message
 * @param details - Array of validation error details
 * @returns A new ValidationError instance
 */
export function createValidationError(message: string, details: ValidationErrorDetail[]): ValidationError {
  const error = new ValidationError(message);
  if (details && details.length > 0) {
    details.forEach(detail => error.addValidationError(detail));
  }
  return error;
}

/**
 * Validates that all required fields are present in an object
 * 
 * @param data - Object to validate
 * @param requiredFields - Array of field names that are required
 * @returns Array of validation errors or null if validation passes
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationErrorDetail[] | null {
  const errors: ValidationErrorDetail[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({
        field,
        message: `${field} is required`,
        value: data[field],
        code: ErrorCode.MISSING_REQUIRED_FIELD
      });
    }
  }
  
  return errors.length > 0 ? errors : null;
}