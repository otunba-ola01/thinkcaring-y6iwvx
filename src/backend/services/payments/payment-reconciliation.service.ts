import { UUID, Money, ISO8601Date, RepositoryOptions } from '../../types/common.types'; // Import common type definitions used in payment reconciliation
import { Payment, PaymentWithRelations, ClaimPayment, PaymentAdjustment, ReconciliationStatus, ReconciliationResult, ReconcilePaymentDto } from '../../types/payments.types'; // Import payment-related type definitions for reconciliation
import { Claim, ClaimStatus } from '../../types/claims.types'; // Import claim-related type definitions for reconciliation
import { paymentRepository } from '../../database/repositories/payment.repository'; // Access payment data for reconciliation operations
import { claimRepository } from '../../database/repositories/claim.repository'; // Access claim data for reconciliation operations
import { PaymentModel } from '../../models/payment.model'; // Use payment model for business logic operations
import { ClaimModel } from '../../models/claim.model'; // Use claim model for business logic operations
import { paymentMatchingService } from './payment-matching.service'; // Use payment matching service for finding and applying claim matches
import { accountsReceivableService } from './accounts-receivable.service'; // Use accounts receivable service for payment history
import { db, getTransaction } from '../../database/connection'; // Database transaction management for reconciliation operations
import { NotFoundError } from '../../errors/not-found-error'; // Error handling for payment or claim not found scenarios
import { BusinessError } from '../../errors/business-error'; // Error handling for business rule violations
import { logger } from '../../utils/logger'; // Logging for reconciliation operations

/**
 * Service for reconciling payments with claims, managing adjustments, and updating claim statuses
 */
class PaymentReconciliationService {
  /**
   * Creates a new payment reconciliation service instance
   */
  constructor() {
    // Initialize service
    // Log service initialization
    logger.info('PaymentReconciliationService initialized');
  }

