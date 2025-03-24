import { batchManager, createBatchJob } from './batch-manager';
import { logger } from '../utils/logger';
import { ClientService } from '../services/clients.service';
import { medicaidIntegration } from '../integrations/medicaid.integration';
import { Client, ClientStatus, ClientInsurance } from '../types/clients.types';
import { IntegrationResponse, IntegrationRequestOptions } from '../types/integration.types';
import { UUID } from '../types/common.types';
import { IntegrationError } from '../errors/integration-error';
import { metrics } from '../utils/metrics';

// Define the job type for eligibility verification
export const ELIGIBILITY_VERIFICATION_JOB_TYPE = 'eligibility-verification';

// Define the batch size for processing clients
const BATCH_SIZE = 100;

// Create a new instance of the ClientService
const clientService = new ClientService();

/**
 * Registers the eligibility verification job handler with the batch manager
 */
export const registerEligibilityVerificationJob = (): void => {
  // Register the eligibilityVerificationHandler function with the batch manager for the ELIGIBILITY_VERIFICATION_JOB_TYPE
  batchManager.registerHandler(ELIGIBILITY_VERIFICATION_JOB_TYPE, eligibilityVerificationHandler);
  // Log successful registration of the eligibility verification handler
  logger.info('Eligibility verification handler registered');
};

/**
 * Handles the eligibility verification batch job execution
 * @param jobData - Data for the batch job, including state code and client IDs
 * @param context - Context for the batch job execution
 * @returns Results of the eligibility verification process
 */
const eligibilityVerificationHandler = async (
  jobData: { stateCode: string; clientIds?: UUID[]; options?: IntegrationRequestOptions },
  context: any
): Promise<{ success: boolean; processed: number; verified: number; failed: number; results: Array<{ clientId: UUID; success: boolean; message: string }> }> => {
  // Log start of eligibility verification batch job
  logger.info('Starting eligibility verification batch job', { jobData, context });

  // Extract parameters from jobData (stateCode, clientIds, options)
  const { stateCode, clientIds, options } = jobData;

  // Initialize result tracking variables (processed, verified, failed, results array)
  let processed = 0;
  let verified = 0;
  let failed = 0;
  const results: Array<{ clientId: UUID; success: boolean; message: string }> = [];

  let clients: Client[];

  // If specific clientIds are provided, retrieve those clients
  if (clientIds && clientIds.length > 0) {
    logger.info(`Processing specific clients for eligibility verification in state ${stateCode}`, { clientIds });
    clients = await Promise.all(clientIds.map(async (clientId) => {
      try {
        return await clientService.getClientById(clientId, false, { traceId: context.traceId });
      } catch (error) {
        logger.error(`Error retrieving client ${clientId}`, { error, traceId: context.traceId });
        return null;
      }
    })).then(results => results.filter(client => client !== null));
  } else {
    // Otherwise, query for active clients with Medicaid insurance
    logger.info(`Processing all active clients with Medicaid for eligibility verification in state ${stateCode}`);
    clients = await clientService.getClients({
      pagination: { page: 1, limit: 1000 }, // Adjust limit as needed
      filter: { conditions: [{ field: 'status', operator: 'eq', value: ClientStatus.ACTIVE }] },
      sort: { sortBy: 'lastName', sortDirection: 'asc' },
      search: '',
    }, { traceId: context.traceId }).then(result => result.data);
  }

  // Process clients in batches of BATCH_SIZE
  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch = clients.slice(i, i + BATCH_SIZE);

    // For each client in the batch:
    await Promise.all(batch.map(async (client) => {
      processed++;
      try {
        // Extract Medicaid ID and other required information
        const medicaidId = client.medicaidId;
        if (!medicaidId) {
          logger.warn(`Skipping client ${client.id} due to missing Medicaid ID`, { clientId: client.id, traceId: context.traceId });
          results.push({ clientId: client.id, success: false, message: 'Missing Medicaid ID' });
          failed++;
          return;
        }

        // Prepare provider data for verification request
        const providerData = {
          providerNumber: 'YOUR_PROVIDER_NUMBER', // Replace with actual provider number
          providerTaxId: 'YOUR_PROVIDER_TAX_ID', // Replace with actual provider tax ID
        };

        // Call medicaidIntegration.verifyEligibility with client and provider data
        const response: IntegrationResponse = await medicaidIntegration.verifyEligibility(stateCode, { ...client, medicaidId }, providerData, options);

        // Process verification response
        if (response.success) {
          // If successful, update client insurance with eligibility information
          const eligibilityResult = await processEligibilityResponse(response, client);
          if (eligibilityResult.success) {
            const updateSuccess = await updateClientEligibility(client, eligibilityResult.eligibilityData);
            if (updateSuccess) {
              verified++;
              results.push({ clientId: client.id, success: true, message: 'Eligibility verified and updated' });
            } else {
              failed++;
              results.push({ clientId: client.id, success: false, message: 'Eligibility verified but failed to update client' });
            }
          } else {
            failed++;
            results.push({ clientId: client.id, success: false, message: eligibilityResult.message });
          }
        } else {
          // Track result in results array
          failed++;
          results.push({ clientId: client.id, success: false, message: response.error?.message || 'Eligibility verification failed' });
        }
      } catch (e: any) {
        // Track result in results array
        failed++;
        results.push({ clientId: client.id, success: false, message: e.message || 'Eligibility verification failed' });
        logger.error(`Error processing client ${client.id}`, { error: e, clientId: client.id, traceId: context.traceId });
      }
    }));
  }

  // Log completion of eligibility verification batch
  logger.info('Completed eligibility verification batch', { processed, verified, failed, results, traceId: context.traceId });

  // Track business metrics for verification process
  metrics.trackBusinessMetric('eligibility', 'processed', processed);
  metrics.trackBusinessMetric('eligibility', 'verified', verified);
  metrics.trackBusinessMetric('eligibility', 'failed', failed);

  // Return comprehensive results object with counts and detailed results
  return { success: true, processed, verified, failed, results };
};

