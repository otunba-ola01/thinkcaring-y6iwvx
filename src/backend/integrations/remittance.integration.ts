import * as cron from 'node-cron'; // version 3.0.2
import * as fs from 'fs-extra'; // version 11.1.0
import * as path from 'path'; // version 0.12.7
import axios from 'axios'; // version 1.4.0
import * as SftpClient from 'ssh2-sftp-client'; // version 9.1.0

import { 
  UUID, 
  ISO8601Date 
} from '../types/common.types';
import { 
  IntegrationType, 
  IntegrationProtocol, 
  IntegrationStatus, 
  DataFormat, 
  IntegrationConfig,
  RemittanceIntegrationConfig,
  IntegrationAdapter,
  IntegrationRequestOptions,
  IntegrationResponse,
  IntegrationHealthStatus
} from '../types/integration.types';
import {
  RemittanceInfo,
  RemittanceDetail,
  RemittanceFileType,
  RemittanceProcessingResult
} from '../types/payments.types';
import RemittanceAdapter from './adapters/remittance.adapter';
import { remittanceTransformer } from './transformers/remittance.transformer';
import { remittanceProcessingService } from '../services/payments/remittance-processing.service';
import IntegrationError from '../errors/integration-error';
import logger from '../utils/logger';

/**
 * Integration service for processing electronic remittance advice files from various sources
 */
export class RemittanceIntegration {
  private configs: IntegrationConfig[];
  private adapters: Map<UUID, RemittanceAdapter>;
  private remittanceConfigs: Map<UUID, RemittanceIntegrationConfig>;
  private initialized: boolean;
  private scheduledJobs: any;

  /**
   * Creates a new RemittanceIntegration instance
   */
  constructor() {
    this.configs = [];
    this.adapters = new Map<UUID, RemittanceAdapter>();
    this.remittanceConfigs = new Map<UUID, RemittanceIntegrationConfig>();
    this.initialized = false;
    this.scheduledJobs = {};

    logger.info('RemittanceIntegration service initialized');
  }

  /**
   * Initializes the remittance integration with configuration
   * @param configs - Array of integration configurations
   */
  async initialize(configs: IntegrationConfig[]): Promise<void> {
    try {
      this.configs = configs;
      const remittanceConfigs = configs.filter(config => config.type === IntegrationType.REMITTANCE);

      for (const config of remittanceConfigs) {
        const remittanceConfig = config as RemittanceIntegrationConfig;
        const adapter = new RemittanceAdapter(config, remittanceConfig);
        await adapter.connect();
        this.adapters.set(config.id, adapter);
        this.remittanceConfigs.set(config.id, remittanceConfig);
      }

      this.initialized = true;
      logger.info('RemittanceIntegration service initialized successfully');
    } catch (error) {
      logger.error('Error initializing RemittanceIntegration service', { error });
      throw new IntegrationError({
        message: `Failed to initialize RemittanceIntegration service: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'initialize',
        retryable: false
      });
    }
  }

  /**
   * Lists available remittance files from a specific source
   * @param configId - UUID of the integration configuration
   * @param fromDate - Start date for filtering files
   * @param toDate - End date for filtering files
   * @param options - Integration request options
   */
  async listAvailableFiles(
    configId: UUID,
    fromDate: Date,
    toDate: Date,
    options: IntegrationRequestOptions
  ): Promise<Array<{ fileName: string; fileDate: Date; fileSize: number }>> {
    this.ensureInitialized();
    const adapter = this.getAdapter(configId);
    try {
      const files = await adapter.execute('listFiles', { fromDate, toDate }, options);
      return files.data;
    } catch (error) {
      logger.error('Error listing available files', { configId, error });
      throw new IntegrationError({
        message: `Failed to list available files: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'listAvailableFiles',
        retryable: true
      });
    }
  }

