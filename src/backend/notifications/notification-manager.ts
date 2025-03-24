/**
 * @fileoverview Central notification management service that orchestrates the delivery of notifications across multiple channels (in-app, email, SMS) in the HCBS Revenue Management System. This service handles notification routing, delivery preferences, and ensures notifications are sent through appropriate channels based on user preferences and notification severity.
 */

import {
  NotificationContent,
  NotificationDeliveryResult,
  DeliveryMethod,
  NotificationType,
  NotificationSeverity,
  NotificationPreferences,
  NotificationDigestItem
} from '../types/notification.types';
import { NotificationModel } from '../models/notification.model';
import { EmailService } from './email-notification';
import { SmsService } from './sms-notification';
import { InAppNotificationService } from './in-app-notification';
import { logger } from '../utils/logger';
import { config } from '../config';
import { UUID } from '../types/common.types';

/**
 * Sends a notification to a single user through appropriate channels based on preferences
 * @param userId - ID of the user to send the notification to
 * @param content - Content of the notification (title, message, data)
 * @param type - Type of the notification (e.g., claim_status, payment_received)
 * @param severity - Severity of the notification (low, medium, high, critical)
 * @param options - Additional options for notification delivery
 * @returns Results of notification delivery attempts by channel
 */
async function sendNotification(
  userId: UUID,
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  options: Record<string, any> = {}
): Promise<{ [key in DeliveryMethod]?: NotificationDeliveryResult }> {
  logger.debug('Sending notification', { userId, type, severity, content, options });

  // Check if user exists
  const userExists = await NotificationModel.checkUserExists(userId);
  if (!userExists) {
    logger.error('User not found', { userId });
    return {}; // Return empty result if user doesn't exist
  }

  // Get user notification preferences or default preferences if none exist
  let preferences: NotificationPreferences | null = await NotificationModel.getUserPreferences(userId);
  if (!preferences) {
    logger.debug('No notification preferences found for user, using default preferences', { userId });
    preferences = NotificationModel.getDefaultPreferences(userId);
  }

  // Determine which delivery methods to use based on preferences, notification type, and severity
  let deliveryMethods: DeliveryMethod[] = [];
  if (severity === NotificationSeverity.CRITICAL || severity === NotificationSeverity.HIGH) {
    // For critical notifications, send through all available channels regardless of preferences
    deliveryMethods = Object.values(DeliveryMethod);
  } else {
    deliveryMethods = getDeliveryMethodsForUser(preferences, type, severity);
  }

  // Check if user is in quiet hours and if notification severity should bypass quiet hours
  if (isInQuietHours(preferences, severity)) {
    logger.info('User is in quiet hours, skipping notification delivery', { userId, type, severity });
    return {};
  }

  // Initialize results object to track delivery results by channel
  const results: { [key in DeliveryMethod]?: NotificationDeliveryResult } = {};

  // If in-app delivery is enabled, send in-app notification and store result
  if (deliveryMethods.includes(DeliveryMethod.IN_APP)) {
    const inAppResult = await InAppNotificationService.createInAppNotification(userId, content, type, severity, options);
    results[DeliveryMethod.IN_APP] = inAppResult;
  }

  // If email delivery is enabled and user has email, send email notification and store result
  if (deliveryMethods.includes(DeliveryMethod.EMAIL) && options.email) {
    const emailResult = await EmailService.sendEmail(userId, options.email, content, options);
    results[DeliveryMethod.EMAIL] = emailResult;
  }

  // If SMS delivery is enabled and user has phone number, send SMS notification and store result
  if (deliveryMethods.includes(DeliveryMethod.SMS) && options.phoneNumber) {
    const smsResult = await SmsService.sendSms(userId, options.phoneNumber, content, options);
    results[DeliveryMethod.SMS] = smsResult;
  }

  return results;
}

