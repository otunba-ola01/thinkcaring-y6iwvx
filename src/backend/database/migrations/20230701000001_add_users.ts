import { Knex } from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import * as bcrypt from 'bcrypt'; // ^5.1.0

import { Transaction } from '../../types/database.types';
import { 
  UserStatus, 
  UserRole, 
  PermissionCategory, 
  PermissionAction 
} from '../../types/users.types';
import { AuthProvider } from '../../types/auth.types';

/**
 * Migration function to add initial users, roles, and permissions to the database
 * @param knex - Knex instance
 * @returns Promise resolving when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create default permissions
  const permissionMap = await createDefaultPermissions(knex);
  
  // Create default roles and assign permissions
  const roleMap = await createDefaultRoles(knex, permissionMap);
  
  // Create default users and assign roles
  await createDefaultUsers(knex, roleMap);
}

/**
 * Migration function to remove initial users, roles, and permissions from the database
 * @param knex - Knex instance
 * @returns Promise resolving when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Remove default users
  await knex('users')
    .whereIn('email', [
      'admin@thinkcaring.com',
      'financialmanager@thinkcaring.com',
      'billingspecialist@thinkcaring.com',
      'programmanager@thinkcaring.com',
      'readonly@thinkcaring.com'
    ])
    .delete();

  // Remove role-permission associations for default roles
  await knex('role_permissions')
    .whereIn('role_id', function() {
      this.select('id').from('roles').whereIn('name', Object.values(UserRole));
    })
    .delete();

  // Remove default roles
  await knex('roles')
    .whereIn('name', Object.values(UserRole))
    .delete();

  // Remove default permissions
  await knex('permissions')
    .delete();
}

/**
 * Creates default permissions for the system
 * @param knex - Knex instance
 * @returns Map of permission names to their IDs
 */
async function createDefaultPermissions(knex: Knex): Promise<Record<string, string>> {
  const permissionMap: Record<string, string> = {};
  
  // Define all the permissions based on categories and actions
  const permissionsToCreate = [];
  
  // Iterate through permission categories
  for (const category of Object.values(PermissionCategory)) {
    // Determine which actions are applicable for this category
    let applicableActions: PermissionAction[];
    
    switch (category) {
      case PermissionCategory.USERS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.MANAGE
        ];
        break;
      case PermissionCategory.CLIENTS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.EXPORT,
          PermissionAction.IMPORT
        ];
        break;
      case PermissionCategory.SERVICES:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.EXPORT,
          PermissionAction.IMPORT
        ];
        break;
      case PermissionCategory.CLAIMS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.SUBMIT,
          PermissionAction.EXPORT
        ];
        break;
      case PermissionCategory.BILLING:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.SUBMIT,
          PermissionAction.EXPORT
        ];
        break;
      case PermissionCategory.PAYMENTS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.UPDATE,
          PermissionAction.APPROVE,
          PermissionAction.EXPORT,
          PermissionAction.IMPORT
        ];
        break;
      case PermissionCategory.REPORTS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.CREATE,
          PermissionAction.EXPORT
        ];
        break;
      case PermissionCategory.SETTINGS:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.UPDATE,
          PermissionAction.MANAGE
        ];
        break;
      case PermissionCategory.SYSTEM:
        applicableActions = [
          PermissionAction.VIEW,
          PermissionAction.UPDATE,
          PermissionAction.MANAGE
        ];
        break;
      default:
        applicableActions = Object.values(PermissionAction);
    }
    
    // Create permission objects for each applicable action
    for (const action of applicableActions) {
      const permissionName = `${category}.${action}`;
      const permissionId = uuidv4();
      
      permissionsToCreate.push({
        id: permissionId,
        name: permissionName,
        description: `Permission to ${action} ${category}`,
        category,
        action,
        resource: null,
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      permissionMap[permissionName] = permissionId;
    }
  }
  
  // Insert permissions if they don't exist
  if (permissionsToCreate.length > 0) {
    await knex('permissions')
      .insert(permissionsToCreate)
      .onConflict('name')
      .ignore();
  }
  
  return permissionMap;
}

/**
 * Creates default roles for the system and assigns permissions
 * @param knex - Knex instance
 * @param permissionMap - Map of permission names to their IDs
 * @returns Map of role names to their IDs
 */
