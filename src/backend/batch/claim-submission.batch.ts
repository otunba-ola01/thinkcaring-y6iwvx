import { batchManager, registerJobHandler } from './batch-manager'; // Import batch processing framework
import { ClaimSubmissionService } from '../services/claims/claim-submission.service'; // Import service for submitting claims
import { ClaimTrackingService } from '../services/claims/claim-tracking.service'; // Import service for tracking claim status updates
import { UUID, ISO8601Date } from '../types/common.types'; // Import common type definitions
import { BatchSubmitClaimsDto, SubmissionMethod, ClaimStatus } from '../types/claims.types'; // Import claim-related types
import logger from '../utils/logger'; // Import logger for logging
import { claimRepository } from '../database/repositories/claim.repository'; // Import repository for finding claims
import { NotificationService } from '../services/notification.service'; // Import service for sending notifications

/**
 * Handles the execution of a claim submission batch job
 * @param jobData - Data for the job, including claim IDs and submission method
 * @param context - Context for the job execution
 * @returns Result of the batch claim submission process
 */
const handleClaimSubmissionJob = async (jobData: any, context: any): Promise<object> => {
  logger.info('Starting claim submission batch job', { jobId: context.jobId, jobData }); // Log the start of the claim submission batch job

  const { claimIds, submissionMethod, options } = jobData; // Extract parameters from jobData (claimIds, submissionMethod, options)

  let claimsToSubmit: UUID[]; // Define claimsToSubmit array

  if (claimIds && Array.isArray(claimIds) && claimIds.length > 0) { // If claimIds are provided, use them directly
    claimsToSubmit = claimIds;
    logger.debug(`Using provided claim IDs for submission`, { claimCount: claimIds.length }); // Log that provided claim IDs are being used
  } else { // If claimIds are not provided, query for claims ready for submission using claimRepository.findClaimsReadyForSubmission
    logger.debug('No claim IDs provided, querying for claims ready for submission'); // Log that claim IDs are being queried
    const claims = await claimRepository.findClaimsReadyForSubmission(); // Await the result of the asynchronous function
    if (!claims || claims.length === 0) { // If no claims are found, log message and return early with zero counts
      logger.info('No claims found ready for submission, exiting job'); // Log that no claims were found
      return { totalProcessed: 0, successCount: 0, errorCount: 0, errors: [], processedClaims: [] }; // Return early with zero counts
    }
    claimsToSubmit = claims.map(claim => claim.id); // Map the claims to an array of claim IDs
    logger.debug(`Found ${claimsToSubmit.length} claims ready for submission`); // Log the number of claims found
  }

  const batchSubmitClaimsDto: BatchSubmitClaimsDto = { // Prepare BatchSubmitClaimsDto with claims, submission method, and current date
    claimIds: claimsToSubmit,
    submissionMethod: submissionMethod || SubmissionMethod.ELECTRONIC, // Default to electronic submission if not specified
    submissionDate: new Date().toISOString() as ISO8601Date, // Use current date for submission
    notes: options?.notes || 'Submitted via batch job' // Include any notes provided in options
  };

  logger.debug('Submitting claims', { claimCount: batchSubmitClaimsDto.claimIds.length, submissionMethod: batchSubmitClaimsDto.submissionMethod }); // Log the submission of claims

  try {
    const submissionResults = await ClaimSubmissionService.batchSubmitClaims(batchSubmitClaimsDto, options?.userId); // Call ClaimSubmissionService.batchSubmitClaims to submit the claims

    logger.info('Claim submission batch job completed', { // Log the results of the submission process
      totalProcessed: submissionResults.totalProcessed,
      successCount: submissionResults.successCount,
      errorCount: submissionResults.errorCount
    });

    if (submissionResults.errorCount > 0) { // If there are errors, send notification to administrators with error details
      const errorDetails = submissionResults.errors.map(error => `Claim ID: ${error.claimId}, Message: ${error.message}`).join('; '); // Format error details
      await NotificationService.sendSystemNotification( // Send notification to administrators
        'claim-submission-errors',
        'error',
        `Claim submission batch job completed with errors: ${errorDetails}`,
        { errorCount: submissionResults.errorCount, errorDetails }
      );
    } else { // If successful submissions, send notification summarizing the submission
      await NotificationService.sendSystemNotification( // Send notification summarizing the submission
        'claim-submission-success',
        'info',
        `Claim submission batch job completed successfully. ${submissionResults.successCount} claims submitted.`,
        { successCount: submissionResults.successCount }
      );
    }

    if (submissionResults.successCount > 0) { // For submitted claims, schedule a status refresh job to check status after configured delay
      await scheduleStatusRefreshJob(submissionResults.processedClaims, 30); // Schedule status refresh job with a 30-minute delay
    }

    return submissionResults; // Return detailed results of the batch submission process
  } catch (error: any) {
    logger.error('Claim submission batch job failed', { error: error.message }); // Log any errors that occur during the job
    await NotificationService.sendSystemNotification( // Send notification to administrators about the job failure
      'claim-submission-failure',
      'critical',
      `Claim submission batch job failed: ${error.message}`,
      { error: error.message }
    );
    throw error; // Re-throw the error to be handled by the batch manager
  }
};

