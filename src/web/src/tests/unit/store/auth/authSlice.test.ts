import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { authReducer, clearAuthError, setAuthInitialized } from '../../../../src/store/auth/authSlice';
import { 
  loginThunk, 
  logoutThunk, 
  verifyMfaThunk, 
  forgotPasswordThunk, 
  resetPasswordThunk, 
  refreshTokenThunk, 
  checkAuthThunk 
} from '../../../../src/store/auth/authThunks';
import { AuthState, AuthStatus, MfaMethod } from '../../../../src/types/auth.types';
import { LoadingState } from '../../../../src/types/common.types';
import * as authApi from '../../../../src/api/auth.api';
import { mockApiResponse } from '../../../utils/mock-api';

// Mock the auth API functions
jest.mock('../../../../src/api/auth.api', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  verifyMfa: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
  getMfaTokenFromStorage: jest.fn()
}));

// Mock data
const mockUser = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  permissions: ['view_dashboard', 'manage_claims'],
  mfaEnabled: true,
  lastLogin: '2023-05-01T12:00:00Z',
  status: 'active',
  organization: {
    id: '456',
    name: 'Test Organization'
  }
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000 // 1 hour in the future
};

const mockLoginResponse = {
  user: mockUser,
  tokens: mockTokens,
  mfaRequired: false,
  mfaResponse: null
};

const mockMfaResponse = {
  mfaToken: 'mock-mfa-token',
  method: MfaMethod.APP,
  expiresAt: Date.now() + 300000 // 5 minutes in the future
};

const mockLoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true
};

const mockMfaCredentials = {
  mfaToken: 'mock-mfa-token',
  code: '123456',
  rememberDevice: true
};

const mockError = {
  code: 'INVALID_CREDENTIALS',
  message: 'Invalid username or password',
  details: null
};

/**
 * Helper function to create a Redux store with auth reducer for testing
 */
function createTestStore(initialState?: Partial<AuthState>) {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        status: AuthStatus.UNAUTHENTICATED,
        user: null,
        tokens: null,
        mfaRequired: false,
        mfaResponse: null,
        loading: LoadingState.IDLE,
        error: null,
        initialized: false,
        ...initialState
      }
    }
  });
}

describe('Auth Slice', () => {
  test('should return the initial state', () => {
    const initialState = undefined;
    const action = { type: undefined };
    const expectedState = {
      status: AuthStatus.UNAUTHENTICATED,
      user: null,
      tokens: null,
      mfaRequired: false,
      mfaResponse: null,
      loading: LoadingState.IDLE,
      error: null,
      initialized: false
    };
    
    expect(authReducer(initialState, action)).toEqual(expectedState);
  });
  
  test('should handle clearAuthError', () => {
    const initialState: AuthState = {
      status: AuthStatus.UNAUTHENTICATED,
      user: null,
      tokens: null,
      mfaRequired: false,
      mfaResponse: null,
      loading: LoadingState.IDLE,
      error: mockError,
      initialized: false
    };
    
    const action = clearAuthError();
    const expectedState = {
      ...initialState,
      error: null
    };
    
    expect(authReducer(initialState, action)).toEqual(expectedState);
  });
  
  test('should handle setAuthInitialized', () => {
    const initialState: AuthState = {
      status: AuthStatus.UNAUTHENTICATED,
      user: null,
      tokens: null,
      mfaRequired: false,
      mfaResponse: null,
      loading: LoadingState.IDLE,
      error: null,
      initialized: false
    };
    
    const action = setAuthInitialized(true);
    const expectedState = {
      ...initialState,
      initialized: true
    };
    
    expect(authReducer(initialState, action)).toEqual(expectedState);
  });
});

