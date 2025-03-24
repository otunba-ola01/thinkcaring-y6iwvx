/**
 * User validation schemas for the HCBS Revenue Management System
 * 
 * This file defines Zod validation schemas for user-related operations, ensuring
 * data integrity, security requirements, and business rules for user management.
 */

import { z } from 'zod'; // zod 3.21.0
import { UserStatus } from '../../types/users.types';
import { MfaMethod, AuthProvider } from '../../types/auth.types';
import authConfig from '../../config/auth.config';

/**
 * Creates a password validation schema based on the configured password policy
 * @returns Zod string schema with password validation rules
 */
function createPasswordValidator(): z.ZodString {
  let schema = z.string().min(
    authConfig.passwordPolicy.minLength,
    { message: `Password must be at least ${authConfig.passwordPolicy.minLength} characters` }
  );

  if (authConfig.passwordPolicy.requireUppercase) {
    schema = schema.regex(
      /[A-Z]/,
      { message: 'Password must contain at least one uppercase letter' }
    );
  }

  if (authConfig.passwordPolicy.requireLowercase) {
    schema = schema.regex(
      /[a-z]/,
      { message: 'Password must contain at least one lowercase letter' }
    );
  }

  if (authConfig.passwordPolicy.requireNumbers) {
    schema = schema.regex(
      /[0-9]/,
      { message: 'Password must contain at least one number' }
    );
  }

  if (authConfig.passwordPolicy.requireSymbols) {
    schema = schema.regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      { message: 'Password must contain at least one symbol' }
    );
  }

  return schema;
}

/**
 * Schema for validating user contact information
 */
export const contactInfoSchema = z.object({
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional()
});

/**
 * Schema for validating user creation data
 */
export const createUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  password: createPasswordValidator(),
  roleId: z.string().uuid({ message: 'Invalid role ID' }),
  mfaEnabled: z.boolean().default(false),
  mfaMethod: z.nativeEnum(MfaMethod).nullable().optional(),
  contactInfo: contactInfoSchema.optional(),
  passwordResetRequired: z.boolean().default(true),
  authProvider: z.nativeEnum(AuthProvider).default(AuthProvider.LOCAL)
});

/**
 * Schema for validating user update data
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }).optional(),
  lastName: z.string().min(1, { message: 'Last name is required' }).optional(),
  roleId: z.string().uuid({ message: 'Invalid role ID' }).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  mfaEnabled: z.boolean().optional(),
  mfaMethod: z.nativeEnum(MfaMethod).nullable().optional(),
  contactInfo: contactInfoSchema.optional()
});

/**
 * Schema for validating password change requests
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: createPasswordValidator(),
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Schema for validating password reset requests
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: createPasswordValidator(),
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Schema for validating user preferences
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    inApp: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional()
});

/**
 * Schema for validating user filter parameters
 */
export const userFilterSchema = z.object({
  status: z.union([z.nativeEnum(UserStatus), z.array(z.nativeEnum(UserStatus))]).optional(),
  roleId: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
  search: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastLoginAfter: z.string().datetime().optional(),
  lastLoginBefore: z.string().datetime().optional()
});