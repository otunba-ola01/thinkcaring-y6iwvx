/**
 * Utility functions for making API requests in the HCBS Revenue Management System.
 * This file provides a standardized way to interact with the backend API, handling
 * request configuration, error handling, cancellation, and response formatting.
 */

import axios, { 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError, 
  CancelToken 
} from 'axios'; // axios v1.4+

import { apiClient } from '../api/client';
import { 
  ApiResponse, 
  ApiRequestOptions,
  ApiErrorResponse 
} from '../types/api.types';
import { ResponseError } from '../types/common.types';
import { apiConfig } from '../config/api.config';
import { API_RESPONSE_CODES } from '../constants/api.constants';

/**
 * Makes an API request with standardized error handling and response formatting
 * 
 * @template T Type of expected response data
 * @param config - Axios request configuration
 * @param cancelToken - Optional cancellation token
 * @returns Promise resolving to a standardized API response
 */
export async function apiRequest<T = any>(
  config: AxiosRequestConfig,
  cancelToken?: CancelToken
): Promise<ApiResponse<T>> {
  try {
    // Add cancel token to request if provided
    if (cancelToken) {
      config.cancelToken = cancelToken;
    }

    // Make the API request
    const response = await apiClient.axiosInstance(config);
    
    // Format the response
    return formatApiResponse<T>(response);
  } catch (error) {
    // If this is a cancellation, re-throw to be handled by the caller
    if (axios.isCancel(error)) {
      throw error;
    }

    // Format and throw standardized error
    throw formatApiError(error as AxiosError);
  }
}

/**
 * Creates a cancellation token for API requests
 * 
 * @returns Object containing token and function to cancel the request
 */
export function createCancelToken(): { token: CancelToken; cancel: () => void } {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel
  };
}

/**
 * Checks if an error is a cancellation error
 * 
 * @param error - The error to check
 * @returns True if the error is a cancellation
 */
export function isCancel(error: any): boolean {
  return axios.isCancel(error);
}

/**
 * Formats an Axios response to the standardized API response format
 * 
 * @template T Type of response data
 * @param response - The Axios response object
 * @returns Standardized API response
 */
export function formatApiResponse<T = any>(response: AxiosResponse): ApiResponse<T> {
  // If the response is already in our standard format, return it
  if (response.data && 
      typeof response.data === 'object' && 
      'data' in response.data &&
      'status' in response.data) {
    return response.data as ApiResponse<T>;
  }

  // Otherwise, transform it to our standard format
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
}

/**
 * Formats an Axios error to the standardized API error response format
 * 
 * @param error - The Axios error object
 * @returns Standardized API error response
 */
export function formatApiError(error: AxiosError): ApiErrorResponse {
  // Extract status code from error
  const status = error.response?.status || API_RESPONSE_CODES.INTERNAL_SERVER_ERROR;
  const statusText = error.response?.statusText || 'Internal Server Error';
  
  // Extract error details from response
  let errorObj: ResponseError = {
    code: error.code || String(status),
    message: error.message || 'An unexpected error occurred',
    details: null
  };

  // If error response data exists and has error information, use it
  if (error.response?.data) {
    const data = error.response.data as any;
    
    if (data.error) {
      errorObj = {
        code: data.error.code || errorObj.code,
        message: data.error.message || errorObj.message,
        details: data.error.details || null
      };
    } else if (data.message) {
      errorObj.message = data.message;
    }
  }

  // Return the standardized error response
  return {
    error: errorObj,
    status,
    statusText
  };
}

/**
 * Retries a failed API request based on retry configuration
 * 
 * @template T Type of expected response data
 * @param config - Axios request configuration
 * @param retryCount - Current retry attempt number
 * @param error - The error that triggered the retry
 * @returns Promise resolving to API response after retry
 */
export async function retryRequest<T = any>(
  config: AxiosRequestConfig,
  retryCount: number = 0,
  error?: AxiosError
): Promise<ApiResponse<T>> {
  // Get retry configuration
  const { maxRetries, retryDelay, retryableStatusCodes } = apiConfig.retry;
  
  // Check if we've exceeded max retries
  if (retryCount >= maxRetries) {
    throw error || new Error('Max retries exceeded');
  }
  
  // Check if error status is retryable
  if (error && error.response && error.response.status) {
    if (!retryableStatusCodes.includes(error.response.status)) {
      throw error;
    }
  }
  
  // Calculate delay with exponential backoff
  const delay = retryDelay * Math.pow(2, retryCount);
  
  // Wait for the calculated delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Retry the request
  try {
    return await apiRequest<T>(config);
  } catch (newError) {
    // If still failing, retry again with incremented count
    return retryRequest<T>(
      config, 
      retryCount + 1, 
      newError as AxiosError
    );
  }
}

