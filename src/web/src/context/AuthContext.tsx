/**
 * Authentication Context for HCBS Revenue Management System
 *
 * Provides a React context for authentication state and operations throughout the application.
 * Implements secure authentication flows including login, logout, MFA verification, password reset,
 * and permission-based authorization controls.
 *
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'; // react v18.2+
import {
  AuthContextType,
  AuthUser,
  AuthStatus,
  LoginCredentials,
  MfaCredentials,
  ResetPasswordRequest,
  LoginResponse,
  MfaResponse
} from '../types/auth.types';
import { LoadingState } from '../types/common.types';
import {
  login,
  logout,
  verifyMfa,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../api/auth.api';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserData,
  getAuthTokens,
  isTokenExpiringSoon
} from '../utils/auth';

/**
 * React context for authentication state and functions
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for the authentication context
 * 
 * Manages authentication state and provides authentication-related functions
 * to all child components in the application.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User information and authentication status
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.UNAUTHENTICATED);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [mfaResponse, setMfaResponse] = useState<MfaResponse | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const tokenRefreshTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize authentication state from storage on component mount
  useEffect(() => {
    const storedUser = getUserData();
    const tokens = getAuthTokens();
    
    if (storedUser && tokens) {
      setUser(storedUser);
      setStatus(AuthStatus.AUTHENTICATED);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
      setIsAuthenticated(false);
    }
    
    setInitialized(true);
  }, []);
  
  // Handle token refresh
  const handleRefreshToken = useCallback(async (): Promise<void> => {
    try {
      const tokens = await refreshToken();
      // If successful, no need to update state as the tokens are stored by the API function
    } catch (err) {
      // If token refresh fails, clear auth state (effectively logging out the user)
      setUser(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
      setIsAuthenticated(false);
      setMfaRequired(false);
      setMfaResponse(null);
    }
  }, []);
  
  // Set up token refresh timer when authenticated
  useEffect(() => {
    // Clear any existing timer
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current);
      tokenRefreshTimer.current = null;
    }
    
    // If user is authenticated, setup token refresh
    if (status === AuthStatus.AUTHENTICATED && user) {
      const tokens = getAuthTokens();
      
      if (tokens && isTokenExpiringSoon(tokens.accessToken, tokens.expiresAt)) {
        // Set up a timer to refresh the token
        tokenRefreshTimer.current = setTimeout(() => {
          handleRefreshToken();
        }, 1000); // Small delay before refreshing
      }
    }
    
    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
    };
  }, [user, status, handleRefreshToken]);
  
  /**
   * Authenticates a user with email and password
   * 
   * @param credentials - Login credentials containing email, password, and remember me option
   * @returns Promise resolving to login response with tokens and user data or MFA challenge
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await login(credentials);
      
      if (response.mfaRequired) {
        setMfaRequired(true);
        setMfaResponse(response.mfaResponse);
        setStatus(AuthStatus.MFA_REQUIRED);
      } else if (response.user && response.tokens) {
        setUser(response.user);
        setStatus(AuthStatus.AUTHENTICATED);
        setIsAuthenticated(true);
        setMfaRequired(false);
        setMfaResponse(null);
      }
      
      setLoading(LoadingState.SUCCESS);
      return response;
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err as Error);
      throw err;
    }
  }, []);
  
  /**
   * Logs out the current user and invalidates their session
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    setLoading(LoadingState.LOADING);
    
    try {
      await logout();
      
      // Clear local auth state
      setUser(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
      setIsAuthenticated(false);
      setMfaRequired(false);
      setMfaResponse(null);
      
      setLoading(LoadingState.SUCCESS);
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err as Error);
      
      // Even if API logout fails, clear local auth state
      setUser(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
      setIsAuthenticated(false);
      
      throw err;
    }
  }, []);
  
  /**
   * Verifies a multi-factor authentication code during login
   * 
   * @param credentials - MFA verification credentials containing token and verification code
   * @returns Promise resolving to login response with tokens and user data
   */
  const handleVerifyMfa = useCallback(async (credentials: MfaCredentials): Promise<LoginResponse> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await verifyMfa(credentials);
      
      if (response.user && response.tokens) {
        setUser(response.user);
        setStatus(AuthStatus.AUTHENTICATED);
        setIsAuthenticated(true);
        setMfaRequired(false);
        setMfaResponse(null);
      }
      
      setLoading(LoadingState.SUCCESS);
      return response;
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err as Error);
      throw err;
    }
  }, []);
  
  /**
   * Initiates the password reset process for a user
   * 
   * @param email - Email address for the account to reset
   */
  const handleForgotPassword = useCallback(async (email: string): Promise<void> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      await forgotPassword({ email });
      setLoading(LoadingState.SUCCESS);
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err as Error);
      throw err;
    }
  }, []);
  
  /**
   * Resets a user's password using a reset token
   * 
   * @param request - Object containing reset token and new password
   */
  const handleResetPassword = useCallback(async (request: ResetPasswordRequest): Promise<void> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      await resetPassword(request);
      setLoading(LoadingState.SUCCESS);
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err as Error);
      throw err;
    }
  }, []);
  
  /**
   * Checks if the current user has a specific permission
   * 
   * @param permission - The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  const checkPermission = useCallback((permission: string): boolean => {
    return hasPermission(user, permission);
  }, [user]);
  
  /**
   * Checks if the current user has any of the specified permissions
   * 
   * @param permissions - Array of permissions to check
   * @returns True if the user has any of the permissions, false otherwise
   */
  const checkAnyPermission = useCallback((permissions: string[]): boolean => {
    return hasAnyPermission(user, permissions);
  }, [user]);
  
  /**
   * Checks if the current user has all of the specified permissions
   * 
   * @param permissions - Array of permissions to check
   * @returns True if the user has all of the permissions, false otherwise
   */
  const checkAllPermissions = useCallback((permissions: string[]): boolean => {
    return hasAllPermissions(user, permissions);
  }, [user]);
  
  // Create the context value with authentication state and functions
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    status,
    loading,
    error,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    verifyMfa: handleVerifyMfa,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions
  }), [
    user,
    status,
    loading,
    error,
    isAuthenticated,
    handleLogin,
    handleLogout,
    handleVerifyMfa,
    handleForgotPassword,
    handleResetPassword,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access the authentication context
 * 
 * @returns The authentication context value
 * @throws Error if used outside of AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };