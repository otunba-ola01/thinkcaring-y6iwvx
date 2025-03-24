/**
 * Validation middleware for integration-related requests in the HCBS Revenue Management System.
 * This file defines schemas and middleware functions that validate integration configurations,
 * connection testing, and operation requests to ensure data integrity and security.
 * 
 * These validations protect against malformed data, injection attacks, and ensure proper
 * integration configurations for external systems including EHR/EMR systems, clearinghouses,
 * payer systems, and accounting platforms.
 */

import { z } from 'zod'; // version 3.21.0
import {
  validateBody,
  validateParams,
  validateQuery,
  validateParamsAndBody
} from '../middleware/validation.middleware';
import {
  IntegrationType,
  IntegrationProtocol,
  DataFormat,
  AuthenticationType,
  IntegrationStatus,
  EDITransactionType
} from '../types/integration.types';

// Base schemas for common integration fields

/**
 * Base schema for integration ID parameters
 * Ensures that integration identifiers are valid UUIDs
 */
const integrationIdSchema = z.object({
  integrationId: z.string().uuid('Integration ID must be a valid UUID')
});

/**
 * Base schema for common integration fields used across different integration types
 * Provides validation for the shared properties of all integration configurations
 */
const baseIntegrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Name contains invalid characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  type: z.nativeEnum(IntegrationType, {
    errorMap: () => ({ message: 'Invalid integration type' })
  }),
  protocol: z.nativeEnum(IntegrationProtocol, {
    errorMap: () => ({ message: 'Invalid integration protocol' })
  }),
  baseUrl: z.string().url('Base URL must be a valid URL'),
  authType: z.nativeEnum(AuthenticationType, {
    errorMap: () => ({ message: 'Invalid authentication type' })
  }),
  credentials: z.record(z.string(), z.string()),
  headers: z.record(z.string(), z.string()).optional(),
  status: z.nativeEnum(IntegrationStatus, {
    errorMap: () => ({ message: 'Invalid integration status' })
  }).optional(),
  timeout: z.number().int().positive().max(300000, 'Timeout cannot exceed 5 minutes (300000ms)').optional(),
  retryLimit: z.number().int().min(0).max(10, 'Retry limit cannot exceed 10').optional()
});

/**
 * Schema for integration query parameters
 * Validates filter and pagination parameters for integration list requests
 */
const integrationQuerySchema = z.object({
  type: z.nativeEnum(IntegrationType, {
    errorMap: () => ({ message: 'Invalid integration type' })
  }).optional(),
  status: z.nativeEnum(IntegrationStatus, {
    errorMap: () => ({ message: 'Invalid integration status' })
  }).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a positive number').transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive number').transform(Number)
    .refine(val => val <= 100, 'Limit cannot exceed 100').optional(),
  search: z.string().max(100, 'Search query cannot exceed 100 characters').optional()
});

/**
 * Schema for integration request options
 * Validates optional parameters for integration operation requests
 */
const integrationRequestOptionsSchema = z.object({
  timeout: z.number().int().positive().max(300000, 'Timeout cannot exceed 5 minutes').optional(),
  retryCount: z.number().int().min(0).max(10, 'Retry count cannot exceed 10').optional(),
  retryDelay: z.number().int().min(0).max(60000, 'Retry delay cannot exceed 1 minute').optional(),
  headers: z.record(z.string(), z.string()).optional(),
  correlationId: z.string().uuid('Correlation ID must be a valid UUID').optional(),
  priority: z.number().int().min(1).max(10, 'Priority must be between 1 and 10').optional()
}).optional();

/**
 * Schema for integration request validation
 * Validates integration operation requests with operation name, data, and options
 */