/**
 * Builds a URL query string from parameters object
 * 
 * @param params - Object containing query parameters
 * @returns Formatted query string
 */
export function buildQueryString(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  // Filter out null and undefined values
  const filteredParams = Object.entries(params).filter(
    ([_, value]) => value !== null && value !== undefined
  );
  
  if (filteredParams.length === 0) {
    return '';
  }
  
  // Convert parameters to query string format
  const queryParams = filteredParams.map(([key, value]) => {
    // Handle arrays and objects by stringifying them
    const processedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value;
    
    // Encode key and value
    return `${encodeURIComponent(key)}=${encodeURIComponent(processedValue)}`;
  });
  
  return `?${queryParams.join('&')}`;
}

/**
 * Downloads a file from an API endpoint
 * 
 * @param url - API endpoint URL
 * @param filename - Name to save the file as
 * @param config - Optional Axios request configuration
 * @returns Promise resolving to success status
 */
export async function downloadFile(
  url: string,
  filename: string,
  config: AxiosRequestConfig = {}
): Promise<boolean> {
  try {
    // Configure request for binary data
    const requestConfig: AxiosRequestConfig = {
      ...config,
      responseType: 'blob'
    };
    
    // Make the request
    const response = await apiClient.axiosInstance.get(url, requestConfig);
    
    // Create a blob URL from the response data
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    
    // Append to the body, click to download, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('File download failed:', error);
    return false;
  }
}

/**
 * Uploads a file to an API endpoint
 * 
 * @template T Type of expected response data
 * @param url - API endpoint URL
 * @param file - File to upload
 * @param fieldName - Form field name for the file
 * @param additionalData - Additional data to include in the request
 * @param onProgress - Optional callback for upload progress
 * @returns Promise resolving to API response
 */
export async function uploadFile<T = any>(
  url: string,
  file: File,
  fieldName: string = 'file',
  additionalData: Record<string, any> = {},
  onProgress?: (percentage: number) => void
): Promise<ApiResponse<T>> {
  // Create FormData object
  const formData = new FormData();
  
  // Append file
  formData.append(fieldName, file);
  
  // Append additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  
  // Create request config
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  
  // Add progress tracking if callback provided
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentage = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      onProgress(percentage);
    };
  }
  
  // Make the request
  return apiRequest<T>({
    ...config,
    method: 'POST',
    url,
    data: formData
  });
}

/**
 * Executes multiple API requests in parallel with concurrency control
 * 
 * @param requests - Array of request configurations
 * @param concurrency - Maximum number of concurrent requests
 * @param stopOnError - Whether to stop on first error
 * @returns Promise resolving to array of responses/errors
 */
export async function batchRequests(
  requests: AxiosRequestConfig[],
  concurrency: number = 5,
  stopOnError: boolean = false
): Promise<Array<ApiResponse<any> | ApiErrorResponse>> {
  if (!requests.length) {
    return [];
  }
  
  const results: Array<ApiResponse<any> | ApiErrorResponse> = [];
  let successCount = 0;
  let errorCount = 0;
  
  // Process requests in batches based on concurrency
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    
    try {
      // Create promises for current batch
      const batchPromises = batch.map(async (requestConfig) => {
        try {
          const response = await apiRequest(requestConfig);
          successCount++;
          return response;
        } catch (error) {
          errorCount++;
          
          // If stopOnError is true, rethrow to halt execution
          if (stopOnError) {
            throw error;
          }
          
          return error as ApiErrorResponse;
        }
      });
      
      // Wait for all promises in current batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Stop if an error occurred and stopOnError is true
      if (stopOnError && errorCount > 0) {
        break;
      }
    } catch (error) {
      // If stopOnError is true and error was rethrown, break out of loop
      if (stopOnError) {
        results.push(error as ApiErrorResponse);
        break;
      }
    }
  }
  
  return results;
}