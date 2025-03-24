import { Request, Response, RequestWithParams, RequestWithQuery, RequestWithBody, RequestWithParamsAndBody, IdParam } from '../types/request.types';
import { SuccessResponse, PaginatedResponse, EmptyResponse } from '../types/response.types';
import { UserProfile, CreateUserDto, UpdateUserDto, UserStatus, UserFilterParams, Role, UserPermissions, MfaMethod } from '../types/users.types';
import { usersService } from '../services/users.service';
import { logger } from '../utils/logger'; // winston 3.8.2
import { auditLog } from '../security/audit-logging';
import { PaginationParams, UUID } from '../types/common.types';
import { express } from 'express'; // express 4.18.2

/**
 * Controller for handling user management HTTP requests in the HCBS Revenue Management System.
 * This controller implements endpoints for creating, retrieving, updating, and managing users,
 * as well as handling user roles and permissions in compliance with HIPAA requirements.
 */
const usersController = {
  /**
   * Retrieves a paginated list of users with optional filtering
   * @param req - Express request object with optional filter and pagination parameters
   * @param res - Express response object
   * @returns A paginated list of users with optional filtering
   */
  async getUsers(req: RequestWithQuery<{ filter?: UserFilterParams, pagination?: PaginationParams }>, res: Response): Promise<void> {
    try {
      // Extract filter and pagination parameters from request query
      const filter = req.query.filter || {};
      const pagination = req.query.pagination || { page: 1, limit: 25 };

      // Set default pagination if not provided
      const page = Number(pagination.page) || 1;
      const limit = Number(pagination.limit) || 25;

      // Call usersService.getUsers with filter and pagination parameters
      const { users, total } = await usersService.getUsers(filter, { page, limit });

      // Return paginated response with users and total count
      logger.info('Users retrieved successfully', { total, page, limit });
      PaginatedResponse(users, { page, limit, totalItems: total, totalPages: Math.ceil(total / limit) }, 'Users retrieved successfully').send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error('Error retrieving users', { error });
      res.status(500).send({ error: { message: 'Failed to retrieve users', details: error.message } });
    }
  },

  /**
   * Retrieves a specific user by their ID
   * @param req - Express request object with user ID in parameters
   * @param res - Express response object
   * @returns A specific user by their ID
   */
  async getUserById(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Call usersService.getUserById with the ID
      const user = await usersService.getUserById(id);

      // Return success response with user profile data
      logger.info(`User retrieved successfully: ${id}`);
      SuccessResponse(user, `User retrieved successfully: ${id}`).send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error retrieving user by ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to retrieve user with ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Retrieves the profile of the currently authenticated user
   * @param req - Express request object with authenticated user data
   * @param res - Express response object
   * @returns The profile of the currently authenticated user
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // Extract authenticated user ID from request.user
      const userId = req.user?.id;

      if (!userId) {
        logger.warn('Unauthorized access: No user ID found in request');
        res.status(401).send({ error: { message: 'Unauthorized: No user ID found in request' } });
        return;
      }

      // Call usersService.getUserById with the authenticated user ID
      const user = await usersService.getUserById(userId);

      // Return success response with user profile data
      logger.info(`Current user profile retrieved successfully: ${userId}`);
      SuccessResponse(user, `User profile retrieved successfully: ${userId}`).send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error retrieving current user profile: ${req.user?.id}`, { error });
      res.status(500).send({ error: { message: `Failed to retrieve current user profile`, details: error.message } });
    }
  },

  /**
   * Creates a new user in the system
   * @param req - Express request object with user data in body
   * @param res - Express response object
   * @returns A new user in the system
   */
  async createUser(req: RequestWithBody<CreateUserDto>, res: Response): Promise<void> {
    try {
      // Extract user data from request body
      const userData = req.body;

      // Extract authenticated user ID from request.user for audit purposes
      const createdBy = req.user?.id || null;

      // Call usersService.createUser with user data and creator ID
      const user = await usersService.createUser(userData, createdBy);

      // Return success response with created user profile
      logger.info(`User created successfully: ${user.id}`);
      SuccessResponse(user, `User created successfully: ${user.id}`).send(res);

      // Log user creation in audit log
      await auditLog(
        'User Created',
        'User',
        user.id,
        `User ${user.firstName} ${user.lastName} created`,
        null,
        { userData },
        { userId: createdBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error('Error creating user', { error });
      res.status(500).send({ error: { message: 'Failed to create user', details: error.message } });
    }
  },

  /**
   * Updates an existing user's information
   * @param req - Express request object with user ID in parameters and update data in body
   * @param res - Express response object
   * @returns An existing user's information
   */
  async updateUser(req: RequestWithParamsAndBody<IdParam, UpdateUserDto>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const userData = req.body;

      // Extract authenticated user ID from request.user for audit purposes
      const updatedBy = req.user?.id || null;

      // Call usersService.updateUser with user ID, update data, and updater ID
      const user = await usersService.updateUser(id, userData, updatedBy);

      // Return success response with updated user profile
      logger.info(`User updated successfully: ${id}`);
      SuccessResponse(user, `User updated successfully: ${id}`).send(res);

      // Log user update in audit log
      await auditLog(
        'User Updated',
        'User',
        id,
        `User ${user.firstName} ${user.lastName} updated`,
        null,
        { userData },
        { userId: updatedBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error updating user with ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to update user with ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Updates a user's status (active, inactive, locked, etc.)
   * @param req - Express request object with user ID in parameters and status in body
   * @param res - Express response object
   * @returns A user's status (active, inactive, locked, etc.)
   */
  async updateUserStatus(req: RequestWithParamsAndBody<IdParam, { status: UserStatus }>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Extract status from request body
      const { status } = req.body;

      // Extract authenticated user ID from request.user for audit purposes
      const updatedBy = req.user?.id || null;

      // Call usersService.updateUserStatus with user ID, status, and updater ID
      await usersService.updateUserStatus(id, status, updatedBy);

      // Return empty success response
      logger.info(`User status updated successfully: ${id} to ${status}`);
      EmptyResponse(`User status updated successfully: ${id} to ${status}`).send(res);

      // Log status change in audit log
      await auditLog(
        'User Status Updated',
        'User',
        id,
        `User status updated to ${status}`,
        null,
        { status },
        { userId: updatedBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error updating user status for ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to update user status for ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Updates a user's multi-factor authentication settings
   * @param req - Express request object with user ID in parameters and MFA settings in body
   * @param res - Express response object
   * @returns A user's multi-factor authentication settings
   */
  async updateUserMfa(req: RequestWithParamsAndBody<IdParam, { mfaEnabled: boolean, mfaMethod?: MfaMethod }>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Extract MFA settings from request body
      const { mfaEnabled, mfaMethod } = req.body;

      // Extract authenticated user ID from request.user for audit purposes
      const updatedBy = req.user?.id || null;

      // Call usersService.updateUserMfaSettings with user ID, MFA settings, and updater ID
      await usersService.updateUserMfaSettings(id, mfaEnabled, mfaMethod, updatedBy);

      // Return empty success response
      logger.info(`User MFA settings updated successfully: ${id} to mfaEnabled=${mfaEnabled}, mfaMethod=${mfaMethod}`);
      EmptyResponse(`User MFA settings updated successfully: ${id} to mfaEnabled=${mfaEnabled}, mfaMethod=${mfaMethod}`).send(res);

      // Log MFA settings change in audit log
      await auditLog(
        'User MFA Settings Updated',
        'User',
        id,
        `User MFA settings updated: mfaEnabled=${mfaEnabled}, mfaMethod=${mfaMethod}`,
        null,
        { mfaEnabled, mfaMethod },
        { userId: updatedBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error updating user MFA settings for ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to update user MFA settings for ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Resets a user's password (admin function)
   * @param req - Express request object with user ID in parameters and new password in body
   * @param res - Express response object
   * @returns A user's password (admin function)
   */
  async resetUserPassword(req: RequestWithParamsAndBody<IdParam, { newPassword: string, requireReset: boolean }>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Extract password data from request body
      const { newPassword, requireReset } = req.body;

      // Extract authenticated user ID from request.user for audit purposes
      const updatedBy = req.user?.id || null;

      // Call usersService.setUserPassword with user ID, new password, requireReset flag, and updater ID
      await usersService.setUserPassword(id, newPassword, requireReset, updatedBy);

      // Return empty success response
      logger.info(`User password reset successfully: ${id}, requireReset=${requireReset}`);
      EmptyResponse(`User password reset successfully: ${id}, requireReset=${requireReset}`).send(res);

      // Log password reset in audit log
      await auditLog(
        'User Password Changed',
        'User',
        id,
        'User password changed',
        null,
        { requireReset },
        { userId: updatedBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error resetting user password for ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to reset user password for ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Deletes a user from the system (soft delete)
   * @param req - Express request object with user ID in parameters
   * @param res - Express response object
   * @returns A user from the system (soft delete)
   */
  async deleteUser(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Extract authenticated user ID from request.user for audit purposes
      const deletedBy = req.user?.id || null;

      // Call usersService.deleteUser with user ID and deleter ID
      await usersService.deleteUser(id, deletedBy);

      // Return empty success response
      logger.info(`User deleted successfully: ${id}`);
      EmptyResponse(`User deleted successfully: ${id}`).send(res);

      // Log user deletion in audit log
      await auditLog(
        'User Deleted',
        'User',
        id,
        'User account deleted',
        null,
        null,
        { userId: deletedBy }
      );
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error deleting user with ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to delete user with ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Retrieves all roles in the system
   * @param req - Express request object
   * @param res - Express response object
   * @returns All roles in the system
   */
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      // Call usersService.getRoles to get all roles
      const roles = await usersService.getRoles();

      // Return success response with roles data
      logger.info('Roles retrieved successfully', { total: roles.length });
      SuccessResponse(roles, 'Roles retrieved successfully').send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error('Error retrieving roles', { error });
      res.status(500).send({ error: { message: 'Failed to retrieve roles', details: error.message } });
    }
  },

  /**
   * Retrieves a specific role by its ID
   * @param req - Express request object with role ID in parameters
   * @param res - Express response object
   * @returns A specific role by its ID
   */
  async getRoleById(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    try {
      // Extract role ID from request parameters
      const { id } = req.params;

      // Call usersService.getRoleById with the ID
      const role = await usersService.getRoleById(id);

      // Return success response with role data
      logger.info(`Role retrieved successfully: ${id}`);
      SuccessResponse(role, `Role retrieved successfully: ${id}`).send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error retrieving role by ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to retrieve role with ID: ${req.params.id}`, details: error.message } });
    }
  },

  /**
   * Retrieves permissions for a specific user
   * @param req - Express request object with user ID in parameters
   * @param res - Express response object
   * @returns Permissions for a specific user
   */
  async getUserPermissions(req: RequestWithParams<IdParam>, res: Response): Promise<void> {
    try {
      // Extract user ID from request parameters
      const { id } = req.params;

      // Call usersService.getUserPermissions with the ID
      const permissions = await usersService.getUserPermissions(id);

      // Return success response with user permissions data
      logger.info(`Permissions retrieved successfully for user: ${id}`);
      SuccessResponse(permissions, `Permissions retrieved successfully for user: ${id}`).send(res);
    } catch (error) {
      // Log error and send appropriate error response if operation fails
      logger.error(`Error retrieving permissions for user ID: ${req.params.id}`, { error });
      res.status(500).send({ error: { message: `Failed to retrieve permissions for user ID: ${req.params.id}`, details: error.message } });
    }
  }
};

export default usersController;