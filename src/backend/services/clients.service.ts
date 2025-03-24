import { ClientRepository } from '../database/repositories/client.repository';
import { ClientModel } from '../models/client.model';
import {
  Client,
  ClientProgram,
  ClientInsurance,
  ClientStatus,
  ClientSummary,
  ClientQueryParams,
  CreateClientDto,
  UpdateClientDto,
  CreateClientProgramDto,
  UpdateClientProgramDto,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto
} from '../types/clients.types';
import { UUID, PaginatedResult, RepositoryOptions } from '../types/database.types';
import { NotFoundError, ValidationError, BusinessError } from '../errors';
import { logger } from '../utils/logger';
import { auditLogger } from '../security/audit-logging';
import { AuditEventType, AuditResourceType } from '../models/audit.model';
import { getTransaction } from '../database/connection';

/**
 * Service class that provides business logic for client management
 */
export class ClientService {
  private clientRepository: ClientRepository;
  private clientModel: ClientModel;

  /**
   * Creates a new ClientService instance
   */
  constructor() {
    // Initialize clientRepository instance
    this.clientRepository = new ClientRepository();
    // Initialize clientModel instance
    this.clientModel = new ClientModel();
  }

  /**
   * Retrieves a client by their ID with optional relations
   *
   * @param id Client ID
   * @param includeRelations Whether to include related programs and insurances
   * @param options Repository options
   * @returns The client if found
   */
  async getClientById(id: UUID, includeRelations: boolean, options: RepositoryOptions = {}): Promise<Client> {
    // Log the request to retrieve a client
    logger.info(`getClientById: Attempting to retrieve client with ID ${id}`, { traceId: options.traceId });

    let client: Client | null;

    // Determine whether to use findById or findWithRelations based on includeRelations parameter
    if (includeRelations) {
      // Call repository method to retrieve client with relations
      client = await this.clientRepository.findWithRelations(id, options);
    } else {
      // Call repository method to retrieve client without relations
      client = await this.clientRepository.findById(id, options);
    }

    // If client not found, throw NotFoundError
    if (!client) {
      logger.warn(`getClientById: Client with ID ${id} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', id);
    }

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      id,
      `Retrieved client with ID ${id}`,
      { includeRelations },
      { userId: options.userId }
    );

    // Return the client
    return client;
  }

  /**
   * Retrieves a client by their Medicaid identifier
   *
   * @param medicaidId Medicaid identifier to search for
   * @param options Repository options
   * @returns The client if found, null otherwise
   */
  async getClientByMedicaidId(medicaidId: string, options: RepositoryOptions = {}): Promise<Client | null> {
    // Log the request to retrieve a client by Medicaid ID
    logger.info(`getClientByMedicaidId: Attempting to retrieve client with Medicaid ID ${medicaidId}`, { traceId: options.traceId });

    // Call repository method to find client by Medicaid ID
    const client = await this.clientRepository.findByMedicaidId(medicaidId, options);

    // If client found, log data access using auditLogger.logDataAccess
    if (client) {
      auditLogger.logDataAccess(
        AuditResourceType.CLIENT,
        client.id,
        `Retrieved client with Medicaid ID ${medicaidId}`,
        {},
        { userId: options.userId }
      );
    }

    // Return the client or null if not found
    return client;
  }

  /**
   * Retrieves a paginated list of clients with optional filtering
   *
   * @param queryParams Query parameters for filtering and pagination
   * @param options Repository options
   * @returns Paginated list of clients
   */
  async getClients(queryParams: ClientQueryParams, options: RepositoryOptions = {}): Promise<PaginatedResult<Client>> {
    // Log the request to retrieve clients with query parameters
    logger.info('getClients: Attempting to retrieve clients with query parameters', { queryParams, traceId: options.traceId });

    // Call repository method to find clients with filters
    const clients = await this.clientRepository.findAllWithFilters(queryParams, options);

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      'ALL',
      'Retrieved paginated list of clients',
      { queryParams },
      { userId: options.userId }
    );

    // Return the paginated result
    return clients;
  }

  /**
   * Retrieves a list of client summaries for dropdowns and lists
   *
   * @param filters Optional filter conditions
   * @param options Repository options
   * @returns Array of client summaries
   */
  async getClientSummaries(filters: any, options: RepositoryOptions = {}): Promise<ClientSummary[]> {
    // Log the request to retrieve client summaries
    logger.info('getClientSummaries: Attempting to retrieve client summaries', { filters, traceId: options.traceId });

    // Call repository method to get client summaries
    const clientSummaries = await this.clientRepository.getClientSummaries(filters, options);

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      'ALL',
      'Retrieved list of client summaries',
      { filters },
      { userId: options.userId }
    );

    // Return the client summaries
    return clientSummaries;
  }

  /**
   * Retrieves clients enrolled in a specific program
   *
   * @param programId Program ID
   * @param options Repository options
   * @returns Array of client summaries
   */
  async getClientsByProgram(programId: UUID, options: RepositoryOptions = {}): Promise<ClientSummary[]> {
    // Log the request to retrieve clients by program
    logger.info(`getClientsByProgram: Attempting to retrieve clients by program ID ${programId}`, { traceId: options.traceId });

    // Call repository method to get clients by program ID
    const clientSummaries = await this.clientRepository.getClientsByProgramId(programId, options);

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      'ALL',
      `Retrieved list of client summaries for program ID ${programId}`,
      { programId },
      { userId: options.userId }
    );

    // Return the client summaries
    return clientSummaries;
  }

  /**
   * Retrieves clients with insurance from a specific payer
   *
   * @param payerId Payer ID
   * @param options Repository options
   * @returns Array of client summaries
   */
  async getClientsByPayer(payerId: UUID, options: RepositoryOptions = {}): Promise<ClientSummary[]> {
    // Log the request to retrieve clients by payer
    logger.info(`getClientsByPayer: Attempting to retrieve clients by payer ID ${payerId}`, { traceId: options.traceId });

    // Call repository method to get clients by payer ID
    const clientSummaries = await this.clientRepository.getClientsByPayerId(payerId, options);

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      'ALL',
      `Retrieved list of client summaries for payer ID ${payerId}`,
      { payerId },
      { userId: options.userId }
    );

    // Return the client summaries
    return clientSummaries;
  }

  /**
   * Gets counts of clients grouped by their status
   *
   * @param options Repository options
   * @returns Object with status counts
   */
  async getClientStatusCounts(options: RepositoryOptions = {}): Promise<Record<ClientStatus, number>> {
    // Log the request to get client status counts
    logger.info('getClientStatusCounts: Attempting to retrieve client status counts', { traceId: options.traceId });

    // Call repository method to count clients by status
    const statusCounts = await this.clientRepository.countClientsByStatus(options);

    // Log data access using auditLogger.logDataAccess
    auditLogger.logDataAccess(
      AuditResourceType.CLIENT,
      'ALL',
      'Retrieved client status counts',
      {},
      { userId: options.userId }
    );

    // Return the status count object
    return statusCounts;
  }

  /**
   * Creates a new client with optional program enrollments and insurances
   *
   * @param clientData Client data
   * @param options Repository options
   * @returns The created client
   */
  async createClient(clientData: CreateClientDto, options: RepositoryOptions = {}): Promise<Client> {
    // Log the request to create a client
    logger.info('createClient: Attempting to create a new client', { clientData, traceId: options.traceId });

    // Validate client data using clientModel.validate
    const { isValid, errors } = this.clientModel.validate(clientData);

    // If validation fails, throw ValidationError with validation messages
    if (!isValid) {
      logger.warn('createClient: Validation failed for client data', { errors, traceId: options.traceId });
      throw new ValidationError('Invalid client data', { validationErrors: errors.map(message => ({ field: 'client', message, code: 'INVALID_FIELD' })) });
    }

    let newClient: Client;
    // Start a database transaction if not provided in options
    const transactionOptions = options.transaction ? options : { transaction: await getTransaction() };

    try {
      // Call repository method to create client with relations
      newClient = await this.clientRepository.createWithRelations(clientData, transactionOptions);

      // Commit transaction if started internally
      if (!options.transaction) {
        await (transactionOptions.transaction as any).commit();
      }

      // Log data change using auditLogger.logDataChange with CREATE event type
      auditLogger.logDataChange(
        AuditEventType.CREATE,
        AuditResourceType.CLIENT,
        newClient.id,
        `Created new client with ID ${newClient.id}`,
        null,
        newClient,
        {},
        { userId: options.userId }
      );

      // Return the created client
      return newClient;
    } catch (error) {
      // Rollback transaction if started internally
      if (!options.transaction) {
        await (transactionOptions.transaction as any).rollback();
      }
      logger.error('createClient: Error creating client', { error, traceId: options.traceId });
      throw error;
    }
  }

  /**
   * Updates an existing client's information
   *
   * @param id Client ID
   * @param clientData Updated client data
   * @param options Repository options
   * @returns The updated client
   */
  async updateClient(id: UUID, clientData: UpdateClientDto, options: RepositoryOptions = {}): Promise<Client> {
    // Log the request to update a client
    logger.info(`updateClient: Attempting to update client with ID ${id}`, { clientData, traceId: options.traceId });

    // Retrieve the existing client to ensure it exists
    const existingClient = await this.clientRepository.findById(id, options);
    if (!existingClient) {
      logger.warn(`updateClient: Client with ID ${id} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', id);
    }

    // Validate updated client data using clientModel.validate
    const { isValid, errors } = this.clientModel.validate(clientData);
    if (!isValid) {
      logger.warn(`updateClient: Validation failed for client data`, { errors, traceId: options.traceId });
      throw new ValidationError('Invalid client data', { validationErrors: errors.map(message => ({ field: 'client', message, code: 'INVALID_FIELD' })) });
    }

    // Call repository method to update client
    const updatedClient = await this.clientRepository.updateWithRelations(id, clientData, options);

    // Log data change using auditLogger.logDataChange with UPDATE event type
    auditLogger.logDataChange(
      AuditEventType.UPDATE,
      AuditResourceType.CLIENT,
      id,
      `Updated client with ID ${id}`,
      existingClient,
      updatedClient,
      {},
      { userId: options.userId }
    );

    // Return the updated client
    return updatedClient;
  }

  /**
   * Updates a client's status
   *
   * @param id Client ID
   * @param status New client status
   * @param options Repository options
   * @returns The updated client
   */
  async updateClientStatus(id: UUID, status: ClientStatus, options: RepositoryOptions = {}): Promise<Client> {
    // Log the request to update a client's status
    logger.info(`updateClientStatus: Attempting to update client status for ID ${id} to ${status}`, { traceId: options.traceId });

    // Retrieve the existing client to ensure it exists
    const existingClient = await this.clientRepository.findById(id, options);
    if (!existingClient) {
      logger.warn(`updateClientStatus: Client with ID ${id} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', id);
    }

    // Call repository method to update client with new status
    const updatedClient = await this.clientRepository.update(id, { status }, options);

    // Log data change using auditLogger.logDataChange with UPDATE event type
    auditLogger.logDataChange(
      AuditEventType.UPDATE,
      AuditResourceType.CLIENT,
      id,
      `Updated client status for ID ${id} to ${status}`,
      existingClient,
      updatedClient,
      {},
      { userId: options.userId }
    );

    // Return the updated client
    return updatedClient;
  }

  /**
   * Marks a client as inactive rather than physically deleting
   *
   * @param id Client ID
   * @param options Repository options
   * @returns True if the client was successfully marked as inactive
   */
  async deleteClient(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    // Log the request to delete a client
    logger.info(`deleteClient: Attempting to delete client with ID ${id}`, { traceId: options.traceId });

    // Retrieve the existing client to ensure it exists
    const existingClient = await this.clientRepository.findById(id, options);
    if (!existingClient) {
      logger.warn(`deleteClient: Client with ID ${id} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', id);
    }

    // Update client status to INACTIVE
    const success = await this.clientRepository.delete(id, options);

    // Log data change using auditLogger.logDataChange with UPDATE event type
    auditLogger.logDataChange(
      AuditEventType.DELETE,
      AuditResourceType.CLIENT,
      id,
      `Marked client with ID ${id} as inactive`,
      existingClient,
      null,
      {},
      { userId: options.userId }
    );

    // Return true if successful
    return success;
  }

  /**
   * Adds a program enrollment for a client
   *
   * @param clientId Client ID
   * @param programData Program enrollment data
   * @param options Repository options
   * @returns The created program enrollment
   */
  async addClientProgram(clientId: UUID, programData: CreateClientProgramDto, options: RepositoryOptions = {}): Promise<ClientProgram> {
    // Log the request to add a program enrollment
    logger.info(`addClientProgram: Attempting to add program enrollment for client ID ${clientId}`, { programData, traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`addClientProgram: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to add program enrollment
    const newProgram = await this.clientRepository.addProgram(clientId, programData, options);

    // Log data change using auditLogger.logDataChange with CREATE event type
    auditLogger.logDataChange(
      AuditEventType.CREATE,
      AuditResourceType.PROGRAM,
      newProgram.id,
      `Added program enrollment for client ID ${clientId} and program ID ${programData.programId}`,
      null,
      newProgram,
      {},
      { userId: options.userId }
    );

    // Return the created program enrollment
    return newProgram;
  }

  /**
   * Updates a client's program enrollment
   *
   * @param clientId Client ID
   * @param programId Program enrollment ID
   * @param programData Updated program enrollment data
   * @param options Repository options
   * @returns The updated program enrollment
   */
  async updateClientProgram(clientId: UUID, programId: UUID, programData: UpdateClientProgramDto, options: RepositoryOptions = {}): Promise<ClientProgram> {
    // Log the request to update a program enrollment
    logger.info(`updateClientProgram: Attempting to update program enrollment with ID ${programId} for client ID ${clientId}`, { programData, traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`updateClientProgram: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to update program enrollment
    const updatedProgram = await this.clientRepository.updateProgram(programId, programData, options);

    // Log data change using auditLogger.logDataChange with UPDATE event type
    auditLogger.logDataChange(
      AuditEventType.UPDATE,
      AuditResourceType.PROGRAM,
      programId,
      `Updated program enrollment with ID ${programId} for client ID ${clientId}`,
      null,
      updatedProgram,
      {},
      { userId: options.userId }
    );

    // Return the updated program enrollment
    return updatedProgram;
  }

  /**
   * Removes a program enrollment for a client
   *
   * @param clientId Client ID
   * @param programId Program enrollment ID
   * @param options Repository options
   * @returns True if the program enrollment was successfully removed
   */
  async removeClientProgram(clientId: UUID, programId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    // Log the request to remove a program enrollment
    logger.info(`removeClientProgram: Attempting to remove program enrollment with ID ${programId} for client ID ${clientId}`, { traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`removeClientProgram: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to remove program enrollment
    const success = await this.clientRepository.removeProgram(programId, options);

    // Log data change using auditLogger.logDataChange with DELETE event type
    auditLogger.logDataChange(
      AuditEventType.DELETE,
      AuditResourceType.PROGRAM,
      programId,
      `Removed program enrollment with ID ${programId} for client ID ${clientId}`,
      null,
      null,
      {},
      { userId: options.userId }
    );

    // Return true if successful
    return success;
  }

  /**
   * Adds insurance information for a client
   *
   * @param clientId Client ID
   * @param insuranceData Insurance information
   * @param options Repository options
   * @returns The created insurance information
   */
  async addClientInsurance(clientId: UUID, insuranceData: CreateClientInsuranceDto, options: RepositoryOptions = {}): Promise<ClientInsurance> {
    // Log the request to add insurance information
    logger.info(`addClientInsurance: Attempting to add insurance information for client ID ${clientId}`, { insuranceData, traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`addClientInsurance: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to add insurance information
    const newInsurance = await this.clientRepository.addInsurance(clientId, insuranceData, options);

    // Log data change using auditLogger.logDataChange with CREATE event type
    auditLogger.logDataChange(
      AuditEventType.CREATE,
      AuditResourceType.PAYER,
      newInsurance.id,
      `Added insurance information for client ID ${clientId} and payer ID ${insuranceData.payerId}`,
      null,
      newInsurance,
      {},
      { userId: options.userId }
    );

    // Return the created insurance information
    return newInsurance;
  }

  /**
   * Updates a client's insurance information
   *
   * @param clientId Client ID
   * @param insuranceId Insurance ID
   * @param insuranceData Updated insurance information
   * @param options Repository options
   * @returns The updated insurance information
   */
  async updateClientInsurance(clientId: UUID, insuranceId: UUID, insuranceData: UpdateClientInsuranceDto, options: RepositoryOptions = {}): Promise<ClientInsurance> {
    // Log the request to update insurance information
    logger.info(`updateClientInsurance: Attempting to update insurance information with ID ${insuranceId} for client ID ${clientId}`, { insuranceData, traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`updateClientInsurance: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to update insurance information
    const updatedInsurance = await this.clientRepository.updateInsurance(insuranceId, insuranceData, options);

    // Log data change using auditLogger.logDataChange with UPDATE event type
    auditLogger.logDataChange(
      AuditEventType.UPDATE,
      AuditResourceType.PAYER,
      insuranceId,
      `Updated insurance information with ID ${insuranceId} for client ID ${clientId}`,
      null,
      updatedInsurance,
      {},
      { userId: options.userId }
    );

    // Return the updated insurance information
    return updatedInsurance;
  }

  /**
   * Removes insurance information for a client
   *
   * @param clientId Client ID
   * @param insuranceId Insurance ID
   * @param options Repository options
   * @returns True if the insurance information was successfully removed
   */
  async removeClientInsurance(clientId: UUID, insuranceId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    // Log the request to remove insurance information
    logger.info(`removeClientInsurance: Attempting to remove insurance information with ID ${insuranceId} for client ID ${clientId}`, { traceId: options.traceId });

    // Verify the client exists
    const existingClient = await this.clientRepository.findById(clientId, options);
    if (!existingClient) {
      logger.warn(`removeClientInsurance: Client with ID ${clientId} not found`, { traceId: options.traceId });
      throw new NotFoundError('Client not found', 'Client', clientId);
    }

    // Call repository method to remove insurance information
    const success = await this.clientRepository.removeInsurance(insuranceId, options);

    // Log data change using auditLogger.logDataChange with DELETE event type
    auditLogger.logDataChange(
      AuditEventType.DELETE,
      AuditResourceType.PAYER,
      insuranceId,
      `Removed insurance information with ID ${insuranceId} for client ID ${clientId}`,
      null,
      null,
      {},
      { userId: options.userId }
    );

    // Return true if successful
    return success;
  }

  /**
   * Validates client data against business rules
   *
   * @param clientData Client data to validate
   * @returns Validation result with any error messages
   */
  validateClientData(clientData: Partial<Client>): { isValid: boolean; errors: string[] } {
    // Use clientModel to validate client data
    return this.clientModel.validate(clientData);
  }
}

// Export the ClientService class
export { ClientService };

// Export default of the ClientService class
export default ClientService;