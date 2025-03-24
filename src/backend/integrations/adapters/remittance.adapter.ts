import * as fs from 'fs-extra'; // version 11.1.0
import * as path from 'path'; // version 0.12.7
import axios from 'axios'; // version 1.4.0
import * as SftpClient from 'ssh2-sftp-client'; // version 9.1.0

import { 
  UUID, 
  ISO8601Date 
} from '../../types/common.types';
import { 
  IntegrationType, 
  IntegrationProtocol, 
  IntegrationStatus, 
  DataFormat, 
  IntegrationConfig,
  RemittanceIntegrationConfig,
  IntegrationHealthStatus,
  IntegrationAdapter,
  IntegrationRequestOptions,
  IntegrationResponse
} from '../../types/integration.types';
import {
  RemittanceInfo,
  RemittanceDetail,
  RemittanceFileType
} from '../../types/payments.types';
import { IntegrationError } from '../../errors/integration-error';
import logger from '../../utils/logger';
import {
  formatDate,
  parseDate
} from '../../utils/date';

/**
 * Adapter for processing remittance files from various sources including
 * file systems, SFTP servers, and APIs.
 * 
 * Implements the IntegrationAdapter interface for standardized integration handling
 * with concrete implementation for remittance processing.
 */
export class RemittanceAdapter implements IntegrationAdapter {
  private config: IntegrationConfig;
  private remittanceConfig: RemittanceIntegrationConfig;
  private connected: boolean;
  private sftpClient: any;
  private httpClient: any;

  /**
   * Creates a new RemittanceAdapter instance
   * 
   * @param config - Base integration configuration
   * @param remittanceConfig - Remittance-specific configuration
   */
  constructor(config: IntegrationConfig, remittanceConfig: RemittanceIntegrationConfig) {
    this.config = config;
    this.remittanceConfig = remittanceConfig;
    this.connected = false;
    
    // Initialize appropriate client based on protocol
    if (this.config.protocol === IntegrationProtocol.SFTP) {
      this.sftpClient = new SftpClient();
    } else if (this.config.protocol === IntegrationProtocol.REST || this.config.protocol === IntegrationProtocol.SOAP) {
      this.httpClient = axios.create({
        baseURL: this.config.baseUrl,
        headers: this.config.headers,
        timeout: this.config.timeout
      });
    }
    
    logger.info('RemittanceAdapter initialized', { 
      integrationId: this.config.id,
      protocol: this.config.protocol,
      sourceType: this.remittanceConfig.sourceType
    });
  }

  /**
   * Establishes connection to the remittance source
   * 
   * @returns Promise resolving to true if connection was successful
   * @throws IntegrationError if connection fails
   */
  public async connect(): Promise<boolean> {
    try {
      // If already connected, return true
      if (this.connected) {
        logger.debug('Already connected to remittance source', { 
          integrationId: this.config.id 
        });
        return true;
      }

      logger.info('Connecting to remittance source', { 
        integrationId: this.config.id,
        protocol: this.config.protocol
      });

      switch (this.config.protocol) {
        case IntegrationProtocol.SFTP:
          await this.sftpClient.connect({
            host: new URL(this.config.baseUrl).hostname,
            port: new URL(this.config.baseUrl).port ? parseInt(new URL(this.config.baseUrl).port) : 22,
            username: this.config.credentials.username,
            password: this.config.credentials.password,
            privateKey: this.config.credentials.privateKey
          });
          break;
          
        case IntegrationProtocol.REST:
        case IntegrationProtocol.SOAP:
          // Test connection with a basic request
          const response = await this.httpClient.get('/', {
            validateStatus: () => true
          });
          
          if (response.status >= 400) {
            throw new Error(`HTTP connection test failed with status ${response.status}`);
          }
          break;
          
        case IntegrationProtocol.FILE:
          // Validate that required directories exist and are accessible
          await this.validateDirectories();
          break;
          
        default:
          throw new Error(`Unsupported protocol: ${this.config.protocol}`);
      }

      this.connected = true;
      logger.info('Successfully connected to remittance source', { 
        integrationId: this.config.id 
      });
      
      return true;
    } catch (error) {
      this.connected = false;
      const message = error instanceof Error ? error.message : 'Unknown error during connection';
      logger.error('Failed to connect to remittance source', { 
        integrationId: this.config.id,
        protocol: this.config.protocol,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to connect to remittance source: ${message}`,
        service: this.config.name,
        endpoint: this.config.baseUrl,
        retryable: true
      });
    }
  }

  /**
   * Closes connection to the remittance source
   * 
   * @returns Promise resolving to true if disconnection was successful
   * @throws IntegrationError if disconnection fails
   */
  public async disconnect(): Promise<boolean> {
    try {
      if (!this.connected) {
        logger.debug('Already disconnected from remittance source', { 
          integrationId: this.config.id 
        });
        return true;
      }

      logger.info('Disconnecting from remittance source', { 
        integrationId: this.config.id 
      });

      if (this.config.protocol === IntegrationProtocol.SFTP && this.sftpClient) {
        await this.sftpClient.end();
      }
      
      // For other protocols, no specific disconnection needed
      
      this.connected = false;
      logger.info('Successfully disconnected from remittance source', { 
        integrationId: this.config.id 
      });
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during disconnection';
      logger.error('Failed to disconnect from remittance source', { 
        integrationId: this.config.id,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to disconnect from remittance source: ${message}`,
        service: this.config.name,
        endpoint: this.config.baseUrl,
        retryable: false
      });
    }
  }

