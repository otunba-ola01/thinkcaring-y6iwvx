import { UUID } from '../../types/common.types';
import {
  IntegrationAdapter,
  IntegrationProtocol,
  DataFormat,
  EDITransactionType,
  MedicaidIntegrationConfig,
  IntegrationRequestOptions,
  IntegrationResponse,
  IntegrationHealthStatus,
  IntegrationStatus
} from '../../types/integration.types';
import { Claim, ClaimStatus } from '../../types/claims.types';
import IntegrationError from '../../errors/integration-error';
import logger from '../../utils/logger';

import axios from 'axios'; // version 1.4.0
import * as xml2js from 'xml2js'; // version 0.5.0
import * as SftpClient from 'ssh2-sftp-client'; // version 9.1.0

/**
 * Adapter for communicating with state Medicaid portals to handle claim submissions,
 * eligibility verification, and claim status inquiries.
 */
class MedicaidAdapter implements IntegrationAdapter {
  private config: MedicaidIntegrationConfig;
  private state: string;
  private portalSystem: string;
  private protocol: IntegrationProtocol;
  private dataFormat: DataFormat;
  private baseUrl: string;
  private credentials: Record<string, string>;
  private headers: Record<string, string>;
  private endpoints: Record<string, string>;
  private providerNumber: string;
  private testMode: boolean;
  private isConnected: boolean = false;
  private client: any; // Type varies based on protocol

  /**
   * Creates a new MedicaidAdapter instance
   * 
   * @param config Configuration for the Medicaid integration
   */
  constructor(config: MedicaidIntegrationConfig) {
    this.config = config;
    this.state = config.state;
    this.portalSystem = config.portalSystem;
    this.protocol = config.protocol || IntegrationProtocol.REST;
    this.dataFormat = config.dataFormat || DataFormat.JSON;
    this.baseUrl = config.baseUrl;
    this.credentials = config.credentials || {};
    this.headers = config.headers || {};
    this.endpoints = config.endpoints || {};
    this.providerNumber = config.providerNumber;
    this.testMode = config.testMode || false;

    logger.info(`Initialized MedicaidAdapter for ${this.state} using ${this.portalSystem}`, {
      state: this.state,
      protocol: this.protocol,
      dataFormat: this.dataFormat
    });
  }

