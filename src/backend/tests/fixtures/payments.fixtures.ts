import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { UUID, ISO8601Date, Money, StatusType } from '../../types/common.types';
import {
  Payment,
  PaymentWithRelations,
  PaymentSummary,
  ReconciliationStatus,
  PaymentMethod,
  ClaimPayment,
  PaymentAdjustment,
  AdjustmentType,
  RemittanceInfo,
  RemittanceFileType
} from '../../types/payments.types';
import { mockMedicaidPayer, mockMedicarePayer, mockPrivateInsurancePayer } from './payers.fixtures';
import { mockClaimSummary, mockClaimSummaries } from './claims.fixtures';

/**
 * Creates a mock payment adjustment object for testing
 * @param overrides - Optional overrides for payment adjustment properties
 * @param claimPaymentId - UUID of the claim payment to associate with the adjustment
 * @returns A complete mock payment adjustment object
 */
function createMockPaymentAdjustment(
  overrides: Partial<PaymentAdjustment> = {},
  claimPaymentId: UUID = uuidv4()
): PaymentAdjustment {
  // Generate a UUID for the adjustment if not provided
  const id: UUID = overrides.id || uuidv4();

  // Use the provided claimPaymentId or generate one if not provided
  const claimPaymentIdValue: UUID = overrides.claimPaymentId || claimPaymentId;

  // Set default adjustment type to CONTRACTUAL if not provided
  const adjustmentType: AdjustmentType = overrides.adjustmentType || AdjustmentType.CONTRACTUAL;

  // Set default adjustment code if not provided
  const adjustmentCode: string = overrides.adjustmentCode || 'CO-45';

  // Set default adjustment amount if not provided
  const adjustmentAmount: Money = overrides.adjustmentAmount || 10.00;

  // Set default description to null if not provided
  const description: string | null = overrides.description || null;

  // Set default status to ACTIVE if not provided
  const status: StatusType = overrides.status || StatusType.ACTIVE;

  // Set default created and updated timestamps
  const createdAt: ISO8601Date = new Date().toISOString();
  const updatedAt: ISO8601Date = new Date().toISOString();

  // Apply any provided overrides to the default adjustment
  const adjustment: PaymentAdjustment = {
    id,
    claimPaymentId: claimPaymentIdValue,
    adjustmentType,
    adjustmentCode,
    adjustmentAmount,
    description,
    status,
    createdAt,
    updatedAt,
    ...overrides,
  };

  // Return the complete adjustment object
  return adjustment;
}

/**
 * Creates a mock claim payment association for testing
 * @param overrides - Optional overrides for claim payment properties
 * @param paymentId - UUID of the payment to associate with the claim
 * @param claimId - UUID of the claim to associate with the payment
 * @returns A complete mock claim payment association
 */
function createMockClaimPayment(
  overrides: Partial<ClaimPayment> = {},
  paymentId: UUID = uuidv4(),
  claimId: UUID = mockClaimSummary.id
): ClaimPayment {
  // Generate a UUID for the claim payment if not provided
  const id: UUID = overrides.id || uuidv4();

  // Use the provided paymentId or generate one if not provided
  const paymentIdValue: UUID = overrides.paymentId || paymentId;

  // Use the provided claimId or use mockClaimSummary.id if not provided
  const claimIdValue: UUID = overrides.claimId || claimId;

  // Set default paid amount if not provided
  const paidAmount: Money = overrides.paidAmount || 50.00;

  // Set default claim reference using mockClaimSummary if not provided
  const claim = mockClaimSummary;

  // Set default adjustments to empty array if not provided
  const adjustments: PaymentAdjustment[] = overrides.adjustments || [];

  // Set default status to ACTIVE if not provided
  const status: StatusType = overrides.status || StatusType.ACTIVE;

  // Set default created and updated timestamps
  const createdAt: ISO8601Date = new Date().toISOString();
  const updatedAt: ISO8601Date = new Date().toISOString();

  // Apply any provided overrides to the default claim payment
  const claimPayment: ClaimPayment = {
    id,
    paymentId: paymentIdValue,
    claimId: claimIdValue,
    paidAmount,
    claim,
    adjustments,
    status,
    createdAt,
    updatedAt,
    ...overrides,
  };

  // Return the complete claim payment object
  return claimPayment;
}

