import express, { Router } from 'express'; // express 4.18+
import usersController from '../controllers/users.controller';
import { requireAuth, requirePermission, requirePermissionForAction } from '../middleware/auth.middleware';
import { validateParams, validateParamsAndBody } from '../middleware/validation.middleware';
import { validateCreateUser, validateUpdateUser, validateUserFilters } from '../validation/user.validation';
import { idParamSchema } from '../validation/schemas/user.schema';
import { PermissionCategory, PermissionAction } from '../types/users.types';

const router: Router = express.Router();

/**
 * @description Get a paginated list of users with optional filtering
 * @route GET /users/
 * @access Private (requires authentication and 'users:read' permission)
 */
router.get('/', requireAuth, requirePermission('users:read'), validateUserFilters, usersController.getUsers);

/**
 * @description Get the profile of the currently authenticated user
 * @route GET /users/me
 * @access Private (requires authentication)
 */
router.get('/me', requireAuth, usersController.getCurrentUser);

/**
 * @description Get a specific user by ID
 * @route GET /users/:id
 * @access Private (requires authentication and 'users:read' permission for the specific user ID)
 */
router.get('/:id', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.VIEW, 'id'), validateParams(idParamSchema), usersController.getUserById);

/**
 * @description Create a new user
 * @route POST /users/
 * @access Private (requires authentication and 'users:create' permission)
 */
router.post('/', requireAuth, requirePermission('users:create'), validateCreateUser, usersController.createUser);

/**
 * @description Update an existing user
 * @route PUT /users/:id
 * @access Private (requires authentication and 'users:update' permission for the specific user ID)
 */
router.put('/:id', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.UPDATE, 'id'), validateParams(idParamSchema), validateUpdateUser, usersController.updateUser);

/**
 * @description Update a user's status (active, inactive, locked)
 * @route PATCH /users/:id/status
 * @access Private (requires authentication and 'users:update' permission for the specific user ID)
 */
router.patch('/:id/status', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.UPDATE, 'id'), validateParams(idParamSchema), usersController.updateUserStatus);

/**
 * @description Update a user's MFA settings
 * @route PATCH /users/:id/mfa
 * @access Private (requires authentication and 'users:update' permission for the specific user ID)
 */
router.patch('/:id/mfa', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.UPDATE, 'id'), validateParams(idParamSchema), usersController.updateUserMfa);

/**
 * @description Reset a user's password (admin function)
 * @route POST /users/:id/password
 * @access Private (requires authentication and 'users:update' permission for the specific user ID)
 */
router.post('/:id/password', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.UPDATE, 'id'), validateParams(idParamSchema), usersController.resetUserPassword);

/**
 * @description Delete a user (soft delete)
 * @route DELETE /users/:id
 * @access Private (requires authentication and 'users:delete' permission)
 */
router.delete('/:id', requireAuth, requirePermission('users:delete'), validateParams(idParamSchema), usersController.deleteUser);

/**
 * @description Get all roles in the system
 * @route GET /users/roles
 * @access Private (requires authentication and 'roles:read' permission)
 */
router.get('/roles', requireAuth, requirePermission('roles:read'), usersController.getRoles);

/**
 * @description Get a specific role by ID
 * @route GET /users/roles/:id
 * @access Private (requires authentication and 'roles:read' permission)
 */
router.get('/roles/:id', requireAuth, requirePermission('roles:read'), validateParams(idParamSchema), usersController.getRoleById);

/**
 * @description Get permissions for a specific user
 * @route GET /users/:id/permissions
 * @access Private (requires authentication and 'users:read' permission for the specific user ID)
 */
router.get('/:id/permissions', requireAuth, requirePermissionForAction(PermissionCategory.USERS, PermissionAction.VIEW, 'id'), validateParams(idParamSchema), usersController.getUserPermissions);

export default router;