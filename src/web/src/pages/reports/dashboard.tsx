import React, { useCallback, useEffect } from 'react'; // react v18.2.0
import { Box, Grid, Typography, Divider, useTheme, Button } from '@mui/material'; // v5.13.0
import { Add, Visibility, Schedule, Refresh, BarChart, PieChart, TableChart } from '@mui/icons-material'; // v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0

import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import ActionButton from '../../components/ui/ActionButton';
import ReportList from '../../components/reports/ReportList';
import ReportSelector from '../../components/reports/ReportSelector';
import MetricsChart from '../../components/charts/MetricsChart';
import useReports from '../../hooks/useReports';
import { ReportDashboardProps } from '../../types/ui.types';
import { ReportDefinition, ReportInstance, ReportFormat, FinancialMetric } from '../../types/reports.types';
import { ROUTES } from '../../constants/routes.constants';
import { NextPageWithLayout } from '../../types/common.types';
import MainLayout from '../../components/layout/MainLayout';

/**
 * The Reports Dashboard page component that displays financial metrics, recent reports, and provides quick access to report features
 * @param props 
 * @returns 
 */
const ReportsDashboardPage: NextPageWithLayout<ReportDashboardProps> = (props) => {
  // Destructure props to extract onCreateReport, onViewReport, and onScheduleReport callbacks
  const { onCreateReport, onViewReport, onScheduleReport } = props;

  // Initialize the router using useRouter hook for navigation
  const router = useRouter();

  // Initialize the theme using useTheme hook for styling
  const theme = useTheme();

  // Initialize the useReports hook with autoFetch set to true to load report data
  const {
    reportDefinitions,
    reportInstances,
    scheduledReports,
    financialMetrics,
    isLoading,
    getFinancialMetrics,
    getReportInstances
  } = useReports({ autoFetch: true });

  // Define a handleCreateReport callback that navigates to the report selection page
  const handleCreateReport = useCallback(() => {
    router.push(ROUTES.REPORTS.SELECTION);
  }, [router]);

  // Define a handleViewReport callback that navigates to the report viewer page with the selected report ID
  const handleViewReport = useCallback((reportId: string) => {
    router.push(`${ROUTES.REPORTS.VIEWER}?id=${reportId}`);
  }, [router]);

  // Define a handleScheduleReport callback that navigates to the report scheduler page
  const handleScheduleReport = useCallback(() => {
    router.push(ROUTES.REPORTS.SCHEDULER);
  }, [router]);

  // Define a handleExportReport callback that calls the exportReport function from useReports
  const handleExportReport = useCallback((reportId: string, format: ReportFormat) => {
    // Implement the exportReport function here
    console.log(`Exporting report ${reportId} in format ${format}`);
  }, []);

  // Define a handleDeleteReport callback that calls the deleteReportInstance function from useReports and refreshes the reports list
  const handleDeleteReport = useCallback((reportId: string) => {
    // Implement the deleteReportInstance function here
    console.log(`Deleting report ${reportId}`);
  }, []);

  // Use useEffect to fetch financial metrics and recent reports when component mounts
  useEffect(() => {
    getFinancialMetrics();
    getReportInstances({ page: 1, pageSize: 10 });
  }, [getFinancialMetrics, getReportInstances]);

  // Render the Head component with the page title 'Reports Dashboard'
  return (
    <Box>
      <Head>
        <title>Reports Dashboard</title>
      </Head>
      {/* Render the ReportDashboard component with the callback handlers and data from useReports */}
      <Grid container spacing={2}>
        {/* Map through financialMetrics to render MetricCard components for each metric */}
        {financialMetrics && financialMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={metric.id}>
            <MetricCard
              title={metric.name}
              value={metric.value}
              trend={metric.change}
              icon={getMetricIcon(metric.category)}
              loading={isLoading}
            />
          </Grid>
        ))}

        {/* Render a Card component for quick actions with buttons for creating, scheduling, and refreshing reports */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card title="Quick Actions" loading={isLoading}>
            <ActionButton label="Create Report" icon={<Add />} onClick={handleCreateReport} />
            <ActionButton label="Schedule Report" icon={<Schedule />} onClick={handleScheduleReport} />
            <ActionButton label="Refresh" icon={<Refresh />} onClick={() => {}} />
          </Card>
        </Grid>
      </Grid>

      {/* Render a Divider to separate the metrics section from the reports section */}
      <Divider sx={{ my: 3 }} />

      {/* Render the ReportList component with the callback handlers and data from useReports */}
      <ReportList
        listType="instances"
        onView={handleViewReport}
        onEdit={() => {}}
        onDelete={handleDeleteReport}
        onExecute={() => {}}
        onSchedule={() => {}}
        onExport={handleExportReport}
        sx={{}}
      />
    </Box>
  );
};

/**
 * Returns the appropriate icon component for a financial metric based on its category
 * @param category - The category of the financial metric
 * @returns Icon component for the metric category
 */
const getMetricIcon = (category: string): JSX.Element => {
  switch (category) {
    case 'revenue':
      return <BarChart color="primary" />;
    case 'claims':
      return <PieChart color="primary" />;
    case 'payments':
      return <TableChart color="primary" />;
    default:
      return <TableChart color="primary" />;
  }
};

ReportsDashboardPage.getLayout = (page) => (
  <MainLayout>{page}</MainLayout>
);

export default ReportsDashboardPage;