/**
 * Creates a mock remittance information object for testing
 * @param overrides - Optional overrides for remittance information properties
 * @param paymentId - UUID of the payment to associate with the remittance info
 * @returns A complete mock remittance information object
 */
function createMockRemittanceInfo(
  overrides: Partial<RemittanceInfo> = {},
  paymentId: UUID = uuidv4()
): RemittanceInfo {
  // Generate a UUID for the remittance info if not provided
  const id: UUID = overrides.id || uuidv4();

  // Use the provided paymentId or generate one if not provided
  const paymentIdValue: UUID = overrides.paymentId || paymentId;

  // Set default remittance number if not provided
  const remittanceNumber: string = overrides.remittanceNumber || 'REM12345';

  // Set default remittance date if not provided
  const remittanceDate: ISO8601Date = overrides.remittanceDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default payer identifier if not provided
  const payerIdentifier: string = overrides.payerIdentifier || 'PAYER001';

  // Set default payer name if not provided
  const payerName: string = overrides.payerName || 'State Medicaid';

  // Set default total amount if not provided
  const totalAmount: Money = overrides.totalAmount || 1000.00;

  // Set default claim count if not provided
  const claimCount: number = overrides.claimCount || 10;

  // Set default file type to EDI_835 if not provided
  const fileType: RemittanceFileType = overrides.fileType || RemittanceFileType.EDI_835;

  // Set default original filename if not provided
  const originalFilename: string | null = overrides.originalFilename || 'remittance.edi';

  // Set default storage location if not provided
  const storageLocation: string | null = overrides.storageLocation || '/path/to/remittance.edi';

  // Set default status to ACTIVE if not provided
  const status: StatusType = overrides.status || StatusType.ACTIVE;

  // Set default created and updated timestamps
  const createdAt: ISO8601Date = new Date().toISOString();
  const updatedAt: ISO8601Date = new Date().toISOString();

  // Apply any provided overrides to the default remittance info
  const remittanceInfo: RemittanceInfo = {
    id,
    paymentId: paymentIdValue,
    remittanceNumber,
    remittanceDate,
    payerIdentifier,
    payerName,
    totalAmount,
    claimCount,
    fileType,
    originalFilename,
    storageLocation,
    status,
    createdAt,
    updatedAt,
    ...overrides,
  };

  // Return the complete remittance info object
  return remittanceInfo;
}

/**
 * Creates a complete mock payment object for testing
 * @param overrides - Optional overrides for payment properties
 * @returns A complete mock payment object with all required properties
 */
function createMockPayment(overrides: Partial<Payment> = {}): Payment {
  // Generate a UUID for the payment if not provided
  const id: UUID = overrides.id || uuidv4();

  // Set default payer ID from mockMedicaidPayer if not provided
  const payerId: UUID = overrides.payerId || mockMedicaidPayer.id;

  // Set default payment date to current date if not provided
  const paymentDate: ISO8601Date = overrides.paymentDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default payment amount if not provided
  const paymentAmount: Money = overrides.paymentAmount || 1000.00;

  // Set default payment method to EFT if not provided
  const paymentMethod: PaymentMethod = overrides.paymentMethod || PaymentMethod.EFT;

  // Set default reference number if not provided
  const referenceNumber: string = overrides.referenceNumber || 'REF12345';

  // Set default check number to null if not provided
  const checkNumber: string | null = overrides.checkNumber || null;

  // Set default remittance ID to null if not provided
  const remittanceId: string | null = overrides.remittanceId || null;

  // Set default reconciliation status to UNRECONCILED if not provided
  const reconciliationStatus: ReconciliationStatus = overrides.reconciliationStatus || ReconciliationStatus.UNRECONCILED;

  // Set default notes to null if not provided
  const notes: string | null = overrides.notes || null;

  // Set default status to ACTIVE if not provided
  const status: StatusType = overrides.status || StatusType.ACTIVE;

  // Set default created and updated timestamps
  const createdAt: ISO8601Date = new Date().toISOString();
  const updatedAt: ISO8601Date = new Date().toISOString();

  // Set default created by and updated by to null if not provided
  const createdBy: UUID | null = overrides.createdBy || null;
  const updatedBy: UUID | null = overrides.updatedBy || null;

  // Apply any provided overrides to the default payment
  const payment: Payment = {
    id,
    payerId,
    paymentDate,
    paymentAmount,
    paymentMethod,
    referenceNumber,
    checkNumber,
    remittanceId,
    reconciliationStatus,
    notes,
    status,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    ...overrides,
  };

  // Return the complete payment object
  return payment;
}

