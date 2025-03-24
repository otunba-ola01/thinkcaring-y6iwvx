/**
 * Validation configuration for the HCBS Revenue Management System
 * This file provides centralized validation patterns, error messages, and
 * schema creation utilities to ensure consistent data validation throughout the application.
 */

import { ValidationConfig, ValidationPatterns, ValidationMessages } from '../types/form.types';
import z from 'zod'; // v3.21.0

/**
 * Default configuration for React Hook Form validation
 */
export const validationConfig: ValidationConfig = {
  mode: 'onBlur', // Validate fields when they lose focus
  reValidateMode: 'onChange', // Re-validate when the user makes changes
  criteriaMode: 'all', // Show all validation errors, not just the first one
  shouldFocusError: true, // Automatically focus the first field with an error
  shouldUnregister: false, // Keep field values when unmounted
};

/**
 * Regular expression patterns for validating different types of data
 */
export const validationPatterns: ValidationPatterns = {
  // RFC 5322 compliant email regex
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Password requirements: min 8 chars, at least one uppercase, one lowercase, one number, one special char
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // North American phone number (supports formats like: (123) 456-7890, 123-456-7890, 123.456.7890)
  phone: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  
  // US ZIP code (5 digits or 5+4 format)
  zipCode: /^\d{5}(?:-\d{4})?$/,
  
  // Medicaid ID (varies by state, this is a generic alphanumeric pattern)
  medicaidId: /^[A-Za-z0-9]{6,12}$/,
  
  // Medicare ID (MBI format - 11 characters, mix of numbers and uppercase letters)
  medicareId: /^[1-9A-Z][0-9A-Z]{10}$/,
  
  // Currency (supports formats like: $123.45, 123.45, 1,234.56)
  currency: /^(\$)?[\d,]+(\.\d{1,2})?$/,
  
  // Numeric only
  numeric: /^\d+$/,
  
  // Alphanumeric only
  alphanumeric: /^[a-zA-Z0-9]+$/,
  
  // ISO date format (YYYY-MM-DD)
  date: /^\d{4}-\d{2}-\d{2}$/,
};

/**
 * Error message templates for different validation failures
 */
export const validationMessages: ValidationMessages = {
  required: '{field} is required',
  email: 'Please enter a valid email address',
  password: 'Password must contain at least 8 characters including uppercase, lowercase, number and special character',
  minLength: '{field} must be at least {min} characters',
  maxLength: '{field} must not exceed {max} characters',
  min: '{field} must be at least {min}',
  max: '{field} must not exceed {max}',
  pattern: '{field} contains invalid characters',
  phone: 'Please enter a valid phone number',
  zipCode: 'Please enter a valid ZIP code',
  medicaidId: 'Please enter a valid Medicaid ID',
  medicareId: 'Please enter a valid Medicare ID',
  currency: 'Please enter a valid currency amount (e.g., $123.45)',
  date: 'Please enter a valid date in YYYY-MM-DD format',
  numeric: '{field} must contain only numbers',
  alphanumeric: '{field} must contain only letters and numbers',
};

/**
 * Gets a formatted validation error message with field name and parameters
 * 
 * @param messageKey - Key of the message template in validationMessages
 * @param fieldName - Name of the field to include in the message
 * @param params - Additional parameters to include in the message
 * @returns Formatted validation error message
 */
export const getValidationMessage = (
  messageKey: string, 
  fieldName: string, 
  params: Record<string, any> = {}
): string => {
  let message = validationMessages[messageKey as keyof ValidationMessages] || '{field} is invalid';
  
  // Replace {field} with the actual field name
  message = message.replace('{field}', fieldName);
  
  // Replace any other placeholders with values from params
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key].toString());
  });
  
  return message;
};

/**
 * Creates a Zod validation schema from field configurations
 * 
 * @param schema - Object defining the schema configuration
 * @returns Zod validation schema
 */
