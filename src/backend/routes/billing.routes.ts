import express from 'express'; // Import Express framework for creating router // express 4.18+
const router = express.Router();

import billingController from '../controllers/billing.controller'; // Import billing controller for handling HTTP requests
import { requireAuth, requirePermission, requirePermissionForAction } from '../middleware/auth.middleware'; // Import authentication and authorization middleware
import { PermissionCategory, PermissionAction } from '../types/users.types'; // Import permission enums for authorization middleware

// Route to validate services against billing requirements
router.post('/validate',
  requireAuth,
  requirePermission('billing:validate'),
  billingController.validateServicesForBilling
);

// Route to convert validated services into a billable claim
router.post('/convert',
  requireAuth,
  requirePermission('billing:create'),
  billingController.convertServicesToClaim
);

// Route to validate services and convert them to a claim if validation is successful
router.post('/validate-convert',
  requireAuth,
  requirePermission('billing:create'),
  billingController.validateAndConvertToClaim
);

// Route to convert multiple sets of services into claims in a batch process
router.post('/batch-convert',
  requireAuth,
  requirePermission('billing:create'),
  billingController.batchConvertServicesToClaims
);

// Route to submit a validated claim to a payer through the specified submission method
router.post('/submit',
  requireAuth,
  requirePermission('billing:submit'),
  billingController.submitClaim
);

// Route to validate a claim and submit it if validation is successful
router.post('/validate-submit',
  requireAuth,
  requirePermission('billing:submit'),
  billingController.validateAndSubmitClaim
);

// Route to submit multiple validated claims to payers in a batch process
router.post('/batch-submit',
  requireAuth,
  requirePermission('billing:submit'),
  billingController.batchSubmitClaims
);

// Route to retrieve services that are ready for billing with optional filtering
router.get('/queue',
  requireAuth,
  requirePermission('billing:read'),
  billingController.getBillingQueue
);

// Route to validate that a claim meets all requirements for submission
router.post('/claims/:id/validate-submission',
  requireAuth,
  requirePermission('billing:validate'),
  billingController.validateSubmissionRequirements
);

// Route to retrieve metrics for the billing dashboard
router.get('/dashboard',
  requireAuth,
  requirePermission('billing:read'),
  billingController.getBillingDashboardMetrics
);

export default router;