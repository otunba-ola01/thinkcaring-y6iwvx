import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { BaseRepository } from './base.repository';
import { 
  Role, 
  Permission, 
  PermissionGrant, 
  UserRole, 
  PermissionCategory, 
  PermissionAction 
} from '../../types/users.types';
import { getKnexInstance } from '../connection';
import { Transaction } from '../../types/database.types';
import { RepositoryOptions } from '../../types/database.types';
import { PaginationParams } from '../../types/common.types';
import { UUID } from '../../types/common.types';
import { logger } from '../../utils/logger';
import { BusinessError } from '../../errors/business-error';
import { NotFoundError } from '../../errors/not-found-error';

/**
 * Repository class for managing roles in the database
 */
export class RoleRepository extends BaseRepository<Role> {
  /**
   * Creates a new RoleRepository instance
   */
  constructor() {
    super('roles', 'id');
  }

  /**
   * Finds a role by its name (case insensitive)
   * 
   * @param name The role name to search for
   * @param options Repository options
   * @returns The role if found, null otherwise
   */
  async findByName(name: string, options: RepositoryOptions = {}): Promise<Role | null> {
    try {
      logger.debug(`Finding role by name: ${name}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const role = await queryBuilder
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
      
      return role || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByName');
    }
  }

  /**
   * Finds a role by ID and includes its associated permissions
   * 
   * @param roleId The role ID to find
   * @param options Repository options
   * @returns The role with permissions if found, null otherwise
   */
  async findWithPermissions(roleId: UUID, options: RepositoryOptions = {}): Promise<Role | null> {
    try {
      logger.debug(`Finding role with permissions for ID: ${roleId}`);
      // Find the role
      const role = await this.findById(roleId, options);
      
      if (!role) {
        return null;
      }
      
      // Get the permissions for the role
      const permissions = await this.getPermissions(roleId, options);
      
      // Attach the permissions to the role
      return {
        ...role,
        permissions
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithPermissions');
    }
  }

  /**
   * Retrieves all roles with optional filtering and pagination
   * 
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @param options Repository options
   * @returns Paginated list of roles
   */
  async findAllWithFilters(
    filters: {
      name?: string;
      isSystem?: boolean;
      search?: string;
    } = {},
    pagination: PaginationParams = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<{ data: Role[], total: number }> {
    try {
      logger.debug('Finding roles with filters', { filters, pagination });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply filters
      if (filters.name) {
        queryBuilder.whereRaw('LOWER(name) = LOWER(?)', [filters.name]);
      }
      
      if (filters.isSystem !== undefined) {
        queryBuilder.where('is_system', filters.isSystem);
      }
      
      if (filters.search) {
        queryBuilder.where(function() {
          this.whereRaw('LOWER(name) LIKE ?', [`%${filters.search.toLowerCase()}%`])
            .orWhereRaw('LOWER(description) LIKE ?', [`%${filters.search.toLowerCase()}%`]);
        });
      }
      
      // Create a query to count total results
      const countQuery = queryBuilder.clone().count('* as total').first();
      
      // Apply pagination to the main query
      const offset = (pagination.page - 1) * pagination.limit;
      queryBuilder.limit(pagination.limit).offset(offset);
      
      // Execute both queries
      const [roles, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      return {
        data: roles,
        total: parseInt(countResult.total, 10)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAllWithFilters');
    }
  }

  /**
   * Creates a new role
   * 
   * @param roleData Role data to create
   * @param permissionIds IDs of permissions to assign to the role
   * @param createdBy ID of the user creating the role
   * @param options Repository options
   * @returns The newly created role
   */
  async createRole(
    roleData: {
      name: string;
      description: string;
      isSystem?: boolean;
    },
    permissionIds: UUID[] = [],
    createdBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<Role> {
    logger.debug('Creating new role', { roleData, permissionIds });
    
    // Check if role already exists
    const existingRole = await this.findByName(roleData.name, options);
    
    if (existingRole) {
      throw new BusinessError(
        `Role with name '${roleData.name}' already exists`,
        { roleName: roleData.name },
        'duplicate_role_name'
      );
    }
    
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Create the role
      const roleId = uuidv4();
      const role = await this.create({
        id: roleId,
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem || false
      }, {
        ...options,
        transaction: trx,
        createdBy
      });
      
      // Add permissions if provided
      if (permissionIds.length > 0) {
        await this.setPermissions(roleId, permissionIds, createdBy, {
          ...options,
          transaction: trx
        });
      }
      
      // Get the role with permissions
      const roleWithPermissions = await this.findWithPermissions(roleId, {
        ...options,
        transaction: trx
      });
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return roleWithPermissions;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Updates an existing role
   * 
   * @param id Role ID to update
   * @param roleData Updated role data
   * @param permissionIds IDs of permissions to assign to the role
   * @param updatedBy ID of the user updating the role
   * @param options Repository options
   * @returns The updated role
   */
  async updateRole(
    id: UUID,
    roleData: {
      name: string;
      description: string;
    },
    permissionIds: UUID[] = [],
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<Role> {
    logger.debug('Updating role', { id, roleData, permissionIds });
    
    // Check if role exists
    const existingRole = await this.findById(id, options);
    
    if (!existingRole) {
      throw new NotFoundError('Role not found', 'role', id);
    }
    
    // Check if role is a system role, which cannot be modified
    if (existingRole.isSystem) {
      throw new BusinessError(
        'System roles cannot be modified',
        { roleId: id },
        'modify_system_role'
      );
    }
    
    // If name is changing, check if new name already exists
    if (roleData.name !== existingRole.name) {
      const roleWithSameName = await this.findByName(roleData.name, options);
      
      if (roleWithSameName && roleWithSameName.id !== id) {
        throw new BusinessError(
          `Role with name '${roleData.name}' already exists`,
          { roleName: roleData.name },
          'duplicate_role_name'
        );
      }
    }
    
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Update the role
      const updatedRole = await this.update(id, {
        name: roleData.name,
        description: roleData.description
      }, {
        ...options,
        transaction: trx,
        updatedBy
      });
      
      // Update permissions if provided
      if (permissionIds.length > 0) {
        await this.setPermissions(id, permissionIds, updatedBy, {
          ...options,
          transaction: trx
        });
      }
      
      // Get the role with permissions
      const roleWithPermissions = await this.findWithPermissions(id, {
        ...options,
        transaction: trx
      });
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return roleWithPermissions;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Deletes a role if it's not a system role and not assigned to any users
   * 
   * @param id Role ID to delete
   * @param options Repository options
   * @returns True if role was deleted successfully
   */
  async deleteRole(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    logger.debug(`Deleting role: ${id}`);
    
    // Check if role exists
    const existingRole = await this.findById(id, options);
    
    if (!existingRole) {
      throw new NotFoundError('Role not found', 'role', id);
    }
    
    // Check if role is a system role, which cannot be deleted
    if (existingRole.isSystem) {
      throw new BusinessError(
        'System roles cannot be deleted',
        { roleId: id },
        'delete_system_role'
      );
    }
    
    // Check if role is assigned to any users
    const isAssigned = await this.isRoleAssignedToUsers(id, options);
    
    if (isAssigned) {
      throw new BusinessError(
        'Role is assigned to users and cannot be deleted',
        { roleId: id },
        'role_in_use'
      );
    }
    
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Delete all permission grants for the role
      await trx('permission_grants')
        .where('role_id', id)
        .delete();
      
      // Delete the role
      const deleted = await this.delete(id, {
        ...options,
        transaction: trx
      });
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return deleted;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Checks if a role is assigned to any users
   * 
   * @param roleId Role ID to check
   * @param options Repository options
   * @returns True if the role is assigned to any users
   */
  async isRoleAssignedToUsers(roleId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Checking if role is assigned to users: ${roleId}`);
      const knex = getKnexInstance();
      const query = knex('users')
        .where('role_id', roleId)
        .count('* as count')
        .first();
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const result = await query;
      return parseInt(result.count, 10) > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'isRoleAssignedToUsers');
    }
  }

  /**
   * Gets all permissions assigned to a role
   * 
   * @param roleId Role ID to get permissions for
   * @param options Repository options
   * @returns Array of permissions assigned to the role
   */
  async getPermissions(roleId: UUID, options: RepositoryOptions = {}): Promise<Permission[]> {
    try {
      logger.debug(`Getting permissions for role: ${roleId}`);
      const knex = getKnexInstance();
      const query = knex('permissions')
        .select('permissions.*')
        .join('permission_grants', 'permissions.id', 'permission_grants.permission_id')
        .where('permission_grants.role_id', roleId);
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      return await query;
    } catch (error) {
      this.handleDatabaseError(error, 'getPermissions');
    }
  }

  /**
   * Checks if a role has a specific permission
   * 
   * @param roleId Role ID to check
   * @param permissionId Permission ID to check for
   * @param options Repository options
   * @returns True if the role has the permission
   */
  async hasPermission(roleId: UUID, permissionId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Checking if role ${roleId} has permission ${permissionId}`);
      const knex = getKnexInstance();
      const query = knex('permission_grants')
        .where({
          role_id: roleId,
          permission_id: permissionId
        })
        .first();
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      const result = await query;
      return !!result;
    } catch (error) {
      this.handleDatabaseError(error, 'hasPermission');
    }
  }

  /**
   * Adds a permission to a role
   * 
   * @param roleId Role ID to add permission to
   * @param permissionId Permission ID to add
   * @param createdBy ID of the user adding the permission
   * @param options Repository options
   * @returns True if permission was added successfully
   */
  async addPermission(
    roleId: UUID,
    permissionId: UUID,
    createdBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    logger.debug(`Adding permission ${permissionId} to role ${roleId}`);
    
    // Check if role exists
    const existingRole = await this.findById(roleId, options);
    
    if (!existingRole) {
      throw new NotFoundError('Role not found', 'role', roleId);
    }
    
    // Check if permission exists
    const knex = getKnexInstance();
    let query = knex('permissions').where('id', permissionId).first();
    
    if (options.transaction) {
      query = query.transacting(options.transaction);
    }
    
    const permission = await query;
    
    if (!permission) {
      throw new NotFoundError('Permission not found', 'permission', permissionId);
    }
    
    // Check if permission is already assigned to role
    const hasPermission = await this.hasPermission(roleId, permissionId, options);
    
    if (hasPermission) {
      // Permission already assigned, no need to add
      return true;
    }
    
    const trx = options.transaction || await knex.transaction();
    
    try {
      // Add the permission grant
      await trx('permission_grants').insert({
        id: uuidv4(),
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date(),
        created_by: createdBy
      });
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Removes a permission from a role
   * 
   * @param roleId Role ID to remove permission from
   * @param permissionId Permission ID to remove
   * @param options Repository options
   * @returns True if permission was removed successfully
   */
  async removePermission(
    roleId: UUID,
    permissionId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    logger.debug(`Removing permission ${permissionId} from role ${roleId}`);
    
    // Check if role exists
    const existingRole = await this.findById(roleId, options);
    
    if (!existingRole) {
      throw new NotFoundError('Role not found', 'role', roleId);
    }
    
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Remove the permission grant
      const deleted = await trx('permission_grants')
        .where({
          role_id: roleId,
          permission_id: permissionId
        })
        .delete();
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return deleted > 0;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Sets the complete list of permissions for a role
   * 
   * @param roleId Role ID to set permissions for
   * @param permissionIds IDs of permissions to assign to the role
   * @param updatedBy ID of the user setting the permissions
   * @param options Repository options
   * @returns True if permissions were updated successfully
   */
  async setPermissions(
    roleId: UUID,
    permissionIds: UUID[],
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    logger.debug(`Setting permissions for role ${roleId}`, { permissionIds });
    
    // Check if role exists
    const existingRole = await this.findById(roleId, options);
    
    if (!existingRole) {
      throw new NotFoundError('Role not found', 'role', roleId);
    }
    
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Get current permissions
      const currentPermissions = await this.getPermissions(roleId, {
        ...options,
        transaction: trx
      });
      
      const currentPermissionIds = currentPermissions.map(p => p.id);
      
      // Permissions to remove
      const permissionsToRemove = currentPermissionIds.filter(id => !permissionIds.includes(id));
      
      // Permissions to add
      const permissionsToAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
      
      // Remove permissions
      if (permissionsToRemove.length > 0) {
        await trx('permission_grants')
          .where('role_id', roleId)
          .whereIn('permission_id', permissionsToRemove)
          .delete();
      }
      
      // Add permissions
      if (permissionsToAdd.length > 0) {
        const permissionGrants = permissionsToAdd.map(permissionId => ({
          id: uuidv4(),
          role_id: roleId,
          permission_id: permissionId,
          created_at: new Date(),
          created_by: updatedBy
        }));
        
        await trx('permission_grants').insert(permissionGrants);
      }
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Gets all roles that have a specific permission
   * 
   * @param permissionId Permission ID to check for
   * @param options Repository options
   * @returns Array of roles that have the permission
   */
  async getRolesByPermission(permissionId: UUID, options: RepositoryOptions = {}): Promise<Role[]> {
    try {
      logger.debug(`Getting roles with permission: ${permissionId}`);
      const knex = getKnexInstance();
      const query = knex('roles')
        .select('roles.*')
        .join('permission_grants', 'roles.id', 'permission_grants.role_id')
        .where('permission_grants.permission_id', permissionId);
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      return await query;
    } catch (error) {
      this.handleDatabaseError(error, 'getRolesByPermission');
    }
  }

  /**
   * Finds a permission by its name (case insensitive)
   * 
   * @param name The permission name to search for
   * @param options Repository options
   * @returns The permission if found, null otherwise
   */
  async findPermissionByName(name: string, options: RepositoryOptions = {}): Promise<Permission | null> {
    try {
      logger.debug(`Finding permission by name: ${name}`);
      const knex = getKnexInstance();
      const query = knex('permissions')
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
      
      if (options.transaction) {
        query.transacting(options.transaction);
      }
      
      return await query || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findPermissionByName');
    }
  }

  /**
   * Builds a standardized permission name from category, action, and resource
   * 
   * @param category Permission category
   * @param action Permission action
   * @param resource Optional resource specifier
   * @returns Formatted permission name
   */
  buildPermissionName(
    category: PermissionCategory,
    action: PermissionAction,
    resource: string | null = null
  ): string {
    const base = `${category.toUpperCase()}:${action.toUpperCase()}`;
    return resource ? `${base}:${resource.toUpperCase()}` : base;
  }

  /**
   * Ensures default system permissions exist in the database
   * 
   * @param trx Database transaction
   * @returns Map of permission names to their IDs
   */
  async ensureDefaultPermissionsExist(trx: Transaction): Promise<Map<string, UUID>> {
    const permissionMap = new Map<string, UUID>();
    
    // Define the default permissions
    const defaultPermissions: Array<{
      category: PermissionCategory;
      action: PermissionAction;
      resource?: string;
      description: string;
    }> = [
      // User permissions
      {
        category: PermissionCategory.USERS,
        action: PermissionAction.VIEW,
        description: 'View user accounts'
      },
      {
        category: PermissionCategory.USERS,
        action: PermissionAction.CREATE,
        description: 'Create user accounts'
      },
      {
        category: PermissionCategory.USERS,
        action: PermissionAction.UPDATE,
        description: 'Update user accounts'
      },
      {
        category: PermissionCategory.USERS,
        action: PermissionAction.DELETE,
        description: 'Delete user accounts'
      },
      
      // Client permissions
      {
        category: PermissionCategory.CLIENTS,
        action: PermissionAction.VIEW,
        description: 'View client information'
      },
      {
        category: PermissionCategory.CLIENTS,
        action: PermissionAction.CREATE,
        description: 'Create new clients'
      },
      {
        category: PermissionCategory.CLIENTS,
        action: PermissionAction.UPDATE,
        description: 'Update client information'
      },
      {
        category: PermissionCategory.CLIENTS,
        action: PermissionAction.DELETE,
        description: 'Delete clients'
      },
      
      // Service permissions
      {
        category: PermissionCategory.SERVICES,
        action: PermissionAction.VIEW,
        description: 'View service records'
      },
      {
        category: PermissionCategory.SERVICES,
        action: PermissionAction.CREATE,
        description: 'Create service records'
      },
      {
        category: PermissionCategory.SERVICES,
        action: PermissionAction.UPDATE,
        description: 'Update service records'
      },
      {
        category: PermissionCategory.SERVICES,
        action: PermissionAction.DELETE,
        description: 'Delete service records'
      },
      
      // Claims permissions
      {
        category: PermissionCategory.CLAIMS,
        action: PermissionAction.VIEW,
        description: 'View claims'
      },
      {
        category: PermissionCategory.CLAIMS,
        action: PermissionAction.CREATE,
        description: 'Create claims'
      },
      {
        category: PermissionCategory.CLAIMS,
        action: PermissionAction.UPDATE,
        description: 'Update claims'
      },
      {
        category: PermissionCategory.CLAIMS,
        action: PermissionAction.DELETE,
        description: 'Delete claims'
      },
      {
        category: PermissionCategory.CLAIMS,
        action: PermissionAction.SUBMIT,
        description: 'Submit claims to payers'
      },
      
      // Billing permissions
      {
        category: PermissionCategory.BILLING,
        action: PermissionAction.VIEW,
        description: 'View billing information'
      },
      {
        category: PermissionCategory.BILLING,
        action: PermissionAction.MANAGE,
        description: 'Manage billing workflows'
      },
      
      // Payments permissions
      {
        category: PermissionCategory.PAYMENTS,
        action: PermissionAction.VIEW,
        description: 'View payments'
      },
      {
        category: PermissionCategory.PAYMENTS,
        action: PermissionAction.CREATE,
        description: 'Record payments'
      },
      {
        category: PermissionCategory.PAYMENTS,
        action: PermissionAction.MANAGE,
        description: 'Manage payment reconciliation'
      },
      
      // Reports permissions
      {
        category: PermissionCategory.REPORTS,
        action: PermissionAction.VIEW,
        description: 'View standard reports'
      },
      {
        category: PermissionCategory.REPORTS,
        action: PermissionAction.CREATE,
        description: 'Create custom reports'
      },
      {
        category: PermissionCategory.REPORTS,
        action: PermissionAction.EXPORT,
        description: 'Export reports'
      },
      {
        category: PermissionCategory.REPORTS,
        action: PermissionAction.EXPORT,
        resource: 'FINANCIAL',
        description: 'Export financial reports'
      },
      
      // Settings permissions
      {
        category: PermissionCategory.SETTINGS,
        action: PermissionAction.VIEW,
        description: 'View system settings'
      },
      {
        category: PermissionCategory.SETTINGS,
        action: PermissionAction.MANAGE,
        description: 'Manage system settings'
      },
      
      // System permissions
      {
        category: PermissionCategory.SYSTEM,
        action: PermissionAction.VIEW,
        description: 'View system information'
      },
      {
        category: PermissionCategory.SYSTEM,
        action: PermissionAction.MANAGE,
        description: 'Manage system configuration'
      }
    ];
    
    // Build permission names and check if they exist
    for (const perm of defaultPermissions) {
      const name = this.buildPermissionName(perm.category, perm.action, perm.resource || null);
      
      // Check if permission already exists
      const existingPermission = await trx('permissions')
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
      
      if (existingPermission) {
        // Permission exists, store its ID
        permissionMap.set(name, existingPermission.id);
      } else {
        // Permission doesn't exist, create it
        const id = uuidv4();
        await trx('permissions').insert({
          id,
          name,
          description: perm.description,
          category: perm.category,
          action: perm.action,
          resource: perm.resource || null,
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Store the new permission ID
        permissionMap.set(name, id);
      }
    }
    
    return permissionMap;
  }

  /**
   * Creates the default system roles if they don't exist
   * 
   * @param options Repository options
   */
  async createDefaultRoles(options: RepositoryOptions = {}): Promise<void> {
    logger.info('Creating default system roles if they don\'t exist');
    const trx = options.transaction || await getKnexInstance().transaction();
    
    try {
      // Ensure default permissions exist
      const permissionMap = await this.ensureDefaultPermissionsExist(trx);
      
      // Define the default roles
      const defaultRoles = [
        {
          enum: UserRole.ADMINISTRATOR,
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: ['*'] // Special value for all permissions
        },
        {
          enum: UserRole.FINANCIAL_MANAGER,
          name: 'Financial Manager',
          description: 'Manages financial operations and reporting',
          permissions: [
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.UPDATE),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.SUBMIT),
            this.buildPermissionName(PermissionCategory.BILLING, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.BILLING, PermissionAction.MANAGE),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.MANAGE),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.EXPORT),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.EXPORT, 'FINANCIAL'),
            this.buildPermissionName(PermissionCategory.SETTINGS, PermissionAction.VIEW)
          ]
        },
        {
          enum: UserRole.BILLING_SPECIALIST,
          name: 'Billing Specialist',
          description: 'Manages claims and billing operations',
          permissions: [
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.UPDATE),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.SUBMIT),
            this.buildPermissionName(PermissionCategory.BILLING, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.BILLING, PermissionAction.MANAGE),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.EXPORT)
          ]
        },
        {
          enum: UserRole.PROGRAM_MANAGER,
          name: 'Program Manager',
          description: 'Manages program operations and client services',
          permissions: [
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.UPDATE),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.CREATE),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.UPDATE),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.EXPORT)
          ]
        },
        {
          enum: UserRole.READ_ONLY,
          name: 'Read Only',
          description: 'View-only access to system data',
          permissions: [
            this.buildPermissionName(PermissionCategory.CLIENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.SERVICES, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.CLAIMS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.BILLING, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.PAYMENTS, PermissionAction.VIEW),
            this.buildPermissionName(PermissionCategory.REPORTS, PermissionAction.VIEW)
          ]
        }
      ];
      
      // Create each role if it doesn't exist
      for (const roleConfig of defaultRoles) {
        // Check if role already exists
        const existingRole = await trx('roles')
          .whereRaw('LOWER(name) = LOWER(?)', [roleConfig.name])
          .first();
        
        if (!existingRole) {
          // Create the role
          const roleId = uuidv4();
          await trx('roles').insert({
            id: roleId,
            name: roleConfig.name,
            description: roleConfig.description,
            is_system: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          // Add permissions to the role
          if (roleConfig.permissions.includes('*')) {
            // Add all permissions for administrator
            const allPermissions = Array.from(permissionMap.values());
            const permissionGrants = allPermissions.map(permissionId => ({
              id: uuidv4(),
              role_id: roleId,
              permission_id: permissionId,
              created_at: new Date()
            }));
            
            await trx('permission_grants').insert(permissionGrants);
          } else {
            // Add specific permissions for this role
            const permissionGrants = roleConfig.permissions
              .filter(permName => permissionMap.has(permName))
              .map(permName => ({
                id: uuidv4(),
                role_id: roleId,
                permission_id: permissionMap.get(permName),
                created_at: new Date()
              }));
            
            if (permissionGrants.length > 0) {
              await trx('permission_grants').insert(permissionGrants);
            }
          }
          
          logger.info(`Created default role: ${roleConfig.name}`);
        }
      }
      
      // Commit the transaction if we started it
      if (!options.transaction) {
        await trx.commit();
      }
    } catch (error) {
      // Rollback the transaction if we started it
      if (!options.transaction) {
        await trx.rollback();
      }
      
      logger.error('Error creating default roles', { error });
      throw error;
    }
  }
}

// Create a singleton instance
export const roleRepository = new RoleRepository();