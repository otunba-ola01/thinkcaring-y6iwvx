import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'; // react v18.2+ Import React for JSX and hooks
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
  BillingSettings as BillingSettingsType, // Alias to avoid naming conflict
  LoadingState,
  ResponseError,
} from '../types/settings.types';
import { useSettings } from '../hooks/useSettings';

// Define the shape of the settings context
export interface SettingsContextType {
  settings: Setting[];
  organizationSettings: OrganizationSettings | null;
  systemSettings: SystemSettings | null;
  userSettings: UserSettings | null;
  notificationSettings: NotificationSettings | null;
  integrationSettings: IntegrationSettings | null;
  billingSettings: BillingSettingsType | null;
  loading: LoadingState;
  error: ResponseError | null;
  initialized: boolean;
  initializeSettings: () => Promise<void>;
  getSetting: (key: string) => Setting | undefined;
  getSettingValue: <T>(key: string, defaultValue?: T) => T | undefined;
  updateSetting: (id: string, data: UpdateSettingDto) => Promise<void>;
  createSetting: (data: CreateSettingDto) => Promise<void>;
  deleteSetting: (id: string) => Promise<void>;
  updateOrganizationSettings: (
    data: UpdateOrganizationSettingsDto
  ) => Promise<void>;
  updateSystemSettings: (data: UpdateSystemSettingsDto) => Promise<void>;
  updateUserSettings: (data: UpdateUserSettingsDto) => Promise<void>;
  updateNotificationSettings: (
    data: UpdateNotificationSettingsDto
  ) => Promise<void>;
  updateIntegrationSettings: (
    data: UpdateIntegrationSettingsDto
  ) => Promise<void>;
  updateBillingSettings: (data: BillingSettingsType) => Promise<void>;
  testIntegrationConnection: (
    integrationType: string,
    connectionData: Record<string, any>
  ) => Promise<{ success: boolean; message: string }>;
}

// Constant for the localStorage key to track settings initialization
const SETTINGS_INITIALIZED_KEY = 'thinkcaringapp_settings_initialized';

// Create the settings context with a default value of null
export const SettingsContext =
  createContext<SettingsContextType | null>(null);

// Define the props for the SettingsProvider component
export interface SettingsProviderProps {
  children: React.ReactNode;
}

// SettingsProvider component that manages settings state and provides it to the application
export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  // Use the useSettings hook to access settings data and operations
  const {
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
    initialized,
  } = useSettings();

  // Create the context value object
  const contextValue: SettingsContextType = useMemo(
    () => ({
      settings,
      organizationSettings,
      systemSettings,
      userSettings,
      notificationSettings,
      integrationSettings,
      billingSettings,
      loading,
      error,
      initialized,
      initializeSettings: fetchSettings,
      getSetting,
      getSettingValue,
      updateSetting,
      createSetting,
      deleteSetting,
      updateOrganizationSettings,
      updateSystemSettings,
      updateUserSettings,
      updateNotificationSettings,
      updateIntegrationSettings,
      updateBillingSettings,
      testIntegrationConnection,
    }),
    [
      settings,
      organizationSettings,
      systemSettings,
      userSettings,
      notificationSettings,
      integrationSettings,
      billingSettings,
      loading,
      error,
      initialized,
      fetchSettings,
      getSetting,
      getSettingValue,
      updateSetting,
      createSetting,
      deleteSetting,
      updateOrganizationSettings,
      updateSystemSettings,
      updateUserSettings,
      updateNotificationSettings,
      updateIntegrationSettings,
      updateBillingSettings,
      testIntegrationConnection,
    ]
  );

  // Render the SettingsContext.Provider with the context value
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to access the settings context
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettingsContext must be used within a SettingsProvider'
    );
  }
  return context;
}