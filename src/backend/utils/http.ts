/**
 * HTTP Client Utility for HCBS Revenue Management System
 * 
 * This module provides a standardized HTTP client based on Axios with additional
 * features such as request/response interceptors, error handling, retry logic,
 * and logging. It is used for making API requests to external systems including
 * clearinghouses, EHR systems, and payer systems.
 * 
 * Key features:
 * - Configurable timeout and retry settings
 * - Automatic handling of authentication headers
 * - Comprehensive error handling with IntegrationError
 * - Request/response logging with sensitive data masking
 * - Circuit breaker pattern support through retry condition evaluation
 * - Support for HTTP proxy configuration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'; // axios 1.4.0
import axiosRetry from 'axios-retry'; // axios-retry 3.5.0
import { HttpsProxyAgent } from 'https-proxy-agent'; // https-proxy-agent 7.0.0

import { logger } from './logger';
import { IntegrationError } from '../errors/integration-error';
import { config } from '../config';

// Default HTTP client configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Creates a configured Axios instance with default settings and interceptors
 * 
 * @param options - Configuration options for the HTTP client
 * @returns Configured Axios instance
 */
export const createHttpClient = (options: AxiosRequestConfig = {}): AxiosInstance => {
  // Create a new Axios instance with provided options and defaults
  const client = axios.create({
    timeout: options.timeout || DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // Configure HTTP proxy if specified in environment variables
  if (process.env.HTTP_PROXY) {
    client.defaults.proxy = false; // Disable default proxy behavior
    client.defaults.httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  // Configure retry behavior
  axiosRetry(client, {
    retries: DEFAULT_RETRY_ATTEMPTS,
    retryDelay: (retryCount) => {
      // Exponential backoff with jitter
      // Initial delay is DEFAULT_RETRY_DELAY (1s)
      // Second retry: ~2s, Third retry: ~4s with randomization
      return retryCount * DEFAULT_RETRY_DELAY * (0.8 + Math.random() * 0.4);
    },
    retryCondition: (error: AxiosError) => {
      // Only retry if the error is retryable
      return isRetryableError(error);
    },
    // Reset timeout between retries
    shouldResetTimeout: true,
  });

  // Add request interceptor for logging and authentication
  client.interceptors.request.use(
    (config) => {
      // Generate a unique request ID for tracing
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = requestId;

      // Log the outgoing request (sanitize for security)
      const logData = {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: sanitizeRequestLog(config.headers),
        params: sanitizeRequestLog(config.params || {}),
        data: config.data ? sanitizeRequestLog(config.data) : undefined,
        requestId,
      };

      logger.debug(`Outgoing HTTP request: ${config.method?.toUpperCase()} ${config.url}`, logData);

      return config;
    },
    (error) => {
      logger.error('HTTP request configuration error', { error: error.message, stack: error.stack });
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging and error handling
  client.interceptors.response.use(
    (response) => {
      // Log the successful response
      const logData = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        responseSize: JSON.stringify(response.data).length,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        requestId: response.config.headers?.['X-Request-ID'],
        elapsedTime: response.headers['x-response-time'],
      };

      logger.debug(`HTTP response received: ${response.status} ${response.statusText}`, logData);

      return response;
    },
    (error) => {
      // Log the error response
      if (error.response) {
        const logData = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: sanitizeRequestLog(error.response.data),
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          requestId: error.config?.headers?.['X-Request-ID'],
        };

        logger.error(`HTTP error response: ${error.response.status} ${error.response.statusText}`, logData);
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('HTTP request failed with no response', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          requestId: error.config?.headers?.['X-Request-ID'],
          error: error.message,
        });
      } else {
        // Something happened in setting up the request
        logger.error('HTTP request setup error', {
          error: error.message,
          stack: error.stack,
          requestId: error.config?.headers?.['X-Request-ID'],
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Performs an HTTP GET request to the specified URL
 * 
 * @param url - The URL to request
 * @param config - Additional request configuration
 * @returns Promise resolving to the response data
 */
export const httpGet = async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const client = createHttpClient(config);
    logger.info(`Making GET request to ${url}`, {
      url,
      params: sanitizeRequestLog(config.params),
    });
    
    const response = await client.get<T>(url, config);
    return response.data;
  } catch (error) {
    return handleHttpError(error as Error, url, 'GET');
  }
};

/**
 * Performs an HTTP POST request to the specified URL with data
 * 
 * @param url - The URL to request
 * @param data - The data to send
 * @param config - Additional request configuration
 * @returns Promise resolving to the response data
 */
export const httpPost = async <T = any>(url: string, data: any, config: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const client = createHttpClient(config);
    logger.info(`Making POST request to ${url}`, {
      url,
      requestSize: data ? JSON.stringify(data).length : 0,
    });
    
    const response = await client.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    return handleHttpError(error as Error, url, 'POST');
  }
};

/**
 * Performs an HTTP PUT request to the specified URL with data
 * 
 * @param url - The URL to request
 * @param data - The data to send
 * @param config - Additional request configuration
 * @returns Promise resolving to the response data
 */
export const httpPut = async <T = any>(url: string, data: any, config: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const client = createHttpClient(config);
    logger.info(`Making PUT request to ${url}`, {
      url,
      requestSize: data ? JSON.stringify(data).length : 0,
    });
    
    const response = await client.put<T>(url, data, config);
    return response.data;
  } catch (error) {
    return handleHttpError(error as Error, url, 'PUT');
  }
};

/**
 * Performs an HTTP PATCH request to the specified URL with data
 * 
 * @param url - The URL to request
 * @param data - The data to send
 * @param config - Additional request configuration
 * @returns Promise resolving to the response data
 */
export const httpPatch = async <T = any>(url: string, data: any, config: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const client = createHttpClient(config);
    logger.info(`Making PATCH request to ${url}`, {
      url,
      requestSize: data ? JSON.stringify(data).length : 0,
    });
    
    const response = await client.patch<T>(url, data, config);
    return response.data;
  } catch (error) {
    return handleHttpError(error as Error, url, 'PATCH');
  }
};

/**
 * Performs an HTTP DELETE request to the specified URL
 * 
 * @param url - The URL to request
 * @param config - Additional request configuration
 * @returns Promise resolving to the response data
 */
export const httpDelete = async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const client = createHttpClient(config);
    logger.info(`Making DELETE request to ${url}`, {
      url,
      params: sanitizeRequestLog(config.params),
    });
    
    const response = await client.delete<T>(url, config);
    return response.data;
  } catch (error) {
    return handleHttpError(error as Error, url, 'DELETE');
  }
};

/**
 * Handles HTTP errors by converting them to IntegrationError instances
 * 
 * @param error - The error to handle
 * @param url - The request URL
 * @param method - The request method
 * @throws IntegrationError with detailed information
 */
export const handleHttpError = (error: Error, url: string, method: string): never => {
  // Get the service name from the URL
  const urlObj = new URL(url.startsWith('http') ? url : `http://placeholder.com${url}`);
  const service = urlObj.hostname.replace('www.', '').split('.')[0];
  const endpoint = `${method.toUpperCase()} ${urlObj.pathname}`;
  
  logger.error(`HTTP request to ${service} failed: ${method.toUpperCase()} ${url}`, { 
    error: error.message, 
    service,
    endpoint
  });
  
  // Check if this is an Axios error
  if (axios.isAxiosError(error)) {
    // Extract the response if available
    const response = error.response;
    const statusCode = response?.status || null;
    const requestId = error.config?.headers?.['X-Request-ID'] as string || null;
    const responseBody = response?.data || null;
    
    // Create an IntegrationError with detailed information
    throw new IntegrationError({
      message: `Integration error with ${service}: ${error.message}`,
      service,
      endpoint,
      statusCode,
      requestId,
      responseBody,
      retryable: isRetryableError(error)
    });
  }
  
  // For non-Axios errors, create a generic IntegrationError
  throw new IntegrationError({
    message: `Integration error with ${service}: ${error.message}`,
    service,
    endpoint,
    retryable: false
  });
};

/**
 * Determines if an HTTP error should be retried based on status code and error type
 * 
 * @param error - The error to evaluate
 * @returns True if the error is retryable, false otherwise
 */
export const isRetryableError = (error: Error): boolean => {
  // Check if the error is an Axios error
  const axiosError = error as AxiosError;
  
  // Network errors (ECONNRESET, ETIMEDOUT, etc.) are retryable
  if (axiosError.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENETUNREACH'].includes(axiosError.code)) {
    return true;
  }
  
  // Check if the error has a response
  if (axiosError.response) {
    const statusCode = axiosError.response.status;
    
    // 5xx errors (server errors) are retryable
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    
    // 429 (too many requests) is retryable - need to respect rate limits
    if (statusCode === 429) {
      return true;
    }
    
    // 4xx errors (client errors) are not retryable (except 429)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }
  }
  
  // For integrations, we should be more conservative and not retry unknown errors
  return false;
};

/**
 * Generates an authorization header based on the provided auth type and credentials
 * 
 * @param authType - The authentication type (Bearer, Basic, API Key)
 * @param credentials - Authentication credentials
 * @returns Authorization header object
 */
export const getAuthorizationHeader = (
  authType: string,
  credentials: { token?: string; username?: string; password?: string; apiKey?: string; apiKeyName?: string }
): Record<string, string> => {
  switch (authType.toLowerCase()) {
    case 'bearer':
      if (!credentials.token) {
        logger.warn('Bearer authentication requested but no token provided');
        return {};
      }
      return { Authorization: `Bearer ${credentials.token}` };
      
    case 'basic':
      if (!credentials.username || !credentials.password) {
        logger.warn('Basic authentication requested but username or password missing');
        return {};
      }
      // Create Base64 encoded credentials
      const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
      
    case 'apikey':
      if (!credentials.apiKey) {
        logger.warn('API Key authentication requested but no key provided');
        return {};
      }
      // Use the specified header name or default to X-API-Key
      const keyName = credentials.apiKeyName || 'X-API-Key';
      return { [keyName]: credentials.apiKey };
      
    default:
      logger.warn(`Unsupported authentication type: ${authType}`);
      return {};
  }
};

/**
 * Sanitizes request data for logging to remove sensitive information
 * 
 * @param data - Data to sanitize
 * @returns Sanitized data safe for logging
 */
export const sanitizeRequestLog = (data: any): any => {
  if (!data) return data;
  
  // Handle different data types
  if (typeof data !== 'object') return data;
  
  // Create a deep copy to avoid modifying the original object
  let sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  // If it's an array, sanitize each item
  if (Array.isArray(sanitized)) {
    return sanitized.map(item => sanitizeRequestLog(item));
  }
  
  // Sensitive fields that should be redacted
  const sensitiveFields = [
    'password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'key',
    'auth', 'authorization', 'credential', 'credentials', 'pass', 'jwt', 'privateKey',
    'cardNumber', 'cvv', 'ssn', 'socialSecurity', 'medicaidId', 'medicareId', 'medicalId'
  ];
  
  // Process each field in the object
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      // Check if this is a sensitive field name
      const isFieldSensitive = sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isFieldSensitive) {
        // Redact sensitive field
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeRequestLog(sanitized[key]);
      }
    }
  }
  
  return sanitized;
};