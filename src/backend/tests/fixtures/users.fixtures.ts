/**
 * User test fixtures for the HCBS Revenue Management System
 * 
 * Provides mock user data, roles, permissions, and related objects
 * for use in unit and integration tests throughout the application.
 * 
 * @module users.fixtures
 */

import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { UUID, Timestamp, ContactInfo } from '../../types/common.types';
import { 
  User, 
  UserStatus, 
  UserRole, 
  UserProfile, 
  Role, 
  Permission, 
  PermissionCategory, 
  PermissionAction 
} from '../../types/users.types';
import { MfaMethod, AuthProvider } from '../../types/auth.types';

// Default mock contact information
export const mockContactInfo: ContactInfo = {
  email: 'user@example.com',
  phone: '555-123-4567',
  alternatePhone: null,
  fax: null
};

/**
 * Creates a mock contact information object for testing
 * 
 * @param overrides Optional properties to override the default values
 * @returns A complete mock contact information object
 */
export const createMockContactInfo = (overrides?: Partial<ContactInfo>): ContactInfo => {
  return {
    email: 'user@example.com',
    phone: '555-123-4567',
    alternatePhone: null,
    fax: null,
    ...overrides
  };
};

/**
 * Creates a mock permission object for testing
 * 
 * @param overrides Optional properties to override the default values
 * @returns A complete mock permission object
 */
export const createMockPermission = (overrides?: Partial<Permission>): Permission => {
  return {
    id: overrides?.id || uuidv4(),
    name: overrides?.name || 'View Clients',
    description: overrides?.description || 'Allows viewing client information',
    category: overrides?.category || PermissionCategory.CLIENTS,
    action: overrides?.action || PermissionAction.VIEW,
    resource: overrides?.resource || 'clients',
    isSystem: overrides?.isSystem !== undefined ? overrides.isSystem : true
  };
};

// Mock permission sets for different roles
export const mockAdminPermissions: Permission[] = [
  createMockPermission({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Manage Users',
    description: 'Full control over user management',
    category: PermissionCategory.USERS,
    action: PermissionAction.MANAGE,
    resource: 'users'
  }),
  createMockPermission({
    id: 'b2c3d4e5-f6a1-7890-abcd-ef1234567890',
    name: 'Manage System',
    description: 'Full control over system configuration',
    category: PermissionCategory.SYSTEM,
    action: PermissionAction.MANAGE,
    resource: 'system'
  })
];

export const mockFinancialManagerPermissions: Permission[] = [
  createMockPermission({
    id: 'c3d4e5f6-a1b2-7890-abcd-ef1234567890',
    name: 'Manage Payments',
    description: 'Full control over payment management',
    category: PermissionCategory.PAYMENTS,
    action: PermissionAction.MANAGE,
    resource: 'payments'
  }),
  createMockPermission({
    id: 'd4e5f6a1-b2c3-7890-abcd-ef1234567890',
    name: 'View Reports',
    description: 'Access to financial reports',
    category: PermissionCategory.REPORTS,
    action: PermissionAction.VIEW,
    resource: 'reports'
  })
];

export const mockBillingSpecialistPermissions: Permission[] = [
  createMockPermission({
    id: 'e5f6a1b2-c3d4-7890-abcd-ef1234567890',
    name: 'Manage Claims',
    description: 'Full control over claims management',
    category: PermissionCategory.CLAIMS,
    action: PermissionAction.MANAGE,
    resource: 'claims'
  }),
  createMockPermission({
    id: 'f6a1b2c3-d4e5-7890-abcd-ef1234567890',
    name: 'Manage Billing',
    description: 'Full control over billing operations',
    category: PermissionCategory.BILLING,
    action: PermissionAction.MANAGE,
    resource: 'billing'
  })
];

export const mockProgramManagerPermissions: Permission[] = [
  createMockPermission({
    id: 'a2b3c4d5-e6f7-8901-abcd-ef1234567890',
    name: 'Manage Services',
    description: 'Full control over service management',
    category: PermissionCategory.SERVICES,
    action: PermissionAction.MANAGE,
    resource: 'services'
  }),
  createMockPermission({
    id: 'b3c4d5e6-f7a2-8901-abcd-ef1234567890',
    name: 'Manage Clients',
    description: 'Full control over client management',
    category: PermissionCategory.CLIENTS,
    action: PermissionAction.MANAGE,
    resource: 'clients'
  })
];

export const mockReadOnlyPermissions: Permission[] = [
  createMockPermission({
    id: 'c4d5e6f7-a2b3-8901-abcd-ef1234567890',
    name: 'View Clients',
    description: 'Read-only access to client information',
    category: PermissionCategory.CLIENTS,
    action: PermissionAction.VIEW,
    resource: 'clients'
  }),
  createMockPermission({
    id: 'd5e6f7a2-b3c4-8901-abcd-ef1234567890',
    name: 'View Reports',
    description: 'Read-only access to reports',
    category: PermissionCategory.REPORTS,
    action: PermissionAction.VIEW,
    resource: 'reports'
  })
];

