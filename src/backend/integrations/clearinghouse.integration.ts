import axios from 'axios'; // axios 1.4.0
import { parseString, Builder } from 'xml2js'; // xml2js 0.5.0
import SftpClient from 'ssh2-sftp-client'; // ssh2-sftp-client 9.1.0
import { UUID } from '../types/common.types';
import { 
  IntegrationType,
  IntegrationProtocol,
  DataFormat,
  EDITransactionType,
  IntegrationConfig,
  ClearinghouseIntegrationConfig,
  IntegrationRequestOptions,
  IntegrationResponse,
  IntegrationHealthStatus,
  IntegrationStatus,
  CircuitBreakerState,
  CircuitBreakerConfig
} from '../types/integration.types';
import { Claim, ClaimStatus, ClaimWithRelations } from '../types/claims.types';
import ClearinghouseAdapter from './adapters/clearinghouse.adapter';
import ClearinghouseTransformer from './transformers/clearinghouse.transformer';
import IntegrationError from '../errors/integration-error';
import logger from '../utils/logger';
import config from '../config';

/**
 * Service for integrating with clearinghouse systems to handle claim submissions, status inquiries, and remittance processing
 */
export class ClearinghouseIntegration {
  private adapters: Map<string, ClearinghouseAdapter>;
  private transformers: Map<string, ClearinghouseTransformer>;
  private circuitBreakers: Map<string, { 
    state: CircuitBreakerState; 
    failures: number; 
    lastFailure: Date | null; 
    resetTimeout: number 
  }>;
  private defaultCircuitBreakerConfig: CircuitBreakerConfig;

  /**
   * Initializes the clearinghouse integration service
   */
  constructor() {
    this.adapters = new Map<string, ClearinghouseAdapter>();
    this.transformers = new Map<string, ClearinghouseTransformer>();
    this.circuitBreakers = new Map<string, { 
      state: CircuitBreakerState; 
      failures: number; 
      lastFailure: Date | null; 
      resetTimeout: number 
    }>();
    this.defaultCircuitBreakerConfig = {
      failureThreshold: config.integrations.clearinghouse?.circuitBreaker?.failureThreshold || 5,
      resetTimeout: config.integrations.clearinghouse?.circuitBreaker?.resetTimeout || 30000,
      halfOpenSuccessThreshold: config.integrations.clearinghouse?.circuitBreaker?.halfOpenSuccessThreshold || 2
    };
    logger.info('ClearinghouseIntegration service initialized');
  }

  /**
   * Initializes adapters and transformers for configured clearinghouses
   * @returns {Promise<void>} Resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    logger.info('Initializing clearinghouse integrations...');
    const clearinghouseConfigs = config.integrations.clearinghouse?.configurations;

    if (clearinghouseConfigs && Array.isArray(clearinghouseConfigs)) {
      for (const clearinghouseConfig of clearinghouseConfigs) {
        try {
          // Create adapter instance with configuration
          const adapter = new ClearinghouseAdapter(clearinghouseConfig);
          this.adapters.set(clearinghouseConfig.id, adapter);

          // Create transformer instance with configuration
          const transformer = new ClearinghouseTransformer(clearinghouseConfig);
          this.transformers.set(clearinghouseConfig.id, transformer);

          // Initialize circuit breaker for the clearinghouse
          this.circuitBreakers.set(clearinghouseConfig.id, {
            state: CircuitBreakerState.CLOSED,
            failures: 0,
            lastFailure: null,
            resetTimeout: this.defaultCircuitBreakerConfig.resetTimeout
          });
        } catch (error) {
          logger.error(`Failed to initialize clearinghouse integration for ${clearinghouseConfig.name}`, { error });
        }
      }
      logger.info(`Successfully initialized ${clearinghouseConfigs.length} clearinghouse integrations`);
    } else {
      logger.warn('No clearinghouse configurations found in config.');
    }
  }

  /**
   * Gets the adapter for a specific clearinghouse
   * @param {string} clearinghouseId
   * @returns {ClearinghouseAdapter} The adapter for the specified clearinghouse
   */
  getAdapter(clearinghouseId: string): ClearinghouseAdapter {
    const adapter = this.adapters.get(clearinghouseId);
    if (!adapter) {
      logger.error(`Clearinghouse adapter not found for ID: ${clearinghouseId}`);
      throw new IntegrationError({
        message: `Clearinghouse adapter not found for ID: ${clearinghouseId}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'getAdapter'
      });
    }

    // Check circuit breaker state for the clearinghouse
    const circuitBreaker = this.circuitBreakers.get(clearinghouseId);
    if (circuitBreaker && circuitBreaker.state === CircuitBreakerState.OPEN) {
      logger.warn(`Circuit breaker is OPEN for clearinghouse: ${clearinghouseId}`);
      throw new IntegrationError({
        message: `Circuit breaker is OPEN for clearinghouse: ${clearinghouseId}. Please try again later.`,
        service: 'ClearinghouseIntegration',
        endpoint: 'getAdapter'
      });
    }

    return adapter;
  }

  /**
   * Gets the transformer for a specific clearinghouse
   * @param {string} clearinghouseId
   * @returns {ClearinghouseTransformer} The transformer for the specified clearinghouse
   */
  getTransformer(clearinghouseId: string): ClearinghouseTransformer {
    const transformer = this.transformers.get(clearinghouseId);
    if (!transformer) {
      logger.error(`Clearinghouse transformer not found for ID: ${clearinghouseId}`);
      throw new IntegrationError({
        message: `Clearinghouse transformer not found for ID: ${clearinghouseId}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'getTransformer'
      });
    }
    return transformer;
  }

