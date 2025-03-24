import 'cypress';

describe('Reports Management', () => {
  beforeEach(() => {
    // Log in as a financial manager
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-token',
        user: {
          id: 'mock-user-id',
          name: 'Financial Manager',
          email: 'finance@example.com',
          role: 'financial_manager',
          permissions: ['view_reports', 'create_reports', 'schedule_reports', 'export_reports']
        }
      }
    }).as('loginRequest');
    
    cy.visit('/login');
    cy.get('[data-testid=email]').type('finance@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=login-button]').click();
    cy.wait('@loginRequest');
    
    // Preserve cookies and localStorage between tests
    cy.getCookies().then(cookies => {
      cookies.forEach(cookie => {
        cy.setCookie(cookie.name, cookie.value);
      });
    });
    
    // Visit the reports dashboard
    cy.visit('/reports');
    cy.get('[data-testid=reports-dashboard]').should('be.visible');
  });

  // Helper function to mock reports API responses
  const mockReportsApi = (options = {}) => {
    const defaults = {
      reportDefinitions: [],
      recentReports: [],
      scheduledReports: [],
      reportData: {},
      statusCode: 200
    };
    
    const config = { ...defaults, ...options };
    
    cy.intercept('GET', '/api/reports/definitions*', {
      statusCode: config.statusCode,
      body: {
        data: config.reportDefinitions,
        pagination: {
          total: config.reportDefinitions.length,
          page: 1,
          perPage: 10,
          totalPages: Math.ceil(config.reportDefinitions.length / 10)
        }
      }
    }).as('getReportDefinitions');
    
    cy.intercept('GET', '/api/reports/recent*', {
      statusCode: config.statusCode,
      body: {
        data: config.recentReports,
        pagination: {
          total: config.recentReports.length,
          page: 1,
          perPage: 10,
          totalPages: Math.ceil(config.recentReports.length / 10)
        }
      }
    }).as('getRecentReports');
    
    cy.intercept('GET', '/api/reports/scheduled*', {
      statusCode: config.statusCode,
      body: {
        data: config.scheduledReports,
        pagination: {
          total: config.scheduledReports.length,
          page: 1,
          perPage: 10,
          totalPages: Math.ceil(config.scheduledReports.length / 10)
        }
      }
    }).as('getScheduledReports');
    
    cy.intercept('POST', '/api/reports/generate*', {
      statusCode: config.statusCode,
      body: {
        reportId: 'mock-report-id',
        ...config.reportData
      }
    }).as('generateReport');
    
    cy.intercept('POST', '/api/reports/export*', {
      statusCode: config.statusCode,
      body: {
        downloadUrl: 'https://example.com/download/report.pdf'
      }
    }).as('exportReport');
    
    cy.intercept('POST', '/api/reports/schedule*', {
      statusCode: config.statusCode,
      body: {
        id: 'mock-schedule-id',
        status: 'created'
      }
    }).as('scheduleReport');
  };

  // Helper function to fill report parameters
  const fillReportParameters = (parameters = {}) => {
    const defaults = {
      dateRange: 'Last 30 Days',
      programs: ['All Programs'],
      payers: ['All Payers'],
      facilities: ['All Facilities'],
      comparisonType: 'Previous Period'
    };
    
    const config = { ...defaults, ...parameters };
    
    // Set date range
    cy.get('[data-testid=date-range-selector]').click();
    cy.get(`[data-testid=date-range-option-${config.dateRange.replace(/\s+/g, '-').toLowerCase()}]`).click();
    
    // Set programs if specified
    if (config.programs && config.programs.length > 0) {
      cy.get('[data-testid=programs-selector]').click();
      config.programs.forEach(program => {
        cy.get(`[data-testid=program-option-${program.replace(/\s+/g, '-').toLowerCase()}]`).click();
      });
      cy.get('body').click(); // Close the dropdown
    }
    
    // Set payers if specified
    if (config.payers && config.payers.length > 0) {
      cy.get('[data-testid=payers-selector]').click();
      config.payers.forEach(payer => {
        cy.get(`[data-testid=payer-option-${payer.replace(/\s+/g, '-').toLowerCase()}]`).click();
      });
      cy.get('body').click(); // Close the dropdown
    }
    
    // Set facilities if specified
    if (config.facilities && config.facilities.length > 0) {
      cy.get('[data-testid=facilities-selector]').click();
      config.facilities.forEach(facility => {
        cy.get(`[data-testid=facility-option-${facility.replace(/\s+/g, '-').toLowerCase()}]`).click();
      });
      cy.get('body').click(); // Close the dropdown
    }
    
    // Set comparison type if specified
    if (config.comparisonType) {
      cy.get('[data-testid=comparison-type-selector]').click();
      cy.get(`[data-testid=comparison-type-option-${config.comparisonType.replace(/\s+/g, '-').toLowerCase()}]`).click();
    }
    
    // Handle additional parameters based on report type
    if (config.additionalParams) {
      Object.keys(config.additionalParams).forEach(param => {
        cy.get(`[data-testid=${param}-selector]`).click();
        cy.get(`[data-testid=${param}-option-${config.additionalParams[param].replace(/\s+/g, '-').toLowerCase()}]`).click();
      });
    }
  };

  // Helper function to verify report content
  const verifyReportContent = (expectedReport = {}) => {
    // Verify report title and metadata
    cy.get('[data-testid=report-title]').should('contain', expectedReport.title);
    if (expectedReport.subtitle) {
      cy.get('[data-testid=report-subtitle]').should('contain', expectedReport.subtitle);
    }
    
    // Verify summary metrics
    if (expectedReport.summaryMetrics) {
      Object.keys(expectedReport.summaryMetrics).forEach(metric => {
        cy.get(`[data-testid=metric-${metric}]`).should('contain', expectedReport.summaryMetrics[metric]);
      });
    }
    
    // Verify charts are rendered
    if (expectedReport.charts) {
      expectedReport.charts.forEach(chart => {
        cy.get(`[data-testid=chart-${chart}]`).should('be.visible');
      });
    }
    
    // Verify data tables
    if (expectedReport.tables) {
      expectedReport.tables.forEach(table => {
        cy.get(`[data-testid=table-${table}]`).should('be.visible');
        
        // Verify table has expected number of rows if specified
        if (expectedReport.tableRowCounts && expectedReport.tableRowCounts[table]) {
          cy.get(`[data-testid=table-${table}] tbody tr`).should('have.length', expectedReport.tableRowCounts[table]);
        }
      });
    }
    
    // Verify totals
    if (expectedReport.totals) {
      Object.keys(expectedReport.totals).forEach(total => {
        cy.get(`[data-testid=total-${total}]`).should('contain', expectedReport.totals[total]);
      });
    }
  };

  // Helper function to configure a schedule
  const configureSchedule = (scheduleConfig = {}) => {
    const defaults = {
      name: 'Automated Test Schedule',
      description: 'Created by automated test',
      frequency: 'Weekly',
      day: 'Monday',
      time: '08:00',
      formats: ['PDF'],
      recipients: ['test@example.com'],
      active: true
    };
    
    const config = { ...defaults, ...scheduleConfig };
    
    // Fill schedule form
    cy.get('[data-testid=schedule-name]').clear().type(config.name);
    cy.get('[data-testid=schedule-description]').clear().type(config.description);
    
    // Select frequency
    cy.get('[data-testid=frequency-selector]').click();
    cy.get(`[data-testid=frequency-option-${config.frequency.toLowerCase()}]`).click();
    
    // Configure date/time based on frequency
    if (config.frequency === 'Weekly') {
      cy.get('[data-testid=day-selector]').click();
      cy.get(`[data-testid=day-option-${config.day.toLowerCase()}]`).click();
    } else if (config.frequency === 'Monthly') {
      cy.get('[data-testid=day-of-month-selector]').clear().type(config.dayOfMonth.toString());
    }
    
    // Set time
    cy.get('[data-testid=time-input]').clear().type(config.time);
    
    // Select export formats
    cy.get('[data-testid=formats-selector]').click();
    config.formats.forEach(format => {
      cy.get(`[data-testid=format-option-${format.toLowerCase()}]`).click();
    });
    cy.get('body').click(); // Close the dropdown
    
    // Add recipients
    config.recipients.forEach((recipient, index) => {
      if (index > 0) {
        cy.get('[data-testid=add-recipient-button]').click();
      }
      cy.get(`[data-testid=recipient-input-${index}]`).clear().type(recipient);
    });
    
    // Set active status
    if (config.active) {
      cy.get('[data-testid=active-toggle]').check();
    } else {
      cy.get('[data-testid=active-toggle]').uncheck();
    }
  };

  it('should display the reports dashboard with correct sections', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' }
      ],
      recentReports: [
        { id: 'rec1', name: 'Revenue by Program', runDate: '2023-06-01T10:30:00Z', reportDefinitionId: 'rev-prog' },
        { id: 'rec2', name: 'Claims Status', runDate: '2023-05-28T14:15:00Z', reportDefinitionId: 'claims-status' }
      ],
      scheduledReports: [
        { id: 'sch1', name: 'Monthly Revenue', frequency: 'Monthly', nextRun: '2023-07-01T08:00:00Z', reportDefinitionId: 'rev-prog' }
      ]
    });
    
    // Visit reports dashboard
    cy.visit('/reports');
    
    // Verify report categories section
    cy.get('[data-testid=report-categories]').should('be.visible');
    cy.get('[data-testid=report-category-financial]').should('be.visible');
    cy.get('[data-testid=report-category-claims]').should('be.visible');
    
    // Verify recently run reports section
    cy.get('[data-testid=recent-reports]').should('be.visible');
    cy.get('[data-testid=recent-report-rec1]').should('contain', 'Revenue by Program');
    cy.get('[data-testid=recent-report-rec2]').should('contain', 'Claims Status');
    
    // Verify scheduled reports section
    cy.get('[data-testid=scheduled-reports]').should('be.visible');
    cy.get('[data-testid=scheduled-report-sch1]').should('contain', 'Monthly Revenue');
    
    // Verify quick action buttons
    cy.get('[data-testid=create-report-button]').should('be.visible');
    cy.get('[data-testid=view-schedules-button]').should('be.visible');
    
    // Verify financial metrics are displayed
    cy.get('[data-testid=financial-metrics-section]').should('be.visible');
    cy.get('[data-testid=metric-revenue]').should('be.visible');
    cy.get('[data-testid=metric-claims]').should('be.visible');
    cy.get('[data-testid=metric-ar]').should('be.visible');
  });

  it('should generate a revenue by program report successfully', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Revenue by Program',
        subtitle: 'Last 30 Days',
        data: {
          programs: [
            { name: 'Personal Care', revenue: 456789.00, previousRevenue: 432567.00, change: 5.6 },
            { name: 'Residential', revenue: 345678.00, previousRevenue: 356789.00, change: -3.1 },
            { name: 'Day Services', revenue: 234567.00, previousRevenue: 210456.00, change: 11.5 },
            { name: 'Respite', revenue: 123456.00, previousRevenue: 118765.00, change: 4.0 },
            { name: 'Other', revenue: 85188.00, previousRevenue: 76543.00, change: 11.3 }
          ],
          total: {
            revenue: 1245678.00,
            previousRevenue: 1195120.00,
            change: 4.2
          }
        }
      }
    });
    
    // Start creating a report
    cy.get('[data-testid=create-report-button]').click();
    
    // Verify navigation to report selection page
    cy.url().should('include', '/reports/select');
    
    // Select report type
    cy.get('[data-testid=report-type-rev-prog]').click();
    
    // Verify navigation to report parameters page
    cy.url().should('include', '/reports/parameters');
    
    // Fill parameters form
    fillReportParameters({
      dateRange: 'Last 30 Days',
      programs: ['All Programs'],
      comparisonType: 'Previous Period'
    });
    
    // Generate report
    cy.get('[data-testid=generate-report-button]').click();
    
    // Wait for report generation
    cy.wait('@generateReport');
    
    // Verify navigation to report viewer
    cy.url().should('include', '/reports/view');
    
    // Verify report content
    verifyReportContent({
      title: 'Revenue by Program',
      subtitle: 'Last 30 Days',
      summaryMetrics: {
        'total-revenue': '$1,245,678.00',
        'total-change': '+4.2%'
      },
      charts: ['revenue-by-program', 'monthly-trend'],
      tables: ['program-revenue'],
      tableRowCounts: {
        'program-revenue': 5
      },
      totals: {
        'revenue': '$1,245,678.00',
        'previous-revenue': '$1,195,120.00',
        'change': '+4.2%'
      }
    });
  });

  it('should generate a claims status report successfully', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Claims Status Report',
        subtitle: 'Last 30 Days',
        data: {
          statuses: [
            { status: 'Submitted', count: 120, amount: 240500.00 },
            { status: 'Pending', count: 45, amount: 98750.00 },
            { status: 'Paid', count: 210, amount: 456800.00 },
            { status: 'Denied', count: 15, amount: 32450.00 }
          ],
          total: {
            count: 390,
            amount: 828500.00
          }
        }
      }
    });
    
    // Start creating a report
    cy.get('[data-testid=create-report-button]').click();
    
    // Verify navigation to report selection page
    cy.url().should('include', '/reports/select');
    
    // Select report type
    cy.get('[data-testid=report-type-claims-status]').click();
    
    // Verify navigation to report parameters page
    cy.url().should('include', '/reports/parameters');
    
    // Fill parameters form
    fillReportParameters({
      dateRange: 'Last 30 Days',
      payers: ['All Payers']
    });
    
    // Generate report
    cy.get('[data-testid=generate-report-button]').click();
    
    // Wait for report generation
    cy.wait('@generateReport');
    
    // Verify navigation to report viewer
    cy.url().should('include', '/reports/view');
    
    // Verify report content
    verifyReportContent({
      title: 'Claims Status Report',
      subtitle: 'Last 30 Days',
      summaryMetrics: {
        'total-claims': '390',
        'total-amount': '$828,500.00'
      },
      charts: ['claims-status-distribution'],
      tables: ['claims-status'],
      tableRowCounts: {
        'claims-status': 4
      },
      totals: {
        'count': '390',
        'amount': '$828,500.00'
      }
    });
  });

  it('should generate an aging accounts receivable report successfully', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Aging Accounts Receivable',
        subtitle: 'As of June 1, 2023',
        data: {
          agingBuckets: [
            { bucket: '0-30 days', amount: 245678.00, percentage: 49.8 },
            { bucket: '31-60 days', amount: 123456.00, percentage: 25.0 },
            { bucket: '61-90 days', amount: 78901.00, percentage: 16.0 },
            { bucket: '90+ days', amount: 45678.00, percentage: 9.2 }
          ],
          total: {
            amount: 493713.00,
            percentage: 100.0
          }
        }
      }
    });
    
    // Start creating a report
    cy.get('[data-testid=create-report-button]').click();
    
    // Verify navigation to report selection page
    cy.url().should('include', '/reports/select');
    
    // Select report type
    cy.get('[data-testid=report-type-ar-aging]').click();
    
    // Verify navigation to report parameters page
    cy.url().should('include', '/reports/parameters');
    
    // Fill parameters form with "As of Date"
    cy.get('[data-testid=as-of-date]').clear().type('2023-06-01');
    cy.get('[data-testid=payers-selector]').click();
    cy.get('[data-testid=payer-option-all-payers]').click();
    
    // Generate report
    cy.get('[data-testid=generate-report-button]').click();
    
    // Wait for report generation
    cy.wait('@generateReport');
    
    // Verify navigation to report viewer
    cy.url().should('include', '/reports/view');
    
    // Verify report content
    verifyReportContent({
      title: 'Aging Accounts Receivable',
      subtitle: 'As of June 1, 2023',
      summaryMetrics: {
        'total-ar': '$493,713.00',
        '90-plus-days': '$45,678.00'
      },
      charts: ['aging-buckets'],
      tables: ['aging-details'],
      tableRowCounts: {
        'aging-details': 4
      },
      totals: {
        'amount': '$493,713.00',
        'percentage': '100.0%'
      }
    });
  });

  it('should create and generate a custom report successfully', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Custom Payer Analysis',
        subtitle: 'Last 30 Days',
        data: {
          payers: [
            { name: 'Medicaid', claimsCount: 150, revenue: 325600.00, denialRate: 3.2 },
            { name: 'Medicare', claimsCount: 85, revenue: 186400.00, denialRate: 5.1 },
            { name: 'Private Pay', claimsCount: 45, revenue: 98750.00, denialRate: 1.8 },
            { name: 'Other', claimsCount: 30, revenue: 65800.00, denialRate: 4.3 }
          ],
          total: {
            claimsCount: 310,
            revenue: 676550.00,
            denialRate: 3.6
          }
        }
      }
    });
    
    // Navigate to custom report builder
    cy.get('[data-testid=create-report-button]').click();
    cy.url().should('include', '/reports/select');
    cy.get('[data-testid=custom-report-button]').click();
    cy.url().should('include', '/reports/custom');
    
    // Configure custom report
    cy.get('[data-testid=report-name]').type('Custom Payer Analysis');
    cy.get('[data-testid=report-description]').type('Analysis of claims and revenue by payer');
    
    // Select report category
    cy.get('[data-testid=category-selector]').click();
    cy.get('[data-testid=category-option-financial]').click();
    
    // Select data source
    cy.get('[data-testid=data-source-selector]').click();
    cy.get('[data-testid=data-source-option-claims]').click();
    
    // Select fields
    cy.get('[data-testid=field-selector-payer]').check();
    cy.get('[data-testid=field-selector-claims-count]').check();
    cy.get('[data-testid=field-selector-revenue]').check();
    cy.get('[data-testid=field-selector-denial-rate]').check();
    
    // Configure filtering
    cy.get('[data-testid=add-filter-button]').click();
    cy.get('[data-testid=filter-field-selector]').click();
    cy.get('[data-testid=filter-field-option-service-date]').click();
    cy.get('[data-testid=filter-operator-selector]').click();
    cy.get('[data-testid=filter-operator-option-between]').click();
    cy.get('[data-testid=filter-value-from]').type('2023-05-01');
    cy.get('[data-testid=filter-value-to]').type('2023-05-31');
    
    // Configure grouping
    cy.get('[data-testid=grouping-field-selector]').click();
    cy.get('[data-testid=grouping-field-option-payer]').click();
    
    // Configure sorting
    cy.get('[data-testid=sorting-field-selector]').click();
    cy.get('[data-testid=sorting-field-option-revenue]').click();
    cy.get('[data-testid=sorting-direction-selector]').click();
    cy.get('[data-testid=sorting-direction-option-descending]').click();
    
    // Select visualization
    cy.get('[data-testid=visualization-selector]').click();
    cy.get('[data-testid=visualization-option-bar-chart]').click();
    
    // Save report definition
    cy.get('[data-testid=save-report-definition-button]').click();
    
    // Generate report
    cy.get('[data-testid=generate-report-button]').click();
    
    // Wait for report generation
    cy.wait('@generateReport');
    
    // Verify navigation to report viewer
    cy.url().should('include', '/reports/view');
    
    // Verify report content
    verifyReportContent({
      title: 'Custom Payer Analysis',
      subtitle: 'Last 30 Days',
      summaryMetrics: {
        'total-claims': '310',
        'total-revenue': '$676,550.00',
        'average-denial-rate': '3.6%'
      },
      charts: ['payer-analysis'],
      tables: ['payer-details'],
      tableRowCounts: {
        'payer-details': 4
      },
      totals: {
        'claims-count': '310',
        'revenue': '$676,550.00',
        'denial-rate': '3.6%'
      }
    });
  });

  it('should export a report in different formats', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Revenue by Program',
        subtitle: 'Last 30 Days',
        data: {
          programs: [
            { name: 'Personal Care', revenue: 456789.00, previousRevenue: 432567.00, change: 5.6 },
            { name: 'Residential', revenue: 345678.00, previousRevenue: 356789.00, change: -3.1 }
          ],
          total: {
            revenue: 802467.00,
            previousRevenue: 789356.00,
            change: 1.7
          }
        }
      }
    });
    
    // Generate a report first
    cy.get('[data-testid=create-report-button]').click();
    cy.url().should('include', '/reports/select');
    cy.get('[data-testid=report-type-rev-prog]').click();
    cy.url().should('include', '/reports/parameters');
    
    fillReportParameters({
      dateRange: 'Last 30 Days'
    });
    
    cy.get('[data-testid=generate-report-button]').click();
    cy.wait('@generateReport');
    cy.url().should('include', '/reports/view');
    
    // Export as PDF
    cy.get('[data-testid=export-button]').click();
    cy.get('[data-testid=export-format-pdf]').click();
    cy.wait('@exportReport');
    
    // Verify download starts
    cy.get('[data-testid=download-notification]').should('be.visible');
    
    // Export as Excel
    cy.get('[data-testid=export-button]').click();
    cy.get('[data-testid=export-format-excel]').click();
    cy.wait('@exportReport');
    
    // Verify download starts
    cy.get('[data-testid=download-notification]').should('be.visible');
    
    // Export as CSV
    cy.get('[data-testid=export-button]').click();
    cy.get('[data-testid=export-format-csv]').click();
    cy.wait('@exportReport');
    
    // Verify download starts
    cy.get('[data-testid=download-notification]').should('be.visible');
  });

  it('should schedule a report for recurring generation', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' }
      ],
      reportData: {
        title: 'Revenue by Program',
        subtitle: 'Last 30 Days',
        data: {
          programs: [
            { name: 'Personal Care', revenue: 456789.00, previousRevenue: 432567.00, change: 5.6 },
            { name: 'Residential', revenue: 345678.00, previousRevenue: 356789.00, change: -3.1 }
          ],
          total: {
            revenue: 802467.00,
            previousRevenue: 789356.00,
            change: 1.7
          }
        }
      }
    });
    
    // Generate a report first
    cy.get('[data-testid=create-report-button]').click();
    cy.url().should('include', '/reports/select');
    cy.get('[data-testid=report-type-rev-prog]').click();
    cy.url().should('include', '/reports/parameters');
    
    fillReportParameters({
      dateRange: 'Last 30 Days'
    });
    
    cy.get('[data-testid=generate-report-button]').click();
    cy.wait('@generateReport');
    cy.url().should('include', '/reports/view');
    
    // Schedule the report
    cy.get('[data-testid=schedule-button]').click();
    cy.url().should('include', '/reports/schedule');
    
    // Fill schedule form
    configureSchedule({
      name: 'Weekly Revenue Report',
      description: 'Automatically generated revenue report',
      frequency: 'Weekly',
      day: 'Monday',
      time: '08:00',
      formats: ['PDF', 'Excel'],
      recipients: ['finance@example.com', 'director@example.com'],
      active: true
    });
    
    // Save schedule
    cy.get('[data-testid=save-schedule-button]').click();
    cy.wait('@scheduleReport');
    
    // Verify success notification
    cy.get('[data-testid=success-notification]').should('be.visible');
    cy.get('[data-testid=success-notification]').should('contain', 'Schedule created successfully');
    
    // Verify schedule appears in list
    cy.visit('/reports/schedules');
    cy.get('[data-testid=scheduled-report-list]').should('be.visible');
    cy.get('[data-testid=scheduled-report-item]').should('contain', 'Weekly Revenue Report');
  });

  it('should allow editing and deleting scheduled reports', () => {
    // Mock API responses
    mockReportsApi({
      scheduledReports: [
        { 
          id: 'sch1', 
          name: 'Weekly Revenue Report', 
          description: 'Automatically generated revenue report',
          frequency: 'Weekly', 
          day: 'Monday',
          time: '08:00',
          formats: ['PDF', 'Excel'],
          recipients: ['finance@example.com', 'director@example.com'],
          active: true,
          nextRun: '2023-06-05T08:00:00Z',
          reportDefinitionId: 'rev-prog'
        }
      ]
    });
    
    // Navigate to scheduled reports
    cy.visit('/reports/schedules');
    cy.get('[data-testid=scheduled-report-list]').should('be.visible');
    
    // Edit a scheduled report
    cy.get('[data-testid=edit-schedule-sch1]').click();
    cy.url().should('include', '/reports/schedules/edit');
    
    // Modify schedule
    cy.get('[data-testid=schedule-name]').clear().type('Updated Weekly Revenue Report');
    cy.get('[data-testid=frequency-selector]').click();
    cy.get('[data-testid=frequency-option-biweekly]').click();
    
    // Save changes
    cy.get('[data-testid=save-schedule-button]').click();
    
    // Verify success notification
    cy.get('[data-testid=success-notification]').should('be.visible');
    cy.get('[data-testid=success-notification]').should('contain', 'Schedule updated successfully');
    
    // Delete a scheduled report
    cy.visit('/reports/schedules');
    cy.get('[data-testid=delete-schedule-sch1]').click();
    
    // Confirm deletion
    cy.get('[data-testid=confirm-deletion-button]').click();
    
    // Verify success notification
    cy.get('[data-testid=success-notification]').should('be.visible');
    cy.get('[data-testid=success-notification]').should('contain', 'Schedule deleted successfully');
    
    // Verify schedule no longer appears
    cy.get('[data-testid=scheduled-report-item]').should('not.exist');
  });

  it('should display saved report definitions and allow reuse', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { 
          id: 'custom1', 
          name: 'Custom Payer Analysis', 
          description: 'Analysis of claims and revenue by payer',
          category: 'Financial', 
          type: 'custom',
          dataSource: 'claims',
          fields: ['payer', 'claimsCount', 'revenue', 'denialRate'],
          filters: [
            { field: 'serviceDate', operator: 'between', value: ['2023-05-01', '2023-05-31'] }
          ],
          grouping: ['payer'],
          sorting: [{ field: 'revenue', direction: 'desc' }],
          visualization: 'barChart'
        }
      ]
    });
    
    // Navigate to saved report definitions
    cy.visit('/reports/definitions');
    cy.get('[data-testid=report-definitions-list]').should('be.visible');
    
    // Verify saved definition is displayed
    cy.get('[data-testid=report-definition-custom1]').should('contain', 'Custom Payer Analysis');
    
    // Click on saved definition
    cy.get('[data-testid=report-definition-custom1]').click();
    
    // Verify navigation to parameters page with pre-filled values
    cy.url().should('include', '/reports/parameters');
    
    // Verify pre-filled filters
    cy.get('[data-testid=filter-value-from]').should('have.value', '2023-05-01');
    cy.get('[data-testid=filter-value-to]').should('have.value', '2023-05-31');
    
    // Modify one parameter
    cy.get('[data-testid=filter-value-to]').clear().type('2023-06-30');
    
    // Generate report
    cy.get('[data-testid=generate-report-button]').click();
    cy.wait('@generateReport');
    
    // Verify report generation
    cy.url().should('include', '/reports/view');
    cy.get('[data-testid=report-title]').should('contain', 'Custom Payer Analysis');
  });

  it('should filter and search reports correctly', () => {
    // Mock API responses
    mockReportsApi({
      reportDefinitions: [
        { id: 'rev-prog', name: 'Revenue by Program', category: 'Financial', type: 'standard' },
        { id: 'claims-status', name: 'Claims Status', category: 'Claims', type: 'standard' },
        { id: 'ar-aging', name: 'AR Aging', category: 'Financial', type: 'standard' },
        { id: 'custom1', name: 'Custom Payer Analysis', category: 'Financial', type: 'custom' }
      ]
    });
    
    // Navigate to reports list
    cy.visit('/reports/definitions');
    
    // Filter by category
    cy.get('[data-testid=category-filter]').click();
    cy.get('[data-testid=category-option-financial]').click();
    
    // Verify filtered results
    cy.get('[data-testid=report-definition-rev-prog]').should('be.visible');
    cy.get('[data-testid=report-definition-ar-aging]').should('be.visible');
    cy.get('[data-testid=report-definition-custom1]').should('be.visible');
    cy.get('[data-testid=report-definition-claims-status]').should('not.exist');
    
    // Search for specific report
    cy.get('[data-testid=search-input]').type('Revenue');
    
    // Verify search results
    cy.get('[data-testid=report-definition-rev-prog]').should('be.visible');
    cy.get('[data-testid=report-definition-ar-aging]').should('not.exist');
    cy.get('[data-testid=report-definition-custom1]').should('not.exist');
    
    // Clear filters
    cy.get('[data-testid=clear-filters-button]').click();
    
    // Verify all reports are displayed
    cy.get('[data-testid=report-definition-rev-prog]').should('be.visible');
    cy.get('[data-testid=report-definition-claims-status]').should('be.visible');
    cy.get('[data-testid=report-definition-ar-aging]').should('be.visible');
    cy.get('[data-testid=report-definition-custom1]').should('be.visible');
  });

  it('should be accessible', () => {
    // Visit the reports dashboard page
    cy.visit('/reports');
    
    // Check basic accessibility features
    cy.get('main').should('have.attr', 'role', 'main');
    cy.get('button').should('have.attr', 'aria-label');
    cy.get('input').should('have.attr', 'aria-label');
    
    // Visit the report generation page
    cy.visit('/reports/select');
    cy.get('main').should('have.attr', 'role', 'main');
    
    // Visit the report viewer page
    cy.visit('/reports/view/mock-report-id');
    cy.get('main').should('have.attr', 'role', 'main');
    
    // Note: In a real implementation, you would use cypress-axe for comprehensive accessibility testing:
    // cy.injectAxe();
    // cy.checkA11y();
  });
});