/**
 * @fileoverview Scheduled job that automatically processes unreconciled payments, attempts to match them with claims, and performs reconciliation. This job helps improve cash flow management by ensuring timely payment reconciliation and reducing manual effort.
 */

import { logger } from '../utils/logger'; // Logging job execution details and errors
import { metrics } from '../utils/metrics'; // Tracking metrics about payment reconciliation job performance
import { paymentsService } from '../services/payments.service'; // Accessing payment services for reconciliation operations
import { paymentReconciliationService } from '../services/payments/payment-reconciliation.service'; // Accessing payment reconciliation functionality
import { NotificationService } from '../services/notification.service'; // Sending notifications about reconciliation results
import { config } from '../config'; // Accessing configuration settings for payment reconciliation
import { createErrorFromUnknown } from '../utils/error'; // Converting unknown errors to structured error objects
import { UserRole } from '../types/users.types'; // Identifying user roles for notification targeting
import { NotificationType } from '../types/notification.types'; // Specifying notification type for reconciliation alerts
import { NotificationSeverity } from '../types/notification.types'; // Specifying notification severity for reconciliation alerts

/**
 * @description Represents the payment reconciliation job for scheduling and manual execution
 */
export const paymentReconciliationJob = {
  /**
   * @description Executes the payment reconciliation job to process unreconciled payments
   * @param {object} options - Job execution options (currently unused)
   * @returns {Promise<{ success: boolean, processed: number, reconciled: number, failed: number, errors: any[] }>} Result of the job execution including success status, counts, and any errors
   */
  execute: async (options: object = {}): Promise<{ success: boolean; processed: number; reconciled: number; failed: number; errors: any[] }> => {
    const startTime = new Date(); // Log job start with timestamp
    logger.info('Payment reconciliation job started', { startTime });

    let processed = 0; // Initialize result tracking variables (processed, reconciled, failed, errors)
    let reconciled = 0;
    let failed = 0;
    const errors: any[] = [];

    try {
      const reconciliationConfig = config.payments; // Get configuration for reconciliation settings from config.payments
      const minAge = reconciliationConfig?.minAgeForAutoReconciliation || 30; // Default to 30 days if not configured
      const matchThreshold = reconciliationConfig?.autoReconciliationMatchThreshold || 0.8; // Default to 0.8 if not configured

      logger.debug('Payment reconciliation job configuration', { minAge, matchThreshold });

      const unreconciledPayments = await paymentsService.getUnreconciledPayments({}, {}); // Get unreconciled payments using paymentsService.getUnreconciledPayments
      logger.info(`Found ${unreconciledPayments.length} unreconciled payments to process`);

      processed = unreconciledPayments.length;

      for (const payment of unreconciledPayments) { // For each unreconciled payment, attempt auto-reconciliation
        try {
          const reconciliationResult = await paymentReconciliationService.autoReconcilePayment(payment.paymentId, matchThreshold); // Call paymentReconciliationService.autoReconcilePayment with the payment ID and match threshold
          reconciled++; // Track successful and failed reconciliations
          logger.info(`Payment ${payment.paymentId} auto-reconciled successfully`, { reconciliationResult });
        } catch (error: any) {
          failed++;
          errors.push({ paymentId: payment.paymentId, error: error.message });
          logger.error(`Payment ${payment.paymentId} auto-reconciliation failed`, { error: error.message });
        }
      }

      // Send notifications to financial staff about reconciliation results
      await sendReconciliationNotifications({ processed, reconciled, failed, errors });

      // Track metrics about job execution (payments processed, reconciled, failed)
      metrics.trackBusinessMetric('payments', 'reconciliation_job_processed', processed);
      metrics.trackBusinessMetric('payments', 'reconciliation_job_reconciled', reconciled);
      metrics.trackBusinessMetric('payments', 'reconciliation_job_failed', failed);

      const endTime = new Date(); // Log job completion with summary statistics
      const duration = endTime.getTime() - startTime.getTime();
      logger.info('Payment reconciliation job completed', { startTime, endTime, duration, processed, reconciled, failed, errors });

      // Return execution results with success status, counts, and any errors
      return { success: true, processed, reconciled, failed, errors };
    } catch (unknownError: any) {
      const error = createErrorFromUnknown(unknownError);
      logger.error('Payment reconciliation job failed', { error });
      return { success: false, processed: 0, reconciled: 0, failed: 0, errors: [error] };
    }
  }
};

