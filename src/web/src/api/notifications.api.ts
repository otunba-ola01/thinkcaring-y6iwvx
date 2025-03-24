/**
 * Notification API client module
 * 
 * Provides API functions for interacting with the notification endpoints in the HCBS Revenue Management System.
 * Handles fetching notifications, marking notifications as read/archived/deleted, and managing notification preferences.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client'; // axios-based client v1.4+
import { API_ENDPOINTS } from '../constants/api.constants';
import { 
  Notification, 
  NotificationCount, 
  NotificationPreferences, 
  NotificationQueryParams
} from '../types/notification.types';
import { UUID } from '../types/common.types';
import { ApiResponse } from '../types/api.types';

/**
 * Base endpoint for notification API requests
 */
const NOTIFICATIONS_ENDPOINT = API_ENDPOINTS.NOTIFICATIONS.BASE;

/**
 * Fetches notifications for the current user based on query parameters
 * 
 * @param queryParams - Parameters for filtering, sorting, and pagination
 * @returns Promise resolving to notifications and total count
 */
export async function getNotifications(
  queryParams: NotificationQueryParams
): Promise<ApiResponse<{ notifications: Notification[], total: number }>> {
  // HTTP Method: GET
  return apiClient.get(NOTIFICATIONS_ENDPOINT, queryParams);
}

/**
 * Fetches notification count statistics for the current user
 * 
 * @returns Promise resolving to notification count statistics
 */
export async function getNotificationCounts(): Promise<ApiResponse<NotificationCount>> {
  // HTTP Method: GET
  return apiClient.get(`${NOTIFICATIONS_ENDPOINT}/counts`);
}

/**
 * Fetches a specific notification by its ID
 * 
 * @param id - Notification ID
 * @returns Promise resolving to the notification details
 */
export async function getNotificationById(id: UUID): Promise<ApiResponse<Notification>> {
  // HTTP Method: GET
  return apiClient.get(`${NOTIFICATIONS_ENDPOINT}/${id}`);
}

/**
 * Marks a specific notification as read
 * 
 * @param id - Notification ID
 * @returns Promise resolving to the updated notification
 */
export async function markNotificationAsRead(id: UUID): Promise<ApiResponse<Notification>> {
  // HTTP Method: PUT
  return apiClient.put(`${NOTIFICATIONS_ENDPOINT}/${id}/read`);
}

/**
 * Marks all notifications for the current user as read
 * 
 * @returns Promise resolving to success status and count of updated notifications
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean, count: number }>> {
  // HTTP Method: PUT
  return apiClient.put(`${NOTIFICATIONS_ENDPOINT}/read-all`);
}

/**
 * Deletes a specific notification
 * 
 * @param id - Notification ID
 * @returns Promise resolving to success status
 */
export async function deleteNotification(id: UUID): Promise<ApiResponse<{ success: boolean }>> {
  // HTTP Method: DELETE
  return apiClient.del(`${NOTIFICATIONS_ENDPOINT}/${id}`);
}

/**
 * Archives a specific notification
 * 
 * @param id - Notification ID
 * @returns Promise resolving to the updated notification
 */
export async function archiveNotification(id: UUID): Promise<ApiResponse<Notification>> {
  // HTTP Method: PUT
  return apiClient.put(`${NOTIFICATIONS_ENDPOINT}/${id}/archive`);
}

/**
 * Fetches notification preferences for the current user
 * 
 * @returns Promise resolving to notification preferences
 */
export async function getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
  // HTTP Method: GET
  return apiClient.get(`${NOTIFICATIONS_ENDPOINT}/preferences`);
}

/**
 * Updates notification preferences for the current user
 * 
 * @param preferences - Updated notification preferences
 * @returns Promise resolving to updated notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<ApiResponse<NotificationPreferences>> {
  // HTTP Method: PUT
  return apiClient.put(`${NOTIFICATIONS_ENDPOINT}/preferences`, preferences);
}