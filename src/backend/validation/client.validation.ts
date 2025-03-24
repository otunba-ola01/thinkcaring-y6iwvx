import { Request, Response, NextFunction } from 'express'; // version 4.18+
import { z } from 'zod'; // version 3.21+

import { 
  validateBody, 
  validateQuery, 
  validateParams, 
  validateParamsAndBody 
} from '../middleware/validation.middleware';

import {
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema,
  createClientProgramSchema,
  updateClientProgramSchema,
  createClientInsuranceSchema,
  updateClientInsuranceSchema,
  clientQuerySchema
} from './schemas/client.schema';

import { IdParam } from '../types/request.types';

// Define the schema for a route with client ID param
const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * Middleware that validates client creation request body against the createClientSchema
 * 
 * @returns Express middleware function that validates client creation data
 */
export const validateCreateClient = () => {
  return validateBody(createClientSchema);
};

/**
 * Middleware that validates client update request body against the updateClientSchema
 * 
 * @returns Express middleware function that validates client update data
 */
export const validateUpdateClient = () => {
  return validateParamsAndBody(idParamSchema, updateClientSchema);
};

/**
 * Middleware that validates client status update request body against the updateClientStatusSchema
 * 
 * @returns Express middleware function that validates client status update data
 */
export const validateUpdateClientStatus = () => {
  return validateParamsAndBody(idParamSchema, updateClientStatusSchema);
};

/**
 * Middleware that validates client program creation request body against the createClientProgramSchema
 * 
 * @returns Express middleware function that validates client program creation data
 */
export const validateCreateClientProgram = () => {
  return validateParamsAndBody(idParamSchema, createClientProgramSchema);
};

/**
 * Middleware that validates client program update request body against the updateClientProgramSchema
 * 
 * @returns Express middleware function that validates client program update data
 */
export const validateUpdateClientProgram = () => {
  const programParamsSchema = z.object({ 
    id: z.string().uuid(), 
    programId: z.string().uuid() 
  });
  return validateParamsAndBody(programParamsSchema, updateClientProgramSchema);
};

/**
 * Middleware that validates client insurance creation request body against the createClientInsuranceSchema
 * 
 * @returns Express middleware function that validates client insurance creation data
 */
export const validateCreateClientInsurance = () => {
  return validateParamsAndBody(idParamSchema, createClientInsuranceSchema);
};

/**
 * Middleware that validates client insurance update request body against the updateClientInsuranceSchema
 * 
 * @returns Express middleware function that validates client insurance update data
 */
export const validateUpdateClientInsurance = () => {
  const insuranceParamsSchema = z.object({ 
    id: z.string().uuid(), 
    insuranceId: z.string().uuid() 
  });
  return validateParamsAndBody(insuranceParamsSchema, updateClientInsuranceSchema);
};

/**
 * Middleware that validates client query parameters against the clientQuerySchema
 * 
 * @returns Express middleware function that validates client query parameters
 */
export const validateClientQuery = () => {
  return validateQuery(clientQuerySchema);
};

/**
 * Middleware that validates client ID parameter in route
 * 
 * @returns Express middleware function that validates client ID parameter
 */
export const validateClientIdParam = () => {
  return validateParams(idParamSchema);
};