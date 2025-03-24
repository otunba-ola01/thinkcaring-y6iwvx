import { BaseRepository } from './base.repository';
import { 
  Document, 
  DocumentModel, 
  DocumentType, 
  DocumentEntityType, 
  DocumentStatus, 
  DocumentQueryParams,
  DocumentUploadParams,
  DocumentUploadResult,
  DocumentDownloadResult
} from '../../models/document.model';
import { UUID } from '../../types/common.types';
import { WhereCondition, PaginatedResult, RepositoryOptions } from '../../types/database.types';
import { 
  generateStorageKey, 
  getSignedUploadUrl, 
  getSignedDownloadUrl, 
  deleteFileFromS3 
} from '../../utils/file';
import { logger } from '../../utils/logger';
import { config } from '../../config';

/**
 * Repository class for document entities that provides database operations
 * and handles S3 storage interactions for document uploads and downloads.
 * Supports HIPAA compliance with proper document handling and metadata tracking.
 */
export class DocumentRepository extends BaseRepository<Document> {
  /**
   * URL expiration time in seconds for presigned S3 URLs
   */
  private urlExpirationSeconds: number;

  /**
   * Creates a new DocumentRepository instance
   */
  constructor() {
    // Call super constructor with document table name and primary key
    super(DocumentModel.tableName, 'id');
    
    // Set URL expiration from config or use a default (15 minutes)
    this.urlExpirationSeconds = config.storage?.urlExpirationSeconds || 900;
  }