/**
 * Sends the same notification to multiple users through appropriate channels
 * @param recipients - Array of recipients with userId, email, and phoneNumber
 * @param content - Content of the notification (title, message, data)
 * @param type - Type of the notification (e.g., claim_status, payment_received)
 * @param severity - Severity of the notification (low, medium, high, critical)
 * @param options - Additional options for notification delivery
 * @returns Summary of bulk notification results
 */
async function sendBulkNotification(
  recipients: Array<{ userId: UUID, email?: string, phoneNumber?: string }>,
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  options: Record<string, any> = {}
): Promise<{ successful: number; failed: number; results: Array<{ userId: UUID; deliveryResults: { [key in DeliveryMethod]?: NotificationDeliveryResult } }> }> {
  logger.debug('Sending bulk notification', { recipientCount: recipients.length, type, severity, content, options });

  let successful = 0;
  let failed = 0;
  const results: Array<{ userId: UUID; deliveryResults: { [key in DeliveryMethod]?: NotificationDeliveryResult } }> = [];

  // Group recipients by delivery method preferences to optimize sending
  const inAppRecipients: UUID[] = [];
  const emailRecipients: Array<{ userId: UUID; email: string }> = [];
  const smsRecipients: Array<{ userId: UUID; phoneNumber: string }> = [];

  for (const recipient of recipients) {
    // Get user notification preferences or default preferences if none exist
    let preferences: NotificationPreferences | null = await NotificationModel.getUserPreferences(recipient.userId);
    if (!preferences) {
      logger.debug('No notification preferences found for user, using default preferences', { userId: recipient.userId });
      preferences = NotificationModel.getDefaultPreferences(recipient.userId);
    }

    // Determine which delivery methods to use based on preferences, notification type, and severity
    let deliveryMethods: DeliveryMethod[] = [];
    if (severity === NotificationSeverity.CRITICAL || severity === NotificationSeverity.HIGH) {
      // For critical notifications, send through all available channels regardless of preferences
      deliveryMethods = Object.values(DeliveryMethod);
    } else {
      deliveryMethods = getDeliveryMethodsForUser(preferences, type, severity);
    }

    // Check if user is in quiet hours and if notification severity should bypass quiet hours
    if (isInQuietHours(preferences, severity)) {
      logger.info('User is in quiet hours, skipping notification delivery', { userId: recipient.userId, type, severity });
      continue; // Skip to the next recipient
    }

    // Add recipient to appropriate lists based on enabled delivery methods
    if (deliveryMethods.includes(DeliveryMethod.IN_APP)) {
      inAppRecipients.push(recipient.userId);
    }
    if (deliveryMethods.includes(DeliveryMethod.EMAIL) && recipient.email) {
      emailRecipients.push({ userId: recipient.userId, email: recipient.email });
    }
    if (deliveryMethods.includes(DeliveryMethod.SMS) && recipient.phoneNumber) {
      smsRecipients.push({ userId: recipient.userId, phoneNumber: recipient.phoneNumber });
    }
  }

  // Send in-app notifications
  let inAppResults: { successful: number; failed: number; results: Array<{ userId: UUID; result: NotificationDeliveryResult }> } | null = null;
  if (inAppRecipients.length > 0) {
    inAppResults = await InAppNotificationService.createBulkInAppNotifications(inAppRecipients, content, type, severity, options);
  }

  // Send email notifications
  let emailResults: NotificationDeliveryResult[] | null = null;
  if (emailRecipients.length > 0) {
    emailResults = await EmailService.sendBulkEmail(emailRecipients, content, options);
  }

  // Send SMS notifications
  let smsResults: NotificationDeliveryResult[] | null = null;
  if (smsRecipients.length > 0) {
    smsResults = await SmsService.sendBulkSms(smsRecipients, content, options);
  }

  // Combine results from all channels for each user
  for (const recipient of recipients) {
    const deliveryResults: { [key in DeliveryMethod]?: NotificationDeliveryResult } = {};

    // Add in-app result if applicable
    if (inAppResults && inAppResults.results.find(r => r.userId === recipient.userId)) {
      deliveryResults[DeliveryMethod.IN_APP] = inAppResults.results.find(r => r.userId === recipient.userId)!.result;
    }

    // Add email result if applicable
    if (emailResults && recipient.email) {
      deliveryResults[DeliveryMethod.EMAIL] = emailResults.find(r => r.metadata.userId === recipient.userId);
    }

    // Add SMS result if applicable
    if (smsResults && recipient.phoneNumber) {
      deliveryResults[DeliveryMethod.SMS] = smsResults.find(r => r.metadata.userId === recipient.userId);
    }

    results.push({ userId: recipient.userId, deliveryResults });

    // Track successful and failed deliveries
    if (Object.values(deliveryResults).some(r => r && r.success)) {
      successful++;
    } else {
      failed++;
    }
  }

  logger.info('Bulk notification completed', { total: recipients.length, successful, failed });

  return { successful, failed, results };
}

