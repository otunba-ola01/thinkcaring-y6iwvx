/**
 * API client functions for the dashboard module in the HCBS Revenue Management System.
 * Provides functions for fetching dashboard metrics, revenue data, claims statistics,
 * and alert notifications to power the financial dashboard.
 *
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  DashboardFilters,
  DashboardApiResponse,
  RevenueMetricsApiResponse,
  ClaimsMetricsApiResponse,
  AlertNotificationsApiResponse,
  MarkAlertReadRequest,
  MarkAlertReadResponse
} from '../types/dashboard.types';
import { UUID } from '../types/common.types';

/**
 * Fetches comprehensive dashboard metrics including revenue, claims, payments, and alerts
 *
 * @param filters - Filtering options for the dashboard data
 * @returns Promise resolving to dashboard metrics response
 */
export async function getDashboardMetrics(
  filters: DashboardFilters
): Promise<DashboardApiResponse> {
  try {
    // Convert filters to query parameters
    const queryParams = {
      timeFrame: filters.timeFrame,
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
      programId: filters.programId,
      payerId: filters.payerId,
      facilityId: filters.facilityId
    };

    // Make the API request
    const response = await apiClient.get<DashboardApiResponse>(
      API_ENDPOINTS.DASHBOARD.METRICS,
      queryParams
    );

    return response;
  } catch (error) {
    // Let the error propagate to be handled by the caller
    throw error;
  }
}

/**
 * Fetches revenue metrics for the dashboard including breakdowns by program, payer, and facility
 *
 * @param filters - Filtering options for the revenue data
 * @returns Promise resolving to revenue metrics response
 */
export async function getRevenueMetrics(
  filters: DashboardFilters
): Promise<RevenueMetricsApiResponse> {
  try {
    // Convert filters to query parameters
    const queryParams = {
      timeFrame: filters.timeFrame,
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
      programId: filters.programId,
      payerId: filters.payerId,
      facilityId: filters.facilityId
    };

    // Make the API request
    const response = await apiClient.get<RevenueMetricsApiResponse>(
      API_ENDPOINTS.DASHBOARD.REVENUE,
      queryParams
    );

    return response;
  } catch (error) {
    // Let the error propagate to be handled by the caller
    throw error;
  }
}

/**
 * Fetches claims metrics for the dashboard including status breakdown and processing statistics
 *
 * @param filters - Filtering options for the claims data
 * @returns Promise resolving to claims metrics response
 */
export async function getClaimsMetrics(
  filters: DashboardFilters
): Promise<ClaimsMetricsApiResponse> {
  try {
    // Convert filters to query parameters
    const queryParams = {
      timeFrame: filters.timeFrame,
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
      programId: filters.programId,
      payerId: filters.payerId,
      facilityId: filters.facilityId
    };

    // Make the API request
    const response = await apiClient.get<ClaimsMetricsApiResponse>(
      API_ENDPOINTS.DASHBOARD.CLAIMS,
      queryParams
    );

    return response;
  } catch (error) {
    // Let the error propagate to be handled by the caller
    throw error;
  }
}

/**
 * Fetches alert notifications for the dashboard
 *
 * @param filters - Filtering options for the alerts
 * @returns Promise resolving to alert notifications response
 */
export async function getAlertNotifications(
  filters: DashboardFilters
): Promise<AlertNotificationsApiResponse> {
  try {
    // Convert filters to query parameters
    const queryParams = {
      timeFrame: filters.timeFrame,
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
      programId: filters.programId,
      payerId: filters.payerId,
      facilityId: filters.facilityId
    };

    // Make the API request
    const response = await apiClient.get<AlertNotificationsApiResponse>(
      API_ENDPOINTS.DASHBOARD.ALERTS,
      queryParams
    );

    return response;
  } catch (error) {
    // Let the error propagate to be handled by the caller
    throw error;
  }
}

/**
 * Marks an alert notification as read or unread
 *
 * @param alertId - ID of the alert to update
 * @param read - New read status (true for read, false for unread)
 * @returns Promise resolving to mark alert read response
 */
export async function markAlertRead(
  alertId: UUID,
  read: boolean
): Promise<MarkAlertReadResponse> {
  try {
    // Create request body with just the read status
    const requestBody = {
      read
    };

    // Construct the URL for marking an alert as read
    const url = `${API_ENDPOINTS.DASHBOARD.ALERTS}/${alertId}`;
    
    // Make the API request
    const response = await apiClient.put<MarkAlertReadResponse>(
      url,
      requestBody
    );

    return response;
  } catch (error) {
    // Let the error propagate to be handled by the caller
    throw error;
  }
}