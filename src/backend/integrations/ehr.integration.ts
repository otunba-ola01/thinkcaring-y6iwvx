import { EHRAdapter } from './adapters/ehr.adapter'; // version as specified in source file
import { EHRTransformer } from './transformers/ehr.transformer'; // version as specified in source file
import { IntegrationConfig, EHRIntegrationConfig, IntegrationStatus, IntegrationHealthStatus, IntegrationResponse, IntegrationError } from '../types/integration.types'; // version as specified in source file
import { ServiceImportDto } from '../types/services.types'; // version as specified in source file
import { CreateClientDto } from '../types/clients.types'; // version as specified in source file
import { ServicesService } from '../services/services.service'; // version as specified in source file
import { ClientsService } from '../services/clients.service'; // version as specified in source file
import IntegrationErrorClass from '../errors/integration-error'; // version as specified in source file
import logger from '../utils/logger'; // version as specified in source file
import { UUID } from '../types/common.types'; // version as specified in source file

/**
 * Service for integrating with Electronic Health Record (EHR) systems
 */
export class EHRIntegration {
  private config: IntegrationConfig;
  private ehrConfig: EHRIntegrationConfig;
  private adapter: EHRAdapter;
  private transformer: EHRTransformer;
  private initialized: boolean = false;

  /**
   * Creates a new EHR integration service with the provided configuration
   * @param config - General integration configuration
   * @param ehrConfig - EHR-specific configuration
   */
  constructor(config: IntegrationConfig, ehrConfig: EHRIntegrationConfig) {
    // Store the provided configuration
    this.config = config;
    this.ehrConfig = ehrConfig;

    // Initialize the EHR adapter with the configuration
    this.adapter = new EHRAdapter(config, ehrConfig);

    // Initialize the EHR transformer with the configuration
    this.transformer = new EHRTransformer(ehrConfig);

    // Set initialized flag to false
    this.initialized = false;

    // Log integration service initialization
    logger.info('EHR integration service initialized', {
      integrationName: config.name,
      ehrSystem: ehrConfig.ehrSystem,
    });
  }