/**
 * Creates a mock role object for testing
 * 
 * @param overrides Optional properties to override the default values
 * @returns A complete mock role object
 */
export const createMockRole = (overrides?: Partial<Role>): Role => {
  return {
    id: overrides?.id || uuidv4(),
    name: overrides?.name || 'Test Role',
    description: overrides?.description || 'A role for testing purposes',
    isSystem: overrides?.isSystem !== undefined ? overrides.isSystem : true,
    permissions: overrides?.permissions || [createMockPermission()],
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    createdBy: overrides?.createdBy || null,
    updatedBy: overrides?.updatedBy || null
  };
};

// Mock roles
export const mockAdminRole: Role = createMockRole({
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Administrator',
  description: 'Full system access',
  permissions: mockAdminPermissions
});

export const mockFinancialManagerRole: Role = createMockRole({
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Financial Manager',
  description: 'Manages financial operations',
  permissions: mockFinancialManagerPermissions
});

export const mockBillingSpecialistRole: Role = createMockRole({
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Billing Specialist',
  description: 'Manages billing and claims',
  permissions: mockBillingSpecialistPermissions
});

export const mockProgramManagerRole: Role = createMockRole({
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Program Manager',
  description: 'Manages programs and services',
  permissions: mockProgramManagerPermissions
});

export const mockReadOnlyRole: Role = createMockRole({
  id: '55555555-5555-5555-5555-555555555555',
  name: 'Read-Only User',
  description: 'View-only access to reports and data',
  permissions: mockReadOnlyPermissions
});

export const mockRoles: Role[] = [
  mockAdminRole,
  mockFinancialManagerRole,
  mockBillingSpecialistRole,
  mockProgramManagerRole,
  mockReadOnlyRole
];

/**
 * Creates a complete mock user object for testing
 * 
 * @param overrides Optional properties to override the default values
 * @returns A complete mock user object with all required properties
 */
export const createMockUser = (overrides?: Partial<User>): User => {
  const now = new Date();
  
  return {
    id: overrides?.id || uuidv4(),
    email: overrides?.email || 'user@example.com',
    firstName: overrides?.firstName || 'Test',
    lastName: overrides?.lastName || 'User',
    passwordHash: overrides?.passwordHash || '$2a$10$aCNXgzXZ0.3fzdUT8MnZUuQmPxlQIFXsrNpYQGnNnlT9KTk17jAVK', // hashed version of 'Password123!'
    passwordSalt: overrides?.passwordSalt || 'abcdefghijklmnopqrstuvwxyz123456',
    passwordLastChanged: overrides?.passwordLastChanged || now,
    passwordResetRequired: overrides?.passwordResetRequired !== undefined ? overrides.passwordResetRequired : false,
    roleId: overrides?.roleId || mockAdminRole.id,
    status: overrides?.status || UserStatus.ACTIVE,
    failedLoginAttempts: overrides?.failedLoginAttempts || 0,
    lockedUntil: overrides?.lockedUntil || null,
    lastLogin: overrides?.lastLogin || new Date(now.getTime() - 86400000), // 1 day ago
    mfaEnabled: overrides?.mfaEnabled !== undefined ? overrides.mfaEnabled : false,
    mfaMethod: overrides?.mfaMethod || null,
    authProvider: overrides?.authProvider || AuthProvider.LOCAL,
    contactInfo: overrides?.contactInfo || createMockContactInfo()
  };
};

/**
 * Creates a mock user profile object for testing
 * 
 * @param overrides Optional properties to override the default values
 * @returns A complete mock user profile object
 */
export const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => {
  const firstName = overrides?.firstName || 'Test';
  const lastName = overrides?.lastName || 'User';
  
  return {
    id: overrides?.id || uuidv4(),
    email: overrides?.email || 'user@example.com',
    firstName,
    lastName,
    fullName: overrides?.fullName || `${firstName} ${lastName}`,
    roleId: overrides?.roleId || mockAdminRole.id,
    roleName: overrides?.roleName || 'Administrator',
    status: overrides?.status || UserStatus.ACTIVE,
    lastLogin: overrides?.lastLogin || new Date(new Date().getTime() - 86400000), // 1 day ago
    mfaEnabled: overrides?.mfaEnabled !== undefined ? overrides.mfaEnabled : false,
    mfaMethod: overrides?.mfaMethod || null,
    authProvider: overrides?.authProvider || AuthProvider.LOCAL,
    contactInfo: overrides?.contactInfo || createMockContactInfo(),
    createdAt: overrides?.createdAt || new Date(new Date().getTime() - 2592000000), // 30 days ago
    updatedAt: overrides?.updatedAt || new Date()
  };
};

