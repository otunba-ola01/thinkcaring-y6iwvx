/**
 * User request validation middleware for the HCBS Revenue Management System.
 * 
 * This module provides middleware functions that validate user-related requests
 * against predefined schemas to ensure data integrity and security requirements
 * are met before processing the requests. These validation middlewares help enforce
 * password policies and data validation rules throughout the user management system.
 */

import { RequestHandler } from 'express'; // express 4.18+
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  userPreferencesSchema,
  userFilterSchema
} from './schemas/user.schema';

/**
 * Middleware for validating user creation requests
 * 
 * Validates that the request body contains all required fields for user creation
 * and that they meet the requirements specified in createUserSchema, including:
 * - Valid email address
 * - Required personal information (first/last name)
 * - Password complexity requirements
 * - Valid role assignment
 * 
 * @returns Express middleware that validates the request body against the createUserSchema
 */
export const validateCreateUser = (): RequestHandler => {
  return validateBody(createUserSchema);
};

/**
 * Middleware for validating user update requests
 * 
 * Validates that the request body contains valid fields for user updates
 * according to the updateUserSchema. This includes optional updates to:
 * - Personal information
 * - Role assignments
 * - User status
 * - MFA settings
 * - Contact information
 * 
 * @returns Express middleware that validates the request body against the updateUserSchema
 */
export const validateUpdateUser = (): RequestHandler => {
  return validateBody(updateUserSchema);
};

/**
 * Middleware for validating password change requests
 * 
 * Validates that the request body contains the current password, new password,
 * and password confirmation, and that the new password meets the system's
 * password policy requirements including complexity, length, and confirmation match.
 * 
 * @returns Express middleware that validates the request body against the changePasswordSchema
 */
export const validateChangePassword = (): RequestHandler => {
  return validateBody(changePasswordSchema);
};

/**
 * Middleware for validating password reset requests
 * 
 * Validates that the request body contains a valid reset token, new password,
 * and password confirmation, and that the new password meets the system's
 * password policy requirements.
 * 
 * @returns Express middleware that validates the request body against the resetPasswordSchema
 */
export const validateResetPassword = (): RequestHandler => {
  return validateBody(resetPasswordSchema);
};

/**
 * Middleware for validating user preferences update requests
 * 
 * Validates that the request body contains valid user preference settings
 * according to the userPreferencesSchema, including theme preferences,
 * notification settings, and display format preferences.
 * 
 * @returns Express middleware that validates the request body against the userPreferencesSchema
 */
export const validateUserPreferences = (): RequestHandler => {
  return validateBody(userPreferencesSchema);
};

/**
 * Middleware for validating user list filter parameters
 * 
 * Validates that the request query parameters for filtering users are valid
 * according to the userFilterSchema. This enables safe and validated filtering
 * of users by status, role, MFA settings, and various date ranges.
 * 
 * @returns Express middleware that validates the request query against the userFilterSchema
 */
export const validateUserFilters = (): RequestHandler => {
  return validateQuery(userFilterSchema);
};