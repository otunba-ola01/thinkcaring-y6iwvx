/**
 * Zod validation schemas for service-related data in the HCBS Revenue Management System.
 * These schemas enforce data integrity, business rules, and validation requirements
 * for service operations.
 */

import { z } from 'zod'; // v3.21.0
import { ServiceType, DocumentationStatus, BillingStatus } from '../../types/services.types';
import { StatusType } from '../../types/common.types';

/**
 * Schema for validating service creation data.
 * Enforces required fields and business rules for creating a new service.
 */
export const createServiceSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }),
  serviceTypeId: z.string().uuid({ message: 'Valid service type ID is required' }),
  serviceCode: z.string().min(1, { message: 'Service code is required' }),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Service date must be in YYYY-MM-DD format' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:MM format' }).nullable().optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:MM format' }).nullable().optional(),
  units: z.number().positive({ message: 'Units must be a positive number' }),
  rate: z.number().nonnegative({ message: 'Rate must be a non-negative number' }),
  staffId: z.string().uuid({ message: 'Valid staff ID is required' }).nullable().optional(),
  facilityId: z.string().uuid({ message: 'Valid facility ID is required' }).nullable().optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }),
  authorizationId: z.string().uuid({ message: 'Valid authorization ID is required' }).nullable().optional(),
  documentationStatus: z.nativeEnum(DocumentationStatus, { message: 'Valid documentation status is required' }),
  notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).nullable().optional(),
  documentIds: z.array(z.string().uuid({ message: 'Valid document ID is required' })).default([])
}).refine(data => !(data.startTime && data.endTime) || (data.startTime && data.endTime && data.startTime < data.endTime), {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Schema for validating service update data.
 * All fields are optional since updates may be partial.
 */
export const updateServiceSchema = z.object({
  serviceTypeId: z.string().uuid({ message: 'Valid service type ID is required' }).optional(),
  serviceCode: z.string().min(1, { message: 'Service code is required' }).optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Service date must be in YYYY-MM-DD format' }).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:MM format' }).nullable().optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:MM format' }).nullable().optional(),
  units: z.number().positive({ message: 'Units must be a positive number' }).optional(),
  rate: z.number().nonnegative({ message: 'Rate must be a non-negative number' }).optional(),
  staffId: z.string().uuid({ message: 'Valid staff ID is required' }).nullable().optional(),
  facilityId: z.string().uuid({ message: 'Valid facility ID is required' }).nullable().optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }).optional(),
  authorizationId: z.string().uuid({ message: 'Valid authorization ID is required' }).nullable().optional(),
  documentationStatus: z.nativeEnum(DocumentationStatus, { message: 'Valid documentation status is required' }).optional(),
  billingStatus: z.nativeEnum(BillingStatus, { message: 'Valid billing status is required' }).optional(),
  notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).nullable().optional(),
  documentIds: z.array(z.string().uuid({ message: 'Valid document ID is required' })).optional(),
  status: z.nativeEnum(StatusType, { message: 'Valid status is required' }).optional()
}).refine(data => !(data.startTime && data.endTime) || (data.startTime && data.endTime && data.startTime < data.endTime), {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Schema for validating service billing status updates.
 * Includes conditional validation for claim ID when status is IN_CLAIM.
 */
export const updateServiceBillingStatusSchema = z.object({
  billingStatus: z.nativeEnum(BillingStatus, { message: 'Valid billing status is required' }),
  claimId: z.string().uuid({ message: 'Valid claim ID is required' }).nullable().optional()
}).refine(data => !(data.billingStatus === BillingStatus.IN_CLAIM) || (data.billingStatus === BillingStatus.IN_CLAIM && data.claimId), {
  message: 'Claim ID is required when billing status is IN_CLAIM',
  path: ['claimId']
});

/**
 * Schema for validating service documentation status updates.
 */
export const updateServiceDocumentationStatusSchema = z.object({
  documentationStatus: z.nativeEnum(DocumentationStatus, { message: 'Valid documentation status is required' }),
  documentIds: z.array(z.string().uuid({ message: 'Valid document ID is required' })).optional()
});

/**
 * Schema for validating service query parameters.
 * Includes support for filtering, pagination, and sorting.
 */
export const serviceQuerySchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }).optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }).optional(),
  serviceTypeId: z.string().uuid({ message: 'Valid service type ID is required' }).optional(),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must be in YYYY-MM-DD format' })
  }).optional(),
  documentationStatus: z.union([
    z.nativeEnum(DocumentationStatus),
    z.array(z.nativeEnum(DocumentationStatus))
  ]).optional(),
  billingStatus: z.union([
    z.nativeEnum(BillingStatus),
    z.array(z.nativeEnum(BillingStatus))
  ]).optional(),
  status: z.nativeEnum(StatusType).optional(),
  search: z.string().optional(),
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().optional().default(20)
  }).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
}).refine(data => !data.dateRange || data.dateRange.startDate <= data.dateRange.endDate, {
  message: 'Start date must be before or equal to end date',
  path: ['dateRange']
});

/**
 * Schema for validating service validation requests.
 * Requires an array of service IDs to validate.
 */
export const serviceValidationRequestSchema = z.object({
  serviceIds: z.array(z.string().uuid({ message: 'Valid service ID is required' })).min(1, { message: 'At least one service ID is required' })
});

/**
 * Schema for validating service import data.
 * Used when importing services from external systems.
 */
export const serviceImportSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }),
  serviceTypeId: z.string().uuid({ message: 'Valid service type ID is required' }),
  serviceCode: z.string().min(1, { message: 'Service code is required' }),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Service date must be in YYYY-MM-DD format' }),
  units: z.number().positive({ message: 'Units must be a positive number' }),
  rate: z.number().nonnegative({ message: 'Rate must be a non-negative number' }),
  staffId: z.string().uuid({ message: 'Valid staff ID is required' }).nullable().optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }),
  notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).nullable().optional()
});