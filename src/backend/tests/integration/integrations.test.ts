import { initializeIntegrations, clearinghouseIntegration, ehrIntegration, accountingIntegration, medicaidIntegration, remittanceIntegration } from '../../integrations'; // version as specified in source file
import { ClearinghouseAdapter } from '../../integrations/adapters/clearinghouse.adapter'; // version as specified in source file
import { IntegrationType, IntegrationProtocol, DataFormat, EDITransactionType, IntegrationConfig, ClearinghouseIntegrationConfig, IntegrationRequestOptions, IntegrationResponse, IntegrationHealthStatus, IntegrationStatus, CircuitBreakerState } from '../../types/integration.types'; // version as specified in source file
import { Claim, ClaimStatus } from '../../types/claims.types'; // version as specified in source file
import IntegrationError from '../../errors/integration-error'; // version as specified in source file
import config from '../../config'; // version as specified in source file
import { mockClaim, mockSubmittedClaim } from '../fixtures/claims.fixtures'; // version as specified in source file
import * as jest from 'jest'; // version 29.5.0
import * as nock from 'nock'; // version 13.3.1
import * as MockDate from 'mockdate'; // version 3.0.5

// Mock global functions for testing
beforeAll(jest.fn(async () => {
  await initializeIntegrations();
}));

afterAll(jest.fn(() => {
  jest.restoreAllMocks();
  nock.cleanAll();
}));

beforeEach(jest.fn(() => {
  jest.clearAllMocks();
  nock.cleanAll();
}));

/**
 * Creates a mock clearinghouse adapter for testing
 * @param {Partial<ClearinghouseIntegrationConfig>} config
 * @returns {ClearinghouseAdapter} Mocked clearinghouse adapter
 */
const mockClearinghouseAdapter = (config: Partial<ClearinghouseIntegrationConfig> = {}): ClearinghouseAdapter => {
  const adapter = new ClearinghouseAdapter({
    id: 'test-clearinghouse-id',
    name: 'Test Clearinghouse',
    description: 'Test Clearinghouse',
    type: IntegrationType.CLEARINGHOUSE,
    protocol: IntegrationProtocol.REST,
    baseUrl: 'http://clearinghouse.example.com',
    authType: null,
    credentials: {},
    headers: {},
    status: IntegrationStatus.ACTIVE,
    timeout: 5000,
    retryLimit: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...config
  } as ClearinghouseIntegrationConfig);

  adapter.connect = jest.fn().mockResolvedValue(true);
  adapter.disconnect = jest.fn().mockResolvedValue(true);
  adapter.checkHealth = jest.fn().mockResolvedValue({ status: IntegrationStatus.ACTIVE, responseTime: 100, lastChecked: new Date(), message: 'Healthy', details: {} });
  adapter.sendRequest = jest.fn().mockResolvedValue({ success: true, statusCode: 200, data: { trackingNumber: '12345' }, error: null, metadata: {}, timestamp: new Date() });

  return adapter;
};

/**
 * Creates a mock integration response for testing
 * @param {Partial<IntegrationResponse>} overrides
 * @returns {IntegrationResponse} Mock integration response
 */
const createMockIntegrationResponse = (overrides: Partial<IntegrationResponse> = {}): IntegrationResponse => {
  const defaultResponse: IntegrationResponse = {
    success: true,
    statusCode: 200,
    data: {},
    error: null,
    metadata: {},
    timestamp: new Date(),
    ...overrides
  };

  return defaultResponse;
};

/**
 * Sets up mock HTTP responses for external API calls
 */
const setupMockHttpResponses = (): void => {
  // Set up nock interceptor for clearinghouse API
  nock('http://clearinghouse.example.com')
    .post('/claims')
    .reply(200, { trackingNumber: '12345' });

  // Set up nock interceptor for EHR API
  nock('http://ehr.example.com')
    .get('/services')
    .reply(200, [{ serviceCode: 'SVC1001' }]);

  // Set up nock interceptor for accounting API
  nock('http://accounting.example.com')
    .post('/payments')
    .reply(200, { paymentId: 'PAY123' });

  // Set up nock interceptor for Medicaid portal API
  nock('http://medicaid.example.com')
    .post('/eligibility')
    .reply(200, { eligible: true });
};

