/**
 * @fileoverview Accounting Integration Service
 * 
 * Implements the integration between the HCBS Revenue Management System and external accounting systems.
 * Provides high-level operations for financial data synchronization, payment posting, invoice creation,
 * and accounts receivable management with accounting platforms like QuickBooks, Sage, and NetSuite.
 */

import { 
  IntegrationConfig,
  AccountingIntegrationConfig,
  IntegrationResponse,
  IntegrationRequestOptions,
  IntegrationHealthStatus
} from '../types/integration.types';
import { Payment, PaymentWithRelations } from '../types/payments.types';
import AccountingAdapter from './adapters/accounting.adapter';
import AccountingTransformer from './transformers/accounting.transformer';
import IntegrationError from '../errors/integration-error';
import logger from '../utils/logger';

/**
 * High-level integration service for connecting with external accounting systems
 * Provides an abstraction layer over the low-level adapter implementation
 */
export class AccountingIntegration {
  private adapter: AccountingAdapter;
  private transformer: AccountingTransformer;
  private config: IntegrationConfig;
  private accountingConfig: AccountingIntegrationConfig;
  private isConnected: boolean = false;
  private lastSyncDate: Date | null;

  /**
   * Creates a new AccountingIntegration instance
   * 
   * @param adapter - Low-level adapter for accounting system communication
   * @param transformer - Data transformer for converting between formats
   * @param config - Base integration configuration
   * @param accountingConfig - Accounting-specific configuration
   */
  constructor(
    adapter: AccountingAdapter,
    transformer: AccountingTransformer,
    config: IntegrationConfig,
    accountingConfig: AccountingIntegrationConfig
  ) {
    this.adapter = adapter;
    this.transformer = transformer;
    this.config = config;
    this.accountingConfig = accountingConfig;
    this.isConnected = false;
    this.lastSyncDate = accountingConfig.lastSyncDate ? new Date(accountingConfig.lastSyncDate) : null;

    logger.info(`Initialized accounting integration for ${accountingConfig.accountingSystem}`, {
      system: accountingConfig.accountingSystem,
      version: accountingConfig.version
    });
  }

  /**
   * Establishes a connection to the accounting system
   * 
   * @returns Promise resolving to true if connection was successful
   * @throws IntegrationError if connection fails
   */
  public async connect(): Promise<boolean> {
    try {
      logger.info(`Connecting to accounting system ${this.accountingConfig.accountingSystem}`);
      
      const connected = await this.adapter.connect();
      
      if (connected) {
        this.isConnected = true;
        logger.info(`Successfully connected to accounting system ${this.accountingConfig.accountingSystem}`);
        return true;
      }
      
      throw new Error('Connection returned false');
    } catch (error) {
      return this.handleError(error, 'connect', {
        timeout: this.config.timeout,
        retryCount: 0,
        retryDelay: 0,
        headers: {},
        correlationId: logger.createCorrelationId(),
        priority: 1
      });
    }
  }

  /**
   * Closes the connection to the accounting system
   * 
   * @returns Promise resolving to true if disconnection was successful
   * @throws IntegrationError if disconnection fails
   */
  public async disconnect(): Promise<boolean> {
    try {
      logger.info(`Disconnecting from accounting system ${this.accountingConfig.accountingSystem}`);
      
      const disconnected = await this.adapter.disconnect();
      
      if (disconnected) {
        this.isConnected = false;
        logger.info(`Successfully disconnected from accounting system ${this.accountingConfig.accountingSystem}`);
        return true;
      }
      
      throw new Error('Disconnection returned false');
    } catch (error) {
      return this.handleError(error, 'disconnect', {
        timeout: this.config.timeout,
        retryCount: 0,
        retryDelay: 0,
        headers: {},
        correlationId: logger.createCorrelationId(),
        priority: 1
      });
    }
  }

  /**
   * Checks the health of the accounting system connection
   * 
   * @returns Promise resolving to the health status
   */
  public async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      logger.debug(`Checking health of accounting system ${this.accountingConfig.accountingSystem}`);
      
