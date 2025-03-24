import { Knex } from 'knex'; // knex v2.4.2

import { BaseRepository } from './base.repository';
import { 
  UUID, 
  ISO8601Date, 
  Units, 
  DateRange,
  AuthorizationStatus
} from '../../types/common.types';
import { 
  Authorization, 
  AuthorizationWithRelations, 
  AuthorizationUtilization,
  AuthorizationValidationResult
} from '../../types/services.types';
import { 
  Transaction, 
  RepositoryOptions, 
  WhereCondition,
  PaginatedResult 
} from '../../types/database.types';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../errors/not-found-error';
import { BusinessError } from '../../errors/business-error';

/**
 * Repository class for authorization data access operations
 */
export class AuthorizationRepository extends BaseRepository<Authorization> {
  private authServiceTypesTableName: string;
  private utilizationTableName: string;

  /**
   * Creates a new AuthorizationRepository instance
   */
  constructor() {
    super('authorizations');
    this.authServiceTypesTableName = 'authorization_service_types';
    this.utilizationTableName = 'authorization_utilization';
  }

  /**
   * Finds an authorization by its authorization number
   * 
   * @param authNumber Authorization number to search for
   * @param options Repository options
   * @returns The authorization if found, null otherwise
   */
  async findByAuthNumber(authNumber: string, options: RepositoryOptions = {}): Promise<Authorization | null> {
    try {
      logger.debug(`Finding authorization by number: ${authNumber}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where('auth_number', authNumber).first();
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByAuthNumber');
    }
  }

  /**
   * Finds authorizations for a specific client with pagination
   * 
   * @param clientId Client ID to find authorizations for
   * @param params Query parameters for filtering, pagination, and sorting
   * @param options Repository options
   * @returns Paginated list of authorizations for the client
   */
  async findByClientId(
    clientId: UUID, 
    params: {
      status?: AuthorizationStatus | AuthorizationStatus[];
      dateRange?: DateRange;
      serviceTypeId?: UUID;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}, 
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Authorization>> {
    try {
      logger.debug(`Finding authorizations for client ID: ${clientId}`, { params });
      
      // Set up default pagination values
      const page = params.page || 1;
      const limit = params.limit || 25;
      const offset = (page - 1) * limit;
      
      // Start building query
      const queryBuilder = this.getQueryBuilder(options.transaction)
        .where('client_id', clientId);
      
      // Apply filters if provided
      if (params.status) {
        if (Array.isArray(params.status)) {
          queryBuilder.whereIn('status', params.status);
        } else {
          queryBuilder.where('status', params.status);
        }
      }
      
      if (params.dateRange) {
        // Find authorizations that overlap with the date range
        queryBuilder.where(function() {
          this.where(function() {
            this.where('start_date', '<=', params.dateRange.endDate)
              .where('end_date', '>=', params.dateRange.startDate);
          });
        });
      }
      
      if (params.serviceTypeId) {
        // Join with service types table to filter by service type
        queryBuilder.whereExists(function() {
          this.select('*')
            .from('authorization_service_types')
            .whereRaw('authorization_service_types.authorization_id = authorizations.id')
            .where('service_type_id', params.serviceTypeId);
        });
      }
      
      // Clone the query for counting total records
      const countQuery = queryBuilder.clone().count('id as count').first();
      
      // Apply sorting
      if (params.sortBy) {
        const direction = params.sortDirection || 'asc';
        queryBuilder.orderBy(params.sortBy, direction);
      } else {
        // Default sorting by end date (closest expiration first)
        queryBuilder.orderBy('end_date', 'asc');
      }
      
      // Apply pagination
      queryBuilder.limit(limit).offset(offset);
      
      // Execute both queries in parallel
      const [authorizations, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      // Get total count from result
      const total = parseInt(countResult.count.toString(), 10);
      
      // For each authorization, get the associated service types and utilization
      const authorizationsWithRelations = await Promise.all(
        authorizations.map(async (auth) => {
          // Get service types
          const serviceTypes = await this.getServiceTypesByAuthorizationId(auth.id, options);
          
          // Get utilization
          const utilization = await this.getUtilization(auth.id, options);
          
          // Return authorization with service types
          return {
            ...auth,
            serviceTypeIds: serviceTypes,
            utilization: utilization
          };
        })
      );
      
      // Return paginated result
      return {
        data: authorizationsWithRelations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByClientId');
    }
  }

  /**
   * Finds active authorizations for a specific client
   * 
   * @param clientId Client ID to find authorizations for
   * @param options Repository options
   * @returns List of active authorizations for the client
   */
  async findActiveByClientId(clientId: UUID, options: RepositoryOptions = {}): Promise<Authorization[]> {
    try {
      logger.debug(`Finding active authorizations for client ID: ${clientId}`);
      
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Query for active authorizations that are valid for the current date
      const queryBuilder = this.getQueryBuilder(options.transaction)
        .where('client_id', clientId)
        .where('status', AuthorizationStatus.ACTIVE)
        .where('start_date', '<=', currentDate)
        .where('end_date', '>=', currentDate);
      
      const authorizations = await queryBuilder;
      
      // For each authorization, get the associated service types and utilization
      const authorizationsWithRelations = await Promise.all(
        authorizations.map(async (auth) => {
          // Get service types
          const serviceTypes = await this.getServiceTypesByAuthorizationId(auth.id, options);
          
          // Get utilization
          const utilization = await this.getUtilization(auth.id, options);
          
          // Return authorization with service types
          return {
            ...auth,
            serviceTypeIds: serviceTypes,
            utilization: utilization
          };
        })
      );
      
      return authorizationsWithRelations;
    } catch (error) {
      this.handleDatabaseError(error, 'findActiveByClientId');
    }
  }

  /**
   * Finds an authorization by ID and includes its service types
   * 
   * @param id Authorization ID to find
   * @param options Repository options
   * @returns The authorization with service types if found, null otherwise
   */
  async findWithServiceTypes(id: UUID, options: RepositoryOptions = {}): Promise<AuthorizationWithRelations | null> {
    try {
      logger.debug(`Finding authorization with service types for ID: ${id}`);
      
      // Find the authorization
      const authorization = await this.findById(id, options);
      if (!authorization) {
        return null;
      }
      
      // Get service types for the authorization
      const serviceTypeIds = await this.getServiceTypesByAuthorizationId(id, options);
      
      // Get utilization for the authorization
      const utilization = await this.getUtilization(id, options);
      
      // Return authorization with service types and utilization
      return {
        ...authorization,
        serviceTypeIds,
        utilization
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithServiceTypes');
    }
  }

  /**
   * Finds authorizations that are expiring within a specified number of days
   * 
   * @param daysThreshold Number of days threshold for expiration
   * @param options Repository options
   * @returns List of expiring authorizations
   */
  async findExpiringAuthorizations(daysThreshold: number, options: RepositoryOptions = {}): Promise<Authorization[]> {
    try {
      logger.debug(`Finding authorizations expiring within ${daysThreshold} days`);
      
      // Calculate the date threshold
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysThreshold);
      
      const currentDate = today.toISOString().split('T')[0];
      const thresholdDate = futureDate.toISOString().split('T')[0];
      
      // Query for active authorizations that are expiring within the threshold
      const queryBuilder = this.getQueryBuilder(options.transaction)
        .where('status', AuthorizationStatus.ACTIVE)
        .where('end_date', '>=', currentDate)
        .where('end_date', '<=', thresholdDate);
      
      const authorizations = await queryBuilder;
      
      // For each authorization, get the associated service types and utilization
      const authorizationsWithRelations = await Promise.all(
        authorizations.map(async (auth) => {
          // Get service types
          const serviceTypes = await this.getServiceTypesByAuthorizationId(auth.id, options);
          
          // Get utilization
          const utilization = await this.getUtilization(auth.id, options);
          
          // Return authorization with service types
          return {
            ...auth,
            serviceTypeIds: serviceTypes,
            utilization: utilization
          };
        })
      );
      
      return authorizationsWithRelations;
    } catch (error) {
      this.handleDatabaseError(error, 'findExpiringAuthorizations');
    }
  }

  /**
   * Creates a new authorization with service types and utilization
   * 
   * @param data Authorization data to create
   * @param serviceTypeIds Service type IDs to associate with the authorization
   * @param options Repository options
   * @returns The created authorization
   */
  async create(
    data: Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    serviceTypeIds: UUID[],
    options: RepositoryOptions = {}
  ): Promise<Authorization> {
    const trx = options.transaction || await this.getTransaction();
    const ownTransaction = !options.transaction;
    
    try {
      logger.debug('Creating new authorization', { clientId: data.clientId, authNumber: data.authNumber });
      
      // Start transaction if not provided
      if (ownTransaction) {
        await trx.begin();
      }
      
      // Prepare authorization data with timestamps
      const now = new Date();
      const authData = {
        ...data,
        created_at: now,
        updated_at: now
      };
      
      // Add created_by if provided
      if (options.createdBy) {
        authData['created_by'] = options.createdBy;
      }
      
      // Insert authorization
      const [authorization] = await trx('authorizations').insert(authData).returning('*');
      const authorizationId = authorization.id;
      
      // Insert service type associations
      if (serviceTypeIds.length > 0) {
        const serviceTypeEntries = serviceTypeIds.map(serviceTypeId => ({
          authorization_id: authorizationId,
          service_type_id: serviceTypeId,
          created_at: now,
          updated_at: now
        }));
        
        await trx(this.authServiceTypesTableName).insert(serviceTypeEntries);
      }
      
      // Create initial utilization record with zero used units
      await trx(this.utilizationTableName).insert({
        authorization_id: authorizationId,
        used_units: 0,
        created_at: now,
        updated_at: now
      });
      
      // Commit transaction if we started it
      if (ownTransaction) {
        await trx.commit();
      }
      
      // Get the complete authorization with relations
      const result = await this.findWithServiceTypes(authorizationId, {
        transaction: ownTransaction ? undefined : trx
      });
      
      return result;
    } catch (error) {
      // Rollback transaction if we started it
      if (ownTransaction) {
        await trx.rollback();
      }
      
      this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Updates an existing authorization with service types
   * 
   * @param id Authorization ID to update
   * @param data Authorization data to update
   * @param serviceTypeIds Service type IDs to associate with the authorization, or null if not updating
   * @param options Repository options
   * @returns The updated authorization
   */
  async update(
    id: UUID,
    data: Partial<Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    serviceTypeIds: UUID[] | null = null,
    options: RepositoryOptions = {}
  ): Promise<Authorization> {
    const trx = options.transaction || await this.getTransaction();
    const ownTransaction = !options.transaction;
    
    try {
      logger.debug(`Updating authorization with ID: ${id}`);
      
      // Check if authorization exists
      const existingAuth = await this.findById(id, { transaction: trx });
      if (!existingAuth) {
        throw new NotFoundError(`Authorization not found`, 'authorization', id);
      }
      
      // Start transaction if not provided
      if (ownTransaction) {
        await trx.begin();
      }
      
      // Prepare update data with timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (options.updatedBy) {
        updateData['updated_by'] = options.updatedBy;
      }
      
      // Update authorization
      await trx('authorizations').where('id', id).update(updateData);
      
      // Update service types if provided
      if (serviceTypeIds !== null) {
        await this.updateServiceTypes(id, serviceTypeIds, trx);
      }
      
      // Commit transaction if we started it
      if (ownTransaction) {
        await trx.commit();
      }
      
      // Get the updated authorization with relations
      const result = await this.findWithServiceTypes(id, {
        transaction: ownTransaction ? undefined : trx
      });
      
      return result;
    } catch (error) {
      // Rollback transaction if we started it
      if (ownTransaction) {
        await trx.rollback();
      }
      
      this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Updates the status of an authorization
   * 
   * @param id Authorization ID to update
   * @param status New authorization status
   * @param options Repository options
   * @returns The updated authorization
   */
  async updateStatus(
    id: UUID,
    status: AuthorizationStatus,
    options: RepositoryOptions = {}
  ): Promise<Authorization> {
    try {
      logger.debug(`Updating status for authorization ID: ${id} to ${status}`);
      
      // Check if authorization exists
      const existingAuth = await this.findById(id, options);
      if (!existingAuth) {
        throw new NotFoundError(`Authorization not found`, 'authorization', id);
      }
      
      // Update status
      const updateData = {
        status,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (options.updatedBy) {
        updateData['updated_by'] = options.updatedBy;
      }
      
      await this.getQueryBuilder(options.transaction)
        .where('id', id)
        .update(updateData);
      
      // Get the updated authorization with relations
      const result = await this.findWithServiceTypes(id, options);
      
      return result;
    } catch (error) {
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Tracks utilization of an authorization by adding or removing units
   * 
   * @param id Authorization ID to track utilization for
   * @param units Units to add or remove
   * @param isAddition Whether to add (true) or remove (false) units
   * @param options Repository options
   * @returns Updated utilization information
   */
  async trackUtilization(
    id: UUID,
    units: Units,
    isAddition: boolean = true,
    options: RepositoryOptions = {}
  ): Promise<AuthorizationUtilization> {
    const trx = options.transaction || await this.getTransaction();
    const ownTransaction = !options.transaction;
    
    try {
      logger.debug(`Tracking utilization for authorization ID: ${id}`, { 
        units, 
        isAddition 
      });
      
      // Check if authorization exists
      const authorization = await this.findById(id, { transaction: trx });
      if (!authorization) {
        throw new NotFoundError(`Authorization not found`, 'authorization', id);
      }
      
      // Start transaction if not provided
      if (ownTransaction) {
        await trx.begin();
      }
      
      // Get current utilization
      const currentUtilization = await trx(this.utilizationTableName)
        .where('authorization_id', id)
        .first();
      
      if (!currentUtilization) {
        // Create initial utilization record if it doesn't exist
        await trx(this.utilizationTableName).insert({
          authorization_id: id,
          used_units: isAddition ? units : 0,
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        // Calculate new utilization
        let newUsedUnits: number;
        
        if (isAddition) {
          newUsedUnits = currentUtilization.used_units + units;
          
          // Validate against authorized units
          if (newUsedUnits > authorization.authorizedUnits) {
            throw new BusinessError(
              `Adding ${units} units would exceed the authorized limit of ${authorization.authorizedUnits} units`,
              { currentUsed: currentUtilization.used_units, adding: units, authorized: authorization.authorizedUnits },
              'authorization.units.exceeded'
            );
          }
        } else {
          // Remove units (cannot go below 0)
          newUsedUnits = Math.max(0, currentUtilization.used_units - units);
        }
        
        // Update utilization
        await trx(this.utilizationTableName)
          .where('authorization_id', id)
          .update({
            used_units: newUsedUnits,
            updated_at: new Date()
          });
        
        // Check if we need to update authorization status based on utilization
        const utilizationPercentage = (newUsedUnits / authorization.authorizedUnits) * 100;
        
        // If utilization is over 80% and status is ACTIVE, update to EXPIRING
        if (utilizationPercentage >= 80 && authorization.status === AuthorizationStatus.ACTIVE) {
          await trx('authorizations')
            .where('id', id)
            .update({
              status: AuthorizationStatus.EXPIRING,
              updated_at: new Date()
            });
        }
      }
      
      // Commit transaction if we started it
      if (ownTransaction) {
        await trx.commit();
      }
      
      // Get updated utilization
      return await this.getUtilization(id, {
        transaction: ownTransaction ? undefined : trx
      });
    } catch (error) {
      // Rollback transaction if we started it
      if (ownTransaction) {
        await trx.rollback();
      }
      
      // Check if it's already a known error type
      if (error instanceof NotFoundError || error instanceof BusinessError) {
        throw error;
      }
      
      this.handleDatabaseError(error, 'trackUtilization');
    }
  }

  /**
   * Gets the current utilization for an authorization
   * 
   * @param id Authorization ID to get utilization for
   * @param options Repository options
   * @returns Current utilization information
   */
  async getUtilization(
    id: UUID,
    options: RepositoryOptions = {}
  ): Promise<AuthorizationUtilization> {
    try {
      logger.debug(`Getting utilization for authorization ID: ${id}`);
      
      // Check if authorization exists
      const authorization = await this.findById(id, options);
      if (!authorization) {
        throw new NotFoundError(`Authorization not found`, 'authorization', id);
      }
      
      // Get utilization
      const utilization = await this.getQueryBuilder(options.transaction)
        .table(this.utilizationTableName)
        .where('authorization_id', id)
        .first();
      
      if (!utilization) {
        // Create default utilization record if it doesn't exist
        const now = new Date();
        await this.getQueryBuilder(options.transaction)
          .table(this.utilizationTableName)
          .insert({
            authorization_id: id,
            used_units: 0,
            created_at: now,
            updated_at: now
          });
        
        // Return default utilization
        return {
          authorizationId: id,
          usedUnits: 0,
          authorizedUnits: authorization.authorizedUnits,
          remainingUnits: authorization.authorizedUnits,
          utilizationPercentage: 0
        };
      }
      
      // Calculate remaining units and utilization percentage
      const usedUnits = utilization.used_units;
      const authorizedUnits = authorization.authorizedUnits;
      const remainingUnits = authorizedUnits - usedUnits;
      const utilizationPercentage = (usedUnits / authorizedUnits) * 100;
      
      return {
        authorizationId: id,
        usedUnits,
        authorizedUnits,
        remainingUnits,
        utilizationPercentage
      };
    } catch (error) {
      // Check if it's already a known error type
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      this.handleDatabaseError(error, 'getUtilization');
    }
  }

  /**
   * Validates if a service meets the requirements of an authorization
   * 
   * @param service Service data to validate
   * @param authorizationId Authorization ID to validate against
   * @param options Repository options
   * @returns Validation result with any errors or warnings
   */
  async validateServiceAgainstAuthorization(
    service: {
      clientId: UUID;
      serviceTypeId: UUID;
      serviceDate: ISO8601Date;
      units: Units;
    },
    authorizationId: UUID,
    options: RepositoryOptions = {}
  ): Promise<AuthorizationValidationResult> {
    try {
      logger.debug(`Validating service against authorization ID: ${authorizationId}`, { service });
      
      // Find the authorization with service types
      const authorization = await this.findWithServiceTypes(authorizationId, options);
      if (!authorization) {
        return {
          isAuthorized: false,
          errors: [
            {
              code: 'authorization.not_found',
              message: `Authorization with ID ${authorizationId} not found`
            }
          ],
          warnings: []
        };
      }
      
      const errors = [];
      const warnings = [];
      
      // Check if service date is within authorization date range
      if (service.serviceDate < authorization.startDate || service.serviceDate > authorization.endDate) {
        errors.push({
          code: 'authorization.date_range',
          message: `Service date ${service.serviceDate} is outside authorization date range (${authorization.startDate} - ${authorization.endDate})`
        });
      }
      
      // Check if service type is included in authorization
      if (!authorization.serviceTypeIds.includes(service.serviceTypeId)) {
        errors.push({
          code: 'authorization.service_type',
          message: `Service type ${service.serviceTypeId} is not included in authorization`
        });
      }
      
      // Check if client matches
      if (service.clientId !== authorization.clientId) {
        errors.push({
          code: 'authorization.client',
          message: `Service client ID ${service.clientId} does not match authorization client ID ${authorization.clientId}`
        });
      }
      
      // Check if adding service units would exceed authorization
      const utilization = await this.getUtilization(authorizationId, options);
      const totalUnitsAfterService = utilization.usedUnits + service.units;
      
      if (totalUnitsAfterService > authorization.authorizedUnits) {
        errors.push({
          code: 'authorization.units.exceeded',
          message: `Adding ${service.units} units would exceed the authorized limit (used: ${utilization.usedUnits}, authorized: ${authorization.authorizedUnits})`
        });
      } else if (totalUnitsAfterService > authorization.authorizedUnits * 0.9) {
        // Warning if over 90% utilized
        warnings.push({
          code: 'authorization.units.near_limit',
          message: `Adding ${service.units} units will bring utilization to ${Math.round((totalUnitsAfterService / authorization.authorizedUnits) * 100)}% of authorized limit`
        });
      }
      
      // Check authorization status
      if (authorization.status === AuthorizationStatus.EXPIRED) {
        errors.push({
          code: 'authorization.expired',
          message: `Authorization is expired`
        });
      } else if (authorization.status === AuthorizationStatus.EXPIRING) {
        warnings.push({
          code: 'authorization.expiring',
          message: `Authorization is expiring soon`
        });
      }
      
      return {
        isAuthorized: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error(`Error validating service against authorization: ${authorizationId}`, { error });
      
      return {
        isAuthorized: false,
        errors: [
          {
            code: 'authorization.validation_error',
            message: `Error validating service: ${error.message}`
          }
        ],
        warnings: []
      };
    }
  }

  /**
   * Checks for overlapping authorizations for the same client and service types
   * 
   * @param clientId Client ID to check authorizations for
   * @param serviceTypeIds Service type IDs to check
   * @param dateRange Date range to check for overlap
   * @param excludeAuthId Authorization ID to exclude from the check (for updates)
   * @param options Repository options
   * @returns True if overlapping authorizations exist
   */
  async checkOverlappingAuthorizations(
    clientId: UUID,
    serviceTypeIds: UUID[],
    dateRange: DateRange,
    excludeAuthId: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Checking for overlapping authorizations for client ID: ${clientId}`, { 
        serviceTypeIds, 
        dateRange,
        excludeAuthId
      });
      
      // Start query for authorizations that overlap with the date range
      let query = this.getQueryBuilder(options.transaction)
        .where('client_id', clientId)
        .whereIn('status', [AuthorizationStatus.ACTIVE, AuthorizationStatus.APPROVED, AuthorizationStatus.EXPIRING]);
      
      // Exclude the current authorization if provided
      if (excludeAuthId) {
        query = query.whereNot('id', excludeAuthId);
      }
      
      // Add date range overlap conditions
      query = query.where(function() {
        this.where(function() {
          // Date ranges overlap if:
          // (start1 <= end2) AND (end1 >= start2)
          this.where('start_date', '<=', dateRange.endDate)
            .where('end_date', '>=', dateRange.startDate);
        });
      });
      
      // Join with service types to check for matching service types
      const authIds = await query.pluck('id');
      
      if (authIds.length === 0) {
        return false; // No potential overlapping authorizations
      }
      
      // Check if any of these authorizations have matching service types
      const matchingServiceTypes = await this.getQueryBuilder(options.transaction)
        .table(this.authServiceTypesTableName)
        .whereIn('authorization_id', authIds)
        .whereIn('service_type_id', serviceTypeIds)
        .first();
      
      return !!matchingServiceTypes;
    } catch (error) {
      this.handleDatabaseError(error, 'checkOverlappingAuthorizations');
    }
  }

