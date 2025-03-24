/// <reference types="cypress" />

import { LoginCredentials } from '../../src/types/auth.types';

/**
 * Cypress end-to-end tests for the Dashboard functionality of the HCBS Revenue Management System.
 * These tests verify that dashboard components, metrics, charts, and interactive elements
 * are functioning correctly.
 */
describe('Dashboard', () => {
  beforeEach(() => {
    // Intercept API requests to mock dashboard data
    cy.intercept('GET', '/api/dashboard/metrics', {
      statusCode: 200,
      body: {
        metrics: {
          revenue: {
            currentPeriodRevenue: 1245678,
            previousPeriodRevenue: 1112345,
            changePercentage: 12,
            ytdRevenue: 5678901,
            previousYtdRevenue: 5234567,
            ytdChangePercentage: 8.5,
            projectedRevenue: 12500000
          },
          claims: {
            totalClaims: 390,
            totalAmount: 1245678,
            statusBreakdown: [
              { status: 'DRAFT', count: 24, amount: 45678 },
              { status: 'SUBMITTED', count: 56, amount: 123456 },
              { status: 'PENDING', count: 45, amount: 98765 },
              { status: 'PAID', count: 210, amount: 876543 },
              { status: 'DENIED', count: 15, amount: 34567 },
              { status: 'APPEALED', count: 40, amount: 66669 }
            ],
            denialRate: 8.2,
            cleanClaimRate: 75,
            averageProcessingTime: 12.5
          },
          alerts: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              title: 'Claims approaching filing deadline',
              message: '5 claims are approaching their filing deadline',
              category: 'CLAIMS',
              severity: 'WARNING',
              timestamp: '2023-06-01T08:30:00Z',
              read: false,
              actionUrl: '/claims?filter=approaching-deadline'
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              title: 'Denied claims need attention',
              message: '3 claims were denied and need attention',
              category: 'CLAIMS',
              severity: 'ERROR',
              timestamp: '2023-06-01T09:15:00Z',
              read: false,
              actionUrl: '/claims?status=denied'
            }
          ]
        },
        timestamp: '2023-06-01T10:00:00Z'
      }
    }).as('dashboardMetrics');

    // Intercept recent claims API
    cy.intercept('GET', '/api/claims/recent', {
      statusCode: 200,
      body: {
        claims: [
          {
            id: 'C10045',
            clientName: 'Smith, John',
            serviceType: 'Personal',
            amount: 1245.00,
            status: 'PENDING',
            payer: 'Medicaid',
            age: 5
          },
          {
            id: 'C10044',
            clientName: 'Doe, Jane',
            serviceType: 'Respite',
            amount: 2340.00,
            status: 'PAID',
            payer: 'Medicaid',
            age: 8
          },
          {
            id: 'C10043',
            clientName: 'Brown, Bob',
            serviceType: 'Day Svc',
            amount: 1890.00,
            status: 'DENIED',
            payer: 'Medicare',
            age: 12
          },
          {
            id: 'C10042',
            clientName: 'Lee, Anna',
            serviceType: 'Resident',
            amount: 3450.00,
            status: 'SUBMITTED',
            payer: 'Medicaid',
            age: 2
          },
          {
            id: 'C10041',
            clientName: 'Chen, Mike',
            serviceType: 'Personal',
            amount: 1120.00,
            status: 'PAID',
            payer: 'Private Pay',
            age: 15
          }
        ]
      }
    }).as('recentClaims');

    // Login as a financial manager
    // Note: In a real implementation, you might want to use a custom command
    // that logs in via API to speed up tests
    const credentials: LoginCredentials = {
      email: 'financial.manager@example.com',
      password: 'Password123!',
      rememberMe: false
    };

    cy.visit('/login');
    cy.get('input[name="email"]').type(credentials.email);
    cy.get('input[name="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    
    // Navigate to dashboard
    cy.visit('/dashboard');
    
    // Wait for dashboard data to load
    cy.wait('@dashboardMetrics');
    cy.wait('@recentClaims');
    
    // Verify dashboard title is visible
    cy.get(dashboardTitle).should('be.visible');
  });

  /**
   * Test case: Verify the financial overview section displays correct metrics
   * Requirements: F-101 Financial Overview Dashboard
   */
  it('should display the financial overview section with correct metrics', () => {
    // Verify revenue metrics section is visible
    cy.get(revenueMetricsSection).should('be.visible');
    
    // Check total revenue metric
    cy.get(totalRevenueMetric).should('be.visible')
      .and('contain', '$1,245,678');
    
    // Check revenue change percentage
    cy.get('[data-testid="metric-revenue-change"]').should('be.visible')
      .and('contain', '+12%');
    
    // Check claims metrics
    cy.get(claimsStatusSection).should('be.visible');
    
    // Verify clean claim rate
    cy.get('[data-testid="metric-clean-claim-rate"]').should('be.visible')
      .and('contain', '75%');
    
    // Verify total claims count
    cy.get('[data-testid="metric-total-claims"]').should('be.visible')
      .and('contain', '390');
  });

  /**
   * Test case: Verify revenue metrics charts display correctly
   * Requirements: F-102 Revenue Metrics Visualization
   */
  it('should display revenue metrics charts', () => {
    // Verify revenue section is visible
    cy.get(revenueMetricsSection).should('be.visible');
    
    // Verify revenue by program chart
    cy.get('[data-testid="revenue-by-program-chart"]').should('be.visible');
    
    // Verify revenue trend chart
    cy.get('[data-testid="revenue-trend-chart"]').should('be.visible');
    
    // Verify chart legends are visible
    cy.get('[data-testid="revenue-by-program-chart"] .recharts-legend-item')
      .should('have.length.at.least', 1);
    
    // Test chart tooltip functionality
    cy.get('[data-testid="revenue-by-program-chart"] .recharts-bar-rectangle')
      .first()
      .trigger('mouseover', { force: true });
    
    // Verify tooltip appears with data
    cy.get('.recharts-tooltip-wrapper').should('be.visible')
      .and('contain', '$');
  });

  /**
   * Test case: Verify claims status breakdown displays correctly
   * Requirements: F-103 Claims Status Tracking
   */
  it('should display claims status breakdown', () => {
    // Verify claims status section is visible
    cy.get(claimsStatusSection).should('be.visible');
    
    // Verify claims status chart is displayed
    cy.get('[data-testid="claims-status-chart"]').should('be.visible');
    
    // Verify status counts for each claim status
    cy.get(claimsStatusSection).within(() => {
      cy.contains('Submitted: 56').should('be.visible');
      cy.contains('Pending: 45').should('be.visible');
      cy.contains('Paid: 210').should('be.visible');
      cy.contains('Denied: 15').should('be.visible');
    });
    
    // Verify chart has segments for each status
    cy.get('[data-testid="claims-status-chart"] .recharts-pie-sector')
      .should('have.length.at.least', 5);
  });

  /**
   * Test case: Verify alert notifications display correctly
   * Requirements: F-104 Alert Notification System
   */
  it('should display alert notifications', () => {
    // Verify alerts section is visible
    cy.get(alertsSection).should('be.visible');
    
    // Verify alerts are displayed
    cy.get('[data-testid="alert-item"]').should('have.length.at.least', 2);
    
    // Verify first alert content
    cy.get('[data-testid="alert-item"]').first()
      .should('contain', 'Claims approaching filing deadline')
      .and('contain', '5 claims');
    
    // Verify second alert content
    cy.get('[data-testid="alert-item"]').eq(1)
      .should('contain', 'Denied claims need attention')
      .and('contain', '3 claims');
    
    // Verify alert severity indicators
    cy.get('[data-testid="alert-item"]').first()
      .find('[data-testid="alert-severity-warning"]')
      .should('be.visible');
    
    cy.get('[data-testid="alert-item"]').eq(1)
      .find('[data-testid="alert-severity-error"]')
      .should('be.visible');
    
    // Test alert interaction - clicking on an alert
    cy.intercept('POST', '/api/alerts/*/read', {
      statusCode: 200,
      body: { success: true }
    }).as('markAlertRead');
    
    cy.get('[data-testid="alert-item"]').first().click();
    
    // Verify alert was marked as read
    cy.wait('@markAlertRead');
    cy.get('[data-testid="alert-item"]').first().should('have.class', 'read');
  });

  /**
   * Test case: Verify recent claims table displays correctly
   * Requirements: Dashboard Layout (7.2.1)
   */
  it('should display recent claims table', () => {
    // Verify recent claims section is visible
    cy.get(recentClaimsSection).should('be.visible');
    
    // Verify table headers
    cy.get(`${recentClaimsSection} table thead tr th`).should('contain', 'Claim#');
    cy.get(`${recentClaimsSection} table thead tr th`).should('contain', 'Client');
    cy.get(`${recentClaimsSection} table thead tr th`).should('contain', 'Amount');
    cy.get(`${recentClaimsSection} table thead tr th`).should('contain', 'Status');
    cy.get(`${recentClaimsSection} table thead tr th`).should('contain', 'Payer');
    
    // Verify table has 5 claim rows
    cy.get(`${recentClaimsSection} table tbody tr`).should('have.length', 5);
    
    // Verify first claim data
    cy.get(`${recentClaimsSection} table tbody tr`).first().within(() => {
      cy.contains('C10045').should('be.visible');
      cy.contains('Smith, John').should('be.visible');
      cy.contains('$1,245.00').should('be.visible');
      cy.contains('Medicaid').should('be.visible');
    });
    
    // Verify status badges display correctly
    cy.get('[data-testid="status-badge-PENDING"]').should('be.visible');
    cy.get('[data-testid="status-badge-PAID"]').should('be.visible');
    cy.get('[data-testid="status-badge-DENIED"]').should('be.visible');
  });

  /**
   * Test case: Verify clicking on a claim navigates to claim details
   * Requirements: Dashboard Layout (7.2.1)
   */
  it('should navigate to claim details when clicking on a claim', () => {
    // Intercept claim details API
    cy.intercept('GET', '/api/claims/C10045*').as('claimDetails');
    
    // Click on first claim row
    cy.get(`${recentClaimsSection} table tbody tr`).first().click();
    
    // Verify navigation to claim details page
    cy.url().should('include', '/claims/C10045');
    cy.wait('@claimDetails');
  });

  /**
   * Test case: Verify dashboard filtering functionality
   * Requirements: F-101 Financial Overview Dashboard
   */
  it('should allow filtering dashboard data', () => {
    // Intercept filtered dashboard metrics API
    cy.intercept('GET', '/api/dashboard/metrics*', {
      statusCode: 200,
      body: {
        metrics: {
          revenue: {
            currentPeriodRevenue: 345678,
            previousPeriodRevenue: 312345,
            changePercentage: 10.5,
            ytdRevenue: 2678901,
            previousYtdRevenue: 2234567,
            ytdChangePercentage: 19.9,
            projectedRevenue: 5500000
          },
          claims: {
            totalClaims: 150,
            totalAmount: 345678,
            statusBreakdown: [
              { status: 'DRAFT', count: 10, amount: 15678 },
              { status: 'SUBMITTED', count: 20, amount: 43456 },
              { status: 'PENDING', count: 15, amount: 28765 },
              { status: 'PAID', count: 90, amount: 236543 },
              { status: 'DENIED', count: 5, amount: 14567 },
              { status: 'APPEALED', count: 10, amount: 16669 }
            ],
            denialRate: 6.5,
            cleanClaimRate: 80,
            averageProcessingTime: 10.5
          },
          alerts: []
        },
        timestamp: '2023-06-01T10:00:00Z'
      }
    }).as('filteredDashboardMetrics');
    
    // Select a different date range
    cy.get(dateRangeFilter).click();
    cy.get('.MuiMenu-list [data-value="last-90-days"]').click();
    
    // Select a program filter
    cy.get(programFilter).click();
    cy.get('.MuiMenu-list [data-value="personal-care"]').click();
    
    // Select a payer filter
    cy.get(payerFilter).click();
    cy.get('.MuiMenu-list [data-value="medicaid"]').click();
    
    // Verify API call with correct filters
    cy.wait('@filteredDashboardMetrics').then((interception) => {
      expect(interception.request.url).to.include('dateRange=last-90-days');
      expect(interception.request.url).to.include('program=personal-care');
      expect(interception.request.url).to.include('payer=medicaid');
    });
    
    // Verify dashboard updates with filtered data
    cy.get(totalRevenueMetric).should('contain', '$345,678');
    cy.get('[data-testid="metric-total-claims"]').should('contain', '150');
    cy.get('[data-testid="metric-clean-claim-rate"]').should('contain', '80%');
  });

  /**
   * Test case: Verify navigation from dashboard to detailed views
   * Requirements: Dashboard Layout (7.2.1)
   */
  it('should navigate to detailed views when clicking on section headers', () => {
    // Intercept API calls for navigation
    cy.intercept('GET', '/api/claims*').as('claimsList');
    
    // Click on View All Claims link
    cy.get(viewAllClaimsLink).click();
    
    // Verify navigation to claims list page
    cy.url().should('include', '/claims');
    cy.wait('@claimsList');
    
    // Navigate back to dashboard
    cy.visit('/dashboard');
    cy.wait('@dashboardMetrics');
    
    // Verify dashboard loaded
    cy.get(revenueMetricsSection).should('be.visible');
    
    // Click on revenue metrics header to see detailed view
    cy.intercept('GET', '/api/revenue/metrics*').as('revenueMetrics');
    cy.get(`${revenueMetricsSection} .section-header`).click();
    
    // Verify navigation to revenue metrics page
    cy.url().should('include', '/revenue/metrics');
    cy.wait('@revenueMetrics');
  });

  /**
   * Test case: Verify dashboard accessibility
   * Requirements: Cross-cutting accessibility concerns
   */
  it('should be accessible', () => {
    // Note: This requires cypress-axe to be installed and configured
    cy.injectAxe();
    cy.checkA11y({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      },
      // Exclude third-party elements that might cause false positives
      exclude: ['.recharts-wrapper']
    });
  });

  /**
   * Test case: Verify dashboard displays correctly on mobile viewport
   * Requirements: Dashboard Layout (7.2.1)
   */
  it('should display correctly on mobile viewport', () => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');
    
    // Reload to ensure mobile layout is applied
    cy.reload();
    cy.wait('@dashboardMetrics');
    
    // Verify key sections are visible in mobile layout
    cy.get(revenueMetricsSection).should('be.visible');
    cy.get(claimsStatusSection).should('be.visible');
    cy.get(alertsSection).should('be.visible');
    
    // Verify responsive chart display
    cy.get('[data-testid="revenue-by-program-chart"]').should('be.visible');
    cy.get('[data-testid="claims-status-chart"]').should('be.visible');
    
    // Verify metrics are visible
    cy.get(totalRevenueMetric).should('be.visible');
    cy.get('[data-testid="metric-clean-claim-rate"]').should('be.visible');
    
    // Verify mobile-specific class or styles are applied
    cy.get('[data-testid="dashboard-container"]').should('have.class', 'mobile-view');
  });
});

// Selector constants to avoid repetition
const dashboardTitle = "h1:contains('Dashboard')";
const revenueMetricsSection = "[data-testid='revenue-metrics-section']";
const totalRevenueMetric = "[data-testid='metric-total-revenue']";
const claimsStatusSection = "[data-testid='claims-status-section']";
const alertsSection = "[data-testid='alerts-section']";
const recentClaimsSection = "[data-testid='recent-claims-section']";
const dateRangeFilter = "[data-testid='date-range-filter']";
const programFilter = "[data-testid='program-filter']";
const payerFilter = "[data-testid='payer-filter']";
const viewAllClaimsLink = "[data-testid='view-all-claims']";