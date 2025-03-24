/**
 * Notification templates for claim status changes in the HCBS Revenue Management System.
 * Provides templates for different claim status transitions with customized messages,
 * severity levels, and default actions based on the claim details and status type.
 */

import { NotificationType, NotificationSeverity, NotificationTemplate } from '../../types/notification.types';
import { ClaimStatus, DenialReason } from '../../types/claims.types';
import { formatCurrency } from '../../utils/formatter';
import { formatDate } from '../../utils/date';

/**
 * Standard template for claim status change notifications
 */
export const standardClaimStatusTemplate: NotificationTemplate = {
  title: 'Claim Status Update',
  message: 'Claim #{{claimNumber}} for {{clientName}} has changed status to {{status}}.',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is submitted
 */
export const submittedClaimTemplate: NotificationTemplate = {
  title: 'Claim Submitted',
  message: 'Claim #{{claimNumber}} for {{clientName}} has been submitted to {{payerName}} on {{submissionDate}}.',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Track Status',
      url: '/claims/tracking?claimId={{claimId}}',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is acknowledged by the payer
 */
export const acknowledgedClaimTemplate: NotificationTemplate = {
  title: 'Claim Acknowledged',
  message: 'Claim #{{claimNumber}} for {{clientName}} has been acknowledged by {{payerName}}.',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Track Status',
      url: '/claims/tracking?claimId={{claimId}}',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is paid
 */
export const paidClaimTemplate: NotificationTemplate = {
  title: 'Claim Paid',
  message: 'Claim #{{claimNumber}} for {{clientName}} has been paid by {{payerName}} on {{adjudicationDate}}. Amount: {{amount}}',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Reconcile Payment',
      url: '/payments/reconcile?claimId={{claimId}}',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is partially paid
 */
export const partialPaidClaimTemplate: NotificationTemplate = {
  title: 'Claim Partially Paid',
  message: 'Claim #{{claimNumber}} for {{clientName}} has been partially paid by {{payerName}} on {{adjudicationDate}}. Amount: {{amount}}',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Reconcile Payment',
      url: '/payments/reconcile?claimId={{claimId}}',
      actionType: 'navigate',
      data: {}
    },
    {
      label: 'Review Adjustments',
      url: '/claims/{{claimId}}#adjustments',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is denied
 */
export const deniedClaimTemplate: NotificationTemplate = {
  title: 'Claim Denied',
  message: 'Claim #{{claimNumber}} for {{clientName}} has been denied by {{payerName}} on {{adjudicationDate}}. Reason: {{denialReason}}',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Appeal Claim',
      url: '/claims/{{claimId}}/appeal',
      actionType: 'navigate',
      data: {}
    },
    {
      label: 'Review Documentation',
      url: '/claims/{{claimId}}#documentation',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is appealed
 */
export const appealedClaimTemplate: NotificationTemplate = {
  title: 'Claim Appealed',
  message: 'Appeal for claim #{{claimNumber}} for {{clientName}} has been submitted to {{payerName}}.',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Track Appeal',
      url: '/claims/{{claimId}}/appeal-status',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is finally denied after appeal
 */
export const finalDeniedClaimTemplate: NotificationTemplate = {
  title: 'Claim Finally Denied',
  message: 'The appeal for claim #{{claimNumber}} for {{clientName}} has been denied by {{payerName}}. This is a final determination.',
  type: NotificationType.CLAIM_STATUS,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Write Off',
      url: '/claims/{{claimId}}/write-off',
      actionType: 'navigate',
      data: {}
    },
    {
      label: 'Review Denial Details',
      url: '/claims/{{claimId}}#denial-details',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a claim is approaching filing deadline
 */
export const filingDeadlineTemplate: NotificationTemplate = {
  title: 'Filing Deadline Approaching',
  message: 'Claim #{{claimNumber}} for {{clientName}} is approaching its filing deadline. Action required within 5 days.',
  type: NotificationType.FILING_DEADLINE,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Claim',
      url: '/claims/{{claimId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Submit Claim',
      url: '/claims/{{claimId}}/submit',
      actionType: 'navigate',
      data: {}
    }
  ],
  expirationDays: 5
};

/**
 * Gets a user-friendly text description for a claim status
 * 
 * @param status - The claim status enum value
 * @returns User-friendly description of the claim status
 */
export function getClaimStatusText(status: ClaimStatus): string {
  switch (status) {
    case ClaimStatus.DRAFT:
      return 'Draft';
    case ClaimStatus.VALIDATED:
      return 'Validated';
    case ClaimStatus.SUBMITTED:
      return 'Submitted';
    case ClaimStatus.ACKNOWLEDGED:
      return 'Acknowledged';
    case ClaimStatus.PENDING:
      return 'Pending';
    case ClaimStatus.PAID:
      return 'Paid';
    case ClaimStatus.PARTIAL_PAID:
      return 'Partially Paid';
    case ClaimStatus.DENIED:
      return 'Denied';
    case ClaimStatus.APPEALED:
      return 'Appealed';
    case ClaimStatus.VOID:
      return 'Voided';
    case ClaimStatus.FINAL_DENIED:
      return 'Finally Denied';
    default:
      return status;
  }
}

/**
 * Gets a user-friendly text description for a denial reason
 * 
 * @param reason - The denial reason enum value
 * @returns User-friendly description of the denial reason
 */
export function getDenialReasonText(reason: DenialReason): string {
  switch (reason) {
    case DenialReason.DUPLICATE_CLAIM:
      return 'Duplicate claim submission';
    case DenialReason.SERVICE_NOT_COVERED:
      return 'Service not covered under plan';
    case DenialReason.AUTHORIZATION_MISSING:
      return 'Missing service authorization';
    case DenialReason.AUTHORIZATION_INVALID:
      return 'Invalid or expired authorization';
    case DenialReason.CLIENT_INELIGIBLE:
      return 'Client not eligible for service';
    case DenialReason.PROVIDER_INELIGIBLE:
      return 'Provider not eligible for service';
    case DenialReason.TIMELY_FILING:
      return 'Claim not submitted within timely filing limits';
    case DenialReason.INVALID_CODING:
      return 'Invalid procedure or diagnosis coding';
    case DenialReason.MISSING_INFORMATION:
      return 'Missing required information';
    case DenialReason.OTHER:
      return 'Other reason - see details';
    default:
      return 'Unknown reason';
  }
}

/**
 * Formats the notification message with claim-specific details
 * 
 * @param template - Template string with placeholders
 * @param claimData - Claim data to insert into the template
 * @returns Formatted message with claim details
 */
export function formatClaimStatusMessage(template: string, claimData: any): string {
  let message = template;
  
  // Replace placeholders with actual values
  if (claimData.id) {
    message = message.replace(/{{claimId}}/g, claimData.id);
  }
  
  if (claimData.claimNumber) {
    message = message.replace(/{{claimNumber}}/g, claimData.claimNumber);
  }
  
  if (claimData.clientName) {
    message = message.replace(/{{clientName}}/g, claimData.clientName);
  }
  
  if (claimData.payerName) {
    message = message.replace(/{{payerName}}/g, claimData.payerName);
  }
  
  if (claimData.totalAmount !== undefined) {
    message = message.replace(/{{amount}}/g, formatCurrency(claimData.totalAmount));
  }
  
  if (claimData.claimStatus) {
    message = message.replace(/{{status}}/g, getClaimStatusText(claimData.claimStatus));
  }
  
  if (claimData.submissionDate) {
    message = message.replace(/{{submissionDate}}/g, formatDate(claimData.submissionDate) || '');
  }
  
  if (claimData.adjudicationDate) {
    message = message.replace(/{{adjudicationDate}}/g, formatDate(claimData.adjudicationDate) || '');
  }
  
  if (claimData.denialReason) {
    message = message.replace(/{{denialReason}}/g, getDenialReasonText(claimData.denialReason));
  }
  
  return message;
}

/**
 * Retrieves the appropriate notification template based on claim status change
 * 
 * @param claimData - Claim data containing status and other details
 * @returns The notification template for the claim status change event
 */
export function getClaimStatusTemplate(claimData: any): NotificationTemplate {
  if (!claimData || !claimData.claimStatus) {
    return standardClaimStatusTemplate;
  }
  
  // Select appropriate template based on claim status
  switch (claimData.claimStatus) {
    case ClaimStatus.DENIED:
      return deniedClaimTemplate;
    case ClaimStatus.PAID:
      return paidClaimTemplate;
    case ClaimStatus.PARTIAL_PAID:
      return partialPaidClaimTemplate;
    case ClaimStatus.SUBMITTED:
      return submittedClaimTemplate;
    case ClaimStatus.ACKNOWLEDGED:
      return acknowledgedClaimTemplate;
    case ClaimStatus.APPEALED:
      return appealedClaimTemplate;
    case ClaimStatus.FINAL_DENIED:
      return finalDeniedClaimTemplate;
    default:
      return standardClaimStatusTemplate;
  }
}