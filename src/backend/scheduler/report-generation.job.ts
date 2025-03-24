/**
 * @fileoverview Scheduled job implementation for automated report generation in the HCBS Revenue Management System.
 * This job is responsible for processing scheduled reports that are due to run, generating the reports,
 * exporting them in the specified formats, and sending notifications to recipients.
 */

import { logger } from '../utils/logger'; // winston 3.8.2
import { metrics } from '../utils/metrics';
import { reportsService } from '../services/reports.service';
import { notificationService } from '../services/notification.service';
import { JobDefinition, JobExecutionResult } from '../types/common.types';
import { NotificationType, NotificationSeverity } from '../types/notification.types';
import { config } from '../config';

/**
 * Executes the report generation job to process all scheduled reports that are due
 * @param {object} params - Parameters for the job (currently unused)
 * @returns {Promise<JobExecutionResult>} Result of the job execution including success status and metrics
 */
const executeReportGenerationJob = async (params: object): Promise<JobExecutionResult> => {
  logger.info('Executing report generation job', { params });

  const startTime = Date.now();
  metrics.trackSystemMetric('reportGenerationJob.started', 1);

  try {
    // Call reportsService.processDueReports() to process all due reports
    const results = await reportsService.processDueReports();

    // Calculate execution time and track performance metrics
    const executionTime = Date.now() - startTime;
    metrics.trackSystemMetric('reportGenerationJob.completed', 1);
    metrics.trackSystemMetric('reportGenerationJob.executionTime', executionTime);

    // Log the results of the report generation process
    logger.info('Report generation job completed', { results, executionTime });

    // If any reports were generated successfully, send admin notification with summary
    if (results.succeeded > 0) {
      await notificationService.sendBulkNotification(
        config.scheduler.adminUserIds,
        NotificationType.REPORT_READY,
        NotificationSeverity.INFO,
        {
          title: 'Scheduled Reports Generated',
          message: `${results.succeeded} scheduled reports were successfully generated.`,
          data: results
        }
      );
    }

    // If any reports failed to generate, send error notification to administrators
    if (results.failed > 0) {
      await notificationService.sendBulkNotification(
        config.scheduler.adminUserIds,
        NotificationType.SYSTEM_ERROR,
        NotificationSeverity.ERROR,
        {
          title: 'Scheduled Reports Failed',
          message: `${results.failed} scheduled reports failed to generate.`,
          data: results
        }
      );
    }

    // Return job execution result with success status, metrics, and any errors
    return {
      success: true,
      metrics: {
        executionTime,
        processed: results.processed,
        succeeded: results.succeeded,
        failed: results.failed
      },
      errors: []
    };
  } catch (error) {
    // Log the error
    logger.error('Error executing report generation job', { error });

    // Track the failure metric
    metrics.trackSystemMetric('reportGenerationJob.failed', 1);

    // Return job execution result with failure status and error
    return {
      success: false,
      metrics: {
        executionTime: Date.now() - startTime,
        processed: 0,
        succeeded: 0,
        failed: 0
      },
      errors: [error]
    };
  }
};

/**
 * Job definition for the scheduled report generation process
 */
export const reportGenerationJob: JobDefinition = {
  name: 'reportGenerationJob',
  description: 'Generates scheduled reports',
  handler: executeReportGenerationJob
};