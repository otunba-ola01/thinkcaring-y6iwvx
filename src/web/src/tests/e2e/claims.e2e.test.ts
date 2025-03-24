import { ClaimStatus, ClaimType, SubmissionMethod } from '../../types/claims.types';
import { UUID } from '../../types/common.types';
import cy from 'cypress'; // v12.0.0

describe('Claims Management Flow', () => {
  beforeEach(() => {
    // Login and setup for each test
    cy.login('billing_specialist@thinkcaring.com', 'Password123!');
    cy.intercept('GET', '/api/claims*').as('getClaims');
    cy.intercept('GET', '/api/claims/dashboard*').as('getClaimsDashboard');
    cy.visit('/claims');
    cy.wait('@getClaims');
  });

  it('should display claims list page with required elements', () => {
    cy.get('h1').should('contain', 'Claims Management');
    cy.get('[data-testid="new-claim-button"]').should('exist');
    cy.get('[data-testid="batch-upload-button"]').should('exist');
    cy.get('[data-testid="claims-filter-panel"]').should('exist');
    
    // Check table headers
    cy.get('[data-testid="claims-table"]').should('exist')
      .within(() => {
        cy.get('th').should('contain', 'Claim#');
        cy.get('th').should('contain', 'Client');
        cy.get('th').should('contain', 'Service');
        cy.get('th').should('contain', 'Amount');
        cy.get('th').should('contain', 'Status');
        cy.get('th').should('contain', 'Payer');
        cy.get('th').should('contain', 'Age');
      });
    
    // Check pagination controls
    cy.get('[data-testid="pagination-controls"]').should('exist');
    
    // Check claims summary section
    cy.get('[data-testid="claims-summary"]').should('exist')
      .within(() => {
        cy.get('[data-testid="status-breakdown"]').should('exist');
        cy.get('[data-testid="financial-summary"]').should('exist');
      });
  });

  it('should filter claims by status', () => {
    // Test filtering by different statuses
    cy.intercept('GET', '/api/claims*status=submitted*').as('getSubmittedClaims');
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="submitted"]').click();
    cy.wait('@getSubmittedClaims');
    cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('td[data-field="status"]').should('contain', 'Submitted');
    });
    
    cy.intercept('GET', '/api/claims*status=pending*').as('getPendingClaims');
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="pending"]').click();
    cy.wait('@getPendingClaims');
    cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('td[data-field="status"]').should('contain', 'Pending');
    });
    
    cy.intercept('GET', '/api/claims*status=paid*').as('getPaidClaims');
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="paid"]').click();
    cy.wait('@getPaidClaims');
    cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('td[data-field="status"]').should('contain', 'Paid');
    });
    
    cy.intercept('GET', '/api/claims*status=denied*').as('getDeniedClaims');
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="denied"]').click();
    cy.wait('@getDeniedClaims');
    cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('td[data-field="status"]').should('contain', 'Denied');
    });
  });

  it('should filter claims by date range', () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    cy.intercept('GET', `/api/claims*startDate=${startDate}*endDate=${endDate}*`).as('getDateFilteredClaims');
    
    cy.get('[data-testid="date-range-filter"]').click();
    cy.get('[data-testid="date-picker-start"]').type(startDate);
    cy.get('[data-testid="date-picker-end"]').type(endDate);
    cy.get('[data-testid="apply-date-filter"]').click();
    
    cy.wait('@getDateFilteredClaims');
    
    // Verify the filtered results
    cy.get('@getDateFilteredClaims.all').should('have.length.at.least', 1);
  });

  it('should filter claims by payer', () => {
    cy.intercept('GET', '/api/claims*payerId=*').as('getPayerFilteredClaims');
    
    cy.get('[data-testid="payer-filter"]').click();
    cy.get('[data-value="payer1"]').click(); // Assuming payer ID exists
    
    cy.wait('@getPayerFilteredClaims');
    
    // Verify the results are filtered by payer
    cy.get('[data-testid="claims-table"] tbody tr').should('have.length.at.least', 1);
  });

  it('should search claims by claim number or client name', () => {
    const searchTerm = 'C10043';
    
    cy.intercept('GET', `/api/claims*search=${searchTerm}*`).as('getSearchResults');
    
    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.get('[data-testid="search-button"]').click();
    
    cy.wait('@getSearchResults');
    
    // Verify search results contain the search term
    cy.get('[data-testid="claims-table"] tbody tr').should('have.length.at.least', 1);
    cy.get('[data-testid="claims-table"] tbody tr:first td[data-field="claimNumber"]').should('contain', searchTerm);
    
    // Clear and search by client name
    cy.get('[data-testid="search-input"]').clear();
    
    const clientName = 'Smith';
    cy.intercept('GET', `/api/claims*search=${clientName}*`).as('getClientSearchResults');
    
    cy.get('[data-testid="search-input"]').type(clientName);
    cy.get('[data-testid="search-button"]').click();
    
    cy.wait('@getClientSearchResults');
    
    // Verify client search results
    cy.get('[data-testid="claims-table"] tbody tr').should('have.length.at.least', 1);
    cy.get('[data-testid="claims-table"] tbody tr:first td[data-field="clientName"]').should('contain', clientName);
  });

  it('should navigate to claim detail page when clicking on a claim', () => {
    // Intercept the claim detail API request
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    
    // Click on the first claim in the table
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for the claim detail API request
    cy.wait('@getClaimDetail');
    
    // Verify URL has changed to claim detail page
    cy.url().should('include', '/claims/');
    
    // Verify claim detail page elements
    cy.get('[data-testid="claim-header"]').should('exist');
    cy.get('[data-testid="claim-status"]').should('exist');
    cy.get('[data-testid="claim-tabs"]').should('exist');
    cy.get('[data-testid="services-tab"]').should('have.class', 'active');
    cy.get('[data-testid="claim-services-table"]').should('exist');
  });

  it('should navigate to create claim page when clicking New Claim button', () => {
    // Click on the New Claim button
    cy.get('[data-testid="new-claim-button"]').click();
    
    // Verify URL has changed to new claim page
    cy.url().should('include', '/claims/new');
    
    // Verify elements on the create claim page
    cy.get('[data-testid="claim-wizard"]').should('exist');
    cy.get('[data-testid="step-1"]').should('have.class', 'active');
    cy.get('[data-testid="client-select"]').should('exist');
    cy.get('[data-testid="program-select"]').should('exist');
    cy.get('[data-testid="date-range-select"]').should('exist');
    cy.get('[data-testid="service-selection-table"]').should('exist');
  });

  it('should create a new claim successfully', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/clients*').as('getClients');
    cy.intercept('GET', '/api/services*').as('getServices');
    cy.intercept('GET', '/api/payers*').as('getPayers');
    cy.intercept('POST', '/api/claims').as('createClaim');
    
    // Navigate to new claim page
    cy.visit('/claims/new');
    
    // Wait for clients to load
    cy.wait('@getClients');
    
    // Step 1: Select client and services
    cy.get('[data-testid="client-select"]').click();
    cy.get('[data-value="client1"]').click(); // Assuming client ID exists
    
    cy.get('[data-testid="program-select"]').click();
    cy.get('[data-value="program1"]').click(); // Assuming program ID exists
    
    // Set date range
    cy.get('[data-testid="date-range-select"]').click();
    cy.get('[data-value="last-30-days"]').click();
    
    // Wait for services to load
    cy.wait('@getServices');
    
    // Select services
    cy.get('[data-testid="service-checkbox"]:first').check();
    cy.get('[data-testid="service-checkbox"]:nth(1)').check();
    
    // Verify selected services count and total amount updates
    cy.get('[data-testid="selected-services-count"]').should('contain', '2');
    cy.get('[data-testid="selected-services-amount"]').should('exist');
    
    // Continue to step 2
    cy.get('[data-testid="continue-button"]').click();
    
    // Step 2: Review and validate
    cy.get('[data-testid="step-2"]').should('have.class', 'active');
    
    // Wait for payers to load
    cy.wait('@getPayers');
    
    // Select payer
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-value="payer1"]').click(); // Assuming payer ID exists
    
    // Validate claim
    cy.get('[data-testid="validate-button"]').click();
    
    // Assuming validation is successful
    cy.get('[data-testid="validation-success"]').should('exist');
    
    // Continue to step 3
    cy.get('[data-testid="continue-submit-button"]').click();
    
    // Step 3: Submit claim
    cy.get('[data-testid="step-3"]').should('have.class', 'active');
    
    // Select submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-value="${SubmissionMethod.ELECTRONIC}"]`).click();
    
    // Submit claim
    cy.get('[data-testid="submit-claim-button"]').click();
    
    // Wait for create claim API request
    cy.wait('@createClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify redirection to claims list
    cy.url().should('include', '/claims');
    
    // Verify new claim appears in the list
    cy.get('[data-testid="claims-table"]').should('contain', 'Submitted');
  });

  it('should show validation errors for invalid claim data', () => {
    // Navigate to new claim page
    cy.visit('/claims/new');
    
    // Try to continue without selecting client
    cy.get('[data-testid="continue-button"]').click();
    
    // Verify client validation error
    cy.get('[data-testid="client-select-error"]').should('contain', 'Client is required');
    
    // Select client but don't select services
    cy.get('[data-testid="client-select"]').click();
    cy.get('[data-value="client1"]').click();
    
    cy.get('[data-testid="continue-button"]').click();
    
    // Verify service selection validation error
    cy.get('[data-testid="service-selection-error"]').should('contain', 'At least one service must be selected');
    
    // Select client and services
    cy.get('[data-testid="program-select"]').click();
    cy.get('[data-value="program1"]').click();
    
    cy.get('[data-testid="date-range-select"]').click();
    cy.get('[data-value="last-30-days"]').click();
    
    cy.get('[data-testid="service-checkbox"]:first').check();
    
    // Continue to step 2
    cy.get('[data-testid="continue-button"]').click();
    
    // Try to continue to step 3 without selecting payer
    cy.get('[data-testid="continue-submit-button"]').click();
    
    // Verify payer validation error
    cy.get('[data-testid="payer-select-error"]').should('contain', 'Payer is required');
    
    // Select payer but don't validate claim
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-value="payer1"]').click();
    
    cy.get('[data-testid="continue-submit-button"]').click();
    
    // Verify validation required error
    cy.get('[data-testid="validation-required-error"]').should('contain', 'Claim must be validated before submission');
  });

  it('should edit an existing claim', () => {
    // Intercept API requests for a draft claim
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('PUT', '/api/claims/*').as('updateClaim');
    
    // Navigate to an existing draft claim's detail page
    cy.visit('/claims?status=draft');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click edit button
    cy.get('[data-testid="edit-claim-button"]').click();
    
    // Verify edit form is displayed
    cy.get('[data-testid="edit-claim-form"]').should('exist');
    
    // Modify payer selection
    cy.get('[data-testid="payer-select"]').click();
    cy.get('[data-value="payer2"]').click(); // Select a different payer
    
    // Add notes
    cy.get('[data-testid="claim-notes"]').clear().type('Updated claim notes for testing');
    
    // Save changes
    cy.get('[data-testid="save-button"]').click();
    
    // Wait for update claim API request
    cy.wait('@updateClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify claim details are updated
    cy.get('[data-testid="claim-payer"]').should('contain', 'Payer 2'); // Assuming payer2 has display name "Payer 2"
    cy.get('[data-testid="claim-notes"]').should('contain', 'Updated claim notes for testing');
  });

  it('should validate a claim before submission', () => {
    // Intercept API requests for a draft claim
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/validate').as('validateClaim');
    
    // Navigate to an existing draft claim's detail page
    cy.visit('/claims?status=draft');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click validate button
    cy.get('[data-testid="validate-claim-button"]').click();
    
    // Wait for validate claim API request
    cy.wait('@validateClaim').then((interception) => {
      const validationResult = interception.response?.body;
      
      if (validationResult.isValid) {
        // If validation passes
        cy.get('[data-testid="validation-success"]').should('exist');
        cy.get('[data-testid="claim-status"]').should('contain', 'Validated');
      } else {
        // If validation fails
        cy.get('[data-testid="validation-errors"]').should('exist');
        cy.get('[data-testid="validation-error-item"]').should('have.length.at.least', 1);
      }
    });
  });

  it('should submit a validated claim', () => {
    // Intercept API requests for a validated claim
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/submit').as('submitClaim');
    
    // Navigate to an existing validated claim's detail page
    cy.visit('/claims?status=validated');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click submit button
    cy.get('[data-testid="submit-claim-button"]').click();
    
    // Verify submission form is displayed
    cy.get('[data-testid="submit-claim-form"]').should('exist');
    
    // Select submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-value="${SubmissionMethod.ELECTRONIC}"]`).click();
    
    // Enter submission date (today)
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    cy.get('[data-testid="submission-date"]').type(today);
    
    // Enter external claim ID (optional)
    cy.get('[data-testid="external-claim-id"]').type('EXT12345');
    
    // Add submission notes
    cy.get('[data-testid="submission-notes"]').type('Test submission via Cypress');
    
    // Submit the claim
    cy.get('[data-testid="submit-button"]').click();
    
    // Wait for submit claim API request
    cy.wait('@submitClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify claim status is updated to SUBMITTED
    cy.get('[data-testid="claim-status"]').should('contain', 'Submitted');
    
    // Verify claim timeline is updated
    cy.get('[data-testid="claim-timeline"]').should('contain', 'Submitted');
  });

  it('should track claim status changes', () => {
    // Intercept API requests for a submitted claim
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/status').as('updateClaimStatus');
    
    // Navigate to an existing submitted claim's detail page
    cy.visit('/claims?status=submitted');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click update status button
    cy.get('[data-testid="update-status-button"]').click();
    
    // Verify status update form is displayed
    cy.get('[data-testid="status-update-form"]').should('exist');
    
    // Select new status: PENDING
    cy.get('[data-testid="status-select"]').click();
    cy.get(`[data-value="${ClaimStatus.PENDING}"]`).click();
    
    // Add status update notes
    cy.get('[data-testid="status-notes"]').type('Changing status to pending via Cypress test');
    
    // Click update button
    cy.get('[data-testid="update-status-button"]').click();
    
    // Wait for update claim status API request
    cy.wait('@updateClaimStatus');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify claim status is updated to PENDING
    cy.get('[data-testid="claim-status"]').should('contain', 'Pending');
    
    // Verify claim timeline is updated
    cy.get('[data-testid="claim-timeline"]').should('contain', 'Pending');
    
    // Test changing to PAID status
    cy.get('[data-testid="update-status-button"]').click();
    cy.get('[data-testid="status-select"]').click();
    cy.get(`[data-value="${ClaimStatus.PAID}"]`).click();
    
    // Enter adjudication date
    const adjudicationDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    cy.get('[data-testid="adjudication-date"]').type(adjudicationDate);
    
    // Add payment details (these fields would appear when PAID is selected)
    cy.get('[data-testid="payment-amount"]').type('1250.00');
    cy.get('[data-testid="payment-date"]').type(adjudicationDate);
    
    // Add status update notes
    cy.get('[data-testid="status-notes"]').type('Changing status to paid via Cypress test');
    
    // Click update button
    cy.get('[data-testid="update-status-button"]').click();
    
    // Wait for update claim status API request
    cy.wait('@updateClaimStatus');
    
    // Verify claim status is updated to PAID
    cy.get('[data-testid="claim-status"]').should('contain', 'Paid');
  });

  it('should handle claim denial and appeal process', () => {
    // Intercept API requests for a denied claim
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/appeal').as('appealClaim');
    
    // Navigate to an existing denied claim's detail page
    cy.visit('/claims?status=denied');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Verify claim status shows DENIED with appropriate styling
    cy.get('[data-testid="claim-status"]').should('contain', 'Denied')
      .should('have.class', 'status-denied');
    
    // Verify denial reason is displayed
    cy.get('[data-testid="denial-reason"]').should('exist');
    
    // Click appeal button
    cy.get('[data-testid="appeal-button"]').click();
    
    // Verify appeal form is displayed
    cy.get('[data-testid="appeal-form"]').should('exist');
    
    // Enter appeal reason
    cy.get('[data-testid="appeal-reason"]').type('Service was authorized under different authorization number');
    
    // Upload or select supporting documents
    cy.get('[data-testid="upload-document-button"]').click();
    cy.get('input[type=file]').selectFile('cypress/fixtures/authorization_document.pdf', { force: true });
    
    // Add appeal notes
    cy.get('[data-testid="appeal-notes"]').type('Appealing with corrected authorization information');
    
    // Click submit appeal button
    cy.get('[data-testid="submit-appeal-button"]').click();
    
    // Wait for appeal claim API request
    cy.wait('@appealClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify claim status is updated to APPEALED
    cy.get('[data-testid="claim-status"]').should('contain', 'Appealed');
    
    // Verify claim timeline is updated with appeal event
    cy.get('[data-testid="claim-timeline"]').should('contain', 'Appealed');
  });

  it('should process batch claim submission', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/claims*status=validated*').as('getValidatedClaims');
    cy.intercept('POST', '/api/claims/batch/validate').as('batchValidateClaims');
    cy.intercept('POST', '/api/claims/batch/submit').as('batchSubmitClaims');
    
    // Navigate to claims page
    cy.visit('/claims');
    
    // Filter claims to show only VALIDATED status
    cy.get('[data-testid="status-filter"]').click();
    cy.get(`[data-value="${ClaimStatus.VALIDATED}"]`).click();
    
    // Wait for validated claims to load
    cy.wait('@getValidatedClaims');
    
    // Select multiple claims using checkboxes
    cy.get('[data-testid="claims-table"] tbody tr:first [data-testid="claim-checkbox"]').check();
    cy.get('[data-testid="claims-table"] tbody tr:nth(1) [data-testid="claim-checkbox"]').check();
    
    // Click 'Submit Claims' batch action button
    cy.get('[data-testid="batch-actions-button"]').click();
    cy.get('[data-testid="submit-claims-action"]').click();
    
    // Verify batch submission form is displayed
    cy.get('[data-testid="batch-submission-form"]').should('exist');
    
    // Select submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get(`[data-value="${SubmissionMethod.ELECTRONIC}"]`).click();
    
    // Enter submission date
    const submissionDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    cy.get('[data-testid="submission-date"]').type(submissionDate);
    
    // Add submission notes
    cy.get('[data-testid="submission-notes"]').type('Batch submission via Cypress test');
    
    // Click submit button
    cy.get('[data-testid="submit-batch-button"]').click();
    
    // Wait for batch submit claims API request
    cy.wait('@batchSubmitClaims');
    
    // Verify success message is displayed with batch results
    cy.get('[data-testid="success-message"]').should('exist');
    cy.get('[data-testid="batch-results-summary"]').should('exist');
    
    // Verify claims are updated in the list
    cy.get('[data-testid="status-filter"]').click();
    cy.get(`[data-value="${ClaimStatus.SUBMITTED}"]`).click();
    cy.get('[data-testid="claims-table"] tbody tr').should('have.length.at.least', 2);
  });

  it('should display claims dashboard with metrics', () => {
    // Intercept claims dashboard metrics API request
    cy.intercept('GET', '/api/claims/dashboard/metrics*').as('getDashboardMetrics');
    
    // Navigate to claims dashboard page
    cy.visit('/claims/dashboard');
    
    // Wait for dashboard metrics to load
    cy.wait('@getDashboardMetrics');
    
    // Verify dashboard elements
    cy.get('[data-testid="dashboard-title"]').should('contain', 'Claims Dashboard');
    cy.get('[data-testid="claims-status-overview"]').should('exist');
    cy.get('[data-testid="claim-aging-chart"]').should('exist');
    cy.get('[data-testid="denial-rate-metrics"]').should('exist');
    cy.get('[data-testid="quick-actions"]').should('exist');
    cy.get('[data-testid="claims-metrics-charts"]').should('exist');
  });

  it('should display claim aging reports', () => {
    // Intercept claim aging API request
    cy.intercept('GET', '/api/claims/aging*').as('getClaimAging');
    
    // Navigate to claim aging report page
    cy.visit('/claims/reports/aging');
    
    // Wait for claim aging data to load
    cy.wait('@getClaimAging');
    
    // Verify aging report elements
    cy.get('[data-testid="report-title"]').should('contain', 'Claim Aging Report');
    
    // Verify aging buckets
    cy.get('[data-testid="aging-buckets"]').should('exist');
    cy.get('[data-testid="aging-bucket-0-30"]').should('exist');
    cy.get('[data-testid="aging-bucket-31-60"]').should('exist');
    cy.get('[data-testid="aging-bucket-61-90"]').should('exist');
    cy.get('[data-testid="aging-bucket-90-plus"]').should('exist');
    
    // Verify aging chart
    cy.get('[data-testid="aging-chart"]').should('exist');
    
    // Verify aging table
    cy.get('[data-testid="aging-table"]').should('exist');
    
    // Verify aging summary
    cy.get('[data-testid="aging-summary"]').should('exist');
    cy.get('[data-testid="aging-total"]').should('exist');
  });

  it('should void a claim', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/void').as('voidClaim');
    
    // Navigate to an existing claim's detail page
    cy.visit('/claims');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click void button
    cy.get('[data-testid="void-claim-button"]').click();
    
    // Verify void confirmation dialog is displayed
    cy.get('[data-testid="void-confirmation-dialog"]').should('exist');
    
    // Enter void reason
    cy.get('[data-testid="void-reason"]').type('Duplicate claim submission');
    
    // Add void notes
    cy.get('[data-testid="void-notes"]').type('Voiding claim via Cypress test');
    
    // Click confirm button
    cy.get('[data-testid="confirm-void-button"]').click();
    
    // Wait for void claim API request
    cy.wait('@voidClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify claim status is updated to VOID
    cy.get('[data-testid="claim-status"]').should('contain', 'Void');
    
    // Verify claim timeline is updated with void event
    cy.get('[data-testid="claim-timeline"]').should('contain', 'Void');
  });

  it('should create an adjustment claim', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/claims/*').as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/adjustment').as('createAdjustmentClaim');
    
    // Navigate to an existing paid claim's detail page
    cy.visit('/claims?status=paid');
    cy.get('[data-testid="claims-table"] tbody tr:first').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Click create adjustment button
    cy.get('[data-testid="create-adjustment-button"]').click();
    
    // Verify adjustment form is displayed with original claim data
    cy.get('[data-testid="adjustment-form"]').should('exist');
    
    // Modify service details or add adjustment reason
    cy.get('[data-testid="adjustment-reason"]').type('Incorrect units billed');
    
    // Update units for a service
    cy.get('[data-testid="service-units-input"]:first').clear().type('3');
    
    // Click create adjustment button
    cy.get('[data-testid="create-adjustment-button"]').click();
    
    // Wait for create adjustment claim API request
    cy.wait('@createAdjustmentClaim');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('exist');
    
    // Verify new adjustment claim is created
    cy.url().should('include', '/claims/');
    cy.get('[data-testid="claim-type"]').should('contain', 'Adjustment');
    
    // Navigate back to original claim
    cy.go('back');
    
    // Verify adjustment claim appears in related claims section
    cy.get('[data-testid="related-claims"]').should('exist');
    cy.get('[data-testid="related-claims-table"]').should('contain', 'Adjustment');
  });
});