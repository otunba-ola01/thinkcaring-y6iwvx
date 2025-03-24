import { UUID } from '../types/common.types'; // Import UUID type for identifiers
import {
  IntegrationType,
  IntegrationProtocol,
  DataFormat,
  EDITransactionType,
  MedicaidIntegrationConfig,
  IntegrationRequestOptions,
  IntegrationResponse,
  IntegrationHealthStatus,
  IntegrationStatus,
  CircuitBreakerState,
  CircuitBreakerConfig
} from '../types/integration.types'; // Import integration-related types and interfaces
import { Claim, ClaimStatus } from '../types/claims.types'; // Import claim-related types for submission and status tracking
import MedicaidAdapter from './adapters/medicaid.adapter'; // Import adapter for Medicaid portal communication
import MedicaidTransformer from './transformers/medicaid.transformer'; // Import transformer for Medicaid data formats
import IntegrationError from '../errors/integration-error'; // Import error class for integration failures
import logger from '../utils/logger'; // Import logger for integration operations
import config from '../config'; // Import configuration settings for integrations

/**
 * Service for integrating with state Medicaid portals to handle claim submissions, eligibility verification, and claim status inquiries
 */
class MedicaidIntegration {
  private adapters: Map<string, MedicaidAdapter>;
  private transformers: Map<string, MedicaidTransformer>;
  private circuitBreakers: Map<string, { state: CircuitBreakerState; failures: number; lastFailure: Date | null; resetTimeout: number }>;
  private defaultCircuitBreakerConfig: CircuitBreakerConfig;

  /**
   * Initializes the Medicaid integration service
   */
  constructor() {
    this.adapters = new Map<string, MedicaidAdapter>();
    this.transformers = new Map<string, MedicaidTransformer>();
    this.circuitBreakers = new Map<string, { state: CircuitBreakerState; failures: number; lastFailure: Date | null; resetTimeout: number }>();
    this.defaultCircuitBreakerConfig = {
      failureThreshold: config.integrations.medicaid?.circuitBreaker?.failureThreshold || 5,
      resetTimeout: config.integrations.medicaid?.circuitBreaker?.resetTimeout || 30000,
      halfOpenSuccessThreshold: config.integrations.medicaid?.circuitBreaker?.halfOpenSuccessThreshold || 2,
    };

    logger.info('Medicaid integration service initialized');
  }

  /**
   * Initializes adapters and transformers for configured state Medicaid portals
   * @returns {Promise<void>} Resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    const medicaidPortals = config.integrations.medicaid?.portals;

    if (!medicaidPortals) {
      logger.warn('No Medicaid portals configured. Medicaid integration will be inactive.');
      return;
    }

    for (const portalConfig of medicaidPortals) {
      try {
        const adapter = new MedicaidAdapter(portalConfig);
        const transformer = new MedicaidTransformer(portalConfig);

        this.adapters.set(portalConfig.state, adapter);
        this.transformers.set(portalConfig.state, transformer);

        // Initialize circuit breaker for the state portal
        this.circuitBreakers.set(portalConfig.state, {
          state: CircuitBreakerState.CLOSED,
          failures: 0,
          lastFailure: null,
          resetTimeout: this.defaultCircuitBreakerConfig.resetTimeout,
        });

        logger.info(`Initialized Medicaid portal integration for state: ${portalConfig.state}`);
      } catch (error) {
        logger.error(`Failed to initialize Medicaid portal integration for state: ${portalConfig.state}`, error);
      }
    }

    logger.info(`Medicaid integration initialized with ${this.adapters.size} state portals`);
  }

  /**
   * Gets the adapter for a specific state Medicaid portal
   * @param {string} stateCode
   * @returns {MedicaidAdapter} The adapter for the specified state
   */
  getAdapter(stateCode: string): MedicaidAdapter {
    const adapter = this.adapters.get(stateCode);

    if (!adapter) {
      throw new IntegrationError({ message: `No adapter found for state code: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'getAdapter' });
    }

    // Check circuit breaker state
    const circuitBreaker = this.circuitBreakers.get(stateCode);
    if (circuitBreaker && circuitBreaker.state === CircuitBreakerState.OPEN) {
      throw new IntegrationError({ message: `Circuit breaker is OPEN for state: ${stateCode}. Please try again later.`, service: 'MedicaidIntegration', endpoint: 'getAdapter' });
    }

    return adapter;
  }

  /**
   * Gets the transformer for a specific state Medicaid portal
   * @param {string} stateCode
   * @returns {MedicaidTransformer} The transformer for the specified state
   */
  getTransformer(stateCode: string): MedicaidTransformer {
    const transformer = this.transformers.get(stateCode);

    if (!transformer) {
      throw new IntegrationError({ message: `No transformer found for state code: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'getTransformer' });
    }

    return transformer;
  }

