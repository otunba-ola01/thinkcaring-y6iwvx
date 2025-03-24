/**
 * Mock API Utilities
 * 
 * This file provides utility functions for creating standardized mock API responses
 * for testing purposes. These utilities enable consistent and type-safe API mocking
 * across unit tests, integration tests, and component tests.
 * 
 * @version 1.0.0
 */

import { ApiResponse, ApiErrorResponse } from '../../types/api.types';
import { ResponseError } from '../../types/common.types';
import { API_RESPONSE_CODES } from '../../constants/api.constants';
import axios, { AxiosResponse } from 'axios'; // axios v1.4+

/**
 * Creates a mock API response with the specified data and status code
 * 
 * @param data - The data to include in the response
 * @param statusCode - The HTTP status code (defaults to 200 SUCCESS)
 * @returns A mock API response object with the provided data
 */
export function mockApiResponse<T>(data: T, statusCode = API_RESPONSE_CODES.OK): ApiResponse<T> {
  return {
    data,
    status: statusCode,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json'
    }
  };
}

/**
 * Creates a mock API error response with the specified error details and status code
 * 
 * @param message - The error message
 * @param statusCode - The HTTP status code (defaults to 400 BAD_REQUEST)
 * @param details - Additional error details 
 * @returns A mock API error response object
 */
export function mockApiErrorResponse(
  message: string,
  statusCode = API_RESPONSE_CODES.BAD_REQUEST,
  details: Record<string, any> = {}
): ApiErrorResponse {
  const error: ResponseError = {
    code: statusCode,
    message,
    details
  };

  return {
    error,
    status: statusCode,
    statusText: 'Error'
  };
}

/**
 * Creates a mock Axios response object for testing API client functions
 * 
 * @param data - The response data
 * @param status - The HTTP status code (defaults to 200)
 * @param headers - The response headers
 * @returns A mock Axios response object
 */
export function mockAxiosResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    config: {
      headers: new axios.AxiosHeaders()
    }
  };
}

/**
 * Creates a mock paginated API response with the specified data and pagination details
 * 
 * @param data - The array of items to include in the response
 * @param pagination - Pagination details (page, pageSize, totalPages, totalItems)
 * @param statusCode - The HTTP status code (defaults to 200 SUCCESS)
 * @returns A mock paginated API response
 */
export function mockPaginatedResponse<T>(
  data: T[],
  pagination: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    totalItems?: number;
  } = {},
  statusCode = API_RESPONSE_CODES.OK
): ApiResponse<{ data: T[]; pagination: { page: number; pageSize: number; totalPages: number; totalItems: number } }> {
  const { 
    page = 1, 
    pageSize = 10, 
    totalItems = data.length, 
    totalPages = Math.ceil(totalItems / (pageSize || 1)) 
  } = pagination;

  return {
    data: {
      data,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems
      }
    },
    status: statusCode,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json'
    }
  };
}

/**
 * Creates a mock network error for testing error handling
 * 
 * @param message - The error message
 * @returns A mock network error object
 */
export function mockNetworkError(message: string): Error {
  const error = new Error(message);
  // Add axios-specific properties
  (error as any).isAxiosError = true;
  (error as any).request = {};
  (error as any).response = null;
  (error as any).code = 'NETWORK_ERROR';
  (error as any).errno = 'ENETUNREACH';
  
  return error;
}

/**
 * Creates a mock timeout error for testing error handling
 * 
 * @param message - The error message (defaults to timeout message)
 * @returns A mock timeout error object
 */
export function mockTimeoutError(message = 'timeout of 30000ms exceeded'): Error {
  const error = new Error(message);
  // Add axios-specific properties
  (error as any).isAxiosError = true;
  (error as any).request = {};
  (error as any).response = null;
  (error as any).code = 'ECONNABORTED';
  (error as any).timeout = 30000;
  
  return error;
}

/**
 * Creates a mock cancelled request error for testing request cancellation
 * 
 * @returns A mock cancelled request error object
 */
export function mockCancelledRequestError(): Error {
  const error = new Error('Request canceled');
  // Add axios-specific properties
  (error as any).isAxiosError = true;
  (error as any).request = {};
  (error as any).response = null;
  (error as any).__CANCEL__ = true; // Special property used by axios.isCancel()
  
  return error;
}