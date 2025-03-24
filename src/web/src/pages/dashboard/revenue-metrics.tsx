# src/web/src/pages/dashboard/revenue-metrics.tsx
```tsx
import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4+
// @mui/material v5.13.0
import { Grid, Box, Typography, Container, Paper, Divider, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Button, useTheme } from '@mui/material';
// @mui/icons-material v5.13.0
import { AttachMoney, TrendingUp, ShowChart, GetApp } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import RevenueMetrics from '../../components/dashboard/RevenueMetrics';
import RevenueByProgramChart from '../../components/charts/RevenueByProgramChart';
import RevenueByPayerChart from '../../components/charts/RevenueByPayerChart';
import RevenueTrendChart from '../../components/charts/RevenueTrendChart';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import DateRangePicker from '../../components/ui/DateRangePicker';
import useDashboard from '../../hooks/useDashboard';
import useResponsive from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/currency';
import { TimeFrame, RevenueMetrics as RevenueMetricsType, LoadingState } from '../../types/dashboard.types';
import { NextPageWithLayout } from '../../types/common.types';

/**
 * The revenue metrics detail page component that displays comprehensive revenue analytics
 * @returns {JSX.Element} The rendered revenue metrics page
 */
const RevenueMetricsPage: NextPageWithLayout = () => {
  // Use the useDashboard hook to access dashboard data and operations
  const { 
    revenueMetrics, 
    dashboardFilters, 
    loading, 
    revenueByProgram, 
    revenueByPayer, 
    revenueTrend, 
    setTimeFrame, 
    setDateRange 
  } = useDashboard();

  // Use the useResponsive hook to get responsive breakpoint information
  const { isMobile } = useResponsive();

  // Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // Create state for the active tab index using React.useState
  const [tabValue, setTabValue] = useState(0);

  // Extract revenue metrics, filters, loading state, and filter handlers from useDashboard
  const currentPeriodRevenue = revenueMetrics?.currentPeriodRevenue;
  const ytdRevenue = revenueMetrics?.ytdRevenue;
  const projectedRevenue = revenueMetrics?.projectedRevenue;

  /**
   * A component that renders content for a specific tab
   * @param {object} { children, value, index, ...other }
   * @returns {JSX.Element | null} The rendered tab panel or null if not active
   */
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  /**
   * Creates a handleTabChange function to update the active tab index
   * @param {React.SyntheticEvent} event - React synthetic event
   * @param {number} newValue - The new tab index
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  /**
   * Creates a handleExport function to export revenue data in different formats
   */
  const handleExport = () => {
    // Implement export functionality here
    console.log('Exporting revenue data...');
  };

  return (
    <>
      {/* Render the page title and SEO metadata using Next.js Head component */}
      <Head>
        <title>Revenue Metrics | ThinkCaring</title>
        <meta name="description" content="Detailed revenue metrics and analytics" />
      </Head>

      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Revenue Metrics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Detailed revenue analytics and trends
          </Typography>
        </Box>

        {/* Render the filter controls for time frame, program, and payer selection */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="timeframe-select-label">Time Frame</InputLabel>
              <Select
                labelId="timeframe-select-label"
                id="timeframe-select"
                value={dashboardFilters.timeFrame}
                label="Time Frame"
                onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
              >
                <MenuItem value={TimeFrame.TODAY}>Today</MenuItem>
                <MenuItem value={TimeFrame.LAST_7_DAYS}>Last 7 Days</MenuItem>
                <MenuItem value={TimeFrame.LAST_30_DAYS}>Last 30 Days</MenuItem>
                <MenuItem value={TimeFrame.THIS_MONTH}>This Month</MenuItem>
                <MenuItem value={TimeFrame.THIS_QUARTER}>This Quarter</MenuItem>
                <MenuItem value={TimeFrame.THIS_YEAR}>This Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <DateRangePicker
              startDate={dashboardFilters.dateRange.startDate}
              endDate={dashboardFilters.dateRange.endDate}
              onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
            />
          </Grid>
        </Grid>

        {/* Render the main content area with revenue metrics cards and charts */}
        <Grid container spacing={3}>
          {/* Display MetricCards for key revenue metrics (Current Period Revenue, YTD Revenue, Projected Revenue) */}
          <Grid item xs={12} md={4}>
            <MetricCard
              title="Current Period Revenue"
              value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(currentPeriodRevenue || 0)}
              icon={<AttachMoney />}
              loading={loading === LoadingState.LOADING}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricCard
              title="YTD Revenue"
              value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(ytdRevenue || 0)}
              icon={<TrendingUp />}
              loading={loading === LoadingState.LOADING}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricCard
              title="Projected Revenue"
              value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(projectedRevenue || 0)}
              icon={<ShowChart />}
              loading={loading === LoadingState.LOADING}
            />
          </Grid>
        </Grid>

        {/* Create tabs for different revenue visualizations (Trend, By Program, By Payer) */}
        <Box sx={{ width: '100%', mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="revenue metrics tabs">
              <Tab label="Trend" id="simple-tab-0" aria-controls="simple-tabpanel-0" />
              <Tab label="By Program" id="simple-tab-1" aria-controls="simple-tabpanel-1" />
              <Tab label="By Payer" id="simple-tab-2" aria-controls="simple-tabpanel-2" />
            </Tabs>
          </Box>

          {/* Render the appropriate chart based on the active tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Handle loading states with appropriate loading indicators */}
            {loading === LoadingState.LOADING ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Loading Revenue Trend Chart...</Typography>
              </Box>
            ) : (
              <RevenueTrendChart data={revenueTrend || []} />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {/* Handle loading states with appropriate loading indicators */}
            {loading === LoadingState.LOADING ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Loading Revenue By Program Chart...</Typography>
              </Box>
            ) : (
              <RevenueByProgramChart programRevenue={revenueByProgram || []} />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {/* Handle loading states with appropriate loading indicators */}
            {loading === LoadingState.LOADING ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Loading Revenue By Payer Chart...</Typography>
              </Box>
            ) : (
              <RevenueByPayerChart payerRevenue={revenueByPayer || []} />
            )}
          </TabPanel>
        </Box>

        {/* Provide export options for the revenue data */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<GetApp />} onClick={handleExport}>
            Export Data
          </Button>
        </Box>
      </Container>
    </>
  );
};

RevenueMetricsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  );
};

export default RevenueMetricsPage;