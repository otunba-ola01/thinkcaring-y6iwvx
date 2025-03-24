import { UUID, Money, ISO8601Date, RepositoryOptions } from '../types/common.types'; // Import common type definitions for IDs, monetary values, and dates
import {
  Payment,
  PaymentWithRelations,
  ReconciliationStatus,
  ReconciliationResult,
  ReconcilePaymentDto,
  ImportRemittanceDto,
  RemittanceProcessingResult,
  AccountsReceivableAging,
  PaymentMetrics
} from '../types/payments.types'; // Import payment-specific type definitions for reconciliation workflow
import { ClaimStatus } from '../types/claims.types'; // Import claim status enum for tracking claim status changes during reconciliation
import { paymentsService } from '../services/payments.service'; // Import payments service for accessing payment data and operations
import { paymentReconciliationService } from '../services/payments/payment-reconciliation.service'; // Import payment reconciliation service for core reconciliation operations
import { paymentMatchingService } from '../services/payments/payment-matching.service'; // Import payment matching service for finding potential claim matches
import { accountsReceivableService } from '../services/payments/accounts-receivable.service'; // Import accounts receivable service for AR management after reconciliation
import { adjustmentTrackingService } from '../services/payments/adjustment-tracking.service'; // Import adjustment tracking service for managing payment adjustments
import { NotFoundError } from '../errors/not-found-error'; // Import error class for when payments are not found
import { BusinessError } from '../errors/business-error'; // Import error class for business rule violations
import { logger } from '../utils/logger'; // Import logger for logging workflow operations

/**
 * Orchestrates the end-to-end process of reconciling payments with claims
 */
export class PaymentReconciliationWorkflow {
  /** @private paymentsService */
  private paymentsService;
  /** @private paymentReconciliationService */
  private paymentReconciliationService;
  /** @private paymentMatchingService */
  private paymentMatchingService;
  /** @private accountsReceivableService */
  private accountsReceivableService;
  /** @private adjustmentTrackingService */
  private adjustmentTrackingService;

  /**
   * Initializes the payment reconciliation workflow with required services
   */
  constructor() {
    this.paymentsService = paymentsService;
    this.paymentReconciliationService = paymentReconciliationService;
    this.paymentMatchingService = paymentMatchingService;
    this.accountsReceivableService = accountsReceivableService;
    this.adjustmentTrackingService = adjustmentTrackingService;
    // Log workflow initialization
    logger.info('PaymentReconciliationWorkflow initialized');
  }

