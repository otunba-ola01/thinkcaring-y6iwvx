import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  NotificationContextType, 
  Notification, 
  NotificationCount,
  NotificationQueryParams,
  UUID
} from '../types/notification.types';
import {
  getNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
  archiveNotification as apiArchiveNotification
} from '../api/notifications.api';
import { useToastContext } from './ToastContext';
import { useAuthContext } from './AuthContext';

/**
 * Context for notification management across the application
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider component that manages and provides notification functionality
 * throughout the HCBS Revenue Management System.
 * 
 * Handles notification state, fetching, real-time updates, and user interactions
 * such as marking notifications as read, archiving, and deleting.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped with the provider
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [counts, setCounts] = useState<NotificationCount>({
    total: 0,
    unread: 0,
    byType: {},
    bySeverity: {}
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Polling interval for checking new notifications (1 minute)
  const [pollingInterval] = useState<number>(60000);

  // Access toast notifications for user feedback
  const { showToast } = useToastContext();
  
  // Access authentication state to check if user is logged in
  const { isAuthenticated } = useAuthContext();

  /**
   * Fetches notifications and counts from the API
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare query parameters for pagination, sorting, and filtering
      const queryParams: NotificationQueryParams = {
        pagination: { page: 1, pageSize: 20 },
        sort: { field: 'createdAt', direction: 'desc' },
        filter: {}
      };
      
      // Fetch notifications
      const response = await getNotifications(queryParams);
      setNotifications(response.data.notifications);
      
      // Fetch notification counts
      const countsResponse = await getNotificationCounts();
      setCounts(countsResponse.data);
      setUnreadCount(countsResponse.data.unread);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      showToast({
        message: 'Failed to fetch notifications',
        severity: 'error'
      });
    }
  }, [isAuthenticated, showToast]);

  /**
   * Marks a specific notification as read
   * @param {UUID} id - ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (id: UUID) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await markNotificationAsRead(id);
      
      // Update notification in the local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? response.data
            : notification
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      showToast({
        message: 'Failed to mark notification as read',
        severity: 'error'
      });
    }
  }, [showToast]);

  /**
   * Marks all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await markAllNotificationsAsRead();
      
      // Refresh notifications to get updated state
      await fetchNotifications();
      
      setLoading(false);
      
      showToast({
        message: 'All notifications marked as read',
        severity: 'success'
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      showToast({
        message: 'Failed to mark all notifications as read',
        severity: 'error'
      });
    }
  }, [fetchNotifications, showToast]);

  /**
   * Deletes a specific notification
   * @param {UUID} id - ID of the notification to delete
   */
  const deleteNotification = useCallback(async (id: UUID) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiDeleteNotification(id);
      
      // Remove notification from local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update notification counts
      const countsResponse = await getNotificationCounts();
      setCounts(countsResponse.data);
      setUnreadCount(countsResponse.data.unread);
      
      setLoading(false);
      
      showToast({
        message: 'Notification deleted',
        severity: 'success'
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      showToast({
        message: 'Failed to delete notification',
        severity: 'error'
      });
    }
  }, [showToast]);

  /**
   * Archives a specific notification
   * @param {UUID} id - ID of the notification to archive
   */
  const archiveNotification = useCallback(async (id: UUID) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiArchiveNotification(id);
      
      // Update notification in local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? response.data
            : notification
        )
      );
      
      // Update notification counts
      const countsResponse = await getNotificationCounts();
      setCounts(countsResponse.data);
      setUnreadCount(countsResponse.data.unread);
      
      setLoading(false);
      
      showToast({
        message: 'Notification archived',
        severity: 'success'
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
      showToast({
        message: 'Failed to archive notification',
        severity: 'error'
      });
    }
  }, [showToast]);

  // Initial fetch of notifications when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Set up polling for real-time notification updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications, pollingInterval]);

  // Create the context value object
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    counts,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to access the notification context
 * 
 * @returns {NotificationContextType} The notification context object
 * @throws {Error} If used outside of a NotificationProvider
 */
export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}

export { NotificationContext };