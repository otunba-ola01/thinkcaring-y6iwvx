/**
 * Implements core authentication functionality for the HCBS Revenue Management System.
 * This module provides methods for multi-factor authentication, password validation,
 * and secure authentication workflows to protect sensitive healthcare financial data
 * in compliance with HIPAA requirements.
 */

// Node.js built-in modules
import * as crypto from 'crypto'; // Node.js crypto module for secure random generation

// Third-party dependencies
import * as speakeasy from 'speakeasy'; // speakeasy ^2.0.0
import * as qrcode from 'qrcode'; // qrcode ^1.5.3
import * as bcrypt from 'bcrypt'; // bcrypt ^5.1.0

// Internal imports
import { auth } from '../config'; // Import authentication configuration settings
import { AuthError } from '../errors/auth-error'; // Import authentication error handling
import { logger } from '../utils/logger'; // Import logging functionality
import { auditLog } from './audit-logging'; // Import audit logging functionality
import { validatePasswordStrength } from './passwordPolicy'; // Import password validation functionality
import { MfaMethod } from '../types/auth.types'; // Import MFA method enum
import { db } from '../database/connection'; // Import database connection for MFA storage
import { UUID } from '../types/common.types';

/**
 * Generates a new TOTP secret for multi-factor authentication setup
 * 
 * @returns Base32 encoded TOTP secret
 */
export function generateTOTPSecret(): string {
  try {
    // Generate a secure random TOTP secret using speakeasy
    const secret = speakeasy.generateSecret({ length: 20 });
    return secret.base32;
  } catch (error) {
    logger.error('Failed to generate TOTP secret', { error });
    throw AuthError.authenticationFailed('Failed to generate TOTP secret');
  }
}

/**
 * Generates a time-based one-time password for a given secret
 * 
 * @param secret Base32 encoded TOTP secret
 * @returns 6-digit TOTP code
 */
export function generateTOTP(secret: string): string {
  try {
    // Validate the secret format
    if (!secret) {
      throw new Error('Secret is required');
    }
    
    // Generate a TOTP code using speakeasy with the provided secret
    const token = speakeasy.totp({
      secret,
      encoding: 'base32',
      digits: 6
    });
    
    // Ensure the code is 6 digits with leading zeros if needed
    return token.padStart(6, '0');
  } catch (error) {
    logger.error('Failed to generate TOTP', { error });
    throw AuthError.authenticationFailed('Failed to generate TOTP');
  }
}

/**
 * Verifies a TOTP code against a secret
 * 
 * @param token The TOTP code to verify
 * @param secret The base32 encoded secret
 * @returns True if token is valid, false otherwise
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    // Validate the token format (6-digit numeric)
    if (!token || !secret || !/^\d{6}$/.test(token)) {
      return false;
    }
    
    // Verify the token against the secret using speakeasy
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow for time skew based on configuration (default ±30 seconds)
      digits: 6
    });
    
    // Log verification attempt with masked token for audit purposes
    logger.debug('TOTP verification attempt', { 
      verified, 
      tokenMasked: `${token.substring(0, 2)}***` 
    });
    
    return verified;
  } catch (error) {
    logger.error('Failed to verify TOTP', { error });
    return false;
  }
}

/**
 * Generates a QR code URL for TOTP setup in authenticator apps
 * 
 * @param secret The base32 encoded secret
 * @param accountName The user's account name/email
 * @param issuer The name of the issuing application
 * @returns Data URL of the QR code image
 */
export async function generateTOTPQRCode(
  secret: string,
  accountName: string,
  issuer: string = 'HCBS Revenue Management'
): Promise<string> {
  try {
    // Create an otpauth URL with the secret, account name, and issuer
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: encodeURIComponent(accountName),
      issuer: encodeURIComponent(issuer),
      encoding: 'base32'
    });
    
    // Generate a QR code image from the URL using qrcode library
    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return qrCode;
  } catch (error) {
    logger.error('Failed to generate TOTP QR code', { error, accountName });
    throw AuthError.authenticationFailed('Failed to generate TOTP QR code');
  }
}

/**
 * Generates a random numeric code for SMS-based authentication
 * 
 * @param length Length of the code to generate
 * @returns Numeric code for SMS verification
 */
