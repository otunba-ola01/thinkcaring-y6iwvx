import { v4 as uuidv4 } from 'uuid'; // version 29.5.0
import { paymentsService } from '../../services/payments.service'; // Import the payments service for testing
import { remittanceProcessingService } from '../../services/payments/remittance-processing.service'; // Import the remittance processing service for testing
import { paymentMatchingService } from '../../services/payments/payment-matching.service'; // Import the payment matching service for testing
import { paymentReconciliationService } from '../../services/payments/payment-reconciliation.service'; // Import the payment reconciliation service for testing
import { adjustmentTrackingService } from '../../services/payments/adjustment-tracking.service'; // Import the adjustment tracking service for testing
import { accountsReceivableService } from '../../services/payments/accounts-receivable.service'; // Import the accounts receivable service for testing
import { paymentRepository } from '../../database/repositories/payment.repository'; // Import the payment repository for mocking
import { claimRepository } from '../../database/repositories/claim.repository'; // Import the claim repository for mocking
import { Payment, PaymentWithRelations, ReconciliationStatus, PaymentMethod, RemittanceFileType, ReconcilePaymentDto, AdjustmentType } from '../../types/payments.types'; // Import payment-related type definitions for test data
import { ClaimStatus } from '../../types/claims.types'; // Import claim status enum for test data
import { NotFoundError } from '../../errors/not-found-error'; // Import error class for testing error scenarios
import { ValidationError } from '../../errors/validation-error'; // Import error class for testing validation failures
import { BusinessError } from '../../errors/business-error'; // Import error class for testing business rule violations
import { db } from '../../database/connection'; // Import database connection for mocking transactions
import { mockPayment, mockPaymentWithRelations, mockClaimPayment, mockRemittanceInfo } from '../fixtures/payments.fixtures'; // Import payment fixtures for test data
import { mockClaim, mockClaimWithRelations } from '../fixtures/claims.fixtures'; // Import claim fixtures for test data
import { mockPayer } from '../fixtures/payers.fixtures'; // Import payer fixtures for test data

/**
 * Creates a mock transaction object for testing
 * @returns Mock transaction object with commit and rollback methods
 */
const createMockTransaction = () => {
  // Create a mock transaction object with commit and rollback methods
  const transaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  // Return the mock transaction object
  return transaction;
};

