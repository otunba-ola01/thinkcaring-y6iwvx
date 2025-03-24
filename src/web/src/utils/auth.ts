/**
 * Utility functions for authentication-related operations in the HCBS Revenue Management System.
 * 
 * This file provides utility functions for managing authentication tokens, user data,
 * permission checking, password validation, and related authentication operations.
 * All implementations follow HIPAA security requirements and industry best practices
 * for healthcare financial applications.
 * 
 * @packageDocumentation
 */

import jwtDecode from 'jwt-decode'; // jwt-decode v3.1+
import Cookies from 'js-cookie'; // js-cookie v3.0+

import { AuthUser, AuthTokens, PasswordStrength } from '../types/auth.types';
import {
  AUTH_STORAGE_KEYS,
  PASSWORD_POLICY
} from '../constants/auth.constants';
import { authConfig, cookieConfig } from '../config/auth.config';
import {
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem
} from './storage';

/**
 * Saves authentication tokens to storage (localStorage and/or cookies)
 * 
 * @param tokens - Authentication tokens to be saved
 */
export function saveAuthTokens(tokens: AuthTokens): void {
  if (!tokens) return;

  // Save to localStorage if configured
  if (authConfig.tokenStorage.useLocalStorage) {
    setLocalStorageItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    setLocalStorageItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    setLocalStorageItem(AUTH_STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt);
  }

  // Save to cookies if configured
  if (authConfig.tokenStorage.useCookies) {
    Cookies.set(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken, {
      ...cookieConfig,
      expires: new Date(Date.now() + authConfig.tokenStorage.accessTokenExpiry)
    });
    
    Cookies.set(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, {
      ...cookieConfig,
      expires: new Date(Date.now() + authConfig.tokenStorage.refreshTokenExpiry)
    });
    
    Cookies.set(AUTH_STORAGE_KEYS.EXPIRES_AT, String(tokens.expiresAt), {
      ...cookieConfig,
      expires: new Date(Date.now() + authConfig.tokenStorage.refreshTokenExpiry)
    });
  }
}

/**
 * Retrieves authentication tokens from storage
 * 
 * @returns The stored authentication tokens or null if not found
 */
