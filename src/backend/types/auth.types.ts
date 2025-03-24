/**
 * Authentication and Authorization type definitions for the HCBS Revenue Management System
 * 
 * This file defines TypeScript types and interfaces related to user authentication,
 * authorization, tokens, sessions, and multi-factor authentication to ensure
 * type safety throughout the authentication flow.
 * 
 * @module auth.types
 */

import { UUID, Timestamp } from './common.types';

/**
 * Interface for user login credentials
 */
export interface LoginCredentials {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** Whether to persist login state for extended period */
  rememberMe: boolean;
}

/**
 * Interface for multi-factor authentication credentials
 */
export interface MfaCredentials {
  /** Temporary token issued after successful password authentication */
  mfaToken: string;
  /** One-time code provided by the user for MFA verification */
  mfaCode: string;
  /** Whether to trust this device for future MFA challenges */
  rememberDevice: boolean;
}

/**
 * Interface for authenticated user information returned after successful authentication
 */
export interface AuthenticatedUser {
  /** Unique identifier for the user */
  id: UUID;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Unique identifier for the user's role */
  roleId: UUID;
  /** Name of the user's role */
  roleName: string;
  /** List of permission codes assigned to the user */
  permissions: string[];
  /** Whether multi-factor authentication is enabled for this user */
  mfaEnabled: boolean;
  /** Timestamp of the user's last successful login, or null if first login */
  lastLogin: Timestamp | null;
}

/**
 * Enum for different token types used in the authentication system
 */
export enum TokenType {
  /** Short-lived token for API access (15 minutes) */
  ACCESS = 'access',
  /** Longer-lived token for refreshing access tokens */
  REFRESH = 'refresh',
  /** Temporary token for multi-factor authentication flow */
  MFA = 'mfa',
  /** Token for password reset process */
  PASSWORD_RESET = 'password_reset',
  /** Long-lived token for API integrations */
  API_KEY = 'api_key'
}

/**
 * Interface for JWT token payload structure
 */
export interface TokenPayload {
  /** Subject - User ID */
  sub: UUID;
  /** User email */
  email: string;
  /** Type of token */
  tokenType: TokenType;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Issuer - system identifier */
  iss: string;
  /** Audience - intended recipient(s) */
  aud: string;
  /** JWT ID - unique identifier for this token */
  jti: string;
}

/**
 * Interface extending TokenPayload with refresh token specific fields
 */
export interface RefreshTokenPayload extends TokenPayload {
  /** Family identifier for refresh token rotation */
  family: string;
}

/**
 * Interface extending TokenPayload with MFA specific fields
 */
export interface MfaTokenPayload extends TokenPayload {
  /** MFA method being used */
  mfaMethod: MfaMethod;
}

/**
 * Interface extending TokenPayload for password reset tokens
 */
export interface PasswordResetTokenPayload extends TokenPayload {
  // No additional fields needed beyond the base TokenPayload
}

/**
 * Interface for token metadata stored in the database
 */
export interface TokenMetadata {
  /** Unique identifier for the token record */
  id: string;
  /** ID of the user this token belongs to */
  userId: UUID;
  /** Type of token */
  type: TokenType;
  /** Family identifier for refresh tokens, null for other token types */
  family: string | null;
  /** When the token was issued */
  issuedAt: Timestamp;
  /** When the token expires */
  expiresAt: Timestamp;
  /** When the token was revoked, or null if still valid */
  revokedAt: Timestamp | null;
  /** Reason for revocation, or null if not revoked */
  revocationReason: string | null;
  /** Information about the device used to obtain this token */
  deviceInfo: string | null;
  /** IP address from which this token was issued */
  ipAddress: string | null;
}

/**
 * Interface for user session information
 */
export interface UserSession {
  /** Unique identifier for the session */
  id: UUID;
  /** ID of the user this session belongs to */
  userId: UUID;
  /** Information about the device used for this session */
  deviceInfo: string;
  /** IP address from which this session originated */
  ipAddress: string;
  /** When the session started */
  startTime: Timestamp;
  /** Time of last activity in this session */
  lastActivity: Timestamp;
  /** When the session ended, or null if still active */
  endTime: Timestamp | null;
  /** Whether the session is currently active */
  isActive: boolean;
}

