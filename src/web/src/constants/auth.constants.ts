/**
 * Authentication constants for HCBS Revenue Management System
 * 
 * Defines various constants used throughout the authentication flow including
 * storage keys, token expiration times, routes, password policies, error messages,
 * and security settings.
 * 
 * @version 1.0.0
 */

/**
 * Storage keys for authentication data in localStorage and cookies
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'hcbs_access_token',
  REFRESH_TOKEN: 'hcbs_refresh_token',
  USER: 'hcbs_user',
  EXPIRES_AT: 'hcbs_expires_at',
  MFA_TOKEN: 'hcbs_mfa_token',
  REMEMBER_ME: 'hcbs_remember_me'
};

/**
 * Token expiration time constants in milliseconds
 */
export const TOKEN_EXPIRY = {
  // 15 minutes for access token
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000,
  // 7 days for refresh token
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000,
  // 5 minutes for MFA verification
  MFA_TOKEN_EXPIRY: 5 * 60 * 1000,
  // 30 days for remember me functionality
  REMEMBER_ME_DAYS: 30
};

/**
 * Frontend route paths for authentication-related pages
 */
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  VERIFY_MFA: '/auth/verify-mfa',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password'
};

/**
 * Password policy constants for validation and enforcement
 * Based on HIPAA and security best practices
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SYMBOLS: true,
  // Password expires after 90 days
  EXPIRY_DAYS: 90,
  // No reuse of last 10 passwords
  HISTORY_COUNT: 10
};

/**
 * Standard error messages for authentication-related errors
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
  ACCOUNT_LOCKED: 'Your account has been locked due to multiple failed login attempts. Please contact an administrator.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_MFA_CODE: 'Invalid verification code. Please try again.',
  MFA_EXPIRED: 'Verification code has expired. Please request a new code.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please try again.',
  INVALID_TOKEN: 'Invalid security token. Please log in again.',
  TOKEN_EXPIRED: 'Security token has expired. Please log in again.'
};

/**
 * Multi-factor authentication settings
 */
export const MFA_SETTINGS = {
  // Standard 6-digit code
  CODE_LENGTH: 6,
  // Maximum verification attempts before requiring a new code
  MAX_ATTEMPTS: 3,
  // Code expires after 10 minutes
  CODE_EXPIRY: 10 * 60 * 1000,
  // Remember device for 30 days
  TRUSTED_DEVICE_DAYS: 30
};

/**
 * Session management settings
 */
export const SESSION_SETTINGS = {
  // 15 minutes of inactivity before session timeout
  IDLE_TIMEOUT: 15 * 60 * 1000,
  // Maximum number of concurrent active sessions per user
  MAX_CONCURRENT_SESSIONS: 3,
  // Prompt for session extension when 2 minutes remain
  EXTEND_SESSION_THRESHOLD: 2 * 60 * 1000
};

/**
 * Account lockout settings for failed authentication attempts
 */
export const LOCKOUT_SETTINGS = {
  // Lock account after 5 failed attempts
  MAX_ATTEMPTS: 5,
  // Lock duration of 30 minutes
  DURATION: 30 * 60 * 1000,
  // Reset attempt counter after 24 hours of no login attempts
  RESET_AFTER: 24 * 60 * 60 * 1000
};