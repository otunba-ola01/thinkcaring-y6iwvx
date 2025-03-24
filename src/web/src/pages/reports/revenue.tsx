import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Grid } from '@mui/material'; // @mui/material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ReportParameters from '../../components/reports/ReportParameters';
import ReportViewer from '../../components/reports/ReportViewer';
import useReports from '../../hooks/useReports';
import useToast from '../../hooks/useToast';
import { ReportType, ReportParameters, ReportFormat } from '../../types/reports.types';
import { getDefaultReportParameters } from '../../config/report.config';

/**
 * The main component for the Revenue Reports page
 * @returns {JSX.Element} The rendered Revenue Reports page
 */
const RevenueReportsPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Initialize state for selected report type (defaulting to REVENUE_BY_PROGRAM)
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(ReportType.REVENUE_BY_PROGRAM);

  // Initialize state for report parameters using default parameters
  const [reportParameters, setReportParameters] = useState<ReportParameters>(
    getDefaultReportParameters(selectedReportType)
  );

  // Initialize state for generated report data
  const [reportData, setReportData] = useState(null);

  // Initialize state for loading status
  const [loading, setLoading] = useState(false);

  // Initialize state for error messages
  const [error, setError] = useState(null);

  // Initialize the useReports hook to access report functionality
  const {
    generateReport,
    reportDefinitions,
    reportInstances,
    currentReportData,
    isGeneratingReport,
    generationResponse,
    generationError,
    isLoading,
    error: reportsError,
    exportReport
  } = useReports();

  // Create a handleReportTypeChange function to update selected report type
  const handleReportTypeChange = (event: React.SyntheticEvent, newValue: ReportType) => {
    setSelectedReportType(newValue);
  };

  // Create a handleParameterChange function to update report parameters
  const handleParameterChange = (newParameters: ReportParameters) => {
    setReportParameters(newParameters);
  };

  // Create a handleGenerateReport function to generate a report with current parameters
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        reportType: selectedReportType,
        name: `Revenue Report - ${selectedReportType}`,
        parameters: reportParameters,
        formats: [ReportFormat.PDF],
        saveDefinition: false,
      };

      const response = await generateReport(request);
      if (response) {
        setReportData(currentReportData);
      } else {
        setError('Failed to generate report.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  // Create a handleExportReport function to export the report in different formats
  const handleExportReport = async (format: ReportFormat) => {
    setLoading(true);
    setError(null);

    try {
      // Call the exportReport function with the report ID and format
      if (currentReportData?.metadata?.reportName && currentReportData?.metadata?.reportType) {
        await exportReport(currentReportData.metadata.reportName, format);
      } else {
        setError('Report data or metadata is missing.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to export report.');
    } finally {
      setLoading(false);
    }
  };

  // Create a handleScheduleReport function to schedule recurring report generation
  const handleScheduleReport = () => {
    // Implement scheduling logic here
    console.log('Scheduling report...');
  };

  // Create a handlePrintReport function to print the current report
  const handlePrintReport = () => {
    // Implement printing logic here
    console.log('Printing report...');
  };

  // Use useEffect to set initial report type from URL query parameters
  useEffect(() => {
    if (router.query.reportType) {
      setSelectedReportType(router.query.reportType as ReportType);
    }
  }, [router.query.reportType]);

  // Use useEffect to reset report data when report type changes
  useEffect(() => {
    setReportData(null);
  }, [selectedReportType]);

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Revenue Reports
        </Typography>
        <Typography variant="body1" paragraph>
          Generate and view revenue-specific financial reports.
        </Typography>

        <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden' }}>
          <Tabs
            value={selectedReportType}
            onChange={handleReportTypeChange}
            aria-label="revenue report types"
          >
            <Tab label="Revenue by Program" value={ReportType.REVENUE_BY_PROGRAM} />
            <Tab label="Revenue by Payer" value={ReportType.REVENUE_BY_PAYER} />
          </Tabs>
        </Paper>

        <ReportParameters
          reportType={selectedReportType}
          initialParameters={reportParameters}
          onChange={handleParameterChange}
          onSubmit={handleGenerateReport}
          title="Report Parameters"
          loading={loading}
        />

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {reportData && (
          <ReportViewer
            reportData={reportData}
            onExport={handleExportReport}
            onPrint={handlePrintReport}
            onSchedule={handleScheduleReport}
            onShare={() => {}}
            onBack={() => {}}
            loading={loading}
            error={error}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default RevenueReportsPage;