/**
 * Role-Based Access Control (RBAC) System for HCBS Revenue Management System
 * 
 * This module implements comprehensive role-based access control functionality,
 * providing mechanisms for permission management, access checks, and authorization.
 * It serves as the foundation for security boundaries throughout the application.
 * 
 * @module role-based-access
 */

import { UUID } from '../types/common.types';
import { AuthenticatedUser } from '../types/auth.types';
import { 
  UserRole,
  PermissionCategory,
  PermissionAction,
  Role,
  Permission
} from '../types/users.types';
import { RoleModel } from '../models/role.model';
import { PermissionModel } from '../models/permission.model';
import { PermissionError } from '../errors/permission-error';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Initializes the role-based access control system by creating default roles and permissions
 */
export async function initializeRBAC(): Promise<void> {
  logger.info('Initializing role-based access control system');
  
  // Create default permissions
  await PermissionModel.createDefaultPermissions();
  
  // Create default roles
  await RoleModel.createDefaultRoles();
  
  // Assign default permissions to roles based on mapping
  const rolePermissionMap = getRolePermissionMap();
  
  // Loop through each role type and assign permissions
  for (const [roleName, permissionCategories] of Object.entries(rolePermissionMap)) {
    const role = await getRoleByName(roleName);
    if (role) {
      // Get default permissions for this role
      const permissionIds = await getDefaultPermissionsForRole(roleName as UserRole);
      
      // Assign permissions to role
      await assignPermissionsToRole(role.id, permissionIds, null);
    }
  }
  
  logger.info('RBAC system initialized successfully');
}

/**
 * Returns the default permission mappings for each system role
 */
export function getRolePermissionMap(): Record<UserRole, PermissionCategory[]> {
  return {
    [UserRole.ADMINISTRATOR]: [
      PermissionCategory.USERS,
      PermissionCategory.CLIENTS,
      PermissionCategory.SERVICES,
      PermissionCategory.CLAIMS,
      PermissionCategory.BILLING,
      PermissionCategory.PAYMENTS,
      PermissionCategory.REPORTS,
      PermissionCategory.SETTINGS,
      PermissionCategory.SYSTEM
    ],
    [UserRole.FINANCIAL_MANAGER]: [
      PermissionCategory.CLIENTS,
      PermissionCategory.SERVICES,
      PermissionCategory.CLAIMS,
      PermissionCategory.BILLING,
      PermissionCategory.PAYMENTS,
      PermissionCategory.REPORTS,
      PermissionCategory.SETTINGS
    ],
    [UserRole.BILLING_SPECIALIST]: [
      PermissionCategory.CLIENTS,
      PermissionCategory.SERVICES,
      PermissionCategory.CLAIMS,
      PermissionCategory.BILLING,
      PermissionCategory.PAYMENTS,
      PermissionCategory.REPORTS
    ],
    [UserRole.PROGRAM_MANAGER]: [
      PermissionCategory.CLIENTS,
      PermissionCategory.SERVICES,
      PermissionCategory.REPORTS
    ],
    [UserRole.READ_ONLY]: [
      PermissionCategory.CLIENTS,
      PermissionCategory.SERVICES,
      PermissionCategory.CLAIMS,
      PermissionCategory.BILLING,
      PermissionCategory.PAYMENTS,
      PermissionCategory.REPORTS
    ]
  };
}

/**
 * Retrieves all permissions assigned to a specific role
 * @param roleId Role ID to get permissions for
 * @returns Array of permissions assigned to the role
 */
export async function getPermissionsByRole(roleId: UUID): Promise<Permission[]> {
  const role = await RoleModel.findWithPermissions(roleId);
  if (!role) {
    return [];
  }
  
  return role.permissions;
}

/**
 * Retrieves all permission names for a user based on their role
 * @param userId User ID
 * @param roleId Role ID
 * @returns Array of permission names
 */
export async function getUserRolePermissions(userId: UUID, roleId: UUID): Promise<string[]> {
  const permissions = await getPermissionsByRole(roleId);
  return permissions.map(permission => permission.name);
}

/**
 * Assigns a set of permissions to a role
 * @param roleId Role ID to assign permissions to
 * @param permissionIds Permission IDs to assign
 * @param updatedBy ID of the user updating the permissions
 * @returns True if the operation was successful
 */
