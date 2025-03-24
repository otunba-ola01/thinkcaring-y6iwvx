/**
 * Redux Toolkit slice for managing dashboard state in the HCBS Revenue Management System.
 * This slice defines the dashboard state structure, reducers for synchronous state updates,
 * and handles async thunk actions for fetching dashboard data.
 * 
 * The dashboard includes financial metrics, revenue breakdowns, claims status tracking,
 * and an alert notification system as required by the application specifications.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+

import { 
  DashboardState, 
  DashboardFilters, 
  TimeFrame, 
  LoadingState,
  AlertNotification
} from '../../types/dashboard.types';
import { DateRange } from '../../types/common.types';
import { 
  fetchDashboardMetrics, 
  fetchRevenueMetrics, 
  fetchClaimsMetrics, 
  fetchAlertNotifications,
  markAlertAsRead
} from './dashboardThunks';
import { getDefaultDateRange } from '../../utils/date';

/**
 * Initial state for the dashboard slice
 */
const initialState: DashboardState = {
  metrics: null,
  filters: {
    timeFrame: TimeFrame.LAST_30_DAYS,
    dateRange: getDefaultDateRange(TimeFrame.LAST_30_DAYS),
    programId: undefined,
    payerId: undefined,
    facilityId: undefined
  },
  loading: LoadingState.IDLE,
  error: null,
  lastUpdated: null
};