export function generateSMSCode(length: number = 6): string {
  try {
    // Generate a secure random numeric code of specified length
    const randomBytes = crypto.randomBytes(length);
    
    // Convert bytes to numeric digits
    let code = '';
    for (let i = 0; i < length; i++) {
      code += randomBytes[i] % 10; // 0-9
    }
    
    // Ensure the code starts with a non-zero digit
    if (code.charAt(0) === '0') {
      code = String(1 + parseInt(code.charAt(0))) + code.substring(1);
    }
    
    return code;
  } catch (error) {
    logger.error('Failed to generate SMS code', { error, length });
    throw AuthError.authenticationFailed('Failed to generate SMS verification code');
  }
}

/**
 * Generates a random alphanumeric code for email-based authentication
 * 
 * @param length Length of the code to generate
 * @returns Alphanumeric code for email verification
 */
export function generateEmailCode(length: number = 8): string {
  try {
    // Generate a secure random alphanumeric code of specified length
    // Exclude ambiguous characters (0, O, 1, I, etc.) to avoid confusion
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    
    const randomBytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += charset[randomBytes[i] % charset.length];
    }
    
    return code;
  } catch (error) {
    logger.error('Failed to generate email code', { error, length });
    throw AuthError.authenticationFailed('Failed to generate email verification code');
  }
}

/**
 * Stores an MFA code in the database for later verification
 * 
 * @param userId User ID the code belongs to
 * @param code The MFA code to store
 * @param method The MFA method being used
 * @param expirationMinutes Minutes until the code expires
 * @returns True if code was successfully stored
 */
export async function storeMfaCode(
  userId: UUID,
  code: string,
  method: MfaMethod,
  expirationMinutes: number = 10
): Promise<boolean> {
  try {
    // Hash the code for secure storage
    const hashedCode = await bcrypt.hash(code, 10);
    
    // Calculate expiration timestamp based on current time and expiration minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
    
    // Store the hashed code, user ID, method, and expiration in the database
    await db.query(async (knex) => {
      return await knex('mfa_codes').insert({
        user_id: userId,
        code_hash: hashedCode,
        method,
        expires_at: expiresAt,
        created_at: new Date()
      });
    });
    
    logger.debug('Stored MFA code', { userId, method, expiresAt });
    return true;
  } catch (error) {
    logger.error('Failed to store MFA code', { error, userId, method });
    throw AuthError.authenticationFailed('Failed to store MFA code');
  }
}

/**
 * Verifies an MFA code against stored codes for a user
 * 
 * @param userId User ID to verify code for
 * @param code The code provided by the user
 * @param method The MFA method being used
 * @returns True if code is valid, false otherwise
 */
