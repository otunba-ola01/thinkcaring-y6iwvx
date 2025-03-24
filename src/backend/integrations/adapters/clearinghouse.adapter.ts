import axios from 'axios'; // axios 1.4.0
import { parseString, Builder } from 'xml2js'; // xml2js 0.5.0
import SftpClient from 'ssh2-sftp-client'; // ssh2-sftp-client 9.1.0
import { UUID } from '../../types/common.types';
import { 
  IntegrationAdapter, 
  IntegrationProtocol, 
  DataFormat,
  EDITransactionType,
  ClearinghouseIntegrationConfig,
  IntegrationRequestOptions,
  IntegrationResponse,
  IntegrationHealthStatus,
  IntegrationStatus
} from '../../types/integration.types';
import { Claim, ClaimStatus } from '../../types/claims.types';
import IntegrationError from '../../errors/integration-error';
import logger from '../../utils/logger';

/**
 * Adapter for communicating with clearinghouse systems to handle claim submissions,
 * status inquiries, and remittance processing.
 * 
 * Implements the IntegrationAdapter interface and provides functionality to connect
 * with various clearinghouse systems using different protocols (REST, SOAP, SFTP) and
 * data formats (JSON, XML, X12).
 */
export class ClearinghouseAdapter implements IntegrationAdapter {
  private config: ClearinghouseIntegrationConfig;
  private clearinghouseSystem: string;
  private protocol: IntegrationProtocol;
  private dataFormat: DataFormat;
  private baseUrl: string;
  private credentials: Record<string, string>;
  private headers: Record<string, string>;
  private endpoints: Record<string, string>;
  private testMode: boolean;
  private isConnected: boolean = false;
  private client: any;

  /**
   * Creates a new ClearinghouseAdapter instance
   * 
   * @param config Configuration for the clearinghouse integration
   */
  constructor(config: ClearinghouseIntegrationConfig) {
    this.config = config;
    this.clearinghouseSystem = config.clearinghouseSystem;
    this.protocol = config.protocol;
    this.dataFormat = config.dataFormat || DataFormat.JSON;
    this.baseUrl = config.baseUrl;
    this.credentials = config.credentials || {};
    this.headers = config.headers || {};
    this.endpoints = config.endpoints || {};
    this.testMode = config.testMode || false;
    
    logger.info(`Initializing clearinghouse adapter for ${this.clearinghouseSystem}`, {
      protocol: this.protocol,
      dataFormat: this.dataFormat,
      testMode: this.testMode
    });
  }

  /**
   * Establishes a connection to the clearinghouse system
   * 
   * @returns Promise resolving to true if connection was successful
   * @throws IntegrationError if connection fails
   */
  async connect(): Promise<boolean> {
    try {
      logger.info(`Connecting to clearinghouse: ${this.clearinghouseSystem}`, {
        protocol: this.protocol,
        baseUrl: this.baseUrl
      });

      switch (this.protocol) {
        case IntegrationProtocol.REST:
          // Initialize Axios client for REST API
          this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
              ...this.headers,
              'Content-Type': this.dataFormat === DataFormat.JSON ? 'application/json' : 'application/xml'
            },
            timeout: 30000 // 30 seconds default timeout
          });

