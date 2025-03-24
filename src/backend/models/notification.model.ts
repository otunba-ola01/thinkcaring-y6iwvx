import { notificationRepository } from '../database/repositories/notification.repository';
import { userRepository } from '../database/repositories/user.repository';
import {
  NotificationEntity,
  NotificationType,
  NotificationSeverity,
  NotificationStatus,
  DeliveryMethod,
  NotificationPreferences,
  NotificationQueryParams,
  NotificationCount,
  CreateNotificationDto,
  UpdateNotificationStatusDto
} from '../types/notification.types';
import { UUID } from '../types/common.types';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Retrieves a notification by its unique identifier
 * 
 * @param id The notification ID to find
 * @param options Optional repository options
 * @returns The notification if found, null otherwise
 */
async function findById(
  id: UUID, 
  options: Record<string, any> = {}
): Promise<NotificationEntity | null> {
  try {
    return await notificationRepository.findById(id, options);
  } catch (error) {
    logger.error(`Error finding notification by ID: ${id}`, { error });
    throw error;
  }
}

/**
 * Retrieves notifications for a specific user with filtering and pagination
 * 
 * @param userId User ID to find notifications for
 * @param queryParams Query parameters for filtering and pagination
 * @param options Optional repository options
 * @returns List of notifications and total count
 */
async function findByUserId(
  userId: UUID,
  queryParams: NotificationQueryParams,
  options: Record<string, any> = {}
): Promise<{ data: NotificationEntity[]; total: number }> {
  try {
    return await notificationRepository.findByUserId(userId, queryParams, options);
  } catch (error) {
    logger.error(`Error finding notifications for user: ${userId}`, { error, queryParams });
    throw error;
  }
}

/**
 * Creates a new notification in the database
 * 
 * @param notificationData Notification data to create
 * @param options Optional repository options
 * @returns The newly created notification
 */
async function create(
  notificationData: CreateNotificationDto,
  options: Record<string, any> = {}
): Promise<NotificationEntity> {
  try {
    logger.debug('Creating notification', { notificationData });
    return await notificationRepository.createNotification(notificationData, options);
  } catch (error) {
    logger.error('Error creating notification', { error, notificationData });
    throw error;
  }
}

/**
 * Updates the status of a notification
 * 
 * @param id Notification ID to update
 * @param statusData New status data
 * @param options Optional repository options
 * @returns The updated notification or null if not found
 */
async function updateStatus(
  id: UUID,
  statusData: UpdateNotificationStatusDto,
  options: Record<string, any> = {}
): Promise<NotificationEntity | null> {
  try {
    logger.debug(`Updating notification status: ${id}`, { statusData });
    return await notificationRepository.updateStatus(id, statusData, options);
  } catch (error) {
    logger.error(`Error updating notification status: ${id}`, { error, statusData });
    throw error;
  }
}

/**
 * Updates the status of multiple notifications for a user
 * 
 * @param userId User ID
 * @param notificationIds Array of notification IDs to update
 * @param statusData New status data
 * @param options Optional repository options
 * @returns Number of notifications updated
 */
async function bulkUpdateStatus(
  userId: UUID,
  notificationIds: UUID[],
  statusData: UpdateNotificationStatusDto,
  options: Record<string, any> = {}
): Promise<number> {
  try {
    logger.debug(`Bulk updating notification status for user: ${userId}`, { 
      notificationIds, 
      statusData 
    });
    return await notificationRepository.bulkUpdateStatus(userId, notificationIds, statusData, options);
  } catch (error) {
    logger.error(`Error bulk updating notification status for user: ${userId}`, { 
      error, 
      notificationIds, 
      statusData 
    });
    throw error;
  }
}

/**
 * Marks all unread notifications as read for a user
 * 
 * @param userId User ID
 * @param options Optional repository options
 * @returns Number of notifications marked as read
 */
