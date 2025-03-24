/**
 * Payment Validation Middleware for the HCBS Revenue Management System.
 * 
 * This file provides middleware functions that validate payment-related requests
 * against predefined Zod schemas. These functions ensure that all incoming data
 * meets the required format and business rules before being processed by the controllers.
 * 
 * The validation middleware helps to:
 * - Ensure data integrity and consistency
 * - Prevent invalid data from reaching the database
 * - Provide clear feedback to clients about validation errors
 * - Enforce business rules for payment operations
 * 
 * @module validation/payment
 */

import { validateBody, validateQuery, validateParamsAndBody } from '../middleware/validation.middleware';
import { 
  createPaymentSchema, 
  updatePaymentSchema, 
  reconcilePaymentSchema, 
  importRemittanceSchema, 
  paymentQuerySchema 
} from './schemas/payment.schema';
import { z } from 'zod'; // version 3.21+
import { RequestHandler } from 'express'; // version 4.18+

// Schema for validating payment ID in route parameters
const paymentIdSchema = z.object({
  id: z.string().uuid({ message: 'Valid payment ID is required' })
});

/**
 * Validates request body for payment creation
 * 
 * Ensures that the request contains all required fields for creating a payment,
 * such as payer ID, payment date, amount, and method. Also verifies conditional
 * requirements like check numbers for check payments and reference numbers for EFT.
 * 
 * @returns Express middleware function that validates payment creation data
 */
export const validateCreatePayment: RequestHandler = validateBody(createPaymentSchema);

/**
 * Validates request parameters and body for payment updates
 * 
 * Verifies that the request contains a valid payment ID in the route parameters
 * and that the update data meets the schema requirements. Supports partial updates
 * while still enforcing business rules like payment method-specific fields.
 * 
 * @returns Express middleware function that validates payment update data
 */
export const validateUpdatePayment: RequestHandler = validateParamsAndBody(
  paymentIdSchema,
  updatePaymentSchema
);

/**
 * Validates request parameters and body for payment reconciliation
 * 
 * Ensures the request contains a valid payment ID and reconciliation data, including
 * an array of claim payments with valid amounts. Validates that at least one claim
 * payment is provided for reconciliation.
 * 
 * @returns Express middleware function that validates payment reconciliation data
 */
export const validateReconcilePayment: RequestHandler = validateParamsAndBody(
  paymentIdSchema,
  reconcilePaymentSchema
);

/**
 * Validates request body for remittance advice import
 * 
 * Verifies that the request contains all required data for importing a remittance advice,
 * including valid payer ID, file content, and file type. Supports multiple file formats
 * and validates the content structure.
 * 
 * @returns Express middleware function that validates remittance import data
 */
export const validateImportRemittance: RequestHandler = validateBody(importRemittanceSchema);

/**
 * Validates request query parameters for payment listing and filtering
 * 
 * Ensures that query parameters for pagination, sorting, filtering, and search are
 * properly formatted. Validates filters like date ranges, reconciliation status,
 * and payment method.
 * 
 * @returns Express middleware function that validates payment query parameters
 */
export const validatePaymentQuery: RequestHandler = validateQuery(paymentQuerySchema);