  /**
   * Executes an operation on the remittance source
   * 
   * @param operation - Operation to execute
   * @param data - Data for the operation
   * @param options - Request options
   * @returns Promise resolving to operation response
   */
  public async execute(
    operation: string, 
    data: any = {}, 
    options: IntegrationRequestOptions = { 
      timeout: this.config.timeout, 
      retryCount: 0, 
      retryDelay: 1000, 
      headers: {}, 
      correlationId: '', 
      priority: 0 
    }
  ): Promise<IntegrationResponse> {
    try {
      // Ensure connection is established
      if (!this.connected) {
        await this.connect();
      }

      logger.debug(`Executing remittance operation: ${operation}`, {
        integrationId: this.config.id,
        correlationId: options.correlationId
      });

      let result: any;
      
      // Map operation to appropriate method
      switch (operation) {
        case 'listFiles':
          result = await this.listRemittanceFiles(
            data.fromDate ? parseDate(data.fromDate) : undefined,
            data.toDate ? parseDate(data.toDate) : undefined
          );
          break;
          
        case 'getFile':
          result = await this.getRemittanceFile(data.fileName);
          break;
          
        case 'processFile':
          result = await this.processRemittanceFile(data.fileContent, data.fileFormat);
          break;
          
        case 'archiveFile':
          result = await this.archiveRemittanceFile(data.fileName, data.processed);
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        statusCode: 200,
        data: result,
        error: null,
        metadata: {
          timestamp: new Date(),
          operation,
          correlationId: options.correlationId
        }
      };
    } catch (error) {
      logger.error(`Error executing remittance operation: ${operation}`, {
        integrationId: this.config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: options.correlationId
      });
      
      const integrationError = error instanceof IntegrationError 
        ? error 
        : new IntegrationError({
            message: error instanceof Error ? error.message : 'Unknown integration error',
            service: this.config.name,
            endpoint: `${this.config.baseUrl}/${operation}`,
            retryable: options.retryCount < this.config.retryLimit
          });
      
      return {
        success: false,
        statusCode: integrationError.statusCode || 500,
        data: null,
        error: {
          code: integrationError.code,
          message: integrationError.message,
          category: integrationError.category,
          details: integrationError.getIntegrationDetails(),
          timestamp: new Date(),
          retryable: integrationError.isRetryable()
        },
        metadata: {
          timestamp: new Date(),
          operation,
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Lists available remittance files from the source
   * 
   * @param fromDate - Optional start date for filtering files
   * @param toDate - Optional end date for filtering files
   * @returns Promise resolving to list of available files with metadata
   * @throws IntegrationError if listing fails
   */
  public async listRemittanceFiles(
    fromDate?: Date,
    toDate?: Date
  ): Promise<Array<{ fileName: string; fileDate: Date; fileSize: number }>> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      logger.info('Listing remittance files', {
        integrationId: this.config.id,
        fromDate: fromDate ? formatDate(fromDate) : undefined,
        toDate: toDate ? formatDate(toDate) : undefined
      });

      let files: Array<{ fileName: string; fileDate: Date; fileSize: number }> = [];

      switch (this.config.protocol) {
        case IntegrationProtocol.FILE:
          // List files in the import directory
          const dirContents = await fs.readdir(this.remittanceConfig.importDirectory);
          
          for (const fileName of dirContents) {
            const filePath = path.join(this.remittanceConfig.importDirectory, fileName);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              files.push({
                fileName,
                fileDate: stats.mtime,
                fileSize: stats.size
              });
            }
          }
          break;
          
        case IntegrationProtocol.SFTP:
          // List files in the remote directory
          const remoteFiles = await this.sftpClient.list(
            new URL(this.config.baseUrl).pathname || '/'
          );
          
          files = remoteFiles
            .filter(item => item.type === '-') // Only regular files
            .map(item => ({
              fileName: item.name,
              fileDate: new Date(item.modifyTime),
              fileSize: item.size
            }));
          break;
          
        case IntegrationProtocol.REST:
        case IntegrationProtocol.SOAP:
          // Call API endpoint to get file list
          const response = await this.httpClient.get('/files', {
            params: {
              fromDate: fromDate ? formatDate(fromDate) : undefined,
              toDate: toDate ? formatDate(toDate) : undefined
            }
          });
          
          if (response.data && Array.isArray(response.data)) {
            files = response.data.map(file => ({
              fileName: file.name,
              fileDate: new Date(file.date),
              fileSize: file.size
            }));
          }
          break;
          
        default:
          throw new Error(`Unsupported protocol: ${this.config.protocol}`);
      }

      // Filter files by date range if specified
      if (fromDate || toDate) {
        files = files.filter(file => {
          if (fromDate && file.fileDate < fromDate) {
            return false;
          }
          if (toDate && file.fileDate > toDate) {
            return false;
          }
          return true;
        });
      }

      // Filter files by expected extensions
      const validExtensions = ['.835', '.txt', '.csv', '.json'];
      files = files.filter(file => {
        const ext = path.extname(file.fileName).toLowerCase();
        return validExtensions.includes(ext) || 
               file.fileName.toLowerCase().includes('remit') ||
               file.fileName.toLowerCase().includes('era');
      });

      // Sort files by date (newest first)
      files.sort((a, b) => b.fileDate.getTime() - a.fileDate.getTime());

      logger.info(`Found ${files.length} remittance files`, {
        integrationId: this.config.id
      });

      return files;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error listing remittance files';
      logger.error('Failed to list remittance files', {
        integrationId: this.config.id,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to list remittance files: ${message}`,
        service: this.config.name,
        endpoint: this.config.baseUrl,
        retryable: true
      });
    }
  }

  /**
   * Retrieves a specific remittance file from the source
   * 
   * @param fileName - Name of the file to retrieve
   * @returns Promise resolving to file content and metadata
   * @throws IntegrationError if retrieval fails
   */
  public async getRemittanceFile(
    fileName: string
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      logger.info(`Retrieving remittance file: ${fileName}`, {
        integrationId: this.config.id
      });

      let content: string = '';
      let metadata: Record<string, any> = {};

      switch (this.config.protocol) {
        case IntegrationProtocol.FILE:
          // Read file from the import directory
          const filePath = path.join(this.remittanceConfig.importDirectory, fileName);
          content = await fs.readFile(filePath, 'utf8');
          
          const stats = await fs.stat(filePath);
          metadata = {
            size: stats.size,
            modified: stats.mtime,
            created: stats.ctime
          };
          break;
          
        case IntegrationProtocol.SFTP:
          // Download file from SFTP server
          const remotePath = path.join(
            new URL(this.config.baseUrl).pathname || '/',
            fileName
          );
          
          content = await this.sftpClient.get(remotePath);
          
          const fileInfo = await this.sftpClient.stat(remotePath);
          metadata = {
            size: fileInfo.size,
            modified: new Date(fileInfo.modifyTime)
          };
          break;
          
        case IntegrationProtocol.REST:
        case IntegrationProtocol.SOAP:
          // Call API endpoint to get file content
          const response = await this.httpClient.get(`/files/${fileName}`);
          
          content = typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data);
            
          metadata = {
            size: content.length,
            modified: new Date(),
            responseHeaders: response.headers
          };
          break;
          
        default:
          throw new Error(`Unsupported protocol: ${this.config.protocol}`);
      }

      // Determine file type based on content or extension
      const fileFormat = this.determineFileFormat(fileName, content);
      metadata.fileFormat = fileFormat;
      metadata.remittanceFileType = this.mapRemittanceFileType(fileFormat);

      logger.info(`Successfully retrieved remittance file: ${fileName}`, {
        integrationId: this.config.id,
        fileSize: content.length,
        fileFormat
      });

      return { content, metadata };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error retrieving remittance file';
      logger.error(`Failed to retrieve remittance file: ${fileName}`, {
        integrationId: this.config.id,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to retrieve remittance file ${fileName}: ${message}`,
        service: this.config.name,
        endpoint: `${this.config.baseUrl}/${fileName}`,
        retryable: true
      });
    }
  }

  /**
   * Processes a remittance file and extracts structured data
   * This method delegates actual processing to a remittance transformer
   * 
   * @param fileContent - Content of the file to process
   * @param fileFormat - Format of the file
   * @returns Promise resolving to structured remittance data
   * @throws IntegrationError if processing fails
   */
  public async processRemittanceFile(
    fileContent: string,
    fileFormat: DataFormat
  ): Promise<{ header: RemittanceInfo; details: RemittanceDetail[] }> {
    try {
      logger.info('Processing remittance file', {
        integrationId: this.config.id,
        fileFormat,
        contentLength: fileContent.length
      });

      // Validate file content and format
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error('Empty file content provided');
      }

      // In a complete implementation, this would delegate to a transformer service
      // For this adapter, we'll throw an error indicating the need for a transformer
      logger.debug('Delegating remittance processing to transformer service', {
        integrationId: this.config.id,
        fileFormat
      });

      // This is a placeholder - in a real implementation, we would call the appropriate
      // transformer based on the file format. Since we don't have that implementation,
      // we'll throw an error to indicate that this is not implemented.
      throw new Error('Remittance processing requires implementation of a transformer service');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error processing remittance file';
      logger.error('Failed to process remittance file', {
        integrationId: this.config.id,
        fileFormat,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to process remittance file: ${message}`,
        service: this.config.name,
        endpoint: 'processRemittanceFile',
        retryable: false
      });
    }
  }

  /**
   * Archives a processed remittance file
   * 
   * @param fileName - Name of the file to archive
   * @param processed - Whether the file was successfully processed
   * @returns Promise resolving to true if archiving was successful
   * @throws IntegrationError if archiving fails
   */
  public async archiveRemittanceFile(
    fileName: string,
    processed: boolean = true
  ): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      logger.info(`Archiving remittance file: ${fileName}`, {
        integrationId: this.config.id,
        processed
      });

      // Determine target directory based on processed flag
      const targetDir = processed 
        ? this.remittanceConfig.archiveDirectory 
        : this.remittanceConfig.errorDirectory;

      switch (this.config.protocol) {
        case IntegrationProtocol.FILE:
          // Move file to appropriate directory
          const sourcePath = path.join(this.remittanceConfig.importDirectory, fileName);
          
          // Add timestamp to filename to avoid collisions
          const timestamp = new Date().toISOString()
            .replace(/:/g, '')
            .replace(/-/g, '')
            .replace(/\./g, '');
            
          const archiveFileName = `${path.parse(fileName).name}_${timestamp}${path.parse(fileName).ext}`;
          const finalPath = path.join(targetDir, archiveFileName);
          
          await fs.move(sourcePath, finalPath, { overwrite: false });
          break;
          
        case IntegrationProtocol.SFTP:
          if (this.remittanceConfig.archiveProcessedFiles) {
            const sourcePath = path.join(
              new URL(this.config.baseUrl).pathname || '/',
              fileName
            );
            
            // Download file then delete from source
            const content = await this.sftpClient.get(sourcePath);
            
            const timestamp = new Date().toISOString()
              .replace(/:/g, '')
              .replace(/-/g, '')
              .replace(/\./g, '');
              
            const archiveFileName = `${path.parse(fileName).name}_${timestamp}${path.parse(fileName).ext}`;
            const localPath = path.join(targetDir, archiveFileName);
            
            await fs.writeFile(localPath, content);
            await this.sftpClient.delete(sourcePath);
          }
          break;
          
        case IntegrationProtocol.REST:
        case IntegrationProtocol.SOAP:
          // Call API endpoint to mark file as processed
          await this.httpClient.post(`/files/${fileName}/archive`, {
            processed
          });
          break;
          
        default:
          throw new Error(`Unsupported protocol: ${this.config.protocol}`);
      }

      logger.info(`Successfully archived remittance file: ${fileName}`, {
        integrationId: this.config.id,
        processed
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error archiving remittance file';
      logger.error(`Failed to archive remittance file: ${fileName}`, {
        integrationId: this.config.id,
        processed,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to archive remittance file ${fileName}: ${message}`,
        service: this.config.name,
        endpoint: `${this.config.baseUrl}/${fileName}`,
        retryable: true
      });
    }
  }