/**
 * @description Processes unreconciled payments and attempts automatic reconciliation
 * @param {number} minAge - Minimum age of unreconciled payments to process (in days)
 * @param {number} matchThreshold - Minimum match threshold for automatic reconciliation
 * @returns {Promise<{ processed: number, reconciled: number, failed: number, errors: any[] }>} Results of the reconciliation process
 */
async function processUnreconciledPayments(minAge: number, matchThreshold: number): Promise<{ processed: number; reconciled: number; failed: number; errors: any[] }> {
  logger.info(`Processing unreconciled payments older than ${minAge} days with match threshold ${matchThreshold}`);

  let processed = 0;
  let reconciled = 0;
  let failed = 0;
  const errors: any[] = [];

  // Get unreconciled payments older than minAge days
  const unreconciledPayments = await paymentsService.getUnreconciledPayments({}, {}); // TODO: Add age filter

  logger.info(`Found ${unreconciledPayments.length} unreconciled payments`); // Log the number of unreconciled payments found

  for (const payment of unreconciledPayments) { // For each payment, attempt auto-reconciliation with the specified match threshold
    try {
      const { success, result, error } = await attemptAutoReconciliation(payment, matchThreshold); // Call attemptAutoReconciliation with the payment and matchThreshold

      if (success) {
        reconciled++; // Track successful reconciliations and failures
        logger.info(`Payment ${payment.paymentId} reconciled successfully`, { paymentId: payment.paymentId, result }); // Log detailed results for each payment
      } else {
        failed++;
        errors.push({ paymentId: payment.paymentId, error: error.message });
        logger.error(`Payment ${payment.paymentId} reconciliation failed`, { paymentId: payment.paymentId, error }); // Log detailed results for each payment
      }
    } catch (error: any) {
      failed++;
      errors.push({ paymentId: payment.paymentId, error: error.message });
      logger.error(`Error processing payment ${payment.paymentId}`, { paymentId: payment.paymentId, error }); // Log detailed results for each payment
    }
    processed++;
  }

  // Return counts of processed, reconciled, and failed payments along with any errors
  return { processed, reconciled, failed, errors };
}

/**
 * @description Attempts to automatically reconcile a single payment
 * @param {object} payment - Payment object to reconcile
 * @param {number} matchThreshold - Minimum match threshold for automatic reconciliation
 * @returns {Promise<{ success: boolean, result: any, error?: any }>} Result of the reconciliation attempt
 */
async function attemptAutoReconciliation(payment: any, matchThreshold: number): Promise<{ success: boolean; result: any; error?: any }> {
  logger.info(`Attempting auto-reconciliation for payment ${payment.paymentId}`, { paymentId: payment.paymentId, matchThreshold }); // Log attempt to reconcile specific payment
  try {
    const result = await paymentReconciliationService.autoReconcilePayment(payment.paymentId, matchThreshold); // Call paymentReconciliationService.autoReconcilePayment with the payment ID and match threshold
    logger.info(`Payment ${payment.paymentId} auto-reconciled successfully`, { paymentId: payment.paymentId, result }); // If successful, log the reconciliation details and return success result
    return { success: true, result };
  } catch (error: any) {
    logger.error(`Payment ${payment.paymentId} auto-reconciliation failed`, { paymentId: payment.paymentId, error: error.message }); // If failed, catch the error, log failure details, and return error information
    return { success: false, result: null, error };
  }
}

/**
 * @description Sends notifications about the reconciliation job results
 * @param {object} results - Results of the reconciliation job
 * @returns {Promise<void>} Resolves when notifications are sent
 */
async function sendReconciliationNotifications(results: { processed: number; reconciled: number; failed: number; errors: any[] }): Promise<void> {
  let severity: NotificationSeverity = NotificationSeverity.MEDIUM; // Determine notification severity based on results (high if many failures, medium otherwise)
  if (results.failed > results.processed * 0.1) {
    severity = NotificationSeverity.HIGH;
  }

  const content: any = { // Create notification content with summary of reconciliation results
    title: 'Payment Reconciliation Job Results',
    message: `Reconciliation job processed ${results.processed} payments, reconciled ${results.reconciled}, and failed ${results.failed}.`,
    data: results
  };

  logger.info('Sending reconciliation notifications', { content, severity });

  try {
    await NotificationService.sendAlert({ // Send alert to financial staff using NotificationService.sendAlert
      userId: null, // System notification
      type: NotificationType.PAYMENT_RECEIVED,
      severity: severity,
      content: content,
      targetRoles: [UserRole.FINANCIAL_MANAGER]
    });
  } catch (error: any) {
    logger.error('Error sending reconciliation notifications', { error: error.message }); // Log notification sending
  }
}