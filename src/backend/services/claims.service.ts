import { UUID, DateRange } from '../types/common.types'; // Import common type definitions used in claim operations
import { ClaimStatus, ClaimWithRelations, ClaimSummary, ClaimQueryParams, ClaimValidationResult, ClaimBatchResult, BatchSubmitClaimsDto, SubmitClaimDto, UpdateClaimStatusDto, ClaimStatusHistory, ClaimMetrics } from '../types/claims.types'; // Import claim-specific type definitions
import { ClaimModel } from '../models/claim.model'; // Import claim model for retrieving claim data
import { ClaimValidationService } from './claims/claim-validation.service'; // Import validation service for claim validation operations
import { ClaimSubmissionService } from './claims/claim-submission.service'; // Import submission service for claim submission operations
import { ClaimTrackingService } from './claims/claim-tracking.service'; // Import tracking service for claim status tracking operations
import { ClaimLifecycleService } from './claims/claim-lifecycle.service'; // Import lifecycle service for end-to-end claim lifecycle management
import { NotFoundError } from '../errors/not-found-error'; // Import error class for when claims are not found
import { BusinessError } from '../errors/business-error'; // Import error class for business rule violations
import { logger } from '../utils/logger'; // Import logger for logging claim operations

/**
 * Core service that orchestrates claim management functionality in the HCBS Revenue Management System. 
 * This service integrates specialized claim services for validation, submission, tracking, and lifecycle management 
 * to provide a unified interface for claim operations.
 */
