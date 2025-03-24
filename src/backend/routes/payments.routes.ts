import { Router } from 'express'; // express v4.18+
import paymentsController from '../controllers/payments.controller'; // Import payment controller functions for handling HTTP requests
import { requireAuth, requirePermission, requirePermissionForAction } from '../middleware/auth.middleware'; // Import authentication and authorization middleware
import { validateCreatePayment, validateUpdatePayment, validateReconcilePayment, validateImportRemittance, validatePaymentQuery } from '../validation/payment.validation'; // Import payment validation middleware
import { PermissionCategory, PermissionAction } from '../types/users.types'; // Import permission enums for authorization

// Express router instance for payment routes
const router = Router();

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: Get all payments with optional filtering and pagination
 *     description: Retrieves a list of payments with support for pagination, sorting, and filtering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deleted]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Successful operation
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', requireAuth, requirePermission('payments:read'), validatePaymentQuery, paymentsController.getAllPayments);

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Create a new payment record
 *     description: Creates a new payment record in the system.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payerId:
 *                 type: string
 *                 description: Payer ID
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date payment was received
 *               paymentAmount:
 *                 type: number
 *                 description: Total payment amount
 *               paymentMethod:
 *                 type: string
 *                 description: Method of payment
 *               referenceNumber:
 *                 type: string
 *                 description: Payment reference number
 *               checkNumber:
 *                 type: string
 *                 description: Check number if payment by check
 *               remittanceId:
 *                 type: string
 *                 description: Remittance ID
 *               notes:
 *                 type: string
 *                 description: Payment notes
 *             required:
 *               - payerId
 *               - paymentDate
 *               - paymentAmount
 *               - paymentMethod
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth, requirePermission('payments:create'), validateCreatePayment, paymentsController.createPayment);

