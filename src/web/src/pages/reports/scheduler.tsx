import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0
import { Box, Typography, Stepper, Step, StepLabel, Button, Paper, Divider, Alert, CircularProgress } from '@mui/material'; // @mui/material v5.13.0
import { Schedule, ArrowBack } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout'; // Import the main layout component for consistent page structure
import ReportSelector from '../../components/reports/ReportSelector'; // Import the report selector component for choosing a report to schedule
import ScheduleForm from '../../components/reports/ScheduleForm'; // Import the schedule form component for configuring report schedule
import useReports from '../../hooks/useReports'; // Import custom hook for report operations
import useToast from '../../hooks/useToast'; // Import custom hook for displaying toast notifications
import { ReportDefinition, ScheduleReportRequest } from '../../types/reports.types'; // Import report-related type definitions

/**
 * The main page component for scheduling reports
 * @returns {JSX.Element} The rendered ReportSchedulerPage component
 */
const ReportSchedulerPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Initialize reports state using useReports hook with autoFetch set to true
  const {
    reportDefinitions,
    currentReportDefinition,
    isLoading,
    error,
    createScheduledReport,
  } = useReports({ autoFetch: true });

  // Set up state for the current step in the scheduling process (0 = select report, 1 = configure schedule)
  const [activeStep, setActiveStep] = useState<number>(0);

  // Set up state for the selected report definition
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);

  // Set up state for loading indicators
  const [loading, setLoading] = useState<boolean>(false);

  // Set up state for error messages
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Function to handle report selection
   * Sets the selected report and advances to the next step
   * @param {ReportDefinition} report - The selected report definition
   */
  const handleReportSelect = (report: ReportDefinition) => {
    setSelectedReport(report);
    setActiveStep(1);
  };

  /**
   * Function to handle returning to the report selection step
   */
  const handleBackToSelection = () => {
    setActiveStep(0);
    setSelectedReport(null);
  };

  /**
   * Function to handle submitting the schedule request
   * @param {ScheduleReportRequest} scheduleRequest - The schedule request data
   */
  const handleScheduleSubmit = async (scheduleRequest: ScheduleReportRequest) => {
    setLoading(true);
    setSubmitError(null);

    try {
      // Call the createScheduledReport function with the schedule request data
      await createScheduledReport(scheduleRequest);

      // Display a success toast notification
      toast.success('Report scheduled successfully');

      // Navigate back to the reports list page
      router.push('/reports');
    } catch (e: any) {
      // Display an error toast notification
      toast.error(`Failed to schedule report: ${e.message}`);
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Function to handle canceling the scheduling process
   * Navigates back to the reports list page
   */
  const handleCancel = () => {
    router.push('/reports');
  };

  /**
   * Function to handle creating a custom report
   * Navigates to the custom report builder page
   */
  const handleCreateCustomReport = () => {
    router.push('/reports/custom-builder');
  };

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Add page title and metadata using Head component */}
      <Head>
        <title>Schedule Report - ThinkCaring</title>
      </Head>

      {/* Render page header with title and back button */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mr: 2 }}>
          Back to Reports
        </Button>
        <Typography variant="h4" component="h1">
          Schedule Report
        </Typography>
      </Box>

      {/* Render Stepper component showing the current step in the process */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        <Step key={0}>
          <StepLabel>Select Report</StepLabel>
        </Step>
        <Step key={1}>
          <StepLabel>Configure Schedule</StepLabel>
        </Step>
      </Stepper>

      {/* Conditionally render either ReportSelector or ScheduleForm based on current step */}
      {activeStep === 0 ? (
        // If step is 0, render ReportSelector with reportDefinitions and selection handlers
        <ReportSelector
          reportDefinitions={reportDefinitions}
          onSelectReport={handleReportSelect}
          onCreateCustomReport={handleCreateCustomReport}
          loading={isLoading}
        />
      ) : (
        // If step is 1, render ScheduleForm with selected report definition and submission handlers
        selectedReport && (
          <ScheduleForm
            reportDefinition={selectedReport}
            onSubmit={handleScheduleSubmit}
            onCancel={handleBackToSelection}
            loading={loading}
            error={submitError}
          />
        )
      )}

      {/* Show loading indicator when appropriate */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Show error alerts when errors occur */}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
    </MainLayout>
  );
};

export default ReportSchedulerPage;