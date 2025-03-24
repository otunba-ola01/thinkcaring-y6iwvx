import { Knex } from 'knex'; // knex v2.4.2
import { BaseRepository } from './base.repository';
import { getKnexInstance, getTransaction } from '../connection';
import { ClientModel } from '../../models/client.model';
import { 
  Client, 
  ClientProgram, 
  ClientInsurance, 
  ClientStatus,
  ClientSummary,
  ClientQueryParams
} from '../../types/clients.types';
import { 
  UUID, 
  PaginatedResult, 
  WhereCondition, 
  Transaction,
  RepositoryOptions
} from '../../types/database.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for client data access operations in the HCBS Revenue Management System.
 * Provides methods for managing client records, including relationships with programs
 * and insurance information, with proper handling of sensitive PHI data.
 */
class ClientRepository extends BaseRepository<any> {
  private programsTableName: string;
  private insurancesTableName: string;
  private clientModel: ClientModel;

  /**
   * Creates a new ClientRepository instance
   */
  constructor() {
    super('clients', 'id');
    this.programsTableName = 'client_programs';
    this.insurancesTableName = 'client_insurances';
    this.clientModel = new ClientModel();
  }

  /**
   * Finds a client by their Medicaid identifier
   * 
   * @param medicaidId Medicaid identifier to search for
   * @param options Repository options including transaction
   * @returns The client if found, null otherwise
   */
  async findByMedicaidId(medicaidId: string, options: RepositoryOptions = {}): Promise<Client | null> {
    try {
      logger.debug(`Finding client by Medicaid ID: ${medicaidId}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where('medicaid_id', medicaidId).first();
      
      if (!result) {
        return null;
      }
      
      return this.clientModel.fromDb(result);
    } catch (error) {
      this.handleDatabaseError(error, 'findByMedicaidId');
    }
  }

  /**
   * Finds a client by ID and includes related programs and insurances
   * 
   * @param id Client ID
   * @param options Repository options including transaction
   * @returns The client with relations if found, null otherwise
   */
  async findWithRelations(id: UUID, options: RepositoryOptions = {}): Promise<Client | null> {
    try {
      logger.debug(`Finding client with relations, ID: ${id}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where(this.primaryKey, id).first();
      
      if (!result) {
        return null;
      }
      
      // Get client programs
      const programs = await this.getClientPrograms(id, options);
      
      // Get client insurances
      const insurances = await this.getClientInsurances(id, options);
      
      // Transform the result to a Client object
      const client = this.clientModel.fromDb(result);
      
      // Add relations
      client.programs = programs;
      client.insurances = insurances;
      
      return client;
    } catch (error) {
      this.handleDatabaseError(error, 'findWithRelations');
    }
  }

  /**
   * Finds clients with filtering, pagination, and includes relations
   * 
   * @param params Query parameters for filtering and pagination
   * @param options Repository options including transaction
   * @returns Paginated results with clients and metadata
   */
  async findAllWithFilters(
    params: ClientQueryParams, 
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Client>> {
    try {
      logger.debug('Finding clients with filters', { params });
      const knex = getKnexInstance();
      let queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply search filter if provided
      if (params.search) {
        queryBuilder = queryBuilder.where(builder => {
          builder.where('first_name', 'ilike', `%${params.search}%`)
            .orWhere('last_name', 'ilike', `%${params.search}%`)
            .orWhere('medicaid_id', 'ilike', `%${params.search}%`);
        });
      }
      
      // Apply status filter if provided
      if (params.status) {
        if (Array.isArray(params.status)) {
          queryBuilder = queryBuilder.whereIn('status', params.status);
        } else {
          queryBuilder = queryBuilder.where('status', params.status);
        }
      }
      
      // Apply program filter if provided
      if (params.programId) {
        queryBuilder = queryBuilder.whereExists(function() {
          this.select(1)
            .from('client_programs')
            .whereRaw('client_programs.client_id = clients.id')
            .where('program_id', params.programId)
            .whereNull('client_programs.deleted_at');
        });
      }
      
      // Create a count query to get total
      const countQuery = queryBuilder.clone().count('* as count').first();
      
      // Apply pagination
      const { page = 1, limit = 25 } = params;
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.limit(limit).offset(offset);
      
      // Execute both queries
      const [results, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      // Get related data for each client
      const clientsWithRelations = await Promise.all(
        results.map(async (client) => {
          const programs = await this.getClientPrograms(client.id, options);
          const insurances = await this.getClientInsurances(client.id, options);
          
          const clientObj = this.clientModel.fromDb(client);
          clientObj.programs = programs;
          clientObj.insurances = insurances;
          
          return clientObj;
        })
      );
      
      // Calculate pagination metadata
      const total = parseInt(countResult.count.toString(), 10);
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: clientsWithRelations,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAllWithFilters');
    }
  }

  /**
   * Gets summarized client information for dropdowns and lists
   * 
   * @param filters Optional filter conditions
   * @param options Repository options including transaction
   * @returns Array of client summaries
   */
  async getClientSummaries(
    filters: WhereCondition = {}, 
    options: RepositoryOptions = {}
  ): Promise<ClientSummary[]> {
    try {
      logger.debug('Getting client summaries', { filters });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Select only the fields needed for summaries
      queryBuilder.select([
        'id', 
        'first_name', 
        'last_name', 
        'date_of_birth', 
        'medicaid_id', 
        'status'
      ]);
      
      // Apply filters if provided
      if (Object.keys(filters).length > 0) {
        queryBuilder = this.applyWhereConditions(queryBuilder, filters);
      }
      
      const results = await queryBuilder;
      
      // Transform to ClientSummary objects
      return results.map(result => ({
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        dateOfBirth: new Date(result.date_of_birth).toISOString(),
        medicaidId: result.medicaid_id,
        status: result.status as ClientStatus
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getClientSummaries');
    }
  }

  /**
   * Creates a new client with related programs and insurances
   * 
   * @param clientData Client data with optional programs and insurances
   * @param options Repository options including transaction
   * @returns The created client with all relations
   */
  async createWithRelations(
    clientData: Partial<Client>, 
    options: RepositoryOptions = {}
  ): Promise<Client> {
    const trx = options.transaction || await getTransaction();
    const useExternalTransaction = !!options.transaction;
    
    try {
      logger.debug('Creating client with relations');
      
      // Extract programs and insurances
      const { programs = [], insurances = [], ...clientOnly } = clientData;
      
      // Transform client data
      const dbClientData = this.clientModel.toDb(clientOnly as Client);
      
      // Create client
      const [createdClient] = await trx(this.tableName)
        .insert(dbClientData)
        .returning('*');
      
      const clientId = createdClient.id;
      
      // Add programs if provided
      if (programs.length > 0) {
        await Promise.all(programs.map(program => {
          const programData = {
            ...program,
            clientId
          };
          return this.addProgram(clientId, programData, { transaction: trx });
        }));
      }
      
      // Add insurances if provided
      if (insurances.length > 0) {
        await Promise.all(insurances.map(insurance => {
          const insuranceData = {
            ...insurance,
            clientId
          };
          return this.addInsurance(clientId, insuranceData, { transaction: trx });
        }));
      }
      
      // Commit transaction if we started it
      if (!useExternalTransaction) {
        await trx.commit();
      }
      
      // Return the complete client with relations
      return this.findWithRelations(clientId, options);
    } catch (error) {
      // Rollback transaction if we started it
      if (!useExternalTransaction && trx) {
        await trx.rollback();
      }
      this.handleDatabaseError(error, 'createWithRelations');
    }
  }

  /**
   * Updates a client and optionally their related data
   * 
   * @param id Client ID
   * @param clientData Updated client data
   * @param options Repository options including transaction
   * @returns The updated client with all relations
   */
  async updateWithRelations(
    id: UUID, 
    clientData: Partial<Client>, 
    options: RepositoryOptions = {}
  ): Promise<Client> {
    try {
      logger.debug(`Updating client with ID: ${id}`);
      
      // Transform client data
      const dbClientData = this.clientModel.toDb(clientData as Client);
      
      // Update client
      await this.getQueryBuilder(options.transaction)
        .where(this.primaryKey, id)
        .update(dbClientData);
      
      // Return the updated client with relations
      return this.findWithRelations(id, options);
    } catch (error) {
      this.handleDatabaseError(error, 'updateWithRelations');
    }
  }

  /**
   * Adds a program enrollment for a client
   * 
   * @param clientId Client ID
   * @param programData Program enrollment data
   * @param options Repository options including transaction
   * @returns The created program enrollment
   */
  async addProgram(
    clientId: UUID, 
    programData: Partial<ClientProgram>, 
    options: RepositoryOptions = {}
  ): Promise<ClientProgram> {
    try {
      logger.debug(`Adding program for client ID: ${clientId}`);
      
      // Prepare program data with client ID
      const program = {
        ...programData,
        clientId
      };
      
      // Transform to database format
      const dbProgramData = this.clientModel.programToDb(program as ClientProgram);
      
      // Insert program
      const [createdProgram] = await this.getQueryBuilder(options.transaction)
        .table(this.programsTableName)
        .insert(dbProgramData)
        .returning('*');
      
      // Transform to ClientProgram object
      return this.clientModel.programFromDb(createdProgram);
    } catch (error) {
      this.handleDatabaseError(error, 'addProgram');
    }
  }

  /**
   * Updates a program enrollment
   * 
   * @param programId Program enrollment ID
   * @param programData Updated program enrollment data
   * @param options Repository options including transaction
   * @returns The updated program enrollment
   */
  async updateProgram(
    programId: UUID, 
    programData: Partial<ClientProgram>, 
    options: RepositoryOptions = {}
  ): Promise<ClientProgram> {
    try {
      logger.debug(`Updating program with ID: ${programId}`);
      
      // Transform to database format
      const dbProgramData = this.clientModel.programToDb(programData as ClientProgram);
      
      // Update program
      const [updatedProgram] = await this.getQueryBuilder(options.transaction)
        .table(this.programsTableName)
        .where('id', programId)
        .update(dbProgramData)
        .returning('*');
      
      // Transform to ClientProgram object
      return this.clientModel.programFromDb(updatedProgram);
    } catch (error) {
      this.handleDatabaseError(error, 'updateProgram');
    }
  }

  /**
   * Removes a program enrollment
   * 
   * @param programId Program enrollment ID
   * @param options Repository options including transaction
   * @returns True if program was removed successfully
   */
  async removeProgram(
    programId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Removing program with ID: ${programId}`);
      
      // Delete program
      const result = await this.getQueryBuilder(options.transaction)
        .table(this.programsTableName)
        .where('id', programId)
        .delete();
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeProgram');
    }
  }

  /**
   * Adds insurance information for a client
   * 
   * @param clientId Client ID
   * @param insuranceData Insurance information
   * @param options Repository options including transaction
   * @returns The created insurance information
   */
  async addInsurance(
    clientId: UUID, 
    insuranceData: Partial<ClientInsurance>, 
    options: RepositoryOptions = {}
  ): Promise<ClientInsurance> {
    try {
      logger.debug(`Adding insurance for client ID: ${clientId}`);
      
      // Prepare insurance data with client ID
      const insurance = {
        ...insuranceData,
        clientId
      };
      
      // If this is marked as primary, update any existing primary insurances
      if (insurance.isPrimary) {
        await this.getQueryBuilder(options.transaction)
          .table(this.insurancesTableName)
          .where('client_id', clientId)
          .where('is_primary', true)
          .update({ is_primary: false });
      }
      
      // Transform to database format
      const dbInsuranceData = this.clientModel.insuranceToDb(insurance as ClientInsurance);
      
      // Insert insurance
      const [createdInsurance] = await this.getQueryBuilder(options.transaction)
        .table(this.insurancesTableName)
        .insert(dbInsuranceData)
        .returning('*');
      
      // Transform to ClientInsurance object
      return this.clientModel.insuranceFromDb(createdInsurance);
    } catch (error) {
      this.handleDatabaseError(error, 'addInsurance');
    }
  }

  /**
   * Updates insurance information
   * 
   * @param insuranceId Insurance ID
   * @param insuranceData Updated insurance information
   * @param options Repository options including transaction
   * @returns The updated insurance information
   */
  async updateInsurance(
    insuranceId: UUID, 
    insuranceData: Partial<ClientInsurance>, 
    options: RepositoryOptions = {}
  ): Promise<ClientInsurance> {
    try {
      logger.debug(`Updating insurance with ID: ${insuranceId}`);
      
      // If this is being marked as primary, update any existing primary insurances
      if (insuranceData.isPrimary) {
        // Get the current insurance to find the client ID
        const currentInsurance = await this.getQueryBuilder(options.transaction)
          .table(this.insurancesTableName)
          .where('id', insuranceId)
          .first();
        
        if (currentInsurance) {
          await this.getQueryBuilder(options.transaction)
            .table(this.insurancesTableName)
            .where('client_id', currentInsurance.client_id)
            .where('id', '!=', insuranceId)
            .where('is_primary', true)
            .update({ is_primary: false });
        }
      }
      
      // Transform to database format
      const dbInsuranceData = this.clientModel.insuranceToDb(insuranceData as ClientInsurance);
      
      // Update insurance
      const [updatedInsurance] = await this.getQueryBuilder(options.transaction)
        .table(this.insurancesTableName)
        .where('id', insuranceId)
        .update(dbInsuranceData)
        .returning('*');
      
      // Transform to ClientInsurance object
      return this.clientModel.insuranceFromDb(updatedInsurance);
    } catch (error) {
      this.handleDatabaseError(error, 'updateInsurance');
    }
  }

  /**
   * Removes insurance information
   * 
   * @param insuranceId Insurance ID
   * @param options Repository options including transaction
   * @returns True if insurance was removed successfully
   */
  async removeInsurance(
    insuranceId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Removing insurance with ID: ${insuranceId}`);
      
      // Delete insurance
      const result = await this.getQueryBuilder(options.transaction)
        .table(this.insurancesTableName)
        .where('id', insuranceId)
        .delete();
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeInsurance');
    }
  }

  /**
   * Gets clients enrolled in a specific program
   * 
   * @param programId Program ID
   * @param options Repository options including transaction
   * @returns Array of client summaries
   */
  async getClientsByProgramId(
    programId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<ClientSummary[]> {
    try {
      logger.debug(`Getting clients by program ID: ${programId}`);
      
      const results = await this.getQueryBuilder(options.transaction)
        .select([
          'clients.id', 
          'clients.first_name', 
          'clients.last_name', 
          'clients.date_of_birth', 
          'clients.medicaid_id', 
          'clients.status'
        ])
        .join(
          this.programsTableName, 
          'clients.id', 
          `${this.programsTableName}.client_id`
        )
        .where(`${this.programsTableName}.program_id`, programId)
        .whereNull(`${this.programsTableName}.deleted_at`);
      
      // Transform to ClientSummary objects
      return results.map(result => ({
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        dateOfBirth: new Date(result.date_of_birth).toISOString(),
        medicaidId: result.medicaid_id,
        status: result.status as ClientStatus
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getClientsByProgramId');
    }
  }

  /**
   * Gets clients with insurance from a specific payer
   * 
   * @param payerId Payer ID
   * @param options Repository options including transaction
   * @returns Array of client summaries
   */
  async getClientsByPayerId(
    payerId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<ClientSummary[]> {
    try {
      logger.debug(`Getting clients by payer ID: ${payerId}`);
      
      const results = await this.getQueryBuilder(options.transaction)
        .select([
          'clients.id', 
          'clients.first_name', 
          'clients.last_name', 
          'clients.date_of_birth', 
          'clients.medicaid_id', 
          'clients.status'
        ])
        .join(
          this.insurancesTableName, 
          'clients.id', 
          `${this.insurancesTableName}.client_id`
        )
        .where(`${this.insurancesTableName}.payer_id`, payerId)
        .whereNull(`${this.insurancesTableName}.deleted_at`);
      
      // Transform to ClientSummary objects
      return results.map(result => ({
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        dateOfBirth: new Date(result.date_of_birth).toISOString(),
        medicaidId: result.medicaid_id,
        status: result.status as ClientStatus
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getClientsByPayerId');
    }
  }

  /**
   * Counts clients grouped by their status
   * 
   * @param options Repository options including transaction
   * @returns Object with status counts
   */
  async countClientsByStatus(
    options: RepositoryOptions = {}
  ): Promise<Record<ClientStatus, number>> {
    try {
      logger.debug('Counting clients by status');
      
      const results = await this.getQueryBuilder(options.transaction)
        .select('status')
        .count('* as count')
        .groupBy('status');
      
      // Transform to record with ClientStatus keys
      const statusCounts: Record<ClientStatus, number> = {
        [ClientStatus.ACTIVE]: 0,
        [ClientStatus.INACTIVE]: 0,
        [ClientStatus.PENDING]: 0,
        [ClientStatus.DISCHARGED]: 0,
        [ClientStatus.ON_HOLD]: 0,
        [ClientStatus.DECEASED]: 0
      };
      
      results.forEach(result => {
        const status = result.status as ClientStatus;
        statusCounts[status] = parseInt(result.count.toString(), 10);
      });
      
      return statusCounts;
    } catch (error) {
      this.handleDatabaseError(error, 'countClientsByStatus');
    }
  }

  /**
   * Gets program enrollments for a client
   * 
   * @param clientId Client ID
   * @param options Repository options including transaction
   * @returns Array of client program enrollments
   */
  async getClientPrograms(
    clientId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<ClientProgram[]> {
    try {
      logger.debug(`Getting programs for client ID: ${clientId}`);
      
      const results = await this.getQueryBuilder(options.transaction)
        .table(this.programsTableName)
        .select([
          `${this.programsTableName}.*`, 
          'programs.name as program_name'
        ])
        .leftJoin(
          'programs', 
          `${this.programsTableName}.program_id`, 
          'programs.id'
        )
        .where(`${this.programsTableName}.client_id`, clientId)
        .whereNull(`${this.programsTableName}.deleted_at`);
      
      // Transform to ClientProgram objects
      return results.map(result => {
        const program = this.clientModel.programFromDb(result);
        if (result.program_name) {
          program.program = {
            id: result.program_id,
            name: result.program_name
          };
        }
        return program;
      });
    } catch (error) {
      this.handleDatabaseError(error, 'getClientPrograms');
    }
  }

  /**
   * Gets insurance information for a client
   * 
   * @param clientId Client ID
   * @param options Repository options including transaction
   * @returns Array of client insurance records
   */
  async getClientInsurances(
    clientId: UUID, 
    options: RepositoryOptions = {}
  ): Promise<ClientInsurance[]> {
    try {
      logger.debug(`Getting insurances for client ID: ${clientId}`);
      
      const results = await this.getQueryBuilder(options.transaction)
        .table(this.insurancesTableName)
        .select([
          `${this.insurancesTableName}.*`, 
          'payers.name as payer_name'
        ])
        .leftJoin(
          'payers', 
          `${this.insurancesTableName}.payer_id`, 
          'payers.id'
        )
        .where(`${this.insurancesTableName}.client_id`, clientId)
        .whereNull(`${this.insurancesTableName}.deleted_at`);
      
      // Transform to ClientInsurance objects
      return results.map(result => {
        const insurance = this.clientModel.insuranceFromDb(result);
        if (result.payer_name) {
          insurance.payer = {
            id: result.payer_id,
            name: result.payer_name
          };
        }
        return insurance;
      });
    } catch (error) {
      this.handleDatabaseError(error, 'getClientInsurances');
    }
  }
}

export { ClientRepository };
export default ClientRepository;