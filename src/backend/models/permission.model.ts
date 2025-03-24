import { v4 as uuid } from 'uuid'; // uuid v9.0.0
import { UUID } from '../types/common.types';
import { 
  Permission, 
  PermissionCategory, 
  PermissionAction 
} from '../types/users.types';
import { permissionRepository } from '../database/repositories/permission.repository';
import { roleRepository } from '../database/repositories/role.repository';
import { logger } from '../utils/logger';

/**
 * Retrieves a permission by its unique identifier
 * 
 * @param id Permission ID to find
 * @returns The permission model if found, null otherwise
 */
export async function findById(id: UUID): Promise<PermissionModel | null> {
  const permission = await permissionRepository.findById(id);
  return permission ? new PermissionModel(permission) : null;
}

/**
 * Retrieves a permission by its name (case insensitive)
 * 
 * @param name Permission name to find
 * @returns The permission model if found, null otherwise
 */
export async function findByName(name: string): Promise<PermissionModel | null> {
  const permission = await permissionRepository.findByName(name);
  return permission ? new PermissionModel(permission) : null;
}

/**
 * Retrieves permissions by category
 * 
 * @param category Category to find permissions for
 * @returns Array of permission models in the specified category
 */
export async function findByCategory(category: PermissionCategory): Promise<PermissionModel[]> {
  const permissions = await permissionRepository.findByCategory(category);
  return permissions.map(permission => new PermissionModel(permission));
}

/**
 * Retrieves permissions by category and action
 * 
 * @param category Category to find permissions for
 * @param action Action to find permissions for
 * @returns Array of permission models matching the category and action
 */
export async function findByCategoryAndAction(
  category: PermissionCategory,
  action: PermissionAction
): Promise<PermissionModel[]> {
  const permissions = await permissionRepository.findByCategoryAndAction(category, action);
  return permissions.map(permission => new PermissionModel(permission));
}

/**
 * Creates the default system permissions if they don't exist
 * 
 * @returns Promise that resolves when the operation is complete
 */
export async function createDefaultPermissions(): Promise<void> {
  await permissionRepository.createDefaultPermissions();
  logger.info('Default system permissions created or verified');
}

/**
 * Model class representing a permission in the HCBS Revenue Management System.
 * 
 * Permissions are used to control access to specific functions and data within the system,
 * and are assigned to roles as part of the role-based access control (RBAC) system.
 */
export class PermissionModel {
  /** Unique identifier for the permission */
  public id: UUID;
  
  /** Name of the permission, typically in format CATEGORY:ACTION:RESOURCE */
  public name: string;
  
  /** Human-readable description of the permission */
  public description: string;
  
  /** Category the permission belongs to (users, clients, claims, etc.) */
  public category: PermissionCategory;
  
  /** Action the permission grants (view, create, update, etc.) */
  public action: PermissionAction;
  
  /** Optional resource specifier for the permission */
  public resource: string | null;
  
  /** Whether this is a system-defined permission that cannot be modified */
  public isSystem: boolean;

  /**
   * Creates a new PermissionModel instance
   * 
   * @param permissionData Permission data to initialize the model with
   */
  constructor(permissionData: Permission) {
    this.id = permissionData.id;
    this.name = permissionData.name;
    this.description = permissionData.description;
    this.category = permissionData.category;
    this.action = permissionData.action;
    this.resource = permissionData.resource;
    this.isSystem = permissionData.isSystem;
  }

  /**
   * Checks if this is a system-defined permission that cannot be modified or deleted
   * 
   * @returns True if this is a system permission
   */
  public isSystemPermission(): boolean {
    return this.isSystem;
  }

  /**
   * Gets the full permission name including category, action, and resource
   * 
   * @returns Formatted permission name
   */
  public getFullName(): string {
    // If name is already set, return it
    if (this.name) {
      return this.name;
    }
    
    // Otherwise, build the name from category, action, and resource
    return permissionRepository.buildPermissionName(
      this.category,
      this.action,
      this.resource
    );
  }

  /**
   * Checks if this permission is assigned to any roles
   * 
   * @returns True if the permission is assigned to any roles
   */
  public async isAssignedToRoles(): Promise<boolean> {
    return await permissionRepository.isPermissionAssignedToRoles(this.id);
  }

  /**
   * Gets all roles that have this permission assigned
   * 
   * @returns Array of roles with this permission
   */
  public async getAssignedRoles(): Promise<{ id: UUID, name: string }[]> {
    const roles = await roleRepository.getRolesByPermission(this.id);
    return roles.map(role => ({ id: role.id, name: role.name }));
  }

  /**
   * Converts the permission model to a plain object for serialization
   * 
   * @returns Plain JavaScript object representing the permission
   */
  public toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      action: this.action,
      resource: this.resource,
      isSystem: this.isSystem
    };
  }

  /**
   * Finds a permission by ID and returns a PermissionModel instance
   * 
   * @param id ID of the permission to find
   * @returns PermissionModel instance if found, null otherwise
   */
  public static async findById(id: UUID): Promise<PermissionModel | null> {
    return findById(id);
  }

  /**
   * Finds a permission by name and returns a PermissionModel instance
   * 
   * @param name Name of the permission to find (case insensitive)
   * @returns PermissionModel instance if found, null otherwise
   */
  public static async findByName(name: string): Promise<PermissionModel | null> {
    return findByName(name);
  }

  /**
   * Finds permissions by category and returns PermissionModel instances
   * 
   * @param category Category to find permissions for
   * @returns Array of PermissionModel instances
   */
  public static async findByCategory(category: PermissionCategory): Promise<PermissionModel[]> {
    return findByCategory(category);
  }

  /**
   * Finds permissions by category and action and returns PermissionModel instances
   * 
   * @param category Category to find permissions for
   * @param action Action to find permissions for
   * @returns Array of PermissionModel instances
   */
  public static async findByCategoryAndAction(
    category: PermissionCategory,
    action: PermissionAction
  ): Promise<PermissionModel[]> {
    return findByCategoryAndAction(category, action);
  }

  /**
   * Creates the default system permissions if they don't exist
   * 
   * @returns Promise that resolves when the operation is complete
   */
  public static async createDefaultPermissions(): Promise<void> {
    return createDefaultPermissions();
  }
}