  /**
   * Processes a remittance file and creates payment records
   * @param importData - Data for importing the remittance file
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the remittance processing operation
   */
  async processRemittance(
    importData: ImportRemittanceDto,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<RemittanceProcessingResult> {
    // Log workflow start for remittance processing
    logger.info('Starting remittance processing workflow', {
      payerId: importData.payerId,
      fileType: importData.fileType,
      filename: importData.originalFilename,
      userId
    });

    // Validate import data (payerId, fileContent, fileType)
    if (!importData.payerId || !importData.fileContent || !importData.fileType) {
      throw new BusinessError('Invalid import data: payerId, fileContent, and fileType are required', null, 'remittance.import.invalidData');
    }

    // Delegate to paymentsService.processRemittance to process the remittance file
    const processingResult = await this.paymentsService.processRemittance(importData, userId, options);

    // Log remittance processing results summary
    logger.info('Remittance processing workflow completed', {
      paymentId: processingResult.payment.id,
      remittanceInfoId: processingResult.remittanceInfo.id,
      detailsProcessed: processingResult.detailsProcessed,
      claimsMatched: processingResult.claimsMatched,
      userId
    });

    // Return processing results
    return processingResult;
  }

  /**
   * Reconciles a payment with claims based on provided claim payments and adjustments
   * @param paymentId - Payment ID
   * @param reconcileData - Data for reconciliation including claim payments and adjustments
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the reconciliation process
   */
  async reconcilePayment(
    paymentId: UUID,
    reconcileData: ReconcilePaymentDto,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<ReconciliationResult> {
    // Log workflow start for payment reconciliation
    logger.info('Starting payment reconciliation workflow', {
      paymentId,
      userId
    });

    // Validate payment exists and is in a reconcilable state
    const payment = await this.paymentsService.validatePayment(paymentId, options);

    // Validate reconciliation data (claimPayments array, valid amounts)
    if (!reconcileData || !reconcileData.claimPayments || !Array.isArray(reconcileData.claimPayments)) {
      throw new BusinessError('Invalid reconciliation data: claimPayments array is required', null, 'payment.reconcile.invalidData');
    }

    // Delegate to paymentReconciliationService.reconcilePayment to perform reconciliation
    const reconciliationResult = await this.paymentReconciliationService.reconcilePayment(paymentId, reconcileData, userId, options);

    // Log reconciliation results summary
    logger.info('Payment reconciliation workflow completed', {
      paymentId,
      reconciliationStatus: reconciliationResult.reconciliationStatus,
      matchedAmount: reconciliationResult.matchedAmount,
      unmatchedAmount: reconciliationResult.unmatchedAmount,
      userId
    });

    // Return reconciliation results
    return reconciliationResult;
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
  ): Promise<{ payment: PaymentWithRelations; suggestedMatches: Array<{ claimId: UUID; claimNumber: string; clientName: string; serviceDate: ISO8601Date; amount: Money; matchScore: number; matchReason: string; suggestedAmount: Money }> }> {
    // Log workflow start for getting suggested matches
    logger.info('Starting get suggested matches workflow', {
      paymentId
    });

    // Validate payment exists
    await this.paymentsService.validatePayment(paymentId, options);

    // Delegate to paymentReconciliationService.getSuggestedMatches to find potential matches
    const suggestedMatches = await this.paymentReconciliationService.getSuggestedMatches(paymentId, options);

    // Log suggested matches count and top match scores
    logger.info(`Found ${suggestedMatches.suggestedMatches.length} suggested matches for payment ${paymentId}`, {
      topMatchScore: suggestedMatches.suggestedMatches.length > 0 ? suggestedMatches.suggestedMatches[0].matchScore : null
    });

    // Return payment with suggested matches
    return suggestedMatches;
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
  ): Promise<{ payment: PaymentWithRelations; claimPayments: Array<{ claimPayment: any; claim: any; adjustments: any[] }>; totalAmount: Money; matchedAmount: Money; unmatchedAmount: Money }> {
    // Log workflow start for getting reconciliation details
    logger.info('Starting get reconciliation details workflow', {
      paymentId
    });

    // Validate payment exists
    await this.paymentsService.validatePayment(paymentId, options);

    // Delegate to paymentReconciliationService.getReconciliationDetails to get details
    const reconciliationDetails = await this.paymentReconciliationService.getReconciliationDetails(paymentId, options);

    // Log reconciliation details summary
    logger.info('Retrieved reconciliation details', {
      paymentId,
      matchedAmount: reconciliationDetails.matchedAmount,
      unmatchedAmount: reconciliationDetails.unmatchedAmount,
      claimPaymentsCount: reconciliationDetails.claimPayments.length
    });

    // Return reconciliation details
    return reconciliationDetails;
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
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ success: boolean; payment: PaymentWithRelations; updatedClaims: Array<{ claimId: UUID; previousStatus: ClaimStatus; newStatus: ClaimStatus }> }> {
    // Log workflow start for undoing reconciliation
    logger.info('Starting undo reconciliation workflow', {
      paymentId,
      userId
    });

    // Validate payment exists and has been reconciled
    const payment = await this.paymentsService.validatePayment(paymentId, options);
    if (payment.reconciliationStatus === ReconciliationStatus.UNRECONCILED) {
      throw new BusinessError('Payment is already unreconciled', null, 'payment.undo.alreadyUnreconciled');
    }

    // Delegate to paymentReconciliationService.undoReconciliation to undo reconciliation
    const undoResult = await this.paymentReconciliationService.undoReconciliation(paymentId, userId, options);

    // Log undo operation results summary
    logger.info('Undo reconciliation workflow completed', {
      paymentId,
      success: undoResult.success,
      updatedClaimsCount: undoResult.updatedClaims.length,
      userId
    });

    // Return undo operation results
    return undoResult;
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
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ successful: UUID[]; failed: Array<{ paymentId: UUID; error: string }>; results: ReconciliationResult[] }> {
    // Log workflow start for batch reconciliation
    logger.info('Starting batch reconciliation workflow', {
      batchSize: batchData.length,
      userId
    });

    // Validate batch data structure and content
    if (!batchData || !Array.isArray(batchData)) {
      throw new BusinessError('Invalid batch data: array of payment IDs and reconcile data is required', null, 'payment.batchReconcile.invalidData');
    }

    // Delegate to paymentReconciliationService.batchReconcilePayments to process batch
    const batchResult = await this.paymentReconciliationService.batchReconcilePayments(batchData, userId, options);

    // Log batch reconciliation results summary
    logger.info('Batch reconciliation workflow completed', {
      successfulCount: batchResult.successful.length,
      failedCount: batchResult.failed.length,
      userId
    });

    // Return batch reconciliation results
    return batchResult;
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
    matchThreshold: number,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<ReconciliationResult> {
    // Log workflow start for auto-reconciliation
    logger.info('Starting auto-reconciliation workflow', {
      paymentId,
      matchThreshold,
      userId
    });

    // Validate payment exists and is in a reconcilable state
    const payment = await this.paymentsService.validatePayment(paymentId, options);
    if (payment.reconciliationStatus !== ReconciliationStatus.UNRECONCILED) {
      throw new BusinessError('Payment is not in a reconcilable state', null, 'payment.autoReconcile.invalidState');
    }

    // Validate match threshold is between 0 and 100
    if (matchThreshold < 0 || matchThreshold > 100) {
      throw new BusinessError('Invalid match threshold: must be between 0 and 100', null, 'payment.autoReconcile.invalidThreshold');
    }

    // Delegate to paymentReconciliationService.autoReconcilePayment to perform auto-reconciliation
    const reconciliationResult = await this.paymentReconciliationService.autoReconcilePayment(paymentId, matchThreshold, userId, options);

    // Log auto-reconciliation results summary
    logger.info('Auto-reconciliation workflow completed', {
      paymentId,
      reconciliationStatus: reconciliationResult.reconciliationStatus,
      matchedAmount: reconciliationResult.matchedAmount,
      unmatchedAmount: reconciliationResult.unmatchedAmount,
      userId
    });

    // Return auto-reconciliation results
    return reconciliationResult;
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
    // Log workflow start for getting reconciliation history
    logger.info('Starting get reconciliation history workflow', {
      paymentId
    });

    // Validate payment exists
    await this.paymentsService.validatePayment(paymentId, options);

    // Delegate to paymentReconciliationService.getReconciliationHistory to get history
    const reconciliationHistory = await this.paymentReconciliationService.getReconciliationHistory(paymentId, options);

    // Log history retrieval summary
    logger.info(`Retrieved ${reconciliationHistory.length} reconciliation history records for payment ${paymentId}`);

    // Return reconciliation history
    return reconciliationHistory;
  }

  /**
   * Gets adjustments associated with a payment
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Payment adjustments
   */
  async getAdjustmentsForPayment(
    paymentId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<any>> {
    // Log workflow start for getting payment adjustments
    logger.info('Starting get adjustments for payment workflow', {
      paymentId
    });

    // Validate payment exists
    await this.paymentsService.validatePayment(paymentId, options);

    // Delegate to adjustmentTrackingService.getAdjustmentsForPayment to get adjustments
    const adjustments = await this.adjustmentTrackingService.getAdjustmentsForPayment(paymentId, options);

    // Log adjustments retrieval summary
    logger.info(`Retrieved ${adjustments.length} adjustments for payment ${paymentId}`);

    // Return payment adjustments
    return adjustments;
  }

  /**
   * Analyzes adjustment trends over time and by payer
   * @param filters - Filters for adjustments to analyze
   * @param options - Repository options
   * @returns Adjustment trends
   */
  async getAdjustmentTrends(
    filters: any,
    options: RepositoryOptions = {}
  ): Promise<{ byPeriod: any[]; byPayer: any[] }> {
    // Log workflow start for getting adjustment trends
    logger.info('Starting get adjustment trends workflow', {
      filters
    });

    // Validate filter parameters
    if (!filters) {
      throw new BusinessError('Invalid filters: filters object is required', null, 'adjustment.trends.invalidFilters');
    }

    // Delegate to adjustmentTrackingService.getAdjustmentTrends to get trends
    const adjustmentTrends = await this.adjustmentTrackingService.getAdjustmentTrends(filters, options);

    // Log trends retrieval summary
    logger.info('Retrieved adjustment trends', {
      byPeriodCount: adjustmentTrends.byPeriod.length,
      byPayerCount: adjustmentTrends.byPayer.length
    });

    // Return adjustment trends
    return adjustmentTrends;
  }

  /**
   * Analyzes claim denials based on adjustment codes
   * @param filters - Filters for denials to analyze
   * @param options - Repository options
   * @returns Denial analysis
   */
  async getDenialAnalysis(
    filters: any,
    options: RepositoryOptions = {}
  ): Promise<{ denialRate: number; totalDenied: Money; denialsByReason: any[]; denialsByPayer: any[] }> {
    // Log workflow start for getting denial analysis
    logger.info('Starting get denial analysis workflow', {
      filters
    });

    // Validate filter parameters
    if (!filters) {
      throw new BusinessError('Invalid filters: filters object is required', null, 'denial.analysis.invalidFilters');
    }

    // Delegate to adjustmentTrackingService.getDenialAnalysis to get analysis
    const denialAnalysis = await this.adjustmentTrackingService.getDenialAnalysis(filters, options);

    // Log analysis retrieval summary
    logger.info('Retrieved denial analysis', {
      denialRate: denialAnalysis.denialRate,
      totalDenied: denialAnalysis.totalDenied,
      denialsByReasonCount: denialAnalysis.denialsByReason.length,
      denialsByPayerCount: denialAnalysis.denialsByPayer.length
    });

    // Return denial analysis
    return denialAnalysis;
  }

  /**
   * Generates an accounts receivable aging report
   * @param asOfDate - The date for which to generate the aging report
   * @param payerId - Optional payer ID to filter the report
   * @param programId - Optional program ID to filter the report
   * @param options - Repository options
   * @returns Accounts receivable aging report
   */
  async getAgingReport(
    asOfDate: ISO8601Date | null,
    payerId: UUID | null,
    programId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<AccountsReceivableAging> {
    // Log workflow start for generating aging report
    logger.info('Starting get aging report workflow', {
      asOfDate,
      payerId,
      programId
    });

    // Delegate to accountsReceivableService.getAgingReport to generate report
    const agingReport = await this.accountsReceivableService.getAgingReport(asOfDate, payerId, programId, options);

    // Log report generation summary
    logger.info('Retrieved accounts receivable aging report', {
      asOfDate,
      totalOutstanding: agingReport.totalOutstanding
    });

    // Return aging report
    return agingReport;
  }

  /**
   * Gets a list of outstanding claims that need follow-up
   * @param minAge - Minimum age of the claim in days
   * @param payerId - Optional payer ID to filter the claims
   * @param programId - Optional program ID to filter the claims
   * @param options - Repository options
   * @returns List of outstanding claims
   */
  async getOutstandingClaims(
    minAge: number,
    payerId: UUID | null,
    programId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<Array<any>> {
    // Log workflow start for getting outstanding claims
    logger.info('Starting get outstanding claims workflow', {
      minAge,
      payerId,
      programId
    });

    // Validate minAge is a positive number
    if (minAge <= 0) {
      throw new BusinessError('Invalid minAge: must be a positive number', null, 'claims.outstanding.invalidMinAge');
    }

    // Delegate to accountsReceivableService.getOutstandingClaims to get claims
    const outstandingClaims = await this.accountsReceivableService.getOutstandingClaims(minAge, payerId, programId, options);

    // Log outstanding claims retrieval summary
    logger.info(`Retrieved ${outstandingClaims.length} outstanding claims`, {
      minAge,
      payerId,
      programId
    });

    // Return outstanding claims
    return outstandingClaims;
  }

  /**
   * Gets a list of unreconciled payments that need attention
   * @param minAge - Minimum age of the payment in days
   * @param payerId - Optional payer ID to filter the payments
   * @param options - Repository options
   * @returns List of unreconciled payments
   */
  async getUnreconciledPayments(
    minAge: number,
    payerId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<Array<any>> {
    // Log workflow start for getting unreconciled payments
    logger.info('Starting get unreconciled payments workflow', {
      minAge,
      payerId
    });

    // Validate minAge is a positive number
    if (minAge <= 0) {
      throw new BusinessError('Invalid minAge: must be a positive number', null, 'payments.unreconciled.invalidMinAge');
    }

    // Delegate to accountsReceivableService.getUnreconciledPayments to get payments
    const unreconciledPayments = await this.accountsReceivableService.getUnreconciledPayments(minAge, payerId, options);

    // Log unreconciled payments retrieval summary
    logger.info(`Retrieved ${unreconciledPayments.length} unreconciled payments`, {
      minAge,
      payerId
    });

    // Return unreconciled payments
    return unreconciledPayments;
  }

  /**
   * Generates a prioritized list of claims for collection follow-up
   * @param options - Repository options
   * @returns Prioritized collection work list
   */
  async generateCollectionWorkList(
    options: RepositoryOptions = {}
  ): Promise<Array<any>> {
    // Log workflow start for generating collection work list
    logger.info('Starting generate collection work list workflow');

    // Delegate to accountsReceivableService.generateCollectionWorkList to generate list
    const collectionWorkList = await this.accountsReceivableService.generateCollectionWorkList(options);

    // Log work list generation summary
    logger.info(`Generated collection work list with ${collectionWorkList.length} items`);

    // Return collection work list
    return collectionWorkList;
  }

  /**
   * Gets payment metrics for dashboards and reporting
   * @param filters - Filters for metrics
   * @param options - Repository options
   * @returns Payment metrics
   */
  async getPaymentMetrics(
    filters: any,
    options: RepositoryOptions = {}
  ): Promise<PaymentMetrics> {
    // Log workflow start for getting payment metrics
    logger.info('Starting get payment metrics workflow', {
      filters
    });

    // Validate filter parameters
    if (!filters) {
      throw new BusinessError('Invalid filters: filters object is required', null, 'payment.metrics.invalidFilters');
    }

    // Delegate to paymentsService.getPaymentMetrics to get metrics
    const paymentMetrics = await this.paymentsService.getPaymentMetrics(filters, options);

    // Log metrics retrieval summary
    logger.info('Retrieved payment metrics', {
      totalPayments: paymentMetrics.totalPayments,
      totalAmount: paymentMetrics.totalAmount
    });

    // Return payment metrics
    return paymentMetrics;
  }

  /**
   * Validates that a payment exists and is in a valid state for operations
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns The validated payment with relations
   */
  async validatePayment(paymentId: UUID, options: RepositoryOptions = {}): Promise<PaymentWithRelations> {
    // Retrieve payment with relations using paymentsService.getPaymentWithRelations
    const payment = await this.paymentsService.getPaymentWithRelations(paymentId, options);

    // If payment not found, throw NotFoundError
    if (!payment) {
      throw new NotFoundError('Payment not found', 'Payment', paymentId);
    }

    // Validate payment is active
    if (payment.status !== 'active') {
      throw new BusinessError('Payment is not active', null, 'payment.inactive');
    }

    // Return the payment with relations
    return payment;
  }
}

// Create a singleton instance of the PaymentReconciliationWorkflow
const paymentReconciliationWorkflow = new PaymentReconciliationWorkflow();

// Export the payment reconciliation workflow class for use throughout the application
export { PaymentReconciliationWorkflow, paymentReconciliationWorkflow };