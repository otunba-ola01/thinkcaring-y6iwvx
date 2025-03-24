import { renderHook } from '@testing-library/react-hooks'; // @testing-library/react-hooks v8.0.1
import { act } from '@testing-library/react'; // @testing-library/react v13.4.0
import { waitFor } from '@testing-library/react'; // @testing-library/react v13.4.0
import { useRouter } from 'next/router'; // next/router
import renderHookWithProviders from '../../../utils/render-hook';
import useAuth from '../../../../hooks/useAuth';
import { AuthStatus } from '../../../../types/auth.types';
import { LoadingState } from '../../../../types/common.types';
import { createMockUser } from '../../../utils/mock-data';
import { mockApiResponse } from '../../../utils/mock-api';

// Mock the useRouter hook
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock the AuthContext
jest.mock('../../../../context/AuthContext', () => ({
  useAuthContext: jest.fn()
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      prefetch: jest.fn(),
      query: {}
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return authentication context values', () => {
    const mockUser = createMockUser();
    const mockAuthContext = {
      user: mockUser,
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.status).toEqual(AuthStatus.AUTHENTICATED);
    expect(result.current.loading).toEqual(LoadingState.IDLE);
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.login).toBeInstanceOf(Function);
    expect(result.current.logout).toBeInstanceOf(Function);
    expect(result.current.verifyMfa).toBeInstanceOf(Function);
    expect(result.current.forgotPassword).toBeInstanceOf(Function);
    expect(result.current.resetPassword).toBeInstanceOf(Function);
    expect(result.current.hasPermission).toBeInstanceOf(Function);
    expect(result.current.hasAnyPermission).toBeInstanceOf(Function);
    expect(result.current.hasAllPermissions).toBeInstanceOf(Function);
  });

  it('should return additional utility functions', () => {
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    expect(result.current.redirectToLogin).toBeInstanceOf(Function);
    expect(result.current.redirectAfterLogin).toBeInstanceOf(Function);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should set isLoading to true when loading state is LOADING', () => {
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.LOADING,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('should set isError to true when loading state is ERROR', () => {
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.ERROR,
      error: new Error('Test error'),
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    expect(result.current.isError).toBe(true);
  });

  it('should call router.push with /login when redirectToLogin is called', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      prefetch: jest.fn(),
      query: {}
    });
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    act(() => {
      result.current.redirectToLogin();
    });

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('should call router.push with / when redirectAfterLogin is called with no returnUrl', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      prefetch: jest.fn(),
      query: {}
    });
    const mockAuthContext = {
      user: null,
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    act(() => {
      result.current.redirectAfterLogin();
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should call router.push with returnUrl when redirectAfterLogin is called with returnUrl in query', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      prefetch: jest.fn(),
      query: { returnUrl: '/clients' }
    });
    const mockAuthContext = {
      user: null,
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    act(() => {
      result.current.redirectAfterLogin();
    });

    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('should handle login function from context', async () => {
    const mockLoginFn = jest.fn().mockResolvedValue(mockApiResponse({ user: createMockUser(), tokens: { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now() } }));
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: mockLoginFn,
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const credentials = { email: 'test@example.com', password: 'password', rememberMe: false };
    await act(async () => {
      await result.current.login(credentials);
    });

    expect(mockLoginFn).toHaveBeenCalledWith(credentials);
  });

  it('should handle logout function from context', async () => {
    const mockLogoutFn = jest.fn().mockResolvedValue(undefined);
    const mockAuthContext = {
      user: createMockUser(),
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: mockLogoutFn,
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogoutFn).toHaveBeenCalled();
  });

  it('should handle verifyMfa function from context', async () => {
    const mockVerifyMfaFn = jest.fn().mockResolvedValue(mockApiResponse({ user: createMockUser(), tokens: { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now() } }));
    const mockAuthContext = {
      user: null,
      status: AuthStatus.MFA_REQUIRED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: mockVerifyMfaFn,
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const credentials = { mfaToken: 'test', code: '123456', rememberDevice: false };
    await act(async () => {
      await result.current.verifyMfa(credentials);
    });

    expect(mockVerifyMfaFn).toHaveBeenCalledWith(credentials);
  });

  it('should handle forgotPassword function from context', async () => {
    const mockForgotPasswordFn = jest.fn().mockResolvedValue(undefined);
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: mockForgotPasswordFn,
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const email = 'test@example.com';
    await act(async () => {
      await result.current.forgotPassword(email);
    });

    expect(mockForgotPasswordFn).toHaveBeenCalledWith(email);
  });

  it('should handle resetPassword function from context', async () => {
    const mockResetPasswordFn = jest.fn().mockResolvedValue(undefined);
    const mockAuthContext = {
      user: null,
      status: AuthStatus.UNAUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: mockResetPasswordFn,
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const request = { token: 'test', password: 'password', confirmPassword: 'password' };
    await act(async () => {
      await result.current.resetPassword(request);
    });

    expect(mockResetPasswordFn).toHaveBeenCalledWith(request);
  });

  it('should handle hasPermission function from context', () => {
    const mockHasPermissionFn = jest.fn().mockReturnValue(true);
    const mockAuthContext = {
      user: createMockUser(),
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: mockHasPermissionFn,
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const permission = 'claims:view';
    const hasPermissionResult = result.current.hasPermission(permission);

    expect(mockHasPermissionFn).toHaveBeenCalledWith(permission);
    expect(hasPermissionResult).toBe(true);
  });

  it('should handle hasAnyPermission function from context', () => {
    const mockHasAnyPermissionFn = jest.fn().mockReturnValue(true);
    const mockAuthContext = {
      user: createMockUser(),
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: mockHasAnyPermissionFn,
      hasAllPermissions: jest.fn()
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const permissions = ['claims:view', 'payments:view'];
    const hasAnyPermissionResult = result.current.hasAnyPermission(permissions);

    expect(mockHasAnyPermissionFn).toHaveBeenCalledWith(permissions);
    expect(hasAnyPermissionResult).toBe(true);
  });

  it('should handle hasAllPermissions function from context', () => {
    const mockHasAllPermissionsFn = jest.fn().mockReturnValue(true);
    const mockAuthContext = {
      user: createMockUser(),
      status: AuthStatus.AUTHENTICATED,
      loading: LoadingState.IDLE,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      verifyMfa: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: mockHasAllPermissionsFn
    };
    (require('../../../../context/AuthContext').useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);

    const { result } = renderHookWithProviders(() => useAuth());

    const permissions = ['claims:view', 'payments:view'];
    const hasAllPermissionsResult = result.current.hasAllPermissions(permissions);

    expect(mockHasAllPermissionsFn).toHaveBeenCalledWith(permissions);
    expect(hasAllPermissionsResult).toBe(true);
  });
});