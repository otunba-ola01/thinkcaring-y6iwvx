import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+ Create memoized selector functions for efficient state derivation
import { RootState } from '../index'; // Import RootState type for type-safe selectors
import { SettingType } from '../../types/settings.types'; // Import setting type enum for filtering settings
import { SettingsState, Setting, OrganizationSettings, SystemSettings, UserSettings, NotificationSettings, IntegrationSettings, BillingSettings, ThemeMode } from '../../types/settings.types';

/**
 * Base selector that returns the settings slice from the Redux store
 * @param state 
 * @returns The settings slice of the Redux store
 */
const selectSettingsState = (state: RootState): SettingsState => state.settings;

/**
 * Selector for retrieving the list of settings
 */
export const selectSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.settings // Extract and return the settings array from the settings state
);

/**
 * Selector for retrieving the pagination metadata for settings
 */
export const selectSettingsPagination = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.pagination // Extract and return the pagination object from the settings state
);

/**
 * Selector for retrieving the loading state of settings operations
 */
export const selectSettingsLoading = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.loading // Extract and return the loading state from the settings state
);

/**
 * Selector for retrieving any error message from settings operations
 */
export const selectSettingsError = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.error // Extract and return the error from the settings state
);

/**
 * Selector for retrieving organization settings
 */
export const selectOrganizationSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.organizationSettings // Extract and return the organizationSettings from the settings state
);

/**
 * Selector for retrieving system settings
 */
export const selectSystemSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.systemSettings // Extract and return the systemSettings from the settings state
);

/**
 * Selector for retrieving user settings
 */
export const selectUserSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.userSettings // Extract and return the userSettings from the settings state
);

/**
 * Selector for retrieving notification settings
 */
export const selectNotificationSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.notificationSettings // Extract and return the notificationSettings from the settings state
);

/**
 * Selector for retrieving integration settings
 */
export const selectIntegrationSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.integrationSettings // Extract and return the integrationSettings from the settings state
);

/**
 * Selector for retrieving billing settings
 */
export const selectBillingSettings = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.billingSettings // Extract and return the billingSettings from the settings state
);

/**
 * Selector factory for filtering settings by type
 * @param type 
 * @returns A selector function that returns settings filtered by the specified type
 */
export const selectSettingsByType = (type: SettingType) => createSelector(
  [selectSettings],
  (settings) => settings.filter(setting => setting.type === type) // Filter settings by the specified type
);

/**
 * Selector factory for finding a setting by key
 * @param key 
 * @returns A selector function that returns the setting with the specified key or undefined if not found
 */
export const selectSettingByKey = (key: string) => createSelector(
  [selectSettings],
  (settings) => settings.find(setting => setting.key === key) // Find the setting with the matching key
);

/**
 * Selector for determining if settings are currently loading
 */
export const selectIsSettingsLoading = createSelector(
  [selectSettingsLoading],
  (loading) => loading === 'LOADING' // Compare the loading state to LoadingState.LOADING
);

/**
 * Selector for determining if there is a settings error
 */
export const selectHasSettingsError = createSelector(
  [selectSettingsError],
  (error) => error !== null // Check if error is not null
);

/**
 * Selector for retrieving the system theme setting
 */
export const selectSystemTheme = createSelector(
  [selectSystemSettings],
  (systemSettings) => systemSettings?.defaultTheme // Extract and return the defaultTheme property from system settings if available
);

/**
 * Selector for retrieving the user theme setting
 */
export const selectUserTheme = createSelector(
  [selectUserSettings],
  (userSettings) => userSettings?.theme // Extract and return the theme property from user settings if available
);

/**
 * Selector for determining the active theme based on user preference or system default
 */
export const selectActiveTheme = createSelector(
  [selectUserTheme, selectSystemTheme],
  (userTheme, systemTheme): ThemeMode => {
    if (userTheme) {
      return userTheme; // Return user theme if defined
    }
    if (systemTheme) {
      return systemTheme; // Fall back to system theme if user theme is not defined
    }
    return ThemeMode.LIGHT; // Fall back to ThemeMode.LIGHT as default if neither is defined
  }
);

/**
 * Selector for retrieving the organization name
 */
export const selectOrganizationName = createSelector(
  [selectOrganizationSettings],
  (organizationSettings) => organizationSettings?.name // Extract and return the name property from organization settings if available
);

/**
 * Selector for retrieving the organization logo URL
 */
export const selectOrganizationLogo = createSelector(
  [selectOrganizationSettings],
  (organizationSettings) => organizationSettings?.logo // Extract and return the logo property from organization settings if available
);