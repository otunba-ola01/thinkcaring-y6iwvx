/**
 * This file defines TypeScript types, interfaces, and enums related to authentication
 * in the HCBS Revenue Management System. It provides type definitions for authentication state,
 * user data, credentials, tokens, and authentication-related operations to ensure
 * type safety throughout the authentication flow.
 */

import { UUID, ISO8601DateTime, ResponseError, LoadingState } from './common.types';

/**
 * Enum representing the authentication status of a user
 */
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  MFA_REQUIRED = 'mfaRequired'
}

/**
 * Enum representing the available MFA methods
 */
export enum MfaMethod {
  APP = 'app',       // Authenticator app (TOTP)
  SMS = 'sms',       // SMS verification
  EMAIL = 'email'    // Email magic link/code
}

/**
 * Enum representing password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 'veryWeak',
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'veryStrong'
}

/**
 * Interface representing an authenticated user
 */
export interface AuthUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: ISO8601DateTime | null;
  status: string;
  organization: {
    id: UUID;
    name: string;
  };
}

/**
 * Interface representing authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
}

/**
 * Interface representing login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Interface representing MFA verification credentials
 */
export interface MfaCredentials {
  mfaToken: string;
  code: string;
  rememberDevice: boolean;
}

/**
 * Interface representing MFA challenge response
 */
export interface MfaResponse {
  mfaToken: string;
  method: MfaMethod;
  expiresAt: number; // Timestamp in milliseconds
}

/**
 * Interface representing login response from the API
 */
export interface LoginResponse {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  mfaRequired: boolean;
  mfaResponse: MfaResponse | null;
}

/**
 * Interface representing forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Interface representing password reset request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface representing password change request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface representing password policy requirements
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}

/**
 * Interface representing MFA setup response
 */
export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Interface representing user session information
 */
export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: ISO8601DateTime;
  current: boolean;
}

/**
 * Interface representing a trusted device for MFA
 */
export interface TrustedDevice {
  id: string;
  device: string;
  lastUsed: ISO8601DateTime;
}

/**
 * Interface representing authentication state in Redux store
 */
export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  mfaRequired: boolean;
  mfaResponse: MfaResponse | null;
  loading: LoadingState;
  error: ResponseError | null;
  initialized: boolean;
}

/**
 * Interface representing the authentication context provided to components
 */
export interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  loading: LoadingState;
  error: ResponseError | null;
  isAuthenticated: boolean;
  
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  verifyMfa: (credentials: MfaCredentials) => Promise<LoginResponse>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<void>;
  
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}