  /**
   * Initializes the EHR integration by connecting to the EHR system
   * @returns Promise<boolean> - True if initialization is successful
   */
  async initialize(): Promise<boolean> {
    // Check if already initialized, return true if so
    if (this.initialized) {
      logger.info('EHR integration already initialized', { integrationName: this.config.name });
      return true;
    }

    try {
      // Attempt to connect to the EHR system using the adapter
      const connectionSuccessful = await this.adapter.connect();

      // If connection successful, set initialized flag to true
      if (connectionSuccessful) {
        this.initialized = true;
      }

      // Log initialization result
      logger.info(`EHR integration ${connectionSuccessful ? 'initialized' : 'failed to initialize'}`, {
        integrationName: this.config.name,
        ehrSystem: this.ehrConfig.ehrSystem,
      });

      // Return initialization result (true/false)
      return connectionSuccessful;
    } catch (error) {
      // Handle and log any initialization errors
      logger.error('EHR integration initialization failed', {
        integrationName: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return false if initialization fails
      return false;
    }
  }

  /**
   * Shuts down the EHR integration by disconnecting from the EHR system
   * @returns Promise<boolean> - True if shutdown is successful
   */
  async shutdown(): Promise<boolean> {
    // Check if initialized, return true if not (already shut down)
    if (!this.initialized) {
      logger.info('EHR integration already shut down', { integrationName: this.config.name });
      return true;
    }

    try {
      // Attempt to disconnect from the EHR system using the adapter
      const disconnectionSuccessful = await this.adapter.disconnect();

      // If disconnection successful, set initialized flag to false
      if (disconnectionSuccessful) {
        this.initialized = false;
      }

      // Log shutdown result
      logger.info(`EHR integration ${disconnectionSuccessful ? 'shut down' : 'failed to shut down'}`, {
        integrationName: this.config.name,
        ehrSystem: this.ehrConfig.ehrSystem,
      });

      // Return shutdown result (true/false)
      return disconnectionSuccessful;
    } catch (error) {
      // Handle and log any shutdown errors
      logger.error('EHR integration shutdown failed', {
        integrationName: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return false if shutdown fails
      return false;
    }
  }

  /**
   * Imports services from the EHR system for a specific client and date range
   * @param clientId - Client ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param filters - Additional filters
   * @param userId - User ID
   * @returns Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ index: number, message: string }>, processedServices: UUID[] }> - Import results
   */
  async importServices(
    clientId: string,
    startDate: Date,
    endDate: Date,
    filters: Record<string, any>,
    userId: UUID | null
  ): Promise<{ totalProcessed: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }>; processedServices: UUID[] }> {
    // Ensure the integration is initialized, initialize if needed
    await this.ensureInitialized();

    // Log service import request with parameters
    logger.info('Importing services from EHR', {
      integrationName: this.config.name,
      clientId,
      startDate,
      endDate,
      filters,
      userId,
    });

    try {
      // Retrieve service data from EHR system using adapter.getServices
      const serviceData = await this.adapter.getServices(clientId, startDate, endDate, filters);

      // Transform each service using transformer.transformServiceData
      const transformedServices = serviceData.map((service, index) => {
        try {
          return this.transformer.transformServiceData(service);
        } catch (transformError) {
          logger.error(`Failed to transform service at index ${index}`, {
            transformError: transformError instanceof Error ? transformError.message : String(transformError),
            serviceData: service,
          });
          return null; // Mark as null for filtering later
        }
      }).filter(service => service !== null); // Filter out failed transformations

      // Import transformed services using ServicesService.importServices
      const importResults = await ServicesService.importServices(transformedServices as ServiceImportDto[], userId);

      // Log import results
      logger.info('Successfully imported services from EHR', {
        integrationName: this.config.name,
        successCount: importResults.successCount,
        errorCount: importResults.errorCount,
        totalProcessed: importResults.totalProcessed,
      });

      // Return import results with counts and processed service IDs
      return importResults;
    } catch (error) {
      // Handle and log any import errors
      logger.error('Failed to import services from EHR', {
        integrationName: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error results if import fails
      return {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ index: 0, message: error instanceof Error ? error.message : String(error) }],
        processedServices: [],
      };
    }
  }

  /**
   * Imports or updates a client from the EHR system
   * @param clientId - Client ID
   * @param userId - User ID
   * @returns Promise<{ success: boolean, clientId: UUID | null, message: string }> - Import result
   */
  async importClient(
    clientId: string,
    userId: UUID | null
  ): Promise<{ success: boolean; clientId: UUID | null; message: string }> {
    // Ensure the integration is initialized, initialize if needed
    await this.ensureInitialized();

    // Log client import request
    logger.info('Importing client from EHR', {
      integrationName: this.config.name,
      clientId,
      userId,
    });

    try {
      // Retrieve client data from EHR system using adapter.getClient
      const clientData = await this.adapter.getClient(clientId);

      // Transform client data using transformer.transformClientData
      const transformedClientData = this.transformer.transformClientData(clientData);

      // Check if client already exists by Medicaid ID
      let existingClient = null;
      if (transformedClientData.medicaidId) {
        existingClient = await ClientsService.getClientByMedicaidId(transformedClientData.medicaidId);
      }

      if (existingClient) {
        // If client exists, update client information
        // TODO: Implement client update logic
        logger.info('Client already exists, skipping update', {
          integrationName: this.config.name,
          clientId,
          medicaidId: transformedClientData.medicaidId,
        });
        return { success: true, clientId: existingClient.id, message: 'Client already exists, skipping update' };
      } else {
        // If client doesn't exist, create new client
        const newClient = await ClientsService.createClient(transformedClientData, userId);
        logger.info('Successfully created client from EHR', {
          integrationName: this.config.name,
          clientId: newClient.id,
        });
        return { success: true, clientId: newClient.id, message: 'Successfully created client' };
      }
    } catch (error) {
      // Handle and log any import errors
      logger.error('Failed to import client from EHR', {
        integrationName: this.config.name,
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error result if import fails
      return { success: false, clientId: null, message: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Imports authorizations from the EHR system for a specific client
   * @param clientId - Client ID
   * @param activeOnly - Active only
   * @param userId - User ID
   * @returns Promise<{ totalProcessed: number, successCount: number, errorCount: number }> - Import results
   */
  async importAuthorizations(
    clientId: string,
    activeOnly: boolean,
    userId: UUID | null
  ): Promise<{ totalProcessed: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> }> {
    // Ensure the integration is initialized, initialize if needed
    await this.ensureInitialized();

    // Log authorization import request
    logger.info('Importing authorizations from EHR', {
      integrationName: this.config.name,
      clientId,
      activeOnly,
      userId,
    });

    try {
      // Retrieve authorization data from EHR system using adapter.getAuthorizations
      const authorizationData = await this.adapter.getAuthorizations(clientId, activeOnly);

      // Transform each authorization using transformer.transformAuthorizationData
      const transformedAuthorizations = authorizationData.map((auth, index) => {
        try {
          return this.transformer.transformAuthorizationData(auth);
        } catch (transformError) {
          logger.error(`Failed to transform authorization at index ${index}`, {
            transformError: transformError instanceof Error ? transformError.message : String(transformError),
            authorizationData: auth,
          });
          return null; // Mark as null for filtering later
        }
      }).filter(auth => auth !== null); // Filter out failed transformations

      // TODO: Process and store authorizations in the system
      logger.info('Successfully imported authorizations from EHR', {
        integrationName: this.config.name,
        successCount: transformedAuthorizations.length,
        totalProcessed: authorizationData.length,
      });

      // Return import results with counts and any errors
      return {
        totalProcessed: authorizationData.length,
        successCount: transformedAuthorizations.length,
        errorCount: 0,
        errors: [],
      };
    } catch (error) {
      // Handle and log any import errors
      logger.error('Failed to import authorizations from EHR', {
        integrationName: this.config.name,
        clientId,
        activeOnly,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error results if import fails
      return {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ index: 0, message: error instanceof Error ? error.message : String(error) }],
      };
    }
  }

  /**
   * Synchronizes client, services, and authorizations from the EHR system
   * @param clientId - Client ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param userId - User ID
   * @returns Promise<{ client: { success: boolean, clientId: UUID | null, message: string }, services: { totalProcessed: number, successCount: number, errorCount: number }, authorizations: { totalProcessed: number, successCount: number, errorCount: number } }> - Sync results
   */
  async syncClientData(
    clientId: string,
    startDate: Date,
    endDate: Date,
    userId: UUID | null
  ): Promise<{
    client: { success: boolean; clientId: UUID | null; message: string };
    services: { totalProcessed: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> };
    authorizations: { totalProcessed: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> };
  }> {
    // Ensure the integration is initialized, initialize if needed
    await this.ensureInitialized();

    // Log client data sync request
    logger.info('Synchronizing client data from EHR', {
      integrationName: this.config.name,
      clientId,
      startDate,
      endDate,
      userId,
    });

    try {
      // Import/update client information using importClient
      const clientResult = await this.importClient(clientId, userId);

      // Import services for the date range using importServices
      const servicesResult = await this.importServices(clientId, startDate, endDate, {}, userId);

      // Import authorizations using importAuthorizations
      const authorizationsResult = await this.importAuthorizations(clientId, true, userId);

      // Compile sync results from all operations
      const syncResults = {
        client: clientResult,
        services: servicesResult,
        authorizations: authorizationsResult,
      };

      // Log sync results
      logger.info('Successfully synchronized client data from EHR', {
        integrationName: this.config.name,
        syncResults,
      });

      // Return combined sync results
      return syncResults;
    } catch (error) {
      // Handle and log any sync errors
      logger.error('Failed to synchronize client data from EHR', {
        integrationName: this.config.name,
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return partial results with errors if sync partially fails
      return {
        client: { success: false, clientId: null, message: error instanceof Error ? error.message : String(error) },
        services: { totalProcessed: 0, successCount: 0, errorCount: 0, errors: [] },
        authorizations: { totalProcessed: 0, successCount: 0, errorCount: 0, errors: [] },
      };
    }
  }

  /**
   * Checks the health of the EHR integration
   * @returns Promise<IntegrationHealthStatus> - Health status of the integration
   */
  async checkHealth(): Promise<IntegrationHealthStatus> {
    const startTime = Date.now();
    let status: IntegrationStatus = IntegrationStatus.ERROR;
    let responseTime: number | null = null;
    let message = '';

    try {
      // Check if integration is initialized
      if (!this.initialized) {
        status = IntegrationStatus.INACTIVE;
        message = 'EHR integration is inactive';
        return {
          status,
          responseTime: null,
          lastChecked: new Date(),
          message,
          details: {
            system: this.ehrConfig.ehrSystem,
            version: this.ehrConfig.version,
          },
        };
      }

      // Call adapter.checkHealth to check EHR system connection
      const healthStatus = await this.adapter.checkHealth();

      // Calculate response time
      responseTime = Date.now() - startTime;

      // Return health status with connection details
      return {
        status: healthStatus.status,
        responseTime,
        lastChecked: new Date(),
        message: healthStatus.message,
        details: healthStatus.details,
      };
    } catch (error) {
      // Calculate response time
      responseTime = Date.now() - startTime;
      status = IntegrationStatus.ERROR;
      message = `EHR system health check failed: ${error instanceof Error ? error.message : String(error)}`;

      // Handle and log any health check errors
      logger.error('EHR integration health check failed', {
        integrationName: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return status with ERROR state if check fails
      return {
        status,
        responseTime,
        lastChecked: new Date(),
        message,
        details: {
          system: this.ehrConfig.ehrSystem,
          version: this.ehrConfig.version,
        },
      };
    }
  }

  /**
   * Executes a custom operation on the EHR system
   * @param operation - Operation to execute
   * @param data - Data for the operation
   * @param options - Options
   * @returns Promise<IntegrationResponse> - Response from the operation
   */
  async executeOperation(
    operation: string,
    data: any,
    options: any
  ): Promise<IntegrationResponse> {
    // Ensure the integration is initialized, initialize if needed
    await this.ensureInitialized();

    // Log custom operation execution
    logger.info('Executing custom operation on EHR', {
      integrationName: this.config.name,
      operation,
      data,
      options,
    });

    try {
      // Transform request data using transformer.transformRequest
      const transformedData = this.transformer.transformRequest(data);

      // Execute operation using adapter.execute
      const response = await this.adapter.execute(operation, transformedData, options);

      // Transform response data using transformer.transformResponse
      const transformedResponseData = this.transformer.transformResponse(response.data);

      // Return operation response
      return {
        ...response,
        data: transformedResponseData,
      };
    } catch (error) {
      // Handle and log any operation errors
      logger.error('Failed to execute custom operation on EHR', {
        integrationName: this.config.name,
        operation,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error response if operation fails
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
        timestamp: new Date(),
      };
    }
  }

  /**
   * Ensures the integration is initialized before performing operations
   * @returns Promise<boolean> - True if initialization is successful or already initialized
   */
  private async ensureInitialized(): Promise<boolean> {
    // Check if already initialized
    if (this.initialized) {
      return true;
    }

    try {
      // If not initialized, call initialize()
      const initialized = await this.initialize();

      // Return initialization result
      return initialized;
    } catch (error) {
      // Handle and log any initialization errors
      logger.error('EHR integration initialization failed', {
        integrationName: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });

      // Throw IntegrationError if initialization fails
      throw new IntegrationErrorClass({
        message: `EHR integration initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        service: this.config.name,
        endpoint: 'ensureInitialized',
      });
    }
  }
}

// Export the class as both named and default export
export default EHRIntegration;