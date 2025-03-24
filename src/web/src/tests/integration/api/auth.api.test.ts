/**
 * Integration tests for the authentication API functions in the HCBS Revenue Management System.
 * This file tests the API functions for user authentication, including login, logout, multi-factor authentication,
 * password management, and session handling.
 */

import * as authApi from '../../../api/auth.api'; // Import authentication API functions to test
import { apiClient } from '../../../api/client'; // Import API client to mock for testing
import { API_ENDPOINTS } from '../../../constants/api.constants'; // Import API endpoint constants for authentication routes
import { mockApiResponse, mockApiErrorResponse, mockNetworkError } from '../../utils/mock-api'; // Import utility to create mock API responses
import { createMockUser } from '../../utils/mock-data'; // Import utility to create mock user data
import { AuthStatus, MfaMethod } from '../../../types/auth.types'; // Import authentication status enum for type checking
import { saveAuthTokens, clearAuthTokens, saveUserData, clearUserData, saveMfaToken, clearMfaToken } from '../../../utils/auth'; // Import utility to save authentication tokens to storage
import * as authUtils from '../../../utils/auth'; // Import all auth utilities for mocking

// Define mock data for testing
const mockUser = createMockUser({ mfaEnabled: false });
const mockUserWithMfa = createMockUser({ mfaEnabled: true });
const mockTokens = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', expiresAt: Date.now() + 3600000 };
const mockLoginCredentials = { email: 'test@example.com', password: 'Password123!', rememberMe: false };
const mockMfaCredentials = { mfaToken: 'mock-mfa-token', code: '123456', rememberDevice: false };
const mockMfaResponse = { mfaToken: 'mock-mfa-token', method: MfaMethod.APP, expiresAt: Date.now() + 300000 };
const mockResetPasswordRequest = { token: 'mock-reset-token', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' };
const mockChangePasswordRequest = { currentPassword: 'Password123!', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' };
const mockSessions = [{ id: 'session-1', device: 'Chrome on Windows', location: 'New York, USA', lastActive: '2023-06-01T12:00:00Z', current: true }, { id: 'session-2', device: 'Safari on macOS', location: 'Los Angeles, USA', lastActive: '2023-05-30T10:00:00Z', current: false }];
const mockTrustedDevices = [{ id: 'device-1', device: 'Chrome on Windows', lastUsed: '2023-06-01T12:00:00Z' }, { id: 'device-2', device: 'Safari on macOS', lastUsed: '2023-05-30T10:00:00Z' }];
const mockMfaSetupResponse = { secret: 'ABCDEFGHIJKLMNOP', qrCodeUrl: 'https://example.com/qrcode' };

// Mock API client and utility functions
jest.spyOn(apiClient, 'post').mockImplementation();
jest.spyOn(apiClient, 'get').mockImplementation();
jest.spyOn(authUtils, 'saveAuthTokens').mockImplementation();
jest.spyOn(authUtils, 'clearAuthTokens').mockImplementation();
jest.spyOn(authUtils, 'saveUserData').mockImplementation();
jest.spyOn(authUtils, 'clearUserData').mockImplementation();
jest.spyOn(authUtils, 'saveMfaToken').mockImplementation();
jest.spyOn(authUtils, 'clearMfaToken').mockImplementation();

describe('Authentication API', () => {
  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse({ user: mockUser, tokens: mockTokens }));

      const response = await authApi.login(mockLoginCredentials);

      expect(response).toEqual({ user: mockUser, tokens: mockTokens });
      expect(authUtils.saveAuthTokens).toHaveBeenCalledWith(mockTokens);
      expect(authUtils.saveUserData).toHaveBeenCalledWith(mockUser);
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, mockLoginCredentials);
    });

    it('should handle MFA required response', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse({ mfaRequired: true, mfaResponse: mockMfaResponse }));

      const response = await authApi.login(mockLoginCredentials);

      expect(response).toEqual({ mfaRequired: true, mfaResponse: mockMfaResponse });
      expect(authUtils.saveMfaToken).toHaveBeenCalledWith(mockMfaResponse.mfaToken);
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, mockLoginCredentials);
    });

    it('should handle invalid credentials', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Invalid credentials', 401));

      await expect(authApi.login(mockLoginCredentials)).rejects.toEqual({
        error: { code: 401, message: 'Invalid credentials', details: {} },
        status: 401,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, mockLoginCredentials);
    });

    it('should handle network errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockNetworkError('Network error'));

      await expect(authApi.login(mockLoginCredentials)).rejects.toEqual(mockNetworkError('Network error'));
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.logout();

      expect(authUtils.clearAuthTokens).toHaveBeenCalled();
      expect(authUtils.clearUserData).toHaveBeenCalled();
      expect(authUtils.clearMfaToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
    });

    it('should handle errors during logout', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Logout failed', 500));

      await authApi.logout();

      expect(authUtils.clearAuthTokens).toHaveBeenCalled();
      expect(authUtils.clearUserData).toHaveBeenCalled();
      expect(authUtils.clearMfaToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
    });
  });

  describe('verifyMfa', () => {
    it('should successfully verify MFA code', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse({ user: mockUser, tokens: mockTokens }));

      const response = await authApi.verifyMfa(mockMfaCredentials);

      expect(response).toEqual({ user: mockUser, tokens: mockTokens });
      expect(authUtils.saveAuthTokens).toHaveBeenCalledWith(mockTokens);
      expect(authUtils.saveUserData).toHaveBeenCalledWith(mockUser);
      expect(authUtils.clearMfaToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.MFA, mockMfaCredentials);
    });

    it('should handle invalid MFA code', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Invalid MFA code', 400));

      await expect(authApi.verifyMfa(mockMfaCredentials)).rejects.toEqual({
        error: { code: 400, message: 'Invalid MFA code', details: {} },
        status: 400,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.MFA, mockMfaCredentials);
    });
  });

  describe('forgotPassword', () => {
    it('should successfully initiate password reset', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.forgotPassword({ email: 'test@example.com' });

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PASSWORD_RESET, { email: 'test@example.com' });
    });

    it('should handle non-existent email', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.forgotPassword({ email: 'nonexistent@example.com' });

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PASSWORD_RESET, { email: 'nonexistent@example.com' });
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.resetPassword(mockResetPasswordRequest);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, mockResetPasswordRequest);
    });

    it('should handle invalid reset token', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Invalid reset token', 400));

      await expect(authApi.resetPassword(mockResetPasswordRequest)).rejects.toEqual({
        error: { code: 400, message: 'Invalid reset token', details: {} },
        status: 400,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, mockResetPasswordRequest);
    });

    it('should handle password policy violations', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Password does not meet policy', 400));

      await expect(authApi.resetPassword(mockResetPasswordRequest)).rejects.toEqual({
        error: { code: 400, message: 'Password does not meet policy', details: {} },
        status: 400,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, mockResetPasswordRequest);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.changePassword(mockChangePasswordRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', mockChangePasswordRequest);
    });

    it('should handle incorrect current password', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Incorrect current password', 400));

      await expect(authApi.changePassword(mockChangePasswordRequest)).rejects.toEqual({
        error: { code: 400, message: 'Incorrect current password', details: {} },
        status: 400,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', mockChangePasswordRequest);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockTokens));

      const response = await authApi.refreshToken();

      expect(response).toEqual(mockTokens);
      expect(authUtils.saveAuthTokens).toHaveBeenCalledWith(mockTokens);
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH);
    });

    it('should handle expired refresh token', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(mockApiErrorResponse('Expired refresh token', 401));

      await expect(authApi.refreshToken()).rejects.toEqual({
        error: { code: 401, message: 'Expired refresh token', details: {} },
        status: 401,
        statusText: 'Error'
      });
      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH);
    });
  });

  describe('MFA setup and management', () => {
    it('should successfully setup MFA', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockMfaSetupResponse));

      const response = await authApi.setupMfa();

      expect(response).toEqual(mockMfaSetupResponse);
      expect(apiClient.post).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH.MFA}/setup`);
    });

    it('should successfully verify MFA setup', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.verifyMfaSetup('123456');

      expect(apiClient.post).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH.MFA}/setup/verify`, { code: '123456' });
    });

    it('should successfully disable MFA', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.disableMfa('password');

      expect(apiClient.post).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH.MFA}/disable`, { password: 'password' });
    });
  });

  describe('Session management', () => {
    it('should successfully retrieve active sessions', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockSessions));

      const response = await authApi.getSessions();

      expect(response).toEqual(mockSessions);
      expect(apiClient.get).toHaveBeenCalledWith('/auth/sessions');
    });

    it('should successfully terminate a specific session', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.terminateSession('session-1');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/sessions/session-1/terminate');
    });

    it('should successfully terminate all other sessions', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.terminateAllSessions();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/sessions/terminate-all');
    });
  });

  describe('Trusted device management', () => {
    it('should successfully retrieve trusted devices', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockTrustedDevices));

      const response = await authApi.getTrustedDevices();

      expect(response).toEqual(mockTrustedDevices);
      expect(apiClient.get).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH.MFA}/trusted-devices`);
    });

    it('should successfully remove a trusted device', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(null));

      await authApi.removeTrustedDevice('device-1');

      expect(apiClient.post).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH.MFA}/trusted-devices/device-1/remove`);
    });
  });
});