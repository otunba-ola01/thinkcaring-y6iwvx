/**
 * Defines Zod validation schemas for payment-related data in the HCBS Revenue Management System.
 * These schemas enforce data integrity, validation rules, and business logic for payment creation,
 * updates, reconciliation, remittance processing, and query operations.
 * 
 * @module validation/schemas/payment
 */

import { z } from 'zod'; // v3.21.0
import { ReconciliationStatus, AdjustmentType, RemittanceFileType } from '../../types/payments.types';
import { PaymentMethod, DateRange } from '../../types/common.types';

/**
 * Schema for validating payment adjustment data with required fields for adjustment type,
 * code, and amount.
 */
export const paymentAdjustmentSchema = z.object({
  adjustmentType: z.nativeEnum(AdjustmentType, { message: 'Valid adjustment type is required' }),
  adjustmentCode: z.string().min(1).max(20, { message: 'Adjustment code must be between 1 and 20 characters' }),
  adjustmentAmount: z.number().refine(val => val !== 0, { message: 'Adjustment amount cannot be zero' }),
  description: z.string().max(255).nullable().optional()
});

/**
 * Schema for validating payment creation data with required fields and conditional validation
 * for payment method. Enforces business rules such as requiring check numbers for check payments
 * and reference numbers for EFT payments.
 */
export const createPaymentSchema = z.object({
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }),
  paymentDate: z.string().datetime({ message: 'Valid payment date is required' }),
  paymentAmount: z.number().positive({ message: 'Payment amount must be greater than zero' }),
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Valid payment method is required' }),
  referenceNumber: z.string().max(50).nullable().optional(),
  checkNumber: z.string().max(50).nullable().optional(),
  remittanceId: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
}).refine(data => {
  // If payment method is CHECK, checkNumber is required
  if (data.paymentMethod === PaymentMethod.CHECK && !data.checkNumber) {
    return false;
  }
  // If payment method is EFT, referenceNumber is required
  if (data.paymentMethod === PaymentMethod.EFT && !data.referenceNumber) {
    return false;
  }
  return true;
}, {
  message: 'Additional information is required based on the selected payment method',
  path: ['paymentMethod']
});

/**
 * Schema for validating payment update data with optional fields and conditional validation
 * for payment method. Similar to createPaymentSchema but allows partial updates.
 */
export const updatePaymentSchema = z.object({
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }).optional(),
  paymentDate: z.string().datetime({ message: 'Valid payment date is required' }).optional(),
  paymentAmount: z.number().positive({ message: 'Payment amount must be greater than zero' }).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Valid payment method is required' }).optional(),
  referenceNumber: z.string().max(50).nullable().optional(),
  checkNumber: z.string().max(50).nullable().optional(),
  remittanceId: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
}).refine(data => {
  // If payment method is CHECK, checkNumber is required
  if (data.paymentMethod === PaymentMethod.CHECK && data.checkNumber === undefined) {
    return false;
  }
  // If payment method is EFT, referenceNumber is required
  if (data.paymentMethod === PaymentMethod.EFT && data.referenceNumber === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Additional information is required based on the selected payment method',
  path: ['paymentMethod']
});

/**
 * Schema for validating claim payment association data with required claim ID and paid amount.
 * Allows optional array of payment adjustments.
 */
export const claimPaymentSchema = z.object({
  claimId: z.string().uuid({ message: 'Valid claim ID is required' }),
  paidAmount: z.number().refine(val => val > 0, { message: 'Paid amount must be greater than zero' }),
  adjustments: z.array(paymentAdjustmentSchema).optional()
});

/**
 * Schema for validating payment reconciliation data with array of claim payments.
 * Requires at least one claim payment for reconciliation.
 */
export const reconcilePaymentSchema = z.object({
  claimPayments: z.array(z.object({
    claimId: z.string().uuid({ message: 'Valid claim ID is required' }),
    amount: z.number().positive({ message: 'Amount must be greater than zero' }),
    adjustments: z.array(paymentAdjustmentSchema).optional()
  })).min(1, { message: 'At least one claim payment is required' }),
  notes: z.string().max(1000).nullable().optional()
});

/**
 * Schema for validating remittance import data with required payer ID, file content,
 * and file type. Supports file content as either string or Buffer.
 */
export const importRemittanceSchema = z.object({
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }),
  fileContent: z.union([
    z.string(),
    z.instanceof(Buffer)
  ], { message: 'File content must be provided as string or buffer' }),
  fileType: z.nativeEnum(RemittanceFileType, { message: 'Valid file type is required' }),
  originalFilename: z.string().min(1, { message: 'Original filename is required' }),
  mappingConfig: z.record(z.string(), z.string()).nullable().optional()
});

/**
 * Schema for validating payment query parameters with optional filters, pagination,
 * and sorting. Supports filtering by reconciliation status, payment method, and date range.
 */
export const paymentQuerySchema = z.object({
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(20)
  }).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional(),
  search: z.string().optional(),
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }).optional(),
  reconciliationStatus: z.union([
    z.nativeEnum(ReconciliationStatus),
    z.array(z.nativeEnum(ReconciliationStatus))
  ]).optional(),
  paymentMethod: z.union([
    z.nativeEnum(PaymentMethod),
    z.array(z.nativeEnum(PaymentMethod))
  ]).optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).optional(),
  includeRemittance: z.boolean().optional()
});