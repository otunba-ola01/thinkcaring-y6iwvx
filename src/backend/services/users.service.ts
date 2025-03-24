import { v4 as uuid } from 'uuid'; // uuid ^9.0.0
import {
  UserModel,
} from '../models/user.model';
import {
  RoleModel,
} from '../models/role.model';
import { userRepository } from '../database/repositories/user.repository';
import { roleRepository } from '../database/repositories/role.repository';
import { NotificationService } from '../services/notification.service';
import { generatePasswordResetToken } from '../security/token';
import { validatePassword } from '../security/passwordPolicy';
import { auditLog } from '../security/audit-logging';
import { logger } from '../utils/logger';
import { NotFoundError } from '../errors/not-found-error';
import { ValidationError } from '../errors/validation-error';
import { BusinessError } from '../errors/business-error';
import { PermissionError } from '../errors/permission-error';
import {
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  UserStatus,
  UserFilterParams,
  Role,
  UserPermissions,
  MfaMethod,
} from '../types/users.types';
import { UUID, PaginationParams } from '../types/common.types';

/**
 * Provides business logic for user management operations including CRUD operations, role management, and permission handling
 */
export const UsersService = {
  /**
   * Retrieves a user by their unique identifier
   * @param id - User ID
   * @returns User profile data
   */
  getUserById: async (id: UUID): Promise<UserProfile> => {
    logger.info(`Retrieving user by ID: ${id}`);
    // Find user with role by ID using UserModel.findWithRole
    const user = await UserModel.findWithRole(id);

    // If user not found, throw NotFoundError
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // Convert user to profile format using user.toProfile()
    const userProfile = user.toProfile();

    // Return user profile
    logger.debug(`User profile retrieved successfully: ${id}`);
    return userProfile;
  },

  /**
   * Retrieves a user by their email address
   * @param email - User email
   * @returns User profile data
   */
  getUserByEmail: async (email: string): Promise<UserProfile> => {
    logger.info(`Retrieving user by email: ${email}`);
    // Find user by email using UserModel.findByEmail
    const user = await UserModel.findByEmail(email);

    // If user not found, throw NotFoundError
    if (!user) {
      logger.warn(`User not found with email: ${email}`);
      throw new NotFoundError('User not found', 'email', email);
    }

    // Convert user to profile format using user.toProfile()
    const userProfile = user.toProfile();

    // Return user profile
    logger.debug(`User profile retrieved successfully: ${email}`);
    return userProfile;
  },

  /**
   * Retrieves a paginated list of users with filtering
   * @param filters - Filters to apply
   * @param pagination - Pagination parameters
   * @returns Paginated list of user profiles and total count
   */
  getUsers: async (
    filters: UserFilterParams,
    pagination: PaginationParams
  ): Promise<{ users: UserProfile[]; total: number }> => {
    logger.info('Retrieving users with filters and pagination', { filters, pagination });
    // Call userRepository.findUsers with filters and pagination
    const { data, total, page, limit, totalPages } = await userRepository.findUsers(filters, pagination);

    // Convert each user to profile format
    const users = data.map((user) => {
      const userModel = new UserModel(user);
      return userModel.toProfile();
    });

    // Return users and total count
    logger.debug(`Retrieved ${users.length} users (page ${page} of ${totalPages})`);
    return { users, total };
  },

  /**
   * Creates a new user in the system
   * @param userData - User data
   * @param createdBy - ID of the user creating the new user
   * @returns Created user profile
   */
  createUser: async (userData: CreateUserDto, createdBy: UUID | null): Promise<UserProfile> => {
    logger.info('Creating new user', { userData });
    // Validate user data (email format, required fields)

    // Check if email already exists using UserModel.findByEmail
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      logger.warn(`Email already exists: ${userData.email}`);
      throw new ValidationError('Email already exists');
    }

    // Validate role exists using RoleModel.findById
    const role = await RoleModel.findById(userData.roleId);
    if (!role) {
      logger.warn(`Role not found with ID: ${userData.roleId}`);
      throw new ValidationError('Invalid role ID');
    }

    // Validate password strength using validatePassword
    const passwordValidation = await validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      logger.warn('Invalid password', { errors: passwordValidation.errors });
      throw new ValidationError(passwordValidation.errors.join(', '));
    }

    // Create user using userRepository.createUser
    const user = await userRepository.createUser(
      {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId,
        status: UserStatus.PENDING,
        mfaEnabled: userData.mfaEnabled,
        mfaMethod: userData.mfaMethod,
        authProvider: userData.authProvider,
        contactInfo: userData.contactInfo,
        passwordResetRequired: userData.passwordResetRequired
      },
      userData.password,
      { createdBy }
    );

    // Generate password reset token if passwordResetRequired is true
    if (userData.passwordResetRequired) {
      const resetToken = generatePasswordResetToken(user.id, user.email);
      logger.info(`Password reset token generated for user: ${user.id}`);
    }

    // Send user invitation notification using NotificationService
    await NotificationService.sendUserInvitation(user.id, userData.email);
    logger.info(`User invitation sent to: ${userData.email}`);

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

    // Return created user profile
    const userModel = new UserModel(user);
    logger.debug(`User created successfully: ${user.id}`);
    return userModel.toProfile();
  },

  /**
   * Updates an existing user's information
   * @param id - User ID
   * @param userData - User data to update
   * @param updatedBy - ID of the user updating the user
   * @returns Updated user profile
   */
  updateUser: async (id: UUID, userData: UpdateUserDto, updatedBy: UUID | null): Promise<UserProfile> => {
    logger.info(`Updating user with ID: ${id}`, { userData });
    // Find user by ID using UserModel.findById
    const user = await UserModel.findById(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // If roleId is changing, validate new role exists
    if (userData.roleId && userData.roleId !== user.roleId) {
      const role = await RoleModel.findById(userData.roleId);
      if (!role) {
        logger.warn(`Role not found with ID: ${userData.roleId}`);
        throw new ValidationError('Invalid role ID');
      }
    }

    // Update user data using userRepository.update
    const updatedUser = await userRepository.update(id, userData, { updatedBy });

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

    // Return updated user profile
    const updatedUserModel = await UserModel.findWithRole(id);
    logger.debug(`User updated successfully: ${id}`);
    return updatedUserModel.toProfile();
  },

  /**
   * Updates a user's status (active, inactive, locked, etc.)
   * @param id - User ID
   * @param status - New status
   * @param updatedBy - ID of the user updating the status
   * @returns True if status was updated successfully
   */
  updateUserStatus: async (id: UUID, status: UserStatus, updatedBy: UUID | null): Promise<boolean> => {
    logger.info(`Updating user status for ID: ${id} to ${status}`);
    // Find user by ID using UserModel.findById
    const user = await UserModel.findById(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // Update user status using userRepository.updateStatus
    const updated = await userRepository.updateStatus(id, status, updatedBy);

    // If status change is significant (e.g., activation/deactivation), send notification
    if (status === UserStatus.ACTIVE || status === UserStatus.INACTIVE) {
      await NotificationService.sendAccountStatusChange(id, status);
      logger.info(`Account status change notification sent to user: ${id}`);
    }

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

    // Return result of update operation
    logger.debug(`User status updated successfully: ${id}`);
    return updated;
  },

  /**
   * Updates a user's multi-factor authentication settings
   * @param id - User ID
   * @param mfaEnabled - Whether MFA is enabled
   * @param mfaMethod - MFA method
   * @param updatedBy - ID of the user updating the MFA settings
   * @returns True if MFA settings were updated successfully
   */
  updateUserMfaSettings: async (
    id: UUID,
    mfaEnabled: boolean,
    mfaMethod: MfaMethod | null,
    updatedBy: UUID | null
  ): Promise<boolean> => {
    logger.info(`Updating MFA settings for user ID: ${id}`, { mfaEnabled, mfaMethod });
    // Find user by ID using UserModel.findById
    const user = await UserModel.findById(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // Validate MFA method if provided
    if (mfaEnabled && mfaMethod && !Object.values(MfaMethod).includes(mfaMethod)) {
      logger.warn(`Invalid MFA method: ${mfaMethod}`);
      throw new ValidationError('Invalid MFA method');
    }

    // Update MFA settings using userRepository.updateMfaSettings
    const updated = await userRepository.updateMfaSettings(id, mfaEnabled, mfaMethod, null, updatedBy);

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

    // Return result of update operation
    logger.debug(`User MFA settings updated successfully: ${id}`);
    return updated;
  },

  /**
   * Sets a user's password (admin function)
   * @param id - User ID
   * @param newPassword - New password
   * @param requireReset - Whether to require a password reset
   * @param updatedBy - ID of the user updating the password
   * @returns True if password was set successfully
   */
  setUserPassword: async (
    id: UUID,
    newPassword: string,
    requireReset: boolean,
    updatedBy: UUID | null
  ): Promise<boolean> => {
    logger.info(`Setting password for user ID: ${id}`, { requireReset });
    // Find user by ID using UserModel.findById
    const user = await UserModel.findById(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // Validate password strength using validatePassword
    const passwordValidation = await validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      logger.warn('Invalid password', { errors: passwordValidation.errors });
      throw new ValidationError(passwordValidation.errors.join(', '));
    }

    // Update user password using user.changePassword
    const updated = await userRepository.updatePassword(id, newPassword, updatedBy);

    // If requireReset is true, set user status to PASSWORD_RESET
    if (requireReset) {
      await userRepository.updateStatus(id, UserStatus.PASSWORD_RESET, updatedBy);
      logger.info(`User ${id} password reset required`);
    }

    // Log password change in audit log
    await auditLog(
      'User Password Changed',
      'User',
      id,
      'User password changed',
      null,
      { requireReset },
      { userId: updatedBy }
    );

    // Return result of update operation
    logger.debug(`User password set successfully: ${id}`);
    return updated;
  },

  /**
   * Deletes a user from the system (soft delete)
   * @param id - User ID
   * @param deletedBy - ID of the user deleting the user
   * @returns True if user was deleted successfully
   */
  deleteUser: async (id: UUID, deletedBy: UUID | null): Promise<boolean> => {
    logger.info(`Deleting user with ID: ${id}`);
    // Find user by ID using UserModel.findById
    const user = await UserModel.findById(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundError('User not found', 'user', id);
    }

    // Soft delete user by setting status to INACTIVE
    const deleted = await userRepository.updateStatus(id, UserStatus.INACTIVE, deletedBy);

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

    // Return result of update operation
    logger.debug(`User deleted successfully: ${id}`);
    return deleted;
  },

  /**
   * Retrieves all roles in the system
   * @returns Array of roles with permissions
   */
  getRoles: async (): Promise<Role[]> => {
    logger.info('Retrieving all roles');
    // Call roleRepository.findAllWithFilters to get all roles
    const roles = await roleRepository.findAllWithFilters();

    // Return roles with their permissions
    logger.debug(`Retrieved ${roles.data.length} roles`);
    return roles.data;
  },

  /**
   * Retrieves a role by its unique identifier
   * @param id - Role ID
   * @returns Role with permissions
   */
  getRoleById: async (id: UUID): Promise<Role> => {
    logger.info(`Retrieving role by ID: ${id}`);
    // Find role with permissions using RoleModel.findWithPermissions
    const role = await RoleModel.findWithPermissions(id);
    if (!role) {
      logger.warn(`Role not found with ID: ${id}`);
      throw new NotFoundError('Role not found', 'role', id);
    }

    // Return role with permissions
    logger.debug(`Role retrieved successfully: ${id}`);
    return role;
  },

  /**
   * Retrieves all permissions for a user based on their role
   * @param userId - User ID
   * @returns User permissions data
   */
  getUserPermissions: async (userId: UUID): Promise<UserPermissions> => {
    logger.info(`Retrieving permissions for user ID: ${userId}`);
    // Find user with role using UserModel.findWithRole
    const user = await UserModel.findWithRole(userId);
    if (!user) {
      logger.warn(`User not found with ID: ${userId}`);
      throw new NotFoundError('User not found', 'user', userId);
    }

    // Get role with permissions using RoleModel.findWithPermissions
    const role = await RoleModel.findWithPermissions(user.roleId);
    if (!role) {
      logger.warn(`Role not found with ID: ${user.roleId}`);
      throw new NotFoundError('Role not found', 'role', user.roleId);
    }

    // Construct UserPermissions object with user ID, role ID, role name, and permissions
    const userPermissions: UserPermissions = {
      userId: user.id,
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions
    };

    // Return user permissions
    logger.debug(`Permissions retrieved successfully for user: ${userId}`);
    return userPermissions;
  },

  /**
   * Checks if a user has a specific permission
   * @param userId - User ID
   * @param permissionName - Permission name
   * @returns True if user has the permission
   */
  checkUserHasPermission: async (userId: UUID, permissionName: string): Promise<boolean> => {
    logger.info(`Checking if user ${userId} has permission: ${permissionName}`);
    // Get user permissions using getUserPermissions
    const userPermissions = await UsersService.getUserPermissions(userId);

    // Check if the permission exists in the user's permissions
    const hasPermission = userPermissions.permissions.some(
      (permission) => permission.name === permissionName
    );

    // Return true if permission found, false otherwise
    logger.debug(`User ${userId} ${hasPermission ? 'has' : 'does not have'} permission: ${permissionName}`);
    return hasPermission;
  }
};