async function markAllAsRead(
  userId: UUID,
  options: Record<string, any> = {}
): Promise<number> {
  try {
    logger.debug(`Marking all notifications as read for user: ${userId}`);
    return await notificationRepository.markAllAsRead(userId, options);
  } catch (error) {
    logger.error(`Error marking all notifications as read for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Soft deletes a notification by changing its status to DELETED
 * 
 * @param id Notification ID to delete
 * @param userId User ID who owns the notification
 * @param options Optional repository options
 * @returns True if the notification was deleted successfully
 */
async function deleteNotification(
  id: UUID,
  userId: UUID,
  options: Record<string, any> = {}
): Promise<boolean> {
  try {
    logger.debug(`Deleting notification: ${id} for user: ${userId}`);
    const statusData: UpdateNotificationStatusDto = {
      status: NotificationStatus.DELETED
    };
    const result = await notificationRepository.updateStatus(id, statusData, options);
    return !!result;
  } catch (error) {
    logger.error(`Error deleting notification: ${id} for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Soft deletes multiple notifications by changing their status to DELETED
 * 
 * @param userId User ID who owns the notifications
 * @param notificationIds Array of notification IDs to delete
 * @param options Optional repository options
 * @returns Number of notifications deleted
 */
async function bulkDeleteNotifications(
  userId: UUID,
  notificationIds: UUID[],
  options: Record<string, any> = {}
): Promise<number> {
  try {
    logger.debug(`Bulk deleting notifications for user: ${userId}`, { notificationIds });
    const statusData: UpdateNotificationStatusDto = {
      status: NotificationStatus.DELETED
    };
    return await notificationRepository.bulkUpdateStatus(userId, notificationIds, statusData, options);
  } catch (error) {
    logger.error(`Error bulk deleting notifications for user: ${userId}`, { 
      error, 
      notificationIds 
    });
    throw error;
  }
}

/**
 * Gets notification counts by status, type, and severity for a user
 * 
 * @param userId User ID
 * @param options Optional repository options
 * @returns Notification count statistics
 */
async function getNotificationCounts(
  userId: UUID,
  options: Record<string, any> = {}
): Promise<NotificationCount> {
  try {
    logger.debug(`Getting notification counts for user: ${userId}`);
    return await notificationRepository.getNotificationCounts(userId, options);
  } catch (error) {
    logger.error(`Error getting notification counts for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Retrieves notification preferences for a user
 * 
 * @param userId User ID
 * @param options Optional repository options
 * @returns User's notification preferences if found
 */
async function getUserPreferences(
  userId: UUID,
  options: Record<string, any> = {}
): Promise<NotificationPreferences | null> {
  try {
    logger.debug(`Getting notification preferences for user: ${userId}`);
    return await notificationRepository.getUserPreferences(userId, options);
  } catch (error) {
    logger.error(`Error getting notification preferences for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Saves or updates notification preferences for a user
 * 
 * @param userId User ID
 * @param preferences Notification preferences to save
 * @param options Optional repository options
 * @returns The saved notification preferences
 */
async function saveUserPreferences(
  userId: UUID,
  preferences: NotificationPreferences,
  options: Record<string, any> = {}
): Promise<NotificationPreferences> {
  try {
    logger.debug(`Saving notification preferences for user: ${userId}`);
    return await notificationRepository.saveUserPreferences(userId, preferences, options);
  } catch (error) {
    logger.error(`Error saving notification preferences for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Checks if a user exists in the system
 * 
 * @param userId User ID to check
 * @param options Optional repository options
 * @returns True if the user exists, false otherwise
 */
async function checkUserExists(
  userId: UUID,
  options: Record<string, any> = {}
): Promise<boolean> {
  try {
    const user = await userRepository.findById(userId, options);
    return !!user;
  } catch (error) {
    logger.error(`Error checking if user exists: ${userId}`, { error });
    throw error;
  }
}

/**
 * Deletes notifications that have passed their expiration date
 * 
 * @param options Optional repository options
 * @returns Number of notifications deleted
 */
async function deleteExpiredNotifications(
  options: Record<string, any> = {}
): Promise<number> {
  try {
    logger.debug('Deleting expired notifications');
    return await notificationRepository.deleteExpiredNotifications(options);
  } catch (error) {
    logger.error('Error deleting expired notifications', { error });
    throw error;
  }
}

/**
 * Gets the default notification preferences for a new user
 * 
 * @param userId User ID
 * @returns Default notification preferences
 */
function getDefaultPreferences(userId: UUID): NotificationPreferences {
  // Create default preferences object
  const defaultPreferences: NotificationPreferences = {
    userId,
    notificationTypes: {} as Record<NotificationType, {
      enabled: boolean;
      deliveryMethods: DeliveryMethod[];
    }>,
    deliveryMethods: {
      [DeliveryMethod.IN_APP]: {
        enabled: true,
        frequency: 'real_time' as any // Note: TypeScript issue, should match the NotificationFrequency enum
      },
      [DeliveryMethod.EMAIL]: {
        enabled: config.notifications?.enableEmailByDefault ?? false,
        frequency: 'daily' as any // Note: TypeScript issue, should match the NotificationFrequency enum
      },
      [DeliveryMethod.SMS]: {
        enabled: config.notifications?.enableSMSByDefault ?? false,
        frequency: 'real_time' as any // Note: TypeScript issue, should match the NotificationFrequency enum
      }
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
      bypassForSeverity: [NotificationSeverity.CRITICAL, NotificationSeverity.HIGH]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Enable all notification types by default
  Object.values(NotificationType).forEach(type => {
    defaultPreferences.notificationTypes[type] = {
      enabled: true,
      deliveryMethods: [DeliveryMethod.IN_APP]
    };
  });

  return defaultPreferences;
}

// Export the notification model as an object with all functions
export const NotificationModel = {
  findById,
  findByUserId,
  create,
  updateStatus,
  bulkUpdateStatus,
  markAllAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  getNotificationCounts,
  getUserPreferences,
  saveUserPreferences,
  checkUserExists,
  deleteExpiredNotifications,
  getDefaultPreferences
};