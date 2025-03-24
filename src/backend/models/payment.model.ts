# src/backend/models/payment.model.ts
import {
  Payment, PaymentWithRelations, PaymentSummary, ReconciliationStatus, PaymentMethod, ClaimPayment, PaymentAdjustment, RemittanceInfo
} from '../types/payments.types';
import {
  UUID, ISO8601Date, Money, StatusType, Timestamp
} from '../types/common.types';
import { PayerSummary } from '../types/claims.types';
import { ClaimSummary, ClaimStatus } from '../types/claims.types';
import { paymentRepository } from '../database/repositories/payment.repository';
import { claimRepository } from '../database/repositories/claim.repository';
import { formatCurrency, formatDate } from '../utils/formatter';

/**
 * Model class representing a payment in the system with methods for payment operations
 */
class PaymentModel {
  public id: UUID;
  public payerId: UUID;
  public payer: PayerSummary | null;
  public paymentDate: ISO8601Date;
  public paymentAmount: Money;
  public paymentMethod: PaymentMethod;
  public referenceNumber: string | null;
  public checkNumber: string | null;
  public remittanceId: string | null;
  public reconciliationStatus: ReconciliationStatus;
  public claimPayments: ClaimPayment[] | null;
  public remittanceInfo: RemittanceInfo | null;
  public notes: string | null;
  public status: StatusType;
  public createdAt: Timestamp;
  public updatedAt: Timestamp;
  public createdBy: UUID | null;
  public updatedBy: UUID | null;

  /**
   * Creates a new PaymentModel instance
   * @param paymentData Payment data
   */
  constructor(paymentData: Payment | PaymentWithRelations) {
    // Initialize all properties from paymentData
    this.id = paymentData.id;
    this.payerId = paymentData.payerId;
    this.payer = (paymentData as PaymentWithRelations).payer || null;
    this.paymentDate = paymentData.paymentDate;
    this.paymentAmount = paymentData.paymentAmount;
    this.paymentMethod = paymentData.paymentMethod;
    this.referenceNumber = paymentData.referenceNumber || null;
    this.checkNumber = paymentData.checkNumber || null;
    this.remittanceId = paymentData.remittanceId || null;
    this.reconciliationStatus = paymentData.reconciliationStatus;
    this.claimPayments = (paymentData as PaymentWithRelations).claimPayments || null;
    this.remittanceInfo = (paymentData as PaymentWithRelations).remittanceInfo || null;
    this.notes = paymentData.notes || null;
    this.status = paymentData.status;
    this.createdAt = paymentData.createdAt;
    this.updatedAt = paymentData.updatedAt;
    this.createdBy = paymentData.createdBy || null;
    this.updatedBy = paymentData.updatedBy || null;

    // Set default values for optional properties
    this.reconciliationStatus = paymentData.reconciliationStatus || ReconciliationStatus.UNRECONCILED;
  }

  /**
   * Checks if the payment is fully reconciled
   * @returns True if the payment is fully reconciled
   */
  isReconciled(): boolean {
    // Compare reconciliation status with ReconciliationStatus.RECONCILED
    // Return the comparison result
    return this.reconciliationStatus === ReconciliationStatus.RECONCILED;
  }

  /**
   * Checks if the payment is partially reconciled
   * @returns True if the payment is partially reconciled
   */
  isPartiallyReconciled(): boolean {
    // Compare reconciliation status with ReconciliationStatus.PARTIALLY_RECONCILED
    // Return the comparison result
    return this.reconciliationStatus === ReconciliationStatus.PARTIALLY_RECONCILED;
  }

  /**
   * Checks if the payment is unreconciled
   * @returns True if the payment is unreconciled
   */
  isUnreconciled(): boolean {
    // Compare reconciliation status with ReconciliationStatus.UNRECONCILED
    // Return the comparison result
    return this.reconciliationStatus === ReconciliationStatus.UNRECONCILED;
  }

  /**
   * Checks if the payment has reconciliation exceptions
   * @returns True if the payment has reconciliation exceptions
   */
  hasException(): boolean {
    // Compare reconciliation status with ReconciliationStatus.EXCEPTION
    // Return the comparison result
    return this.reconciliationStatus === ReconciliationStatus.EXCEPTION;
  }

  /**
   * Calculates the age of the payment in days
   * @returns The age of the payment in days
   */
  getPaymentAge(): number {
    // Get current date
    const now = new Date();

    // Calculate difference between current date and payment date in days
    const paymentDate = new Date(this.paymentDate);
    const diffInMs = now.getTime() - paymentDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Return the calculated difference
    return diffInDays;
  }

