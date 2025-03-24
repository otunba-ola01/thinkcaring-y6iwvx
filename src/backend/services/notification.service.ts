# src/backend/services/notification.service.ts
/**
 * @fileoverview Service layer for managing notifications in the HCBS Revenue Management System. This service provides a high-level API for creating, sending, and managing notifications across different channels (in-app, email, SMS) while respecting user preferences. It coordinates between the notification model, notification manager, and other system components to deliver timely alerts about critical financial events and issues.
 */

import {
  NotificationModel, // Import notification model for data operations
  NotificationManager // Import notification manager for delivery operations
} from '../models/notification.model';
import {
  NotificationType, // Import notification type definitions
  NotificationSeverity,
  NotificationStatus,
  DeliveryMethod,
  NotificationFrequency,
  NotificationContent,
  NotificationPreferences,
  NotificationQueryParams,
  NotificationCount,
  CreateNotificationDto,
  UpdateNotificationStatusDto
} from '../types/notification.types';
import { UUID } from '../types/common.types'; // Import UUID type for user and notification identifiers
import { logger } from '../utils/logger'; // Import logging functionality
import { config } from '../config'; // Import notification configuration settings
import { ApiError } from '../errors/api-error'; // Import base error class for error handling
import { BusinessError } from '../errors/business-error'; // Import business error class for business rule violations

/**
 * Retrieves notifications for a user with filtering and pagination
 * @param userId - ID of the user to retrieve notifications for
 * @param queryParams - Query parameters for filtering and pagination
 * @returns List of notifications and total count
 */
async function getNotifications(
  userId: UUID,
  queryParams: NotificationQueryParams
): Promise<{ data: any[]; total: number }> {
  try {
    logger.info('Retrieving notifications', { userId, queryParams });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.findByUserId with userId and queryParams
    const notifications = await NotificationModel.findByUserId(userId, queryParams);

    // Return the notifications and total count
    return notifications;
  } catch (error) {
    logger.error('Error retrieving notifications', { error, userId, queryParams });
    throw error;
  }
}

/**
 * Retrieves a specific notification by its ID
 * @param id - ID of the notification to retrieve
 * @param userId - ID of the user who owns the notification
 * @returns The notification if found
 */
async function getNotificationById(id: UUID, userId: UUID): Promise<any> {
  try {
    logger.info('Retrieving notification by ID', { id, userId });

    // Call NotificationModel.findById with the notification id
    const notification = await NotificationModel.findById(id);

    // If notification not found, throw ApiError with NOT_FOUND status
    if (!notification) {
      logger.warn('Notification not found', { id });
      throw new ApiError('Notification not found').setMetadata({ status: 404 });
    }

    // If notification doesn't belong to the specified user, throw ApiError with FORBIDDEN status
    if (notification.userId !== userId) {
      logger.warn('Notification does not belong to user', { id, userId });
      throw new ApiError('Forbidden').setMetadata({ status: 403 });
    }

    // Return the notification
    return notification;
  } catch (error) {
    logger.error('Error retrieving notification by ID', { error, id, userId });
    throw error;
  }
}

/**
 * Creates a new notification for a user
 * @param notificationData - Data for the new notification
 * @returns The created notification
 */