/**
 * Dashboard slice definition with reducers and extra reducers for async actions
 */
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    /**
     * Sets all dashboard filters at once
     */
    setDashboardFilters: (state, action: PayloadAction<DashboardFilters>) => {
      state.filters = action.payload;
    },
    
    /**
     * Resets dashboard filters to default values
     */
    resetDashboardFilters: (state) => {
      state.filters = {
        timeFrame: TimeFrame.LAST_30_DAYS,
        dateRange: getDefaultDateRange(TimeFrame.LAST_30_DAYS),
        programId: undefined,
        payerId: undefined,
        facilityId: undefined
      };
    },
    
    /**
     * Sets the time frame filter and updates date range accordingly
     */
    setTimeFrame: (state, action: PayloadAction<TimeFrame>) => {
      state.filters.timeFrame = action.payload;
      state.filters.dateRange = getDefaultDateRange(action.payload);
    },
    
    /**
     * Sets a custom date range and updates time frame to CUSTOM
     */
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.filters.dateRange = action.payload;
      state.filters.timeFrame = TimeFrame.CUSTOM;
    },
    
    /**
     * Sets the program filter
     */
    setProgramFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.programId = action.payload;
    },
    
    /**
     * Sets the payer filter
     */
    setPayerFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.payerId = action.payload;
    },
    
    /**
     * Sets the facility filter
     */
    setFacilityFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.facilityId = action.payload;
    },
    
    /**
     * Marks an alert as read or unread in the local state
     */
    markAlertRead: (state, action: PayloadAction<{ alertId: string, read: boolean }>) => {
      if (state.metrics?.alerts) {
        const alert = state.metrics.alerts.find(alert => alert.id === action.payload.alertId);
        if (alert) {
          alert.read = action.payload.read;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDashboardMetrics async thunk
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload.metrics;
        state.loading = LoadingState.SUCCEEDED;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.error.message || 'Failed to fetch dashboard metrics';
      })
      
      // Handle fetchRevenueMetrics async thunk
      .addCase(fetchRevenueMetrics.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchRevenueMetrics.fulfilled, (state, action) => {
        if (state.metrics) {
          state.metrics.revenue = action.payload.metrics;
        } else {
          state.metrics = {
            revenue: action.payload.metrics,
            claims: {
              totalClaims: 0,
              totalAmount: 0,
              statusBreakdown: [],
              denialRate: 0,
              averageProcessingTime: 0,
              cleanClaimRate: 0,
              claimsApproachingDeadline: 0,
              recentClaims: []
            },
            payments: {
              totalPayments: 0,
              totalAmount: 0,
              reconciliationBreakdown: [],
              paymentMethodBreakdown: [],
              paymentsByPayer: [],
              paymentTrend: [],
              averagePaymentAmount: 0
            },
            services: {
              totalServices: 0,
              totalAmount: 0,
              unbilledServices: 0,
              unbilledAmount: 0,
              statusBreakdown: [],
              servicesByProgram: []
            },
            agingReceivables: {
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days91Plus: 0,
              total: 0
            },
            alerts: []
          };
        }
        state.loading = LoadingState.SUCCEEDED;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRevenueMetrics.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.error.message || 'Failed to fetch revenue metrics';
      })
      
      // Handle fetchClaimsMetrics async thunk
      .addCase(fetchClaimsMetrics.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchClaimsMetrics.fulfilled, (state, action) => {
        if (state.metrics) {
          state.metrics.claims = action.payload.metrics;
        } else {
          state.metrics = {
            revenue: {
              currentPeriodRevenue: 0,
              previousPeriodRevenue: 0,
              changePercentage: 0,
              ytdRevenue: 0,
              previousYtdRevenue: 0,
              ytdChangePercentage: 0,
              projectedRevenue: 0,
              revenueByProgram: [],
              revenueByPayer: [],
              revenueByFacility: [],
              revenueTrend: []
            },
            claims: action.payload.metrics,
            payments: {
              totalPayments: 0,
              totalAmount: 0,
              reconciliationBreakdown: [],
              paymentMethodBreakdown: [],
              paymentsByPayer: [],
              paymentTrend: [],
              averagePaymentAmount: 0
            },
            services: {
              totalServices: 0,
              totalAmount: 0,
              unbilledServices: 0,
              unbilledAmount: 0,
              statusBreakdown: [],
              servicesByProgram: []
            },
            agingReceivables: {
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days91Plus: 0,
              total: 0
            },
            alerts: []
          };
        }
        state.loading = LoadingState.SUCCEEDED;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchClaimsMetrics.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.error.message || 'Failed to fetch claims metrics';
      })
      
      // Handle fetchAlertNotifications async thunk
      .addCase(fetchAlertNotifications.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchAlertNotifications.fulfilled, (state, action) => {
        if (state.metrics) {
          state.metrics.alerts = action.payload.alerts;
        } else {
          state.metrics = {
            revenue: {
              currentPeriodRevenue: 0,
              previousPeriodRevenue: 0,
              changePercentage: 0,
              ytdRevenue: 0,
              previousYtdRevenue: 0,
              ytdChangePercentage: 0,
              projectedRevenue: 0,
              revenueByProgram: [],
              revenueByPayer: [],
              revenueByFacility: [],
              revenueTrend: []
            },
            claims: {
              totalClaims: 0,
              totalAmount: 0,
              statusBreakdown: [],
              denialRate: 0,
              averageProcessingTime: 0,
              cleanClaimRate: 0,
              claimsApproachingDeadline: 0,
              recentClaims: []
            },
            payments: {
              totalPayments: 0,
              totalAmount: 0,
              reconciliationBreakdown: [],
              paymentMethodBreakdown: [],
              paymentsByPayer: [],
              paymentTrend: [],
              averagePaymentAmount: 0
            },
            services: {
              totalServices: 0,
              totalAmount: 0,
              unbilledServices: 0,
              unbilledAmount: 0,
              statusBreakdown: [],
              servicesByProgram: []
            },
            agingReceivables: {
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days91Plus: 0,
              total: 0
            },
            alerts: action.payload.alerts
          };
        }
        state.loading = LoadingState.SUCCEEDED;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAlertNotifications.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.error.message || 'Failed to fetch alert notifications';
      })
      
      // Handle markAlertAsRead async thunk
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        // The local state is already updated by the markAlertRead reducer
      })
      .addCase(markAlertAsRead.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to mark alert as read';
      });
  }
});

// Export actions and reducer
export const { 
  setDashboardFilters, 
  resetDashboardFilters, 
  setTimeFrame, 
  setDateRange, 
  setProgramFilter, 
  setPayerFilter, 
  setFacilityFilter,
  markAlertRead
} = dashboardSlice.actions;

export const dashboardReducer = dashboardSlice.reducer;

export default dashboardSlice.reducer;