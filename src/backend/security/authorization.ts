/**
 * Implements the authorization system for the HCBS Revenue Management System. This module
 * provides functions for checking user permissions, validating access to resources, and
 * enforcing role-based access control throughout the application. It works in conjunction
 * with the role-based access control system to ensure users can only access data and
 * perform actions they are authorized for.
 *
 * @module authorization
 */

import { UUID } from '../types/common.types'; // Import UUID type for user and resource identifiers
import { AuthenticatedUser } from '../types/auth.types'; // Import AuthenticatedUser interface for user permission checking
import { UserRole, PermissionCategory, PermissionAction } from '../types/users.types'; // Import UserRole enum for role-based checks
import { RBACManager } from './role-based-access'; // Import RBAC manager for permission checking
import { PermissionError } from '../errors/permission-error'; // Import PermissionError for throwing authorization errors
import { logger } from '../utils/logger'; // Import logger for logging authorization events
import { auditLog } from './audit-logging'; // Import audit logging functionality for authorization events
import { config } from '../config'; // Import configuration settings for authorization

/**
 * Checks if a user has a specific permission
 * @param user Authenticated user or null
 * @param permission Permission to check
 * @returns True if the user has the permission, false otherwise
 */
export const hasPermission = (user: AuthenticatedUser | null, permission: string): boolean => {
  // If user is null or undefined, return false
  if (!user) {
    logger.debug('Permission check failed: User is null or undefined', { permission });
    return false;
  }

  // If user has no permissions array, return false
  if (!user.permissions) {
    logger.debug('Permission check failed: User has no permissions', { permission, userId: user.id });
    return false;
  }

  // Check if the user's permissions array includes the specified permission
  const hasDirectPermission = user.permissions.includes(permission);
  if (hasDirectPermission) {
    logger.debug('Permission check successful: User has direct permission', { permission, userId: user.id });
    return true;
  }

  // Check for wildcard permissions that would grant access
  const hasWildcardPermission = user.permissions.some(perm => {
    const [category, action] = permission.split(':');
    return perm === `${category}:*` || perm === '*:*';
  });

  // Log the permission check result
  logger.debug(`Permission check result: ${hasWildcardPermission}`, {
    permission,
    userId: user.id,
    hasDirectPermission,
    hasWildcardPermission
  });

  // Return the result of the permission check
  return hasWildcardPermission;
};

/**
 * Checks if a user has permission for a specific category, action, and optional resource
 * @param user Authenticated user or null
 * @param category Permission category
 * @param action Permission action
 * @param resource Optional resource specifier
 * @returns True if the user has the permission, false otherwise
 */
export const hasPermissionForAction = async (
  user: AuthenticatedUser | null,
  category: PermissionCategory,
  action: PermissionAction,
  resource: string | null = null
): Promise<boolean> => {
  // If user is null or undefined, return false
  if (!user) {
    logger.debug('Permission check failed: User is null or undefined', { category, action, resource });
    return false;
  }

  // Get the RBAC manager instance
  const rbacManager = RBACManager.getInstance();

  // Build the permission name from category, action, and resource
  const permissionName = buildPermissionName(category, action, resource);

  // Check if the user has the specific permission using hasPermission
  if (hasPermission(user, permissionName)) {
    logger.debug('Permission check successful: User has specific permission', {
      permissionName,
      userId: user.id,
      categoryId: category,
      actionId: action,
      resourceId: resource
    });
    return true;
  }

  // If resource is provided, check for wildcard permission for the category and action
  if (resource) {
    const wildcardPermission = buildPermissionName(category, action, null);
    if (hasPermission(user, wildcardPermission)) {
      logger.debug('Permission check successful: User has wildcard permission', {
        wildcardPermission,
        userId: user.id,
        categoryId: category,
        actionId: action,
        resourceId: resource
      });
      return true;
    }
  }

  // Use RBAC manager to check permission for the action
  const hasRolePermission = await rbacManager.checkPermissionForAction(user.roleId, category, action, resource);

  // Log the permission check result
  logger.debug(`Permission check result: ${hasRolePermission}`, {
    permissionName,
    userId: user.id,
    categoryId: category,
    actionId: action,
    resourceId: resource,
    hasRolePermission
  });

  // Return the result of the permission check
  return hasRolePermission;
};

