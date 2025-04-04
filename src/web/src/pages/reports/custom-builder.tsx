import React, { useState, useCallback, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Paper, Container, Breadcrumbs, Link, Button } from '@mui/material'; // @mui/material v5.13.0
import { ArrowBack } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import CustomReportBuilder from '../../components/reports/CustomReportBuilder';
import useReports from '../../hooks/useReports';
import useToast from '../../hooks/useToast';
import { ReportType, ReportDefinition } from '../../types/reports.types';

/**
 * Main page component for building custom reports
 * @returns {JSX.Element} The rendered custom report builder page
 */
const CustomReportBuilderPage: React.FC = () => {
  // Initialize the Next.js router using useRouter hook
  const router = useRouter();

  // Initialize the useReports hook to access report operations
  const { createReportDefinition, generateReport } = useReports();

  // Initialize the useToast hook for displaying notifications
  const toast = useToast();

  // Create state for tracking loading status during report creation
  const [loading, setLoading] = useState(false);

  /**
   * Function to handle saving a custom report definition
   * @param {Partial<ReportDefinition>} reportDefinition
   * @returns {Promise<void>} Promise that resolves when the report is saved
   */
  const handleSaveReport = useCallback(async (reportDefinition: Partial<ReportDefinition>): Promise<void> => {
    // Set loading state to true
    setLoading(true);

    try {
      // Create a complete report definition with CUSTOM type
      const completeReportDefinition: ReportDefinition = {
        id: 'new', // Placeholder ID, will be generated by the API
        name: reportDefinition.name || 'Custom Report',
        description: reportDefinition.description || '',
        type: ReportType.CUSTOM,
        category: reportDefinition.category || 'financial', // Default category
        parameters: reportDefinition.parameters || {},
        visualizations: reportDefinition.visualizations || [],
        isTemplate: false,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'currentUser' // Placeholder, will be filled by the API
      };

      // Call createReportDefinition from useReports hook
      const newReportDefinition = await createReportDefinition(completeReportDefinition);

      if (newReportDefinition) {
        // Show success toast notification
        toast.success('Report definition saved successfully');

        // Generate a preview report using the new definition
        if (newReportDefinition.id) {
          const generatedReport = await generateReportFromDefinition(newReportDefinition.id, newReportDefinition.parameters);

          if (generatedReport && generatedReport.reportInstanceId) {
            // Navigate to the report viewer page with the generated report ID
            router.push(`/reports/viewer?id=${generatedReport.reportInstanceId}`);
          } else {
            toast.error('Failed to generate report preview');
          }
        }
      } else {
        toast.error('Failed to save report definition');
      }
    } catch (error: any) {
      // If error occurs, show error toast notification
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      // Set loading state to false regardless of outcome
      setLoading(false);
    }
  }, [createReportDefinition, generateReportFromDefinition, router, toast]);

  /**
   * Function to handle cancellation of report creation
   * @returns {void} No return value
   */
  const handleCancel = useCallback(() => {
    // Navigate back to the reports page
    router.push('/reports');
  }, [router]);

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Render page header with title and back button */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={handleCancel}>
          Back to Reports
        </Button>
        <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
          Custom Report Builder
        </Typography>
      </Box>

      {/* Render CustomReportBuilder component with save and cancel handlers */}
      <CustomReportBuilder onSave={handleSaveReport} onCancel={handleCancel} />
    </MainLayout>
  );
};

export default CustomReportBuilderPage;