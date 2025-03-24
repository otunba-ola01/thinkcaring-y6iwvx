import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import {
  Service,
  ServiceWithRelations,
  ServiceSummary,
  ServiceQueryParams,
  BillingStatus,
  DocumentationStatus
} from '../../types/services.types';
import {
  UUID,
  DateRange
} from '../../types/common.types';
import {
  WhereCondition,
  OrderBy,
  Pagination,
  PaginatedResult,
  RepositoryOptions,
  Transaction,
  QueryBuilder
} from '../../types/database.types';
import { logger } from '../../utils/logger';

/**
 * Repository class for Service entities providing specialized data access methods
 * for services, including filtering by various criteria, handling service-specific
 * relationships, and supporting the billing workflow.
 */
export class ServiceRepository extends BaseRepository<Service> {
  private serviceDocumentsTableName: string;
  private clientsTableName: string;
  private serviceTypesTableName: string;
  private programsTableName: string;
  private staffTableName: string;
  private facilitiesTableName: string;
  private authorizationsTableName: string;
  private claimsTableName: string;
  private documentsTableName: string;

  /**
   * Creates a new ServiceRepository instance
   */
  constructor() {
    // Call super constructor with 'services' table name and 'id' as primary key
    super('services', 'id');
    
    // Initialize table name constants for related tables
    this.serviceDocumentsTableName = 'service_documents';
    this.clientsTableName = 'clients';
    this.serviceTypesTableName = 'service_types';
    this.programsTableName = 'programs';
    this.staffTableName = 'staff';
    this.facilitiesTableName = 'facilities';
    this.authorizationsTableName = 'authorizations';
    this.claimsTableName = 'claims';
    this.documentsTableName = 'documents';
  }

  /**
   * Finds a service by ID and includes all related entities
   * 
   * @param id Service ID
   * @param options Repository options
   * @returns The service with relations if found, null otherwise
   */
  async findByIdWithRelations(id: UUID, options: RepositoryOptions = {}): Promise<ServiceWithRelations | null> {
    try {
      logger.debug(`Finding service by ID with relations: ${id}`);
      
      // Query the service
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const service = await queryBuilder.where('id', id).first();
      
      if (!service) {
        return null;
      }
      
      // Fetch related entities
      const knex = getKnexInstance();
      
      // Fetch client
      const client = await knex(this.clientsTableName)
        .where('id', service.client_id)
        .first();
      
      // Fetch service type
      const serviceType = await knex(this.serviceTypesTableName)
        .where('id', service.service_type_id)
        .first();
      
      // Fetch program
      const program = await knex(this.programsTableName)
        .where('id', service.program_id)
        .first();
      
      // Fetch staff if staffId exists
      let staff = null;
      if (service.staff_id) {
        staff = await knex(this.staffTableName)
          .where('id', service.staff_id)
          .first();
      }
      
      // Fetch facility if facilityId exists
      let facility = null;
      if (service.facility_id) {
        facility = await knex(this.facilitiesTableName)
          .where('id', service.facility_id)
          .first();
      }
      
      // Fetch authorization if authorizationId exists
      let authorization = null;
      if (service.authorization_id) {
        authorization = await knex(this.authorizationsTableName)
          .where('id', service.authorization_id)
          .first();
      }
      
      // Fetch claim if claimId exists
      let claim = null;
      if (service.claim_id) {
        claim = await knex(this.claimsTableName)
          .where('id', service.claim_id)
          .first();
      }
      
      // Fetch documents associated with the service
      const documents = await this.getServiceDocuments(id, options);
      
      // Build the combined result
      return this.buildServiceWithRelations(
        service,
        client,
        serviceType,
        program,
        staff,
        facility,
        authorization,
        claim,
        documents
      );
    } catch (error) {
      this.handleDatabaseError(error, 'findByIdWithRelations');
    }
  }

