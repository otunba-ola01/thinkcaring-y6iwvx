/**
 * Authentication Slice for HCBS Revenue Management System
 * 
 * This Redux slice manages authentication state and provides reducers and actions 
 * for authentication-related operations including login, logout, MFA verification,
 * session management, and error handling. It integrates with the authentication 
 * thunks to provide a comprehensive authentication framework that meets HIPAA security
 * requirements for healthcare financial applications.
 * 
 * @version 1.0.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+

import { AuthState, AuthStatus } from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import {
  loginThunk,
  logoutThunk,
  verifyMfaThunk,
  forgotPasswordThunk,
  resetPasswordThunk,
  refreshTokenThunk,
  checkAuthThunk
} from './authThunks';

/**
 * Initial state for the authentication slice
 */
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

/**
 * Redux slice for authentication state management
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clears any authentication error
     */
    clearAuthError: (state) => {
      state.error = null;
    },
    
    /**
     * Sets the authentication initialization status
     */
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Handle login thunk
    builder.addCase(loginThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      
      if (action.payload.mfaRequired) {
        state.mfaRequired = true;
        state.mfaResponse = action.payload.mfaResponse;
        state.status = AuthStatus.MFA_REQUIRED;
      } else if (action.payload.user && action.payload.tokens) {
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.status = AuthStatus.AUTHENTICATED;
      }
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload as any;
    });
    
    // Handle logout thunk
    builder.addCase(logoutThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.status = AuthStatus.UNAUTHENTICATED;
      state.user = null;
      state.tokens = null;
      state.mfaRequired = false;
      state.mfaResponse = null;
      state.loading = LoadingState.IDLE;
      state.error = null;
    });
    builder.addCase(logoutThunk.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload as any;
    });
    
    // Handle MFA verification thunk
    builder.addCase(verifyMfaThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(verifyMfaThunk.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.mfaRequired = false;
      state.mfaResponse = null;
      
      if (action.payload.user && action.payload.tokens) {
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.status = AuthStatus.AUTHENTICATED;
      }
    });
    builder.addCase(verifyMfaThunk.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload as any;
    });
    
    // Handle forgot password thunk
    builder.addCase(forgotPasswordThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(forgotPasswordThunk.fulfilled, (state) => {
      state.loading = LoadingState.SUCCEEDED;
    });
    builder.addCase(forgotPasswordThunk.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload as any;
    });
    
    // Handle reset password thunk
    builder.addCase(resetPasswordThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(resetPasswordThunk.fulfilled, (state) => {
      state.loading = LoadingState.SUCCEEDED;
    });
    builder.addCase(resetPasswordThunk.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload as any;
    });
    
    // Handle token refresh thunk
    builder.addCase(refreshTokenThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(refreshTokenThunk.fulfilled, (state, action) => {
      state.tokens = action.payload;
      state.loading = LoadingState.SUCCEEDED;
    });
    builder.addCase(refreshTokenThunk.rejected, (state) => {
      // Session is invalid, reset authentication state
      state.status = AuthStatus.UNAUTHENTICATED;
      state.user = null;
      state.tokens = null;
      state.loading = LoadingState.IDLE;
    });
    
    // Handle authentication check thunk
    builder.addCase(checkAuthThunk.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(checkAuthThunk.fulfilled, (state, action) => {
      state.initialized = true;
      state.loading = LoadingState.IDLE;
      
      if (action.payload.isAuthenticated) {
        state.status = AuthStatus.AUTHENTICATED;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
      } else if (action.payload.mfaRequired) {
        state.status = AuthStatus.MFA_REQUIRED;
        state.mfaRequired = true;
        // If MFA token is provided in the payload, store it
        if (action.payload.mfaToken) {
          state.mfaResponse = {
            mfaToken: action.payload.mfaToken,
            method: action.payload.method || 'app',
            expiresAt: Date.now() + (5 * 60 * 1000) // Default 5 minute expiry if not specified
          };
        }
      } else {
        state.status = AuthStatus.UNAUTHENTICATED;
        state.user = null;
        state.tokens = null;
      }
    });
    builder.addCase(checkAuthThunk.rejected, (state) => {
      state.initialized = true;
      state.loading = LoadingState.IDLE;
      state.status = AuthStatus.UNAUTHENTICATED;
      state.user = null;
      state.tokens = null;
    });
  }
});

// Export actions
export const { clearAuthError, setAuthInitialized } = authSlice.actions;

// Export reducer
export const authReducer = authSlice.reducer;