  /**
   * Retrieves a specific remittance file from a source
   * @param configId - UUID of the integration configuration
   * @param fileName - Name of the file to retrieve
   * @param options - Integration request options
   */
  async retrieveFile(
    configId: UUID,
    fileName: string,
    options: IntegrationRequestOptions
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    this.ensureInitialized();
    const adapter = this.getAdapter(configId);
    try {
      const file = await adapter.execute('getFile', { fileName }, options);
      return file.data;
    } catch (error) {
      logger.error('Error retrieving file', { configId, fileName, error });
      throw new IntegrationError({
        message: `Failed to retrieve file: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'retrieveFile',
        retryable: true
      });
    }
  }

  /**
   * Processes a remittance file and creates payment records
   * @param configId - UUID of the integration configuration
   * @param payerId - UUID of the payer associated with the remittance
   * @param fileContent - Content of the remittance file
   * @param fileFormat - Format of the remittance file
   * @param fileName - Name of the remittance file
   * @param options - Integration request options
   */
  async processFile(
    configId: UUID,
    payerId: UUID,
    fileContent: string,
    fileFormat: DataFormat,
    fileName: string,
    options: IntegrationRequestOptions
  ): Promise<RemittanceProcessingResult> {
    this.ensureInitialized();
    const adapter = this.getAdapter(configId);
    try {
      const processingResult = await remittanceProcessingService.processRemittanceFile({
        payerId,
        fileContent,
        fileType: this.mapFileTypeToDataFormat(fileFormat),
        originalFilename: fileName,
        mappingConfig: null
      }, options);
      return processingResult;
    } catch (error) {
      logger.error('Error processing file', { configId, fileName, error });
      throw new IntegrationError({
        message: `Failed to process file: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'processFile',
        retryable: false
      });
    }
  }

  /**
   * Archives a processed remittance file
   * @param configId - UUID of the integration configuration
   * @param fileName - Name of the file to archive
   * @param processed - Whether the file was successfully processed
   * @param options - Integration request options
   */
  async archiveFile(
    configId: UUID,
    fileName: string,
    processed: boolean,
    options: IntegrationRequestOptions
  ): Promise<boolean> {
    this.ensureInitialized();
    const adapter = this.getAdapter(configId);
    try {
      const result = await adapter.execute('archiveFile', { fileName, processed }, options);
      return result.success;
    } catch (error) {
      logger.error('Error archiving file', { configId, fileName, processed, error });
      throw new IntegrationError({
        message: `Failed to archive file: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'archiveFile',
        retryable: true
      });
    }
  }

  /**
   * Checks the health of remittance integration sources
   * @param configId - UUID of the integration configuration
   */
  async checkHealth(configId?: UUID): Promise<IntegrationHealthStatus> {
    this.ensureInitialized();
    try {
      if (configId) {
        const adapter = this.getAdapter(configId);
        return await adapter.checkHealth();
      } else {
        let overallStatus = IntegrationStatus.ACTIVE;
        let details = {};
        for (const [id, adapter] of this.adapters) {
          const health = await adapter.checkHealth();
          details[id] = health;
          if (health.status !== IntegrationStatus.ACTIVE) {
            overallStatus = IntegrationStatus.ERROR;
          }
        }
        return {
          status: overallStatus,
          responseTime: null,
          lastChecked: new Date(),
          message: `Overall health: ${overallStatus}`,
          details: details
        };
      }
    } catch (error) {
      logger.error('Error checking health', { configId, error });
      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Processes all available remittance files from a source
   * @param configId - UUID of the integration configuration
   * @param payerId - UUID of the payer associated with the remittance
   * @param fromDate - Start date for filtering files
   * @param toDate - End date for filtering files
   * @param options - Integration request options
   */
  async processAvailableFiles(
    configId: UUID,
    payerId: UUID,
    fromDate: Date,
    toDate: Date,
    options: IntegrationRequestOptions
  ): Promise<Array<{ fileName: string; result: RemittanceProcessingResult | null; error: Error | null }>> {
    this.ensureInitialized();
    try {
      const files = await this.listAvailableFiles(configId, fromDate, toDate, options);
      const results: Array<{ fileName: string; result: RemittanceProcessingResult | null; error: Error | null }> = [];

      for (const file of files) {
        try {
          const { content, metadata } = await this.retrieveFile(configId, file.fileName, options);
          const result = await this.processFile(configId, payerId, content, metadata.fileFormat, file.fileName, options);
          await this.archiveFile(configId, file.fileName, true, options);
          results.push({ fileName: file.fileName, result: result, error: null });
        } catch (error) {
          logger.error(`Error processing file ${file.fileName}`, { configId, error });
          results.push({ fileName: file.fileName, result: null, error: error });
          try {
            await this.archiveFile(configId, file.fileName, false, options);
          } catch (archiveError) {
            logger.error(`Error archiving file ${file.fileName} after processing failure`, { configId, archiveError });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Error processing available files', { configId, error });
      throw new IntegrationError({
        message: `Failed to process available files: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'processAvailableFiles',
        retryable: false
      });
    }
  }

  /**
   * Schedules periodic processing of remittance files
   * @param configId - UUID of the integration configuration
   * @param payerId - UUID of the payer associated with the remittance
   * @param cronExpression - Cron expression for scheduling
   */
  async scheduleProcessing(configId: UUID, payerId: UUID, cronExpression: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      // Validate cron expression format
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression format');
      }

