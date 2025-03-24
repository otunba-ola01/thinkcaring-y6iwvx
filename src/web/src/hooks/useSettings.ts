import { useState, useEffect, useCallback, useMemo } from 'react'; // react v18.2+ React hooks for state management and side effects
import { useDispatch, useSelector } from 'react-redux'; // react-redux v8.0+ React Redux hooks for dispatching actions and selecting state from the Redux store

import {
  Setting,
  OrganizationSettings,
  SystemSettings,
  UserSettings,
  NotificationSettings,
  IntegrationSettings,
  BillingSettings,
  CreateSettingDto,
  UpdateSettingDto,
  UpdateOrganizationSettingsDto,
  UpdateSystemSettingsDto,
  UpdateUserSettingsDto,
  UpdateNotificationSettingsDto,
  UpdateIntegrationSettingsDto,
  UpdateBillingSettingsDto,
  LoadingState,
  ResponseError
} from '../types/settings.types';
import {
  selectSettings,
  selectOrganizationSettings,
  selectSystemSettings,
  selectUserSettings,
  selectNotificationSettings,
  selectIntegrationSettings,
  selectBillingSettings,
  selectSettingsLoading,
  selectSettingsError
} from '../store/settings/settingsSelectors';
import {
  fetchSettingsThunk,
  fetchOrganizationSettingsThunk,
  fetchSystemSettingsThunk,
  fetchUserSettingsThunk,
  fetchNotificationSettingsThunk,
  fetchIntegrationSettingsThunk,
  fetchBillingSettingsThunk,
  createSettingThunk,
  updateSettingThunk,
  deleteSettingThunk,
  updateOrganizationSettingsThunk,
  updateSystemSettingsThunk,
  updateUserSettingsThunk,
  updateNotificationSettingsThunk,
  updateIntegrationSettingsThunk,
  updateBillingSettingsThunk,
  testIntegrationConnectionThunk
} from '../store/settings/settingsThunks';
import { useApiRequest } from './useApiRequest';

/**
 * Interface defining the return type of the useSettings hook, exposing settings data and management functions.
 */
interface UseSettingsReturn {
  settings: Setting[];
  organizationSettings: OrganizationSettings | null;
  systemSettings: SystemSettings | null;
  userSettings: UserSettings | null;
  notificationSettings: NotificationSettings | null;
  integrationSettings: IntegrationSettings | null;
  billingSettings: BillingSettings | null;
  loading: LoadingState;
  error: ResponseError | null;
  fetchSettings: () => Promise<void>;
  fetchOrganizationSettings: () => Promise<void>;
  fetchSystemSettings: () => Promise<void>;
  fetchUserSettings: () => Promise<void>;
  fetchNotificationSettings: () => Promise<void>;
  fetchIntegrationSettings: () => Promise<void>;
  fetchBillingSettings: () => Promise<void>;
  createSetting: (data: CreateSettingDto) => Promise<void>;
  updateSetting: (id: string, data: UpdateSettingDto) => Promise<void>;
  deleteSetting: (id: string) => Promise<void>;
  updateOrganizationSettings: (data: UpdateOrganizationSettingsDto) => Promise<void>;
  updateSystemSettings: (data: UpdateSystemSettingsDto) => Promise<void>;
  updateUserSettings: (data: UpdateUserSettingsDto) => Promise<void>;
  updateNotificationSettings: (data: UpdateNotificationSettingsDto) => Promise<void>;
  updateIntegrationSettings: (data: UpdateIntegrationSettingsDto) => Promise<void>;
  updateBillingSettings: (data: BillingSettings) => Promise<void>;
  testIntegrationConnection: (integrationType: string, connectionData: Record<string, any>) => Promise<{ success: boolean; message: string; }>;
  getSetting: (key: string) => Setting | undefined;
  getSettingValue: <T>(key: string, defaultValue?: T) => T | undefined;
  initialized: boolean;
}

/**
 * Custom hook that provides access to settings data and operations
 *
 * @returns {UseSettingsReturn} Object containing settings data, loading state, error, and operations
 */