const integrationRequestSchema = z.object({
  operation: z.string().min(1, 'Operation is required')
    .max(100, 'Operation name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\-_\.]+$/, 'Operation contains invalid characters'),
  data: z.any(),
  options: integrationRequestOptionsSchema
});

// Integration-specific schemas

/**
 * Schema for EHR integration configuration
 * Validates EHR/EMR system integration details
 */
const ehrIntegrationSchema = z.object({
  type: z.literal(IntegrationType.EHR),
  ehrSystem: z.string().min(1, 'EHR system name is required')
    .max(100, 'EHR system name cannot exceed 100 characters'),
  version: z.string().min(1, 'Version is required')
    .max(50, 'Version cannot exceed 50 characters'),
  dataFormat: z.nativeEnum(DataFormat, {
    errorMap: () => ({ message: 'Invalid data format' })
  }),
  endpoints: z.record(z.string(), z.string().url('Endpoint URL must be a valid URL')),
  clientMapping: z.record(z.string(), z.string()),
  serviceMapping: z.record(z.string(), z.string()),
  authorizationMapping: z.record(z.string(), z.string()),
  syncFrequency: z.string().min(1, 'Sync frequency is required')
    .max(50, 'Sync frequency cannot exceed 50 characters'),
  lastSyncDate: z.date().optional()
}).merge(baseIntegrationSchema);

/**
 * Schema for clearinghouse integration configuration
 * Validates clearinghouse system integration details for claim submission
 */
const clearinghouseIntegrationSchema = z.object({
  type: z.literal(IntegrationType.CLEARINGHOUSE),
  clearinghouseSystem: z.string().min(1, 'Clearinghouse system name is required')
    .max(100, 'Clearinghouse system name cannot exceed 100 characters'),
  submitterInfo: z.record(z.string(), z.string()),
  receiverInfo: z.record(z.string(), z.string()),
  supportedTransactions: z.array(
    z.nativeEnum(EDITransactionType, {
      errorMap: () => ({ message: 'Invalid EDI transaction type' })
    })
  ).nonempty('At least one transaction type must be supported')
   .max(10, 'Cannot exceed 10 transaction types'),
  endpoints: z.record(z.string(), z.string().url('Endpoint URL must be a valid URL')),
  testMode: z.boolean(),
  batchSize: z.number().int().positive().max(10000, 'Batch size cannot exceed 10000'),
  submissionSchedule: z.string().min(1, 'Submission schedule is required')
    .max(50, 'Submission schedule cannot exceed 50 characters'),
  lastSubmissionDate: z.date().optional()
}).merge(baseIntegrationSchema);

/**
 * Schema for accounting integration configuration
 * Validates accounting system integration details for financial data synchronization
 */
const accountingIntegrationSchema = z.object({
  type: z.literal(IntegrationType.ACCOUNTING),
  accountingSystem: z.string().min(1, 'Accounting system name is required')
    .max(100, 'Accounting system name cannot exceed 100 characters'),
  version: z.string().min(1, 'Version is required')
    .max(50, 'Version cannot exceed 50 characters'),
  dataFormat: z.nativeEnum(DataFormat, {
    errorMap: () => ({ message: 'Invalid data format' })
  }),
  endpoints: z.record(z.string(), z.string().url('Endpoint URL must be a valid URL')),
  accountMapping: z.record(z.string(), z.string()),
  syncFrequency: z.string().min(1, 'Sync frequency is required')
    .max(50, 'Sync frequency cannot exceed 50 characters'),
  lastSyncDate: z.date().optional()
}).merge(baseIntegrationSchema);

/**
 * Schema for Medicaid integration configuration
 * Validates Medicaid portal integration details for state-specific interactions
 */
const medicaidIntegrationSchema = z.object({
  type: z.literal(IntegrationType.MEDICAID),
  state: z.string().min(1, 'State is required').max(2, 'State must be a 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be a 2-letter state code (e.g., NY, CA)'),
  portalSystem: z.string().min(1, 'Portal system name is required')
    .max(100, 'Portal system name cannot exceed 100 characters'),
  providerNumber: z.string().min(1, 'Provider number is required')
    .max(50, 'Provider number cannot exceed 50 characters'),
  submitterInfo: z.record(z.string(), z.string()),
  supportedTransactions: z.array(
    z.nativeEnum(EDITransactionType, {
      errorMap: () => ({ message: 'Invalid EDI transaction type' })
    })
  ).nonempty('At least one transaction type must be supported')
   .max(10, 'Cannot exceed 10 transaction types'),
  endpoints: z.record(z.string(), z.string().url('Endpoint URL must be a valid URL')),
  testMode: z.boolean()
}).merge(baseIntegrationSchema);

/**
 * Schema for remittance integration configuration
 * Validates remittance processing integration details for payment file handling
 */
const remittanceIntegrationSchema = z.object({
  type: z.literal(IntegrationType.REMITTANCE),
  sourceType: z.string().min(1, 'Source type is required')
    .max(50, 'Source type cannot exceed 50 characters'),
  fileFormat: z.nativeEnum(DataFormat, {
    errorMap: () => ({ message: 'Invalid file format' })
  }),
  importDirectory: z.string().min(1, 'Import directory is required')
    .max(255, 'Import directory path cannot exceed 255 characters'),
  archiveDirectory: z.string().min(1, 'Archive directory is required')
    .max(255, 'Archive directory path cannot exceed 255 characters'),
  errorDirectory: z.string().min(1, 'Error directory is required')
    .max(255, 'Error directory path cannot exceed 255 characters'),
  processingFrequency: z.string().min(1, 'Processing frequency is required')
    .max(50, 'Processing frequency cannot exceed 50 characters'),
  lastProcessedDate: z.date().optional(),
  archiveProcessedFiles: z.boolean(),
  archiveFailedFiles: z.boolean()
}).merge(baseIntegrationSchema);

/**
 * Schema for custom integration configuration
 * Validates custom integration types with flexible settings
 */
const customIntegrationSchema = z.object({
  type: z.literal(IntegrationType.CUSTOM),
  customSettings: z.record(z.string(), z.unknown())
}).merge(baseIntegrationSchema);

/**
 * Combined integration schema that validates based on integration type
 * Uses a discriminated union to apply appropriate validation based on the 'type' field
 */
const createIntegrationSchema = z.discriminatedUnion('type', [
  ehrIntegrationSchema,
  clearinghouseIntegrationSchema,
  accountingIntegrationSchema,
  medicaidIntegrationSchema,
  remittanceIntegrationSchema,
  customIntegrationSchema
]);

/**
 * Partial version of the integration schema for updates
 * Allows partial updates while requiring the 'type' field to determine validation rules
 */
const updateIntegrationSchema = z.discriminatedUnion('type', [
  ehrIntegrationSchema.partial().required({ type: true }),
  clearinghouseIntegrationSchema.partial().required({ type: true }),
  accountingIntegrationSchema.partial().required({ type: true }),
  medicaidIntegrationSchema.partial().required({ type: true }),
  remittanceIntegrationSchema.partial().required({ type: true }),
  customIntegrationSchema.partial().required({ type: true })
]);

// Middleware factory functions

/**
 * Middleware function that validates integration creation requests
 * Ensures all required fields and type-specific configuration details are present and valid
 * 
 * @returns Express middleware function that validates integration creation requests
 */
export const validateCreateIntegration = () => {
  return validateBody(createIntegrationSchema);
};

/**
 * Middleware function that validates integration update requests
 * Validates both the integration ID parameter and the partial update payload
 * 
 * @returns Express middleware function that validates integration update requests
 */
export const validateUpdateIntegration = () => {
  return validateParamsAndBody(
    integrationIdSchema, 
    updateIntegrationSchema
  );
};

/**
 * Middleware function that validates integration query parameters
 * Ensures filtering and pagination parameters are valid
 * 
 * @returns Express middleware function that validates integration query parameters
 */
export const validateIntegrationQuery = () => {
  return validateQuery(integrationQuerySchema);
};

/**
 * Middleware function that validates integration test connection requests
 * Ensures the integration ID parameter is a valid UUID
 * 
 * @returns Express middleware function that validates test connection requests
 */
export const validateTestConnection = () => {
  return validateParams(integrationIdSchema);
};

/**
 * Middleware function that validates integration operation requests
 * Ensures both the integration ID and operation details are valid
 * 
 * @returns Express middleware function that validates integration operation requests
 */
export const validateIntegrationRequest = () => {
  return validateParamsAndBody(
    integrationIdSchema,
    integrationRequestSchema
  );
};

/**
 * Middleware function that validates EHR integration configuration
 * Applies EHR-specific validation rules for configuration requests
 * 
 * @returns Express middleware function that validates EHR integration configuration
 */
export const validateEHRIntegrationConfig = () => {
  return validateBody(ehrIntegrationSchema);
};

/**
 * Middleware function that validates clearinghouse integration configuration
 * Applies clearinghouse-specific validation rules for configuration requests
 * 
 * @returns Express middleware function that validates clearinghouse integration configuration
 */
export const validateClearinghouseIntegrationConfig = () => {
  return validateBody(clearinghouseIntegrationSchema);
};

/**
 * Middleware function that validates accounting system integration configuration
 * Applies accounting-specific validation rules for configuration requests
 * 
 * @returns Express middleware function that validates accounting integration configuration
 */
export const validateAccountingIntegrationConfig = () => {
  return validateBody(accountingIntegrationSchema);
};

/**
 * Middleware function that validates Medicaid portal integration configuration
 * Applies Medicaid-specific validation rules for configuration requests
 * 
 * @returns Express middleware function that validates Medicaid integration configuration
 */
export const validateMedicaidIntegrationConfig = () => {
  return validateBody(medicaidIntegrationSchema);
};

/**
 * Middleware function that validates remittance processing integration configuration
 * Applies remittance-specific validation rules for configuration requests
 * 
 * @returns Express middleware function that validates remittance integration configuration
 */
export const validateRemittanceIntegrationConfig = () => {
  return validateBody(remittanceIntegrationSchema);
};