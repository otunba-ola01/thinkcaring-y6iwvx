import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import { 
  Facility, 
  FacilityEntity, 
  FacilityType,
  FacilityQueryParams,
  FacilityServiceMetrics,
  FacilityRevenueByProgram,
  mapDbToFacility,
  mapFacilityToDb
} from '../../models/facility.model';
import { UUID } from '../../types/common.types';
import { 
  WhereCondition, 
  Pagination, 
  OrderBy, 
  PaginatedResult, 
  RepositoryOptions,
  Transaction
} from '../../types/database.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for facility data access operations
 */
class FacilityRepository extends BaseRepository<FacilityEntity> {
  /**
   * Creates a new FacilityRepository instance
   */
  constructor() {
    super('facilities');
  }

  /**
   * Finds a facility by its name
   * 
   * @param name - Name of the facility to find
   * @param options - Repository options
   * @returns The facility if found, null otherwise
   */
  async findByName(name: string, options: RepositoryOptions = {}): Promise<Facility | null> {
    try {
      logger.debug(`Finding facility by name: ${name}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
      
      return result ? this.mapToFacility(result) : null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByName');
    }
  }

  /**
   * Finds a facility by its license number
   * 
   * @param licenseNumber - License number of the facility to find
   * @param options - Repository options
   * @returns The facility if found, null otherwise
   */
  async findByLicenseNumber(licenseNumber: string, options: RepositoryOptions = {}): Promise<Facility | null> {
    try {
      logger.debug(`Finding facility by license number: ${licenseNumber}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder
        .where('license_number', licenseNumber)
        .first();
      
      return result ? this.mapToFacility(result) : null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByLicenseNumber');
    }
  }

  /**
   * Finds facilities by type
   * 
   * @param type - Facility type to search for
   * @param pagination - Pagination options
   * @param orderBy - Sorting options
   * @param options - Repository options
   * @returns Paginated facilities of the specified type
   */
  async findByType(
    type: FacilityType,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Facility>> {
    try {
      logger.debug(`Finding facilities by type: ${type}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply where condition for type
      const query = queryBuilder.where('type', type);
      
      // Create count query
      const countQuery = this.getQueryBuilder(options.transaction)
        .where('type', type);
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [data, totalResult] = await Promise.all([
        sortedQuery,
        countQuery.count({ count: '*' }).first()
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: data.map(record => this.mapToFacility(record)),
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByType');
    }
  }

  /**
   * Finds facilities with complex filtering options
   * 
   * @param queryParams - Query parameters for filtering
   * @param pagination - Pagination options
   * @param orderBy - Sorting options
   * @param options - Repository options
   * @returns Paginated facilities matching the filters
   */
  async findWithFilters(
    queryParams: FacilityQueryParams,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Facility>> {
    try {
      logger.debug('Finding facilities with filters', { queryParams });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply search filter if provided
      if (queryParams.search) {
        queryBuilder.where(builder => {
          builder
            .whereRaw('LOWER(name) LIKE ?', [`%${queryParams.search.toLowerCase()}%`])
            .orWhereRaw('LOWER(license_number) LIKE ?', [`%${queryParams.search.toLowerCase()}%`])
            .orWhereRaw('LOWER(notes) LIKE ?', [`%${queryParams.search.toLowerCase()}%`]);
        });
      }
      
      // Apply type filter if provided
      if (queryParams.type) {
        queryBuilder.where('type', queryParams.type);
      }
      
      // Apply status filter if provided
      if (queryParams.status) {
        queryBuilder.where('status', queryParams.status);
      }
      
      // Create count query with the same filters
      const countQuery = queryBuilder.clone();
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(queryBuilder, pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [data, totalResult] = await Promise.all([
        sortedQuery,
        countQuery.count({ count: '*' }).first()
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: data.map(record => this.mapToFacility(record)),
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithFilters');
    }
  }

  /**
   * Creates a new facility
   * 
   * @param facilityData - Facility data to create
   * @param options - Repository options
   * @returns The created facility
   */
  async create(
    facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'deletedBy'>,
    options: RepositoryOptions = {}
  ): Promise<Facility> {
    try {
      logger.debug('Creating new facility', { facilityData });
      const dbEntity = this.mapToDbEntity(facilityData);
      const result = await super.create(dbEntity, options);
      return this.mapToFacility(result);
    } catch (error) {
      this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Updates an existing facility
   * 
   * @param id - ID of the facility to update
   * @param facilityData - Facility data to update
   * @param options - Repository options
   * @returns The updated facility
   */
  async update(
    id: UUID,
    facilityData: Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'deletedBy'>>,
    options: RepositoryOptions = {}
  ): Promise<Facility> {
    try {
      logger.debug(`Updating facility with ID: ${id}`, { facilityData });
      const dbEntity = this.mapToDbEntity(facilityData);
      const result = await super.update(id, dbEntity, options);
      return this.mapToFacility(result);
    } catch (error) {
      this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Gets service delivery metrics by facility
   * 
   * @param dateRange - Date range for the metrics
   * @param options - Repository options
   * @returns Array of facility service metrics
   */
  async getServiceMetrics(
    dateRange: { startDate: string, endDate: string },
    options: RepositoryOptions = {}
  ): Promise<FacilityServiceMetrics[]> {
    try {
      logger.debug('Getting service metrics by facility', { dateRange });
      const knex = getKnexInstance();
      
      // Build a query to join facilities, services, and claims tables
      const query = knex('facilities as f')
        .select(
          'f.id as facility_id',
          'f.name as facility_name',
          knex.raw('COUNT(s.id) as service_count'),
          knex.raw('SUM(s.amount) as total_amount')
        )
        .leftJoin('services as s', 's.facility_id', 'f.id')
        .leftJoin('service_claim as sc', 'sc.service_id', 's.id')
        .leftJoin('claims as c', 'c.id', 'sc.claim_id')
        .whereNull('f.deleted_at')
        .whereBetween('s.service_date', [dateRange.startDate, dateRange.endDate])
        .groupBy('f.id', 'f.name')
        .orderBy('f.name');
      
      // Use transaction if provided
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const results = await query;
      
      // Map the results to FacilityServiceMetrics objects
      return results.map(result => ({
        facilityId: result.facility_id,
        facilityName: result.facility_name,
        serviceCount: parseInt(result.service_count, 10) || 0,
        totalAmount: parseFloat(result.total_amount) || 0
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceMetrics');
    }
  }

  /**
   * Gets revenue breakdown by program for each facility
   * 
   * @param dateRange - Date range for the metrics
   * @param options - Repository options
   * @returns Array of facility revenue by program
   */
  async getRevenueByProgram(
    dateRange: { startDate: string, endDate: string },
    options: RepositoryOptions = {}
  ): Promise<FacilityRevenueByProgram[]> {
    try {
      logger.debug('Getting revenue by program for facilities', { dateRange });
      const knex = getKnexInstance();
      
      // Build a query to join facilities, services, claims, and programs tables
      const query = knex('facilities as f')
        .select(
          'f.id as facility_id',
          'f.name as facility_name',
          'p.id as program_id',
          'p.name as program_name',
          knex.raw('SUM(s.amount) as total_amount')
        )
        .leftJoin('services as s', 's.facility_id', 'f.id')
        .leftJoin('clients as cl', 'cl.id', 's.client_id')
        .leftJoin('programs as p', 'p.id', 'cl.program_id')
        .leftJoin('service_claim as sc', 'sc.service_id', 's.id')
        .leftJoin('claims as c', 'c.id', 'sc.claim_id')
        .whereNull('f.deleted_at')
        .whereNull('p.deleted_at')
        .whereBetween('s.service_date', [dateRange.startDate, dateRange.endDate])
        .groupBy('f.id', 'f.name', 'p.id', 'p.name')
        .orderBy(['f.name', 'p.name']);
      
      // Use transaction if provided
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const results = await query;
      
      // Map the results to FacilityRevenueByProgram objects
      return results.map(result => ({
        facilityId: result.facility_id,
        facilityName: result.facility_name,
        programId: result.program_id,
        programName: result.program_name,
        totalAmount: parseFloat(result.total_amount) || 0
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getRevenueByProgram');
    }
  }

  /**
   * Finds all active facilities
   * 
   * @param options - Repository options
   * @returns Array of active facilities
   */
  async findActiveFacilities(options: RepositoryOptions = {}): Promise<Facility[]> {
    try {
      logger.debug('Finding all active facilities');
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const results = await queryBuilder.where('status', 'ACTIVE');
      
      return results.map(result => this.mapToFacility(result));
    } catch (error) {
      this.handleDatabaseError(error, 'findActiveFacilities');
    }
  }

  /**
   * Finds facilities with licenses expiring within a specified period
   * 
   * @param daysThreshold - Number of days threshold for license expiration
   * @param options - Repository options
   * @returns Array of facilities with expiring licenses
   */
  async findFacilitiesWithExpiringLicenses(
    daysThreshold: number,
    options: RepositoryOptions = {}
  ): Promise<Facility[]> {
    try {
      logger.debug(`Finding facilities with licenses expiring within ${daysThreshold} days`);
      const knex = getKnexInstance();
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Calculate the date threshold
      const thresholdDate = knex.raw(`CURRENT_DATE + INTERVAL '${daysThreshold} days'`);
      
      const results = await queryBuilder
        .where('license_expiration_date', '>=', knex.raw('CURRENT_DATE'))
        .where('license_expiration_date', '<=', thresholdDate)
        .where('status', 'ACTIVE');
      
      return results.map(result => this.mapToFacility(result));
    } catch (error) {
      this.handleDatabaseError(error, 'findFacilitiesWithExpiringLicenses');
    }
  }

  /**
   * Maps a database record to a Facility object
   * 
   * @param dbRecord - Database record
   * @returns Mapped Facility object
   */
  private mapToFacility(dbRecord: Record<string, any>): Facility {
    return mapDbToFacility(dbRecord);
  }

  /**
   * Maps a Facility object to a database entity
   * 
   * @param facility - Facility object
   * @returns Database entity
   */
  private mapToDbEntity(facility: Partial<Facility>): Partial<FacilityEntity> {
    return mapFacilityToDb(facility);
  }
}

// Create a singleton instance of the facility repository
const facilityRepository = new FacilityRepository();

// Export the repository instance
export { facilityRepository };