/**
 * Schedules a job to refresh the status of submitted claims after a delay
 * @param claimIds - Array of claim IDs to refresh
 * @param delayMinutes - Number of minutes to delay the job execution
 */
const scheduleStatusRefreshJob = async (claimIds: UUID[], delayMinutes: number): Promise<void> => {
  logger.info('Scheduling status refresh job', { claimCount: claimIds.length, delayMinutes }); // Log scheduling of status refresh job

  const jobData = { claimIds }; // Prepare job data with claim IDs

  const runAt = new Date(Date.now() + delayMinutes * 60 * 1000); // Calculate the execution time based on the delay

  const newJob = await batchManager.createJob( // Create a new batch job for claim status refresh
    'claim-status-refresh',
    jobData,
    { runAt } // Set the job to run after the specified delay
  );

  logger.debug('Queued status refresh job', { jobId: newJob.id, runAt }); // Log successful scheduling of the refresh job
};

/**
 * Handles the execution of a claim status refresh batch job
 * @param jobData - Data for the job, including claim IDs
 * @param context - Context for the job execution
 * @returns Result of the batch claim status refresh process
 */
const handleClaimStatusRefreshJob = async (jobData: any, context: any): Promise<object> => {
  logger.info('Starting claim status refresh batch job', { jobId: context.jobId, jobData }); // Log the start of the claim status refresh batch job

  const { claimIds } = jobData; // Extract claimIds from jobData

  try {
    const refreshResults = await ClaimTrackingService.batchRefreshClaimStatuses(claimIds, null); // Call ClaimTrackingService.batchRefreshClaimStatuses to refresh status of claims

    logger.info('Claim status refresh batch job completed', { // Log the results of the status refresh process
      totalProcessed: refreshResults.totalProcessed,
      updatedCount: refreshResults.updatedCount,
      errorCount: refreshResults.errorCount
    });

    if (refreshResults.updatedCount > 0) { // If there are status changes, send notification with summary of changes
      await NotificationService.sendSystemNotification( // Send notification summarizing the status changes
        'claim-status-updates',
        'info',
        `Claim status refresh batch job completed. ${refreshResults.updatedCount} claims updated.`,
        { updatedCount: refreshResults.updatedCount }
      );
    }

    if (refreshResults.errorCount > 0) { // If there are errors, send notification to administrators with error details
      const errorDetails = refreshResults.errors.map(error => `Claim ID: ${error.claimId}, Message: ${error.message}`).join('; '); // Format error details
      await NotificationService.sendSystemNotification( // Send notification to administrators with error details
        'claim-status-refresh-errors',
        'warning',
        `Claim status refresh batch job completed with errors: ${errorDetails}`,
        { errorCount: refreshResults.errorCount, errorDetails }
      );
    }

    const claimsStillPending = claimIds.filter(claimId => !refreshResults.errors.some(error => error.claimId === claimId)); // Filter out claims that had errors
    if (claimsStillPending.length > 0) { // For claims still in processing status, schedule another refresh job with increased delay
      await scheduleStatusRefreshJob(claimsStillPending, 60); // Schedule another refresh job with a 60-minute delay
    }

    return refreshResults; // Return detailed results of the batch status refresh process
  } catch (error: any) {
    logger.error('Claim status refresh batch job failed', { error: error.message }); // Log any errors that occur during the job
    await NotificationService.sendSystemNotification( // Send notification to administrators about the job failure
      'claim-status-refresh-failure',
      'critical',
      `Claim status refresh batch job failed: ${error.message}`,
      { error: error.message }
    );
    throw error; // Re-throw the error to be handled by the batch manager
  }
};

/**
 * Registers the claim submission and status refresh job handlers with the batch manager
 */
const registerClaimBatchJobs = (): void => {
  registerJobHandler('claim-submission', handleClaimSubmissionJob); // Register handleClaimSubmissionJob for the 'claim-submission' job type
  registerJobHandler('claim-status-refresh', handleClaimStatusRefreshJob); // Register handleClaimStatusRefreshJob for the 'claim-status-refresh' job type
  logger.info('Claim batch job handlers registered successfully'); // Log successful registration of claim batch job handlers
};

// Export the registration function and job handlers
export { registerClaimBatchJobs, handleClaimSubmissionJob, handleClaimStatusRefreshJob };