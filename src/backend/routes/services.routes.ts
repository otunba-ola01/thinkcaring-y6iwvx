import { Router } from 'express'; // version 4.18+
import { ServicesController } from '../controllers/services.controller';
import { requireAuth, requirePermissionForAction } from '../middleware/auth.middleware';
import { PermissionCategory, PermissionAction } from '../types/users.types';
import { 
  validateCreateService,
  validateUpdateService,
  validateUpdateServiceBillingStatus,
  validateUpdateServiceDocumentationStatus,
  validateServiceQuery,
  validateServiceValidationRequest,
  validateServiceImport
} from '../validation/service.validation';

// Express router instance for service management routes
const servicesRouter = Router();

/**
 * @description Get all services with optional filtering and pagination
 * @route GET /
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServices
);

/**
 * @description Get summarized service information for lists and dashboards
 * @route GET /summaries
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/summaries', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServiceSummaries
);

/**
 * @description Get services that are ready for billing
 * @route GET /billable
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/billable', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getBillableServices
);

/**
 * @description Get service metrics for dashboard and reporting
 * @route GET /metrics
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/metrics', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  ServicesController.getServiceMetrics
);

/**
 * @description Validate multiple services for billing readiness
 * @route POST /validate
 * @access Private (requires authentication and validate permission for services)
 */
servicesRouter.post('/validate', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.MANAGE),
  validateServiceValidationRequest,
  ServicesController.validateServices
);

/**
 * @description Update billing status for multiple services
 * @route PUT /bulk-billing-status
 * @access Private (requires authentication and update permission for services)
 */
servicesRouter.put('/bulk-billing-status', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.UPDATE),
  ServicesController.bulkUpdateBillingStatus
);

/**
 * @description Import services from external systems
 * @route POST /import
 * @access Private (requires authentication and create permission for services)
 */
servicesRouter.post('/import', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.CREATE),
  validateServiceImport,
  ServicesController.importServices
);

/**
 * @description Get services for a specific client
 * @route GET /client/:id
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/client/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServicesByClientId
);

/**
 * @description Get services for a specific program
 * @route GET /program/:id
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/program/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServicesByProgramId
);

/**
 * @description Get services for a specific authorization
 * @route GET /authorization/:id
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/authorization/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServicesByAuthorizationId
);

/**
 * @description Get services for a specific claim
 * @route GET /claim/:id
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/claim/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  validateServiceQuery,
  ServicesController.getServicesByClaimId
);

/**
 * @description Get a specific service by ID
 * @route GET /:id
 * @access Private (requires authentication and read permission for services)
 */
servicesRouter.get('/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.VIEW),
  ServicesController.getServiceById
);

/**
 * @description Create a new service
 * @route POST /
 * @access Private (requires authentication and create permission for services)
 */
servicesRouter.post('/', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.CREATE),
  validateCreateService,
  ServicesController.createService
);

/**
 * @description Update an existing service
 * @route PUT /:id
 * @access Private (requires authentication and update permission for services)
 */
servicesRouter.put('/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.UPDATE),
  validateUpdateService,
  ServicesController.updateService
);

/**
 * @description Mark a service as deleted (soft delete)
 * @route DELETE /:id
 * @access Private (requires authentication and delete permission for services)
 */
servicesRouter.delete('/:id', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.DELETE),
  ServicesController.deleteService
);

/**
 * @description Update a service's billing status
 * @route PUT /:id/billing-status
 * @access Private (requires authentication and update permission for services)
 */
servicesRouter.put('/:id/billing-status', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.UPDATE),
  validateUpdateServiceBillingStatus,
  ServicesController.updateServiceBillingStatus
);

/**
 * @description Update a service's documentation status
 * @route PUT /:id/documentation-status
 * @access Private (requires authentication and update permission for services)
 */
servicesRouter.put('/:id/documentation-status', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.UPDATE),
  validateUpdateServiceDocumentationStatus,
  ServicesController.updateServiceDocumentationStatus
);

/**
 * @description Validate a service for billing readiness
 * @route POST /:id/validate
 * @access Private (requires authentication and validate permission for services)
 */
servicesRouter.post('/:id/validate', 
  requireAuth,
  requirePermissionForAction(PermissionCategory.SERVICES, PermissionAction.MANAGE),
  ServicesController.validateService
);

// Export the configured Express router with service management routes
export default servicesRouter;