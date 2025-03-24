import z from 'zod'; // v3.21.0
import { ValidationPatterns, ValidationMessages, FormValidationRule } from '../types/form.types';
import { validationPatterns, validationMessages } from '../config/validation.config';
import { template } from './string';

/**
 * Validates a single field value against specified validation rules
 * 
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated
 * @param validationRules - Array of validation rules to apply
 * @returns Validation result with error messages
 */
export const validateField = (
  value: any,
  fieldName: string,
  validationRules: Array<{ rule: FormValidationRule; value?: any; message?: string; params?: Record<string, any> }>
): { valid: boolean; errors: string[] } => {
  const result = { valid: true, errors: [] as string[] };
  
  if (!validationRules || validationRules.length === 0) {
    return result;
  }
  
  for (const { rule, value: ruleValue, message, params } of validationRules) {
    switch (rule) {
      case FormValidationRule.REQUIRED:
        if (value === undefined || value === null || value === '') {
          result.valid = false;
          result.errors.push(
            formatValidationError(message || 'required', fieldName, params || {})
          );
        }
        break;
      case FormValidationRule.MIN_LENGTH:
        if (typeof value === 'string' && value.length < ruleValue) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'minLength',
              fieldName,
              { min: ruleValue, ...(params || {}) }
            )
          );
        }
        break;
      case FormValidationRule.MAX_LENGTH:
        if (typeof value === 'string' && value.length > ruleValue) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'maxLength',
              fieldName,
              { max: ruleValue, ...(params || {}) }
            )
          );
        }
        break;
      case FormValidationRule.MIN:
        if (typeof value === 'number' && value < ruleValue) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'min',
              fieldName,
              { min: ruleValue, ...(params || {}) }
            )
          );
        }
        break;
      case FormValidationRule.MAX:
        if (typeof value === 'number' && value > ruleValue) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'max',
              fieldName,
              { max: ruleValue, ...(params || {}) }
            )
          );
        }
        break;
      case FormValidationRule.PATTERN:
        if (typeof value === 'string' && ruleValue instanceof RegExp && !ruleValue.test(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'pattern',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.EMAIL:
        if (typeof value === 'string' && !isValidEmail(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'email',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.PHONE:
        if (typeof value === 'string' && !isValidPhone(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'phone',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.ZIP_CODE:
        if (typeof value === 'string' && !validationPatterns.zipCode.test(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'zipCode',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.MEDICAID_ID:
        if (typeof value === 'string' && !isValidMedicaidId(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'medicaidId',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.MEDICARE_ID:
        if (typeof value === 'string' && !validationPatterns.medicareId.test(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'medicareId',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.CURRENCY:
        if (typeof value === 'string' && !isValidCurrency(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'currency',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.DATE:
        if (typeof value === 'string' && !validationPatterns.date.test(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'date',
              fieldName,
              params || {}
            )
          );
        }
        break;
      case FormValidationRule.CUSTOM:
        if (typeof ruleValue === 'function' && !ruleValue(value)) {
          result.valid = false;
          result.errors.push(
            formatValidationError(
              message || 'custom',
              fieldName,
              params || {}
            )
          );
        }
        break;
    }
  }
  
  return result;
};

/**
 * Validates an entire form data object against a Zod schema
 * 
 * @param data - The form data to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with field-specific errors
 */
export const validateForm = (
  data: Record<string, any>,
  schema: z.ZodType<any>
): { valid: boolean; errors: Record<string, string[]> } => {
  const result = {
    valid: true,
    errors: {} as Record<string, string[]>
  };
  
  if (!schema) {
    return result;
  }
  
  try {
    schema.parse(data);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.valid = false;
      result.errors = formatZodErrors(error);
    }
    return result;
  }
};

/**
 * Formats Zod validation errors into a more usable structure
 * 
 * @param error - The Zod error object
 * @returns Formatted errors by field name
 */
export const formatZodErrors = (error: z.ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return errors;
};

/**
 * Formats a validation error message with field name and parameters
 * 
 * @param messageKey - The key of the message template
 * @param fieldName - The name of the field
 * @param params - Parameters to include in the message
 * @returns Formatted error message
 */
export const formatValidationError = (
  messageKey: string,
  fieldName: string,
  params: Record<string, any> = {}
): string => {
  const messageTemplate = 
    validationMessages[messageKey as keyof ValidationMessages] || 
    '{field} is invalid';
  
  // Format the field name to be more readable (capitalize, remove underscores)
  const formattedFieldName = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
  
  // Use the template function from string utils to replace placeholders
  return template(
    messageTemplate, 
    { field: formattedFieldName, ...params },
    '{',
    '}'
  );
};

/**
 * Creates a Zod validation schema from field configurations
 * 
 * @param fields - Field configuration object
 * @returns Zod validation schema
 */
export const createZodSchema = (
  fields: Record<string, { 
    type: string; 
    validation?: Array<{ 
      rule: FormValidationRule; 
      value?: any; 
      message?: string; 
      params?: Record<string, any> 
    }>
  }>
): z.ZodObject<any> => {
  const schema: Record<string, z.ZodType<any>> = {};
  
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    // Get base validator based on field type
    let validator = getZodValidator(fieldConfig.type);
    
    // Apply validation rules if they exist
    if (fieldConfig.validation && fieldConfig.validation.length > 0) {
      for (const rule of fieldConfig.validation) {
        validator = applyValidationRule(validator, rule, fieldName);
      }
    }
    
    schema[fieldName] = validator;
  }
  
  return z.object(schema);
};

/**
 * Gets the appropriate Zod validator based on field type
 * 
 * @param type - The field type
 * @returns Zod validator
 */
export const getZodValidator = (type: string): z.ZodType<any> => {
  switch (type.toLowerCase()) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'password':
    case 'phone':
    case 'date':
    case 'time':
    case 'datetime':
    case 'money':
    case 'hidden':
      return z.string();
    case 'number':
      return z.number();
    case 'checkbox':
    case 'switch':
      return z.boolean();
    case 'select':
      return z.string();
    case 'multi_select':
    case 'file':
      return z.array(z.any());
    default:
      return z.any();
  }
};

/**
 * Applies a validation rule to a Zod validator
 * 
 * @param validator - The Zod validator to modify
 * @param validationRule - The validation rule to apply
 * @param fieldName - The name of the field
 * @returns Updated Zod validator
 */
export const applyValidationRule = (
  validator: z.ZodType<any>,
  validationRule: { 
    rule: FormValidationRule; 
    value?: any; 
    message?: string; 
    params?: Record<string, any> 
  },
  fieldName: string
): z.ZodType<any> => {
  const { rule, value, message, params } = validationRule;
  const errorMessage = message ? 
    formatValidationError(message, fieldName, params) : 
    undefined;
  
  switch (rule) {
    case FormValidationRule.REQUIRED:
      if (validator instanceof z.ZodString) {
        return validator.min(1, errorMessage);
      } else if (validator instanceof z.ZodArray) {
        return validator.min(1, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MIN_LENGTH:
      if (validator instanceof z.ZodString && typeof value === 'number') {
        return validator.min(value, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MAX_LENGTH:
      if (validator instanceof z.ZodString && typeof value === 'number') {
        return validator.max(value, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MIN:
      if (validator instanceof z.ZodNumber && typeof value === 'number') {
        return validator.min(value, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MAX:
      if (validator instanceof z.ZodNumber && typeof value === 'number') {
        return validator.max(value, errorMessage);
      }
      return validator;
    
    case FormValidationRule.PATTERN:
      if (validator instanceof z.ZodString && value instanceof RegExp) {
        return validator.regex(value, errorMessage);
      }
      return validator;
    
    case FormValidationRule.EMAIL:
      if (validator instanceof z.ZodString) {
        return validator.email(errorMessage);
      }
      return validator;
    
    case FormValidationRule.PHONE:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.phone, errorMessage);
      }
      return validator;
    
    case FormValidationRule.ZIP_CODE:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.zipCode, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MEDICAID_ID:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.medicaidId, errorMessage);
      }
      return validator;
    
    case FormValidationRule.MEDICARE_ID:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.medicareId, errorMessage);
      }
      return validator;
    
    case FormValidationRule.CURRENCY:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.currency, errorMessage);
      }
      return validator;
    
    case FormValidationRule.DATE:
      if (validator instanceof z.ZodString) {
        return validator.regex(validationPatterns.date, errorMessage);
      }
      return validator;
    
    default:
      return validator;
  }
};

/**
 * Validates if a string is a valid email address
 * 
 * @param email - The email to validate
 * @returns True if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return validationPatterns.email.test(email);
};

/**
 * Validates if a string is a valid phone number
 * 
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  return validationPatterns.phone.test(phone);
};

/**
 * Validates if a string is a valid currency amount
 * 
 * @param value - The currency amount to validate
 * @returns True if the currency amount is valid
 */
export const isValidCurrency = (value: string): boolean => {
  if (!value) return false;
  return validationPatterns.currency.test(value);
};

/**
 * Validates if a string is a valid Medicaid ID
 * 
 * @param id - The Medicaid ID to validate
 * @returns True if the Medicaid ID is valid
 */
export const isValidMedicaidId = (id: string): boolean => {
  if (!id) return false;
  return validationPatterns.medicaidId.test(id);
};

/**
 * Collection of validation functions for common validation scenarios
 */
export const validators = {
  // Email validator
  email: (value: string): boolean => isValidEmail(value),
  
  // Phone validator
  phone: (value: string): boolean => isValidPhone(value),
  
  // Currency validator
  currency: (value: string): boolean => isValidCurrency(value),
  
  // Medicaid ID validator
  medicaidId: (value: string): boolean => isValidMedicaidId(value),
  
  // Required field validator
  required: (value: any): boolean => 
    value !== undefined && value !== null && value !== '',
  
  // Minimum length validator
  minLength: (value: string, min: number): boolean => 
    typeof value === 'string' && value.length >= min,
  
  // Maximum length validator
  maxLength: (value: string, max: number): boolean => 
    typeof value === 'string' && value.length <= max,
  
  // Minimum number validator
  min: (value: number, min: number): boolean => 
    typeof value === 'number' && value >= min,
  
  // Maximum number validator
  max: (value: number, max: number): boolean => 
    typeof value === 'number' && value <= max,
  
  // Pattern validator
  pattern: (value: string, pattern: RegExp): boolean => 
    typeof value === 'string' && pattern.test(value),
};