          // Set authentication headers
          if (this.credentials.username && this.credentials.password) {
            const authHeader = `Basic ${Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64')}`;
            this.client.defaults.headers.common['Authorization'] = authHeader;
          } else if (this.credentials.apiKey) {
            this.client.defaults.headers.common['X-API-Key'] = this.credentials.apiKey;
          } else if (this.credentials.bearerToken) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials.bearerToken}`;
          }

          // Test connection with a simple request if an endpoint is available
          if (this.endpoints.health) {
            const response = await this.client.get(this.endpoints.health);
            if (response.status >= 200 && response.status < 300) {
              this.isConnected = true;
            } else {
              throw new Error(`Health check failed with status: ${response.status}`);
            }
          } else {
            // No health endpoint, assume connected
            this.isConnected = true;
          }
          break;

        case IntegrationProtocol.SOAP:
          // Initialize axios client for SOAP requests
          this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
              ...this.headers,
              'Content-Type': 'text/xml;charset=UTF-8',
              'SOAPAction': ''
            },
            timeout: 30000
          });
          
          this.isConnected = true;
          break;

        case IntegrationProtocol.SFTP:
          // Initialize SFTP client
          this.client = new SftpClient();
          
          await this.client.connect({
            host: this.baseUrl,
            port: this.credentials.port ? parseInt(this.credentials.port, 10) : 22,
            username: this.credentials.username,
            password: this.credentials.password,
            privateKey: this.credentials.privateKey,
            passphrase: this.credentials.passphrase
          });
          
          this.isConnected = true;
          break;

        default:
          throw new Error(`Unsupported protocol: ${this.protocol}`);
      }

      logger.info(`Successfully connected to clearinghouse: ${this.clearinghouseSystem}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to connect to clearinghouse: ${this.clearinghouseSystem}`, {
        error: errorMessage,
        protocol: this.protocol,
        baseUrl: this.baseUrl
      });
      
      throw new IntegrationError({
        message: `Failed to connect to clearinghouse: ${errorMessage}`,
        service: this.clearinghouseSystem,
        endpoint: 'connect',
        statusCode: error.response?.status
      });
    }
  }

  /**
   * Closes the connection to the clearinghouse system
   * 
   * @returns Promise resolving to true if disconnection was successful
   */
  async disconnect(): Promise<boolean> {
    try {
      logger.info(`Disconnecting from clearinghouse: ${this.clearinghouseSystem}`);
      
      if (!this.isConnected) {
        logger.debug(`Not currently connected, skipping disconnect`);
        return true;
      }

      if (this.protocol === IntegrationProtocol.SFTP && this.client) {
        await this.client.end();
      }
      
      // For other protocols (REST, SOAP), simply clear the client
      this.client = null;
      this.isConnected = false;
      
      logger.info(`Successfully disconnected from clearinghouse: ${this.clearinghouseSystem}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to disconnect from clearinghouse: ${this.clearinghouseSystem}`, {
        error: errorMessage
      });
      return false;
    }
  }

  /**
   * Sends a request to the clearinghouse system
   * 
   * @param endpoint The endpoint to send the request to
   * @param method The HTTP method to use
   * @param data The data to send with the request
   * @param options Additional request options
   * @returns Promise resolving to the standardized response
   * @throws IntegrationError if the request fails
   */
  async sendRequest(
    endpoint: string,
    method: string,
    data: any,
    options: IntegrationRequestOptions = { 
      timeout: 30000,
      retryCount: 0,
      retryDelay: 1000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Sending ${method} request to clearinghouse: ${this.clearinghouseSystem}`, {
        endpoint,
        method,
        correlationId: options.correlationId
      });

      // Ensure we're connected
      if (!this.isConnected) {
        await this.connect();
      }

      // Prepare headers
      const headers = {
        ...this.headers,
        ...options.headers
      };

      // Add correlation ID to headers if provided
      if (options.correlationId) {
        headers['X-Correlation-ID'] = options.correlationId;
      }

      // Add test mode indicator if in test mode
      if (this.testMode) {
        headers['X-Test-Mode'] = 'true';
      }

      // Format request data based on the data format
      const formattedData = this.formatRequestData(data);

      let response;
      switch (this.protocol) {
        case IntegrationProtocol.REST:
          // Send request using axios
          response = await this.client.request({
            method,
            url: endpoint,
            data: formattedData,
            headers,
            timeout: options.timeout
          });
          
          break;

        case IntegrationProtocol.SOAP:
          // Create SOAP envelope
          const soapEnvelope = `
            <soapenv:Envelope 
              xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
              xmlns:cus="${this.baseUrl}">
              <soapenv:Header/>
              <soapenv:Body>
                ${formattedData}
              </soapenv:Body>
            </soapenv:Envelope>
          `;
          
          // Send SOAP request
          response = await this.client.post(endpoint, soapEnvelope, {
            headers: {
              ...headers,
              'SOAPAction': headers['SOAPAction'] || endpoint
            },
            timeout: options.timeout
          });
          
          // Parse SOAP response to extract the body
          const soapResponse = response.data;
          // TODO: Parse SOAP response properly
          response.data = soapResponse;
          break;

        case IntegrationProtocol.SFTP:
          // Determine if this is an upload or download
          if (method.toUpperCase() === 'PUT' || method.toUpperCase() === 'POST') {
            // Upload file
            const remotePath = endpoint;
            await this.client.put(formattedData, remotePath);
            response = {
              status: 200,
              data: {
                success: true,
                path: remotePath
              }
            };
          } else {
            // Download file
            const remotePath = endpoint;
            const fileData = await this.client.get(remotePath);
            response = {
              status: 200,
              data: fileData
            };
          }
          break;

        default:
          throw new Error(`Unsupported protocol: ${this.protocol}`);
      }

      // Parse the response data based on the data format
      const parsedData = this.parseResponseData(response.data);

      // Create standardized response
      const integrationResponse: IntegrationResponse = {
        success: true,
        statusCode: response.status || 200,
        data: parsedData,
        error: null,
        metadata: {
          headers: response.headers,
          endpoint,
          method,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };

      logger.info(`Successfully received response from clearinghouse: ${this.clearinghouseSystem}`, {
        endpoint,
        statusCode: integrationResponse.statusCode,
        correlationId: options.correlationId
      });

      return integrationResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = error.response?.status;
      
      logger.error(`Error sending request to clearinghouse: ${this.clearinghouseSystem}`, {
        endpoint,
        method,
        error: errorMessage,
        statusCode,
        correlationId: options.correlationId
      });

      // Check if we should retry
      if (options.retryCount > 0) {
        logger.info(`Retrying request to clearinghouse (${options.retryCount} attempts remaining)`, {
          endpoint,
          method,
          correlationId: options.correlationId
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, options.retryDelay));

        // Retry with decremented retry count
        return this.sendRequest(endpoint, method, data, {
          ...options,
          retryCount: options.retryCount - 1,
          retryDelay: options.retryDelay * 2 // Exponential backoff
        });
      }

      // Create error response
      const integrationError = new IntegrationError({
        message: `Clearinghouse request failed: ${errorMessage}`,
        service: this.clearinghouseSystem,
        endpoint,
        statusCode,
        requestId: options.correlationId,
        responseBody: error.response?.data
      });

      return {
        success: false,
        statusCode: statusCode || 500,
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
          endpoint,
          method,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Checks the health of the clearinghouse connection
   * 
   * @returns Promise resolving to the health status
   */
  async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      logger.info(`Checking health of clearinghouse: ${this.clearinghouseSystem}`);
      
      // If not connected, try to connect
      if (!this.isConnected) {
        await this.connect();
      }

      // Perform a simple request to check health
      const startTime = Date.now();
      
      let status = IntegrationStatus.ACTIVE;
      let responseTime: number | null = null;
      let message = `Clearinghouse ${this.clearinghouseSystem} is healthy`;
      
      // Try to access health endpoint or a simple endpoint
      if (this.endpoints.health) {
        const response = await this.sendRequest(
          this.endpoints.health,
          'GET',
          null,
          { timeout: 5000 }
        );
        
        responseTime = Date.now() - startTime;
        
        if (!response.success) {
          status = IntegrationStatus.ERROR;
          message = `Health check failed: ${response.error?.message}`;
        }
      } else {
        // No specific health endpoint, just check if we're connected
        responseTime = this.isConnected ? 0 : null;
        status = this.isConnected ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR;
        message = this.isConnected ? 
          `Connected to ${this.clearinghouseSystem}` : 
          `Not connected to ${this.clearinghouseSystem}`;
      }

      return {
        status,
        responseTime,
        lastChecked: new Date(),
        message,
        details: {
          protocol: this.protocol,
          clearinghouseSystem: this.clearinghouseSystem
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Health check failed for clearinghouse: ${this.clearinghouseSystem}`, {
        error: errorMessage
      });

      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${errorMessage}`,
        details: {
          error: errorMessage,
          protocol: this.protocol,
          clearinghouseSystem: this.clearinghouseSystem
        }
      };
    }
  }

  /**
   * Submits a claim to the clearinghouse
   * 
   * @param claim The claim to submit
   * @param additionalData Additional data required for submission
   * @param options Request options
   * @returns Promise resolving to the submission response
   */
  async submitClaim(
    claim: Claim,
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { 
      timeout: 60000,
      retryCount: 2,
      retryDelay: 1000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Submitting claim to clearinghouse: ${this.clearinghouseSystem}`, {
        claimId: claim.id,
        correlationId: options.correlationId
      });

      // Validate claim for required fields
      if (!claim.id || !claim.clientId || !claim.payerId) {
        throw new Error('Required claim fields missing');
      }

      // Get the submission endpoint
      const endpoint = this.endpoints.claimSubmission || 'claims';

      // Prepare claim data with any additional required information
      const submissionData = {
        claim,
        ...additionalData,
        submitter: this.config.submitterInfo,
        testIndicator: this.testMode ? 'T' : 'P' // T for test, P for production
      };

      // Send request to the clearinghouse
      const response = await this.sendRequest(
        endpoint,
        'POST',
        submissionData,
        options
      );

      // If successful, extract tracking number and other metadata
      if (response.success) {
        // Extract tracking number from the response
        const trackingNumber = this.extractTrackingNumber(response.data);
        
        // Update the response with claim-specific information
        response.data = {
          ...response.data,
          trackingNumber,
          claimId: claim.id,
          submissionDate: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to submit claim to clearinghouse: ${this.clearinghouseSystem}`, {
        claimId: claim.id,
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Claim submission failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: 'submitClaim',
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          claimId: claim.id,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Submits multiple claims as a batch to the clearinghouse
   * 
   * @param claims Array of claims to submit
   * @param additionalData Additional data required for submission
   * @param options Request options
   * @returns Promise resolving to the batch submission response
   */
  async submitBatch(
    claims: Claim[],
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { 
      timeout: 120000,
      retryCount: 2,
      retryDelay: 2000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Submitting batch of ${claims.length} claims to clearinghouse: ${this.clearinghouseSystem}`, {
        claimCount: claims.length,
        correlationId: options.correlationId
      });

      // Validate batch size against clearinghouse limits
      const maxBatchSize = this.config.batchSize || 100;
      if (claims.length > maxBatchSize) {
        throw new Error(`Batch size (${claims.length}) exceeds maximum allowed (${maxBatchSize})`);
      }

      // Get the batch submission endpoint
      const endpoint = this.endpoints.batchSubmission || 'claims/batch';

      // Prepare batch data
      const batchData = {
        claims,
        ...additionalData,
        submitter: this.config.submitterInfo,
        testIndicator: this.testMode ? 'T' : 'P', // T for test, P for production
        batchId: additionalData.batchId || `BATCH-${Date.now()}`,
        submissionDate: new Date().toISOString()
      };

      // Send request to the clearinghouse
      const response = await this.sendRequest(
        endpoint,
        'POST',
        batchData,
        options
      );

      // If successful, extract batch results and claim-specific information
      if (response.success) {
        // Process the response to extract batch status and claim information
        const claimResults = this.extractBatchResults(response.data, claims);
        
        // Update the response with batch-specific information
        response.data = {
          ...response.data,
          batchId: batchData.batchId,
          submissionDate: batchData.submissionDate,
          claimCount: claims.length,
          claimResults
        };
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to submit claim batch to clearinghouse: ${this.clearinghouseSystem}`, {
        claimCount: claims.length,
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Batch submission failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: 'submitBatch',
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          claimCount: claims.length,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Checks the status of a previously submitted claim
   * 
   * @param trackingNumber Tracking number assigned by the clearinghouse
   * @param additionalData Additional data required for the status check
   * @param options Request options
   * @returns Promise resolving to the claim status response
   */
  async checkClaimStatus(
    trackingNumber: string,
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { 
      timeout: 30000,
      retryCount: 2,
      retryDelay: 1000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Checking claim status with clearinghouse: ${this.clearinghouseSystem}`, {
        trackingNumber,
        correlationId: options.correlationId
      });

      // Get the status check endpoint
      let endpoint = this.endpoints.claimStatus || 'claims/status';
      
      // Replace any placeholders in the endpoint URL
      endpoint = endpoint.replace('{trackingNumber}', trackingNumber);

      // Prepare status inquiry data
      const statusData = {
        trackingNumber,
        ...additionalData,
        submitter: this.config.submitterInfo
      };

      // Send request to the clearinghouse
      const response = await this.sendRequest(
        endpoint,
        'GET',
        statusData,
        options
      );

      // If successful, extract and map the claim status
      if (response.success) {
        // Extract the claim status from the response
        const rawStatus = this.extractClaimStatus(response.data);
        
        // Map the clearinghouse-specific status to our system's ClaimStatus enum
        const mappedStatus = this.mapClaimStatusFromClearinghouse(rawStatus);
        
        // Update the response with status information
        response.data = {
          ...response.data,
          trackingNumber,
          status: mappedStatus,
          rawStatus,
          statusDate: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to check claim status with clearinghouse: ${this.clearinghouseSystem}`, {
        trackingNumber,
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Claim status check failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: 'checkClaimStatus',
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          trackingNumber,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Downloads remittance advice files from the clearinghouse
   * 
   * @param fromDate Start date for remittance files
   * @param toDate End date for remittance files
   * @param options Request options
   * @returns Promise resolving to the remittance download response
   */
  async downloadRemittance(
    fromDate: Date,
    toDate: Date,
    options: IntegrationRequestOptions = { 
      timeout: 120000,
      retryCount: 2,
      retryDelay: 2000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Downloading remittance advice from clearinghouse: ${this.clearinghouseSystem}`, {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        correlationId: options.correlationId
      });

      // Get the remittance download endpoint
      const endpoint = this.endpoints.remittanceDownload || 'remittance';

      // Format dates for the request
      const fromDateStr = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const toDateStr = toDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Prepare remittance request data
      const remittanceData = {
        fromDate: fromDateStr,
        toDate: toDateStr,
        submitter: this.config.submitterInfo
      };

      let response;
      // Handle different protocols for remittance downloads
      if (this.protocol === IntegrationProtocol.SFTP) {
        // For SFTP, we need to list and download files in the specified date range
        try {
          // Ensure we're connected
          if (!this.isConnected) {
            await this.connect();
          }

          // Determine the remote directory for remittance files
          const remittanceDir = endpoint;
          
          // List files in the remittance directory
          const files = await this.client.list(remittanceDir);
          
          // Filter files by date if possible
          const matchingFiles = files.filter((file: any) => {
            // This is a simple filter - adjust based on actual file naming conventions
            const fileDate = new Date(file.modifyTime);
            return fileDate >= fromDate && fileDate <= toDate;
          });
          
          // Download each matching file
          const downloadedFiles = [];
          for (const file of matchingFiles) {
            const filePath = `${remittanceDir}/${file.name}`;
            const fileContent = await this.client.get(filePath);
            downloadedFiles.push({
              filename: file.name,
              content: fileContent,
              date: new Date(file.modifyTime).toISOString()
            });
          }
          
          // Create success response
          response = {
            success: true,
            statusCode: 200,
            data: {
              files: downloadedFiles,
              fileCount: downloadedFiles.length,
              fromDate: fromDateStr,
              toDate: toDateStr
            },
            error: null,
            metadata: {
              fileCount: downloadedFiles.length,
              correlationId: options.correlationId
            },
            timestamp: new Date()
          };
        } catch (sftpError) {
          throw new Error(`SFTP remittance download failed: ${sftpError.message}`);
        }
      } else {
        // For REST/SOAP, send a standard request
        response = await this.sendRequest(
          endpoint,
          'GET',
          remittanceData,
          options
        );

        // If successful, process the remittance data
        if (response.success) {
          // Process response to extract remittance files
          const remittanceFiles = this.extractRemittanceFiles(response.data);
          
          // Update the response with remittance-specific information
          response.data = {
            files: remittanceFiles,
            fileCount: remittanceFiles.length,
            fromDate: fromDateStr,
            toDate: toDateStr
          };
        }
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to download remittance advice from clearinghouse: ${this.clearinghouseSystem}`, {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Remittance download failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: 'downloadRemittance',
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Verifies patient eligibility with a payer through the clearinghouse
   * 
   * @param patientData Patient demographics and identifiers
   * @param payerData Payer information
   * @param options Request options
   * @returns Promise resolving to the eligibility verification response
   */
  async verifyEligibility(
    patientData: Record<string, any>,
    payerData: Record<string, any>,
    options: IntegrationRequestOptions = { 
      timeout: 60000,
      retryCount: 2,
      retryDelay: 1000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Verifying eligibility with clearinghouse: ${this.clearinghouseSystem}`, {
        patientId: patientData.id,
        payerId: payerData.id,
        correlationId: options.correlationId
      });

      // Validate required patient and payer data
      if (!patientData.id || !patientData.firstName || !patientData.lastName || !patientData.dateOfBirth) {
        throw new Error('Required patient information missing');
      }

      if (!payerData.id || !payerData.payerId) {
        throw new Error('Required payer information missing');
      }

      // Get the eligibility verification endpoint
      const endpoint = this.endpoints.eligibilityVerification || 'eligibility';

      // Prepare eligibility request data
      const eligibilityData = {
        patient: patientData,
        payer: payerData,
        submitter: this.config.submitterInfo,
        testIndicator: this.testMode ? 'T' : 'P'
      };

      // Send request to the clearinghouse
      const response = await this.sendRequest(
        endpoint,
        'POST',
        eligibilityData,
        options
      );

      // If successful, extract eligibility information
      if (response.success) {
        // Process the response to extract eligibility details
        const eligibilityInfo = this.extractEligibilityInfo(response.data);
        
        // Update the response with eligibility-specific information
        response.data = {
          ...response.data,
          eligibilityInfo,
          patientId: patientData.id,
          payerId: payerData.id,
          verificationDate: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to verify eligibility with clearinghouse: ${this.clearinghouseSystem}`, {
        patientId: patientData.id,
        payerId: payerData.id,
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Eligibility verification failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: 'verifyEligibility',
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          patientId: patientData.id,
          payerId: payerData.id,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Generic method to execute operations on the clearinghouse
   * 
   * @param operation The operation to execute
   * @param data The data for the operation
   * @param options Request options
   * @returns Promise resolving to the operation response
   */
  async execute(
    operation: string,
    data: any,
    options: IntegrationRequestOptions = { 
      timeout: 30000,
      retryCount: 2,
      retryDelay: 1000,
      headers: {},
      correlationId: '',
      priority: 1
    }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Executing operation '${operation}' on clearinghouse: ${this.clearinghouseSystem}`, {
        operation,
        correlationId: options.correlationId
      });

      // Map operation to specific endpoint and method
      let endpoint = '';
      let method = 'GET';

      switch (operation) {
        case 'submitClaim':
          endpoint = this.endpoints.claimSubmission || 'claims';
          method = 'POST';
          break;
        case 'checkClaimStatus':
          endpoint = this.endpoints.claimStatus || 'claims/status';
          method = 'GET';
          break;
        case 'downloadRemittance':
          endpoint = this.endpoints.remittanceDownload || 'remittance';
          method = 'GET';
          break;
        case 'verifyEligibility':
          endpoint = this.endpoints.eligibilityVerification || 'eligibility';
          method = 'POST';
          break;
        default:
          // Use the operation name as the endpoint if not specifically mapped
          endpoint = this.endpoints[operation] || operation;
          method = 'POST'; // Default to POST for custom operations
      }

      // Send the request
      return await this.sendRequest(endpoint, method, data, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to execute operation '${operation}' on clearinghouse: ${this.clearinghouseSystem}`, {
        operation,
        error: errorMessage,
        correlationId: options.correlationId
      });

      // Create error response
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Operation execution failed: ${errorMessage}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.clearinghouseSystem,
            endpoint: operation,
            statusCode: null,
            requestId: options.correlationId,
            message: errorMessage,
            responseBody: null
          },
          timestamp: new Date(),
          retryable: true
        },
        metadata: {
          operation,
          correlationId: options.correlationId
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Formats request data based on the data format
   * 
   * @param data Data to format
   * @returns Formatted data
   * @throws IntegrationError if formatting fails
   */
  private formatRequestData(data: any): any {
    try {
      if (!data) return data;

      switch (this.dataFormat) {
        case DataFormat.JSON:
          // Ensure data is properly serialized JSON
          return typeof data === 'string' ? data : JSON.stringify(data);
        
        case DataFormat.XML:
          // Convert data to XML
          if (typeof data === 'string') {
            // Assume it's already XML if it's a string
            return data;
          } else {
            // Convert object to XML using xml2js
            const builder = new Builder();
            return builder.buildObject(data);
          }
        
        case DataFormat.X12:
          // Format data as EDI X12
          // This is a placeholder - actual X12 formatting would require a more complex implementation
          if (typeof data === 'string') {
            // Assume it's already X12 if it's a string
            return data;
          } else {
            // This is a simplified approach - real X12 generation would be more complex
            // TODO: Implement proper X12 formatting or use a dedicated library
            return JSON.stringify(data);
          }
        
        default:
          // Return data as-is for unsupported formats
          return data;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to format request data for format: ${this.dataFormat}`, {
        error: errorMessage
      });
      
      throw new IntegrationError({
        message: `Failed to format request data: ${errorMessage}`,
        service: this.clearinghouseSystem,
        endpoint: 'formatRequestData'
      });
    }
  }

  /**
   * Parses response data based on the data format
   * 
   * @param data Data to parse
   * @returns Parsed data
   * @throws IntegrationError if parsing fails
   */
  private parseResponseData(data: any): any {
    try {
      if (!data) return data;

      switch (this.dataFormat) {
        case DataFormat.JSON:
          // Parse JSON string if needed
          if (typeof data === 'string') {
            return JSON.parse(data);
          }
          return data;
        
        case DataFormat.XML:
          // Parse XML to JS object
          if (typeof data === 'string') {
            let result: any = null;
            parseString(data, (err, parsedData) => {
              if (err) throw err;
              result = parsedData;
            });
            return result;
          }
          return data;
        
        case DataFormat.X12:
          // Parse EDI X12 to structured data
          // This is a placeholder - actual X12 parsing would require a more complex implementation
          if (typeof data === 'string') {
            // TODO: Implement proper X12 parsing or use a dedicated library
            // For now, we'll just return the string
            return { rawX12: data };
          }
          return data;
        
        default:
          // Return data as-is for unsupported formats
          return data;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to parse response data for format: ${this.dataFormat}`, {
        error: errorMessage
      });
      
      throw new IntegrationError({
        message: `Failed to parse response data: ${errorMessage}`,
        service: this.clearinghouseSystem,
        endpoint: 'parseResponseData'
      });
    }
  }

  /**
   * Maps clearinghouse-specific status codes to the system's ClaimStatus enum values
   * 
   * @param statusCode Status code from clearinghouse
   * @returns The mapped internal claim status
   */
  private mapClaimStatusFromClearinghouse(statusCode: string): ClaimStatus {
    // Default to PENDING if mapping fails
    let mappedStatus = ClaimStatus.PENDING;
    
    // Check which clearinghouse we're using to apply appropriate mapping
    switch (this.clearinghouseSystem.toLowerCase()) {
      case 'change healthcare':
        // Change Healthcare specific status codes
        switch (statusCode) {
          case 'A': 
            mappedStatus = ClaimStatus.ACKNOWLEDGED;
            break;
          case 'R': 
            mappedStatus = ClaimStatus.REJECTED;
            break;
          case 'P': 
            mappedStatus = ClaimStatus.PENDING;
            break;
          case 'PAID': 
            mappedStatus = ClaimStatus.PAID;
            break;
          case 'PARTIALPAY': 
            mappedStatus = ClaimStatus.PARTIAL_PAID;
            break;
          case 'DENIED': 
            mappedStatus = ClaimStatus.DENIED;
            break;
          default:
            logger.warn(`Unknown Change Healthcare status code: ${statusCode}, defaulting to PENDING`);
            mappedStatus = ClaimStatus.PENDING;
            break;
        }
        break;
        
      case 'availity':
        // Availity specific status codes
        switch (statusCode) {
          case 'ACCEPTED': 
            mappedStatus = ClaimStatus.ACKNOWLEDGED;
            break;
          case 'REJECTED': 
            mappedStatus = ClaimStatus.REJECTED;
            break;
          case 'IN PROCESS': 
            mappedStatus = ClaimStatus.PENDING;
            break;
          case 'FINALIZED': 
            mappedStatus = ClaimStatus.PAID;
            break;
          case 'DENIED': 
            mappedStatus = ClaimStatus.DENIED;
            break;
          default:
            logger.warn(`Unknown Availity status code: ${statusCode}, defaulting to PENDING`);
            mappedStatus = ClaimStatus.PENDING;
            break;
        }
        break;
        
      // Add mappings for other clearinghouse systems as needed
        
      default:
        // Generic mapping for unknown clearinghouse systems
        if (statusCode.toUpperCase().includes('REJECT')) {
          mappedStatus = ClaimStatus.REJECTED;
        } else if (statusCode.toUpperCase().includes('DENY') || statusCode.toUpperCase().includes('DENIED')) {
          mappedStatus = ClaimStatus.DENIED;
        } else if (statusCode.toUpperCase().includes('PAID')) {
          mappedStatus = ClaimStatus.PAID;
        } else if (statusCode.toUpperCase().includes('ACCEPT') || statusCode.toUpperCase().includes('ACKNOWLEDGE')) {
          mappedStatus = ClaimStatus.ACKNOWLEDGED;
        } else {
          logger.warn(`No mapping found for status code: ${statusCode} from clearinghouse: ${this.clearinghouseSystem}, defaulting to PENDING`);
          mappedStatus = ClaimStatus.PENDING;
        }
        break;
    }
    
    return mappedStatus;
  }

  /**
   * Extracts tracking number from claim submission response
   * 
   * @param responseData Response data from clearinghouse
   * @returns Extracted tracking number or null
   */
  private extractTrackingNumber(responseData: any): string | null {
    try {
      // Implementation depends on the specific clearinghouse response format
      // This is a simplified approach - adjust based on actual response structure
      
      // For JSON response
      if (responseData.trackingNumber) {
        return responseData.trackingNumber;
      }
      
      if (responseData.claimTrackingNumber) {
        return responseData.claimTrackingNumber;
      }
      
      if (responseData.id) {
        return responseData.id;
      }
      
      // For nested objects, try to find a property that looks like a tracking number
      const possibleKeys = ['tracking_number', 'claim_id', 'reference_number', 'control_number'];
      for (const key of possibleKeys) {
        if (responseData[key]) {
          return responseData[key];
        }
      }
      
      // Search recursively in nested objects
      for (const key in responseData) {
        if (typeof responseData[key] === 'object' && responseData[key] !== null) {
          const result = this.searchForProperty(responseData[key], possibleKeys);
          if (result) {
            return result;
          }
        }
      }
      
      // If no tracking number found, log a warning and return null
      logger.warn(`Could not extract tracking number from response`, {
        clearinghouse: this.clearinghouseSystem,
        responseData
      });
      
      return null;
    } catch (error) {
      logger.error(`Error extracting tracking number`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Extracts claim status from response data
   * 
   * @param responseData Response data from clearinghouse
   * @returns Extracted status code or null
   */
  private extractClaimStatus(responseData: any): string {
    try {
      // Implementation depends on the specific clearinghouse response format
      // This is a simplified approach - adjust based on actual response structure
      
      // For JSON response
      if (responseData.status) {
        return responseData.status;
      }
      
      if (responseData.claimStatus) {
        return responseData.claimStatus;
      }
      
      // For nested objects, try to find a property that looks like a status
      const possibleKeys = ['status', 'claim_status', 'statusCode', 'status_code'];
      for (const key of possibleKeys) {
        if (responseData[key]) {
          return responseData[key];
        }
      }
      
      // Search recursively in nested objects
      for (const key in responseData) {
        if (typeof responseData[key] === 'object' && responseData[key] !== null) {
          const result = this.searchForProperty(responseData[key], possibleKeys);
          if (result) {
            return result;
          }
        }
      }
      
      // If no status found, log a warning and return a default
      logger.warn(`Could not extract claim status from response`, {
        clearinghouse: this.clearinghouseSystem,
        responseData
      });
      
      return 'PENDING'; // Default status if none found
    } catch (error) {
      logger.error(`Error extracting claim status`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'PENDING';
    }
  }

  /**
   * Extracts batch results from batch submission response
   * 
   * @param responseData Response data from clearinghouse
   * @param originalClaims Original claims submitted in the batch
   * @returns Array of claim results with tracking numbers and status
   */
  private extractBatchResults(responseData: any, originalClaims: Claim[]): Array<any> {
    try {
      // Implementation depends on the specific clearinghouse response format
      // This is a simplified approach - adjust based on actual response structure
      
      // If the response already has a claims or claimResults array, use it
      if (Array.isArray(responseData.claims)) {
        return responseData.claims.map((claim: any, index: number) => ({
          claimId: originalClaims[index]?.id || null,
          trackingNumber: claim.trackingNumber || claim.id || null,
          status: claim.status || 'ACKNOWLEDGED',
          errors: claim.errors || []
        }));
      }
      
      if (Array.isArray(responseData.claimResults)) {
        return responseData.claimResults.map((result: any, index: number) => ({
          claimId: originalClaims[index]?.id || null,
          trackingNumber: result.trackingNumber || result.id || null,
          status: result.status || 'ACKNOWLEDGED',
          errors: result.errors || []
        }));
      }
      
      // If no structured batch results found, create a default result for each claim
      return originalClaims.map(claim => ({
        claimId: claim.id,
        trackingNumber: null, // No tracking number available
        status: 'ACKNOWLEDGED', // Assume acknowledged if no status info
        errors: []
      }));
    } catch (error) {
      logger.error(`Error extracting batch results`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return minimal information on error
      return originalClaims.map(claim => ({
        claimId: claim.id,
        trackingNumber: null,
        status: 'ERROR',
        errors: [{ message: 'Error processing batch result' }]
      }));
    }
  }

  /**
   * Extracts remittance files from remittance response
   * 
   * @param responseData Response data from clearinghouse
   * @returns Array of remittance files
   */
  private extractRemittanceFiles(responseData: any): Array<any> {
    try {
      // Implementation depends on the specific clearinghouse response format
      // This is a simplified approach - adjust based on actual response structure
      
      // If the response has a files array, use it
      if (Array.isArray(responseData.files)) {
        return responseData.files;
      }
      
      // If the response has a remittanceFiles array, use it
      if (Array.isArray(responseData.remittanceFiles)) {
        return responseData.remittanceFiles;
      }
      
      // If the response itself is an array, assume it's the files
      if (Array.isArray(responseData)) {
        return responseData;
      }
      
      // If no files found, return an empty array
      logger.warn(`No remittance files found in response`, {
        clearinghouse: this.clearinghouseSystem
      });
      
      return [];
    } catch (error) {
      logger.error(`Error extracting remittance files`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Extracts eligibility information from eligibility response
   * 
   * @param responseData Response data from clearinghouse
   * @returns Structured eligibility information
   */
  private extractEligibilityInfo(responseData: any): any {
    try {
      // Implementation depends on the specific clearinghouse response format
      // This is a simplified approach - adjust based on actual response structure
      
      // If the response already has an eligibility or eligibilityInfo object, use it
      if (responseData.eligibility) {
        return responseData.eligibility;
      }
      
      if (responseData.eligibilityInfo) {
        return responseData.eligibilityInfo;
      }
      
      // Try to construct eligibility info from various possible response structures
      const eligibilityInfo: any = {
        isEligible: false,
        coverageStatus: 'UNKNOWN',
        benefitInfo: [],
        planInfo: {},
        rawResponse: responseData
      };
      
      // Look for common eligibility indicators
      if (responseData.isEligible !== undefined) {
        eligibilityInfo.isEligible = responseData.isEligible;
      } else if (responseData.eligible !== undefined) {
        eligibilityInfo.isEligible = responseData.eligible;
      } else if (responseData.status && typeof responseData.status === 'string') {
        eligibilityInfo.isEligible = responseData.status.toUpperCase() === 'ACTIVE' || 
                                     responseData.status.toUpperCase() === 'ELIGIBLE';
        eligibilityInfo.coverageStatus = responseData.status;
      }
      
      // Look for benefit information
      if (Array.isArray(responseData.benefits)) {
        eligibilityInfo.benefitInfo = responseData.benefits;
      } else if (Array.isArray(responseData.coverages)) {
        eligibilityInfo.benefitInfo = responseData.coverages;
      }
      
      // Look for plan information
      if (responseData.plan) {
        eligibilityInfo.planInfo = responseData.plan;
      } else if (responseData.insurance) {
        eligibilityInfo.planInfo = responseData.insurance;
      } else if (responseData.coverage) {
        eligibilityInfo.planInfo = responseData.coverage;
      }
      
      return eligibilityInfo;
    } catch (error) {
      logger.error(`Error extracting eligibility information`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return minimal information on error
      return {
        isEligible: false,
        coverageStatus: 'ERROR',
        benefitInfo: [],
        planInfo: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        rawResponse: responseData
      };
    }
  }

  /**
   * Helper method to search for a property in an object recursively
   * 
   * @param obj Object to search in
   * @param keys Array of possible property keys to look for
   * @returns Property value if found, null otherwise
   */
  private searchForProperty(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    
    // Check if any of the specified keys exist in the object
    for (const key of keys) {
      if (obj[key] !== undefined) {
        return obj[key];
      }
    }
    
    // Recursively search in nested objects
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = this.searchForProperty(obj[key], keys);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }
}

export default ClearinghouseAdapter;