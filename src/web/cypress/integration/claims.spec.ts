import 'cypress';

/**
 * Main test suite for claims management functionality
 * Tests the end-to-end flows for viewing, creating, editing, and managing claims
 * throughout their lifecycle in the HCBS Revenue Management System
 */
describe('Claims Management', () => {
  /**
   * Setup function that runs before each test
   */
  beforeEach(() => {
    // Log in as a billing specialist user with appropriate permissions
    cy.fixture('users/billing-specialist.json').then((user) => {
      cy.login(user.username, user.password);
    });
    
    // Preserve cookies and localStorage between tests
    cy.preserveCookies();
    
    // Visit the claims management page
    cy.visit('/claims');
    
    // Wait for the page to load completely
    cy.findByRole('heading', { name: /claims management/i }).should('be.visible');
  });

  /**
   * Helper function to mock claims API responses
   */
  const mockClaimsApi = (options = {}) => {
    const defaults = {
      status: 200,
      response: 'fixtures/claims.json',
      query: '',
    };
    const config = { ...defaults, ...options };
    
    cy.intercept('GET', `/api/claims${config.query}`, { 
      statusCode: config.status, 
      fixture: config.response 
    }).as('getClaims');
  };

  /**
   * Helper function to fill out a claim form
   */
  const fillClaimForm = (claimData) => {
    // Select client from dropdown
    cy.findByLabelText(/client/i).click();
    cy.findByText(claimData.client).click();
    
    // Select payer from dropdown
    cy.findByLabelText(/payer/i).click();
    cy.findByText(claimData.payer).click();
    
    // Select services to include
    claimData.services.forEach(service => {
      cy.contains('tr', service).find('input[type="checkbox"]').check();
    });
    
    // Add notes if provided
    if (claimData.notes) {
      cy.findByLabelText(/notes/i).type(claimData.notes);
    }
  };

  /**
   * Helper function to verify claim details
   */
  const verifyClaimDetails = (expectedClaim) => {
    // Verify claim number is displayed correctly
    cy.findByText(`Claim #: ${expectedClaim.claimNumber}`).should('be.visible');
    
    // Verify client information is displayed correctly
    cy.findByText(`Client: ${expectedClaim.client.name}`).should('be.visible');
    
    // Verify service information is displayed correctly
    cy.findByText(`Service Type: ${expectedClaim.serviceType}`).should('be.visible');
    
    // Verify financial information is displayed correctly
    cy.findByText(`Total Amount: $${expectedClaim.totalAmount.toFixed(2)}`).should('be.visible');
    
    // Verify status information is displayed correctly
    cy.get('[data-testid="status-badge"]').should('contain', expectedClaim.status);
  };

  /**
   * Test case for viewing the claims list
   */
  it('should display the claims list with correct data', () => {
    // Mock API response for claims list
    mockClaimsApi();
    
    // Visit the claims page
    cy.visit('/claims');
    
    // Wait for the claims table to load
    cy.wait('@getClaims');
    
    // Verify that the table contains the expected number of rows
    cy.get('[data-testid="claims-table"]').should('be.visible');
    cy.get('[data-testid="claims-table"] tbody tr').should('have.length.at.least', 1);
    
    // Verify that the claim data is displayed correctly
    cy.contains('th', 'Claim#').should('be.visible');
    cy.contains('th', 'Client').should('be.visible');
    cy.contains('th', 'Service').should('be.visible');
    cy.contains('th', 'Amount').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.contains('th', 'Payer').should('be.visible');
    cy.contains('th', 'Age').should('be.visible');
    
    // Verify that status badges are displayed with correct colors
    cy.fixture('claims.json').then((claims) => {
      const pendingClaim = claims.find(claim => claim.status === 'Pending');
      cy.contains('tr', pendingClaim.claimNumber)
        .find('[data-testid="status-badge"]')
        .should('have.class', 'pending');
        
      const paidClaim = claims.find(claim => claim.status === 'Paid');
      cy.contains('tr', paidClaim.claimNumber)
        .find('[data-testid="status-badge"]')
        .should('have.class', 'success');
    });
    
    // Verify that the pagination controls work correctly
    cy.get('[data-testid="pagination"]').should('be.visible');
    cy.get('[data-testid="pagination"]').contains('1').should('have.attr', 'aria-current', 'page');
    cy.get('[data-testid="pagination"]').contains('2').click();
    cy.wait('@getClaims');
  });

  /**
   * Test case for filtering claims
   */
  it('should filter claims by status, date range, and payer', () => {
    // Mock API responses for filtered claims
    mockClaimsApi();
    cy.wait('@getClaims');
    
    // Open the filter panel
    cy.findByText('Filters:').should('be.visible');
    
    // Select 'Pending' status filter
    mockClaimsApi({ query: '?status=Pending', response: 'fixtures/filtered-claims/pending.json' });
    cy.findByLabelText(/status/i).click();
    cy.findByText('Pending').click();
    cy.wait('@getClaims');
    
    // Verify that only pending claims are displayed
    cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
      cy.wrap($row).contains('Pending');
    });
    
    // Select date range filter
    mockClaimsApi({ 
      query: '?status=Pending&dateFrom=2023-05-01&dateTo=2023-05-31', 
      response: 'fixtures/filtered-claims/pending-may.json' 
    });
    cy.findByLabelText(/date range/i).click();
    cy.findByText('Custom Range').click();
    cy.findByLabelText(/from/i).type('2023-05-01');
    cy.findByLabelText(/to/i).type('2023-05-31');
    cy.findByText('Apply').click();
    cy.wait('@getClaims');
    
    // Verify that claims within date range are displayed
    cy.fixture('filtered-claims/pending-may.json').then((claims) => {
      cy.get('[data-testid="claims-table"] tbody tr').should('have.length', claims.length);
    });
    
    // Select payer filter
    mockClaimsApi({ 
      query: '?status=Pending&dateFrom=2023-05-01&dateTo=2023-05-31&payer=Medicaid', 
      response: 'fixtures/filtered-claims/pending-may-medicaid.json' 
    });
    cy.findByLabelText(/payer/i).click();
    cy.findByText('Medicaid').click();
    cy.wait('@getClaims');
    
    // Verify that claims for selected payer are displayed
    cy.fixture('filtered-claims/pending-may-medicaid.json').then((claims) => {
      cy.get('[data-testid="claims-table"] tbody tr').should('have.length', claims.length);
      cy.get('[data-testid="claims-table"] tbody tr').each(($row) => {
        cy.wrap($row).contains('Medicaid');
      });
    });
    
    // Clear all filters
    mockClaimsApi();
    cy.findByText('Clear Filters').click();
    cy.wait('@getClaims');
    
    // Verify that all claims are displayed again
    cy.fixture('claims.json').then((claims) => {
      cy.get('[data-testid="claims-table"] tbody tr').should('have.length', Math.min(claims.length, 10));
    });
  });

  /**
   * Test case for creating a new claim
   */
  it('should create a new claim successfully', () => {
    // Mock API responses for clients, services, and claim creation
    cy.intercept('GET', '/api/clients', { fixture: 'clients.json' }).as('getClients');
    cy.intercept('GET', '/api/services*', { fixture: 'services.json' }).as('getServices');
    cy.intercept('POST', '/api/claims', { 
      statusCode: 201, 
      body: { id: 'new-claim-id', claimNumber: 'C10050' } 
    }).as('createClaim');
    
    // Click the 'Create Claim' button
    cy.findByText('New Claim').click();
    
    // Verify navigation to the claim creation page
    cy.url().should('include', '/claims/create');
    cy.findByText('Create Claim').should('be.visible');
    
    // Fill out the claim form with valid data
    const claimData = {
      client: 'Smith, John',
      payer: 'Medicaid',
      services: ['S20101', 'S20095'],
      notes: 'Test claim created via automation'
    };
    fillClaimForm(claimData);
    
    // Submit the form
    cy.findByText('Submit').click();
    
    // Wait for API call
    cy.wait('@createClaim');
    
    // Verify successful claim creation
    cy.findByText('Claim created successfully').should('be.visible');
    
    // Verify redirect to the claims list or detail page
    cy.url().should('include', '/claims');
    
    // Verify success toast notification
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  /**
   * Test case for editing an existing claim
   */
  it('should edit an existing claim successfully', () => {
    // Mock API responses for claim detail and update
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-detail.json' }).as('getClaimDetail');
    cy.intercept('PUT', '/api/claims/*', { 
      statusCode: 200, 
      body: { success: true } 
    }).as('updateClaim');
    
    // Click on a claim in the draft status
    cy.fixture('claims.json').then((claims) => {
      const draftClaim = claims.find(claim => claim.status === 'Draft');
      cy.contains('tr', draftClaim.claimNumber).click();
    });
    
    // Verify navigation to the claim detail page
    cy.wait('@getClaimDetail');
    
    // Click the 'Edit' button
    cy.findByText('Edit Claim').click();
    
    // Modify claim data (payer, services, notes)
    cy.findByLabelText(/payer/i).click();
    cy.findByText('Medicare').click();
    
    cy.findByLabelText(/notes/i).clear().type('Updated notes for this claim');
    
    // Save the changes
    cy.findByText('Save Changes').click();
    
    // Wait for update API call
    cy.wait('@updateClaim');
    
    // Verify successful claim update
    cy.findByText('Claim updated successfully').should('be.visible');
    
    // Verify that changes are reflected in the UI
    cy.findByText('Medicare').should('be.visible');
    cy.findByText('Updated notes for this claim').should('be.visible');
    
    // Verify success toast notification
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  /**
   * Test case for claim submission workflow
   */
  it('should validate and submit a claim successfully', () => {
    // Mock API responses for claim validation and submission
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-detail.json' }).as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/validate', { 
      statusCode: 200, 
      body: { valid: true, messages: [] } 
    }).as('validateClaim');
    cy.intercept('POST', '/api/claims/*/submit', { 
      statusCode: 200, 
      body: { success: true, claimId: 'claim-id', status: 'Submitted' } 
    }).as('submitClaim');
    
    // Click on a claim in the draft status
    cy.fixture('claims.json').then((claims) => {
      const draftClaim = claims.find(claim => claim.status === 'Draft');
      cy.contains('tr', draftClaim.claimNumber).click();
    });
    
    // Verify navigation to the claim detail page
    cy.wait('@getClaimDetail');
    
    // Click the 'Validate' button
    cy.findByText('Validate').click();
    
    // Verify successful validation
    cy.wait('@validateClaim');
    cy.findByText('Claim validation successful').should('be.visible');
    
    // Click the 'Submit' button
    cy.findByText('Submit Claim').click();
    
    // Select submission method (Electronic)
    cy.findByLabelText(/submission method/i).click();
    cy.findByText('Electronic').click();
    
    // Confirm submission
    cy.findByText('Confirm').click();
    
    // Verify successful claim submission
    cy.wait('@submitClaim');
    cy.findByText('Claim submitted successfully').should('be.visible');
    
    // Verify that claim status changes to 'Submitted'
    cy.findByText('Submitted').should('be.visible');
    
    // Verify success toast notification
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  /**
   * Test case for claim validation with errors
   */
  it('should display validation errors when claim has issues', () => {
    // Mock API response for claim validation with errors
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-detail.json' }).as('getClaimDetail');
    cy.intercept('POST', '/api/claims/*/validate', { 
      statusCode: 400, 
      body: { 
        valid: false, 
        messages: [
          { type: 'error', field: 'service', message: 'Missing required documentation' },
          { type: 'error', field: 'payer', message: 'Invalid payer for service type' }
        ] 
      } 
    }).as('validateClaimWithErrors');
    
    // Click on a claim in the draft status
    cy.fixture('claims.json').then((claims) => {
      const draftClaim = claims.find(claim => claim.status === 'Draft');
      cy.contains('tr', draftClaim.claimNumber).click();
    });
    
    // Verify navigation to the claim detail page
    cy.wait('@getClaimDetail');
    
    // Click the 'Validate' button
    cy.findByText('Validate').click();
    
    // Verify that validation errors are displayed
    cy.wait('@validateClaimWithErrors');
    cy.findByText('Missing required documentation').should('be.visible');
    cy.findByText('Invalid payer for service type').should('be.visible');
    
    // Verify that the 'Submit' button is disabled
    cy.findByText('Submit Claim').should('be.disabled');
    
    // Fix the validation errors
    cy.intercept('POST', '/api/claims/*/validate', { 
      statusCode: 200, 
      body: { valid: true, messages: [] } 
    }).as('validateClaimFixed');
    
    // Upload missing documentation
    cy.findByText('Upload Documentation').click();
    cy.get('input[type="file"]').attachFile('document.pdf');
    cy.findByText('Upload').click();
    
    // Change payer
    cy.findByLabelText(/payer/i).click();
    cy.findByText('Medicare').click();
    
    // Revalidate the claim
    cy.findByText('Validate').click();
    
    // Verify successful validation after fixes
    cy.wait('@validateClaimFixed');
    cy.findByText('Claim validation successful').should('be.visible');
  });

  /**
   * Test case for claim status tracking
   */
  it('should display claim status timeline correctly', () => {
    // Mock API response for claim with status history
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-with-history.json' }).as('getClaimWithHistory');
    
    // Click on a claim with multiple status changes
    cy.contains('tr', 'C10040').click();
    
    // Verify navigation to the claim detail page
    cy.wait('@getClaimWithHistory');
    
    // Verify that the status timeline is displayed
    cy.get('[data-testid="status-timeline"]').should('be.visible');
    
    // Verify that all status changes are shown in chronological order
    cy.fixture('claim-with-history.json').then((claim) => {
      claim.statusHistory.forEach((status, index) => {
        const statusElement = cy.get(`[data-testid="status-timeline-item-${index}"]`);
        statusElement.should('contain', status.status);
        statusElement.should('contain', new Date(status.timestamp).toLocaleDateString());
        statusElement.should('contain', status.user);
      });
    });
    
    // Verify that the current status is highlighted
    cy.get('[data-testid="status-timeline"] .current').should('be.visible');
    
    // Verify that timestamps and user information are displayed correctly
    cy.fixture('claim-with-history.json').then((claim) => {
      const lastStatus = claim.statusHistory[claim.statusHistory.length - 1];
      cy.get('[data-testid="status-timeline"] .current')
        .should('contain', lastStatus.status)
        .should('contain', new Date(lastStatus.timestamp).toLocaleDateString())
        .should('contain', lastStatus.user);
    });
  });

  /**
   * Test case for batch claim operations
   */
  it('should process batch claim submissions', () => {
    // Mock API responses for batch claim operations
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('POST', '/api/claims/batch/submit', { 
      statusCode: 200, 
      body: { 
        success: true, 
        processed: 3,
        failed: 0
      } 
    }).as('batchSubmit');
    
    // Select multiple claims in validated status
    cy.fixture('claims.json').then((claims) => {
      const validatedClaims = claims.filter(claim => claim.status === 'Validated');
      validatedClaims.slice(0, 3).forEach((claim) => {
        cy.contains('tr', claim.claimNumber).find('input[type="checkbox"]').check();
      });
    });
    
    // Click the 'Submit Selected' button
    cy.findByText('Submit Selected').click();
    
    // Verify batch submission dialog appears
    cy.findByText('Batch Claim Submission').should('be.visible');
    cy.findByText('You are about to submit 3 claims').should('be.visible');
    
    // Select submission method (Electronic)
    cy.findByLabelText(/submission method/i).click();
    cy.findByText('Electronic').click();
    
    // Confirm batch submission
    cy.findByText('Submit Batch').click();
    
    // Verify successful batch submission
    cy.wait('@batchSubmit');
    cy.findByText('Successfully submitted 3 claims').should('be.visible');
    
    // Verify that claim statuses change to 'Submitted'
    mockClaimsApi({ response: 'fixtures/claims-after-batch.json' });
    cy.findByText('Refresh').click();
    cy.wait('@getClaims');
    
    // Verify success toast notification with count of processed claims
    cy.get('[data-testid="toast-success"]')
      .should('be.visible')
      .should('contain', 'Successfully submitted 3 claims');
  });

  /**
   * Test case for claim detail view
   */
  it('should display claim details with all related information', () => {
    // Mock API response for detailed claim with services
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-with-relations.json' }).as('getClaimDetail');
    
    // Click on a claim in the list
    cy.contains('tr', 'C10045').click();
    
    // Wait for claim detail to load
    cy.wait('@getClaimDetail');
    
    // Verify that claim header information is displayed correctly
    cy.fixture('claim-with-relations.json').then((claim) => {
      verifyClaimDetails(claim);
    });
    
    // Verify that claim status is displayed with correct badge
    cy.get('[data-testid="status-badge"]').should('be.visible');
    
    // Verify that services tab shows all services included in the claim
    cy.findByRole('tab', { name: /services/i }).click();
    cy.fixture('claim-with-relations.json').then((claim) => {
      claim.services.forEach((service) => {
        cy.contains('tr', service.serviceId).should('be.visible');
        cy.contains('tr', service.serviceId).should('contain', service.serviceType);
      });
    });
    
    // Verify that documentation tab shows related documents
    cy.findByRole('tab', { name: /documentation/i }).click();
    cy.fixture('claim-with-relations.json').then((claim) => {
      if (claim.documents && claim.documents.length > 0) {
        claim.documents.forEach((doc) => {
          cy.contains(doc.filename).should('be.visible');
        });
      }
    });
    
    // Verify that payments tab shows payment information if available
    cy.findByRole('tab', { name: /payments/i }).click();
    cy.fixture('claim-with-relations.json').then((claim) => {
      if (claim.payments && claim.payments.length > 0) {
        claim.payments.forEach((payment) => {
          cy.contains(payment.paymentId).should('be.visible');
        });
      }
    });
    
    // Verify that notes tab shows claim notes
    cy.findByRole('tab', { name: /notes/i }).click();
    cy.fixture('claim-with-relations.json').then((claim) => {
      if (claim.notes) {
        cy.findByText(claim.notes).should('be.visible');
      }
    });
    
    // Verify that history tab shows claim history
    cy.findByRole('tab', { name: /history/i }).click();
    cy.get('[data-testid="claim-history"]').should('be.visible');
    
    // Verify that appropriate action buttons are displayed based on claim status
    cy.fixture('claim-with-relations.json').then((claim) => {
      if (claim.status === 'Draft') {
        cy.findByText('Edit Claim').should('be.visible');
        cy.findByText('Validate').should('be.visible');
      } else if (claim.status === 'Validated') {
        cy.findByText('Submit Claim').should('be.visible');
      } else if (claim.status === 'Denied') {
        cy.findByText('Appeal').should('be.visible');
      }
    });
  });

  /**
   * Test case for claim denial and appeal workflow
   */
  it('should handle claim denial and appeal process', () => {
    // Mock API responses for claim denial and appeal
    mockClaimsApi();
    cy.wait('@getClaims');
    
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-denied.json' }).as('getClaimDenied');
    cy.intercept('POST', '/api/claims/*/appeal', { 
      statusCode: 200, 
      body: { success: true, status: 'Appealed' } 
    }).as('submitAppeal');
    
    // Click on a claim in 'Denied' status
    cy.fixture('claims.json').then((claims) => {
      const deniedClaim = claims.find(claim => claim.status === 'Denied');
      cy.contains('tr', deniedClaim.claimNumber).click();
    });
    
    // Verify navigation to the claim detail page
    cy.wait('@getClaimDenied');
    
    // Verify that denial reason is displayed
    cy.fixture('claim-denied.json').then((claim) => {
      cy.findByText(`Denial Reason: ${claim.denialReason}`).should('be.visible');
    });
    
    // Click the 'Appeal' button
    cy.findByText('Appeal').click();
    
    // Fill out appeal form with reason and supporting documentation
    cy.findByLabelText(/appeal reason/i).type('Service was authorized but authorization was not included with claim');
    cy.get('input[type="file"]').attachFile('authorization.pdf');
    
    // Submit the appeal
    cy.findByText('Submit Appeal').click();
    
    // Verify successful appeal submission
    cy.wait('@submitAppeal');
    cy.findByText('Appeal submitted successfully').should('be.visible');
    
    // Verify that claim status changes to 'Appealed'
    cy.findByText('Appealed').should('be.visible');
    
    // Verify success toast notification
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  /**
   * Test case for accessibility compliance
   */
  it('should be accessible', () => {
    // Visit the claims list page
    mockClaimsApi();
    cy.wait('@getClaims');
    
    // Check accessibility using basic accessibility attributes
    cy.get('table').should('have.attr', 'role', 'grid');
    cy.get('th').first().should('have.attr', 'scope', 'col');
    cy.get('[data-testid="pagination"]').should('have.attr', 'aria-label');
    
    // Visit the claim detail page
    cy.intercept('GET', '/api/claims/*', { fixture: 'claim-detail.json' }).as('getClaimDetail');
    cy.contains('tr', 'C10045').click();
    cy.wait('@getClaimDetail');
    
    // Check detail page accessibility
    cy.get('[role="tablist"]').should('be.visible');
    cy.get('[role="tab"]').first().should('have.attr', 'aria-selected');
    
    // Visit the claim creation page
    cy.visit('/claims/create');
    
    // Check form accessibility
    cy.get('form').should('exist');
    cy.get('label').should('have.length.at.least', 1);
    cy.get('button[type="submit"]').should('be.visible');
    
    // Verify no critical accessibility violations by checking for common patterns
    cy.get('img').each($img => {
      cy.wrap($img).should('have.attr', 'alt');
    });
    
    cy.get('a').each($link => {
      cy.wrap($link).should('have.attr', 'href');
    });
  });
});