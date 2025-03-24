/**
 * API Interceptors for HCBS Revenue Management System
 * 
 * This file implements request and response interceptors for the API client.
 * These interceptors handle authentication token management, request/response logging,
 * error handling, and response formatting to ensure consistent API communication.
 * 
 * @version 1.0.0
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'; // axios v1.4+

import { getAuthTokens, isTokenExpiringSoon, isTokenExpired } from '../utils/auth';
import { ApiInterceptor } from '../types/api.types';
import { API_RESPONSE_CODES } from '../constants/api.constants';

/**
 * Type definition for a token refresh function
 */
type TokenRefreshFunction = () => Promise<void>;

/**
 * Creates an interceptor that adds authentication tokens to requests and handles token refresh
 * 
 * @param refreshTokenFn - Function to call for refreshing tokens
 * @param dispatch - Optional Redux dispatch function for updating global state
 * @returns Authentication interceptor object
 */
export function createAuthInterceptor(
  refreshTokenFn: TokenRefreshFunction,
  dispatch?: Function
): ApiInterceptor {
  return {
    onRequest: async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
      const tokens = getAuthTokens();
      
      if (tokens) {
        // Add the access token to the request headers
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        
        // If the token is expiring soon, trigger a token refresh
        if (isTokenExpiringSoon(tokens.accessToken, tokens.expiresAt)) {
          try {
            await refreshTokenFn();
            // Get the fresh tokens after refresh
            const newTokens = getAuthTokens();
            if (newTokens) {
              config.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            }
          } catch (error) {
            // Continue with the current token if refresh fails
            console.warn('Token refresh failed during request preparation', error);
          }
        }
      }
      
      return config;
    },
    
    onResponseError: async (error: AxiosError): Promise<any> => {
      // Handle unauthorized errors (token expired)
      if (error.response?.status === API_RESPONSE_CODES.UNAUTHORIZED) {
        const tokens = getAuthTokens();
        
        // Only attempt to refresh if we have a refresh token and the original request wasn't a refresh token request
        if (tokens?.refreshToken && !error.config.url?.includes('/auth/refresh')) {
          try {
            // Attempt to refresh the token
            await refreshTokenFn();
            
            // Get the updated tokens
            const newTokens = getAuthTokens();
            if (newTokens) {
              // Update the authorization header with the new token
              error.config.headers = error.config.headers || {};
              error.config.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
              
              // Retry the original request with the new token
              return axios(error.config);
            }
          } catch (refreshError) {
            // If refresh fails, clear auth state and let the error pass through
            console.error('Token refresh failed after unauthorized response', refreshError);
            
            // If dispatch function is provided, use it to clear auth state
            if (dispatch) {
              // Example: dispatch(logout());
              // We use dispatch to trigger the logout action or other auth state updates
            }
          }
        }
      }
      
      // For other errors, let the error pass through to the next handler
      return Promise.reject(error);
    }
  };
}

/**
 * Creates an interceptor that logs API requests and responses for debugging and monitoring
 * 
 * @returns Logging interceptor object
 */
