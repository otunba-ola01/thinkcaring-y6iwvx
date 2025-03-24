import express from 'express'; // express v4.18+
const router = express.Router();

import claimsController from '../controllers/claims.controller';
import { requireAuth, requirePermission, requirePermissionForAction } from '../middleware/auth.middleware';
import { validateCreateClaim, validateUpdateClaim, validateUpdateClaimStatus, validateSubmitClaim, validateBatchSubmitClaims, validateClaimValidationRequest, validateClaimQuery, validateClaimIdParam } from '../validation/claim.validation';
import { PermissionCategory, PermissionAction } from '../types/users.types';

// Route to get all claims with optional filtering and pagination
router.get('/', requireAuth, requirePermission('claims:read'), validateClaimQuery(), claimsController.getAllClaims);

// Route to get summarized claim information for lists and dashboards
router.get('/summaries', requireAuth, requirePermission('claims:read'), validateClaimQuery(), claimsController.getClaimSummaries);

// Route to create a new claim
router.post('/', requireAuth, requirePermission('claims:create'), validateCreateClaim(), claimsController.createClaim);

// Route to validate multiple claims for submission readiness
router.post('/validate', requireAuth, requirePermission('claims:validate'), validateClaimValidationRequest(), claimsController.batchValidateClaims);

// Route to submit multiple validated claims to payers
router.post('/submit', requireAuth, requirePermission('claims:submit'), validateBatchSubmitClaims(), claimsController.batchSubmitClaims);

// Route to validate and submit multiple claims in one operation
router.post('/validate-submit', requireAuth, requirePermission('claims:submit'), validateBatchSubmitClaims(), claimsController.batchValidateAndSubmitClaims);

// Route to refresh the status of multiple claims by checking with clearinghouses or payers
router.post('/refresh-status', requireAuth, requirePermission('claims:read'), validateClaimValidationRequest(), claimsController.batchRefreshClaimStatus);

// Route to generate an aging report for claims based on their current status and age
router.get('/aging', requireAuth, requirePermission('claims:read'), validateClaimQuery(), claimsController.getClaimAging);

// Route to get claim metrics for dashboard and reporting
router.get('/metrics', requireAuth, requirePermission('claims:read'), validateClaimQuery(), claimsController.getClaimMetrics);

// Route to get claims filtered by status
router.get('/status/:status', requireAuth, requirePermission('claims:read'), validateClaimQuery(), claimsController.getClaimsByStatus);

// Route to get a claim by ID
router.get('/:id', requireAuth, requirePermission('claims:read'), validateClaimIdParam(), claimsController.getClaim);

// Route to update an existing claim
router.put('/:id', requireAuth, requirePermissionForAction(PermissionCategory.CLAIMS, PermissionAction.UPDATE, 'claim'), validateClaimIdParam(), validateUpdateClaim(), claimsController.updateClaim);

// Route to validate a claim for submission readiness
router.post('/:id/validate', requireAuth, requirePermission('claims:validate'), validateClaimIdParam(), claimsController.validateClaim);

// Route to submit a validated claim to a payer
router.post('/:id/submit', requireAuth, requirePermission('claims:submit'), validateClaimIdParam(), validateSubmitClaim(), claimsController.submitClaim);

// Route to validate and submit a claim in one operation
router.post('/:id/validate-submit', requireAuth, requirePermission('claims:submit'), validateClaimIdParam(), validateSubmitClaim(), claimsController.validateAndSubmitClaim);

// Route to resubmit a previously submitted claim that was rejected or denied
router.post('/:id/resubmit', requireAuth, requirePermission('claims:submit'), validateClaimIdParam(), validateSubmitClaim(), claimsController.resubmitClaim);

// Route to get the current status of a claim
router.get('/:id/status', requireAuth, requirePermission('claims:read'), validateClaimIdParam(), claimsController.getClaimStatus);

// Route to update the status of a claim
router.put('/:id/status', requireAuth, requirePermissionForAction(PermissionCategory.CLAIMS, PermissionAction.UPDATE, 'claim'), validateClaimIdParam(), validateUpdateClaimStatus(), claimsController.updateClaimStatus);

// Route to refresh the status of a claim by checking with the clearinghouse or payer
router.post('/:id/refresh-status', requireAuth, requirePermission('claims:read'), validateClaimIdParam(), claimsController.refreshClaimStatus);

// Route to generate a detailed timeline of a claim's lifecycle
router.get('/:id/timeline', requireAuth, requirePermission('claims:read'), validateClaimIdParam(), claimsController.getClaimTimeline);

// Route to void a claim, marking it as no longer valid
router.post('/:id/void', requireAuth, requirePermissionForAction(PermissionCategory.CLAIMS, PermissionAction.DELETE, 'claim'), validateClaimIdParam(), claimsController.voidClaim);

// Route to create an appeal for a denied claim
router.post('/:id/appeal', requireAuth, requirePermission('claims:submit'), validateClaimIdParam(), claimsController.appealClaim);

// Route to create an adjustment claim based on an existing claim
router.post('/:id/adjust', requireAuth, requirePermission('claims:create'), validateClaimIdParam(), validateCreateClaim(), claimsController.createAdjustmentClaim);

// Route to get the complete lifecycle information for a claim
router.get('/:id/lifecycle', requireAuth, requirePermission('claims:read'), validateClaimIdParam(), claimsController.getClaimLifecycle);

export default router;