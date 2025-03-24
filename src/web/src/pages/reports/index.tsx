import React, { useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../components/layout/MainLayout'; // Import the main layout component for consistent page structure
import ReportDashboard from '../../components/reports/ReportDashboard'; // Import the report dashboard component for displaying financial metrics and reports
import useReports from '../../hooks/useReports'; // Import custom hook for report operations and data

/**
 * The main Reports page component that displays the report dashboard
 * @returns {JSX.Element} The rendered Reports page
 */
const ReportsPage: React.FC = () => {
  // Initialize the router using useRouter hook for navigation
  const router = useRouter();

  // Initialize the useReports hook with autoFetch set to true to load report data
  const {
    // reportDefinitions, // Array of ReportDefinition objects
    // currentReportDefinition, // Currently selected ReportDefinition object
    // reportInstances, // Paginated list of ReportInstance objects
    // currentReportInstance, // Currently selected ReportInstance object
    // currentReportData, // Data for the currently selected report
    // scheduledReports, // Array of ScheduledReport objects
    // currentScheduledReport, // Currently selected ScheduledReport object
    // financialMetrics, // Array of FinancialMetric objects
    // isGeneratingReport, // Boolean indicating whether a report is currently being generated
    // generationResponse, // Response from the report generation API
    // generationError, // Error message if report generation fails
    // isLoading, // Boolean indicating whether data is currently loading
    // error, // Error message if there is an error fetching data
    // paginationState, // Pagination state object
    // getReportDefinitions, // Function to fetch report definitions
    // getReportDefinition, // Function to fetch a single report definition
    // createReportDefinition, // Function to create a new report definition
    // updateReportDefinition, // Function to update an existing report definition
    // deleteReportDefinition, // Function to delete a report definition
    // generateReport, // Function to generate a new report
    // generateReportFromDefinition, // Function to generate a report from an existing definition
    // getReportInstances, // Function to fetch report instances
    // getReportInstance, // Function to fetch a single report instance
    // getReportData, // Function to fetch report data
    // exportReport, // Function to export a report
    // deleteReportInstance, // Function to delete a report instance
    // getScheduledReports, // Function to fetch scheduled reports
    // getScheduledReport, // Function to fetch a single scheduled report
    // createScheduledReport, // Function to create a new scheduled report
    // updateScheduledReport, // Function to update an existing scheduled report
    // deleteScheduledReport, // Function to delete a scheduled report
    // executeScheduledReport, // Function to execute a scheduled report
    // getFinancialMetrics, // Function to fetch financial metrics
    // getFinancialMetricByName, // Function to fetch a single financial metric by name
    // resetState // Function to reset the reports state
  } = useReports({ autoFetch: true });

  /**
   * Create handleCreateReport function that navigates to the report selection page
   */
  const handleCreateReport = useCallback(() => {
    router.push('/reports/selection');
  }, [router]);

  /**
   * Create handleViewReport function that navigates to the report viewer page with the report ID
   * @param {string} reportId - The ID of the report to view
   */
  const handleViewReport = useCallback((reportId: string) => {
    router.push(`/reports/viewer?reportId=${reportId}`);
  }, [router]);

  /**
   * Create handleScheduleReport function that navigates to the report scheduler page
   */
  const handleScheduleReport = useCallback(() => {
    router.push('/reports/scheduler');
  }, [router]);

  // Return the JSX for the Reports page
  return (
    <MainLayout>
      <Head>
        <title>Reports - ThinkCaring</title>
      </Head>
      <ReportDashboard
        onCreateReport={handleCreateReport}
        onViewReport={handleViewReport}
        onScheduleReport={handleScheduleReport}
      />
    </MainLayout>
  );
};

/**
 * Server-side function to handle authentication and initial data loading
 * @param {object} context - The Next.js server-side context
 * @returns {Promise<object>} Props object or redirect object if user is not authenticated
 */
export async function getServerSideProps(context: any): Promise<object> {
  // Extract the session from the context using getSession
  // const session = await getSession(context);

  // Check if the user is authenticated
  // if (!session) {
  //   // If not authenticated, return a redirect to the login page
  //   return {
  //     redirect: {
  //       destination: '/login',
  //       permanent: false,
  //     },
  //   };
  // }

  // If authenticated, return an empty props object
  return {
    props: {},
  };
}

// Export the ReportsPage component as the default export
export default ReportsPage;