/**
 * @fileoverview Controller that handles HTTP requests for billing operations in the HCBS Revenue Management System. This controller implements endpoints for validating services for billing, converting services to claims, submitting claims to payers, managing the billing queue, and retrieving billing dashboard metrics.
 */

import { Request, Response } from 'express'; // express 4.18+
import { BillingService } from '../services/billing.service'; // Import billing service for handling business logic of billing operations
import { UUID } from '../types/common.types'; // Import UUID type for service and claim identification
import { BillingValidationRequest, BillingValidationResponse, ServiceToClaimRequest, ServiceToClaimResponse, BillingSubmissionRequest, BillingSubmissionResponse, BatchBillingSubmissionRequest, BatchBillingSubmissionResponse, BillingQueueFilter, BillingQueueResponse, BillingDashboardMetrics } from '../types/billing.types'; // Import billing-related interfaces for request/response handling
import { SubmissionMethod } from '../types/claims.types'; // Import claim submission method enum for validation
import { ValidationResult } from '../types/common.types'; // Import validation result interface for returning validation outcomes
import { RequestWithBody, RequestWithParamsAndBody, RequestWithQuery, Request } from '../types/request.types'; // Import request type interfaces for type-safe request handling
import { SuccessResponse, PaginatedResponse, ValidationFailureResponse } from '../types/response.types'; // Import response helper functions for standardized API responses
import { logger } from '../utils/logger'; // Import logger for controller operations logging

/**
 * Validates services against all billing requirements including documentation and authorization
 * @param req - RequestWithBody<BillingValidationRequest>: Request object containing service IDs to validate
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with validation results
 */
export const validateServicesForBilling = async (
  req: RequestWithBody<BillingValidationRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Validating services for billing', { serviceIds: req.body.serviceIds }); // Log the start of service validation with request details
  try {
    const serviceIds = req.body.serviceIds; // Extract service IDs from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const validationResponse: BillingValidationResponse = await BillingService.validateServicesForBilling(serviceIds, userId); // Call BillingService.validateServicesForBilling with service IDs and user ID

    logger.info('Services validated successfully', { serviceIds: req.body.serviceIds, isValid: validationResponse.isValid }); // Log successful validation

    return SuccessResponse(validationResponse, 'Services validated successfully'); // If validation is successful, return success response with validation results
  } catch (error: any) {
    logger.error('Service validation failed', { error: error.message, stack: error.stack, serviceIds: req.body.serviceIds }); // Log error if validation fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'VALIDATION_FAILED' }], null, 'Service validation failed'); // If validation fails, return validation failure response with errors and warnings
  }
};

/**
 * Converts validated services into a billable claim
 * @param req - RequestWithBody<ServiceToClaimRequest>: Request object containing service IDs and payer information
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with created claim or validation errors
 */
export const convertServicesToClaim = async (
  req: RequestWithBody<ServiceToClaimRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Converting services to claim', { serviceIds: req.body.serviceIds, payerId: req.body.payerId }); // Log the start of service-to-claim conversion with request details
  try {
    const { serviceIds, payerId, notes } = req.body; // Extract service IDs, payer ID, and notes from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const conversionResponse: ServiceToClaimResponse = await BillingService.convertServicesToClaim({ serviceIds, payerId, notes }, userId); // Call BillingService.convertServicesToClaim with request data and user ID

    logger.info('Services converted to claim successfully', { claimId: conversionResponse.claim?.id, serviceIds: req.body.serviceIds }); // Log successful conversion

    if (conversionResponse.success) {
      return SuccessResponse(conversionResponse.claim, 'Claim created successfully'); // If conversion is successful, return success response with claim information
    } else {
      return ValidationFailureResponse(false, conversionResponse.validationResult?.errors, conversionResponse.validationResult?.warnings, 'Claim creation failed'); // If conversion fails, return validation failure response with errors
    }
  } catch (error: any) {
    logger.error('Claim conversion failed', { error: error.message, stack: error.stack, serviceIds: req.body.serviceIds, payerId: req.body.payerId }); // Log error if conversion fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'CLAIM_CREATION_FAILED' }], null, 'Claim conversion failed'); // If conversion fails, return validation failure response with errors
  }
};

