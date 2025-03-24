/**
 * Authentication API client for HCBS Revenue Management System
 *
 * This file implements API functions for authentication-related operations including
 * user login, logout, multi-factor authentication, password management, and token refresh
 * to support the comprehensive authentication framework required by HIPAA compliance.
 *
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  LoginCredentials,
  LoginResponse,
  MfaCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthTokens,
  MfaSetupResponse,
  SessionInfo,
  TrustedDevice
} from '../types/auth.types';
import {
  saveAuthTokens,
  clearAuthTokens,
  saveUserData,
  clearUserData,
  saveMfaToken,
  clearMfaToken,
  saveRememberMe
} from '../utils/auth';

/**
 * Authenticates a user with email and password credentials
 *
 * @param credentials - Login credentials containing email, password, and remember me option
 * @returns Promise resolving to login response with tokens and user data or MFA challenge
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  // If response includes tokens and user data, save them to storage
  if (response.tokens && response.user) {
    saveAuthTokens(response.tokens);
    saveUserData(response.user);
    
    // If remember me is true, save the preference
    if (credentials.rememberMe) {
      saveRememberMe(true);
    }
  }
  
  // If MFA is required, save the MFA token
  if (response.mfaRequired && response.mfaResponse) {
    saveMfaToken(response.mfaResponse.mfaToken);
  }
  
  return response;
}

/**
 * Logs out the current user and invalidates their session
 *
 * @returns Promise resolving when logout is complete
 */
export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  
  // Clear authentication data from storage
  clearAuthTokens();
  clearUserData();
  clearMfaToken();
}

/**
 * Verifies a multi-factor authentication code during login
 *
 * @param credentials - MFA verification credentials containing token and verification code
 * @returns Promise resolving to login response with tokens and user data
 */
export async function verifyMfa(credentials: MfaCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.MFA,
    credentials
  );
  
  // If response includes tokens and user data, save them to storage
  if (response.tokens && response.user) {
    saveAuthTokens(response.tokens);
    saveUserData(response.user);
  }
  
  // Clear MFA token as it's no longer needed
  clearMfaToken();
  
  return response;
}

/**
 * Initiates the password reset process for a user
 *
 * @param request - Object containing the user's email address
 * @returns Promise resolving when request is processed
 */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, request);
}

/**
 * Resets a user's password using a reset token
 *
 * @param request - Object containing reset token and new password
 * @returns Promise resolving when password is reset
 */
export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, request);
}

/**
 * Changes the password for the currently authenticated user
 *
 * @param request - Object containing current password and new password
 * @returns Promise resolving when password is changed
 */
export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/auth/change-password', request);
}

/**
 * Refreshes the authentication tokens using a refresh token
 *
 * @returns Promise resolving to new authentication tokens
 */
export async function refreshToken(): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH);
  
  // Save the new tokens to storage
  saveAuthTokens(response);
  
  return response;
}

/**
 * Initiates the MFA setup process for a user
 *
 * @returns Promise resolving to MFA setup information
 */
export async function setupMfa(): Promise<MfaSetupResponse> {
  const response = await apiClient.post<MfaSetupResponse>(`${API_ENDPOINTS.AUTH.MFA}/setup`);
  return response;
}

/**
 * Verifies and completes the MFA setup process
 *
 * @param code - Verification code from authenticator app
 * @returns Promise resolving when MFA setup is verified
 */
export async function verifyMfaSetup(code: string): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.AUTH.MFA}/setup/verify`, { code });
}

/**
 * Disables MFA for the current user
 *
 * @param password - User's current password for security verification
 * @returns Promise resolving when MFA is disabled
 */
export async function disableMfa(password: string): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.AUTH.MFA}/disable`, { password });
}

/**
 * Retrieves active sessions for the current user
 *
 * @returns Promise resolving to list of active sessions
 */
export async function getSessions(): Promise<SessionInfo[]> {
  const response = await apiClient.get<SessionInfo[]>('/auth/sessions');
  return response;
}

/**
 * Terminates a specific session for the current user
 *
 * @param sessionId - ID of the session to terminate
 * @returns Promise resolving when session is terminated
 */
export async function terminateSession(sessionId: string): Promise<void> {
  await apiClient.post(`/auth/sessions/${sessionId}/terminate`);
}

/**
 * Terminates all sessions for the current user except the current one
 *
 * @returns Promise resolving when all sessions are terminated
 */
export async function terminateAllSessions(): Promise<void> {
  await apiClient.post('/auth/sessions/terminate-all');
}

/**
 * Retrieves trusted devices for the current user
 *
 * @returns Promise resolving to list of trusted devices
 */
export async function getTrustedDevices(): Promise<TrustedDevice[]> {
  const response = await apiClient.get<TrustedDevice[]>(`${API_ENDPOINTS.AUTH.MFA}/trusted-devices`);
  return response;
}

/**
 * Removes a trusted device for the current user
 *
 * @param deviceId - ID of the device to remove
 * @returns Promise resolving when device is removed
 */
export async function removeTrustedDevice(deviceId: string): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.AUTH.MFA}/trusted-devices/${deviceId}/remove`);
}