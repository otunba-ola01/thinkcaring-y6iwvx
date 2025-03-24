import { Knex } from 'knex'; // knex v2.4.2
import { BaseRepository } from './base.repository';
import { getKnexInstance, getTransaction } from '../connection';
import { PayerModel } from '../../models/payer.model';
import {
  Payer,
  PayerType,
  PayerSummary,
  SubmissionFormat,
  BillingRequirements,
  SubmissionMethod,
} from '../../types/claims.types';
import {
  UUID,
  StatusType,
  PaginatedResult,
  WhereCondition,
  Transaction,
  RepositoryOptions,
} from '../../types/database.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for payer data access operations
 */
export class PayerRepository extends BaseRepository<Payer> {
  public tableName: string = 'payers';
  public primaryKey: string = 'id';

  /**
   * Creates a new PayerRepository instance
   */
  constructor() {
    super('payers', 'id');
  }

  /**
   * Finds a payer by their external payer identifier
   * @param payerId The external payer identifier
   * @param options Repository options
   * @returns The payer if found, null otherwise
   */
  async findByPayerId(payerId: string, options: RepositoryOptions = {}): Promise<Payer | null> {
    try {
      logger.debug(`Finding payer by payerId: ${payerId}`);

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where('payer_id', payerId).first();

      if (!result) {
        logger.debug(`Payer with payerId ${payerId} not found`);
        return null;
      }

      const payer: Payer = this.transformPayerFromDb(result);
      logger.debug(`Payer found: ${payer.id}`);
      return payer;
    } catch (error) {
      logger.error(`Error finding payer by payerId: ${payerId}`, { error });
      throw new DatabaseError(`Error finding payer by payerId: ${payerId}`, {
        operation: 'findByPayerId',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Finds payers with filtering and pagination
   * @param filters Where conditions
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated results with payers and metadata
   */
  async findAllWithFilters(
    filters: WhereCondition = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Payer>> {
    try {
      logger.debug(`Finding all payers with filters and pagination`, { filters, pagination });

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const countQueryBuilder = this.getQueryBuilder(options.transaction);

      // Apply filters
      if (filters && Object.keys(filters).length > 0) {
        this.applyWhereConditions(queryBuilder, filters);
        this.applyWhereConditions(countQueryBuilder, filters);
      }

      // Apply pagination
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      queryBuilder.limit(limit).offset(offset);

      // Execute queries
      const data = await queryBuilder.select();
      const totalResult = await countQueryBuilder.count({ count: '*' }).first();
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / limit);

      const payers: Payer[] = data.map((payerData: any) => this.transformPayerFromDb(payerData));

      logger.debug(`Found ${payers.length} payers`);

      return {
        data: payers,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Error finding all payers with filters and pagination', { error });
      throw new DatabaseError('Error finding all payers with filters and pagination', {
        operation: 'findAllWithFilters',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Gets summarized payer information for dropdowns and lists
   * @param filters Where conditions
   * @param options Repository options
   * @returns Array of payer summaries
   */
  async getPayerSummaries(filters: WhereCondition = {}, options: RepositoryOptions = {}): Promise<PayerSummary[]> {
    try {
      logger.debug('Getting payer summaries', { filters });

      const queryBuilder = this.getQueryBuilder(options.transaction);

      queryBuilder.select('id', 'name', 'payer_type as payerType', 'is_electronic as isElectronic', 'status');

      if (filters && Object.keys(filters).length > 0) {
        this.applyWhereConditions(queryBuilder, filters);
      }

      const results = await queryBuilder;

      const payerSummaries: PayerSummary[] = results.map((result: any) => ({
        id: result.id,
        name: result.name,
        payerType: result.payerType,
        isElectronic: result.isElectronic,
        status: result.status,
      }));

      logger.debug(`Found ${payerSummaries.length} payer summaries`);
      return payerSummaries;
    } catch (error) {
      logger.error('Error getting payer summaries', { error });
      throw new DatabaseError('Error getting payer summaries', {
        operation: 'getPayerSummaries',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Gets summarized information for active payers only
   * @param options Repository options
   * @returns Array of active payer summaries
   */
  async getActivePayerSummaries(options: RepositoryOptions = {}): Promise<PayerSummary[]> {
    try {
      logger.debug('Getting active payer summaries');
      const filters: WhereCondition = { status: StatusType.ACTIVE };
      return await this.getPayerSummaries(filters, options);
    } catch (error) {
      logger.error('Error getting active payer summaries', { error });
      throw new DatabaseError('Error getting active payer summaries', {
        operation: 'getActivePayerSummaries',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Finds payers by their type (Medicaid, Medicare, etc.)
   * @param payerType The payer type to search for
   * @param options Repository options
   * @returns Array of payers matching the type
   */
  async findByType(payerType: PayerType, options: RepositoryOptions = {}): Promise<Payer[]> {
    try {
      logger.debug(`Finding payers by type: ${payerType}`);

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const results = await queryBuilder.where('payer_type', payerType);

      const payers: Payer[] = results.map((payerData: any) => this.transformPayerFromDb(payerData));

      logger.debug(`Found ${payers.length} payers of type ${payerType}`);
      return payers;
    } catch (error) {
      logger.error(`Error finding payers by type: ${payerType}`, { error });
      throw new DatabaseError(`Error finding payers by type: ${payerType}`, {
        operation: 'findByType',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Updates a payer's status (active/inactive)
   * @param id The ID of the payer to update
   * @param status The new status to set
   * @param userId The ID of the user performing the update
   * @param options Repository options
   * @returns True if the status was updated successfully
   */
  async updateStatus(id: UUID, status: StatusType, userId: UUID | null, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Updating payer status for ID: ${id} to status: ${status}`);

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const updateData: any = {
        status: status,
        updated_at: new Date(),
      };

      if (userId) {
        updateData.updated_by = userId;
      }

      const result = await queryBuilder.where(this.primaryKey, id).update(updateData);

      const success = result > 0;
      logger.debug(`Payer status updated successfully: ${success}`);
      return success;
    } catch (error) {
      logger.error(`Error updating payer status for ID: ${id}`, { error });
      throw new DatabaseError(`Error updating payer status for ID: ${id}`, {
        operation: 'updateStatus',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Updates a payer's billing requirements
   * @param id The ID of the payer to update
   * @param requirements The new billing requirements
   * @param userId The ID of the user performing the update
   * @param options Repository options
   * @returns True if the billing requirements were updated successfully
   */
  async updateBillingRequirements(
    id: UUID,
    requirements: BillingRequirements,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating billing requirements for payer ID: ${id}`, { requirements });

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const updateData: any = {
        billing_requirements: JSON.stringify(requirements),
        updated_at: new Date(),
      };

      if (userId) {
        updateData.updated_by = userId;
      }

      const result = await queryBuilder.where(this.primaryKey, id).update(updateData);

      const success = result > 0;
      logger.debug(`Billing requirements updated successfully: ${success}`);
      return success;
    } catch (error) {
      logger.error(`Error updating billing requirements for payer ID: ${id}`, { error });
      throw new DatabaseError(`Error updating billing requirements for payer ID: ${id}`, {
        operation: 'updateBillingRequirements',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Updates a payer's submission method configuration
   * @param id The ID of the payer to update
   * @param submissionMethod The new submission method configuration
   * @param userId The ID of the user performing the update
   * @param options Repository options
   * @returns True if the submission method was updated successfully
   */
  async updateSubmissionMethod(
    id: UUID,
    submissionMethod: SubmissionMethod,
    userId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating submission method for payer ID: ${id}`, { submissionMethod });

      const queryBuilder = this.getQueryBuilder(options.transaction);
      const updateData: any = {
        submission_method: JSON.stringify(submissionMethod),
        updated_at: new Date(),
      };

      if (userId) {
        updateData.updated_by = userId;
      }

      const result = await queryBuilder.where(this.primaryKey, id).update(updateData);

      const success = result > 0;
      logger.debug(`Submission method updated successfully: ${success}`);
      return success;
    } catch (error) {
      logger.error(`Error updating submission method for payer ID: ${id}`, { error });
      throw new DatabaseError(`Error updating submission method for payer ID: ${id}`, {
        operation: 'updateSubmissionMethod',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Counts payers grouped by their type
   * @param options Repository options
   * @returns Object with payer type counts
   */
  async countPayersByType(options: RepositoryOptions = {}): Promise<Record<PayerType, number>> {
    try {
      logger.debug('Counting payers by type');

      const queryBuilder = this.getQueryBuilder(options.transaction);

      queryBuilder.select('payer_type').count('* as count').groupBy('payer_type');

      const results = await queryBuilder;

      const payerTypeCounts: Record<PayerType, number> = {
        [PayerType.MEDICAID]: 0,
        [PayerType.MEDICARE]: 0,
        [PayerType.PRIVATE_INSURANCE]: 0,
        [PayerType.SELF_PAY]: 0,
        [PayerType.OTHER]: 0,
      };

      results.forEach((result: any) => {
        payerTypeCounts[result.payer_type] = parseInt(result.count, 10);
      });

      logger.debug('Payer type counts', { payerTypeCounts });
      return payerTypeCounts;
    } catch (error) {
      logger.error('Error counting payers by type', { error });
      throw new DatabaseError('Error counting payers by type', {
        operation: 'countPayersByType',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Gets payers that support a specific submission format
   * @param format The submission format to search for
   * @param options Repository options
   * @returns Array of payers supporting the format
   */
  async getPayersWithSubmissionFormat(format: SubmissionFormat, options: RepositoryOptions = {}): Promise<Payer[]> {
    try {
      logger.debug(`Getting payers with submission format: ${format}`);

      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Use a JSON path query to find payers where billing_requirements->>'submissionFormat' = format
      queryBuilder.whereRaw(`billing_requirements->>'submissionFormat' = ?`, format);

      const results = await queryBuilder;

      const payers: Payer[] = results.map((payerData: any) => this.transformPayerFromDb(payerData));

      logger.debug(`Found ${payers.length} payers with submission format ${format}`);
      return payers;
    } catch (error) {
      logger.error(`Error getting payers with submission format: ${format}`, { error });
      throw new DatabaseError(`Error getting payers with submission format: ${format}`, {
        operation: 'getPayersWithSubmissionFormat',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Gets payers that support electronic submission
   * @param options Repository options
   * @returns Array of payers supporting electronic submission
   */
  async getElectronicPayers(options: RepositoryOptions = {}): Promise<Payer[]> {
    try {
      logger.debug('Getting electronic payers');

      const queryBuilder = this.getQueryBuilder(options.transaction);

      queryBuilder.where('is_electronic', true);

      const results = await queryBuilder;

      const payers: Payer[] = results.map((payerData: any) => this.transformPayerFromDb(payerData));

      logger.debug(`Found ${payers.length} electronic payers`);
      return payers;
    } catch (error) {
      logger.error('Error getting electronic payers', { error });
      throw new DatabaseError('Error getting electronic payers', {
        operation: 'getElectronicPayers',
        entity: this.tableName,
        code: error.code,
        message: error.message,
      }, error);
    }
  }

  /**
   * Transforms a database payer record to a Payer object
   * @param dbPayer The database payer record
   * @returns Transformed Payer object
   */
  transformPayerFromDb(dbPayer: any): Payer {
    const payer: Payer = {
      id: dbPayer.id,
      name: dbPayer.name,
      payerType: dbPayer.payer_type,
      payerId: dbPayer.payer_id,
      address: dbPayer.address ? JSON.parse(dbPayer.address) : null,
      contactInfo: dbPayer.contact_info ? JSON.parse(dbPayer.contact_info) : null,
      billingRequirements: dbPayer.billing_requirements ? JSON.parse(dbPayer.billing_requirements) : null,
      submissionMethod: dbPayer.submission_method ? JSON.parse(dbPayer.submission_method) : null,
      isElectronic: dbPayer.is_electronic,
      status: dbPayer.status,
      notes: dbPayer.notes,
      createdAt: dbPayer.created_at,
      updatedAt: dbPayer.updated_at,
      createdBy: dbPayer.created_by,
      updatedBy: dbPayer.updated_by,
    };
    return payer;
  }

  /**
   * Transforms a Payer object to database format
   * @param payer The Payer object
   * @returns Database-formatted payer object
   */
  transformPayerToDb(payer: Payer): any {
    return {
      id: payer.id,
      name: payer.name,
      payer_type: payer.payerType,
      payer_id: payer.payerId,
      address: payer.address ? JSON.stringify(payer.address) : null,
      contact_info: payer.contactInfo ? JSON.stringify(payer.contactInfo) : null,
      billing_requirements: payer.billingRequirements ? JSON.stringify(payer.billingRequirements) : null,
      submission_method: payer.submissionMethod ? JSON.stringify(payer.submissionMethod) : null,
      is_electronic: payer.isElectronic,
      status: payer.status,
      notes: payer.notes,
      created_at: payer.createdAt,
      updated_at: payer.updatedAt,
      created_by: payer.createdBy,
      updated_by: payer.updatedBy,
    };
  }
}

export default PayerRepository;