export function getAuthTokens(): AuthTokens | null {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let expiresAt: number | null = null;

  // Try to get from localStorage if configured
  if (authConfig.tokenStorage.useLocalStorage) {
    accessToken = getLocalStorageItem<string | null>(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null);
    refreshToken = getLocalStorageItem<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null);
    expiresAt = getLocalStorageItem<number | null>(AUTH_STORAGE_KEYS.EXPIRES_AT, null);
  }

  // Try to get from cookies if configured and not found in localStorage
  if (authConfig.tokenStorage.useCookies && (!accessToken || !refreshToken || !expiresAt)) {
    const accessTokenCookie = Cookies.get(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    const refreshTokenCookie = Cookies.get(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAtCookie = Cookies.get(AUTH_STORAGE_KEYS.EXPIRES_AT);

    accessToken = accessToken || accessTokenCookie || null;
    refreshToken = refreshToken || refreshTokenCookie || null;
    expiresAt = expiresAt || (expiresAtCookie ? parseInt(expiresAtCookie, 10) : null);
  }

  // Return tokens if all values are found
  if (accessToken && refreshToken && expiresAt) {
    return {
      accessToken,
      refreshToken,
      expiresAt
    };
  }

  return null;
}

/**
 * Removes authentication tokens from storage
 */
export function clearAuthTokens(): void {
  // Remove from localStorage if configured
  if (authConfig.tokenStorage.useLocalStorage) {
    removeLocalStorageItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    removeLocalStorageItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    removeLocalStorageItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
  }

  // Remove from cookies if configured
  if (authConfig.tokenStorage.useCookies) {
    Cookies.remove(AUTH_STORAGE_KEYS.ACCESS_TOKEN, { path: cookieConfig.path });
    Cookies.remove(AUTH_STORAGE_KEYS.REFRESH_TOKEN, { path: cookieConfig.path });
    Cookies.remove(AUTH_STORAGE_KEYS.EXPIRES_AT, { path: cookieConfig.path });
  }
}

/**
 * Saves authenticated user data to storage
 * 
 * @param user - The authenticated user data to save
 */
export function saveUserData(user: AuthUser): void {
  if (!user) return;
  
  setLocalStorageItem(AUTH_STORAGE_KEYS.USER, user);
}

/**
 * Retrieves authenticated user data from storage
 * 
 * @returns The stored user data or null if not found
 */
export function getUserData(): AuthUser | null {
  return getLocalStorageItem<AuthUser | null>(AUTH_STORAGE_KEYS.USER, null);
}

/**
 * Removes authenticated user data from storage
 */
export function clearUserData(): void {
  removeLocalStorageItem(AUTH_STORAGE_KEYS.USER);
}

/**
 * Checks if an authentication token is expired
 * 
 * @param token - The JWT token to check
 * @param expiresAt - Optional explicit expiration time in milliseconds
 * @returns True if the token is expired or invalid, false otherwise
 */
export function isTokenExpired(token?: string, expiresAt?: number): boolean {
  if (!token) return true;

  try {
    // Use provided expiresAt if available
    if (expiresAt) {
      return Date.now() >= expiresAt;
    }

    // Otherwise, decode the token to get the expiration claim
    const decodedToken = jwtDecode<{ exp: number }>(token);
    
    // JWT exp claim is in seconds, convert to milliseconds
    const expiration = decodedToken.exp * 1000;
    
    return Date.now() >= expiration;
  } catch (error) {
    // If token cannot be decoded, consider it expired
    console.error('Error decoding token:', error);
    return true;
  }
}

/**
 * Checks if an authentication token is expiring soon and should be refreshed
 * 
 * @param token - The JWT token to check
 * @param expiresAt - Optional explicit expiration time in milliseconds
 * @returns True if the token is expiring soon, false otherwise
 */
export function isTokenExpiringSoon(token?: string, expiresAt?: number): boolean {
  // If token is already expired, it's definitely expiring soon
  if (isTokenExpired(token, expiresAt)) return true;

  try {
    // Calculate time until expiration
    let expirationTime: number;
    
    if (expiresAt) {
      expirationTime = expiresAt;
    } else if (token) {
      const decodedToken = jwtDecode<{ exp: number }>(token);
      // JWT exp claim is in seconds, convert to milliseconds
      expirationTime = decodedToken.exp * 1000;
    } else {
      // No token or expiration time provided
      return true;
    }
    
    // Calculate time remaining in milliseconds
    const timeRemaining = expirationTime - Date.now();
    
    // Return true if time remaining is less than the refresh threshold
    return timeRemaining < authConfig.tokenRefreshThreshold;
  } catch (error) {
    // If token cannot be decoded, consider it expiring soon
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Checks if a user has a specific permission
 * 
 * @param user - The authenticated user to check
 * @param permission - The permission to check for
 * @returns True if the user has the permission, false otherwise
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user || !user.permissions || user.permissions.length === 0) {
    return false;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Checks if a user has any of the specified permissions
 * 
 * @param user - The authenticated user to check
 * @param permissions - Array of permissions to check
 * @returns True if the user has any of the permissions, false otherwise
 */
export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
  if (!user || !user.permissions || user.permissions.length === 0 || !permissions || permissions.length === 0) {
    return false;
  }
  
  return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Checks if a user has all of the specified permissions
 * 
 * @param user - The authenticated user to check
 * @param permissions - Array of permissions to check
 * @returns True if the user has all of the permissions, false otherwise
 */
export function hasAllPermissions(user: AuthUser | null, permissions: string[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  if (!permissions || permissions.length === 0) {
    return true; // Vacuously true
  }
  
  return permissions.every(permission => user.permissions.includes(permission));
}

/**
 * Evaluates the strength of a password based on complexity criteria
 * 
 * @param password - The password to evaluate
 * @returns The evaluated strength level of the password
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return PasswordStrength.VERY_WEAK;
  }

  let score = 0;
  
  // Check length
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  }
  
  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  // Check for numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  }
  
  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }
  
  // Check for mixed character types (more than one type)
  let typesCount = 0;
  if (/[A-Z]/.test(password)) typesCount++;
  if (/[a-z]/.test(password)) typesCount++;
  if (/[0-9]/.test(password)) typesCount++;
  if (/[^A-Za-z0-9]/.test(password)) typesCount++;
  
  if (typesCount >= 3) {
    score += 1;
  }
  
  // Map score to strength
  if (score <= 1) {
    return PasswordStrength.VERY_WEAK;
  } else if (score <= 3) {
    return PasswordStrength.WEAK;
  } else if (score <= 5) {
    return PasswordStrength.MEDIUM;
  } else if (score <= 7) {
    return PasswordStrength.STRONG;
  } else {
    return PasswordStrength.VERY_STRONG;
  }
}

/**
 * Validates a password against the system's password policy
 * 
 * @param password - The password to validate
 * @returns Validation result with error messages if invalid
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check length
  if (!password || password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long.`);
  }
  
  // Check for uppercase letters
  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  
  // Check for lowercase letters
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  
  // Check for numbers
  if (PASSWORD_POLICY.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  
  // Check for symbols
  if (PASSWORD_POLICY.REQUIRE_SYMBOLS && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Saves MFA token to storage during the authentication process
 * 
 * @param token - The MFA token to save
 */
export function saveMfaToken(token: string): void {
  setLocalStorageItem(AUTH_STORAGE_KEYS.MFA_TOKEN, token);
}

/**
 * Retrieves MFA token from storage
 * 
 * @returns The stored MFA token or null if not found
 */
export function getMfaToken(): string | null {
  return getLocalStorageItem<string | null>(AUTH_STORAGE_KEYS.MFA_TOKEN, null);
}

/**
 * Removes MFA token from storage
 */
export function clearMfaToken(): void {
  removeLocalStorageItem(AUTH_STORAGE_KEYS.MFA_TOKEN);
}

/**
 * Saves the remember me preference to storage
 * 
 * @param rememberMe - Whether to remember the user
 */
export function saveRememberMe(rememberMe: boolean): void {
  setLocalStorageItem(AUTH_STORAGE_KEYS.REMEMBER_ME, rememberMe);
}

/**
 * Retrieves the remember me preference from storage
 * 
 * @returns The stored preference or false if not found
 */
export function getRememberMe(): boolean {
  return getLocalStorageItem<boolean>(AUTH_STORAGE_KEYS.REMEMBER_ME, false);
}