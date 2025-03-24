import { UUID, ISO8601Date } from '../types/common.types'; // Import common type definitions for IDs and dates
import { ClaimStatus, ClaimWithRelations, SubmitClaimDto, BatchSubmitClaimsDto, ClaimValidationResult, ClaimBatchResult, UpdateClaimStatusDto } from '../types/claims.types'; // Import claim-specific type definitions for workflow operations
import { ClaimLifecycleService } from '../services/claims/claim-lifecycle.service'; // Import claim lifecycle service for orchestrating claim processing
import { ClaimValidationService } from '../services/claims/claim-validation.service'; // Import claim validation service for validating claims
import { ClaimSubmissionService } from '../services/claims/claim-submission.service'; // Import claim submission service for submitting claims to payers
import { ClaimTrackingService } from '../services/claims/claim-tracking.service'; // Import claim tracking service for monitoring claim status
import { NotFoundError } from '../errors/not-found-error'; // Import error class for when claims are not found
import { BusinessError } from '../errors/business-error'; // Import error class for business rule violations
import { logger } from '../utils/logger'; // Import logger for logging workflow operations

/**
 * Orchestrates the end-to-end processing of claims through their lifecycle
 */
export class ClaimProcessingWorkflow {
  private claimLifecycleService: ClaimLifecycleService;
  private claimValidationService: ClaimValidationService;
  private claimSubmissionService: ClaimSubmissionService;
  private claimTrackingService: ClaimTrackingService;

  /**
   * Initializes the claim processing workflow with required services
   */
  constructor() {
    this.claimLifecycleService = new ClaimLifecycleService();
    this.claimValidationService = new ClaimValidationService();
    this.claimSubmissionService = new ClaimSubmissionService();
    this.claimTrackingService = new ClaimTrackingService();
    logger.info('ClaimProcessingWorkflow initialized');
  }

