/**
 * Password Policy Module
 * 
 * Implements password policy validation, enforcement, and management for the HCBS Revenue Management System.
 * This module provides functions to validate password strength, check password history, manage password
 * expiration, and handle account lockouts according to HIPAA compliance requirements.
 */

import authConfig from '../config/auth.config'; // dotenv 16.0.3
import { ApiError } from '../errors/api-error';
import { ErrorCode, ErrorCategory } from '../types/error.types';
import { comparePassword } from '../utils/crypto'; // bcrypt 5.1.0

// Regular expressions for password validation
const PASSWORD_REGEX_UPPERCASE = /[A-Z]/;
const PASSWORD_REGEX_LOWERCASE = /[a-z]/;
const PASSWORD_REGEX_NUMBER = /[0-9]/;
const PASSWORD_REGEX_SYMBOL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validates a password against the configured strength requirements
 * 
 * @param password - Password to validate
 * @returns Result of password validation with any error messages
 */
export async function validatePasswordStrength(password: string): Promise<{ isValid: boolean; errors: string[] }> {
  // Initialize errors array
  const errors: string[] = [];

  // Check password length against minimum length requirement
  if (!password || password.length < authConfig.passwordPolicy.minLength) {
    errors.push(`Password must be at least ${authConfig.passwordPolicy.minLength} characters long.`);
  }

  // Check for uppercase letters if required
  if (authConfig.passwordPolicy.requireUppercase && !PASSWORD_REGEX_UPPERCASE.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  // Check for lowercase letters if required
  if (authConfig.passwordPolicy.requireLowercase && !PASSWORD_REGEX_LOWERCASE.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  // Check for numbers if required
  if (authConfig.passwordPolicy.requireNumbers && !PASSWORD_REGEX_NUMBER.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  // Check for symbols if required
  if (authConfig.passwordPolicy.requireSymbols && !PASSWORD_REGEX_SYMBOL.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  // Return validation result with isValid flag and any error messages
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a new password is different from previous passwords
 * 
 * @param newPassword - New password to check
 * @param passwordHistory - Array of previously used password hashes
 * @returns True if password is not in history, false otherwise
 */
export async function validatePasswordHistory(
  newPassword: string,
  passwordHistory: string[]
): Promise<boolean> {
  // If password history is empty or null, return true
  if (!passwordHistory || passwordHistory.length === 0) {
    return true;
  }

  // Limit history check to configured history count
  const historyToCheck = passwordHistory.slice(0, authConfig.passwordPolicy.historyCount);

  // For each password in history, compare with new password using comparePassword
  for (const oldPassword of historyToCheck) {
    if (await comparePassword(newPassword, oldPassword)) {
      return false; // Password in history
    }
  }

  // Return true if password is not found in history
  return true;
}

/**
 * Determines if a password has expired based on last change date
 * 
 * @param lastPasswordChangeDate - Date when password was last changed
 * @returns True if password has expired, false otherwise
 */
export function isPasswordExpired(lastPasswordChangeDate: Date): boolean {
  // Get password expiration days from config
  const expirationDays = authConfig.passwordPolicy.expirationDays;
  
  // If expiration days is 0, passwords never expire, return false
  if (expirationDays === 0) {
    return false;
  }

  // Calculate expiration date by adding expiration days to last change date
  const expirationDate = new Date(lastPasswordChangeDate);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  // Compare expiration date with current date
  return new Date() > expirationDate;
}

/**
 * Determines if an account should be locked based on failed attempts
 * 
 * @param failedAttempts - Number of consecutive failed login attempts
 * @returns True if account should be locked, false otherwise
 */
export function shouldLockAccount(failedAttempts: number): boolean {
  // Get maximum failed attempts from config
  const maxAttempts = authConfig.passwordPolicy.maxAttempts;
  
  // Compare failed attempts with maximum allowed
  return failedAttempts >= maxAttempts;
}

/**
 * Calculates when an account lockout should end
 * 
 * @param lockoutStartTime - Time when the account was locked
 * @returns Date when lockout should end
 */
export function calculateLockoutEndTime(lockoutStartTime: Date): Date {
  // Get lockout duration in minutes from config
  const lockoutDurationMinutes = authConfig.passwordPolicy.lockoutDurationMinutes;
  
  // Create a new date object based on lockout start time
  const lockoutEndTime = new Date(lockoutStartTime);
  
  // Add lockout duration minutes to the date
  lockoutEndTime.setMinutes(lockoutEndTime.getMinutes() + lockoutDurationMinutes);
  
  // Return the calculated end time
  return lockoutEndTime;
}

/**
 * Checks if an account is currently locked
 * 
 * @param lockoutEndTime - Time when the account lockout ends, or null if not locked
 * @returns True if account is locked, false otherwise
 */
export function isAccountLocked(lockoutEndTime: Date | null): boolean {
  // If lockout end time is null, return false (not locked)
  if (!lockoutEndTime) {
    return false;
  }
  
  // Compare current time with lockout end time
  return new Date() < lockoutEndTime;
}

/**
 * Returns a human-readable description of password requirements
 * 
 * @returns Description of password requirements
 */
export function getPasswordRequirementsDescription(): string {
  // Get password policy configuration
  const policy = authConfig.passwordPolicy;
  
  // Build a string describing minimum length requirement
  let description = `Password must be at least ${policy.minLength} characters long`;
  
  // Add description of character type requirements (uppercase, lowercase, numbers, symbols)
  const requirements = [];
  
  if (policy.requireUppercase) {
    requirements.push('at least one uppercase letter');
  }
  
  if (policy.requireLowercase) {
    requirements.push('at least one lowercase letter');
  }
  
  if (policy.requireNumbers) {
    requirements.push('at least one number');
  }
  
  if (policy.requireSymbols) {
    requirements.push('at least one special character');
  }
  
  // Return the complete description string
  if (requirements.length > 0) {
    description += ` and include ${requirements.join(', ')}`;
  }
  
  return description + '.';
}

/**
 * Calculates a password strength score from 0-100
 * 
 * @param password - Password to score
 * @returns Password strength score (0-100)
 */
export function getPasswordStrengthScore(password: string): number {
  // Initialize base score to 0
  let score = 0;
  
  if (!password) {
    return 0;
  }
  
  // Add points based on password length (longer = more points)
  score += Math.min(40, password.length * 2);
  
  // Add points for character variety (uppercase, lowercase, numbers, symbols)
  if (PASSWORD_REGEX_UPPERCASE.test(password)) score += 10;
  if (PASSWORD_REGEX_LOWERCASE.test(password)) score += 10;
  if (PASSWORD_REGEX_NUMBER.test(password)) score += 10;
  if (PASSWORD_REGEX_SYMBOL.test(password)) score += 10;
  
  // Add points for good distribution of character types
  const upperCount = (password.match(/[A-Z]/g) || []).length;
  const lowerCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  
  const totalChars = password.length;
  const distributionScore = Math.min(20, 
    (Math.min(upperCount, totalChars * 0.3) / (totalChars * 0.3)) * 5 +
    (Math.min(lowerCount, totalChars * 0.3) / (totalChars * 0.3)) * 5 +
    (Math.min(numberCount, totalChars * 0.2) / (totalChars * 0.2)) * 5 +
    (Math.min(symbolCount, totalChars * 0.2) / (totalChars * 0.2)) * 5
  );
  score += distributionScore;
  
  // Deduct points for patterns or sequences
  if (/^[A-Za-z]+\d+$/.test(password)) score -= 10; // All letters followed by numbers
  if (/^[A-Za-z]+$/.test(password)) score -= 10; // All letters
  if (/^\d+$/.test(password)) score -= 10; // All numbers
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/(?:qwerty|asdfgh|zxcvbn|123456|password|admin)/i.test(password)) score -= 20; // Common patterns
  
  // Ensure final score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}