      // Cancel existing job if it exists
      if (this.scheduledJobs[configId]) {
        this.cancelScheduledProcessing(configId);
      }

      // Schedule new job using node-cron
      this.scheduledJobs[configId] = cron.schedule(cronExpression, async () => {
        logger.info(`Running scheduled processing for config ${configId}`);
        try {
          // TODO: Implement options
          await this.processAvailableFiles(configId, payerId, new Date(), new Date(), {
            timeout: 5000,
            retryCount: 3,
            retryDelay: 1000,
            headers: {},
            correlationId: '',
            priority: 0
          });
        } catch (error) {
          logger.error(`Error running scheduled processing for config ${configId}`, { error });
        }
      });

      logger.info(`Scheduled processing for config ${configId} with expression ${cronExpression}`);
      return true;
    } catch (error) {
      logger.error('Error scheduling processing', { configId, cronExpression, error });
      throw new IntegrationError({
        message: `Failed to schedule processing: ${error.message}`,
        service: 'RemittanceIntegration',
        endpoint: 'scheduleProcessing',
        retryable: false
      });
    }
  }

  /**
   * Cancels scheduled processing for a specific configuration
   * @param configId - UUID of the integration configuration
   */
  cancelScheduledProcessing(configId: UUID): boolean {
    if (this.scheduledJobs[configId]) {
      this.scheduledJobs[configId].stop();
      delete this.scheduledJobs[configId];
      logger.info(`Cancelled scheduled processing for config ${configId}`);
      return true;
    }
    return false;
  }

  /**
   * Gets the remittance adapter for a specific configuration
   * @param configId - UUID of the integration configuration
   */
  private getAdapter(configId: UUID): RemittanceAdapter {
    this.ensureInitialized();
    const adapter = this.adapters.get(configId);
    if (!adapter) {
      throw new IntegrationError({
        message: `Remittance adapter not found for config ID: ${configId}`,
        service: 'RemittanceIntegration',
        endpoint: 'getAdapter',
        retryable: false
      });
    }
    return adapter;
  }

  /**
   * Ensures the integration service is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new IntegrationError({
        message: 'RemittanceIntegration service not initialized',
        service: 'RemittanceIntegration',
        endpoint: 'ensureInitialized',
        retryable: false
      });
    }
  }

  /**
   * Determines the format of a remittance file based on filename or content
   * @param fileName - Name of the file
   * @param fileContent - Content of the file
   */
  private determineFileFormat(fileName: string, fileContent: string): DataFormat {
    // Check file extension first
    const extension = path.extname(fileName).toLowerCase();
    if (extension === '.835') {
      return DataFormat.X12;
    } else if (extension === '.csv') {
      return DataFormat.CSV;
    } else if (extension === '.json') {
      return DataFormat.JSON;
    }

    // If extension is not clear, examine file content
    if (fileContent.startsWith('ISA')) {
      return DataFormat.X12;
    } else if (fileContent.trim().startsWith('{')) {
      try {
        JSON.parse(fileContent);
        return DataFormat.JSON;
      } catch (e) {
        // Not valid JSON
      }
    }

    // Check for CSV structure (comma-separated values)
    const lines = fileContent.split('\n');
    if (lines.length > 1) {
      const commaCount = lines[0].split(',').length;
      // If multiple lines have same number of commas, likely CSV
      if (commaCount > 1 && lines[1].split(',').length === commaCount) {
        return DataFormat.CSV;
      }
    }

    logger.warn(`Unable to determine file format for ${fileName}, defaulting to CUSTOM`);
    return DataFormat.CUSTOM;
  }

  /**
   * Maps RemittanceFileType to DataFormat for internal use
   * @param fileType - Remittance file type
   */
  private mapFileTypeToDataFormat(fileType: RemittanceFileType): DataFormat {
    switch (fileType) {
      case RemittanceFileType.EDI_835:
        return DataFormat.X12;
      case RemittanceFileType.CSV:
        return DataFormat.CSV;
      case RemittanceFileType.EXCEL:
      case RemittanceFileType.PDF:
      case RemittanceFileType.CUSTOM:
        return DataFormat.CUSTOM;
      default:
        return DataFormat.CUSTOM;
    }
  }
}

// Create a singleton instance of the integration service
const remittanceIntegration = new RemittanceIntegration();

// Export the class and the singleton instance
export { RemittanceIntegration, remittanceIntegration };