  /**
   * Processes a claim through validation, submission, and tracking
   * @param claimId - UUID: The unique identifier of the claim to process.
   * @param userId - UUID | null: The unique identifier of the user initiating the process, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The processed claim with updated status
   */
  async processClaim(claimId: UUID, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting claim processing for claim ID: ${claimId}`, { claimId, userId });
    const processedClaim = await this.claimLifecycleService.processClaim(claimId, userId);
    logger.info(`Claim processing completed for claim ID: ${claimId}`, { claimStatus: processedClaim.claimStatus });
    return processedClaim;
  }

  /**
   * Validates a claim against business rules and payer requirements
   * @param claimId - UUID: The unique identifier of the claim to validate.
   * @param userId - UUID | null: The unique identifier of the user initiating the validation, or null if the system is initiating.
   * @returns Promise<ClaimValidationResult>: Validation results with errors and warnings
   */
  async validateClaim(claimId: UUID, userId: UUID | null): Promise<ClaimValidationResult> {
    logger.info(`Starting claim validation for claim ID: ${claimId}`, { claimId, userId });
    const validationResult = await this.claimValidationService.validateClaim(claimId, userId);
    logger.info(`Validation results summary for claim ID: ${claimId}`, { isValid: validationResult.isValid, errorCount: validationResult.errors.length, warningCount: validationResult.warnings.length });
    return validationResult;
  }

  /**
   * Submits a validated claim to a payer
   * @param claimId - UUID: The unique identifier of the claim to submit.
   * @param submissionData - SubmitClaimDto: Data transfer object containing submission details.
   * @param userId - UUID | null: The unique identifier of the user initiating the submission, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The submitted claim with updated status
   */
  async submitClaim(claimId: UUID, submissionData: SubmitClaimDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting claim submission for claim ID: ${claimId}`, { claimId, submissionData, userId });
    const submittedClaim = await this.claimLifecycleService.validateAndSubmitClaim(claimId, submissionData, userId);
    logger.info(`Submission result for claim ID: ${claimId}`, { claimStatus: submittedClaim.claimStatus });
    return submittedClaim;
  }

  /**
   * Processes multiple claims in a batch operation
   * @param claimIds - UUID[]: An array of unique identifiers for the claims to process.
   * @param userId - UUID | null: The unique identifier of the user initiating the batch processing, or null if the system is initiating.
   * @returns Promise<{ results: ClaimValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }>: Batch processing results
   */
  async batchProcessClaims(claimIds: UUID[], userId: UUID | null): Promise<{ results: ClaimValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }> {
    logger.info(`Starting batch claim processing for ${claimIds.length} claims`, { claimIds, userId });
    const batchProcessingResults = await this.claimValidationService.batchValidateClaims(claimIds, userId);
    logger.info(`Batch processing results summary:`, { isValid: batchProcessingResults.isValid, totalErrors: batchProcessingResults.totalErrors, totalWarnings: batchProcessingResults.totalWarnings });
    return batchProcessingResults;
  }

  /**
   * Submits multiple validated claims to payers in a batch
   * @param claimIds - UUID[]: An array of unique identifiers for the claims to submit.
   * @param batchData - BatchSubmitClaimsDto: Data transfer object containing batch submission details.
   * @param userId - UUID | null: The unique identifier of the user initiating the batch submission, or null if the system is initiating.
   * @returns Promise<ClaimBatchResult>: Batch submission results
   */
  async batchSubmitClaims(claimIds: UUID[], batchData: BatchSubmitClaimsDto, userId: UUID | null): Promise<ClaimBatchResult> {
    logger.info(`Starting batch claim submission for ${claimIds.length} claims`, { claimIds, batchData, userId });
    const batchSubmissionResults = await this.claimLifecycleService.batchValidateAndSubmitClaims(claimIds, batchData, userId);
    logger.info(`Batch submission results summary:`, { successCount: batchSubmissionResults.successCount, errorCount: batchSubmissionResults.errorCount });
    return batchSubmissionResults;
  }

  /**
   * Resubmits a previously denied or rejected claim
   * @param claimId - UUID: The unique identifier of the claim to resubmit.
   * @param submissionData - SubmitClaimDto: Data transfer object containing submission details.
   * @param userId - UUID | null: The unique identifier of the user initiating the resubmission, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The resubmitted claim with updated status
   */
  async resubmitClaim(claimId: UUID, submissionData: SubmitClaimDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting claim resubmission for claim ID: ${claimId}`, { claimId, submissionData, userId });
    const resubmittedClaim = await this.claimSubmissionService.resubmitClaim(claimId, submissionData, userId);
    logger.info(`Resubmission result for claim ID: ${claimId}`, { claimStatus: resubmittedClaim.claimStatus });
    return resubmittedClaim;
  }

  /**
   * Checks the current status of a claim
   * @param claimId - UUID: The unique identifier of the claim to check.
   * @returns Promise<{ status: ClaimStatus, lastUpdated: ISO8601Date, details: Record<string, any> | null }>: Current claim status information
   */
  async checkClaimStatus(claimId: UUID): Promise<{ status: ClaimStatus; lastUpdated: ISO8601Date; details: Record<string, any> | null }> {
    logger.info(`Starting claim status check for claim ID: ${claimId}`, { claimId });
    const statusInformation = await this.claimTrackingService.getClaimStatus(claimId);
    return statusInformation;
  }

  /**
   * Refreshes the status of a claim by checking with the payer
   * @param claimId - UUID: The unique identifier of the claim to refresh.
   * @param userId - UUID | null: The unique identifier of the user initiating the refresh, or null if the system is initiating.
   * @returns Promise<{ updated: boolean, currentStatus: ClaimStatus, previousStatus: ClaimStatus | null, details: Record<string, any> | null }>: Status refresh result
   */
  async refreshClaimStatus(claimId: UUID, userId: UUID | null): Promise<{ updated: boolean; currentStatus: ClaimStatus; previousStatus: ClaimStatus | null; details: Record<string, any> | null }> {
    logger.info(`Starting claim status refresh for claim ID: ${claimId}`, { claimId, userId });
    const refreshResult = await this.claimTrackingService.refreshClaimStatus(claimId, userId);
    logger.info(`Status refresh result for claim ID: ${claimId}`, { updated: refreshResult.updated, currentStatus: refreshResult.currentStatus, previousStatus: refreshResult.previousStatus });
    return refreshResult;
  }

  /**
   * Updates the status of a claim manually
   * @param claimId - UUID: The unique identifier of the claim to update.
   * @param targetStatus - ClaimStatus: The target status to transition the claim to.
   * @param statusData - UpdateClaimStatusDto: Data transfer object containing status update details.
   * @param userId - UUID | null: The unique identifier of the user initiating the update, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The claim with updated status
   */
  async updateClaimStatus(claimId: UUID, targetStatus: ClaimStatus, statusData: UpdateClaimStatusDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting claim status update for claim ID: ${claimId} to ${targetStatus}`, { claimId, targetStatus, statusData, userId });
    const updatedClaim = await this.claimLifecycleService.transitionClaimStatus(claimId, targetStatus, statusData, userId);
    logger.info(`Status update result for claim ID: ${claimId} to ${targetStatus}`, { claimStatus: updatedClaim.claimStatus });
    return updatedClaim;
  }

  /**
   * Voids a claim, marking it as no longer valid
   * @param claimId - UUID: The unique identifier of the claim to void.
   * @param notes - string | null: Optional notes about the void action.
   * @param userId - UUID | null: The unique identifier of the user initiating the void action, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The voided claim
   */
  async voidClaim(claimId: UUID, notes: string | null, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting voiding claim with ID: ${claimId}`, { claimId, notes, userId });
    const voidedClaim = await this.claimLifecycleService.voidClaim(claimId, notes, userId);
    logger.info(`Void operation result for claim ID: ${claimId}`, { claimStatus: voidedClaim.claimStatus });
    return voidedClaim;
  }

  /**
   * Creates an appeal for a denied claim
   * @param claimId - UUID: The unique identifier of the claim to appeal.
   * @param appealData - object: Data related to the appeal.
   * @param userId - UUID | null: The unique identifier of the user initiating the appeal, or null if the system is initiating.
   * @returns Promise<ClaimWithRelations>: The appealed claim
   */
  async appealClaim(claimId: UUID, appealData: object, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Starting claim appeal for claim ID: ${claimId}`, { claimId, appealData, userId });
    const appealedClaim = await this.claimLifecycleService.appealClaim(claimId, appealData, userId);
    logger.info(`Appeal result for claim ID: ${claimId}`, { claimStatus: appealedClaim.claimStatus });
    return appealedClaim;
  }

  /**
   * Retrieves comprehensive lifecycle information for a claim
   * @param claimId - UUID: The unique identifier of the claim to retrieve lifecycle information for.
   * @returns Promise<{ claim: ClaimWithRelations, timeline: any[], age: number, nextActions: string[], riskAssessment: { riskScore: number, riskLevel: string, factors: string[] } }>: Complete claim lifecycle information
   */
  async getClaimLifecycle(claimId: UUID): Promise<{ claim: ClaimWithRelations; timeline: any[]; age: number; nextActions: string[]; riskAssessment: { riskScore: number; riskLevel: string; factors: string[] } }> {
    logger.info(`Starting retrieving claim lifecycle for claim ID: ${claimId}`, { claimId });
    const lifecycleInformation = await this.claimLifecycleService.getClaimLifecycle(claimId);
    return lifecycleInformation;
  }

  /**
   * Generates a timeline of claim status changes for visualization
   * @param claimId - UUID: The unique identifier of the claim to retrieve timeline for.
   * @returns Promise<Array<{ status: ClaimStatus, date: ISO8601Date, formattedDate: string, notes: string | null, userId: UUID | null, isActive: boolean }>>: Formatted timeline entries
   */
  async getClaimTimeline(claimId: UUID): Promise<Array<{ status: ClaimStatus; date: ISO8601Date; formattedDate: string; notes: string | null; userId: UUID | null; isActive: boolean }>> {
    logger.info(`Starting retrieving claim timeline for claim ID: ${claimId}`, { claimId });
    const timelineEntries = await this.claimTrackingService.getClaimTimeline(claimId);
    return timelineEntries;
  }

  /**
   * Gets available status transitions for a claim
   * @param currentStatus - ClaimStatus: The current status of the claim.
   * @returns Array<{ status: ClaimStatus, label: string, requiresData: boolean }>: Available status transition options
   */
  getStatusTransitionOptions(currentStatus: ClaimStatus): Array<{ status: ClaimStatus; label: string; requiresData: boolean }> {
    return this.claimTrackingService.getStatusTransitionOptions(currentStatus);
  }

  /**
   * Monitors the progress of a claim through its lifecycle
   * @param claimId - UUID: The unique identifier of the claim to monitor.
   * @returns Promise<{ status: ClaimStatus, daysInStatus: number, totalAge: number, nextMilestone: string | null, estimatedCompletion: string | null }>: Claim progress information
   */
  async monitorClaimProgress(claimId: UUID): Promise<{ status: ClaimStatus; daysInStatus: number; totalAge: number; nextMilestone: string | null; estimatedCompletion: string | null }> {
    logger.info(`Starting monitoring claim progress for claim ID: ${claimId}`, { claimId });
    const progressInformation = await this.claimLifecycleService.monitorClaimProgress(claimId);
    return progressInformation;
  }

  /**
   * Refreshes the status of claims that need updating
   * @param userId - UUID | null: The unique identifier of the user initiating the refresh, or null if the system is initiating.
   * @returns Promise<{ totalProcessed: number, updatedCount: number, errorCount: number }>: Refresh operation summary
   */
  async refreshClaimStatuses(userId: UUID | null): Promise<{ totalProcessed: number; updatedCount: number; errorCount: number }> {
    logger.info(`Starting refreshing claim statuses`, { userId });
    const refreshOperationSummary = await this.claimLifecycleService.refreshClaimStatuses(userId);
    logger.info(`Refresh operation results:`, { totalProcessed: refreshOperationSummary.totalProcessed, updatedCount: refreshOperationSummary.updatedCount, errorCount: refreshOperationSummary.errorCount });
    return refreshOperationSummary;
  }
}

export const claimProcessingWorkflow = new ClaimProcessingWorkflow();