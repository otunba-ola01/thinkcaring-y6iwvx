import { logger } from '../utils/logger'; // Logging job execution details and errors
import { metrics } from '../utils/metrics'; // Tracking metrics about claim aging job performance
import { ClaimAgingService } from '../services/claims/claim-aging.service'; // Accessing claim aging functionality and services
import { NotificationService } from '../services/notification.service'; // Sending notifications about aging claims
import { config } from '../config'; // Accessing configuration settings for claim aging thresholds
import { createErrorFromUnknown } from '../utils/error'; // Converting unknown errors to structured error objects
import { UserRole } from '../types/users.types'; // Identifying user roles for notification targeting
import { NotificationType } from '../types/notification.types'; // Specifying notification type for claim aging alerts
import { NotificationSeverity } from '../types/notification.types'; // Specifying notification severity for claim aging alerts

/**
 * Object containing the claim aging job for scheduling and manual execution
 */
export const claimAgingJob = {
  /**
   * Executes the claim aging job to identify aging claims and send notifications
   * @param options - Options for the job execution
   * @returns Result of the job execution including success status, counts, and any errors
   */
  async execute(options: any): Promise<{ success: boolean; processed: number; notified: number; errors: any[] }> {
    // Log job start with timestamp
    logger.info('Claim aging job started', { timestamp: new Date().toISOString() });

    // Initialize result tracking variables (processed, notified, errors)
    let processed = 0;
    let notified = 0;
    const errors: any[] = [];

    try {
      // Get configuration for filing deadline thresholds from config.claims
      const filingDeadlineThreshold = config.claims?.filingDeadline?.thresholdDays || 30;

      // Call ClaimAgingService.getClaimsApproachingFilingDeadline to identify claims approaching deadlines
      const approachingDeadlineResult = await ClaimAgingService.getClaimsApproachingFilingDeadline(filingDeadlineThreshold, {});
      processed = approachingDeadlineResult.total;

      // Process identified claims and send notifications using ClaimAgingService.sendFilingDeadlineAlerts
      const alertResult = await ClaimAgingService.sendFilingDeadlineAlerts(filingDeadlineThreshold);
      notified = alertResult.alertsSent;

      // Generate aging metrics and priority list for dashboard updates
      await ClaimAgingService.generateAgingReports();

      // Track metrics about job execution (claims processed, notifications sent)
      metrics.trackBusinessMetric('claims', 'aging_job_processed', processed);
      metrics.trackBusinessMetric('notifications', 'aging_job_alerts_sent', notified);

      // Log job completion with summary statistics
      logger.info('Claim aging job completed', {
        timestamp: new Date().toISOString(),
        processed,
        notified
      });

      // Return execution results with success status, counts, and any errors
      return {
        success: true,
        processed,
        notified,
        errors
      };
    } catch (error: any) {
      // Handle any errors that occur during job execution
      logger.error('Error executing claim aging job', { error });
      errors.push(createErrorFromUnknown(error));

      // Return execution results with failure status and error details
      return {
        success: false,
        processed,
        notified,
        errors
      };
    }
  }
};

/**
 * Processes claims approaching filing deadlines and sends notifications
 * @param daysThreshold - Number of days before the filing deadline
 * @returns Count of processed claims and notifications sent
 */
async function processClaimsApproachingDeadline(daysThreshold: number): Promise<{ processed: number; notified: number }> {
  try {
    // Call ClaimAgingService.sendFilingDeadlineAlerts with the days threshold
    const alertResult = await ClaimAgingService.sendFilingDeadlineAlerts(daysThreshold);

    // Log the results of the alert sending process
    logger.info('Filing deadline alerts sent', {
      alertsSent: alertResult.alertsSent,
      claims: alertResult.claims.length
    });

    // Track metrics about notifications sent
    metrics.trackBusinessMetric('notifications', 'filing_deadline_alerts_sent', alertResult.alertsSent);

    // Return counts of processed claims and notifications sent
    return {
      processed: alertResult.claims.length,
      notified: alertResult.alertsSent
    };
  } catch (error: any) {
    // Log any errors that occur during alert sending
    logger.error('Error sending filing deadline alerts', { error });
    throw error;
  }
}

/**
 * Generates aging reports and metrics for dashboard updates
 * @returns Aging metrics and priority list for dashboard
 */
async function generateAgingReports(): Promise<{ metrics: any; priorityList: any[] }> {
  try {
    // Calculate date range for metrics (typically last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    // Call ClaimAgingService.getAgingMetrics to get current aging metrics
    const agingMetrics = await ClaimAgingService.getAgingMetrics({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }, {});

    // Call ClaimAgingService.generateAgingPriorityList to get prioritized claims
    const priorityList = await ClaimAgingService.generateAgingPriorityList({});

    // Log the generation of aging reports
    logger.info('Aging reports generated', {
      averageAgeDays: agingMetrics.averageAgeDays,
      oldestClaimDays: agingMetrics.oldestClaimDays,
      priorityListCount: priorityList.length
    });

    // Return the metrics and priority list
    return {
      metrics: agingMetrics,
      priorityList
    };
  } catch (error: any) {
    // Log any errors that occur during report generation
    logger.error('Error generating aging reports', { error });
    throw error;
  }
}