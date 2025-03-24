import { RequestHandler } from 'express'; // version 4.18+
import { z } from 'zod'; // version 3.21+

import { 
  validateBody, 
  validateParams, 
  validateQuery,
  validateParamsAndBody 
} from '../middleware/validation.middleware';

import {
  createClaimSchema,
  updateClaimSchema,
  updateClaimStatusSchema,
  submitClaimSchema,
  batchSubmitClaimsSchema,
  claimValidationRequestSchema,
  claimQuerySchema
} from './schemas/claim.schema';

import { IdParam } from '../types/request.types';

/**
 * Validates the request body for claim creation
 * 
 * @returns Express middleware function that validates claim creation data
 */
export const validateCreateClaim = (): RequestHandler => {
  return validateBody(createClaimSchema);
};

/**
 * Validates the request body for claim updates
 * 
 * @returns Express middleware function that validates claim update data
 */
export const validateUpdateClaim = (): RequestHandler => {
  return validateBody(updateClaimSchema);
};

/**
 * Validates the request body for claim status updates
 * 
 * @returns Express middleware function that validates claim status update data
 */
export const validateUpdateClaimStatus = (): RequestHandler => {
  return validateBody(updateClaimStatusSchema);
};

/**
 * Validates the request body for claim submission
 * 
 * @returns Express middleware function that validates claim submission data
 */
export const validateSubmitClaim = (): RequestHandler => {
  return validateBody(submitClaimSchema);
};

/**
 * Validates the request body for batch claim submission
 * 
 * @returns Express middleware function that validates batch claim submission data
 */
export const validateBatchSubmitClaims = (): RequestHandler => {
  return validateBody(batchSubmitClaimsSchema);
};

/**
 * Validates the request body for claim validation requests
 * 
 * @returns Express middleware function that validates claim validation request data
 */
export const validateClaimValidationRequest = (): RequestHandler => {
  return validateBody(claimValidationRequestSchema);
};

/**
 * Validates query parameters for claim listing and filtering
 * 
 * @returns Express middleware function that validates claim query parameters
 */
export const validateClaimQuery = (): RequestHandler => {
  return validateQuery(claimQuerySchema);
};

/**
 * Validates the claim ID route parameter
 * 
 * @returns Express middleware function that validates claim ID parameter
 */
export const validateClaimIdParam = (): RequestHandler => {
  return validateParams(z.object({ id: z.string().uuid() }));
};