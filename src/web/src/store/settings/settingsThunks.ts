import { createAsyncThunk, ThunkAction, Action } from '@reduxjs/toolkit'; // v1.9+

import { settingsApi } from '../../api/settings.api';
import {
  Setting,
  CreateSettingDto,
  UpdateSettingDto,
  SettingType,
  SettingListParams,
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
  BillingSettings,
  UpdateBillingSettingsDto
} from '../../types/settings.types';

/**
 * Thunk for fetching a paginated list of settings with optional filtering
 */
export const fetchSettingsThunk = createAsyncThunk(
  'settings/fetchSettings',
  async (params: SettingListParams, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getSettings(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching a single setting by key
 */
export const fetchSettingByIdThunk = createAsyncThunk(
  'settings/fetchSettingById',
  async (key: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getSetting(key);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for creating a new setting
 */
export const createSettingThunk = createAsyncThunk(
  'settings/createSetting',
  async (setting: CreateSettingDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.createSetting(setting);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating an existing setting
 */
export const updateSettingThunk = createAsyncThunk(
  'settings/updateSetting',
  async (payload: { key: string; setting: UpdateSettingDto }, { rejectWithValue }) => {
    try {
      const { key, setting } = payload;
      const response = await settingsApi.updateSetting(key, setting);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for deleting a setting
 */
export const deleteSettingThunk = createAsyncThunk(
  'settings/deleteSetting',
  async (key: string, { rejectWithValue }) => {
    try {
      await settingsApi.deleteSetting(key);
      return key;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching organization settings
 */
export const fetchOrganizationSettingsThunk = createAsyncThunk(
  'settings/fetchOrganizationSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getOrganizationSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating organization settings
 */
export const updateOrganizationSettingsThunk = createAsyncThunk(
  'settings/updateOrganizationSettings',
  async (settings: UpdateOrganizationSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateOrganizationSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching system settings
 */
export const fetchSystemSettingsThunk = createAsyncThunk(
  'settings/fetchSystemSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getSystemSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating system settings
 */
export const updateSystemSettingsThunk = createAsyncThunk(
  'settings/updateSystemSettings',
  async (settings: UpdateSystemSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateSystemSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching user settings
 */
export const fetchUserSettingsThunk = createAsyncThunk(
  'settings/fetchUserSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getUserSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating user settings
 */
export const updateUserSettingsThunk = createAsyncThunk(
  'settings/updateUserSettings',
  async (settings: UpdateUserSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateUserSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching notification settings
 */
export const fetchNotificationSettingsThunk = createAsyncThunk(
  'settings/fetchNotificationSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getNotificationSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating notification settings
 */
export const updateNotificationSettingsThunk = createAsyncThunk(
  'settings/updateNotificationSettings',
  async (settings: UpdateNotificationSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateNotificationSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching integration settings
 */
export const fetchIntegrationSettingsThunk = createAsyncThunk(
  'settings/fetchIntegrationSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getIntegrationSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating integration settings
 */
export const updateIntegrationSettingsThunk = createAsyncThunk(
  'settings/updateIntegrationSettings',
  async (settings: UpdateIntegrationSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateIntegrationSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for testing an integration connection
 */
export const testIntegrationConnectionThunk = createAsyncThunk(
  'settings/testIntegrationConnection',
  async (connectionId: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.testIntegrationConnection(connectionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for fetching billing settings
 */
export const fetchBillingSettingsThunk = createAsyncThunk(
  'settings/fetchBillingSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getBillingSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk for updating billing settings
 */
export const updateBillingSettingsThunk = createAsyncThunk(
  'settings/updateBillingSettings',
  async (settings: UpdateBillingSettingsDto, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateBillingSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);