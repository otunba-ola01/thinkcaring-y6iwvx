/**
 * Request type definitions for the HCBS Revenue Management System.
 * 
 * This file defines TypeScript interfaces and types for HTTP requests to provide
 * type safety for request parameters, query strings, body data, and authenticated
 * user information throughout the application.
 * 
 * @module request.types
 */

import { Request as ExpressRequest } from 'express'; // v4.18+
import { UUID, PaginationParams, SortParams, FilterParams } from './common.types';
import { AuthenticatedUser } from './auth.types';

/**
 * Generic interface for route parameters in requests
 */
export interface RequestParams {
  [key: string]: string | undefined;
}

/**
 * Generic interface for query parameters in requests
 */
export interface RequestQuery {
  [key: string]: string | string[] | undefined;
}

/**
 * Generic interface for request body data
 */
export interface RequestBody {
  [key: string]: any;
}

/**
 * Extended Express Request interface with authentication and tracking data
 */
export interface Request extends ExpressRequest {
  /**
   * The authenticated user, or null if not authenticated
   */
  user: AuthenticatedUser | null;
  
  /**
   * Unique identifier for the request (for tracing and logging)
   */
  requestId: string;
  
  /**
   * Timestamp when the request started (for performance tracking)
   */
  startTime: number;
}

/**
 * Request interface with typed route parameters
 */
export interface RequestWithParams<P extends RequestParams> extends Request {
  params: P;
}

/**
 * Request interface with typed query parameters
 */
export interface RequestWithQuery<Q extends RequestQuery> extends Request {
  query: Q;
}

/**
 * Request interface with typed request body
 */
export interface RequestWithBody<B extends RequestBody> extends Request {
  body: B;
}

/**
 * Request interface with typed route and query parameters
 */
export interface RequestWithParamsAndQuery<P extends RequestParams, Q extends RequestQuery> extends Request {
  params: P;
  query: Q;
}

/**
 * Request interface with typed route parameters and request body
 */
export interface RequestWithParamsAndBody<P extends RequestParams, B extends RequestBody> extends Request {
  params: P;
  body: B;
}

/**
 * Request interface with typed query parameters and request body
 */
export interface RequestWithQueryAndBody<Q extends RequestQuery, B extends RequestBody> extends Request {
  query: Q;
  body: B;
}

/**
 * Request interface with typed route parameters, query parameters, and request body
 */
export interface RequestWithParamsQueryAndBody<
  P extends RequestParams,
  Q extends RequestQuery,
  B extends RequestBody
> extends Request {
  params: P;
  query: Q;
  body: B;
}

/**
 * Interface for standardized list request query parameters
 */
export interface ListRequestQuery extends RequestQuery {
  /**
   * Pagination parameters (page, limit)
   */
  pagination: PaginationParams;
  
  /**
   * Sorting parameters (sortBy, sortDirection)
   */
  sort: SortParams;
  
  /**
   * Filtering parameters (conditions, logicalOperator)
   */
  filter: FilterParams;
  
  /**
   * Optional search term for full-text search
   */
  search: string;
}

/**
 * Interface for route parameters with ID
 */
export interface IdParam extends RequestParams {
  /**
   * UUID identifier for the requested resource
   */
  id: UUID;
}

/**
 * Interface for file upload requests
 */
export interface FileUploadRequest extends Request {
  /**
   * Uploaded file information (provided by multer middleware)
   */
  file: Express.Multer.File;
}

/**
 * Interface for batch operation request bodies
 */
export interface BatchRequestBody<T> extends RequestBody {
  /**
   * Array of items to process in the batch operation
   */
  items: T[];
  
  /**
   * Optional configuration options for the batch operation
   */
  options: Record<string, any>;
}

/**
 * Interface for validation request bodies
 */
export interface ValidationRequestBody<T> extends RequestBody {
  /**
   * Data to validate
   */
  data: T;
  
  /**
   * Validation options
   */
  options: {
    /**
     * If true, only validates without saving/processing
     */
    validateOnly?: boolean;
  };
}

/**
 * Interface for export request query parameters
 */
export interface ExportRequestQuery extends RequestQuery {
  /**
   * Export format (pdf, excel, csv, json)
   */
  format: string;
  
  /**
   * Fields to include in the export
   */
  fields: string[];
  
  /**
   * Optional filename for the exported file
   */
  fileName: string;
}