export async function assignPermissionsToRole(
  roleId: UUID, 
  permissionIds: UUID[], 
  updatedBy: UUID | null
): Promise<boolean> {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw PermissionError.insufficientPermissions(
      `Role with ID ${roleId} not found`,
      [`USERS:${PermissionAction.UPDATE}`],
      { roleId }
    );
  }
  
  const result = await role.setPermissions(permissionIds, updatedBy);
  
  logger.info(`Assigned ${permissionIds.length} permissions to role ${roleId}`);
  return result;
}

/**
 * Checks if a role has a specific permission
 * @param roleId Role ID to check
 * @param permissionName Permission name to check for
 * @returns True if the role has the permission
 */
export async function checkRoleHasPermission(roleId: UUID, permissionName: string): Promise<boolean> {
  const role = await RoleModel.findWithPermissions(roleId);
  if (!role) {
    return false;
  }
  
  return role.permissions.some(permission => permission.name === permissionName);
}

/**
 * Checks if a role has permission for a specific category, action, and optional resource
 * @param roleId Role ID to check
 * @param category Permission category
 * @param action Permission action
 * @param resource Optional resource specifier
 * @returns True if the role has the permission
 */
export async function checkRoleHasPermissionForAction(
  roleId: UUID, 
  category: PermissionCategory, 
  action: PermissionAction, 
  resource: string | null = null
): Promise<boolean> {
  // Build the permission name
  const permissionName = resource 
    ? `${category.toUpperCase()}:${action.toUpperCase()}:${resource.toUpperCase()}`
    : `${category.toUpperCase()}:${action.toUpperCase()}`;
  
  // Check if role has the specific permission
  const hasPermission = await checkRoleHasPermission(roleId, permissionName);
  
  // If checking for a specific resource and permission not found,
  // check for wildcard permission for the category+action
  if (resource && !hasPermission) {
    const wildcardPermission = `${category.toUpperCase()}:${action.toUpperCase()}`;
    return await checkRoleHasPermission(roleId, wildcardPermission);
  }
  
  return hasPermission;
}

/**
 * Checks if a role is a system-defined role that cannot be modified
 * @param roleId Role ID to check
 * @returns True if the role is a system role
 */
export async function isSystemRole(roleId: UUID): Promise<boolean> {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    return false;
  }
  
  return role.isSystemRole();
}

/**
 * Retrieves a role by its name
 * @param roleName Role name to find
 * @returns The role if found, null otherwise
 */
export async function getRoleByName(roleName: string): Promise<Role | null> {
  const role = await RoleModel.findByName(roleName);
  return role ? (role.toJSON() as Role) : null;
}

/**
 * Builds an access control list (ACL) for a user based on their role and permissions
 * @param user Authenticated user
 * @returns Object mapping resource paths to access boolean
 */
export async function buildAccessControlList(user: AuthenticatedUser): Promise<Record<string, boolean>> {
  const acl: Record<string, boolean> = {};
  
  if (!user) {
    return acl;
  }
  
  // Get the user's role with permissions
  const role = await RoleModel.findWithPermissions(user.roleId);
  if (!role) {
    return acl;
  }
  
  // Build ACL from permissions
  for (const permission of role.permissions) {
    const { category, action, resource } = permission;
    
    // Build the resource path
    const resourcePath = resource 
      ? `${category.toLowerCase()}/${action.toLowerCase()}/${resource.toLowerCase()}`
      : `${category.toLowerCase()}/${action.toLowerCase()}`;
    
    // Grant access
    acl[resourcePath] = true;
  }
  
  return acl;
}

/**
 * Gets the default permissions that should be assigned to a specific role
 * @param role Role to get permissions for
 * @returns Array of permission IDs
 */
export async function getDefaultPermissionsForRole(role: UserRole): Promise<UUID[]> {
  // Get the permission categories for this role
  const permissionCategories = getRolePermissionMap()[role];
  
  // Get all permissions for these categories
  const permissionArrays = await Promise.all(
    permissionCategories.map(category => PermissionModel.findByCategory(category))
  );
  
  // Flatten the arrays of permissions
  const permissions = permissionArrays.flat();
  
  // Return the permission IDs
  return permissions.map(permission => permission.id);
}