/**
 * Checks if a user can access a specific resource based on ownership and permissions
 * @param user Authenticated user or null
 * @param category Permission category
 * @param action Permission action
 * @param resourceId Resource ID
 * @param ownerId Optional owner ID
 * @returns True if the user can access the resource, false otherwise
 */
export const canAccessResource = async (
  user: AuthenticatedUser | null,
  category: PermissionCategory,
  action: PermissionAction,
  resourceId: string,
  ownerId: string | null = null
): Promise<boolean> => {
  // If user is null or undefined, return false
  if (!user) {
    logger.debug('Resource access check failed: User is null or undefined', {
      category,
      action,
      resourceId,
      ownerId
    });
    return false;
  }

  // If user is an administrator, return true (administrators can access all resources)
  if (await isAdministrator(user)) {
    logger.debug('Resource access check: User is administrator, access granted', {
      category,
      action,
      resourceId,
      ownerId,
      userId: user.id
    });
    return true;
  }

  // If ownerId is provided and matches the user's ID, return true (users can access their own resources)
  if (ownerId && user.id === ownerId) {
    logger.debug('Resource access check: User is owner, access granted', {
      category,
      action,
      resourceId,
      ownerId,
      userId: user.id
    });
    return true;
  }

  // Check if the user has permission for the specific resource using hasPermissionForAction
  const hasActionPermission = await hasPermissionForAction(user, category, action, resourceId);

  // Log the resource access check result
  logger.debug(`Resource access check result: ${hasActionPermission}`, {
    category,
    action,
    resourceId,
    ownerId,
    userId: user.id,
    hasActionPermission
  });

  // Return the result of the resource access check
  return hasActionPermission;
};

/**
 * Checks if a user has the administrator role
 * @param user Authenticated user or null
 * @returns True if the user is an administrator, false otherwise
 */
export const isAdministrator = async (user: AuthenticatedUser | null): Promise<boolean> => {
  // If user is null or undefined, return false
  if (!user) {
    logger.debug('Administrator check failed: User is null or undefined');
    return false;
  }

  // Get the RBAC manager instance
  const rbacManager = RBACManager.getInstance();

  // Retrieve the user's role using the role ID
  const role = await rbacManager.getRole(user.roleId);

  // Check if the role name matches the ADMINISTRATOR role
  const isAdmin = role?.name === UserRole.ADMINISTRATOR;

  // Log the administrator check result
  logger.debug(`Administrator check result: ${isAdmin}`, {
    userId: user.id,
    roleId: user.roleId,
    roleName: role?.name
  });

  // Return the result of the administrator check
  return isAdmin;
};

/**
 * Enforces that a user has a specific permission, throwing an error if not
 * @param user Authenticated user or null
 * @param permission Permission to check
 * @param errorMessage Error message to use if the permission is missing
 */
export const enforcePermission = (user: AuthenticatedUser | null, permission: string, errorMessage: string): void => {
  // If user is null or undefined, throw PermissionError.insufficientPermissions
  if (!user) {
    logger.warn('Permission enforcement failed: User is null or undefined', { permission });
    throw PermissionError.insufficientPermissions(errorMessage, [permission]);
  }

  // Check if the user has the specified permission using hasPermission
  if (!hasPermission(user, permission)) {
    logger.warn('Permission enforcement failed: User lacks permission', {
      permission,
      userId: user.id
    });
    throw PermissionError.insufficientPermissions(errorMessage, [permission]);
  }

  // Log the permission enforcement result
  logger.info('Permission enforcement successful', {
    permission,
    userId: user.id
  });
};

/**
 * Enforces that a user has permission for a specific action, throwing an error if not
 * @param user Authenticated user or null
 * @param category Permission category
 * @param action Permission action
 * @param resource Optional resource specifier
 * @param errorMessage Error message to use if the permission is missing
 */
