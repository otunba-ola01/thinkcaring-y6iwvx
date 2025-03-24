/**
 * @fileoverview Type definitions for the notification system in the HCBS Revenue Management System.
 * This file provides types and interfaces for notification entities, delivery methods,
 * user preferences, and related data structures used throughout the notification subsystem.
 */

import { 
  UUID, 
  Timestamp, 
  AuditableEntity, 
  PaginationParams,
  SortParams,
  FilterParams 
} from './common.types';

/**
 * Types of notifications supported by the system
 */
export enum NotificationType {
  CLAIM_STATUS = 'claim_status',           // Updates on claim status changes
  PAYMENT_RECEIVED = 'payment_received',   // Notifications for received payments
  AUTHORIZATION_EXPIRY = 'auth_expiry',    // Alerts for authorizations nearing expiration
  FILING_DEADLINE = 'filing_deadline',     // Alerts for claims approaching filing deadlines
  REPORT_READY = 'report_ready',           // Notifications when reports are ready
  SYSTEM_ERROR = 'system_error',           // Critical system error notifications
  COMPLIANCE_ALERT = 'compliance_alert',   // Compliance-related alerts
  USER_INVITATION = 'user_invitation',     // User invitation notifications
  PASSWORD_RESET = 'password_reset',       // Password reset notifications
  ACCOUNT_STATUS = 'account_status'        // Account status change notifications
}

/**
 * Severity levels for notifications to prioritize display and delivery
 */
export enum NotificationSeverity {
  LOW = 'low',           // Informational, non-urgent
  MEDIUM = 'medium',     // Requires attention but not urgent
  HIGH = 'high',         // Requires prompt attention
  CRITICAL = 'critical'  // Requires immediate attention
}

/**
 * Possible statuses for a notification in its lifecycle
 */
export enum NotificationStatus {
  UNREAD = 'unread',     // New notification, not yet read by user
  READ = 'read',         // Notification has been read by user
  ARCHIVED = 'archived', // User has archived the notification
  DELETED = 'deleted'    // User has deleted the notification
}

/**
 * Channels through which notifications can be delivered
 */
export enum DeliveryMethod {
  IN_APP = 'in_app',     // Delivered within the application UI
  EMAIL = 'email',       // Delivered via email
  SMS = 'sms'            // Delivered via text message
}

/**
 * Frequency options for notification delivery
 */
export enum NotificationFrequency {
  REAL_TIME = 'real_time',  // Delivered immediately when triggered
  DAILY = 'daily',          // Aggregated and delivered once daily
  WEEKLY = 'weekly'         // Aggregated and delivered once weekly
}

/**
 * Content structure of a notification
 */
export interface NotificationContent {
  title: string;               // Short title summarizing the notification
  message: string;             // Detailed notification message
  data: Record<string, any>;   // Additional contextual data related to the notification
}

/**
 * Actions that can be taken from a notification
 */
export interface NotificationAction {
  label: string;               // Display text for the action
  url: string;                 // URL to navigate to when action is taken
  actionType: string;          // Type of action (e.g., 'view', 'approve', 'dismiss')
  data: Record<string, any>;   // Additional data required for the action
}

/**
 * Database entity structure for notifications
 */
export interface NotificationEntity {
  id: UUID;                       // Unique identifier
  userId: UUID;                   // User the notification is for
  type: NotificationType;         // Type of notification
  severity: NotificationSeverity; // Severity level
  status: NotificationStatus;     // Current status
  content: NotificationContent;   // Notification content
  actions: NotificationAction[];  // Available actions
  readAt: Timestamp | null;       // When notification was read, if applicable
  expiresAt: Timestamp | null;    // When notification expires, if applicable
  createdAt: Timestamp;           // When notification was created
  updatedAt: Timestamp;           // When notification was last updated
}

/**
 * Templates for generating notifications
 */
