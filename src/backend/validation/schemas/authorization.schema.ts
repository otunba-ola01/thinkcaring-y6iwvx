import { z } from 'zod'; // v3.21.0
import { AuthorizationStatus, AuthorizationFrequency } from '../../types/services.types';
import { StatusType } from '../../types/common.types';

/**
 * Schema for validating authorization creation data
 * Enforces required fields, data types, formats, and business rules for creating a new authorization
 */
export const createAuthorizationSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }),
  programId: z.string().uuid({ message: 'Valid program ID is required' }),
  number: z.string().min(1, { message: 'Authorization number is required' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must be in YYYY-MM-DD format' }),
  authorizedUnits: z.number().positive({ message: 'Authorized units must be a positive number' }),
  frequency: z.nativeEnum(AuthorizationFrequency, { message: 'Valid frequency is required' }),
  serviceTypeIds: z.array(z.string().uuid({ message: 'Valid service type ID is required' })).min(1, { message: 'At least one service type is required' }),
  status: z.nativeEnum(AuthorizationStatus).optional(),
  notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).nullable().optional(),
  documentIds: z.array(z.string().uuid({ message: 'Valid document ID is required' })).default([])
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

/**
 * Schema for validating authorization update data
 * Similar to createAuthorizationSchema but with fields marked as optional
 * to allow partial updates while maintaining validation rules
 */
export const updateAuthorizationSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }).optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }).optional(),
  number: z.string().min(1, { message: 'Authorization number is required' }).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' }).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must be in YYYY-MM-DD format' }).optional(),
  authorizedUnits: z.number().positive({ message: 'Authorized units must be a positive number' }).optional(),
  frequency: z.nativeEnum(AuthorizationFrequency, { message: 'Valid frequency is required' }).optional(),
  serviceTypeIds: z.array(z.string().uuid({ message: 'Valid service type ID is required' })).min(1, { message: 'At least one service type is required' }).optional(),
  status: z.nativeEnum(AuthorizationStatus).optional(),
  notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).nullable().optional(),
  documentIds: z.array(z.string().uuid({ message: 'Valid document ID is required' })).optional()
}).refine(data => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

/**
 * Schema for validating authorization status updates
 * Used when only changing the status of an authorization
 */
export const updateAuthorizationStatusSchema = z.object({
  status: z.nativeEnum(AuthorizationStatus, { message: 'Valid authorization status is required' })
});

/**
 * Schema for validating authorization query parameters
 * Used for filtering, sorting, and paginating authorization listings
 */
export const authorizationQuerySchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client ID is required' }).optional(),
  programId: z.string().uuid({ message: 'Valid program ID is required' }).optional(),
  serviceTypeId: z.string().uuid({ message: 'Valid service type ID is required' }).optional(),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must be in YYYY-MM-DD format' })
  }).optional(),
  status: z.union([
    z.nativeEnum(AuthorizationStatus),
    z.array(z.nativeEnum(AuthorizationStatus))
  ]).optional(),
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
 * Schema for validating authorization utilization tracking
 * Used when recording service units against an authorization
 */
export const authorizationUtilizationSchema = z.object({
  units: z.number().positive({ message: 'Units must be a positive number' }),
  isAddition: z.boolean().default(true)
});