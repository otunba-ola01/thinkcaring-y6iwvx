/**
 * Centralizes and exports all workflow implementations for the HCBS Revenue Management System. This file serves as the entry point for accessing the various business process workflows that orchestrate complex operations across multiple services.
 * @module workflows
 */

import {
  ClaimProcessingWorkflow,
  claimProcessingWorkflow
} from './claim-processing.workflow'; // Import claim processing workflow class and singleton instance
import {
  ServiceToBillingWorkflow,
  serviceToBillingWorkflow
} from './service-to-billing.workflow'; // Import service-to-billing workflow class and singleton instance
import {
  AuthorizationManagementWorkflow,
  authorizationManagementWorkflow
} from './authorization-management.workflow'; // Import authorization management workflow class and singleton instance
import {
  PaymentReconciliationWorkflow,
  paymentReconciliationWorkflow
} from './payment-reconciliation.workflow'; // Import payment reconciliation workflow class and singleton instance
import {
  PaymentAdjustmentWorkflow,
  paymentAdjustmentWorkflow
} from './payment-adjustment.workflow'; // Import payment adjustment workflow class and singleton instance
import {
  ClaimDenialWorkflow,
  claimDenialWorkflow
} from './claim-denial.workflow'; // Import claim denial workflow class and singleton instance

/**
 * Exports the ClaimProcessingWorkflow class for use throughout the application
 * @exports ClaimProcessingWorkflow
 */
export {
  ClaimProcessingWorkflow
};

/**
 * Exports a singleton instance of the claim processing workflow
 * @exports claimProcessingWorkflow
 */
export {
  claimProcessingWorkflow
};

/**
 * Exports the ServiceToBillingWorkflow class for use throughout the application
 * @exports ServiceToBillingWorkflow
 */
export {
  ServiceToBillingWorkflow
};

/**
 * Exports a singleton instance of the service-to-billing workflow
 * @exports serviceToBillingWorkflow
 */
export {
  serviceToBillingWorkflow
};

/**
 * Exports the AuthorizationManagementWorkflow class for use throughout the application
 * @exports AuthorizationManagementWorkflow
 */
export {
  AuthorizationManagementWorkflow
};

/**
 * Exports a singleton instance of the authorization management workflow
 * @exports authorizationManagementWorkflow
 */
export {
  authorizationManagementWorkflow
};

/**
 * Exports the PaymentReconciliationWorkflow class for use throughout the application
 * @exports PaymentReconciliationWorkflow
 */
export {
  PaymentReconciliationWorkflow
};

/**
 * Exports a singleton instance of the payment reconciliation workflow
 * @exports paymentReconciliationWorkflow
 */
export {
  paymentReconciliationWorkflow
};

/**
 * Exports the PaymentAdjustmentWorkflow class for use throughout the application
 * @exports PaymentAdjustmentWorkflow
 */
export {
  PaymentAdjustmentWorkflow
};

/**
 * Exports a singleton instance of the payment adjustment workflow
 * @exports paymentAdjustmentWorkflow
 */
export {
  paymentAdjustmentWorkflow
};

/**
 * Exports the ClaimDenialWorkflow class for use throughout the application
 * @exports ClaimDenialWorkflow
 */
export {
  ClaimDenialWorkflow
};

/**
 * Exports a singleton instance of the claim denial workflow
 * @exports claimDenialWorkflow
 */
export {
  claimDenialWorkflow
};