/**
 * Enum for supported multi-factor authentication methods
 */
export enum MfaMethod {
  /** Time-based One-Time Password */
  TOTP = 'totp',
  /** SMS Text Message */
  SMS = 'sms',
  /** Email Magic Link or Code */
  EMAIL = 'email'
}

/**
 * Interface for MFA setup information
 */
export interface MfaSetup {
  /** ID of the user this MFA setup belongs to */
  userId: UUID;
  /** MFA method used */
  method: MfaMethod;
  /** Encrypted secret for the MFA method (TOTP seed, phone number, etc.) */
  secret: string;
  /** Whether the MFA method has been verified */
  verified: boolean;
  /** When the MFA method was created */
  createdAt: Timestamp;
  /** When the MFA method was verified, or null if not verified */
  verifiedAt: Timestamp | null;
}

/**
 * Interface for trusted device information to bypass MFA
 */
export interface TrustedDevice {
  /** Unique identifier for the trusted device record */
  id: UUID;
  /** ID of the user this trusted device belongs to */
  userId: UUID;
  /** Unique identifier for the device */
  deviceId: string;
  /** User-friendly name for the device */
  deviceName: string;
  /** Information about the device (OS, browser, etc.) */
  deviceInfo: string;
  /** IP address from which this device was trusted */
  ipAddress: string;
  /** When the device was added to trusted devices */
  createdAt: Timestamp;
  /** When the trusted device record expires */
  expiresAt: Timestamp;
  /** Whether the trusted device is currently active */
  isActive: boolean;
}

/**
 * Enum for authentication status results
 */
export enum AuthStatus {
  /** User is fully authenticated */
  AUTHENTICATED = 'authenticated',
  /** User is not authenticated */
  UNAUTHENTICATED = 'unauthenticated',
  /** User has passed password authentication but MFA is required */
  MFA_REQUIRED = 'mfa_required',
  /** User's password has expired and must be changed */
  PASSWORD_EXPIRED = 'password_expired',
  /** User's account is locked due to suspicious activity or too many failed attempts */
  ACCOUNT_LOCKED = 'account_locked'
}

/**
 * Enum for supported authentication providers
 */
export enum AuthProvider {
  /** Local authentication with username/password */
  LOCAL = 'local',
  /** Authentication via Google */
  GOOGLE = 'google',
  /** Authentication via Microsoft */
  MICROSOFT = 'microsoft',
  /** Authentication via Okta */
  OKTA = 'okta',
  /** Authentication via Auth0 */
  AUTH0 = 'auth0'
}

/**
 * Interface for password reset request information
 */
export interface PasswordResetRequest {
  /** Unique identifier for the password reset request */
  id: UUID;
  /** ID of the user this password reset request belongs to */
  userId: UUID;
  /** Hashed token for the password reset request */
  token: string;
  /** When the password reset request was created */
  createdAt: Timestamp;
  /** When the password reset request expires */
  expiresAt: Timestamp;
  /** When the password reset request was used, or null if not used */
  usedAt: Timestamp | null;
  /** IP address from which this password reset request originated */
  ipAddress: string;
}

/**
 * Interface for MFA backup code information
 */
export interface MfaBackupCode {
  /** Unique identifier for the backup code record */
  id: UUID;
  /** ID of the user this backup code belongs to */
  userId: UUID;
  /** Hashed value of the backup code */
  codeHash: string;
  /** When the backup code was created */
  createdAt: Timestamp;
  /** When the backup code was used, or null if not used */
  usedAt: Timestamp | null;
}

/**
 * Interface for request context information used in authentication
 */
export interface RequestInfo {
  /** IP address of the request */
  ipAddress: string;
  /** User agent string from the request */
  userAgent: string;
  /** Unique device identifier, or null if not available */
  deviceId: string | null;
}