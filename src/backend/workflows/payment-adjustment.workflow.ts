/**
 * Implements the payment adjustment workflow in the HCBS Revenue Management System.
 * This workflow orchestrates the process of handling payment adjustments, including processing denials,
 * underpayments, overpayments, and other adjustment types. It provides functionality for analyzing
 * adjustment impacts, tracking adjustment trends, and ensuring proper financial reconciliation.
 */

import { UUID, Money, RepositoryOptions } from '../types/common.types'; // Import common type definitions used in payment adjustment workflow
import { Payment, PaymentWithRelations, ClaimPayment, PaymentAdjustment, AdjustmentType, AdjustmentImpact } from '../types/payments.types'; // Import payment-related type definitions for adjustment workflow
import { Claim, ClaimStatus } from '../types/claims.types'; // Import claim-related type definitions for adjustment processing
import { adjustmentTrackingService } from '../services/payments/adjustment-tracking.service'; // Import adjustment tracking service for core adjustment functionality
import { claimsService } from '../services/claims.service'; // Import claims service for updating claim status during adjustment processing
import { accountsReceivableService } from '../services/payments/accounts-receivable.service'; // Import accounts receivable service for updating AR based on adjustments
import { paymentRepository } from '../database/repositories/payment.repository'; // Import payment repository for retrieving payment data
import { claimRepository } from '../database/repositories/claim.repository'; // Import claim repository for retrieving claim data
import { NotFoundError } from '../errors/not-found-error'; // Import error class for when payments or claims are not found
import { BusinessError } from '../errors/business-error'; // Import error class for business rule violations
import { logger } from '../utils/logger'; // Import logger for logging workflow operations
import { db } from '../database/connection'; // Import database connection for transaction management

/**
 * Orchestrates the workflow for processing and managing payment adjustments
 */
class PaymentAdjustmentWorkflow {
  /**
   * Creates a new payment adjustment workflow instance
   */
  constructor() {
    // Initialize workflow
    logger.debug('PaymentAdjustmentWorkflow initialized'); // Log workflow initialization
  }

  /**
   * Processes a payment adjustment and updates related entities
   * @param claimPaymentId - UUID: The unique identifier of the claim payment to adjust.
   * @param adjustmentData - PaymentAdjustment: The adjustment data to apply.
   * @param userId - UUID | null: The unique identifier of the user initiating the adjustment, or null if the system is initiating.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }>: The created adjustment and updated entities.
   */
  async processAdjustment(
    claimPaymentId: UUID,
    adjustmentData: PaymentAdjustment,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }> {
    logger.info(`Starting adjustment processing for claim payment ID: ${claimPaymentId}`, { claimPaymentId, adjustmentData, userId, options }); // Log adjustment processing start

    const useTransaction = !options.transaction;
    const transaction = useTransaction ? await db.transaction() : options.transaction;

    try {
      // Validate adjustment data (type, code, amount)
      this.validateAdjustmentData(adjustmentData);

      // Add adjustment using adjustmentTrackingService.addAdjustment
      const adjustment = await adjustmentTrackingService.addAdjustment(claimPaymentId, adjustmentData, { ...options, transaction });

      // Retrieve claim payment details if needed for claim updates
      const claimPayment = await paymentRepository.getClaimPayments(claimPaymentId, { ...options, transaction });
      if (!claimPayment) {
        throw new NotFoundError('Claim Payment not found', 'ClaimPayment', claimPaymentId);
      }

      let claim: Claim | null = null;
      if (claimPayment[0].claimId) {
        claim = await claimRepository.findByIdWithRelations(claimPayment[0].claimId, { ...options, transaction });
      }

      // Update claim status based on adjustment type if applicable
      if (claim) {
        await this.updateClaimStatusForAdjustment(claim.id, adjustmentData.adjustmentType, adjustmentData.adjustmentAmount, { ...options, transaction });
      }

      // Update accounts receivable based on adjustment
      await accountsReceivableService.updateAccountsReceivable(claimPaymentId, adjustmentData.adjustmentAmount, { ...options, transaction });

      // Commit transaction if started in this method
      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Successfully processed adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, adjustmentId: adjustment.id, userId }); // Log successful adjustment processing