async function createDefaultRoles(
  knex: Knex, 
  permissionMap: Record<string, string>
): Promise<Record<string, string>> {
  const roleMap: Record<string, string> = {};
  
  // Define roles with their permissions
  const roles = [
    {
      id: uuidv4(),
      name: UserRole.ADMINISTRATOR,
      description: 'System administrator with full access to all features and functionality',
      is_system: true,
      created_at: new Date(),
      updated_at: new Date(),
      // Administrator has all permissions
      permissions: Object.keys(permissionMap)
    },
    {
      id: uuidv4(),
      name: UserRole.FINANCIAL_MANAGER,
      description: 'Financial manager with access to financial data, reports, and approval capabilities',
      is_system: true,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: [
        // View access to everything
        `${PermissionCategory.USERS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.EXPORT}`,
        // Full access to financial functions
        `${PermissionCategory.SERVICES}.${PermissionAction.VIEW}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.SUBMIT}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.BILLING}.${PermissionAction.VIEW}`,
        `${PermissionCategory.BILLING}.${PermissionAction.CREATE}`,
        `${PermissionCategory.BILLING}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.BILLING}.${PermissionAction.SUBMIT}`,
        `${PermissionCategory.BILLING}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.APPROVE}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.IMPORT}`,
        // Full access to reports
        `${PermissionCategory.REPORTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.EXPORT}`,
        // Some settings access
        `${PermissionCategory.SETTINGS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.SETTINGS}.${PermissionAction.UPDATE}`
      ]
    },
    {
      id: uuidv4(),
      name: UserRole.BILLING_SPECIALIST,
      description: 'Billing specialist responsible for claim creation, submission, and payment reconciliation',
      is_system: true,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: [
        // Limited client access
        `${PermissionCategory.CLIENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.EXPORT}`,
        // Full access to billing functions
        `${PermissionCategory.SERVICES}.${PermissionAction.VIEW}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.CREATE}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.SUBMIT}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.BILLING}.${PermissionAction.VIEW}`,
        `${PermissionCategory.BILLING}.${PermissionAction.CREATE}`,
        `${PermissionCategory.BILLING}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.BILLING}.${PermissionAction.SUBMIT}`,
        `${PermissionCategory.BILLING}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.EXPORT}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.IMPORT}`,
        // Limited report access
        `${PermissionCategory.REPORTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.EXPORT}`
      ]
    },
    {
      id: uuidv4(),
      name: UserRole.PROGRAM_MANAGER,
      description: 'Program manager with access to program-specific data and reports',
      is_system: true,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: [
        // Client management
        `${PermissionCategory.CLIENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.CREATE}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.CLIENTS}.${PermissionAction.EXPORT}`,
        // Service management
        `${PermissionCategory.SERVICES}.${PermissionAction.VIEW}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.CREATE}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.UPDATE}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.EXPORT}`,
        // Limited financial access
        `${PermissionCategory.CLAIMS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.BILLING}.${PermissionAction.VIEW}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.VIEW}`,
        // Report access
        `${PermissionCategory.REPORTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.EXPORT}`
      ]
    },
    {
      id: uuidv4(),
      name: UserRole.READ_ONLY,
      description: 'Read-only user with view access to data and reports',
      is_system: true,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: [
        // View-only access
        `${PermissionCategory.CLIENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.SERVICES}.${PermissionAction.VIEW}`,
        `${PermissionCategory.CLAIMS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.BILLING}.${PermissionAction.VIEW}`,
        `${PermissionCategory.PAYMENTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.VIEW}`,
        `${PermissionCategory.REPORTS}.${PermissionAction.EXPORT}`
      ]
    }
  ];
  
  // Insert roles
  for (const role of roles) {
    const { permissions, ...roleData } = role;
    
    // Add role to the map
    roleMap[role.name] = role.id;
    
    // Insert role if it doesn't exist
    await knex('roles')
      .insert(roleData)
      .onConflict('name')
      .ignore();
    
    // Insert role permissions
    const rolePermissions = permissions.map(permissionName => ({
      id: uuidv4(),
      role_id: role.id,
      permission_id: permissionMap[permissionName],
      created_at: new Date()
    }));
    
    await knex('role_permissions')
      .insert(rolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }
  
  return roleMap;
}

/**
 * Creates default users for the system
 * @param knex - Knex instance
 * @param roleMap - Map of role names to their IDs
 */
async function createDefaultUsers(
  knex: Knex, 
  roleMap: Record<string, string>
): Promise<void> {
  // Default password for demo accounts - in production, these would be changed
  // immediately or users would be required to set their own passwords
  const defaultPassword = 'P@ssw0rd123';
  
  // Create admin user
  const adminPasswordData = await hashPassword('Admin@123!');
  
  const users = [
    {
      id: uuidv4(),
      email: 'admin@thinkcaring.com',
      first_name: 'System',
      last_name: 'Administrator',
      password_hash: adminPasswordData.hash,
      password_salt: adminPasswordData.salt,
      password_last_changed: new Date(),
      password_reset_required: false,
      role_id: roleMap[UserRole.ADMINISTRATOR],
      status: UserStatus.ACTIVE,
      failed_login_attempts: 0,
      locked_until: null,
      last_login: null,
      mfa_enabled: false,
      mfa_method: null,
      auth_provider: AuthProvider.LOCAL,
      contact_info: JSON.stringify({
        email: 'admin@thinkcaring.com',
        phone: '555-123-4567'
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  // Add demo users for each role
  const roles = [
    UserRole.FINANCIAL_MANAGER,
    UserRole.BILLING_SPECIALIST,
    UserRole.PROGRAM_MANAGER,
    UserRole.READ_ONLY
  ];
  
  for (const role of roles) {
    const passwordData = await hashPassword(defaultPassword);
    const roleName = role.toLowerCase().replace('_', '');
    
    users.push({
      id: uuidv4(),
      email: `${roleName}@thinkcaring.com`,
      first_name: role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
      last_name: 'User',
      password_hash: passwordData.hash,
      password_salt: passwordData.salt,
      password_last_changed: new Date(),
      password_reset_required: true, // Force password change on first login for security
      role_id: roleMap[role],
      status: UserStatus.ACTIVE,
      failed_login_attempts: 0,
      locked_until: null,
      last_login: null,
      mfa_enabled: false,
      mfa_method: null,
      auth_provider: AuthProvider.LOCAL,
      contact_info: JSON.stringify({
        email: `${roleName}@thinkcaring.com`,
        phone: '555-123-4567'
      }),
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  // Insert users
  await knex('users')
    .insert(users)
    .onConflict('email')
    .ignore();
}

/**
 * Hashes a password using bcrypt
 * @param password - The plain text password to hash
 * @returns Object containing the hash and salt
 */
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltRounds = 12; // Industry standard for high security
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  
  return { hash, salt };
}