/**
 * Validates services and converts them to a claim if validation is successful
 * @param req - RequestWithBody<ServiceToClaimRequest>: Request object containing service IDs and payer information
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with created claim and validation results
 */
export const validateAndConvertToClaim = async (
  req: RequestWithBody<ServiceToClaimRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Validating and converting services to claim', { serviceIds: req.body.serviceIds, payerId: req.body.payerId }); // Log the validate and convert request with service IDs
  try {
    const { serviceIds, payerId, notes } = req.body; // Extract service IDs, payer ID, and notes from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const conversionResponse: ServiceToClaimResponse = await BillingService.validateAndConvertToClaim({ serviceIds, payerId, notes }, userId); // Call BillingService.validateAndConvertToClaim with request data and user ID

    logger.info('Services validated and converted to claim successfully', { claimId: conversionResponse.claim?.id, serviceIds: req.body.serviceIds }); // Log successful validation and conversion

    if (conversionResponse.success) {
      return SuccessResponse(conversionResponse.claim, 'Claim created successfully'); // If validation and conversion are successful, return success response with claim information
    } else {
      return ValidationFailureResponse(false, conversionResponse.validationResult?.errors, conversionResponse.validationResult?.warnings, 'Claim creation failed'); // If validation fails, return validation failure response with errors
    }
  } catch (error: any) {
    logger.error('Claim validation and conversion failed', { error: error.message, stack: error.stack, serviceIds: req.body.serviceIds, payerId: req.body.payerId }); // Log error if validation and conversion fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'CLAIM_CREATION_FAILED' }], null, 'Claim validation and conversion failed'); // If validation fails, return validation failure response with errors
  }
};

/**
 * Converts multiple sets of services into claims in a batch process
 * @param req - RequestWithBody<Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>>: Request object containing an array of service batches
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with batch processing results
 */
export const batchConvertServicesToClaims = async (
  req: RequestWithBody<Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>>,
  res: Response
): Promise<Response> => {
  logger.debug('Starting batch conversion of services to claims', { batchCount: req.body.length }); // Log the start of batch conversion process with number of batches
  try {
    const batchData = req.body; // Extract batch data from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const batchResults = await BillingService.batchConvertServicesToClaims(batchData, userId); // Call BillingService.batchConvertServicesToClaims with batch data and user ID

    logger.info('Batch conversion completed', { totalProcessed: batchResults.totalProcessed, successCount: batchResults.successCount, errorCount: batchResults.errorCount }); // Log completion with counts

    return SuccessResponse(batchResults, 'Batch conversion completed'); // Return success response with batch results including counts, errors, and created claim IDs
  } catch (error: any) {
    logger.error('Batch conversion failed', { error: error.message, stack: error.stack }); // Log error if batch conversion fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'BATCH_CONVERSION_FAILED' }], null, 'Batch conversion failed'); // Return validation failure response with errors
  }
};

/**
 * Submits a validated claim to a payer through the specified submission method
 * @param req - RequestWithBody<BillingSubmissionRequest>: Request object containing claim ID and submission details
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with submission result
 */
export const submitClaim = async (
  req: RequestWithBody<BillingSubmissionRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Submitting claim', { claimId: req.body.claimId, submissionMethod: req.body.submissionMethod }); // Log the start of claim submission with request details
  try {
    const { claimId, submissionMethod, submissionDate, externalClaimId, notes } = req.body; // Extract claim ID, submission method, and other details from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const submissionResponse: BillingSubmissionResponse = await BillingService.submitClaim({ claimId, submissionMethod, submissionDate, externalClaimId, notes }, userId); // Call BillingService.submitClaim with request data and user ID

    logger.info('Claim submitted successfully', { claimId: req.body.claimId, confirmationNumber: submissionResponse.confirmationNumber }); // Log successful submission

    return SuccessResponse(submissionResponse, 'Claim submitted successfully'); // Return success response with submission results including confirmation number and submission date
  } catch (error: any) {
    logger.error('Claim submission failed', { error: error.message, stack: error.stack, claimId: req.body.claimId, submissionMethod: req.body.submissionMethod }); // Log error if submission fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'CLAIM_SUBMISSION_FAILED' }], null, 'Claim submission failed'); // Return validation failure response with errors
  }
};