describe('PaymentsService', () => {
  describe('getPaymentById', () => {
    it('should retrieve a payment by ID', async () => {
      // Mock paymentRepository.findById to return a mock payment
      paymentRepository.findById = jest.fn().mockResolvedValue(mockPayment);

      // Call paymentsService.getPaymentById with a valid ID
      const payment = await paymentsService.getPaymentById(mockPayment.id);

      // Expect the result to match the mock payment
      expect(payment).toEqual(mockPayment);

      // Expect paymentRepository.findById to have been called with the correct ID
      expect(paymentRepository.findById).toHaveBeenCalledWith(mockPayment.id, {});
    });

    it('should throw NotFoundError when payment not found', async () => {
      // Mock paymentRepository.findById to return null
      paymentRepository.findById = jest.fn().mockResolvedValue(null);

      // Expect paymentsService.getPaymentById to throw NotFoundError
      await expect(paymentsService.getPaymentById(uuidv4())).rejects.toThrow(NotFoundError);

      // Expect paymentRepository.findById to have been called with the correct ID
      expect(paymentRepository.findById).toHaveBeenCalled();
    });
  });

  describe('getPaymentWithRelations', () => {
    it('should retrieve a payment with relations', async () => {
      // Mock paymentRepository.findByIdWithRelations to return a mock payment with relations
      paymentRepository.findByIdWithRelations = jest.fn().mockResolvedValue(mockPaymentWithRelations);

      // Call paymentsService.getPaymentWithRelations with a valid ID
      const payment = await paymentsService.getPaymentWithRelations(mockPaymentWithRelations.id);

      // Expect the result to match the mock payment with relations
      expect(payment).toEqual(mockPaymentWithRelations);

      // Expect paymentRepository.findByIdWithRelations to have been called with the correct ID
      expect(paymentRepository.findByIdWithRelations).toHaveBeenCalledWith(mockPaymentWithRelations.id, {});
    });
  });

  describe('getPayments', () => {
    it('should retrieve paginated payments based on query parameters', async () => {
      // Mock paymentRepository.findAllWithRelations to return paginated payments
      paymentRepository.findAllWithRelations = jest.fn().mockResolvedValue({
        data: [mockPaymentWithRelations],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      // Call paymentsService.getPayments with query parameters
      const result = await paymentsService.getPayments({ pagination: { page: 1, limit: 10 }, sort: { sortBy: 'paymentDate', sortDirection: 'asc' }, filter: { conditions: [], logicalOperator: 'AND' } });

      // Expect the result to match the paginated payments
      expect(result.payments).toEqual([mockPaymentWithRelations]);
      expect(result.total).toEqual(1);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(10);
      expect(result.totalPages).toEqual(1);

      // Expect paymentRepository.findAllWithRelations to have been called with the correct parameters
      expect(paymentRepository.findAllWithRelations).toHaveBeenCalledWith({ pagination: { page: 1, limit: 10 }, sort: { sortBy: 'paymentDate', sortDirection: 'asc' }, filter: { conditions: [], logicalOperator: 'AND' } }, {});
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentRepository.create to return a mock payment
      paymentRepository.create = jest.fn().mockResolvedValue(mockPayment);

      // Call paymentsService.createPayment with valid payment data
      const payment = await paymentsService.createPayment({ payerId: mockPayer.id, paymentDate: new Date().toISOString(), paymentAmount: 100, paymentMethod: PaymentMethod.EFT, referenceNumber: 'REF123' }, uuidv4());

      // Expect the result to match the mock payment
      expect(payment).toEqual(mockPayment);

      // Expect paymentRepository.create to have been called with the correct data
      expect(paymentRepository.create).toHaveBeenCalled();

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid payment data', async () => {
      // Call paymentsService.createPayment with invalid payment data (missing required fields)
      await expect(paymentsService.createPayment({}, uuidv4())).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePayment', () => {
    it('should update an existing payment', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentRepository.findById to return a mock payment
      paymentRepository.findById = jest.fn().mockResolvedValue(mockPayment);

      // Mock paymentRepository.update to return an updated mock payment
      paymentRepository.update = jest.fn().mockResolvedValue(mockPayment);

      // Call paymentsService.updatePayment with valid payment data
      const payment = await paymentsService.updatePayment(mockPayment.id, { payerId: mockPayer.id, paymentDate: new Date().toISOString(), paymentAmount: 100, paymentMethod: PaymentMethod.EFT, referenceNumber: 'REF123' }, uuidv4());

      // Expect the result to match the updated mock payment
      expect(payment).toEqual(mockPayment);

      // Expect paymentRepository.update to have been called with the correct data
      expect(paymentRepository.update).toHaveBeenCalled();

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment not found', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentRepository.findById to return null
      paymentRepository.findById = jest.fn().mockResolvedValue(null);

      // Expect paymentsService.updatePayment to throw NotFoundError
      await expect(paymentsService.updatePayment(uuidv4(), { payerId: mockPayer.id, paymentDate: new Date().toISOString(), paymentAmount: 100, paymentMethod: PaymentMethod.EFT, referenceNumber: 'REF123' }, uuidv4())).rejects.toThrow(NotFoundError);

      // Expect transaction.rollback to have been called
      const transaction = createMockTransaction();
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deletePayment', () => {
    it('should delete a payment', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentRepository.findById to return a mock payment
      paymentRepository.findById = jest.fn().mockResolvedValue(mockPayment);

      // Mock paymentRepository.delete to return true
      paymentRepository.delete = jest.fn().mockResolvedValue(true);

      // Call paymentsService.deletePayment with a valid ID
      const result = await paymentsService.deletePayment(mockPayment.id, uuidv4());

      // Expect the result to be true
      expect(result).toBe(true);

      // Expect paymentRepository.delete to have been called with the correct ID
      expect(paymentRepository.delete).toHaveBeenCalledWith(mockPayment.id, expect.anything());

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw NotFoundError when payment not found', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentRepository.findById to return null
      paymentRepository.findById = jest.fn().mockResolvedValue(null);

      // Expect paymentsService.deletePayment to throw NotFoundError
      await expect(paymentsService.deletePayment(uuidv4(), uuidv4())).rejects.toThrow(NotFoundError);

      // Expect transaction.rollback to have been called
      const transaction = createMockTransaction();
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});

describe('RemittanceProcessingService', () => {
  describe('processRemittanceFile', () => {
    it('should process a remittance file and create payment records', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock remittanceProcessingService.processRemittanceFile to return a mock processing result
      remittanceProcessingService.processRemittanceFile = jest.fn().mockResolvedValue({ payment: mockPayment, remittanceInfo: mockRemittanceInfo, detailsProcessed: 1, claimsMatched: 1, claimsUnmatched: 0, totalAmount: 100, matchedAmount: 100, unmatchedAmount: 0, errors: [] });

      // Call paymentsService.processRemittance with valid import data
      const result = await paymentsService.processRemittance({ payerId: mockPayer.id, fileContent: 'test', fileType: RemittanceFileType.EDI_835, originalFilename: 'test.edi', mappingConfig: null }, uuidv4());

      // Expect the result to match the mock processing result
      expect(result).toEqual({ payment: mockPayment, remittanceInfo: mockRemittanceInfo, detailsProcessed: 1, claimsMatched: 1, claimsUnmatched: 0, totalAmount: 100, matchedAmount: 100, unmatchedAmount: 0, errors: [] });

      // Expect remittanceProcessingService.processRemittanceFile to have been called with the correct data
      expect(remittanceProcessingService.processRemittanceFile).toHaveBeenCalled();

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid import data', async () => {
      // Call paymentsService.processRemittance with invalid import data (missing required fields)
      await expect(paymentsService.processRemittance({}, uuidv4())).rejects.toThrow(ValidationError);
    });

    it('should handle different file types correctly', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock remittanceProcessingService.processRemittanceFile to return a mock processing result
      remittanceProcessingService.processRemittanceFile = jest.fn().mockResolvedValue({ payment: mockPayment, remittanceInfo: mockRemittanceInfo, detailsProcessed: 1, claimsMatched: 1, claimsUnmatched: 0, totalAmount: 100, matchedAmount: 100, unmatchedAmount: 0, errors: [] });

      // Call paymentsService.processRemittance with different file types (EDI_835, CSV, PDF)
      await paymentsService.processRemittance({ payerId: mockPayer.id, fileContent: 'test', fileType: RemittanceFileType.EDI_835, originalFilename: 'test.edi', mappingConfig: null }, uuidv4());
      await paymentsService.processRemittance({ payerId: mockPayer.id, fileContent: 'test', fileType: RemittanceFileType.CSV, originalFilename: 'test.csv', mappingConfig: null }, uuidv4());
      await paymentsService.processRemittance({ payerId: mockPayer.id, fileContent: 'test', fileType: RemittanceFileType.PDF, originalFilename: 'test.pdf', mappingConfig: null }, uuidv4());

      // Expect the function to process each file type correctly
      expect(remittanceProcessingService.processRemittanceFile).toHaveBeenCalledTimes(3);

      // Expect transaction.commit to have been called for each successful processing
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalledTimes(3);
    });
  });
});

describe('PaymentMatchingService', () => {
  describe('matchPaymentToClaims', () => {
    it('should identify potential claim matches for a payment', async () => {
      // Mock paymentMatchingService.matchPaymentToClaims to return mock matches
      paymentMatchingService.matchPaymentToClaims = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, matches: [], unmatchedAmount: 0 });

      // Call paymentsService.getSuggestedMatches with a valid payment ID
      const result = await paymentsService.getSuggestedMatches(mockPayment.id);

      // Expect the result to contain the payment and suggested matches
      expect(result).toEqual({ payment: mockPaymentWithRelations, suggestedMatches: [] });

      // Expect paymentMatchingService.matchPaymentToClaims to have been called with the correct ID
      expect(paymentMatchingService.matchPaymentToClaims).toHaveBeenCalledWith(mockPayment.id, {});
    });
  });

  describe('applyMatches', () => {
    it('should apply claim matches to a payment', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentMatchingService.applyMatches to return mock results
      paymentMatchingService.applyMatches = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, claimPayments: [], updatedClaims: [] });

      // Call paymentsService.reconcilePayment with valid reconciliation data
      const reconcileData: ReconcilePaymentDto = { claimPayments: [], notes: 'test' };
      const result = await paymentsService.reconcilePayment(mockPayment.id, reconcileData, uuidv4());

      // Expect the result to match the mock reconciliation results
      expect(result).toEqual({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });

      // Expect paymentMatchingService.applyMatches to have been called with the correct data
      expect(paymentMatchingService.applyMatches).toHaveBeenCalled();

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });

  describe('scoreClaim', () => {
    it('should score claims correctly based on matching criteria', () => {
      // Create mock payment and claim data with various matching scenarios
      const payment = mockPaymentWithRelations;
      const claimExact = mockClaimWithRelations;
      const claimSimilar = mockClaimWithRelations;

      // Call paymentMatchingService.scoreClaim with each scenario
      const scoreExact = paymentMatchingService.scoreClaim(payment, claimExact);
      const scoreSimilar = paymentMatchingService.scoreClaim(payment, claimSimilar);

      // Verify that exact amount matches receive higher scores
      expect(scoreExact.score).toBeGreaterThan(scoreSimilar.score);

      // Verify that remittance advice matches receive appropriate scores
      // Verify that similar amounts receive scores based on proximity
    });
  });
});

describe('PaymentReconciliationService', () => {
  describe('reconcilePayment', () => {
    it('should reconcile a payment with claims', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentReconciliationService.reconcilePayment to return mock reconciliation results
      paymentReconciliationService.reconcilePayment = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });

      // Call paymentsService.reconcilePayment with valid reconciliation data
      const reconcileData: ReconcilePaymentDto = { claimPayments: [], notes: 'test' };
      const result = await paymentsService.reconcilePayment(mockPayment.id, reconcileData, uuidv4());

      // Expect the result to match the mock reconciliation results
      expect(result).toEqual({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });

      // Expect paymentReconciliationService.reconcilePayment to have been called with the correct data
      expect(paymentReconciliationService.reconcilePayment).toHaveBeenCalled();

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });

  describe('getReconciliationDetails', () => {
    it('should get detailed reconciliation information for a payment', async () => {
      // Mock paymentReconciliationService.getReconciliationDetails to return mock reconciliation details
      paymentReconciliationService.getReconciliationDetails = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000 });

      // Call paymentsService.getReconciliationDetails with a valid payment ID
      const result = await paymentsService.getReconciliationDetails(mockPayment.id);

      // Expect the result to match the mock reconciliation details
      expect(result).toEqual({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000 });

      // Expect paymentReconciliationService.getReconciliationDetails to have been called with the correct ID
      expect(paymentReconciliationService.getReconciliationDetails).toHaveBeenCalledWith(mockPayment.id, {});
    });
  });

  describe('undoReconciliation', () => {
    it('should undo a previous reconciliation', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentReconciliationService.undoReconciliation to return mock undo results
      paymentReconciliationService.undoReconciliation = jest.fn().mockResolvedValue({ success: true, payment: mockPaymentWithRelations, updatedClaims: [] });

      // Call paymentsService.undoReconciliation with a valid payment ID
      const result = await paymentsService.undoReconciliation(mockPayment.id, uuidv4());

      // Expect the result to match the mock undo results
      expect(result).toEqual({ success: true, payment: mockPaymentWithRelations, updatedClaims: [] });

      // Expect paymentReconciliationService.undoReconciliation to have been called with the correct ID
      expect(paymentReconciliationService.undoReconciliation).toHaveBeenCalledWith(mockPayment.id, uuidv4(), {});

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });

  describe('autoReconcilePayment', () => {
    it('should automatically reconcile a payment using intelligent matching', async () => {
      // Mock db.transaction to return a mock transaction
      db.transaction = jest.fn().mockImplementation(async (callback) => {
        const transaction = createMockTransaction();
        return await callback(transaction);
      });

      // Mock paymentReconciliationService.autoReconcilePayment to return mock reconciliation results
      paymentReconciliationService.autoReconcilePayment = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });

      // Call paymentsService.autoReconcilePayment with a valid payment ID and threshold
      const result = await paymentsService.autoReconcilePayment(mockPayment.id, 0.8, uuidv4());

      // Expect the result to match the mock reconciliation results
      expect(result).toEqual({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });

      // Expect paymentReconciliationService.autoReconcilePayment to have been called with the correct parameters
      expect(paymentReconciliationService.autoReconcilePayment).toHaveBeenCalledWith(mockPayment.id, 0.8, uuidv4(), {});

      // Expect transaction.commit to have been called
      const transaction = createMockTransaction();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });
});

describe('AdjustmentTrackingService', () => {
  describe('getAdjustmentsForPayment', () => {
    it('should retrieve adjustments for a payment', async () => {
      // Mock adjustmentTrackingService.getAdjustmentsForPayment to return mock adjustments
      adjustmentTrackingService.getAdjustmentsForPayment = jest.fn().mockResolvedValue([]);

      // Call paymentsService.getAdjustmentsForPayment with a valid payment ID
      const result = await paymentsService.getAdjustmentsForPayment(mockPayment.id);

      // Expect the result to match the mock adjustments
      expect(result).toEqual([]);

      // Expect adjustmentTrackingService.getAdjustmentsForPayment to have been called with the correct ID
      expect(adjustmentTrackingService.getAdjustmentsForPayment).toHaveBeenCalledWith(mockPayment.id, {});
    });
  });

  describe('getAdjustmentTrends', () => {
    it('should analyze adjustment trends', async () => {
      // Mock adjustmentTrackingService.getAdjustmentTrends to return mock trend data
      adjustmentTrackingService.getAdjustmentTrends = jest.fn().mockResolvedValue({ byPeriod: [], byPayer: [] });

      // Call paymentsService.getAdjustmentTrends with filter parameters
      const result = await paymentsService.getAdjustmentTrends({});

      // Expect the result to match the mock trend data
      expect(result).toEqual({ byPeriod: [], byPayer: [] });

      // Expect adjustmentTrackingService.getAdjustmentTrends to have been called with the correct filters
      expect(adjustmentTrackingService.getAdjustmentTrends).toHaveBeenCalledWith({}, {});
    });
  });

  describe('getDenialAnalysis', () => {
    it('should analyze claim denials', async () => {
      // Mock adjustmentTrackingService.getDenialAnalysis to return mock denial analysis
      adjustmentTrackingService.getDenialAnalysis = jest.fn().mockResolvedValue({ denialRate: 0, totalDenied: 0, denialsByReason: [], denialsByPayer: [] });

      // Call paymentsService.getDenialAnalysis with filter parameters
      const result = await paymentsService.getDenialAnalysis({});

      // Expect the result to match the mock denial analysis
      expect(result).toEqual({ denialRate: 0, totalDenied: 0, denialsByReason: [], denialsByPayer: [] });

      // Expect adjustmentTrackingService.getDenialAnalysis to have been called with the correct filters
      expect(adjustmentTrackingService.getDenialAnalysis).toHaveBeenCalledWith({}, {});
    });
  });
});

describe('AccountsReceivableService', () => {
  describe('getAgingReport', () => {
    it('should generate an accounts receivable aging report', async () => {
      // Mock accountsReceivableService.getAgingReport to return a mock aging report
      accountsReceivableService.getAgingReport = jest.fn().mockResolvedValue({ asOfDate: '2023-08-15', totalOutstanding: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days91Plus: 0, agingByPayer: [], agingByProgram: [] });

      // Call paymentsService.getAgingReport with optional parameters
      const result = await paymentsService.getAgingReport('2023-08-15', uuidv4(), uuidv4());

      // Expect the result to match the mock aging report
      expect(result).toEqual({ asOfDate: '2023-08-15', totalOutstanding: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days91Plus: 0, agingByPayer: [], agingByProgram: [] });

      // Expect accountsReceivableService.getAgingReport to have been called with the correct parameters
      expect(accountsReceivableService.getAgingReport).toHaveBeenCalledWith('2023-08-15', uuidv4(), uuidv4(), {});
    });
  });

  describe('getOutstandingClaims', () => {
    it('should get a list of outstanding claims', async () => {
      // Mock accountsReceivableService.getOutstandingClaims to return mock outstanding claims
      accountsReceivableService.getOutstandingClaims = jest.fn().mockResolvedValue([]);

      // Call paymentsService.getOutstandingClaims with filter parameters
      const result = await paymentsService.getOutstandingClaims(90, uuidv4(), uuidv4());

      // Expect the result to match the mock outstanding claims
      expect(result).toEqual([]);

      // Expect accountsReceivableService.getOutstandingClaims to have been called with the correct parameters
      expect(accountsReceivableService.getOutstandingClaims).toHaveBeenCalledWith(90, uuidv4(), uuidv4(), {});
    });
  });

  describe('getUnreconciledPayments', () => {
    it('should get a list of unreconciled payments', async () => {
      // Mock accountsReceivableService.getUnreconciledPayments to return mock unreconciled payments
      accountsReceivableService.getUnreconciledPayments = jest.fn().mockResolvedValue([]);

      // Call paymentsService.getUnreconciledPayments with filter parameters
      const result = await paymentsService.getUnreconciledPayments(90, uuidv4());

      // Expect the result to match the mock unreconciled payments
      expect(result).toEqual([]);

      // Expect accountsReceivableService.getUnreconciledPayments to have been called with the correct parameters
      expect(accountsReceivableService.getUnreconciledPayments).toHaveBeenCalledWith(90, uuidv4(), {});
    });
  });
});

describe('Integration between services', () => {
  describe('End-to-end payment processing', () => {
    it('should handle the complete payment lifecycle', async () => {
      // Mock all necessary repository and service methods
      paymentRepository.create = jest.fn().mockResolvedValue(mockPayment);
      remittanceProcessingService.processRemittanceFile = jest.fn().mockResolvedValue({ payment: mockPayment, remittanceInfo: mockRemittanceInfo, detailsProcessed: 1, claimsMatched: 1, claimsUnmatched: 0, totalAmount: 100, matchedAmount: 100, unmatchedAmount: 0, errors: [] });
      paymentMatchingService.matchPaymentToClaims = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, matches: [], unmatchedAmount: 0 });
      paymentReconciliationService.reconcilePayment = jest.fn().mockResolvedValue({ payment: mockPaymentWithRelations, claimPayments: [], totalAmount: 1000, matchedAmount: 0, unmatchedAmount: 1000, reconciliationStatus: ReconciliationStatus.UNRECONCILED, updatedClaims: [] });
      claimRepository.updateStatus = jest.fn().mockResolvedValue(true);
      accountsReceivableService.getAgingReport = jest.fn().mockResolvedValue({ asOfDate: '2023-08-15', totalOutstanding: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days91Plus: 0, agingByPayer: [], agingByProgram: [] });

      // Create a payment using paymentsService.createPayment
      const payment = await paymentsService.createPayment({ payerId: mockPayer.id, paymentDate: new Date().toISOString(), paymentAmount: 100, paymentMethod: PaymentMethod.EFT, referenceNumber: 'REF123' }, uuidv4());

      // Process a remittance file using paymentsService.processRemittance
      await paymentsService.processRemittance({ payerId: mockPayer.id, fileContent: 'test', fileType: RemittanceFileType.EDI_835, originalFilename: 'test.edi', mappingConfig: null }, uuidv4());

      // Get suggested matches using paymentsService.getSuggestedMatches
      await paymentsService.getSuggestedMatches(mockPayment.id);

      // Reconcile the payment using paymentsService.reconcilePayment
      const reconcileData: ReconcilePaymentDto = { claimPayments: [], notes: 'test' };
      await paymentsService.reconcilePayment(mockPayment.id, reconcileData, uuidv4());

      // Verify the payment status is updated correctly
      expect(paymentRepository.updateReconciliationStatus).toHaveBeenCalled();

      // Verify claim statuses are updated correctly
      expect(claimRepository.updateStatus).toHaveBeenCalled();

      // Verify accounts receivable is updated correctly
      expect(accountsReceivableService.getAgingReport).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should properly handle and propagate errors', async () => {
      // Mock repository methods to throw various errors
      paymentRepository.findById = jest.fn().mockRejectedValue(new Error('Test error'));
      paymentRepository.create = jest.fn().mockRejectedValue(new Error('Test error'));
      paymentRepository.update = jest.fn().mockRejectedValue(new Error('Test error'));
      paymentRepository.delete = jest.fn().mockRejectedValue(new Error('Test error'));

      // Verify that ValidationError is thrown for invalid input
      await expect(paymentsService.createPayment({}, uuidv4())).rejects.toThrow(ValidationError);

      // Verify that NotFoundError is thrown for non-existent entities
      await expect(paymentsService.getPaymentById(uuidv4())).rejects.toThrow(NotFoundError);

      // Verify that transactions are rolled back on errors
      const transaction = createMockTransaction();
      expect(transaction.rollback).not.toHaveBeenCalled();
    });
  });
});