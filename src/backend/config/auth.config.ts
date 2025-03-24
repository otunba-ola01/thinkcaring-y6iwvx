import dotenv from 'dotenv'; // dotenv 16.0.3
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Returns the file path to the private key used for JWT signing based on environment
 * @returns Path to the private key file
 */
function getPrivateKeyPath(): string {
  switch (NODE_ENV) {
    case 'production':
      return process.env.JWT_PRIVATE_KEY_PATH || '/etc/hcbs/keys/private.key';
    case 'test':
      return process.env.JWT_PRIVATE_KEY_PATH || './keys/test/private.key';
    case 'development':
    default:
      return process.env.JWT_PRIVATE_KEY_PATH || './keys/dev/private.key';
  }
}

/**
 * Returns the file path to the public key used for JWT verification based on environment
 * @returns Path to the public key file
 */
function getPublicKeyPath(): string {
  switch (NODE_ENV) {
    case 'production':
      return process.env.JWT_PUBLIC_KEY_PATH || '/etc/hcbs/keys/public.key';
    case 'test':
      return process.env.JWT_PUBLIC_KEY_PATH || './keys/test/public.key';
    case 'development':
    default:
      return process.env.JWT_PUBLIC_KEY_PATH || './keys/dev/public.key';
  }
}

/**
 * Authentication configuration for the HCBS Revenue Management System
 * Contains all settings related to user authentication, authorization, and security
 */
const authConfig = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
  jwtAlgorithm: 'RS256', // RSA Signature with SHA-256
  accessTokenExpiration: parseInt(process.env.ACCESS_TOKEN_EXPIRATION || '900'), // 15 minutes in seconds
  refreshTokenExpiration: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '604800'), // 7 days in seconds
  mfaTokenExpiration: parseInt(process.env.MFA_TOKEN_EXPIRATION || '600'), // 10 minutes in seconds
  passwordResetExpiration: parseInt(process.env.PASSWORD_RESET_EXPIRATION || '86400'), // 24 hours in seconds
  tokenIssuer: process.env.TOKEN_ISSUER || 'hcbs-revenue-management-system',
  tokenAudience: process.env.TOKEN_AUDIENCE || 'hcbs-api',
  privateKeyPath: getPrivateKeyPath(),
  publicKeyPath: getPublicKeyPath(),

  // Password Policy
  passwordPolicy: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
    expirationDays: parseInt(process.env.PASSWORD_EXPIRATION_DAYS || '90'),
    historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT || '10'),
    maxAttempts: parseInt(process.env.PASSWORD_MAX_ATTEMPTS || '5'),
    lockoutDurationMinutes: parseInt(process.env.PASSWORD_LOCKOUT_DURATION || '30')
  },

  // Multi-factor Authentication Settings
  mfaSettings: {
    enabled: process.env.MFA_ENABLED !== 'false',
    requiredForRoles: ['administrator', 'financial_manager'],
    methods: ['TOTP', 'SMS', 'EMAIL'],
    defaultMethod: 'TOTP',
    codeLength: parseInt(process.env.MFA_CODE_LENGTH || '6'),
    codeExpiration: parseInt(process.env.MFA_CODE_EXPIRATION || '600'), // 10 minutes in seconds
    backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT || '10'),
    trustedDeviceExpirationDays: parseInt(process.env.TRUSTED_DEVICE_EXPIRATION_DAYS || '30')
  },

  // Session Management Settings
  sessionSettings: {
    inactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT || '900'), // 15 minutes in seconds
    absoluteTimeout: parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT || '28800'), // 8 hours in seconds
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3'),
    rememberMeDuration: parseInt(process.env.REMEMBER_ME_DURATION || '2592000') // 30 days in seconds
  },

  // Cookie Settings
  cookieSettings: {
    secure: process.env.COOKIE_SECURE !== 'false', // Default to true except when explicitly set to false
    httpOnly: true,
    sameSite: 'strict' as const, // Prevents CSRF attacks
    domain: process.env.COOKIE_DOMAIN || '',
    path: process.env.COOKIE_PATH || '/',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400') // 1 day in seconds
  },

  // Login Security Settings
  loginSettings: {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5'),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30'),
    requireCaptcha: process.env.REQUIRE_CAPTCHA === 'true',
    captchaThreshold: parseInt(process.env.CAPTCHA_THRESHOLD || '3') // Show CAPTCHA after this many failed attempts
  }
};

export default authConfig;