/**
 * Singleton class that manages the role-based access control system
 */
export class RBACManager {
  private static instance: RBACManager | null = null;
  private roleCache: Map<UUID, Role> = new Map();
  private permissionCache: Map<string, Permission> = new Map();
  private initialized: boolean = false;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.roleCache = new Map();
    this.permissionCache = new Map();
    this.initialized = false;
  }
  
  /**
   * Gets the singleton instance of RBACManager
   * @returns The singleton instance
   */
  public static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }
  
  /**
   * Initializes the RBAC system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('RBAC manager already initialized');
      return;
    }
    
    await initializeRBAC();
    
    // Preload common roles and permissions into cache
    // Load system-defined roles
    const adminRole = await RoleModel.findByName(UserRole.ADMINISTRATOR);
    if (adminRole) this.roleCache.set(adminRole.id, adminRole.toJSON() as Role);
    
    const financialManagerRole = await RoleModel.findByName(UserRole.FINANCIAL_MANAGER);
    if (financialManagerRole) this.roleCache.set(financialManagerRole.id, financialManagerRole.toJSON() as Role);
    
    const billingSpecialistRole = await RoleModel.findByName(UserRole.BILLING_SPECIALIST);
    if (billingSpecialistRole) this.roleCache.set(billingSpecialistRole.id, billingSpecialistRole.toJSON() as Role);
    
    this.initialized = true;
    logger.info('RBAC manager initialized successfully');
  }
  
  /**
   * Gets a role by ID, using cache when available
   * @param roleId Role ID to retrieve
   * @returns The role if found, null otherwise
   */
  public async getRole(roleId: UUID): Promise<Role | null> {
    // Check cache first
    if (this.roleCache.has(roleId)) {
      return this.roleCache.get(roleId) || null;
    }
    
    // Not in cache, fetch from database
    const role = await RoleModel.findById(roleId);
    if (role) {
      const roleData = role.toJSON() as Role;
      this.roleCache.set(roleId, roleData);
      return roleData;
    }
    
    return null;
  }
  
  /**
   * Gets a permission by name, using cache when available
   * @param permissionName Permission name to retrieve
   * @returns The permission if found, null otherwise
   */
  public async getPermission(permissionName: string): Promise<Permission | null> {
    // Check cache first
    if (this.permissionCache.has(permissionName)) {
      return this.permissionCache.get(permissionName) || null;
    }
    
    // Not in cache, fetch from database
    const permission = await PermissionModel.findByName(permissionName);
    if (permission) {
      const permissionData = permission.toJSON() as Permission;
      this.permissionCache.set(permissionName, permissionData);
      return permissionData;
    }
    
    return null;
  }
  
  /**
   * Clears the role and permission caches
   */
  public clearCache(): void {
    this.roleCache.clear();
    this.permissionCache.clear();
    logger.info('RBAC cache cleared');
  }
  
  /**
   * Gets all permissions for a user based on their role
   * @param userId User ID
   * @param roleId Role ID
   * @returns Array of permission names
   */
  public async getUserPermissions(userId: UUID, roleId: UUID): Promise<string[]> {
    return getUserRolePermissions(userId, roleId);
  }
  
  /**
   * Checks if a role has a specific permission
   * @param roleId Role ID to check
   * @param permissionName Permission name to check for
   * @returns True if the role has the permission
   */
  public async checkPermission(roleId: UUID, permissionName: string): Promise<boolean> {
    return checkRoleHasPermission(roleId, permissionName);
  }
  
  /**
   * Checks if a role has permission for a specific action
   * @param roleId Role ID to check
   * @param category Permission category
   * @param action Permission action
   * @param resource Optional resource specifier
   * @returns True if the role has the permission
   */
  public async checkPermissionForAction(
    roleId: UUID, 
    category: PermissionCategory, 
    action: PermissionAction, 
    resource: string | null = null
  ): Promise<boolean> {
    return checkRoleHasPermissionForAction(roleId, category, action, resource);
  }
  
  /**
   * Builds an access control list for a user
   * @param user Authenticated user
   * @returns Object mapping resource paths to access boolean
   */
  public async buildUserACL(user: AuthenticatedUser): Promise<Record<string, boolean>> {
    return buildAccessControlList(user);
  }
}