describe('Auth Thunks', () => {
  // Tests for loginThunk
  test('loginThunk.pending should set loading state', () => {
    const store = createTestStore();
    
    store.dispatch(loginThunk.pending('requestId', mockLoginCredentials));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
    expect(state.error).toBeNull();
  });
  
  test('loginThunk.fulfilled should handle successful login without MFA', () => {
    const store = createTestStore();
    const response = { ...mockLoginResponse, mfaRequired: false };
    
    store.dispatch(loginThunk.fulfilled(response, 'requestId', mockLoginCredentials));
    
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.AUTHENTICATED);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('loginThunk.fulfilled should handle MFA required response', () => {
    const store = createTestStore();
    const response = {
      user: null,
      tokens: null,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    };
    
    store.dispatch(loginThunk.fulfilled(response, 'requestId', mockLoginCredentials));
    
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.MFA_REQUIRED);
    expect(state.mfaRequired).toBe(true);
    expect(state.mfaResponse).toEqual(mockMfaResponse);
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('loginThunk.rejected should set error state', () => {
    const store = createTestStore();
    
    store.dispatch(loginThunk.rejected(new Error('Failed to login'), 'requestId', mockLoginCredentials, mockError));
    
    const state = store.getState().auth;
    expect(state.error).toEqual(mockError);
    expect(state.loading).toBe(LoadingState.FAILED);
  });
  
  // Tests for logoutThunk
  test('logoutThunk.fulfilled should reset auth state', () => {
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens,
      loading: LoadingState.IDLE
    });
    
    store.dispatch(logoutThunk.fulfilled(undefined, 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.loading).toBe(LoadingState.IDLE);
  });
  
  // Tests for verifyMfaThunk
  test('verifyMfaThunk.pending should set loading state', () => {
    const store = createTestStore({
      status: AuthStatus.MFA_REQUIRED,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    });
    
    store.dispatch(verifyMfaThunk.pending('requestId', mockMfaCredentials));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
    expect(state.error).toBeNull();
  });
  
  test('verifyMfaThunk.fulfilled should update auth state', () => {
    const store = createTestStore({
      status: AuthStatus.MFA_REQUIRED,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    });
    
    store.dispatch(verifyMfaThunk.fulfilled(mockLoginResponse, 'requestId', mockMfaCredentials));
    
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.AUTHENTICATED);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.mfaRequired).toBe(false);
    expect(state.mfaResponse).toBeNull();
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('verifyMfaThunk.rejected should set error state', () => {
    const store = createTestStore({
      status: AuthStatus.MFA_REQUIRED,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    });
    
    store.dispatch(verifyMfaThunk.rejected(new Error('Failed to verify'), 'requestId', mockMfaCredentials, mockError));
    
    const state = store.getState().auth;
    expect(state.error).toEqual(mockError);
    expect(state.loading).toBe(LoadingState.FAILED);
  });
  
  // Tests for forgotPasswordThunk
  test('forgotPasswordThunk.pending should set loading state', () => {
    const store = createTestStore();
    
    store.dispatch(forgotPasswordThunk.pending('requestId', { email: 'test@example.com' }));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
    expect(state.error).toBeNull();
  });
  
  test('forgotPasswordThunk.fulfilled should set success state', () => {
    const store = createTestStore();
    
    store.dispatch(forgotPasswordThunk.fulfilled(undefined, 'requestId', { email: 'test@example.com' }));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('forgotPasswordThunk.rejected should set error state', () => {
    const store = createTestStore();
    
    store.dispatch(forgotPasswordThunk.rejected(new Error('Failed to process'), 'requestId', { email: 'test@example.com' }, mockError));
    
    const state = store.getState().auth;
    expect(state.error).toEqual(mockError);
    expect(state.loading).toBe(LoadingState.FAILED);
  });
  
  // Tests for resetPasswordThunk
  test('resetPasswordThunk.pending should set loading state', () => {
    const store = createTestStore();
    
    store.dispatch(resetPasswordThunk.pending('requestId', { token: 'token', password: 'newPassword', confirmPassword: 'newPassword' }));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
    expect(state.error).toBeNull();
  });
  
  test('resetPasswordThunk.fulfilled should set success state', () => {
    const store = createTestStore();
    
    store.dispatch(resetPasswordThunk.fulfilled(undefined, 'requestId', { token: 'token', password: 'newPassword', confirmPassword: 'newPassword' }));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('resetPasswordThunk.rejected should set error state', () => {
    const store = createTestStore();
    
    store.dispatch(resetPasswordThunk.rejected(new Error('Failed to reset'), 'requestId', { token: 'token', password: 'newPassword', confirmPassword: 'newPassword' }, mockError));
    
    const state = store.getState().auth;
    expect(state.error).toEqual(mockError);
    expect(state.loading).toBe(LoadingState.FAILED);
  });
  
  // Tests for refreshTokenThunk
  test('refreshTokenThunk.pending should set loading state', () => {
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    store.dispatch(refreshTokenThunk.pending('requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
  });
  
  test('refreshTokenThunk.fulfilled should update tokens', () => {
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: Date.now() + 3600000
    };
    
    store.dispatch(refreshTokenThunk.fulfilled(newTokens, 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.tokens).toEqual(newTokens);
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('refreshTokenThunk.rejected should reset auth state', () => {
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    store.dispatch(refreshTokenThunk.rejected(new Error('Failed to refresh'), 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.loading).toBe(LoadingState.IDLE);
  });
  
  // Tests for checkAuthThunk
  test('checkAuthThunk.pending should set loading state', () => {
    const store = createTestStore();
    
    store.dispatch(checkAuthThunk.pending('requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.LOADING);
  });
  
  test('checkAuthThunk.fulfilled should update auth state when authenticated', () => {
    const store = createTestStore();
    
    const response = {
      isAuthenticated: true,
      user: mockUser,
      tokens: mockTokens
    };
    
    store.dispatch(checkAuthThunk.fulfilled(response, 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.initialized).toBe(true);
    expect(state.status).toBe(AuthStatus.AUTHENTICATED);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.loading).toBe(LoadingState.IDLE);
  });
  
  test('checkAuthThunk.fulfilled should update auth state when not authenticated', () => {
    const store = createTestStore();
    
    const response = {
      isAuthenticated: false,
      user: null,
      tokens: null
    };
    
    store.dispatch(checkAuthThunk.fulfilled(response, 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.initialized).toBe(true);
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.loading).toBe(LoadingState.IDLE);
  });
  
  test('checkAuthThunk.rejected should set initialized and unauthenticated state', () => {
    const store = createTestStore();
    
    store.dispatch(checkAuthThunk.rejected(new Error('Failed to check'), 'requestId', undefined));
    
    const state = store.getState().auth;
    expect(state.initialized).toBe(true);
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.loading).toBe(LoadingState.IDLE);
  });
});

describe('Auth API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('loginThunk should call API and handle success without MFA', async () => {
    // Mock the API call
    (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);
    
    const store = createTestStore();
    await store.dispatch(loginThunk(mockLoginCredentials));
    
    // Check API was called with the right args
    expect(authApi.login).toHaveBeenCalledWith(mockLoginCredentials);
    
    // Check store state
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.AUTHENTICATED);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('loginThunk should call API and handle MFA required', async () => {
    // Mock the API call
    const mfaResponse = {
      user: null,
      tokens: null,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    };
    (authApi.login as jest.Mock).mockResolvedValue(mfaResponse);
    
    const store = createTestStore();
    await store.dispatch(loginThunk(mockLoginCredentials));
    
    // Check API was called with the right args
    expect(authApi.login).toHaveBeenCalledWith(mockLoginCredentials);
    
    // Check store state
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.MFA_REQUIRED);
    expect(state.mfaRequired).toBe(true);
    expect(state.mfaResponse).toEqual(mockMfaResponse);
  });
  
  test('loginThunk should handle API error', async () => {
    // Mock the API call to reject
    (authApi.login as jest.Mock).mockRejectedValue(mockError);
    
    const store = createTestStore();
    await store.dispatch(loginThunk(mockLoginCredentials));
    
    // Check store state
    const state = store.getState().auth;
    expect(state.error).toEqual(mockError);
    expect(state.loading).toBe(LoadingState.FAILED);
  });
  
  test('logoutThunk should call API and handle success', async () => {
    // Mock the API call
    (authApi.logout as jest.Mock).mockResolvedValue(undefined);
    
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    await store.dispatch(logoutThunk());
    
    // Check API was called
    expect(authApi.logout).toHaveBeenCalled();
    
    // Check store state
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });
  
  test('verifyMfaThunk should call API and handle success', async () => {
    // Mock the API call
    (authApi.verifyMfa as jest.Mock).mockResolvedValue(mockLoginResponse);
    
    const store = createTestStore({
      status: AuthStatus.MFA_REQUIRED,
      mfaRequired: true,
      mfaResponse: mockMfaResponse
    });
    
    await store.dispatch(verifyMfaThunk(mockMfaCredentials));
    
    // Check API was called with the right args
    expect(authApi.verifyMfa).toHaveBeenCalledWith(mockMfaCredentials);
    
    // Check store state
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.AUTHENTICATED);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
  });
  
  test('forgotPasswordThunk should call API and handle success', async () => {
    // Mock the API call
    (authApi.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    
    const forgotPasswordRequest = { email: 'test@example.com' };
    const store = createTestStore();
    
    await store.dispatch(forgotPasswordThunk(forgotPasswordRequest));
    
    // Check API was called with the right args
    expect(authApi.forgotPassword).toHaveBeenCalledWith(forgotPasswordRequest);
    
    // Check store state
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('resetPasswordThunk should call API and handle success', async () => {
    // Mock the API call
    (authApi.resetPassword as jest.Mock).mockResolvedValue(undefined);
    
    const resetPasswordRequest = { token: 'token', password: 'newPassword', confirmPassword: 'newPassword' };
    const store = createTestStore();
    
    await store.dispatch(resetPasswordThunk(resetPasswordRequest));
    
    // Check API was called with the right args
    expect(authApi.resetPassword).toHaveBeenCalledWith(resetPasswordRequest);
    
    // Check store state
    const state = store.getState().auth;
    expect(state.loading).toBe(LoadingState.SUCCEEDED);
  });
  
  test('refreshTokenThunk should call API and handle success', async () => {
    // Mock the API call
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: Date.now() + 3600000
    };
    (authApi.refreshToken as jest.Mock).mockResolvedValue(newTokens);
    
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    await store.dispatch(refreshTokenThunk());
    
    // Check API was called
    expect(authApi.refreshToken).toHaveBeenCalled();
    
    // Check store state
    const state = store.getState().auth;
    expect(state.tokens).toEqual(newTokens);
  });
  
  test('refreshTokenThunk should handle API error', async () => {
    // Mock the API call to reject
    (authApi.refreshToken as jest.Mock).mockRejectedValue(mockError);
    
    const store = createTestStore({
      status: AuthStatus.AUTHENTICATED,
      user: mockUser,
      tokens: mockTokens
    });
    
    await store.dispatch(refreshTokenThunk());
    
    // Check store state
    const state = store.getState().auth;
    expect(state.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });
});