      // Return created adjustment with related entities
      return { adjustment, claimPayment: claimPayment[0], claim };
    } catch (error) {
      // Rollback transaction and rethrow
      if (useTransaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error processing adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, error, userId }); // Log error if adjustment processing fails
      throw error;
    }
  }

  /**
   * Processes a denial adjustment for a claim
   * @param claimId - UUID: The unique identifier of the claim to adjust.
   * @param denialCode - string: The code associated with the denial.
   * @param denialReason - string: The reason for the denial.
   * @param userId - UUID | null: The unique identifier of the user initiating the adjustment, or null if the system is initiating.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ adjustment: PaymentAdjustment; claim: Claim }>: The created adjustment and updated claim.
   */
  async processDenialAdjustment(
    claimId: UUID,
    denialCode: string,
    denialReason: string,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ adjustment: PaymentAdjustment; claim: Claim }> {
    logger.info(`Starting denial adjustment processing for claim ID: ${claimId}`, { claimId, denialCode, denialReason, userId, options }); // Log denial adjustment processing start

    const useTransaction = !options.transaction;
    const transaction = useTransaction ? await db.transaction() : options.transaction;

    try {
      // Retrieve claim using claimRepository.findByIdWithRelations
      const claim = await claimRepository.findByIdWithRelations(claimId, { ...options, transaction });

      // If claim not found, throw NotFoundError
      if (!claim) {
        logger.error(`Claim with ID ${claimId} not found`);
        throw new NotFoundError('Claim not found', 'Claim', claimId);
      }

      // Create adjustment data with denial information
      const adjustmentData: PaymentAdjustment = {
        id: null,
        claimPaymentId: null,
        adjustmentType: AdjustmentType.NONCOVERED,
        adjustmentCode: denialCode,
        adjustmentAmount: claim.totalAmount,
        description: denialReason,
        status: 'active',
        createdAt: null,
        updatedAt: null
      };

      // Add adjustment using adjustmentTrackingService.addAdjustment
      const adjustment = await adjustmentTrackingService.addAdjustment(null, adjustmentData, { ...options, transaction });

      // Update claim status to DENIED
      await claimsService.updateClaimStatus(claimId, { status: ClaimStatus.DENIED, denialReason: denialReason, notes: `Claim denied with code ${denialCode}` }, userId);

      // Update accounts receivable to reflect denial
      await accountsReceivableService.updateAccountsReceivable(claimId, adjustmentData.adjustmentAmount, { ...options, transaction });

      // Commit transaction if started in this method
      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Successfully processed denial adjustment for claim ID: ${claimId}`, { claimId, adjustmentId: adjustment.id, userId }); // Log successful denial adjustment processing

      // Return adjustment and updated claim
      return { adjustment, claim };
    } catch (error) {
      // Rollback transaction and rethrow
      if (useTransaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error processing denial adjustment for claim ID: ${claimId}`, { claimId, error, userId }); // Log error if denial adjustment processing fails
      throw error;
    }
  }

  /**
   * Processes an underpayment adjustment for a claim payment
   * @param claimPaymentId - UUID: The unique identifier of the claim payment to adjust.
   * @param expectedAmount - Money: The expected payment amount.
   * @param actualAmount - Money: The actual payment amount received.
   * @param adjustmentCode - string: The code associated with the adjustment.
   * @param adjustmentReason - string: The reason for the adjustment.
   * @param userId - UUID | null: The unique identifier of the user initiating the adjustment, or null if the system is initiating.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }>: The created adjustment and updated entities.
   */
  async processUnderpaymentAdjustment(
    claimPaymentId: UUID,
    expectedAmount: Money,
    actualAmount: Money,
    adjustmentCode: string,
    adjustmentReason: string,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }> {
    logger.info(`Starting underpayment adjustment processing for claim payment ID: ${claimPaymentId}`, { claimPaymentId, expectedAmount, actualAmount, adjustmentCode, adjustmentReason, userId, options }); // Log underpayment adjustment processing start

    const useTransaction = !options.transaction;
    const transaction = useTransaction ? await db.transaction() : options.transaction;

    try {
      // Calculate underpayment amount (expected - actual)
      const underpaymentAmount = expectedAmount - actualAmount;

      // Validate underpayment amount is positive
      if (underpaymentAmount <= 0) {
        logger.warn(`Underpayment amount is not positive for claim payment ID: ${claimPaymentId}`);
        throw new BusinessError('Underpayment amount must be positive', { expectedAmount, actualAmount }, 'invalid-underpayment-amount');
      }

      // Create adjustment data with underpayment information
      const adjustmentData: PaymentAdjustment = {
        id: null,
        claimPaymentId: claimPaymentId,
        adjustmentType: AdjustmentType.CONTRACTUAL,
        adjustmentCode: adjustmentCode,
        adjustmentAmount: underpaymentAmount,
        description: adjustmentReason,
        status: 'active',
        createdAt: null,
        updatedAt: null
      };

      // Add adjustment using adjustmentTrackingService.addAdjustment
      const adjustment = await adjustmentTrackingService.addAdjustment(claimPaymentId, adjustmentData, { ...options, transaction });

      // Retrieve claim payment details if needed for claim updates
      const claimPayment = await paymentRepository.getClaimPayments(claimPaymentId, { ...options, transaction });
      if (!claimPayment) {
        throw new NotFoundError('Claim Payment not found', 'ClaimPayment', claimPaymentId);
      }

      let claim: Claim | null = null;
      if (claimPayment[0].claimId) {
        claim = await claimRepository.findByIdWithRelations(claimPayment[0].claimId, { ...options, transaction });
      }

      // Update claim status to reflect partial payment if applicable
      if (claim) {
        await this.updateClaimStatusForAdjustment(claim.id, adjustmentData.adjustmentType, adjustmentData.adjustmentAmount, { ...options, transaction });
      }

      // Update accounts receivable to reflect underpayment
      await accountsReceivableService.updateAccountsReceivable(claimPaymentId, adjustmentData.adjustmentAmount, { ...options, transaction });

      // Commit transaction if started in this method
      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Successfully processed underpayment adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, adjustmentId: adjustment.id, userId }); // Log successful underpayment adjustment processing

      // Return adjustment and updated entities
      return { adjustment, claimPayment: claimPayment[0], claim };
    } catch (error) {
      // Rollback transaction and rethrow
      if (useTransaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error processing underpayment adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, error, userId }); // Log error if underpayment adjustment processing fails
      throw error;
    }
  }

  /**
   * Processes an overpayment adjustment for a claim payment
   * @param claimPaymentId - UUID: The unique identifier of the claim payment to adjust.
   * @param expectedAmount - Money: The expected payment amount.
   * @param actualAmount - Money: The actual payment amount received.
   * @param adjustmentCode - string: The code associated with the adjustment.
   * @param adjustmentReason - string: The reason for the adjustment.
   * @param userId - UUID | null: The unique identifier of the user initiating the adjustment, or null if the system is initiating.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }>: The created adjustment and updated entities.
   */
  async processOverpaymentAdjustment(
    claimPaymentId: UUID,
    expectedAmount: Money,
    actualAmount: Money,
    adjustmentCode: string,
    adjustmentReason: string,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ adjustment: PaymentAdjustment; claimPayment: ClaimPayment; claim: Claim | null }> {
    logger.info(`Starting overpayment adjustment processing for claim payment ID: ${claimPaymentId}`, { claimPaymentId, expectedAmount, actualAmount, adjustmentCode, adjustmentReason, userId, options }); // Log overpayment adjustment processing start

    const useTransaction = !options.transaction;
    const transaction = useTransaction ? await db.transaction() : options.transaction;

    try {
      // Calculate overpayment amount (actual - expected)
      const overpaymentAmount = actualAmount - expectedAmount;

      // Validate overpayment amount is positive
      if (overpaymentAmount <= 0) {
        logger.warn(`Overpayment amount is not positive for claim payment ID: ${claimPaymentId}`);
        throw new BusinessError('Overpayment amount must be positive', { expectedAmount, actualAmount }, 'invalid-overpayment-amount');
      }

      // Create adjustment data with overpayment information
      const adjustmentData: PaymentAdjustment = {
        id: null,
        claimPaymentId: claimPaymentId,
        adjustmentType: AdjustmentType.CONTRACTUAL,
        adjustmentCode: adjustmentCode,
        adjustmentAmount: overpaymentAmount,
        description: adjustmentReason,
        status: 'active',
        createdAt: null,
        updatedAt: null
      };

      // Add adjustment using adjustmentTrackingService.addAdjustment
      const adjustment = await adjustmentTrackingService.addAdjustment(claimPaymentId, adjustmentData, { ...options, transaction });

      // Retrieve claim payment details if needed for claim updates
      const claimPayment = await paymentRepository.getClaimPayments(claimPaymentId, { ...options, transaction });
      if (!claimPayment) {
        throw new NotFoundError('Claim Payment not found', 'ClaimPayment', claimPaymentId);
      }

      let claim: Claim | null = null;
      if (claimPayment[0].claimId) {
        claim = await claimRepository.findByIdWithRelations(claimPayment[0].claimId, { ...options, transaction });
      }

      // Update accounts receivable to reflect overpayment
      await accountsReceivableService.updateAccountsReceivable(claimPaymentId, adjustmentData.adjustmentAmount, { ...options, transaction });

      // Commit transaction if started in this method
      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Successfully processed overpayment adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, adjustmentId: adjustment.id, userId }); // Log successful overpayment adjustment processing

      // Return adjustment and updated entities
      return { adjustment, claimPayment: claimPayment[0], claim };
    } catch (error) {
      // Rollback transaction and rethrow
      if (useTransaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error processing overpayment adjustment for claim payment ID: ${claimPaymentId}`, { claimPaymentId, error, userId }); // Log error if overpayment adjustment processing fails
      throw error;
    }
  }

  /**
   * Calculates the financial impact of adjustments on revenue
   * @param filters - object: Filters to apply to the adjustment data.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<AdjustmentImpact>: Financial impact of adjustments including totals and breakdowns.
   */
  async getAdjustmentImpact(
    filters: object,
    options: RepositoryOptions = {}
  ): Promise<AdjustmentImpact> {
    logger.info('Calculating adjustment impact', { filters, options }); // Log adjustment impact analysis start

    try {
      // Call adjustmentTrackingService.getAdjustmentImpact with filters
      const adjustmentImpact = await adjustmentTrackingService.getAdjustmentImpact(filters, options);

      // Enhance impact data with additional metrics if needed
      // TODO: Implement additional metrics calculation

      logger.info('Successfully calculated adjustment impact', { adjustmentImpact }); // Log adjustment impact analysis completion

      // Return comprehensive adjustment impact data
      return adjustmentImpact;
    } catch (error) {
      logger.error('Error calculating adjustment impact', { error, filters }); // Log error if adjustment impact analysis fails
      throw error;
    }
  }

  /**
   * Generates analytics on payment adjustments for reporting and trend analysis
   * @param filters - object: Filters to apply to the adjustment data.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ trends: any; topReasons: any; byType: any; impact: AdjustmentImpact }>: Comprehensive adjustment analytics.
   */
  async getAdjustmentAnalytics(
    filters: object,
    options: RepositoryOptions = {}
  ): Promise<{ trends: any; topReasons: any; byType: any; impact: AdjustmentImpact }> {
    logger.info('Generating adjustment analytics', { filters, options }); // Log adjustment analytics generation start

    try {
      // Get adjustment trends using adjustmentTrackingService.getAdjustmentTrends
      const trends = await adjustmentTrackingService.getAdjustmentTrends(filters, options);

      // Get top adjustment reasons using adjustmentTrackingService.getTopAdjustmentReasons
      const topReasons = await adjustmentTrackingService.getTopAdjustmentReasons(filters, 10, options);

      // Get adjustment impact using getAdjustmentImpact method
      const impact = await this.getAdjustmentImpact(filters, options);

      // Categorize adjustments by type
      const byType = adjustmentTrackingService.categorizeAdjustments([]).byType; // TODO: Implement adjustment retrieval for categorization

      // Compile comprehensive analytics with financial impact
      const analytics = {
        trends: trends,
        topReasons: topReasons,
        byType: byType,
        impact: impact
      };

      logger.info('Successfully generated adjustment analytics', { analytics }); // Log adjustment analytics generation completion

      // Return formatted analytics data
      return analytics;
    } catch (error) {
      logger.error('Error generating adjustment analytics', { error, filters }); // Log error if adjustment analytics generation fails
      throw error;
    }
  }

  /**
   * Generates analytics specifically for denial adjustments
   * @param filters - object: Filters to apply to the denial data.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<{ denialRate: number; totalDenied: Money; denialsByReason: any; denialsByPayer: any }>: Comprehensive denial analytics.
   */
  async getDenialAnalytics(
    filters: object,
    options: RepositoryOptions = {}
  ): Promise<{ denialRate: number; totalDenied: Money; denialsByReason: any; denialsByPayer: any }> {
    logger.info('Generating denial analytics', { filters, options }); // Log denial analytics generation start

    try {
      // Call adjustmentTrackingService.getDenialAnalysis with filters
      const denialAnalysis = await adjustmentTrackingService.getDenialAnalysis(filters, options);

      // Enhance denial analytics with additional metrics if needed
      // TODO: Implement additional metrics calculation

      logger.info('Successfully generated denial analytics', { denialAnalysis }); // Log denial analytics generation completion

      // Return comprehensive denial analytics
      return denialAnalysis;
    } catch (error) {
      logger.error('Error generating denial analytics', { error, filters }); // Log error if denial analytics generation fails
      throw error;
    }
  }

  /**
   * Retrieves all adjustments associated with a claim
   * @param claimId - UUID: The unique identifier of the claim to retrieve adjustments for.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<Array<PaymentAdjustment & { paymentId: UUID }>>: Claim adjustments with payment IDs.
   */
  async getAdjustmentsForClaim(
    claimId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<PaymentAdjustment & { paymentId: UUID }>> {
    logger.info(`Retrieving adjustments for claim ID: ${claimId}`, { claimId, options }); // Log adjustment retrieval start for claim

    try {
      // Call adjustmentTrackingService.getAdjustmentsForClaim with claim ID
      const adjustments = await adjustmentTrackingService.getAdjustmentsForClaim(claimId, options);

      logger.info(`Successfully retrieved adjustments for claim ID: ${claimId}`, { adjustmentCount: adjustments.length }); // Log adjustment retrieval completion

      // Return adjustments for the claim
      return adjustments;
    } catch (error) {
      logger.error(`Error retrieving adjustments for claim ID: ${claimId}`, { claimId, error }); // Log error if adjustment retrieval fails
      throw error;
    }
  }

  /**
   * Retrieves all adjustments associated with a payment
   * @param paymentId - UUID: The unique identifier of the payment to retrieve adjustments for.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<Array<PaymentAdjustment & { claimId: UUID }>>: Payment adjustments with claim IDs.
   */
  async getAdjustmentsForPayment(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<PaymentAdjustment & { claimId: UUID }>> {
    logger.info(`Retrieving adjustments for payment ID: ${paymentId}`, { paymentId, options }); // Log adjustment retrieval start for payment

    try {
      // Call adjustmentTrackingService.getAdjustmentsForPayment with payment ID
      const adjustments = await adjustmentTrackingService.getAdjustmentsForPayment(paymentId, options);

      logger.info(`Successfully retrieved adjustments for payment ID: ${paymentId}`, { adjustmentCount: adjustments.length }); // Log adjustment retrieval completion

      // Return adjustments for the payment
      return adjustments;
    } catch (error) {
      logger.error(`Error retrieving adjustments for payment ID: ${paymentId}`, { paymentId, error }); // Log error if adjustment retrieval fails
      throw error;
    }
  }

  /**
   * Validates adjustment data before processing
   * @param adjustmentData - PaymentAdjustment: The adjustment data to validate.
   * @returns boolean: True if valid, throws BusinessError if invalid.
   */
  validateAdjustmentData(adjustmentData: PaymentAdjustment): boolean {
    // Check if adjustment type is provided and valid
    if (!adjustmentData.adjustmentType) {
      throw new BusinessError('Adjustment type is required', null, 'adjustment.type.required');
    }

    // Check if adjustment code is provided
    if (!adjustmentData.adjustmentCode) {
      throw new BusinessError('Adjustment code is required', null, 'adjustment.code.required');
    }

    // Check if adjustment amount is provided and valid
    if (adjustmentData.adjustmentAmount === null || adjustmentData.adjustmentAmount === undefined) {
      throw new BusinessError('Adjustment amount is required', null, 'adjustment.amount.required');
    }

    if (adjustmentData.adjustmentAmount <= 0) {
      throw new BusinessError('Adjustment amount must be positive', null, 'adjustment.amount.positive');
    }

    // For specific adjustment types, validate additional required fields
    // TODO: Implement additional validation rules based on adjustment type

    return true; // Return true if all validations pass
  }

  /**
   * Updates a claim's status based on adjustment type and amount
   * @param claimId - UUID: The unique identifier of the claim to update.
   * @param adjustmentType - AdjustmentType: The type of adjustment being applied.
   * @param adjustmentAmount - Money: The amount of the adjustment.
   * @param options - RepositoryOptions: Options for database transaction and other configurations.
   * @returns Promise<Claim | null>: Updated claim or null if no update needed.
   */
  async updateClaimStatusForAdjustment(
    claimId: UUID,
    adjustmentType: AdjustmentType,
    adjustmentAmount: Money,
    options: RepositoryOptions = {}
  ): Promise<Claim | null> {
    logger.info(`Updating claim status for claim ID: ${claimId} based on adjustment`, { claimId, adjustmentType, adjustmentAmount }); // Log claim status update based on adjustment

    // Retrieve claim using claimRepository.findByIdWithRelations
    const claim = await claimRepository.findByIdWithRelations(claimId, options);

    // If claim not found, return null
    if (!claim) {
      logger.warn(`Claim with ID ${claimId} not found, cannot update status`);
      return null;
    }

    let newStatus: ClaimStatus | null = null;

    // Determine appropriate status based on adjustment type:
    if (adjustmentType === AdjustmentType.NONCOVERED) { // DENIAL -> DENIED
      newStatus = ClaimStatus.DENIED;
    } else if (adjustmentType === AdjustmentType.CONTRACTUAL && adjustmentAmount > 0) { // UNDERPAYMENT -> PARTIAL_PAID
      newStatus = ClaimStatus.PARTIAL_PAID;
    } else if (adjustmentType === AdjustmentType.CONTRACTUAL && adjustmentAmount < 0) { // OVERPAYMENT -> PAID
      newStatus = ClaimStatus.PAID;
    }

    // Update claim status if needed using claimsService.updateClaimStatus
    if (newStatus && newStatus !== claim.claimStatus) {
      await claimsService.updateClaimStatus(claimId, { status: newStatus }, null);
      logger.info(`Claim status updated for claim ID: ${claimId} to ${newStatus}`); // Log claim status update
    } else {
      logger.info(`No claim status update needed for claim ID: ${claimId}`);
    }

    return claim; // Return updated claim or null if no update was needed
  }
}

// Create singleton instance
const paymentAdjustmentWorkflow = new PaymentAdjustmentWorkflow();

// Export the service
export { PaymentAdjustmentWorkflow, paymentAdjustmentWorkflow };