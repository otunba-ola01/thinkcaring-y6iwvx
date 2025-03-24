import React, { useCallback, useMemo } from 'react'; // react v18.2.0
import { Box, Typography, Grid, Button, Divider, Skeleton, useTheme } from '@mui/material'; // v5.13.0
import { Description, BarChart, PieChart, Timeline, TableChart } from '@mui/icons-material'; // v5.11.16

import { ReportType, ReportCategory, ReportDefinition } from '../../types/reports.types'; // Import report-specific type definitions
import { REPORT_TYPE_LABELS, REPORT_CATEGORY_LABELS } from '../../config/report.config'; // Import report configuration constants for labels
import Card from '../ui/Card'; // Import Card component for report template display
import Tabs from '../ui/Tabs'; // Import Tabs component for category navigation
import useReports from '../../hooks/useReports'; // Import custom hook for report operations

interface ReportSelectorProps {
  reportDefinitions: ReportDefinition[];
  onSelectReport: (report: ReportDefinition) => void;
  onCreateCustomReport: () => void;
  loading: boolean;
}

/**
 * A component that allows users to select and filter report types in the HCBS Revenue Management System.
 * It displays available report templates organized by category and provides a user-friendly interface for selecting reports to generate.
 */
const ReportSelector: React.FC<ReportSelectorProps> = ({
  reportDefinitions,
  onSelectReport,
  onCreateCustomReport,
  loading
}) => {
  // Extract props
  // reportDefinitions: Array of ReportDefinition objects to display
  // onSelectReport: Callback function to handle report selection
  // onCreateCustomReport: Callback function to handle custom report creation
  // loading: Boolean indicating whether the component is in a loading state

  const theme = useTheme();

  // Initialize reports state using useReports hook with autoFetch set to true
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
  } = useReports({ autoFetch: false });

  // Create state for activeCategory using useState, default to 'REVENUE'
  const [activeCategory, setActiveCategory] = React.useState<ReportCategory>(ReportCategory.REVENUE);

  // Create a handleCategoryChange function to update activeCategory state
  const handleCategoryChange = (newCategory: string) => {
    setActiveCategory(newCategory as ReportCategory);
  };

  // Group report definitions by category using useMemo
  const categorizedReports = useMemo(() => {
    const reportsByCategory: { [key in ReportCategory]?: ReportDefinition[] } = {};
    Object.values(ReportCategory).forEach(category => {
      reportsByCategory[category] = reportDefinitions.filter(report => report.category === category);
    });
    return reportsByCategory;
  }, [reportDefinitions]);

  // Create tabs array from report categories with labels from REPORT_CATEGORY_LABELS
  const tabs = useMemo(() => {
    return Object.values(ReportCategory).map(category => ({
      label: REPORT_CATEGORY_LABELS[category],
      value: category,
    }));
  }, []);

  // Function to return the appropriate icon component for a report type
  const getReportIcon = (reportType: ReportType): JSX.Element => {
    switch (reportType) {
      case ReportType.REVENUE_BY_PROGRAM:
      case ReportType.REVENUE_BY_PAYER:
        return <BarChart />;
      case ReportType.CLAIMS_STATUS:
        return <PieChart />;
      case ReportType.AGING_ACCOUNTS_RECEIVABLE:
        return <Timeline />;
      case ReportType.DENIAL_ANALYSIS:
      case ReportType.PAYER_PERFORMANCE:
      case ReportType.SERVICE_UTILIZATION:
        return <TableChart />;
      case ReportType.CUSTOM:
      default:
        return <Description />;
    }
  };

  return (
    <Box>
      <Tabs
        tabs={tabs}
        activeTab={activeCategory}
        onChange={handleCategoryChange}
      />
      <Grid container spacing={2} mt={2}>
        {loading ? (
          // Render Skeleton components for loading state
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
              <Card loading />
            </Grid>
          ))
        ) : (
          // Map through reportDefinitions filtered by activeCategory
          categorizedReports[activeCategory]?.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card
                title={report.name}
                subtitle={report.description}
                actions={
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onSelectReport(report)}
                  >
                    Select
                  </Button>
                }
              >
                {getReportIcon(report.type)}
              </Card>
            </Grid>
          ))
        )}
        {/* Add a Create Custom Report button at the end */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            title="Create Custom Report"
            subtitle="Design your own report with custom parameters"
            actions={
              <Button
                variant="outlined"
                color="primary"
                onClick={onCreateCustomReport}
              >
                Create
              </Button>
            }
          >
            <Description />
          </Card>
        </Grid>
        {/* Handle empty state with appropriate message when no reports are available */}
        {!loading && categorizedReports[activeCategory]?.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              No reports available in this category.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Function to return the appropriate icon component for a report type
const getReportIcon = (reportType: ReportType): JSX.Element => {
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
    case ReportType.REVENUE_BY_PAYER:
      return <BarChart />;
    case ReportType.CLAIMS_STATUS:
      return <PieChart />;
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return <Timeline />;
    case ReportType.DENIAL_ANALYSIS:
    case ReportType.PAYER_PERFORMANCE:
    case ReportType.SERVICE_UTILIZATION:
      return <TableChart />;
    case ReportType.CUSTOM:
    default:
      return <Description />;
  }
};

export default ReportSelector;