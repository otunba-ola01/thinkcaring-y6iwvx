import { ClaimStatus } from '../../src/types/claims.types';
import { BillingStatus, DocumentationStatus } from '../../src/types/services.types';
import { SubmissionMethod } from '../../src/types/claims.types';

describe('Billing Module', () => {
  before(() => {
    // Set up test data and API mocks
    cy.intercept('GET', '/api/billing/dashboard-metrics', {
      statusCode: 200,
      body: {
        unbilledServicesCount: 15,
        unbilledServicesAmount: 1245.75,
        incompleteDocumentationCount: 3,
        pendingClaimsCount: 5,
        pendingClaimsAmount: 2500.0,
        upcomingFilingDeadlines: [
          { serviceCount: 5, daysRemaining: 10, amount: 750.0 },
          { serviceCount: 3, daysRemaining: 30, amount: 450.0 }
        ],
        recentBillingActivity: [
          { date: '2023-06-01', claimsSubmitted: 3, amount: 1200.0 },
          { date: '2023-06-02', claimsSubmitted: 2, amount: 800.0 }
        ]
      }
    }).as('getBillingMetrics');

    cy.intercept('GET', '/api/billing/queue*', {
      statusCode: 200,
      fixture: 'billing-queue.json'
    }).as('getBillingQueue');

    cy.intercept('POST', '/api/billing/validate-services', {
      statusCode: 200,
      fixture: 'validation-results.json'
    }).as('validateServices');

    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      fixture: 'claim-creation-result.json'
    }).as('createClaim');

    cy.intercept('POST', '/api/billing/submit-claim', {
      statusCode: 200,
      fixture: 'submission-result.json'
    }).as('submitClaim');
  });

  beforeEach(() => {
    // Log in and navigate to billing dashboard
    cy.loginAsBillingSpecialist();
    cy.navigateToBillingDashboard();
    cy.wait('@getBillingMetrics');
  });

  it('should display billing dashboard with metrics', () => {
    // Verify dashboard metrics
    cy.get('[data-testid="unbilled-services-metric"]').should('contain', '15');
    cy.get('[data-testid="unbilled-amount-metric"]').should('contain', '$1,245.75');
    cy.get('[data-testid="incomplete-documentation-metric"]').should('contain', '3');
    cy.get('[data-testid="pending-claims-metric"]').should('contain', '5');
    
    // Verify recent activity chart is displayed
    cy.get('[data-testid="recent-billing-chart"]').should('be.visible');
    
    // Verify upcoming deadlines section
    cy.get('[data-testid="upcoming-deadlines"]').within(() => {
      cy.contains('5 services due in 10 days');
      cy.contains('3 services due in 30 days');
    });
    
    // Verify quick action buttons are functional
    cy.get('[data-testid="create-claim-button"]').should('be.visible');
    cy.get('[data-testid="import-remittance-button"]').should('be.visible');
  });

  it('should navigate to billing queue from dashboard', () => {
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.url().should('include', '/billing/queue');
    cy.get('[data-testid="billing-queue-table"]').should('be.visible');
    cy.get('[data-testid="filter-controls"]').should('be.visible');
    cy.get('[data-testid="action-buttons"]').should('be.visible');
  });

  it('should filter services in billing queue', () => {
    // Navigate to billing queue
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Apply client filter
    cy.get('[data-testid="client-filter"]').click();
    cy.get('[data-testid="client-option-client-id-1"]').click();
    cy.wait('@getBillingQueue');
    cy.get('[data-testid="service-row"]').should('have.length.greaterThan', 0);
    
    // Apply date range filter
    cy.get('[data-testid="date-range-filter"]').click();
    cy.get('[data-testid="date-range-last-30-days"]').click();
    cy.wait('@getBillingQueue');
    
    // Apply documentation status filter
    cy.get('[data-testid="documentation-status-filter"]').click();
    cy.get(`[data-testid="status-option-${DocumentationStatus.COMPLETE}"]`).click();
    cy.wait('@getBillingQueue');
    
    // Reset filters
    cy.get('[data-testid="reset-filters-button"]').click();
    cy.wait('@getBillingQueue');
    cy.get('[data-testid="service-row"]').should('have.length.greaterThan', 0);
  });

  it('should select services and proceed to validation', () => {
    // Navigate to billing queue
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select multiple services
    cy.get('[data-testid="service-checkbox"]').first().check();
    cy.get('[data-testid="service-checkbox"]').eq(1).check();
    
    // Verify selection count and total amount updates
    cy.get('[data-testid="selected-count"]').should('contain', '2');
    cy.get('[data-testid="selected-amount"]').should('be.visible');
    
    // Click validate services button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Verify navigation to validation page
    cy.url().should('include', '/billing/validate');
    cy.get('[data-testid="validation-table"]').should('be.visible');
  });

  it('should validate services successfully', () => {
    // Navigate to billing queue and select services with complete documentation
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select services with complete documentation
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.COMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    
    // Click validate services button
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    
    // Verify validation success
    cy.get('[data-testid="validation-success-message"]').should('be.visible');
    cy.get('[data-testid="validation-results"]').should('not.contain', 'Error');
    cy.get('[data-testid="proceed-to-claim-button"]').should('be.enabled');
  });

  it('should display validation errors for incomplete services', () => {
    // Navigate to billing queue and select services with incomplete documentation
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select services with incomplete documentation
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.INCOMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    
    // Click validate services button
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    
    // Verify validation errors
    cy.get('[data-testid="validation-error-message"]').should('be.visible');
    cy.get('[data-testid="validation-results"]').should('contain', 'Error');
    cy.get('[data-testid="fix-issues-button"]').should('be.visible');
    cy.get('[data-testid="proceed-to-claim-button"]').should('be.disabled');
  });

  it('should allow fixing validation issues', () => {
    // Navigate to billing queue and select services with incomplete documentation
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select services with incomplete documentation
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.INCOMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    
    // Click validate services button
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    
    // Click fix issues button for a specific service
    cy.get('[data-testid="fix-issues-button"]').first().click();
    
    // Verify navigation to service edit page
    cy.url().should('include', '/services/edit/');
    
    // Complete missing documentation
    cy.get('[data-testid="documentation-status-select"]').click();
    cy.get(`[data-testid="status-option-${DocumentationStatus.COMPLETE}"]`).click();
    cy.get('[data-testid="save-service-button"]').click();
    
    // Verify navigation back to validation page
    cy.url().should('include', '/billing/validate');
    cy.get('[data-testid="validation-results"]').should('contain', 'Valid');
  });

  it('should create claim from validated services', () => {
    // Navigate to billing queue and select services with complete documentation
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select services with complete documentation
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.COMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    
    // Click validate services button
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    
    // Click proceed to claim button
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Verify navigation to claim creation page
    cy.url().should('include', '/billing/create-claim');
    
    // Select payer and add notes
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-testid="payer-option-payer-id-1"]').click();
    cy.get('[data-testid="claim-notes"]').type('Automated test claim');
    
    // Create claim
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaim');
    
    // Verify success and claim details
    cy.get('[data-testid="claim-success-message"]').should('be.visible');
    cy.get('[data-testid="claim-details"]').should('be.visible');
    cy.get('[data-testid="proceed-to-submission-button"]').should('be.enabled');
  });

  it('should submit claim electronically', () => {
    // Complete claim creation steps
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.COMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-testid="payer-option-payer-id-1"]').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaim');
    
    // Navigate to submission page
    cy.get('[data-testid="proceed-to-submission-button"]').click();
    
    // Select electronic submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-testid="method-option-${SubmissionMethod.ELECTRONIC}"]`).click();
    
    // Submit claim
    cy.get('[data-testid="submit-claim-button"]').click();
    cy.wait('@submitClaim');
    
    // Verify submission success
    cy.get('[data-testid="submission-success-message"]').should('be.visible');
    cy.get('[data-testid="confirmation-number"]').should('be.visible');
    cy.get('[data-testid="claim-status"]').should('contain', ClaimStatus.SUBMITTED);
    
    // Verify view claim button and navigation
    cy.get('[data-testid="view-claim-button"]').should('be.visible');
    cy.get('[data-testid="view-claim-button"]').click();
    cy.url().should('include', '/claims/view/');
  });

  it('should submit claim via paper', () => {
    // Complete claim creation steps
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    cy.get('[data-testid="service-row"]')
      .contains(DocumentationStatus.COMPLETE)
      .parent()
      .find('[data-testid="service-checkbox"]')
      .check();
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-testid="payer-option-payer-id-1"]').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaim');
    
    // Navigate to submission page
    cy.get('[data-testid="proceed-to-submission-button"]').click();
    
    // Select paper submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-testid="method-option-${SubmissionMethod.PAPER}"]`).click();
    
    // Submit claim
    cy.get('[data-testid="submit-claim-button"]').click();
    cy.wait('@submitClaim');
    
    // Verify submission success
    cy.get('[data-testid="submission-success-message"]').should('be.visible');
    cy.get('[data-testid="claim-status"]').should('contain', ClaimStatus.SUBMITTED);
    
    // Verify print claim button
    cy.get('[data-testid="print-claim-button"]').should('be.visible');
    cy.get('[data-testid="print-claim-button"]').click();
    // Note: Testing the print dialog is typically not possible in Cypress,
    // so we're just verifying the button exists and can be clicked
  });

  it('should complete the entire billing workflow', () => {
    // Navigate to billing dashboard
    cy.navigateToBillingDashboard();
    
    // Click create claim quick action button
    cy.get('[data-testid="create-claim-button"]').click();
    
    // Select client and date range
    cy.get('[data-testid="client-select"]').click();
    cy.get('[data-testid="client-option-client-id-1"]').click();
    cy.get('[data-testid="date-range-select"]').click();
    cy.get('[data-testid="date-range-last-30-days"]').click();
    
    // Wait for services to load
    cy.wait('@getBillingQueue');
    
    // Select multiple services
    cy.get('[data-testid="service-checkbox"]').first().check();
    cy.get('[data-testid="service-checkbox"]').eq(1).check();
    
    // Validate services
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    
    // Verify validation success
    cy.get('[data-testid="validation-success-message"]').should('be.visible');
    
    // Proceed to claim creation
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Select payer and add notes
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-testid="payer-option-payer-id-1"]').click();
    cy.get('[data-testid="claim-notes"]').type('Complete workflow test');
    
    // Create claim
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaim');
    
    // Verify claim creation success
    cy.get('[data-testid="claim-success-message"]').should('be.visible');
    
    // Proceed to submission
    cy.get('[data-testid="proceed-to-submission-button"]').click();
    
    // Select submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-testid="method-option-${SubmissionMethod.ELECTRONIC}"]`).click();
    
    // Submit claim
    cy.get('[data-testid="submit-claim-button"]').click();
    cy.wait('@submitClaim');
    
    // Verify submission success
    cy.get('[data-testid="submission-success-message"]').should('be.visible');
    
    // Return to dashboard
    cy.get('[data-testid="return-to-dashboard-button"]').click();
    
    // Verify navigation back to dashboard
    cy.url().should('include', '/billing');
    cy.wait('@getBillingMetrics');
    
    // Verify dashboard metrics are updated
    cy.get('[data-testid="unbilled-services-metric"]').should('be.visible');
  });

  it('should be accessible', () => {
    // Check accessibility of billing dashboard
    cy.checkAccessibility();
    
    // Navigate to billing queue and check accessibility
    cy.get('[data-testid="view-billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    cy.checkAccessibility();
    
    // Navigate to validation page and check accessibility
    cy.get('[data-testid="service-checkbox"]').first().check();
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateServices');
    cy.checkAccessibility();
    
    // Navigate to claim creation page and check accessibility
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    cy.checkAccessibility();
    
    // Navigate to submission page and check accessibility
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-testid="payer-option-payer-id-1"]').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaim');
    cy.get('[data-testid="proceed-to-submission-button"]').click();
    cy.checkAccessibility();
  });
});