  /**
   * Gets the payment date as a formatted string
   * @returns Formatted payment date (e.g., 'Jan 1, 2023')
   */
  getFormattedPaymentDate(): string {
    // Format paymentDate using date formatter
    // Return the formatted date string
    return formatDate(this.paymentDate) || '';
  }

  /**
   * Gets the payment amount as a formatted currency string
   * @returns Formatted payment amount (e.g., '$1,234.56')
   */
  getFormattedAmount(): string {
    // Format paymentAmount using currency formatter
    // Return the formatted amount string
    return formatCurrency(this.paymentAmount) || '';
  }

  /**
   * Gets a human-readable text for the reconciliation status
   * @returns Human-readable status text
   */
  getReconciliationStatusText(): string {
    // Map reconciliationStatus to appropriate text string
    let statusText: string;
    switch (this.reconciliationStatus) {
      case ReconciliationStatus.UNRECONCILED:
        statusText = 'Unreconciled';
        break;
      case ReconciliationStatus.PARTIALLY_RECONCILED:
        statusText = 'Partially Reconciled';
        break;
      case ReconciliationStatus.RECONCILED:
        statusText = 'Reconciled';
        break;
      case ReconciliationStatus.EXCEPTION:
        statusText = 'Exception';
        break;
      default:
        statusText = 'Unknown';
    }

    // Return the status text
    return statusText;
  }

  /**
   * Gets a human-readable text for the payment method
   * @returns Human-readable payment method text
   */
  getPaymentMethodText(): string {
    // Map paymentMethod to appropriate text string
    let methodText: string;
    switch (this.paymentMethod) {
      case PaymentMethod.EFT:
        methodText = 'EFT';
        break;
      case PaymentMethod.CHECK:
        methodText = 'Check';
        break;
      case PaymentMethod.CREDIT_CARD:
        methodText = 'Credit Card';
        break;
      case PaymentMethod.CASH:
        methodText = 'Cash';
        break;
      case PaymentMethod.OTHER:
        methodText = 'Other';
        break;
      default:
        methodText = 'Unknown';
    }

    // Return the payment method text
    return methodText;
  }

  /**
   * Gets the claim payments associated with this payment
   * @returns Array of claim payment associations
   */
  async getClaimPayments(): Promise<ClaimPayment[]> {
    // If claimPayments is already loaded, return it
    if (this.claimPayments) {
      return this.claimPayments;
    }

    // Otherwise, call paymentRepository.getClaimPayments with payment ID
    const claimPayments = await paymentRepository.getClaimPayments(this.id);

    // Store the result in claimPayments property
    this.claimPayments = claimPayments;

    // Return the claim payments
    return claimPayments;
  }

  /**
   * Gets the remittance information associated with this payment
   * @returns Remittance information if available
   */
  async getRemittanceInfo(): Promise<RemittanceInfo | null> {
    // If remittanceInfo is already loaded, return it
    if (this.remittanceInfo) {
      return this.remittanceInfo;
    }

    // Otherwise, call paymentRepository.getRemittanceInfo with payment ID
    const remittanceInfo = await paymentRepository.getRemittanceInfo(this.id);

    // Store the result in remittanceInfo property
    this.remittanceInfo = remittanceInfo;

    // Return the remittance information
    return remittanceInfo;
  }

  /**
   * Updates the reconciliation status of the payment
   * @param newStatus New reconciliation status
   * @param userId User ID
   * @returns True if the status was updated successfully
   */
  async updateReconciliationStatus(newStatus: ReconciliationStatus, userId: UUID | null): Promise<boolean> {
    // Call paymentRepository.updateReconciliationStatus with payment ID, new status
    const success = await paymentRepository.updateReconciliationStatus(this.id, newStatus, { updatedBy: userId });

    // If update successful, update local reconciliationStatus property
    if (success) {
      this.reconciliationStatus = newStatus;
    }

    // Return the result of the update operation
    return success;
  }

