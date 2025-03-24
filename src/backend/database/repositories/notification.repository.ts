import { Knex } from 'knex'; // knex v2.4.2
import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import {
  NotificationEntity,
  NotificationType,
  NotificationStatus,
  NotificationSeverity,
  NotificationPreferences,
  NotificationQueryParams,
  NotificationCount,
  CreateNotificationDto,
  UpdateNotificationStatusDto
} from '../../types/notification.types';
import { UUID } from '../../types/common.types';
import { RepositoryOptions } from '../../types/database.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for notification data access operations
 */
class NotificationRepository extends BaseRepository<NotificationEntity> {
  /**
   * Creates a new NotificationRepository instance
   */
  constructor() {
    // Call super constructor with 'notifications' table name, 'id' primary key, and true for soft delete
    super('notifications', 'id', true);
  }

  /**
   * Finds notifications for a specific user with filtering and pagination
   * 
   * @param userId User ID to find notifications for
   * @param queryParams Query parameters for filtering and pagination
   * @param options Repository options
   * @returns List of notifications and total count
   */
  async findByUserId(
    userId: UUID,
    queryParams: NotificationQueryParams,
    options: RepositoryOptions = {}
  ): Promise<{ data: NotificationEntity[]; total: number }> {
    try {
      logger.debug(`Finding notifications for user: ${userId}`, { queryParams });

      // Get query builder from base repository
      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Add where condition for userId
      queryBuilder.where('user_id', userId);

      // Apply status filter if provided
      if (queryParams.status) {
        if (Array.isArray(queryParams.status)) {
          queryBuilder.whereIn('status', queryParams.status);
        } else {
          queryBuilder.where('status', queryParams.status);
        }
      }

      // Apply type filter if provided
      if (queryParams.type) {
        if (Array.isArray(queryParams.type)) {
          queryBuilder.whereIn('type', queryParams.type);
        } else {
          queryBuilder.where('type', queryParams.type);
        }
      }

      // Apply severity filter if provided
      if (queryParams.severity) {
        if (Array.isArray(queryParams.severity)) {
          queryBuilder.whereIn('severity', queryParams.severity);
        } else {
          queryBuilder.where('severity', queryParams.severity);
        }
      }

      // Apply date range filter if provided
      if (queryParams.startDate) {
        queryBuilder.where('created_at', '>=', queryParams.startDate);
      }
      if (queryParams.endDate) {
        queryBuilder.where('created_at', '<=', queryParams.endDate);
      }

      // Apply custom filters if provided in queryParams.filter
      if (queryParams.filter && queryParams.filter.conditions) {
        queryParams.filter.conditions.forEach(condition => {
          if (condition.value === null) {
            queryBuilder.whereNull(condition.field);
          } else if (Array.isArray(condition.value)) {
            queryBuilder.whereIn(condition.field, condition.value);
          } else {
            queryBuilder.where(condition.field, condition.value);
          }
        });
      }

      // Apply pagination from queryParams
      const { page, limit } = queryParams.pagination;
      const offset = (page - 1) * limit;
      queryBuilder.limit(limit).offset(offset);

      // Apply sorting from queryParams
      const { sortBy, sortDirection } = queryParams.sort;
      queryBuilder.orderBy(sortBy, sortDirection);

      // Create count query with same filters
      const countQueryBuilder = this.getQueryBuilder(options.transaction)
        .where('user_id', userId);
      
      // Apply the same filters to count query
      if (queryParams.status) {
        if (Array.isArray(queryParams.status)) {
          countQueryBuilder.whereIn('status', queryParams.status);
        } else {
          countQueryBuilder.where('status', queryParams.status);
        }
      }
      
      if (queryParams.type) {
        if (Array.isArray(queryParams.type)) {
          countQueryBuilder.whereIn('type', queryParams.type);
        } else {
          countQueryBuilder.where('type', queryParams.type);
        }
      }
      
      if (queryParams.severity) {
        if (Array.isArray(queryParams.severity)) {
          countQueryBuilder.whereIn('severity', queryParams.severity);
        } else {
          countQueryBuilder.where('severity', queryParams.severity);
        }
      }
      
      if (queryParams.startDate) {
        countQueryBuilder.where('created_at', '>=', queryParams.startDate);
      }
      
      if (queryParams.endDate) {
        countQueryBuilder.where('created_at', '<=', queryParams.endDate);
      }
      
      if (queryParams.filter && queryParams.filter.conditions) {
        queryParams.filter.conditions.forEach(condition => {
          if (condition.value === null) {
            countQueryBuilder.whereNull(condition.field);
          } else if (Array.isArray(condition.value)) {
            countQueryBuilder.whereIn(condition.field, condition.value);
          } else {
            countQueryBuilder.where(condition.field, condition.value);
          }
        });
      }

      // Execute query to get notifications
      const data = await queryBuilder;
      
      // Execute count query to get total count
      const countResult = await countQueryBuilder.count({ total: '*' }).first();

      // Return data and total count
      return {
        data: data as NotificationEntity[],
        total: Number(countResult?.total || 0)
      };
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'findByUserId');
    }
  }

  /**
   * Creates a new notification in the database
   * 
   * @param notificationData Notification data to create
   * @param options Repository options
   * @returns The newly created notification
   */
  async createNotification(
    notificationData: CreateNotificationDto,
    options: RepositoryOptions = {}
  ): Promise<NotificationEntity> {
    try {
      logger.debug('Creating new notification', { notificationData });

      // Prepare notification entity with status set to UNREAD
      const now = new Date();
      const notification: Partial<NotificationEntity> = {
        ...notificationData,
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: now,
        updatedAt: now
      };

      // Call base repository create method
      return await this.create(notification, options);
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'createNotification');
    }
  }

  /**
   * Updates the status of a notification
   * 
   * @param id Notification ID to update
   * @param statusData New status data
   * @param options Repository options
   * @returns The updated notification or null if not found
   */
  async updateStatus(
    id: UUID,
    statusData: UpdateNotificationStatusDto,
    options: RepositoryOptions = {}
  ): Promise<NotificationEntity | null> {
    try {
      logger.debug(`Updating notification status: ${id}`, { statusData });

      // Get query builder from base repository
      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Prepare update data with new status
      const updateData: any = {
        status: statusData.status,
        updated_at: new Date()
      };

      // If status is READ and readAt is not set, set readAt to current timestamp
      if (statusData.status === NotificationStatus.READ) {
        updateData.read_at = new Date();
      }

      // Execute update query with returning clause
      const [updatedNotification] = await queryBuilder
        .where('id', id)
        .update(updateData)
        .returning('*');

      // Return the updated notification or null if not found
      return updatedNotification || null;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Updates the status of multiple notifications for a user
   * 
   * @param userId User ID
   * @param notificationIds Array of notification IDs to update
   * @param statusData New status data
   * @param options Repository options
   * @returns Number of notifications updated
   */
  async bulkUpdateStatus(
    userId: UUID,
    notificationIds: UUID[] | null,
    statusData: UpdateNotificationStatusDto,
    options: RepositoryOptions = {}
  ): Promise<number> {
    try {
      logger.debug(`Bulk updating notification status for user: ${userId}`, { 
        notificationIds, 
        statusData 
      });

      // Get query builder from base repository
      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Add where condition for userId
      queryBuilder.where('user_id', userId);
      
      // Add where condition for notification ids if provided
      if (notificationIds && notificationIds.length > 0) {
        queryBuilder.whereIn('id', notificationIds);
      }

      // Prepare update data with new status
      const updateData: any = {
        status: statusData.status,
        updated_at: new Date()
      };

      // If status is READ and readAt is not set, set readAt to current timestamp
      if (statusData.status === NotificationStatus.READ) {
        updateData.read_at = new Date();
      }

      // Execute update query
      const result = await queryBuilder.update(updateData);

      // Return the number of affected rows
      return result;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'bulkUpdateStatus');
    }
  }

  /**
   * Marks all unread notifications as read for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<number> {
    try {
      logger.debug(`Marking all notifications as read for user: ${userId}`);

      // Get query builder from base repository
      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Prepare update data with READ status and current readAt timestamp
      const now = new Date();
      const result = await queryBuilder
        .where('user_id', userId)
        .where('status', NotificationStatus.UNREAD)
        .update({
          status: NotificationStatus.READ,
          read_at: now,
          updated_at: now
        });

      // Return the number of affected rows
      return result;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'markAllAsRead');
    }
  }

  /**
   * Gets notification counts by status, type, and severity for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns Notification count statistics
   */
  async getNotificationCounts(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<NotificationCount> {
    try {
      logger.debug(`Getting notification counts for user: ${userId}`);

      // Get Knex instance
      const knex = getKnexInstance();
      const query = options.transaction || knex;

      // Create query to count total notifications for user
      const totalQuery = query('notifications')
        .count('id as count')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .first();

      // Create query to count unread notifications for user
      const unreadQuery = query('notifications')
        .count('id as count')
        .where('user_id', userId)
        .where('status', NotificationStatus.UNREAD)
        .whereNull('deleted_at')
        .first();

      // Create query to count notifications by type for user
      const byTypeQuery = query('notifications')
        .select('type')
        .count('id as count')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .groupBy('type');

      // Create query to count notifications by severity for user
      const bySeverityQuery = query('notifications')
        .select('severity')
        .count('id as count')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .groupBy('severity');

      // Execute all queries
      const [totalResult, unreadResult, byTypeResults, bySeverityResults] = await Promise.all([
        totalQuery,
        unreadQuery,
        byTypeQuery,
        bySeverityQuery
      ]);

      // Initialize type counts with zeros for all types
      const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
      for (const type of Object.values(NotificationType)) {
        byType[type] = 0;
      }
      
      // Fill in actual counts from query results
      byTypeResults.forEach((result: any) => {
        byType[result.type as NotificationType] = Number(result.count);
      });

      // Initialize severity counts with zeros for all severities
      const bySeverity: Record<NotificationSeverity, number> = {} as Record<NotificationSeverity, number>;
      for (const severity of Object.values(NotificationSeverity)) {
        bySeverity[severity] = 0;
      }
      
      // Fill in actual counts from query results
      bySeverityResults.forEach((result: any) => {
        bySeverity[result.severity as NotificationSeverity] = Number(result.count);
      });

      // Combine results into NotificationCount object
      return {
        total: Number(totalResult?.count || 0),
        unread: Number(unreadResult?.count || 0),
        byType,
        bySeverity
      };
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'getNotificationCounts');
    }
  }

  /**
   * Retrieves notification preferences for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns User's notification preferences if found
   */
  async getUserPreferences(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<NotificationPreferences | null> {
    try {
      logger.debug(`Getting notification preferences for user: ${userId}`);

      // Get Knex instance
      const knex = getKnexInstance();
      const query = options.transaction || knex;
      
      // Create query to find preferences in notification_preferences table
      const preferences = await query('notification_preferences')
        .where('user_id', userId)
        .first();

      // Return the preferences or null if not found
      return preferences || null;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'getUserPreferences');
    }
  }

  /**
   * Saves or updates notification preferences for a user
   * 
   * @param userId User ID
   * @param preferences Notification preferences to save
   * @param options Repository options
   * @returns The saved notification preferences
   */
  async saveUserPreferences(
    userId: UUID,
    preferences: NotificationPreferences,
    options: RepositoryOptions = {}
  ): Promise<NotificationPreferences> {
    try {
      logger.debug(`Saving notification preferences for user: ${userId}`);

      // Get Knex instance
      const knex = getKnexInstance();
      const query = options.transaction || knex;

      // Check if preferences exist for the user
      const existing = await query('notification_preferences')
        .where('user_id', userId)
        .first();

      const now = new Date();
      let result;

      if (existing) {
        // If preferences exist, update existing record
        [result] = await query('notification_preferences')
          .where('user_id', userId)
          .update({
            ...preferences,
            user_id: userId, // Ensure userId is set correctly
            updated_at: now
          })
          .returning('*');
      } else {
        // If preferences don't exist, insert new record
        [result] = await query('notification_preferences')
          .insert({
            ...preferences,
            user_id: userId, // Ensure userId is set correctly
            created_at: now,
            updated_at: now
          })
          .returning('*');
      }

      // Return the saved preferences
      return result;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'saveUserPreferences');
    }
  }

  /**
   * Deletes notifications that have passed their expiration date
   * 
   * @param options Repository options
   * @returns Number of notifications deleted
   */
  async deleteExpiredNotifications(
    options: RepositoryOptions = {}
  ): Promise<number> {
    try {
      logger.debug('Deleting expired notifications');

      // Get query builder from base repository
      const queryBuilder = this.getQueryBuilder(options.transaction);

      // Add where condition for expiresAt less than current timestamp
      // Add where condition for non-null expiresAt
      const result = await queryBuilder
        .where('expires_at', '<', new Date())
        .whereNotNull('expires_at')
        .delete();

      // Return the number of affected rows
      return result;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'deleteExpiredNotifications');
    }
  }
}

// Create singleton instance
const notificationRepository = new NotificationRepository();

// Export repository instance
export { notificationRepository };