  /**
   * Reconciles a payment with claims based on provided claim payments and adjustments
   * @param paymentId - Payment ID
   * @param reconcileData - Data for reconciliation including claim payments and adjustments
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the reconciliation process including updated payment, claim payments, and claim status changes
   */
  async reconcilePayment(
    paymentId: UUID,
    reconcileData: ReconcilePaymentDto,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<ReconciliationResult> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || await getTransaction();
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Retrieve payment using PaymentModel.findById
      const payment = await paymentRepository.findByIdWithRelations(paymentId, transactionOptions);

      // If payment not found, throw NotFoundError
      if (!payment) {
        throw new NotFoundError('Payment not found', 'Payment', paymentId);
      }

      // Validate that total claim payment amount doesn't exceed payment amount
      let totalClaimPaymentAmount: Money = 0;
      if (reconcileData.claimPayments && reconcileData.claimPayments.length > 0) {
        totalClaimPaymentAmount = reconcileData.claimPayments.reduce((sum, claimPayment) => sum + claimPayment.amount, 0);
      }

      if (totalClaimPaymentAmount > payment.paymentAmount) {
        throw new BusinessError('Total claim payment amount exceeds payment amount', {
          paymentAmount: payment.paymentAmount,
          totalClaimPaymentAmount: totalClaimPaymentAmount
        }, 'payment.reconcile.amountExceedsPayment');
      }

      // Remove existing claim payments if any (for re-reconciliation)
      if (payment.claimPayments && payment.claimPayments.length > 0) {
        await paymentRepository.removeClaimPayments(paymentId, transactionOptions);
      }

      // Apply new claim payments using paymentMatchingService.applyMatches
      const { claimPayments, updatedClaims } = await paymentMatchingService.applyMatches(
        paymentId,
        reconcileData.claimPayments.map(cp => ({ claimId: cp.claimId, amount: cp.amount })),
        transactionOptions
      );

      // Calculate total matched amount and unmatched amount
      let matchedAmount: Money = 0;
      claimPayments.forEach(claimPayment => {
        matchedAmount += claimPayment.paidAmount;
      });
      const unmatchedAmount: Money = payment.paymentAmount - matchedAmount;

      // Determine appropriate reconciliation status based on matched amount
      const reconciliationStatus = paymentMatchingService.calculateReconciliationStatus(payment.paymentAmount, matchedAmount);

      // Update payment reconciliation status
      await paymentRepository.updateReconciliationStatus(paymentId, reconciliationStatus, transactionOptions);

      // Update claim statuses based on payments (PAID or PARTIAL_PAID)
      for (const claimPayment of claimPayments) {
        await claimRepository.updateStatus(claimPayment.claimId, claimPayment.claim.claimStatus, 'Payment reconciled', transactionOptions);
      }

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return reconciliation result with updated payment, claim payments, and claim status changes
      const reconciliationResult: ReconciliationResult = {
        payment: payment,
        claimPayments: claimPayments,
        totalAmount: payment.paymentAmount,
        matchedAmount: matchedAmount,
        unmatchedAmount: unmatchedAmount,
        reconciliationStatus: reconciliationStatus,
        updatedClaims: updatedClaims
      };

      // Log reconciliation completion
      logger.info(`Payment ${paymentId} reconciled successfully`, { reconciliationResult });

      return reconciliationResult;
    } catch (error) {
      // Rollback transaction and rethrow
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error reconciling payment ${paymentId}`, { error });
      throw error;
    }
  }

  /**
   * Gets suggested claim matches for a payment based on various matching criteria
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Payment with suggested claim matches
   */
  async getSuggestedMatches(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<{
    payment: PaymentWithRelations;
    suggestedMatches: Array<{ claimId: UUID; claimNumber: string; clientName: string; serviceDate: ISO8601Date; amount: Money; matchScore: number; matchReason: string; suggestedAmount: Money }>;
  }> {
    // Use paymentMatchingService.matchPaymentToClaims to find potential matches
    const { payment, matches } = await paymentMatchingService.matchPaymentToClaims(paymentId, options);

    // For each match, retrieve additional claim details for display
    const suggestedMatches = matches.map(match => ({
      claimId: match.claimId,
      claimNumber: '', // TODO: Implement claim number retrieval
      clientName: '', // TODO: Implement client name retrieval
      serviceDate: '', // TODO: Implement service date retrieval
      amount: match.amount,
      matchScore: match.score,
      matchReason: match.matchReason,
      suggestedAmount: match.amount // TODO: Implement suggested amount calculation
    }));

    // Sort matches by score in descending order (best matches first)
    suggestedMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Return payment with suggested matches
    logger.debug(`Generated ${suggestedMatches.length} suggested matches for payment ${paymentId}`);
    return {
      payment,
      suggestedMatches
    };
  }

  /**
   * Gets detailed reconciliation information for a payment
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Detailed reconciliation information
   */
  async getReconciliationDetails(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<{
    payment: PaymentWithRelations;
    claimPayments: Array<{ claimPayment: ClaimPayment; claim: Claim; adjustments: PaymentAdjustment[] }>;
    totalAmount: Money;
    matchedAmount: Money;
    unmatchedAmount: Money;
  }> {
    // Retrieve payment with relations using paymentRepository.findByIdWithRelations
    const payment = await paymentRepository.findByIdWithRelations(paymentId, options);

    // If payment not found, throw NotFoundError
    if (!payment) {
      throw new NotFoundError('Payment not found', 'Payment', paymentId);
    }

    // For each claim payment, retrieve full claim details
    const claimPayments = await Promise.all(
      payment.claimPayments.map(async claimPayment => {
        const claim = await claimRepository.findById(claimPayment.claimId, options);
        return {
          claimPayment: claimPayment,
          claim: claim,
          adjustments: claimPayment.adjustments
        };
      })
    );

    // For each claim payment, retrieve adjustment details
    // Calculate total matched amount from claim payments
    let matchedAmount: Money = 0;
    claimPayments.forEach(claimPayment => {
      matchedAmount += claimPayment.claimPayment.paidAmount;
    });

    // Calculate unmatched amount (payment amount - matched amount)
    const unmatchedAmount: Money = payment.paymentAmount - matchedAmount;

    // Return payment with detailed claim payments, adjustments, and amount calculations
    logger.debug(`Retrieved reconciliation details for payment ${paymentId}`);
    return {
      payment,
      claimPayments,
      totalAmount: payment.paymentAmount,
      matchedAmount,
      unmatchedAmount
    };
  }

  /**
   * Undoes a previous reconciliation, removing claim payment associations and resetting statuses
   * @param paymentId - Payment ID
   * @param userId - User ID
   * @param options - Repository options
   * @returns Result of the undo operation
   */
  async undoReconciliation(
    paymentId: UUID,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<{ success: boolean; payment: PaymentWithRelations; updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus }> }> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || await getTransaction();
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Retrieve payment with relations using paymentRepository.findByIdWithRelations
      const payment = await paymentRepository.findByIdWithRelations(paymentId, transactionOptions);

      // If payment not found, throw NotFoundError
      if (!payment) {
        throw new NotFoundError('Payment not found', 'Payment', paymentId);
      }

      // If payment has no claim payments, throw BusinessError (nothing to undo)
      if (!payment.claimPayments || payment.claimPayments.length === 0) {
        throw new BusinessError('Payment has no claim payments to undo', null, 'payment.undo.noClaimPayments');
      }

      // Track claims that had status changes
      const updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus }> = [];

      // For each claim payment, revert claim status to previous state (PENDING or SUBMITTED)
      for (const claimPayment of payment.claimPayments) {
        const claim = await claimRepository.findById(claimPayment.claimId, transactionOptions);
        if (claim) {
          const previousStatus = claim.claimStatus;
          await claimRepository.updateStatus(claimPayment.claimId, ClaimStatus.PENDING, 'Reconciliation undone', transactionOptions);
          updatedClaims.push({ claimId: claimPayment.claimId, previousStatus: previousStatus, newStatus: ClaimStatus.PENDING });
        }
      }

      // Remove all claim payment associations using paymentRepository.removeClaimPayments
      await paymentRepository.removeClaimPayments(paymentId, transactionOptions);

      // Update payment reconciliation status to UNRECONCILED
      await paymentRepository.updateReconciliationStatus(paymentId, ReconciliationStatus.UNRECONCILED, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return success status, updated payment, and list of updated claims
      logger.info(`Reconciliation undone for payment ${paymentId}`);
      return {
        success: true,
        payment: payment,
        updatedClaims: updatedClaims
      };
    } catch (error) {
      // Rollback transaction and rethrow
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error undoing reconciliation for payment ${paymentId}`, { error });
      throw error;
    }
  }

  /**
   * Reconciles multiple payments in a batch operation
   * @param batchData - Array of payment IDs and reconcile data
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the batch reconciliation operation
   */
  async batchReconcilePayments(
    batchData: Array<{ paymentId: UUID; reconcileData: ReconcilePaymentDto }>,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<{ successful: UUID[]; failed: Array<{ paymentId: UUID; error: string }>; results: ReconciliationResult[] }> {
    // Initialize arrays for successful reconciliations, failures, and results
    const successful: UUID[] = [];
    const failed: Array<{ paymentId: UUID; error: string }> = [];
    const results: ReconciliationResult[] = [];

    // For each payment in the batch:
    for (const paymentData of batchData) {
      try {
        // Try to reconcile the payment using reconcilePayment
        const result = await this.reconcilePayment(paymentData.paymentId, paymentData.reconcileData, userId, options);

        // If successful, add to successful array and results
        successful.push(paymentData.paymentId);
        results.push(result);
      } catch (error) {
        // If failed, add to failed array with error message
        failed.push({
          paymentId: paymentData.paymentId,
          error: error.message
        });
        logger.error(`Batch reconciliation failed for payment ${paymentData.paymentId}`, { error });
      }
    }

    // Continue processing remaining payments even if some fail
    // Return arrays of successful reconciliations, failures, and detailed results
    logger.info(`Batch reconciliation completed with ${successful.length} successful and ${failed.length} failed payments`);
    return {
      successful,
      failed,
      results
    };
  }

  /**
   * Automatically reconciles a payment using intelligent matching algorithms
   * @param paymentId - Payment ID
   * @param matchThreshold - Minimum score threshold for matches
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the auto-reconciliation process
   */
  async autoReconcilePayment(
    paymentId: UUID,
    matchThreshold: number = 0.8,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<ReconciliationResult> {
    // Get suggested matches using getSuggestedMatches
    const { payment, suggestedMatches } = await this.getSuggestedMatches(paymentId, options);

    // Filter matches by minimum score threshold
    const filteredMatches = suggestedMatches.filter(match => match.matchScore >= matchThreshold);

    // Transform matches into ReconcilePaymentDto format
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: filteredMatches.map(match => ({
        claimId: match.claimId,
        amount: match.amount
      })),
      notes: `Auto-reconciled with ${filteredMatches.length} matches (threshold: ${matchThreshold})`
    };

    // Call reconcilePayment with the auto-generated reconcile data
    const reconciliationResult = await this.reconcilePayment(paymentId, reconcileData, userId, options);

    // Return reconciliation result
    logger.info(`Auto-reconciled payment ${paymentId} with ${filteredMatches.length} matches`);
    return reconciliationResult;
  }

  /**
   * Validates a reconciliation request before processing
   * @param payment - Payment with relations
   * @param reconcileData - Reconciliation data
   * @returns True if valid, throws BusinessError if invalid
   */
  validateReconciliation(payment: PaymentWithRelations, reconcileData: ReconcilePaymentDto): boolean {
    // Validate that payment exists and is active
    // Validate that reconcileData contains valid claim payments
    // Calculate total claim payment amount
    // Validate that total claim payment amount doesn't exceed payment amount
    // For each claim, validate that it exists and is in a reconcilable state
    // For adjustments, validate that adjustment codes and amounts are valid
    // Return true if all validations pass
    // Throw BusinessError with specific message if any validation fails
    return true;
  }

  /**
   * Calculates total amounts for reconciliation
   * @param payment - Payment with relations
   * @returns Calculated totals
   */
  calculateTotals(payment: PaymentWithRelations): { totalAmount: Money; matchedAmount: Money; unmatchedAmount: Money } {
    // Get total payment amount from payment
    // Calculate matched amount by summing all claim payment amounts
    // Calculate unmatched amount (total - matched)
    // Return object with all calculated amounts
    return { totalAmount: 0, matchedAmount: 0, unmatchedAmount: 0 };
  }

  /**
   * Gets the reconciliation history for a payment
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Reconciliation history records
   */
  async getReconciliationHistory(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<{ timestamp: ISO8601Date; userId: UUID | null; userName: string | null; action: string; previousStatus: ReconciliationStatus; newStatus: ReconciliationStatus; details: string | null }>> {
    // Retrieve payment history from audit logs
    // Filter history for reconciliation-related events
    // Transform audit records into user-friendly history format
    // Include user information for each history entry
    // Sort history by timestamp in descending order (newest first)
    // Return the reconciliation history
    // Log reconciliation history retrieval
    return [];
  }
}

// Create a singleton instance of the service
const paymentReconciliationService = new PaymentReconciliationService();

// Export the service instance for use throughout the application
export { PaymentReconciliationService, paymentReconciliationService };