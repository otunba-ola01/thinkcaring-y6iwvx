/**
 * Defines TypeScript types, interfaces, and enums related to users, roles, and permissions
 * for the HCBS Revenue Management System frontend. This file provides type definitions
 * for user profiles, role-based access control, and user management functionality.
 */

import { 
  UUID, 
  ISO8601DateTime, 
  PaginationParams, 
  SortParams, 
  FilterParams, 
  EntityBase,
  ContactInfo 
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
  PASSWORD_RESET = 'passwordReset'
}

/**
 * Enum for predefined system roles
 */
export enum UserRole {
  ADMINISTRATOR = 'administrator',
  FINANCIAL_MANAGER = 'financialManager',
  BILLING_SPECIALIST = 'billingSpecialist',
  PROGRAM_MANAGER = 'programManager',
  READ_ONLY = 'readOnly'
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
 * Interface for user profile data returned to clients (excludes sensitive information)
 */
export interface UserProfile {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roleId: UUID;
  roleName: string;
  status: UserStatus;
  lastLogin: ISO8601DateTime | null;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  authProvider: AuthProvider;
  contactInfo: ContactInfo;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
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
  sendInvitation: boolean;
}

/**
 * Interface for updating an existing user
 */
export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  roleId: UUID;
  status: UserStatus;
  contactInfo: ContactInfo;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
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
  status: UserStatus | UserStatus[];
  roleId: UUID | UUID[];
  search: string;
  mfaEnabled: boolean;
  createdAfter: ISO8601DateTime;
  createdBefore: ISO8601DateTime;
  lastLoginAfter: ISO8601DateTime;
  lastLoginBefore: ISO8601DateTime;
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
 * Interface for role data with associated permissions
 */
export interface Role {
  id: UUID;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
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
 * Interface for user permissions data
 */
export interface UserPermissions {
  userId: UUID;
  roleId: UUID;
  roleName: string;
  permissions: Permission[];
}

/**
 * Interface for user form data used in the UI
 */
export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  roleId: UUID;
  status: UserStatus;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  contactInfo: ContactInfo;
  passwordResetRequired: boolean;
  sendInvitation: boolean;
}

/**
 * Interface for paginated user list response
 */
export interface UserListResponse {
  items: UserProfile[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface for paginated role list response
 */
export interface RoleListResponse {
  items: Role[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}