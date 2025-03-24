import {
  UUID,
  ISO8601DateTime,
  EntityBase,
  PaginationParams,
  SortParams,
  FilterParams
} from './common.types';

/**
 * Enum defining the types of notifications supported by the system
 */
export enum NotificationType {
  CLAIM_STATUS = 'CLAIM_STATUS',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  AUTHORIZATION_EXPIRY = 'AUTHORIZATION_EXPIRY',
  FILING_DEADLINE = 'FILING_DEADLINE',
  REPORT_READY = 'REPORT_READY',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  COMPLIANCE_ALERT = 'COMPLIANCE_ALERT',
  USER_INVITATION = 'USER_INVITATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_STATUS = 'ACCOUNT_STATUS'
}

/**
 * Enum defining severity levels for notifications to prioritize display and delivery
 */
export enum NotificationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Enum defining possible statuses for a notification in its lifecycle
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

/**
 * Enum defining the channels through which notifications can be delivered
 */
export enum DeliveryMethod {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

/**
 * Enum defining frequency options for notification delivery
 */
export enum NotificationFrequency {
  REAL_TIME = 'REAL_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

/**
 * Interface defining the content structure of a notification
 */
export interface NotificationContent {
  title: string;
  message: string;
  data: Record<string, any>;
}

/**
 * Interface defining actions that can be taken from a notification
 */
export interface NotificationAction {
  label: string;
  url: string;
  actionType: string;
  data: Record<string, any>;
}

/**
 * Interface defining the structure of a notification entity in the frontend
 */
export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  severity: NotificationSeverity;
  status: NotificationStatus;
  content: NotificationContent;
  actions: NotificationAction[];
  readAt: ISO8601DateTime | null;
  expiresAt: ISO8601DateTime | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface defining user preferences for a specific notification type
 */
export interface NotificationTypePreference {
  enabled: boolean;
  deliveryMethods: DeliveryMethod[];
}

/**
 * Interface defining comprehensive user notification preferences
 */
export interface NotificationPreferences {
  userId: UUID;
  notificationTypes: Record<NotificationType, NotificationTypePreference>;
  deliveryMethods: Record<DeliveryMethod, { enabled: boolean, frequency: NotificationFrequency }>;
  quietHours: {
    enabled: boolean;
    start: string; // Format: HH:MM
    end: string; // Format: HH:MM
    timezone: string;
    bypassForSeverity: NotificationSeverity[]; // Severities that bypass quiet hours
  };
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface defining notification count statistics for a user
 */
export interface NotificationCount {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  bySeverity: Record<NotificationSeverity, number>;
}

/**
 * Interface defining query parameters for retrieving notifications
 */
export interface NotificationQueryParams {
  pagination: PaginationParams;
  sort: SortParams;
  filter: FilterParams;
  status?: NotificationStatus | NotificationStatus[];
  type?: NotificationType | NotificationType[];
  severity?: NotificationSeverity | NotificationSeverity[];
  startDate?: ISO8601DateTime;
  endDate?: ISO8601DateTime;
}

/**
 * Interface defining the shape of the notification context used by the NotificationContext provider
 */
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  counts: NotificationCount;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: UUID) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: UUID) => Promise<void>;
  archiveNotification: (id: UUID) => Promise<void>;
}

/**
 * Interface defining props for the AlertNotification component
 */
export interface AlertNotificationProps {
  message: string;
  severity: NotificationSeverity;
  onDismiss: () => void;
  action?: React.ReactNode;
  autoHideDuration?: number;
}