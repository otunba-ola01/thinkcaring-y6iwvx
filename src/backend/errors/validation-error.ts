import { ZodError } from 'zod'; // version 3.21+
import { ApiError } from './api-error';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity, 
  ValidationErrorDetail 
} from '../types/error.types';

/**
 * Specialized error class for handling validation errors in the application.
 * Extends the base ApiError class with functionality specific to input validation failures,
 * including support for field-specific error details and conversion from Zod validation errors.
 */
export class ValidationError extends ApiError {
  /**
   * Array of validation-specific error details with field information
   */
  public validationErrors: ValidationErrorDetail[];

  /**
   * Creates a new ValidationError instance with the provided message or options
   * 
   * @param messageOrOptions Error message string or options object
   */
  constructor(messageOrOptions: string | object) {
    super(messageOrOptions);

    // Set validation-specific defaults
    this.category = ErrorCategory.VALIDATION;
    this.code = ErrorCode.INVALID_INPUT;
    this.severity = ErrorSeverity.MEDIUM;
    this.status = 400; // Bad Request

    // Initialize validation errors if provided in options
    if (typeof messageOrOptions !== 'string' && 'validationErrors' in messageOrOptions) {
      this.validationErrors = (messageOrOptions as any).validationErrors;
    } else {
      this.validationErrors = [];
    }
  }

  /**
   * Adds a validation error detail to the validationErrors array
   * 
   * @param error Validation error detail to add
   * @returns The current ValidationError instance for chaining
   */
  public addValidationError(error: ValidationErrorDetail): ValidationError {
    if (!this.validationErrors) {
      this.validationErrors = [];
    }
    this.validationErrors.push(error);

    // Also add to the general details array
    this.addDetail({
      message: error.message,
      code: error.code,
      path: error.field,
      context: { value: error.value }
    });

    return this;
  }

  /**
   * Returns the array of validation error details
   * 
   * @returns Array of validation error details
   */
  public getValidationErrors(): ValidationErrorDetail[] {
    return this.validationErrors || [];
  }

  /**
   * Creates a ValidationError from a Zod validation error
   * 
   * @param zodError Zod validation error object
   * @returns A new ValidationError instance with details from the Zod error
   */
  public static fromZodError(zodError: ZodError): ValidationError {
    const validationError = new ValidationError('Validation failed: Invalid input data');
    
    // Extract the formatted errors
    const formattedErrors = zodError.format();
    
    // Process each Zod error issue
    zodError.errors.forEach(issue => {
      // Determine the appropriate error code based on the Zod issue code
      let errorCode = ErrorCode.INVALID_INPUT;
      
      switch (issue.code) {
        case 'invalid_type':
          if (issue.received === 'undefined') {
            errorCode = ErrorCode.MISSING_REQUIRED_FIELD;
          } else {
            errorCode = ErrorCode.INVALID_FORMAT;
          }
          break;
        case 'invalid_literal':
        case 'invalid_union':
        case 'invalid_union_discriminator':
        case 'invalid_enum_value':
        case 'invalid_arguments':
        case 'invalid_return_type':
        case 'invalid_date':
        case 'invalid_string':
        case 'too_small':
        case 'too_big':
        case 'custom':
          errorCode = ErrorCode.INVALID_FORMAT;
          break;
        case 'required_error':
          errorCode = ErrorCode.MISSING_REQUIRED_FIELD;
          break;
        default:
          errorCode = ErrorCode.INVALID_INPUT;
      }

      // Create field path from the Zod path array
      const field = issue.path.join('.');
      
      // Add the validation error
      validationError.addValidationError({
        field,
        message: issue.message,
        value: issue.received, // Use received value from Zod error
        code: errorCode
      });
    });

    return validationError;
  }
}