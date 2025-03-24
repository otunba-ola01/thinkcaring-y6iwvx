import { UUID, Money, RepositoryOptions } from '../../types/common.types'; // Import common type definitions used in payment matching
import { Payment, PaymentWithRelations, ClaimPayment, PaymentAdjustment, ReconciliationStatus } from '../../types/payments.types'; // Import payment-related type definitions
import { Claim, ClaimWithRelations, ClaimStatus } from '../../types/claims.types'; // Import claim-related type definitions
import { paymentRepository } from '../../database/repositories/payment.repository'; // Access payment data for matching operations
import { claimRepository } from '../../database/repositories/claim.repository'; // Access claim data for matching operations
import { db } from '../../database/connection'; // Database transaction management for payment matching operations
import { NotFoundError } from '../../errors/not-found-error'; // Error handling for payment or claim not found scenarios
import { BusinessError } from '../../errors/business-error'; // Error handling for business rule violations
import { logger } from '../../utils/logger'; // Logging for payment matching operations

/**
 * Service for matching payments to claims using various matching algorithms and criteria
 */
class PaymentMatchingService {
  /**
   * Threshold for considering a claim a match (e.g., 0.7 for 70%)
   */
  private static readonly MATCH_THRESHOLD = 0.7;

  /**
   * Creates a new payment matching service instance
   */
  constructor() {
    // Initialize match threshold constant (e.g., 0.7)
    // Log service initialization
    logger.info('PaymentMatchingService initialized');
  }

  /**
   * Identifies potential claim matches for a payment based on various matching criteria
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Payment with potential claim matches and unmatched amount
   */
  async matchPaymentToClaims(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<{
    payment: PaymentWithRelations;
    matches: Array<{ claimId: UUID; score: number; matchReason: string; amount: Money }>;
    unmatchedAmount: Money;
  }> {
    // Retrieve payment with relations using paymentRepository
    const payment = await paymentRepository.findByIdWithRelations(paymentId, options);

    // If payment not found, throw NotFoundError
    if (!payment) {
      throw new NotFoundError('Payment not found', 'Payment', paymentId);
    }

    // Find potential claim matches based on payer, amount, and date
    const potentialMatches = await this.findPotentialMatches(payment, options);

    // Score each potential match based on multiple criteria
    const scoredMatches = potentialMatches.map(claim => this.scoreClaim(payment, claim));

    // Filter matches by minimum score threshold
    const filteredMatches = scoredMatches.filter(match => match.score >= PaymentMatchingService.MATCH_THRESHOLD);

    // Sort matches by score in descending order
    const sortedMatches = filteredMatches.sort((a, b) => b.score - a.score);

    // Calculate unmatched amount (payment amount minus sum of matched amounts)
    let matchedAmount: Money = 0;
    sortedMatches.forEach(match => {
      matchedAmount += match.amount;
    });
    const unmatchedAmount: Money = payment.paymentAmount - matchedAmount;

    // Return payment, matches, and unmatched amount
    logger.debug(`Found ${sortedMatches.length} potential matches for payment ${paymentId}`);
    return {
      payment,
      matches: sortedMatches.map(match => ({
        claimId: match.claimId,
        score: match.score,
        matchReason: match.matchReason,
        amount: match.amount
      })),
      unmatchedAmount
    };
  }

  /**
   * Applies claim matches to a payment, creating claim payment associations
   * @param paymentId - Payment ID
   * @param matches - Array of claim matches with claimId and amount
   * @param options - Repository options
   * @returns Updated payment with claim payments and status changes
   */
  async applyMatches(
    paymentId: UUID,
    matches: Array<{ claimId: UUID; amount: Money; adjustments?: PaymentAdjustment[] }>,
    options: RepositoryOptions = {}
  ): Promise<{
    payment: PaymentWithRelations;
    claimPayments: ClaimPayment[];
    updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus }>;
  }> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || await db.getTransaction();
    const transactionOptions = { ...options, transaction };

    try {
      // Retrieve payment with relations using paymentRepository
      const payment = await paymentRepository.findByIdWithRelations(paymentId, transactionOptions);

      // If payment not found, throw NotFoundError
      if (!payment) {
        throw new NotFoundError('Payment not found', 'Payment', paymentId);
      }

      // Validate that total match amount doesn't exceed payment amount
      this.validateMatchAmount(payment.paymentAmount, matches);

      const claimPayments: ClaimPayment[] = [];
      const updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus }> = [];