/**
 * Queues a notification for digest delivery based on user preferences
 * @param userId - ID of the user to queue the notification for
 * @param content - Content of the notification (title, message, data)
 * @param type - Type of the notification (e.g., claim_status, payment_received)
 * @param severity - Severity of the notification (low, medium, high, critical)
 * @param method - Delivery method for the digest (email or SMS)
 * @param options - Additional options for digest delivery
 * @returns True if notification was successfully queued
 */
async function queueDigestNotification(
  userId: UUID,
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  method: DeliveryMethod,
  options: Record<string, any> = {}
): Promise<boolean> {
  logger.debug('Queueing digest notification', { userId, type, severity, method, content, options });

  // Check if user exists
  const userExists = await NotificationModel.checkUserExists(userId);
  if (!userExists) {
    logger.error('User not found', { userId });
    return false;
  }

  // Get user notification preferences
  const preferences: NotificationPreferences | null = await NotificationModel.getUserPreferences(userId);

  // Check if digest delivery is enabled for the specified method
  if (!preferences?.deliveryMethods?.[method]?.enabled) {
    logger.info('Digest delivery disabled for user', { userId, method });
    return false;
  }

  // Create digest item
  const digestItem: NotificationDigestItem = {
    id: null, // ID will be generated by the database
    userId,
    type,
    severity,
    content,
    method,
    frequency: preferences.deliveryMethods[method].frequency,
    queuedAt: new Date(),
    sentAt: null
  };

  // Store digest item in database for later processing
  try {
    // await digestRepository.create(digestItem); // Assuming you have a digest repository
    return true;
  } catch (error) {
    logger.error('Error queueing digest notification', { error, userId, type, severity, method });
    return false;
  }
}

/**
 * Processes and sends queued digest notifications based on frequency
 * @param frequency - Frequency of the digest (daily or weekly)
 * @param options - Additional options for digest processing
 * @returns Summary of digest processing results
 */
async function sendDigestNotifications(
  frequency: string,
  options: Record<string, any> = {}
): Promise<{ processed: number; successful: number; failed: number }> {
  logger.debug('Processing digest notifications', { frequency, options });

  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Retrieve queued digest items for the specified frequency
  // const digestItems = await digestRepository.findQueuedByFrequency(frequency); // Assuming you have a digest repository

  // Group digest items by user ID and delivery method
  // const groupedItems = digestItems.reduce((acc, item) => { ... }, {});

  // For each user and delivery method combination:
  //   Collect all notifications for that user and method
  //   If delivery method is EMAIL, call EmailService.sendDigestEmail
  //   If delivery method is SMS, call SmsService.sendDigestSms
  //   Track successful and failed deliveries
  //   Mark processed items as sent in the database

  return { processed, successful, failed };
}

/**
 * Determines if a notification should be delivered based on user preferences
 * @param preferences - User notification preferences
 * @param type - Notification type
 * @param severity - Notification severity
 * @param method - Delivery method
 * @returns True if notification should be delivered
 */
