/**
 * API client module for interacting with the settings endpoints of the HCBS Revenue Management System.
 * Provides functions for retrieving, creating, updating, and deleting various types of settings
 * including system settings, organization settings, user preferences, and notification settings.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Setting,
  CreateSettingDto,
  UpdateSettingDto,
  SettingType,
  SettingListParams,
  SettingListResponse,
  OrganizationSettings,
  UpdateOrganizationSettingsDto,
  SystemSettings,
  UpdateSystemSettingsDto,
  UserSettings,
  UpdateUserSettingsDto,
  NotificationSettings,
  UpdateNotificationSettingsDto,
  IntegrationSettings,
  UpdateIntegrationSettingsDto,
  IntegrationConnection,
  CreateIntegrationConnectionDto,
  UpdateIntegrationConnectionDto,
  BillingSettings,
  UpdateBillingSettingsDto
} from '../types/settings.types';
import { ApiResponse } from '../types/api.types';

/**
 * Retrieves all settings with optional filtering and pagination
 * 
 * @param params - Parameters for filtering and pagination
 * @returns Promise resolving to paginated settings list
 */
async function getSettings(params: SettingListParams): Promise<ApiResponse<SettingListResponse>> {
  const queryParams = {
    ...params.pagination,
    ...(params.filters || {})
  };
  
  return apiClient.get(API_ENDPOINTS.SETTINGS.BASE, queryParams);
}

/**
 * Retrieves settings filtered by setting type
 * 
 * @param type - The setting type to filter by
 * @param params - Additional parameters for filtering and pagination
 * @returns Promise resolving to filtered settings list
 */
async function getSettingsByType(
  type: SettingType,
  params: SettingListParams
): Promise<ApiResponse<SettingListResponse>> {
  const queryParams = {
    ...params.pagination,
    ...(params.filters || {}),
    type
  };
  
  return apiClient.get(API_ENDPOINTS.SETTINGS.BASE, queryParams);
}

/**
 * Retrieves a single setting by key
 * 
 * @param key - The key of the setting to retrieve
 * @returns Promise resolving to a single setting
 */
async function getSetting(key: string): Promise<ApiResponse<Setting>> {
  return apiClient.get(`${API_ENDPOINTS.SETTINGS.BASE}/${key}`);
}

/**
 * Creates a new setting
 * 
 * @param setting - The setting data to create
 * @returns Promise resolving to the created setting
 */
async function createSetting(setting: CreateSettingDto): Promise<ApiResponse<Setting>> {
  return apiClient.post(API_ENDPOINTS.SETTINGS.BASE, setting);
}

/**
 * Updates an existing setting by key
 * 
 * @param key - The key of the setting to update
 * @param setting - The updated setting data
 * @returns Promise resolving to the updated setting
 */
async function updateSetting(
  key: string,
  setting: UpdateSettingDto
): Promise<ApiResponse<Setting>> {
  return apiClient.put(`${API_ENDPOINTS.SETTINGS.BASE}/${key}`, setting);
}

/**
 * Deletes a setting by key
 * 
 * @param key - The key of the setting to delete
 * @returns Promise resolving to success response
 */
async function deleteSetting(key: string): Promise<ApiResponse<void>> {
  return apiClient.del(`${API_ENDPOINTS.SETTINGS.BASE}/${key}`);
}

/**
 * Updates multiple settings in a single operation
 * 
 * @param settings - Array of settings with keys and values to update
 * @returns Promise resolving to update results
 */
async function bulkUpdateSettings(
  settings: Array<{ key: string; value: any }>
): Promise<ApiResponse<{ success: number; failed: number }>> {
  return apiClient.put(`${API_ENDPOINTS.SETTINGS.BASE}/bulk`, { settings });
}

/**
 * Retrieves organization settings
 * 
 * @returns Promise resolving to organization settings
 */
async function getOrganizationSettings(): Promise<ApiResponse<OrganizationSettings>> {
  return apiClient.get(API_ENDPOINTS.SETTINGS.ORGANIZATION);
}

/**
 * Updates organization settings
 * 
 * @param settings - The updated organization settings
 * @returns Promise resolving to updated organization settings
 */
async function updateOrganizationSettings(
  settings: UpdateOrganizationSettingsDto
): Promise<ApiResponse<OrganizationSettings>> {
  return apiClient.put(API_ENDPOINTS.SETTINGS.ORGANIZATION, settings);
}

/**
 * Retrieves system settings
 * 
 * @returns Promise resolving to system settings
 */
async function getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
  return apiClient.get(`${API_ENDPOINTS.SETTINGS.BASE}/system`);
}

/**
 * Updates system settings
 * 
 * @param settings - The updated system settings
 * @returns Promise resolving to updated system settings
 */
async function updateSystemSettings(
  settings: UpdateSystemSettingsDto
): Promise<ApiResponse<SystemSettings>> {
  return apiClient.put(`${API_ENDPOINTS.SETTINGS.BASE}/system`, settings);
}

/**
 * Retrieves settings for the current user
 * 
 * @returns Promise resolving to user settings
 */
async function getUserSettings(): Promise<ApiResponse<UserSettings>> {
  return apiClient.get(API_ENDPOINTS.USERS.PREFERENCES);
}

