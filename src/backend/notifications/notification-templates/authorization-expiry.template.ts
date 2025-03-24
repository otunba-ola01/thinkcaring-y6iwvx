/**
 * Authorization expiry notification templates for the HCBS Revenue Management System.
 * These templates are used to generate notifications for service authorizations
 * that are approaching their expiration date.
 */

import { 
  NotificationType, 
  NotificationSeverity, 
  NotificationTemplate 
} from '../../types/notification.types';
import { AuthorizationStatus } from '../../types/common.types';
import { formatDate } from '../../utils/date';
import { formatUnits } from '../../utils/formatter';

/**
 * Template for critical authorization expiry notifications (7 days or less)
 */
export const criticalExpiryTemplate: NotificationTemplate = {
  title: 'Authorization Expiring Soon',
  message: 'Critical: Authorization #{{authNumber}} for {{clientName}} will expire in {{daysToExpiration}} days on {{expirationDate}}. Service: {{serviceTypes}}. Utilization: {{utilizationPercentage}} ({{usedUnits}}/{{authorizedUnits}} units).',
  type: NotificationType.AUTHORIZATION_EXPIRY,
  severity: NotificationSeverity.CRITICAL,
  defaultActions: [
    {
      label: 'Renew Authorization',
      url: '/authorizations/{{authNumber}}/renew',
      actionType: 'renew',
      data: {}
    },
    {
      label: 'View Authorization',
      url: '/authorizations/{{authNumber}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 7 // Expires after 7 days
};

/**
 * Template for warning authorization expiry notifications (8-15 days)
 */
export const warningExpiryTemplate: NotificationTemplate = {
  title: 'Authorization Expiring Soon',
  message: 'Warning: Authorization #{{authNumber}} for {{clientName}} will expire in {{daysToExpiration}} days on {{expirationDate}}. Service: {{serviceTypes}}. Utilization: {{utilizationPercentage}} ({{usedUnits}}/{{authorizedUnits}} units).',
  type: NotificationType.AUTHORIZATION_EXPIRY,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'Renew Authorization',
      url: '/authorizations/{{authNumber}}/renew',
      actionType: 'renew',
      data: {}
    },
    {
      label: 'View Authorization',
      url: '/authorizations/{{authNumber}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 14 // Expires after 14 days
};

/**
 * Template for approaching authorization expiry notifications (16-30 days)
 */
export const approachingExpiryTemplate: NotificationTemplate = {
  title: 'Authorization Expiring',
  message: 'Authorization #{{authNumber}} for {{clientName}} will expire in {{daysToExpiration}} days on {{expirationDate}}. Service: {{serviceTypes}}. Utilization: {{utilizationPercentage}} ({{usedUnits}}/{{authorizedUnits}} units).',
  type: NotificationType.AUTHORIZATION_EXPIRY,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Authorization',
      url: '/authorizations/{{authNumber}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Acknowledge',
      url: '',
      actionType: 'acknowledge',
      data: {}
    }
  ],
  expirationDays: 30 // Expires after 30 days
};

/**
 * Retrieves the appropriate notification template based on authorization expiration timeframe
 * 
 * @param authData Authorization data object
 * @param daysToExpiration Number of days until authorization expires
 * @returns The notification template for the authorization expiry event
 */
export function getAuthorizationExpiryTemplate(
  authData: any,
  daysToExpiration: number
): NotificationTemplate {
  // Select the appropriate template based on days to expiration
  let template: NotificationTemplate;
  
  if (daysToExpiration <= 7) {
    template = criticalExpiryTemplate;
  } else if (daysToExpiration <= 15) {
    template = warningExpiryTemplate;
  } else {
    template = approachingExpiryTemplate;
  }
  
  // Create a deep copy of the template to avoid modifying the original
  const templateCopy = JSON.parse(JSON.stringify(template));
  
  // Format actions with actual data
  if (templateCopy.defaultActions) {
    templateCopy.defaultActions = templateCopy.defaultActions.map((action: any) => {
      if (action.url) {
        action.url = action.url.replace('{{authNumber}}', authData.authorizationNumber);
      }
      return action;
    });
  }
  
  return templateCopy;
}

/**
 * Formats the notification message with authorization-specific details
 * 
 * @param template Message template with placeholders
 * @param authData Authorization data object
 * @param daysToExpiration Number of days until authorization expires
 * @returns Formatted message with authorization details
 */
export function formatAuthorizationExpiryMessage(
  template: string,
  authData: any,
  daysToExpiration: number
): string {
  // Replace all placeholders in the template with actual values
  let message = template;
  
  // Basic replacements
  message = message.replace(/{{authNumber}}/g, authData.authorizationNumber || '');
  message = message.replace(/{{clientName}}/g, authData.client?.fullName || '');
  message = message.replace(/{{programName}}/g, authData.program?.name || '');
  
  // Format service types as comma-separated list
  const serviceTypes = Array.isArray(authData.serviceTypes) 
    ? authData.serviceTypes.join(', ')
    : (authData.serviceType || 'Unknown Service');
  message = message.replace(/{{serviceTypes}}/g, serviceTypes);
  
  // Format dates
  message = message.replace(/{{expirationDate}}/g, formatDate(authData.endDate) || '');
  message = message.replace(/{{daysToExpiration}}/g, daysToExpiration.toString());
  
  // Format utilization data
  message = message.replace(/{{authorizedUnits}}/g, formatUnits(authData.authorizedUnits) || '0');
  message = message.replace(/{{usedUnits}}/g, formatUnits(authData.utilization?.usedUnits) || '0');
  message = message.replace(/{{remainingUnits}}/g, formatUnits(authData.utilization?.remainingUnits) || '0');
  
  // Calculate and format utilization percentage
  let utilizationPercentage = '0%';
  if (authData.authorizedUnits && authData.authorizedUnits > 0 && authData.utilization?.usedUnits) {
    const percentage = (authData.utilization.usedUnits / authData.authorizedUnits) * 100;
    utilizationPercentage = `${Math.round(percentage)}%`;
  }
  message = message.replace(/{{utilizationPercentage}}/g, utilizationPercentage);
  
  return message;
}

/**
 * Gets a user-friendly text description for an authorization status
 * 
 * @param status Authorization status enum value
 * @returns User-friendly description of the authorization status
 */
export function getAuthorizationStatusText(status: AuthorizationStatus): string {
  switch (status) {
    case AuthorizationStatus.REQUESTED:
      return 'Requested';
    case AuthorizationStatus.APPROVED:
      return 'Approved';
    case AuthorizationStatus.ACTIVE:
      return 'Active';
    case AuthorizationStatus.EXPIRING:
      return 'Expiring Soon';
    case AuthorizationStatus.EXPIRED:
      return 'Expired';
    case AuthorizationStatus.DENIED:
      return 'Denied';
    case AuthorizationStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}