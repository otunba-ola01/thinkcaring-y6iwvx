import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { Box, Grid, Typography, Divider, Skeleton, SxProps, Theme } from '@mui/material'; // v5.13.0
import { Add, Assignment, Warning, TrendingUp } from '@mui/icons-material'; // v5.13.0
import { useRouter } from 'next/router'; // v14.0.0

import Card from '../ui/Card';
import MetricCard from '../ui/MetricCard';
import ActionButton from '../ui/ActionButton';
import BarChart from '../charts/BarChart';
import BillingQueue from './BillingQueue';
import { billingApi } from '../../api/billing.api';
import useApiRequest from '../../hooks/useApiRequest';
import { BillingDashboardMetrics } from '../../types/billing.types';
import { formatCurrency, formatDate } from '../../utils/format';
import useResponsive from '../../hooks/useResponsive';

/**
 * A dashboard component that provides an overview of billing metrics, unbilled services, and billing activity
 * @param {{ sx }: { sx?: SxProps<Theme> }} props - The component props
 * @returns {JSX.Element} The rendered BillingDashboard component
 */
const BillingDashboard: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => {
  // LD1: Initialize router using useRouter hook for navigation
  const router = useRouter();

  // LD1: Set up responsive breakpoints using useResponsive hook
  const responsive = useResponsive();

  // LD1: Set up API request hook for fetching billing dashboard metrics
  const { data: dashboardMetrics, loading, error, execute: fetchDashboardMetrics } = useApiRequest<BillingDashboardMetrics>({
    url: '/api/billing/dashboard-metrics', // TODO: Use API_ENDPOINTS.BILLING.DASHBOARD_METRICS
    method: 'GET',
  });

  // LD1: Create handleCreateClaim function to navigate to claim creation page
  const handleCreateClaim = () => {
    router.push('/billing/claim-creation'); // TODO: Use ROUTES.BILLING.CLAIM_CREATION
  };

  // LD1: Create handleViewBillingQueue function to navigate to billing queue page
  const handleViewBillingQueue = () => {
    router.push('/billing/queue'); // TODO: Use ROUTES.BILLING.QUEUE
  };

  // LD1: Create handleViewDeadlines function to navigate to deadlines view
  const handleViewDeadlines = () => {
    // TODO: Implement navigation to deadlines view
    console.log('View Deadlines clicked');
  };

  // LD1: Use useEffect to fetch dashboard metrics when component mounts
  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // LD1: Create prepareBillingActivityData function to format data for bar chart
  const prepareBillingActivityData = (activityData: Array<{ date: string; claimsSubmitted: number; amount: number }>) => {
    return {
      labels: activityData.map(item => formatDate(item.date, 'MMM dd')),
      datasets: [
        {
          label: 'Claims Submitted',
          data: activityData.map(item => item.claimsSubmitted),
          backgroundColor: '#0F52BA', // TODO: Use theme color
        },
      ],
    };
  };

  // LD1: Create prepareDeadlinesData function to format data for bar chart
  const prepareDeadlinesData = (deadlinesData: Array<{ serviceCount: number; daysRemaining: number; amount: number }>) => {
    const groupedDeadlines: { [key: string]: number } = {};

    deadlinesData.forEach(item => {
      const range = item.daysRemaining <= 15 ? '0-15 days' : '16-30 days';
      groupedDeadlines[range] = (groupedDeadlines[range] || 0) + item.serviceCount;
    });

    return {
      labels: Object.keys(groupedDeadlines),
      datasets: [
        {
          label: 'Services Approaching Filing Deadline',
          data: Object.values(groupedDeadlines),
          backgroundColor: '#FF6B35', // TODO: Use theme color
        },
      ],
    };
  };

  // LD1: Render a Grid container with billing dashboard sections
  return (
    <Grid container spacing={2} sx={sx}>
      {/* LD1: Render metrics section with MetricCards for unbilled services, incomplete documentation, and pending claims */}
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Unbilled Services"
          value={dashboardMetrics?.unbilledServicesCount || 0}
          loading={loading}
          onClick={handleViewBillingQueue}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Incomplete Documentation"
          value={dashboardMetrics?.incompleteDocumentationCount || 0}
          loading={loading}
          icon={<Warning color="warning" />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Pending Claims"
          value={dashboardMetrics?.pendingClaimsCount || 0}
          loading={loading}
        />
      </Grid>

      {/* LD1: Render quick actions section with ActionButtons for common billing tasks */}
      <Grid item xs={12} md={4}>
        <Card title="Quick Actions">
          <Box display="flex" flexDirection="column" gap={1}>
            <ActionButton label="Create Claim" icon={<Add />} onClick={handleCreateClaim} />
            <ActionButton label="View Billing Queue" icon={<Assignment />} onClick={handleViewBillingQueue} />
            <ActionButton label="View Deadlines" icon={<TrendingUp />} onClick={handleViewDeadlines} />
          </Box>
        </Card>
      </Grid>

      {/* LD1: Render recent billing activity section with BarChart showing recent claim submissions */}
      <Grid item xs={12} md={8}>
        <BarChart
          title="Recent Billing Activity"
          data={dashboardMetrics ? prepareBillingActivityData(dashboardMetrics.recentBillingActivity) : []}
          loading={loading}
        />
      </Grid>

      {/* LD1: Render upcoming deadlines section with BarChart showing services approaching filing deadlines */}
      <Grid item xs={12} md={8}>
        <BarChart
          title="Upcoming Filing Deadlines"
          data={dashboardMetrics ? prepareDeadlinesData(dashboardMetrics.upcomingFilingDeadlines) : []}
          loading={loading}
        />
      </Grid>

      {/* LD1: Render unbilled services preview section with a simplified BillingQueue component */}
      <Grid item xs={12}>
        <BillingQueue sx={{ height: '400px' }} />
      </Grid>
    </Grid>
  );
};

/**
 * Prepares billing activity data for visualization in a bar chart
 * @param {Array<{ date: string, claimsSubmitted: number, amount: number }>} activityData
 * @returns {object} Formatted data for the bar chart component
 */
const prepareBillingActivityData = (activityData: Array<{ date: string; claimsSubmitted: number; amount: number }>) => {
  // LD1: Map activity data to format expected by BarChart component
  const labels = activityData.map(item => formatDate(item.date, 'MMM dd'));
  const datasets = [
    {
      label: 'Claims Submitted',
      data: activityData.map(item => item.claimsSubmitted),
      backgroundColor: '#0F52BA', // TODO: Use theme color
    },
    {
      label: 'Amount',
      data: activityData.map(item => formatCurrency(item.amount)),
      backgroundColor: '#4CAF50', // TODO: Use theme color
    },
  ];

  // LD1: Return formatted data object with labels and datasets
  return {
    labels,
    datasets,
  };
};

/**
 * Prepares filing deadline data for visualization in a bar chart
 * @param {Array<{ serviceCount: number, daysRemaining: number, amount: number }>} deadlinesData
 * @returns {object} Formatted data for the bar chart component
 */
const prepareDeadlinesData = (deadlinesData: Array<{ serviceCount: number; daysRemaining: number; amount: number }>) => {
  // LD1: Map deadlines data to format expected by BarChart component
  const labels = deadlinesData.map(item => `${item.daysRemaining} days`);
  const datasets = [
    {
      label: 'Services Approaching Filing Deadline',
      data: deadlinesData.map(item => item.serviceCount),
      backgroundColor: '#FF6B35', // TODO: Use theme color
    },
    {
      label: 'Amount',
      data: deadlinesData.map(item => formatCurrency(item.amount)),
      backgroundColor: '#4CAF50', // TODO: Use theme color
    },
  ];

  // LD1: Return formatted data object with labels and datasets
  return {
    labels,
    datasets,
  };
};

export default BillingDashboard;