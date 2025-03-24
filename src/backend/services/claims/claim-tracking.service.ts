# src/backend/services/claims/claim-tracking.service.ts
```typescript
import { UUID, ISO8601Date } from '../../types/common.types'; // Import common type definitions for IDs and dates
import { ClaimStatus, ClaimWithRelations, ClaimStatusHistory, UpdateClaimStatusDto } from '../../types/claims.types'; // Import claim-related types and interfaces
import { ClaimModel } from '../../models/claim.model'; // Import claim model for claim operations
import { claimRepository } from '../../database/repositories/claim.repository'; // Import claim repository for database operations
import { clearinghouseIntegration } from '../../integrations/clearinghouse.integration'; // Import clearinghouse integration for checking claim status
import { medicaidIntegration } from '../../integrations/medicaid.integration'; // Import medicaid integration for checking claim status with state systems
import { NotFoundError } from '../../errors/not-found-error'; // Import error class for when claims are not found
import { BusinessError } from '../../errors/business-error'; // Import error class for business rule violations
import { IntegrationError } from '../../errors/integration-error'; // Import error class for integration failures
import logger from '../../utils/logger'; // Import logger for logging tracking operations
import { formatDate } from '../../utils/date'; // Import date formatting utility for timeline display

/**
 * Service responsible for tracking and managing claim status throughout the claim lifecycle in the HCBS Revenue Management System.
 * This service provides functionality for retrieving claim status, updating status with proper history tracking, refreshing status from external systems, and generating timeline visualizations for claims.
 */
export const ClaimTrackingService = {
  /**
   * Retrieves the current status of a claim
   * @param claimId - claimId
   * @returns Current claim status information
   */
  async getClaimStatus(claimId: UUID): Promise<{ status: ClaimStatus, lastUpdated: ISO8601Date, details: Record<string, any> | null }> {
    logger.info(`Retrieving claim status for claim ID: ${claimId}`); // Log status retrieval request for claim ID

    const claim = await ClaimModel.findById(claimId); // Retrieve claim using ClaimModel.findById

    if (!claim) { // If claim not found, throw NotFoundError
      logger.error(`Claim with ID ${claimId} not found`);
      throw new NotFoundError(`Claim with ID ${claimId} not found`, 'Claim', claimId);
    }

    const statusHistory = await claimRepository.getStatusHistory(claimId); // Get status history using ClaimModel.getStatusHistory
    const mostRecentStatus = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null; // Find the most recent status entry

    const status = mostRecentStatus ? mostRecentStatus.status : ClaimStatus.DRAFT; // Extract status, timestamp, and any additional details
    const lastUpdated = mostRecentStatus ? mostRecentStatus.timestamp : claim.createdAt;
    const details = mostRecentStatus ? mostRecentStatus.notes : null;

    logger.debug(`Claim status retrieved successfully for claim ID: ${claimId}`, { status, lastUpdated, details }); // Log successful status retrieval

    return { status, lastUpdated, details }; // Return formatted status information
  },

  /**
   * Updates the status of a claim with proper history tracking
   * @param claimId - claimId
   * @param statusData - statusData
   * @param userId - userId
   * @returns The claim with updated status
   */
  async updateClaimStatus(claimId: UUID, statusData: UpdateClaimStatusDto, userId: UUID | null): Promise<ClaimWithRelations> {
    logger.info(`Updating claim status for claim ID: ${claimId}`, { statusData, userId }); // Log status update request for claim ID

    const claim = await ClaimModel.findById(claimId); // Retrieve claim using ClaimModel.findById

    if (!claim) { // If claim not found, throw NotFoundError
      logger.error(`Claim with ID ${claimId} not found`);
      throw new NotFoundError(`Claim with ID ${claimId} not found`, 'Claim', claimId);
    }

    // Validate status transition is allowed using validateStatusTransition helper
    const validationResult = this.validateStatusTransition(claim.claimStatus, statusData.status);
    if (!validationResult.isValid) { // If transition not allowed, throw BusinessError with details
      logger.error(`Invalid status transition requested for claim ID: ${claimId}`, { currentStatus: claim.claimStatus, newStatus: statusData.status, message: validationResult.message });
      throw new BusinessError(validationResult.message, { currentStatus: claim.claimStatus, newStatus: statusData.status }, 'InvalidClaimStatusTransition');
    }

    // Update claim status using claimRepository.updateStatus
    const updated = await claimRepository.updateStatus(claimId, statusData.status, statusData.notes, userId);

    if (!updated) {
      logger.error(`Failed to update claim status for claim ID: ${claimId}`);
      throw new Error(`Failed to update claim status for claim ID: ${claimId}`);
    }

    // Update additional status-related fields based on statusData (adjudicationDate, denialReason, etc.)
    if (statusData.adjudicationDate) {
      claim.adjudicationDate = statusData.adjudicationDate;
    }
    if (statusData.denialReason) {
      claim.denialReason = statusData.denialReason;
    }
    if (statusData.denialDetails) {
      claim.denialDetails = statusData.denialDetails;
    }
    if (statusData.adjustmentCodes) {
      claim.adjustmentCodes = statusData.adjustmentCodes;
    }

    const updatedClaim = await claimRepository.findByIdWithRelations(claimId); // Retrieve updated claim with relations

    if (!updatedClaim) {
      logger.error(`Failed to retrieve updated claim with relations for claim ID: ${claimId}`);
      throw new Error(`Failed to retrieve updated claim with relations for claim ID: ${claimId}`);
    }

    logger.info(`Claim status updated successfully for claim ID: ${claimId}`, { newStatus: statusData.status }); // Log successful status update

    return updatedClaim; // Return updated claim with relations
  },

  /**
   * Refreshes the status of a claim by checking with clearinghouse or payer
   * @param claimId - claimId
   * @param userId - userId
   * @returns Status refresh result
   */
  async refreshClaimStatus(claimId: UUID, userId: UUID | null): Promise<{ updated: boolean, currentStatus: ClaimStatus, previousStatus: ClaimStatus | null, details: Record<string, any> | null }> {
    logger.info(`Refreshing claim status for claim ID: ${claimId}`, { userId }); // Log status refresh request for claim ID

    const claim = await ClaimModel.findById(claimId); // Retrieve claim using ClaimModel.findById

    if (!claim) { // If claim not found, throw NotFoundError
      logger.error(`Claim with ID ${claimId} not found`);
      throw new NotFoundError(`Claim with ID ${claimId} not found`, 'Claim', claimId);
    }

    if (!claim.submissionDate || !claim.externalClaimId) { // Validate claim has been submitted (has submissionDate and externalClaimId)
      logger.warn(`Claim with ID ${claimId} has not been submitted yet`);
      throw new BusinessError('Claim has not been submitted yet', { claimId }, 'ClaimNotSubmitted'); // If not submitted, throw BusinessError indicating claim not yet submitted
    }

    const previousStatus = claim.claimStatus; // Store previous status for comparison

    let updated = false;
    let currentStatus = claim.claimStatus;
    let details: Record<string, any> | null = null;

    try {
      // Determine submission method and payer type
      if (claim.submissionMethod === 'electronic' || claim.submissionMethod === 'clearinghouse') { // Based on submission method and payer type:
        // For electronic/clearinghouse: Call clearinghouseIntegration.checkClaimStatus
        const clearinghouseResponse = await clearinghouseIntegration.checkClaimStatus(claim.externalClaimId, claim.id, { correlationId: logger.createCorrelationId() });
        currentStatus = clearinghouseResponse.data.status;
        details = clearinghouseResponse.data.details;
      } else if (claim.payer.payerType === 'medicaid') { // For Medicaid direct: Call medicaidIntegration.checkClaimStatus
        const medicaidResponse = await medicaidIntegration.checkClaimStatus(claim.payerId, claim.externalClaimId, { correlationId: logger.createCorrelationId() });
        currentStatus = medicaidResponse.data.status;
        details = medicaidResponse.data.details;
      } else { // For other methods: Return current status (no refresh possible)
        logger.warn(`Claim with ID ${claimId} has unsupported submission method: ${claim.submissionMethod}`);
        return { updated, currentStatus, previousStatus, details };
      }

      // Parse external status response and map to internal ClaimStatus
      // If status has changed, update claim status with new status and details
      if (currentStatus !== previousStatus) {
        await claimRepository.updateStatus(claimId, currentStatus, details ? JSON.stringify(details) : null, userId);
        updated = true;
      }
    } catch (error) {
      logger.error(`Failed to refresh claim status for claim ID: ${claimId}`, error);
      throw new IntegrationError({ message: `Failed to refresh claim status: ${error.message}`, service: 'ClaimTrackingService', endpoint: 'refreshClaimStatus' });
    }

    logger.info(`Claim status refreshed successfully for claim ID: ${claimId}`, { updated, currentStatus, previousStatus, details }); // Log successful status refresh

    return { updated, currentStatus, previousStatus, details }; // Return refresh result with updated flag, current status, previous status, and details
  },

  /**
   * Generates a timeline of claim status changes for visualization
   * @param claimId - claimId
   * @returns Formatted timeline entries for visualization
   */
  async getClaimTimeline(claimId: UUID): Promise<Array<{ status: ClaimStatus, date: ISO8601Date, formattedDate: string, notes: string | null, userId: UUID | null, isActive: boolean }>> {
    logger.info(`Generating claim timeline for claim ID: ${claimId}`); // Log timeline request for claim ID

    const claim = await ClaimModel.findById(claimId); // Retrieve claim using ClaimModel.findById

    if (!claim) { // If claim not found, throw NotFoundError
      logger.error(`Claim with ID ${claimId} not found`);
      throw new NotFoundError(`Claim with ID ${claimId} not found`, 'Claim', claimId);
    }

    const statusHistory = await claimRepository.getStatusHistory(claimId); // Get status history using ClaimModel.getStatusHistory

    statusHistory.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)); // Sort history by timestamp in ascending order

    const timeline = statusHistory.map(history => ({ // Format each history entry for timeline display:
      status: history.status, // Add status, date, and notes
      date: history.timestamp,
      formattedDate: formatDate(history.timestamp), // Format date for display using formatDate utility
      notes: history.notes,
      userId: history.userId,
      isActive: history.status === claim.claimStatus // Mark the current/latest status as active
    }));

    logger.debug(`Claim timeline generated successfully for claim ID: ${claimId}`, { timeline }); // Log successful timeline generation

    return timeline; // Return formatted timeline entries
  },

  /**
   * Gets the valid status transitions available from the current claim status
   * @param currentStatus - currentStatus
   * @returns Available status transition options
   */
  getStatusTransitionOptions(currentStatus: ClaimStatus): Array<{ status: ClaimStatus, label: string, requiresData: boolean }> {
    // Define allowed transitions map based on business rules
    const allowedTransitions: Record<ClaimStatus, Array<ClaimStatus>> = {
      [ClaimStatus.DRAFT]: [ClaimStatus.VALIDATED, ClaimStatus.VOID],
      [ClaimStatus.VALIDATED]: [ClaimStatus.SUBMITTED, ClaimStatus.DRAFT, ClaimStatus.VOID],
      [ClaimStatus.SUBMITTED]: [ClaimStatus.ACKNOWLEDGED, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.ACKNOWLEDGED]: [ClaimStatus.PENDING, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.PENDING]: [ClaimStatus.PAID, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.PAID]: [ClaimStatus.VOID],
      [ClaimStatus.DENIED]: [ClaimStatus.APPEALED, ClaimStatus.VOID],
      [ClaimStatus.APPEALED]: [ClaimStatus.PENDING, ClaimStatus.FINAL_DENIED, ClaimStatus.VOID],
      [ClaimStatus.FINAL_DENIED]: [ClaimStatus.VOID],
      [ClaimStatus.VOID]: []
    };

    // Get allowed transitions for the current status
    const transitions = allowedTransitions[currentStatus] || [];

    // Format each allowed transition with status, user-friendly label, and data requirements
    const transitionOptions = transitions.map(status => ({
      status,
      label: this.getStatusLabel(status),
      requiresData: status === ClaimStatus.DENIED // Example: Denial requires reason
    }));

    return transitionOptions; // Return available transition options
  },

  /**
   * Validates if a status transition is allowed based on business rules
   * @param currentStatus - currentStatus
   * @param targetStatus - targetStatus
   * @returns Validation result with message if invalid
   */
  validateStatusTransition(currentStatus: ClaimStatus, targetStatus: ClaimStatus): { isValid: boolean, message: string | null } {
    // Define allowed transitions map based on business rules
    const allowedTransitions: Record<ClaimStatus, Array<ClaimStatus>> = {
      [ClaimStatus.DRAFT]: [ClaimStatus.VALIDATED, ClaimStatus.VOID],
      [ClaimStatus.VALIDATED]: [ClaimStatus.SUBMITTED, ClaimStatus.DRAFT, ClaimStatus.VOID],
      [ClaimStatus.SUBMITTED]: [ClaimStatus.ACKNOWLEDGED, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.ACKNOWLEDGED]: [ClaimStatus.PENDING, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.PENDING]: [ClaimStatus.PAID, ClaimStatus.DENIED, ClaimStatus.VOID],
      [ClaimStatus.PAID]: [ClaimStatus.VOID],
      [ClaimStatus.DENIED]: [ClaimStatus.APPEALED, ClaimStatus.VOID],
      [ClaimStatus.APPEALED]: [ClaimStatus.PENDING, ClaimStatus.FINAL_DENIED, ClaimStatus.VOID],
      [ClaimStatus.FINAL_DENIED]: [ClaimStatus.VOID],
      [ClaimStatus.VOID]: []
    };

    // Check if current status has allowed transitions defined
    if (!allowedTransitions[currentStatus]) {
      return { isValid: false, message: `No allowed transitions defined for status: ${currentStatus}` };
    }

    // Check if target status is in the allowed transitions list
    if (!allowedTransitions[currentStatus].includes(targetStatus)) {
      return { isValid: false, message: `Invalid status transition from ${currentStatus} to ${targetStatus}` };
    }

    return { isValid: true, message: null }; // If transition is allowed, return { isValid: true, message: null }
  },

  /**
   * Maps external clearinghouse or payer status codes to internal claim status
   * @param externalStatus - externalStatus
   * @param details - details
   * @returns Mapped internal claim status
   */
  mapExternalStatusToInternal(externalStatus: string, details: Record<string, any>): ClaimStatus {
    // Define mapping rules for various clearinghouse/payer status codes
    // Match external status against known patterns
    // Return corresponding internal ClaimStatus
    // If no match found, return original status or default to PENDING
    return ClaimStatus.PENDING;
  },

  /**
   * Gets a user-friendly label for a claim status
   * @param status - status
   * @returns User-friendly status label
   */
  getStatusLabel(status: ClaimStatus): string {
    // Define mapping of status codes to user-friendly labels
    const statusLabels: Record<ClaimStatus, string> = {
      [ClaimStatus.DRAFT]: 'Draft',
      [ClaimStatus.VALIDATED]: 'Validated',
      [ClaimStatus.SUBMITTED]: 'Submitted',
      [ClaimStatus.ACKNOWLEDGED]: 'Acknowledged',
      [ClaimStatus.PENDING]: 'Pending',
      [ClaimStatus.PAID]: 'Paid',
      [ClaimStatus.PARTIAL_PAID]: 'Partial Paid',
      [ClaimStatus.DENIED]: 'Denied',
      [ClaimStatus.APPEALED]: 'Appealed',
      [ClaimStatus.FINAL_DENIED]: 'Final Denied',
      [ClaimStatus.VOID]: 'Void'
    };

    // Return the label for the given status
    return statusLabels[status] || status; // If status not found in mapping, return the status code as fallback
  },

  /**
   * Gets a color code for a claim status for UI display
   * @param status - status
   * @returns Color code for the status (e.g., 'success', 'warning', 'error')
   */
  getStatusColor(status: ClaimStatus): string {
    // Define mapping of status codes to color codes
    const statusColors: Record<ClaimStatus, string> = {
      [ClaimStatus.DRAFT]: 'info',
      [ClaimStatus.VALIDATED]: 'success',
      [ClaimStatus.SUBMITTED]: 'primary',
      [ClaimStatus.ACKNOWLEDGED]: 'primary',
      [ClaimStatus.PENDING]: 'warning',
      [ClaimStatus.PAID]: 'success',
      [ClaimStatus.PARTIAL_PAID]: 'warning',
      [ClaimStatus.DENIED]: 'error',
      [ClaimStatus.APPEALED]: 'warning',
      [ClaimStatus.FINAL_DENIED]: 'error',
      [ClaimStatus.VOID]: 'default'
    };

    // Return the color code for the given status
    return statusColors[status] || 'default'; // If status not found in mapping, return a default color code
  },

  /**
   * Refreshes the status of multiple claims in a batch
   * @param claimIds - claimIds
   * @param userId - userId
   * @returns Batch refresh results
   */
  async batchRefreshClaimStatuses(claimIds: UUID[], userId: UUID | null): Promise<{ totalProcessed: number, updatedCount: number, errorCount: number, errors: Array<{ claimId: UUID, message: string }>, processedClaims: UUID[] }> {
    logger.info(`Starting batch refresh of claim statuses for ${claimIds.length} claims`, { userId }); // Log batch refresh start with number of claims

    let totalProcessed = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: Array<{ claimId: UUID, message: string }> = [];
    const processedClaims: UUID[] = [];

    for (const claimId of claimIds) { // For each claim ID in the batch:
      totalProcessed++;
      try {
        const refreshResult = await this.refreshClaimStatus(claimId, userId); // Try to refresh claim status using refreshClaimStatus
        processedClaims.push(claimId);
        if (refreshResult.updated) { // If status was updated, increment updated counter
          updatedCount++;
        }
      } catch (error: any) { // If error occurs, catch and record error, increment error counter
        errorCount++;
        errors.push({ claimId, message: error.message });
        logger.error(`Failed to refresh claim status for claim ID: ${claimId}`, error);
      }
    }

    logger.info(`Batch refresh completed. Total processed: ${totalProcessed}, Updated: ${updatedCount}, Errors: ${errorCount}`, { errors }); // Log batch refresh completion with summary

    return { totalProcessed, updatedCount, errorCount, errors, processedClaims }; // Return batch processing results
  }
};