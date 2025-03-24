/**
 * Redux Toolkit slice for settings management in the HCBS Revenue Management System.
 * This file manages all settings state including organization settings, system settings,
 * user preferences, notification settings, and integration configurations.
 * 
 * @version 1.0.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+

import { SettingsState, Setting } from '../../types/settings.types';
import { LoadingState } from '../../types/common.types';
import { 
  fetchSettingsThunk,
  fetchSettingByIdThunk,
  createSettingThunk,
  updateSettingThunk,
  deleteSettingThunk,
  fetchOrganizationSettingsThunk,
  updateOrganizationSettingsThunk,
  fetchSystemSettingsThunk,
  updateSystemSettingsThunk,
  fetchUserSettingsThunk,
  updateUserSettingsThunk,
  fetchNotificationSettingsThunk,
  updateNotificationSettingsThunk,
  fetchIntegrationSettingsThunk,
  updateIntegrationSettingsThunk,
  fetchBillingSettingsThunk,
  updateBillingSettingsThunk,
  testIntegrationConnectionThunk
} from './settingsThunks';

/**
 * Initial state for the settings slice
 */
const initialState: SettingsState = {
  settings: [],
  organizationSettings: null,
  systemSettings: null,
  userSettings: null,
  notificationSettings: null,
  integrationSettings: null,
  billingSettings: null,
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10
  },
  loading: LoadingState.IDLE,
  error: null
};

/**
 * Settings slice with reducers and extra reducers for async operations
 */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Reset settings state to initial values
     */
    resetSettings: (state) => {
      return initialState;
    },
    
    /**
     * Set error state in settings slice
     */
    setSettingsError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
      state.loading = LoadingState.IDLE;
    },
    
    /**
     * Clear error state in settings slice
     */
    clearSettingsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // fetchSettingsThunk
    builder
      .addCase(fetchSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchSettingsThunk.fulfilled, (state, action) => {
        state.settings = action.payload.items;
        state.pagination = {
          total: action.payload.totalItems,
          page: action.payload.page,
          pageSize: action.payload.pageSize
        };
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchSettingByIdThunk
    builder
      .addCase(fetchSettingByIdThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchSettingByIdThunk.fulfilled, (state, action) => {
        const index = state.settings.findIndex(setting => setting.key === action.payload.key);
        if (index >= 0) {
          state.settings[index] = action.payload;
        } else {
          state.settings.push(action.payload);
        }
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchSettingByIdThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // createSettingThunk
    builder
      .addCase(createSettingThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(createSettingThunk.fulfilled, (state, action) => {
        state.settings.push(action.payload);
        state.loading = LoadingState.IDLE;
      })
      .addCase(createSettingThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateSettingThunk
    builder
      .addCase(updateSettingThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateSettingThunk.fulfilled, (state, action) => {
        const index = state.settings.findIndex(setting => setting.key === action.payload.key);
        if (index >= 0) {
          state.settings[index] = action.payload;
        }
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateSettingThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // deleteSettingThunk
    builder
      .addCase(deleteSettingThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(deleteSettingThunk.fulfilled, (state, action) => {
        state.settings = state.settings.filter(setting => setting.key !== action.payload);
        state.loading = LoadingState.IDLE;
      })
      .addCase(deleteSettingThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchOrganizationSettingsThunk
    builder
      .addCase(fetchOrganizationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchOrganizationSettingsThunk.fulfilled, (state, action) => {
        state.organizationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchOrganizationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateOrganizationSettingsThunk
    builder
      .addCase(updateOrganizationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateOrganizationSettingsThunk.fulfilled, (state, action) => {
        state.organizationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateOrganizationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchSystemSettingsThunk
    builder
      .addCase(fetchSystemSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchSystemSettingsThunk.fulfilled, (state, action) => {
        state.systemSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchSystemSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateSystemSettingsThunk
    builder
      .addCase(updateSystemSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateSystemSettingsThunk.fulfilled, (state, action) => {
        state.systemSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateSystemSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchUserSettingsThunk
    builder
      .addCase(fetchUserSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchUserSettingsThunk.fulfilled, (state, action) => {
        state.userSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchUserSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateUserSettingsThunk
    builder
      .addCase(updateUserSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateUserSettingsThunk.fulfilled, (state, action) => {
        state.userSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateUserSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchNotificationSettingsThunk
    builder
      .addCase(fetchNotificationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchNotificationSettingsThunk.fulfilled, (state, action) => {
        state.notificationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchNotificationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateNotificationSettingsThunk
    builder
      .addCase(updateNotificationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateNotificationSettingsThunk.fulfilled, (state, action) => {
        state.notificationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateNotificationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchIntegrationSettingsThunk
    builder
      .addCase(fetchIntegrationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchIntegrationSettingsThunk.fulfilled, (state, action) => {
        state.integrationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchIntegrationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateIntegrationSettingsThunk
    builder
      .addCase(updateIntegrationSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateIntegrationSettingsThunk.fulfilled, (state, action) => {
        state.integrationSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateIntegrationSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // fetchBillingSettingsThunk
    builder
      .addCase(fetchBillingSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchBillingSettingsThunk.fulfilled, (state, action) => {
        state.billingSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(fetchBillingSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // updateBillingSettingsThunk
    builder
      .addCase(updateBillingSettingsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(updateBillingSettingsThunk.fulfilled, (state, action) => {
        state.billingSettings = action.payload;
        state.loading = LoadingState.IDLE;
      })
      .addCase(updateBillingSettingsThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });

    // testIntegrationConnectionThunk
    builder
      .addCase(testIntegrationConnectionThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(testIntegrationConnectionThunk.fulfilled, (state) => {
        state.loading = LoadingState.IDLE;
      })
      .addCase(testIntegrationConnectionThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = LoadingState.IDLE;
      });
  }
});

// Export actions and reducer
export const { resetSettings, setSettingsError, clearSettingsError } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
export default settingsReducer;