/**
 * Validates a claim and submits it if validation is successful
 * @param req - RequestWithBody<BillingSubmissionRequest>: Request object containing claim ID and submission details
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with validation and submission results
 */
export const validateAndSubmitClaim = async (
  req: RequestWithBody<BillingSubmissionRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Validating and submitting claim', { claimId: req.body.claimId, submissionMethod: req.body.submissionMethod }); // Log the validate and submit request with claim ID
  try {
    const { claimId, submissionMethod, submissionDate, externalClaimId, notes } = req.body; // Extract claim ID, submission method, and other details from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const submissionResponse: BillingSubmissionResponse = await BillingService.validateAndSubmitClaim({ claimId, submissionMethod, submissionDate, externalClaimId, notes }, userId); // Call BillingService.validateAndSubmitClaim with request data and user ID

    logger.info('Claim validated and submitted successfully', { claimId: req.body.claimId, confirmationNumber: submissionResponse.confirmationNumber }); // Log successful validation and submission

    if (submissionResponse.success) {
      return SuccessResponse(submissionResponse, 'Claim validated and submitted successfully'); // If validation and submission are successful, return success response with submission results
    } else {
      return ValidationFailureResponse(false, submissionResponse.validationResult?.errors, submissionResponse.validationResult?.warnings, 'Claim validation and submission failed'); // If validation fails, return validation failure response with errors
    }
  } catch (error: any) {
    logger.error('Claim validation and submission failed', { error: error.message, stack: error.stack, claimId: req.body.claimId, submissionMethod: req.body.submissionMethod }); // Log error if validation and submission fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'CLAIM_SUBMISSION_FAILED' }], null, 'Claim validation and submission failed'); // If validation fails, return validation failure response with errors
  }
};

/**
 * Submits multiple validated claims to payers in a batch process
 * @param req - RequestWithBody<BatchBillingSubmissionRequest>: Request object containing claim IDs and submission details
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with batch submission results
 */
export const batchSubmitClaims = async (
  req: RequestWithBody<BatchBillingSubmissionRequest>,
  res: Response
): Promise<Response> => {
  logger.debug('Submitting claims in batch', { claimIds: req.body.claimIds, submissionMethod: req.body.submissionMethod }); // Log the start of batch submission with request details
  try {
    const { claimIds, submissionMethod, submissionDate, notes } = req.body; // Extract claim IDs, submission method, and other details from the request body
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const batchResults: BatchBillingSubmissionResponse = await BillingService.batchSubmitClaims({ claimIds, submissionMethod, submissionDate, notes }, userId); // Call BillingService.batchSubmitClaims with request data and user ID

    logger.info('Batch submission completed', { totalProcessed: batchResults.totalProcessed, successCount: batchResults.successCount, errorCount: batchResults.errorCount }); // Log completion with counts

    return SuccessResponse(batchResults, 'Batch submission completed'); // Return success response with batch submission results including processed claims, success count, and error details
  } catch (error: any) {
    logger.error('Batch submission failed', { error: error.message, stack: error.stack, claimIds: req.body.claimIds, submissionMethod: req.body.submissionMethod }); // Log error if batch submission fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'BATCH_SUBMISSION_FAILED' }], null, 'Batch submission failed'); // Return validation failure response with errors
  }
};

/**
 * Retrieves services that are ready for billing with optional filtering
 * @param req - RequestWithQuery<{ filter?: BillingQueueFilter, page?: string, pageSize?: string }>: Request object containing filter and pagination parameters
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with paginated list of billable services
 */
