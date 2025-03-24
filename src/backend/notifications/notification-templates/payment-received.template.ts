/**
 * @fileoverview Notification templates for payment received events in the HCBS Revenue Management System.
 * 
 * This file defines various notification templates for payment events, including customized messages,
 * severity levels, and default actions based on the payment details and reconciliation status.
 */

import { 
  NotificationType, 
  NotificationSeverity, 
  NotificationTemplate 
} from '../../types/notification.types';
import { 
  ReconciliationStatus, 
  PaymentMethod 
} from '../../types/payments.types';
import { formatCurrency } from '../../utils/formatter';
import { formatDate } from '../../utils/date';

/**
 * Standard template for payment received notifications.
 * This serves as the base template for all payment notifications.
 */
export const standardPaymentReceivedTemplate: NotificationTemplate = {
  title: 'Payment Received',
  message: 'A payment of {{paymentAmount}} has been received from {{payerName}} on {{paymentDate}} via {{paymentMethod}}.',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Reconcile Payment',
      url: '/payments/{{paymentId}}/reconcile',
      actionType: 'reconcile',
      data: {}
    }
  ],
  expirationDays: 14
};

/**
 * Template for notifications when a payment is received but not yet reconciled.
 * Emphasizes the need for reconciliation.
 */
export const unreconciledPaymentTemplate: NotificationTemplate = {
  title: 'New Payment Needs Reconciliation',
  message: 'A payment of {{paymentAmount}} from {{payerName}} was received on {{paymentDate}} via {{paymentMethod}} and needs to be reconciled. Reference: {{referenceNumber}}',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Reconcile Now',
      url: '/payments/{{paymentId}}/reconcile',
      actionType: 'reconcile',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for notifications when a payment is partially reconciled.
 * Highlights that there are still unreconciled portions.
 */
export const partiallyReconciledPaymentTemplate: NotificationTemplate = {
  title: 'Payment Partially Reconciled',
  message: 'A payment of {{paymentAmount}} from {{payerName}} received on {{paymentDate}} has been partially reconciled. Further reconciliation is needed.',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.MEDIUM,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Complete Reconciliation',
      url: '/payments/{{paymentId}}/reconcile',
      actionType: 'reconcile',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for notifications when a payment is fully reconciled.
 * Informs users of successful reconciliation.
 */
export const reconciledPaymentTemplate: NotificationTemplate = {
  title: 'Payment Reconciled',
  message: 'A payment of {{paymentAmount}} from {{payerName}} received on {{paymentDate}} has been fully reconciled with {{claimCount}} claims.',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'View Reconciliation',
      url: '/payments/{{paymentId}}/details',
      actionType: 'view_details',
      data: {}
    }
  ],
  expirationDays: 30
};

/**
 * Template for notifications when a payment has reconciliation exceptions.
 * Alerts users to issues that require attention.
 */
export const exceptionPaymentTemplate: NotificationTemplate = {
  title: 'Payment Has Reconciliation Exceptions',
  message: 'A payment of {{paymentAmount}} from {{payerName}} received on {{paymentDate}} has reconciliation exceptions that require review.',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Review Exceptions',
      url: '/payments/{{paymentId}}/exceptions',
      actionType: 'review',
      data: {}
    }
  ],
  expirationDays: 7
};

/**
 * Template for notifications when a large payment is received.
 * Highlights significant payments for financial awareness.
 */
export const largePaymentTemplate: NotificationTemplate = {
  title: 'Large Payment Received',
  message: 'A large payment of {{paymentAmount}} has been received from {{payerName}} on {{paymentDate}}. This payment requires prompt reconciliation.',
  type: NotificationType.PAYMENT_RECEIVED,
  severity: NotificationSeverity.HIGH,
  defaultActions: [
    {
      label: 'View Payment',
      url: '/payments/{{paymentId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Reconcile Now',
      url: '/payments/{{paymentId}}/reconcile',
      actionType: 'reconcile',
      data: {}
    }
  ],
  expirationDays: 5
};

/**
 * Gets the appropriate notification template based on payment details
 * 
 * @param paymentData - The payment data to determine the template for
 * @returns The notification template for the payment received event
 */
export function getPaymentReceivedTemplate(paymentData: any): NotificationTemplate {
  // Payment with reconciliation exceptions
  if (paymentData.reconciliationStatus === ReconciliationStatus.EXCEPTION) {
    return exceptionPaymentTemplate;
  }
  
  // Unreconciled payment
  if (paymentData.reconciliationStatus === ReconciliationStatus.UNRECONCILED) {
    return unreconciledPaymentTemplate;
  }
  
  // Partially reconciled payment
  if (paymentData.reconciliationStatus === ReconciliationStatus.PARTIALLY_RECONCILED) {
    return partiallyReconciledPaymentTemplate;
  }
  
  // Fully reconciled payment
  if (paymentData.reconciliationStatus === ReconciliationStatus.RECONCILED) {
    return reconciledPaymentTemplate;
  }
  
  // Large payment (over $10,000)
  if (paymentData.paymentAmount >= 10000) {
    return largePaymentTemplate;
  }
  
  // Default to standard template
  return standardPaymentReceivedTemplate;
}

/**
 * Formats the notification message with payment-specific details
 * 
 * @param template - The message template containing placeholders
 * @param paymentData - The payment data to populate the message with
 * @returns Formatted message with payment details
 */
export function formatPaymentReceivedMessage(template: string, paymentData: any): string {
  let message = template;
  
  // Replace placeholders with actual values
  message = message.replace(/{{paymentId}}/g, paymentData.id || '');
  message = message.replace(/{{payerName}}/g, paymentData.payerName || 'Unknown Payer');
  message = message.replace(/{{paymentAmount}}/g, formatCurrency(paymentData.paymentAmount) || '$0.00');
  message = message.replace(/{{paymentDate}}/g, formatDate(paymentData.paymentDate) || 'Unknown Date');
  message = message.replace(/{{paymentMethod}}/g, getPaymentMethodText(paymentData.paymentMethod) || 'Unknown Method');
  message = message.replace(/{{referenceNumber}}/g, paymentData.referenceNumber || 'N/A');
  message = message.replace(/{{reconciliationStatus}}/g, getReconciliationStatusText(paymentData.reconciliationStatus) || 'Unknown Status');
  message = message.replace(/{{claimCount}}/g, (paymentData.claimCount || 0).toString());
  
  return message;
}

/**
 * Gets a user-friendly text description for a payment method
 * 
 * @param method - The payment method enum value
 * @returns User-friendly description of the payment method
 */
export function getPaymentMethodText(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.EFT:
      return 'Electronic Funds Transfer';
    case PaymentMethod.CHECK:
      return 'Check';
    case PaymentMethod.CREDIT_CARD:
      return 'Credit Card';
    case PaymentMethod.CASH:
      return 'Cash';
    case PaymentMethod.OTHER:
      return 'Other Payment Method';
    default:
      return method || 'Unknown Method';
  }
}

/**
 * Gets a user-friendly text description for a reconciliation status
 * 
 * @param status - The reconciliation status enum value
 * @returns User-friendly description of the reconciliation status
 */
export function getReconciliationStatusText(status: ReconciliationStatus): string {
  switch (status) {
    case ReconciliationStatus.UNRECONCILED:
      return 'Not Reconciled';
    case ReconciliationStatus.PARTIALLY_RECONCILED:
      return 'Partially Reconciled';
    case ReconciliationStatus.RECONCILED:
      return 'Fully Reconciled';
    case ReconciliationStatus.EXCEPTION:
      return 'Has Exceptions';
    default:
      return status || 'Unknown Status';
  }
}