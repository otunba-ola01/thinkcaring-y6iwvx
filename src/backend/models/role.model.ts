/**
 * Role Model
 *
 * Defines the Role model for the HCBS Revenue Management System.
 * This model represents the database schema for roles and provides methods
 * for role-related operations including creation, retrieval, and permission management.
 * It is a critical component of the role-based access control system.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { 
  UUID,
  Timestamp,
  AuditableEntity
} from '../types/common.types';
import {
  Role,
  Permission,
  UserRole
} from '../types/users.types';
import {
  roleRepository
} from '../database/repositories/role.repository';

/**
 * Model class representing a role in the system with methods for role operations
 */
export class RoleModel implements AuditableEntity {
  id: UUID;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;

  /**
   * Creates a new RoleModel instance
   * 
   * @param roleData Role data from database
   */
  constructor(roleData: Role) {
    this.id = roleData.id;
    this.name = roleData.name;
    this.description = roleData.description;
    this.isSystem = roleData.isSystem;
    this.permissions = roleData.permissions || [];
    this.createdAt = roleData.createdAt;
    this.updatedAt = roleData.updatedAt;
    this.createdBy = roleData.createdBy || null;
    this.updatedBy = roleData.updatedBy || null;
  }

  /**
   * Checks if this is a system-defined role that cannot be modified or deleted
   * 
   * @returns True if this is a system role
   */
  isSystemRole(): boolean {
    return this.isSystem;
  }

  /**
   * Checks if the role has a specific permission
   * 
   * @param permissionId ID of the permission to check
   * @returns True if the role has the permission
   */
  async hasPermission(permissionId: UUID): Promise<boolean> {
    return roleRepository.hasPermission(this.id, permissionId);
  }

  /**
   * Gets all permissions assigned to this role
   * 
   * @returns Array of permissions assigned to the role
   */
  async getPermissions(): Promise<Permission[]> {
    if (this.permissions && this.permissions.length > 0) {
      return this.permissions;
    }
    
    this.permissions = await roleRepository.getPermissions(this.id);
    return this.permissions;
  }

  /**
   * Adds a permission to this role
   * 
   * @param permissionId ID of the permission to add
   * @param createdBy ID of the user adding the permission
   * @returns True if permission was added successfully
   */
  async addPermission(permissionId: UUID, createdBy: UUID | null = null): Promise<boolean> {
    if (this.isSystem) {
      throw new Error('Cannot modify system-defined roles');
    }
    
    const result = await roleRepository.addPermission(this.id, permissionId, createdBy);
    
    if (result) {
      // Refresh permissions
      this.permissions = await roleRepository.getPermissions(this.id);
    }
    
    return result;
  }

  /**
   * Removes a permission from this role
   * 
   * @param permissionId ID of the permission to remove
   * @returns True if permission was removed successfully
   */
  async removePermission(permissionId: UUID): Promise<boolean> {
    if (this.isSystem) {
      throw new Error('Cannot modify system-defined roles');
    }
    
    const result = await roleRepository.removePermission(this.id, permissionId);
    
    if (result) {
      // Refresh permissions
      this.permissions = await roleRepository.getPermissions(this.id);
    }
    
    return result;
  }

  /**
   * Sets the complete list of permissions for this role
   * 
   * @param permissionIds IDs of permissions to assign to the role
   * @param updatedBy ID of the user setting the permissions
   * @returns True if permissions were updated successfully
   */
  async setPermissions(permissionIds: UUID[], updatedBy: UUID | null = null): Promise<boolean> {
    if (this.isSystem) {
      throw new Error('Cannot modify system-defined roles');
    }
    
    const result = await roleRepository.setPermissions(this.id, permissionIds, updatedBy);
    
    if (result) {
      // Refresh permissions
      this.permissions = await roleRepository.getPermissions(this.id);
    }
    
    return result;
  }

  /**
   * Converts the role model to a plain object for serialization
   * 
   * @returns Plain JavaScript object representing the role
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isSystem: this.isSystem,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }

  /**
   * Finds a role by ID and returns a RoleModel instance
   * 
   * @param id Role ID to find
   * @returns RoleModel instance if found, null otherwise
   */
  static async findById(id: UUID): Promise<RoleModel | null> {
    const role = await roleRepository.findById(id);
    
    if (!role) {
      return null;
    }
    
    return new RoleModel(role);
  }

  /**
   * Finds a role by name and returns a RoleModel instance
   * 
   * @param name Role name to find
   * @returns RoleModel instance if found, null otherwise
   */
  static async findByName(name: string): Promise<RoleModel | null> {
    const role = await roleRepository.findByName(name);
    
    if (!role) {
      return null;
    }
    
    return new RoleModel(role);
  }

  /**
   * Finds a role with its permissions by ID
   * 
   * @param id Role ID to find
   * @returns RoleModel instance with permissions if found, null otherwise
   */
  static async findWithPermissions(id: UUID): Promise<RoleModel | null> {
    const role = await roleRepository.findWithPermissions(id);
    
    if (!role) {
      return null;
    }
    
    return new RoleModel(role);
  }

  /**
   * Creates the default system roles if they don't exist
   */
  static async createDefaultRoles(): Promise<void> {
    await roleRepository.createDefaultRoles();
  }
}

/**
 * Retrieves a role by its unique identifier
 * 
 * @param id Role ID to find
 * @returns The role model if found, null otherwise
 */
export async function findById(id: UUID): Promise<RoleModel | null> {
  return RoleModel.findById(id);
}

/**
 * Retrieves a role by its name (case insensitive)
 * 
 * @param name Role name to find
 * @returns The role model if found, null otherwise
 */
export async function findByName(name: string): Promise<RoleModel | null> {
  return RoleModel.findByName(name);
}

/**
 * Retrieves a role with its associated permissions
 * 
 * @param id Role ID to find
 * @returns The role model with permissions if found, null otherwise
 */
export async function findWithPermissions(id: UUID): Promise<RoleModel | null> {
  return RoleModel.findWithPermissions(id);
}

/**
 * Creates the default system roles if they don't exist
 */
export async function createDefaultRoles(): Promise<void> {
  await RoleModel.createDefaultRoles();
}