export const createValidationSchema = (schema: Record<string, any>): z.ZodObject<any> => {
  const zodSchema: Record<string, z.ZodTypeAny> = {};
  
  Object.keys(schema).forEach(field => {
    const config = schema[field];
    let validator: z.ZodTypeAny;
    
    // Create base validator based on field type
    switch (config.type) {
      case 'number':
      case 'money':
        validator = z.number();
        break;
      case 'boolean':
      case 'checkbox':
      case 'switch':
        validator = z.boolean();
        break;
      case 'date':
      case 'datetime':
        validator = z.string().regex(validationPatterns.date, validationMessages.date);
        break;
      case 'array':
      case 'multi_select':
        validator = z.array(z.any());
        break;
      case 'email':
        validator = z.string().email(validationMessages.email);
        break;
      case 'phone':
        validator = z.string().regex(validationPatterns.phone, validationMessages.phone);
        break;
      default:
        validator = z.string();
    }
    
    // Apply validation rules
    if (config.required) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, getValidationMessage('required', config.label));
      } else if (validator instanceof z.ZodArray) {
        validator = validator.min(1, getValidationMessage('required', config.label));
      }
    } else {
      validator = validator.optional();
    }
    
    if (config.min !== undefined && typeof config.min === 'number') {
      if (validator instanceof z.ZodNumber) {
        validator = validator.min(config.min, 
          getValidationMessage('min', config.label, { min: config.min }));
      }
    }
    
    if (config.max !== undefined && typeof config.max === 'number') {
      if (validator instanceof z.ZodNumber) {
        validator = validator.max(config.max, 
          getValidationMessage('max', config.label, { max: config.max }));
      }
    }
    
    if (config.minLength !== undefined && typeof config.minLength === 'number') {
      if (validator instanceof z.ZodString) {
        validator = validator.min(config.minLength, 
          getValidationMessage('minLength', config.label, { min: config.minLength }));
      }
    }
    
    if (config.maxLength !== undefined && typeof config.maxLength === 'number') {
      if (validator instanceof z.ZodString) {
        validator = validator.max(config.maxLength, 
          getValidationMessage('maxLength', config.label, { max: config.maxLength }));
      }
    }
    
    if (config.pattern && validator instanceof z.ZodString) {
      validator = validator.regex(
        typeof config.pattern === 'string' ? new RegExp(config.pattern) : config.pattern, 
        getValidationMessage('pattern', config.label)
      );
    }
    
    zodSchema[field] = validator;
  });
  
  return z.object(zodSchema);
};

/**
 * Pre-configured Zod validators for common field types
 */
export const zodValidators = {
  /**
   * Validator for string fields with optional requirements
   */
  string: (options?: { 
    required?: boolean; 
    minLength?: number; 
    maxLength?: number; 
    pattern?: RegExp;
    message?: string;
  }) => {
    let validator = z.string();
    
    if (options?.required) {
      validator = validator.min(1, options.message || validationMessages.required);
    } else {
      validator = validator.optional();
    }
    
    if (options?.minLength !== undefined) {
      validator = validator.min(options.minLength, 
        options.message || getValidationMessage('minLength', 'This field', { min: options.minLength }));
    }
    
    if (options?.maxLength !== undefined) {
      validator = validator.max(options.maxLength, 
        options.message || getValidationMessage('maxLength', 'This field', { max: options.maxLength }));
    }
    
    if (options?.pattern) {
      validator = validator.regex(options.pattern, 
        options.message || validationMessages.pattern);
    }
    
    return validator;
  },
  
  /**
   * Validator for email fields
   */
  email: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string().email(options?.message || validationMessages.email);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for password fields
   */
  password: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.password, options?.message || validationMessages.password);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for phone number fields
   */
  phone: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.phone, options?.message || validationMessages.phone);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for ZIP code fields
   */
  zipCode: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.zipCode, options?.message || validationMessages.zipCode);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for Medicaid ID fields
   */
  medicaidId: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.medicaidId, options?.message || validationMessages.medicaidId);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for Medicare ID fields
   */
  medicareId: (options?: { required?: boolean; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.medicareId, options?.message || validationMessages.medicareId);
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for currency fields
   */
  currency: (options?: { required?: boolean; min?: number; max?: number; message?: string }) => {
    let validator = z.string()
      .regex(validationPatterns.currency, options?.message || validationMessages.currency)
      .transform((val) => {
        // Convert currency string to number
        return parseFloat(val.replace(/[$,]/g, ''));
      });
    
    if (options?.min !== undefined) {
      validator = validator.refine(
        (val) => val >= options.min!,
        {
          message: options.message || getValidationMessage('min', 'Amount', { min: options.min })
        }
      );
    }
    
    if (options?.max !== undefined) {
      validator = validator.refine(
        (val) => val <= options.max!,
        {
          message: options.message || getValidationMessage('max', 'Amount', { max: options.max })
        }
      );
    }
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for number fields
   */
  number: (options?: { 
    required?: boolean; 
    min?: number; 
    max?: number;
    message?: string;
  }) => {
    let validator = z.number();
    
    if (options?.min !== undefined) {
      validator = validator.min(options.min, 
        options.message || getValidationMessage('min', 'This field', { min: options.min }));
    }
    
    if (options?.max !== undefined) {
      validator = validator.max(options.max, 
        options.message || getValidationMessage('max', 'This field', { max: options.max }));
    }
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for date fields
   */
  date: (options?: { 
    required?: boolean; 
    min?: Date; 
    max?: Date;
    message?: string;
  }) => {
    let validator = z.string()
      .regex(validationPatterns.date, options?.message || validationMessages.date)
      .transform((val) => new Date(val));
    
    if (options?.min) {
      validator = validator.refine(
        (date) => date >= options.min!,
        {
          message: options.message || 
            `Date must be on or after ${options.min!.toISOString().split('T')[0]}`
        }
      );
    }
    
    if (options?.max) {
      validator = validator.refine(
        (date) => date <= options.max!,
        {
          message: options.message || 
            `Date must be on or before ${options.max!.toISOString().split('T')[0]}`
        }
      );
    }
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
  
  /**
   * Validator for boolean fields
   */
  boolean: (options?: { required?: boolean; message?: string }) => {
    let validator = z.boolean();
    
    if (!options?.required) {
      validator = validator.optional();
    }
    
    return validator;
  },
};