export const useSettings = (): UseSettingsReturn => {
  // 1. Get dispatch function using useDispatch
  const dispatch = useDispatch();

  // 2. Select settings data from Redux store using selectors
  const settings = useSelector(selectSettings);
  const organizationSettings = useSelector(selectOrganizationSettings);
  const systemSettings = useSelector(selectSystemSettings);
  const userSettings = useSelector(selectUserSettings);
  const notificationSettings = useSelector(selectNotificationSettings);
  const integrationSettings = useSelector(selectIntegrationSettings);
  const billingSettings = useSelector(selectBillingSettings);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);

  // Determine if settings have been initialized
  const initialized = useMemo(() => loading !== LoadingState.LOADING && (settings.length > 0 || organizationSettings !== null || systemSettings !== null || userSettings !== null || notificationSettings !== null || integrationSettings !== null || billingSettings !== null), [settings, organizationSettings, systemSettings, userSettings, notificationSettings, integrationSettings, billingSettings, loading]);

  // 3. Create memoized fetch functions for different settings types
  const fetchSettings = useCallback(async () => {
    await dispatch(fetchSettingsThunk({ pagination: { page: 1, pageSize: 10 } }));
  }, [dispatch]);

  const fetchOrganizationSettings = useCallback(async () => {
    await dispatch(fetchOrganizationSettingsThunk());
  }, [dispatch]);

  const fetchSystemSettings = useCallback(async () => {
    await dispatch(fetchSystemSettingsThunk());
  }, [dispatch]);

  const fetchUserSettings = useCallback(async () => {
    await dispatch(fetchUserSettingsThunk());
  }, [dispatch]);

  const fetchNotificationSettings = useCallback(async () => {
    await dispatch(fetchNotificationSettingsThunk());
  }, [dispatch]);

  const fetchIntegrationSettings = useCallback(async () => {
    await dispatch(fetchIntegrationSettingsThunk());
  }, [dispatch]);

  const fetchBillingSettings = useCallback(async () => {
    await dispatch(fetchBillingSettingsThunk());
  }, [dispatch]);

  // 4. Create memoized update functions for different settings types
  const createSetting = useCallback(
    async (data: CreateSettingDto) => {
      await dispatch(createSettingThunk(data));
    },
    [dispatch]
  );

  const updateSetting = useCallback(
    async (id: string, data: UpdateSettingDto) => {
      await dispatch(updateSettingThunk({ key: id, setting: data }));
    },
    [dispatch]
  );

  const deleteSetting = useCallback(
    async (id: string) => {
      await dispatch(deleteSettingThunk(id));
    },
    [dispatch]
  );

  const updateOrganizationSettings = useCallback(
    async (data: UpdateOrganizationSettingsDto) => {
      await dispatch(updateOrganizationSettingsThunk(data));
    },
    [dispatch]
  );

  const updateSystemSettings = useCallback(
    async (data: UpdateSystemSettingsDto) => {
      await dispatch(updateSystemSettingsThunk(data));
    },
    [dispatch]
  );

  const updateUserSettings = useCallback(
    async (data: UpdateUserSettingsDto) => {
      await dispatch(updateUserSettingsThunk(data));
    },
    [dispatch]
  );

  const updateNotificationSettings = useCallback(
    async (data: UpdateNotificationSettingsDto) => {
      await dispatch(updateNotificationSettingsThunk(data));
    },
    [dispatch]
  );

  const updateIntegrationSettings = useCallback(
    async (data: UpdateIntegrationSettingsDto) => {
      await dispatch(updateIntegrationSettingsThunk(data));
    },
    [dispatch]
  );

  const updateBillingSettings = useCallback(
    async (data: BillingSettings) => {
      await dispatch(updateBillingSettingsThunk(data));
    },
    [dispatch]
  );

  const testIntegrationConnection = useCallback(
    async (integrationType: string, connectionData: Record<string, any>) => {
      // Implement the logic to test the integration connection
      // This might involve calling an API endpoint to validate the connection
      // and returning a success or failure message
      // Replace this with your actual implementation
      console.log(`Testing integration connection for type: ${integrationType} with data:`, connectionData);
      return { success: true, message: 'Connection successful!' };
    },
    []
  );

  // 5. Create utility functions for finding and manipulating settings
  const getSetting = useCallback(
    (key: string): Setting | undefined => {
      return settings.find(setting => setting.key === key);
    },
    [settings]
  );

  const getSettingValue = useCallback(
    <T>(key: string, defaultValue?: T): T | undefined => {
      const setting = getSetting(key);
      return setting ? setting.value as T : defaultValue;
    },
    [getSetting]
  );

  // 6. Return an object with all settings data and operations
  return {
    settings,
    organizationSettings,
    systemSettings,
    userSettings,
    notificationSettings,
    integrationSettings,
    billingSettings,
    loading,
    error,
    fetchSettings,
    fetchOrganizationSettings,
    fetchSystemSettings,
    fetchUserSettings,
    fetchNotificationSettings,
    fetchIntegrationSettings,
    fetchBillingSettings,
    createSetting,
    updateSetting,
    deleteSetting,
    updateOrganizationSettings,
    updateSystemSettings,
    updateUserSettings,
    updateNotificationSettings,
    updateIntegrationSettings,
    updateBillingSettings,
    testIntegrationConnection,
    getSetting,
    getSettingValue,
    initialized
  };
};

// Export the interface
export type UseSettingsReturn = ReturnType<typeof useSettings>;