  /**
   * Finds services for a specific client with optional filtering
   * 
   * @param clientId Client ID
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated services for the client
   */
  async findByClientId(
    clientId: UUID,
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceWithRelations>> {
    try {
      logger.debug(`Finding services for client: ${clientId}`, { params });
      
      // Create updated params with client ID
      const updatedParams = {
        ...params,
        clientId
      };
      
      // Call findAllWithRelations with the updated parameters
      return this.findAllWithRelations(updatedParams, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByClientId');
    }
  }

  /**
   * Finds services for a specific authorization with optional filtering
   * 
   * @param authorizationId Authorization ID
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated services for the authorization
   */
  async findByAuthorizationId(
    authorizationId: UUID,
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceWithRelations>> {
    try {
      logger.debug(`Finding services for authorization: ${authorizationId}`, { params });
      
      // Create updated params with authorization ID
      const updatedParams = {
        ...params,
        authorizationId
      };
      
      // Call findAllWithRelations with the updated parameters
      return this.findAllWithRelations(updatedParams, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByAuthorizationId');
    }
  }

  /**
   * Finds services for a specific claim with optional filtering
   * 
   * @param claimId Claim ID
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated services for the claim
   */
  async findByClaimId(
    claimId: UUID,
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceWithRelations>> {
    try {
      logger.debug(`Finding services for claim: ${claimId}`, { params });
      
      // Create updated params with claim ID
      const updatedParams = {
        ...params,
        claimId
      };
      
      // Call findAllWithRelations with the updated parameters
      return this.findAllWithRelations(updatedParams, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByClaimId');
    }
  }

  /**
   * Finds all services with optional filtering, pagination, and includes related entities
   * 
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated services with relations
   */
  async findAllWithRelations(
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceWithRelations>> {
    try {
      logger.debug('Finding all services with relations', { params });
      
      const knex = getKnexInstance();
      const trx = options.transaction;
      
      // Extract pagination and sorting
      const pagination = params.pagination || { page: 1, limit: 25 };
      const sortParams = params.sort || { sortBy: 'service_date', sortDirection: 'desc' };
      
      // Convert sort parameters to OrderBy format
      const orderBy: OrderBy[] = [{
        column: sortParams.sortBy,
        direction: sortParams.sortDirection === 'asc' ? 'ASC' : 'DESC'
      }];
      
      // Start building the query
      let queryBuilder = this.getQueryBuilder(trx);
      
      // Apply filters
      queryBuilder = this.applyServiceQueryFilters(queryBuilder, params);
      
      // Clone the query for counting total records
      const countQuery = queryBuilder.clone();
      
      // Get total count
      const totalResult = await countQuery.count({ count: '*' }).first();
      const total = parseInt(totalResult.count, 10);
      
      // Apply pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit;
      queryBuilder = queryBuilder
        .offset(offset)
        .limit(pagination.limit);
      
      // Apply sorting
      queryBuilder = this.applyOrderBy(queryBuilder, orderBy);
      
      // Execute the main query
      const services = await queryBuilder;
      
      // Process each service to include related entities
      const servicesWithRelations: ServiceWithRelations[] = [];
      
      for (const service of services) {
        // Fetch client
        const client = await knex(this.clientsTableName)
          .where('id', service.client_id)
          .first();
        
        // Fetch service type
        const serviceType = await knex(this.serviceTypesTableName)
          .where('id', service.service_type_id)
          .first();
        
        // Fetch program
        const program = await knex(this.programsTableName)
          .where('id', service.program_id)
          .first();
        
        // Fetch staff if staffId exists
        let staff = null;
        if (service.staff_id) {
          staff = await knex(this.staffTableName)
            .where('id', service.staff_id)
            .first();
        }
        
        // Fetch facility if facilityId exists
        let facility = null;
        if (service.facility_id) {
          facility = await knex(this.facilitiesTableName)
            .where('id', service.facility_id)
            .first();
        }
        
        // Fetch authorization if authorizationId exists
        let authorization = null;
        if (service.authorization_id) {
          authorization = await knex(this.authorizationsTableName)
            .where('id', service.authorization_id)
            .first();
        }
        
        // Fetch claim if claimId exists
        let claim = null;
        if (service.claim_id) {
          claim = await knex(this.claimsTableName)
            .where('id', service.claim_id)
            .first();
        }
        
        // Fetch documents associated with the service
        const documents = await this.getServiceDocuments(service.id, options);
        
        // Build the combined result
        const serviceWithRelations = this.buildServiceWithRelations(
          service,
          client,
          serviceType,
          program,
          staff,
          facility,
          authorization,
          claim,
          documents
        );
        
        servicesWithRelations.push(serviceWithRelations);
      }
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.limit);
      
      // Return paginated result
      return {
        data: servicesWithRelations,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAllWithRelations');
    }
  }

  /**
   * Finds services that are ready for billing - a key method for supporting
   * the billing workflow by identifying services that can be added to claims
   * 
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated unbilled services that are ready for claim generation
   */
  async findUnbilledServices(
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceWithRelations>> {
    try {
      logger.debug('Finding unbilled services ready for claim generation', { params });
      
      // Create updated params with billing status READY_FOR_BILLING and documentation status COMPLETE
      const updatedParams = {
        ...params,
        billingStatus: BillingStatus.READY_FOR_BILLING,
        documentationStatus: DocumentationStatus.COMPLETE
      };
      
      // Call findAllWithRelations with the updated parameters
      return this.findAllWithRelations(updatedParams, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findUnbilledServices');
    }
  }

  /**
   * Gets summarized service information for lists and dashboards
   * Optimized for dashboard display with minimal data transfer
   * 
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated service summaries
   */
  async getServiceSummaries(
    params: ServiceQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ServiceSummary>> {
    try {
      logger.debug('Getting service summaries', { params });
      
      const knex = getKnexInstance();
      const trx = options.transaction;
      
      // Extract pagination and sorting
      const pagination = params.pagination || { page: 1, limit: 25 };
      const sortParams = params.sort || { sortBy: 'service_date', sortDirection: 'desc' };
      
      // Start building the query with only the necessary fields for summaries
      let queryBuilder = knex(this.tableName)
        .select([
          `${this.tableName}.id`,
          `${this.tableName}.service_date`,
          `${this.tableName}.units`,
          `${this.tableName}.amount`,
          `${this.tableName}.documentation_status`,
          `${this.tableName}.billing_status`,
          `${this.clientsTableName}.first_name as client_first_name`,
          `${this.clientsTableName}.last_name as client_last_name`,
          `${this.serviceTypesTableName}.name as service_type`,
          `${this.programsTableName}.name as program_name`
        ])
        .join(
          this.clientsTableName,
          `${this.tableName}.client_id`,
          `${this.clientsTableName}.id`
        )
        .join(
          this.serviceTypesTableName,
          `${this.tableName}.service_type_id`,
          `${this.serviceTypesTableName}.id`
        )
        .join(
          this.programsTableName,
          `${this.tableName}.program_id`,
          `${this.programsTableName}.id`
        )
        .whereNull(`${this.tableName}.deleted_at`);
      
      // Apply filters from params
      if (params.clientId) {
        queryBuilder = queryBuilder.where(`${this.tableName}.client_id`, params.clientId);
      }
      
      if (params.programId) {
        queryBuilder = queryBuilder.where(`${this.tableName}.program_id`, params.programId);
      }
      
      if (params.serviceTypeId) {
        queryBuilder = queryBuilder.where(`${this.tableName}.service_type_id`, params.serviceTypeId);
      }
      
      if (params.dateRange) {
        queryBuilder = queryBuilder
          .where(`${this.tableName}.service_date`, '>=', params.dateRange.startDate)
          .where(`${this.tableName}.service_date`, '<=', params.dateRange.endDate);
      }
      
      if (params.documentationStatus) {
        queryBuilder = queryBuilder.where(`${this.tableName}.documentation_status`, params.documentationStatus);
      }
      
      if (params.billingStatus) {
        queryBuilder = queryBuilder.where(`${this.tableName}.billing_status`, params.billingStatus);
      }
      
      if (params.status) {
        queryBuilder = queryBuilder.where(`${this.tableName}.status`, params.status);
      }
      
      // Apply search filter if provided
      if (params.search) {
        queryBuilder = queryBuilder.where(function() {
          this.where(`${this.clientsTableName}.first_name`, 'ilike', `%${params.search}%`)
            .orWhere(`${this.clientsTableName}.last_name`, 'ilike', `%${params.search}%`)
            .orWhere(`${this.serviceTypesTableName}.name`, 'ilike', `%${params.search}%`)
            .orWhere(`${this.tableName}.service_code`, 'ilike', `%${params.search}%`);
        });
      }
      
      // Clone the query for counting total records
      const countQuery = queryBuilder.clone();
      
      // Get total count
      const totalResult = await countQuery.count({ count: '*' }).first();
      const total = parseInt(totalResult.count, 10);
      
      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      queryBuilder = queryBuilder
        .offset(offset)
        .limit(pagination.limit);
      
      // Apply sorting
      queryBuilder = queryBuilder.orderBy(sortParams.sortBy, sortParams.sortDirection);
      
      // Execute the main query
      const results = await queryBuilder;
      
      // Map to ServiceSummary objects
      const summaries: ServiceSummary[] = results.map(result => ({
        id: result.id,
        clientName: `${result.client_first_name} ${result.client_last_name}`,
        serviceType: result.service_type,
        serviceDate: result.service_date,
        units: result.units,
        amount: result.amount,
        documentationStatus: result.documentation_status,
        billingStatus: result.billing_status,
        programName: result.program_name
      }));
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.limit);
      
      // Return paginated result
      return {
        data: summaries,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceSummaries');
    }
  }

  /**
   * Updates a service's billing status - essential for tracking the billing lifecycle
   * of services and supporting the billing workflow
   * 
   * @param id Service ID
   * @param billingStatus New billing status
   * @param claimId Claim ID (if being added to a claim)
   * @param options Repository options
   * @returns The updated service
   */
  async updateBillingStatus(
    id: UUID,
    billingStatus: BillingStatus,
    claimId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<Service> {
    try {
      logger.debug(`Updating billing status for service ${id}`, { billingStatus, claimId });
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data
      const updateData: any = {
        billing_status: billingStatus,
        updated_at: new Date()
      };
      
      // Add claim ID if provided
      if (claimId !== undefined) {
        updateData.claim_id = claimId;
      }
      
      // Add updated_by if provided in options
      if ('updatedBy' in options) {
        updateData.updated_by = options.updatedBy;
      }
      
      // Execute update
      const [updatedService] = await queryBuilder
        .where('id', id)
        .update(updateData)
        .returning('*');
      
      return updatedService;
    } catch (error) {
      this.handleDatabaseError(error, 'updateBillingStatus');
    }
  }

  /**
   * Updates a service's documentation status and associated documents
   * Essential for tracking service documentation completeness
   * 
   * @param id Service ID
   * @param documentationStatus New documentation status
   * @param documentIds Document IDs to associate with the service
   * @param options Repository options
   * @returns The updated service
   */
  async updateDocumentationStatus(
    id: UUID,
    documentationStatus: DocumentationStatus,
    documentIds: UUID[],
    options: RepositoryOptions = {}
  ): Promise<Service> {
    try {
      logger.debug(`Updating documentation status for service ${id}`, { documentationStatus, documentIds });
      
      // Start a transaction if not provided
      const knex = getKnexInstance();
      const trx = options.transaction || await knex.transaction();
      const useProvidedTransaction = !!options.transaction;
      
      try {
        // Prepare update data
        const updateData: any = {
          documentation_status: documentationStatus,
          updated_at: new Date()
        };
        
        // Add updated_by if provided in options
        if ('updatedBy' in options) {
          updateData.updated_by = options.updatedBy;
        }
        
        // Update the service
        const [updatedService] = await trx(this.tableName)
          .where('id', id)
          .update(updateData)
          .returning('*');
        
        // Update document associations if documentIds provided
        if (documentIds && documentIds.length > 0) {
          // Remove existing associations
          await this.removeDocumentAssociations(id, trx);
          
          // Create new associations
          await this.associateDocuments(id, documentIds, trx);
        }
        
        // Commit the transaction if we started it
        if (!useProvidedTransaction) {
          await trx.commit();
        }
        
        return updatedService;
      } catch (error) {
        // Rollback the transaction if we started it
        if (!useProvidedTransaction) {
          await trx.rollback();
        }
        throw error;
      }
    } catch (error) {
      this.handleDatabaseError(error, 'updateDocumentationStatus');
    }
  }

  /**
   * Gets service metrics for dashboard and reporting
   * Provides essential financial and operational insights for service delivery
   * 
   * @param filters Filters to apply to the metrics
   * @param options Repository options
   * @returns Service metrics data
   */
  async getServiceMetrics(
    filters: {
      dateRange?: DateRange;
      programId?: UUID;
      clientId?: UUID;
    },
    options: RepositoryOptions = {}
  ): Promise<{
    totalServices: number;
    totalUnbilledServices: number;
    totalUnbilledAmount: number;
    incompleteDocumentation: number;
    servicesByProgram: Array<{
      programId: UUID;
      programName: string;
      count: number;
      amount: number;
    }>;
    servicesByType: Array<{
      serviceTypeId: UUID;
      serviceTypeName: string;
      count: number;
      amount: number;
    }>;
  }> {
    try {
      logger.debug('Getting service metrics', { filters });
      
      const knex = getKnexInstance();
      const trx = options.transaction;
      
      // Start building the base query
      let queryBuilder = knex(this.tableName)
        .whereNull(`${this.tableName}.deleted_at`);
      
      // Apply filters
      if (filters.dateRange) {
        queryBuilder = queryBuilder
          .where(`${this.tableName}.service_date`, '>=', filters.dateRange.startDate)
          .where(`${this.tableName}.service_date`, '<=', filters.dateRange.endDate);
      }
      
      if (filters.programId) {
        queryBuilder = queryBuilder.where(`${this.tableName}.program_id`, filters.programId);
      }
      
      if (filters.clientId) {
        queryBuilder = queryBuilder.where(`${this.tableName}.client_id`, filters.clientId);
      }
      
      // Execute queries for various metrics
      
      // 1. Total services
      const totalServicesResult = await queryBuilder.clone().count('* as count').first();
      const totalServices = parseInt(totalServicesResult.count, 10);
      
      // 2. Total unbilled services
      const totalUnbilledServicesResult = await queryBuilder.clone()
        .where('billing_status', BillingStatus.READY_FOR_BILLING)
        .count('* as count')
        .first();
      const totalUnbilledServices = parseInt(totalUnbilledServicesResult.count, 10);
      
      // 3. Total unbilled amount
      const totalUnbilledAmountResult = await queryBuilder.clone()
        .where('billing_status', BillingStatus.READY_FOR_BILLING)
        .sum('amount as total')
        .first();
      const totalUnbilledAmount = parseFloat(totalUnbilledAmountResult.total || 0);
      
      // 4. Incomplete documentation
      const incompleteDocumentationResult = await queryBuilder.clone()
        .where('documentation_status', DocumentationStatus.INCOMPLETE)
        .count('* as count')
        .first();
      const incompleteDocumentation = parseInt(incompleteDocumentationResult.count, 10);
      
      // 5. Services by program
      const servicesByProgramResult = await queryBuilder.clone()
        .select([
          `${this.tableName}.program_id`,
          `${this.programsTableName}.name as program_name`,
          knex.raw('COUNT(*) as count'),
          knex.raw('SUM(amount) as total_amount')
        ])
        .join(
          this.programsTableName,
          `${this.tableName}.program_id`,
          `${this.programsTableName}.id`
        )
        .groupBy(`${this.tableName}.program_id`, `${this.programsTableName}.name`);
      
      const servicesByProgram = servicesByProgramResult.map(result => ({
        programId: result.program_id,
        programName: result.program_name,
        count: parseInt(result.count, 10),
        amount: parseFloat(result.total_amount)
      }));
      
      // 6. Services by type
      const servicesByTypeResult = await queryBuilder.clone()
        .select([
          `${this.tableName}.service_type_id`,
          `${this.serviceTypesTableName}.name as service_type_name`,
          knex.raw('COUNT(*) as count'),
          knex.raw('SUM(amount) as total_amount')
        ])
        .join(
          this.serviceTypesTableName,
          `${this.tableName}.service_type_id`,
          `${this.serviceTypesTableName}.id`
        )
        .groupBy(`${this.tableName}.service_type_id`, `${this.serviceTypesTableName}.name`);
      
      const servicesByType = servicesByTypeResult.map(result => ({
        serviceTypeId: result.service_type_id,
        serviceTypeName: result.service_type_name,
        count: parseInt(result.count, 10),
        amount: parseFloat(result.total_amount)
      }));
      
      // Combine all metrics into result object
      return {
        totalServices,
        totalUnbilledServices,
        totalUnbilledAmount,
        incompleteDocumentation,
        servicesByProgram,
        servicesByType
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceMetrics');
    }
  }

  /**
   * Gets documents associated with a service
   * 
   * @param serviceId Service ID
   * @param options Repository options
   * @returns Documents associated with the service
   */
  async getServiceDocuments(
    serviceId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<{ id: UUID, fileName: string, fileSize: number, mimeType: string }>> {
    try {
      logger.debug(`Getting documents for service ${serviceId}`);
      
      const knex = getKnexInstance();
      const trx = options.transaction;
      
      const queryBuilder = trx ? trx : knex;
      
      const documents = await queryBuilder(this.serviceDocumentsTableName)
        .select([
          `${this.documentsTableName}.id`,
          `${this.documentsTableName}.file_name as fileName`,
          `${this.documentsTableName}.file_size as fileSize`,
          `${this.documentsTableName}.mime_type as mimeType`
        ])
        .join(
          this.documentsTableName,
          `${this.serviceDocumentsTableName}.document_id`,
          `${this.documentsTableName}.id`
        )
        .where(`${this.serviceDocumentsTableName}.service_id`, serviceId);
      
      return documents;
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceDocuments');
    }
  }

  /**
   * Associates documents with a service
   * 
   * @param serviceId Service ID
   * @param documentIds Document IDs to associate
   * @param trx Transaction object
   * @returns Promise that resolves when documents are associated
   */
  async associateDocuments(
    serviceId: UUID,
    documentIds: UUID[],
    trx: Transaction
  ): Promise<void> {
    try {
      logger.debug(`Associating documents with service ${serviceId}`, { documentIds });
      
      // Prepare data for insertion
      const insertData = documentIds.map(documentId => ({
        service_id: serviceId,
        document_id: documentId,
        created_at: new Date()
      }));
      
      // Execute insert
      await trx(this.serviceDocumentsTableName).insert(insertData);
    } catch (error) {
      this.handleDatabaseError(error, 'associateDocuments');
    }
  }

  /**
   * Removes document associations from a service
   * 
   * @param serviceId Service ID
   * @param trx Transaction object
   * @returns Promise that resolves when document associations are removed
   */
  async removeDocumentAssociations(
    serviceId: UUID,
    trx: Transaction
  ): Promise<void> {
    try {
      logger.debug(`Removing document associations from service ${serviceId}`);
      
      // Execute delete
      await trx(this.serviceDocumentsTableName)
        .where('service_id', serviceId)
        .delete();
    } catch (error) {
      this.handleDatabaseError(error, 'removeDocumentAssociations');
    }
  }

  /**
   * Builds a ServiceWithRelations object from a service and its related entities
   * 
   * @param service Base service entity
   * @param client Client entity
   * @param serviceType Service type entity
   * @param program Program entity
   * @param staff Staff entity (optional)
   * @param facility Facility entity (optional)
   * @param authorization Authorization entity (optional)
   * @param claim Claim entity (optional)
   * @param documents Document entities
   * @returns Complete ServiceWithRelations object
   */
  private buildServiceWithRelations(
    service: Service,
    client: any,
    serviceType: any,
    program: any,
    staff: any | null,
    facility: any | null,
    authorization: any | null,
    claim: any | null,
    documents: Array<{ id: UUID, fileName: string, fileSize: number, mimeType: string }>
  ): ServiceWithRelations {
    // Transform from snake_case database columns to camelCase properties
    const result: ServiceWithRelations = {
      id: service.id,
      clientId: service.client_id,
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        medicaidId: client.medicaid_id
      },
      serviceTypeId: service.service_type_id,
      serviceType: {
        id: serviceType.id,
        name: serviceType.name,
        code: serviceType.code
      },
      serviceCode: service.service_code,
      serviceDate: service.service_date,
      startTime: service.start_time,
      endTime: service.end_time,
      units: service.units,
      rate: service.rate,
      amount: service.amount,
      staffId: service.staff_id,
      staff: staff ? {
        id: staff.id,
        firstName: staff.first_name,
        lastName: staff.last_name,
        title: staff.title
      } : null,
      facilityId: service.facility_id,
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        type: facility.type
      } : null,
      programId: service.program_id,
      program: {
        id: program.id,
        name: program.name,
        code: program.code
      },
      authorizationId: service.authorization_id,
      authorization: authorization ? {
        id: authorization.id,
        number: authorization.number,
        startDate: authorization.start_date,
        endDate: authorization.end_date,
        authorizedUnits: authorization.authorized_units,
        usedUnits: authorization.used_units
      } : null,
      documentationStatus: service.documentation_status,
      billingStatus: service.billing_status,
      claimId: service.claim_id,
      claim: claim ? {
        id: claim.id,
        claimNumber: claim.claim_number,
        status: claim.status
      } : null,
      notes: service.notes,
      documentIds: documents.map(doc => doc.id),
      documents,
      status: service.status,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    };
    
    return result;
  }

  /**
   * Applies service-specific filters to a query builder
   * 
   * @param queryBuilder Query builder to apply filters to
   * @param params Service query parameters
   * @returns The query builder with filters applied
   */
  private applyServiceQueryFilters(
    queryBuilder: QueryBuilder,
    params: ServiceQueryParams
  ): QueryBuilder {
    // Apply date range filter
    if (params.dateRange) {
      queryBuilder = queryBuilder
        .where('service_date', '>=', params.dateRange.startDate)
        .where('service_date', '<=', params.dateRange.endDate);
    }
    
    // Apply documentation status filter
    if (params.documentationStatus) {
      queryBuilder = queryBuilder.where('documentation_status', params.documentationStatus);
    }
    
    // Apply billing status filter
    if (params.billingStatus) {
      queryBuilder = queryBuilder.where('billing_status', params.billingStatus);
    }
    
    // Apply program filter
    if (params.programId) {
      queryBuilder = queryBuilder.where('program_id', params.programId);
    }
    
    // Apply service type filter
    if (params.serviceTypeId) {
      queryBuilder = queryBuilder.where('service_type_id', params.serviceTypeId);
    }
    
    // Apply client filter
    if (params.clientId) {
      queryBuilder = queryBuilder.where('client_id', params.clientId);
    }
    
    // Apply authorization filter
    if (params.authorizationId) {
      queryBuilder = queryBuilder.where('authorization_id', params.authorizationId);
    }
    
    // Apply claim filter
    if (params.claimId) {
      queryBuilder = queryBuilder.where('claim_id', params.claimId);
    }
    
    // Apply status filter
    if (params.status) {
      queryBuilder = queryBuilder.where('status', params.status);
    }
    
    return queryBuilder;
  }
}

// Create and export an instance of the repository
const serviceRepository = new ServiceRepository();
export default serviceRepository;