  /**
   * Checks the health of the remittance integration
   * 
   * @returns Promise resolving to health status of the integration
   */
  public async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      const startTime = Date.now();
      
      // Attempt to connect if not already connected
      if (!this.connected) {
        await this.connect();
      }

      // Perform protocol-specific health checks
      switch (this.config.protocol) {
        case IntegrationProtocol.FILE:
          // Verify read/write access to directories
          await this.validateDirectories();
          break;
          
        case IntegrationProtocol.SFTP:
          // Test connection and directory listing
          await this.sftpClient.list(
            new URL(this.config.baseUrl).pathname || '/'
          );
          break;
          
        case IntegrationProtocol.REST:
        case IntegrationProtocol.SOAP:
          // Test endpoint availability
          await this.httpClient.get('/health', {
            validateStatus: () => true
          });
          break;
      }

      const responseTime = Date.now() - startTime;

      return {
        status: IntegrationStatus.ACTIVE,
        responseTime,
        lastChecked: new Date(),
        message: 'Integration healthy',
        details: {
          protocol: this.config.protocol,
          connected: this.connected
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error checking health';
      logger.error('Health check failed', {
        integrationId: this.config.id,
        error: message
      });
      
      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${message}`,
        details: {
          error: message,
          protocol: this.config.protocol,
          connected: this.connected
        }
      };
    }
  }

  /**
   * Validates that required directories exist and are accessible
   * 
   * @returns Promise resolving to true if all directories are valid
   * @throws IntegrationError if directory validation fails
   */
  private async validateDirectories(): Promise<boolean> {
    try {
      logger.debug('Validating remittance directories', {
        integrationId: this.config.id
      });

      // Check and create import directory if it doesn't exist
      if (!(await fs.pathExists(this.remittanceConfig.importDirectory))) {
        logger.info(`Creating import directory: ${this.remittanceConfig.importDirectory}`, {
          integrationId: this.config.id
        });
        await fs.ensureDir(this.remittanceConfig.importDirectory);
      }

      // Check and create archive directory if it doesn't exist
      if (!(await fs.pathExists(this.remittanceConfig.archiveDirectory))) {
        logger.info(`Creating archive directory: ${this.remittanceConfig.archiveDirectory}`, {
          integrationId: this.config.id
        });
        await fs.ensureDir(this.remittanceConfig.archiveDirectory);
      }

      // Check and create error directory if it doesn't exist
      if (!(await fs.pathExists(this.remittanceConfig.errorDirectory))) {
        logger.info(`Creating error directory: ${this.remittanceConfig.errorDirectory}`, {
          integrationId: this.config.id
        });
        await fs.ensureDir(this.remittanceConfig.errorDirectory);
      }

      // Verify read/write permissions by writing a test file
      const testFilePath = path.join(this.remittanceConfig.importDirectory, '.test_write_access');
      await fs.writeFile(testFilePath, 'test');
      await fs.remove(testFilePath);

      logger.debug('Successfully validated remittance directories', {
        integrationId: this.config.id
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error validating directories';
      logger.error('Failed to validate remittance directories', {
        integrationId: this.config.id,
        error: message
      });
      
      throw new IntegrationError({
        message: `Failed to validate remittance directories: ${message}`,
        service: this.config.name,
        endpoint: 'file://' + this.remittanceConfig.importDirectory,
        retryable: false
      });
    }
  }

  /**
   * Determines the format of a remittance file based on content or extension
   * 
   * @param fileName - Name of the file
   * @param fileContent - Content of the file
   * @returns The determined file format
   */
  private determineFileFormat(fileName: string, fileContent: string): DataFormat {
    logger.debug(`Determining file format for ${fileName}`, {
      integrationId: this.config.id
    });

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
    
    // Fall back to configured default
    logger.debug(`Unable to determine file format, using default: ${this.remittanceConfig.fileFormat}`, {
      integrationId: this.config.id
    });
    
    return this.remittanceConfig.fileFormat;
  }

  /**
   * Maps DataFormat to RemittanceFileType for internal use
   * 
   * @param format - The data format
   * @returns The corresponding remittance file type
   */
  private mapRemittanceFileType(format: DataFormat): RemittanceFileType {
    switch (format) {
      case DataFormat.X12:
        return RemittanceFileType.EDI_835;
      case DataFormat.CSV:
        return RemittanceFileType.CSV;
      case DataFormat.JSON:
        return RemittanceFileType.CUSTOM;
      case DataFormat.XML:
        return RemittanceFileType.CUSTOM;
      default:
        return RemittanceFileType.CUSTOM;
    }
  }
}