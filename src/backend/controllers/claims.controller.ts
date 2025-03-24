import { Response } from 'express'; // express v4.18+
import { Request, RequestWithParams, RequestWithQuery, RequestWithBody, RequestWithParamsAndBody, IdParam } from '../types/request.types'; // Import request type definitions for type-safe request handling
import { SuccessResponse, PaginatedResponse, ValidationFailureResponse, BulkOperationSuccessResponse } from '../types/response.types'; // Import response helper functions for standardized API responses
import { UUID } from '../types/common.types'; // Import UUID type for ID parameters
import { ClaimStatus, ClaimQueryParams, UpdateClaimStatusDto, SubmitClaimDto, BatchSubmitClaimsDto, CreateClaimDto, UpdateClaimDto } from '../types/claims.types'; // Import claim-specific type definitions
import { ClaimsService } from '../services/claims.service'; // Import claims service for handling business logic
import { logger } from '../utils/logger'; // Import logger for logging controller operations

/**
 * Controller responsible for handling HTTP requests related to claims management in the HCBS Revenue Management System.
 * This controller implements RESTful endpoints for creating, retrieving, updating, validating, submitting, and tracking claims throughout their lifecycle.
 */
export default {
  /**
   * Retrieves a claim by its ID
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with claim data
   */
  async getClaim(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    logger.info(`Retrieving claim with ID: ${claimId}`); // Log claim retrieval request
    try {
      const claim = await ClaimsService.getClaim(claimId); // Call ClaimsService.getClaim to retrieve claim data
      res.status(200).json(SuccessResponse(claim)); // Return success response with claim data
    } catch (error) {
      logger.error(`Error retrieving claim with ID: ${claimId}`, { error }); // Handle errors and return appropriate error response
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: { message: error.message } });
      } else {
        res.status(500).json({ error: { message: 'Failed to retrieve claim' } });
      }
    }
  },

  /**
   * Retrieves all claims with optional filtering and pagination
   * @param req - Request with query parameters for filtering and pagination
   * @param res - Express Response
   * @returns Sends HTTP response with paginated claims data
   */
  async getAllClaims(req: RequestWithQuery<ClaimQueryParams>, res: Response): Promise<void> {
    const queryParams = req.query; // Extract query parameters for filtering and pagination
    logger.info('Retrieving all claims', { queryParams }); // Log claims retrieval request
    try {
      const { claims, total, page, limit, totalPages } = await ClaimsService.getAllClaims(queryParams); // Call ClaimsService.getAllClaims to retrieve claims data
      res.status(200).json(PaginatedResponse(claims, { page, limit, totalItems: total, totalPages })); // Return paginated response with claims data
    } catch (error) {
      logger.error('Error retrieving all claims', { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claims' } });
    }
  },

  /**
   * Retrieves summarized claim information for lists and dashboards
   * @param req - Request with query parameters for filtering and pagination
   * @param res - Express Response
   * @returns Sends HTTP response with paginated claim summaries
   */
  async getClaimSummaries(req: RequestWithQuery<ClaimQueryParams>, res: Response): Promise<void> {
    const queryParams = req.query; // Extract query parameters for filtering and pagination
    logger.info('Retrieving claim summaries', { queryParams }); // Log claim summaries retrieval request
    try {
      const { claims, total, page, limit, totalPages } = await ClaimsService.getClaimSummaries(queryParams); // Call ClaimsService.getClaimSummaries to retrieve claim summaries
      res.status(200).json(PaginatedResponse(claims, { page, limit, totalItems: total, totalPages })); // Return paginated response with claim summaries
    } catch (error) {
      logger.error('Error retrieving claim summaries', { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claim summaries' } });
    }
  },

  /**
   * Creates a new claim
   * @param req - Request with claim data in body
   * @param res - Express Response
   * @returns Sends HTTP response with created claim data
   */
  async createClaim(req: RequestWithBody<CreateClaimDto>, res: Response): Promise<void> {
    const claimData = req.body; // Extract claim data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info('Creating claim', { claimData, userId }); // Log claim creation request
    try {
      const claim = await ClaimsService.createClaim(claimData, userId); // Call ClaimsService.createClaim to create new claim
      res.status(201).json(SuccessResponse(claim)); // Return success response with created claim data
    } catch (error) {
      logger.error('Error creating claim', { error, claimData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to create claim' } });
    }
  },

  /**
   * Updates an existing claim
   * @param req - Request with claim ID in parameters and update data in body
   * @param res - Express Response
   * @returns Sends HTTP response with updated claim data
   */
  async updateClaim(req: RequestWithParamsAndBody<IdParam, UpdateClaimDto>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const claimData = req.body; // Extract claim update data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Updating claim with ID: ${claimId}`, { claimData, userId }); // Log claim update request
    try {
      const claim = await ClaimsService.updateClaim(claimId, claimData, userId); // Call ClaimsService.updateClaim to update claim
      res.status(200).json(SuccessResponse(claim)); // Return success response with updated claim data
    } catch (error) {
      logger.error(`Error updating claim with ID: ${claimId}`, { error, claimData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to update claim' } });
    }
  },

  /**
   * Validates a claim for submission readiness
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with validation results
   */
  async validateClaim(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Validating claim with ID: ${claimId}`, { userId }); // Log claim validation request
    try {
      const validationResults = await ClaimsService.validateClaim(claimId, userId); // Call ClaimsService.validateClaim to validate claim
      res.status(200).json(SuccessResponse(validationResults)); // Return success response with validation results
    } catch (error) {
      logger.error(`Error validating claim with ID: ${claimId}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to validate claim' } });
    }
  },

  /**
   * Validates multiple claims for submission readiness
   * @param req - Request with claim IDs in body
   * @param res - Express Response
   * @returns Sends HTTP response with batch validation results
   */
  async batchValidateClaims(req: RequestWithBody<{ claimIds: UUID[] }>, res: Response): Promise<void> {
    const claimIds = req.body.claimIds; // Extract claim IDs from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Validating claims in batch. Claim count: ${claimIds.length}`, { userId }); // Log batch validation request
    try {
      const validationResults = await ClaimsService.batchValidateClaims(claimIds, userId); // Call ClaimsService.batchValidateClaims to validate claims
      res.status(200).json(SuccessResponse(validationResults)); // Return success response with batch validation results
    } catch (error) {
      logger.error(`Error validating claims in batch. Claim count: ${claimIds.length}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to validate claims in batch' } });
    }
  },

  /**
   * Submits a validated claim to a payer
   * @param req - Request with claim ID in parameters and submission data in body
   * @param res - Express Response
   * @returns Sends HTTP response with submitted claim data
   */
  async submitClaim(req: RequestWithParamsAndBody<IdParam, SubmitClaimDto>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const submissionData = req.body; // Extract submission data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Submitting claim with ID: ${claimId}`, { submissionData, userId }); // Log claim submission request
    try {
      const submittedClaim = await ClaimsService.submitClaim(claimId, submissionData, userId); // Call ClaimsService.submitClaim to submit claim
      res.status(200).json(SuccessResponse(submittedClaim)); // Return success response with submitted claim data
    } catch (error) {
      logger.error(`Error submitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to submit claim' } });
    }
  },

  /**
   * Submits multiple validated claims to payers
   * @param req - Request with batch submission data in body
   * @param res - Express Response
   * @returns Sends HTTP response with batch submission results
   */
  async batchSubmitClaims(req: RequestWithBody<BatchSubmitClaimsDto>, res: Response): Promise<void> {
    const batchData = req.body; // Extract batch submission data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { batchData, userId }); // Log batch submission request
    try {
      const submissionResults = await ClaimsService.batchSubmitClaims(batchData, userId); // Call ClaimsService.batchSubmitClaims to submit claims
      res.status(200).json(BulkOperationSuccessResponse({
        successful: submissionResults.successCount,
        failed: submissionResults.errorCount,
        total: submissionResults.totalProcessed
      })); // Return bulk operation response with submission results
    } catch (error) {
      logger.error(`Error submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to submit claims in batch' } });
    }
  },

  /**
   * Validates and submits a claim in one operation
   * @param req - Request with claim ID in parameters and submission data in body
   * @param res - Express Response
   * @returns Sends HTTP response with validated and submitted claim data
   */
  async validateAndSubmitClaim(req: RequestWithParamsAndBody<IdParam, SubmitClaimDto>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const submissionData = req.body; // Extract submission data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Validating and submitting claim with ID: ${claimId}`, { submissionData, userId }); // Log validate and submit request
    try {
      const submittedClaim = await ClaimsService.validateAndSubmitClaim(claimId, submissionData, userId); // Call ClaimsService.validateAndSubmitClaim to validate and submit claim
      res.status(200).json(SuccessResponse(submittedClaim)); // Return success response with submitted claim data
    } catch (error) {
      logger.error(`Error validating and submitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to validate and submit claim' } });
    }
  },

  /**
   * Validates and submits multiple claims in one operation
   * @param req - Request with batch submission data in body
   * @param res - Express Response
   * @returns Sends HTTP response with batch validation and submission results
   */
  async batchValidateAndSubmitClaims(req: RequestWithBody<BatchSubmitClaimsDto>, res: Response): Promise<void> {
    const batchData = req.body; // Extract batch submission data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Validating and submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { batchData, userId }); // Log batch validate and submit request
    try {
      const submissionResults = await ClaimsService.batchValidateAndSubmitClaims(batchData.claimIds, batchData, userId); // Call ClaimsService.batchValidateAndSubmitClaims to validate and submit claims
      res.status(200).json(BulkOperationSuccessResponse({
        successful: submissionResults.successCount,
        failed: submissionResults.errorCount,
        total: submissionResults.totalProcessed
      })); // Return bulk operation response with submission results
    } catch (error) {
      logger.error(`Error validating and submitting claims in batch. Claim count: ${batchData.claimIds.length}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to validate and submit claims in batch' } });
    }
  },

  /**
   * Resubmits a previously submitted claim that was rejected or denied
   * @param req - Request with claim ID in parameters and submission data in body
   * @param res - Express Response
   * @returns Sends HTTP response with resubmitted claim data
   */
  async resubmitClaim(req: RequestWithParamsAndBody<IdParam, SubmitClaimDto>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const submissionData = req.body; // Extract submission data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Resubmitting claim with ID: ${claimId}`, { submissionData, userId }); // Log claim resubmission request
    try {
      const resubmittedClaim = await ClaimsService.resubmitClaim(claimId, submissionData, userId); // Call ClaimsService.resubmitClaim to resubmit claim
      res.status(200).json(SuccessResponse(resubmittedClaim)); // Return success response with resubmitted claim data
    } catch (error) {
      logger.error(`Error resubmitting claim with ID: ${claimId}`, { error, submissionData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to resubmit claim' } });
    }
  },

  /**
   * Updates the status of a claim
   * @param req - Request with claim ID in parameters and status data in body
   * @param res - Express Response
   * @returns Sends HTTP response with updated claim data
   */
  async updateClaimStatus(req: RequestWithParamsAndBody<IdParam, UpdateClaimStatusDto>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const statusData = req.body; // Extract status update data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Updating claim status for claim ID: ${claimId}`, { statusData, userId }); // Log claim status update request
    try {
      const updatedClaim = await ClaimsService.updateClaimStatus(claimId, statusData, userId); // Call ClaimsService.updateClaimStatus to update claim status
      res.status(200).json(SuccessResponse(updatedClaim)); // Return success response with updated claim data
    } catch (error) {
      logger.error(`Error updating claim status for claim ID: ${claimId}`, { error, statusData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to update claim status' } });
    }
  },

  /**
   * Retrieves the current status of a claim
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with claim status information
   */
  async getClaimStatus(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    logger.info(`Retrieving claim status for claim ID: ${claimId}`); // Log claim status retrieval request
    try {
      const claimStatus = await ClaimsService.getClaimStatus(claimId); // Call ClaimsService.getClaimStatus to get claim status
      res.status(200).json(SuccessResponse(claimStatus)); // Return success response with status information
    } catch (error) {
      logger.error(`Error retrieving claim status for claim ID: ${claimId}`, { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claim status' } });
    }
  },

  /**
   * Refreshes the status of a claim by checking with the clearinghouse or payer
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with refreshed claim data
   */
  async refreshClaimStatus(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Refreshing claim status for claim ID: ${claimId}`, { userId }); // Log claim status refresh request
    try {
      const refreshedClaim = await ClaimsService.refreshClaimStatus(claimId, userId); // Call ClaimsService.refreshClaimStatus to refresh claim status
      res.status(200).json(SuccessResponse(refreshedClaim)); // Return success response with refreshed claim data
    } catch (error) {
      logger.error(`Error refreshing claim status for claim ID: ${claimId}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to refresh claim status' } });
    }
  },

  /**
   * Refreshes the status of multiple claims by checking with clearinghouses or payers
   * @param req - Request with claim IDs in body
   * @param res - Express Response
   * @returns Sends HTTP response with batch refresh results
   */
  async batchRefreshClaimStatus(req: RequestWithBody<{ claimIds: UUID[] }>, res: Response): Promise<void> {
    const claimIds = req.body.claimIds; // Extract claim IDs from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Refreshing claim statuses in batch. Claim count: ${claimIds.length}`, { userId }); // Log batch status refresh request
    try {
      const refreshResults = await ClaimsService.batchRefreshClaimStatus(claimIds, userId); // Call ClaimsService.batchRefreshClaimStatus to refresh claim statuses
      res.status(200).json(SuccessResponse(refreshResults)); // Return success response with batch refresh results
    } catch (error) {
      logger.error(`Error refreshing claim statuses in batch. Claim count: ${claimIds.length}`, { error, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to refresh claim statuses in batch' } });
    }
  },

  /**
   * Retrieves claims filtered by status
   * @param req - Request with status in parameters and query parameters for filtering and pagination
   * @param res - Express Response
   * @returns Sends HTTP response with claims filtered by status
   */
  async getClaimsByStatus(req: RequestWithParams<{ status: string }> & RequestWithQuery<ClaimQueryParams>, res: Response): Promise<void> {
    const status = req.params.status as ClaimStatus; // Extract status from request parameters
    const queryParams = req.query; // Extract query parameters for filtering and pagination
    logger.info(`Retrieving claims by status: ${status}`, { queryParams }); // Log claims by status request
    try {
      const { claims, total, page, limit, totalPages } = await ClaimsService.getClaimsByStatus(status, queryParams); // Call ClaimsService.getClaimsByStatus to get claims filtered by status
      res.status(200).json(PaginatedResponse(claims, { page, limit, totalItems: total, totalPages })); // Return paginated response with filtered claims
    } catch (error) {
      logger.error(`Error retrieving claims by status: ${status}`, { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claims by status' } });
    }
  },

  /**
   * Generates an aging report for claims based on their current status and age
   * @param req - Request with query parameters for filtering
   * @param res - Express Response
   * @returns Sends HTTP response with aging report data
   */
  async getClaimAging(req: RequestWithQuery<ClaimQueryParams>, res: Response): Promise<void> {
    const queryParams = req.query; // Extract query parameters for filtering
    logger.info('Generating claim aging report', { queryParams }); // Log claim aging report request
    try {
      const agingReport = await ClaimsService.getClaimAging(queryParams); // Call ClaimsService.getClaimAging to generate aging report
      res.status(200).json(SuccessResponse(agingReport)); // Return success response with aging report data
    } catch (error) {
      logger.error('Error generating claim aging report', { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to generate claim aging report' } });
    }
  },

  /**
   * Generates a detailed timeline of a claim's lifecycle
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with claim timeline data
   */
  async getClaimTimeline(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    logger.info(`Generating claim timeline for claim ID: ${claimId}`); // Log claim timeline request
    try {
      const claimTimeline = await ClaimsService.getClaimTimeline(claimId); // Call ClaimsService.getClaimTimeline to generate claim timeline
      res.status(200).json(SuccessResponse(claimTimeline)); // Return success response with timeline data
    } catch (error) {
      logger.error(`Error generating claim timeline for claim ID: ${claimId}`, { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to generate claim timeline' } });
    }
  },

  /**
   * Voids a claim, marking it as no longer valid
   * @param req - Request with claim ID in parameters and notes in body
   * @param res - Express Response
   * @returns Sends HTTP response with voided claim data
   */
  async voidClaim(req: RequestWithParamsAndBody<IdParam, { notes?: string }>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const notes = req.body.notes; // Extract notes from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Voiding claim with ID: ${claimId}`, { notes, userId }); // Log claim void request
    try {
      const voidedClaim = await ClaimsService.voidClaim(claimId, notes, userId); // Call ClaimsService.voidClaim to void the claim
      res.status(200).json(SuccessResponse(voidedClaim)); // Return success response with voided claim data
    } catch (error) {
      logger.error(`Error voiding claim with ID: ${claimId}`, { error, notes, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to void claim' } });
    }
  },

  /**
   * Creates an appeal for a denied claim
   * @param req - Request with claim ID in parameters and appeal data in body
   * @param res - Express Response
   * @returns Sends HTTP response with appealed claim data
   */
  async appealClaim(req: RequestWithParamsAndBody<IdParam, { appealReason: string, supportingDocuments?: string[] }>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    const appealData = req.body; // Extract appeal data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Appealing claim with ID: ${claimId}`, { appealData, userId }); // Log claim appeal request
    try {
      const appealedClaim = await ClaimsService.appealClaim(claimId, appealData, userId); // Call ClaimsService.appealClaim to appeal the claim
      res.status(200).json(SuccessResponse(appealedClaim)); // Return success response with appealed claim data
    } catch (error) {
      logger.error(`Error appealing claim with ID: ${claimId}`, { error, appealData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to appeal claim' } });
    }
  },

  /**
   * Creates an adjustment claim based on an existing claim
   * @param req - Request with original claim ID in parameters and adjustment claim data in body
   * @param res - Express Response
   * @returns Sends HTTP response with created adjustment claim data
   */
  async createAdjustmentClaim(req: RequestWithParamsAndBody<IdParam, CreateClaimDto>, res: Response): Promise<void> {
    const originalClaimId = req.params.id; // Extract original claim ID from request parameters
    const adjustmentClaimData = req.body; // Extract adjustment claim data from request body
    const userId = req.user?.id; // Extract user ID from authenticated request
    logger.info(`Creating adjustment claim for original claim ID: ${originalClaimId}`, { adjustmentClaimData, userId }); // Log adjustment claim creation request
    try {
      const adjustmentClaim = await ClaimsService.createAdjustmentClaim(originalClaimId, adjustmentClaimData, userId); // Call ClaimsService.createAdjustmentClaim to create adjustment claim
      res.status(201).json(SuccessResponse(adjustmentClaim)); // Return success response with created adjustment claim data
    } catch (error) {
      logger.error(`Error creating adjustment claim for original claim ID: ${originalClaimId}`, { error, adjustmentClaimData, userId }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to create adjustment claim' } });
    }
  },

  /**
   * Retrieves the complete lifecycle information for a claim
   * @param req - Request with claim ID in parameters
   * @param res - Express Response
   * @returns Sends HTTP response with claim lifecycle information
   */
  async getClaimLifecycle(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    const claimId = req.params.id; // Extract claim ID from request parameters
    logger.info(`Retrieving claim lifecycle for claim ID: ${claimId}`); // Log claim lifecycle information request
    try {
      const claimLifecycle = await ClaimsService.getClaimLifecycle(claimId); // Call ClaimsService.getClaimLifecycle to get lifecycle information
      res.status(200).json(SuccessResponse(claimLifecycle)); // Return success response with lifecycle information
    } catch (error) {
      logger.error(`Error retrieving claim lifecycle for claim ID: ${claimId}`, { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claim lifecycle' } });
    }
  },

  /**
   * Retrieves claim metrics for dashboard and reporting
   * @param req - Request with query parameters for filtering
   * @param res - Express Response
   * @returns Sends HTTP response with claim metrics data
   */
  async getClaimMetrics(req: RequestWithQuery<{ dateRange?: string, programId?: UUID, payerId?: UUID, facilityId?: UUID }>, res: Response): Promise<void> {
    const queryParams = req.query; // Extract query parameters for filtering
    logger.info('Retrieving claim metrics', { queryParams }); // Log claim metrics retrieval request
    try {
      const claimMetrics = await ClaimsService.getClaimMetrics(queryParams); // Call ClaimsService.getClaimMetrics to retrieve claim metrics
      res.status(200).json(SuccessResponse(claimMetrics)); // Return success response with metrics data
    } catch (error) {
      logger.error('Error retrieving claim metrics', { error }); // Handle errors and return appropriate error response
      res.status(500).json({ error: { message: 'Failed to retrieve claim metrics' } });
    }
  }
};