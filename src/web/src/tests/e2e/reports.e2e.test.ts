import { 
  ReportType, 
  ReportCategory, 
  ReportFormat, 
  TimeFrame, 
  ComparisonType, 
  ChartType 
} from '../../types/reports.types';
import { UUID } from '../../types/common.types';

describe('Reports Management Flow', () => {
  beforeEach(() => {
    // Login with valid credentials
    cy.intercept('POST', '/api/auth/login').as('login');
    cy.intercept('GET', '/api/reports/dashboard/metrics').as('dashboardMetrics');
    cy.intercept('GET', '/api/reports/recent').as('recentReports');
    cy.intercept('GET', '/api/reports/scheduled').as('scheduledReports');
    
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('test-user');
    cy.get('[data-testid="password-input"]').type('test-password');
    cy.get('[data-testid="login-button"]').click();
    cy.wait('@login');
    
    // Navigate to reports page
    cy.get('[data-testid="reports-nav"]').click();
    cy.wait('@dashboardMetrics');
    cy.wait('@recentReports');
    cy.wait('@scheduledReports');
  });

  it('should display reports dashboard with required elements', () => {
    // Visit the reports dashboard page
    cy.get('[data-testid="page-title"]').should('contain', 'Financial Reports');
    
    // Verify report categories are displayed
    cy.get('[data-testid="report-categories"]').should('exist');
    cy.get('[data-testid="category-revenue"]').should('exist');
    cy.get('[data-testid="category-claims"]').should('exist');
    cy.get('[data-testid="category-financial"]').should('exist');
    
    // Verify recently run reports section is displayed
    cy.get('[data-testid="recent-reports-section"]').should('exist');
    cy.get('[data-testid="recent-reports-list"]').should('exist');
    
    // Verify scheduled reports section is displayed
    cy.get('[data-testid="scheduled-reports-section"]').should('exist');
    cy.get('[data-testid="scheduled-reports-list"]').should('exist');
    
    // Verify quick action buttons are present
    cy.get('[data-testid="generate-report-btn"]').should('exist');
    cy.get('[data-testid="view-scheduled-reports-btn"]').should('exist');
  });

  it('should navigate to report selection page', () => {
    // Click on 'Generate Report' button
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    
    // Verify URL changes to report selection page
    cy.url().should('include', '/reports/select');
    
    // Verify report category selection is displayed
    cy.get('[data-testid="report-category-filter"]').should('exist');
    
    // Verify report template list is displayed
    cy.get('[data-testid="report-template-list"]').should('exist');
    cy.get('[data-testid="report-template-item"]').should('have.length.greaterThan', 0);
    
    // Verify each report has a description
    cy.get('[data-testid="report-description"]').first().should('exist');
    
    // Verify 'Select' button is present for each report
    cy.get('[data-testid="select-report-btn"]').first().should('exist');
  });

  it('should display report parameters form for selected report', () => {
    // Navigate to report selection page
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    
    // Select 'Revenue by Program' report
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    
    // Verify URL changes to report parameters page
    cy.url().should('include', '/reports/parameters');
    
    // Verify report title is displayed
    cy.get('[data-testid="report-title"]').should('contain', 'Revenue by Program');
    
    // Verify time frame selection is present
    cy.get('[data-testid="timeframe-select"]').should('exist');
    
    // Verify date range selection is present when time frame is 'Custom'
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CUSTOM);
    cy.get('[data-testid="date-range-picker"]').should('be.visible');
    
    // Verify comparison type selection is present
    cy.get('[data-testid="comparison-type-select"]').should('exist');
    
    // Verify program selection is present
    cy.get('[data-testid="program-select"]').should('exist');
    
    // Verify payer selection is present
    cy.get('[data-testid="payer-select"]').should('exist');
    
    // Verify facility selection is present
    cy.get('[data-testid="facility-select"]').should('exist');
    
    // Verify 'Generate Report' button is present
    cy.get('[data-testid="generate-report-btn"]').should('exist');
    
    // Verify 'Schedule Report' button is present
    cy.get('[data-testid="schedule-report-btn"]').should('exist');
    
    // Verify 'Save Parameters' button is present
    cy.get('[data-testid="save-parameters-btn"]').should('exist');
  });

  it('should generate a Revenue by Program report', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to report parameters page for Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    
    // Select 'Current Month' time frame
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    
    // Select 'Previous Period' comparison type
    cy.get('[data-testid="comparison-type-select"]').select(ComparisonType.PREVIOUS_PERIOD);
    
    // Select 'All Programs' in program selection
    cy.get('[data-testid="program-select"]').select('all');
    
    // Select 'All Payers' in payer selection
    cy.get('[data-testid="payer-select"]').select('all');
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify report title is displayed as 'Revenue by Program'
    cy.get('[data-testid="report-title"]').should('contain', 'Revenue by Program');
    
    // Verify report metadata shows correct time frame and parameters
    cy.get('[data-testid="report-metadata"]').should('contain', 'Current Month');
    cy.get('[data-testid="report-metadata"]').should('contain', 'Previous Period');
    
    // Verify summary metrics are displayed with current and previous values
    cy.get('[data-testid="summary-metrics"]').should('exist');
    cy.get('[data-testid="metric-total-revenue"]').should('exist');
    cy.get('[data-testid="metric-change"]').should('exist');
    
    // Verify bar chart visualization is displayed
    cy.get('[data-testid="chart-container"]').should('exist');
    cy.get('[data-testid="bar-chart"]').should('exist');
    
    // Verify data table with program revenue details is displayed
    cy.get('[data-testid="data-table"]').should('exist');
    cy.get('[data-testid="table-header"]').should('contain', 'Program');
    cy.get('[data-testid="table-header"]').should('contain', 'Revenue');
    cy.get('[data-testid="table-header"]').should('contain', 'Previous Period');
    cy.get('[data-testid="table-header"]').should('contain', 'Change');
    
    // Verify export buttons are present (PDF, Excel, CSV)
    cy.get('[data-testid="export-pdf-btn"]').should('exist');
    cy.get('[data-testid="export-excel-btn"]').should('exist');
    cy.get('[data-testid="export-csv-btn"]').should('exist');
  });

  it('should generate a Revenue by Payer report', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to report parameters page for Revenue by Payer report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Payer")').click();
    cy.wait('@reportTemplate');
    
    // Select 'Last 30 Days' time frame
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.LAST_30_DAYS);
    
    // Select 'Year Over Year' comparison type
    cy.get('[data-testid="comparison-type-select"]').select(ComparisonType.YEAR_OVER_YEAR);
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify report title is displayed as 'Revenue by Payer'
    cy.get('[data-testid="report-title"]').should('contain', 'Revenue by Payer');
    
    // Verify report metadata shows correct time frame and parameters
    cy.get('[data-testid="report-metadata"]').should('contain', 'Last 30 Days');
    cy.get('[data-testid="report-metadata"]').should('contain', 'Year Over Year');
    
    // Verify summary metrics are displayed with current and previous values
    cy.get('[data-testid="summary-metrics"]').should('exist');
    cy.get('[data-testid="metric-total-revenue"]').should('exist');
    
    // Verify pie chart visualization is displayed
    cy.get('[data-testid="chart-container"]').should('exist');
    cy.get('[data-testid="pie-chart"]').should('exist');
    
    // Verify data table with payer revenue details is displayed
    cy.get('[data-testid="data-table"]').should('exist');
    cy.get('[data-testid="table-header"]').should('contain', 'Payer');
    cy.get('[data-testid="table-header"]').should('contain', 'Revenue');
  });

  it('should generate a Claims Status report', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to report parameters page for Claims Status report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Claims Status")').click();
    cy.wait('@reportTemplate');
    
    // Select 'Current Quarter' time frame
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_QUARTER);
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify report title is displayed as 'Claims Status'
    cy.get('[data-testid="report-title"]').should('contain', 'Claims Status');
    
    // Verify report metadata shows correct time frame and parameters
    cy.get('[data-testid="report-metadata"]').should('contain', 'Current Quarter');
    
    // Verify summary metrics are displayed
    cy.get('[data-testid="summary-metrics"]').should('exist');
    
    // Verify pie chart visualization of claims by status is displayed
    cy.get('[data-testid="chart-container"]').should('exist');
    cy.get('[data-testid="pie-chart"]').should('exist');
    
    // Verify data table with claims status details is displayed
    cy.get('[data-testid="data-table"]').should('exist');
    cy.get('[data-testid="table-header"]').should('contain', 'Status');
    cy.get('[data-testid="table-header"]').should('contain', 'Count');
    cy.get('[data-testid="table-header"]').should('contain', 'Amount');
  });

  it('should generate an Aging Accounts Receivable report', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to report parameters page for Aging Accounts Receivable report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Aging Accounts Receivable")').click();
    cy.wait('@reportTemplate');
    
    // Select current date as 'As of Date'
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    cy.get('[data-testid="as-of-date-picker"]').type(today);
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify report title is displayed as 'Aging Accounts Receivable'
    cy.get('[data-testid="report-title"]').should('contain', 'Aging Accounts Receivable');
    
    // Verify report metadata shows correct as-of date
    cy.get('[data-testid="report-metadata"]').should('contain', today);
    
    // Verify summary metrics are displayed
    cy.get('[data-testid="summary-metrics"]').should('exist');
    
    // Verify bar chart visualization of aging buckets is displayed
    cy.get('[data-testid="chart-container"]').should('exist');
    cy.get('[data-testid="bar-chart"]').should('exist');
    
    // Verify data table with aging details by payer is displayed
    cy.get('[data-testid="data-table"]').should('exist');
    cy.get('[data-testid="table-header"]').should('contain', 'Payer');
    cy.get('[data-testid="table-header"]').should('contain', 'Current');
    cy.get('[data-testid="table-header"]').should('contain', '1-30 Days');
    cy.get('[data-testid="table-header"]').should('contain', '31-60 Days');
    cy.get('[data-testid="table-header"]').should('contain', '61-90 Days');
    cy.get('[data-testid="table-header"]').should('contain', '90+ Days');
    cy.get('[data-testid="table-header"]').should('contain', 'Total');
  });

  it('should export a report in PDF format', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    cy.intercept('GET', '/api/reports/export/*').as('exportReport');
    
    // Generate a Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Mock file download for PDF
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    
    // Click 'Export PDF' button
    cy.get('[data-testid="export-pdf-btn"]').click();
    cy.wait('@exportReport');
    
    // Verify file download occurs
    cy.get('@windowOpen').should('be.called');
    cy.get('@windowOpen').should('be.calledWithMatch', /\/api\/reports\/export\/.+\/pdf/);
    
    // Verify downloaded file is a PDF
    cy.get('@exportReport.all').should('have.length.at.least', 1);
    cy.get('@exportReport.all').its('0.response.headers').should('include', {
      'content-type': 'application/pdf'
    });
    
    // Verify file name contains report name and date
    cy.get('@exportReport.all').its('0.response.headers').should('include.keys', 'content-disposition');
    cy.get('@exportReport.all').its('0.response.headers.content-disposition').should('match', /Revenue.*Program.*\.pdf/);
  });

  it('should export a report in Excel format', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    cy.intercept('GET', '/api/reports/export/*').as('exportReport');
    
    // Generate a Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Mock file download for Excel
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    
    // Click 'Export Excel' button
    cy.get('[data-testid="export-excel-btn"]').click();
    cy.wait('@exportReport');
    
    // Verify file download occurs
    cy.get('@windowOpen').should('be.called');
    cy.get('@windowOpen').should('be.calledWithMatch', /\/api\/reports\/export\/.+\/excel/);
    
    // Verify downloaded file is an Excel file
    cy.get('@exportReport.all').should('have.length.at.least', 1);
    cy.get('@exportReport.all').its('0.response.headers').should('include', {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    // Verify file name contains report name and date
    cy.get('@exportReport.all').its('0.response.headers').should('include.keys', 'content-disposition');
    cy.get('@exportReport.all').its('0.response.headers.content-disposition').should('match', /Revenue.*Program.*\.xlsx/);
  });

  it('should export a report in CSV format', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    cy.intercept('GET', '/api/reports/export/*').as('exportReport');
    
    // Generate a Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Mock file download for CSV
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    
    // Click 'Export CSV' button
    cy.get('[data-testid="export-csv-btn"]').click();
    cy.wait('@exportReport');
    
    // Verify file download occurs
    cy.get('@windowOpen').should('be.called');
    cy.get('@windowOpen').should('be.calledWithMatch', /\/api\/reports\/export\/.+\/csv/);
    
    // Verify downloaded file is a CSV file
    cy.get('@exportReport.all').should('have.length.at.least', 1);
    cy.get('@exportReport.all').its('0.response.headers').should('include', {
      'content-type': 'text/csv'
    });
    
    // Verify file name contains report name and date
    cy.get('@exportReport.all').its('0.response.headers').should('include.keys', 'content-disposition');
    cy.get('@exportReport.all').its('0.response.headers.content-disposition').should('match', /Revenue.*Program.*\.csv/);
  });

  it('should schedule a report', () => {
    // Intercept report generation API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate').as('generateReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    cy.intercept('POST', '/api/reports/schedule').as('scheduleReport');
    cy.intercept('GET', '/api/reports/scheduled').as('scheduledReports');
    
    // Generate a Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="comparison-type-select"]').select(ComparisonType.PREVIOUS_PERIOD);
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReport');
    cy.wait('@reportInstance');
    
    // Click 'Schedule' button
    cy.get('[data-testid="schedule-btn"]').click();
    
    // Verify schedule form is displayed
    cy.get('[data-testid="schedule-form"]').should('be.visible');
    
    // Enter schedule name
    cy.get('[data-testid="schedule-name-input"]').type('Monthly Revenue by Program');
    
    // Select 'Weekly' frequency
    cy.get('[data-testid="schedule-frequency-select"]').select('weekly');
    
    // Select day of week
    cy.get('[data-testid="schedule-day-select"]').select('1'); // Monday
    
    // Enter time
    cy.get('[data-testid="schedule-time-input"]').type('08:00');
    
    // Select PDF and Excel formats
    cy.get('[data-testid="schedule-format-pdf"]').check();
    cy.get('[data-testid="schedule-format-excel"]').check();
    
    // Add recipient email addresses
    cy.get('[data-testid="schedule-recipient-input"]').type('test@example.com{enter}');
    
    // Click 'Schedule Report' button
    cy.get('[data-testid="schedule-submit-btn"]').click();
    cy.wait('@scheduleReport');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-message"]').should('contain', 'Report scheduled successfully');
    
    // Navigate to scheduled reports page
    cy.get('[data-testid="view-scheduled-reports-btn"]').click();
    cy.wait('@scheduledReports');
    
    // Verify new scheduled report appears in the list
    cy.get('[data-testid="scheduled-report-item"]').should('contain', 'Monthly Revenue by Program');
    cy.get('[data-testid="scheduled-report-item"]').should('contain', 'Weekly');
    cy.get('[data-testid="scheduled-report-item"]').should('contain', 'Monday');
  });

  it('should manage scheduled reports', () => {
    // Intercept scheduled reports API request
    cy.intercept('GET', '/api/reports/scheduled').as('scheduledReports');
    cy.intercept('GET', '/api/reports/scheduled/*').as('scheduledReportDetail');
    cy.intercept('PUT', '/api/reports/scheduled/*').as('updateScheduledReport');
    cy.intercept('DELETE', '/api/reports/scheduled/*').as('deleteScheduledReport');
    
    // Navigate to scheduled reports page
    cy.get('[data-testid="view-scheduled-reports-btn"]').click();
    cy.wait('@scheduledReports');
    
    // Verify scheduled reports list is displayed
    cy.get('[data-testid="scheduled-reports-list"]').should('exist');
    
    // Verify each scheduled report shows name, type, schedule, and actions
    cy.get('[data-testid="scheduled-report-item"]').first().within(() => {
      cy.get('[data-testid="report-name"]').should('exist');
      cy.get('[data-testid="report-type"]').should('exist');
      cy.get('[data-testid="report-schedule"]').should('exist');
      cy.get('[data-testid="edit-btn"]').should('exist');
      cy.get('[data-testid="delete-btn"]').should('exist');
    });
    
    // Click edit button for a scheduled report
    cy.get('[data-testid="edit-btn"]').first().click();
    cy.wait('@scheduledReportDetail');
    
    // Verify edit form is displayed with pre-filled data
    cy.get('[data-testid="schedule-form"]').should('be.visible');
    cy.get('[data-testid="schedule-name-input"]').should('not.have.value', '');
    
    // Modify schedule frequency
    cy.get('[data-testid="schedule-frequency-select"]').select('monthly');
    
    // Click save button
    cy.get('[data-testid="schedule-submit-btn"]').click();
    cy.wait('@updateScheduledReport');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-message"]').should('contain', 'Schedule updated successfully');
    
    // Verify scheduled report is updated with new frequency
    cy.get('[data-testid="scheduled-report-item"]').first().should('contain', 'Monthly');
    
    // Click delete button for a scheduled report
    cy.get('[data-testid="delete-btn"]').first().click();
    
    // Verify confirmation dialog is displayed
    cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
    
    // Confirm deletion
    cy.get('[data-testid="confirm-btn"]').click();
    cy.wait('@deleteScheduledReport');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-message"]').should('contain', 'Schedule deleted successfully');
    
    // Verify scheduled report is removed from the list
    cy.get('[data-testid="scheduled-reports-list"]').should('not.contain', 'Monthly Revenue by Program');
  });

  it('should create a custom report', () => {
    // Intercept custom report API requests
    cy.intercept('GET', '/api/reports/data-sources').as('dataSources');
    cy.intercept('GET', '/api/reports/data-sources/*/fields').as('dataSourceFields');
    cy.intercept('POST', '/api/reports/custom').as('createCustomReport');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to custom report builder page
    cy.get('[data-testid="custom-report-btn"]').click();
    cy.wait('@dataSources');
    
    // Verify data source selection is displayed
    cy.get('[data-testid="data-source-select"]').should('exist');
    
    // Select 'Claims' as data source
    cy.get('[data-testid="data-source-select"]').select('claims');
    cy.wait('@dataSourceFields');
    
    // Verify field selection is displayed
    cy.get('[data-testid="field-selection"]').should('exist');
    
    // Select multiple fields (claim number, client name, service date, amount, status)
    cy.get('[data-testid="field-checkbox-claimNumber"]').check();
    cy.get('[data-testid="field-checkbox-clientName"]').check();
    cy.get('[data-testid="field-checkbox-serviceDate"]').check();
    cy.get('[data-testid="field-checkbox-amount"]').check();
    cy.get('[data-testid="field-checkbox-status"]').check();
    
    // Verify filtering options are displayed
    cy.get('[data-testid="add-filter-btn"]').click();
    cy.get('[data-testid="filter-field-select"]').should('exist');
    
    // Add filter for status = 'Paid'
    cy.get('[data-testid="filter-field-select"]').select('status');
    cy.get('[data-testid="filter-operator-select"]').select('eq');
    cy.get('[data-testid="filter-value-select"]').select('paid');
    
    // Verify grouping options are displayed
    cy.get('[data-testid="grouping-section"]').should('exist');
    
    // Select grouping by 'Payer'
    cy.get('[data-testid="group-by-select"]').select('payer');
    
    // Verify sorting options are displayed
    cy.get('[data-testid="sorting-section"]').should('exist');
    
    // Select sorting by 'Amount' descending
    cy.get('[data-testid="sort-field-select"]').select('amount');
    cy.get('[data-testid="sort-direction-select"]').select('desc');
    
    // Verify visualization selection is displayed
    cy.get('[data-testid="visualization-section"]').should('exist');
    
    // Select 'Bar Chart' visualization
    cy.get('[data-testid="chart-type-select"]').select(ChartType.BAR);
    
    // Enter report name
    cy.get('[data-testid="report-name-input"]').type('Custom Paid Claims by Payer');
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@createCustomReport');
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify custom report is displayed with selected fields and visualization
    cy.get('[data-testid="report-title"]').should('contain', 'Custom Paid Claims by Payer');
    cy.get('[data-testid="bar-chart"]').should('exist');
    cy.get('[data-testid="data-table"]').should('exist');
    
    // Verify data is filtered, grouped, and sorted as specified
    cy.get('[data-testid="table-header"]').should('contain', 'Claim Number');
    cy.get('[data-testid="table-header"]').should('contain', 'Client');
    cy.get('[data-testid="table-header"]').should('contain', 'Service Date');
    cy.get('[data-testid="table-header"]').should('contain', 'Amount');
    cy.get('[data-testid="table-header"]').should('contain', 'Status');
  });

  it('should save report parameters for future use', () => {
    // Intercept save report parameters API request
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/save-parameters').as('saveParameters');
    cy.intercept('GET', '/api/reports/saved').as('savedReports');
    cy.intercept('GET', '/api/reports/saved/*').as('savedReportDetail');
    
    // Navigate to report parameters page for Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    
    // Configure report parameters
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="comparison-type-select"]').select(ComparisonType.PREVIOUS_PERIOD);
    cy.get('[data-testid="program-select"]').select('all');
    cy.get('[data-testid="payer-select"]').select('all');
    
    // Enter saved report name
    cy.get('[data-testid="saved-report-name-input"]').type('My Monthly Revenue Report');
    
    // Click 'Save Parameters' button
    cy.get('[data-testid="save-parameters-btn"]').click();
    cy.wait('@saveParameters');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-message"]').should('contain', 'Report parameters saved successfully');
    
    // Navigate to saved reports page
    cy.get('[data-testid="saved-reports-btn"]').click();
    cy.wait('@savedReports');
    
    // Verify saved report appears in the list
    cy.get('[data-testid="saved-report-item"]').should('contain', 'My Monthly Revenue Report');
    
    // Click on saved report
    cy.get('[data-testid="saved-report-item"]').contains('My Monthly Revenue Report').click();
    cy.wait('@savedReportDetail');
    
    // Verify report parameters page loads with saved parameters
    cy.get('[data-testid="timeframe-select"]').should('have.value', TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="comparison-type-select"]').should('have.value', ComparisonType.PREVIOUS_PERIOD);
    cy.get('[data-testid="program-select"]').should('have.value', 'all');
    cy.get('[data-testid="payer-select"]').should('have.value', 'all');
  });

  it('should handle validation errors in report parameters', () => {
    // Navigate to report parameters page for Revenue by Program report
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    
    // Select 'Custom' time frame but don't select date range
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CUSTOM);
    cy.get('[data-testid="generate-report-btn"]').click();
    
    // Verify date range validation error is displayed
    cy.get('[data-testid="date-range-error"]').should('be.visible');
    cy.get('[data-testid="date-range-error"]').should('contain', 'Please select a date range');
    
    // Select invalid date range (end date before start date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    cy.get('[data-testid="start-date-input"]').type(futureDateStr);
    cy.get('[data-testid="end-date-input"]').type(pastDateStr);
    cy.get('[data-testid="generate-report-btn"]').click();
    
    // Verify date range validation error is displayed
    cy.get('[data-testid="date-range-error"]').should('be.visible');
    cy.get('[data-testid="date-range-error"]').should('contain', 'End date must be after start date');
    
    // Select valid date range but spanning more than 1 year
    const veryPastDate = new Date();
    veryPastDate.setFullYear(veryPastDate.getFullYear() - 2);
    const veryPastDateStr = veryPastDate.toISOString().split('T')[0];
    
    cy.get('[data-testid="start-date-input"]').clear().type(veryPastDateStr);
    cy.get('[data-testid="end-date-input"]').clear().type(futureDateStr);
    cy.get('[data-testid="generate-report-btn"]').click();
    
    // Verify date range limit validation error is displayed
    cy.get('[data-testid="date-range-error"]').should('be.visible');
    cy.get('[data-testid="date-range-error"]').should('contain', 'Date range cannot exceed 1 year');
  });

  it('should display report generation errors', () => {
    // Intercept report generation API request with error response
    cy.intercept('GET', '/api/reports/templates').as('reportTemplates');
    cy.intercept('GET', '/api/reports/templates/*').as('reportTemplate');
    cy.intercept('POST', '/api/reports/generate', {
      statusCode: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Unable to generate report due to invalid parameters',
          details: {
            field: 'timeFrame',
            reason: 'Cannot generate report for future time periods'
          }
        }
      }
    }).as('generateReportError');
    
    // Navigate to report parameters page for Revenue by Program report
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@reportTemplates');
    cy.get('[data-testid="select-report-btn"]').filter(':contains("Revenue by Program")').click();
    cy.wait('@reportTemplate');
    
    // Configure report parameters
    cy.get('[data-testid="timeframe-select"]').select(TimeFrame.CURRENT_MONTH);
    cy.get('[data-testid="comparison-type-select"]').select(ComparisonType.PREVIOUS_PERIOD);
    
    // Click 'Generate Report' button
    cy.get('[data-testid="generate-report-btn"]').click();
    cy.wait('@generateReportError');
    
    // Verify error message is displayed
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Unable to generate report due to invalid parameters');
    
    // Verify user is not navigated to report viewer page
    cy.url().should('include', '/reports/parameters');
    cy.url().should('not.include', '/reports/view');
  });

  it('should navigate between reports history and viewer', () => {
    // Intercept reports history API request
    cy.intercept('GET', '/api/reports/history').as('reportsHistory');
    cy.intercept('GET', '/api/reports/instances/*').as('reportInstance');
    
    // Navigate to reports history page
    cy.get('[data-testid="reports-history-btn"]').click();
    cy.wait('@reportsHistory');
    
    // Verify reports history list is displayed
    cy.get('[data-testid="reports-history-list"]').should('exist');
    
    // Click on a report in the history list
    cy.get('[data-testid="history-report-item"]').first().click();
    cy.wait('@reportInstance');
    
    // Verify URL changes to report viewer page
    cy.url().should('include', '/reports/view');
    
    // Verify report is displayed
    cy.get('[data-testid="report-content"]').should('exist');
    
    // Click 'Back to Reports' button
    cy.get('[data-testid="back-to-reports-btn"]').click();
    
    // Verify URL changes back to reports history page
    cy.url().should('include', '/reports/history');
  });
});