import { BillingStatus, DocumentationStatus } from '../../types/services.types';
import { SubmissionMethod } from '../../types/billing.types';
import { UUID } from '../../types/common.types';

describe('Billing Workflow', () => {
  beforeEach(() => {
    // Login with valid credentials
    cy.login('billing_specialist', 'Password123!');
    
    // Intercept API requests related to billing
    cy.intercept('GET', '/api/billing/dashboard-metrics').as('getDashboardMetrics');
    cy.intercept('GET', '/api/billing/queue*').as('getBillingQueue');
    cy.intercept('POST', '/api/billing/validate').as('validateServices');
    cy.intercept('POST', '/api/billing/convert-to-claim').as('convertToClaim');
    cy.intercept('POST', '/api/billing/submit').as('submitClaim');
    
    // Navigate to billing page
    cy.visit('/billing/dashboard');
    cy.wait('@getDashboardMetrics');
  });

  it('should display billing dashboard with required elements', () => {
    // Verify page title is displayed
    cy.get('[data-testid="page-title"]').should('contain', 'Billing Dashboard');
    
    // Verify unbilled services metrics are displayed
    cy.get('[data-testid="unbilled-services-card"]').should('be.visible');
    cy.get('[data-testid="unbilled-services-count"]').should('be.visible');
    cy.get('[data-testid="unbilled-services-amount"]').should('be.visible');
    
    // Verify upcoming billing deadlines section is displayed
    cy.get('[data-testid="billing-deadlines-card"]').should('be.visible');
    
    // Verify recent billing activity section is displayed
    cy.get('[data-testid="billing-activity-card"]').should('be.visible');
    
    // Verify quick action buttons are present
    cy.get('[data-testid="create-claim-button"]').should('be.visible');
    cy.get('[data-testid="import-services-button"]').should('be.visible');
    
    // Verify filter panel is present with date range and program filters
    cy.get('[data-testid="filter-panel"]').should('be.visible');
    cy.get('[data-testid="date-range-filter"]').should('be.visible');
    cy.get('[data-testid="program-filter"]').should('be.visible');
  });

  it('should navigate to billing queue when clicking on billing queue button', () => {
    // Click on 'Billing Queue' button or navigation link
    cy.get('[data-testid="billing-queue-button"]').click();
    
    // Verify URL changes to billing queue page
    cy.url().should('include', '/billing/queue');
    
    // Verify billing queue page loads with correct title
    cy.get('[data-testid="page-title"]').should('contain', 'Billing Queue');
    
    // Verify filter panel is present
    cy.get('[data-testid="filter-panel"]').should('be.visible');
    
    // Verify unbilled services table is present with expected columns
    cy.get('[data-testid="services-table"]').should('be.visible');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Client');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Service');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Date');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Units');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Amount');
    cy.get('[data-testid="services-table"]').find('th').should('contain', 'Documentation');
    
    // Verify action buttons are present
    cy.get('[data-testid="validate-services-button"]').should('be.visible');
    cy.get('[data-testid="create-claim-button"]').should('be.visible');
  });

  it('should filter unbilled services in billing queue', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Select specific client from filter dropdown
    cy.get('[data-testid="client-filter"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Smith, John').click();
    cy.wait('@getBillingQueue');
    
    // Verify services table shows only services for selected client
    cy.get('[data-testid="services-table"]').find('tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Smith, John');
    });
    
    // Select specific program from filter dropdown
    cy.get('[data-testid="program-filter"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Personal Care').click();
    cy.wait('@getBillingQueue');
    
    // Verify services table shows only services for selected program
    cy.get('[data-testid="services-table"]').find('tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Personal Care');
    });
    
    // Select specific date range
    cy.get('[data-testid="date-range-filter"]').click();
    cy.get('[data-testid="date-picker-start"]').clear().type('2023-05-01');
    cy.get('[data-testid="date-picker-end"]').clear().type('2023-05-31');
    cy.get('[data-testid="apply-filter-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Select documentation status filter (Complete)
    cy.get('[data-testid="documentation-status-filter"]').click();
    cy.get('.MuiMenu-list').find('li').contains('Complete').click();
    cy.wait('@getBillingQueue');
    
    // Verify services table shows only services with complete documentation
    cy.get('[data-testid="services-table"]').find('tbody tr').each(($row) => {
      cy.wrap($row).find('[data-testid="documentation-status"]').should('contain', DocumentationStatus.COMPLETE);
    });
  });

  it('should select services and proceed to validation', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Wait for services to load
    cy.get('[data-testid="services-table"]').should('be.visible');
    
    // Select multiple services by checking checkboxes
    cy.get('[data-testid="service-checkbox"]').first().check();
    cy.get('[data-testid="service-checkbox"]').eq(1).check();
    
    // Verify selected services count and total amount updates
    cy.get('[data-testid="selected-count"]').should('contain', '2');
    cy.get('[data-testid="selected-amount"]').should('be.visible');
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Wait for validation API request to complete
    cy.wait('@validateServices');
    
    // Verify URL changes to validation page
    cy.url().should('include', '/billing/validate');
    
    // Verify validation results are displayed
    cy.get('[data-testid="validation-results"]').should('be.visible');
    
    // Verify validation summary shows count of valid and invalid services
    cy.get('[data-testid="validation-summary"]').should('be.visible');
    cy.get('[data-testid="valid-services-count"]').should('be.visible');
    cy.get('[data-testid="invalid-services-count"]').should('be.visible');
    
    // Verify action buttons are present
    cy.get('[data-testid="back-to-queue-button"]').should('be.visible');
    cy.get('[data-testid="proceed-to-claim-button"]').should('be.visible');
  });

  it('should show validation errors for incomplete documentation', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Intercept billing queue API request with services that have incomplete documentation
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-incomplete-documentation.json'
      });
    }).as('getIncompleteDocServices');
    cy.reload();
    cy.wait('@getIncompleteDocServices');
    
    // Select services with incomplete documentation
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Intercept validation API request
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [{
          serviceId: 'service-id-1',
          isValid: false,
          errors: [{
            code: 'INCOMPLETE_DOCUMENTATION',
            message: 'Service documentation is incomplete',
            field: 'documentationStatus'
          }],
          warnings: []
        }],
        isValid: false,
        totalErrors: 1,
        totalWarnings: 0
      }
    }).as('validateWithErrors');
    cy.wait('@validateWithErrors');
    
    // Verify validation results show errors for incomplete documentation
    cy.get('[data-testid="validation-error"]').should('contain', 'Service documentation is incomplete');
    
    // Verify 'Fix Documentation' buttons are present for services with errors
    cy.get('[data-testid="fix-documentation-button"]').should('be.visible');
    
    // Click 'Fix Documentation' for a service
    cy.get('[data-testid="fix-documentation-button"]').click();
    
    // Verify navigation to service detail page for fixing documentation
    cy.url().should('include', '/services/');
  });

  it('should show validation errors for expired authorizations', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Intercept billing queue API request with services that have expired authorizations
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-expired-authorization.json'
      });
    }).as('getExpiredAuthServices');
    cy.reload();
    cy.wait('@getExpiredAuthServices');
    
    // Select services with expired authorizations
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Intercept validation API request
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [{
          serviceId: 'service-id-1',
          isValid: false,
          errors: [{
            code: 'EXPIRED_AUTHORIZATION',
            message: 'Service authorization has expired',
            field: 'authorizationId'
          }],
          warnings: []
        }],
        isValid: false,
        totalErrors: 1,
        totalWarnings: 0
      }
    }).as('validateWithErrors');
    cy.wait('@validateWithErrors');
    
    // Verify validation results show errors for expired authorizations
    cy.get('[data-testid="validation-error"]').should('contain', 'Service authorization has expired');
    
    // Verify 'Update Authorization' buttons are present for services with errors
    cy.get('[data-testid="update-authorization-button"]').should('be.visible');
    
    // Click 'Update Authorization' for a service
    cy.get('[data-testid="update-authorization-button"]').click();
    
    // Verify navigation to authorization update page
    cy.url().should('include', '/authorizations/');
  });

  it('should proceed from validation to claim creation', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Intercept billing queue API request with valid services
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-valid.json'
      });
    }).as('getValidServices');
    cy.reload();
    cy.wait('@getValidServices');
    
    // Select services with complete documentation and valid authorizations
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    cy.get('[data-testid="services-table"] tbody tr').eq(1).find('[data-testid="service-checkbox"]').check();
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Intercept validation API request
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: []
          },
          {
            serviceId: 'service-id-2',
            isValid: true,
            errors: [],
            warnings: []
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 0
      }
    }).as('validateAllValid');
    cy.wait('@validateAllValid');
    
    // Verify validation results show all services as valid
    cy.get('[data-testid="validation-summary"]').should('contain', 'All services are valid');
    
    // Click 'Proceed to Claim Creation' button
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Verify URL changes to claim creation page
    cy.url().should('include', '/billing/create-claim');
    
    // Verify claim creation form is displayed with validated services
    cy.get('[data-testid="claim-form"]').should('be.visible');
    
    // Verify payer selection dropdown is present
    cy.get('[data-testid="payer-select"]').should('be.visible');
    
    // Verify claim details section shows service information
    cy.get('[data-testid="claim-services-section"]').should('be.visible');
    cy.get('[data-testid="service-row"]').should('have.length.at.least', 2);
  });

  it('should create a claim from validated services', () => {
    // Navigate through billing queue and validation steps
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Intercept to set up valid services
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-valid.json'
      });
    }).as('getValidServices');
    cy.reload();
    cy.wait('@getValidServices');
    
    // Select services
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    
    // Validate services
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Intercept validation request
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: []
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 0
      }
    }).as('validateAllValid');
    cy.wait('@validateAllValid');
    
    // Proceed to claim creation
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Intercept claim creation API request
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-1',
          claimNumber: 'CLM-2023-001',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 125.75,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created'
      }
    }).as('createClaimSuccess');
    
    // On claim creation page, select payer from dropdown
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    
    // Fill in any required claim details
    cy.get('[data-testid="claim-notes"]').type('Claim notes for testing');
    
    // Click 'Create Claim' button
    cy.get('[data-testid="create-claim-button"]').click();
    
    // Wait for claim creation API request to complete
    cy.wait('@createClaimSuccess');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim successfully created');
    
    // Verify claim summary is displayed with correct information
    cy.get('[data-testid="claim-summary"]').should('be.visible');
    cy.get('[data-testid="claim-number"]').should('contain', 'CLM-2023-001');
    cy.get('[data-testid="claim-amount"]').should('contain', '$125.75');
    
    // Verify action buttons are present
    cy.get('[data-testid="view-claim-button"]').should('be.visible');
    cy.get('[data-testid="submit-claim-button"]').should('be.visible');
  });

  it('should submit a created claim', () => {
    // Complete claim creation process
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Set up valid services, validation, and claim creation like previous test
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-valid.json'
      });
    }).as('getValidServices');
    cy.reload();
    cy.wait('@getValidServices');
    
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    cy.get('[data-testid="validate-services-button"]').click();
    
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: []
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 0
      }
    }).as('validateAllValid');
    cy.wait('@validateAllValid');
    
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-1',
          claimNumber: 'CLM-2023-001',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 125.75,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created'
      }
    }).as('createClaimSuccess');
    
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimSuccess');
    
    // Intercept claim submission API request
    cy.intercept('POST', '/api/billing/submit', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Claim submitted successfully',
        confirmationNumber: 'SUB-123456',
        submissionDate: '2023-05-25',
        claimId: 'claim-id-1',
        validationResult: null
      }
    }).as('submitClaimSuccess');
    
    // Click 'Submit Claim' button
    cy.get('[data-testid="submit-claim-button"]').click();
    
    // Verify submission form is displayed
    cy.get('[data-testid="submission-form"]').should('be.visible');
    
    // Select submission method
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get('.MuiMenu-list').find('li').contains(SubmissionMethod.ELECTRONIC).click();
    
    // Set submission date
    const today = new Date().toISOString().split('T')[0];
    cy.get('[data-testid="submission-date"]').type(today);
    
    // Fill in any required submission details
    cy.get('[data-testid="submission-notes"]').type('Test submission notes');
    
    // Click 'Submit' button
    cy.get('[data-testid="submit-button"]').click();
    
    // Wait for claim submission API request to complete
    cy.wait('@submitClaimSuccess');
    
    // Verify success message is displayed
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim submitted successfully');
    
    // Verify submission confirmation page is displayed
    cy.get('[data-testid="submission-confirmation"]').should('be.visible');
    
    // Verify confirmation details include submission method and date
    cy.get('[data-testid="confirmation-number"]').should('contain', 'SUB-123456');
    cy.get('[data-testid="submission-date-display"]').should('be.visible');
    cy.get('[data-testid="submission-method-display"]').should('contain', SubmissionMethod.ELECTRONIC);
    
    // Verify 'View Claim' and 'Return to Dashboard' buttons are present
    cy.get('[data-testid="view-claim-button"]').should('be.visible');
    cy.get('[data-testid="return-to-dashboard-button"]').should('be.visible');
  });

  it('should complete the entire billing workflow end-to-end', () => {
    // Navigate to billing dashboard
    cy.visit('/billing/dashboard');
    cy.wait('@getDashboardMetrics');
    
    // Click on 'Billing Queue' button
    cy.get('[data-testid="billing-queue-button"]').click();
    cy.wait('@getBillingQueue');
    
    // Set up valid services
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-valid.json'
      });
    }).as('getValidServices');
    cy.reload();
    cy.wait('@getValidServices');
    
    // Apply filters to find billable services
    cy.get('[data-testid="documentation-status-filter"]').click();
    cy.get('.MuiMenu-list').find('li').contains(DocumentationStatus.COMPLETE).click();
    cy.wait('@getValidServices');
    
    // Select multiple services
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    cy.get('[data-testid="services-table"] tbody tr').eq(1).find('[data-testid="service-checkbox"]').check();
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Set up validation response
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: []
          },
          {
            serviceId: 'service-id-2',
            isValid: true,
            errors: [],
            warnings: []
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 0
      }
    }).as('validateAllValid');
    cy.wait('@validateAllValid');
    
    // Verify validation results
    cy.get('[data-testid="validation-summary"]').should('contain', 'All services are valid');
    
    // Click 'Proceed to Claim Creation' button
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Set up claim creation response
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-1',
          claimNumber: 'CLM-2023-001',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 250.50,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created'
      }
    }).as('createClaimSuccess');
    
    // Select payer and fill claim details
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    cy.get('[data-testid="claim-notes"]').type('End-to-end test claim');
    
    // Click 'Create Claim' button
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimSuccess');
    
    // Verify claim creation success
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim successfully created');
    
    // Set up claim submission response
    cy.intercept('POST', '/api/billing/submit', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Claim submitted successfully',
        confirmationNumber: 'SUB-123456',
        submissionDate: '2023-05-25',
        claimId: 'claim-id-1',
        validationResult: null
      }
    }).as('submitClaimSuccess');
    
    // Click 'Submit Claim' button
    cy.get('[data-testid="submit-claim-button"]').click();
    
    // Select submission method and fill submission details
    cy.get('[data-testid="submission-method-select"]').click();
    cy.get('.MuiMenu-list').find('li').contains(SubmissionMethod.ELECTRONIC).click();
    const today = new Date().toISOString().split('T')[0];
    cy.get('[data-testid="submission-date"]').type(today);
    cy.get('[data-testid="submission-notes"]').type('End-to-end test submission');
    
    // Click 'Submit' button
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@submitClaimSuccess');
    
    // Verify submission success
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim submitted successfully');
    
    // Click 'Return to Dashboard' button
    cy.get('[data-testid="return-to-dashboard-button"]').click();
    
    // Verify return to billing dashboard
    cy.url().should('include', '/billing/dashboard');
    
    // Set up updated metrics
    cy.intercept('GET', '/api/billing/dashboard-metrics', (req) => {
      req.reply({
        fixture: 'billing/dashboard-metrics-updated.json'
      });
    }).as('getUpdatedMetrics');
    cy.wait('@getUpdatedMetrics');
    
    // Verify updated metrics reflecting the newly created and submitted claim
    cy.get('[data-testid="recent-billing-activity"]').should('contain', today);
  });

  it('should handle validation and creation of claims with multiple service types', () => {
    // Navigate to billing queue page
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    // Intercept billing queue API request with services of different types
    cy.intercept('GET', '/api/billing/queue*', (req) => {
      req.reply({
        fixture: 'billing/services-multiple-types.json'
      });
    }).as('getMixedServicesQueue');
    cy.reload();
    cy.wait('@getMixedServicesQueue');
    
    // Select services of different types
    cy.contains('[data-testid="services-table"] tbody tr', 'Personal Care')
      .find('[data-testid="service-checkbox"]').check();
    cy.contains('[data-testid="services-table"] tbody tr', 'Day Services')
      .find('[data-testid="service-checkbox"]').check();
    
    // Click 'Validate Services' button
    cy.get('[data-testid="validate-services-button"]').click();
    
    // Intercept validation API request
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: [{
              code: 'MULTIPLE_SERVICE_TYPES',
              message: 'Multiple service types selected, claims may need to be separated',
              field: null
            }]
          },
          {
            serviceId: 'service-id-2',
            isValid: true,
            errors: [],
            warnings: [{
              code: 'MULTIPLE_SERVICE_TYPES',
              message: 'Multiple service types selected, claims may need to be separated',
              field: null
            }]
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 2
      }
    }).as('validateMixedTypes');
    cy.wait('@validateMixedTypes');
    
    // Verify validation results show grouping by service type
    cy.get('[data-testid="validation-warning"]').should('contain', 'Multiple service types selected');
    
    // Verify warning about multiple service types if applicable
    cy.get('[data-testid="service-type-warning"]').should('be.visible');
    
    // Proceed to claim creation
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Verify claim creation form shows services grouped by type
    cy.get('[data-testid="service-type-tabs"]').should('be.visible');
    cy.get('[data-testid="service-type-tab-personal-care"]').should('be.visible');
    cy.get('[data-testid="service-type-tab-day-services"]').should('be.visible');
    
    // Intercept first claim creation
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-1',
          claimNumber: 'CLM-2023-001',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 125.75,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created for Personal Care services'
      }
    }).as('createClaimPersonalCare');
    
    // Complete claim creation process for first service type
    cy.get('[data-testid="service-type-tab-personal-care"]').click();
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimPersonalCare');
    
    // Verify created claims are properly separated by service type
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim successfully created for Personal Care services');
    
    // Intercept second claim creation
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-2',
          claimNumber: 'CLM-2023-002',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 175.50,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created for Day Services'
      }
    }).as('createClaimDayServices');
    
    // Create second claim for the other service type
    cy.get('[data-testid="service-type-tab-day-services"]').click();
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimDayServices');
    
    cy.get('[data-testid="success-notification"]').should('contain', 'Claim successfully created for Day Services');
  });

  it('should display appropriate error messages for billing workflow failures', () => {
    // Test validation failure scenario
    cy.visit('/billing/queue');
    cy.wait('@getBillingQueue');
    
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    
    // Intercept validation API request with error response
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 500,
      body: {
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred during service validation',
          details: null
        }
      }
    }).as('validateError');
    
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateError');
    
    // Verify error message is displayed with details
    cy.get('[data-testid="error-notification"]').should('contain', 'An error occurred during service validation');
    
    // Test claim creation failure scenario
    cy.reload();
    cy.wait('@getBillingQueue');
    
    cy.get('[data-testid="services-table"] tbody tr').first().find('[data-testid="service-checkbox"]').check();
    
    // Intercept validation with success
    cy.intercept('POST', '/api/billing/validate', {
      statusCode: 200,
      body: {
        results: [
          {
            serviceId: 'service-id-1',
            isValid: true,
            errors: [],
            warnings: []
          }
        ],
        isValid: true,
        totalErrors: 0,
        totalWarnings: 0
      }
    }).as('validateSuccess');
    
    cy.get('[data-testid="validate-services-button"]').click();
    cy.wait('@validateSuccess');
    
    cy.get('[data-testid="proceed-to-claim-button"]').click();
    
    // Intercept claim creation API request with error response
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unable to create claim',
          details: {
            payerId: 'Payer is required'
          }
        }
      }
    }).as('createClaimError');
    
    // Attempt to create claim without selecting payer
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimError');
    
    // Verify error message is displayed with details
    cy.get('[data-testid="error-notification"]').should('contain', 'Unable to create claim');
    cy.get('[data-testid="form-field-error"]').should('contain', 'Payer is required');
    
    // Test submission failure scenario
    // First create a valid claim
    cy.get('[data-testid="payer-select"]').click();
    cy.get('.MuiAutocomplete-popper').find('li').contains('Medicaid').click();
    
    // Intercept with successful creation
    cy.intercept('POST', '/api/billing/convert-to-claim', {
      statusCode: 200,
      body: {
        claim: {
          id: 'claim-id-1',
          claimNumber: 'CLM-2023-001',
          clientId: 'client-id-1',
          clientName: 'John Smith',
          payerId: 'payer-id-1',
          payerName: 'Medicaid',
          claimStatus: 'draft',
          totalAmount: 125.75,
          serviceStartDate: '2023-05-15',
          serviceEndDate: '2023-05-15',
          submissionDate: null,
          claimAge: 0
        },
        validationResult: null,
        success: true,
        message: 'Claim successfully created'
      }
    }).as('createClaimSuccess');
    
    cy.get('[data-testid="create-claim-button"]').click();
    cy.wait('@createClaimSuccess');
    
    // Then attempt to submit with error
    cy.get('[data-testid="submit-claim-button"]').click();
    
    // Intercept submission API request with error response
    cy.intercept('POST', '/api/billing/submit', {
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unable to submit claim',
          details: {
            submissionMethod: 'Submission method is required'
          }
        }
      }
    }).as('submitClaimError');
    
    // Try to submit without selecting method
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@submitClaimError');
    
    // Verify error message is displayed with details
    cy.get('[data-testid="error-notification"]').should('contain', 'Unable to submit claim');
    cy.get('[data-testid="form-field-error"]').should('contain', 'Submission method is required');
    
    // Verify appropriate recovery options are presented for each failure scenario
    cy.get('[data-testid="try-again-button"]').should('be.visible');
  });
});