export async function verifyMfaCode(
  userId: UUID,
  code: string,
  method: MfaMethod
): Promise<boolean> {
  try {
    // Retrieve stored MFA codes for the user and method
    if (!userId || !code) {
      return false;
    }
    
    // For TOTP method, verify using verifyTOTP function
    if (method === MfaMethod.TOTP) {
      // Fetch the user's TOTP secret
      const totpResult = await db.query(async (knex) => {
        return await knex('mfa_setup')
          .where({ user_id: userId, method: MfaMethod.TOTP, verified: true })
          .select('secret')
          .first();
      });
      
      if (!totpResult || !totpResult.secret) {
        logger.warn('TOTP verification failed: no setup found', { userId });
        return false;
      }
      
      // Verify the TOTP code
      const isValid = verifyTOTP(code, totpResult.secret);
      
      // Log the verification result
      auditLog({
        userId,
        action: isValid ? 'MFA_VERIFICATION_SUCCESS' : 'MFA_VERIFICATION_FAILURE',
        resource: 'authentication',
        details: {
          method: 'TOTP',
          tokenMasked: `${code.substring(0, 2)}***`
        }
      });
      
      return isValid;
    }
    
    // For SMS/EMAIL methods, compare with stored codes
    const storedCodes = await db.query(async (knex) => {
      return await knex('mfa_codes')
        .where({
          user_id: userId,
          method,
          used_at: null
        })
        .where('expires_at', '>', new Date())
        .select('id', 'code_hash')
        .orderBy('created_at', 'desc');
    });
    
    // Filter out expired codes
    if (!storedCodes || storedCodes.length === 0) {
      logger.warn('MFA verification failed: no valid codes found', { userId, method });
      return false;
    }
    
    // Check if the provided code matches any stored codes
    for (const storedCode of storedCodes) {
      const isMatch = await bcrypt.compare(code, storedCode.code_hash);
      
      if (isMatch) {
        // If verification succeeds, mark the code as used
        await db.query(async (knex) => {
          return await knex('mfa_codes')
            .where({ id: storedCode.id })
            .update({ used_at: new Date() });
        });
        
        // Log successful verification
        logger.info('MFA code verified successfully', { userId, method });
        auditLog({
          userId,
          action: 'MFA_VERIFICATION_SUCCESS',
          resource: 'authentication',
          details: {
            method,
            codeMasked: `${code.substring(0, 2)}***`
          }
        });
        
        return true;
      }
    }
    
    // Log failed verification attempt
    logger.warn('MFA verification failed: invalid code', { userId, method });
    auditLog({
      userId,
      action: 'MFA_VERIFICATION_FAILURE',
      resource: 'authentication',
      details: {
        method,
        codeMasked: `${code.substring(0, 2)}***`
      }
    });
    
    return false;
  } catch (error) {
    logger.error('Error during MFA verification', { error, userId, method });
    return false;
  }
}

/**
 * Generates a set of one-time use backup codes for MFA recovery
 * 
 * @param count Number of backup codes to generate
 * @param codeLength Length of each code
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10, codeLength: number = 8): string[] {
  try {
    // Initialize an empty array for backup codes
    const backupCodes: string[] = [];
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // For the specified count, generate random alphanumeric codes
    for (let i = 0; i < count; i++) {
      const randomBytes = crypto.randomBytes(codeLength);
      let code = '';
      
      for (let j = 0; j < codeLength; j++) {
        code += charset[randomBytes[j] % charset.length];
      }
      
      // Format codes with hyphens for readability (e.g., XXXX-XXXX)
      if (codeLength >= 8) {
        const midpoint = Math.floor(codeLength / 2);
        code = code.substring(0, midpoint) + '-' + code.substring(midpoint);
      }
      
      // Ensure all codes are unique
      if (backupCodes.includes(code)) {
        i--; // Try again for this code
        continue;
      }
      
      backupCodes.push(code);
    }
    
    return backupCodes;
  } catch (error) {
    logger.error('Failed to generate backup codes', { error, count });
    throw AuthError.authenticationFailed('Failed to generate backup codes');
  }
}

/**
 * Stores hashed backup codes for a user
 * 
 * @param userId User ID to store backup codes for
 * @param codes Array of backup codes to store
 * @returns True if codes were successfully stored
 */
export async function storeBackupCodes(userId: UUID, codes: string[]): Promise<boolean> {
  try {
    // Delete any existing backup codes for the user
    return await db.transaction(async (trx) => {
      await trx('mfa_backup_codes')
        .where({ user_id: userId, used_at: null })
        .delete();
      
      // Hash each backup code for secure storage
      const records = await Promise.all(codes.map(async (code) => {
        // Normalize the code (remove hyphens)
        const normalizedCode = code.replace(/-/g, '');
        
        // Hash the code
        const codeHash = await bcrypt.hash(normalizedCode, 10);
        
        return {
          user_id: userId,
          code_hash: codeHash,
          created_at: new Date()
        };
      }));
      
      // Store the hashed codes in the database with user ID and creation timestamp
      await trx('mfa_backup_codes').insert(records);
      
      logger.info('Stored backup codes for user', { userId, count: codes.length });
      return true;
    });
  } catch (error) {
    logger.error('Failed to store backup codes', { error, userId });
    throw AuthError.authenticationFailed('Failed to store backup codes');
  }
}

/**
 * Verifies a backup code and marks it as used if valid
 * 
 * @param userId User ID to verify backup code for
 * @param code The backup code provided by the user
 * @returns True if code is valid, false otherwise
 */
