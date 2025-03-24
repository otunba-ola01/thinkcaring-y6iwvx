/**
 * Document Model
 * 
 * This file defines the Document model and related types for the HCBS Revenue Management System.
 * It represents documents such as service notes, assessments, authorization letters, and other 
 * supporting documentation required for claims and billing.
 * 
 * The document model supports HIPAA compliance with proper metadata handling and implements
 * tracking for documentation validation and status in the service delivery workflow.
 */

import { UUID, Timestamp } from '../types/common.types';
import { DatabaseEntity } from '../types/database.types';

/**
 * Enum defining the types of documents that can be stored in the system
 */
export enum DocumentType {
  SERVICE_NOTE = 'service_note',
  ASSESSMENT = 'assessment',
  AUTHORIZATION_LETTER = 'authorization_letter',
  CLAIM_DOCUMENTATION = 'claim_documentation',
  PAYMENT_REMITTANCE = 'payment_remittance',
  CLIENT_RECORD = 'client_record',
  PROGRAM_DOCUMENTATION = 'program_documentation',
  OTHER = 'other'
}

/**
 * Enum defining the entity types that documents can be associated with
 */
export enum DocumentEntityType {
  CLIENT = 'client',
  SERVICE = 'service',
  CLAIM = 'claim',
  PAYMENT = 'payment',
  AUTHORIZATION = 'authorization',
  PROGRAM = 'program',
  OTHER = 'other'
}

/**
 * Enum defining the possible statuses of documents in the system
 */
export enum DocumentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
}

/**
 * Interface defining the document entity structure with all its properties
 * Extends DatabaseEntity to include standard database fields
 */
export interface Document extends DatabaseEntity {
  /**
   * Unique identifier for the document
   */
  id: UUID;
  
  /**
   * Original filename of the document
   */
  fileName: string;
  
  /**
   * Size of the file in bytes
   */
  fileSize: number;
  
  /**
   * MIME type of the document
   */
  contentType: string;
  
  /**
   * Storage key/path for retrieving the document from storage
   */
  storageKey: string;
  
  /**
   * Type of entity this document is associated with
   */
  entityType: DocumentEntityType;
  
  /**
   * ID of the entity this document is associated with
   */
  entityId: UUID;
  
  /**
   * Type of document
   */
  type: DocumentType;
  
  /**
   * Description of the document
   */
  description: string;
  
  /**
   * Tags for categorizing and searching documents
   */
  tags: string[];
  
  /**
   * Current status of the document
   */
  status: DocumentStatus;
  
  /**
   * Additional metadata stored as key-value pairs
   * Can include document-specific data like service date, provider, etc.
   */
  metadata: Record<string, any>;
  
  /**
   * Timestamp when the document was created
   */
  createdAt: Timestamp;
  
  /**
   * Timestamp when the document was last updated
   */
  updatedAt: Timestamp;
  
  /**
   * ID of the user who created the document
   */
  createdBy: UUID;
  
  /**
   * ID of the user who last updated the document
   */
  updatedBy: UUID;
}

/**
 * Interface defining query parameters for document search and filtering
 */
export interface DocumentQueryParams {
  /**
   * Filter by entity type
   */
  entityType?: DocumentEntityType;
  
  /**
   * Filter by entity ID
   */
  entityId?: UUID;
  
  /**
   * Filter by document type
   */
  type?: DocumentType;
  
  /**
   * Filter by document status
   */
  status?: DocumentStatus;
  
  /**
   * Search term for document name/description
   */
  search?: string;
  
  /**
   * Filter by tags
   */
  tags?: string[];
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
  
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction (asc or desc)
   */
  sortDirection?: string;
}

/**
 * Interface defining parameters for document upload requests
 */
export interface DocumentUploadParams {
  /**
   * Original filename of the document
   */
  fileName: string;
  
  /**
   * MIME type of the document
   */
  contentType: string;
  
  /**
   * Type of entity this document is associated with
   */
  entityType: DocumentEntityType;
  
  /**
   * ID of the entity this document is associated with
   */
  entityId: UUID;
  
  /**
   * Type of document
   */
  type: DocumentType;
  
  /**
   * Description of the document
   */
  description: string;
  
  /**
   * Tags for categorizing and searching documents
   */
  tags?: string[];
  
  /**
   * Additional metadata stored as key-value pairs
   */
  metadata?: Record<string, any>;
}

/**
 * Interface defining the result of a document upload request
 */
export interface DocumentUploadResult {
  /**
   * The created document record
   */
  document: Document;
  
  /**
   * Pre-signed URL for uploading the document to storage
   */
  uploadUrl: string;
}

/**
 * Interface defining the result of a document download request
 */
export interface DocumentDownloadResult {
  /**
   * The document record
   */
  document: Document;
  
  /**
   * Pre-signed URL for downloading the document from storage
   */
  downloadUrl: string;
}

/**
 * Document model constants and type references
 */
export const DocumentModel = {
  /**
   * Database table name for documents
   */
  tableName: 'documents',
  
  /**
   * Reference to document type enum
   */
  DocumentType,
  
  /**
   * Reference to document entity type enum
   */
  DocumentEntityType,
  
  /**
   * Reference to document status enum
   */
  DocumentStatus
};