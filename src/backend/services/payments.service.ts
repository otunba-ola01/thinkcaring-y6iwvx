import { UUID, Money, ISO8601Date, RepositoryOptions } from '../types/common.types'; // Import common type definitions used in payment operations
import {
  Payment,
  PaymentWithRelations,
  PaymentQueryParams,
  CreatePaymentDto,
  UpdatePaymentDto,
  ReconcilePaymentDto,
  ImportRemittanceDto,
  RemittanceProcessingResult,
  ReconciliationResult,
  AccountsReceivableAging,
  PaymentMetrics
} from '../types/payments.types'; // Import payment-specific type definitions
import { paymentRepository } from '../database/repositories/payment.repository'; // Access payment data in the database
import { remittanceProcessingService } from './payments/remittance-processing.service'; // Process remittance files and create payment records
import { paymentMatchingService } from './payments/payment-matching.service'; // Match payments to claims and apply matches
import { paymentReconciliationService } from './payments/payment-reconciliation.service'; // Reconcile payments with claims and manage the reconciliation process
import { adjustmentTrackingService } from './payments/adjustment-tracking.service'; // Track and analyze payment adjustments and denials
import { accountsReceivableService } from './payments/accounts-receivable.service'; // Manage accounts receivable and generate aging reports
import { db } from '../database/connection'; // Database transaction management
import { NotFoundError } from '../errors/not-found-error'; // Error handling for payment not found scenarios
import { ValidationError } from '../errors/validation-error'; // Error handling for validation failures
import { logger } from '../utils/logger'; // Logging for payment operations

/**
 * Service for managing payments, including creation, retrieval, processing, and reconciliation
 */
export class PaymentsService {
  /**
   * Creates a new payments service instance
   */
  constructor() {
    // Initialize service
    // Log service initialization
    logger.info('PaymentsService initialized');
  }

  /**
   * Retrieves a payment by its ID
   * @param id - Payment ID
   * @param options - Repository options
   * @returns The payment if found
   */
  async getPaymentById(id: UUID, options: RepositoryOptions = {}): Promise<Payment> {
    // Call paymentRepository.findById to retrieve the payment
    const payment = await paymentRepository.findById(id, options);

    // If payment not found, throw NotFoundError
    if (!payment) {
      throw new NotFoundError('Payment not found', 'Payment', id);
    }

    // Return the payment
    logger.debug(`Retrieved payment with ID: ${id}`);
    return payment;
  }

  /**
   * Retrieves a payment with all related entities (payer, claim payments, remittance info)
   * @param id - Payment ID
   * @param options - Repository options
   * @returns The payment with relations if found
   */
  async getPaymentWithRelations(id: UUID, options: RepositoryOptions = {}): Promise<PaymentWithRelations> {
    // Call paymentRepository.findByIdWithRelations to retrieve the payment with relations
    const payment = await paymentRepository.findByIdWithRelations(id, options);

    // If payment not found, throw NotFoundError
    if (!payment) {
      throw new NotFoundError('Payment with relations not found', 'Payment', id);
    }

    // Return the payment with relations
    logger.debug(`Retrieved payment with relations with ID: ${id}`);
    return payment;
  }

  /**
   * Retrieves a paginated list of payments based on query parameters
   * @param queryParams - Query parameters for filtering, sorting, and pagination
   * @param options - Repository options
   * @returns Paginated payments with relations
   */
  async getPayments(queryParams: PaymentQueryParams, options: RepositoryOptions = {}): Promise<{ payments: PaymentWithRelations[]; total: number; page: number; limit: number; totalPages: number }> {
    // Call paymentRepository.findAllWithRelations with query parameters
    const paginatedResult = await paymentRepository.findAllWithRelations(queryParams, options);

    // Return the paginated result with payments, total count, page, limit, and total pages
    logger.debug(`Retrieved ${paginatedResult.data.length} payments with query parameters`, { queryParams });
    return {
      payments: paginatedResult.data,
      total: paginatedResult.total,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      totalPages: paginatedResult.totalPages
    };
  }

  /**
   * Creates a new payment record
   * @param paymentData - Payment data
   * @param userId - User ID
   * @param options - Repository options
   * @returns The created payment
   */
  async createPayment(paymentData: CreatePaymentDto, userId: UUID | null, options: RepositoryOptions = {}): Promise<Payment> {
    // Validate payment data (payerId, paymentDate, paymentAmount, paymentMethod)
    this.validatePaymentData(paymentData);

    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, createdBy: userId };

    try {
      // Set initial reconciliation status to UNRECONCILED
      const initialPaymentData = {
        ...paymentData,
        reconciliationStatus: ReconciliationStatus.UNRECONCILED
      };

      // Call paymentRepository.create to create the payment
      const payment = await paymentRepository.create(initialPaymentData, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return the created payment
      logger.info(`Created new payment with ID: ${payment.id}`, { paymentData, userId });
      return payment;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error('Error creating payment', { paymentData, userId, error });
      throw error;
    }
  }

