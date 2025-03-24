import { 
  IntegrationAdapter,
  IntegrationConfig,
  AccountingIntegrationConfig,
  IntegrationProtocol,
  DataFormat,
  IntegrationResponse,
  IntegrationRequestOptions,
  IntegrationHealthStatus,
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  IntegrationStatus,
  AuthenticationType
} from '../../types/integration.types';
import { Payment } from '../../types/payments.types';
import IntegrationError from '../../errors/integration-error';
import logger from '../../utils/logger';
import { createCorrelationId } from '../../utils/id-generator';
import axios from 'axios'; // axios 1.4.0
import * as fs from 'fs-extra'; // fs-extra 11.1.1
import * as path from 'path'; // path 0.12.7

/**
 * Creates a circuit breaker for resilient integration with external systems
 * Implements the circuit breaker pattern to prevent cascade failures when external systems are unresponsive
 * 
 * @param config Configuration for the circuit breaker behavior
 * @returns Object with execute method and stats for the circuit breaker
 */
function createCircuitBreaker(config: CircuitBreakerConfig) {
  // Initialize stats with closed state
  const stats: CircuitBreakerStats = {
    state: CircuitBreakerState.CLOSED,
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    lastStateChange: new Date()
  };

  // Reset timeout reference
  let resetTimeout: NodeJS.Timeout | null = null;

  const execute = async <T>(fn: () => Promise<T>): Promise<T> => {
    // If circuit is open, don't execute and throw an error
    if (stats.state === CircuitBreakerState.OPEN) {
      throw new IntegrationError({
        message: 'Circuit breaker is open, requests are blocked',
        service: 'CircuitBreaker',
        endpoint: 'execute',
        retryable: false
      });
    }

    try {
      // Execute the function
      const result = await fn();

      // Update success stats
      stats.successes++;
      stats.lastSuccess = new Date();

      // If in half-open state and success threshold reached, close the circuit
      if (stats.state === CircuitBreakerState.HALF_OPEN && 
          stats.successes >= config.halfOpenSuccessThreshold) {
        stats.state = CircuitBreakerState.CLOSED;
        stats.failures = 0;
        stats.lastStateChange = new Date();
      }

      return result;
    } catch (error) {
      // Update failure stats
      stats.failures++;
      stats.lastFailure = new Date();

      // If failures exceed threshold, open the circuit
      if (stats.state === CircuitBreakerState.CLOSED && 
          stats.failures >= config.failureThreshold) {
        stats.state = CircuitBreakerState.OPEN;
        stats.lastStateChange = new Date();
        
        // Schedule a reset to half-open state
        resetTimeout = setTimeout(() => {
          stats.state = CircuitBreakerState.HALF_OPEN;
          stats.successes = 0;
          stats.lastStateChange = new Date();
        }, config.resetTimeout);
      }

      // Rethrow the error
      throw error;
    }
  };

  return { 
    execute,
    getStats: () => ({ ...stats }) 
  };
}

/**
 * Builds a complete URL from base URL, endpoint, and optional query parameters
 * 
 * @param baseUrl Base URL for the API
 * @param endpoint Specific endpoint to call
 * @param queryParams Optional query parameters
 * @returns Complete URL with query parameters
 */
function buildUrl(baseUrl: string, endpoint: string, queryParams?: Record<string, string>): string {
  // Make sure baseUrl doesn't end with a slash and endpoint doesn't start with one
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  let url = `${cleanBaseUrl}/${cleanEndpoint}`;
  
  // Add query parameters if provided
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    url += `?${queryString}`;
  }
  
  return url;
}

/**
 * Builds authentication headers based on the authentication type in the configuration
 * 
 * @param config Integration configuration with authentication details
 * @returns Object with authentication headers
 */
