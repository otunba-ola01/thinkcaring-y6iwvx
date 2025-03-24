// react v18.2.0
import React, { useMemo } from 'react';
// @mui/material v5.13.0
import { Grid, Box, Typography, Divider, Tabs, Tab, useTheme } from '@mui/material';
// @mui/icons-material v5.13.0
import { AttachMoney, TrendingUp, ShowChart } from '@mui/icons-material';
import Card from '../ui/Card';
import MetricCard from '../ui/MetricCard';
import RevenueByProgramChart from '../charts/RevenueByProgramChart';
import RevenueByPayerChart from '../charts/RevenueByPayerChart';
import RevenueTrendChart from '../charts/RevenueTrendChart';
import useDashboard from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/currency';
import { RevenueMetrics as RevenueMetricsType, LoadingState } from '../../types/dashboard.types';

/**
 * Formats the trend percentage for display with appropriate sign
 * @param percentage 
 * @returns Formatted trend label with sign
 */
const formatTrendLabel = (percentage: number): string => {
  if (percentage > 0) {
    return `+${percentage}%`;
  } else if (percentage < 0) {
    return `${percentage}%`;
  } else {
    return '0%';
  }
};

/**
 * A component that renders content for a specific tab
 * @param { children, value, index, ...other } 
 * @returns The rendered tab panel or null if not active
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
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
 * Component that displays detailed revenue metrics and visualizations
 * @param {props} 
 * @returns The rendered RevenueMetrics component
 */
const RevenueMetrics: React.FC = (props) => {
  // Destructure props to extract any custom props like className
  const { className } = props;

  // Use the useDashboard hook to access revenue metrics data, loading state, and filters
  const { revenueMetrics, loading, revenueByProgram, revenueByPayer, revenueTrend } = useDashboard();

  // Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // Create state for the active tab index using React.useState
  const [value, setValue] = React.useState(0);

  // Extract revenue metrics, loading state, and error state from the dashboard hook
  const currentPeriodRevenue = revenueMetrics?.currentPeriodRevenue;
  const ytdRevenue = revenueMetrics?.ytdRevenue;
  const projectedRevenue = revenueMetrics?.projectedRevenue;

  // Handle tab change with a function that updates the active tab index
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Render a Card component to wrap the revenue metrics content
  return (
    <Card title="Revenue Metrics" subtitle="Current Time Period" className={className}>
      <Grid container spacing={3}>
        {/* Render MetricCards for key revenue metrics (Current Period Revenue, YTD Revenue, Projected Revenue) */}
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Current Period Revenue"
            value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(currentPeriodRevenue || 0)}
            trend={revenueMetrics?.changePercentage}
            trendLabel={formatTrendLabel(revenueMetrics?.changePercentage || 0)}
            icon={<AttachMoney />}
            loading={loading === LoadingState.LOADING}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="YTD Revenue"
            value={loading === LoadingState.LOADING ? 'Loading...' : formatCurrency(ytdRevenue || 0)}
            trend={revenueMetrics?.ytdChangePercentage}
            trendLabel={formatTrendLabel(revenueMetrics?.ytdChangePercentage || 0)}
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
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="revenue metrics tabs">
            <Tab label="Trend" id="simple-tab-0" aria-controls="simple-tabpanel-0" />
            <Tab label="By Program" id="simple-tab-1" aria-controls="simple-tabpanel-1" />
            <Tab label="By Payer" id="simple-tab-2" aria-controls="simple-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Render the appropriate chart based on the active tab */}
        <TabPanel value={value} index={0}>
          {/* Handle loading states by showing skeletons when data is loading */}
          {loading === LoadingState.LOADING ? (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>Loading Revenue Trend Chart...</Typography>
            </Box>
          ) : (
            <RevenueTrendChart data={revenueTrend || []} />
          )}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {/* Handle loading states by showing skeletons when data is loading */}
          {loading === LoadingState.LOADING ? (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>Loading Revenue By Program Chart...</Typography>
            </Box>
          ) : (
            <RevenueByProgramChart programRevenue={revenueByProgram || []} />
          )}
        </TabPanel>
        <TabPanel value={value} index={2}>
          {/* Handle loading states by showing skeletons when data is loading */}
          {loading === LoadingState.LOADING ? (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>Loading Revenue By Payer Chart...</Typography>
            </Box>
          ) : (
            <RevenueByPayerChart payerRevenue={revenueByPayer || []} />
          )}
        </TabPanel>
      </Box>

      {/* Apply appropriate spacing and styling based on the current theme */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Data updated as of {new Date().toLocaleTimeString()}
      </Typography>
    </Card>
  );
};

export default RevenueMetrics;