export async function verifyBackupCode(userId: UUID, code: string): Promise<boolean> {
  try {
    // Normalize the backup code format (remove hyphens, uppercase)
    if (!userId || !code) {
      return false;
    }
    
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    
    // Retrieve unused backup codes for the user
    const backupCodes = await db.query(async (knex) => {
      return await knex('mfa_backup_codes')
        .where({
          user_id: userId,
          used_at: null
        })
        .select('id', 'code_hash');
    });
    
    if (!backupCodes || backupCodes.length === 0) {
      logger.warn('Backup code verification failed: no unused codes found', { userId });
      return false;
    }
    
    // Compare the provided code with stored hashed codes
    for (const backupCode of backupCodes) {
      const isMatch = await bcrypt.compare(normalizedCode, backupCode.code_hash);
      
      if (isMatch) {
        // If a match is found, mark the code as used with current timestamp
        await db.query(async (knex) => {
          return await knex('mfa_backup_codes')
            .where({ id: backupCode.id })
            .update({ used_at: new Date() });
        });
        
        // Log successful verification
        logger.info('Backup code verified successfully', { userId });
        auditLog({
          userId,
          action: 'MFA_BACKUP_CODE_USED',
          resource: 'authentication',
          details: {
            codeMasked: `${normalizedCode.substring(0, 2)}***`
          }
        });
        
        return true;
      }
    }
    
    // Log failed verification attempt
    logger.warn('Backup code verification failed: invalid code', { userId });
    auditLog({
      userId,
      action: 'MFA_BACKUP_CODE_VERIFICATION_FAILURE',
      resource: 'authentication',
      details: {
        codeMasked: `${code.substring(0, 2)}***`
      }
    });
    
    return false;
  } catch (error) {
    logger.error('Error during backup code verification', { error, userId });
    return false;
  }
}

/**
 * Hashes a password using bcrypt with appropriate work factor
 * 
 * @param password The password to hash
 * @returns Bcrypt hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Get work factor from configuration (default 12)
    const workFactor = auth.passwordPolicy.saltRounds || 12;
    
    // Generate a salt using bcrypt
    const salt = await bcrypt.genSalt(workFactor);
    
    // Hash the password with the generated salt
    const hash = await bcrypt.hash(password, salt);
    
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against a hashed password
 * 
 * @param password The password to verify
 * @param hashedPassword The hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Use bcrypt to compare the password with the hashed password
    if (!password || !hashedPassword) {
      return false;
    }
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Failed to verify password', { error });
    return false;
  }
}

/**
 * Determines if MFA is required for a user based on role and settings
 * 
 * @param user User object
 * @param requestInfo Request context information
 * @returns True if MFA is required, false otherwise
 */
export async function isMfaRequired(user: any, requestInfo: any): Promise<boolean> {
  try {
    // Check if MFA is globally enforced in configuration
    if (auth.mfaSettings.enabled) {
      logger.debug('MFA is globally enabled');
      
      // Check if user has MFA enabled in their profile
      if (user.mfaEnabled) {
        logger.debug('User has MFA enabled', { userId: user.id });
        
        // Check if request is from a trusted device (bypass MFA)
        if (requestInfo && requestInfo.deviceId) {
          const trustedDevice = await db.query(async (knex) => {
            return await knex('trusted_devices')
              .where({
                user_id: user.id,
                device_id: requestInfo.deviceId,
                is_active: true
              })
              .where('expires_at', '>', new Date())
              .first();
          });
          
          if (trustedDevice) {
            logger.debug('Request from trusted device, MFA not required', {
              userId: user.id,
              deviceId: requestInfo.deviceId
            });
            return false;
          }
        }
        
        return true;
      }
      
      // Check if user's role requires MFA (e.g., admin roles)
      if (user.roleName && auth.mfaSettings.requiredForRoles.includes(user.roleName)) {
        logger.debug('MFA required based on user role', {
          userId: user.id,
          role: user.roleName
        });
        return true;
      }
    }
    
    // Return true if MFA is required based on above checks
    return false;
  } catch (error) {
    logger.error('Error determining MFA requirement', { error, userId: user?.id });
    // Default to requiring MFA on error for security
    return true;
  }
}