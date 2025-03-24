import { logger } from '../utils/logger'; // winston 3.8.2
import { metrics } from '../utils/metrics'; // prom-client 14.2.0
import config from '../config';
import AuthorizationModel from '../models/authorization.model';
import { NotificationManager } from '../notifications/notification-manager';
import { getAuthorizationExpiryTemplate } from '../notifications/notification-templates/authorization-expiry.template';
import {
  NotificationType,
  NotificationSeverity,
  DeliveryMethod
} from '../types/notification.types';
import { JobDefinition, JobExecutionResult } from '../types/common.types';
import { AuthorizationStatus } from '../types/common.types';

/**
 * Checks for authorizations that are approaching expiration and sends notifications
 * @param params - Parameters for the job (currently unused)
 * @returns Result of the job execution with counts of processed authorizations
 */
async function checkExpiringAuthorizations(params: any = {}): Promise<JobExecutionResult> {
  // Log job start with parameters
  logger.info('Starting authorization expiry check job', { params });

  // Get configuration for expiration thresholds (critical, warning, approaching)
  const criticalThreshold = config.scheduler?.authorizationExpiry?.criticalThresholdDays || 7;
  const warningThreshold = config.scheduler?.authorizationExpiry?.warningThresholdDays || 15;
  const approachingThreshold = config.scheduler?.authorizationExpiry?.approachingThresholdDays || 30;

  // Initialize counters for tracking processed authorizations
  let criticalCount = 0;
  let warningCount = 0;
  let approachingCount = 0;

  // Find authorizations expiring within the critical threshold (default: 7 days)
  logger.debug(`Finding authorizations expiring within critical threshold: ${criticalThreshold} days`);
  const criticalAuthorizations = await AuthorizationModel.findExpiringAuthorizations(criticalThreshold);
  logger.info(`Found ${criticalAuthorizations.length} authorizations expiring within critical threshold`);

  // Process critical expiring authorizations and send notifications with CRITICAL severity
  for (const authorization of criticalAuthorizations) {
    if (await processExpiringAuthorization(authorization, criticalThreshold, NotificationSeverity.CRITICAL)) {
      criticalCount++;
    }
  }

  // Find authorizations expiring within the warning threshold (default: 15 days)
  logger.debug(`Finding authorizations expiring within warning threshold: ${warningThreshold} days`);
  const warningAuthorizations = await AuthorizationModel.findExpiringAuthorizations(warningThreshold);
  logger.info(`Found ${warningAuthorizations.length} authorizations expiring within warning threshold`);

  // Process warning expiring authorizations and send notifications with HIGH severity
  for (const authorization of warningAuthorizations) {
    if (await processExpiringAuthorization(authorization, warningThreshold, NotificationSeverity.HIGH)) {
      warningCount++;
    }
  }

  // Find authorizations expiring within the approaching threshold (default: 30 days)
  logger.debug(`Finding authorizations expiring within approaching threshold: ${approachingThreshold} days`);
  const approachingAuthorizations = await AuthorizationModel.findExpiringAuthorizations(approachingThreshold);
  logger.info(`Found ${approachingAuthorizations.length} authorizations expiring within approaching threshold`);

  // Process approaching expiring authorizations and send notifications with MEDIUM severity
  for (const authorization of approachingAuthorizations) {
    if (await processExpiringAuthorization(authorization, approachingThreshold, NotificationSeverity.MEDIUM)) {
      approachingCount++;
    }
  }

  // Update authorization status to EXPIRING for relevant authorizations
  const expiringAuthIds = [
    ...criticalAuthorizations.map(auth => auth.id),
    ...warningAuthorizations.map(auth => auth.id),
    ...approachingAuthorizations.map(auth => auth.id)
  ];

  if (expiringAuthIds.length > 0) {
    logger.info(`Updating authorization status to EXPIRING for ${expiringAuthIds.length} authorizations`);
    for (const authId of expiringAuthIds) {
      try {
        await AuthorizationModel.updateStatus(authId, AuthorizationStatus.EXPIRING, null);
      } catch (error) {
        logger.error(`Failed to update authorization status to EXPIRING for authorization: ${authId}`, { error });
      }
    }
  }

  // Track metrics for processed authorizations
  metrics.trackSystemMetric('authorization_expiry_check', 'processed', criticalCount + warningCount + approachingCount);
  metrics.trackSystemMetric('authorization_expiry_check', 'critical', criticalCount);
  metrics.trackSystemMetric('authorization_expiry_check', 'warning', warningCount);
  metrics.trackSystemMetric('authorization_expiry_check', 'approaching', approachingCount);

  // Log job completion with summary of processed authorizations
  logger.info('Completed authorization expiry check job', {
    criticalCount,
    warningCount,
    approachingCount
  });

  // Return job execution result with success status and counts
  return {
    success: true,
    message: 'Authorization expiry check completed',
    data: {
      criticalCount,
      warningCount,
      approachingCount
    }
  };
}

