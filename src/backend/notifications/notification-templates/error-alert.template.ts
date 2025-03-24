/**
 * Error notification templates for the HCBS Revenue Management System.
 * 
 * This file defines notification templates for system errors and exceptions,
 * with specialized templates for different error types and severity levels.
 * It also provides utility functions for retrieving and formatting templates
 * based on the specific error context.
 */

import { NotificationType, NotificationSeverity, NotificationTemplate } from '../../types/notification.types';
import { ErrorCategory, ErrorSeverity } from '../../types/error.types';
import { ApiError } from '../../errors';

/**
 * Generic template for system error notifications
 */
export const genericErrorTemplate: NotificationTemplate = {
  title: 'System Error',
  message: 'A system error has occurred: {{errorId}} - {{errorMessage}}. ' +
    'Please contact support if this issue persists.',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Retry Operation',
      url: '#retry',
      actionType: 'retry',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for integration-related error notifications
 */
export const integrationErrorTemplate: NotificationTemplate = {
  title: 'Integration Error',
  message: 'An error occurred while communicating with an external system: {{errorMessage}}. ' +
    'The service {{service}} at endpoint {{endpoint}} returned an error. ' +
    'Error ID: {{errorId}}',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Check Integration Status',
      url: '/admin/integrations',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for database-related error notifications
 */
export const databaseErrorTemplate: NotificationTemplate = {
  title: 'Database Error',
  message: 'A database error has occurred: {{errorMessage}}. ' +
    'This may affect data integrity or system functionality. ' +
    'Error ID: {{errorId}}',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for validation error notifications
 */
export const validationErrorTemplate: NotificationTemplate = {
  title: 'Validation Error',
  message: 'A validation error has occurred: {{errorMessage}}. ' +
    'Please review the input data and try again. ' +
    'Error ID: {{errorId}}',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for authentication error notifications
 */
export const authErrorTemplate: NotificationTemplate = {
  title: 'Authentication Error',
  message: 'An authentication error has occurred: {{errorMessage}}. ' +
    'This may affect user access to the system. ' +
    'Error ID: {{errorId}}',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Manage Users',
      url: '/admin/users',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for business rule violation notifications
 */
export const businessErrorTemplate: NotificationTemplate = {
  title: 'Business Rule Violation',
  message: 'A business rule violation has occurred: {{errorMessage}}. ' +
    'Error ID: {{errorId}}',
  type: NotificationType.SYSTEM_ERROR,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Details',
      url: '/admin/errors/{{errorId}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Maps error severity levels to notification severity levels
 * 
 * @param errorSeverity The error severity level
 * @returns The corresponding notification severity level
 */
export function mapErrorSeverityToNotificationSeverity(
  errorSeverity: ErrorSeverity
): NotificationSeverity {
  switch (errorSeverity) {
    case ErrorSeverity.CRITICAL:
      return NotificationSeverity.CRITICAL;
    case ErrorSeverity.HIGH:
      return NotificationSeverity.HIGH;
    case ErrorSeverity.MEDIUM:
      return NotificationSeverity.MEDIUM;
    case ErrorSeverity.LOW:
      return NotificationSeverity.LOW;
    default:
      return NotificationSeverity.MEDIUM;
  }
}

/**
 * Gets a user-friendly text description for an error category
 * 
 * @param category The error category
 * @returns A user-friendly description of the error category
 */
export function getErrorCategoryText(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.VALIDATION:
      return 'Validation Error';
    case ErrorCategory.DATABASE:
      return 'Database Error';
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication Error';
    case ErrorCategory.AUTHORIZATION:
      return 'Authorization Error';
    case ErrorCategory.BUSINESS:
      return 'Business Rule Violation';
    case ErrorCategory.INTEGRATION:
      return 'Integration Error';
    case ErrorCategory.SYSTEM:
      return 'System Error';
    default:
      return 'Error';
  }
}

/**
 * Formats the notification message with error-specific details
 * 
 * @param template The message template with placeholders
 * @param errorData The error data to use for replacement
 * @returns Formatted message with error details
 */
export function formatErrorAlertMessage(
  template: string,
  errorData: any
): string {
  let message = template;
  
  // Replace basic placeholders
  message = message.replace(/\{\{errorId\}\}/g, errorData.errorId || 'Unknown');
  message = message.replace(/\{\{errorMessage\}\}/g, errorData.message || 'Unknown error');
  message = message.replace(/\{\{errorCategory\}\}/g, errorData.category ? getErrorCategoryText(errorData.category) : 'Error');
  message = message.replace(/\{\{errorCode\}\}/g, errorData.code || 'Unknown');
  
  // Replace timestamps if available
  if (errorData.metadata && errorData.metadata.timestamp) {
    const formattedTime = new Date(errorData.metadata.timestamp).toLocaleString();
    message = message.replace(/\{\{timestamp\}\}/g, formattedTime);
  } else if (errorData.timestamp) {
    const formattedTime = new Date(errorData.timestamp).toLocaleString();
    message = message.replace(/\{\{timestamp\}\}/g, formattedTime);
  }
  
  // Replace component information if available
  if (errorData.metadata && errorData.metadata.component) {
    message = message.replace(/\{\{component\}\}/g, errorData.metadata.component);
  } else {
    message = message.replace(/\{\{component\}\}/g, 'System');
  }
  
  // Replace service and endpoint for integration errors
  if (errorData.service) {
    message = message.replace(/\{\{service\}\}/g, errorData.service);
  }
  if (errorData.endpoint) {
    message = message.replace(/\{\{endpoint\}\}/g, errorData.endpoint);
  }
  
  // Replace details if available
  if (errorData.details && errorData.details.length > 0) {
    const detailsText = errorData.details
      .map((detail: any) => detail.message)
      .join(', ');
    message = message.replace(/\{\{details\}\}/g, detailsText);
  } else {
    message = message.replace(/\{\{details\}\}/g, 'No additional details available');
  }
  
  return message;
}

/**
 * Retrieves the appropriate notification template based on error type and severity
 * 
 * @param errorData The error data
 * @returns The notification template for the error alert
 */
export function getErrorAlertTemplate(errorData: any): NotificationTemplate {
  let template: NotificationTemplate;
  
  // Select template based on error category
  switch (errorData.category) {
    case ErrorCategory.INTEGRATION:
      template = { ...integrationErrorTemplate };
      break;
    case ErrorCategory.DATABASE:
      template = { ...databaseErrorTemplate };
      break;
    case ErrorCategory.VALIDATION:
      template = { ...validationErrorTemplate };
      break;
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
      template = { ...authErrorTemplate };
      break;
    case ErrorCategory.BUSINESS:
      template = { ...businessErrorTemplate };
      break;
    default:
      template = { ...genericErrorTemplate };
  }
  
  // Adjust severity based on error severity
  if (errorData.severity) {
    template.severity = mapErrorSeverityToNotificationSeverity(errorData.severity);
  }
  
  // Format the template message with error data
  template.message = formatErrorAlertMessage(template.message, errorData);
  template.title = formatErrorAlertMessage(template.title, errorData);
  
  // Update action URLs to include error ID
  if (template.defaultActions && template.defaultActions.length > 0) {
    template.defaultActions = template.defaultActions.map(action => ({
      ...action,
      url: formatErrorAlertMessage(action.url, errorData)
    }));
  }
  
  return template;
}