  /**
   * Submits a claim to a state Medicaid portal
   * @param {string} stateCode
   * @param {Claim} claim
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response from the Medicaid portal with tracking information
   */
  async submitClaim(stateCode: string, claim: Claim, options: IntegrationRequestOptions): Promise<IntegrationResponse> {
    logger.info(`Attempting to submit claim to state: ${stateCode}, claimId: ${claim.id}`);
    try {
      const adapter = this.getAdapter(stateCode);
      const transformer = this.getTransformer(stateCode);

      const transformedClaim = transformer.transformRequest({ claim: claim }, DataFormat.JSON);
      const response = await adapter.submitClaim(claim, transformedClaim, options);

      this.handleCircuitBreaker(stateCode, response.success);
      return response;
    } catch (error: any) {
      logger.error(`Error submitting claim to state: ${stateCode}, claimId: ${claim.id}`, error);
      this.handleCircuitBreaker(stateCode, false);
      throw new IntegrationError({ message: `Failed to submit claim to state: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'submitClaim' });
    }
  }

  /**
   * Submits multiple claims as a batch to a state Medicaid portal
   * @param {string} stateCode
   * @param {Claim[]} claims
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<{ success: boolean, results: Array<{ claimId: UUID, success: boolean, trackingNumber?: string, errors?: string[] }> }>} Batch submission results
   */
  async submitBatch(stateCode: string, claims: Claim[], options: IntegrationRequestOptions): Promise<{ success: boolean; results: Array<{ claimId: UUID; success: boolean; trackingNumber?: string; errors?: string[] }> }> {
    logger.info(`Attempting to submit batch of claims to state: ${stateCode}, claimCount: ${claims.length}`);
    try {
      const adapter = this.getAdapter(stateCode);
      const transformer = this.getTransformer(stateCode);

      const transformedClaims = claims.map(claim => transformer.transformRequest({ claim: claim }, DataFormat.JSON));
      const response = await adapter.submitBatch(claims, transformedClaims, options);

      this.handleCircuitBreaker(stateCode, response.success);
      return response;
    } catch (error: any) {
      logger.error(`Error submitting batch of claims to state: ${stateCode}, claimCount: ${claims.length}`, error);
      this.handleCircuitBreaker(stateCode, false);
      throw new IntegrationError({ message: `Failed to submit batch of claims to state: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'submitBatch' });
    }
  }