/**
 * Updates settings for the current user
 * 
 * @param settings - The updated user settings
 * @returns Promise resolving to updated user settings
 */
async function updateUserSettings(
  settings: UpdateUserSettingsDto
): Promise<ApiResponse<UserSettings>> {
  return apiClient.put(API_ENDPOINTS.USERS.PREFERENCES, settings);
}

/**
 * Retrieves notification settings
 * 
 * @returns Promise resolving to notification settings
 */
async function getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
  return apiClient.get(API_ENDPOINTS.SETTINGS.NOTIFICATIONS);
}

/**
 * Updates notification settings
 * 
 * @param settings - The updated notification settings
 * @returns Promise resolving to updated notification settings
 */
async function updateNotificationSettings(
  settings: UpdateNotificationSettingsDto
): Promise<ApiResponse<NotificationSettings>> {
  return apiClient.put(API_ENDPOINTS.SETTINGS.NOTIFICATIONS, settings);
}

/**
 * Retrieves integration settings
 * 
 * @returns Promise resolving to integration settings
 */
async function getIntegrationSettings(): Promise<ApiResponse<IntegrationSettings>> {
  return apiClient.get(API_ENDPOINTS.SETTINGS.INTEGRATIONS);
}

/**
 * Updates integration settings
 * 
 * @param settings - The updated integration settings
 * @returns Promise resolving to updated integration settings
 */
async function updateIntegrationSettings(
  settings: UpdateIntegrationSettingsDto
): Promise<ApiResponse<IntegrationSettings>> {
  return apiClient.put(API_ENDPOINTS.SETTINGS.INTEGRATIONS, settings);
}

/**
 * Retrieves all integration connections
 * 
 * @returns Promise resolving to list of integration connections
 */
async function getIntegrationConnections(): Promise<ApiResponse<IntegrationConnection[]>> {
  return apiClient.get(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections`);
}

/**
 * Retrieves a single integration connection by ID
 * 
 * @param id - The ID of the integration connection to retrieve
 * @returns Promise resolving to integration connection
 */
async function getIntegrationConnection(id: string): Promise<ApiResponse<IntegrationConnection>> {
  return apiClient.get(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections/${id}`);
}

/**
 * Creates a new integration connection
 * 
 * @param connection - The integration connection data to create
 * @returns Promise resolving to created integration connection
 */
async function createIntegrationConnection(
  connection: CreateIntegrationConnectionDto
): Promise<ApiResponse<IntegrationConnection>> {
  return apiClient.post(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections`, connection);
}

/**
 * Updates an existing integration connection
 * 
 * @param id - The ID of the integration connection to update
 * @param connection - The updated integration connection data
 * @returns Promise resolving to updated integration connection
 */
async function updateIntegrationConnection(
  id: string,
  connection: UpdateIntegrationConnectionDto
): Promise<ApiResponse<IntegrationConnection>> {
  return apiClient.put(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections/${id}`, connection);
}

/**
 * Deletes an integration connection
 * 
 * @param id - The ID of the integration connection to delete
 * @returns Promise resolving to success response
 */
async function deleteIntegrationConnection(id: string): Promise<ApiResponse<void>> {
  return apiClient.del(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections/${id}`);
}

/**
 * Tests an integration connection
 * 
 * @param id - The ID of the integration connection to test
 * @returns Promise resolving to test results
 */
async function testIntegrationConnection(
  id: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiClient.post(`${API_ENDPOINTS.SETTINGS.INTEGRATIONS}/connections/${id}/test`);
}

/**
 * Retrieves billing settings
 * 
 * @returns Promise resolving to billing settings
 */
async function getBillingSettings(): Promise<ApiResponse<BillingSettings>> {
  return apiClient.get(`${API_ENDPOINTS.SETTINGS.BASE}/billing`);
}

/**
 * Updates billing settings
 * 
 * @param settings - The updated billing settings
 * @returns Promise resolving to updated billing settings
 */
async function updateBillingSettings(
  settings: UpdateBillingSettingsDto
): Promise<ApiResponse<BillingSettings>> {
  return apiClient.put(`${API_ENDPOINTS.SETTINGS.BASE}/billing`, settings);
}

/**
 * Initializes default system and organization settings
 * 
 * @returns Promise resolving to success response
 */
async function initializeDefaultSettings(): Promise<ApiResponse<void>> {
  return apiClient.post(`${API_ENDPOINTS.SETTINGS.BASE}/initialize`);
}

// Export all functions as part of a settings API object
export const settingsApi = {
  getSettings,
  getSettingsByType,
  getSetting,
  createSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
  getOrganizationSettings,
  updateOrganizationSettings,
  getSystemSettings,
  updateSystemSettings,
  getUserSettings,
  updateUserSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getIntegrationSettings,
  updateIntegrationSettings,
  getIntegrationConnections,
  getIntegrationConnection,
  createIntegrationConnection,
  updateIntegrationConnection,
  deleteIntegrationConnection,
  testIntegrationConnection,
  getBillingSettings,
  updateBillingSettings,
  initializeDefaultSettings
};