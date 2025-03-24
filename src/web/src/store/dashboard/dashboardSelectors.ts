import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { RootState } from '../rootReducer';
import { 
  DashboardState, 
  DashboardMetrics, 
  RevenueMetrics, 
  ClaimsMetrics, 
  AlertNotification, 
  DashboardFilters,
  LoadingState
} from '../../types/dashboard.types';

/**
 * Base selector that returns the dashboard slice from the Redux store
 * @param state - The root state of the Redux store
 * @returns The dashboard state slice
 */
export const selectDashboardState = (state: RootState): DashboardState => state.dashboard;

/**
 * Selector for retrieving all dashboard metrics
 * @returns All dashboard metrics or null if not loaded
 */
export const selectDashboardMetrics = createSelector(
  [selectDashboardState],
  (dashboard): DashboardMetrics | null => dashboard.metrics
);

/**
 * Selector for retrieving revenue metrics
 * @returns Revenue metrics or null if not loaded
 */
export const selectRevenueMetrics = createSelector(
  [selectDashboardMetrics],
  (metrics): RevenueMetrics | null => metrics?.revenue || null
);

/**
 * Selector for retrieving claims metrics
 * @returns Claims metrics or null if not loaded
 */
export const selectClaimsMetrics = createSelector(
  [selectDashboardMetrics],
  (metrics): ClaimsMetrics | null => metrics?.claims || null
);

/**
 * Selector for retrieving alert notifications
 * @returns Alert notifications or null if not loaded
 */
export const selectAlertNotifications = createSelector(
  [selectDashboardMetrics],
  (metrics): AlertNotification[] | null => metrics?.alerts || null
);

/**
 * Selector for counting unread alert notifications
 * @returns Count of unread alerts
 */
export const selectUnreadAlertCount = createSelector(
  [selectAlertNotifications],
  (alerts): number => {
    if (!alerts) {
      return 0;
    }
    return alerts.filter(alert => !alert.read).length;
  }
);

/**
 * Selector for retrieving current dashboard filters
 * @returns Current dashboard filter settings
 */
export const selectDashboardFilters = createSelector(
  [selectDashboardState],
  (dashboard): DashboardFilters => dashboard.filters
);

/**
 * Selector for retrieving dashboard loading state
 * @returns Current loading state of dashboard data
 */
export const selectDashboardLoading = createSelector(
  [selectDashboardState],
  (dashboard): LoadingState => dashboard.loading
);

/**
 * Selector for retrieving dashboard error state
 * @returns Error message or null if no error
 */
export const selectDashboardError = createSelector(
  [selectDashboardState],
  (dashboard): string | null => dashboard.error
);

/**
 * Selector for retrieving when dashboard data was last updated
 * @returns Timestamp of last update or null if never updated
 */
export const selectDashboardLastUpdated = createSelector(
  [selectDashboardState],
  (dashboard): string | null => dashboard.lastUpdated
);

/**
 * Selector for determining if dashboard data is currently loading
 * @returns True if dashboard is in loading state
 */
export const selectIsLoading = createSelector(
  [selectDashboardLoading],
  (loading): boolean => loading === LoadingState.LOADING
);

/**
 * Selector for retrieving revenue breakdown by program
 * @returns Revenue by program data or null if not loaded
 */
export const selectRevenueByProgram = createSelector(
  [selectRevenueMetrics],
  (metrics): Array<{ programId: string; programName: string; amount: number; percentage: number }> | null => {
    return metrics?.revenueByProgram || null;
  }
);

/**
 * Selector for retrieving revenue breakdown by payer
 * @returns Revenue by payer data or null if not loaded
 */
export const selectRevenueByPayer = createSelector(
  [selectRevenueMetrics],
  (metrics): Array<{ payerId: string; payerName: string; amount: number; percentage: number }> | null => {
    return metrics?.revenueByPayer || null;
  }
);

/**
 * Selector for retrieving revenue trend data
 * @returns Revenue trend data or null if not loaded
 */
export const selectRevenueTrend = createSelector(
  [selectRevenueMetrics],
  (metrics): Array<{ date: string; amount: number; previousAmount: number | null }> | null => {
    return metrics?.revenueTrend || null;
  }
);

/**
 * Selector for retrieving claim status distribution
 * @returns Claim status breakdown or null if not loaded
 */
export const selectClaimStatusBreakdown = createSelector(
  [selectClaimsMetrics],
  (metrics): Array<{ status: string; count: number; amount: number; percentage: number }> | null => {
    return metrics?.statusBreakdown || null;
  }
);

/**
 * Selector for retrieving recent claims data
 * @returns Recent claims data or null if not loaded
 */
export const selectRecentClaims = createSelector(
  [selectClaimsMetrics],
  (metrics): Array<{ id: string; claimNumber: string; clientName: string; amount: number; status: string; payerName: string; age: number }> | null => {
    return metrics?.recentClaims || null;
  }
);