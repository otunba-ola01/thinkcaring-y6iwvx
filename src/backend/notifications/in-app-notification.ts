/**
 * Service for handling in-app notifications in the HCBS Revenue Management System.
 * This module provides functionality to create, store, and manage in-app notifications
 * that appear within the application UI, supporting the alert notification system
 * for financial events and issues.
 */
import {
  NotificationContent,
  NotificationDeliveryResult,
  DeliveryMethod,
  NotificationType,
  NotificationSeverity,
  NotificationStatus,
  CreateNotificationDto
} from '../types/notification.types';
import { NotificationModel } from '../models/notification.model';
import { logger } from '../utils/logger';
import { config } from '../config';
import { UUID } from '../types/common.types';

/**
 * Creates an in-app notification for a specific user
 * 
 * @param userId User ID to create notification for
 * @param content Notification content
 * @param type Notification type
 * @param severity Notification severity
 * @param options Additional options
 * @returns Result of the notification creation
 */
async function createInAppNotification(
  userId: UUID,
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  options: Record<string, any> = {}
): Promise<NotificationDeliveryResult> {
  try {
    logger.debug('Creating in-app notification', { userId, type, severity });
    
    // Check if user exists
    const userExists = await NotificationModel.checkUserExists(userId);
    if (!userExists) {
      logger.debug('User not found for notification', { userId });
      return {
        method: DeliveryMethod.IN_APP,
        success: false,
        timestamp: new Date(),
        error: 'User not found',
        metadata: {}
      };
    }
    
    // Get user notification preferences
    const preferences = await NotificationModel.getUserPreferences(userId);
    
    // Check if this notification should be created
    if (!shouldCreateInAppNotification(preferences, type, severity)) {
      logger.debug('User has disabled this notification type', { userId, type });
      return {
        method: DeliveryMethod.IN_APP,
        success: false,
        timestamp: new Date(),
        error: 'Notification type disabled by user preferences',
        metadata: { type, severity }
      };
    }
    
    // Calculate expiration date based on type and severity
    const expiresAt = calculateExpirationDate(type, severity);
    
    // Create notification data transfer object
    const notificationDto = createNotificationDto(userId, content, type, severity, expiresAt);
    
    // Create notification in database
    const notification = await NotificationModel.create(notificationDto);
    
    logger.debug('Created in-app notification', { userId, notificationId: notification.id });
    
    // Return successful delivery result
    return {
      method: DeliveryMethod.IN_APP,
      success: true,
      timestamp: new Date(),
      error: null,
      metadata: {
        notificationId: notification.id
      }
    };
  } catch (error) {
    logger.error('Error creating in-app notification', { error, userId, type });
    
    // Return failed delivery result
    return {
      method: DeliveryMethod.IN_APP,
      success: false,
      timestamp: new Date(),
      error: `Error creating notification: ${error.message}`,
      metadata: {}
    };
  }
}

/**
 * Creates the same in-app notification for multiple users
 * 
 * @param userIds List of user IDs to create notifications for
 * @param content Notification content
 * @param type Notification type
 * @param severity Notification severity
 * @param options Additional options
 * @returns Summary of notification creation results
 */