function shouldDeliverNotification(
  preferences: NotificationPreferences,
  type: NotificationType,
  severity: NotificationSeverity,
  method: DeliveryMethod
): boolean {
  if (!preferences) {
    return true; // Default to delivering if no preferences are set
  }

  const typePreferences = preferences.notificationTypes?.[type];
  if (!typePreferences) {
    return true; // Default to delivering if no type-specific preferences are set
  }

  if (!typePreferences.enabled) {
    return false; // Do not deliver if the notification type is disabled
  }

  if (!typePreferences.deliveryMethods.includes(method)) {
    return false; // Do not deliver if the delivery method is not enabled for this type
  }

  // For CRITICAL and HIGH severity, always deliver regardless of preferences
  if (severity === NotificationSeverity.CRITICAL || severity === NotificationSeverity.HIGH) {
    return true;
  }

  return true; // All checks passed, deliver the notification
}

/**
 * Checks if the current time is within a user's configured quiet hours
 * @param preferences - User notification preferences
 * @param severity - Notification severity
 * @returns True if current time is in quiet hours and severity doesn't bypass
 */
function isInQuietHours(
  preferences: NotificationPreferences,
  severity: NotificationSeverity
): boolean {
  if (!preferences?.quietHours?.enabled) {
    return false; // Quiet hours are not enabled
  }

  // Get current time in user's timezone
  const now = new Date();
  const timezone = preferences.quietHours.timezone || 'UTC'; // Default to UTC if timezone is not set
  const formatter = new Intl.DateTimeFormat('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', timeZone: timezone });
  const [hour, minute] = formatter.format(now).split(':').map(Number);
  const currentTime = hour * 60 + minute; // Convert to minutes since midnight

  // Convert quiet hours start and end times to minutes since midnight
  const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
  const quietStart = startHour * 60 + startMinute;

  const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);
  const quietEnd = endHour * 60 + endMinute;

  // Check if current time is within quiet hours
  let inQuietHours = false;
  if (quietStart < quietEnd) {
    // Normal case: start is before end
    inQuietHours = currentTime >= quietStart && currentTime < quietEnd;
  } else {
    // Wrap-around case: start is after end (e.g., 10 PM to 6 AM)
    inQuietHours = currentTime >= quietStart || currentTime < quietEnd;
  }

  // Check if notification severity should bypass quiet hours
  if (preferences.quietHours.bypassForSeverity?.includes(severity)) {
    return false; // Bypass quiet hours for this severity
  }

  return inQuietHours; // Return true if in quiet hours and severity doesn't bypass
}

/**
 * Determines which delivery methods to use for a notification based on user preferences
 * @param preferences - User notification preferences
 * @param type - Notification type
 * @param severity - Notification severity
 * @returns Array of delivery methods to use
 */
function getDeliveryMethodsForUser(
  preferences: NotificationPreferences,
  type: NotificationType,
  severity: NotificationSeverity
): DeliveryMethod[] {
  const deliveryMethods: DeliveryMethod[] = [];

  if (!preferences) {
    return deliveryMethods; // Default to no delivery methods if no preferences are set
  }

  const typePreferences = preferences.notificationTypes?.[type];
  if (!typePreferences) {
    return deliveryMethods; // Default to no delivery methods if no type-specific preferences are set
  }

  if (!typePreferences.enabled) {
    return deliveryMethods; // Do not deliver if the notification type is disabled
  }

  // Add delivery methods configured for this notification type
  for (const method of typePreferences.deliveryMethods) {
    if (preferences.deliveryMethods?.[method]?.enabled) {
      deliveryMethods.push(method);
    }
  }

  return deliveryMethods;
}

// Export the notification manager as an object with all functions
export const NotificationManager = {
  sendNotification,
  sendBulkNotification,
  queueDigestNotification,
  sendDigestNotifications
};