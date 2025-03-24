import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { RootState } from '../index'; // Import RootState type for type-safe state access
import { ReportType, ReportCategory, ReportStatus } from '../../types/reports.types'; // Import report-related enums for filtering and categorization
import { UUID } from '../../types/common.types'; // Import UUID type for type-safe ID handling

/**
 * Base selector that returns the reports slice from the Redux state
 * @param state 
 * @returns The reports state slice
 */
const selectReportsState = (state: RootState) => state.reports;

/**
 * Selector for retrieving all report definitions
 * @returns Array of report definitions
 */
export const selectReportDefinitions = createSelector(
  [selectReportsState],
  (reports) => reports.reportDefinitions
);

/**
 * Selector for retrieving report definitions filtered by type
 * @param reportType 
 * @returns Filtered array of report definitions
 */
export const selectReportDefinitionsByType = createSelector(
  [selectReportDefinitions, (state: RootState, reportType: ReportType) => reportType],
  (reportDefinitions, reportType) =>
    reportDefinitions.filter(report => report.type === reportType)
);

/**
 * Selector for retrieving report definitions filtered by category
 * @param category 
 * @returns Filtered array of report definitions
 */
export const selectReportDefinitionsByCategory = createSelector(
  [selectReportDefinitions, (state: RootState, category: ReportCategory) => category],
  (reportDefinitions, category) =>
    reportDefinitions.filter(report => report.category === category)
);

/**
 * Selector for retrieving a specific report definition by ID
 * @param id 
 * @returns The report definition if found, undefined otherwise
 */
export const selectReportDefinitionById = createSelector(
  [selectReportDefinitions, (state: RootState, id: UUID) => id],
  (reportDefinitions, id) =>
    reportDefinitions.find(report => report.id === id)
);

/**
 * Selector for retrieving the currently selected report definition
 * @returns The current report definition or null if none selected
 */
export const selectCurrentReportDefinition = createSelector(
  [selectReportsState],
  (reports) => reports.currentReportDefinition
);

/**
 * Selector for retrieving the paginated list of report instances
 * @returns Paginated response containing report instances
 */
export const selectReportInstances = createSelector(
  [selectReportsState],
  (reports) => reports.reportInstances
);

/**
 * Selector for retrieving just the data array from report instances
 * @returns Array of report instances
 */
export const selectReportInstancesData = createSelector(
  [selectReportInstances],
  (reportInstances) => reportInstances.items
);

/**
 * Selector for retrieving report instances filtered by status
 * @param status 
 * @returns Filtered array of report instances
 */
export const selectReportInstancesByStatus = createSelector(
  [selectReportInstancesData, (state: RootState, status: ReportStatus) => status],
  (reportInstances, status) =>
    reportInstances.filter(report => report.status === status)
);

/**
 * Selector for retrieving a specific report instance by ID
 * @param id 
 * @returns The report instance if found, undefined otherwise
 */
export const selectReportInstanceById = createSelector(
  [selectReportInstancesData, (state: RootState, id: UUID) => id],
  (reportInstances, id) =>
    reportInstances.find(report => report.id === id)
);

/**
 * Selector for retrieving the currently selected report instance
 * @returns The current report instance or null if none selected
 */
export const selectCurrentReportInstance = createSelector(
  [selectReportsState],
  (reports) => reports.currentReportInstance
);

/**
 * Selector for retrieving the data for the current report
 * @returns The current report data or null if none available
 */
export const selectCurrentReportData = createSelector(
  [selectReportsState],
  (reports) => reports.currentReportData
);

/**
 * Selector for retrieving all scheduled reports
 * @returns Array of scheduled reports
 */
export const selectScheduledReports = createSelector(
  [selectReportsState],
  (reports) => reports.scheduledReports
);

/**
 * Selector for retrieving only active scheduled reports
 * @returns Array of active scheduled reports
 */
export const selectActiveScheduledReports = createSelector(
  [selectScheduledReports],
  (scheduledReports) => scheduledReports.filter(report => report.isActive)
);

/**
 * Selector for retrieving a specific scheduled report by ID
 * @param id 
 * @returns The scheduled report if found, undefined otherwise
 */
export const selectScheduledReportById = createSelector(
  [selectScheduledReports, (state: RootState, id: UUID) => id],
  (scheduledReports, id) =>
    scheduledReports.find(report => report.id === id)
);

/**
 * Selector for retrieving the currently selected scheduled report
 * @returns The current scheduled report or null if none selected
 */
export const selectCurrentScheduledReport = createSelector(
  [selectReportsState],
  (reports) => reports.currentScheduledReport
);

/**
 * Selector for retrieving all financial metrics
 * @returns Array of financial metrics
 */
export const selectFinancialMetrics = createSelector(
  [selectReportsState],
  (reports) => reports.financialMetrics
);

/**
 * Selector for retrieving financial metrics filtered by category
 * @param category 
 * @returns Filtered array of financial metrics
 */
export const selectFinancialMetricsByCategory = createSelector(
  [selectFinancialMetrics, (state: RootState, category: string) => category],
  (financialMetrics, category) =>
    financialMetrics.filter(metric => metric.category === category)
);

/**
 * Selector for retrieving the report generation status
 * @returns True if a report is currently being generated, false otherwise
 */
export const selectIsGeneratingReport = createSelector(
  [selectReportsState],
  (reports) => reports.isGeneratingReport
);

/**
 * Selector for retrieving the report generation response
 * @returns The generation response or null if none available
 */
export const selectGenerationResponse = createSelector(
  [selectReportsState],
  (reports) => reports.generationResponse
);

/**
 * Selector for retrieving any report generation error
 * @returns The error message or null if no error
 */
export const selectGenerationError = createSelector(
  [selectReportsState],
  (reports) => reports.generationError
);

/**
 * Selector for retrieving the reports loading state
 * @returns True if reports data is loading, false otherwise
 */
export const selectIsReportsLoading = createSelector(
  [selectReportsState],
  (reports) => reports.isLoading
);

/**
 * Selector for retrieving any reports-related error
 * @returns The error message or null if no error
 */
export const selectReportsError = createSelector(
  [selectReportsState],
  (reports) => reports.error
);

/**
 * Selector for retrieving report definitions formatted as select options
 * @returns Array of report definitions formatted as { value, label } options
 */
export const selectReportDefinitionOptions = createSelector(
  [selectReportDefinitions],
  (reportDefinitions) =>
    reportDefinitions.map(report => ({
      value: report.id,
      label: report.name
    }))
);

/**
 * Selector for retrieving report types formatted as select options
 * @returns Array of report types formatted as { value, label } options
 */
export const selectReportTypeOptions = createSelector(
  [],
  () => {
    return Object.values(ReportType).map(reportType => ({
      value: reportType,
      label: reportType.replace(/_/g, ' ') // Format label
    }));
  }
);

/**
 * Selector for retrieving report categories formatted as select options
 * @returns Array of report categories formatted as { value, label } options
 */
export const selectReportCategoryOptions = createSelector(
  [],
  () => {
    return Object.values(ReportCategory).map(category => ({
      value: category,
      label: category.replace(/_/g, ' ') // Format label
    }));
  }
);