import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import { 
  Transaction, 
  QueryBuilder, 
  WhereCondition, 
  OrderBy, 
  Pagination, 
  PaginatedResult,
  RepositoryOptions 
} from '../../types/database.types';
import { UUID, ISO8601Date } from '../../types/common.types';
import { 
  Claim, 
  ClaimWithRelations, 
  ClaimStatus, 
  ClaimStatusHistory,
  ClaimService,
  ClaimQueryParams
} from '../../types/claims.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for claim database operations, extending the base repository
 */
class ClaimRepository extends BaseRepository<Claim> {
  /**
   * Creates a new ClaimRepository instance
   */
  constructor() {
    // Call super constructor with 'claims' table name, 'id' primary key, and true for soft delete
    super('claims', 'id', true);
  }

  /**
   * Finds a claim by ID with all related entities (client, payer, services, status history)
   * 
   * @param id The claim ID
   * @param options Repository options
   * @returns The claim with relations if found, null otherwise
   */
  async findByIdWithRelations(id: UUID, options: RepositoryOptions = {}): Promise<ClaimWithRelations | null> {
    try {
      logger.debug(`Finding claim with relations by ID: ${id}`);
      
      // Get query builder with transaction if provided
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Join with clients and payers tables to get their information
      const claim = await queryBuilder
        .select([
          'claims.*',
          'clients.first_name as client_first_name',
          'clients.last_name as client_last_name',
          'clients.medicaid_id as client_medicaid_id',
          'payers.name as payer_name',
          'payers.payer_type as payer_type',
          'payers.is_electronic as payer_is_electronic',
          'payers.status as payer_status'
        ])
        .leftJoin('clients', 'claims.client_id', 'clients.id')
        .leftJoin('payers', 'claims.payer_id', 'payers.id')
        .where('claims.id', id)
        .first();
      
      if (!claim) {
        return null;
      }
      
      // Fetch related entities
      const [services, statusHistory] = await Promise.all([
        this.getClaimServices(id, options),
        this.getStatusHistory(id, options)
      ]);
      
      // If original claim exists, fetch it
      let originalClaim = null;
      if (claim.original_claim_id) {
        const origClaim = await queryBuilder
          .clone()
          .select(['id', 'claim_number', 'total_amount', 'claim_status'])
          .where('id', claim.original_claim_id)
          .first();
        
        if (origClaim) {
          originalClaim = {
            id: origClaim.id,
            claimNumber: origClaim.claim_number,
            totalAmount: origClaim.total_amount,
            claimStatus: origClaim.claim_status
          };
        }
      }
      
      // Transform to ClaimWithRelations structure
      const claimWithRelations: ClaimWithRelations = {
        id: claim.id,
        claimNumber: claim.claim_number,
        externalClaimId: claim.external_claim_id,
        clientId: claim.client_id,
        client: {
          id: claim.client_id,
          firstName: claim.client_first_name,
          lastName: claim.client_last_name,
          medicaidId: claim.client_medicaid_id
        },
        payerId: claim.payer_id,
        payer: {
          id: claim.payer_id,
          name: claim.payer_name,
          payerType: claim.payer_type,
          isElectronic: claim.payer_is_electronic,
          status: claim.payer_status
        },
        claimType: claim.claim_type,
        claimStatus: claim.claim_status,
        totalAmount: claim.total_amount,
        serviceStartDate: claim.service_start_date,
        serviceEndDate: claim.service_end_date,
        submissionDate: claim.submission_date,
        submissionMethod: claim.submission_method,
        adjudicationDate: claim.adjudication_date,
        denialReason: claim.denial_reason,
        denialDetails: claim.denial_details,
        adjustmentCodes: claim.adjustment_codes,
        originalClaimId: claim.original_claim_id,
        originalClaim: originalClaim,
        services: services,
        statusHistory: statusHistory,
        notes: claim.notes,
        createdAt: claim.created_at,
        updatedAt: claim.updated_at,
        createdBy: claim.created_by,
        updatedBy: claim.updated_by
      };
      
      return claimWithRelations;
    } catch (error) {
      this.handleDatabaseError(error, 'findByIdWithRelations');
    }
  }

