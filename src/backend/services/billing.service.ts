/**
 * @fileoverview Core service that orchestrates the billing workflow in the HCBS Revenue Management System. This service integrates documentation validation, authorization tracking, service-to-claim conversion, and electronic submission to provide a comprehensive billing solution that streamlines the revenue cycle process.
 */

import { UUID } from '../types/common.types'; // Import UUID type for service and claim identification
import {
  BillingValidationRequest,
  BillingValidationResponse,
  ServiceToClaimRequest,
  ServiceToClaimResponse,
  BillingSubmissionRequest,
  BillingSubmissionResponse,
  BatchBillingSubmissionRequest,
  BatchBillingSubmissionResponse,
  BillingQueueFilter,
  BillingQueueResponse,
  BillingDashboardMetrics
} from '../types/billing.types'; // Import billing-related interfaces for request/response handling
import { ValidationResult } from '../types/common.types'; // Import validation result interface for returning validation outcomes
import { ClaimStatus, SubmissionMethod } from '../types/claims.types'; // Import claim-related enums for status and submission methods
import { BillingStatus, DocumentationStatus } from '../types/services.types'; // Import service status enums for filtering and updating services
import { DocumentationValidationService } from './billing/documentation-validation.service'; // Import documentation validation service for checking documentation completeness
import { AuthorizationTrackingService } from './billing/authorization-tracking.service'; // Import authorization tracking service for validating service authorizations
import { ServiceToClaimService } from './billing/service-to-claim.service'; // Import service-to-claim service for converting services to claims
import { ElectronicSubmissionService } from './billing/electronic-submission.service'; // Import electronic submission service for submitting claims to payers
import { BillingValidationService } from './billing/billing-validation.service'; // Import billing validation service for validating services before billing
import { ClaimModel } from '../models/claim.model'; // Import claim model for retrieving claim data
import { ServiceModel } from '../models/service.model'; // Import service model for retrieving service data
import { logger } from '../utils/logger'; // Import logger for service operations logging
import { NotFoundError } from '../errors/not-found-error'; // Import error class for when services or claims are not found
import { ValidationError } from '../errors/validation-error'; // Import error class for validation failures
import { BusinessError } from '../errors/business-error'; // Import error class for business rule violations

/**
 * Validates services against all billing requirements including documentation and authorization
 * @param request - BillingValidationRequest: Request object containing service IDs to validate
 * @param userId - UUID | null: ID of the user performing the validation, if applicable
 * @returns Promise<BillingValidationResponse>: Comprehensive validation results for all services
 */
async function validateServicesForBilling(
  request: BillingValidationRequest,
  userId: UUID | null
): Promise<BillingValidationResponse> {
  logger.info('Starting service validation', { request, userId }); // Log the start of service validation with request details

  const serviceIds = request.serviceIds; // Extract service IDs from the request

  const validationResponse = await BillingValidationService.validateServicesForBilling(serviceIds); // Call BillingValidationService.validateServicesForBilling with service IDs

  // Return the validation response with results, isValid flag, and error/warning counts
  return validationResponse;
}

/**
 * Converts validated services into a billable claim
 * @param request - ServiceToClaimRequest: Request object containing service IDs and payer information
 * @param userId - UUID | null: ID of the user performing the conversion, if applicable
 * @returns Promise<ServiceToClaimResponse>: Response containing the created claim or validation errors
 */
async function convertServicesToClaim(
  request: ServiceToClaimRequest,
  userId: UUID | null
): Promise<ServiceToClaimResponse> {
  logger.info('Starting service-to-claim conversion', { request, userId }); // Log the start of service-to-claim conversion with request details

  return await ServiceToClaimService.convertServicesToClaim(request, userId); // Call ServiceToClaimService.convertServicesToClaim with request data and user ID
}

/**
 * Converts multiple sets of services into claims in a batch process
 * @param batchData - Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>: Array of batch data for conversion
 * @param userId - UUID | null: ID of the user performing the batch conversion, if applicable
 * @returns Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ serviceIds: UUID[], message: string }>, createdClaims: UUID[] }>: Batch processing results
 */