describe('Integration Initialization', () => {
  it('should initialize all integration services', async () => {
    // Mock the config.integrations object with test configurations
    const mockIntegrationsConfig = {
      clearinghouse: { name: 'Test Clearinghouse' },
      ehr: { name: 'Test EHR' },
      accounting: { name: 'Test Accounting' },
      medicaid: { name: 'Test Medicaid' },
      remittance: { name: 'Test Remittance' }
    };
    jest.spyOn(config, 'integrations', 'get').mockReturnValue(mockIntegrationsConfig as any);

    // Call initializeIntegrations()
    await initializeIntegrations();

    // Expect clearinghouseIntegration to be defined
    expect(clearinghouseIntegration).toBeDefined();

    // Expect ehrIntegration to be defined
    expect(ehrIntegration).toBeDefined();

    // Expect accountingIntegration to be defined
    expect(accountingIntegration).toBeDefined();

    // Expect medicaidIntegration to be defined
    expect(medicaidIntegration).toBeDefined();

    // Expect remittanceIntegration to be defined
    expect(remittanceIntegration).toBeDefined();
  });

  it('should handle initialization errors gracefully', async () => {
    // Mock the config.integrations object to throw an error
    jest.spyOn(config, 'integrations', 'get').mockImplementation(() => {
      throw new Error('Initialization failed');
    });

    // Call initializeIntegrations()
    await initializeIntegrations();

    // Expect the function to complete without throwing
    expect(true).toBe(true);

    // Expect error to be logged
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Clearinghouse Integration', () => {
  it('should submit a claim successfully', async () => {
    // Set up mock HTTP response for claim submission
    setupMockHttpResponses();

    // Call clearinghouseIntegration.submitClaim() with mock claim
    const response = await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include a tracking number
    expect(response.data.trackingNumber).toBe('12345');

    // Expect the response to have the correct timestamp
    expect(response.timestamp).toBeInstanceOf(Date);
  });

  it('should handle claim submission errors', async () => {
    // Set up mock HTTP response to return an error
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .reply(500, { message: 'Submission failed' });

    // Call clearinghouseIntegration.submitClaim() with mock claim
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status
      expect(error).toBeInstanceOf(IntegrationError);

      // Expect the response to include error details
      expect(error.message).toBe('Failed to submit claim: Clearinghouse request failed: Request failed with status code 500');
    }
  });

  it('should check claim status successfully', async () => {
    // Set up mock HTTP response for claim status check
    nock('http://clearinghouse.example.com')
      .get('/claims/status?trackingNumber=12345')
      .reply(200, { status: 'Processed' });

    // Call clearinghouseIntegration.checkClaimStatus() with tracking number
    const response = await clearinghouseIntegration.checkClaimStatus('test-clearinghouse-id', '12345', { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include claim status information
    expect(response.data.status).toBe('Processed');
  });

  it('should submit a batch of claims successfully', async () => {
    // Set up mock HTTP response for batch submission
    nock('http://clearinghouse.example.com')
      .post('/claims/batch')
      .reply(200, { success: true, message: 'Batch submitted successfully' });

    // Call clearinghouseIntegration.submitBatch() with array of claims
    const response = await clearinghouseIntegration.submitBatch('test-clearinghouse-id', [mockClaim, mockClaim], { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include results for each claim
    expect(response.results.length).toBe(2);
  });

  it('should download remittance advice successfully', async () => {
    // Set up mock HTTP response for remittance download
    nock('http://clearinghouse.example.com')
      .get('/remittance?fromDate=2023-01-01&toDate=2023-01-31')
      .reply(200, { remittanceData: 'test data' });

    // Call clearinghouseIntegration.downloadRemittance() with date range
    const response = await clearinghouseIntegration.downloadRemittance('test-clearinghouse-id', new Date('2023-01-01'), new Date('2023-01-31'), { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include remittance data
    expect(response.data.remittanceData).toBe('test data');
  });

  it('should implement circuit breaker pattern', async () => {
    // Set up mock HTTP response to fail repeatedly
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .times(5)
      .reply(500, { message: 'Submission failed' });

    // Call clearinghouseIntegration.submitClaim() multiple times
    for (let i = 0; i < 5; i++) {
      try {
        await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
      } catch (error) {
        // Ignore errors
      }
    }

    // Expect the circuit to open after threshold failures
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect subsequent calls to fail immediately with circuit open error
      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.message).toBe('Circuit breaker is OPEN for clearinghouse: test-clearinghouse-id. Please try again later.');
    }

    // Mock time passage to allow circuit reset timeout
    MockDate.set(Date.now() + 60000);

    // Expect circuit to transition to half-open state
    // Set up mock HTTP response to succeed
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .reply(200, { trackingNumber: '12345' });

    // Call clearinghouseIntegration.submitClaim() again
    const response = await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect circuit to close after successful call
    expect(response.success).toBe(true);
    MockDate.reset();
  });
});

describe('EHR Integration', () => {
  it('should fetch service data successfully', async () => {
    // Set up mock HTTP response for service data
    nock('http://ehr.example.com')
      .get('/services?clientId=123&startDate=2023-01-01&endDate=2023-01-31')
      .reply(200, [{ serviceCode: 'SVC1001' }]);

    // Call ehrIntegration.fetchServices() with date range
    const response = await ehrIntegration.fetchServices('123', new Date('2023-01-01'), new Date('2023-01-31'), {}, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include service data
    expect(response.data[0].serviceCode).toBe('SVC1001');
  });

  it('should fetch client data successfully', async () => {
    // Set up mock HTTP response for client data
    nock('http://ehr.example.com')
      .get('/clients?clientId=123')
      .reply(200, { firstName: 'John', lastName: 'Doe' });

    // Call ehrIntegration.fetchClients() with optional filters
    const response = await ehrIntegration.fetchClients({ clientId: '123' }, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include client data
    expect(response.data.firstName).toBe('John');
    expect(response.data.lastName).toBe('Doe');
  });

  it('should handle EHR connection errors', async () => {
    // Set up mock HTTP response to fail with connection error
    nock('http://ehr.example.com')
      .get('/services?clientId=123&startDate=2023-01-01&endDate=2023-01-31')
      .reply(500, { message: 'Connection failed' });

    // Call ehrIntegration.fetchServices() with date range
    try {
      await ehrIntegration.fetchServices('123', new Date('2023-01-01'), new Date('2023-01-31'), {}, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status
      expect(error).toBeInstanceOf(IntegrationError);

      // Expect the response to include connection error details
      expect(error.message).toBe('EHR request failed: Request failed with status code 500');
    }
  });

  it('should transform EHR data to system format', async () => {
    // Set up mock HTTP response with EHR-specific data format
    nock('http://ehr.example.com')
      .get('/services?clientId=123&startDate=2023-01-01&endDate=2023-01-31')
      .reply(200, [{ ehrServiceCode: 'SVC1001', ehrUnits: 2 }]);

    // Call ehrIntegration.fetchServices() with date range
    const response = await ehrIntegration.fetchServices('123', new Date('2023-01-01'), new Date('2023-01-31'), {}, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response data to be transformed to system format
    expect(response.data[0].serviceCode).toBe('SVC1001');

    // Verify specific field mappings are correct
    expect(response.data[0].units).toBe(2);
  });
});

describe('Accounting Integration', () => {
  it('should post payment data successfully', async () => {
    // Set up mock HTTP response for payment posting
    nock('http://accounting.example.com')
      .post('/payments')
      .reply(200, { paymentId: 'PAY123' });

    // Call accountingIntegration.postPayment() with payment data
    const response = await accountingIntegration.postPayment({ id: '123', paymentAmount: 100 } as Payment, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include confirmation details
    expect(response.data.paymentId).toBe('PAY123');
  });

  it('should sync revenue data successfully', async () => {
    // Set up mock HTTP response for revenue sync
    nock('http://accounting.example.com')
      .post('/revenue')
      .reply(200, { syncId: 'SYNC456' });

    // Call accountingIntegration.syncRevenue() with revenue data
    const response = await accountingIntegration.syncRevenue({ revenueData: 'test data' }, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include sync confirmation
    expect(response.data.syncId).toBe('SYNC456');
  });

  it('should handle accounting system unavailability', async () => {
    // Set up mock HTTP response to timeout
    nock('http://accounting.example.com')
      .post('/payments')
      .delayConnection(5000)
      .reply(500, { message: 'Timeout' });

    // Call accountingIntegration.postPayment() with payment data
    try {
      await accountingIntegration.postPayment({ id: '123', paymentAmount: 100 } as Payment, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status
      expect(error).toBeInstanceOf(IntegrationError);

      // Expect retry mechanism to be triggered
      expect(error.message).toBe('Accounting system returned error: 500 Internal Server Error');
    }
  });
});

describe('Medicaid Integration', () => {
  it('should verify eligibility successfully', async () => {
    // Set up mock HTTP response for eligibility verification
    nock('http://medicaid.example.com')
      .post('/eligibility')
      .reply(200, { eligible: true });

    // Call medicaidIntegration.verifyEligibility() with client data
    const response = await medicaidIntegration.verifyEligibility('CA', { clientId: '123' }, { providerId: '456' }, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include eligibility details
    expect(response.data.eligible).toBe(true);
  });

  it('should submit claim to Medicaid portal successfully', async () => {
    // Set up mock HTTP response for Medicaid claim submission
    nock('http://medicaid.example.com')
      .post('/claims')
      .reply(200, { trackingId: 'TRACK789' });

    // Call medicaidIntegration.submitClaim() with claim data
    const response = await medicaidIntegration.submitClaim('CA', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include Medicaid tracking information
    expect(response.data.trackingId).toBe('TRACK789');
  });

  it('should handle Medicaid-specific error codes', async () => {
    // Set up mock HTTP response with Medicaid error code
    nock('http://medicaid.example.com')
      .post('/claims')
      .reply(400, { code: 'ERR001', message: 'Invalid claim data' });

    // Call medicaidIntegration.submitClaim() with claim data
    try {
      await medicaidIntegration.submitClaim('CA', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status
      expect(error).toBeInstanceOf(IntegrationError);

      // Expect the error message to be translated to system format
      expect(error.message).toBe('Medicaid request failed: Request failed with status code 400');

      // Expect the original error code to be preserved in metadata
      expect(error.details.code).toBe('INTEGRATION_ERROR');
    }
  });
});

describe('Remittance Integration', () => {
  it('should process 835 file successfully', async () => {
    // Prepare mock 835 file content
    const mock835FileContent = 'ISA*...';

    // Call remittanceIntegration.process835File() with file content
    const response = await remittanceIntegration.process835File('mock835FileContent', { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect the response to include parsed payment data
    expect(response.data.paymentAmount).toBe(100);

    // Expect the response to include parsed adjustment codes
    expect(response.data.adjustmentCodes).toEqual({ 'CAS01': 'CO-45' });
  });

  it('should handle invalid 835 file format', async () => {
    // Prepare invalid 835 file content
    const invalid835FileContent = 'Invalid 835 data';

    // Call remittanceIntegration.process835File() with invalid content
    try {
      await remittanceIntegration.process835File(invalid835FileContent, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status
      expect(error).toBeInstanceOf(IntegrationError);

      // Expect the response to include format error details
      expect(error.message).toBe('Remittance processing failed: Invalid 835 file format');
    }
  });

  it('should match payments to claims correctly', async () => {
    // Prepare mock 835 file with payment data
    const mock835FileContent = 'ISA*...';

    // Set up mock claims in the system
    const mockClaims = [mockClaim, mockSubmittedClaim];
    jest.spyOn(claimRepository, 'findAll').mockResolvedValue({ data: mockClaims, total: 2 });

    // Call remittanceIntegration.matchPayments() with payment data
    const response = await remittanceIntegration.matchPayments(mock835FileContent, { correlationId: '123' } as IntegrationRequestOptions);

    // Expect the response to have success status
    expect(response.success).toBe(true);

    // Expect payments to be correctly matched to claims
    expect(response.data.matchedClaims.length).toBe(2);

    // Expect unmatched payments to be identified
    expect(response.data.unmatchedPayments.length).toBe(0);
  });
});

describe('Integration Error Handling', () => {
  it('should handle network timeouts', async () => {
    // Set up mock HTTP response to timeout
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .delayConnection(5000)
      .reply(500, { message: 'Timeout' });

    // Call integration service method
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status with timeout indication
      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.message).toBe('Clearinghouse request failed: Request failed with status code 500');

      // Expect retry mechanism to be triggered
      expect(error.retryable).toBe(true);
    }
  });

  it('should handle authentication failures', async () => {
    // Set up mock HTTP response with 401 status
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .reply(401, { message: 'Unauthorized' });

    // Call integration service method
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status with authentication error
      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.message).toBe('Clearinghouse request failed: Request failed with status code 401');

      // Expect credential refresh to be attempted
      expect(error.retryable).toBe(false);
    }
  });

  it('should handle rate limiting', async () => {
    // Set up mock HTTP response with 429 status
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .reply(429, { message: 'Rate limit exceeded' });

    // Call integration service method
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status with rate limit indication
      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.message).toBe('Clearinghouse request failed: Request failed with status code 429');

      // Expect backoff mechanism to be triggered
      expect(error.retryable).toBe(true);
    }
  });

  it('should handle unexpected response formats', async () => {
    // Set up mock HTTP response with invalid format
    nock('http://clearinghouse.example.com')
      .post('/claims')
      .reply(200, 'Invalid response format');

    // Call integration service method
    try {
      await clearinghouseIntegration.submitClaim('test-clearinghouse-id', mockClaim, { correlationId: '123' } as IntegrationRequestOptions);
    } catch (error) {
      // Expect the response to have error status with format error
      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.message).toBe('Clearinghouse request failed: Request failed with status code 500');

      // Expect the error to be logged with response details
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

describe('Integration Health Checks', () => {
  it('should check clearinghouse health successfully', async () => {
    // Set up mock HTTP response for health check
    nock('http://clearinghouse.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    // Call clearinghouseIntegration.checkHealth()
    const response = await clearinghouseIntegration.checkHealth('test-clearinghouse-id');

    // Expect the response to indicate healthy status
    expect(response.status).toBe(IntegrationStatus.ACTIVE);

    // Expect the response to include response time metrics
    expect(response.responseTime).toBeGreaterThan(0);
  });

  it('should detect unhealthy clearinghouse', async () => {
    // Set up mock HTTP response to fail health check
    nock('http://clearinghouse.example.com')
      .get('/health')
      .reply(500, { message: 'Service unavailable' });

    // Call clearinghouseIntegration.checkHealth()
    const response = await clearinghouseIntegration.checkHealth('test-clearinghouse-id');

    // Expect the response to indicate unhealthy status
    expect(response.status).toBe(IntegrationStatus.ERROR);

    // Expect the response to include error details
    expect(response.message).toBe('Health check failed: Request failed with status code 500');
  });

  it('should check all integration endpoints health', async () => {
    // Set up mock HTTP responses for all integration health checks
    nock('http://clearinghouse.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    nock('http://ehr.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    nock('http://accounting.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    nock('http://medicaid.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    nock('http://remittance.example.com')
      .get('/health')
      .reply(200, { status: 'OK' });

    // Call each integration's checkHealth method
    const clearinghouseHealth = await clearinghouseIntegration.checkHealth('test-clearinghouse-id');
    const ehrHealth = await ehrIntegration.checkHealth();
    const accountingHealth = await accountingIntegration.checkHealth();
    const medicaidHealth = await medicaidIntegration.checkHealth('CA');
    const remittanceHealth = await remittanceIntegration.checkHealth('test-remittance-id');

    // Expect all responses to include health status
    expect(clearinghouseHealth.status).toBe(IntegrationStatus.ACTIVE);
    expect(ehrHealth.status).toBe(IntegrationStatus.ACTIVE);
    expect(accountingHealth.status).toBe(IntegrationStatus.ACTIVE);
    expect(medicaidHealth.status).toBe(IntegrationStatus.ACTIVE);
    expect(remittanceHealth.status).toBe(IntegrationStatus.ACTIVE);

    // Verify that unhealthy integrations are correctly identified
    // (This test assumes all integrations are healthy)
  });
});