  /**
   * Establishes a connection to the state Medicaid portal
   * 
   * @returns Promise resolving to true if connection was successful
   */
  public async connect(): Promise<boolean> {
    try {
      logger.info(`Connecting to ${this.state} Medicaid portal (${this.portalSystem})`, {
        protocol: this.protocol,
        baseUrl: this.baseUrl
      });

      if (this.protocol === IntegrationProtocol.REST) {
        // Create axios client with default configuration
        this.client = axios.create({
          baseURL: this.baseUrl,
          headers: {
            ...this.headers,
            'Content-Type': this.dataFormat === DataFormat.JSON ? 'application/json' : 'application/xml',
            'Accept': this.dataFormat === DataFormat.JSON ? 'application/json' : 'application/xml'
          },
          timeout: 30000, // 30 seconds default timeout
        });

        // Add authorization headers if credentials are provided
        if (this.credentials.apiKey) {
          this.client.defaults.headers.common['X-API-Key'] = this.credentials.apiKey;
        } else if (this.credentials.username && this.credentials.password) {
          const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
          this.client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
        }

        // Test connection with a simple request if possible
        if (this.endpoints.healthCheck) {
          await this.client.get(this.endpoints.healthCheck);
        }
      } 
      else if (this.protocol === IntegrationProtocol.SOAP) {
        // For SOAP we would initialize a SOAP client, using a library or custom implementation
        // This is a simplified example; a full implementation would involve WSDL parsing
        const createClient = () => {
          // In a real implementation, we would use a proper SOAP client library
          // For now, we'll use axios with custom XML handling
          return axios.create({
            baseURL: this.baseUrl,
            headers: {
              ...this.headers,
              'Content-Type': 'text/xml;charset=UTF-8',
              'SOAPAction': '' // This would be set per operation
            },
            timeout: 30000
          });
        };

        this.client = createClient();
        
        // Add authentication headers if needed
        if (this.credentials.username && this.credentials.password) {
          // Add WS-Security headers or other auth mechanism as required
          // This is just a placeholder for implementation
        }
      } 
      else if (this.protocol === IntegrationProtocol.SFTP) {
        // Initialize SFTP client
        this.client = new SftpClient();
        
        // Connect to SFTP server
        await this.client.connect({
          host: this.baseUrl,
          port: this.credentials.port ? parseInt(this.credentials.port, 10) : 22,
          username: this.credentials.username,
          password: this.credentials.password,
          privateKey: this.credentials.privateKey
        });
        
        // Verify connection by listing root directory
        await this.client.list('/');
      }

      this.isConnected = true;
      logger.info(`Successfully connected to ${this.state} Medicaid portal`, {
        protocol: this.protocol
      });
      
      return true;
    } catch (error) {
      const errorMessage = `Failed to connect to ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        state: this.state,
        protocol: this.protocol
      });
      
      throw new IntegrationError({
        message: errorMessage,
        service: `${this.state} Medicaid (${this.portalSystem})`,
        endpoint: 'connect',
        statusCode: error.response?.status,
        responseBody: error.response?.data,
        retryable: true
      });
    }
  }

  /**
   * Closes the connection to the state Medicaid portal
   * 
   * @returns Promise resolving to true if disconnection was successful
   */
  public async disconnect(): Promise<boolean> {
    try {
      logger.info(`Disconnecting from ${this.state} Medicaid portal`, {
        protocol: this.protocol
      });

      if (!this.isConnected) {
        logger.debug('Already disconnected, no action needed');
        return true;
      }

      if (this.protocol === IntegrationProtocol.SFTP && this.client) {
        // Close SFTP connection
        await this.client.end();
      }
      
      // For REST and SOAP, no explicit disconnection is needed
      
      this.isConnected = false;
      logger.info(`Successfully disconnected from ${this.state} Medicaid portal`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to disconnect from ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error,
        state: this.state,
        protocol: this.protocol
      });
      
      return false;
    }
  }

  /**
   * Sends a request to the state Medicaid portal
   * 
   * @param endpoint Endpoint or operation to call
   * @param method HTTP method or operation name
   * @param data Request data
   * @param options Additional request options
   * @returns Promise resolving to integration response
   */
  public async sendRequest(
    endpoint: string,
    method: string,
    data: any,
    options: IntegrationRequestOptions = { timeout: 30000, retryCount: 0, retryDelay: 1000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Sending request to ${this.state} Medicaid portal`, {
        endpoint,
        method,
        protocol: this.protocol,
        correlationId: options.correlationId
      });

      // Ensure connection is established
      if (!this.isConnected) {
        await this.connect();
      }

      // Prepare common request config
      const headers = {
        ...this.headers,
        ...options.headers
      };

      // Add correlation ID if provided
      if (options.correlationId) {
        headers['X-Correlation-ID'] = options.correlationId;
      }

      // Add test mode indicator if in test mode
      if (this.testMode) {
        headers['X-Test-Mode'] = 'true';
      }

      // Format request data based on protocol and data format
      const formattedData = this.formatRequestData(data);

      let response;
      
      // Execute request based on protocol
      if (this.protocol === IntegrationProtocol.REST) {
        // For REST, use axios to send HTTP request
        const config = {
          url: endpoint,
          method: method.toLowerCase(),
          data: method.toLowerCase() !== 'get' ? formattedData : undefined,
          params: method.toLowerCase() === 'get' ? formattedData : undefined,
          headers,
          timeout: options.timeout || 30000
        };
        
        response = await this.client.request(config);
        
        return {
          success: true,
          statusCode: response.status,
          data: this.parseResponseData(response.data),
          error: null,
          metadata: {
            headers: response.headers,
            timestamp: new Date()
          }
        };
      } 
      else if (this.protocol === IntegrationProtocol.SOAP) {
        // For SOAP, construct and send SOAP envelope
        const soapEnvelope = this.constructSoapEnvelope(endpoint, formattedData);
        
        // Set the specific SOAPAction header for this operation
        const soapAction = this.getSoapAction(endpoint);
        const soapHeaders = {
          ...headers,
          'SOAPAction': soapAction
        };
        
        response = await this.client.post('', soapEnvelope, { headers: soapHeaders });
        
        // Parse SOAP response
        const parsedResponse = await this.parseSoapResponse(response.data);
        
        return {
          success: true,
          statusCode: response.status,
          data: parsedResponse,
          error: null,
          metadata: {
            headers: response.headers,
            timestamp: new Date()
          }
        };
      } 
      else if (this.protocol === IntegrationProtocol.SFTP) {
        // For SFTP, handle file upload or download
        if (method.toLowerCase() === 'put') {
          // Upload file
          const remotePath = endpoint;
          const buffer = Buffer.isBuffer(formattedData) 
            ? formattedData 
            : Buffer.from(typeof formattedData === 'string' ? formattedData : JSON.stringify(formattedData));
          
          await this.client.put(buffer, remotePath);
          
          return {
            success: true,
            statusCode: 200,
            data: { path: remotePath },
            error: null,
            metadata: {
              timestamp: new Date()
            }
          };
        } 
        else if (method.toLowerCase() === 'get') {
          // Download file
          const remotePath = endpoint;
          const fileData = await this.client.get(remotePath);
          
          return {
            success: true,
            statusCode: 200,
            data: fileData,
            error: null,
            metadata: {
              timestamp: new Date()
            }
          };
        } 
        else {
          throw new Error(`Unsupported SFTP method: ${method}`);
        }
      }

      throw new Error(`Unsupported protocol: ${this.protocol}`);
    } catch (error) {
      const errorMessage = `Error sending request to ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        endpoint,
        method,
        state: this.state,
        protocol: this.protocol,
        correlationId: options.correlationId
      });
      
      // Determine if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      // Handle retries if configured
      if (isRetryable && options.retryCount > 0) {
        logger.info(`Retrying request (${options.retryCount} attempts remaining)`, {
          endpoint,
          method,
          correlationId: options.correlationId
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, options.retryDelay || 1000));
        
        // Retry with decremented retry count
        return this.sendRequest(endpoint, method, data, {
          ...options,
          retryCount: options.retryCount - 1,
          retryDelay: (options.retryDelay || 1000) * 2 // Exponential backoff
        });
      }
      
      // Create standardized error response
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint,
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: isRetryable
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Checks the health of the Medicaid portal connection
   * 
   * @returns Promise resolving to integration health status
   */
  public async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      logger.info(`Checking health of ${this.state} Medicaid portal connection`, {
        protocol: this.protocol
      });

      // Try to connect if not already connected
      if (!this.isConnected) {
        await this.connect();
      }

      // Get the health check endpoint or use a default if not provided
      const healthCheckEndpoint = this.endpoints.healthCheck || '/health';
      
      const startTime = Date.now();
      
      let responseTime = null;
      let result = null;
      
      // Check health based on protocol
      if (this.protocol === IntegrationProtocol.REST) {
        try {
          await this.client.get(healthCheckEndpoint);
          responseTime = Date.now() - startTime;
          result = true;
        } catch (error) {
          // If no health endpoint, just test a basic connection
          if (error.response?.status === 404) {
            await this.client.get('');
            responseTime = Date.now() - startTime;
            result = true;
          } else {
            throw error;
          }
        }
      } 
      else if (this.protocol === IntegrationProtocol.SOAP) {
        // Just verify we can connect, don't actually send a SOAP request
        await this.client.get('');
        responseTime = Date.now() - startTime;
        result = true;
      } 
      else if (this.protocol === IntegrationProtocol.SFTP) {
        // List root directory to verify connection
        await this.client.list('/');
        responseTime = Date.now() - startTime;
        result = true;
      }
      
      return {
        status: result ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
        responseTime,
        lastChecked: new Date(),
        message: result ? 'Connection successful' : 'Connection failed',
        details: {
          state: this.state,
          protocol: this.protocol,
          portalSystem: this.portalSystem
        }
      };
    } catch (error) {
      logger.error(`Health check failed for ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error,
        state: this.state,
        protocol: this.protocol
      });
      
      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          state: this.state,
          protocol: this.protocol,
          portalSystem: this.portalSystem,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Submits a claim to the state Medicaid portal
   * 
   * @param claim Claim data to submit
   * @param additionalData Additional data required for the submission
   * @param options Request options
   * @returns Promise resolving to integration response with tracking information
   */
  public async submitClaim(
    claim: Claim,
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { timeout: 60000, retryCount: 3, retryDelay: 2000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Submitting claim to ${this.state} Medicaid portal`, {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        correlationId: options.correlationId
      });

      // Validate claim data
      this.validateClaimData(claim);
      
      // Get the appropriate endpoint for claim submission
      const endpoint = this.endpoints.submitClaim || '/claims';
      
      // Prepare claim data with additional required information
      const claimData = {
        ...claim,
        ...additionalData,
        providerNumber: this.providerNumber,
        submitterInfo: this.config.submitterInfo
      };
      
      // Add test indicator if in test mode
      if (this.testMode) {
        claimData.testIndicator = 'T';
      }
      
      // Format claim data based on state-specific requirements
      const formattedClaimData = this.formatClaimForState(claimData);
      
      // Send request to Medicaid portal
      const method = this.getStateSpecificConfig('claimSubmissionMethod') || 'POST';
      const response = await this.sendRequest(endpoint, method, formattedClaimData, options);
      
      // If successful, process response to extract tracking information
      if (response.success) {
        // Extract tracking info from response
        const trackingInfo = this.extractTrackingInfo(response.data);
        
        // Add tracking info to response data
        response.data = {
          ...response.data,
          trackingNumber: trackingInfo.trackingNumber,
          submissionStatus: trackingInfo.status
        };
        
        logger.info(`Claim submitted successfully to ${this.state} Medicaid portal`, {
          claimId: claim.id,
          trackingNumber: trackingInfo.trackingNumber,
          status: trackingInfo.status,
          correlationId: options.correlationId
        });
      }
      
      return response;
    } catch (error) {
      const errorMessage = `Failed to submit claim to ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        claimId: claim.id,
        state: this.state,
        correlationId: options.correlationId
      });
      
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: error instanceof IntegrationError ? error : new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint: 'submitClaim',
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: this.isRetryableError(error)
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Submits multiple claims as a batch to the state Medicaid portal
   * 
   * @param claims Array of claims to submit
   * @param additionalData Additional data required for the submission
   * @param options Request options
   * @returns Promise resolving to integration response with batch results
   */
  public async submitBatch(
    claims: Claim[],
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { timeout: 120000, retryCount: 3, retryDelay: 2000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Submitting batch of ${claims.length} claims to ${this.state} Medicaid portal`, {
        claimCount: claims.length,
        correlationId: options.correlationId
      });

      // Check if batch size is within portal limits
      const maxBatchSize = this.getStateSpecificConfig('maxBatchSize') || 100;
      if (claims.length > maxBatchSize) {
        throw new Error(`Batch size exceeds maximum allowed (${claims.length} > ${maxBatchSize})`);
      }
      
      // Get the appropriate endpoint for batch submission
      const endpoint = this.endpoints.submitBatch || '/claims/batch';
      
      // Prepare batch data
      const batchData = {
        claims: claims.map(claim => ({
          ...claim,
          providerNumber: this.providerNumber
        })),
        batchInfo: {
          batchId: additionalData.batchId || `BATCH-${new Date().getTime()}`,
          submissionDate: new Date().toISOString(),
          claimCount: claims.length,
          ...additionalData
        },
        submitterInfo: this.config.submitterInfo
      };
      
      // Add test indicator if in test mode
      if (this.testMode) {
        batchData.testIndicator = 'T';
      }
      
      // Format batch data based on state-specific requirements
      const formattedBatchData = this.formatBatchForState(batchData);
      
      // Send request to Medicaid portal
      const method = this.getStateSpecificConfig('batchSubmissionMethod') || 'POST';
      const response = await this.sendRequest(endpoint, method, formattedBatchData, options);
      
      // If successful, process response to extract batch results
      if (response.success) {
        // Extract batch results from response
        const batchResults = this.extractBatchResults(response.data);
        
        // Add batch results to response data
        response.data = {
          ...response.data,
          batchId: batchResults.batchId,
          batchStatus: batchResults.status,
          acceptedCount: batchResults.acceptedCount,
          rejectedCount: batchResults.rejectedCount,
          claimResults: batchResults.claimResults
        };
        
        logger.info(`Batch submitted successfully to ${this.state} Medicaid portal`, {
          batchId: batchResults.batchId,
          status: batchResults.status,
          acceptedCount: batchResults.acceptedCount,
          rejectedCount: batchResults.rejectedCount,
          correlationId: options.correlationId
        });
      }
      
      return response;
    } catch (error) {
      const errorMessage = `Failed to submit batch to ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        claimCount: claims.length,
        state: this.state,
        correlationId: options.correlationId
      });
      
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: error instanceof IntegrationError ? error : new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint: 'submitBatch',
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: this.isRetryableError(error)
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Checks the status of a previously submitted claim
   * 
   * @param trackingNumber Tracking number of the claim
   * @param additionalData Additional data required for the status check
   * @param options Request options
   * @returns Promise resolving to integration response with claim status
   */
  public async checkClaimStatus(
    trackingNumber: string,
    additionalData: Record<string, any> = {},
    options: IntegrationRequestOptions = { timeout: 30000, retryCount: 2, retryDelay: 1000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Checking claim status in ${this.state} Medicaid portal`, {
        trackingNumber,
        correlationId: options.correlationId
      });

      // Get the appropriate endpoint for claim status check
      const endpoint = (this.endpoints.checkClaimStatus || '/claims/status').replace(':trackingNumber', trackingNumber);
      
      // Prepare status inquiry data
      const statusData = {
        trackingNumber,
        providerNumber: this.providerNumber,
        submitterInfo: this.config.submitterInfo,
        ...additionalData
      };
      
      // Send request to Medicaid portal
      const method = this.getStateSpecificConfig('statusCheckMethod') || 'GET';
      const response = await this.sendRequest(endpoint, method, statusData, options);
      
      // If successful, process response to extract claim status
      if (response.success) {
        // Extract claim status from response
        const claimStatusInfo = this.extractClaimStatusInfo(response.data);
        
        // Map state-specific status to internal ClaimStatus
        const mappedStatus = this.mapClaimStatusFromState(claimStatusInfo.statusCode);
        
        // Add status information to response data
        response.data = {
          ...response.data,
          claimStatus: mappedStatus,
          stateStatus: claimStatusInfo.statusCode,
          statusDescription: claimStatusInfo.statusDescription,
          lastUpdated: claimStatusInfo.lastUpdated
        };
        
        logger.info(`Claim status check completed for ${this.state} Medicaid portal`, {
          trackingNumber,
          status: mappedStatus,
          stateStatus: claimStatusInfo.statusCode,
          correlationId: options.correlationId
        });
      }
      
      return response;
    } catch (error) {
      const errorMessage = `Failed to check claim status in ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        trackingNumber,
        state: this.state,
        correlationId: options.correlationId
      });
      
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: error instanceof IntegrationError ? error : new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint: 'checkClaimStatus',
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: this.isRetryableError(error)
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Verifies patient eligibility with the state Medicaid program
   * 
   * @param patientData Patient identification data
   * @param providerData Provider information
   * @param options Request options
   * @returns Promise resolving to integration response with eligibility information
   */
  public async verifyEligibility(
    patientData: Record<string, any>,
    providerData: Record<string, any> = {},
    options: IntegrationRequestOptions = { timeout: 30000, retryCount: 2, retryDelay: 1000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Verifying eligibility in ${this.state} Medicaid portal`, {
        patientId: patientData.medicaidId || patientData.id,
        correlationId: options.correlationId
      });

      // Validate patient data
      if (!patientData.medicaidId && !patientData.ssn) {
        throw new Error('Either Medicaid ID or SSN is required for eligibility verification');
      }
      
      // Get the appropriate endpoint for eligibility verification
      const endpoint = this.endpoints.verifyEligibility || '/eligibility';
      
      // Prepare eligibility request data
      const eligibilityData = {
        patient: patientData,
        provider: {
          providerNumber: this.providerNumber,
          ...providerData
        },
        submitterInfo: this.config.submitterInfo,
        inquiryDate: new Date().toISOString().substring(0, 10) // YYYY-MM-DD
      };
      
      // Format request based on state-specific requirements
      const formattedEligibilityData = this.formatEligibilityForState(eligibilityData);
      
      // Send request to Medicaid portal
      const method = this.getStateSpecificConfig('eligibilityMethod') || 'POST';
      const response = await this.sendRequest(endpoint, method, formattedEligibilityData, options);
      
      // If successful, process response to extract eligibility information
      if (response.success) {
        // Extract eligibility info from response
        const eligibilityInfo = this.extractEligibilityInfo(response.data);
        
        // Add eligibility information to response data
        response.data = {
          ...response.data,
          isEligible: eligibilityInfo.isEligible,
          eligibilityStatus: eligibilityInfo.status,
          coverageDetails: eligibilityInfo.coverageDetails,
          eligibleFrom: eligibilityInfo.eligibleFrom,
          eligibleTo: eligibilityInfo.eligibleTo
        };
        
        logger.info(`Eligibility verification completed for ${this.state} Medicaid portal`, {
          patientId: patientData.medicaidId || patientData.id,
          isEligible: eligibilityInfo.isEligible,
          status: eligibilityInfo.status,
          correlationId: options.correlationId
        });
      }
      
      return response;
    } catch (error) {
      const errorMessage = `Failed to verify eligibility in ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        patientId: patientData.medicaidId || patientData.id,
        state: this.state,
        correlationId: options.correlationId
      });
      
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: error instanceof IntegrationError ? error : new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint: 'verifyEligibility',
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: this.isRetryableError(error)
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Generic method to execute operations on the Medicaid portal
   * 
   * @param operation Operation to execute
   * @param data Operation data
   * @param options Request options
   * @returns Promise resolving to integration response
   */
  public async execute(
    operation: string,
    data: any,
    options: IntegrationRequestOptions = { timeout: 30000, retryCount: 2, retryDelay: 1000, headers: {}, correlationId: '', priority: 0 }
  ): Promise<IntegrationResponse> {
    try {
      logger.info(`Executing operation '${operation}' on ${this.state} Medicaid portal`, {
        operation,
        correlationId: options.correlationId
      });
      
      // Map operation to endpoint and method
      const operationMap = this.getOperationMapping(operation);
      
      if (!operationMap) {
        throw new Error(`Unknown operation: ${operation}`);
      }
      
      // Send request to portal
      return await this.sendRequest(operationMap.endpoint, operationMap.method, data, options);
    } catch (error) {
      const errorMessage = `Failed to execute operation '${operation}' on ${this.state} Medicaid portal: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, {
        error,
        operation,
        state: this.state,
        correlationId: options.correlationId
      });
      
      return {
        success: false,
        statusCode: error.response?.status || 500,
        data: null,
        error: error instanceof IntegrationError ? error : new IntegrationError({
          message: errorMessage,
          service: `${this.state} Medicaid (${this.portalSystem})`,
          endpoint: operation,
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          retryable: this.isRetryableError(error)
        }),
        metadata: {
          timestamp: new Date(),
          correlationId: options.correlationId
        }
      };
    }
  }

  /**
   * Formats request data based on the data format and state-specific requirements
   * 
   * @param data Data to format
   * @returns Formatted data ready for transmission
   */
  private formatRequestData(data: any): any {
    try {
      if (this.dataFormat === DataFormat.JSON) {
        // For JSON, ensure the data is properly serialized
        return typeof data === 'string' ? JSON.parse(data) : data;
      } 
      else if (this.dataFormat === DataFormat.XML) {
        // For XML, convert data object to XML
        const builder = new xml2js.Builder({
          rootName: this.getStateSpecificConfig('xmlRootElement') || 'request',
          headless: true,
          renderOpts: {
            pretty: true,
            indent: '  '
          }
        });
        
        return builder.buildObject(data);
      } 
      else if (this.dataFormat === DataFormat.X12) {
        // For X12, format data as EDI X12
        // This is a simplified placeholder; actual X12 formatting would be more complex
        return this.formatX12Data(data);
      }
      
      // Default: return data as-is
      return data;
    } catch (error) {
      logger.error(`Error formatting request data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error,
        dataFormat: this.dataFormat
      });
      
      throw new IntegrationError({
        message: `Failed to format request data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        service: `${this.state} Medicaid (${this.portalSystem})`,
        endpoint: 'formatRequestData'
      });
    }
  }

  /**
   * Parses response data based on the data format and state-specific patterns
   * 
   * @param data Response data to parse
   * @returns Parsed data in a standardized format
   */
  private parseResponseData(data: any): any {
    try {
      if (this.dataFormat === DataFormat.JSON) {
        // For JSON, ensure data is parsed if it's a string
        return typeof data === 'string' ? JSON.parse(data) : data;
      } 
      else if (this.dataFormat === DataFormat.XML) {
        // For XML, parse XML to JS object
        if (typeof data !== 'string') {
          return data; // Already parsed
        }
        
        return new Promise((resolve, reject) => {
          xml2js.parseString(data, {
            explicitArray: false,
            trim: true,
            explicitRoot: false
          }, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      } 
      else if (this.dataFormat === DataFormat.X12) {
        // For X12, parse EDI X12 format
        // This is a simplified placeholder; actual X12 parsing would be more complex
        return this.parseX12Data(data);
      }
      
      // Default: return data as-is
      return data;
    } catch (error) {
      logger.error(`Error parsing response data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error,
        dataFormat: this.dataFormat
      });
      
      throw new IntegrationError({
        message: `Failed to parse response data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        service: `${this.state} Medicaid (${this.portalSystem})`,
        endpoint: 'parseResponseData'
      });
    }
  }

  /**
   * Maps state-specific status codes to the system's ClaimStatus enum values
   * 
   * @param statusCode State-specific status code
   * @returns Mapped internal claim status
   */
  private mapClaimStatusFromState(statusCode: string): ClaimStatus {
    // Get state-specific mappings
    const statusMappings = this.getStateSpecificConfig('statusMappings') || {};
    
    // If we have a direct mapping, use it
    if (statusMappings[statusCode]) {
      return statusMappings[statusCode];
    }
    
    // State-specific status mapping logic
    switch (this.state) {
      case 'CA':
        // California Medicaid (Medi-Cal) specific mappings
        switch (statusCode) {
          case 'PEND': return ClaimStatus.PENDING;
          case 'DENY': return ClaimStatus.DENIED;
          case 'PAID': return ClaimStatus.PAID;
          case 'PART': return ClaimStatus.PARTIAL_PAID;
          case 'SUSP': return ClaimStatus.PENDING;
          case 'ACKD': return ClaimStatus.ACKNOWLEDGED;
          default: return ClaimStatus.PENDING;
        }
      
      case 'NY':
        // New York Medicaid specific mappings
        switch (statusCode) {
          case 'A': return ClaimStatus.ACKNOWLEDGED;
          case 'P': return ClaimStatus.PENDING;
          case 'D': return ClaimStatus.DENIED;
          case 'F': return ClaimStatus.PAID;
          case 'R': return ClaimStatus.DENIED;
          default: return ClaimStatus.PENDING;
        }
      
      case 'TX':
        // Texas Medicaid specific mappings
        switch (statusCode) {
          case 'ACCEPTED': return ClaimStatus.ACKNOWLEDGED;
          case 'IN PROCESS': return ClaimStatus.PENDING;
          case 'FINALIZED': return ClaimStatus.PAID;
          case 'DENIED': return ClaimStatus.DENIED;
          case 'PARTIAL PAY': return ClaimStatus.PARTIAL_PAID;
          default: return ClaimStatus.PENDING;
        }
      
      case 'FL':
        // Florida Medicaid specific mappings
        switch (statusCode) {
          case '1': return ClaimStatus.ACKNOWLEDGED;
          case '2': return ClaimStatus.PENDING;
          case '3': return ClaimStatus.PAID;
          case '4': return ClaimStatus.DENIED;
          case '5': return ClaimStatus.PARTIAL_PAID;
          default: return ClaimStatus.PENDING;
        }
      
      // Add more states as needed
      
      default:
        // Generic mapping based on common terminology
        if (statusCode.toUpperCase().includes('REJECT') || statusCode.toUpperCase().includes('DENY')) {
          return ClaimStatus.DENIED;
        } else if (statusCode.toUpperCase().includes('PAID')) {
          return ClaimStatus.PAID;
        } else if (statusCode.toUpperCase().includes('PARTIAL')) {
          return ClaimStatus.PARTIAL_PAID;
        } else if (statusCode.toUpperCase().includes('PEND')) {
          return ClaimStatus.PENDING;
        } else if (statusCode.toUpperCase().includes('ACK')) {
          return ClaimStatus.ACKNOWLEDGED;
        }
        
        // Log a warning for unmapped status codes
        logger.warn(`Unmapped status code '${statusCode}' for state ${this.state}`, {
          statusCode,
          state: this.state
        });
        
        return ClaimStatus.PENDING; // Default to pending if we can't determine status
    }
  }

  /**
   * Gets state-specific configuration settings for the Medicaid portal
   * 
   * @param configKey The configuration key to get
   * @returns The state-specific configuration value
   */
  private getStateSpecificConfig(configKey: string): any {
    const stateConfigs = {
      'CA': {
        // California Medicaid (Medi-Cal) specific configurations
        xmlRootElement: 'MediCalRequest',
        claimSubmissionMethod: 'POST',
        batchSubmissionMethod: 'POST',
        statusCheckMethod: 'GET',
        eligibilityMethod: 'POST',
        maxBatchSize: 100,
        statusMappings: {
          'PEND': ClaimStatus.PENDING,
          'DENY': ClaimStatus.DENIED,
          'PAID': ClaimStatus.PAID,
          'PART': ClaimStatus.PARTIAL_PAID,
          'SUSP': ClaimStatus.PENDING,
          'ACKD': ClaimStatus.ACKNOWLEDGED
        }
      },
      'NY': {
        // New York Medicaid specific configurations
        xmlRootElement: 'NYMedicaidRequest',
        claimSubmissionMethod: 'POST',
        batchSubmissionMethod: 'POST',
        statusCheckMethod: 'GET',
        eligibilityMethod: 'POST',
        maxBatchSize: 50,
        statusMappings: {
          'A': ClaimStatus.ACKNOWLEDGED,
          'P': ClaimStatus.PENDING,
          'D': ClaimStatus.DENIED,
          'F': ClaimStatus.PAID,
          'R': ClaimStatus.DENIED
        }
      },
      'TX': {
        // Texas Medicaid specific configurations
        xmlRootElement: 'TXMedicaidRequest',
        claimSubmissionMethod: 'POST',
        batchSubmissionMethod: 'POST',
        statusCheckMethod: 'GET',
        eligibilityMethod: 'POST',
        maxBatchSize: 100,
        statusMappings: {
          'ACCEPTED': ClaimStatus.ACKNOWLEDGED,
          'IN PROCESS': ClaimStatus.PENDING,
          'FINALIZED': ClaimStatus.PAID,
          'DENIED': ClaimStatus.DENIED,
          'PARTIAL PAY': ClaimStatus.PARTIAL_PAID
        }
      },
      'FL': {
        // Florida Medicaid specific configurations
        xmlRootElement: 'FLMedicaidRequest',
        claimSubmissionMethod: 'POST',
        batchSubmissionMethod: 'POST',
        statusCheckMethod: 'GET',
        eligibilityMethod: 'POST',
        maxBatchSize: 100,
        statusMappings: {
          '1': ClaimStatus.ACKNOWLEDGED,
          '2': ClaimStatus.PENDING,
          '3': ClaimStatus.PAID,
          '4': ClaimStatus.DENIED,
          '5': ClaimStatus.PARTIAL_PAID
        }
      }
      // Add more states as needed
    };
    
    // Get state-specific config if available
    const stateConfig = stateConfigs[this.state];
    if (stateConfig && stateConfig[configKey] !== undefined) {
      logger.debug(`Using state-specific config for ${this.state}.${configKey}`, {
        value: stateConfig[configKey]
      });
      return stateConfig[configKey];
    }
    
    // Return default config based on key
    const defaultConfigs = {
      xmlRootElement: 'MedicaidRequest',
      claimSubmissionMethod: 'POST',
      batchSubmissionMethod: 'POST',
      statusCheckMethod: 'GET',
      eligibilityMethod: 'POST',
      maxBatchSize: 100
    };
    
    return defaultConfigs[configKey];
  }

  // Helper methods for formatting and processing data

  /**
   * Validates claim data to ensure required fields are present
   * 
   * @param claim Claim data to validate
   * @throws Error if validation fails
   */
  private validateClaimData(claim: Claim): void {
    if (!claim.id) throw new Error('Claim ID is required');
    if (!claim.clientId) throw new Error('Client ID is required');
    if (!claim.payerId) throw new Error('Payer ID is required');
    if (!claim.serviceStartDate) throw new Error('Service start date is required');
    if (!claim.serviceEndDate) throw new Error('Service end date is required');
    if (!claim.totalAmount) throw new Error('Claim amount is required');
    
    // Add more validation rules as needed
  }

  /**
   * Constructs a SOAP envelope for SOAP protocol requests
   * 
   * @param endpoint The endpoint/operation being called
   * @param data The data to include in the SOAP body
   * @returns SOAP envelope XML string
   */
  private constructSoapEnvelope(endpoint: string, data: any): string {
    // Extract operation name from endpoint
    const operation = endpoint.split('/').pop() || 'unknown';
    
    // Simplified SOAP envelope construction
    return `
      <soapenv:Envelope 
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
        xmlns:med="${this.getStateSpecificConfig('soapNamespace') || 'http://medicaid.state.gov/services'}">
        <soapenv:Header>
          ${this.credentials.username && this.credentials.password ? `
            <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
              <wsse:UsernameToken>
                <wsse:Username>${this.credentials.username}</wsse:Username>
                <wsse:Password>${this.credentials.password}</wsse:Password>
              </wsse:UsernameToken>
            </wsse:Security>
          ` : ''}
        </soapenv:Header>
        <soapenv:Body>
          <med:${operation}>
            ${typeof data === 'string' ? data : JSON.stringify(data)}
          </med:${operation}>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
  }

  /**
   * Gets the SOAP action header value for a given endpoint
   * 
   * @param endpoint The endpoint being called
   * @returns SOAP action header value
   */
  private getSoapAction(endpoint: string): string {
    // Extract operation name from endpoint
    const operation = endpoint.split('/').pop() || 'unknown';
    
    // Construct SOAP action
    return `${this.getStateSpecificConfig('soapActionPrefix') || 'http://medicaid.state.gov/services/'}${operation}`;
  }

  /**
   * Parses a SOAP response into a structured object
   * 
   * @param soapResponse SOAP response XML string
   * @returns Parsed response data
   */
  private async parseSoapResponse(soapResponse: string): Promise<any> {
    // Parse XML response
    return new Promise((resolve, reject) => {
      xml2js.parseString(soapResponse, {
        explicitArray: false,
        trim: true
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Extract response from SOAP envelope
          const envelope = result['soapenv:Envelope'] || result['soap:Envelope'] || result.Envelope;
          if (!envelope) {
            reject(new Error('Invalid SOAP response: no Envelope element found'));
            return;
          }
          
          const body = envelope['soapenv:Body'] || envelope['soap:Body'] || envelope.Body;
          if (!body) {
            reject(new Error('Invalid SOAP response: no Body element found'));
            return;
          }
          
          // Find response element (usually operation name + "Response")
          const responseKey = Object.keys(body).find(key => key.endsWith('Response'));
          if (!responseKey) {
            reject(new Error('Invalid SOAP response: no response element found'));
            return;
          }
          
          resolve(body[responseKey]);
        }
      });
    });
  }

  /**
   * Formats data for X12 EDI format (simplified implementation)
   * 
   * @param data Data to format as X12
   * @returns X12 formatted string
   */
  private formatX12Data(data: any): string {
    // This is a simplified placeholder
    // Actual X12 formatting would require a specialized library or more complex implementation
    // to handle segments, delimiters, and X12 syntax correctly
    
    // For now, we'll just create a simple representation
    const segments = [];
    
    // ISA header segment
    segments.push(`ISA*00*          *00*          *ZZ*${this.padRight(this.config.submitterInfo.senderId || 'SENDER', 15)}*ZZ*${this.padRight(this.config.submitterInfo.receiverId || 'RECEIVER', 15)}*${this.getFormattedDate()}*${this.getFormattedTime()}*^*00501*${this.getControlNumber()}*0*P*:`);
    
    // GS segment
    segments.push(`GS*HC*${this.config.submitterInfo.senderId || 'SENDER'}*${this.config.submitterInfo.receiverId || 'RECEIVER'}*${this.getFormattedDate()}*${this.getFormattedTime()}*1*X*005010X222A1`);
    
    // Simplified ST segment for a claim transaction
    segments.push(`ST*837*0001*005010X222A1`);
    
    // Add more segments based on data...
    // This would require complex mapping of the data to X12 segments
    
    // End with SE, GE, IEA segments
    segments.push(`SE*${segments.length + 1}*0001`);
    segments.push(`GE*1*1`);
    segments.push(`IEA*1*${this.getControlNumber()}`);
    
    return segments.join('~') + '~';
  }

  /**
   * Parses X12 EDI formatted data (simplified implementation)
   * 
   * @param x12Data X12 formatted string
   * @returns Parsed data object
   */
  private parseX12Data(x12Data: string): any {
    // This is a simplified placeholder
    // Actual X12 parsing would require a specialized library or more complex implementation
    
    // For now, we'll just extract some basic information
    const segments = x12Data.split('~');
    const result: Record<string, any> = {
      segments: segments.length
    };
    
    // Extract information from ISA segment
    const isaSeg = segments.find(seg => seg.startsWith('ISA*'));
    if (isaSeg) {
      const isaParts = isaSeg.split('*');
      if (isaParts.length >= 15) {
        result.senderId = isaParts[6].trim();
        result.receiverId = isaParts[8].trim();
        result.date = isaParts[9].trim();
        result.time = isaParts[10].trim();
        result.controlNumber = isaParts[13].trim();
      }
    }
    
    // Extract claim information from CLM segments
    const clmSegs = segments.filter(seg => seg.startsWith('CLM*'));
    if (clmSegs.length > 0) {
      result.claims = clmSegs.map(clmSeg => {
        const clmParts = clmSeg.split('*');
        return {
          patientControlNumber: clmParts[1]?.trim(),
          totalCharges: clmParts[2]?.trim()
        };
      });
    }
    
    return result;
  }

  /**
   * Formats claim data according to state-specific requirements
   * 
   * @param claimData Claim data to format
   * @returns Formatted claim data
   */
  private formatClaimForState(claimData: any): any {
    // Apply state-specific formatting rules
    switch (this.state) {
      case 'CA':
        // California Medicaid (Medi-Cal) specific formatting
        return {
          claim_information: {
            tcn: claimData.claimNumber,
            service_dates: {
              from_date: claimData.serviceStartDate,
              to_date: claimData.serviceEndDate
            },
            provider: {
              npi: this.providerNumber,
              taxonomy: claimData.providerTaxonomy || ''
            },
            patient: {
              medicaid_id: claimData.client?.medicaidId || '',
              patient_control_number: claimData.claimNumber
            },
            claim_amount: claimData.totalAmount,
            services: claimData.services || []
          },
          submission_info: {
            submitter_id: claimData.submitterInfo?.senderId || '',
            test_indicator: this.testMode ? 'T' : 'P'
          }
        };
      
      case 'NY':
        // New York Medicaid specific formatting
        return {
          header: {
            transaction_type: 'CLAIM',
            transaction_id: claimData.claimNumber
          },
          provider: {
            mmis_provider_id: this.providerNumber,
            npi: claimData.providerNpi || ''
          },
          subscriber: {
            client_id: claimData.client?.medicaidId || '',
            last_name: claimData.client?.lastName || '',
            first_name: claimData.client?.firstName || '',
            date_of_birth: claimData.client?.dateOfBirth || ''
          },
          claim: {
            service_from_date: claimData.serviceStartDate,
            service_to_date: claimData.serviceEndDate,
            total_amount: claimData.totalAmount,
            services: claimData.services || []
          },
          test_indicator: this.testMode ? 'Y' : 'N'
        };
      
      case 'TX':
        // Texas Medicaid specific formatting
        return {
          claimData: {
            claimId: claimData.claimNumber,
            clientId: claimData.client?.medicaidId || '',
            providerId: this.providerNumber,
            serviceDate: {
              start: claimData.serviceStartDate,
              end: claimData.serviceEndDate
            },
            amount: claimData.totalAmount.toString(),
            serviceLines: claimData.services || []
          },
          submissionInfo: {
            submitterId: claimData.submitterInfo?.senderId || '',
            testClaim: this.testMode ? 'Y' : 'N'
          }
        };
      
      // Add more states as needed
      
      default:
        // Default formatting
        return {
          claim: {
            id: claimData.claimNumber,
            provider_id: this.providerNumber,
            medicaid_id: claimData.client?.medicaidId || '',
            service_start_date: claimData.serviceStartDate,
            service_end_date: claimData.serviceEndDate,
            total_amount: claimData.totalAmount,
            services: claimData.services || []
          },
          submitter: claimData.submitterInfo || {},
          test_mode: this.testMode
        };
    }
  }

  /**
   * Formats batch data according to state-specific requirements
   * 
   * @param batchData Batch data to format
   * @returns Formatted batch data
   */
  private formatBatchForState(batchData: any): any {
    // Apply state-specific formatting rules for batches
    switch (this.state) {
      case 'CA':
        // California specific formatting
        return {
          batch_submission: {
            batch_id: batchData.batchInfo.batchId,
            submission_date: batchData.batchInfo.submissionDate,
            submitter_id: batchData.submitterInfo?.senderId || '',
            provider_npi: this.providerNumber,
            claim_count: batchData.claims.length,
            test_indicator: this.testMode ? 'T' : 'P',
            claims: batchData.claims.map(claim => this.formatClaimForState(claim))
          }
        };
      
      // Add more states as needed
      
      default:
        // Default formatting
        return {
          batch: {
            id: batchData.batchInfo.batchId,
            submission_date: batchData.batchInfo.submissionDate,
            claim_count: batchData.claims.length,
            provider_id: this.providerNumber,
            submitter: batchData.submitterInfo || {},
            test_mode: this.testMode,
            claims: batchData.claims.map(claim => this.formatClaimForState(claim))
          }
        };
    }
  }

  /**
   * Formats eligibility request data according to state-specific requirements
   * 
   * @param eligibilityData Eligibility data to format
   * @returns Formatted eligibility data
   */
  private formatEligibilityForState(eligibilityData: any): any {
    // Apply state-specific formatting rules for eligibility
    switch (this.state) {
      case 'CA':
        // California specific formatting
        return {
          eligibility_request: {
            request_date: eligibilityData.inquiryDate,
            provider_npi: this.providerNumber,
            subscriber: {
              medicaid_id: eligibilityData.patient.medicaidId || '',
              ssn: eligibilityData.patient.ssn || '',
              last_name: eligibilityData.patient.lastName || '',
              first_name: eligibilityData.patient.firstName || '',
              date_of_birth: eligibilityData.patient.dateOfBirth || '',
              gender: eligibilityData.patient.gender || ''
            },
            service_type: eligibilityData.serviceType || 'HCBS'
          }
        };
      
      // Add more states as needed
      
      default:
        // Default formatting
        return {
          eligibility: {
            inquiry_date: eligibilityData.inquiryDate,
            provider_id: this.providerNumber,
            patient: {
              medicaid_id: eligibilityData.patient.medicaidId || '',
              ssn: eligibilityData.patient.ssn || '',
              last_name: eligibilityData.patient.lastName || '',
              first_name: eligibilityData.patient.firstName || '',
              date_of_birth: eligibilityData.patient.dateOfBirth || ''
            },
            service_type: eligibilityData.serviceType || ''
          }
        };
    }
  }

  /**
   * Extracts tracking information from a claim submission response
   * 
   * @param responseData Response data from claim submission
   * @returns Tracking information
   */
  private extractTrackingInfo(responseData: any): { trackingNumber: string; status: string } {
    // Apply state-specific extraction rules
    switch (this.state) {
      case 'CA':
        // California specific extraction
        return {
          trackingNumber: responseData.claim_response?.tcn || responseData.tcn || '',
          status: responseData.claim_response?.status || responseData.status || ''
        };
      
      case 'NY':
        // New York specific extraction
        return {
          trackingNumber: responseData.response?.tracking_number || responseData.tracking_number || '',
          status: responseData.response?.status || responseData.status || ''
        };
      
      // Add more states as needed
      
      default:
        // Default extraction
        // Try to find tracking number in various possible locations
        let trackingNumber = '';
        let status = '';
        
        if (responseData.tracking_number) {
          trackingNumber = responseData.tracking_number;
        } else if (responseData.trackingNumber) {
          trackingNumber = responseData.trackingNumber;
        } else if (responseData.claim_id) {
          trackingNumber = responseData.claim_id;
        } else if (responseData.claimId) {
          trackingNumber = responseData.claimId;
        } else if (responseData.tcn) {
          trackingNumber = responseData.tcn;
        }
        
        if (responseData.status) {
          status = responseData.status;
        } else if (responseData.claim_status) {
          status = responseData.claim_status;
        } else if (responseData.claimStatus) {
          status = responseData.claimStatus;
        }
        
        return { trackingNumber, status };
    }
  }

  /**
   * Extracts batch results from a batch submission response
   * 
   * @param responseData Response data from batch submission
   * @returns Batch results information
   */
  private extractBatchResults(responseData: any): { 
    batchId: string; 
    status: string; 
    acceptedCount: number; 
    rejectedCount: number;
    claimResults: Array<{ claimId: string; status: string; errors?: string[] }>
  } {
    // Apply state-specific extraction rules
    switch (this.state) {
      case 'CA':
        // California specific extraction
        return {
          batchId: responseData.batch_response?.batch_id || responseData.batch_id || '',
          status: responseData.batch_response?.status || responseData.status || '',
          acceptedCount: parseInt(responseData.batch_response?.accepted_count || responseData.accepted_count || '0', 10),
          rejectedCount: parseInt(responseData.batch_response?.rejected_count || responseData.rejected_count || '0', 10),
          claimResults: (responseData.batch_response?.claim_results || responseData.claim_results || []).map(result => ({
            claimId: result.claim_id || result.claimId || '',
            status: result.status || '',
            errors: result.errors || []
          }))
        };
      
      // Add more states as needed
      
      default:
        // Default extraction
        // Try to find batch information in various possible locations
        let batchId = '';
        let status = '';
        let acceptedCount = 0;
        let rejectedCount = 0;
        let claimResults = [];
        
        if (responseData.batch_id) {
          batchId = responseData.batch_id;
        } else if (responseData.batchId) {
          batchId = responseData.batchId;
        }
        
        if (responseData.status) {
          status = responseData.status;
        } else if (responseData.batch_status) {
          status = responseData.batch_status;
        } else if (responseData.batchStatus) {
          status = responseData.batchStatus;
        }
        
        if (responseData.accepted_count !== undefined) {
          acceptedCount = parseInt(responseData.accepted_count, 10);
        } else if (responseData.acceptedCount !== undefined) {
          acceptedCount = parseInt(responseData.acceptedCount, 10);
        }
        
        if (responseData.rejected_count !== undefined) {
          rejectedCount = parseInt(responseData.rejected_count, 10);
        } else if (responseData.rejectedCount !== undefined) {
          rejectedCount = parseInt(responseData.rejectedCount, 10);
        }
        
        if (responseData.claim_results) {
          claimResults = responseData.claim_results;
        } else if (responseData.claimResults) {
          claimResults = responseData.claimResults;
        } else if (responseData.claims) {
          claimResults = responseData.claims;
        }
        
        return { 
          batchId, 
          status, 
          acceptedCount, 
          rejectedCount, 
          claimResults: claimResults.map(result => ({
            claimId: result.claim_id || result.claimId || '',
            status: result.status || '',
            errors: result.errors || []
          }))
        };
    }
  }

  /**
   * Extracts claim status information from a status check response
   * 
   * @param responseData Response data from status check
   * @returns Claim status information
   */
  private extractClaimStatusInfo(responseData: any): { 
    statusCode: string; 
    statusDescription: string; 
    lastUpdated: string 
  } {
    // Apply state-specific extraction rules
    switch (this.state) {
      case 'CA':
        // California specific extraction
        return {
          statusCode: responseData.claim_status?.status_code || responseData.status_code || '',
          statusDescription: responseData.claim_status?.status_description || responseData.status_description || '',
          lastUpdated: responseData.claim_status?.last_updated || responseData.last_updated || new Date().toISOString()
        };
      
      // Add more states as needed
      
      default:
        // Default extraction
        // Try to find status information in various possible locations
        let statusCode = '';
        let statusDescription = '';
        let lastUpdated = new Date().toISOString();
        
        if (responseData.status_code) {
          statusCode = responseData.status_code;
        } else if (responseData.statusCode) {
          statusCode = responseData.statusCode;
        } else if (responseData.status) {
          statusCode = responseData.status;
        }
        
        if (responseData.status_description) {
          statusDescription = responseData.status_description;
        } else if (responseData.statusDescription) {
          statusDescription = responseData.statusDescription;
        } else if (responseData.description) {
          statusDescription = responseData.description;
        }
        
        if (responseData.last_updated) {
          lastUpdated = responseData.last_updated;
        } else if (responseData.lastUpdated) {
          lastUpdated = responseData.lastUpdated;
        } else if (responseData.update_date) {
          lastUpdated = responseData.update_date;
        }
        
        return { statusCode, statusDescription, lastUpdated };
    }
  }

  /**
   * Extracts eligibility information from an eligibility verification response
   * 
   * @param responseData Response data from eligibility verification
   * @returns Eligibility information
   */
  private extractEligibilityInfo(responseData: any): { 
    isEligible: boolean; 
    status: string; 
    coverageDetails: any; 
    eligibleFrom: string; 
    eligibleTo: string 
  } {
    // Apply state-specific extraction rules
    switch (this.state) {
      case 'CA':
        // California specific extraction
        const eligData = responseData.eligibility_response || responseData;
        return {
          isEligible: (eligData.eligibility_indicator || '').toUpperCase() === 'Y',
          status: eligData.status || '',
          coverageDetails: eligData.coverage_details || {},
          eligibleFrom: eligData.eligible_from || '',
          eligibleTo: eligData.eligible_to || ''
        };
      
      // Add more states as needed
      
      default:
        // Default extraction
        // Try to find eligibility information in various possible locations
        let isEligible = false;
        let status = '';
        let coverageDetails = {};
        let eligibleFrom = '';
        let eligibleTo = '';
        
        if (responseData.is_eligible !== undefined) {
          isEligible = responseData.is_eligible;
        } else if (responseData.isEligible !== undefined) {
          isEligible = responseData.isEligible;
        } else if (responseData.eligibility_indicator) {
          isEligible = responseData.eligibility_indicator.toUpperCase() === 'Y';
        } else if (responseData.eligibilityIndicator) {
          isEligible = responseData.eligibilityIndicator.toUpperCase() === 'Y';
        }
        
        if (responseData.status) {
          status = responseData.status;
        } else if (responseData.eligibility_status) {
          status = responseData.eligibility_status;
        } else if (responseData.eligibilityStatus) {
          status = responseData.eligibilityStatus;
        }
        
        if (responseData.coverage_details) {
          coverageDetails = responseData.coverage_details;
        } else if (responseData.coverageDetails) {
          coverageDetails = responseData.coverageDetails;
        } else if (responseData.coverage) {
          coverageDetails = responseData.coverage;
        }
        
        if (responseData.eligible_from) {
          eligibleFrom = responseData.eligible_from;
        } else if (responseData.eligibleFrom) {
          eligibleFrom = responseData.eligibleFrom;
        } else if (responseData.effective_date) {
          eligibleFrom = responseData.effective_date;
        }
        
        if (responseData.eligible_to) {
          eligibleTo = responseData.eligible_to;
        } else if (responseData.eligibleTo) {
          eligibleTo = responseData.eligibleTo;
        } else if (responseData.termination_date) {
          eligibleTo = responseData.termination_date;
        }
        
        return { isEligible, status, coverageDetails, eligibleFrom, eligibleTo };
    }
  }

  /**
   * Gets the mapping for a named operation to endpoint and method
   * 
   * @param operation Operation name
   * @returns Mapping with endpoint and method, or undefined if not found
   */
  private getOperationMapping(operation: string): { endpoint: string; method: string } | undefined {
    const operationMappings: Record<string, { endpoint: string; method: string }> = {
      // Common operations
      'submitClaim': { 
        endpoint: this.endpoints.submitClaim || '/claims', 
        method: this.getStateSpecificConfig('claimSubmissionMethod') || 'POST' 
      },
      'submitBatch': { 
        endpoint: this.endpoints.submitBatch || '/claims/batch', 
        method: this.getStateSpecificConfig('batchSubmissionMethod') || 'POST' 
      },
      'checkClaimStatus': { 
        endpoint: this.endpoints.checkClaimStatus || '/claims/status', 
        method: this.getStateSpecificConfig('statusCheckMethod') || 'GET' 
      },
      'verifyEligibility': { 
        endpoint: this.endpoints.verifyEligibility || '/eligibility', 
        method: this.getStateSpecificConfig('eligibilityMethod') || 'POST' 
      },
      
      // Add more operation mappings as needed
    };
    
    return operationMappings[operation];
  }

  /**
   * Determines if an error is retryable based on its characteristics
   * 
   * @param error Error to evaluate
   * @returns True if the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // If it's already an IntegrationError, use its retryable property
    if (error instanceof IntegrationError) {
      return error.isRetryable();
    }
    
    // If it has a response with a status code, check if it's a retryable status
    if (error.response?.status) {
      // 5xx errors are typically server errors and can be retried
      // 429 is too many requests, which can be retried after waiting
      return error.response.status >= 500 || error.response.status === 429;
    }
    
    // Network errors are typically retryable
    if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Default to not retryable for unknown errors
    return false;
  }

  // Utility methods

  /**
   * Pads a string to the right with spaces to reach the specified length
   * 
   * @param str String to pad
   * @param length Target length
   * @returns Padded string
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  /**
   * Gets current date formatted for X12 (YYMMDD)
   * 
   * @returns Formatted date string
   */
  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return year + month + day;
  }

  /**
   * Gets current time formatted for X12 (HHMM)
   * 
   * @returns Formatted time string
   */
  private getFormattedTime(): string {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    return hour + minute;
  }

  /**
   * Gets a unique control number for X12 transactions
   * 
   * @returns Control number string
   */
  private getControlNumber(): string {
    // Generate a 9-digit control number
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }
}

export default MedicaidAdapter;