/**
 * Creates an array of mock user objects for testing
 * 
 * @param count Number of users to create
 * @param overrides Optional properties to override the default values
 * @returns An array of mock user objects
 */
export const createMockUsers = (count: number, overrides?: Partial<User>): User[] => {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    users.push(createMockUser({
      ...overrides,
      id: uuidv4(),
      email: overrides?.email || `user${i + 1}@example.com`
    }));
  }
  
  return users;
};

// Mock user objects for different roles and states

// Administrator user
export const mockAdminUser: User = createMockUser({
  id: 'aaaaaaaa-1111-1111-1111-111111111111',
  email: 'admin@thinkcaring.com',
  firstName: 'Admin',
  lastName: 'User',
  roleId: mockAdminRole.id,
  contactInfo: createMockContactInfo({
    email: 'admin@thinkcaring.com',
    phone: '555-111-2222'
  })
});

// Financial Manager user
export const mockFinancialManagerUser: User = createMockUser({
  id: 'bbbbbbbb-2222-2222-2222-222222222222',
  email: 'finance@thinkcaring.com',
  firstName: 'Finance',
  lastName: 'Manager',
  roleId: mockFinancialManagerRole.id,
  contactInfo: createMockContactInfo({
    email: 'finance@thinkcaring.com',
    phone: '555-222-3333'
  })
});

// Billing Specialist user
export const mockBillingSpecialistUser: User = createMockUser({
  id: 'cccccccc-3333-3333-3333-333333333333',
  email: 'billing@thinkcaring.com',
  firstName: 'Billing',
  lastName: 'Specialist',
  roleId: mockBillingSpecialistRole.id,
  contactInfo: createMockContactInfo({
    email: 'billing@thinkcaring.com',
    phone: '555-333-4444'
  })
});

// Program Manager user
export const mockProgramManagerUser: User = createMockUser({
  id: 'dddddddd-4444-4444-4444-444444444444',
  email: 'program@thinkcaring.com',
  firstName: 'Program',
  lastName: 'Manager',
  roleId: mockProgramManagerRole.id,
  contactInfo: createMockContactInfo({
    email: 'program@thinkcaring.com',
    phone: '555-444-5555'
  })
});

// Read-Only user
export const mockReadOnlyUser: User = createMockUser({
  id: 'eeeeeeee-5555-5555-5555-555555555555',
  email: 'readonly@thinkcaring.com',
  firstName: 'ReadOnly',
  lastName: 'User',
  roleId: mockReadOnlyRole.id,
  contactInfo: createMockContactInfo({
    email: 'readonly@thinkcaring.com',
    phone: '555-555-6666'
  })
});

// Inactive user
export const mockInactiveUser: User = createMockUser({
  id: 'ffffffff-6666-6666-6666-666666666666',
  email: 'inactive@thinkcaring.com',
  firstName: 'Inactive',
  lastName: 'User',
  status: UserStatus.INACTIVE,
  roleId: mockReadOnlyRole.id,
  contactInfo: createMockContactInfo({
    email: 'inactive@thinkcaring.com',
    phone: '555-666-7777'
  })
});

// Locked user
export const mockLockedUser: User = createMockUser({
  id: 'gggggggg-7777-7777-7777-777777777777',
  email: 'locked@thinkcaring.com',
  firstName: 'Locked',
  lastName: 'User',
  status: UserStatus.LOCKED,
  failedLoginAttempts: 5,
  lockedUntil: new Date(new Date().getTime() + 3600000), // 1 hour from now
  roleId: mockReadOnlyRole.id,
  contactInfo: createMockContactInfo({
    email: 'locked@thinkcaring.com',
    phone: '555-777-8888'
  })
});

// User requiring password reset
export const mockPasswordResetUser: User = createMockUser({
  id: 'hhhhhhhh-8888-8888-8888-888888888888',
  email: 'reset@thinkcaring.com',
  firstName: 'Password',
  lastName: 'Reset',
  status: UserStatus.PASSWORD_RESET,
  passwordResetRequired: true,
  roleId: mockReadOnlyRole.id,
  contactInfo: createMockContactInfo({
    email: 'reset@thinkcaring.com',
    phone: '555-888-9999'
  })
});

// User with MFA enabled
export const mockMfaEnabledUser: User = createMockUser({
  id: 'iiiiiiii-9999-9999-9999-999999999999',
  email: 'mfa@thinkcaring.com',
  firstName: 'MFA',
  lastName: 'Enabled',
  mfaEnabled: true,
  mfaMethod: MfaMethod.TOTP,
  roleId: mockAdminRole.id,
  contactInfo: createMockContactInfo({
    email: 'mfa@thinkcaring.com',
    phone: '555-999-0000'
  })
});

// Array of mock users
export const mockUsers: User[] = [
  mockAdminUser,
  mockFinancialManagerUser,
  mockBillingSpecialistUser,
  mockProgramManagerUser,
  mockReadOnlyUser
];