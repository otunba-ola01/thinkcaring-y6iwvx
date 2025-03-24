// src/backend/tests/integration/payments.test.ts
import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { db } from '../../database/connection'; // Database connection management for tests
import { paymentsService } from '../../services/payments.service'; // Service under test for payment operations
import { PaymentModel } from '../../models/payment.model'; // Payment model for verification of payment operations
import { UUID, Money } from '../../types/common.types'; // Common type definitions used in tests
import { Payment, PaymentWithRelations, CreatePaymentDto, UpdatePaymentDto, ReconcilePaymentDto, ReconciliationStatus, PaymentMethod } from '../../types/payments.types'; // Payment-specific type definitions
import { ClaimStatus } from '../../types/claims.types'; // Claim status enum for payment-claim relationship testing
import { NotFoundError, ValidationError } from '../../errors'; // Error classes for testing error scenarios
import { mockPayment, mockPaymentWithRelations, mockUnreconciledPayment, mockPartiallyReconciledPayment, mockReconciledPayment, createMockPayment, createMockPaymentWithRelations } from '../fixtures/payments.fixtures'; // Test fixtures for payment data
import { mockClaim, mockClaimWithRelations, mockPaidClaim, mockPendingClaim, createMockClaim } from '../fixtures/claims.fixtures'; // Test fixtures for claim data used in payment reconciliation tests

