/**
 * Defines TypeScript types and interfaces related to users, roles, and permissions
 * for the HCBS Revenue Management System.
 * 
 * This file contains type definitions for user profiles, authentication,
 * role-based access control, and permission management to ensure
 * type safety throughout the user management system.
 * 
 * @module users.types
 */

import { 
  UUID, 
  Timestamp, 
  AuditableEntity, 
  ContactInfo,
  PaginationParams,
  SortParams,
  FilterParams
} from './common.types';

import {
  MfaMethod,
  AuthProvider
} from './auth.types';

/**
 * Enum for user account status values
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  LOCKED = 'locked',
  PASSWORD_RESET = 'password_reset'
}

/**
 * Enum for predefined system roles
 */
export enum UserRole {
  ADMINISTRATOR = 'administrator',
  FINANCIAL_MANAGER = 'financial_manager',
  BILLING_SPECIALIST = 'billing_specialist',
  PROGRAM_MANAGER = 'program_manager',
  READ_ONLY = 'read_only'
}

/**
 * Enum for permission categories corresponding to system modules
 */
export enum PermissionCategory {
  USERS = 'users',
  CLIENTS = 'clients',
  SERVICES = 'services',
  CLAIMS = 'claims',
  BILLING = 'billing',
  PAYMENTS = 'payments',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  SYSTEM = 'system'
}

/**
 * Enum for permission actions that can be performed on resources
 */
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  SUBMIT = 'submit',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage'
}

/**
 * Interface for user data stored in the database
 */
export interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  passwordSalt: string;
  passwordLastChanged: Timestamp | null;
  passwordResetRequired: boolean;
  roleId: UUID;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil: Timestamp | null;
  lastLogin: Timestamp | null;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  authProvider: AuthProvider;
  contactInfo: ContactInfo;
}

/**
 * Interface for user profile data returned to clients (excludes sensitive information)
 */
export interface UserProfile {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string; // Derived field
  roleId: UUID;
  roleName: string;
  status: UserStatus;
  lastLogin: Timestamp | null;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  authProvider: AuthProvider;
  contactInfo: ContactInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Interface for creating a new user
 */
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: UUID;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  contactInfo: ContactInfo;
  passwordResetRequired: boolean;
  authProvider: AuthProvider;
}

/**
 * Interface for updating an existing user
 */
export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  roleId: UUID;
  contactInfo: ContactInfo;
}

/**
 * Interface for changing a user's password
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for filtering users in list operations
 */
export interface UserFilterParams {
  status?: UserStatus | UserStatus[];
  roleId?: UUID | UUID[];
  search?: string;
  mfaEnabled?: boolean;
  createdAfter?: Timestamp;
  createdBefore?: Timestamp;
  lastLoginAfter?: Timestamp;
  lastLoginBefore?: Timestamp;
}

/**
 * Interface for user list request parameters
 */
export interface UserListParams {
  pagination: PaginationParams;
  sort: SortParams;
  filter: UserFilterParams;
}

/**
 * Interface for permission data
 */
export interface Permission {
  id: UUID;
  name: string;
  description: string;
  category: PermissionCategory;
  action: PermissionAction;
  resource: string | null;
  isSystem: boolean;
}

/**
 * Interface for role-permission association
 */
export interface PermissionGrant {
  id: UUID;
  roleId: UUID;
  permissionId: UUID;
  createdAt: Timestamp;
  createdBy: UUID | null;
}

/**
 * Interface for role data with associated permissions
 */
export interface Role {
  id: UUID;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;
}

/**
 * Interface for creating a new role
 */
export interface CreateRoleDto {
  name: string;
  description: string;
  permissionIds: UUID[];
}

/**
 * Interface for updating an existing role
 */
export interface UpdateRoleDto {
  name: string;
  description: string;
  permissionIds: UUID[];
}

/**
 * Interface for user data with associated role information
 */
export interface UserWithRole {
  user: User;
  role: Role;
}

/**
 * Interface for user permissions data
 */
export interface UserPermissions {
  userId: UUID;
  roleId: UUID;
  roleName: string;
  permissions: Permission[];
}