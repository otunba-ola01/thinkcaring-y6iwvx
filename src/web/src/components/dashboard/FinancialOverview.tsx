import React, { useMemo } from 'react'; // v18.2.0
import { Grid, Box, Typography, useTheme } from '@mui/material'; // v5.13.0
import { AttachMoney, TrendingUp, Assessment } from '@mui/icons-material'; // v5.13.0
import Card from '../ui/Card';
import MetricCard from '../ui/MetricCard';
import RevenueMetrics from './RevenueMetrics';
import ClaimsStatus from './ClaimsStatus';
import AlertNotifications from './AlertNotifications';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/currency';
import { DashboardMetrics, LoadingState } from '../../types/dashboard.types';

/**
 * Calculates summary metrics from dashboard data for display in metric cards
 * @param {DashboardMetrics} metrics
 * @returns {object} Object containing calculated summary metrics
 */
const calculateSummaryMetrics = (metrics: DashboardMetrics | null) => {
  // LD1: Extract revenue data from metrics.revenue
  const revenue = metrics?.revenue;

  // LD1: Extract claims data from metrics.claims
  const claims = metrics?.claims;

  // LD1: Calculate total revenue from currentPeriodRevenue
  const totalRevenue = revenue?.currentPeriodRevenue || 0;

  // LD1: Calculate revenue change percentage
  const revenueChangePercentage = revenue?.changePercentage || 0;

  // LD1: Extract total claims count
  const totalClaims = claims?.totalClaims || 0;

  // LD1: Calculate clean claim rate percentage
  const cleanClaimRate = claims?.cleanClaimRate || 0;

  // LD1: Calculate denial rate percentage
  const denialRate = claims?.denialRate || 0;

  // LD1: Return object with calculated metrics
  return {
    totalRevenue,
    revenueChangePercentage,
    totalClaims,
    cleanClaimRate,
    denialRate,
  };
};

/**
 * Main component that displays the financial overview dashboard with revenue metrics, claims status, and alerts
 * @param {object} props
 * @returns {JSX.Element} The rendered FinancialOverview component
 */
const FinancialOverview: React.FC = (props) => {
  // LD1: Destructure props to extract any custom props like className
  const { className } = props;

  // LD1: Use the useDashboard hook to access dashboard data, loading state, and filters
  const { metrics, loading } = useDashboard();

  // LD1: Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // LD1: Extract metrics, loading state, and error state from the dashboard hook
  const {
    totalRevenue,
    totalClaims,
    cleanClaimRate,
    denialRate,
  } = useMemo(() => calculateSummaryMetrics(metrics), [metrics]);

  // LD1: Render a Container component to wrap the entire dashboard
  return (
    <Card title="Financial Overview" className={className}>
      {/* LD1: Render a Grid container with spacing for the dashboard layout */}
      <Grid container spacing={3}>
        {/* LD1: Create a responsive grid layout with different column widths for different screen sizes */}
        <Grid item xs={12} md={4}>
          {/* LD1: Render MetricCards for key financial metrics (Total Revenue, Claims Count, Clean Claim Rate) */}
          <MetricCard
            title="Total Revenue"
            value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(totalRevenue)}
            icon={<AttachMoney />}
            loading={loading === LoadingState.LOADING}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Claims Count"
            value={loading === LoadingState.LOADING ? 'Loading...' : totalClaims}
            icon={<Assessment />}
            loading={loading === LoadingState.LOADING}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Clean Claim Rate"
            value={loading === LoadingState.LOADING ? 'Loading...' : `${cleanClaimRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            loading={loading === LoadingState.LOADING}
          />
        </Grid>

        {/* LD1: Render the RevenueMetrics component in its own grid item */}
        <Grid item xs={12} md={8}>
          <RevenueMetrics />
        </Grid>

        {/* LD1: Render the ClaimsStatus component in its own grid item */}
        <Grid item xs={12} md={4}>
          <ClaimsStatus />
        </Grid>

        {/* LD1: Render the AlertNotifications component in its own grid item */}
        <Grid item xs={12}>
          <AlertNotifications />
        </Grid>
      </Grid>
    </Card>
  );
};

export default FinancialOverview;