function buildAuthHeaders(config: IntegrationConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  
  switch (config.authType) {
    case AuthenticationType.BASIC:
      // Basic auth: username:password in base64
      const credentials = Buffer.from(`${config.credentials.username}:${config.credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      break;
      
    case AuthenticationType.API_KEY:
      // API key auth: usually a header like X-API-Key or similar
      const keyHeader = config.credentials.headerName || 'X-API-Key';
      headers[keyHeader] = config.credentials.apiKey;
      break;
      
    case AuthenticationType.OAUTH2:
      // OAuth2 auth: Bearer token
      headers['Authorization'] = `Bearer ${config.credentials.accessToken}`;
      break;
      
    default:
      // No auth or unsupported auth type
      break;
  }
  
  return headers;
}

/**
 * Adapter for connecting to external accounting systems
 * Implements the IntegrationAdapter interface to provide a consistent
 * integration approach for various accounting platforms like QuickBooks, Sage, and NetSuite
 */
class AccountingAdapter implements IntegrationAdapter {
  private config: IntegrationConfig;
  private accountingConfig: AccountingIntegrationConfig;
  private isConnected: boolean = false;
  private httpClient: any; // We'll use axios for HTTP requests
  private circuitBreaker: any;
  private baseUrl: string;
  private authHeaders: Record<string, string> = {};
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  /**
   * Creates a new AccountingAdapter instance
   * 
   * @param config Base integration configuration
   * @param accountingConfig Accounting-specific configuration
   */
  constructor(config: IntegrationConfig, accountingConfig: AccountingIntegrationConfig) {
    this.config = config;
    this.accountingConfig = accountingConfig;
    this.baseUrl = config.baseUrl;
    this.httpClient = axios;
    
    // Initialize circuit breaker with default configuration
    this.circuitBreaker = createCircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenSuccessThreshold: 1
    });
    
    logger.info(`Initializing accounting adapter for ${accountingConfig.accountingSystem}`, {
      system: accountingConfig.accountingSystem,
      version: accountingConfig.version
    });
  }

  /**
   * Establishes a connection to the accounting system
   * Tests connectivity and authentication by making a simple request
   * 
   * @returns Promise resolving to true if connection is successful
   * @throws IntegrationError if connection fails
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      logger.debug('Already connected to accounting system', {
        system: this.accountingConfig.accountingSystem
      });
      return true;
    }
    
    try {
      logger.info(`Connecting to accounting system ${this.accountingConfig.accountingSystem}`, {
        baseUrl: this.baseUrl
      });
      
      // Build authentication headers
      this.authHeaders = buildAuthHeaders(this.config);
      
      // Test connection with a simple request
      await this.sendRequest('GET', this.accountingConfig.endpoints.test || 'ping', null, {
        timeout: 5000,
        retryCount: 0,
        retryDelay: 0,
        headers: {},
        correlationId: createCorrelationId(),
        priority: 1
      });
      
      this.isConnected = true;
      logger.info(`Successfully connected to accounting system ${this.accountingConfig.accountingSystem}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to connect to accounting system ${this.accountingConfig.accountingSystem}`, {
        error
      });
      
      throw new IntegrationError({
        message: `Failed to connect to accounting system: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'connect',
        retryable: true
      });
    }
  }

  /**
   * Closes the connection to the accounting system
   * Performs any necessary cleanup
   * 
   * @returns Promise resolving to true if disconnection is successful
   * @throws IntegrationError if disconnection fails
   */
  public async disconnect(): Promise<boolean> {
    if (!this.isConnected) {
      return true;
    }
    
    try {
      logger.info(`Disconnecting from accounting system ${this.accountingConfig.accountingSystem}`);
      
      // Perform any necessary cleanup
      
      this.isConnected = false;
      logger.info(`Successfully disconnected from accounting system ${this.accountingConfig.accountingSystem}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to disconnect from accounting system ${this.accountingConfig.accountingSystem}`, {
        error
      });
      
      throw new IntegrationError({
        message: `Failed to disconnect from accounting system: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'disconnect',
        retryable: false
      });
    }
  }

  /**
   * Executes a request to the accounting system with circuit breaker protection
   * Routes the request to the appropriate handler based on the accounting system type
   * 
   * @param operation Operation to perform
   * @param data Data for the operation
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if the operation fails
   */
  public async execute(
    operation: string, 
    data: any, 
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      // Ensure we're connected
      if (!this.isConnected) {
        await this.connect();
      }
      
      const correlationId = options?.correlationId || createCorrelationId();
      
      logger.debug(`Executing accounting operation: ${operation}`, {
        operation,
        system: this.accountingConfig.accountingSystem,
        correlationId
      });
      
      // Determine how to handle this operation based on accounting system type
      let response: IntegrationResponse;
      
      // Use circuit breaker to protect against external service failures
      response = await this.circuitBreaker.execute(async () => {
        switch (this.accountingConfig.accountingSystem.toLowerCase()) {
          case 'quickbooks':
            return await this.handleQuickBooksIntegration(operation, data, options);
          case 'sage':
            return await this.handleSageIntegration(operation, data, options);
          case 'netsuite':
            return await this.handleNetSuiteIntegration(operation, data, options);
          default:
            // For other accounting systems or the default case
            const endpoint = this.accountingConfig.endpoints[operation];
            if (!endpoint) {
              throw new IntegrationError({
                message: `Unsupported operation: ${operation} for accounting system: ${this.accountingConfig.accountingSystem}`,
                service: this.accountingConfig.accountingSystem,
                endpoint: operation,
                retryable: false
              });
            }
            
            // Determine HTTP method based on the operation
            let method = 'GET';
            if (operation.startsWith('create') || operation.startsWith('post')) {
              method = 'POST';
            } else if (operation.startsWith('update')) {
              method = 'PUT';
            } else if (operation.startsWith('delete')) {
              method = 'DELETE';
            }
            
            return await this.sendRequest(method, endpoint, data, options);
        }
      });
      
      logger.debug(`Completed accounting operation: ${operation}`, {
        operation,
        system: this.accountingConfig.accountingSystem,
        correlationId,
        success: response.success
      });
      
      return response;
    } catch (error) {
      logger.error(`Failed executing accounting operation: ${operation}`, {
        operation,
        system: this.accountingConfig.accountingSystem,
        error
      });
      
      throw new IntegrationError({
        message: `Failed executing accounting operation: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: operation,
        retryable: error instanceof IntegrationError ? error.isRetryable() : true
      });
    }
  }

  /**
   * Checks the health of the accounting system connection
   * Makes a simple request to verify connectivity
   * 
   * @returns Promise resolving to the health status
   */
  public async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      const startTime = Date.now();
      
      // Try a simple request to check system health
      await this.sendRequest('GET', this.accountingConfig.endpoints.test || 'ping', null, {
        timeout: 5000,
        retryCount: 0,
        retryDelay: 0,
        headers: {},
        correlationId: createCorrelationId(),
        priority: 1
      });
      
      const responseTime = Date.now() - startTime;
      const circuitBreakerStats = this.getCircuitBreakerStats();
      
      return {
        status: this.isConnected ? IntegrationStatus.ACTIVE : IntegrationStatus.INACTIVE,
        responseTime,
        lastChecked: new Date(),
        message: `Accounting system ${this.accountingConfig.accountingSystem} is healthy`,
        details: {
          system: this.accountingConfig.accountingSystem,
          version: this.accountingConfig.version,
          circuitBreakerState: circuitBreakerStats.state,
          failureCount: circuitBreakerStats.failures
        }
      };
    } catch (error) {
      logger.error(`Health check failed for accounting system ${this.accountingConfig.accountingSystem}`, {
        error
      });
      
      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Accounting system ${this.accountingConfig.accountingSystem} health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          system: this.accountingConfig.accountingSystem,
          version: this.accountingConfig.version,
          circuitBreakerState: this.getCircuitBreakerStats().state,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Sends an HTTP request to the accounting system
   * Handles authentication, request formatting, and error handling
   * 
   * @param method HTTP method (GET, POST, PUT, DELETE)
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if the request fails
   */
  private async sendRequest(
    method: string,
    endpoint: string,
    data: any,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      const url = buildUrl(this.baseUrl, endpoint, options?.headers?.queryParams as Record<string, string>);
      
      // Prepare headers by merging default, auth, and request-specific headers
      const headers = {
        ...this.defaultHeaders,
        ...this.authHeaders,
        ...(options?.headers || {})
      };
      
      // Add correlation ID to headers for request tracing
      const correlationId = options?.correlationId || createCorrelationId();
      headers['X-Correlation-ID'] = correlationId;
      
      // Set timeout from options or use default
      const timeout = options?.timeout || this.config.timeout || 30000;
      
      logger.debug(`Sending request to accounting system: ${method} ${url}`, {
        method,
        url,
        correlationId
      });
      
      const response = await this.httpClient({
        method,
        url,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        headers,
        timeout
      });
      
      logger.debug(`Received response from accounting system: ${response.status}`, {
        status: response.status,
        correlationId
      });
      
      // Process and return the response
      return this.processResponse(response, endpoint);
    } catch (error) {
      logger.error(`Request to accounting system failed: ${method} ${endpoint}`, {
        method,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        statusCode: (error as any)?.response?.status
      });
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new IntegrationError({
          message: `Accounting system returned error: ${error.response.status} ${error.response.statusText}`,
          service: this.accountingConfig.accountingSystem,
          endpoint,
          statusCode: error.response.status,
          responseBody: error.response.data,
          retryable: error.response.status >= 500
        });
      } else if (error.request) {
        // The request was made but no response was received
        throw new IntegrationError({
          message: 'No response received from accounting system',
          service: this.accountingConfig.accountingSystem,
          endpoint,
          retryable: true
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new IntegrationError({
          message: `Request setup error: ${error.message}`,
          service: this.accountingConfig.accountingSystem,
          endpoint,
          retryable: false
        });
      }
    }
  }

  /**
   * Posts a payment to the accounting system
   * Creates a payment record in the external accounting platform
   * 
   * @param payment Payment data to post
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if payment posting fails
   */
  public async postPayment(payment: Payment, options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Posting payment to accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentId: payment.id,
        amount: payment.paymentAmount
      });
      
      // Validate payment data
      if (!payment.id || !payment.paymentAmount || !payment.payerId) {
        throw new Error('Invalid payment data: missing required fields');
      }
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.postPayment || 'payments';
      
      // Send request to post payment
      const response = await this.sendRequest('POST', endpoint, payment, options);
      
      logger.info(`Successfully posted payment to accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentId: payment.id,
        responseId: response.data?.id
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          paymentId: payment.id,
          amount: payment.paymentAmount,
          paymentDate: payment.paymentDate
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to post payment to accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentId: payment.id,
        error
      });
      
      throw new IntegrationError({
        message: `Failed to post payment: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'postPayment',
        retryable: true
      });
    }
  }

  /**
   * Creates an invoice in the accounting system
   * Adds a new invoice to the external accounting platform
   * 
   * @param invoiceData Invoice data to create
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if invoice creation fails
   */
  public async createInvoice(invoiceData: Record<string, any>, options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Creating invoice in accounting system ${this.accountingConfig.accountingSystem}`, {
        clientId: invoiceData.clientId
      });
      
      // Validate invoice data
      if (!invoiceData.clientId || !invoiceData.items || !invoiceData.items.length) {
        throw new Error('Invalid invoice data: missing required fields');
      }
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.createInvoice || 'invoices';
      
      // Send request to create invoice
      const response = await this.sendRequest('POST', endpoint, invoiceData, options);
      
      logger.info(`Successfully created invoice in accounting system ${this.accountingConfig.accountingSystem}`, {
        invoiceId: response.data?.id,
        amount: invoiceData.totalAmount
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          clientId: invoiceData.clientId,
          invoiceDate: invoiceData.invoiceDate,
          amount: invoiceData.totalAmount
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to create invoice in accounting system ${this.accountingConfig.accountingSystem}`, {
        clientId: invoiceData.clientId,
        error
      });
      
      throw new IntegrationError({
        message: `Failed to create invoice: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'createInvoice',
        retryable: true
      });
    }
  }

  /**
   * Retrieves customer information from the accounting system
   * Gets customer records from the external accounting platform
   * 
   * @param filters Optional filters to apply to the request
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if customer retrieval fails
   */
  public async getCustomers(filters?: Record<string, any>, options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Retrieving customers from accounting system ${this.accountingConfig.accountingSystem}`);
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.getCustomers || 'customers';
      
      // Send request to get customers
      const response = await this.sendRequest('GET', endpoint, filters, options);
      
      logger.info(`Successfully retrieved customers from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: Array.isArray(response.data) ? response.data.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          filters
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to retrieve customers from accounting system ${this.accountingConfig.accountingSystem}`, {
        error
      });
      
      throw new IntegrationError({
        message: `Failed to retrieve customers: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'getCustomers',
        retryable: true
      });
    }
  }

  /**
   * Retrieves GL account information from the accounting system
   * Gets account records from the external accounting platform
   * 
   * @param filters Optional filters to apply to the request
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if account retrieval fails
   */
  public async getAccounts(filters?: Record<string, any>, options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Retrieving GL accounts from accounting system ${this.accountingConfig.accountingSystem}`);
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.getAccounts || 'accounts';
      
      // Send request to get accounts
      const response = await this.sendRequest('GET', endpoint, filters, options);
      
      logger.info(`Successfully retrieved GL accounts from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: Array.isArray(response.data) ? response.data.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          filters
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to retrieve GL accounts from accounting system ${this.accountingConfig.accountingSystem}`, {
        error
      });
      
      throw new IntegrationError({
        message: `Failed to retrieve GL accounts: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'getAccounts',
        retryable: true
      });
    }
  }

  /**
   * Synchronizes financial data between the HCBS system and accounting system
   * Updates both systems to ensure consistent financial records
   * 
   * @param fromDate Start date for synchronization
   * @param toDate End date for synchronization
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if synchronization fails
   */
  public async syncFinancialData(fromDate: Date, toDate: Date, options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Synchronizing financial data with accounting system ${this.accountingConfig.accountingSystem}`, {
        fromDate,
        toDate
      });
      
      // Format date range for the request
      const dateRange = {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      };
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.syncFinancialData || 'sync';
      
      // Send request to sync financial data
      const response = await this.sendRequest('POST', endpoint, dateRange, options);
      
      logger.info(`Successfully synchronized financial data with accounting system ${this.accountingConfig.accountingSystem}`, {
        syncId: response.data?.syncId,
        itemsProcessed: response.data?.itemsProcessed
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString()
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to synchronize financial data with accounting system ${this.accountingConfig.accountingSystem}`, {
        fromDate,
        toDate,
        error
      });
      
      throw new IntegrationError({
        message: `Failed to synchronize financial data: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'syncFinancialData',
        retryable: true
      });
    }
  }

  /**
   * Exports a batch of payments to the accounting system
   * Sends multiple payments to the external accounting platform
   * Supports both API-based and file-based exports
   * 
   * @param payments Array of payments to export
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if export fails
   */
  public async exportPaymentBatch(payments: Payment[], options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Exporting payment batch to accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
      });
      
      // Validate batch data
      if (!payments.length) {
        throw new Error('Empty payment batch');
      }
      
      // Check if this is a file-based export or API-based
      if (this.accountingConfig.dataFormat === DataFormat.CSV || 
          this.accountingConfig.dataFormat === DataFormat.XML) {
        return await this.handleFileBasedIntegration('exportPaymentBatch', payments, options);
      }
      
      // For API-based systems, use the appropriate endpoint
      const endpoint = this.accountingConfig.endpoints.exportPaymentBatch || 'payment-batches';
      
      // Send request to export payment batch
      const response = await this.sendRequest('POST', endpoint, { payments }, options);
      
      logger.info(`Successfully exported payment batch to accounting system ${this.accountingConfig.accountingSystem}`, {
        batchId: response.data?.batchId,
        count: payments.length
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          paymentCount: payments.length,
          totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to export payment batch to accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        error
      });
      
      throw new IntegrationError({
        message: `Failed to export payment batch: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'exportPaymentBatch',
        retryable: true
      });
    }
  }

  /**
   * Retrieves the status of payments in the accounting system
   * Gets current state of payments from the external accounting platform
   * 
   * @param paymentIds Array of payment IDs to check
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if status retrieval fails
   */
  public async getPaymentStatus(paymentIds: string[], options?: IntegrationRequestOptions): Promise<IntegrationResponse> {
    try {
      logger.info(`Retrieving payment status from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: paymentIds.length
      });
      
      // Validate input
      if (!paymentIds.length) {
        throw new Error('No payment IDs provided');
      }
      
      // Determine appropriate endpoint based on accounting system
      const endpoint = this.accountingConfig.endpoints.getPaymentStatus || 'payment-status';
      
      // Send request to get payment status
      const response = await this.sendRequest('GET', endpoint, { paymentIds: paymentIds.join(',') }, options);
      
      logger.info(`Successfully retrieved payment status from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: Array.isArray(response.data) ? response.data.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          paymentIds
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to retrieve payment status from accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentIds,
        error
      });
      
      throw new IntegrationError({
        message: `Failed to retrieve payment status: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: 'getPaymentStatus',
        retryable: true
      });
    }
  }

  /**
   * Handles QuickBooks-specific integration logic
   * Customizes requests and responses for QuickBooks API
   * 
   * @param operation Operation to perform
   * @param endpoint Endpoint for the operation
   * @param data Data for the operation
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if QuickBooks operation fails
   */
  private async handleQuickBooksIntegration(
    operation: string,
    data: any,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      logger.debug(`Handling QuickBooks-specific integration for operation: ${operation}`);
      
      // Map generic operations to QuickBooks-specific endpoints
      const endpoints: Record<string, string> = {
        postPayment: 'payment',
        createInvoice: 'invoice',
        getCustomers: 'query?query=select * from Customer',
        getAccounts: 'query?query=select * from Account',
        syncFinancialData: 'batch'
      };
      
      const endpoint = endpoints[operation] || this.accountingConfig.endpoints[operation];
      
      if (!endpoint) {
        throw new Error(`Unsupported operation for QuickBooks: ${operation}`);
      }
      
      // QuickBooks-specific data transformation
      let transformedData = data;
      
      // Different operations require different data formats for QuickBooks
      if (operation === 'postPayment') {
        transformedData = {
          PaymentType: 'Cash', // Or determine from payment method
          CustomerRef: {
            value: data.payerId
          },
          TotalAmt: data.paymentAmount,
          TxnDate: data.paymentDate
        };
      } else if (operation === 'createInvoice') {
        // Transform to QuickBooks invoice format
        transformedData = {
          CustomerRef: {
            value: data.clientId
          },
          TxnDate: data.invoiceDate,
          Line: data.items.map((item: any) => ({
            DetailType: 'SalesItemLineDetail',
            Amount: item.amount,
            SalesItemLineDetail: {
              ItemRef: {
                value: item.serviceCode
              },
              Qty: item.quantity,
              UnitPrice: item.unitPrice
            }
          }))
        };
      }
      
      // QuickBooks requires specific headers
      const qboHeaders = {
        ...options?.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'HCBS-Revenue-Management/1.0'
      };
      
      // Determine HTTP method based on operation
      let method = 'GET';
      if (operation.startsWith('create') || operation.startsWith('post') || operation === 'syncFinancialData') {
        method = 'POST';
      } else if (operation.startsWith('update')) {
        method = 'PUT';
      } else if (operation.startsWith('delete')) {
        method = 'DELETE';
      }
      
      // Send the request to QuickBooks
      const response = await this.sendRequest(
        method,
        endpoint,
        transformedData,
        {
          ...options,
          headers: qboHeaders
        }
      );
      
      // QuickBooks-specific response processing
      let processedData = response.data;
      
      // For query responses, extract the actual data
      if (response.data.QueryResponse) {
        processedData = response.data.QueryResponse;
      }
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: processedData,
        error: null,
        metadata: {
          ...response.metadata,
          operation,
          system: 'QuickBooks'
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`QuickBooks integration error for operation ${operation}`, {
        operation,
        error
      });
      
      throw new IntegrationError({
        message: `QuickBooks integration error: ${error instanceof Error ? error.message : String(error)}`,
        service: 'QuickBooks',
        endpoint: operation,
        retryable: !(error instanceof IntegrationError) || error.isRetryable()
      });
    }
  }

  /**
   * Handles Sage-specific integration logic
   * Customizes requests and responses for Sage API
   * 
   * @param operation Operation to perform
   * @param endpoint Endpoint for the operation
   * @param data Data for the operation
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if Sage operation fails
   */
  private async handleSageIntegration(
    operation: string,
    data: any,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      logger.debug(`Handling Sage-specific integration for operation: ${operation}`);
      
      // Map generic operations to Sage-specific endpoints
      const endpoints: Record<string, string> = {
        postPayment: 'sales/payments',
        createInvoice: 'sales/invoices',
        getCustomers: 'customers',
        getAccounts: 'ledger_accounts',
        syncFinancialData: 'journals'
      };
      
      const endpoint = endpoints[operation] || this.accountingConfig.endpoints[operation];
      
      if (!endpoint) {
        throw new Error(`Unsupported operation for Sage: ${operation}`);
      }
      
      // Sage-specific data transformation
      let transformedData = data;
      
      // Different operations require different data formats for Sage
      if (operation === 'postPayment') {
        transformedData = {
          payment: {
            transaction_type_id: 'RECEIPT',
            contact_id: data.payerId,
            date: data.paymentDate,
            total_amount: data.paymentAmount,
            payment_method: data.paymentMethod.toLowerCase()
          }
        };
      } else if (operation === 'createInvoice') {
        // Transform to Sage invoice format
        transformedData = {
          invoice: {
            contact_id: data.clientId,
            date: data.invoiceDate,
            due_date: data.dueDate,
            invoice_lines: data.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              tax_rate_id: item.taxRateId
            }))
          }
        };
      }
      
      // Sage requires specific headers
      const sageHeaders = {
        ...options?.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      // Determine HTTP method based on operation
      let method = 'GET';
      if (operation.startsWith('create') || operation.startsWith('post')) {
        method = 'POST';
      } else if (operation.startsWith('update')) {
        method = 'PUT';
      } else if (operation.startsWith('delete')) {
        method = 'DELETE';
      }
      
      // Send the request to Sage
      const response = await this.sendRequest(
        method,
        endpoint,
        transformedData,
        {
          ...options,
          headers: sageHeaders
        }
      );
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          operation,
          system: 'Sage'
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Sage integration error for operation ${operation}`, {
        operation,
        error
      });
      
      throw new IntegrationError({
        message: `Sage integration error: ${error instanceof Error ? error.message : String(error)}`,
        service: 'Sage',
        endpoint: operation,
        retryable: !(error instanceof IntegrationError) || error.isRetryable()
      });
    }
  }

  /**
   * Handles NetSuite-specific integration logic
   * Customizes requests and responses for NetSuite API
   * 
   * @param operation Operation to perform
   * @param endpoint Endpoint for the operation
   * @param data Data for the operation
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if NetSuite operation fails
   */
  private async handleNetSuiteIntegration(
    operation: string,
    data: any,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      logger.debug(`Handling NetSuite-specific integration for operation: ${operation}`);
      
      // Map generic operations to NetSuite-specific endpoints
      const endpoints: Record<string, string> = {
        postPayment: 'record/customerpayment',
        createInvoice: 'record/invoice',
        getCustomers: 'record/customer',
        getAccounts: 'record/account',
        syncFinancialData: 'restlet.nl'
      };
      
      const endpoint = endpoints[operation] || this.accountingConfig.endpoints[operation];
      
      if (!endpoint) {
        throw new Error(`Unsupported operation for NetSuite: ${operation}`);
      }
      
      // NetSuite-specific data transformation
      let transformedData = data;
      
      // Different operations require different data formats for NetSuite
      if (operation === 'postPayment') {
        transformedData = {
          customer: {
            id: data.payerId
          },
          payment: data.paymentAmount,
          tranDate: data.paymentDate,
          paymentMethod: {
            id: getNetSuitePaymentMethodId(data.paymentMethod)
          }
        };
      } else if (operation === 'createInvoice') {
        // Transform to NetSuite invoice format
        transformedData = {
          entity: {
            id: data.clientId
          },
          tranDate: data.invoiceDate,
          item: data.items.map((item: any) => ({
            item: {
              id: item.serviceCode
            },
            quantity: item.quantity,
            rate: item.unitPrice,
            amount: item.amount
          }))
        };
      }
      
      // NetSuite requires specific headers
      const netsuiteHeaders = {
        ...options?.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.authHeaders['Authorization']
      };
      
      // Determine HTTP method based on operation
      let method = 'GET';
      if (operation.startsWith('create') || operation.startsWith('post')) {
        method = 'POST';
      } else if (operation.startsWith('update')) {
        method = 'PUT';
      } else if (operation.startsWith('delete')) {
        method = 'DELETE';
      }
      
      // Send the request to NetSuite
      const response = await this.sendRequest(
        method,
        endpoint,
        transformedData,
        {
          ...options,
          headers: netsuiteHeaders
        }
      );
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data,
        error: null,
        metadata: {
          ...response.metadata,
          operation,
          system: 'NetSuite'
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`NetSuite integration error for operation ${operation}`, {
        operation,
        error
      });
      
      throw new IntegrationError({
        message: `NetSuite integration error: ${error instanceof Error ? error.message : String(error)}`,
        service: 'NetSuite',
        endpoint: operation,
        retryable: !(error instanceof IntegrationError) || error.isRetryable()
      });
    }
  }

  /**
   * Handles file-based integration for accounting systems
   * Creates and manages files for integrations that require file exchange
   * 
   * @param operation Operation to perform
   * @param data Data for the operation
   * @param options Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if file operation fails
   */
  private async handleFileBasedIntegration(
    operation: string,
    data: any,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      logger.debug(`Handling file-based integration for operation: ${operation}`, {
        system: this.accountingConfig.accountingSystem,
        dataFormat: this.accountingConfig.dataFormat
      });
      
      // Determine file format based on configuration
      let fileContent: string;
      let fileExtension: string;
      
      if (this.accountingConfig.dataFormat === DataFormat.CSV) {
        fileContent = this.generateCSV(operation, data);
        fileExtension = 'csv';
      } else if (this.accountingConfig.dataFormat === DataFormat.XML) {
        fileContent = this.generateXML(operation, data);
        fileExtension = 'xml';
      } else {
        throw new Error(`Unsupported file format: ${this.accountingConfig.dataFormat}`);
      }
      
      // Create a unique filename
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const filename = `${this.accountingConfig.accountingSystem}_${operation}_${timestamp}.${fileExtension}`;
      
      // Determine file path from configuration or use default
      const exportPath = this.accountingConfig.exportDirectory || '/tmp/exports';
      const filePath = path.join(exportPath, filename);
      
      // Ensure directory exists
      await fs.mkdir(exportPath, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, fileContent);
      
      logger.info(`Successfully exported file for ${operation}`, {
        system: this.accountingConfig.accountingSystem,
        filePath,
        operation
      });
      
      return {
        success: true,
        statusCode: 200,
        data: {
          filePath,
          filename,
          size: fileContent.length
        },
        error: null,
        metadata: {
          operation,
          system: this.accountingConfig.accountingSystem,
          format: this.accountingConfig.dataFormat,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`File-based integration error for operation ${operation}`, {
        operation,
        error
      });
      
      throw new IntegrationError({
        message: `File-based integration error: ${error instanceof Error ? error.message : String(error)}`,
        service: this.accountingConfig.accountingSystem,
        endpoint: operation,
        retryable: false
      });
    }
  }

  /**
   * Generates CSV file content for file-based integration
   * Creates formatted CSV data based on operation and data structure
   * 
   * @param operation Operation type determining CSV format
   * @param data Data to format as CSV
   * @returns CSV formatted string
   */
  private generateCSV(operation: string, data: any): string {
    // Implementation will vary based on the operation and data structure
    let header = '';
    let rows: string[] = [];
    
    if (operation === 'exportPaymentBatch' && Array.isArray(data)) {
      // Header row for payment batch
      header = 'PaymentID,PayerID,PaymentDate,Amount,Method,ReferenceNumber';
      
      // Data rows for payment batch
      rows = data.map((payment: Payment) => {
        return [
          payment.id,
          payment.payerId,
          payment.paymentDate,
          payment.paymentAmount,
          payment.paymentMethod,
          payment.referenceNumber || ''
        ].join(',');
      });
    }
    
    // Combine header and rows
    return [header, ...rows].join('\n');
  }

  /**
   * Generates XML file content for file-based integration
   * Creates formatted XML data based on operation and data structure
   * 
   * @param operation Operation type determining XML format
   * @param data Data to format as XML
   * @returns XML formatted string
   */
  private generateXML(operation: string, data: any): string {
    // Implementation will vary based on the operation and data structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    if (operation === 'exportPaymentBatch' && Array.isArray(data)) {
      xml += '<Payments>\n';
      
      // Add payment entries
      data.forEach((payment: Payment) => {
        xml += '  <Payment>\n';
        xml += `    <ID>${payment.id}</ID>\n`;
        xml += `    <PayerID>${payment.payerId}</PayerID>\n`;
        xml += `    <Date>${payment.paymentDate}</Date>\n`;
        xml += `    <Amount>${payment.paymentAmount}</Amount>\n`;
        xml += `    <Method>${payment.paymentMethod}</Method>\n`;
        if (payment.referenceNumber) {
          xml += `    <ReferenceNumber>${payment.referenceNumber}</ReferenceNumber>\n`;
        }
        xml += '  </Payment>\n';
      });
      
      xml += '</Payments>';
    }
    
    return xml;
  }

  /**
   * Processes raw response into standardized format
   * Converts API responses to a consistent structure
   * 
   * @param response Raw response from API call
   * @param operation Operation that generated the response
   * @returns Standardized integration response
   */
  private processResponse(response: any, operation: string): IntegrationResponse {
    try {
      const statusCode = response.status || 200;
      const responseData = response.data || {};
      
      return {
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        data: responseData,
        error: null,
        metadata: {
          operation,
          system: this.accountingConfig.accountingSystem,
          timestamp: new Date().toISOString(),
          correlationId: response.headers?.['x-correlation-id'] || response.config?.headers?.['X-Correlation-ID']
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error processing response`, { error });
      
      return {
        success: false,
        statusCode: 500,
        data: null,
        error: {
          code: ErrorCode.INTEGRATION_ERROR,
          message: `Failed to process response: ${error instanceof Error ? error.message : String(error)}`,
          category: ErrorCategory.INTEGRATION,
          details: {
            service: this.accountingConfig.accountingSystem,
            endpoint: operation,
            statusCode: null,
            requestId: null,
            message: error instanceof Error ? error.message : String(error),
            responseBody: null
          },
          timestamp: new Date(),
          retryable: false
        },
        metadata: {
          operation,
          system: this.accountingConfig.accountingSystem,
          error: true
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Returns current circuit breaker statistics
   * Provides visibility into the circuit breaker state for monitoring
   * 
   * @returns Current circuit breaker stats
   */
  public getCircuitBreakerStats(): CircuitBreakerStats {
    return this.circuitBreaker.getStats();
  }
}

/**
 * Helper function to get NetSuite payment method ID
 * Maps HCBS payment methods to NetSuite-specific IDs
 * 
 * @param paymentMethod Payment method string
 * @returns NetSuite payment method ID
 */
function getNetSuitePaymentMethodId(paymentMethod: string): string {
  const paymentMethodMap: Record<string, string> = {
    'eft': '1',
    'check': '2',
    'credit_card': '3',
    'cash': '4',
    'other': '5'
  };
  
  return paymentMethodMap[paymentMethod.toLowerCase()] || '5'; // Default to 'other'
}

// Export the adapter and helper functions
export default AccountingAdapter;
export { createCircuitBreaker };