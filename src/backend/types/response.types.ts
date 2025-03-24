/**
 * Response type definitions for the HCBS Revenue Management System.
 * 
 * This file defines the standardized response structures used throughout the API.
 * It ensures consistency in response formats, enabling reliable client interactions
 * and proper error handling. The types defined here provide type safety for all
 * API responses across the application.
 */

import { PaginationMeta } from './common.types';
import { ErrorResponse } from './error.types';

/**
 * Generic interface for successful API responses with data payload.
 * 
 * @template T The type of data being returned
 */
export interface ApiResponse<T> {
  success: boolean;       // Indicates if the operation was successful
  data: T;                // The response payload
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
}

/**
 * Interface for paginated API responses with array data and pagination metadata.
 * 
 * @template T The type of items in the data array
 */
export interface PaginatedApiResponse<T> {
  success: boolean;       // Indicates if the operation was successful
  data: T[];              // Array of items
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
  pagination: PaginationMeta; // Pagination metadata
}

/**
 * Interface for API responses with no data payload, typically for 
 * successful operations that don't return data.
 */
export interface EmptyApiResponse {
  success: boolean;       // Indicates if the operation was successful
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
}

/**
 * Interface for responses to bulk operations, including success/failure counts.
 */
export interface BulkOperationResponse {
  success: boolean;       // Indicates if the operation was at least partially successful
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
  results: {              // Summary of the bulk operation results
    successful: number;   // Number of successfully processed items
    failed: number;       // Number of failed items
    total: number;        // Total number of items in the bulk operation
  };
  failedItems: Array<{ id: string; reason: string }> | null; // Details about failed items
}

/**
 * Interface for validation responses, including validation errors and warnings.
 */
export interface ValidationResponse {
  success: boolean;       // Indicates if the validation passed (true) or failed (false)
  message: string | null; // Optional message about the validation result
  timestamp: string;      // ISO timestamp of when the response was generated
  isValid: boolean;       // Explicit validation result flag
  errors: Array<{ field: string; message: string; code: string }> | null; // Validation errors
  warnings: Array<{ field: string; message: string; code: string }> | null; // Validation warnings
}

/**
 * Interface for file upload responses, including file metadata.
 */
export interface FileUploadResponse {
  success: boolean;       // Indicates if the file upload was successful
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
  fileId: string;         // Unique identifier for the uploaded file
  fileName: string;       // Original name of the uploaded file
  fileSize: number;       // Size of the file in bytes
  mimeType: string;       // MIME type of the uploaded file
  url: string | null;     // Optional URL to access the file
}

/**
 * Interface for health check responses, including component health statuses.
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'; // Overall health status
  timestamp: string;      // ISO timestamp of when the health check was performed
  version: string;        // Application version
  components: Record<string, { // Health status of individual components
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;     // Optional details about the component's health
  }>;
  uptime: number;         // System uptime in seconds
}

/**
 * Interface for export operation responses, including download information.
 */
export interface ExportResponse {
  success: boolean;       // Indicates if the export operation was successful
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
  fileUrl: string;        // URL to download the exported file
  fileName: string;       // Name of the exported file
  fileSize: number;       // Size of the file in bytes
  format: string;         // Format of the exported file (PDF, CSV, XLSX, etc.)
  expiresAt: string | null; // Optional expiration timestamp for the download URL
}

/**
 * Generic interface for API responses with data payload and additional metadata.
 * 
 * @template T The type of data being returned
 * @template M The type of metadata being included
 */
export interface ApiResponseWithMeta<T, M> {
  success: boolean;       // Indicates if the operation was successful
  data: T;                // The response payload
  message: string | null; // Optional success/informational message
  timestamp: string;      // ISO timestamp of when the response was generated
  meta: M;                // Additional metadata
}

/**
 * Creates a standardized success response with a data payload.
 * 
 * @template T The type of data being returned
 * @param data The data to include in the response
 * @param message Optional success/informational message
 * @returns A standardized ApiResponse object
 */
export function SuccessResponse<T>(data: T, message: string | null = null): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized paginated response with a data array and pagination metadata.
 * 
 * @template T The type of items in the data array
 * @param data Array of items to include in the response
 * @param pagination Pagination metadata
 * @param message Optional success/informational message
 * @returns A standardized PaginatedApiResponse object
 */
export function PaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message: string | null = null
): PaginatedApiResponse<T> {
  return {
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized empty response with only a success message.
 * Useful for operations that don't return data, such as deletions or updates.
 * 
 * @param message Optional success/informational message
 * @returns A standardized EmptyApiResponse object
 */
export function EmptyResponse(message: string = 'Operation completed successfully'): EmptyApiResponse {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized validation failure response with errors and warnings.
 * 
 * @param isValid Whether the validation passed
 * @param errors Array of validation errors
 * @param warnings Array of validation warnings
 * @param message Optional message about the validation result
 * @returns A standardized ValidationResponse object
 */
export function ValidationFailureResponse(
  isValid: boolean,
  errors: Array<{ field: string; message: string; code: string }> | null = null,
  warnings: Array<{ field: string; message: string; code: string }> | null = null,
  message: string | null = null
): ValidationResponse {
  return {
    success: isValid,
    isValid,
    errors,
    warnings,
    message: message || (isValid ? 'Validation passed' : 'Validation failed'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized bulk operation response with success/failure counts.
 * 
 * @param results Summary of the bulk operation results
 * @param failedItems Optional details about failed items
 * @param message Optional success/informational message
 * @returns A standardized BulkOperationResponse object
 */
export function BulkOperationSuccessResponse(
  results: { successful: number; failed: number; total: number },
  failedItems: Array<{ id: string; reason: string }> | null = null,
  message: string | null = null
): BulkOperationResponse {
  const success = results.failed < results.total; // At least one successful operation
  return {
    success,
    results,
    failedItems,
    message: message || `Processed ${results.total} items: ${results.successful} successful, ${results.failed} failed`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized file upload success response with file metadata.
 * 
 * @param fileData File metadata for the uploaded file
 * @param message Optional success/informational message
 * @returns A standardized FileUploadResponse object
 */
export function FileUploadSuccessResponse(
  fileData: {
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url?: string;
  },
  message: string | null = 'File uploaded successfully'
): FileUploadResponse {
  return {
    success: true,
    fileId: fileData.fileId,
    fileName: fileData.fileName,
    fileSize: fileData.fileSize,
    mimeType: fileData.mimeType,
    url: fileData.url || null,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized export success response with download information.
 * 
 * @param exportData Export details including file URL and metadata
 * @param message Optional success/informational message
 * @returns A standardized ExportResponse object
 */
export function ExportSuccessResponse(
  exportData: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    format: string;
    expiresAt?: string;
  },
  message: string | null = 'Export completed successfully'
): ExportResponse {
  return {
    success: true,
    fileUrl: exportData.fileUrl,
    fileName: exportData.fileName,
    fileSize: exportData.fileSize,
    format: exportData.format,
    expiresAt: exportData.expiresAt || null,
    message,
    timestamp: new Date().toISOString()
  };
}