/**
 * Defines API routes for client management in the HCBS Revenue Management System.
 * This file configures Express router with endpoints for client CRUD operations,
 * program enrollments, insurance management, and client data retrieval, applying
 * appropriate validation, authentication, and authorization middleware.
 */

import { Router } from 'express'; // express v4.18+
import { 
  requireAuth, 
  requirePermissionForAction 
} from '../middleware/auth.middleware'; // Authentication and authorization middleware
import { 
  PermissionCategory, 
  PermissionAction 
} from '../types/users.types'; // Permission enums for authorization
import { 
  validateCreateClient, 
  validateUpdateClient, 
  validateUpdateClientStatus,
  validateCreateClientProgram,
  validateUpdateClientProgram,
  validateCreateClientInsurance,
  validateUpdateClientInsurance,
  validateClientQuery,
  validateClientIdParam
} from '../validation/client.validation'; // Validation middleware for client-related requests
import { 
  getClients, 
  getClientById, 
  getClientByMedicaidId,
  createClient, 
  updateClient, 
  updateClientStatus,
  deleteClient, 
  addClientProgram, 
  updateClientProgram,
  removeClientProgram, 
  addClientInsurance, 
  updateClientInsurance,
  removeClientInsurance,
  getClientSummaries,
  getClientsByProgram,
  getClientsByPayer,
  getClientStatusCounts
} from '../controllers/clients.controller'; // Controller functions for handling client-related requests

// Express router instance for client management routes
const router = Router();

/**
 * Get paginated list of clients with optional filtering
 * @route GET /
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 * @middleware validateClientQuery - Validates query parameters
 */
router.get(
  '/',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  validateClientQuery(),
  getClients
);

/**
 * Get client summaries for dropdowns and lists
 * @route GET /summaries
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 */
router.get(
  '/summaries',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  getClientSummaries
);

/**
 * Get counts of clients grouped by status
 * @route GET /status-counts
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 */
router.get(
  '/status-counts',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  getClientStatusCounts
);

/**
 * Get clients enrolled in a specific program
 * @route GET /program/:programId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 */
router.get(
  '/program/:programId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  getClientsByProgram
);

/**
 * Get clients with insurance from a specific payer
 * @route GET /payer/:payerId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 */
router.get(
  '/payer/:payerId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  getClientsByPayer
);

/**
 * Create a new client
 * @route POST /
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to create clients
 * @middleware validateCreateClient - Validates request body
 */
router.post(
  '/',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.CREATE, null),
  validateCreateClient(),
  createClient
);

/**
 * Get client by ID
 * @route GET /:id
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 * @middleware validateClientIdParam - Validates client ID parameter
 */
router.get(
  '/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  validateClientIdParam(),
  getClientById
);

/**
 * Get client by Medicaid ID
 * @route GET /medicaid/:medicaidId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to view clients
 */
router.get(
  '/medicaid/:medicaidId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.VIEW, null),
  getClientByMedicaidId
);

/**
 * Update an existing client
 * @route PUT /:id
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateUpdateClient - Validates request body and client ID parameter
 */
router.put(
  '/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateUpdateClient(),
  updateClient
);

/**
 * Update a client's status
 * @route PATCH /:id/status
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateUpdateClientStatus - Validates request body and client ID parameter
 */
router.patch(
  '/:id/status',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateUpdateClientStatus(),
  updateClientStatus
);

/**
 * Mark a client as inactive (soft delete)
 * @route DELETE /:id
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to delete clients
 * @middleware validateClientIdParam - Validates client ID parameter
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.DELETE, null),
  validateClientIdParam(),
  deleteClient
);

/**
 * Add a program enrollment for a client
 * @route POST /:id/programs
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateCreateClientProgram - Validates request body and client ID parameter
 */
router.post(
  '/:id/programs',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateCreateClientProgram(),
  addClientProgram
);

/**
 * Update a client's program enrollment
 * @route PUT /:id/programs/:programId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateUpdateClientProgram - Validates request body and client ID parameter
 */
router.put(
  '/:id/programs/:programId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateUpdateClientProgram(),
  updateClientProgram
);

/**
 * Remove a program enrollment for a client
 * @route DELETE /:id/programs/:programId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 */
router.delete(
  '/:id/programs/:programId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  removeClientProgram
);

/**
 * Add insurance information for a client
 * @route POST /:id/insurances
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateCreateClientInsurance - Validates request body and client ID parameter
 */
router.post(
  '/:id/insurances',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateCreateClientInsurance(),
  addClientInsurance
);

/**
 * Update a client's insurance information
 * @route PUT /:id/insurances/:insuranceId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 * @middleware validateUpdateClientInsurance - Validates request body and client ID parameter
 */
router.put(
  '/:id/insurances/:insuranceId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  validateUpdateClientInsurance(),
  updateClientInsurance
);

/**
 * Remove insurance information for a client
 * @route DELETE /:id/insurances/:insuranceId
 * @middleware requireAuth - Ensures user is authenticated
 * @middleware requirePermissionForAction - Checks if user has permission to update clients
 */
router.delete(
  '/:id/insurances/:insuranceId',
  requireAuth,
  requirePermissionForAction(PermissionCategory.CLIENTS, PermissionAction.UPDATE, null),
  removeClientInsurance
);

// Export configured Express router with all client management routes
export default router;