  /**
   * Finds a claim by its claim number
   * 
   * @param claimNumber The claim number
   * @param options Repository options
   * @returns The claim if found, null otherwise
   */
  async findByClaimNumber(claimNumber: string, options: RepositoryOptions = {}): Promise<Claim | null> {
    try {
      logger.debug(`Finding claim by claim number: ${claimNumber}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const claim = await queryBuilder
        .where('claim_number', claimNumber)
        .first();
      
      return claim || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByClaimNumber');
    }
  }

  /**
   * Finds a claim by its external claim ID (assigned by clearinghouse or payer)
   * 
   * @param externalClaimId The external claim ID
   * @param options Repository options
   * @returns The claim if found, null otherwise
   */
  async findByExternalClaimId(externalClaimId: string, options: RepositoryOptions = {}): Promise<Claim | null> {
    try {
      logger.debug(`Finding claim by external claim ID: ${externalClaimId}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const claim = await queryBuilder
        .where('external_claim_id', externalClaimId)
        .first();
      
      return claim || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByExternalClaimId');
    }
  }

  /**
   * Finds all claims for a specific client with pagination
   * 
   * @param clientId The client ID
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated claims for the client
   */
  async findByClientId(
    clientId: UUID, 
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Claim>> {
    try {
      logger.debug(`Finding claims for client ID: ${clientId}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply client ID filter
      const query = queryBuilder.where('client_id', clientId);
      
      // Create count query
      const countQuery = this.getQueryBuilder(options.transaction)
        .where('client_id', clientId)
        .count({ count: '*' })
        .first();
      
      // Apply pagination and sorting
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [claims, totalResult] = await Promise.all([
        sortedQuery,
        countQuery
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: claims,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByClientId');
    }
  }

  /**
   * Finds all claims for a specific payer with pagination
   * 
   * @param payerId The payer ID
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated claims for the payer
   */
  async findByPayerId(
    payerId: UUID, 
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Claim>> {
    try {
      logger.debug(`Finding claims for payer ID: ${payerId}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply payer ID filter
      const query = queryBuilder.where('payer_id', payerId);
      
      // Create count query
      const countQuery = this.getQueryBuilder(options.transaction)
        .where('payer_id', payerId)
        .count({ count: '*' })
        .first();
      
      // Apply pagination and sorting
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [claims, totalResult] = await Promise.all([
        sortedQuery,
        countQuery
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: claims,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByPayerId');
    }
  }

  /**
   * Finds all claims with a specific status with pagination
   * 
   * @param status The claim status or array of statuses
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated claims with the specified status
   */
  async findByStatus(
    status: ClaimStatus | ClaimStatus[], 
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Claim>> {
    try {
      logger.debug(`Finding claims with status: ${Array.isArray(status) ? status.join(', ') : status}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply status filter
      let query;
      if (Array.isArray(status)) {
        query = queryBuilder.whereIn('claim_status', status);
      } else {
        query = queryBuilder.where('claim_status', status);
      }
      
      // Create count query
      let countQuery;
      if (Array.isArray(status)) {
        countQuery = this.getQueryBuilder(options.transaction)
          .whereIn('claim_status', status)
          .count({ count: '*' })
          .first();
      } else {
        countQuery = this.getQueryBuilder(options.transaction)
          .where('claim_status', status)
          .count({ count: '*' })
          .first();
      }
      
      // Apply pagination and sorting
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [claims, totalResult] = await Promise.all([
        sortedQuery,
        countQuery
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: claims,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByStatus');
    }
  }

  /**
   * Finds claims using advanced query parameters with pagination
   * 
   * @param queryParams Query parameters for filtering, sorting, and pagination
   * @param options Repository options
   * @returns Paginated claims matching the query parameters
   */
  async findWithAdvancedQuery(
    queryParams: ClaimQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Claim>> {
    try {
      logger.debug('Finding claims with advanced query', { queryParams });
      
      const { 
        pagination, 
        sort, 
        filter, 
        search, 
        clientId, 
        payerId, 
        claimStatus, 
        dateRange,
        claimType
      } = queryParams;
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply filters
      if (clientId) {
        queryBuilder.where('client_id', clientId);
      }
      
      if (payerId) {
        queryBuilder.where('payer_id', payerId);
      }
      
      if (claimStatus) {
        if (Array.isArray(claimStatus)) {
          queryBuilder.whereIn('claim_status', claimStatus);
        } else {
          queryBuilder.where('claim_status', claimStatus);
        }
      }
      
      if (dateRange) {
        queryBuilder.where(function() {
          this.whereBetween('service_start_date', [dateRange.startDate, dateRange.endDate])
            .orWhereBetween('service_end_date', [dateRange.startDate, dateRange.endDate]);
        });
      }
      
      if (claimType) {
        queryBuilder.where('claim_type', claimType);
      }
      
      // Apply search if provided
      if (search) {
        queryBuilder.where(function() {
          this.where('claim_number', 'like', `%${search}%`)
            .orWhere('external_claim_id', 'like', `%${search}%`)
            .orWhereExists(function() {
              this.select(1)
                .from('clients')
                .whereRaw('clients.id = claims.client_id')
                .andWhere(function() {
                  this.where('clients.first_name', 'like', `%${search}%`)
                    .orWhere('clients.last_name', 'like', `%${search}%`)
                    .orWhere('clients.medicaid_id', 'like', `%${search}%`);
                });
            });
        });
      }
      
      // Apply custom filters if provided
      if (filter && filter.conditions && filter.conditions.length > 0) {
        filter.conditions.forEach(condition => {
          if (condition.operator === 'in' && Array.isArray(condition.value)) {
            queryBuilder.whereIn(condition.field, condition.value);
          } else if (condition.operator === 'between' && Array.isArray(condition.value) && condition.value.length === 2) {
            queryBuilder.whereBetween(condition.field, condition.value);
          } else {
            queryBuilder.where(condition.field, condition.operator, condition.value);
          }
        });
      }
      
      // Create count query before pagination
      const countQuery = queryBuilder.clone().count({ count: '*' }).first();
      
      // Apply pagination and sorting
      const paginatedQuery = this.applyPagination(queryBuilder, pagination);
      
      // Apply sorting
      if (sort && sort.sortBy) {
        paginatedQuery.orderBy(sort.sortBy, sort.sortDirection);
      } else {
        paginatedQuery.orderBy('created_at', 'desc');
      }
      
      // Execute both queries
      const [claims, totalResult] = await Promise.all([
        paginatedQuery,
        countQuery
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: claims,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithAdvancedQuery');
    }
  }

  /**
   * Finds claims with related entities based on query parameters
   * 
   * @param queryParams Query parameters for filtering, sorting, and pagination
   * @param options Repository options
   * @returns Paginated claims with relations matching the query parameters
   */
  async findWithRelations(
    queryParams: ClaimQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<ClaimWithRelations>> {
    try {
      logger.debug('Finding claims with relations', { queryParams });
      
      // First get paginated claims
      const paginatedClaims = await this.findWithAdvancedQuery(queryParams, options);
      
      // If no results, return empty result set
      if (paginatedClaims.data.length === 0) {
        return {
          data: [],
          total: 0,
          page: queryParams.pagination.page,
          limit: queryParams.pagination.limit,
          totalPages: 0
        };
      }
      
      // Get the claim IDs
      const claimIds = paginatedClaims.data.map(claim => claim.id);
      
      // Query builder for getting client and payer info in a single query
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      const claimsWithClientAndPayer = await queryBuilder
        .select([
          'claims.*',
          'clients.first_name as client_first_name',
          'clients.last_name as client_last_name',
          'clients.medicaid_id as client_medicaid_id',
          'payers.name as payer_name',
          'payers.payer_type as payer_type',
          'payers.is_electronic as payer_is_electronic',
          'payers.status as payer_status'
        ])
        .leftJoin('clients', 'claims.client_id', 'clients.id')
        .leftJoin('payers', 'claims.payer_id', 'payers.id')
        .whereIn('claims.id', claimIds);
      
      // Create a map for quick lookup
      const claimMap = new Map<string, any>();
      claimsWithClientAndPayer.forEach(claim => {
        claimMap.set(claim.id, claim);
      });
      
      // Get services and status history if requested
      const claimsWithRelations: ClaimWithRelations[] = [];
      
      for (const claim of paginatedClaims.data) {
        const claimWithData = claimMap.get(claim.id);
        
        if (!claimWithData) continue;
        
        // Get related entities if requested
        let services = [];
        let statusHistory = [];
        
        if (queryParams.includeServices) {
          services = await this.getClaimServices(claim.id, options);
        }
        
        if (queryParams.includeStatusHistory) {
          statusHistory = await this.getStatusHistory(claim.id, options);
        }
        
        // If original claim exists, fetch it
        let originalClaim = null;
        if (claim.original_claim_id) {
          const origClaim = await queryBuilder
            .clone()
            .select(['id', 'claim_number', 'total_amount', 'claim_status'])
            .where('id', claim.original_claim_id)
            .first();
          
          if (origClaim) {
            originalClaim = {
              id: origClaim.id,
              claimNumber: origClaim.claim_number,
              totalAmount: origClaim.total_amount,
              claimStatus: origClaim.claim_status
            };
          }
        }
        
        // Transform to ClaimWithRelations structure
        const claimWithRelations: ClaimWithRelations = {
          id: claim.id,
          claimNumber: claim.claim_number,
          externalClaimId: claim.external_claim_id,
          clientId: claim.client_id,
          client: {
            id: claim.client_id,
            firstName: claimWithData.client_first_name,
            lastName: claimWithData.client_last_name,
            medicaidId: claimWithData.client_medicaid_id
          },
          payerId: claim.payer_id,
          payer: {
            id: claim.payer_id,
            name: claimWithData.payer_name,
            payerType: claimWithData.payer_type,
            isElectronic: claimWithData.payer_is_electronic,
            status: claimWithData.payer_status
          },
          claimType: claim.claim_type,
          claimStatus: claim.claim_status,
          totalAmount: claim.total_amount,
          serviceStartDate: claim.service_start_date,
          serviceEndDate: claim.service_end_date,
          submissionDate: claim.submission_date,
          submissionMethod: claim.submission_method,
          adjudicationDate: claim.adjudication_date,
          denialReason: claim.denial_reason,
          denialDetails: claim.denial_details,
          adjustmentCodes: claim.adjustment_codes,
          originalClaimId: claim.original_claim_id,
          originalClaim: originalClaim,
          services: services,
          statusHistory: statusHistory,
          notes: claim.notes,
          createdAt: claim.created_at,
          updatedAt: claim.updated_at,
          createdBy: claim.created_by,
          updatedBy: claim.updated_by
        };
        
        claimsWithRelations.push(claimWithRelations);
      }
      
      return {
        data: claimsWithRelations,
        total: paginatedClaims.total,
        page: paginatedClaims.page,
        limit: paginatedClaims.limit,
        totalPages: paginatedClaims.totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithRelations');
    }
  }

  /**
   * Gets the services associated with a claim
   * 
   * @param claimId The claim ID
   * @param options Repository options
   * @returns Array of claim services
   */
  async getClaimServices(claimId: UUID, options: RepositoryOptions = {}): Promise<ClaimService[]> {
    try {
      logger.debug(`Getting services for claim ID: ${claimId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_services');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_services');
      }
      
      const claimServices = await queryBuilder
        .select([
          'claim_services.*',
          'services.service_code',
          'services.service_date',
          'services.units',
          'services.rate',
          'services.amount',
          'service_types.name as service_type_name'
        ])
        .where('claim_services.claim_id', claimId)
        .leftJoin('services', 'claim_services.service_id', 'services.id')
        .leftJoin('service_types', 'services.service_type_id', 'service_types.id');
      
      // Transform to ClaimService interface
      return claimServices.map(service => ({
        id: service.id,
        claimId: service.claim_id,
        serviceId: service.service_id,
        serviceLineNumber: service.service_line_number,
        billedUnits: service.billed_units,
        billedAmount: service.billed_amount,
        service: {
          id: service.service_id,
          serviceCode: service.service_code,
          serviceType: service.service_type_name,
          serviceDate: service.service_date,
          units: service.units,
          amount: service.amount
        }
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getClaimServices');
    }
  }

  /**
   * Adds a service to a claim
   * 
   * @param claimId The claim ID
   * @param serviceId The service ID
   * @param serviceLineNumber The line number on the claim
   * @param billedUnits The number of units billed
   * @param billedAmount The amount billed
   * @param options Repository options
   * @returns The created claim service association
   */
  async addServiceToClaim(
    claimId: UUID, 
    serviceId: UUID, 
    serviceLineNumber: number,
    billedUnits: number,
    billedAmount: number,
    options: RepositoryOptions = {}
  ): Promise<ClaimService> {
    try {
      logger.debug(`Adding service ${serviceId} to claim ${claimId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_services');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_services');
      }
      
      const [claimService] = await queryBuilder
        .insert({
          claim_id: claimId,
          service_id: serviceId,
          service_line_number: serviceLineNumber,
          billed_units: billedUnits,
          billed_amount: billedAmount,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      // Also update the service's billing status
      await knex('services')
        .where('id', serviceId)
        .update({
          billing_status: 'in_claim',
          claim_id: claimId,
          updated_at: new Date()
        });
      
      // Get service details
      const service = await knex('services')
        .select([
          'services.*',
          'service_types.name as service_type_name'
        ])
        .where('services.id', serviceId)
        .leftJoin('service_types', 'services.service_type_id', 'service_types.id')
        .first();
      
      return {
        id: claimService.id,
        claimId: claimService.claim_id,
        serviceId: claimService.service_id,
        serviceLineNumber: claimService.service_line_number,
        billedUnits: claimService.billed_units,
        billedAmount: claimService.billed_amount,
        service: {
          id: service.id,
          serviceCode: service.service_code,
          serviceType: service.service_type_name,
          serviceDate: service.service_date,
          units: service.units,
          amount: service.amount
        }
      };
    } catch (error) {
      this.handleDatabaseError(error, 'addServiceToClaim');
    }
  }

  /**
   * Removes a service from a claim
   * 
   * @param claimId The claim ID
   * @param serviceId The service ID
   * @param options Repository options
   * @returns True if the service was removed successfully
   */
  async removeServiceFromClaim(
    claimId: UUID, 
    serviceId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Removing service ${serviceId} from claim ${claimId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_services');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_services');
      }
      
      // Remove service from claim
      const deleted = await queryBuilder
        .where({
          claim_id: claimId,
          service_id: serviceId
        })
        .delete();
      
      if (deleted > 0) {
        // Update the service's billing status
        await knex('services')
          .where('id', serviceId)
          .update({
            billing_status: 'ready_for_billing',
            claim_id: null,
            updated_at: new Date()
          });
      }
      
      return deleted > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeServiceFromClaim');
    }
  }

  /**
   * Updates the services associated with a claim
   * 
   * @param claimId The claim ID
   * @param serviceIds Array of service IDs to associate with the claim
   * @param options Repository options
   * @returns True if the services were updated successfully
   */
  async updateClaimServices(
    claimId: UUID, 
    serviceIds: UUID[], 
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating services for claim ${claimId}`, { serviceIds });
      
      // Start transaction if not provided
      const knex = getKnexInstance();
      const trx = options.transaction || await knex.transaction();
      
      try {
        // Remove all existing services from the claim
        await trx('claim_services')
          .where('claim_id', claimId)
          .delete();
        
        // Reset billing status for services previously on this claim
        await trx('services')
          .where('claim_id', claimId)
          .update({
            billing_status: 'ready_for_billing',
            claim_id: null,
            updated_at: new Date()
          });
        
        // Add each service to the claim
        let totalAmount = 0;
        for (let i = 0; i < serviceIds.length; i++) {
          const serviceId = serviceIds[i];
          
          // Get service details
          const service = await trx('services')
            .where('id', serviceId)
            .first();
          
          if (!service) {
            throw new Error(`Service with ID ${serviceId} not found`);
          }
          
          // Add service to claim
          await trx('claim_services')
            .insert({
              claim_id: claimId,
              service_id: serviceId,
              service_line_number: i + 1,
              billed_units: service.units,
              billed_amount: service.amount,
              created_at: new Date(),
              updated_at: new Date()
            });
          
          // Update service billing status
          await trx('services')
            .where('id', serviceId)
            .update({
              billing_status: 'in_claim',
              claim_id: claimId,
              updated_at: new Date()
            });
          
          totalAmount += parseFloat(service.amount);
        }
        
        // Update claim total amount
        await trx('claims')
          .where('id', claimId)
          .update({
            total_amount: totalAmount,
            updated_at: new Date()
          });
        
        // Commit transaction if started here
        if (!options.transaction) {
          await trx.commit();
        }
        
        return true;
      } catch (error) {
        // Rollback transaction if started here
        if (!options.transaction) {
          await trx.rollback();
        }
        throw error;
      }
    } catch (error) {
      this.handleDatabaseError(error, 'updateClaimServices');
    }
  }

  /**
   * Gets the status history for a claim
   * 
   * @param claimId The claim ID
   * @param options Repository options
   * @returns Array of status history records
   */
  async getStatusHistory(claimId: UUID, options: RepositoryOptions = {}): Promise<ClaimStatusHistory[]> {
    try {
      logger.debug(`Getting status history for claim ID: ${claimId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_status_history');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_status_history');
      }
      
      const statusHistory = await queryBuilder
        .where('claim_id', claimId)
        .orderBy('timestamp', 'asc');
      
      // Transform to ClaimStatusHistory interface
      return statusHistory.map(history => ({
        id: history.id,
        claimId: history.claim_id,
        status: history.status,
        timestamp: history.timestamp,
        notes: history.notes,
        userId: history.user_id
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getStatusHistory');
    }
  }

  /**
   * Adds a status history record for a claim
   * 
   * @param claimId The claim ID
   * @param status The claim status
   * @param notes Optional notes about the status change
   * @param userId Optional ID of the user making the change
   * @param options Repository options
   * @returns The created status history record
   */
  async addStatusHistory(
    claimId: UUID, 
    status: ClaimStatus, 
    notes: string | null = null,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<ClaimStatusHistory> {
    try {
      logger.debug(`Adding status history for claim ID: ${claimId}`, { status, notes });
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_status_history');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_status_history');
      }
      
      const now = new Date();
      const [statusHistory] = await queryBuilder
        .insert({
          claim_id: claimId,
          status,
          timestamp: now,
          notes,
          user_id: userId,
          created_at: now,
          updated_at: now
        })
        .returning('*');
      
      return {
        id: statusHistory.id,
        claimId: statusHistory.claim_id,
        status: statusHistory.status,
        timestamp: statusHistory.timestamp,
        notes: statusHistory.notes,
        userId: statusHistory.user_id
      };
    } catch (error) {
      this.handleDatabaseError(error, 'addStatusHistory');
    }
  }

  /**
   * Updates the status of a claim and adds a status history record
   * 
   * @param claimId The claim ID
   * @param status The new claim status
   * @param notes Optional notes about the status change
   * @param userId Optional ID of the user making the change
   * @param options Repository options
   * @returns True if the status was updated successfully
   */
  async updateStatus(
    claimId: UUID, 
    status: ClaimStatus, 
    notes: string | null = null,
    userId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating status for claim ID: ${claimId} to ${status}`);
      
      // Start transaction if not provided
      const knex = getKnexInstance();
      const trx = options.transaction || await knex.transaction();
      
      try {
        // Update claim status
        await trx('claims')
          .where('id', claimId)
          .update({
            claim_status: status,
            updated_at: new Date(),
            updated_by: userId
          });
        
        // Add status history record
        await this.addStatusHistory(claimId, status, notes, userId, { transaction: trx });
        
        // Commit transaction if started here
        if (!options.transaction) {
          await trx.commit();
        }
        
        return true;
      } catch (error) {
        // Rollback transaction if started here
        if (!options.transaction) {
          await trx.rollback();
        }
        throw error;
      }
    } catch (error) {
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Gets aging information for claims based on their status and creation date
   * 
   * @param conditions Where conditions to filter claims
   * @param options Repository options
   * @returns Aging report with claims grouped by age ranges
   */
  async getClaimAging(
    conditions: WhereCondition = {},
    options: RepositoryOptions = {}
  ): Promise<{
    buckets: Array<{ range: string, count: number, amount: number }>,
    totalAmount: number,
    totalCount: number
  }> {
    try {
      logger.debug('Getting claim aging report', { conditions });
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply conditions
      const query = this.applyWhereConditions(queryBuilder, conditions);
      
      // Get claims
      const claims = await query.select(['id', 'claim_status', 'created_at', 'submission_date', 'total_amount']);
      
      // Calculate aging buckets
      const now = new Date();
      const buckets = [
        { range: '0-30', count: 0, amount: 0 },
        { range: '31-60', count: 0, amount: 0 },
        { range: '61-90', count: 0, amount: 0 },
        { range: '90+', count: 0, amount: 0 }
      ];
      
      let totalAmount = 0;
      
      claims.forEach(claim => {
        const dateToUse = claim.submission_date ? new Date(claim.submission_date) : new Date(claim.created_at);
        const ageInDays = Math.floor((now.getTime() - dateToUse.getTime()) / (1000 * 60 * 60 * 24));
        const amount = parseFloat(claim.total_amount);
        
        totalAmount += amount;
        
        if (ageInDays <= 30) {
          buckets[0].count++;
          buckets[0].amount += amount;
        } else if (ageInDays <= 60) {
          buckets[1].count++;
          buckets[1].amount += amount;
        } else if (ageInDays <= 90) {
          buckets[2].count++;
          buckets[2].amount += amount;
        } else {
          buckets[3].count++;
          buckets[3].amount += amount;
        }
      });
      
      return {
        buckets,
        totalAmount,
        totalCount: claims.length
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getClaimAging');
    }
  }

  /**
   * Gets metrics for claims based on specified conditions
   * 
   * @param conditions Where conditions to filter claims
   * @param options Repository options
   * @returns Claim metrics including totals and status breakdown
   */
  async getClaimMetrics(
    conditions: WhereCondition = {},
    options: RepositoryOptions = {}
  ): Promise<{
    totalClaims: number,
    totalAmount: number,
    statusBreakdown: Array<{ status: ClaimStatus, count: number, amount: number }>
  }> {
    try {
      logger.debug('Getting claim metrics', { conditions });
      
      const knex = getKnexInstance();
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply conditions
      const query = this.applyWhereConditions(queryBuilder, conditions);
      
      // Get totals
      const totals = await query
        .clone()
        .select([
          knex.raw('COUNT(*) as total_claims'),
          knex.raw('COALESCE(SUM(total_amount), 0) as total_amount')
        ])
        .first();
      
      // Get status breakdown
      const statusBreakdown = await query
        .clone()
        .select([
          'claim_status as status',
          knex.raw('COUNT(*) as count'),
          knex.raw('COALESCE(SUM(total_amount), 0) as amount')
        ])
        .groupBy('claim_status');
      
      return {
        totalClaims: parseInt(totals.total_claims, 10),
        totalAmount: parseFloat(totals.total_amount),
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: parseInt(item.count, 10),
          amount: parseFloat(item.amount)
        }))
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getClaimMetrics');
    }
  }

  /**
   * Generates a unique claim number for a new claim
   * 
   * @param options Repository options
   * @returns A unique claim number
   */
  async generateClaimNumber(options: RepositoryOptions = {}): Promise<string> {
    try {
      logger.debug('Generating claim number');
      
      const knex = getKnexInstance();
      
      // Get current date
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Get the next sequence number
      const sequenceResult = await knex.raw('SELECT nextval(\'claim_number_seq\') as seq');
      const sequence = sequenceResult.rows[0].seq;
      
      // Format sequence with leading zeros (5 digits)
      const paddedSequence = sequence.toString().padStart(5, '0');
      
      // Combine to form claim number: CLM-YYYYMMDD-#####
      const claimNumber = `CLM-${dateStr}-${paddedSequence}`;
      
      return claimNumber;
    } catch (error) {
      this.handleDatabaseError(error, 'generateClaimNumber');
    }
  }

  /**
   * Creates a new claim with a generated claim number
   * 
   * @param claimData Data for the new claim
   * @param options Repository options
   * @returns The created claim
   */
  async createClaim(
    claimData: Partial<Claim>,
    options: RepositoryOptions = {}
  ): Promise<Claim> {
    try {
      logger.debug('Creating new claim', { claimData });
      
      // Start transaction if not provided
      const knex = getKnexInstance();
      const trx = options.transaction || await knex.transaction();
      
      try {
        // Generate claim number
        const claimNumber = await this.generateClaimNumber({ transaction: trx });
        
        // Set default status if not provided
        const status = claimData.claimStatus || ClaimStatus.DRAFT;
        
        // Create the claim
        const claim = await super.create({
          ...claimData,
          claimNumber,
          claimStatus: status
        }, { transaction: trx });
        
        // Add initial status history record
        await this.addStatusHistory(
          claim.id,
          status,
          'Claim created',
          claimData.createdBy || null,
          { transaction: trx }
        );
        
        // Commit transaction if started here
        if (!options.transaction) {
          await trx.commit();
        }
        
        return claim;
      } catch (error) {
        // Rollback transaction if started here
        if (!options.transaction) {
          await trx.rollback();
        }
        throw error;
      }
    } catch (error) {
      this.handleDatabaseError(error, 'createClaim');
    }
  }
}

// Create and export singleton instance
const claimRepository = new ClaimRepository();

export { claimRepository };