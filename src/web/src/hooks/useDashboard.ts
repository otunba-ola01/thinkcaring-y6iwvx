// react-redux v8.0+ Import Redux hooks for accessing store state and dispatching actions
// react v18.2.0 Import React hooks for state management and side effects
import { useCallback, useEffect, useState } from 'react';
// react-redux v8.0+ Import Redux hooks for accessing store state and dispatching actions
import { useDispatch, useSelector } from 'react-redux';
// src/web/src/store/index.ts Import typed dispatch function for Redux actions
import { AppDispatch } from '../store';
// src/web/src/types/dashboard.types.ts Import dashboard-related type definitions
import { AlertNotification, ClaimsMetrics, DashboardFilters, DashboardMetrics, DateRange, LoadingState, RevenueMetrics, TimeFrame } from '../types/dashboard.types';
// src/web/src/types/common.types.ts Import UUID type for IDs
import { UUID } from '../types/common.types';
// src/web/src/store/dashboard/dashboardThunks.ts Import dashboard async thunk actions
import { fetchAlertNotifications, fetchClaimsMetrics, fetchDashboardMetrics, markAlertAsRead, fetchRevenueMetrics } from '../store/dashboard/dashboardThunks';
// src/web/src/store/dashboard/dashboardSlice.ts Import dashboard action creators
import { setDashboardFilters, setDateRange, setFacilityFilter, setPayerFilter, setProgramFilter, setTimeFrame } from '../store/dashboard/dashboardSlice';
// src/web/src/store/dashboard/dashboardSelectors.ts Import dashboard selectors for accessing state
import { selectAlertNotifications, selectClaimStatusBreakdown, selectDashboardError, selectDashboardFilters, selectDashboardLastUpdated, selectDashboardLoading, selectDashboardMetrics, selectDateRange, selectFacilityFilter, selectIsLoading, selectPayerFilter, selectProgramFilter, selectRecentClaims, selectRevenueByPayer, selectRevenueByProgram, selectRevenueTrend, selectRevenueMetrics, selectUnreadAlertCount } from '../store/dashboard/dashboardSelectors';

/**
 * Custom hook for accessing and managing dashboard data and functionality
 * @param {object} { autoFetch = true }
 * @returns {object} Dashboard state and functions for interacting with dashboard data
 */
const useDashboard = ({ autoFetch = true }: { autoFetch?: boolean } = {}) => {
  // Get dispatch function from Redux store
  const dispatch: AppDispatch = useDispatch();

  // Select dashboard state using selectors
  const metrics: DashboardMetrics | null = useSelector(selectDashboardMetrics);
  const revenueMetrics: RevenueMetrics | null = useSelector(selectRevenueMetrics);
  const claimsMetrics: ClaimsMetrics | null = useSelector(selectClaimsMetrics);
  const alertNotifications: AlertNotification[] | null = useSelector(selectAlertNotifications);
  const unreadAlertCount: number = useSelector(selectUnreadAlertCount);
  const recentClaims = useSelector(selectRecentClaims);
  const dashboardFilters: DashboardFilters = useSelector(selectDashboardFilters);
  const dateRange: DateRange = useSelector(selectDateRange);
  const timeFrame: TimeFrame = useSelector(selectTimeFrame);
  const programFilter: string | undefined = useSelector(selectProgramFilter);
  const payerFilter: string | undefined = useSelector(selectPayerFilter);
  const facilityFilter: string | undefined = useSelector(selectFacilityFilter);
  const loading: LoadingState = useSelector(selectDashboardLoading);
  const error: string | null = useSelector(selectDashboardError);
  const lastUpdated: string | null = useSelector(selectDashboardLastUpdated);
  const isLoading: boolean = useSelector(selectIsLoading);
    const revenueByProgram = useSelector(selectRevenueByProgram);
    const revenueByPayer = useSelector(selectRevenueByPayer);
    const revenueTrend = useSelector(selectRevenueTrend);
    const claimStatusBreakdown = useSelector(selectClaimStatusBreakdown);

  // Create state for refresh interval
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Create callback functions for fetching dashboard data
  const fetchData = useCallback(() => {
    dispatch(fetchDashboardMetrics(dashboardFilters));
  }, [dispatch, dashboardFilters]);

  const fetchRevenue = useCallback(() => {
        dispatch(fetchRevenueMetrics(dashboardFilters));
    }, [dispatch, dashboardFilters]);

    const fetchClaims = useCallback(() => {
        dispatch(fetchClaimsMetrics(dashboardFilters));
    }, [dispatch, dashboardFilters]);

    const fetchAlerts = useCallback(() => {
        dispatch(fetchAlertNotifications(dashboardFilters));
    }, [dispatch, dashboardFilters]);

  // Create callback functions for updating dashboard filters
  const setTimeFrameFilter = useCallback((timeFrame: TimeFrame) => {
    dispatch(setTimeFrame(timeFrame));
  }, [dispatch]);

  const setDateRangeFilter = useCallback((dateRange: DateRange) => {
    dispatch(setDateRange(dateRange));
  }, [dispatch]);

  const setProgram = useCallback((programId: string | undefined) => {
    dispatch(setProgramFilter(programId));
  }, [dispatch]);

  const setPayer = useCallback((payerId: string | undefined) => {
    dispatch(setPayerFilter(payerId));
  }, [dispatch]);

  const setFacility = useCallback((facilityId: string | undefined) => {
    dispatch(setFacilityFilter(facilityId));
  }, [dispatch]);

  // Create callback function for marking alerts as read
  const markAsRead = useCallback((alertId: UUID, read: boolean) => {
    dispatch(markAlertAsRead({ alertId, read }));
  }, [dispatch]);

  // Set up effect to fetch dashboard data on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
            fetchRevenue();
            fetchClaims();
            fetchAlerts();
    }
  }, [autoFetch, fetchData, fetchRevenue, fetchClaims, fetchAlerts]);

  // Set up effect for auto-refreshing dashboard data at intervals
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchData();
            fetchRevenue();
            fetchClaims();
            fetchAlerts();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [fetchData, fetchRevenue, fetchClaims, fetchAlerts, refreshInterval]);

  // Return dashboard state and functions for components to use
  return {
    metrics,
    revenueMetrics,
    claimsMetrics,
    alertNotifications,
    unreadAlertCount,
    recentClaims,
    dashboardFilters,
    dateRange,
    timeFrame,
    programFilter,
    payerFilter,
    facilityFilter,
    loading,
    error,
    lastUpdated,
    isLoading,
        revenueByProgram,
        revenueByPayer,
        revenueTrend,
        claimStatusBreakdown,
    setTimeFrame: setTimeFrameFilter,
    setDateRange: setDateRangeFilter,
    setProgram: setProgram,
    setPayer: setPayer,
    setFacility: setFacility,
    markAlertAsRead: markAsRead,
    setRefreshInterval
  };
};

// Export custom hook for accessing and managing dashboard data
export default useDashboard;