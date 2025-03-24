import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';
import { AuthContextType, AuthStatus } from '../types/auth.types';
import { LoadingState, ResponseError } from '../types/common.types';

// Storage key for redirect after login
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';

/**
 * Custom hook that provides authentication functionality throughout the HCBS Revenue Management System.
 * This hook simplifies access to authentication state and operations by wrapping the AuthContext
 * and providing a consistent interface for components to interact with the authentication system.
 *
 * @returns Authentication context with additional utility functions
 */
export function useAuth() {
  // Get authentication context
  const auth = useAuthContext();
  // Get Next.js router
  const router = useRouter();

  /**
   * Redirects the user to the login page, optionally saving the current path
   * for redirection after successful login
   */
  const redirectToLogin = useCallback(() => {
    const currentPath = router.asPath;
    // Don't save login-related paths
    if (!currentPath.startsWith('/auth/')) {
      // Save the current path to redirect back after login
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, currentPath);
    }
    router.push('/auth/login');
  }, [router]);

  /**
   * Redirects the user to the appropriate page after successful login
   * (either the previously attempted page or the dashboard)
   */
  const redirectAfterLogin = useCallback(() => {
    const redirectPath = sessionStorage.getItem(REDIRECT_STORAGE_KEY) || '/dashboard';
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    router.push(redirectPath);
  }, [router]);

  // Determine if authentication is in loading state
  const isLoading = useMemo(() => {
    return auth.loading === LoadingState.LOADING;
  }, [auth.loading]);

  // Determine if authentication has an error
  const isError = useMemo(() => {
    return auth.loading === LoadingState.ERROR && auth.error !== null;
  }, [auth.loading, auth.error]);

  // Effect to handle authentication state changes
  useEffect(() => {
    // If the user is on a protected page and not authenticated, redirect to login
    const isProtectedRoute = !router.pathname.startsWith('/auth/') && 
                             router.pathname !== '/' &&
                             router.pathname !== '/terms' &&
                             router.pathname !== '/privacy';
                             
    if (auth.status === AuthStatus.UNAUTHENTICATED && 
        isProtectedRoute && 
        router.isReady) {
      redirectToLogin();
    }
  }, [auth.status, router.pathname, router.isReady, redirectToLogin]);

  // Return authentication context with additional utility functions
  return {
    ...auth,
    redirectToLogin,
    redirectAfterLogin,
    isLoading,
    isError
  };
}

export default useAuth;