export const ClaimsService = {
  /**
   * Retrieves a claim by its ID with related data
   * @param claimId - claimId
   * @returns The claim with all related data
   */
  async getClaim(claimId: UUID): Promise<ClaimWithRelations> {
    logger.info(`Retrieving claim with ID: ${claimId}`); // Log claim retrieval request
    try {
      // Call ClaimModel.findById with the provided claimId
      const claim = await ClaimModel.findById(claimId);

      // If claim not found, throw NotFoundError
      if (!claim) {
        logger.error(`Claim with ID ${claimId} not found`); // Log error if claim not found
        throw new NotFoundError('Claim not found', 'claim', claimId); // Throw NotFoundError
      }

      // Return the claim with relations
      return claim;
    } catch (error) {
      logger.error(`Error retrieving claim with ID: ${claimId}`, { error }); // Log error if retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Retrieves a claim by its claim number with related data
   * @param claimNumber - claimNumber
   * @returns The claim with all related data
   */
  async getClaimByNumber(claimNumber: string): Promise<ClaimWithRelations> {
    logger.info(`Retrieving claim with claim number: ${claimNumber}`); // Log claim retrieval by number request
    try {
      // Call ClaimModel.findByClaimNumber with the provided claimNumber
      const claim = await ClaimModel.findByClaimNumber(claimNumber);

      // If claim not found, throw NotFoundError
      if (!claim) {
        logger.error(`Claim with claim number ${claimNumber} not found`); // Log error if claim not found
        throw new NotFoundError('Claim not found', 'claim', claimNumber); // Throw NotFoundError
      }

      // Return the claim with relations
      return claim;
    } catch (error) {
      logger.error(`Error retrieving claim with claim number: ${claimNumber}`, { error }); // Log error if retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Validates a claim against all applicable validation rules
   * @param claimId - claimId
   * @param userId - userId
   * @returns Validation results including errors and warnings
   */
  async validateClaim(claimId: UUID, userId: UUID | null): Promise<ClaimValidationResult> {
    logger.info(`Validating claim with ID: ${claimId}`, { userId }); // Log claim validation request
    try {
      // Call ClaimValidationService.validateClaim with claimId and userId
      const validationResult = await ClaimValidationService.validateClaim(claimId, userId);

      // Return the validation result
      return validationResult;
    } catch (error) {
      logger.error(`Error validating claim with ID: ${claimId}`, { error, userId }); // Log error if validation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Validates multiple claims in a batch
   * @param claimIds - claimIds
   * @param userId - userId
   * @returns Batch validation results
   */
  async batchValidateClaims(claimIds: UUID[], userId: UUID | null): Promise<{ results: ClaimValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }> {
    logger.info(`Validating claims in batch. Claim count: ${claimIds.length}`, { userId }); // Log batch validation request
    try {
      // Call ClaimValidationService.batchValidateClaims with claimIds and userId
      const batchValidationResult = await ClaimValidationService.batchValidateClaims(claimIds, userId);

      // Return the batch validation results
      return batchValidationResult;
    } catch (error) {
      logger.error(`Error validating claims in batch. Claim count: ${claimIds.length}`, { error, userId }); // Log error if batch validation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Submits a validated claim to a payer
   * @param claimId - claimId
   * @param submissionData - submissionData
   * @param userId - userId
   * @returns The submitted claim with updated status and submission details
   */
  async submitClaim(claimId: UUID, submissionData: SubmitClaimDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Submitting claim with ID: ${claimId}`, { submissionData, userId }); // Log claim submission request
    try {
      // Call ClaimSubmissionService.submitClaim with claimId, submissionData, and userId
      const submittedClaim = await ClaimSubmissionService.submitClaim(claimId, submissionData, userId);

      // Return the submitted claim
      return submittedClaim;
    } catch (error) {
      logger.error(`Error submitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Log error if submission fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Submits multiple validated claims to payers in a batch
   * @param batchData - batchData
   * @param userId - userId
   * @returns Batch submission results
   */
  async batchSubmitClaims(batchData: BatchSubmitClaimsDto, userId: UUID | null): Promise<ClaimBatchResult> {
    logger.info(`Submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { batchData, userId }); // Log batch submission request
    try {
      // Call ClaimSubmissionService.batchSubmitClaims with batchData and userId
      const batchSubmissionResult = await ClaimSubmissionService.batchSubmitClaims(batchData, userId);

      // Return the batch submission results
      return batchSubmissionResult;
    } catch (error) {
      logger.error(`Error submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { error, batchData, userId }); // Log error if batch submission fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Validates a claim and submits it if validation is successful
   * @param claimId - claimId
   * @param submissionData - submissionData
   * @param userId - userId
   * @returns The submitted claim with updated status
   */
  async validateAndSubmitClaim(claimId: UUID, submissionData: SubmitClaimDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Validating and submitting claim with ID: ${claimId}`, { submissionData, userId }); // Log validate and submit request
    try {
      // Call ClaimLifecycleService.validateAndSubmitClaim with claimId, submissionData, and userId
      const validatedAndSubmittedClaim = await ClaimLifecycleService.validateAndSubmitClaim(claimId, submissionData, userId);

      // Return the validated and submitted claim
      return validatedAndSubmittedClaim;
    } catch (error) {
      logger.error(`Error validating and submitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Log error if validate and submit fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Validates multiple claims and submits them if validation is successful
   * @param claimIds - claimIds
   * @param batchData - batchData
   * @param userId - userId
   * @returns Batch processing results
   */
  async batchValidateAndSubmitClaims(claimIds: UUID[], batchData: BatchSubmitClaimsDto, userId: UUID | null): Promise<ClaimBatchResult> {
    logger.info(`Validating and submitting claims in batch. Claim count: ${claimIds.length}`, { batchData, userId }); // Log batch validate and submit request
    try {
      // Call ClaimLifecycleService.batchValidateAndSubmitClaims with claimIds, batchData, and userId
      const batchValidationAndSubmissionResult = await ClaimLifecycleService.batchValidateAndSubmitClaims(claimIds, batchData, userId);

      // Return the batch processing results
      return batchValidationAndSubmissionResult;
    } catch (error) {
      logger.error(`Error validating and submitting claims in batch. Claim count: ${claimIds.length}`, { error, batchData, userId }); // Log error if batch validate and submit fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Resubmits a previously submitted claim that was rejected or denied
   * @param claimId - claimId
   * @param submissionData - submissionData
   * @param userId - userId
   * @returns The resubmitted claim with updated status and submission details
   */
  async resubmitClaim(claimId: UUID, submissionData: SubmitClaimDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Resubmitting claim with ID: ${claimId}`, { submissionData, userId }); // Log claim resubmission request
    try {
      // Call ClaimSubmissionService.resubmitClaim with claimId, submissionData, and userId
      const resubmittedClaim = await ClaimSubmissionService.resubmitClaim(claimId, submissionData, userId);

      // Return the resubmitted claim
      return resubmittedClaim;
    } catch (error) {
      logger.error(`Error resubmitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Log error if resubmission fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Updates the status of a claim based on payer response or manual update
   * @param claimId - claimId
   * @param statusData - statusData
   * @param userId - userId
   * @returns The updated claim with new status
   */
  async updateClaimStatus(claimId: UUID, statusData: UpdateClaimStatusDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Updating claim status for claim ID: ${claimId}`, { statusData, userId }); // Log status update request
    try {
      // Call ClaimTrackingService.updateClaimStatus with claimId, statusData, and userId
      const updatedClaim = await ClaimTrackingService.updateClaimStatus(claimId, statusData, userId);

      // Return the updated claim
      return updatedClaim;
    } catch (error) {
      logger.error(`Error updating claim status for claim ID: ${claimId}`, { error, statusData, userId }); // Log error if status update fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Retrieves the current status of a claim
   * @param claimId - claimId
   * @returns The current status, last update timestamp, and status history of the claim
   */
  async getClaimStatus(claimId: UUID): Promise<{ status: ClaimStatus; lastUpdated: string; history: ClaimStatusHistory[] }> {
    logger.info(`Retrieving claim status for claim ID: ${claimId}`); // Log status retrieval request
    try {
      // Call ClaimTrackingService.getClaimStatus with claimId
      const claimStatus = await ClaimTrackingService.getClaimStatus(claimId);

      // Return the status information
      return claimStatus;
    } catch (error) {
      logger.error(`Error retrieving claim status for claim ID: ${claimId}`, { error }); // Log error if status retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Refreshes the status of a claim by checking with the clearinghouse or payer
   * @param claimId - claimId
   * @param userId - userId
   * @returns The claim with refreshed status
   */
  async refreshClaimStatus(claimId: UUID, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Refreshing claim status for claim ID: ${claimId}`, { userId }); // Log status refresh request
    try {
      // Call ClaimTrackingService.refreshClaimStatus with claimId and userId
      const refreshResult = await ClaimTrackingService.refreshClaimStatus(claimId, userId);

      // Retrieve the claim with refreshed status
      const refreshedClaim = await ClaimModel.findById(claimId);
      if (!refreshedClaim) {
        logger.error(`Failed to retrieve refreshed claim for claim ID: ${claimId}`);
        throw new NotFoundError('Failed to retrieve refreshed claim', 'claim', claimId);
      }

      // Return the claim with refreshed status
      return refreshedClaim;
    } catch (error) {
      logger.error(`Error refreshing claim status for claim ID: ${claimId}`, { error, userId }); // Log error if status refresh fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Refreshes the status of multiple claims in a batch
   * @param claimIds - claimIds
   * @param userId - userId
   * @returns Batch refresh results
   */
  async batchRefreshClaimStatus(claimIds: UUID[], userId: UUID | null): Promise<{ totalProcessed: number; updatedCount: number; errorCount: number; errors: Array<{ claimId: UUID; message: string }>; processedClaims: UUID[] }> {
    logger.info(`Refreshing claim statuses in batch. Claim count: ${claimIds.length}`, { userId }); // Log batch refresh request
    try {
      // Call ClaimTrackingService.batchRefreshClaimStatus with claimIds and userId
      const batchRefreshResult = await ClaimTrackingService.batchRefreshClaimStatus(claimIds, userId);

      // Return the batch refresh results
      return batchRefreshResult;
    } catch (error) {
      logger.error(`Error refreshing claim statuses in batch. Claim count: ${claimIds.length}`, { error, userId }); // Log error if batch refresh fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Retrieves claims filtered by status
   * @param status - status
   * @param params - params
   * @returns List of claims with the specified status and total count
   */
  async getClaimsByStatus(status: ClaimStatus, params: ClaimQueryParams): Promise<{ claims: ClaimSummary[]; total: number }> {
    logger.info(`Retrieving claims by status: ${status}`, { params }); // Log claims by status request
    try {
      // Call ClaimTrackingService.getClaimsByStatus with status and params
      const claimsByStatus = await ClaimTrackingService.getClaimsByStatus(status, params);

      // Return the filtered claims and total count
      return claimsByStatus;
    } catch (error) {
      logger.error(`Error retrieving claims by status: ${status}`, { error, params }); // Log error if claims by status retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Generates an aging report for claims based on their current status and age
   * @param params - params
   * @returns Aging report with claims grouped by age ranges
   */
  async getClaimAging(params: ClaimQueryParams): Promise<{ agingBuckets: Array<{ range: string; count: number; amount: number; claims: ClaimSummary[] }>; totalAmount: number; totalCount: number }> {
    logger.info(`Generating claim aging report`, { params }); // Log claim aging report request
    try {
      // Call ClaimTrackingService.getClaimAging with params
      const claimAgingReport = await ClaimTrackingService.getClaimAging(params);

      // Return the aging report with buckets and totals
      return claimAgingReport;
    } catch (error) {
      logger.error(`Error generating claim aging report`, { error, params }); // Log error if claim aging report generation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Generates a detailed timeline of a claim's lifecycle
   * @param claimId - claimId
   * @returns Chronological timeline of claim status changes
   */
  async getClaimTimeline(claimId: UUID): Promise<ClaimStatusHistory[]> {
    logger.info(`Generating claim timeline for claim ID: ${claimId}`); // Log claim timeline request
    try {
      // Call ClaimTrackingService.getClaimTimeline with claimId
      const claimTimeline = await ClaimTrackingService.getClaimTimeline(claimId);

      // Return the formatted timeline
      return claimTimeline;
    } catch (error) {
      logger.error(`Error generating claim timeline for claim ID: ${claimId}`, { error }); // Log error if claim timeline generation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Generates a report of claim status transitions over a specified time period
   * @param dateRange - dateRange
   * @param params - params
   * @returns Report of status transitions and processing times
   */
  async getStatusTransitionReport(dateRange: DateRange, params: ClaimQueryParams): Promise<{ transitions: Array<{ fromStatus: ClaimStatus; toStatus: ClaimStatus; count: number }>; averageProcessingTimes: Array<{ fromStatus: ClaimStatus; toStatus: ClaimStatus; averageDays: number }> }> {
    logger.info(`Generating claim status transition report`, { dateRange, params }); // Log status transition report request
    try {
      // Call ClaimTrackingService.getStatusTransitionReport with dateRange and params
      const statusTransitionReport = await ClaimTrackingService.getStatusTransitionReport(dateRange, params);

      // Return the transition report with statistics
      return statusTransitionReport;
    } catch (error) {
      logger.error(`Error generating claim status transition report`, { error, dateRange, params }); // Log error if status transition report generation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Identifies claims that require action based on their status and age
   * @param params - params
   * @returns List of claims requiring action and total count
   */
  async getClaimsRequiringAction(params: ClaimQueryParams): Promise<{ claims: ClaimSummary[]; total: number }> {
    logger.info(`Retrieving claims requiring action`, { params }); // Log claims requiring action request
    try {
      // Call ClaimTrackingService.getClaimsRequiringAction with params
      const claimsRequiringAction = await ClaimTrackingService.getClaimsRequiringAction(params);

      // Return the filtered claims requiring action
      return claimsRequiringAction;
    } catch (error) {
      logger.error(`Error retrieving claims requiring action`, { error, params }); // Log error if claims requiring action retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Calculates metrics related to claim processing efficiency
   * @param dateRange - dateRange
   * @param filters - filters
   * @returns Claim processing metrics
   */
  async getClaimProcessingMetrics(dateRange: DateRange, filters: object): Promise<ClaimMetrics> {
    logger.info(`Calculating claim processing metrics`, { dateRange, filters }); // Log claim processing metrics request
    try {
      // Call ClaimTrackingService.getClaimProcessingMetrics with dateRange and filters
      const claimProcessingMetrics = await ClaimTrackingService.getClaimProcessingMetrics(dateRange, filters);

      // Return the compiled metrics
      return claimProcessingMetrics;
    } catch (error) {
      logger.error(`Error calculating claim processing metrics`, { error, dateRange, filters }); // Log error if claim processing metrics calculation fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },
  
    /**
   * Retrieves the complete lifecycle information for a claim
   * @param claimId - claimId
   * @returns Complete claim lifecycle information
   */
  async getClaimLifecycle(claimId: UUID): Promise<{ claim: ClaimWithRelations; timeline: ClaimStatusHistory[]; age: number; nextActions: string[] }> {
    logger.info(`Retrieving claim lifecycle for claim ID: ${claimId}`); // Log claim lifecycle request
    try {
      // Call ClaimLifecycleService.getClaimLifecycle with claimId
      const claimLifecycle = await ClaimLifecycleService.getClaimLifecycle(claimId);

      // Return the complete lifecycle information
      return claimLifecycle;
    } catch (error) {
      logger.error(`Error retrieving claim lifecycle for claim ID: ${claimId}`, { error }); // Log error if claim lifecycle retrieval fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Orchestrates the complete claim lifecycle from validation through submission to tracking
   * @param claimId - claimId
   * @param userId - userId
   * @returns The processed claim with updated status
   */
  async processClaim(claimId: UUID, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Processing claim with ID: ${claimId}`, { userId }); // Log claim processing request
    try {
      // Call ClaimLifecycleService.processClaim with claimId and userId
      const processedClaim = await ClaimLifecycleService.processClaim(claimId, userId);

      // Return the processed claim
      return processedClaim;
    } catch (error) {
      logger.error(`Error processing claim with ID: ${claimId}`, { error, userId }); // Log error if claim processing fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Voids a claim, marking it as no longer valid
   * @param claimId - claimId
   * @param notes - notes
   * @param userId - userId
   * @returns The voided claim
   */
  async voidClaim(claimId: UUID, notes: string | null, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Voiding claim with ID: ${claimId}`, { notes, userId }); // Log void claim request
    try {
      // Call ClaimLifecycleService.voidClaim with claimId, notes, and userId
      const voidedClaim = await ClaimLifecycleService.voidClaim(claimId, notes, userId);

      // Return the voided claim
      return voidedClaim;
    } catch (error) {
      logger.error(`Error voiding claim with ID: ${claimId}`, { error, notes, userId }); // Log error if void claim fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Creates an appeal for a denied claim
   * @param claimId - claimId
   * @param appealData - appealData
   * @param userId - userId
   * @returns The appealed claim
   */
  async appealClaim(claimId: UUID, appealData: object, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Appealing claim with ID: ${claimId}`, { appealData, userId }); // Log appeal claim request
    try {
      // Call ClaimLifecycleService.appealClaim with claimId, appealData, and userId
      const appealedClaim = await ClaimLifecycleService.appealClaim(claimId, appealData, userId);

      // Return the appealed claim
      return appealedClaim;
    } catch (error) {
      logger.error(`Error appealing claim with ID: ${claimId}`, { error, appealData, userId }); // Log error if appeal claim fails
      throw error; // Re-throw the error for handling in the calling function
    }
  },

  /**
   * Monitors the progress of a claim through its lifecycle
   * @param claimId - claimId
   * @returns Claim progress information
   */
  async monitorClaimProgress(claimId: UUID): Promise<{ status: ClaimStatus; daysInStatus: number; totalAge: number; nextMilestone: string | null; estimatedCompletion: string | null }> {
    logger.info(`Monitoring claim progress for claim ID: ${claimId}`); // Log monitor claim progress request
    try {
      // Call ClaimLifecycleService.monitorClaimProgress with claimId
      const claimProgress = await ClaimLifecycleService.monitorClaimProgress(claimId);

      // Return the claim progress information
      return claimProgress;
    } catch (error) {
      logger.error(`Error monitoring claim progress for claim ID: ${claimId}`, { error }); // Log error if monitor claim progress fails
      throw error; // Re-throw the error for handling in the calling function
    }
  }
};