export const enforcePermissionForAction = async (
  user: AuthenticatedUser | null,
  category: PermissionCategory,
  action: PermissionAction,
  resource: string | null,
  errorMessage: string
): Promise<void> => {
  // If user is null or undefined, throw PermissionError.insufficientPermissions
  if (!user) {
    logger.warn('Permission enforcement failed: User is null or undefined', {
      category,
      action,
      resource
    });
    throw PermissionError.insufficientPermissions(errorMessage, [buildPermissionName(category, action, resource)]);
  }

  // Check if the user has permission for the action using hasPermissionForAction
  if (!await hasPermissionForAction(user, category, action, resource)) {
    logger.warn('Permission enforcement failed: User lacks permission for action', {
      category,
      action,
      resource,
      userId: user.id
    });
    throw PermissionError.insufficientPermissions(errorMessage, [buildPermissionName(category, action, resource)]);
  }

  // Log the permission enforcement result
  logger.info('Permission enforcement successful for action', {
    category,
    action,
    resource,
    userId: user.id
  });
};

/**
 * Enforces that a user can access a specific resource, throwing an error if not
 * @param user Authenticated user or null
 * @param category Permission category
 * @param action Permission action
 * @param resourceId Resource ID
 * @param ownerId Optional owner ID
 * @param resourceType Resource type
 * @param errorMessage Error message to use if access is denied
 */
export const enforceResourceAccess = async (
  user: AuthenticatedUser | null,
  category: PermissionCategory,
  action: PermissionAction,
  resourceId: string,
  ownerId: string | null,
  resourceType: string,
  errorMessage: string
): Promise<void> => {
  // If user is null or undefined, throw PermissionError.resourceAccessDenied
  if (!user) {
    logger.warn('Resource access enforcement failed: User is null or undefined', {
      category,
      action,
      resourceId,
      ownerId,
      resourceType
    });
    throw PermissionError.resourceAccessDenied(errorMessage, resourceType, resourceId);
  }

  // Check if the user can access the resource using canAccessResource
  if (!await canAccessResource(user, category, action, resourceId, ownerId)) {
    logger.warn('Resource access enforcement failed: User lacks access', {
      category,
      action,
      resourceId,
      ownerId,
      resourceType,
      userId: user.id
    });
    throw PermissionError.resourceAccessDenied(errorMessage, resourceType, resourceId);
  }

  // Log the resource access enforcement result
  logger.info('Resource access enforcement successful', {
    category,
    action,
    resourceId,
    ownerId,
    resourceType,
    userId: user.id
  });
};

/**
 * Enforces that a user has the administrator role, throwing an error if not
 * @param user Authenticated user or null
 * @param errorMessage Error message to use if the role is missing
 */
export const enforceAdministrator = async (user: AuthenticatedUser | null, errorMessage: string): Promise<void> => {
  // If user is null or undefined, throw PermissionError.roleRequired
  if (!user) {
    logger.warn('Administrator enforcement failed: User is null or undefined');
    throw PermissionError.roleRequired(errorMessage, [UserRole.ADMINISTRATOR]);
  }

  // Check if the user is an administrator using isAdministrator
  if (!await isAdministrator(user)) {
    logger.warn('Administrator enforcement failed: User lacks administrator role', { userId: user.id });
    throw PermissionError.roleRequired(errorMessage, [UserRole.ADMINISTRATOR]);
  }

  // Log the administrator enforcement result
  logger.info('Administrator enforcement successful', { userId: user.id });
};

/**
 * Builds a permission name string from category, action, and optional resource
 * @param category Permission category
 * @param action Permission action
 * @param resource Optional resource specifier
 * @returns Formatted permission name string
 */
export const buildPermissionName = (category: PermissionCategory, action: PermissionAction, resource: string | null = null): string => {
  // Convert category and action to uppercase
  const categoryUpper = category.toUpperCase();
  const actionUpper = action.toUpperCase();

  // If resource is provided, format as 'CATEGORY:ACTION:RESOURCE'
  if (resource) {
    return `${categoryUpper}:${actionUpper}:${resource.toUpperCase()}`;
  }

  // If no resource is provided, format as 'CATEGORY:ACTION'
  return `${categoryUpper}:${actionUpper}`;
};

/**
 * Singleton class that manages authorization checks and enforcement throughout the application
 */
export class AuthorizationManager {
  private static instance: AuthorizationManager | null = null;
  private rbacManager: RBACManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Get the RBAC manager instance
    this.rbacManager = RBACManager.getInstance();