export const getBillingQueue = async (
  req: RequestWithQuery<{ filter?: BillingQueueFilter; page?: string; pageSize?: string }>,
  res: Response
): Promise<Response> => {
  logger.debug('Retrieving billing queue', { query: req.query }); // Log the billing queue request with filter parameters
  try {
    const filter = req.query.filter || {}; // Extract filter from the query parameters
    const page = parseInt(req.query.page as string) || 1; // Parse page to number with default if not provided
    const pageSize = parseInt(req.query.pageSize as string) || 10; // Parse pageSize to number with default if not provided

    const billingQueue: BillingQueueResponse = await BillingService.getBillingQueue(filter, page, pageSize); // Call BillingService.getBillingQueue with filter and pagination parameters

    logger.info('Billing queue retrieved successfully', { total: billingQueue.total, page, pageSize }); // Log successful retrieval

    return PaginatedResponse(billingQueue.services, { page, limit: pageSize, totalItems: billingQueue.total, totalPages: billingQueue.totalPages }, 'Billing queue retrieved successfully'); // Return paginated response with services, total count, and pagination metadata
  } catch (error: any) {
    logger.error('Failed to retrieve billing queue', { error: error.message, stack: error.stack }); // Log error if retrieval fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'QUEUE_RETRIEVAL_FAILED' }], null, 'Failed to retrieve billing queue'); // Return validation failure response with errors
  }
};

/**
 * Validates that a claim meets all requirements for submission
 * @param req - RequestWithParamsAndBody<{ id: UUID }, { submissionMethod: SubmissionMethod }>: Request object containing claim ID and submission method
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with validation results
 */
export const validateSubmissionRequirements = async (
  req: RequestWithParamsAndBody<{ id: UUID }, { submissionMethod: SubmissionMethod }>,
  res: Response
): Promise<Response> => {
  logger.debug('Validating submission requirements', { claimId: req.params.id, submissionMethod: req.body.submissionMethod }); // Log the validation request with claim ID and submission method
  try {
    const claimId = req.params.id; // Extract claim ID from the request parameters
    const submissionMethod = req.body.submissionMethod; // Extract submission method from the request body

    const validationResult: ValidationResult = await BillingService.validateSubmissionRequirements(claimId, submissionMethod); // Call BillingService.validateSubmissionRequirements with claim ID and submission method

    logger.info('Submission requirements validated successfully', { claimId: req.params.id, isValid: validationResult.isValid }); // Log successful validation

    return SuccessResponse(validationResult, 'Submission requirements validated successfully'); // Return success response with validation results including errors and warnings
  } catch (error: any) {
    logger.error('Submission requirements validation failed', { error: error.message, stack: error.stack, claimId: req.params.id, submissionMethod: req.body.submissionMethod }); // Log error if validation fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'VALIDATION_FAILED' }], null, 'Submission requirements validation failed'); // Return validation failure response with errors
  }
};

/**
 * Retrieves metrics for the billing dashboard
 * @param req - Request: Express Request object
 * @param res - Response: Express Response object for sending HTTP responses
 * @returns Promise<Response>: HTTP response with billing dashboard metrics
 */
export const getBillingDashboardMetrics = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.debug('Retrieving billing dashboard metrics'); // Log the dashboard metrics request
  try {
    const userId = req.user?.id || null; // Extract user ID from the authenticated request

    const dashboardMetrics: BillingDashboardMetrics = await BillingService.getBillingDashboardMetrics(userId); // Call BillingService.getBillingDashboardMetrics with user ID

    logger.info('Billing dashboard metrics retrieved successfully'); // Log successful retrieval

    return SuccessResponse(dashboardMetrics, 'Billing dashboard metrics retrieved successfully'); // Return success response with dashboard metrics including unbilled services, documentation status, and upcoming deadlines
  } catch (error: any) {
    logger.error('Failed to retrieve billing dashboard metrics', { error: error.message, stack: error.stack }); // Log error if retrieval fails
    return ValidationFailureResponse(false, [{ field: 'general', message: error.message, code: 'METRICS_RETRIEVAL_FAILED' }], null, 'Failed to retrieve billing dashboard metrics'); // Return validation failure response with errors
  }
};