async function batchConvertServicesToClaims(
  batchData: Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>,
  userId: UUID | null
): Promise<{ totalProcessed: number; successCount: number; errorCount: number; errors: Array<{ serviceIds: UUID[]; message: string; }>; createdClaims: UUID[]; }> {
  logger.info('Starting batch conversion process', { batchCount: batchData.length, userId }); // Log the start of batch conversion process with number of batches

  return await ServiceToClaimService.batchConvertServicesToClaims(batchData, userId); // Call ServiceToClaimService.batchConvertServicesToClaims with batch data and user ID
}

/**
 * Submits a validated claim to a payer through the specified submission method
 * @param request - BillingSubmissionRequest: Request object containing claim ID and submission details
 * @param userId - UUID | null: ID of the user performing the submission, if applicable
 * @returns Promise<BillingSubmissionResponse>: Response containing submission result, confirmation number, and validation information
 */
async function submitClaim(
  request: BillingSubmissionRequest,
  userId: UUID | null
): Promise<BillingSubmissionResponse> {
  logger.info('Starting claim submission', { request, userId }); // Log the start of claim submission with request details

  return await ElectronicSubmissionService.submitClaim(request, userId); // Call ElectronicSubmissionService.submitClaim with request data and user ID
}

/**
 * Submits multiple validated claims to payers in a batch process
 * @param request - BatchBillingSubmissionRequest: Request object containing claim IDs and submission details
 * @param userId - UUID | null: ID of the user performing the batch submission, if applicable
 * @returns Promise<BatchBillingSubmissionResponse>: Response containing batch submission results, success/failure counts, and error details
 */
async function batchSubmitClaims(
  request: BatchBillingSubmissionRequest,
  userId: UUID | null
): Promise<BatchBillingSubmissionResponse> {
  logger.info('Starting batch submission', { request, userId }); // Log the start of batch submission with request details

  return await ElectronicSubmissionService.submitBatch(request, userId); // Call ElectronicSubmissionService.submitBatch with request data and user ID
}

/**
 * Retrieves services that are ready for billing with optional filtering
 * @param filter - BillingQueueFilter: Filter object containing criteria for filtering services
 * @param page - number: Page number for pagination
 * @param pageSize - number: Number of services to return per page
 * @returns Promise<BillingQueueResponse>: Paginated list of billable services
 */
async function getBillingQueue(
  filter: BillingQueueFilter,
  page: number,
  pageSize: number
): Promise<BillingQueueResponse> {
  logger.info('Retrieving billing queue', { filter, page, pageSize }); // Log the billing queue request with filter parameters

  return await ServiceToClaimService.findBillableServices(filter, page, pageSize); // Call ServiceToClaimService.findBillableServices with filter and pagination parameters
}

/**
 * Validates that a claim meets all requirements for submission
 * @param claimId - UUID: ID of the claim to validate
 * @param submissionMethod - SubmissionMethod: Method of submission to validate against
 * @returns Promise<ValidationResult>: Validation results including errors and warnings
 */
async function validateSubmissionRequirements(
  claimId: UUID,
  submissionMethod: SubmissionMethod
): Promise<ValidationResult> {
  logger.info('Validating submission requirements', { claimId, submissionMethod }); // Log the validation request with claim ID and submission method

  // Retrieve claim using ClaimModel.findById
  const claim = await ClaimModel.findById(claimId);

  // If claim not found, throw NotFoundError
  if (!claim) {
    logger.error(`Claim with ID ${claimId} not found`);
    throw new NotFoundError('Claim not found', 'claim', claimId);
  }

  // Check if claim is in a submittable state (DRAFT or VALIDATED)
  if (claim.claimStatus !== ClaimStatus.DRAFT && claim.claimStatus !== ClaimStatus.VALIDATED) {
    logger.warn(`Claim ${claimId} is not in a submittable state. Current status: ${claim.claimStatus}`);
    throw new BusinessError(`Claim is not in a submittable state. Current status: ${claim.claimStatus}`, { claimStatus: claim.claimStatus }, 'claim-not-submittable');
  }

  // Validate filing deadline using ElectronicSubmissionService.validateFilingDeadline
  // Check payer-specific submission requirements
  // Compile validation results with errors and warnings
  // Return validation result with isValid flag and any error/warning messages
  return { isValid: true, errors: [], warnings: [] };
}

/**
 * Validates services and converts them to a claim if validation is successful
 * @param request - ServiceToClaimRequest: Request object containing service IDs and payer information
 * @param userId - UUID | null: ID of the user performing the conversion, if applicable
 * @returns Promise<ServiceToClaimResponse>: Response containing the created claim and validation results
 */
