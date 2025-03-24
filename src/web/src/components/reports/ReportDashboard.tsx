import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { Box, Grid, Typography, Divider, useTheme, Button } from '@mui/material'; // v5.13.0
import { Add, Visibility, Schedule, Refresh, BarChart, PieChart, TableChart } from '@mui/icons-material'; // v5.13.0
import { useRouter } from 'next/router'; // v13.4.0

import Card from '../ui/Card';
import MetricCard from '../ui/MetricCard';
import ActionButton from '../ui/ActionButton';
import ReportList from './ReportList';
import ReportSelector from './ReportSelector';
import MetricsChart from '../charts/MetricsChart';
import useReports from '../../hooks/useReports';
import { ReportDashboardProps } from '../../types/ui.types';
import { ReportDefinition, ReportInstance, ScheduledReport, FinancialMetric } from '../../types/reports.types';

/**
 * A dashboard component that displays key financial metrics, recent reports, and provides quick access to report features
 * @param props 
 * @returns 
 */
const ReportDashboard: React.FC<ReportDashboardProps> = (props) => {
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

  // Set up state for active tab using useState, default to 'recent'
  const [activeTab, setActiveTab] = useState<'recent' | 'scheduled' | 'templates'>('recent');

  /**
   * Create handleTabChange function to update active tab state
   * @param event 
   * @param newValue 
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'recent' | 'scheduled' | 'templates') => {
    setActiveTab(newValue);
  };

  /**
   * Create handleViewReport function that calls onViewReport with the report ID
   * @param reportId 
   */
  const handleViewReport = (reportId: string) => {
    onViewReport(reportId);
  };

  /**
   * Create handleCreateReport function that calls onCreateReport
   */
  const handleCreateReport = () => {
    onCreateReport();
  };

  /**
   * Create handleScheduleReport function that calls onScheduleReport
   */
  const handleScheduleReport = () => {
    onScheduleReport();
  };

  /**
   * Create handleRefresh function to reload financial metrics and reports
   */
  const handleRefresh = () => {
    getFinancialMetrics();
    getReportInstances({ page: 1, pageSize: 10 });
  };

  // Use useEffect to fetch financial metrics and recent reports when component mounts
  useEffect(() => {
    getFinancialMetrics();
    getReportInstances({ page: 1, pageSize: 10 });
  }, [getFinancialMetrics, getReportInstances]);

  // Render a Box container for the entire dashboard
  return (
    <Box>
      {/* Render a Grid container for the top section with financial metrics */}
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
            <ActionButton label="Refresh" icon={<Refresh />} onClick={handleRefresh} />
          </Card>
        </Grid>
      </Grid>

      {/* Render a Divider to separate the metrics section from the reports section */}
      <Divider sx={{ my: 3 }} />

      {/* Render tabs for switching between recent reports, scheduled reports, and report templates */}
      <Tabs
        tabs={[
          { label: 'Recent Reports', value: 'recent' },
          { label: 'Scheduled Reports', value: 'scheduled' },
          { label: 'Report Templates', value: 'templates' },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* Render the appropriate content based on the active tab */}
      {activeTab === 'recent' && (
        <ReportList
          listType="instances"
          onView={handleViewReport}
          loading={isLoading}
        />
      )}
      {activeTab === 'scheduled' && (
        <ReportList
          listType="scheduled"
          onView={handleViewReport}
          loading={isLoading}
        />
      )}
      {activeTab === 'templates' && (
        <ReportSelector
          reportDefinitions={reportDefinitions}
          onSelectReport={onViewReport}
          onCreateCustomReport={onCreateReport}
          loading={isLoading}
        />
      )}
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

export default ReportDashboard;