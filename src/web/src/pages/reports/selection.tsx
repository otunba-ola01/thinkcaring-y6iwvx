import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0
import { Container, Typography, Box, Grid, Paper, Stepper, Step, StepLabel, Button, CircularProgress } from '@mui/material'; // @mui/material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ReportSelector from '../../components/reports/ReportSelector';
import ReportParameters from '../../components/reports/ReportParameters';
import useReports from '../../hooks/useReports';
import useToast from '../../hooks/useToast';
import { ReportDefinition, ReportParameters as ReportParametersType, ReportType, ReportFormat } from '../../types/reports.types';
import { ROUTES } from '../../constants/routes.constants';
import { NextPageWithLayout } from '../../types/common.types';

/**
 * Interface defining the props for the ReportSelectionPage component
 */
interface ReportSelectionPageProps {
  // No props needed for this page
}

/**
 * Type definition for the ReportSelectionPage component with custom layout
 */
type ReportSelectionPage = NextPageWithLayout<ReportSelectionPageProps>;

/**
 * Array of steps for the report selection process
 */
const steps = [
  { label: 'Select Report', description: 'Choose a report template from the available options' },
  { label: 'Configure Parameters', description: 'Set parameters and filters for the selected report' }
];

/**
 * Default report formats
 */
const defaultFormats = ['PDF', 'EXCEL'];

/**
 * The main component for the report selection page
 */
const ReportSelectionPage: ReportSelectionPage = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize state for selected report definition
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);

  // Initialize state for report parameters
  const [reportParameters, setReportParameters] = useState<ReportParametersType | null>(null);

  // Initialize state for active step in the selection process
  const [activeStep, setActiveStep] = useState<number>(0);

  // Initialize state for loading status
  const [loading, setLoading] = useState<boolean>(false);

  // Get reports data and functions from useReports hook
  const {
    reportDefinitions,
    generateReportFromDefinition,
    isLoading,
  } = useReports();

  // Get toast notification function from useToast hook
  const toast = useToast();

  /**
   * Define handleSelectReport function to set the selected report and move to parameters step
   * @param report 
   */
  const handleSelectReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setActiveStep(1);
  };

  /**
   * Define handleCreateCustomReport function to navigate to custom report builder page
   */
  const handleCreateCustomReport = () => {
    router.push(ROUTES.REPORTS.CUSTOM_BUILDER);
  };

  /**
   * Define handleParameterChange function to update report parameters state
   * @param newParameters 
   */
  const handleParameterChange = (newParameters: ReportParametersType) => {
    setReportParameters(newParameters);
  };

  /**
   * Define handleGenerateReport function to generate the report with selected parameters
   */
  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report template');
      return;
    }

    setLoading(true);
    try {
      await generateReportFromDefinition(selectedReport.id, reportParameters, defaultFormats as ReportFormat[]);
      toast.success('Report generated successfully');
      router.push(ROUTES.REPORTS.DASHBOARD);
    } catch (error: any) {
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Define handleBack function to go back to the previous step
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  /**
   * Define handleCancel function to reset the selection process
   */
  const handleCancel = () => {
    setActiveStep(0);
    setSelectedReport(null);
    setReportParameters(null);
  };

  /**
   * Use useEffect to fetch report definitions when component mounts
   */
  useEffect(() => {
    // Fetch report definitions when the component mounts
  }, []);

  // Render the page
  return (
    <>
      {/* Render the page with Head component for title */}
      <Head>
        <title>Report Selection - ThinkCaring</title>
      </Head>

      {/* Render a Container with the page content */}
      <Container maxWidth="xl">
        {/* Render page title and description */}
        <Typography variant="h4" component="h1" gutterBottom>
          Report Selection
        </Typography>
        <Typography variant="body1" paragraph>
          Browse available report templates or create a custom report.
        </Typography>

        {/* Render Stepper component showing the selection process steps */}
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Render the appropriate step content based on activeStep */}
        <Box mt={3}>
          {activeStep === 0 && (
            /* For step 0 (Select Report), render ReportSelector component */
            <ReportSelector
              reportDefinitions={reportDefinitions}
              onSelectReport={handleSelectReport}
              onCreateCustomReport={handleCreateCustomReport}
              loading={isLoading}
            />
          )}
          {activeStep === 1 && selectedReport && (
            /* For step 1 (Configure Parameters), render ReportParameters component */
            <ReportParameters
              reportType={selectedReport.type}
              initialParameters={selectedReport.parameters}
              onChange={handleParameterChange}
              onSubmit={handleGenerateReport}
              title={selectedReport.name}
              loading={loading}
            />
          )}
          {/* Render navigation buttons (Back, Cancel, Generate) based on current step */}
          <Box mt={3} display="flex" justifyContent="space-between">
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <div>
              <Button onClick={handleCancel} sx={{ mr: 1 }}>
                Cancel
              </Button>
              {activeStep === 1 && (
                <Button variant="contained" color="primary" onClick={handleGenerateReport} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
                </Button>
              )}
            </div>
          </Box>
        </Box>
      </Container>
    </>
  );
};

/**
 * Define the getLayout function for the ReportSelectionPage component
 * @param page 
 * @returns 
 */
ReportSelectionPage.getLayout = (page) => (
  <MainLayout>
    {page}
  </MainLayout>
);

export default ReportSelectionPage;