async function createNotification(notificationData: CreateNotificationDto): Promise<any> {
  try {
    logger.info('Creating notification', { notificationData });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(notificationData.userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId: notificationData.userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.create with the notification data
    const notification = await NotificationModel.create(notificationData);

    // Return the created notification
    return notification;
  } catch (error) {
    logger.error('Error creating notification', { error, notificationData });
    throw error;
  }
}

/**
 * Creates and sends a notification to a user through appropriate channels
 * @param userId - ID of the user to send the notification to
 * @param type - Type of the notification (e.g., claim_status, payment_received)
 * @param severity - Severity of the notification (low, medium, high, critical)
 * @param data - Data associated with the notification
 * @param methods - Specific delivery methods to use (optional)
 * @returns The created notification and delivery results
 */
async function sendNotification(
  userId: UUID,
  type: NotificationType,
  severity: NotificationSeverity,
  data: any,
  methods?: DeliveryMethod[]
): Promise<{ notification: any; deliveryResults: any[] }> {
  try {
    logger.info('Sending notification', { userId, type, severity, data, methods });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Get user notification preferences by calling NotificationModel.getUserPreferences
    let preferences: NotificationPreferences | null = await NotificationModel.getUserPreferences(userId);

    // If no preferences found, use default preferences from NotificationModel.getDefaultPreferences
    if (!preferences) {
      logger.debug('No notification preferences found for user, using default preferences', { userId });
      preferences = NotificationModel.getDefaultPreferences(userId);
    }

    // Get notification template by calling NotificationManager.getTemplateForNotificationType
    const template = NotificationManager.getTemplateForNotificationType(type);

    // Format notification content by calling NotificationManager.formatNotificationContent
    const content: NotificationContent = NotificationManager.formatNotificationContent(template, data);

    // If no specific delivery methods provided, determine methods based on preferences
    const deliveryMethods = methods || NotificationManager.determineDeliveryMethods(preferences, type, severity);

    // Create notification record by calling NotificationModel.create
    const notificationDto: CreateNotificationDto = {
      userId,
      type,
      severity,
      content,
      actions: template.defaultActions || [],
      expiresAt: null // TODO: Implement expiration logic
    };
    const notification = await NotificationModel.create(notificationDto);

    // Send notification through determined channels by calling NotificationManager.sendNotification
    const deliveryResults = await NotificationManager.sendNotification(userId, content, type, severity, deliveryMethods);

    // Return the created notification and delivery results
    return { notification, deliveryResults };
  } catch (error) {
    logger.error('Error sending notification', { error, userId, type, severity, data, methods });
    throw error;
  }
}

/**
 * Sends the same notification to multiple users
 * @param userIds - Array of user IDs to send the notification to
 * @param type - Type of the notification (e.g., claim_status, payment_received)
 * @param severity - Severity of the notification (low, medium, high, critical)
 * @param data - Data associated with the notification
 * @param methods - Specific delivery methods to use (optional)
 * @returns Summary of bulk notification results
 */
async function sendBulkNotification(
  userIds: UUID[],
  type: NotificationType,
  severity: NotificationSeverity,
  data: any,
  methods?: DeliveryMethod[]
): Promise<{ successful: number; failed: number; results: any[] }> {
  try {
    logger.info('Sending bulk notification', { userIds, type, severity, data, methods });

    // Get notification template by calling NotificationManager.getTemplateForNotificationType
    const template = NotificationManager.getTemplateForNotificationType(type);

    // Format notification content by calling NotificationManager.formatNotificationContent
    const content: NotificationContent = NotificationManager.formatNotificationContent(template, data);

    // Filter out invalid user IDs by checking each with NotificationModel.checkUserExists
    const validUserIds: UUID[] = [];
    for (const userId of userIds) {
      const userExists = await NotificationModel.checkUserExists(userId);
      if (userExists) {
        validUserIds.push(userId);
      } else {
        logger.warn('User not found, skipping notification', { userId });
      }
    }

    // For valid users, create notification records by calling NotificationModel.create
    const notifications: any[] = [];
    for (const userId of validUserIds) {
      const notificationDto: CreateNotificationDto = {
        userId,
        type,
        severity,
        content,
        actions: template.defaultActions || [],
        expiresAt: null // TODO: Implement expiration logic
      };
      const notification = await NotificationModel.create(notificationDto);
      notifications.push(notification);
    }

    // Send notifications through specified channels by calling NotificationManager.sendBulkNotification
    const deliveryResults = await NotificationManager.sendBulkNotification(validUserIds, content, type, severity, methods);

    // Return summary with counts of successful and failed deliveries, plus detailed results
    return {
      successful: deliveryResults.successful,
      failed: deliveryResults.failed,
      results: deliveryResults.results
    };
  } catch (error) {
    logger.error('Error sending bulk notification', { error, userIds, type, severity, data, methods });
    throw error;
  }
}

/**
 * Updates the status of a notification
 * @param id - ID of the notification to update
 * @param userId - ID of the user who owns the notification
 * @param statusData - Data containing the new status
 * @returns The updated notification
 */
async function updateNotificationStatus(
  id: UUID,
  userId: UUID,
  statusData: UpdateNotificationStatusDto
): Promise<any> {
  try {
    logger.info('Updating notification status', { id, userId, statusData });

    // Get notification by calling getNotificationById to verify it exists and belongs to user
    await getNotificationById(id, userId);

    // Call NotificationModel.updateStatus with the notification id and status data
    const notification = await NotificationModel.updateStatus(id, statusData);

    // Return the updated notification
    return notification;
  } catch (error) {
    logger.error('Error updating notification status', { error, id, userId, statusData });
    throw error;
  }
}

/**
 * Updates the status of multiple notifications for a user
 * @param userId - ID of the user who owns the notifications
 * @param notificationIds - Array of notification IDs to update
 * @param statusData - Data containing the new status
 * @returns Number of notifications updated
 */
async function bulkUpdateNotificationStatus(
  userId: UUID,
  notificationIds: UUID[],
  statusData: UpdateNotificationStatusDto
): Promise<number> {
  try {
    logger.info('Bulk updating notification status', { userId, notificationIds, statusData });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.bulkUpdateStatus with userId, notificationIds, and status data
    const updatedCount = await NotificationModel.bulkUpdateStatus(userId, notificationIds, statusData);

    // Return the number of updated notifications
    return updatedCount;
  } catch (error) {
    logger.error('Error bulk updating notification status', { error, userId, notificationIds, statusData });
    throw error;
  }
}

/**
 * Marks all unread notifications as read for a user
 * @param userId - ID of the user to mark notifications as read for
 * @returns Number of notifications marked as read
 */
async function markAllAsRead(userId: UUID): Promise<number> {
  try {
    logger.info('Marking all notifications as read', { userId });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.markAllAsRead with userId
    const updatedCount = await NotificationModel.markAllAsRead(userId);

    // Return the number of updated notifications
    return updatedCount;
  } catch (error) {
    logger.error('Error marking all notifications as read', { error, userId });
    throw error;
  }
}

/**
 * Deletes a notification (soft delete by changing status to DELETED)
 * @param id - ID of the notification to delete
 * @param userId - ID of the user who owns the notification
 * @returns True if the notification was deleted successfully
 */
async function deleteNotification(id: UUID, userId: UUID): Promise<boolean> {
  try {
    logger.info('Deleting notification', { id, userId });

    // Get notification by calling getNotificationById to verify it exists and belongs to user
    await getNotificationById(id, userId);

    // Call NotificationModel.deleteNotification with the notification id and userId
    const deleted = await NotificationModel.deleteNotification(id, userId);

    // Return true if deletion was successful
    return deleted;
  } catch (error) {
    logger.error('Error deleting notification', { error, id, userId });
    throw error;
  }
}

/**
 * Deletes multiple notifications for a user (soft delete)
 * @param userId - ID of the user who owns the notifications
 * @param notificationIds - Array of notification IDs to delete
 * @returns Number of notifications deleted
 */
async function bulkDeleteNotifications(userId: UUID, notificationIds: UUID[]): Promise<number> {
  try {
    logger.info('Bulk deleting notifications', { userId, notificationIds });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.bulkDeleteNotifications with userId and notificationIds
    const deletedCount = await NotificationModel.bulkDeleteNotifications(userId, notificationIds);

    // Return the number of deleted notifications
    return deletedCount;
  } catch (error) {
    logger.error('Error bulk deleting notifications', { error, userId, notificationIds });
    throw error;
  }
}

/**
 * Gets notification counts by status, type, and severity for a user
 * @param userId - ID of the user to get notification counts for
 * @returns Notification count statistics
 */
async function getNotificationCounts(userId: UUID): Promise<NotificationCount> {
  try {
    logger.info('Getting notification counts', { userId });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.getNotificationCounts with userId
    const counts = await NotificationModel.getNotificationCounts(userId);

    // Return the notification count statistics
    return counts;
  } catch (error) {
    logger.error('Error getting notification counts', { error, userId });
    throw error;
  }
}

/**
 * Retrieves notification preferences for a user
 * @param userId - ID of the user to retrieve preferences for
 * @returns User's notification preferences
 */
async function getUserPreferences(userId: UUID): Promise<NotificationPreferences> {
  try {
    logger.info('Getting user preferences', { userId });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Call NotificationModel.getUserPreferences with userId
    let preferences = await NotificationModel.getUserPreferences(userId);

    // If no preferences found, return default preferences from NotificationModel.getDefaultPreferences
    if (!preferences) {
      logger.debug('No notification preferences found, returning default preferences', { userId });
      preferences = NotificationModel.getDefaultPreferences(userId);
    }

    // Return the user's notification preferences
    return preferences;
  } catch (error) {
    logger.error('Error getting user preferences', { error, userId });
    throw error;
  }
}

/**
 * Saves or updates notification preferences for a user
 * @param userId - ID of the user to save preferences for
 * @param preferences - New notification preferences
 * @returns The saved notification preferences
 */
async function saveUserPreferences(userId: UUID, preferences: NotificationPreferences): Promise<NotificationPreferences> {
  try {
    logger.info('Saving user preferences', { userId, preferences });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Ensure preferences.userId matches the provided userId
    if (preferences.userId !== userId) {
      logger.warn('Preferences userId does not match provided userId', { userId, preferencesUserId: preferences.userId });
      throw new BusinessError('Preferences userId does not match provided userId', null, 'notification.preferences.user_mismatch');
    }

    // Call NotificationModel.saveUserPreferences with userId and preferences
    const savedPreferences = await NotificationModel.saveUserPreferences(userId, preferences);

    // Return the saved notification preferences
    return savedPreferences;
  } catch (error) {
    logger.error('Error saving user preferences', { error, userId, preferences });
    throw error;
  }
}

/**
 * Resets a user's notification preferences to default values
 * @param userId - ID of the user to reset preferences for
 * @returns The default notification preferences
 */
async function resetUserPreferences(userId: UUID): Promise<NotificationPreferences> {
  try {
    logger.info('Resetting user preferences to default', { userId });

    // Validate that the user exists by calling NotificationModel.checkUserExists
    const userExists = await NotificationModel.checkUserExists(userId);

    // If user doesn't exist, throw BusinessError with appropriate message
    if (!userExists) {
      logger.error('User not found', { userId });
      throw new BusinessError('User not found', null, 'notification.user.not_found');
    }

    // Get default preferences from NotificationModel.getDefaultPreferences
    const defaultPreferences = NotificationModel.getDefaultPreferences(userId);

    // Call NotificationModel.saveUserPreferences with userId and default preferences
    const savedPreferences = await NotificationModel.saveUserPreferences(userId, defaultPreferences);

    // Return the saved default preferences
    return savedPreferences;
  } catch (error) {
    logger.error('Error resetting user preferences', { error, userId });
    throw error;
  }
}

/**
 * Sends digest notifications based on frequency settings
 * @param frequency - Frequency of the digest (daily or weekly)
 * @returns Summary of digest processing
 */
async function sendDigestNotifications(frequency: string): Promise<{ processed: number; sent: number; failed: number }> {
  try {
    logger.info('Sending digest notifications', { frequency });

    // Call NotificationManager.sendDigestNotifications with the specified frequency
    const digestResults = await NotificationManager.sendDigestNotifications(frequency);

    // Return summary of processing results
    return digestResults;
  } catch (error) {
    logger.error('Error sending digest notifications', { error, frequency });
    throw error;
  }
}

/**
 * Deletes notifications that have passed their expiration date
 * @returns Number of notifications deleted
 */
async function cleanupExpiredNotifications(): Promise<number> {
  try {
    logger.info('Cleaning up expired notifications');

    // Call NotificationModel.deleteExpiredNotifications
    const deletedCount = await NotificationModel.deleteExpiredNotifications();

    // Return the number of deleted notifications
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired notifications', { error });
    throw error;
  }
}

// Export the notification service as an object with all functions
export const notificationService = {
  getNotifications,
  getNotificationById,
  createNotification,
  sendNotification,
  sendBulkNotification,
  updateNotificationStatus,
  bulkUpdateNotificationStatus,
  markAllAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  getNotificationCounts,
  getUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
  sendDigestNotifications,
  cleanupExpiredNotifications
};