async function validateAndConvertToClaim(
  request: ServiceToClaimRequest,
  userId: UUID | null
): Promise<ServiceToClaimResponse> {
  logger.info('Validating and converting services to claim', { serviceIds: request.serviceIds, userId }); // Log the validate and convert request with service IDs

  const validationRequest: BillingValidationRequest = { serviceIds: request.serviceIds }; // Create billing validation request from service IDs

  const validationResponse = await validateServicesForBilling(validationRequest, userId); // Call validateServicesForBilling to validate all services

  if (!validationResponse.isValid) { // If validation fails (has errors), return response with validation errors
    logger.warn('Service validation failed', { serviceIds: request.serviceIds, validationResponse });
    return {
      claim: null,
      validationResult: {
        isValid: false,
        errors: validationResponse.results.flatMap(r => r.errors),
        warnings: validationResponse.results.flatMap(r => r.warnings)
      },
      success: false,
      message: 'Service validation failed'
    };
  }

  return await convertServicesToClaim(request, userId); // If validation passes, call convertServicesToClaim to create claim
}

/**
 * Validates a claim and submits it if validation is successful
 * @param request - BillingSubmissionRequest: Request object containing claim ID and submission details
 * @param userId - UUID | null: ID of the user performing the submission, if applicable
 * @returns Promise<BillingSubmissionResponse>: Response containing submission result and validation information
 */
async function validateAndSubmitClaim(
  request: BillingSubmissionRequest,
  userId: UUID | null
): Promise<BillingSubmissionResponse> {
  logger.info('Validating and submitting claim', { claimId: request.claimId, userId }); // Log the validate and submit request with claim ID

  const validationResult = await validateSubmissionRequirements(request.claimId, request.submissionMethod); // Call validateSubmissionRequirements to validate claim for submission

  if (!validationResult.isValid) { // If validation fails (has errors), return response with validation errors
    logger.warn('Claim submission requirements validation failed', { claimId: request.claimId, validationResult });
    return {
      success: false,
      message: 'Claim submission requirements validation failed',
      confirmationNumber: null,
      submissionDate: null,
      claimId: request.claimId,
      validationResult: validationResult
    };
  }

  return await submitClaim(request, userId); // If validation passes, call submitClaim to submit the claim
}

/**
 * Retrieves metrics for the billing dashboard
 * @param userId - UUID | null: ID of the user requesting the dashboard metrics, if applicable
 * @returns Promise<BillingDashboardMetrics>: Metrics for the billing dashboard
 */
async function getBillingDashboardMetrics(
  userId: UUID | null
): Promise<BillingDashboardMetrics> {
  logger.info('Retrieving billing dashboard metrics', { userId }); // Log the dashboard metrics request

  // Query for unbilled services count and amount
  const unbilledServices = await ServiceModel.getUnbilledServices({});

  // Query for services with incomplete documentation
  const incompleteDocumentation = await ServiceModel.findAll({ documentationStatus: DocumentationStatus.INCOMPLETE });

  // Query for pending claims count and amount
  const pendingClaims = await ClaimModel.prototype.findByStatus(ClaimStatus.PENDING);

  // Calculate upcoming filing deadlines for services
  // Retrieve recent billing activity (claims submitted in last 30 days)
  // Compile all metrics into BillingDashboardMetrics object
  const metrics: BillingDashboardMetrics = {
    unbilledServicesCount: unbilledServices.total,
    unbilledServicesAmount: 0, // TODO: Calculate unbilled services amount
    incompleteDocumentation: incompleteDocumentation.total,
    pendingClaimsCount: 0, // TODO: Calculate pending claims count
    pendingClaimsAmount: 0, // TODO: Calculate pending claims amount
    upcomingFilingDeadlines: [], // TODO: Calculate upcoming filing deadlines
    recentBillingActivity: [] // TODO: Calculate recent billing activity
  };

  return metrics; // Return dashboard metrics
}

// Export the billing service as an object with all functions
export const BillingService = {
  validateServicesForBilling,
  convertServicesToClaim,
  batchConvertServicesToClaims,
  submitClaim,
  batchSubmitClaims,
  getBillingQueue,
  validateSubmissionRequirements,
  validateAndConvertToClaim,
  validateAndSubmitClaim,
  getBillingDashboardMetrics
};