/**
 * Creates a mock payment with related entities for testing
 * @param overrides - Optional overrides for payment properties
 * @returns A complete mock payment with related entities
 */
function createMockPaymentWithRelations(overrides: Partial<PaymentWithRelations> = {}): PaymentWithRelations {
  // Create a base payment using createMockPayment
  const basePayment: Payment = createMockPayment(overrides);

  // Add mock payer reference if not provided
  const payer = mockMedicaidPayer;

  // Add mock claim payments array if not provided
  const claimPayments: ClaimPayment[] = overrides.claimPayments || [];

  // Add mock remittance info if not provided
  const remittanceInfo: RemittanceInfo | null = overrides.remittanceInfo || null;

  // Apply any provided overrides to the payment with relations
  const paymentWithRelations: PaymentWithRelations = {
    ...basePayment,
    payerId: payer.id,
    payer: {
      id: payer.id,
      name: payer.name,
      payerType: payer.payerType
    },
    paymentDate: basePayment.paymentDate,
    paymentAmount: basePayment.paymentAmount,
    paymentMethod: basePayment.paymentMethod,
    referenceNumber: basePayment.referenceNumber,
    checkNumber: basePayment.checkNumber,
    remittanceId: basePayment.remittanceId,
    reconciliationStatus: basePayment.reconciliationStatus,
    claimPayments: claimPayments,
    remittanceInfo: remittanceInfo,
    notes: basePayment.notes,
    status: basePayment.status,
    createdAt: basePayment.createdAt,
    updatedAt: basePayment.updatedAt,
    createdBy: basePayment.createdBy,
    updatedBy: basePayment.updatedBy,
    ...overrides,
  } as PaymentWithRelations;

  // Return the complete payment with relations object
  return paymentWithRelations;
}

/**
 * Creates a mock payment summary object for testing
 * @param overrides - Optional overrides for payment summary properties
 * @returns A complete mock payment summary object
 */
function createMockPaymentSummary(overrides: Partial<PaymentSummary> = {}): PaymentSummary {
  // Generate a UUID for the payment if not provided
  const id: UUID = overrides.id || uuidv4();

  // Set default payer ID and name if not provided
  const payerId: UUID = overrides.payerId || mockMedicaidPayer.id;
  const payerName: string = overrides.payerName || mockMedicaidPayer.name;

  // Set default payment date if not provided
  const paymentDate: ISO8601Date = overrides.paymentDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default payment amount if not provided
  const paymentAmount: Money = overrides.paymentAmount || 1000.00;

  // Set default payment method if not provided
  const paymentMethod: PaymentMethod = overrides.paymentMethod || PaymentMethod.EFT;

  // Set default reference number if not provided
  const referenceNumber: string | null = overrides.referenceNumber || 'REF12345';

  // Set default reconciliation status to UNRECONCILED if not provided
  const reconciliationStatus: ReconciliationStatus = overrides.reconciliationStatus || ReconciliationStatus.UNRECONCILED;

  // Set default claim count if not provided
  const claimCount: number = overrides.claimCount || 0;

  // Apply any provided overrides to the default payment summary
  const paymentSummary: PaymentSummary = {
    id,
    payerId,
    payerName,
    paymentDate,
    paymentAmount,
    paymentMethod,
    referenceNumber,
    reconciliationStatus,
    claimCount,
    ...overrides,
  };

  // Return the complete payment summary object
  return paymentSummary;
}

/**
 * Creates an array of mock payment objects for testing
 * @param count - Number of mock payments to create
 * @param overrides - Optional overrides to apply to all payments
 * @returns An array of mock payment objects
 */
