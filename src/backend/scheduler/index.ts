import { scheduler, scheduleJob, initialize } from './scheduler'; // Importing the scheduler instance for initialization and job scheduling
import { claimAgingJob } from './claim-aging.job'; // Importing the claim aging job for scheduling
import { authorizationExpiryJob } from './authorization-expiry.job'; // Importing the authorization expiry job for scheduling
import { paymentReconciliationJob } from './payment-reconciliation.job'; // Importing the payment reconciliation job for scheduling
import { reportGenerationJob } from './report-generation.job'; // Importing the report generation job for scheduling
import { databaseMaintenanceJob } from './database-maintenance.job'; // Importing the database maintenance job for scheduling
import { dataArchivalJob } from './data-archival.job'; // Importing the data archival job for scheduling
import { logger } from '../utils/logger'; // Logging scheduler initialization and configuration
import config from '../config'; // Accessing scheduler configuration settings

/**
 * Default jobs to be scheduled when the scheduler is initialized.
 * Each job includes its ID, name, description, cron expression, and job function.
 */
const DEFAULT_JOBS = [
  {
    id: 'claim-aging',
    name: 'Claim Aging Job',
    description: 'Identifies claims approaching filing deadlines and sends notifications',
    cronExpression: '0 0 * * *', // Daily at midnight
    jobFunction: claimAgingJob.execute,
    enabled: true,
  },
  {
    id: 'authorization-expiry',
    name: 'Authorization Expiry Check',
    description: 'Checks for service authorizations approaching expiration',
    cronExpression: '0 1 * * *', // Daily at 1:00 AM
    jobFunction: authorizationExpiryJob.execute,
    enabled: true,
  },
  {
    id: 'payment-reconciliation',
    name: 'Payment Reconciliation',
    description: 'Automatically reconciles unreconciled payments',
    cronExpression: '0 2 * * *', // Daily at 2:00 AM
    jobFunction: paymentReconciliationJob.execute,
    enabled: true,
  },
  {
    id: 'report-generation',
    name: 'Scheduled Report Generation',
    description: 'Generates scheduled reports',
    cronExpression: '0 5 * * *', // Daily at 5:00 AM
    jobFunction: reportGenerationJob.execute,
    enabled: true,
  },
  {
    id: 'database-maintenance',
    name: 'Database Maintenance',
    description: 'Performs routine database maintenance tasks',
    cronExpression: '0 23 * * 6', // Weekly on Saturday at 11:00 PM
    jobFunction: databaseMaintenanceJob.execute,
    enabled: true,
  },
  {
    id: 'data-archival',
    name: 'Data Archival',
    description: 'Archives and purges old data according to retention policies',
    cronExpression: '0 3 1 * *', // Monthly on the 1st at 3:00 AM
    jobFunction: dataArchivalJob.execute,
    enabled: true,
  },
];

/**
 * Initializes the scheduler with default configuration and registers all jobs
 */
async function initializeScheduler(): Promise<void> {
  logger.info('Initializing scheduler');

  // Get scheduler configuration from config.scheduler
  const schedulerConfig = config.scheduler;

  // Initialize scheduler with configuration options
  await scheduler.initialize(schedulerConfig);

  // Register default jobs from DEFAULT_JOBS array
  await registerDefaultJobs();

  logger.info('Scheduler initialized successfully');
}

/**
 * Registers all default jobs with the scheduler
 */
async function registerDefaultJobs(): Promise<void> {
  logger.info('Registering default jobs');

  // Iterate through DEFAULT_JOBS array
  for (const jobConfig of DEFAULT_JOBS) {
    // Check if it's enabled in configuration
    if (jobConfig.enabled) {
      // Schedule the job with the scheduler using its cron expression
      scheduleJob(
        jobConfig.id,
        jobConfig.cronExpression,
        {
          name: jobConfig.name,
          description: jobConfig.description,
          execute: jobConfig.jobFunction,
        }
      );

      logger.info(`Registered default job ${jobConfig.id}`, {
        jobId: jobConfig.id,
        cronExpression: jobConfig.cronExpression,
      });
    }
  }

  logger.info('All default jobs registered');
}

// Export the scheduler instance and initialization function
export { scheduler };
export { claimAgingJob };
export { authorizationExpiryJob };
export { paymentReconciliationJob };
export { reportGenerationJob };
export { databaseMaintenanceJob };
export { dataArchivalJob };
export { initializeScheduler };