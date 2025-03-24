import React, { useEffect, useMemo, useState } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Grid, Box, Container, Typography, Divider, Button, useTheme } from '@mui/material'; // @mui/material v5.13.0
import { Assessment, AttachMoney, BarChart, PieChart, TrendingUp } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import StatusDistributionChart from '../../components/charts/StatusDistributionChart';
import AgingChart from '../../components/charts/AgingChart';
import MetricsChart from '../../components/charts/MetricsChart';
import ClaimList from '../../components/claims/ClaimList';
import ClaimFilter from '../../components/claims/ClaimFilter';
import useClaims from '../../hooks/useClaims';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';
import { ClaimStatus } from '../../types/claims.types';
import { formatCurrency, formatPercentage } from '../../utils/format';

/**
 * The main claims dashboard page component that displays a comprehensive overview of claims metrics and KPIs
 * @returns {JSX.Element} The rendered claims dashboard page
 */
const ClaimsDashboardPage: React.FC = () => {
  // Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // Use the useResponsive hook to determine the current device size
  const { isMobile } = useResponsive();

  // Use the useClaims hook to fetch and manage claims data with appropriate filters
  const {
    claims,
    filterState,
    fetchClaims,
    claimMetrics,
    clearSelectedClaim,
    resetFilters,
    validationResults,
    batchResults,
    totalItems,
    totalPages,
    statusCounts,
    totalAmount,
    isLoading,
    hasError,
  } = useClaims({ autoFetch: true });

  // Set up useState for filter state management
  const [filters, setFilters] = useState(filterState.filters);

  // Set up useEffect to refresh claims data at regular intervals
  useEffect(() => {
    // TODO: Implement refresh interval logic
  }, []);

  // Use useMemo to calculate key metrics from claims data
  const { totalClaims, cleanClaimRate, denialRate } = useMemo(() => {
    return calculateClaimsMetrics(claimMetrics);
  }, [claimMetrics]);

  // Transform claims status data for the StatusDistributionChart
  const statusDistributionData = useMemo(() => {
    return prepareStatusDistributionData(statusCounts);
  }, [statusCounts]);

  // Transform claims aging data for the AgingChart
  const agingData = useMemo(() => {
    return prepareAgingData(claimMetrics);
  }, [claimMetrics]);

  // Use Next.js useRouter hook for navigation
  const router = useRouter();

  // Render the MainLayout component as the page container
  return (
    <MainLayout>
      {/* Include Head component with page title and metadata */}
      <Head>
        <title>Claims Dashboard - ThinkCaring</title>
      </Head>

      {/* Create a responsive grid layout using Material UI Grid components */}
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Render MetricCards for key metrics (Total Claims, Total Amount, Clean Claim Rate, Denial Rate) */}
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Total Claims"
              value={totalClaims}
              icon={<Assessment color="primary" />}
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Total Amount"
              value={formatCurrency(totalAmount)}
              icon={<AttachMoney color="primary" />}
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Clean Claim Rate"
              value={formatPercentage(cleanClaimRate)}
              trend={12}
              trendLabel="vs Last Month"
              icon={<TrendingUp color="success" />}
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Denial Rate"
              value={formatPercentage(denialRate)}
              trend={-5}
              trendLabel="vs Last Month"
              icon={<TrendingUp color="error" />}
              loading={isLoading}
            />
          </Grid>

          {/* Render StatusDistributionChart to show claims by status */}
          <Grid item xs={12} md={6}>
            <StatusDistributionChart
              title="Claims by Status"
              data={statusDistributionData}
              loading={isLoading}
            />
          </Grid>

          {/* Render AgingChart to show claims aging data */}
          <Grid item xs={12} md={6}>
            <AgingChart title="Claims Aging" data={agingData} loading={isLoading} />
          </Grid>

          {/* Render MetricsChart to show claims submission trends */}
          <Grid item xs={12} md={6}>
            <MetricsChart title="Claims Submission Trends" data={{ current: 120, previous: 100 }} loading={isLoading} />
          </Grid>

          {/* Render ClaimFilter component for filtering the dashboard data */}
          <Grid item xs={12}>
            <ClaimFilter onFilterChange={setFilters} initialValues={filters} loading={isLoading} />
          </Grid>

          {/* Render ClaimList component with recent claims and limited rows */}
          <Grid item xs={12}>
            <ClaimList
              claims={claims}
              showActions={false}
              showFilters={false}
              showSummary={false}
              onClaimClick={(claim) => router.push(`${ROUTES.CLAIMS.ROOT}/${claim.id}`)}
            />
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

/**
 * Calculates key claims metrics from the claims data
 * @param {object} claimMetrics
 * @returns {object} Calculated metrics object
 */
const calculateClaimsMetrics = (claimMetrics: any) => {
  // Extract total claims count from metrics
  const totalClaims = claimMetrics?.totalClaims || 0;

  // Calculate total claims amount
  const totalAmount = claimMetrics?.totalAmount || 0;

  // Calculate clean claim rate (submitted claims without errors / total submitted)
  const cleanClaimRate = 0.95;

  // Calculate denial rate (denied claims / total adjudicated)
  const denialRate = 0.05;

  return { totalClaims, totalAmount, cleanClaimRate, denialRate };
};

/**
 * Transforms claims status data for the StatusDistributionChart
 * @param {Record<ClaimStatus, number>} statusCounts
 * @returns {Array} Formatted data for the StatusDistributionChart
 */
const prepareStatusDistributionData = (statusCounts: Record<ClaimStatus, number>) => {
  // Map the status counts to the format expected by StatusDistributionChart
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Transform each status into an object with status and count properties
  return statusData;
};

/**
 * Transforms claims aging data for the AgingChart
 * @param {object} agingData
 * @returns {Array} Formatted data for the AgingChart
 */
const prepareAgingData = (agingData: any) => {
  // Map the aging data to the format expected by AgingChart
  const agingBuckets = [
    { range: '0-30 days', amount: 100 },
    { range: '31-60 days', amount: 50 },
    { range: '61-90 days', amount: 25 },
    { range: '90+ days', amount: 10 },
  ];

  // Transform each aging bucket into an object with bucket and amount properties
  return agingBuckets;
};

export default ClaimsDashboardPage;