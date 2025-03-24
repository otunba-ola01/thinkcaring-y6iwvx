import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Grid } from '@mui/material'; // @mui/material v5.13.0
import { ReceiptLong, TrendingDown } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ReportParameters from '../../components/reports/ReportParameters';
import ReportViewer from '../../components/reports/ReportViewer';
import useReports from '../../hooks/useReports';
import useToast from '../../hooks/useToast';
import { ReportType, ReportParameters, ReportFormat } from '../../types/reports.types';
import { getDefaultReportParameters } from '../../config/report.config';
import { REPORT_TYPE_LABELS } from '../../constants/reports.constants';

/**
 * The main component for the Financial Reports page
 * @returns {JSX.Element} The rendered Financial Reports page
 */
const FinancialReportsPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Initialize state for selected report type (defaulting to AGING_ACCOUNTS_RECEIVABLE)
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(ReportType.AGING_ACCOUNTS_RECEIVABLE);

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
    isGeneratingReport,
    generateReport,
    currentReportData,
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
      // Call generateReport function with current report type and parameters
      const report = await generateReport({
        reportType: selectedReportType,
        name: REPORT_TYPE_LABELS[selectedReportType],
        parameters: reportParameters,
        formats: [ReportFormat.PDF],
        saveDefinition: false
      });
      setReportData(currentReportData);
    } catch (e: any) {
      // Display an error toast if generating the report fails
      toast.error(`Failed to generate report: ${e.message}`);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a handleExportReport function to export the report in different formats
  const handleExportReport = async (format: ReportFormat) => {
    try {
      // Call exportReport function with current report data and format
      await exportReport(currentReportData.metadata.id, format);
    } catch (e: any) {
      // Display an error toast if exporting the report fails
      toast.error(`Failed to export report: ${e.message}`);
    }
  };

  // Create a handleScheduleReport function to schedule recurring report generation
  const handleScheduleReport = () => {
    // Implement schedule report functionality here
    console.log('Schedule report');
  };

  // Create a handlePrintReport function to print the current report
  const handlePrintReport = () => {
    // Implement print report functionality here
    console.log('Print report');
  };

  // Use useEffect to set initial report type from URL query parameters
  useEffect(() => {
    const reportTypeFromUrl = router.query.reportType as ReportType;
    if (reportTypeFromUrl && Object.values(ReportType).includes(reportTypeFromUrl)) {
      setSelectedReportType(reportTypeFromUrl);
    }
  }, [router.query.reportType]);

  // Use useEffect to reset report data when report type changes
  useEffect(() => {
    setReportData(null);
  }, [selectedReportType]);

  // Return the complete page component
  return (
    <MainLayout>
      <Box>
        {/* Page header with title and description */}
        <Typography variant="h4" gutterBottom>
          Financial Reports
        </Typography>
        <Typography variant="body1">
          Generate and view financial reports such as Aging Accounts Receivable and Denial Analysis.
        </Typography>
      </Box>

      {/* Tabs for switching between financial report types */}
      <Paper elevation={0} sx={{ mt: 2, bgcolor: 'background.paper' }}>
        <Tabs
          value={selectedReportType}
          onChange={handleReportTypeChange}
          aria-label="financial report types"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Aging Accounts Receivable" value={ReportType.AGING_ACCOUNTS_RECEIVABLE} icon={<ReceiptLong />} iconPosition="start" />
          <Tab label="Denial Analysis" value={ReportType.DENIAL_ANALYSIS} icon={<TrendingDown />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ReportParameters component with current parameters */}
      <ReportParameters
        reportType={selectedReportType}
        initialParameters={reportParameters}
        onChange={handleParameterChange}
        onSubmit={handleGenerateReport}
        title="Report Parameters"
        loading={isGeneratingReport}
      />

      {/* Render loading indicator when report is being generated */}
      {isGeneratingReport && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      )}

      {/* Render error alert if report generation fails */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Render ReportViewer component when report data is available */}
      {currentReportData && (
        <ReportViewer
          reportData={currentReportData}
          onExport={handleExportReport}
          onPrint={handlePrintReport}
          onSchedule={handleScheduleReport}
          onShare={() => {}}
          onBack={() => {}}
          loading={loading}
          error={error}
        />
      )}
    </MainLayout>
  );
};

export default FinancialReportsPage;