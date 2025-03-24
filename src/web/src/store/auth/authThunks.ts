/**
 * Authentication Thunks for HCBS Revenue Management System
 * 
 * This file implements Redux Toolkit async thunks for authentication-related operations
 * including login, logout, MFA verification, password management, and session validation.
 * These thunks interact with the authentication API and update the Redux store accordingly,
 * supporting the comprehensive authentication framework required by HIPAA compliance.
 * 
 * @version 1.0.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+

import {
  LoginCredentials,
  MfaCredentials,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthTokens,
  AuthUser
} from '../../types/auth.types';

import {
  login,
  logout,
  verifyMfa,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../../api/auth.api';

import {
  getAuthTokensFromStorage,
  getUserFromStorage,
  getMfaTokenFromStorage
} from '../../utils/auth';

/**
 * Async thunk for user authentication with email and password
 * 
 * @param credentials - Login credentials containing email, password, and remember me option
 * @returns Promise resolving to login response with tokens and user data or MFA challenge
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for user logout and session termination
 * 
 * @returns Promise resolving when logout is complete
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for verifying MFA code during login
 * 
 * @param credentials - MFA verification credentials containing token and verification code
 * @returns Promise resolving to login response with tokens and user data
 */
export const verifyMfaThunk = createAsyncThunk(
  'auth/verifyMfa',
  async (credentials: MfaCredentials, { rejectWithValue }) => {
    try {
      const response = await verifyMfa(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for initiating password reset process
 * 
 * @param request - Object containing user's email address
 * @returns Promise resolving when request is processed
 */
export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (request: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      await forgotPassword(request);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for resetting password with token
 * 
 * @param request - Object containing reset token and new password
 * @returns Promise resolving when password is reset
 */
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (request: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      await resetPassword(request);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for refreshing authentication tokens
 * 
 * @returns Promise resolving to new authentication tokens
 */
export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await refreshToken();
      return tokens;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for checking authentication status on application startup
 * Retrieves stored authentication data and validates it, refreshing tokens if needed
 * 
 * @returns Promise resolving to authentication status and data
 */
export const checkAuthThunk = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Get auth data from storage
      const tokens = getAuthTokensFromStorage();
      const user = getUserFromStorage();
      const mfaToken = getMfaTokenFromStorage();
      
      // If we have tokens and user, validate them
      if (tokens && user) {
        // If tokens are expired, try to refresh
        if (tokens.expiresAt < Date.now()) {
          try {
            // Attempt to refresh the token
            await dispatch(refreshTokenThunk()).unwrap();
            // Get the updated tokens after refresh
            const refreshedTokens = getAuthTokensFromStorage();
            
            return {
              isAuthenticated: true,
              user,
              tokens: refreshedTokens
            };
          } catch (refreshError) {
            // Clear invalid auth data and return unauthenticated state
            return {
              isAuthenticated: false,
              user: null,
              tokens: null
            };
          }
        }
        
        // Tokens are valid, return authenticated state
        return {
          isAuthenticated: true,
          user,
          tokens
        };
      }
      
      // Check if we're in the middle of MFA verification
      if (mfaToken) {
        return {
          isAuthenticated: false,
          user: null,
          tokens: null,
          mfaRequired: true,
          mfaToken
        };
      }
      
      // No valid auth data, return unauthenticated state
      return {
        isAuthenticated: false,
        user: null,
        tokens: null
      };
    } catch (error) {
      // Something went wrong, return unauthenticated state
      return {
        isAuthenticated: false,
        user: null,
        tokens: null
      };
    }
  }
);