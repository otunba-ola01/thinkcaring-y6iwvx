import { Request, Response, NextFunction } from 'express'; // version 4.18+

import { validateBody, validateQuery, validateParamsAndBody } from '../middleware/validation.middleware';
import {
  createServiceSchema,
  updateServiceSchema,
  updateServiceBillingStatusSchema,
  updateServiceDocumentationStatusSchema,
  serviceQuerySchema,
  serviceValidationRequestSchema,
  serviceImportSchema
} from './schemas/service.schema';

/**
 * Middleware that validates service creation request body
 * 
 * This middleware ensures that all required fields for creating a new service are present
 * and valid, including client ID, service type, service date, units, rate, and other
 * required information. It uses Zod schemas to enforce data types, formats, and business rules.
 * 
 * @param req - Express request object containing the service data in req.body
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateCreateService = (req: Request, res: Response, next: NextFunction): void => {
  validateBody(createServiceSchema)(req, res, next);
};

/**
 * Middleware that validates service update request body
 * 
 * This middleware validates both the service ID in the request parameters and
 * the service update data in the request body. It ensures the ID is a valid UUID
 * and that the update data conforms to the service update schema requirements.
 * 
 * @param req - Express request object containing service ID in req.params and update data in req.body
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateUpdateService = (req: Request, res: Response, next: NextFunction): void => {
  validateParamsAndBody(
    // ID parameter schema is handled internally by validateParamsAndBody
    { id: 'uuid' }, // Simplified schema reference - the actual validation is done by the middleware
    updateServiceSchema
  )(req, res, next);
};

/**
 * Middleware that validates service billing status update request
 * 
 * This middleware validates both the service ID in the request parameters and
 * the billing status update data in the request body. It ensures the ID is a valid UUID
 * and that the billing status update data includes valid status values and required
 * claim ID when the status is set to IN_CLAIM.
 * 
 * @param req - Express request object containing service ID in req.params and billing status data in req.body
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateUpdateServiceBillingStatus = (req: Request, res: Response, next: NextFunction): void => {
  validateParamsAndBody(
    { id: 'uuid' }, // Simplified schema reference
    updateServiceBillingStatusSchema
  )(req, res, next);
};

/**
 * Middleware that validates service documentation status update request
 * 
 * This middleware validates both the service ID in the request parameters and
 * the documentation status update data in the request body. It ensures the ID is a valid UUID
 * and that the documentation status update data includes valid status values and optional
 * document IDs.
 * 
 * @param req - Express request object containing service ID in req.params and documentation status data in req.body
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateUpdateServiceDocumentationStatus = (req: Request, res: Response, next: NextFunction): void => {
  validateParamsAndBody(
    { id: 'uuid' }, // Simplified schema reference
    updateServiceDocumentationStatusSchema
  )(req, res, next);
};

/**
 * Middleware that validates service query parameters
 * 
 * This middleware validates query parameters used for filtering, sorting, and paginating
 * service listings. It ensures that parameters like clientId, programId, dateRange, and
 * status filters are valid and properly formatted. It also validates date ranges to ensure
 * startDate is before or equal to endDate.
 * 
 * @param req - Express request object containing query parameters in req.query
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateServiceQuery = (req: Request, res: Response, next: NextFunction): void => {
  validateQuery(serviceQuerySchema)(req, res, next);
};

/**
 * Middleware that validates service validation request body
 * 
 * This middleware validates requests to perform validation checks on multiple services.
 * It ensures that the request contains a valid array of service IDs to validate and that
 * at least one service ID is provided. This is used before performing business rule validation
 * on services to ensure they are eligible for billing.
 * 
 * @param req - Express request object containing service IDs in req.body.serviceIds
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateServiceValidationRequest = (req: Request, res: Response, next: NextFunction): void => {
  validateBody(serviceValidationRequestSchema)(req, res, next);
};

/**
 * Middleware that validates service import request body
 * 
 * This middleware validates service data being imported from external systems.
 * It ensures that all required fields for service import are present and valid,
 * following the import schema requirements including clientId, serviceTypeId,
 * serviceDate, units, and rate.
 * 
 * @param req - Express request object containing service import data in req.body
 * @param res - Express response object
 * @param next - Express next function
 * @returns Calls next middleware if validation passes, otherwise sends validation error response
 */
export const validateServiceImport = (req: Request, res: Response, next: NextFunction): void => {
  validateBody(serviceImportSchema)(req, res, next);
};