      // Create claim payment associations for each match
      for (const match of matches) {
        const claimPayment = await paymentRepository.addClaimPayment(
          paymentId,
          match.claimId,
          match.amount,
          transactionOptions
        );
        claimPayments.push(claimPayment);

        // Update claim statuses based on payment (PAID or PARTIAL_PAID)
        const { previousStatus, newStatus } = await this.updateClaimStatus(
          match.claimId,
          match.amount,
          payment.paymentAmount,
          transactionOptions
        );
        updatedClaims.push({ claimId: match.claimId, previousStatus, newStatus });
      }

      // Update payment reconciliation status based on matched amount
      const totalAmount = payment.paymentAmount;
      let matchedAmount: Money = 0;
      claimPayments.forEach(claimPayment => {
        matchedAmount += claimPayment.paidAmount;
      });
      const reconciliationStatus = this.calculateReconciliationStatus(totalAmount, matchedAmount);
      await paymentRepository.updateReconciliationStatus(paymentId, reconciliationStatus, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return updated payment, claim payments, and updated claims
      logger.info(`Applied ${matches.length} matches to payment ${paymentId}`);
      return {
        payment,
        claimPayments,
        updatedClaims
      };
    } catch (error) {
      // Rollback transaction and rethrow
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error applying matches to payment ${paymentId}`, { error });
      throw error;
    }
  }

  /**
   * Finds potential claim matches for a payment based on payer, amount, and date
   * @param payment - Payment with relations
   * @param options - Repository options
   * @returns Array of potential claim matches
   */
  async findPotentialMatches(
    payment: PaymentWithRelations,
    options: RepositoryOptions = {}
  ): Promise<ClaimWithRelations[]> {
    // Prepare query parameters for finding claims
    const queryParams: any = {
      pagination: { page: 1, limit: 100 }, // Limit to 100 potential matches
      payerId: payment.payerId, // Set payer ID filter to match payment payer
      claimStatus: [ClaimStatus.SUBMITTED, ClaimStatus.PENDING], // Set status filter to include SUBMITTED and PENDING statuses
      dateRange: { // Set date range filter based on payment date (e.g., 90 days before payment)
        startDate: new Date(payment.paymentDate).toISOString().slice(0, 10),
        endDate: new Date(payment.paymentDate).toISOString().slice(0, 10)
      }
    };

    // Call claimRepository.findWithAdvancedQuery with parameters
    const potentialMatches = await claimRepository.findWithAdvancedQuery(queryParams, options);

    // Return potential claim matches
    logger.debug(`Found ${potentialMatches.total} potential claim matches for payment ${payment.id}`);
    return potentialMatches.data;
  }

  /**
   * Scores a claim as a potential match for a payment based on multiple criteria
   * @param payment - Payment with relations
   * @param claim - Claim with relations
   * @returns Match score, reason, and suggested amount
   */
  scoreClaim(
    payment: PaymentWithRelations,
    claim: ClaimWithRelations
  ): { score: number; matchReason: string; amount: Money, claimId: UUID } {
    let score = 0;
    let matchReason = 'No match';
    let amount: Money = 0;

    // Check for exact amount match (highest score)
    if (payment.paymentAmount === claim.totalAmount) {
      score += 0.9;
      matchReason = 'Exact amount match';
      amount = claim.totalAmount;
    }

    // Check for similar amount (within percentage threshold)
    else if (Math.abs(payment.paymentAmount - claim.totalAmount) / claim.totalAmount <= 0.1) {
      score += 0.7;
      matchReason = 'Similar amount match';
      amount = claim.totalAmount;
    }

    // Determine best match reason based on highest scoring criteria
    // Determine suggested payment amount based on matching criteria

    return { score, matchReason, amount, claimId: claim.id };
  }

  /**
   * Updates a claim's status based on payment amount compared to claim amount
   * @param claimId - Claim ID
   * @param paidAmount - Amount paid
   * @param claimAmount - Total claim amount
   * @param options - Repository options
   * @returns Previous and new claim status
   */
  async updateClaimStatus(
    claimId: UUID,
    paidAmount: Money,
    claimAmount: Money,
    options: RepositoryOptions = {}
  ): Promise<{ previousStatus: ClaimStatus; newStatus: ClaimStatus }> {
    // Retrieve claim using claimRepository
    const claim = await claimRepository.findById(claimId, options);

    // Store previous claim status
    const previousStatus = claim.claimStatus;

    let newStatus: ClaimStatus;
    // Calculate payment ratio (paid amount / claim amount)
    const paymentRatio = paidAmount / claimAmount;

    // If payment ratio >= 0.99, set status to PAID
    if (paymentRatio >= 0.99) {
      newStatus = ClaimStatus.PAID;
    }
    // If payment ratio < 0.99 but > 0, set status to PARTIAL_PAID
    else if (paymentRatio > 0) {
      newStatus = ClaimStatus.PARTIAL_PAID;
    }
    else {
      newStatus = claim.claimStatus;
    }

    // Update claim status using claimRepository
    await claimRepository.updateStatus(claimId, newStatus, null, null, options);

    // Return previous and new status
    logger.debug(`Updated claim ${claimId} status from ${previousStatus} to ${newStatus}`);
    return { previousStatus, newStatus };
  }

  /**
   * Calculates the appropriate reconciliation status based on matched amount
   * @param totalAmount - Total payment amount
   * @param matchedAmount - Amount matched to claims
   * @returns The calculated reconciliation status
   */
  calculateReconciliationStatus(totalAmount: Money, matchedAmount: Money): ReconciliationStatus {
    // Calculate the difference between total and matched amounts
    const difference = totalAmount - matchedAmount;

    // If difference is less than threshold (e.g., 0.01), return RECONCILED
    if (Math.abs(difference) < 0.01) {
      return ReconciliationStatus.RECONCILED;
    }
    // If matched amount is greater than 0, return PARTIALLY_RECONCILED
    else if (matchedAmount > 0) {
      return ReconciliationStatus.PARTIALLY_RECONCILED;
    }
    // Otherwise, return UNRECONCILED
    else {
      return ReconciliationStatus.UNRECONCILED;
    }
  }

  /**
   * Validates that the total match amount doesn't exceed the payment amount
   * @param paymentAmount - Total payment amount
   * @param matches - Array of claim matches with amounts
   * @returns True if valid, throws BusinessError if invalid
   */
  validateMatchAmount(paymentAmount: Money, matches: Array<{ amount: Money }>): boolean {
    // Calculate total match amount by summing all match amounts
    let totalMatchAmount: Money = 0;
    matches.forEach(match => {
      totalMatchAmount += match.amount;
    });

    // Compare total match amount to payment amount
    if (totalMatchAmount > paymentAmount) {
      // If total match amount exceeds payment amount, throw BusinessError
      throw new BusinessError(
        'Total match amount exceeds payment amount',
        { paymentAmount, totalMatchAmount },
        'payment.matchAmountExceedsPayment'
      );
    }

    // Return true if valid
    return true;
  }
  
    /**
   * Finds claims with exact amount matches to the payment
   * @param payment - Payment with relations
   * @param options - Repository options
   * @returns Array of claims with exact amount match
   */
  async getExactAmountMatches(
    payment: PaymentWithRelations,
    options: RepositoryOptions = {}
  ): Promise<ClaimWithRelations[]> {
    // Prepare query parameters for finding claims
    const queryParams: any = {
      pagination: { page: 1, limit: 100 }, // Limit to 100 potential matches
      payerId: payment.payerId, // Set payer ID filter to match payment payer
      claimStatus: [ClaimStatus.SUBMITTED, ClaimStatus.PENDING], // Set status filter to include SUBMITTED and PENDING statuses
      totalAmount: payment.paymentAmount // Set amount filter to exactly match payment amount
    };

    // Call claimRepository.findWithAdvancedQuery with parameters
    const exactMatches = await claimRepository.findWithAdvancedQuery(queryParams, options);

    // Return exact amount matches
    logger.debug(`Found ${exactMatches.total} exact amount matches for payment ${payment.id}`);
    return exactMatches.data;
  }
  
  /**
   * Finds claims that match remittance advice details if available
   * @param payment - Payment with relations
   * @param options - Repository options
   * @returns Array of claims with remittance match and specified amounts
   */
  async getRemittanceMatches(
    payment: PaymentWithRelations,
    options: RepositoryOptions = {}
  ): Promise<Array<{ claim: ClaimWithRelations; amount: Money }>> {
    // Check if payment has remittance information
    if (!payment.remittanceInfo) {
      // If no remittance info, return empty array
      return [];
    }

    // Extract claim identifiers from remittance details (claim numbers, client IDs)
    const claimIdentifiers: string[] = []; // TODO: Implement extraction logic

    // For each identifier, find matching claims
    const matches: Array<{ claim: ClaimWithRelations; amount: Money }> = []; // TODO: Implement matching logic

    // For each match, extract payment amount from remittance detail

    // Return matches with claims and specified amounts
    logger.debug(`Found ${matches.length} remittance matches for payment ${payment.id}`);
    return matches;
  }
}

// Create a singleton instance of the service
const paymentMatchingService = new PaymentMatchingService();

// Export the service instance for use throughout the application
export { PaymentMatchingService, paymentMatchingService };