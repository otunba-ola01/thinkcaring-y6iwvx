import React, { useState, useEffect, useRef, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../components/layout/MainLayout';
import ReportViewer from '../../components/reports/ReportViewer';
import useReports from '../../hooks/useReports';
import useToast from '../../hooks/useToast';
import { ReportFormat } from '../../types/reports.types';

/**
 * The main page component for viewing generated reports
 */
const ReportViewerPage: React.FC = () => {
  // Get the router instance to access URL parameters
  const router = useRouter();

  // Extract reportId from the query parameters
  const { reportId } = router.query;

  // Initialize the useReports hook to access report functionality
  const {
    getReportData,
    getReportInstance,
    exportReport,
    currentReportData,
    currentReportInstance,
    isLoading,
    error
  } = useReports();

  // Initialize the useToast hook for notifications
  const toast = useToast();

  // Create a reference for the report container for printing
  const reportRef = useRef<HTMLDivElement>(null);

  // Use useEffect to fetch report instance and data when reportId changes
  useEffect(() => {
    if (reportId && typeof reportId === 'string') {
      getReportInstance(reportId);
      getReportData(reportId);
    }
  }, [reportId, getReportInstance, getReportData]);

  /**
   * Handles exporting the report in the specified format
   * @param {ReportFormat} format - The format to export the report in
   * @returns {Promise<void>} A promise that resolves when the export is complete
   */
  const handleExport = useCallback(async (format: ReportFormat) => {
    if (!currentReportInstance?.id) {
      toast.error('Report instance ID is missing.');
      return;
    }

    try {
      toast.info('Exporting report...', { autoHideDuration: 3000 });
      const blob = await exportReport(currentReportInstance.id, format);

      if (blob) {
        // Create a download link for the exported file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentReportInstance.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Report exported successfully!', { autoHideDuration: 3000 });
      } else {
        toast.error('Failed to export report.');
      }
    } catch (e: any) {
      toast.error(`Failed to export report: ${e.message}`);
    }
  }, [exportReport, currentReportInstance, toast]);

  /**
   * Handles printing the current report
   * @returns {void} No return value
   */
  const handlePrint = useCallback(() => {
    try {
      window.print();
      toast.success('Printing report...', { autoHideDuration: 3000 });
    } catch (e: any) {
      toast.error(`Failed to print report: ${e.message}`);
    }
  }, [toast]);

  /**
   * Handles scheduling the current report for regular generation
   * @returns {void} No return value
   */
  const handleSchedule = useCallback(() => {
    if (currentReportInstance?.reportDefinitionId) {
      router.push({
        pathname: '/reports/scheduler',
        query: { reportDefinitionId: currentReportInstance.reportDefinitionId }
      });
    } else {
      toast.error('Report definition ID is missing.');
    }
  }, [router, currentReportInstance, toast]);

  /**
   * Handles sharing the current report with other users
   * @returns {void} No return value
   */
  const handleShare = useCallback(() => {
    try {
      const shareableLink = window.location.href;
      navigator.clipboard.writeText(shareableLink);
      toast.success('Report link copied to clipboard!', { autoHideDuration: 3000 });
    } catch (e: any) {
      toast.error(`Failed to copy report link: ${e.message}`);
    }
  }, [toast]);

  /**
   * Handles navigation back to the reports list page
   * @returns {void} No return value
   */
  const handleBack = useCallback(() => {
    router.push('/reports');
  }, [router]);

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Set page title using Next.js Head component */}
      <Head>
        <title>Report Viewer - ThinkCaring</title>
      </Head>

      {/* Render ReportViewer component with report data and handler functions */}
      <ReportViewer
        reportData={currentReportData}
        onExport={handleExport}
        onPrint={handlePrint}
        onSchedule={handleSchedule}
        onShare={handleShare}
        onBack={handleBack}
        loading={isLoading}
        error={error}
      />
    </MainLayout>
  );
};

/**
 * Next.js server-side function to handle initial data fetching
 * @param {object} context - The Next.js context object
 * @returns {object} Props object containing initial data or redirect
 */
export async function getServerSideProps(context: any) {
  // Extract reportId from query parameters
  const { reportId } = context.query;

  // If reportId is missing, redirect to reports list page
  if (!reportId) {
    return {
      redirect: {
        destination: '/reports',
        permanent: false
      }
    };
  }

  // Return props object with reportId
  return {
    props: {
      reportId: reportId || null
    }
  };
}

export default ReportViewerPage;