      const healthStatus = await this.adapter.checkHealth();
      
      logger.debug(`Health check completed for accounting system ${this.accountingConfig.accountingSystem}`, {
        status: healthStatus.status
      });
      
      return healthStatus;
    } catch (error) {
      logger.error(`Health check failed for accounting system ${this.accountingConfig.accountingSystem}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        status: 'error',
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Posts a single payment to the accounting system
   * 
   * @param payment - Payment data to post
   * @param options - Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if payment posting fails
   */
  public async postPayment(
    payment: Payment,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Posting payment to accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentId: payment.id,
        amount: payment.paymentAmount
      });
      
      // Transform payment data to accounting system format
      const transformedData = this.transformer.transformRequest(payment, 'postPayment');
      
      // Send payment to accounting system
      const response = await this.adapter.postPayment(transformedData, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'postPayment');
      
      logger.info(`Successfully posted payment to accounting system ${this.accountingConfig.accountingSystem}`, {
        paymentId: payment.id,
        responseId: response.data?.id || transformedResponse?.id
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'postPayment',
          paymentId: payment.id
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'postPayment', options);
    }
  }

  /**
   * Posts a batch of payments to the accounting system
   * 
   * @param payments - Array of payments to post
   * @param options - Request options
   * @returns Promise resolving to the integration response with batch results
   * @throws IntegrationError if batch posting fails
   */
  public async postPaymentBatch(
    payments: Array<Payment>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Posting payment batch to accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
      });
      
      // Transform each payment to accounting system format
      const transformedPayments = payments.map(payment => 
        this.transformer.transformRequest(payment, 'postPayment')
      );
      
      // Send payment batch to accounting system
      const response = await this.adapter.exportPaymentBatch(transformedPayments, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'postPaymentBatch');
      
      logger.info(`Successfully posted payment batch to accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        batchId: response.data?.batchId || transformedResponse?.batchId
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'postPaymentBatch',
          paymentCount: payments.length,
          totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'postPaymentBatch', options);
    }
  }

  /**
   * Creates an invoice in the accounting system
   * 
   * @param invoiceData - Invoice data to create
   * @param options - Request options
   * @returns Promise resolving to the integration response
   * @throws IntegrationError if invoice creation fails
   */
  public async createInvoice(
    invoiceData: Record<string, any>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Creating invoice in accounting system ${this.accountingConfig.accountingSystem}`, {
        clientId: invoiceData.clientId,
        amount: invoiceData.totalAmount
      });
      
      // Transform invoice data to accounting system format
      const transformedData = this.transformer.transformRequest(invoiceData, 'createInvoice');
      
      // Send invoice to accounting system
      const response = await this.adapter.createInvoice(transformedData, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'createInvoice');
      
      logger.info(`Successfully created invoice in accounting system ${this.accountingConfig.accountingSystem}`, {
        invoiceId: response.data?.id || transformedResponse?.id,
        amount: invoiceData.totalAmount
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'createInvoice',
          clientId: invoiceData.clientId,
          invoiceDate: invoiceData.invoiceDate,
          amount: invoiceData.totalAmount
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'createInvoice', options);
    }
  }

  /**
   * Retrieves customer information from the accounting system
   * 
   * @param filters - Optional filters to apply to the request
   * @param options - Request options
   * @returns Promise resolving to the integration response with customer data
   * @throws IntegrationError if customer retrieval fails
   */
  public async getCustomers(
    filters?: Record<string, any>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Retrieving customers from accounting system ${this.accountingConfig.accountingSystem}`);
      
      // Transform filter parameters to accounting system format
      const transformedFilters = this.transformer.transformRequest(filters || {}, 'getCustomers');
      
      // Retrieve customers from accounting system
      const response = await this.adapter.getCustomers(transformedFilters, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'getCustomers');
      
      logger.info(`Successfully retrieved customers from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: Array.isArray(transformedResponse) ? transformedResponse.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'getCustomers',
          filters: filters || {}
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'getCustomers', options);
    }
  }

  /**
   * Retrieves GL account information from the accounting system
   * 
   * @param filters - Optional filters to apply to the request
   * @param options - Request options
   * @returns Promise resolving to the integration response with account data
   * @throws IntegrationError if account retrieval fails
   */
  public async getAccounts(
    filters?: Record<string, any>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Retrieving GL accounts from accounting system ${this.accountingConfig.accountingSystem}`);
      
      // Transform filter parameters to accounting system format
      const transformedFilters = this.transformer.transformRequest(filters || {}, 'getAccounts');
      
      // Retrieve accounts from accounting system
      const response = await this.adapter.getAccounts(transformedFilters, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'getAccounts');
      
      logger.info(`Successfully retrieved GL accounts from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: Array.isArray(transformedResponse) ? transformedResponse.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'getAccounts',
          filters: filters || {}
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'getAccounts', options);
    }
  }

  /**
   * Synchronizes financial data between the HCBS system and accounting system
   * 
   * @param fromDate - Start date for synchronization
   * @param toDate - End date for synchronization
   * @param options - Request options
   * @returns Promise resolving to the integration response with sync results
   * @throws IntegrationError if synchronization fails
   */
  public async syncFinancialData(
    fromDate: Date,
    toDate: Date,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Synchronizing financial data with accounting system ${this.accountingConfig.accountingSystem}`, {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      });
      
      // Prepare date range parameters
      const dateRange = {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      };
      
      // Transform parameters to accounting system format
      const transformedParams = this.transformer.transformRequest(dateRange, 'syncFinancialData');
      
      // Synchronize data with accounting system
      const response = await this.adapter.syncFinancialData(transformedParams, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'syncFinancialData');
      
      // Update last sync date on success
      this.lastSyncDate = new Date();
      
      logger.info(`Successfully synchronized financial data with accounting system ${this.accountingConfig.accountingSystem}`, {
        syncId: response.data?.syncId || transformedResponse?.syncId,
        itemsProcessed: response.data?.itemsProcessed || transformedResponse?.itemsProcessed
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'syncFinancialData',
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          lastSyncDate: this.lastSyncDate.toISOString()
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'syncFinancialData', options);
    }
  }

  /**
   * Reconciles payments between the HCBS system and accounting system
   * 
   * @param payments - Array of payments with related claims to reconcile
   * @param options - Request options
   * @returns Promise resolving to the integration response with reconciliation results
   * @throws IntegrationError if reconciliation fails
   */
  public async reconcilePayments(
    payments: Array<PaymentWithRelations>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Reconciling payments with accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
      });
      
      // Transform payment data to accounting system format
      const transformedData = this.transformer.transformRequest(payments, 'reconcilePayments');
      
      // Execute reconciliation operation
      const response = await this.adapter.execute('reconcilePayments', transformedData, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'reconcilePayments');
      
      logger.info(`Successfully reconciled payments with accounting system ${this.accountingConfig.accountingSystem}`, {
        count: payments.length,
        successCount: transformedResponse?.successCount || 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'reconcilePayments',
          paymentCount: payments.length,
          totalAmount: payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'reconcilePayments', options);
    }
  }

  /**
   * Retrieves the status of payments in the accounting system
   * 
   * @param paymentIds - Array of payment IDs to check
   * @param options - Request options
   * @returns Promise resolving to the integration response with payment status data
   * @throws IntegrationError if status retrieval fails
   */
  public async getPaymentStatus(
    paymentIds: Array<string>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Retrieving payment status from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: paymentIds.length
      });
      
      // Transform payment IDs to accounting system format
      const transformedIds = this.transformer.transformRequest(paymentIds, 'getPaymentStatus');
      
      // Retrieve payment status from accounting system
      const response = await this.adapter.getPaymentStatus(transformedIds, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'getPaymentStatus');
      
      logger.info(`Successfully retrieved payment status from accounting system ${this.accountingConfig.accountingSystem}`, {
        count: paymentIds.length,
        foundCount: Array.isArray(transformedResponse) ? transformedResponse.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'getPaymentStatus',
          paymentIds
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'getPaymentStatus', options);
    }
  }

  /**
   * Exports accounts receivable data to the accounting system
   * 
   * @param arData - Accounts receivable data to export
   * @param options - Request options
   * @returns Promise resolving to the integration response with export results
   * @throws IntegrationError if export fails
   */
  public async exportAccountsReceivable(
    arData: Record<string, any>,
    options?: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    try {
      await this.ensureConnection();
      
      logger.info(`Exporting accounts receivable data to accounting system ${this.accountingConfig.accountingSystem}`, {
        recordCount: Array.isArray(arData.records) ? arData.records.length : 'unknown',
        totalAmount: arData.totalAmount
      });
      
      // Transform AR data to accounting system format
      const transformedData = this.transformer.transformRequest(arData, 'exportAccountsReceivable');
      
      // Execute export operation
      const response = await this.adapter.execute('exportAccountsReceivable', transformedData, options);
      
      // Transform response back to internal format
      const transformedResponse = this.transformer.transformResponse(response.data, 'exportAccountsReceivable');
      
      logger.info(`Successfully exported accounts receivable data to accounting system ${this.accountingConfig.accountingSystem}`, {
        exportId: response.data?.exportId || transformedResponse?.exportId,
        recordCount: Array.isArray(arData.records) ? arData.records.length : 'unknown'
      });
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: transformedResponse,
        error: null,
        metadata: {
          ...response.metadata,
          operation: 'exportAccountsReceivable',
          recordCount: Array.isArray(arData.records) ? arData.records.length : 'unknown',
          totalAmount: arData.totalAmount
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'exportAccountsReceivable', options);
    }
  }

  /**
   * Ensures that a connection to the accounting system is established
   * 
   * @returns Promise that resolves when connected
   * @throws IntegrationError if connection fails
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      logger.debug(`No active connection to accounting system ${this.accountingConfig.accountingSystem}, connecting...`);
      const connected = await this.connect();
      
      if (!connected) {
        throw new IntegrationError({
          message: `Failed to establish connection to accounting system ${this.accountingConfig.accountingSystem}`,
          service: this.accountingConfig.accountingSystem,
          endpoint: 'connect',
          retryable: true
        });
      }
    }
  }

  /**
   * Handles integration errors with appropriate logging and retries
   * 
   * @param error - The error that occurred
   * @param operation - The operation that was being performed
   * @param options - Request options
   * @returns Never returns, always throws an error
   * @throws IntegrationError with appropriate context
   */
  private handleError(
    error: any,
    operation: string,
    options?: IntegrationRequestOptions
  ): never {
    const correlationId = options?.correlationId || logger.createCorrelationId();
    
    logger.error(`Accounting integration error during ${operation}`, {
      operation,
      system: this.accountingConfig.accountingSystem,
      error: error instanceof Error ? error.message : String(error),
      correlationId
    });
    
    if (error instanceof IntegrationError) {
      throw error;
    }
    
    throw new IntegrationError({
      message: `Accounting integration error during ${operation}: ${error instanceof Error ? error.message : String(error)}`,
      service: this.accountingConfig.accountingSystem,
      endpoint: operation,
      retryable: true
    });
  }
}

/**
 * Factory function to create an accounting integration instance with the provided configuration
 * 
 * @param config - Base integration configuration
 * @param accountingConfig - Accounting-specific configuration
 * @returns New accounting integration instance
 */
export function createAccountingIntegration(
  config: IntegrationConfig,
  accountingConfig: AccountingIntegrationConfig
): AccountingIntegration {
  // Create adapter for low-level communication
  const adapter = new AccountingAdapter(config, accountingConfig);
  
  // Create transformer for data conversion
  const transformer = new AccountingTransformer(accountingConfig);
  
  // Create and return integration instance
  return new AccountingIntegration(adapter, transformer, config, accountingConfig);
}