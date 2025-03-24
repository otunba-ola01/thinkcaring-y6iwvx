import { RequestHandler } from 'express'; // version 4.18+
import { 
  validateBody, 
  validateParams, 
  validateQuery, 
  validateParamsAndBody 
} from '../middleware/validation.middleware';
import { 
  createAuthorizationSchema, 
  updateAuthorizationSchema, 
  updateAuthorizationStatusSchema, 
  authorizationQuerySchema, 
  authorizationUtilizationSchema 
} from './schemas/authorization.schema';

/**
 * Middleware that validates request body for creating a new authorization
 * 
 * @returns Express middleware function that validates authorization creation data
 */
export const validateCreateAuthorization = (): RequestHandler => {
  return validateBody(createAuthorizationSchema);
};

/**
 * Middleware that validates request parameters and body for updating an authorization
 * 
 * @returns Express middleware function that validates authorization update data
 */
export const validateUpdateAuthorization = (): RequestHandler => {
  // Create a simple schema for UUID validation in params
  const paramSchema = { id: { type: 'string', format: 'uuid' } };
  return validateParamsAndBody(paramSchema, updateAuthorizationSchema);
};

/**
 * Middleware that validates request parameters and body for updating an authorization's status
 * 
 * @returns Express middleware function that validates authorization status update data
 */
export const validateUpdateAuthorizationStatus = (): RequestHandler => {
  // Create a simple schema for UUID validation in params
  const paramSchema = { id: { type: 'string', format: 'uuid' } };
  return validateParamsAndBody(paramSchema, updateAuthorizationStatusSchema);
};

/**
 * Middleware that validates query parameters for fetching authorizations
 * 
 * @returns Express middleware function that validates authorization query parameters
 */
export const validateAuthorizationQuery = (): RequestHandler => {
  return validateQuery(authorizationQuerySchema);
};

/**
 * Middleware that validates request parameters and body for tracking authorization utilization
 * 
 * @returns Express middleware function that validates authorization utilization data
 */
export const validateAuthorizationUtilization = (): RequestHandler => {
  // Create a simple schema for UUID validation in params
  const paramSchema = { id: { type: 'string', format: 'uuid' } };
  return validateParamsAndBody(paramSchema, authorizationUtilizationSchema);
};