export interface NotificationTemplate {
  title: string;                     // Template for notification title (supports variables)
  message: string;                   // Template for notification message (supports variables)
  type: NotificationType;            // Type of notification this template is for
  severity: NotificationSeverity;    // Default severity level
  defaultActions: NotificationAction[]; // Default actions for this notification type
  expirationDays: number | null;     // Days until notification expires, null for no expiration
}

/**
 * Data transfer object for creating notifications
 */
export interface CreateNotificationDto {
  userId: UUID;                      // User to receive the notification
  type: NotificationType;            // Type of notification
  severity: NotificationSeverity;    // Severity level
  content: NotificationContent;      // Notification content
  actions: NotificationAction[];     // Available actions
  expiresAt: Timestamp | null;       // Expiration date, if applicable
}

/**
 * Data transfer object for updating notification status
 */
export interface UpdateNotificationStatusDto {
  status: NotificationStatus;        // New status to set
}

/**
 * Query parameters for retrieving notifications
 */
export interface NotificationQueryParams {
  pagination: PaginationParams;       // Pagination parameters
  sort: SortParams;                   // Sorting parameters
  filter: FilterParams;               // General filtering parameters
  status?: NotificationStatus | NotificationStatus[];  // Filter by status
  type?: NotificationType | NotificationType[];        // Filter by type
  severity?: NotificationSeverity | NotificationSeverity[]; // Filter by severity
  startDate?: Timestamp;              // Filter by creation date range start
  endDate?: Timestamp;                // Filter by creation date range end
}

/**
 * User preferences for a specific notification type
 */
export interface NotificationTypePreference {
  enabled: boolean;               // Whether notifications of this type are enabled
  deliveryMethods: DeliveryMethod[]; // Permitted delivery methods for this type
}

/**
 * Comprehensive user notification preferences
 */
export interface NotificationPreferences {
  userId: UUID;                   // User these preferences belong to
  notificationTypes: Record<NotificationType, NotificationTypePreference>; // Preferences by notification type
  deliveryMethods: Record<DeliveryMethod, {
    enabled: boolean;             // Whether this delivery method is enabled
    frequency: NotificationFrequency; // Delivery frequency for this method
  }>;
  quietHours: {                   // Times when notifications should not be delivered
    enabled: boolean;             // Whether quiet hours are enabled
    start: string;                // Start time in HH:MM format (24-hour)
    end: string;                  // End time in HH:MM format (24-hour)
    timezone: string;             // User timezone for quiet hours
    bypassForSeverity: NotificationSeverity[]; // Severity levels that bypass quiet hours
  };
  createdAt: Timestamp;           // When preferences were created
  updatedAt: Timestamp;           // When preferences were last updated
}

/**
 * Result of a notification delivery attempt
 */
export interface NotificationDeliveryResult {
  method: DeliveryMethod;         // Delivery method used
  success: boolean;               // Whether delivery was successful
  timestamp: Timestamp;           // When delivery was attempted
  error: string | null;           // Error message if delivery failed
  metadata: Record<string, any>;  // Additional details about the delivery
}

/**
 * Notification count statistics for a user
 */
export interface NotificationCount {
  total: number;                  // Total notifications
  unread: number;                 // Unread notifications
  byType: Record<NotificationType, number>; // Count by notification type
  bySeverity: Record<NotificationSeverity, number>; // Count by severity
}

/**
 * Queued notification for digest delivery
 */
export interface NotificationDigestItem {
  id: UUID;                       // Unique identifier
  userId: UUID;                   // User the notification is for
  type: NotificationType;         // Type of notification
  severity: NotificationSeverity; // Severity level
  content: NotificationContent;   // Notification content
  method: DeliveryMethod;         // Delivery method for this digest item
  frequency: NotificationFrequency; // Frequency setting for this digest
  queuedAt: Timestamp;            // When the notification was queued for digest
  sentAt: Timestamp | null;       // When the notification was sent in a digest
}