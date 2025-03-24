/**
 * Mock authentication data for the HCBS Revenue Management System.
 * This file provides mock user data, authentication tokens, and responses
 * used by the mock service worker (MSW) to simulate API responses during
 * development and testing.
 * 
 * @version 1.0.0
 */

import { 
  AuthUser, 
  AuthTokens, 
  LoginResponse, 
  MfaResponse, 
  MfaMethod 
} from '../../types/auth.types';
import { UUID, ResponseError } from '../../types/common.types';

/**
 * Mock user data representing different user roles in the system
 */
export const mockUsers: AuthUser[] = [
  {
    id: '1',
    email: 'admin@thinkcaring.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Administrator',
    permissions: ['*'],
    mfaEnabled: true,
    lastLogin: '2023-06-01T08:30:00Z',
    status: 'active',
    organization: {
      id: '1',
      name: 'ThinkCaring'
    }
  },
  {
    id: '2',
    email: 'finance@thinkcaring.com',
    firstName: 'Finance',
    lastName: 'Manager',
    role: 'Financial Manager',
    permissions: [
      'finance.view',
      'finance.edit',
      'claims.view',
      'claims.edit',
      'payments.view',
      'payments.edit',
      'reports.view'
    ],
    mfaEnabled: true,
    lastLogin: '2023-06-02T10:15:00Z',
    status: 'active',
    organization: {
      id: '1',
      name: 'ThinkCaring'
    }
  },
  {
    id: '3',
    email: 'billing@thinkcaring.com',
    firstName: 'Billing',
    lastName: 'Specialist',
    role: 'Billing Specialist',
    permissions: [
      'claims.view',
      'claims.edit',
      'claims.submit',
      'services.view',
      'services.edit'
    ],
    mfaEnabled: false,
    lastLogin: '2023-06-03T09:45:00Z',
    status: 'active',
    organization: {
      id: '1',
      name: 'ThinkCaring'
    }
  }
];

/**
 * Mock authentication tokens with expiration time
 */
export const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token-very-long-string-representing-jwt',
  refreshToken: 'mock-refresh-token-very-long-string',
  expiresAt: Date.now() + 3600000 // 1 hour from now
};

/**
 * Mock MFA challenge response for testing MFA flow
 */
export const mockMfaResponse: MfaResponse = {
  mfaToken: 'mock-mfa-token-for-verification',
  method: MfaMethod.APP,
  expiresAt: Date.now() + 300000 // 5 minutes from now
};

/**
 * Mock successful login response with user and tokens
 */
export const mockLoginResponse: LoginResponse = {
  user: mockUsers[0],
  tokens: mockTokens,
  mfaRequired: false,
  mfaResponse: null
};

/**
 * Mock login response that requires MFA verification
 */
export const mockMfaRequiredResponse: LoginResponse = {
  user: null,
  tokens: null,
  mfaRequired: true,
  mfaResponse: mockMfaResponse
};

/**
 * Mock error response for failed login attempts
 */
export const mockLoginErrorResponse: ResponseError = {
  status: 401,
  message: 'Invalid email or password',
  error: 'Unauthorized'
};

/**
 * Mock response for password reset requests
 */
export const mockPasswordResetResponse = {
  success: true,
  message: 'Password reset email sent'
};

/**
 * Mock user sessions for testing session management
 */
export const mockSessions = [
  {
    id: 'session-1',
    device: 'Chrome on Windows',
    location: 'New York, USA',
    lastActive: '2023-06-05T14:30:00Z',
    current: true
  },
  {
    id: 'session-2',
    device: 'Safari on macOS',
    location: 'San Francisco, USA',
    lastActive: '2023-06-04T11:20:00Z',
    current: false
  },
  {
    id: 'session-3',
    device: 'Firefox on Linux',
    location: 'Chicago, USA',
    lastActive: '2023-06-03T09:15:00Z',
    current: false
  }
];

/**
 * Mock trusted devices for testing MFA device management
 */
export const mockTrustedDevices = [
  {
    id: 'device-1',
    device: 'Chrome on Windows',
    lastUsed: '2023-06-05T14:30:00Z'
  },
  {
    id: 'device-2',
    device: 'Safari on macOS',
    lastUsed: '2023-06-04T11:20:00Z'
  },
  {
    id: 'device-3',
    device: 'Firefox on Linux',
    lastUsed: '2023-06-03T09:15:00Z'
  }
];