export function createLoggingInterceptor(): ApiInterceptor {
  return {
    onRequest: (config: AxiosRequestConfig): AxiosRequestConfig => {
      // Clone the config to avoid modifying the original
      const sanitizedConfig = { ...config };
      
      // Remove sensitive information before logging
      if (sanitizedConfig.headers?.['Authorization']) {
        sanitizedConfig.headers = { ...sanitizedConfig.headers };
        sanitizedConfig.headers['Authorization'] = 'Bearer [REDACTED]';
      }
      
      // Sanitize any sensitive data in the request body
      const sensitiveKeys = ['password', 'token', 'secret', 'key'];
      if (sanitizedConfig.data) {
        const sanitizedData = { ...sanitizedConfig.data };
        sensitiveKeys.forEach(key => {
          if (sanitizedData[key]) {
            sanitizedData[key] = '[REDACTED]';
          }
        });
        sanitizedConfig.data = sanitizedData;
      }
      
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          timestamp: new Date().toISOString(),
          params: sanitizedConfig.params,
          headers: sanitizedConfig.headers,
          dataSize: config.data ? JSON.stringify(sanitizedConfig.data).length : 0
        }
      );
      
      // Add request timestamp for calculating duration
      (config as any)._requestTimestamp = Date.now();
      
      return config;
    },
    
    onResponse: (response: AxiosResponse): AxiosResponse => {
      const requestTimestamp = (response.config as any)._requestTimestamp;
      const duration = requestTimestamp ? Date.now() - requestTimestamp : null;
      
      console.log(
        `API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          timestamp: new Date().toISOString(),
          duration: duration ? `${duration}ms` : 'unknown',
          status: response.status,
          statusText: response.statusText,
          dataSize: JSON.stringify(response.data).length,
          contentType: response.headers['content-type']
        }
      );
      
      return response;
    },
    
    onRequestError: (error: any): any => {
      console.error(`API Request Error:`, {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      return Promise.reject(error);
    },
    
    onResponseError: (error: AxiosError): any => {
      // Calculate request duration if possible
      const requestTimestamp = (error.config as any)?._requestTimestamp;
      const duration = requestTimestamp ? Date.now() - requestTimestamp : null;
      
      console.error(
        `API Response Error: ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        {
          timestamp: new Date().toISOString(),
          duration: duration ? `${duration}ms` : 'unknown',
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          response: error.response?.data,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      );
      
      return Promise.reject(error);
    }
  };
}

/**
 * Creates an interceptor that standardizes error handling for API responses
 * 
 * @returns Error handling interceptor object
 */
export function createErrorInterceptor(): ApiInterceptor {
  return {
    onResponseError: (error: AxiosError): any => {
      // Create a standardized error object that follows ResponseError interface
      let standardError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: null
      };
      
      // If it's a network error (no response received)
      if (error.message === 'Network Error') {
        standardError = {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          details: { originalError: error.message }
        };
      }
      // If it's a timeout error
      else if (error.code === 'ECONNABORTED') {
        standardError = {
          code: 'TIMEOUT_ERROR',
          message: 'The request took too long to complete. Please try again later.',
          details: { originalError: error.message, timeout: error.config?.timeout }
        };
      }
      // If we have a response with error data
      else if (error.response) {
        // Use the status code as the error code if no specific code is provided
        const errorCode = error.response.data?.error?.code || 
                         error.response.data?.code || 
                         error.response.status;
        
        // Use the error message from the API if available
        const errorMessage = error.response.data?.error?.message || 
                            error.response.data?.message || 
                            error.message || 
                            'An error occurred';
                            
        // Extract any additional details
        const errorDetails = error.response.data?.error?.details || 
                           error.response.data?.details || 
                           null;
        
        standardError = {
          code: errorCode,
          message: errorMessage,
          details: errorDetails
        };
      }
      
      // Return a rejected promise with the standardized error
      return Promise.reject({
        error: standardError,
        status: error.response?.status || 0,
        statusText: error.response?.statusText || '',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Creates an interceptor that standardizes successful API responses
 * 
 * @returns Response formatting interceptor object
 */
export function createResponseFormattingInterceptor(): ApiInterceptor {
  return {
    onResponse: (response: AxiosResponse): AxiosResponse => {
      // If the response is already in our expected format, return it as is
      if (response.data && response.data.hasOwnProperty('data') && 
          response.data.hasOwnProperty('status')) {
        return response;
      }
      
      // Create a standardized response format
      const formattedResponse = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: new Date().toISOString()
      };
      
      // Replace the original response with the formatted one
      return {
        ...response,
        data: formattedResponse
      };
    }
  };
}

// Create and export pre-configured interceptors for easy use
export const loggingInterceptor = createLoggingInterceptor();
export const errorInterceptor = createErrorInterceptor();
export const responseFormattingInterceptor = createResponseFormattingInterceptor();