  /**
   * Submits a claim to a clearinghouse
   * @param {string} clearinghouseId
   * @param {Claim} claim
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response from the clearinghouse with tracking information
   */
  async submitClaim(
    clearinghouseId: string,
    claim: Claim,
    options: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    logger.info(`Attempting to submit claim to clearinghouse: ${clearinghouseId}`, { claimId: claim.id, correlationId: options.correlationId });
    try {
      const adapter = this.getAdapter(clearinghouseId);
      const transformer = this.getTransformer(clearinghouseId);

      // Transform claim data for the clearinghouse format
      const transformedClaimData = transformer.transformRequest(claim, DataFormat.JSON);

      // Submit claim using adapter
      const response = await adapter.sendRequest(
        'submitClaim',
        'POST',
        transformedClaimData,
        options
      );

      // Update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // Transform response from clearinghouse format
      const transformedResponseData = transformer.transformResponse(response.data, DataFormat.JSON);

      // Return standardized response with tracking information
      return {
        ...response,
        data: transformedResponseData
      };
    } catch (error) {
      this.handleCircuitBreaker(clearinghouseId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to submit claim to clearinghouse: ${clearinghouseId}`, { claimId: claim.id, error: errorMessage, correlationId: options.correlationId });
      throw new IntegrationError({
        message: `Failed to submit claim: ${errorMessage}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'submitClaim'
      });
    }
  }

  /**
   * Submits multiple claims as a batch to a clearinghouse
   * @param {string} clearinghouseId
   * @param {Claim[]} claims
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<{ success: boolean, results: Array<{ claimId: UUID, success: boolean, trackingNumber?: string, errors?: string[] }> }>} Batch submission results
   */
  async submitBatch(
    clearinghouseId: string,
    claims: Claim[],
    options: IntegrationRequestOptions
  ): Promise<{ success: boolean; results: Array<{ claimId: UUID; success: boolean; trackingNumber?: string; errors?: string[] }> }> {
    logger.info(`Attempting to submit batch of claims to clearinghouse: ${clearinghouseId}`, { claimCount: claims.length, correlationId: options.correlationId });
    try {
      const adapter = this.getAdapter(clearinghouseId);
      const transformer = this.getTransformer(clearinghouseId);

      // Check if batch size exceeds clearinghouse limits
      const maxBatchSize = config.integrations.clearinghouse?.batchSize || 100;
      if (claims.length > maxBatchSize) {
        throw new IntegrationError({
          message: `Batch size (${claims.length}) exceeds maximum allowed (${maxBatchSize})`,
          service: 'ClearinghouseIntegration',
          endpoint: 'submitBatch'
        });
      }

      // Transform each claim for the clearinghouse format
      const transformedClaims = claims.map(claim => transformer.transformRequest(claim, DataFormat.JSON));

      // Submit batch using adapter
      const response = await adapter.sendRequest(
        'submitBatch',
        'POST',
        transformedClaims,
        options
      );

      // Process batch response and extract individual results
      const results = claims.map(claim => ({
        claimId: claim.id,
        success: response.success,
        trackingNumber: response.data?.trackingNumber,
        errors: response.error ? [response.error.message] : []
      }));

      // Update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // Return standardized batch results with tracking information
      return {
        success: response.success,
        results: results
      };
    } catch (error) {
      this.handleCircuitBreaker(clearinghouseId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to submit claim batch to clearinghouse: ${clearinghouseId}`, { claimCount: claims.length, error: errorMessage, correlationId: options.correlationId });
      throw new IntegrationError({
        message: `Failed to submit claim batch: ${errorMessage}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'submitBatch'
      });
    }
  }

  /**
   * Checks the status of a previously submitted claim
   * @param {string} clearinghouseId
   * @param {string} trackingNumber
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response with claim status information
   */
  async checkClaimStatus(
    clearinghouseId: string,
    trackingNumber: string,
    options: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    logger.info(`Attempting to check claim status with clearinghouse: ${clearinghouseId}`, { trackingNumber, correlationId: options.correlationId });
    try {
      const adapter = this.getAdapter(clearinghouseId);
      const transformer = this.getTransformer(clearinghouseId);

      // Prepare status inquiry request with tracking number
      const statusInquiry = { trackingNumber };

      // Check claim status using adapter
      const response = await adapter.sendRequest(
        'checkClaimStatus',
        'GET',
        statusInquiry,
        options
      );

      // Update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // Transform response from clearinghouse format
      const transformedResponseData = transformer.transformResponse(response.data, DataFormat.JSON);

      // Return standardized response with status information
      return {
        ...response,
        data: transformedResponseData
      };
    } catch (error) {
      this.handleCircuitBreaker(clearinghouseId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to check claim status with clearinghouse: ${clearinghouseId}`, { trackingNumber, error: errorMessage, correlationId: options.correlationId });
      throw new IntegrationError({
        message: `Failed to check claim status: ${errorMessage}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'checkClaimStatus'
      });
    }
  }

  /**
   * Downloads remittance advice files from a clearinghouse
   * @param {string} clearinghouseId
   * @param {Date} fromDate
   * @param {Date} toDate
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response with remittance files
   */
  async downloadRemittance(
    clearinghouseId: string,
    fromDate: Date,
    toDate: Date,
    options: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    logger.info(`Attempting to download remittance advice from clearinghouse: ${clearinghouseId}`, { fromDate, toDate, correlationId: options.correlationId });
    try {
      const adapter = this.getAdapter(clearinghouseId);
      const transformer = this.getTransformer(clearinghouseId);

      // Prepare remittance download request with date range
      const remittanceRequest = { fromDate, toDate };

      // Download remittance files using adapter
      const response = await adapter.sendRequest(
        'downloadRemittance',
        'GET',
        remittanceRequest,
        options
      );

      // Update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // Transform response from clearinghouse format
      const transformedResponseData = transformer.transformResponse(response.data, DataFormat.JSON);

      // Return standardized response with remittance data
      return {
        ...response,
        data: transformedResponseData
      };
    } catch (error) {
      this.handleCircuitBreaker(clearinghouseId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to download remittance advice from clearinghouse: ${clearinghouseId}`, { fromDate, toDate, error: errorMessage, correlationId: options.correlationId });
      throw new IntegrationError({
        message: `Failed to download remittance advice: ${errorMessage}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'downloadRemittance'
      });
    }
  }

  /**
   * Verifies patient eligibility with a payer through the clearinghouse
   * @param {string} clearinghouseId
   * @param {Record<string, any>} patientData
   * @param {Record<string, any>} payerData
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response with eligibility information
   */
  async verifyEligibility(
    clearinghouseId: string,
    patientData: Record<string, any>,
    payerData: Record<string, any>,
    options: IntegrationRequestOptions
  ): Promise<IntegrationResponse> {
    logger.info(`Attempting to verify eligibility with clearinghouse: ${clearinghouseId}`, { patientId: patientData.id, payerId: payerData.id, correlationId: options.correlationId });
    try {
      const adapter = this.getAdapter(clearinghouseId);
      const transformer = this.getTransformer(clearinghouseId);

      // Transform eligibility request data for the clearinghouse
      const transformedEligibilityData = transformer.transformRequest({ patientData, payerData }, DataFormat.JSON);

      // Verify eligibility using adapter
      const response = await adapter.sendRequest(
        'verifyEligibility',
        'POST',
        transformedEligibilityData,
        options
      );

      // Update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // Transform response from clearinghouse format
      const transformedResponseData = transformer.transformResponse(response.data, DataFormat.JSON);

      // Return standardized response with eligibility information
      return {
        ...response,
        data: transformedResponseData
      };
    } catch (error) {
      this.handleCircuitBreaker(clearinghouseId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to verify eligibility with clearinghouse: ${clearinghouseId}`, { patientId: patientData.id, payerId: payerData.id, error: errorMessage, correlationId: options.correlationId });
      throw new IntegrationError({
        message: `Failed to verify eligibility: ${errorMessage}`,
        service: 'ClearinghouseIntegration',
        endpoint: 'verifyEligibility'
      });
    }
  }

  /**
   * Checks the health of a clearinghouse connection
   * @param {string} clearinghouseId
   * @returns {Promise<IntegrationHealthStatus>} Health status of the clearinghouse connection
   */
  async checkHealth(clearinghouseId: string): Promise<IntegrationHealthStatus> {
    logger.info(`Checking health of clearinghouse: ${clearinghouseId}`);
    try {
      const adapter = this.getAdapter(clearinghouseId);

      // Try to check health using adapter
      const response = await adapter.checkHealth();

      // If successful, update circuit breaker state to success
      this.handleCircuitBreaker(clearinghouseId, true);

      // If circuit was OPEN, attempt to reset to HALF_OPEN
      if (this.circuitBreakers.get(clearinghouseId)?.state === CircuitBreakerState.OPEN) {
        this.resetCircuitBreaker(clearinghouseId);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Health check failed for clearinghouse: ${clearinghouseId}`, { error: errorMessage });

      // Update circuit breaker failure count
      this.handleCircuitBreaker(clearinghouseId, false);

      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed: ${errorMessage}`,
        details: {
          error: errorMessage,
          clearinghouseSystem: this.adapters.get(clearinghouseId)?.clearinghouseSystem
        }
      };
    }
  }

  /**
   * Handles circuit breaker state transitions based on success/failure
   * @param {string} clearinghouseId
   * @param {boolean} success
   * @returns {void} Updates circuit breaker state
   */
  private handleCircuitBreaker(clearinghouseId: string, success: boolean): void {
    const circuitBreaker = this.circuitBreakers.get(clearinghouseId);
    if (!circuitBreaker) {
      logger.warn(`Circuit breaker not found for clearinghouse: ${clearinghouseId}`);
      return;
    }

    const previousState = circuitBreaker.state;

    if (success) {
      if (circuitBreaker.state === CircuitBreakerState.CLOSED) {
        circuitBreaker.failures = 0;
      } else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.state = CircuitBreakerState.CLOSED;
      }
    } else {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = new Date();

      if (circuitBreaker.failures > this.defaultCircuitBreakerConfig.failureThreshold && circuitBreaker.state === CircuitBreakerState.CLOSED) {
        circuitBreaker.state = CircuitBreakerState.OPEN;
        circuitBreaker.resetTimeout = this.defaultCircuitBreakerConfig.resetTimeout;
      } else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.state = CircuitBreakerState.OPEN;
        circuitBreaker.resetTimeout = this.defaultCircuitBreakerConfig.resetTimeout;
      }
    }

    if (previousState !== circuitBreaker.state) {
      logger.info(`Circuit breaker state changed for clearinghouse: ${clearinghouseId}`, {
        from: previousState,
        to: circuitBreaker.state
      });
    }
  }

  /**
   * Attempts to reset a circuit breaker from OPEN to HALF_OPEN after timeout
   * @param {string} clearinghouseId
   * @returns {boolean} True if circuit breaker was reset
   */
  private resetCircuitBreaker(clearinghouseId: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(clearinghouseId);
    if (!circuitBreaker) {
      logger.warn(`Circuit breaker not found for clearinghouse: ${clearinghouseId}`);
      return false;
    }

    if (circuitBreaker.state !== CircuitBreakerState.OPEN) {
      return false;
    }

    // Check if reset timeout has elapsed since last failure
    if (circuitBreaker.lastFailure && Date.now() - circuitBreaker.lastFailure.getTime() > circuitBreaker.resetTimeout) {
      circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
      logger.info(`Attempting to reset circuit breaker for clearinghouse: ${clearinghouseId}`);
      return true;
    }

    return false;
  }
}

export const clearinghouseIntegration = new ClearinghouseIntegration();