  /**
   * Reconciles the payment with claims
   * @param claimPayments Claim payments
   * @param userId User ID
   * @returns Reconciliation result with updated claims
   */
  async reconcile(claimPayments: Array<{ claimId: UUID, amount: Money, adjustments?: PaymentAdjustment[] }>, userId: UUID | null): Promise<{ success: boolean; updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus; }>; }> {
    // Calculate total amount being reconciled from claim payments
    const totalReconciledAmount = claimPayments.reduce((sum, claimPayment) => sum + claimPayment.amount, 0);

    // Determine appropriate reconciliation status based on total vs payment amount
    const newStatus = this.calculateReconciliationStatus(totalReconciledAmount);

    // Update payment reconciliation status
    const success = await this.updateReconciliationStatus(newStatus, userId);

    if (!success) {
      return { success: false, updatedClaims: [] };
    }

    // Track claims that had status changes
    const updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus; }> = [];

    // For each claim payment, update the associated claim status to PAID if appropriate
    for (const claimPayment of claimPayments) {
      // Get the claim
      const claim = await claimRepository.findById(claimPayment.claimId);

      if (!claim) {
        continue;
      }

      // If claim is not already paid, update the status to PAID
      if (claim.claimStatus !== ClaimStatus.PAID) {
        const previousStatus = claim.claimStatus;
        await claimRepository.updateStatus(claimPayment.claimId, ClaimStatus.PAID, 'Payment received', userId);
        updatedClaims.push({ claimId: claimPayment.claimId, previousStatus: previousStatus, newStatus: ClaimStatus.PAID });
      }
    }

    // Return success status and list of updated claims
    return { success: true, updatedClaims };
  }

  /**
   * Calculates the appropriate reconciliation status based on matched amount
   * @param matchedAmount Matched amount
   * @returns The calculated reconciliation status
   */
  calculateReconciliationStatus(matchedAmount: Money): ReconciliationStatus {
    // If matchedAmount equals paymentAmount, return RECONCILED
    if (matchedAmount === this.paymentAmount) {
      return ReconciliationStatus.RECONCILED;
    }

    // If matchedAmount is greater than 0 but less than paymentAmount, return PARTIALLY_RECONCILED
    if (matchedAmount > 0 && matchedAmount < this.paymentAmount) {
      return ReconciliationStatus.PARTIALLY_RECONCILED;
    }

    // If matchedAmount is 0, return UNRECONCILED
    if (matchedAmount === 0) {
      return ReconciliationStatus.UNRECONCILED;
    }

    // If matchedAmount is greater than paymentAmount, return EXCEPTION
    return ReconciliationStatus.EXCEPTION;
  }

  /**
   * Gets a summary of the reconciliation status
   * @returns Reconciliation summary
   */
  async getReconciliationSummary(): Promise<{ totalAmount: Money; matchedAmount: Money; unmatchedAmount: Money; claimCount: number; }> {
    // Get claim payments using getClaimPayments()
    const claimPayments = await this.getClaimPayments();

    // Calculate total matched amount from claim payments
    let matchedAmount = 0;
    if (claimPayments) {
      matchedAmount = claimPayments.reduce((sum, claimPayment) => sum + claimPayment.paidAmount, 0);
    }

    // Calculate unmatched amount (payment amount - matched amount)
    const unmatchedAmount = this.paymentAmount - matchedAmount;

    // Count number of associated claims
    const claimCount = claimPayments ? claimPayments.length : 0;

    // Return summary object with calculated values
    return {
      totalAmount: this.paymentAmount,
      matchedAmount,
      unmatchedAmount,
      claimCount
    };
  }

  /**
   * Converts the payment model to a payment summary object
   * @returns Payment summary object with essential information
   */
  toSummary(): PaymentSummary {
    // Create a PaymentSummary object with necessary payment properties
    const summary: PaymentSummary = {
      id: this.id,
      payerId: this.payerId,
      payerName: this.payer ? this.payer.name : 'Unknown Payer',
      paymentDate: this.paymentDate,
      paymentAmount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber,
      reconciliationStatus: this.reconciliationStatus,
      claimCount: 0 // Default value, will be updated below
    };

    // Calculate claim count if claim payments are available
    if (this.claimPayments) {
      summary.claimCount = this.claimPayments.length;
    }

    // Return the PaymentSummary object
    return summary;
  }

  /**
   * Finds a payment by ID and returns a PaymentModel instance
   * @param id Payment ID
   * @returns PaymentModel instance if found, null otherwise
   */
  static async findById(id: UUID): Promise<PaymentModel | null> {
    // Call paymentRepository.findByIdWithRelations with the provided ID
    const payment = await paymentRepository.findByIdWithRelations(id);

    // If payment is found, create and return a new PaymentModel instance
    if (payment) {
      return new PaymentModel(payment);
    }

    // If payment is not found, return null
    return null;
  }

  /**
   * Finds a payment by reference number and returns a PaymentModel instance
   * @param referenceNumber Reference number
   * @returns PaymentModel instance if found, null otherwise
   */
  static async findByReferenceNumber(referenceNumber: string): Promise<PaymentModel | null> {
    // Call paymentRepository.findByReferenceNumber with the provided reference number
    const payment = await paymentRepository.findByReferenceNumber(referenceNumber);

    // If payment is found, create and return a new PaymentModel instance
    if (payment) {
      return new PaymentModel(payment);
    }

    // If payment is not found, return null
    return null;
  }
}

// Export the PaymentModel class
export { PaymentModel };