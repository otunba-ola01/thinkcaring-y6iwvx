/**
 * Central export file for all error classes used in the HCBS Revenue Management System.
 * This file provides a single entry point for importing error classes throughout the
 * application, ensuring consistent error handling across all components.
 * 
 * The error handling framework implemented here addresses the following requirements:
 * - Consistent error handling strategy across all components
 * - Type safety for error objects and handling
 * - Enhanced observability through structured error information
 * 
 * @module errors
 */

// Import all error classes
import { ApiError } from './api-error';
import { DatabaseError } from './database-error';
import { ValidationError } from './validation-error';
import { IntegrationError } from './integration-error';
import { BusinessError } from './business-error';
import { AuthError } from './auth-error';
import { NotFoundError } from './not-found-error';
import { PermissionError } from './permission-error';

// Re-export all error classes
export {
    ApiError,
    DatabaseError,
    ValidationError,
    IntegrationError,
    BusinessError,
    AuthError,
    NotFoundError,
    PermissionError
};