/**
 * Processes the eligibility verification response from the Medicaid portal
 * @param response - Integration response from Medicaid portal
 * @param client - Client object
 * @returns Processed eligibility result
 */
const processEligibilityResponse = async (response: IntegrationResponse, client: Client): Promise<{ success: boolean; eligibilityData: any; message: string }> => {
  try {
    // Check if the integration response was successful
    if (response.success) {
      // Extract eligibility data from response
      const eligibilityData = response.data;

      // Validate eligibility data structure
      if (!eligibilityData) {
        return { success: false, eligibilityData: null, message: 'Invalid eligibility data structure' };
      }

      // Extract coverage dates, benefit information, and eligibility status
      const coverageStartDate = eligibilityData.coverageStartDate;
      const coverageEndDate = eligibilityData.coverageEndDate;
      const eligibilityStatus = eligibilityData.eligibilityStatus;

      // Return success result with eligibility data and status message
      return { success: true, eligibilityData, message: `Eligibility verified: ${eligibilityStatus}` };
    } else {
      // Log error details
      logger.error('Eligibility verification failed', { clientId: client.id, error: response.error });

      // Return failure result with appropriate error message
      return { success: false, eligibilityData: null, message: response.error?.message || 'Eligibility verification failed' };
    }
  } catch (error: any) {
    // Log error details
    logger.error('Error processing eligibility response', { clientId: client.id, error });

    // Return failure result with appropriate error message
    return { success: false, eligibilityData: null, message: error.message || 'Error processing eligibility response' };
  }
};

/**
 * Updates the client's insurance record with eligibility information
 * @param client - Client object
 * @param eligibilityData - Eligibility data from Medicaid portal
 * @returns True if update was successful
 */
const updateClientEligibility = async (client: Client, eligibilityData: any): Promise<boolean> => {
  try {
    // Find the client's Medicaid insurance record
    const medicaidInsurance = client.insurances?.find(insurance => insurance.type === 'medicaid');

    // If no Medicaid insurance found, log warning and return false
    if (!medicaidInsurance) {
      logger.warn(`No Medicaid insurance found for client ${client.id}`, { clientId: client.id });
      return false;
    }

    // Prepare insurance update data with eligibility information
    const insuranceUpdateData: Partial<ClientInsurance> = {
      // Set eligibility verification date to current date
      // eligibilityVerificationDate: new Date().toISOString(), // Assuming this field exists
      // Set eligibility status based on verification result
      status: eligibilityData.eligibilityStatus === 'ACTIVE' ? 'active' : 'inactive',
      // Set coverage start and end dates from eligibility data
      effectiveDate: eligibilityData.coverageStartDate,
      terminationDate: eligibilityData.coverageEndDate,
      // Update additional insurance metadata as needed
      // Add more fields as required by your data model
    };

    // Call clientService.updateClientInsurance with update data
    await clientService.updateClientInsurance(client.id, medicaidInsurance.id, insuranceUpdateData, {});

    // Log successful insurance update
    logger.info(`Updated insurance information for client ${client.id}`, { clientId: client.id, insuranceId: medicaidInsurance.id });

    // Return true if update was successful
    return true;
  } catch (error: any) {
    // Log error details
    logger.error('Error updating client insurance', { clientId: client.id, error });

    // Return false if update failed
    return false;
  }
};

/**
 * Creates and queues an eligibility verification job for a specific state
 * @param stateCode - State code for Medicaid portal
 * @param clientIds - Optional array of client IDs to verify; if not provided, all active clients with Medicaid will be processed
 * @param options - Optional integration request options
 * @returns The ID of the created job
 */
const scheduleEligibilityVerification = async (stateCode: string, clientIds?: UUID[], options?: IntegrationRequestOptions): Promise<{ jobId: string }> => {
  // Prepare job data with stateCode, clientIds (if provided), and options
  const jobData = {
    stateCode,
    clientIds,
    options
  };

  // Create a new batch job of type ELIGIBILITY_VERIFICATION_JOB_TYPE
  const job = await createBatchJob(ELIGIBILITY_VERIFICATION_JOB_TYPE, jobData);

  // Queue the job for processing
  await batchManager.queueJob(job.id, jobData);

  // Log job creation and queuing
  logger.info(`Created and queued eligibility verification job ${job.id} for state ${stateCode}`, { jobId: job.id, stateCode, clientIds });

  // Return the job ID for tracking
  return { jobId: job.id };
};

// Register the eligibility verification job on module load
registerEligibilityVerificationJob();

// Export the scheduleEligibilityVerification function for external use
export { scheduleEligibilityVerification };