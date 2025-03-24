import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { RootState } from '../rootReducer';
import { AuthState, AuthStatus } from '../../types/auth.types';

/**
 * Base selector that returns the entire auth slice from the Redux store
 * @param state 
 * @returns The complete authentication state
 */
export const selectAuthState = (state: RootState): AuthState => state.auth;

/**
 * Selector for the current authentication status
 * @returns Current authentication status (AUTHENTICATED, UNAUTHENTICATED, or MFA_REQUIRED)
 */
export const selectAuthStatus = createSelector(
  [selectAuthState],
  (authState) => authState.status
);

/**
 * Selector for the currently authenticated user
 * @returns Current user object or null if not authenticated
 */
export const selectCurrentUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

/**
 * Selector for the current authentication tokens
 * @returns Current authentication tokens or null if not authenticated
 */
export const selectAuthTokens = createSelector(
  [selectAuthState],
  (authState) => authState.tokens
);

/**
 * Selector that determines if the user is fully authenticated
 * @returns True if user is authenticated, false otherwise
 */
export const selectIsAuthenticated = createSelector(
  [selectAuthStatus],
  (status) => status === AuthStatus.AUTHENTICATED
);

/**
 * Selector that determines if MFA verification is required
 * @returns True if MFA verification is required, false otherwise
 */
export const selectIsMfaRequired = createSelector(
  [selectAuthState],
  (authState) => authState.mfaRequired
);

/**
 * Selector for the MFA challenge response data
 * @returns MFA challenge response data or null if not applicable
 */
export const selectMfaResponse = createSelector(
  [selectAuthState],
  (authState) => authState.mfaResponse
);

/**
 * Selector for the authentication loading state
 * @returns Current loading state for authentication operations
 */
export const selectAuthLoading = createSelector(
  [selectAuthState],
  (authState) => authState.loading
);

/**
 * Selector for any authentication error
 * @returns Authentication error or null if no error
 */
export const selectAuthError = createSelector(
  [selectAuthState],
  (authState) => authState.error
);

/**
 * Selector that determines if authentication has been initialized
 * @returns True if authentication has been initialized, false otherwise
 */
export const selectIsAuthInitialized = createSelector(
  [selectAuthState],
  (authState) => authState.initialized
);

/**
 * Selector for the current user's permissions
 * @returns Array of permission strings or undefined if not authenticated
 */
export const selectUserPermissions = createSelector(
  [selectCurrentUser],
  (user) => user?.permissions
);

/**
 * Selector for the current user's role
 * @returns User role string or undefined if not authenticated
 */
export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role
);

/**
 * Selector for the current user's organization
 * @returns Organization object or undefined if not authenticated
 */
export const selectUserOrganization = createSelector(
  [selectCurrentUser],
  (user) => user?.organization
);

/**
 * Factory selector that creates a selector to check if user has a specific permission
 * @param permission 
 * @returns Selector function that returns true if user has the permission
 */
export const selectHasPermission = (permission: string) =>
  createSelector(
    [selectUserPermissions],
    (userPermissions) => userPermissions?.includes(permission) ?? false
  );