/**
 * Processes a single expiring authorization by sending appropriate notifications
 * @param authorization - Authorization object
 * @param daysToExpiration - Number of days until expiration
 * @param severity - Notification severity
 * @returns True if notification was sent successfully
 */
async function processExpiringAuthorization(
  authorization: any,
  daysToExpiration: number,
  severity: NotificationSeverity
): Promise<boolean> {
  try {
    // Calculate days to expiration based on current date and authorization end date
    const calculatedDaysToExpiration = calculateDaysToExpiration(authorization.endDate);

    // Get the appropriate notification template based on days to expiration and utilization
    const template = getAuthorizationExpiryTemplate(authorization, daysToExpiration);

    // Format notification content with authorization details
    const content: NotificationContent = {
      title: template.title,
      message: template.message,
      data: {
        authorizationNumber: authorization.number,
        clientName: authorization.client?.fullName,
        programName: authorization.program?.name,
        serviceTypes: authorization.serviceTypes?.map(st => st.name).join(', '),
        expirationDate: authorization.endDate,
        daysToExpiration: calculatedDaysToExpiration,
        utilizationPercentage: authorization.utilization?.utilizationPercentage,
        usedUnits: authorization.utilization?.usedUnits,
        authorizedUnits: authorization.authorizedUnits,
        severity: severity
      }
    };

    // Determine notification recipients (case managers, program managers, billing staff)
    const recipients = await getNotificationRecipients(authorization);

    // Send notification to each recipient with appropriate delivery methods
    for (const userId of recipients) {
      await NotificationManager.sendNotification(
        userId,
        content,
        NotificationType.AUTHORIZATION_EXPIRY,
        severity,
        {
          email: 'test@example.com', // Replace with actual email retrieval logic
          phoneNumber: '+15551234567' // Replace with actual phone number retrieval logic
        }
      );
    }

    // Log notification delivery results
    logger.info(`Sent authorization expiry notification for authorization: ${authorization.id}`, {
      authorizationId: authorization.id,
      daysToExpiration,
      severity,
      recipients
    });

    // Return true if all notifications were sent successfully
    return true;
  } catch (error) {
    logger.error(`Failed to process expiring authorization: ${authorization.id}`, {
      error,
      authorizationId: authorization.id,
      daysToExpiration,
      severity
    });
    return false;
  }
}

/**
 * Calculates the number of days between current date and authorization expiration date
 * @param expirationDate - Authorization expiration date
 * @returns Number of days until expiration (negative if already expired)
 */
function calculateDaysToExpiration(expirationDate: string): number {
  // Parse the expiration date string to Date object
  const expiryDate = new Date(expirationDate);

  // Get current date (start of day)
  const today = new Date();

  // Calculate difference in milliseconds
  const diffInMs = expiryDate.getTime() - today.getTime();

  // Convert milliseconds to days
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // Return rounded number of days
  return Math.round(diffInDays);
}

/**
 * Determines which users should receive notifications about an expiring authorization
 * @param authorization - Authorization object
 * @returns Array of user IDs who should receive the notification
 */
async function getNotificationRecipients(authorization: any): Promise<string[]> {
  // Initialize empty array for recipient user IDs
  const recipientUserIds: string[] = [];

  // Add client's case manager if available
  // TODO: Implement logic to retrieve case manager for the client
  // const caseManagerId = await getCaseManagerForClient(authorization.clientId);
  // if (caseManagerId) {
  //   recipientUserIds.push(caseManagerId);
  // }

  // Add program managers for the authorization's program
  // TODO: Implement logic to retrieve program managers for the program
  // const programManagerIds = await getProgramManagersForProgram(authorization.programId);
  // recipientUserIds.push(...programManagerIds);

  // Add billing staff responsible for the client/program
  // TODO: Implement logic to retrieve billing staff
  // const billingStaffIds = await getBillingStaffForClientAndProgram(authorization.clientId, authorization.programId);
  // recipientUserIds.push(...billingStaffIds);

  // Return array of unique user IDs
  return [...new Set(recipientUserIds)];
}

// Define the job definition for the authorization expiry check
export const authorizationExpiryJob: JobDefinition = {
  name: 'Authorization Expiry Check',
  description: 'Checks for service authorizations approaching expiration and sends notifications',
  schedule: config.scheduler?.authorizationExpiry?.cronSchedule || '0 0 * * *', // Default: Daily at midnight
  execute: checkExpiringAuthorizations
};

// Export the main function for testing and manual execution
export { checkExpiringAuthorizations };