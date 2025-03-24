/**
 * Defines Zod validation schemas for claim-related data in the HCBS Revenue Management System.
 * These schemas enforce data integrity, validation rules, and business logic for claim creation,
 * updates, status changes, submission, batch processing, and query operations.
 * 
 * @module validation/schemas/claim
 */

import { z } from 'zod'; // v3.21.0
import { ClaimStatus, ClaimType, SubmissionMethod, DenialReason } from '../../types/claims.types';
import { DateRange } from '../../types/common.types';

/**
 * Schema for validating claim creation data
 * Requires client ID, payer ID, claim type, and at least one service ID
 * Implements business rule: originalClaimId is required for non-original claims
 */
export const createClaimSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }),
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }),
  claimType: z.nativeEnum(ClaimType, { message: 'Valid claim type is required' }),
  serviceIds: z.array(z.string().uuid()).min(1, { message: 'At least one service is required' }),
  originalClaimId: z.string().uuid({ message: 'Valid original claim ID is required' }).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
}).refine(data => {
  // If claim type is ADJUSTMENT, REPLACEMENT, or VOID, originalClaimId is required
  if (data.claimType !== ClaimType.ORIGINAL && !data.originalClaimId) {
    return false;
  }
  return true;
}, {
  message: 'Original claim ID is required for adjustment, replacement, or void claims',
  path: ['originalClaimId']
});

/**
 * Schema for validating claim update data
 * All fields are optional as updates may target specific fields
 */
export const updateClaimSchema = z.object({
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }).optional(),
  serviceIds: z.array(z.string().uuid()).min(1, { message: 'At least one service is required' }).optional(),
  notes: z.string().max(1000).nullable().optional()
});

/**
 * Schema for validating claim status update data
 * Implements business rules:
 * - Denied claims require a denial reason
 * - Paid/partial paid claims require an adjudication date
 */
export const updateClaimStatusSchema = z.object({
  status: z.nativeEnum(ClaimStatus, { message: 'Valid claim status is required' }),
  adjudicationDate: z.string().datetime({ message: 'Valid adjudication date is required' }).nullable().optional(),
  denialReason: z.nativeEnum(DenialReason, { message: 'Valid denial reason is required' }).nullable().optional(),
  denialDetails: z.string().max(1000).nullable().optional(),
  adjustmentCodes: z.record(z.string(), z.string()).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
}).refine(data => {
  // If status is DENIED, denialReason is required
  if (data.status === ClaimStatus.DENIED && !data.denialReason) {
    return false;
  }
  // If status is PAID or PARTIAL_PAID, adjudicationDate is required
  if ((data.status === ClaimStatus.PAID || data.status === ClaimStatus.PARTIAL_PAID) && !data.adjudicationDate) {
    return false;
  }
  return true;
}, {
  message: 'Additional information is required based on the selected status',
  path: ['status']
});

/**
 * Schema for validating claim submission data
 * Requires submission method and date
 */
export const submitClaimSchema = z.object({
  submissionMethod: z.nativeEnum(SubmissionMethod, { message: 'Valid submission method is required' }),
  submissionDate: z.string().datetime({ message: 'Valid submission date is required' }),
  externalClaimId: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
});

/**
 * Schema for validating batch claim submission data
 * Requires array of claim IDs, submission method, and date
 */
export const batchSubmitClaimsSchema = z.object({
  claimIds: z.array(z.string().uuid()).min(1, { message: 'At least one claim ID is required' }),
  submissionMethod: z.nativeEnum(SubmissionMethod, { message: 'Valid submission method is required' }),
  submissionDate: z.string().datetime({ message: 'Valid submission date is required' }),
  notes: z.string().max(1000).nullable().optional()
});

/**
 * Schema for validating claim validation requests
 * Requires the claim ID to validate
 */
export const claimValidationRequestSchema = z.object({
  claimId: z.string().uuid({ message: 'Valid claim ID is required' })
});

/**
 * Schema for validating claim query parameters
 * Supports filtering, pagination, sorting, and including related data
 */
export const claimQuerySchema = z.object({
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(20)
  }).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional(),
  search: z.string().optional(),
  clientId: z.string().uuid({ message: 'Valid client ID is required' }).optional(),
  payerId: z.string().uuid({ message: 'Valid payer ID is required' }).optional(),
  claimStatus: z.union([
    z.nativeEnum(ClaimStatus),
    z.array(z.nativeEnum(ClaimStatus))
  ]).optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).optional(),
  claimType: z.nativeEnum(ClaimType).optional(),
  includeServices: z.boolean().optional(),
  includeStatusHistory: z.boolean().optional()
});