  /**
   * Gets the service types associated with an authorization
   * 
   * @param authorizationId Authorization ID to get service types for
   * @param options Repository options
   * @returns Array of service type IDs
   */
  async getServiceTypesByAuthorizationId(
    authorizationId: UUID,
    options: RepositoryOptions = {}
  ): Promise<UUID[]> {
    try {
      logger.debug(`Getting service types for authorization ID: ${authorizationId}`);
      
      const result = await this.getQueryBuilder(options.transaction)
        .table(this.authServiceTypesTableName)
        .where('authorization_id', authorizationId)
        .select('service_type_id');
      
      return result.map(row => row.service_type_id);
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceTypesByAuthorizationId');
    }
  }

  /**
   * Updates the service types associated with an authorization
   * 
   * @param authorizationId Authorization ID to update service types for
   * @param serviceTypeIds Service type IDs to associate with the authorization
   * @param trx Transaction to use for the operation
   * @returns No return value
   */
  async updateServiceTypes(
    authorizationId: UUID,
    serviceTypeIds: UUID[],
    trx: Transaction
  ): Promise<void> {
    try {
      logger.debug(`Updating service types for authorization ID: ${authorizationId}`, { serviceTypeIds });
      
      // Delete existing service type associations
      await trx(this.authServiceTypesTableName)
        .where('authorization_id', authorizationId)
        .delete();
      
      // Insert new service type associations
      if (serviceTypeIds.length > 0) {
        const now = new Date();
        const serviceTypeEntries = serviceTypeIds.map(serviceTypeId => ({
          authorization_id: authorizationId,
          service_type_id: serviceTypeId,
          created_at: now,
          updated_at: now
        }));
        
        await trx(this.authServiceTypesTableName).insert(serviceTypeEntries);
      }
    } catch (error) {
      this.handleDatabaseError(error, 'updateServiceTypes');
    }
  }
}