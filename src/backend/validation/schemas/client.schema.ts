import { z } from 'zod';
import { Gender, ClientStatus, InsuranceType } from '../../types/clients.types';
import { StatusType } from '../../types/common.types';

/**
 * Validates that a string is in ISO8601 date format (YYYY-MM-DD)
 * @param dateString The string to validate
 * @returns True if the date string is valid ISO8601 format
 */
function validateDateFormat(dateString: string): boolean {
  // Regular expression for YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date by creating a Date object and verifying
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Schema for validating client address information
 */
export const addressSchema = z.object({
  street1: z.string().min(1, { message: 'Street address is required' }),
  street2: z.string().optional(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  zipCode: z.string().min(1, { message: 'Zip code is required' }),
  country: z.string().default('USA')
});

/**
 * Schema for validating client contact information
 */
export const contactInfoSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  fax: z.string().optional()
});

/**
 * Schema for validating client emergency contact information
 */
export const emergencyContactSchema = z.object({
  name: z.string().min(1, { message: 'Emergency contact name is required' }),
  relationship: z.string().min(1, { message: 'Relationship is required' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  alternatePhone: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional()
});

/**
 * Schema for validating client creation data
 */
export const createClientSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  middleName: z.string().optional(),
  dateOfBirth: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
  gender: z.nativeEnum(Gender, { message: 'Invalid gender value' }),
  medicaidId: z.string().optional(),
  medicareId: z.string().optional(),
  ssn: z.string().optional(),
  address: addressSchema,
  contactInfo: contactInfoSchema,
  emergencyContact: emergencyContactSchema.optional(),
  status: z.nativeEnum(ClientStatus, { message: 'Invalid status value' }),
  programs: z.array(
    z.object({
      programId: z.string().uuid({ message: 'Invalid program ID' }),
      startDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
      endDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
      status: z.nativeEnum(StatusType, { message: 'Invalid status value' }),
      notes: z.string().optional()
    })
  ).optional(),
  insurances: z.array(
    z.object({
      type: z.nativeEnum(InsuranceType, { message: 'Invalid insurance type' }),
      payerId: z.string().uuid({ message: 'Invalid payer ID' }).optional(),
      policyNumber: z.string().min(1, { message: 'Policy number is required' }),
      groupNumber: z.string().optional(),
      subscriberName: z.string().optional(),
      subscriberRelationship: z.string().optional(),
      effectiveDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
      terminationDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
      isPrimary: z.boolean().default(false),
      status: z.nativeEnum(StatusType, { message: 'Invalid status value' })
    })
  ).optional(),
  notes: z.string().optional()
});

/**
 * Schema for validating client update data
 */
export const updateClientSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  middleName: z.string().optional(),
  gender: z.nativeEnum(Gender, { message: 'Invalid gender value' }),
  medicaidId: z.string().optional(),
  medicareId: z.string().optional(),
  ssn: z.string().optional(),
  address: addressSchema,
  contactInfo: contactInfoSchema,
  emergencyContact: emergencyContactSchema.optional(),
  status: z.nativeEnum(ClientStatus, { message: 'Invalid status value' }),
  notes: z.string().optional()
});

/**
 * Schema for validating client status updates
 */
export const updateClientStatusSchema = z.object({
  status: z.nativeEnum(ClientStatus, { message: 'Invalid status value' }),
  reason: z.string().optional()
});

/**
 * Schema for validating client program enrollment creation
 */
export const createClientProgramSchema = z.object({
  programId: z.string().uuid({ message: 'Invalid program ID' }),
  startDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
  endDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
  status: z.nativeEnum(StatusType, { message: 'Invalid status value' }),
  notes: z.string().optional()
});

/**
 * Schema for validating client program enrollment updates
 */
export const updateClientProgramSchema = z.object({
  startDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
  endDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
  status: z.nativeEnum(StatusType, { message: 'Invalid status value' }),
  notes: z.string().optional()
});

/**
 * Schema for validating client insurance creation
 */
export const createClientInsuranceSchema = z.object({
  type: z.nativeEnum(InsuranceType, { message: 'Invalid insurance type' }),
  payerId: z.string().uuid({ message: 'Invalid payer ID' }).optional(),
  policyNumber: z.string().min(1, { message: 'Policy number is required' }),
  groupNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberRelationship: z.string().optional(),
  effectiveDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
  terminationDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
  isPrimary: z.boolean().default(false),
  status: z.nativeEnum(StatusType, { message: 'Invalid status value' })
});

/**
 * Schema for validating client insurance updates
 */
export const updateClientInsuranceSchema = z.object({
  type: z.nativeEnum(InsuranceType, { message: 'Invalid insurance type' }),
  payerId: z.string().uuid({ message: 'Invalid payer ID' }).optional(),
  policyNumber: z.string().min(1, { message: 'Policy number is required' }),
  groupNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberRelationship: z.string().optional(),
  effectiveDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }),
  terminationDate: z.string().refine(validateDateFormat, { message: 'Invalid date format. Use ISO8601 (YYYY-MM-DD)' }).optional(),
  isPrimary: z.boolean(),
  status: z.nativeEnum(StatusType, { message: 'Invalid status value' })
});

/**
 * Schema for validating client query parameters
 */
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  status: z.union([
    z.nativeEnum(ClientStatus),
    z.array(z.nativeEnum(ClientStatus))
  ]).optional(),
  programId: z.string().uuid({ message: 'Invalid program ID' }).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20)
});