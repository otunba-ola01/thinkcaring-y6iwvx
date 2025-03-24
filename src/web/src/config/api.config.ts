/**
 * API Configuration
 * 
 * Configures API client settings for the HCBS Revenue Management System web application.
 * This file defines base URL, timeout, headers, caching, and retry strategies for API requests,
 * providing a centralized configuration for all API interactions.
 */

import { 
  API_BASE_URL, 
  DEFAULT_API_TIMEOUT, 
  DEFAULT_API_HEADERS,
  CONTENT_TYPES
} from '../constants/api.constants';

import {
  ApiClientConfig,
  ApiCacheConfig,
  ApiRetryConfig
} from '../types/api.types';

/**
 * Returns the base URL for API requests based on environment
 * 
 * @returns The base URL for API requests
 */
export const getApiBaseUrl = (): string => {
  // API_BASE_URL already handles environment variables in api.constants.ts
  return API_BASE_URL;
};

/**
 * Returns default headers for API requests
 * 
 * @returns Default headers for API requests
 */
export const getApiHeaders = (): Record<string, string> => {
  return {
    'Content-Type': CONTENT_TYPES.JSON,
    'Accept': CONTENT_TYPES.JSON
  };
};

/**
 * Configuration settings for API client, caching, and retry strategies
 */
export const apiConfig = {
  /**
   * HTTP client configuration
   */
  client: {
    baseURL: API_BASE_URL,
    timeout: DEFAULT_API_TIMEOUT,
    headers: DEFAULT_API_HEADERS,
    withCredentials: true // Enable sending cookies with cross-origin requests
  } as ApiClientConfig,

  /**
   * Caching configuration for API responses
   * Improves performance by storing responses temporarily
   */
  cache: {
    enabled: true, // Enable caching by default
    ttl: 300000, // Cache time-to-live: 5 minutes (in milliseconds)
    maxSize: 100, // Maximum number of cached responses
    excludedEndpoints: [
      '/auth', // Don't cache authentication endpoints
      '/payments', // Don't cache payment data (needs to be fresh)
      '/claims/submit' // Don't cache claim submission endpoints
    ]
  } as ApiCacheConfig,

  /**
   * Retry configuration for failed requests
   * Improves reliability when services are temporarily unavailable
   */
  retry: {
    maxRetries: 3, // Maximum number of retry attempts
    retryDelay: 1000, // Base delay between retries in milliseconds (will be exponentially increased)
    retryableStatusCodes: [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ]
  } as ApiRetryConfig
};