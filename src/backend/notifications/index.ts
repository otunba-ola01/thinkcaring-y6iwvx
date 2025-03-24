/**
 * @fileoverview Central export file for the notification system in the HCBS Revenue Management System.
 * This file aggregates and exports all notification-related services, templates, and utilities to provide a unified interface for the notification system throughout the application.
 */

import { EmailService } from './email-notification'; // Import email notification service
import { SmsService } from './sms-notification'; // Import SMS notification service
import { InAppNotificationService } from './in-app-notification'; // Import in-app notification service
import { NotificationManager } from './notification-manager'; // Import notification manager service
import * as ClaimStatusTemplates from './notification-templates/claim-status.template'; // Import claim status notification templates
import * as PaymentReceivedTemplates from './notification-templates/payment-received.template'; // Import payment received notification templates
import * as AuthorizationExpiryTemplates from './notification-templates/authorization-expiry.template'; // Import authorization expiry notification templates
import * as ReportReadyTemplates from './notification-templates/report-ready.template'; // Import report ready notification templates
import * as ErrorAlertTemplates from './notification-templates/error-alert.template'; // Import error alert notification templates
import * as BillingReminderTemplates from './notification-templates/billing-reminder.template'; // Import billing reminder notification templates

/**
 * @exports EmailService
 * @description Service for sending email notifications to users.
 * @methods sendEmail, sendBulkEmail, sendDigestEmail
 */
export { EmailService };

/**
 * @exports SmsService
 * @description Service for sending SMS notifications to users.
 * @methods sendSms, sendBulkSms, sendDigestSms
 */
export { SmsService };

/**
 * @exports InAppNotificationService
 * @description Service for creating and managing in-app notifications.
 * @methods createInAppNotification, createBulkInAppNotifications
 */
export { InAppNotificationService };

/**
 * @exports NotificationManager
 * @description Central service for managing and orchestrating notifications across multiple channels.
 * @methods sendNotification, sendBulkNotification, queueDigestNotification, sendDigestNotifications
 */
export { NotificationManager };

/**
 * @exports NotificationTemplates
 * @description Collection of notification templates for different system events.
 * @namespace ClaimStatus Templates for claim status notifications.
 * @namespace PaymentReceived Templates for payment received notifications.
 * @namespace AuthorizationExpiry Templates for authorization expiry notifications.
 * @namespace ReportReady Templates for report ready notifications.
 * @namespace ErrorAlert Templates for error alert notifications.
 * @namespace BillingReminder Templates for billing reminder notifications.
 */
export const NotificationTemplates = {
  ClaimStatus: ClaimStatusTemplates,
  PaymentReceived: PaymentReceivedTemplates,
  AuthorizationExpiry: AuthorizationExpiryTemplates,
  ReportReady: ReportReadyTemplates,
  ErrorAlert: ErrorAlertTemplates,
  BillingReminder: BillingReminderTemplates
};