/**
 * @openapi
 * /payments/remittance:
 *   post:
 *     summary: Process a remittance file and create payment records
 *     description: Processes a remittance file and creates payment records in the system.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payerId:
 *                 type: string
 *                 description: Payer ID
 *               fileContent:
 *                 type: string
 *                 description: File content
 *               fileType:
 *                 type: string
 *                 description: File type
 *               originalFilename:
 *                 type: string
 *                 description: Original filename
 *             required:
 *               - payerId
 *               - fileContent
 *               - fileType
 *               - originalFilename
 *     responses:
 *       200:
 *         description: Remittance file processed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/remittance', requireAuth, requirePermission('payments:create'), validateImportRemittance, paymentsController.processRemittance);

/**
 * @openapi
 * /payments/batch-reconcile:
 *   post:
 *     summary: Reconcile multiple payments in a batch operation
 *     description: Reconciles multiple payments in a batch operation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                   description: Payment ID
 *                 reconcileData:
 *                   type: object
 *                   description: Reconciliation data
 *               required:
 *                 - paymentId
 *                 - reconcileData
 *     responses:
 *       200:
 *         description: Batch reconciliation completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/batch-reconcile', requireAuth, requirePermission('payments:update'), paymentsController.batchReconcilePayments);

/**
 * @openapi
 * /payments/aging-report:
 *   get:
 *     summary: Generate an accounts receivable aging report
 *     description: Generates an accounts receivable aging report.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accounts receivable aging report generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/aging-report', requireAuth, requirePermission('reports:read'), paymentsController.getAgingReport);

/**
 * @openapi
 * /payments/outstanding-claims:
 *   get:
 *     summary: Get a list of outstanding claims that need follow-up
 *     description: Get a list of outstanding claims that need follow-up.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of outstanding claims retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/outstanding-claims', requireAuth, requirePermission('claims:read'), paymentsController.getOutstandingClaims);

/**
 * @openapi
 * /payments/unreconciled:
 *   get:
 *     summary: Get a list of unreconciled payments that need attention
 *     description: Get a list of unreconciled payments that need attention.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unreconciled payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/unreconciled', requireAuth, requirePermission('payments:read'), paymentsController.getUnreconciledPayments);

/**
 * @openapi
 * /payments/collection-worklist:
 *   get:
 *     summary: Generate a prioritized list of claims for collection follow-up
 *     description: Generate a prioritized list of claims for collection follow-up.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prioritized list of claims generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/collection-worklist', requireAuth, requirePermission('payments:read'), paymentsController.generateCollectionWorkList);

/**
 * @openapi
 * /payments/adjustment-trends:
 *   get:
 *     summary: Analyze adjustment trends over time and by payer
 *     description: Analyze adjustment trends over time and by payer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Adjustment trends retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/adjustment-trends', requireAuth, requirePermission('reports:read'), paymentsController.getAdjustmentTrends);

/**
 * @openapi
 * /payments/denial-analysis:
 *   get:
 *     summary: Analyze claim denials based on adjustment codes
 *     description: Analyze claim denials based on adjustment codes.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Claim denials analysis retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/denial-analysis', requireAuth, requirePermission('reports:read'), paymentsController.getDenialAnalysis);

/**
 * @openapi
 * /payments/metrics:
 *   get:
 *     summary: Retrieve payment metrics for dashboard and reporting
 *     description: Retrieve payment metrics for dashboard and reporting.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', requireAuth, requirePermission('reports:read'), paymentsController.getPaymentMetrics);

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     description: Retrieves a payment by its unique identifier.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', requireAuth, requirePermission('payments:read'), paymentsController.getPayment);

/**
 * @openapi
 * /payments/{id}:
 *   put:
 *     summary: Update a payment record
 *     description: Updates an existing payment record in the system.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payerId:
 *                 type: string
 *                 description: Payer ID
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date payment was received
 *               paymentAmount:
 *                 type: number
 *                 description: Total payment amount
 *               paymentMethod:
 *                 type: string
 *                 description: Method of payment
 *               referenceNumber:
 *                 type: string
 *                 description: Payment reference number
 *               checkNumber:
 *                 type: string
 *                 description: Check number if payment by check
 *               remittanceId:
 *                 type: string
 *                 description: Remittance ID
 *               notes:
 *                 type: string
 *                 description: Payment notes
 *             required:
 *               - payerId
 *               - paymentDate
 *               - paymentAmount
 *               - paymentMethod
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', requireAuth, requirePermissionForAction(PermissionCategory.PAYMENTS, PermissionAction.UPDATE, 'payment'), validateUpdatePayment, paymentsController.updatePayment);

/**
 * @openapi
 * /payments/{id}:
 *   delete:
 *     summary: Delete a payment record (soft delete)
 *     description: Deletes a payment record from the system (soft delete).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requireAuth, requirePermissionForAction(PermissionCategory.PAYMENTS, PermissionAction.DELETE, 'payment'), paymentsController.deletePayment);

/**
 * @openapi
 * /payments/{id}/suggested-matches:
 *   get:
 *     summary: Get suggested claim matches for a payment
 *     description: Retrieves suggested claim matches for a payment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Suggested matches retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/suggested-matches', requireAuth, requirePermission('payments:read'), paymentsController.getSuggestedMatches);

/**
 * @openapi
 * /payments/{id}/reconcile:
 *   post:
 *     summary: Reconcile a payment with claims
 *     description: Reconciles a payment with claims.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               claimPayments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     claimId:
 *                       type: string
 *                       description: Claim ID
 *                     amount:
 *                       type: number
 *                       description: Amount to apply to claim
 *               notes:
 *                 type: string
 *                 description: Reconciliation notes
 *             required:
 *               - claimPayments
 *     responses:
 *       200:
 *         description: Payment reconciled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/reconcile', requireAuth, requirePermission('payments:update'), validateReconcilePayment, paymentsController.reconcilePayment);

/**
 * @openapi
 * /payments/{id}/reconciliation:
 *   get:
 *     summary: Get detailed reconciliation information for a payment
 *     description: Retrieves detailed reconciliation information for a payment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Reconciliation details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/reconciliation', requireAuth, requirePermission('payments:read'), paymentsController.getReconciliationDetails);

/**
 * @openapi
 * /payments/{id}/undo-reconciliation:
 *   post:
 *     summary: Undo a previous reconciliation
 *     description: Undoes a previous reconciliation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Reconciliation undone successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/undo-reconciliation', requireAuth, requirePermission('payments:update'), paymentsController.undoReconciliation);

/**
 * @openapi
 * /payments/{id}/auto-reconcile:
 *   post:
 *     summary: Automatically reconcile a payment using intelligent matching algorithms
 *     description: Automatically reconcile a payment using intelligent matching algorithms.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment auto-reconciled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/auto-reconcile', requireAuth, requirePermission('payments:update'), paymentsController.autoReconcilePayment);

/**
 * @openapi
 * /payments/{id}/adjustments:
 *   get:
 *     summary: Get adjustments associated with a payment
 *     description: Retrieves adjustments associated with a payment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 */
router.get('/:id/adjustments', requireAuth, requirePermission('payments:read'), paymentsController.getAdjustmentsForPayment);

// Export configured Express router with payment-related routes
export default router;