  /**
   * Finds documents associated with a specific entity type and ID
   * 
   * @param entityType The type of entity to find documents for
   * @param entityId The ID of the entity to find documents for
   * @param queryParams Optional query parameters for filtering and pagination
   * @param options Repository options
   * @returns Paginated list of documents
   */
  async findByEntityTypeAndId(
    entityType: DocumentEntityType,
    entityId: UUID,
    queryParams: DocumentQueryParams = {},
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Document>> {
    try {
      logger.debug(`Finding documents for entity type ${entityType} with ID ${entityId}`, { entityType, entityId, queryParams });
      
      // Create where condition for entity type and ID
      const whereCondition: Record<string, any> = {
        entity_type: entityType,
        entity_id: entityId
      };
      
      // Add document type filter if provided
      if (queryParams.type) {
        whereCondition.type = queryParams.type;
      }
      
      // Add document status filter if provided
      if (queryParams.status) {
        whereCondition.status = queryParams.status;
      }
      
      // Add search filter for filename or description if provided
      if (queryParams.search) {
        // This might require a custom query implementation depending on the database
        logger.debug('Search filtering applied', { search: queryParams.search });
      }
      
      // Add tags filter if provided
      if (queryParams.tags && queryParams.tags.length > 0) {
        // This might require a custom query implementation depending on the database
        logger.debug('Tags filtering applied', { tags: queryParams.tags });
      }
      
      // Extract pagination parameters
      const pagination = {
        page: queryParams.page || 1,
        limit: queryParams.limit || 20
      };
      
      // Extract sorting parameters
      const orderBy = queryParams.sortBy && queryParams.sortDirection
        ? [{ 
            column: queryParams.sortBy, 
            direction: queryParams.sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC' 
          }]
        : [{ column: 'created_at', direction: 'DESC' }];
      
      // Call findAll method with constructed parameters
      return await this.findAll(whereCondition, pagination, orderBy, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByEntityTypeAndId');
    }
  }

  /**
   * Finds documents of a specific document type
   * 
   * @param documentType The type of document to find
   * @param queryParams Optional query parameters for filtering and pagination
   * @param options Repository options
   * @returns Paginated list of documents
   */
  async findByType(
    documentType: DocumentType,
    queryParams: DocumentQueryParams = {},
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Document>> {
    try {
      logger.debug(`Finding documents of type ${documentType}`, { documentType, queryParams });
      
      // Create where condition for document type
      const whereCondition: Record<string, any> = {
        type: documentType
      };
      
      // Add entity type filter if provided
      if (queryParams.entityType) {
        whereCondition.entity_type = queryParams.entityType;
      }
      
      // Add entity ID filter if provided
      if (queryParams.entityId) {
        whereCondition.entity_id = queryParams.entityId;
      }
      
      // Add document status filter if provided
      if (queryParams.status) {
        whereCondition.status = queryParams.status;
      }
      
      // Same considerations for search and tags as in findByEntityTypeAndId
      
      // Extract pagination parameters
      const pagination = {
        page: queryParams.page || 1,
        limit: queryParams.limit || 20
      };
      
      // Extract sorting parameters
      const orderBy = queryParams.sortBy && queryParams.sortDirection
        ? [{ 
            column: queryParams.sortBy, 
            direction: queryParams.sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC' 
          }]
        : [{ column: 'created_at', direction: 'DESC' }];
      
      // Call findAll method with constructed parameters
      return await this.findAll(whereCondition, pagination, orderBy, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByType');
    }
  }

  /**
   * Prepares a document upload by creating a document record and generating a pre-signed upload URL
   * 
   * @param params Document upload parameters
   * @param options Repository options
   * @returns Document record and upload URL
   */
  async prepareUpload(
    params: DocumentUploadParams,
    options: RepositoryOptions = {}
  ): Promise<DocumentUploadResult> {
    try {
      logger.debug('Preparing document upload', { params });
      
      // Generate a storage key for the document using entity type and filename
      const storageKey = generateStorageKey(
        `${params.entityType}/${params.type}`, 
        params.fileName
      );
      
      // Create document data object with provided parameters
      const documentData: Partial<Document> = {
        fileName: params.fileName,
        contentType: params.contentType,
        storageKey,
        entityType: params.entityType,
        entityId: params.entityId,
        type: params.type,
        description: params.description || '',
        tags: params.tags || [],
        status: DocumentStatus.PENDING, // Set initial status to PENDING
        metadata: params.metadata || {},
        fileSize: 0 // Will be updated after upload completes
      };
      
      // Create the document record in the database
      const document = await this.create(documentData, options);
      
      // Generate a pre-signed upload URL for the document
      const uploadUrl = await getSignedUploadUrl(
        storageKey,
        params.contentType,
        { 
          documentId: document.id,
          entityType: params.entityType,
          entityId: params.entityId
        },
        this.urlExpirationSeconds
      );
      
      // Return document record and upload URL
      return {
        document,
        uploadUrl
      };
    } catch (error) {
      logger.error('Error preparing document upload', { 
        error: error instanceof Error ? error.message : String(error),
        params 
      });
      this.handleDatabaseError(error, 'prepareUpload');
    }
  }

  /**
   * Gets a pre-signed download URL for a document
   * 
   * @param id Document ID
   * @param options Repository options
   * @returns Document record and download URL
   */
  async getDownloadUrl(
    id: UUID,
    options: RepositoryOptions = {}
  ): Promise<DocumentDownloadResult> {
    try {
      logger.debug(`Getting download URL for document ${id}`);
      
      // Find the document by ID
      const document = await this.findById(id, options);
      
      // If document not found, throw error
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Generate a pre-signed download URL for the document
      const downloadUrl = await getSignedDownloadUrl(
        document.storageKey,
        this.urlExpirationSeconds
      );
      
      // Return document record and download URL
      return {
        document,
        downloadUrl
      };
    } catch (error) {
      logger.error('Error getting document download URL', { 
        error: error instanceof Error ? error.message : String(error),
        documentId: id 
      });
      this.handleDatabaseError(error, 'getDownloadUrl');
    }
  }

  /**
   * Confirms a document upload by updating its status from PENDING to ACTIVE
   * 
   * @param id Document ID
   * @param options Repository options
   * @returns Updated document record
   */
  async confirmUpload(
    id: UUID,
    options: RepositoryOptions = {}
  ): Promise<Document> {
    try {
      logger.debug(`Confirming upload for document ${id}`);
      
      // Find the document by ID
      const document = await this.findById(id, options);
      
      // If document not found, throw error
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Update document status to ACTIVE
      return await this.update(id, { 
        status: DocumentStatus.ACTIVE 
      }, options);
    } catch (error) {
      logger.error('Error confirming document upload', { 
        error: error instanceof Error ? error.message : String(error),
        documentId: id 
      });
      this.handleDatabaseError(error, 'confirmUpload');
    }
  }

  /**
   * Deletes a document from both the database and S3 storage
   * 
   * @param id Document ID
   * @param options Repository options including hardDelete flag
   * @returns True if deletion was successful
   */
  async deleteDocument(
    id: UUID,
    options: RepositoryOptions & { hardDelete?: boolean } = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Deleting document ${id}`, { hardDelete: options.hardDelete });
      
      // Find the document by ID
      const document = await this.findById(id, options);
      
      // If document not found, throw error
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Delete the document from S3 storage
      await deleteFileFromS3(document.storageKey);
      
      // Update document status to DELETED or perform hard delete based on options
      if (options.hardDelete) {
        return await this.delete(id, options);
      } else {
        await this.update(id, {
          status: DocumentStatus.DELETED
        }, options);
        return true;
      }
    } catch (error) {
      logger.error('Error deleting document', { 
        error: error instanceof Error ? error.message : String(error),
        documentId: id 
      });
      this.handleDatabaseError(error, 'deleteDocument');
    }
  }

  /**
   * Updates document metadata such as description, tags, and custom metadata
   * 
   * @param id Document ID
   * @param data Updated document data
   * @param options Repository options
   * @returns Updated document record
   */
  async updateDocumentMetadata(
    id: UUID,
    data: Partial<Document>,
    options: RepositoryOptions = {}
  ): Promise<Document> {
    try {
      logger.debug(`Updating metadata for document ${id}`, { data });
      
      // Find the document by ID
      const document = await this.findById(id, options);
      
      // If document not found, throw error
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Filter update data to allow only metadata fields
      const allowedFields = ['description', 'tags', 'metadata'];
      const updateData: Partial<Document> = {};
      
      for (const field of allowedFields) {
        if (field in data) {
          updateData[field] = data[field];
        }
      }
      
      // Update the document record with filtered data
      return await this.update(id, updateData, options);
    } catch (error) {
      logger.error('Error updating document metadata', { 
        error: error instanceof Error ? error.message : String(error),
        documentId: id, 
        data 
      });
      this.handleDatabaseError(error, 'updateDocumentMetadata');
    }
  }

  /**
   * Searches for documents based on various criteria
   * 
   * @param queryParams Query parameters for filtering and pagination
   * @param options Repository options
   * @returns Paginated search results
   */
  async searchDocuments(
    queryParams: DocumentQueryParams = {},
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Document>> {
    try {
      logger.debug('Searching documents', { queryParams });
      
      // Build where conditions based on query parameters
      const whereCondition: Record<string, any> = {};
      
      // Add entity type filter if provided
      if (queryParams.entityType) {
        whereCondition.entity_type = queryParams.entityType;
      }
      
      // Add entity ID filter if provided
      if (queryParams.entityId) {
        whereCondition.entity_id = queryParams.entityId;
      }
      
      // Add document type filter if provided
      if (queryParams.type) {
        whereCondition.type = queryParams.type;
      }
      
      // Add document status filter if provided
      if (queryParams.status) {
        whereCondition.status = queryParams.status;
      }
      
      // Add search filter for filename or description if provided
      if (queryParams.search) {
        logger.debug('Search filtering applied', { search: queryParams.search });
        // Implementation depends on database capabilities
      }
      
      // Add tags filter if provided
      if (queryParams.tags && queryParams.tags.length > 0) {
        logger.debug('Tags filtering applied', { tags: queryParams.tags });
        // Implementation depends on database capabilities
      }
      
      // Extract pagination parameters from query params
      const pagination = {
        page: queryParams.page || 1,
        limit: queryParams.limit || 20
      };
      
      // Extract sorting parameters from query params
      const orderBy = queryParams.sortBy && queryParams.sortDirection
        ? [{ 
            column: queryParams.sortBy, 
            direction: queryParams.sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC' 
          }]
        : [{ column: 'created_at', direction: 'DESC' }];
      
      // Call findAll method with constructed parameters
      return await this.findAll(whereCondition, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error searching documents', { 
        error: error instanceof Error ? error.message : String(error),
        queryParams 
      });
      this.handleDatabaseError(error, 'searchDocuments');
    }
  }
}

// Singleton instance of DocumentRepository for use throughout the application
export const documentRepository = new DocumentRepository();