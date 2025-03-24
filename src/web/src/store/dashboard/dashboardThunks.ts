/**
 * Redux Toolkit async thunks for fetching dashboard data in the HCBS Revenue Management System.
 * Provides actions for fetching dashboard metrics, revenue data, claims status, and alert notifications.
 * 
 * @version 1.0.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // v1.9+
import { Dispatch, AnyAction } from 'redux'; // v4.2+

import { 
  DashboardFilters, 
  DashboardApiResponse, 
  RevenueMetricsApiResponse, 
  ClaimsMetricsApiResponse, 
  AlertNotificationsApiResponse,
  MarkAlertReadRequest,
  MarkAlertReadResponse
} from '../../types/dashboard.types';
import { UUID } from '../../types/common.types';
import { 
  getDashboardMetrics, 
  getRevenueMetrics, 
  getClaimsMetrics, 
  getAlertNotifications, 
  markAlertRead as markAlertReadApi 
} from '../../api/dashboard.api';

/**
 * Type definition for Redux thunk actions with generic state
 */
export type AppThunk<ReturnType = void> = (
  dispatch: Dispatch<AnyAction>,
  getState: () => any
) => ReturnType;

/**
 * Async thunk for fetching comprehensive dashboard metrics including revenue,
 * claims, payments, services, aging receivables, and alerts
 * 
 * @param filters - Filtering options for the dashboard data (optional)
 * @returns Promise resolving to dashboard metrics response
 */
export const fetchDashboardMetrics = createAsyncThunk<
  DashboardApiResponse,
  DashboardFilters | undefined
>(
  'dashboard/fetchMetrics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getDashboardMetrics(filters!);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for fetching revenue metrics for the dashboard
 * including breakdowns by program, payer, and facility
 * 
 * @param filters - Filtering options for the revenue data (optional)
 * @returns Promise resolving to revenue metrics response
 */
export const fetchRevenueMetrics = createAsyncThunk<
  RevenueMetricsApiResponse,
  DashboardFilters | undefined
>(
  'dashboard/fetchRevenueMetrics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getRevenueMetrics(filters!);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for fetching claims metrics for the dashboard
 * including status breakdown, denial rates, and processing statistics
 * 
 * @param filters - Filtering options for the claims data (optional)
 * @returns Promise resolving to claims metrics response
 */
export const fetchClaimsMetrics = createAsyncThunk<
  ClaimsMetricsApiResponse,
  DashboardFilters | undefined
>(
  'dashboard/fetchClaimsMetrics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getClaimsMetrics(filters!);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for fetching alert notifications for the dashboard
 * including billing deadlines, authorization expiration alerts, etc.
 * 
 * @param filters - Filtering options for the alerts (optional)
 * @returns Promise resolving to alert notifications response
 */
export const fetchAlertNotifications = createAsyncThunk<
  AlertNotificationsApiResponse,
  DashboardFilters | undefined
>(
  'dashboard/fetchAlertNotifications',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getAlertNotifications(filters!);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk for marking an alert notification as read or unread
 * 
 * @param payload - Object containing alertId and read status
 * @returns Promise resolving to mark alert read response
 */
export const markAlertAsRead = createAsyncThunk<
  MarkAlertReadResponse,
  { alertId: UUID, read: boolean }
>(
  'dashboard/markAlertAsRead',
  async ({ alertId, read }, { rejectWithValue }) => {
    try {
      const response = await markAlertReadApi(alertId, read);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Thunk action creator that dispatches multiple dashboard data fetch actions
 * to refresh the entire dashboard with the latest data
 * 
 * @param filters - Filtering options for the dashboard data
 * @returns Thunk action that can be dispatched
 */
export const refreshDashboard = (filters: DashboardFilters): AppThunk => {
  return async (dispatch) => {
    try {
      // Dispatch all dashboard data fetch actions
      await dispatch(fetchDashboardMetrics(filters));
      await dispatch(fetchRevenueMetrics(filters));
      await dispatch(fetchClaimsMetrics(filters));
      await dispatch(fetchAlertNotifications(filters));
    } catch (error) {
      // Error handling is done in individual thunks
      console.error('Error refreshing dashboard:', error);
    }
  };
};