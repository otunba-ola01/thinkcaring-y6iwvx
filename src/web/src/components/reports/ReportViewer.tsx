import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // v18.2.0
import { Box, Typography, Divider, Grid, Stack, Button, Tooltip, CircularProgress, Paper } from '@mui/material'; // v5.13.0
import { Print, Schedule, Share, ArrowBack } from '@mui/icons-material'; // v5.13.0
import html2canvas from 'html2canvas'; // v1.4.1
import jsPDF from 'jspdf'; // v2.5.1

import { ReportData, ReportVisualization, ReportSummaryMetric, ReportFormat, ChartType } from '../../types/reports.types';
import Card from '../ui/Card';
import DataTable from '../ui/DataTable';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import PieChart from '../charts/PieChart';
import AreaChart from '../charts/AreaChart';
import ReportExport from './ReportExport';
import { formatCurrency } from '../../utils/currency';
import { formatPercentage } from '../../utils/format';
import { formatDate } from '../../utils/date';
import useResponsive from '../../hooks/useResponsive';

interface ReportViewerProps {
  reportData: ReportData | null;
  onExport: (format: ReportFormat) => void;
  onPrint: () => void;
  onSchedule: () => void;
  onShare: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

/**
 * A component that displays generated reports with visualizations, data tables, and export options
 * @param props - The component props
 * @returns The rendered ReportViewer component
 */
const ReportViewer: React.FC<ReportViewerProps> = ({
  reportData,
  onExport,
  onPrint,
  onSchedule,
  onShare,
  onBack,
  loading,
  error
}) => {
  // Use useResponsive hook to determine current device size for responsive layout
  const { isMobile } = useResponsive();

  // Create a ref for the report container to use with printing functionality
  const reportRef = useRef<HTMLDivElement>(null);

  /**
   * Formats a metric value based on its format type
   * @param metric - The metric to format
   * @returns The formatted metric value
   */
  const formatMetricValue = (metric: ReportSummaryMetric): string => {
    switch (metric.format) {
      case 'currency':
        return formatCurrency(metric.value);
      case 'percentage':
        return formatPercentage(metric.value);
      case 'number':
        return metric.value.toLocaleString();
      case 'date':
        return formatDate(metric.value);
      case 'text':
        return metric.value as string;
      default:
        return metric.value as string;
    }
  };

  /**
   * Renders the appropriate chart component based on visualization type
   * @param visualization - The visualization configuration
   * @param data - The data for the visualization
   * @returns The rendered chart component
   */
  const renderVisualization = (visualization: ReportVisualization, data: any) => {
    const visualizationData = reportData?.data[visualization.dataKey];

    switch (visualization.type) {
      case ChartType.BAR:
        return <BarChart data={visualizationData} {...visualization} />;
      case ChartType.LINE:
        return <LineChart data={visualizationData} {...visualization} />;
      case ChartType.PIE:
        return <PieChart data={visualizationData} {...visualization} />;
      case ChartType.AREA:
        return <AreaChart data={visualizationData} {...visualization} />;
      case ChartType.TABLE:
        return <DataTable columns={[]} data={visualizationData} />;
      default:
        return null;
    }
  };

  /**
   * Prepares column definitions for the DataTable component
   * @param data - The data array for the table
   * @returns Array of column definitions for DataTable
   */
  const prepareTableColumns = (data: any[]): any[] => {
    if (!data || data.length === 0) {
      return [];
    }

    const columnNames = Object.keys(data[0]);

    return columnNames.map(columnName => ({
      field: columnName,
      headerName: columnName,
      type: typeof data[0][columnName] === 'number' ? 'number' : 'string'
    }));
  };

  /**
   * Handles report export in different formats
   * @param format - The format to export the report in
   */
  const handleExport = useCallback((format: ReportFormat) => {
    onExport(format);
  }, [onExport]);

  /**
   * Handles printing the report
   */
  const handlePrint = useCallback(() => {
    onPrint();
  }, [onPrint]);

  /**
   * Handles scheduling the report for regular generation
   */
  const handleSchedule = useCallback(() => {
    onSchedule();
  }, [onSchedule]);

  /**
   * Handles sharing the report with other users
   */
  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  /**
   * Handles navigating back to the reports list
   */
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  // If loading is true, render a loading indicator
  if (loading) {
    return (
      <Card title="Loading Report">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  // If error exists, render an error message
  if (error) {
    return (
      <Card title="Error">
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  // If no reportData, render a message to select a report
  if (!reportData) {
    return (
      <Card title="No Report Selected">
        <Typography>Please select a report to view.</Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Report Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5">{reportData.metadata.reportName}</Typography>
        </Stack>

        {/* Action Buttons */}
        <ReportExport
          reportData={reportData}
          reportRef={reportRef}
          onSchedule={handleSchedule}
          showSchedule
          fileName={reportData.metadata.reportName}
        />
      </Box>

      <Divider />

      <Box ref={reportRef} mt={2}>
        {/* Summary Metrics */}
        <Grid container spacing={2} mb={2}>
          {reportData.summaryMetrics.map((metric) => (
            <Grid item xs={12} sm={6} md={4} key={metric.label}>
              <Card title={metric.label} subtitle={formatMetricValue(metric)}>
                {/* Add metric content here */}
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Visualizations */}
        <Grid container spacing={3}>
          {reportData.visualizations.map((visualization) => (
            <Grid item xs={12} md={6} key={visualization.id}>
              {renderVisualization(visualization, reportData.data)}
            </Grid>
          ))}
        </Grid>

        {/* Data Tables */}
        {Object.keys(reportData.data).map((key) => (
          <Box key={key} mt={3}>
            <Typography variant="h6">{key}</Typography>
            <DataTable columns={prepareTableColumns(reportData.data[key])} data={reportData.data[key]} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ReportViewer;