  /**
   * Checks the status of a previously submitted claim
   * @param {string} stateCode
   * @param {string} trackingNumber
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response with claim status information
   */
  async checkClaimStatus(stateCode: string, trackingNumber: string, options: IntegrationRequestOptions): Promise<IntegrationResponse> {
    logger.info(`Attempting to check claim status for tracking number: ${trackingNumber} in state: ${stateCode}`);
    try {
      const adapter = this.getAdapter(stateCode);
      const transformer = this.getTransformer(stateCode);

      const response = await adapter.checkClaimStatus(trackingNumber, {}, options);

      this.handleCircuitBreaker(stateCode, response.success);
      return response;
    } catch (error: any) {
      logger.error(`Error checking claim status for tracking number: ${trackingNumber} in state: ${stateCode}`, error);
      this.handleCircuitBreaker(stateCode, false);
      throw new IntegrationError({ message: `Failed to check claim status for tracking number: ${trackingNumber} in state: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'checkClaimStatus' });
    }
  }

  /**
   * Verifies patient eligibility with a state Medicaid program
   * @param {string} stateCode
   * @param {Record<string, any>} patientData
   * @param {Record<string, any>} providerData
   * @param {IntegrationRequestOptions} options
   * @returns {Promise<IntegrationResponse>} Response with eligibility information
   */
  async verifyEligibility(stateCode: string, patientData: Record<string, any>, providerData: Record<string, any>, options: IntegrationRequestOptions): Promise<IntegrationResponse> {
    logger.info(`Attempting to verify eligibility for patient in state: ${stateCode}, patientData: ${JSON.stringify(patientData)}`);
    try {
      const adapter = this.getAdapter(stateCode);
      const transformer = this.getTransformer(stateCode);

      const transformedEligibilityData = transformer.transformRequest({ patientData: patientData, providerData: providerData }, DataFormat.JSON);
      const response = await adapter.verifyEligibility(patientData, providerData, options);

      this.handleCircuitBreaker(stateCode, response.success);
      return response;
    } catch (error: any) {
      logger.error(`Error verifying eligibility for patient in state: ${stateCode}, patientData: ${JSON.stringify(patientData)}`, error);
      this.handleCircuitBreaker(stateCode, false);
      throw new IntegrationError({ message: `Failed to verify eligibility for patient in state: ${stateCode}`, service: 'MedicaidIntegration', endpoint: 'verifyEligibility' });
    }
  }

  /**
   * Checks the health of a state Medicaid portal connection
   * @param {string} stateCode
   * @returns {Promise<IntegrationHealthStatus>} Health status of the Medicaid portal connection
   */
  async checkHealth(stateCode: string): Promise<IntegrationHealthStatus> {
    logger.info(`Checking health for state: ${stateCode}`);
    try {
      const adapter = this.adapters.get(stateCode);

      if (!adapter) {
        return {
          status: IntegrationStatus.INACTIVE,
          responseTime: null,
          lastChecked: new Date(),
          message: `No adapter configured for state: ${stateCode}`,
          details: { state: stateCode }
        };
      }

      const healthStatus = await adapter.checkHealth();
      this.handleCircuitBreaker(stateCode, healthStatus.status === IntegrationStatus.ACTIVE);
      return healthStatus;
    } catch (error: any) {
      logger.error(`Error checking health for state: ${stateCode}`, error);
      this.handleCircuitBreaker(stateCode, false);
      return {
        status: IntegrationStatus.ERROR,
        responseTime: null,
        lastChecked: new Date(),
        message: `Health check failed for state: ${stateCode}`,
        details: { state: stateCode, error: error.message }
      };
    }
  }

  /**
   * Handles circuit breaker state transitions based on success/failure
   * @param {string} stateCode
   * @param {boolean} success
   * @returns {void} Updates circuit breaker state
   */
  private handleCircuitBreaker(stateCode: string, success: boolean): void {
    const circuitBreaker = this.circuitBreakers.get(stateCode);

    if (!circuitBreaker) {
      logger.warn(`No circuit breaker found for state: ${stateCode}`);
      return;
    }

    const previousState = circuitBreaker.state;

    if (success) {
      if (circuitBreaker.state === CircuitBreakerState.CLOSED) {
        circuitBreaker.failures = 0;
      } else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.state = CircuitBreakerState.CLOSED;
        circuitBreaker.failures = 0;
      }
    } else {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = new Date();

      if (circuitBreaker.state === CircuitBreakerState.CLOSED && circuitBreaker.failures >= this.defaultCircuitBreakerConfig.failureThreshold) {
        circuitBreaker.state = CircuitBreakerState.OPEN;
        setTimeout(() => {
          this.resetCircuitBreaker(stateCode);
        }, circuitBreaker.resetTimeout);
      } else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.state = CircuitBreakerState.OPEN;
        setTimeout(() => {
          this.resetCircuitBreaker(stateCode);
        }, circuitBreaker.resetTimeout);
      }
    }

    if (previousState !== circuitBreaker.state) {
      logger.info(`Circuit breaker state changed for state: ${stateCode} from ${previousState} to ${circuitBreaker.state}`);
    }
  }

  /**
   * Attempts to reset a circuit breaker from OPEN to HALF_OPEN after timeout
   * @param {string} stateCode
   * @returns {boolean} True if circuit breaker was reset
   */
  private resetCircuitBreaker(stateCode: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(stateCode);

    if (!circuitBreaker || circuitBreaker.state !== CircuitBreakerState.OPEN) {
      return false;
    }

    if (circuitBreaker.lastFailure && Date.now() - circuitBreaker.lastFailure.getTime() >= circuitBreaker.resetTimeout) {
      circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
      logger.info(`Attempting to reset circuit breaker for state: ${stateCode} to HALF_OPEN`);
      return true;
    }

    return false;
  }

  /**
   * Gets state-specific configuration settings
   * @param {string} stateCode
   * @param {string} configKey
   * @returns {any} The state-specific configuration value
   */
  private getStateSpecificConfig(stateCode: string, configKey: string): any {
    const stateConfig = config.integrations.medicaid?.portals?.find(portal => portal.state === stateCode);
    if (stateConfig && stateConfig[configKey]) {
      logger.debug(`Using state-specific config for ${stateCode}.${configKey}`, { value: stateConfig[configKey] });
      return stateConfig[configKey];
    }
    return null;
  }
}

const medicaidIntegration = new MedicaidIntegration();
medicaidIntegration.initialize();

export { MedicaidIntegration };
export { medicaidIntegration };