    // Initialize the rbacManager property
  }

  /**
   * Gets the singleton instance of AuthorizationManager
   * @returns The singleton instance
   */
  public static getInstance(): AuthorizationManager {
    // If instance is null, create new AuthorizationManager
    if (!AuthorizationManager.instance) {
      AuthorizationManager.instance = new AuthorizationManager();
    }
    // Return the instance
    return AuthorizationManager.instance;
  }

  /**
   * Checks if a user has a specific permission
   * @param user Authenticated user or null
   * @param permission Permission to check
   * @returns True if the user has the permission
   */
  public checkPermission(user: AuthenticatedUser | null, permission: string): boolean {
    // Call the hasPermission function with user and permission
    return hasPermission(user, permission);
    // Return the result
  }

  /**
   * Checks if a user has permission for a specific action
   * @param user Authenticated user or null
   * @param category Permission category
   * @param action Permission action
   * @param resource Optional resource specifier
   * @returns True if the user has the permission
   */
  public async checkPermissionForAction(
    user: AuthenticatedUser | null,
    category: PermissionCategory,
    action: PermissionAction,
    resource: string | null = null
  ): Promise<boolean> {
    // Call the hasPermissionForAction function with user, category, action, and resource
    return await hasPermissionForAction(user, category, action, resource);
    // Return the result
  }

  /**
   * Checks if a user can access a specific resource
   * @param user Authenticated user or null
   * @param category Permission category
   * @param action Permission action
   * @param resourceId Resource ID
   * @param ownerId Optional owner ID
   * @returns True if the user can access the resource
   */
  public async checkResourceAccess(
    user: AuthenticatedUser | null,
    category: PermissionCategory,
    action: PermissionAction,
    resourceId: string,
    ownerId: string | null = null
  ): Promise<boolean> {
    // Call the canAccessResource function with user, category, action, resourceId, and ownerId
    return await canAccessResource(user, category, action, resourceId, ownerId);
    // Return the result
  }

  /**
   * Enforces that a user has a specific permission
   * @param user Authenticated user or null
   * @param permission Permission to check
   * @param errorMessage Error message to use if check fails
   */
  public enforcePermission(user: AuthenticatedUser | null, permission: string, errorMessage: string): void {
    // Call the enforcePermission function with user, permission, and errorMessage
    enforcePermission(user, permission, errorMessage);
  }

  /**
   * Enforces that a user has permission for a specific action
   * @param user Authenticated user or null
   * @param category Permission category
   * @param action Permission action
   * @param resource Optional resource specifier
   * @param errorMessage Error message to use if check fails
   */
  public async enforcePermissionForAction(
    user: AuthenticatedUser | null,
    category: PermissionCategory,
    action: PermissionAction,
    resource: string | null,
    errorMessage: string
  ): Promise<void> {
    // Call the enforcePermissionForAction function with user, category, action, resource, and errorMessage
    await enforcePermissionForAction(user, category, action, resource, errorMessage);
  }

  /**
   * Enforces that a user can access a specific resource
   * @param user Authenticated user or null
   * @param category Permission category
   * @param action Permission action
   * @param resourceId Resource ID
   * @param ownerId Optional owner ID
   * @param resourceType Resource type
   * @param errorMessage Error message to use if check fails
   */
  public async enforceResourceAccess(
    user: AuthenticatedUser | null,
    category: PermissionCategory,
    action: PermissionAction,
    resourceId: string,
    ownerId: string | null,
    resourceType: string,
    errorMessage: string
  ): Promise<void> {
    // Call the enforceResourceAccess function with user, category, action, resourceId, ownerId, resourceType, and errorMessage
    await enforceResourceAccess(user, category, action, resourceId, ownerId, resourceType, errorMessage);
  }

  /**
   * Checks if a user has the administrator role
   * @param user Authenticated user or null
   * @returns True if the user is an administrator
   */
  public async isAdministrator(user: AuthenticatedUser | null): Promise<boolean> {
    // Call the isAdministrator function with user
    return await isAdministrator(user);
    // Return the result
  }

  /**
   * Enforces that a user has the administrator role
   * @param user Authenticated user or null
   * @param errorMessage Error message to use if check fails
   */
  public async enforceAdministrator(user: AuthenticatedUser | null, errorMessage: string): Promise<void> {
    // Call the enforceAdministrator function with user and errorMessage
    await enforceAdministrator(user, errorMessage);
  }
}