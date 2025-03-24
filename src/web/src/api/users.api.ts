/**
 * API client functions for user management operations in the HCBS Revenue Management System.
 * Provides methods for creating, retrieving, updating, and deleting users, as well as
 * managing roles and permissions following HIPAA compliance requirements.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserListParams,
  UserListResponse,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  RoleListResponse,
  Permission,
  UserPermissions
} from '../types/users.types';

/**
 * Retrieves a paginated list of users with optional filtering and sorting
 * 
 * @param params - Parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated user list
 */
export async function getUsers(params: UserListParams): Promise<UserListResponse> {
  return apiClient.get(API_ENDPOINTS.USERS.BASE, params);
}

/**
 * Retrieves a single user by their ID
 * 
 * @param userId - ID of the user to retrieve
 * @returns Promise resolving to user profile
 */
export async function getUserById(userId: string): Promise<UserProfile> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/${userId}`);
}

/**
 * Retrieves the profile of the currently authenticated user
 * 
 * @returns Promise resolving to current user profile
 */
export async function getCurrentUser(): Promise<UserProfile> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/me`);
}

/**
 * Creates a new user in the system
 * 
 * @param userData - Data for the new user
 * @returns Promise resolving to created user profile
 */
export async function createUser(userData: CreateUserDto): Promise<UserProfile> {
  return apiClient.post(API_ENDPOINTS.USERS.BASE, userData);
}

/**
 * Updates an existing user's information
 * 
 * @param userId - ID of the user to update
 * @param userData - Updated user data
 * @returns Promise resolving to updated user profile
 */
export async function updateUser(userId: string, userData: UpdateUserDto): Promise<UserProfile> {
  return apiClient.put(`${API_ENDPOINTS.USERS.BASE}/${userId}`, userData);
}

/**
 * Deletes a user from the system
 * 
 * @param userId - ID of the user to delete
 * @returns Promise resolving when user is deleted
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiClient.del(`${API_ENDPOINTS.USERS.BASE}/${userId}`);
}

/**
 * Changes the password for the current user
 * 
 * @param passwordData - Data containing current and new passwords
 * @returns Promise resolving when password is changed
 */
export async function changePassword(passwordData: ChangePasswordDto): Promise<void> {
  return apiClient.post(`${API_ENDPOINTS.USERS.BASE}/change-password`, passwordData);
}

/**
 * Resets a user's password (admin function)
 * 
 * @param userId - ID of the user whose password should be reset
 * @returns Promise resolving when password reset is initiated
 */
export async function resetUserPassword(userId: string): Promise<void> {
  return apiClient.post(`${API_ENDPOINTS.USERS.BASE}/${userId}/reset-password`);
}

/**
 * Activates a user account
 * 
 * @param userId - ID of the user to activate
 * @returns Promise resolving to activated user profile
 */
export async function activateUser(userId: string): Promise<UserProfile> {
  return apiClient.post(`${API_ENDPOINTS.USERS.BASE}/${userId}/activate`);
}

/**
 * Deactivates a user account
 * 
 * @param userId - ID of the user to deactivate
 * @returns Promise resolving to deactivated user profile
 */
export async function deactivateUser(userId: string): Promise<UserProfile> {
  return apiClient.post(`${API_ENDPOINTS.USERS.BASE}/${userId}/deactivate`);
}

/**
 * Retrieves permissions for a specific user
 * 
 * @param userId - ID of the user to get permissions for
 * @returns Promise resolving to user permissions
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/${userId}/permissions`);
}

/**
 * Retrieves a list of all roles in the system
 * 
 * @param params - Optional pagination parameters
 * @returns Promise resolving to paginated role list
 */
export async function getRoles(params?: object): Promise<RoleListResponse> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/roles`, params);
}

/**
 * Retrieves a single role by its ID
 * 
 * @param roleId - ID of the role to retrieve
 * @returns Promise resolving to role details
 */
export async function getRoleById(roleId: string): Promise<Role> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/roles/${roleId}`);
}

/**
 * Creates a new role in the system
 * 
 * @param roleData - Data for the new role
 * @returns Promise resolving to created role
 */
export async function createRole(roleData: CreateRoleDto): Promise<Role> {
  return apiClient.post(`${API_ENDPOINTS.USERS.BASE}/roles`, roleData);
}

/**
 * Updates an existing role
 * 
 * @param roleId - ID of the role to update
 * @param roleData - Updated role data
 * @returns Promise resolving to updated role
 */
export async function updateRole(roleId: string, roleData: UpdateRoleDto): Promise<Role> {
  return apiClient.put(`${API_ENDPOINTS.USERS.BASE}/roles/${roleId}`, roleData);
}

/**
 * Deletes a role from the system
 * 
 * @param roleId - ID of the role to delete
 * @returns Promise resolving when role is deleted
 */
export async function deleteRole(roleId: string): Promise<void> {
  return apiClient.del(`${API_ENDPOINTS.USERS.BASE}/roles/${roleId}`);
}

/**
 * Retrieves a list of all permissions in the system
 * 
 * @returns Promise resolving to list of permissions
 */
export async function getPermissions(): Promise<Permission[]> {
  return apiClient.get(`${API_ENDPOINTS.USERS.BASE}/permissions`);
}