async function createBulkInAppNotifications(
  userIds: UUID[],
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  options: Record<string, any> = {}
): Promise<{ successful: number; failed: number; results: Array<{ userId: UUID; result: NotificationDeliveryResult }> }> {
  try {
    logger.debug('Creating bulk in-app notifications', { 
      userCount: userIds.length, 
      type, 
      severity 
    });
    
    // Initialize results tracking
    const results: Array<{ userId: UUID; result: NotificationDeliveryResult }> = [];
    let successful = 0;
    let failed = 0;
    
    // Create notification for each user
    for (const userId of userIds) {
      const result = await createInAppNotification(userId, content, type, severity, options);
      
      results.push({ userId, result });
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
    
    logger.debug('Bulk in-app notifications created', { 
      total: userIds.length, 
      successful, 
      failed 
    });
    
    // Return summary of results
    return {
      successful,
      failed,
      results
    };
  } catch (error) {
    logger.error('Error creating bulk in-app notifications', { error, userCount: userIds.length, type });
    
    return {
      successful: 0,
      failed: userIds.length,
      results: userIds.map(userId => ({
        userId,
        result: {
          method: DeliveryMethod.IN_APP,
          success: false,
          timestamp: new Date(),
          error: `Error in bulk operation: ${error.message}`,
          metadata: {}
        }
      }))
    };
  }
}

/**
 * Determines if an in-app notification should be created based on user preferences
 * 
 * @param preferences User notification preferences
 * @param type Notification type
 * @param severity Notification severity
 * @returns True if notification should be created
 */
function shouldCreateInAppNotification(
  preferences: any,
  type: NotificationType,
  severity: NotificationSeverity
): boolean {
  // If preferences are not set, default to creating the notification
  if (!preferences) {
    return true;
  }
  
  // Get type-specific preferences
  const typePreferences = preferences.notificationTypes?.[type];
  
  // If type is not configured, default to creating the notification
  if (!typePreferences) {
    return true;
  }
  
  // Check if this type is enabled
  if (!typePreferences.enabled) {
    return false;
  }
  
  // Check if IN_APP delivery method is enabled for this type
  if (!typePreferences.deliveryMethods.includes(DeliveryMethod.IN_APP)) {
    return false;
  }
  
  // Always create notifications for CRITICAL and HIGH severity regardless of preferences
  if (severity === NotificationSeverity.CRITICAL || severity === NotificationSeverity.HIGH) {
    return true;
  }
  
  // All checks passed, notification should be created
  return true;
}

/**
 * Calculates the expiration date for an in-app notification
 * 
 * @param type Notification type
 * @param severity Notification severity
 * @returns Expiration date or null if notification doesn't expire
 */
function calculateExpirationDate(
  type: NotificationType,
  severity: NotificationSeverity
): Date | null {
  // Get default expiration days from configuration
  const notificationsConfig = config.notifications || {};
  const defaultExpirationDays = notificationsConfig.defaultExpirationDays || 30;
  
  // Adjust expiration based on notification type and severity
  let expirationDays = defaultExpirationDays;
  
  // Different types may have different expiration periods
  switch (type) {
    case NotificationType.CLAIM_STATUS:
      expirationDays = notificationsConfig.claimStatusExpirationDays || defaultExpirationDays;
      break;
    case NotificationType.PAYMENT_RECEIVED:
      expirationDays = notificationsConfig.paymentReceivedExpirationDays || defaultExpirationDays;
      break;
    case NotificationType.AUTHORIZATION_EXPIRY:
      expirationDays = notificationsConfig.authExpiryExpirationDays || defaultExpirationDays;
      break;
    case NotificationType.FILING_DEADLINE:
      expirationDays = notificationsConfig.filingDeadlineExpirationDays || defaultExpirationDays;
      break;
    default:
      expirationDays = defaultExpirationDays;
  }
  
  // Adjust based on severity
  if (severity === NotificationSeverity.LOW) {
    // LOW severity notifications expire faster
    expirationDays = Math.max(7, Math.floor(expirationDays / 2));
  } else if (severity === NotificationSeverity.CRITICAL) {
    // CRITICAL notifications may have longer retention
    expirationDays = Math.floor(expirationDays * 1.5);
  }
  
  // If expiration days is 0 or null, the notification doesn't expire
  if (!expirationDays) {
    return null;
  }
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  
  return expiresAt;
}

/**
 * Creates a notification data transfer object for database storage
 * 
 * @param userId User ID
 * @param content Notification content
 * @param type Notification type
 * @param severity Notification severity
 * @param expiresAt Expiration date or null
 * @returns Notification DTO ready for storage
 */
function createNotificationDto(
  userId: UUID,
  content: NotificationContent,
  type: NotificationType,
  severity: NotificationSeverity,
  expiresAt: Date | null
): CreateNotificationDto {
  const dto: CreateNotificationDto = {
    userId,
    type,
    severity,
    content,
    status: NotificationStatus.UNREAD,
    actions: []
  };
  
  // Add expiration date if provided
  if (expiresAt) {
    dto.expiresAt = expiresAt;
  }
  
  // Add actions if available in content
  if (content.actions) {
    dto.actions = content.actions;
  }
  
  return dto;
}

/**
 * Service for creating and managing in-app notifications
 */
export const InAppNotificationService = {
  createInAppNotification,
  createBulkInAppNotifications,
};