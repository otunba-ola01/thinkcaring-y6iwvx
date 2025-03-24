# src/backend/controllers/payments.controller.ts
```typescript
import { Response } from 'express'; // v4.18+
import { Request, RequestWithParams, RequestWithQuery, RequestWithBody, RequestWithParamsAndBody, IdParam } from '../types/request.types'; // Import request type definitions for type-safe request handling
import { SuccessResponse, PaginatedResponse, ValidationFailureResponse, BulkOperationSuccessResponse } from '../types/response.types'; // Import response helper functions for standardized API responses
import { UUID } from '../types/common.types'; // Import UUID type for ID parameters
import { PaymentQueryParams, CreatePaymentDto, UpdatePaymentDto, ReconcilePaymentDto, ImportRemittanceDto } from '../types/payments.types'; // Import payment-specific type definitions
import { paymentsService } from '../services/payments.service'; // Import payments service for handling business logic
import { logger } from '../utils/logger'; // Import logger for logging controller operations

/**
 * Controller responsible for handling HTTP requests related to payment processing in the HCBS Revenue Management System. 
 * This controller implements RESTful endpoints for creating, retrieving, updating, processing remittances, 
 * reconciling payments, and generating accounts receivable reports.
 */
export default {
  /**
   * Retrieves a payment by its ID
   * @async
   * @method getPayment
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with payment data
   */
  getPayment: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;

    // 2. Log payment retrieval request
    logger.debug(`Attempting to retrieve payment with ID: ${id}`, { requestId: req.requestId });

    try {
      // 3. Call paymentsService.getPaymentWithRelations to retrieve payment data with related entities
      const payment = await paymentsService.getPaymentWithRelations(id);

      // 4. Return success response with payment data
      res.status(200).json(SuccessResponse(payment, `Payment retrieved successfully with ID: ${id}`));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error(`Error retrieving payment with ID: ${id}`, { error, requestId: req.requestId });
      // Check if the error is a NotFoundError
      if (error.name === 'NotFoundError') {
        res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve payment',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  /**
   * Retrieves all payments with optional filtering and pagination
   * @async
   * @method getAllPayments
   * @param {RequestWithQuery<PaymentQueryParams>} req - Express request object with query parameters for filtering and pagination
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with paginated payments data
   */
  getAllPayments: async (req: RequestWithQuery<PaymentQueryParams>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering and pagination
    const queryParams = req.query;

    // 2. Log payments retrieval request
    logger.debug('Attempting to retrieve all payments', { queryParams, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getPayments to retrieve payments data
      const { payments, total, page, limit, totalPages } = await paymentsService.getPayments(queryParams);

      // 4. Return paginated response with payments data
      res.status(200).json(PaginatedResponse(payments, { page, limit, totalItems: total, totalPages }, 'Payments retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error retrieving all payments', { error, queryParams, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Creates a new payment record
   * @async
   * @method createPayment
   * @param {RequestWithBody<CreatePaymentDto>} req - Express request object with payment data in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with created payment data
   */
  createPayment: async (req: RequestWithBody<CreatePaymentDto>, res: Response): Promise<void> => {
    // 1. Extract payment data from request body
    const paymentData = req.body;
    // 2. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 3. Log payment creation request
    logger.info('Attempting to create new payment', { paymentData, userId, requestId: req.requestId });

    try {
      // 4. Call paymentsService.createPayment to create new payment
      const payment = await paymentsService.createPayment(paymentData, userId);

      // 5. Return success response with created payment data
      res.status(201).json(SuccessResponse(payment, 'Payment created successfully'));
    } catch (error) {
      // 6. Handle errors and return appropriate error response
      logger.error('Error creating payment', { error, paymentData, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Updates an existing payment record
   * @async
   * @method updatePayment
   * @param {RequestWithParamsAndBody<IdParam, UpdatePaymentDto>} req - Express request object with payment ID in parameters and update data in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with updated payment data
   */
  updatePayment: async (req: RequestWithParamsAndBody<IdParam, UpdatePaymentDto>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;
    // 2. Extract payment update data from request body
    const paymentData = req.body;
    // 3. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 4. Log payment update request
    logger.info(`Attempting to update payment with ID: ${id}`, { paymentData, userId, requestId: req.requestId });

    try {
      // 5. Call paymentsService.updatePayment to update payment
      const payment = await paymentsService.updatePayment(id, paymentData, userId);

      // 6. Return success response with updated payment data
      res.status(200).json(SuccessResponse(payment, `Payment updated successfully with ID: ${id}`));
    } catch (error) {
      // 7. Handle errors and return appropriate error response
      logger.error(`Error updating payment with ID: ${id}`, { error, paymentData, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Deletes a payment record (soft delete)
   * @async
   * @method deletePayment
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response confirming deletion
   */
  deletePayment: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;
    // 2. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 3. Log payment deletion request
    logger.info(`Attempting to delete payment with ID: ${id}`, { userId, requestId: req.requestId });

    try {
      // 4. Call paymentsService.deletePayment to delete payment
      await paymentsService.deletePayment(id, userId);

      // 5. Return success response confirming deletion
      res.status(200).json(SuccessResponse(null, `Payment deleted successfully with ID: ${id}`));
    } catch (error) {
      // 6. Handle errors and return appropriate error response
      logger.error(`Error deleting payment with ID: ${id}`, { error, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Processes a remittance file and creates payment records
   * @async
   * @method processRemittance
   * @param {RequestWithBody<ImportRemittanceDto>} req - Express request object with remittance import data in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with remittance processing results
   */
  processRemittance: async (req: RequestWithBody<ImportRemittanceDto>, res: Response): Promise<void> => {
    // 1. Extract remittance import data from request body
    const importData = req.body;
    // 2. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 3. Log remittance processing request
    logger.info('Attempting to process remittance file', { importData, userId, requestId: req.requestId });

    try {
      // 4. Call paymentsService.processRemittance to process the remittance file
      const processingResults = await paymentsService.processRemittance(importData, userId);

      // 5. Return success response with processing results
      res.status(200).json(SuccessResponse(processingResults, 'Remittance file processed successfully'));
    } catch (error) {
      // 6. Handle errors and return appropriate error response
      logger.error('Error processing remittance file', { error, importData, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to process remittance file',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Gets suggested claim matches for a payment
   * @async
   * @method getSuggestedMatches
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with suggested claim matches
   */
  getSuggestedMatches: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;

    // 2. Log suggested matches request
    logger.debug(`Attempting to get suggested matches for payment with ID: ${id}`, { requestId: req.requestId });

    try {
      // 3. Call paymentsService.getSuggestedMatches to get suggested claim matches
      const suggestedMatches = await paymentsService.getSuggestedMatches(id);

      // 4. Return success response with payment and suggested matches
      res.status(200).json(SuccessResponse(suggestedMatches, `Suggested matches retrieved successfully for payment with ID: ${id}`));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error(`Error getting suggested matches for payment with ID: ${id}`, { error, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get suggested matches',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Reconciles a payment with claims
   * @async
   * @method reconcilePayment
   * @param {RequestWithParamsAndBody<IdParam, ReconcilePaymentDto>} req - Express request object with payment ID in parameters and reconciliation data in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with reconciliation results
   */
  reconcilePayment: async (req: RequestWithParamsAndBody<IdParam, ReconcilePaymentDto>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;
    // 2. Extract reconciliation data from request body
    const reconcileData = req.body;
    // 3. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 4. Log payment reconciliation request
    logger.info(`Attempting to reconcile payment with ID: ${id}`, { reconcileData, userId, requestId: req.requestId });

    try {
      // 5. Call paymentsService.reconcilePayment to reconcile the payment
      const reconciliationResults = await paymentsService.reconcilePayment(id, reconcileData, userId);

      // 6. Return success response with reconciliation results
      res.status(200).json(SuccessResponse(reconciliationResults, `Payment reconciled successfully with ID: ${id}`));
    } catch (error) {
      // 7. Handle errors and return appropriate error response
      logger.error(`Error reconciling payment with ID: ${id}`, { error, reconcileData, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to reconcile payment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Gets detailed reconciliation information for a payment
   * @async
   * @method getReconciliationDetails
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with reconciliation details
   */
  getReconciliationDetails: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;

    // 2. Log reconciliation details request
    logger.debug(`Attempting to get reconciliation details for payment with ID: ${id}`, { requestId: req.requestId });

    try {
      // 3. Call paymentsService.getReconciliationDetails to get reconciliation details
      const reconciliationDetails = await paymentsService.getReconciliationDetails(id);

      // 4. Return success response with reconciliation details
      res.status(200).json(SuccessResponse(reconciliationDetails, `Reconciliation details retrieved successfully for payment with ID: ${id}`));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error(`Error getting reconciliation details for payment with ID: ${id}`, { error, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get reconciliation details',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Undoes a previous reconciliation
   * @async
   * @method undoReconciliation
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with undo reconciliation results
   */
  undoReconciliation: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;
    // 2. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 3. Log undo reconciliation request
    logger.info(`Attempting to undo reconciliation for payment with ID: ${id}`, { userId, requestId: req.requestId });

    try {
      // 4. Call paymentsService.undoReconciliation to undo the reconciliation
      const undoResults = await paymentsService.undoReconciliation(id, userId);

      // 5. Return success response with undo results
      res.status(200).json(SuccessResponse(undoResults, `Reconciliation undone successfully for payment with ID: ${id}`));
    } catch (error) {
      // 6. Handle errors and return appropriate error response
      logger.error(`Error undoing reconciliation for payment with ID: ${id}`, { error, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to undo reconciliation',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Reconciles multiple payments in a batch operation
   * @async
   * @method batchReconcilePayments
   * @param {RequestWithBody<Array<{ paymentId: UUID; reconcileData: ReconcilePaymentDto }>>} req - Express request object with batch reconciliation data in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with batch reconciliation results
   */
  batchReconcilePayments: async (req: RequestWithBody<Array<{ paymentId: UUID; reconcileData: ReconcilePaymentDto }>>, res: Response): Promise<void> => {
    // 1. Extract batch reconciliation data from request body
    const batchData = req.body;
    // 2. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 3. Log batch reconciliation request
    logger.info('Attempting to batch reconcile payments', { batchData, userId, requestId: req.requestId });

    try {
      // 4. Call paymentsService.batchReconcilePayments to reconcile multiple payments
      const batchResults = await paymentsService.batchReconcilePayments(batchData, userId);

      // 5. Return bulk operation response with reconciliation results
      res.status(200).json(BulkOperationSuccessResponse({
        successful: batchResults.successful.length,
        failed: batchResults.failed.length,
        total: batchData.length
      }, batchResults.failed.map(f => ({ id: f.paymentId, reason: f.error })), 'Batch reconciliation completed'));
    } catch (error) {
      // 6. Handle errors and return appropriate error response
      logger.error('Error batch reconciling payments', { error, batchData, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to batch reconcile payments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Automatically reconciles a payment using intelligent matching algorithms
   * @async
   * @method autoReconcilePayment
   * @param {RequestWithParamsAndBody<IdParam, { matchThreshold?: number }>} req - Express request object with payment ID in parameters and optional match threshold in request body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with auto-reconciliation results
   */
  autoReconcilePayment: async (req: RequestWithParamsAndBody<IdParam, { matchThreshold?: number }>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;
    // 2. Extract match threshold from request body (default if not provided)
    const matchThreshold = req.body.matchThreshold || 0.8;
    // 3. Extract user ID from authenticated request
    const userId = req.user?.id || null;

    // 4. Log auto-reconciliation request
    logger.info(`Attempting to auto-reconcile payment with ID: ${id}`, { matchThreshold, userId, requestId: req.requestId });

    try {
      // 5. Call paymentsService.autoReconcilePayment to auto-reconcile the payment
      const autoReconciliationResults = await paymentsService.autoReconcilePayment(id, matchThreshold, userId);

      // 6. Return success response with auto-reconciliation results
      res.status(200).json(SuccessResponse(autoReconciliationResults, `Payment auto-reconciled successfully with ID: ${id}`));
    } catch (error) {
      // 7. Handle errors and return appropriate error response
      logger.error(`Error auto-reconciling payment with ID: ${id}`, { error, matchThreshold, userId, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to auto-reconcile payment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Gets adjustments associated with a payment
   * @async
   * @method getAdjustmentsForPayment
   * @param {RequestWithParams<IdParam>} req - Express request object with payment ID in parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with payment adjustments
   */
  getAdjustmentsForPayment: async (req: RequestWithParams<IdParam>, res: Response): Promise<void> => {
    // 1. Extract payment ID from request parameters
    const { id } = req.params;

    // 2. Log adjustments retrieval request
    logger.debug(`Attempting to get adjustments for payment with ID: ${id}`, { requestId: req.requestId });

    try {
      // 3. Call paymentsService.getAdjustmentsForPayment to get adjustments
      const adjustments = await paymentsService.getAdjustmentsForPayment(id);

      // 4. Return success response with adjustments data
      res.status(200).json(SuccessResponse(adjustments, `Adjustments retrieved successfully for payment with ID: ${id}`));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error(`Error getting adjustments for payment with ID: ${id}`, { error, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get adjustments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Analyzes adjustment trends over time and by payer
   * @async
   * @method getAdjustmentTrends
   * @param {RequestWithQuery<{ dateRange?: string, payerId?: UUID, programId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with adjustment trends data
   */
  getAdjustmentTrends: async (req: RequestWithQuery<{ dateRange?: string, payerId?: UUID, programId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log adjustment trends request
    logger.debug('Attempting to get adjustment trends', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getAdjustmentTrends to get adjustment trends
      const adjustmentTrends = await paymentsService.getAdjustmentTrends(filters);

      // 4. Return success response with trends data
      res.status(200).json(SuccessResponse(adjustmentTrends, 'Adjustment trends retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting adjustment trends', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get adjustment trends',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Analyzes claim denials based on adjustment codes
   * @async
   * @method getDenialAnalysis
   * @param {RequestWithQuery<{ dateRange?: string, payerId?: UUID, programId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with denial analysis data
   */
  getDenialAnalysis: async (req: RequestWithQuery<{ dateRange?: string, payerId?: UUID, programId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log denial analysis request
    logger.debug('Attempting to get denial analysis', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getDenialAnalysis to get denial analysis
      const denialAnalysis = await paymentsService.getDenialAnalysis(filters);

      // 4. Return success response with analysis data
      res.status(200).json(SuccessResponse(denialAnalysis, 'Denial analysis retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting denial analysis', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get denial analysis',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Generates an accounts receivable aging report
   * @async
   * @method getAgingReport
   * @param {RequestWithQuery<{ asOfDate?: string, payerId?: UUID, programId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with aging report data
   */
  getAgingReport: async (req: RequestWithQuery<{ asOfDate?: string, payerId?: UUID, programId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log aging report request
    logger.debug('Attempting to get aging report', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getAgingReport to generate aging report
      const agingReport = await paymentsService.getAgingReport(filters.asOfDate, filters.payerId, filters.programId);

      // 4. Return success response with aging report data
      res.status(200).json(SuccessResponse(agingReport, 'Aging report retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting aging report', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get aging report',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Gets a list of outstanding claims that need follow-up
   * @async
   * @method getOutstandingClaims
   * @param {RequestWithQuery<{ minAge?: number, payerId?: UUID, programId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with outstanding claims data
   */
  getOutstandingClaims: async (req: RequestWithQuery<{ minAge?: number, payerId?: UUID, programId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log outstanding claims request
    logger.debug('Attempting to get outstanding claims', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getOutstandingClaims to get outstanding claims
      const outstandingClaims = await paymentsService.getOutstandingClaims(filters.minAge, filters.payerId, filters.programId);

      // 4. Return success response with outstanding claims data
      res.status(200).json(SuccessResponse(outstandingClaims, 'Outstanding claims retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting outstanding claims', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get outstanding claims',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Gets a list of unreconciled payments that need attention
   * @async
   * @method getUnreconciledPayments
   * @param {RequestWithQuery<{ minAge?: number, payerId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with unreconciled payments data
   */
  getUnreconciledPayments: async (req: RequestWithQuery<{ minAge?: number, payerId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log unreconciled payments request
    logger.debug('Attempting to get unreconciled payments', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getUnreconciledPayments to get unreconciled payments
      const unreconciledPayments = await paymentsService.getUnreconciledPayments(filters.minAge, filters.payerId);

      // 4. Return success response with unreconciled payments data
      res.status(200).json(SuccessResponse(unreconciledPayments, 'Unreconciled payments retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting unreconciled payments', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get unreconciled payments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Generates a prioritized list of claims for collection follow-up
   * @async
   * @method generateCollectionWorkList
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with collection work list data
   */
  generateCollectionWorkList: async (req: Request, res: Response): Promise<void> => {
    // 1. Log collection work list request
    logger.info('Attempting to generate collection work list', { requestId: req.requestId });

    try {
      // 2. Call paymentsService.generateCollectionWorkList to generate work list
      const collectionWorkList = await paymentsService.generateCollectionWorkList();

      // 3. Return success response with collection work list data
      res.status(200).json(SuccessResponse(collectionWorkList, 'Collection work list generated successfully'));
    } catch (error) {
      // 4. Handle errors and return appropriate error response
      logger.error('Error generating collection work list', { error, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to generate collection work list',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

    /**
   * Retrieves payment metrics for dashboard and reporting
   * @async
   * @method getPaymentMetrics
   * @param {RequestWithQuery<{ dateRange?: string, programId?: UUID, payerId?: UUID, facilityId?: UUID }>} req - Express request object with query parameters for filtering
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Sends HTTP response with payment metrics data
   */
  getPaymentMetrics: async (req: RequestWithQuery<{ dateRange?: string, programId?: UUID, payerId?: UUID, facilityId?: UUID }>, res: Response): Promise<void> => {
    // 1. Extract query parameters for filtering
    const filters = req.query;

    // 2. Log payment metrics request
    logger.debug('Attempting to get payment metrics', { filters, requestId: req.requestId });

    try {
      // 3. Call paymentsService.getPaymentMetrics to retrieve payment metrics
      const paymentMetrics = await paymentsService.getPaymentMetrics(filters);

      // 4. Return success response with metrics data
      res.status(200).json(SuccessResponse(paymentMetrics, 'Payment metrics retrieved successfully'));
    } catch (error) {
      // 5. Handle errors and return appropriate error response
      logger.error('Error getting payment metrics', { error, filters, requestId: req.requestId });
      res.status(500).json({
        success: false,
        message: 'Failed to get payment metrics',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};