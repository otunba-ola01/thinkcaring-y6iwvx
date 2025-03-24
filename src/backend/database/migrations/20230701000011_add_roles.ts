import { Knex } from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Migration, DatabaseIndexType, DatabaseConstraintType } from '../../types/database.types';
import { UserRole } from '../../types/users.types';

/**
 * Migration to create roles table and populate with default system roles
 */
const up = async (knex: Knex): Promise<void> => {
  // Create roles table
  await createRolesTable(knex);
  
  // Create role_permissions junction table
  await createRolePermissionsTable(knex);
  
  // Insert default system roles
  await insertDefaultRoles(knex);
};

/**
 * Revert the roles migration
 */
const down = async (knex: Knex): Promise<void> => {
  // Drop tables in proper order to maintain referential integrity
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('roles');
};

/**
 * Helper function to create roles table
 */
const createRolesTable = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary();
    table.string('name', 100).notNullable().unique();
    table.text('description').notNullable();
    table.boolean('is_system').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable().references('id').inTable('users');
    table.uuid('updated_by').nullable().references('id').inTable('users');
    
    // Create index on name for searching by role name
    table.index(['name'], 'idx_roles_name', { indexType: DatabaseIndexType.BTREE });
  });
};

/**
 * Helper function to create role_permissions junction table
 */
const createRolePermissionsTable = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable().references('id').inTable('users');
    
    // Create composite primary key
    table.primary(['role_id', 'permission_id']);
    
    // Create indexes for efficient lookups
    table.index(['role_id'], 'idx_role_permissions_role_id', { indexType: DatabaseIndexType.BTREE });
    table.index(['permission_id'], 'idx_role_permissions_permission_id', { indexType: DatabaseIndexType.BTREE });
  });
};

/**
 * Helper function to insert default system roles
 */
const insertDefaultRoles = async (knex: Knex): Promise<void> => {
  const defaultRoles = [
    {
      id: uuidv4(),
      name: UserRole.ADMINISTRATOR,
      description: 'Full system access with all permissions',
      is_system: true
    },
    {
      id: uuidv4(),
      name: UserRole.FINANCIAL_MANAGER,
      description: 'Access to financial reports and dashboards',
      is_system: true
    },
    {
      id: uuidv4(),
      name: UserRole.BILLING_SPECIALIST,
      description: 'Access to claims and billing functions',
      is_system: true
    },
    {
      id: uuidv4(),
      name: UserRole.PROGRAM_MANAGER,
      description: 'Limited access to program-specific data',
      is_system: true
    },
    {
      id: uuidv4(),
      name: UserRole.READ_ONLY,
      description: 'View-only access to reports and dashboards',
      is_system: true
    }
  ];
  
  await knex('roles').insert(defaultRoles);
};

export default { up, down };