  /**
   * Updates an existing payment record
   * @param id - Payment ID
   * @param paymentData - Payment data
   * @param userId - User ID
   * @param options - Repository options
   * @returns The updated payment
   */
  async updatePayment(id: UUID, paymentData: UpdatePaymentDto, userId: UUID | null, options: RepositoryOptions = {}): Promise<Payment> {
    // Validate payment data
    this.validatePaymentData(paymentData);

    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Check if payment exists using paymentRepository.findById
      const existingPayment = await paymentRepository.findById(id, transactionOptions);
      if (!existingPayment) {
        throw new NotFoundError('Payment not found', 'Payment', id);
      }

      // Call paymentRepository.update to update the payment
      const updatedPayment = await paymentRepository.update(id, paymentData, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return the updated payment
      logger.info(`Updated payment with ID: ${id}`, { paymentData, userId });
      return updatedPayment;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error updating payment with ID: ${id}`, { paymentData, userId, error });
      throw error;
    }
  }

  /**
   * Deletes a payment record (soft delete)
   * @param id - Payment ID
   * @param userId - User ID
   * @param options - Repository options
   * @returns True if the payment was deleted successfully
   */
  async deletePayment(id: UUID, userId: UUID | null, options: RepositoryOptions = {}): Promise<boolean> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Check if payment exists using paymentRepository.findById
      const existingPayment = await paymentRepository.findById(id, transactionOptions);
      if (!existingPayment) {
        throw new NotFoundError('Payment not found', 'Payment', id);
      }

      // Call paymentRepository.delete to soft delete the payment
      const deleted = await paymentRepository.delete(id, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return true if deletion was successful
      logger.info(`Deleted payment with ID: ${id}`, { userId });
      return deleted;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error deleting payment with ID: ${id}`, { userId, error });
      throw error;
    }
  }

  /**
   * Processes a remittance file and creates payment records
   * @param importData - Data for importing the remittance file
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the remittance processing operation
   */
  async processRemittance(importData: ImportRemittanceDto, userId: UUID | null, options: RepositoryOptions = {}): Promise<RemittanceProcessingResult> {
    // Validate import data
    if (!importData) {
      throw new ValidationError('Import data is required');
    }

    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, createdBy: userId };

    try {
      // Call remittanceProcessingService.processRemittanceFile to process the remittance file
      const processingResult = await remittanceProcessingService.processRemittanceFile(importData, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return the processing results
      logger.info(`Processed remittance file: ${importData.originalFilename}`, { userId });
      return processingResult;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error processing remittance file: ${importData.originalFilename}`, { userId, error });
      throw error;
    }
  }

  /**
   * Gets suggested claim matches for a payment
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Payment with suggested claim matches
   */
  async getSuggestedMatches(paymentId: UUID, options: RepositoryOptions = {}): Promise<{ payment: PaymentWithRelations; suggestedMatches: Array<{ claimId: UUID; claimNumber: string; clientName: string; serviceDate: ISO8601Date; amount: Money; matchScore: number; matchReason: string; suggestedAmount: Money }> }> {
    // Call paymentReconciliationService.getSuggestedMatches to get suggested matches
    const suggestedMatches = await paymentReconciliationService.getSuggestedMatches(paymentId, options);

    // Return the payment with suggested matches
    logger.debug(`Retrieved suggested matches for payment with ID: ${paymentId}`);
    return suggestedMatches;
  }

  /**
   * Reconciles a payment with claims
   * @param paymentId - Payment ID
   * @param reconcileData - Data for reconciliation
   * @param userId - User ID
   * @param options - Repository options
   * @returns Results of the reconciliation process
   */
  async reconcilePayment(paymentId: UUID, reconcileData: ReconcilePaymentDto, userId: UUID | null, options: RepositoryOptions = {}): Promise<ReconciliationResult> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Call paymentReconciliationService.reconcilePayment to reconcile the payment
      const reconciliationResult = await paymentReconciliationService.reconcilePayment(paymentId, reconcileData, userId, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return the reconciliation results
      logger.info(`Reconciled payment with ID: ${paymentId}`, { reconcileData, userId });
      return reconciliationResult;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error reconciling payment with ID: ${paymentId}`, { reconcileData, userId, error });
      throw error;
    }
  }

  /**
   * Gets detailed reconciliation information for a payment
   * @param paymentId - Payment ID
   * @param options - Repository options
   * @returns Detailed reconciliation information
   */
  async getReconciliationDetails(paymentId: UUID, options: RepositoryOptions = {}): Promise<{ payment: PaymentWithRelations; claimPayments: Array<{ claimPayment: any; claim: any; adjustments: any[] }>; totalAmount: Money; matchedAmount: Money; unmatchedAmount: Money }> {
    // Call paymentReconciliationService.getReconciliationDetails to get reconciliation details
    const reconciliationDetails = await paymentReconciliationService.getReconciliationDetails(paymentId, options);

    // Return the reconciliation details
    logger.debug(`Retrieved reconciliation details for payment with ID: ${paymentId}`);
    return reconciliationDetails;
  }

  /**
   * Undoes a previous reconciliation
   * @param paymentId - Payment ID
   * @param userId - User ID
   * @param options - Repository options
   * @returns Result of the undo operation
   */
  async undoReconciliation(paymentId: UUID, userId: UUID | null, options: RepositoryOptions = {}): Promise<{ success: boolean; payment: PaymentWithRelations; updatedClaims: any[] }> {
    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction, updatedBy: userId };

    try {
      // Call paymentReconciliationService.undoReconciliation to undo the reconciliation
      const undoResult = await paymentReconciliationService.undoReconciliation(paymentId, userId, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return the undo results
      logger.info(`Undid reconciliation for payment with ID: ${paymentId}`, { userId });
      return undoResult;
    } catch (error) {
      // Handle errors by rolling back transaction and rethrowing
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error(`Error undoing reconciliation for payment with ID: ${paymentId}`, { userId, error });
      throw error;
    }
  }

  /**
   * Generates an accounts receivable aging report
   * @param asOfDate - The date for which to generate the aging report
   * @param payerId - Optional payer ID to filter the report
   * @param programId - Optional program ID to filter the report
   * @param options - Repository options
   * @returns Accounts receivable aging report
   */
  async getAgingReport(asOfDate: ISO8601Date | null, payerId: UUID | null, programId: UUID | null, options: RepositoryOptions = {}): Promise<AccountsReceivableAging> {
    // Call accountsReceivableService.getAgingReport to generate the aging report
    const agingReport = await accountsReceivableService.getAgingReport(asOfDate, payerId, programId, options);

    // Return the aging report
    logger.debug('Retrieved accounts receivable aging report', { asOfDate, payerId, programId });
    return agingReport;
  }

  /**
   * Gets payment metrics for dashboards and reporting
   * @param filters - Filters for metrics
   * @param options - Repository options
   * @returns Payment metrics
   */
  async getPaymentMetrics(filters: any, options: RepositoryOptions = {}): Promise<PaymentMetrics> {
    // Extract filter parameters (dateRange, payerId, programId)
    const { dateRange, payerId, programId } = filters;

    // Prepare query conditions based on filters
    const conditions: any = {};
    if (dateRange) {
      conditions.paymentDate = { between: [dateRange.startDate, dateRange.endDate] };
    }
    if (payerId) {
      conditions.payerId = payerId;
    }
    if (programId) {
      // TODO: Add programId filter to payment metrics query
    }

    // Call paymentRepository.getPaymentMetrics to get basic metrics
    const basicMetrics = await paymentRepository.getPaymentMetrics(conditions, options);

    // Enhance metrics with additional calculations and breakdowns
    const paymentMetrics: PaymentMetrics = {
      totalPayments: basicMetrics.totalPayments,
      totalAmount: basicMetrics.totalAmount,
      reconciliationBreakdown: basicMetrics.statusBreakdown,
      paymentMethodBreakdown: [], // TODO: Implement payment method breakdown
      paymentsByPayer: [], // TODO: Implement payments by payer
      paymentTrend: [], // TODO: Implement payment trend
      averagePaymentAmount: 0 // TODO: Implement average payment amount
    };

    // Return the comprehensive payment metrics
    logger.debug('Retrieved payment metrics', { filters, paymentMetrics });
    return paymentMetrics;
  }

  /**
   * Validates payment data before creation or update
   * @param paymentData - Payment data
   */
  validatePaymentData(paymentData: CreatePaymentDto | UpdatePaymentDto): void {
    // Check if payerId is provided and valid
    if (!paymentData.payerId) {
      throw new ValidationError('Payer ID is required');
    }

    // Check if paymentDate is provided and valid
    if (!paymentData.paymentDate) {
      throw new ValidationError('Payment date is required');
    }

    // Check if paymentAmount is provided and valid (greater than 0)
    if (!paymentData.paymentAmount || paymentData.paymentAmount <= 0) {
      throw new ValidationError('Payment amount is required and must be greater than 0');
    }

    // Check if paymentMethod is provided and valid
    if (!paymentData.paymentMethod) {
      throw new ValidationError('Payment method is required');
    }
  }
}

// Create a singleton instance of the PaymentsService
const paymentsService = new PaymentsService();

// Export the service instance for use throughout the application
export { PaymentsService, paymentsService };