describe('Payments Service Integration Tests', () => {
  beforeAll(async () => {
    await db.initialize(); // Initialize database connection
  });

  afterAll(async () => {
    await db.close(); // Close database connection
  });

  let transaction: any; // Define transaction variable

  beforeEach(async () => {
    transaction = await db.getTransaction(); // Set up transaction for test isolation
  });

  afterEach(async () => {
    await transaction.rollback(); // Rollback transaction after each test
  });

  it('should create a new payment', async () => {
    // Create payment data based on mock fixtures
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };

    // Call paymentsService.createPayment
    const payment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Verify payment was created with correct data
    expect(payment).toBeDefined();
    expect(payment.payerId).toBe(paymentData.payerId);
    expect(payment.paymentDate).toBe(paymentData.paymentDate);
    expect(payment.paymentAmount).toBe(paymentData.paymentAmount);
    expect(payment.paymentMethod).toBe(paymentData.paymentMethod);
    expect(payment.referenceNumber).toBe(paymentData.referenceNumber);

    // Verify payment has UNRECONCILED status by default
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.UNRECONCILED);
  });

  it('should throw ValidationError when creating payment with invalid data', async () => {
    // Create invalid payment data (missing required fields)
    const paymentData: any = {
      payerId: null, // Invalid: missing payerId
      paymentDate: null, // Invalid: missing paymentDate
      paymentAmount: null, // Invalid: missing paymentAmount
      paymentMethod: null, // Invalid: missing paymentMethod
      referenceNumber: 'REF12345',
      checkNumber: null,
      remittanceId: null,
      notes: null,
    };

    // Expect paymentsService.createPayment to throw ValidationError
    await expect(paymentsService.createPayment(paymentData, null, { transaction })).rejects.toThrow(ValidationError);

    // Verify error message contains validation details
    try {
      await paymentsService.createPayment(paymentData, null, { transaction });
    } catch (error: any) {
      expect(error.message).toContain('Payer ID is required');
      expect(error.message).toContain('Payment date is required');
      expect(error.message).toContain('Payment amount is required and must be greater than 0');
      expect(error.message).toContain('Payment method is required');
    }
  });

  it('should retrieve a payment by ID', async () => {
    // Create and save a test payment
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Call paymentsService.getPaymentById with the payment ID
    const payment = await paymentsService.getPaymentById(createdPayment.id, { transaction });

    // Verify returned payment matches the created payment
    expect(payment).toBeDefined();
    expect(payment.id).toBe(createdPayment.id);
    expect(payment.payerId).toBe(createdPayment.payerId);
    expect(payment.paymentAmount).toBe(createdPayment.paymentAmount);
  });

  it('should throw NotFoundError when retrieving non-existent payment', async () => {
    // Generate a random UUID for a non-existent payment
    const nonExistentPaymentId: UUID = uuidv4();

    // Expect paymentsService.getPaymentById to throw NotFoundError
    await expect(paymentsService.getPaymentById(nonExistentPaymentId, { transaction })).rejects.toThrow(NotFoundError);

    // Verify error message indicates payment not found
    try {
      await paymentsService.getPaymentById(nonExistentPaymentId, { transaction });
    } catch (error: any) {
      expect(error.message).toContain('Payment not found');
    }
  });

  it('should retrieve a payment with relations', async () => {
    // Create and save a test payment with relations
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Call paymentsService.getPaymentWithRelations with the payment ID
    const payment = await paymentsService.getPaymentWithRelations(createdPayment.id, { transaction });

    // Verify returned payment includes related entities (payer, claim payments, etc.)
    expect(payment).toBeDefined();
    expect(payment.payer).toBeDefined();
  });

  it('should retrieve a paginated list of payments', async () => {
    // Create multiple test payments
    const paymentData1: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: 'REF1',
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const paymentData2: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: 'REF2',
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    await paymentsService.createPayment(paymentData1, null, { transaction });
    await paymentsService.createPayment(paymentData2, null, { transaction });

    // Call paymentsService.getPayments with pagination parameters
    const queryParams = {
      pagination: { page: 1, limit: 1 },
      sort: { sortBy: 'paymentDate', sortDirection: 'asc' },
      filter: { conditions: [], logicalOperator: 'AND' },
      search: '',
    };
    const result = await paymentsService.getPayments(queryParams, { transaction });

    // Verify correct number of payments returned
    expect(result.payments).toBeDefined();
    expect(result.payments.length).toBe(1);

    // Verify pagination metadata is correct
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it('should update an existing payment', async () => {
    // Create and save a test payment
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Prepare update data with modified fields
    const updateData: UpdatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 1200.00, // Modified amount
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: 'REF-UPDATED', // Modified reference number
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };

    // Call paymentsService.updatePayment with the payment ID and update data
    const updatedPayment = await paymentsService.updatePayment(createdPayment.id, updateData, null, { transaction });

    // Verify payment was updated with new values
    expect(updatedPayment).toBeDefined();
    expect(updatedPayment.paymentAmount).toBe(updateData.paymentAmount);
    expect(updatedPayment.referenceNumber).toBe(updateData.referenceNumber);

    // Verify unchanged fields remain the same
    expect(updatedPayment.payerId).toBe(createdPayment.payerId);
  });

  it('should throw NotFoundError when updating non-existent payment', async () => {
    // Generate a random UUID for a non-existent payment
    const nonExistentPaymentId: UUID = uuidv4();

    // Prepare valid update data
    const updateData: UpdatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 1200.00, // Modified amount
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: 'REF-UPDATED', // Modified reference number
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };

    // Expect paymentsService.updatePayment to throw NotFoundError
    await expect(paymentsService.updatePayment(nonExistentPaymentId, updateData, null, { transaction })).rejects.toThrow(NotFoundError);

    // Verify error message indicates payment not found
    try {
      await paymentsService.updatePayment(nonExistentPaymentId, updateData, null, { transaction });
    } catch (error: any) {
      expect(error.message).toContain('Payment not found');
    }
  });

  it('should delete a payment (soft delete)', async () => {
    // Create and save a test payment
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: mockPayment.paymentAmount,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Call paymentsService.deletePayment with the payment ID
    const deleted = await paymentsService.deletePayment(createdPayment.id, null, { transaction });

    // Verify deletion was successful
    expect(deleted).toBe(true);

    // Attempt to retrieve the deleted payment
    await expect(paymentsService.getPaymentById(createdPayment.id, { transaction })).rejects.toThrow(NotFoundError);

    // Verify NotFoundError is thrown
    try {
      await paymentsService.getPaymentById(createdPayment.id, { transaction });
    } catch (error: any) {
      expect(error.message).toContain('Payment not found');
    }
  });

  it('should process a remittance file and create payments', async () => {
    // Prepare mock remittance data
    const importData = {
      payerId: mockPayment.payerId,
      fileContent: 'Mock Remittance Data',
      fileType: 'edi_835',
      originalFilename: 'remittance.edi',
      mappingConfig: null,
    };

    // Call paymentsService.processRemittance with the remittance data
    const processingResult = await paymentsService.processRemittance(importData, null, { transaction });

    // Verify processing results contain expected data
    expect(processingResult).toBeDefined();
    expect(processingResult.payment).toBeDefined();
    expect(processingResult.remittanceInfo).toBeDefined();

    // Verify payments were created from remittance data
    const payment = await paymentsService.getPaymentById(processingResult.payment.id, { transaction });
    expect(payment).toBeDefined();
  });

  it('should reconcile a payment with claims', async () => {
    // Create and save a test payment and related claims
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 100.00,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Create a mock claim
    const claimData = createMockClaim({
      payerId: mockPayment.payerId,
      totalAmount: 100.00,
      claimStatus: ClaimStatus.SUBMITTED
    });
    const createdClaim = await claimRepository.create(claimData, { transaction });

    // Prepare reconciliation data linking payment to claims
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: [
        {
          claimId: createdClaim.id,
          amount: 100.00,
        },
      ],
      notes: 'Reconciled with claim',
    };

    // Call paymentsService.reconcilePayment with the payment ID and reconciliation data
    const reconciliationResult = await paymentsService.reconcilePayment(createdPayment.id, reconcileData, null, { transaction });

    // Verify reconciliation was successful
    expect(reconciliationResult).toBeDefined();
    expect(reconciliationResult.payment.reconciliationStatus).toBe(ReconciliationStatus.RECONCILED);

    // Verify payment status changed to RECONCILED
    const reconciledPayment = await paymentsService.getPaymentById(createdPayment.id, { transaction });
    expect(reconciledPayment.reconciliationStatus).toBe(ReconciliationStatus.RECONCILED);

    // Verify claim statuses updated to PAID
    const updatedClaim = await claimRepository.findById(createdClaim.id, { transaction });
    expect(updatedClaim.claimStatus).toBe(ClaimStatus.PAID);
  });

  it("should partially reconcile a payment when amount doesn't match", async () => {
    // Create and save a test payment
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 100.00,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Create a mock claim
    const claimData = createMockClaim({
      payerId: mockPayment.payerId,
      totalAmount: 100.00,
      claimStatus: ClaimStatus.SUBMITTED
    });
    const createdClaim = await claimRepository.create(claimData, { transaction });

    // Prepare reconciliation data with amount less than payment amount
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: [
        {
          claimId: createdClaim.id,
          amount: 50.00, // Less than payment amount
        },
      ],
      notes: 'Partially reconciled with claim',
    };

    // Call paymentsService.reconcilePayment with the payment ID and reconciliation data
    const reconciliationResult = await paymentsService.reconcilePayment(createdPayment.id, reconcileData, null, { transaction });

    // Verify reconciliation was successful
    expect(reconciliationResult).toBeDefined();

    // Verify payment status changed to PARTIALLY_RECONCILED
    const reconciledPayment = await paymentsService.getPaymentById(createdPayment.id, { transaction });
    expect(reconciledPayment.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);
  });

  it('should retrieve reconciliation details for a payment', async () => {
    // Create and save a reconciled test payment with claim payments
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 100.00,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Create a mock claim
    const claimData = createMockClaim({
      payerId: mockPayment.payerId,
      totalAmount: 100.00,
      claimStatus: ClaimStatus.SUBMITTED
    });
    const createdClaim = await claimRepository.create(claimData, { transaction });

    // Prepare reconciliation data linking payment to claims
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: [
        {
          claimId: createdClaim.id,
          amount: 100.00,
        },
      ],
      notes: 'Reconciled with claim',
    };

    // Call paymentsService.reconcilePayment with the payment ID and reconciliation data
    await paymentsService.reconcilePayment(createdPayment.id, reconcileData, null, { transaction });

    // Call paymentsService.getReconciliationDetails with the payment ID
    const reconciliationDetails = await paymentsService.getReconciliationDetails(createdPayment.id, { transaction });

    // Verify returned details include payment, claim payments, and financial totals
    expect(reconciliationDetails).toBeDefined();
    expect(reconciliationDetails.payment).toBeDefined();
    expect(reconciliationDetails.claimPayments).toBeDefined();
    expect(reconciliationDetails.totalAmount).toBe(100.00);

    // Verify matched and unmatched amounts are calculated correctly
    expect(reconciliationDetails.matchedAmount).toBe(100.00);
    expect(reconciliationDetails.unmatchedAmount).toBe(0);
  });

  it('should undo a payment reconciliation', async () => {
    // Create and save a reconciled test payment with claim payments
    const paymentData: CreatePaymentDto = {
      payerId: mockPayment.payerId,
      paymentDate: mockPayment.paymentDate,
      paymentAmount: 100.00,
      paymentMethod: mockPayment.paymentMethod,
      referenceNumber: mockPayment.referenceNumber,
      checkNumber: mockPayment.checkNumber,
      remittanceId: mockPayment.remittanceId,
      notes: mockPayment.notes,
    };
    const createdPayment = await paymentsService.createPayment(paymentData, null, { transaction });

    // Create a mock claim
    const claimData = createMockClaim({
      payerId: mockPayment.payerId,
      totalAmount: 100.00,
      claimStatus: ClaimStatus.SUBMITTED
    });
    const createdClaim = await claimRepository.create(claimData, { transaction });

    // Prepare reconciliation data linking payment to claims
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: [
        {
          claimId: createdClaim.id,
          amount: 100.00,
        },
      ],
      notes: 'Reconciled with claim',
    };

    // Call paymentsService.reconcilePayment with the payment ID and reconciliation data
    await paymentsService.reconcilePayment(createdPayment.id, reconcileData, null, { transaction });

    // Call paymentsService.undoReconciliation with the payment ID
    const undoResult = await paymentsService.undoReconciliation(createdPayment.id, null, { transaction });

    // Verify undo operation was successful
    expect(undoResult).toBeDefined();
    expect(undoResult.success).toBe(true);

    // Verify payment status changed back to UNRECONCILED
    const unreconciledPayment = await paymentsService.getPaymentById(createdPayment.id, { transaction });
    expect(unreconciledPayment.reconciliationStatus).toBe(ReconciliationStatus.UNRECONCILED);

    // Verify claim statuses reverted to previous state
    const updatedClaim = await claimRepository.findById(createdClaim.id, { transaction });
    expect(updatedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);
  });
});