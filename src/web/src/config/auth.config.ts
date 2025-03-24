/**
 * Authentication Configuration
 * 
 * This file defines the authentication configuration for the HCBS Revenue Management System.
 * It includes settings for token handling, session management, password policies,
 * multi-factor authentication, and account lockout settings.
 * 
 * All settings are aligned with HIPAA security requirements and industry best practices
 * for healthcare financial applications.
 * 
 * @version 1.0.0
 */

import {
  PASSWORD_POLICY,
  TOKEN_EXPIRY,
  MFA_SETTINGS,
  SESSION_SETTINGS,
  LOCKOUT_SETTINGS
} from '../constants/auth.constants';

/**
 * Main authentication configuration
 * 
 * Controls token management, session behavior, MFA requirements,
 * and security lockout settings
 */
export const authConfig = {
  /**
   * Token storage and expiration settings
   */
  tokenStorage: {
    // Store tokens in both localStorage and cookies for flexibility and security
    useLocalStorage: true,
    useCookies: true,
    
    // Token expiration times in milliseconds
    accessTokenExpiry: TOKEN_EXPIRY.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: TOKEN_EXPIRY.REFRESH_TOKEN_EXPIRY,
    mfaTokenExpiry: TOKEN_EXPIRY.MFA_TOKEN_EXPIRY
  },
  
  /**
   * Time in milliseconds before token expiry when a refresh should be attempted
   * Set to 5 minutes (300,000ms) to ensure uninterrupted user experience
   */
  tokenRefreshThreshold: 300000,
  
  /**
   * Session management configuration
   */
  sessionManagement: {
    // Timeout after inactivity period (15 minutes by default)
    idleTimeout: SESSION_SETTINGS.IDLE_TIMEOUT,
    
    // Maximum number of concurrent active sessions per user
    maxConcurrentSessions: SESSION_SETTINGS.MAX_CONCURRENT_SESSIONS,
    
    // Extend session timeout on user activity
    extendSessionOnActivity: true
  },
  
  /**
   * Multi-factor authentication settings
   */
  mfaSettings: {
    // Global MFA enablement
    enabled: true,
    
    // Require MFA for sensitive operations
    requiredForFinancialOperations: true,
    requiredForAdminOperations: true,
    
    // MFA verification code configuration
    codeLength: MFA_SETTINGS.CODE_LENGTH,
    maxAttempts: MFA_SETTINGS.MAX_ATTEMPTS,
    codeExpiry: MFA_SETTINGS.CODE_EXPIRY,
    
    // Duration in days to remember a trusted device
    trustedDeviceDays: MFA_SETTINGS.TRUSTED_DEVICE_DAYS,
    
    // Supported MFA methods
    methods: ['totp', 'sms']
  },
  
  /**
   * Account lockout configuration for failed authentication attempts
   */
  accountLockout: {
    enabled: true,
    maxAttempts: LOCKOUT_SETTINGS.MAX_ATTEMPTS,
    lockoutDuration: LOCKOUT_SETTINGS.DURATION,
    
    // Progressive delays between login attempts in milliseconds
    progressiveDelays: [1000, 2000, 5000, 10000]
  }
};

/**
 * Password policy configuration
 * 
 * Enforces strong password requirements compliant with healthcare security standards
 */
export const passwordPolicyConfig = {
  minLength: PASSWORD_POLICY.MIN_LENGTH,
  requireUppercase: PASSWORD_POLICY.REQUIRE_UPPERCASE,
  requireLowercase: PASSWORD_POLICY.REQUIRE_LOWERCASE,
  requireNumbers: PASSWORD_POLICY.REQUIRE_NUMBERS,
  requireSymbols: PASSWORD_POLICY.REQUIRE_SYMBOLS,
  expiryDays: PASSWORD_POLICY.EXPIRY_DAYS,
  historyCount: PASSWORD_POLICY.HISTORY_COUNT
};

/**
 * Secure cookie configuration
 * 
 * Settings for HTTP-only, secure cookies used to store authentication tokens
 */
export const cookieConfig = {
  // Only transmit cookies over HTTPS connections
  secure: true,
  
  // Prevent JavaScript access to cookies
  httpOnly: true,
  
  // Strict same-site policy to prevent CSRF attacks
  sameSite: 'strict' as const,
  
  // Cookie path
  path: '/',
  
  // Cookie domain (empty string for current domain)
  domain: ''
};