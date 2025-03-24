import { BaseRepository } from './base.repository';
import { 
  Program, 
  ProgramSummary, 
  ServiceCode, 
  RateSchedule, 
  ProgramMetrics, 
  ProgramType, 
  ProgramStatus, 
  FundingSource 
} from '../../models/program.model';
import { UUID } from '../../types/common.types';
import { 
  WhereCondition, 
  OrderBy, 
  Pagination, 
  PaginatedResult, 
  RepositoryOptions 
} from '../../types/database.types';
import { getKnexInstance } from '../connection';
import { DatabaseError } from '../../errors/database-error';
import logger from '../../utils/logger';

/**
 * Repository class for Program entities that extends BaseRepository
 */
class ProgramRepository extends BaseRepository<Program> {
  private serviceCodeTableName: string;
  private rateScheduleTableName: string;

  /**
   * Creates a new ProgramRepository instance
   */
  constructor() {
    super('programs', 'id');
    this.serviceCodeTableName = 'service_codes';
    this.rateScheduleTableName = 'rate_schedules';
  }

  /**
   * Finds a program by its ID with related service codes and rate schedules
   * 
   * @param id ID of the program to find
   * @param options Repository options
   * @returns The program with related data if found, null otherwise
   */
  async findById(id: UUID, options: RepositoryOptions = {}): Promise<Program | null> {
    try {
      logger.debug(`Finding program by ID: ${id}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Get program data
      const program = await queryBuilder.where(this.primaryKey, id).first();
      
      if (!program) {
        return null;
      }

      // Get related service codes
      const serviceCodes = await this.getServiceCodes(id, options);
      
      // Get related rate schedules
      const rateSchedules = await this.getRateSchedules(id, options);
      
      // Return program with related data
      return {
        ...program,
        serviceCodes,
        rateSchedules
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findById');
    }
  }

  /**
   * Finds all programs matching the provided conditions with pagination and sorting
   * 
   * @param conditions Where conditions
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated results with programs and metadata
   */
  async findAll(
    conditions: WhereCondition = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Program>> {
    try {
      logger.debug('Finding all programs with conditions', { conditions, pagination, orderBy });
      
      // Use the parent method to get base result
      const result = await super.findAll(conditions, pagination, orderBy, options);
      
      // For each program, get related data
      const programsWithRelations = await Promise.all(
        result.data.map(async (program) => {
          const serviceCodes = await this.getServiceCodes(program.id, options);
          const rateSchedules = await this.getRateSchedules(program.id, options);
          
          return {
            ...program,
            serviceCodes,
            rateSchedules
          };
        })
      );
      
      // Return paginated result with enhanced data
      return {
        ...result,
        data: programsWithRelations
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAll');
    }
  }

  /**
   * Finds all programs with minimal data for dropdowns and lists
   * 
   * @param conditions Where conditions
   * @param options Repository options
   * @returns Array of program summaries
   */
  async findAllSummary(
    conditions: WhereCondition = {},
    options: RepositoryOptions = {}
  ): Promise<ProgramSummary[]> {
    try {
      logger.debug('Finding program summaries with conditions', { conditions });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Select only the fields needed for summary
      queryBuilder.select([
        'id',
        'name',
        'code',
        'type',
        'status',
        'funding_source as fundingSource'
      ]);
      
      // Apply conditions
      const query = this.applyWhereConditions(queryBuilder, conditions);
      
      // Execute query
      const results = await query;
      
      return results as ProgramSummary[];
    } catch (error) {
      this.handleDatabaseError(error, 'findAllSummary');
    }
  }

  /**
   * Creates a new program with optional service codes and rate schedules
   * 
   * @param programData Program data to insert
   * @param serviceCodes Service codes to add to the program
   * @param rateSchedules Rate schedules to add to the program
   * @param options Repository options
   * @returns The created program with related data
   */
  async create(
    programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'serviceCodes' | 'rateSchedules'>,
    serviceCodes: Omit<ServiceCode, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [],
    rateSchedules: Omit<RateSchedule, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [],
    options: RepositoryOptions = {}
  ): Promise<Program> {
    // Start a transaction if one wasn't provided
    const knex = getKnexInstance();
    const trx = options.transaction || await knex.transaction();
    const useInternalTrx = !options.transaction;
    
    try {
      logger.debug('Creating new program', { programData });
      
      // Create program
      const program = await super.create(programData, { ...options, transaction: trx });
      
      // Add service codes if provided
      const createdServiceCodes = [];
      if (serviceCodes.length > 0) {
        for (const serviceCode of serviceCodes) {
          const createdServiceCode = await this.addServiceCode(
            program.id,
            serviceCode,
            { ...options, transaction: trx }
          );
          createdServiceCodes.push(createdServiceCode);
        }
      }
      
      // Add rate schedules if provided
      const createdRateSchedules = [];
      if (rateSchedules.length > 0) {
        for (const rateSchedule of rateSchedules) {
          const createdRateSchedule = await this.addRateSchedule(
            program.id,
            rateSchedule,
            { ...options, transaction: trx }
          );
          createdRateSchedules.push(createdRateSchedule);
        }
      }
      
      // Commit transaction if we started it
      if (useInternalTrx) {
        await trx.commit();
      }
      
      // Return complete program with related data
      return {
        ...program,
        serviceCodes: createdServiceCodes,
        rateSchedules: createdRateSchedules
      };
    } catch (error) {
      // Rollback transaction if we started it
      if (useInternalTrx) {
        await trx.rollback();
      }
      this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Updates an existing program
   * 
   * @param id ID of the program to update
   * @param programData Program data to update
   * @param options Repository options
   * @returns The updated program with related data
   */
  async update(
    id: UUID,
    programData: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'serviceCodes' | 'rateSchedules'>>,
    options: RepositoryOptions = {}
  ): Promise<Program> {
    try {
      logger.debug(`Updating program with ID: ${id}`, { programData });
      
      // Update program
      await super.update(id, programData, options);
      
      // Fetch updated program with related data
      const updatedProgram = await this.findById(id, options);
      
      if (!updatedProgram) {
        throw new DatabaseError('Failed to retrieve updated program', {
          operation: 'update',
          entity: this.tableName
        });
      }
      
      return updatedProgram;
    } catch (error) {
      this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Updates the status of a program
   * 
   * @param id ID of the program to update
   * @param status New status value
   * @param options Repository options
   * @returns The updated program with related data
   */
  async updateStatus(
    id: UUID,
    status: ProgramStatus,
    options: RepositoryOptions = {}
  ): Promise<Program> {
    try {
      logger.debug(`Updating status for program with ID: ${id}`, { status });
      
      // Update only the status field
      await super.update(id, { status }, options);
      
      // Fetch updated program with related data
      const updatedProgram = await this.findById(id, options);
      
      if (!updatedProgram) {
        throw new DatabaseError('Failed to retrieve updated program', {
          operation: 'updateStatus',
          entity: this.tableName
        });
      }
      
      return updatedProgram;
    } catch (error) {
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Adds a service code to a program
   * 
   * @param programId ID of the program to add the service code to
   * @param serviceCodeData Service code data to insert
   * @param options Repository options
   * @returns The created service code
   */
  async addServiceCode(
    programId: UUID,
    serviceCodeData: Omit<ServiceCode, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    options: RepositoryOptions = {}
  ): Promise<ServiceCode> {
    try {
      logger.debug(`Adding service code to program with ID: ${programId}`, { serviceCodeData });
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.serviceCodeTableName)
        : knex(this.serviceCodeTableName);
      
      // Prepare service code data with program ID
      const now = new Date();
      const data = {
        ...serviceCodeData,
        program_id: programId,
        created_at: now,
        updated_at: now
      };
      
      // Add created_by and updated_by if provided
      if ('createdBy' in options) {
        data.created_by = options.createdBy;
      }
      
      if ('updatedBy' in options) {
        data.updated_by = options.updatedBy;
      }
      
      // Insert service code
      const [result] = await queryBuilder.insert(data).returning('*');
      
      // Convert to camelCase and return
      return this.toCamelCase(result) as ServiceCode;
    } catch (error) {
      this.handleDatabaseError(error, 'addServiceCode');
    }
  }

  /**
   * Updates an existing service code
   * 
   * @param serviceCodeId ID of the service code to update
   * @param serviceCodeData Service code data to update
   * @param options Repository options
   * @returns The updated service code
   */
  async updateServiceCode(
    serviceCodeId: UUID,
    serviceCodeData: Partial<Omit<ServiceCode, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    options: RepositoryOptions = {}
  ): Promise<ServiceCode> {
    try {
      logger.debug(`Updating service code with ID: ${serviceCodeId}`, { serviceCodeData });
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.serviceCodeTableName)
        : knex(this.serviceCodeTableName);
      
      // Prepare update data
      const data = {
        ...serviceCodeData,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if ('updatedBy' in options) {
        data.updated_by = options.updatedBy;
      }
      
      // Update service code
      const [result] = await queryBuilder
        .where('id', serviceCodeId)
        .update(data)
        .returning('*');
      
      // Convert to camelCase and return
      return this.toCamelCase(result) as ServiceCode;
    } catch (error) {
      this.handleDatabaseError(error, 'updateServiceCode');
    }
  }

  /**
   * Deletes a service code
   * 
   * @param serviceCodeId ID of the service code to delete
   * @param options Repository options
   * @returns True if the service code was deleted successfully
   */
  async deleteServiceCode(
    serviceCodeId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Deleting service code with ID: ${serviceCodeId}`);
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.serviceCodeTableName)
        : knex(this.serviceCodeTableName);
      
      // Delete service code
      const result = await queryBuilder
        .where('id', serviceCodeId)
        .delete();
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'deleteServiceCode');
    }
  }

  /**
   * Gets all service codes for a program
   * 
   * @param programId ID of the program to get service codes for
   * @param options Repository options
   * @returns Array of service codes for the program
   */
  async getServiceCodes(
    programId: UUID,
    options: RepositoryOptions = {}
  ): Promise<ServiceCode[]> {
    try {
      logger.debug(`Getting service codes for program with ID: ${programId}`);
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.serviceCodeTableName)
        : knex(this.serviceCodeTableName);
      
      // Query service codes
      const results = await queryBuilder
        .where('program_id', programId)
        .orderBy('code');
      
      // Convert to camelCase and return
      return results.map(row => this.toCamelCase(row)) as ServiceCode[];
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceCodes');
    }
  }

  /**
   * Adds a rate schedule to a program
   * 
   * @param programId ID of the program to add the rate schedule to
   * @param rateScheduleData Rate schedule data to insert
   * @param options Repository options
   * @returns The created rate schedule
   */
  async addRateSchedule(
    programId: UUID,
    rateScheduleData: Omit<RateSchedule, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    options: RepositoryOptions = {}
  ): Promise<RateSchedule> {
    try {
      logger.debug(`Adding rate schedule to program with ID: ${programId}`, { rateScheduleData });
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.rateScheduleTableName)
        : knex(this.rateScheduleTableName);
      
      // Prepare rate schedule data with program ID
      const now = new Date();
      const data = {
        ...rateScheduleData,
        program_id: programId,
        created_at: now,
        updated_at: now
      };
      
      // Add created_by and updated_by if provided
      if ('createdBy' in options) {
        data.created_by = options.createdBy;
      }
      
      if ('updatedBy' in options) {
        data.updated_by = options.updatedBy;
      }
      
      // Insert rate schedule
      const [result] = await queryBuilder.insert(data).returning('*');
      
      // Convert to camelCase and return
      return this.toCamelCase(result) as RateSchedule;
    } catch (error) {
      this.handleDatabaseError(error, 'addRateSchedule');
    }
  }

  /**
   * Updates an existing rate schedule
   * 
   * @param rateScheduleId ID of the rate schedule to update
   * @param rateScheduleData Rate schedule data to update
   * @param options Repository options
   * @returns The updated rate schedule
   */
  async updateRateSchedule(
    rateScheduleId: UUID,
    rateScheduleData: Partial<Omit<RateSchedule, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    options: RepositoryOptions = {}
  ): Promise<RateSchedule> {
    try {
      logger.debug(`Updating rate schedule with ID: ${rateScheduleId}`, { rateScheduleData });
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.rateScheduleTableName)
        : knex(this.rateScheduleTableName);
      
      // Prepare update data
      const data = {
        ...rateScheduleData,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if ('updatedBy' in options) {
        data.updated_by = options.updatedBy;
      }
      
      // Update rate schedule
      const [result] = await queryBuilder
        .where('id', rateScheduleId)
        .update(data)
        .returning('*');
      
      // Convert to camelCase and return
      return this.toCamelCase(result) as RateSchedule;
    } catch (error) {
      this.handleDatabaseError(error, 'updateRateSchedule');
    }
  }

  /**
   * Deletes a rate schedule
   * 
   * @param rateScheduleId ID of the rate schedule to delete
   * @param options Repository options
   * @returns True if the rate schedule was deleted successfully
   */
  async deleteRateSchedule(
    rateScheduleId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Deleting rate schedule with ID: ${rateScheduleId}`);
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.rateScheduleTableName)
        : knex(this.rateScheduleTableName);
      
      // Delete rate schedule
      const result = await queryBuilder
        .where('id', rateScheduleId)
        .delete();
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'deleteRateSchedule');
    }
  }

  /**
   * Gets all rate schedules for a program
   * 
   * @param programId ID of the program to get rate schedules for
   * @param options Repository options
   * @returns Array of rate schedules for the program
   */
  async getRateSchedules(
    programId: UUID,
    options: RepositoryOptions = {}
  ): Promise<RateSchedule[]> {
    try {
      logger.debug(`Getting rate schedules for program with ID: ${programId}`);
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.rateScheduleTableName)
        : knex(this.rateScheduleTableName);
      
      // Query rate schedules
      const results = await queryBuilder
        .where('program_id', programId)
        .orderBy('effective_date', 'desc');
      
      // Convert to camelCase and return
      return results.map(row => this.toCamelCase(row)) as RateSchedule[];
    } catch (error) {
      this.handleDatabaseError(error, 'getRateSchedules');
    }
  }

  /**
   * Gets all rate schedules for a specific service code
   * 
   * @param serviceCodeId ID of the service code to get rate schedules for
   * @param options Repository options
   * @returns Array of rate schedules for the service code
   */
  async getRateSchedulesByServiceCode(
    serviceCodeId: UUID,
    options: RepositoryOptions = {}
  ): Promise<RateSchedule[]> {
    try {
      logger.debug(`Getting rate schedules for service code with ID: ${serviceCodeId}`);
      const knex = getKnexInstance();
      const queryBuilder = options.transaction 
        ? options.transaction(this.rateScheduleTableName)
        : knex(this.rateScheduleTableName);
      
      // Query rate schedules
      const results = await queryBuilder
        .where('service_code_id', serviceCodeId)
        .orderBy('effective_date', 'desc');
      
      // Convert to camelCase and return
      return results.map(row => this.toCamelCase(row)) as RateSchedule[];
    } catch (error) {
      this.handleDatabaseError(error, 'getRateSchedulesByServiceCode');
    }
  }

  /**
   * Gets program metrics for reporting and dashboard
   * 
   * @param options Repository options
   * @returns Program metrics data
   */
  async getProgramMetrics(options: RepositoryOptions = {}): Promise<ProgramMetrics> {
    try {
      logger.debug('Getting program metrics');
      const knex = getKnexInstance();
      
      // Get total programs count
      const totalProgramsResult = await this.count({}, options);
      
      // Get active programs count
      const activeProgramsResult = await this.count({ status: ProgramStatus.ACTIVE }, options);
      
      // Get programs count by type
      const programsByTypeQuery = knex(this.tableName)
        .select('type')
        .count('* as count')
        .whereNull('deleted_at')
        .groupBy('type');
        
      if (options.transaction) {
        programsByTypeQuery.transacting(options.transaction);
      }
      
      const programsByTypeResult = await programsByTypeQuery;
      
      // Get programs count by funding source
      const programsByFundingSourceQuery = knex(this.tableName)
        .select('funding_source as fundingSource')
        .count('* as count')
        .whereNull('deleted_at')
        .groupBy('funding_source');
        
      if (options.transaction) {
        programsByFundingSourceQuery.transacting(options.transaction);
      }
      
      const programsByFundingSourceResult = await programsByFundingSourceQuery;
      
      // Get revenue by program
      const revenueByProgram = await this.getRevenueByProgram(
        new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // Last year
        new Date(),
        options
      );
      
      // Compile metrics
      const metrics: ProgramMetrics = {
        totalPrograms: totalProgramsResult,
        activePrograms: activeProgramsResult,
        programsByType: programsByTypeResult.map(item => ({
          type: item.type,
          count: parseInt(item.count, 10)
        })),
        programsByFundingSource: programsByFundingSourceResult.map(item => ({
          fundingSource: item.fundingSource,
          count: parseInt(item.count, 10)
        })),
        revenueByProgram
      };
      
      return metrics;
    } catch (error) {
      this.handleDatabaseError(error, 'getProgramMetrics');
    }
  }

  /**
   * Gets revenue data grouped by program for reporting
   * 
   * @param startDate Start date for revenue data
   * @param endDate End date for revenue data
   * @param options Repository options
   * @returns Revenue data by program
   */
  async getRevenueByProgram(
    startDate: Date,
    endDate: Date,
    options: RepositoryOptions = {}
  ): Promise<Array<{ programId: UUID, programName: string, revenue: number }>> {
    try {
      logger.debug('Getting revenue by program', { startDate, endDate });
      const knex = getKnexInstance();
      
      // Join programs with claims and payments tables to calculate revenue
      const query = knex(this.tableName)
        .select([
          `${this.tableName}.id as programId`,
          `${this.tableName}.name as programName`,
          knex.raw('SUM(payments.amount) as revenue')
        ])
        .leftJoin('claims', 'claims.program_id', `${this.tableName}.id`)
        .leftJoin('payments', 'payments.claim_id', 'claims.id')
        .whereNull(`${this.tableName}.deleted_at`)
        .whereBetween('payments.payment_date', [startDate, endDate])
        .groupBy([`${this.tableName}.id`, `${this.tableName}.name`])
        .orderBy('revenue', 'desc');
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const results = await query;
      
      // Format results
      return results.map(row => ({
        programId: row.programId,
        programName: row.programName,
        revenue: parseFloat(row.revenue) || 0
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getRevenueByProgram');
    }
  }

  /**
   * Gets service codes with rate schedules for a specific payer
   * 
   * @param payerId ID of the payer to get service codes for
   * @param options Repository options
   * @returns Service codes with rate schedules
   */
  async getServiceCodesByPayer(
    payerId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<ServiceCode & { rateSchedule: RateSchedule | null }>> {
    try {
      logger.debug(`Getting service codes for payer with ID: ${payerId}`);
      const knex = getKnexInstance();
      
      // Get service codes with their rate schedules for the specified payer
      const query = knex(this.serviceCodeTableName)
        .select([
          `${this.serviceCodeTableName}.*`,
          `${this.rateScheduleTableName}.*`
        ])
        .leftJoin(
          this.rateScheduleTableName,
          function() {
            this.on(`${this.rateScheduleTableName}.service_code_id`, '=', `${this.serviceCodeTableName}.id`)
                .andOn(`${this.rateScheduleTableName}.payer_id`, '=', payerId)
                .andOn(function() {
                  this.whereNull(`${this.rateScheduleTableName}.end_date`)
                      .orWhere(`${this.rateScheduleTableName}.end_date`, '>=', new Date());
                });
          }
        )
        .where(`${this.serviceCodeTableName}.is_active`, true)
        .orderBy(`${this.serviceCodeTableName}.code`);
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const results = await query;
      
      // Process results to combine service code with rate schedule
      const serviceCodesMap = new Map();
      
      results.forEach(row => {
        const serviceCode = {
          id: row.id,
          programId: row.program_id,
          code: row.code,
          name: row.name,
          description: row.description,
          type: row.type,
          defaultRate: row.default_rate,
          unitType: row.unit_type,
          isActive: row.is_active,
          requiresAuthorization: row.requires_authorization,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
          updatedBy: row.updated_by
        };
        
        let rateSchedule = null;
        if (row.rate) {
          rateSchedule = {
            id: row.id,
            programId: row.program_id,
            serviceCodeId: row.service_code_id,
            payerId: row.payer_id,
            rate: row.rate,
            effectiveDate: row.effective_date,
            endDate: row.end_date,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
          };
        }
        
        serviceCodesMap.set(serviceCode.id, {
          ...serviceCode,
          rateSchedule
        });
      });
      
      return Array.from(serviceCodesMap.values());
    } catch (error) {
      this.handleDatabaseError(error, 'getServiceCodesByPayer');
    }
  }

  /**
   * Converts snake_case database columns to camelCase
   * 
   * @param data Database row data
   * @returns Data with camelCase properties
   */
  private toCamelCase(data: any): any {
    if (!data) return data;
    
    const result: any = {};
    
    Object.keys(data).forEach(key => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      result[camelKey] = data[key];
    });
    
    return result;
  }
}

// Create singleton instance
const programRepository = new ProgramRepository();

// Export the repository instance
export { programRepository };