function createMockPayments(count: number, overrides: Partial<Payment> = {}): Payment[] {
  // Create an empty array to hold the payments
  const payments: Payment[] = [];

  // Loop 'count' times to create the specified number of payments
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockPayment with the provided overrides
    const payment: Payment = createMockPayment({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created payment to the array
    payments.push(payment);
  }

  // Return the array of mock payments
  return payments;
}

/**
 * Creates an array of mock payments with relations for testing
 * @param count - Number of mock payments to create
 * @param overrides - Optional overrides to apply to all payments
 * @returns An array of mock payments with relations
 */
function createMockPaymentsWithRelations(count: number, overrides: Partial<PaymentWithRelations> = {}): PaymentWithRelations[] {
  // Create an empty array to hold the payments with relations
  const payments: PaymentWithRelations[] = [];

  // Loop 'count' times to create the specified number of payments
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockPaymentWithRelations with the provided overrides
    const payment: PaymentWithRelations = createMockPaymentWithRelations({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created payment to the array
    payments.push(payment);
  }

  // Return the array of mock payments with relations
  return payments;
}

/**
 * Creates an array of mock payment summary objects for testing
 * @param count - Number of mock payment summaries to create
 * @param overrides - Optional overrides to apply to all payment summaries
 * @returns An array of mock payment summary objects
 */
function createMockPaymentSummaries(count: number, overrides: Partial<PaymentSummary> = {}): PaymentSummary[] {
  // Create an empty array to hold the payment summaries
  const paymentSummaries: PaymentSummary[] = [];

  // Loop 'count' times to create the specified number of payment summaries
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockPaymentSummary with the provided overrides
    const paymentSummary: PaymentSummary = createMockPaymentSummary({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created payment summary to the array
    paymentSummaries.push(paymentSummary);
  }

  // Return the array of mock payment summaries
  return paymentSummaries;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock payment for testing
 */
export const mockPayment: Payment = createMockPayment();

/**
 * Mock payment with relations for testing
 */
export const mockPaymentWithRelations: PaymentWithRelations = createMockPaymentWithRelations();

/**
 * Mock payment summary for testing
 */
export const mockPaymentSummary: PaymentSummary = createMockPaymentSummary();

/**
 * Mock unreconciled payment for testing
 */
export const mockUnreconciledPayment: Payment = createMockPayment({
  reconciliationStatus: ReconciliationStatus.UNRECONCILED
});

/**
 * Mock partially reconciled payment for testing
 */
export const mockPartiallyReconciledPayment: PaymentWithRelations = createMockPaymentWithRelations({
  reconciliationStatus: ReconciliationStatus.PARTIALLY_RECONCILED,
  claimPayments: [createMockClaimPayment()]
});

/**
 * Mock fully reconciled payment for testing
 */
export const mockReconciledPayment: PaymentWithRelations = createMockPaymentWithRelations({
  reconciliationStatus: ReconciliationStatus.RECONCILED,
  claimPayments: [createMockClaimPayment()]
});

/**
 * Mock payment with reconciliation exception for testing
 */
export const mockExceptionPayment: PaymentWithRelations = createMockPaymentWithRelations({
  reconciliationStatus: ReconciliationStatus.EXCEPTION,
  claimPayments: [createMockClaimPayment()],
  notes: 'Payment requires manual review due to discrepancies'
});

/**
 * Mock claim payment association for testing
 */
export const mockClaimPayment: ClaimPayment = createMockClaimPayment();

/**
 * Mock payment adjustment for testing
 */
export const mockPaymentAdjustment: PaymentAdjustment = createMockPaymentAdjustment();

/**
 * Mock remittance information for testing
 */
export const mockRemittanceInfo: RemittanceInfo = createMockRemittanceInfo();

/**
 * Array of mock payments for testing
 */
export const mockPayments: Payment[] = createMockPayments(5);

/**
 * Array of mock payments with relations for testing
 */
export const mockPaymentsWithRelations: PaymentWithRelations[] = createMockPaymentsWithRelations(5);

/**
 * Array of mock payment summaries for testing
 */
export const mockPaymentSummaries: PaymentSummary[] = createMockPaymentSummaries(5);

export {
  createMockPaymentAdjustment,
  createMockClaimPayment,
  createMockRemittanceInfo,
  createMockPayment,
  createMockPaymentWithRelations,
  createMockPaymentSummary,
  createMockPayments,
  createMockPaymentsWithRelations,
  createMockPaymentSummaries
};