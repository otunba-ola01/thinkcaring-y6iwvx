/**
 * Defines notification templates for billing reminders in the HCBS Revenue Management System.
 * These templates provide standardized notification formatting for various billing scenarios
 * including filing deadlines, unbilled services, and documentation issues.
 */

import { NotificationType, NotificationSeverity, NotificationTemplate } from '../../types/notification.types';
import { BillingStatus, DocumentationStatus } from '../../types/services.types';
import { formatCurrency } from '../../utils/formatter';
import { formatDate } from '../../utils/date';

/**
 * Standard billing reminder template
 * Used as a default for generic billing notifications
 */
export const standardBillingReminderTemplate: NotificationTemplate = {
  title: 'Billing Reminder',
  message: 'You have {{serviceCount}} services that require attention for billing.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Services',
      url: '/billing/services',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for filing deadline notifications
 * Used when services are approaching their filing deadline with payers
 */
export const filingDeadlineTemplate: NotificationTemplate = {
  title: 'Filing Deadline Approaching',
  message: 'You have {{serviceCount}} services with a total of {{totalAmount}} that must be filed by {{filingDeadline}}. You have {{daysRemaining}} days remaining to submit these claims.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'Review Services',
      url: '/billing/services?filter=deadline',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Create Claims',
      url: '/billing/create-claim',
      actionType: 'create',
      data: {}
    }
  ],
  expirationDays: null // Filing deadline notifications don't expire until the deadline passes
};

/**
 * Template for unbilled services notifications
 * Used to remind users about services that haven't been billed yet
 */
export const unbilledServicesTemplate: NotificationTemplate = {
  title: 'Unbilled Services Reminder',
  message: 'You have {{serviceCount}} unbilled services for {{clientName}} with a total value of {{totalAmount}} from {{earliestServiceDate}} to {{latestServiceDate}}.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'Review Services',
      url: '/billing/services?status=unbilled',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Create Claim',
      url: '/billing/create-claim',
      actionType: 'create',
      data: {}
    }
  ],
  expirationDays: 14
};

/**
 * Template for incomplete documentation notifications
 * Used to alert about services that cannot be billed due to incomplete documentation
 */
export const incompleteDocumentationTemplate: NotificationTemplate = {
  title: 'Incomplete Documentation',
  message: 'You have {{serviceCount}} services with incomplete documentation for {{programName}} that cannot be billed until documentation is completed.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'Complete Documentation',
      url: '/services/documentation',
      actionType: 'update',
      data: {}
    }
  ],
  expirationDays: 3
};

/**
 * Template for weekly billing summary notifications
 * Used to provide a regular summary of billing status
 */
export const weeklyBillingSummaryTemplate: NotificationTemplate = {
  title: 'Weekly Billing Summary',
  message: 'Weekly billing summary: {{serviceCount}} services ready to bill ({{totalAmount}}), {{unbilledCount}} unbilled, {{incompleteCount}} with incomplete documentation.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Billing Dashboard',
      url: '/billing/dashboard',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Retrieves the appropriate notification template based on billing reminder type
 * 
 * @param reminderData - Data about the billing reminder
 * @returns The notification template for the billing reminder event
 */
export function getBillingReminderTemplate(reminderData: any): NotificationTemplate {
  if (reminderData.type === 'filingDeadline') {
    return filingDeadlineTemplate;
  } else if (reminderData.type === 'unbilledServices') {
    return unbilledServicesTemplate;
  } else if (reminderData.type === 'incompleteDocumentation') {
    return incompleteDocumentationTemplate;
  } else if (reminderData.type === 'weeklySummary') {
    return weeklyBillingSummaryTemplate;
  }
  
  // Default to standard template if no specific type matches
  return standardBillingReminderTemplate;
}

/**
 * Formats the notification message with billing-specific details
 * 
 * @param template - Template string with placeholders
 * @param reminderData - Billing reminder data to insert into template
 * @returns Formatted message with billing details
 */
export function formatBillingReminderMessage(template: string, reminderData: any): string {
  let message = template;
  
  // Replace placeholders with actual data
  if (reminderData.serviceCount !== undefined) {
    message = message.replace(/{{serviceCount}}/g, reminderData.serviceCount.toString());
  }
  
  if (reminderData.totalAmount !== undefined) {
    message = message.replace(/{{totalAmount}}/g, formatCurrency(reminderData.totalAmount));
  }
  
  if (reminderData.clientName !== undefined) {
    message = message.replace(/{{clientName}}/g, reminderData.clientName);
  }
  
  if (reminderData.programName !== undefined) {
    message = message.replace(/{{programName}}/g, reminderData.programName);
  }
  
  if (reminderData.payerName !== undefined) {
    message = message.replace(/{{payerName}}/g, reminderData.payerName);
  }
  
  if (reminderData.earliestServiceDate !== undefined) {
    message = message.replace(/{{earliestServiceDate}}/g, formatDate(reminderData.earliestServiceDate) || '');
  }
  
  if (reminderData.latestServiceDate !== undefined) {
    message = message.replace(/{{latestServiceDate}}/g, formatDate(reminderData.latestServiceDate) || '');
  }
  
  if (reminderData.filingDeadline !== undefined) {
    message = message.replace(/{{filingDeadline}}/g, formatDate(reminderData.filingDeadline) || '');
  }
  
  if (reminderData.daysRemaining !== undefined) {
    message = message.replace(/{{daysRemaining}}/g, reminderData.daysRemaining.toString());
  }
  
  if (reminderData.unbilledCount !== undefined) {
    message = message.replace(/{{unbilledCount}}/g, reminderData.unbilledCount.toString());
  }
  
  if (reminderData.incompleteCount !== undefined) {
    message = message.replace(/{{incompleteCount}}/g, reminderData.incompleteCount.toString());
  }
  
  return message;
}

/**
 * Gets a user-friendly text description for a billing status
 * 
 * @param status - The billing status enum value
 * @returns User-friendly description of the billing status
 */
export function getBillingStatusText(status: BillingStatus): string {
  switch (status) {
    case BillingStatus.UNBILLED:
      return 'Unbilled';
    case BillingStatus.READY_FOR_BILLING:
      return 'Ready for Billing';
    case BillingStatus.IN_CLAIM:
      return 'In Claim';
    case BillingStatus.BILLED:
      return 'Billed';
    case BillingStatus.PAID:
      return 'Paid';
    case BillingStatus.DENIED:
      return 'Denied';
    case BillingStatus.VOID:
      return 'Void';
    default:
      return status;
  }
}

/**
 * Gets a user-friendly text description for a documentation status
 * 
 * @param status - The documentation status enum value
 * @returns User-friendly description of the documentation status
 */
export function getDocumentationStatusText(status: DocumentationStatus): string {
  switch (status) {
    case DocumentationStatus.INCOMPLETE:
      return 'Incomplete';
    case DocumentationStatus.COMPLETE:
      return 'Complete';
    case DocumentationStatus.REJECTED:
      return 'Rejected';
    case DocumentationStatus.PENDING_REVIEW:
      return 'Pending Review';
    default:
      return status;
  }
}