import { v4 as uuid } from 'uuid'; // uuid v9.0.0
import { BaseRepository } from './base.repository';
import { 
  Permission, 
  PermissionCategory, 
  PermissionAction 
} from '../../types/users.types';
import { getKnexInstance } from '../connection';
import { Transaction, RepositoryOptions } from '../../types/database.types';
import { UUID } from '../../types/common.types';
import { logger } from '../../utils/logger';
import { BusinessError } from '../../errors/business-error';
import { NotFoundError } from '../../errors/not-found-error';

/**
 * Repository class for managing permissions in the database
 */
class PermissionRepository extends BaseRepository<Permission> {
  /**
   * Creates a new PermissionRepository instance
   */
  constructor() {
    // Call super constructor with 'permissions' table name and 'id' as primary key
    super('permissions', 'id');
  }

  /**
   * Finds a permission by its name (case insensitive)
   * 
   * @param name Permission name to search for
   * @param options Repository options
   * @returns The permission if found, null otherwise
   */
  async findByName(name: string, options: RepositoryOptions = {}): Promise<Permission | null> {
    try {
      logger.debug(`Finding permission by name: ${name}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
      
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByName');
    }
  }

  /**
   * Finds permissions by category
   * 
   * @param category Permission category to filter by
   * @param options Repository options
   * @returns Array of permissions in the specified category
   */
  async findByCategory(
    category: PermissionCategory, 
    options: RepositoryOptions = {}
  ): Promise<Permission[]> {
    try {
      logger.debug(`Finding permissions by category: ${category}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const results = await queryBuilder
        .where('category', category);
      
      return results;
    } catch (error) {
      this.handleDatabaseError(error, 'findByCategory');
    }
  }

  /**
   * Finds permissions by category and action
   * 
   * @param category Permission category to filter by
   * @param action Permission action to filter by
   * @param options Repository options
   * @returns Array of permissions matching the category and action
   */
  async findByCategoryAndAction(
    category: PermissionCategory,
    action: PermissionAction,
    options: RepositoryOptions = {}
  ): Promise<Permission[]> {
    try {
      logger.debug(`Finding permissions by category: ${category} and action: ${action}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const results = await queryBuilder
        .where({
          category,
          action
        });
      
      return results;
    } catch (error) {
      this.handleDatabaseError(error, 'findByCategoryAndAction');
    }
  }

  /**
   * Checks if a permission is assigned to any roles
   * 
   * @param permissionId ID of the permission to check
   * @param options Repository options
   * @returns True if the permission is assigned to any roles
   */
  async isPermissionAssignedToRoles(
    permissionId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Checking if permission ${permissionId} is assigned to any roles`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('permission_grants');
      
      if (options.transaction) {
        queryBuilder = options.transaction('permission_grants');
      }
      
      const exists = await queryBuilder
        .where('permission_id', permissionId)
        .first();
      
      return !!exists;
    } catch (error) {
      this.handleDatabaseError(error, 'isPermissionAssignedToRoles');
    }
  }

  /**
   * Builds a standardized permission name from category, action, and resource
   * 
   * @param category Permission category
   * @param action Permission action
   * @param resource Optional resource the permission applies to
   * @returns Formatted permission name
   */
  buildPermissionName(
    category: PermissionCategory,
    action: PermissionAction,
    resource: string | null = null
  ): string {
    const base = `${category.toUpperCase()}:${action.toUpperCase()}`;
    
    if (resource) {
      return `${base}:${resource.toUpperCase()}`;
    }
    
    return base;
  }

  /**
   * Creates the default system permissions if they don't exist
   * 
   * @param trx Optional transaction object
   * @returns Map of permission names to their IDs
   */
  async createDefaultPermissions(trx?: Transaction): Promise<Map<string, UUID>> {
    const permissionMap = new Map<string, UUID>();
    const internalTrx = trx || await getKnexInstance().transaction();
    
    try {
      logger.info('Creating default system permissions');
      
      // Define the default permissions for each category and action
      const defaultPermissions: {
        category: PermissionCategory;
        action: PermissionAction;
        description: string;
        resource?: string | null;
      }[] = [
        // User management permissions
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
          description: 'Create client records'
        },
        {
          category: PermissionCategory.CLIENTS,
          action: PermissionAction.UPDATE,
          description: 'Update client information'
        },
        {
          category: PermissionCategory.CLIENTS,
          action: PermissionAction.DELETE,
          description: 'Delete client records'
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
          action: PermissionAction.CREATE,
          description: 'Create billing records'
        },
        {
          category: PermissionCategory.BILLING,
          action: PermissionAction.UPDATE,
          description: 'Update billing information'
        },
        
        // Payment permissions
        {
          category: PermissionCategory.PAYMENTS,
          action: PermissionAction.VIEW,
          description: 'View payment information'
        },
        {
          category: PermissionCategory.PAYMENTS,
          action: PermissionAction.CREATE,
          description: 'Record payments'
        },
        {
          category: PermissionCategory.PAYMENTS,
          action: PermissionAction.UPDATE,
          description: 'Update payment information'
        },
        
        // Report permissions
        {
          category: PermissionCategory.REPORTS,
          action: PermissionAction.VIEW,
          description: 'View reports'
        },
        {
          category: PermissionCategory.REPORTS,
          action: PermissionAction.EXPORT,
          description: 'Export reports'
        },
        {
          category: PermissionCategory.REPORTS,
          action: PermissionAction.CREATE,
          description: 'Create custom reports'
        },
        
        // Settings permissions
        {
          category: PermissionCategory.SETTINGS,
          action: PermissionAction.VIEW,
          description: 'View system settings'
        },
        {
          category: PermissionCategory.SETTINGS,
          action: PermissionAction.UPDATE,
          description: 'Update system settings'
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
      
      // Check which permissions already exist
      for (const perm of defaultPermissions) {
        const permName = this.buildPermissionName(perm.category, perm.action, perm.resource);
        
        // Check if the permission already exists
        const existingPerm = await this.findByName(permName, { transaction: internalTrx });
        
        if (existingPerm) {
          // Permission already exists, add to map
          permissionMap.set(permName, existingPerm.id);
        } else {
          // Create the permission
          const permissionData: Partial<Permission> = {
            id: uuid(),
            name: permName,
            description: perm.description,
            category: perm.category,
            action: perm.action,
            resource: perm.resource || null,
            isSystem: true
          };
          
          const createdPerm = await super.create(permissionData, { transaction: internalTrx });
          permissionMap.set(permName, createdPerm.id);
          
          logger.info(`Created default permission: ${permName}`);
        }
      }
      
      // Commit the transaction if we started it
      if (!trx) {
        await internalTrx.commit();
      }
      
      return permissionMap;
    } catch (error) {
      // Rollback the transaction if we started it
      if (!trx) {
        await internalTrx.rollback();
      }
      this.handleDatabaseError(error, 'createDefaultPermissions');
    }
  }

  /**
   * Creates a new permission
   * 
   * @param permissionData Permission data to create
   * @param createdBy ID of the user creating the permission
   * @param options Repository options
   * @returns The newly created permission
   */
  async createPermission(
    permissionData: {
      name?: string;
      description: string;
      category: PermissionCategory;
      action: PermissionAction;
      resource?: string | null;
      isSystem?: boolean;
    },
    createdBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<Permission> {
    try {
      // If name is not provided, generate it
      const name = permissionData.name || 
        this.buildPermissionName(
          permissionData.category, 
          permissionData.action, 
          permissionData.resource || null
        );
      
      // Check if permission with this name already exists
      const existing = await this.findByName(name, options);
      if (existing) {
        throw new BusinessError(
          `Permission with name ${name} already exists`,
          { existingId: existing.id },
          'DUPLICATE_PERMISSION_NAME'
        );
      }
      
      // Create the permission
      const permission: Partial<Permission> = {
        id: uuid(),
        name,
        description: permissionData.description,
        category: permissionData.category,
        action: permissionData.action,
        resource: permissionData.resource || null,
        isSystem: permissionData.isSystem || false
      };
      
      const createdPermission = await super.create(permission, {
        ...options,
        createdBy
      });
      
      logger.info(`Created permission with ID ${createdPermission.id}`, { permission: name });
      
      return createdPermission;
    } catch (error) {
      // If it's already a BusinessError, rethrow it
      if (error instanceof BusinessError) {
        throw error;
      }
      this.handleDatabaseError(error, 'createPermission');
    }
  }

  /**
   * Updates an existing permission
   * 
   * @param id ID of the permission to update
   * @param permissionData Permission data to update
   * @param updatedBy ID of the user updating the permission
   * @param options Repository options
   * @returns The updated permission
   */
  async updatePermission(
    id: UUID,
    permissionData: {
      name?: string;
      description?: string;
      category?: PermissionCategory;
      action?: PermissionAction;
      resource?: string | null;
    },
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<Permission> {
    try {
      // Check if permission exists
      const existing = await super.findById(id, options);
      if (!existing) {
        throw new NotFoundError('Permission not found', 'permission', id);
      }
      
      // Check if this is a system permission (cannot modify system permissions)
      if (existing.isSystem) {
        throw new BusinessError(
          'Cannot modify system permission',
          { permissionId: id },
          'MODIFY_SYSTEM_PERMISSION'
        );
      }
      
      // If name is changing, check if new name already exists
      if (permissionData.name && permissionData.name !== existing.name) {
        const nameExists = await this.findByName(permissionData.name, options);
        if (nameExists && nameExists.id !== id) {
          throw new BusinessError(
            `Permission with name ${permissionData.name} already exists`,
            { existingId: nameExists.id },
            'DUPLICATE_PERMISSION_NAME'
          );
        }
      }
      
      // Update the permission
      const updatedPermission = await super.update(id, permissionData, {
        ...options,
        updatedBy
      });
      
      logger.info(`Updated permission with ID ${id}`, { 
        permissionName: updatedPermission.name 
      });
      
      return updatedPermission;
    } catch (error) {
      // If it's already a BusinessError or NotFoundError, rethrow it
      if (error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleDatabaseError(error, 'updatePermission');
    }
  }

  /**
   * Deletes a permission if it's not a system permission and not assigned to any roles
   * 
   * @param id ID of the permission to delete
   * @param options Repository options
   * @returns True if permission was deleted successfully
   */
  async deletePermission(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      // Check if permission exists
      const existing = await super.findById(id, options);
      if (!existing) {
        throw new NotFoundError('Permission not found', 'permission', id);
      }
      
      // Check if this is a system permission (cannot delete system permissions)
      if (existing.isSystem) {
        throw new BusinessError(
          'Cannot delete system permission',
          { permissionId: id },
          'DELETE_SYSTEM_PERMISSION'
        );
      }
      
      // Check if permission is assigned to any roles
      const isAssigned = await this.isPermissionAssignedToRoles(id, options);
      if (isAssigned) {
        throw new BusinessError(
          'Cannot delete permission that is assigned to roles',
          { permissionId: id },
          'PERMISSION_IN_USE'
        );
      }
      
      // Delete the permission
      const deleted = await super.delete(id, options);
      
      if (deleted) {
        logger.info(`Deleted permission with ID ${id}`, { 
          permissionName: existing.name 
        });
      }
      
      return deleted;
    } catch (error) {
      // If it's already a BusinessError or NotFoundError, rethrow it
      if (error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleDatabaseError(error, 'deletePermission');
    }
  }
}

// Create singleton instance
const permissionRepository = new PermissionRepository();

// Export the class and instance
export { PermissionRepository, permissionRepository };