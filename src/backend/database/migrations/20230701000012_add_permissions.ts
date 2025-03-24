import { Knex } from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Migration, DatabaseIndexType } from '../../types/database.types';
import { PermissionCategory, PermissionAction } from '../../types/users.types';

/**
 * Migration to create the permissions table and insert default system permissions
 */
export const up = async (knex: Knex): Promise<void> => {
  // Create the permissions table
  await createPermissionsTable(knex);
  
  // Insert default permissions
  await insertDefaultPermissions(knex);
};

/**
 * Revert the migration by dropping the permissions table
 */
export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('permissions');
};

/**
 * Helper function to create the permissions table with all required columns and indexes
 */
const createPermissionsTable = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('permissions', (table) => {
    // Primary key
    table.uuid('id').primary().notNullable();
    
    // Permission details
    table.string('name', 100).unique().notNullable();
    table.text('description').notNullable();
    table.string('category', 50).notNullable();
    table.string('action', 50).notNullable();
    table.string('resource', 100).nullable();
    table.boolean('is_system').notNullable().defaultTo(false);
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable().references('id').inTable('users');
    table.uuid('updated_by').nullable().references('id').inTable('users');
    
    // Indexes
    table.index('name', 'idx_permissions_name', DatabaseIndexType.BTREE);
    table.index('category', 'idx_permissions_category', DatabaseIndexType.BTREE);
    table.index('action', 'idx_permissions_action', DatabaseIndexType.BTREE);
  });
};

/**
 * Helper function to insert default system permissions
 */
const insertDefaultPermissions = async (knex: Knex): Promise<void> => {
  const permissions = [];
  
  // USERS permissions
  permissions.push(
    createPermission(PermissionCategory.USERS, PermissionAction.VIEW, "View user accounts"),
    createPermission(PermissionCategory.USERS, PermissionAction.CREATE, "Create new user accounts"),
    createPermission(PermissionCategory.USERS, PermissionAction.UPDATE, "Update user account information"),
    createPermission(PermissionCategory.USERS, PermissionAction.DELETE, "Delete user accounts"),
    createPermission(PermissionCategory.USERS, PermissionAction.MANAGE, "Manage all aspects of user accounts including roles and permissions")
  );
  
  // CLIENTS permissions
  permissions.push(
    createPermission(PermissionCategory.CLIENTS, PermissionAction.VIEW, "View client information"),
    createPermission(PermissionCategory.CLIENTS, PermissionAction.CREATE, "Create new client records"),
    createPermission(PermissionCategory.CLIENTS, PermissionAction.UPDATE, "Update client information"),
    createPermission(PermissionCategory.CLIENTS, PermissionAction.DELETE, "Delete client records"),
    createPermission(PermissionCategory.CLIENTS, PermissionAction.EXPORT, "Export client data"),
    createPermission(PermissionCategory.CLIENTS, PermissionAction.IMPORT, "Import client data")
  );
  
  // SERVICES permissions
  permissions.push(
    createPermission(PermissionCategory.SERVICES, PermissionAction.VIEW, "View service records"),
    createPermission(PermissionCategory.SERVICES, PermissionAction.CREATE, "Create new service records"),
    createPermission(PermissionCategory.SERVICES, PermissionAction.UPDATE, "Update service information"),
    createPermission(PermissionCategory.SERVICES, PermissionAction.DELETE, "Delete service records"),
    createPermission(PermissionCategory.SERVICES, PermissionAction.EXPORT, "Export service data"),
    createPermission(PermissionCategory.SERVICES, PermissionAction.IMPORT, "Import service data")
  );
  
  // CLAIMS permissions
  permissions.push(
    createPermission(PermissionCategory.CLAIMS, PermissionAction.VIEW, "View claims"),
    createPermission(PermissionCategory.CLAIMS, PermissionAction.CREATE, "Create new claims"),
    createPermission(PermissionCategory.CLAIMS, PermissionAction.UPDATE, "Update claim information"),
    createPermission(PermissionCategory.CLAIMS, PermissionAction.DELETE, "Delete claims"),
    createPermission(PermissionCategory.CLAIMS, PermissionAction.SUBMIT, "Submit claims to payers"),
    createPermission(PermissionCategory.CLAIMS, PermissionAction.EXPORT, "Export claims data")
  );
  
  // BILLING permissions
  permissions.push(
    createPermission(PermissionCategory.BILLING, PermissionAction.VIEW, "View billing information"),
    createPermission(PermissionCategory.BILLING, PermissionAction.CREATE, "Create billing records"),
    createPermission(PermissionCategory.BILLING, PermissionAction.UPDATE, "Update billing information"),
    createPermission(PermissionCategory.BILLING, PermissionAction.SUBMIT, "Submit billing for processing"),
    createPermission(PermissionCategory.BILLING, PermissionAction.EXPORT, "Export billing data")
  );
  
  // PAYMENTS permissions
  permissions.push(
    createPermission(PermissionCategory.PAYMENTS, PermissionAction.VIEW, "View payment information"),
    createPermission(PermissionCategory.PAYMENTS, PermissionAction.CREATE, "Record new payments"),
    createPermission(PermissionCategory.PAYMENTS, PermissionAction.UPDATE, "Update payment information"),
    createPermission(PermissionCategory.PAYMENTS, PermissionAction.APPROVE, "Approve payment reconciliation"),
    createPermission(PermissionCategory.PAYMENTS, PermissionAction.EXPORT, "Export payment data")
  );
  
  // REPORTS permissions
  permissions.push(
    createPermission(PermissionCategory.REPORTS, PermissionAction.VIEW, "View reports"),
    createPermission(PermissionCategory.REPORTS, PermissionAction.CREATE, "Create custom reports"),
    createPermission(PermissionCategory.REPORTS, PermissionAction.EXPORT, "Export report data"),
    createPermission(PermissionCategory.REPORTS, PermissionAction.MANAGE, "Manage report configurations and schedules")
  );
  
  // SETTINGS permissions
  permissions.push(
    createPermission(PermissionCategory.SETTINGS, PermissionAction.VIEW, "View system settings"),
    createPermission(PermissionCategory.SETTINGS, PermissionAction.UPDATE, "Update system settings"),
    createPermission(PermissionCategory.SETTINGS, PermissionAction.MANAGE, "Manage all system configuration")
  );
  
  // SYSTEM permissions
  permissions.push(
    createPermission(PermissionCategory.SYSTEM, PermissionAction.VIEW, "View system information and logs"),
    createPermission(PermissionCategory.SYSTEM, PermissionAction.UPDATE, "Update system components"),
    createPermission(PermissionCategory.SYSTEM, PermissionAction.MANAGE, "Manage all system operations and maintenance")
  );
  
  // Insert all permissions in a batch
  if (permissions.length > 0) {
    await knex('permissions').insert(permissions);
  }
};

/**
 * Helper function to create a permission object
 */
const createPermission = (
  category: PermissionCategory,
  action: PermissionAction,
  description: string,
  resource: string | null = null
): any => {
  return {
    id: uuidv4(),
    name: buildPermissionName(category, action, resource),
    description,
    category,
    action,
    resource,
    is_system: true,
    created_at: new Date(),
    updated_at: new Date()
  };
};

/**
 * Helper function to build a standardized permission name
 */
const buildPermissionName = (
  category: PermissionCategory,
  action: PermissionAction,
  resource: string | null
): string => {
  // Format: CATEGORY.ACTION or CATEGORY.ACTION.RESOURCE
  const baseName = `${category.toUpperCase()}.${action.toUpperCase()}`;
  return resource ? `${baseName}.${resource.toUpperCase()}` : baseName;
};

export default { up, down };