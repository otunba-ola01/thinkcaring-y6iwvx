import 'cypress'; // cypress version ^12.0.0

describe('Payment Management', () => {
  beforeEach(() => {
    // Login as billing specialist before each test
    cy.fixture('users.json').then((users) => {
      cy.login(users.billingSpecialist.username, users.billingSpecialist.password);
    });
  });

  it('should display payment list', () => {
    // Intercept payments API request
    cy.intercept('GET', '/api/payments*').as('getPayments');

    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Verify payment list displays correctly
    cy.get('[data-testid="payment-table"]').should('be.visible');
    cy.get('[data-testid="payment-table-row"]').should('have.length.at.least', 1);
    
    // Verify payment details are displayed correctly
    cy.get('[data-testid="payment-table-row"]').first().within(() => {
      cy.get('[data-testid="payment-id"]').should('not.be.empty');
      cy.get('[data-testid="payment-payer"]').should('not.be.empty');
      cy.get('[data-testid="payment-amount"]').should('not.be.empty');
      cy.get('[data-testid="payment-date"]').should('not.be.empty');
      cy.get('[data-testid="payment-status"]').should('not.be.empty');
    });
  });

  it('should filter payments by status', () => {
    // Intercept payments API request
    cy.intercept('GET', '/api/payments*').as('getPayments');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Filter by unreconciled status
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="unreconciled"]').click();
    cy.wait('@getPayments');
    
    // Verify only unreconciled payments are shown
    cy.get('[data-testid="payment-table-row"]').each(($row) => {
      cy.wrap($row).find('[data-testid="payment-status"]').should('contain', 'Unreconciled');
    });
    
    // Filter by reconciled status
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="reconciled"]').click();
    cy.wait('@getPayments');
    
    // Verify only reconciled payments are shown
    cy.get('[data-testid="payment-table-row"]').each(($row) => {
      cy.wrap($row).find('[data-testid="payment-status"]').should('contain', 'Reconciled');
    });
  });

  it('should filter payments by date range', () => {
    // Intercept payments API request
    cy.intercept('GET', '/api/payments*').as('getPayments');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Set a custom date range
    cy.get('[data-testid="date-filter"]').click();
    cy.get('[data-testid="date-range-picker"]').within(() => {
      // Set start date to one month ago
      cy.get('[data-testid="start-date"]').clear().type(
        Cypress.dayjs().subtract(1, 'month').format('MM/DD/YYYY')
      );
      // Set end date to today
      cy.get('[data-testid="end-date"]').clear().type(
        Cypress.dayjs().format('MM/DD/YYYY')
      );
      cy.get('[data-testid="apply-date-range"]').click();
    });
    
    cy.wait('@getPayments');
    
    // Verify date filter is applied (checking filter badge is visible)
    cy.get('[data-testid="active-filters"]').should('contain', 'Date Range');
    
    // Verify at least one payment is displayed
    cy.get('[data-testid="payment-table-row"]').should('have.length.at.least', 1);
  });

  it('should display payment details', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Click on first payment to view details
    cy.get('[data-testid="payment-table-row"]').first().click();
    cy.wait('@getPaymentDetails');
    
    // Verify payment details display
    cy.get('[data-testid="payment-detail-header"]').should('be.visible');
    cy.get('[data-testid="payment-detail-payer"]').should('be.visible');
    cy.get('[data-testid="payment-detail-amount"]').should('be.visible');
    cy.get('[data-testid="payment-detail-date"]').should('be.visible');
    cy.get('[data-testid="payment-detail-method"]').should('be.visible');
    cy.get('[data-testid="payment-detail-reference"]').should('be.visible');
    cy.get('[data-testid="payment-detail-status"]').should('be.visible');
    
    // If reconciled, verify claims are displayed
    cy.get('[data-testid="payment-detail-status"]').then(($status) => {
      if ($status.text().includes('Reconciled')) {
        cy.get('[data-testid="payment-claims-table"]').should('be.visible');
        cy.get('[data-testid="payment-claim-row"]').should('have.length.at.least', 1);
      }
    });
  });

  it('should create a new payment', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('POST', '/api/payments').as('createPayment');
    cy.intercept('GET', '/api/payers').as('getPayers');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Click record payment button
    cy.get('[data-testid="record-payment-button"]').click();
    cy.wait('@getPayers');
    
    // Fill in payment form
    cy.get('[data-testid="payment-form"]').within(() => {
      // Select payer
      cy.get('[data-testid="payer-select"]').click();
      cy.get('[data-value="Medicaid"]').click();
      
      // Enter payment amount
      cy.get('[data-testid="payment-amount-input"]').type('1250.75');
      
      // Enter payment date
      cy.get('[data-testid="payment-date-input"]').type(
        Cypress.dayjs().format('MM/DD/YYYY')
      );
      
      // Select payment method
      cy.get('[data-testid="method-select"]').click();
      cy.get('[data-value="EFT"]').click();
      
      // Enter reference number
      cy.get('[data-testid="reference-input"]').type('EFT-12345');
      
      // Submit form
      cy.get('[data-testid="save-payment-button"]').click();
    });
    
    cy.wait('@createPayment');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Payment recorded successfully');
    
    // Wait for payments to reload and verify new payment
    cy.wait('@getPayments');
    cy.get('[data-testid="payment-table-row"]').should('contain', 'EFT-12345');
  });

  it('should edit a payment', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    cy.intercept('PUT', '/api/payments/*').as('updatePayment');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Find an unreconciled payment to edit
    cy.get('[data-testid="payment-table-row"]').contains('Unreconciled').first().click();
    cy.wait('@getPaymentDetails');
    
    // Click edit button
    cy.get('[data-testid="edit-payment-button"]').click();
    
    // Modify payment
    cy.get('[data-testid="payment-form"]').within(() => {
      // Update reference number
      cy.get('[data-testid="reference-input"]').clear().type('UPDATED-REF-123');
      
      // Save changes
      cy.get('[data-testid="save-payment-button"]').click();
    });
    
    cy.wait('@updatePayment');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Payment updated successfully');
    
    // Verify payment details are updated
    cy.get('[data-testid="payment-detail-reference"]').should('contain', 'UPDATED-REF-123');
  });
});

describe('Payment Reconciliation', () => {
  beforeEach(() => {
    // Login as billing specialist before each test
    cy.fixture('users.json').then((users) => {
      cy.login(users.billingSpecialist.username, users.billingSpecialist.password);
    });
  });

  it('should reconcile a payment with claims', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    cy.intercept('GET', '/api/claims/available-for-payment/*').as('getAvailableClaims');
    cy.intercept('POST', '/api/payments/*/reconcile').as('reconcilePayment');
    
    // Navigate to payments page and select an unreconciled payment
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    cy.get('[data-testid="payment-table-row"]').contains('Unreconciled').first().click();
    cy.wait('@getPaymentDetails');
    
    // Click reconcile button
    cy.get('[data-testid="reconcile-payment-button"]').click();
    cy.wait('@getAvailableClaims');
    
    // Get payment amount for comparison
    let paymentAmount;
    cy.get('[data-testid="payment-detail-amount"]').invoke('text').then((text) => {
      // Extract number from text (e.g., "$1,250.75" -> 1250.75)
      paymentAmount = parseFloat(text.replace(/[$,]/g, ''));
      
      // Select claims to reconcile
      cy.get('[data-testid="available-claims-table"]').within(() => {
        cy.get('[data-testid="claim-checkbox"]').first().check();
        
        // Enter payment amount for claim
        cy.get('[data-testid="claim-paid-amount"]').first().clear().type(paymentAmount.toString());
      });
      
      // Complete reconciliation
      cy.get('[data-testid="complete-reconciliation-button"]').click();
    });
    
    cy.wait('@reconcilePayment');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Payment reconciled successfully');
    
    // Verify payment status updated
    cy.get('[data-testid="payment-detail-status"]').should('contain', 'Reconciled');
    
    // Verify matched claims displayed
    cy.get('[data-testid="payment-claims-table"]').should('be.visible');
    cy.get('[data-testid="payment-claim-row"]').should('have.length', 1);
  });

  it('should add adjustments during reconciliation', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    cy.intercept('GET', '/api/claims/available-for-payment/*').as('getAvailableClaims');
    cy.intercept('GET', '/api/adjustment-codes').as('getAdjustmentCodes');
    cy.intercept('POST', '/api/payments/*/reconcile').as('reconcilePayment');
    
    // Navigate to payments page and select an unreconciled payment
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    cy.get('[data-testid="payment-table-row"]').contains('Unreconciled').first().click();
    cy.wait('@getPaymentDetails');
    
    // Click reconcile button
    cy.get('[data-testid="reconcile-payment-button"]').click();
    cy.wait('@getAvailableClaims');
    
    // Get payment amount for comparison
    let paymentAmount;
    cy.get('[data-testid="payment-detail-amount"]').invoke('text').then((text) => {
      // Extract number from text (e.g., "$1,250.75" -> 1250.75)
      paymentAmount = parseFloat(text.replace(/[$,]/g, ''));
      
      // Calculate adjustment amount (10% of payment)
      const adjustmentAmount = (paymentAmount * 0.1).toFixed(2);
      const paidAmount = (paymentAmount - parseFloat(adjustmentAmount)).toFixed(2);
      
      // Select claims to reconcile
      cy.get('[data-testid="available-claims-table"]').within(() => {
        cy.get('[data-testid="claim-checkbox"]').first().check();
        
        // Enter payment amount for claim (less than the full amount)
        cy.get('[data-testid="claim-paid-amount"]').first().clear().type(paidAmount);
        
        // Add adjustment
        cy.get('[data-testid="add-adjustment-button"]').first().click();
      });
      
      // Wait for adjustment codes to load
      cy.wait('@getAdjustmentCodes');
      
      // Fill in adjustment
      cy.get('[data-testid="adjustment-form"]').within(() => {
        // Select adjustment type
        cy.get('[data-testid="adjustment-type-select"]').click();
        cy.get('[data-value="contractual"]').click();
        
        // Select adjustment code
        cy.get('[data-testid="adjustment-code-select"]').click();
        cy.get('[data-value="CO45"]').click();
        
        // Enter adjustment amount
        cy.get('[data-testid="adjustment-amount-input"]').type(adjustmentAmount);
        
        // Add adjustment
        cy.get('[data-testid="save-adjustment-button"]').click();
      });
      
      // Verify adjustment is added
      cy.get('[data-testid="adjustment-row"]').should('be.visible');
      
      // Complete reconciliation
      cy.get('[data-testid="complete-reconciliation-button"]').click();
    });
    
    cy.wait('@reconcilePayment');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Payment reconciled successfully');
    
    // Verify payment status updated
    cy.get('[data-testid="payment-detail-status"]').should('contain', 'Reconciled');
    
    // Verify adjustments displayed
    cy.get('[data-testid="payment-claims-table"]').should('be.visible');
    cy.get('[data-testid="adjustment-row"]').should('be.visible');
    cy.get('[data-testid="adjustment-code"]').should('contain', 'CO45');
  });

  it('should auto-reconcile a payment', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    cy.intercept('POST', '/api/payments/*/auto-reconcile').as('autoReconcilePayment');
    
    // Navigate to payments page and select an unreconciled payment
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    cy.get('[data-testid="payment-table-row"]').contains('Unreconciled').first().click();
    cy.wait('@getPaymentDetails');
    
    // Click auto-reconcile button
    cy.get('[data-testid="auto-reconcile-button"]').click();
    
    // Confirm auto-reconciliation
    cy.get('[data-testid="confirm-dialog"]').within(() => {
      cy.get('[data-testid="confirm-button"]').click();
    });
    
    cy.wait('@autoReconcilePayment');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Payment auto-reconciled successfully');
    
    // Verify payment status updated
    cy.get('[data-testid="payment-detail-status"]').should('contain', 'Reconciled');
    
    // Verify matched claims displayed
    cy.get('[data-testid="payment-claims-table"]').should('be.visible');
    cy.get('[data-testid="payment-claim-row"]').should('have.length.at.least', 1);
  });

  it('should undo a reconciliation', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPaymentDetails');
    cy.intercept('POST', '/api/payments/*/undo-reconcile').as('undoReconciliation');
    
    // Navigate to payments page and select a reconciled payment
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    cy.get('[data-testid="payment-table-row"]').contains('Reconciled').first().click();
    cy.wait('@getPaymentDetails');
    
    // Click undo reconciliation button
    cy.get('[data-testid="undo-reconciliation-button"]').click();
    
    // Confirm undo action
    cy.get('[data-testid="confirm-dialog"]').within(() => {
      cy.get('[data-testid="confirm-button"]').click();
    });
    
    cy.wait('@undoReconciliation');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Reconciliation undone successfully');
    
    // Verify payment status updated
    cy.get('[data-testid="payment-detail-status"]').should('contain', 'Unreconciled');
    
    // Verify no matched claims displayed
    cy.get('[data-testid="payment-claims-table"]').should('not.exist');
  });
});

describe('Remittance Processing', () => {
  beforeEach(() => {
    // Login as billing specialist before each test
    cy.fixture('users.json').then((users) => {
      cy.login(users.billingSpecialist.username, users.billingSpecialist.password);
    });
  });

  it('should import a remittance file', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payers').as('getPayers');
    cy.intercept('POST', '/api/payments/remittance').as('uploadRemittance');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Click import remittance button
    cy.get('[data-testid="import-remittance-button"]').click();
    cy.wait('@getPayers');
    
    // Fill remittance import form
    cy.get('[data-testid="remittance-form"]').within(() => {
      // Select payer
      cy.get('[data-testid="payer-select"]').click();
      cy.get('[data-value="Medicaid"]').click();
      
      // Select file type
      cy.get('[data-testid="file-type-select"]').click();
      cy.get('[data-value="835"]').click();
      
      // Upload remittance file
      cy.get('[data-testid="file-upload-input"]').attachFile('remittance-sample.835');
      
      // Submit form
      cy.get('[data-testid="process-remittance-button"]').click();
    });
    
    cy.wait('@uploadRemittance');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Remittance processed successfully');
    
    // Verify results display
    cy.get('[data-testid="remittance-results"]').should('be.visible');
    cy.get('[data-testid="payments-created"]').should('contain', '1');
    
    // Verify new payment is created
    cy.wait('@getPayments');
    cy.get('[data-testid="payment-table-row"]').first().should('contain', 'Medicaid');
  });

  it('should handle remittance processing errors', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payers').as('getPayers');
    cy.intercept('POST', '/api/payments/remittance', {
      statusCode: 400,
      body: {
        message: 'Invalid file format',
        errors: [
          'Line 10: Invalid claim reference identifier',
          'Line 15: Missing service date'
        ]
      }
    }).as('uploadRemittance');
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
    
    // Click import remittance button
    cy.get('[data-testid="import-remittance-button"]').click();
    cy.wait('@getPayers');
    
    // Fill remittance import form
    cy.get('[data-testid="remittance-form"]').within(() => {
      // Select payer
      cy.get('[data-testid="payer-select"]').click();
      cy.get('[data-value="Medicaid"]').click();
      
      // Select file type
      cy.get('[data-testid="file-type-select"]').click();
      cy.get('[data-value="835"]').click();
      
      // Upload invalid remittance file
      cy.get('[data-testid="file-upload-input"]').attachFile('invalid-remittance.835');
      
      // Submit form
      cy.get('[data-testid="process-remittance-button"]').click();
    });
    
    cy.wait('@uploadRemittance');
    
    // Verify error message
    cy.get('[data-testid="error-notification"]').should('be.visible');
    cy.get('[data-testid="error-notification"]').should('contain', 'Invalid file format');
    
    // Verify error details
    cy.get('[data-testid="error-details"]').should('contain', 'Invalid claim reference identifier');
    cy.get('[data-testid="error-details"]').should('contain', 'Missing service date');
  });
});

describe('Accounts Receivable', () => {
  beforeEach(() => {
    // Login as financial manager before each test
    cy.fixture('users.json').then((users) => {
      cy.login(users.financialManager.username, users.financialManager.password);
    });
  });

  it('should view accounts receivable aging report', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/reports/ar-aging*').as('getAgingReport');
    
    // Navigate to accounts receivable page
    cy.visit('/reports/accounts-receivable');
    cy.wait('@getAgingReport');
    
    // Verify aging report displays
    cy.get('[data-testid="ar-aging-report"]').should('be.visible');
    
    // Verify aging buckets display
    cy.get('[data-testid="aging-buckets"]').should('be.visible');
    cy.get('[data-testid="bucket-current"]').should('be.visible');
    cy.get('[data-testid="bucket-30days"]').should('be.visible');
    cy.get('[data-testid="bucket-60days"]').should('be.visible');
    cy.get('[data-testid="bucket-90days"]').should('be.visible');
    cy.get('[data-testid="bucket-120days"]').should('be.visible');
    
    // Verify payer breakdown
    cy.get('[data-testid="payer-breakdown"]').should('be.visible');
    cy.get('[data-testid="payer-row"]').should('have.length.at.least', 1);
    
    // Verify totals
    cy.get('[data-testid="total-ar"]').should('be.visible');
  });
  
  it('should filter aging report by payer', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/reports/ar-aging*').as('getAgingReport');
    
    // Navigate to accounts receivable page
    cy.visit('/reports/accounts-receivable');
    cy.wait('@getAgingReport');
    
    // Filter by payer
    cy.get('[data-testid="payer-filter"]').click();
    cy.get('[data-value="Medicaid"]').click();
    cy.wait('@getAgingReport');
    
    // Verify payer filter applied
    cy.get('[data-testid="active-filters"]').should('contain', 'Medicaid');
    
    // Verify only selected payer data is shown
    cy.get('[data-testid="payer-breakdown"]').within(() => {
      cy.get('[data-testid="payer-row"]').should('have.length', 1);
      cy.get('[data-testid="payer-name"]').should('contain', 'Medicaid');
    });
  });

  it('should export aging report', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/reports/ar-aging*').as('getAgingReport');
    cy.intercept('GET', '/api/reports/ar-aging/export*').as('exportReport');
    
    // Navigate to accounts receivable page
    cy.visit('/reports/accounts-receivable');
    cy.wait('@getAgingReport');
    
    // Click export button
    cy.get('[data-testid="export-report-button"]').click();
    
    // Select PDF format
    cy.get('[data-testid="export-options"]').within(() => {
      cy.get('[data-testid="pdf-option"]').click();
    });
    
    // Trigger export
    cy.get('[data-testid="confirm-export-button"]').click();
    cy.wait('@exportReport');
    
    // Verify success message
    cy.get('[data-testid="success-notification"]').should('be.visible');
    cy.get('[data-testid="success-notification"]').should('contain', 'Report exported successfully');
  });

  it('should show detailed claim list for aging bucket', () => {
    // Intercept API requests
    cy.intercept('GET', '/api/reports/ar-aging*').as('getAgingReport');
    cy.intercept('GET', '/api/reports/ar-aging/claims*').as('getAgingClaims');
    
    // Navigate to accounts receivable page
    cy.visit('/reports/accounts-receivable');
    cy.wait('@getAgingReport');
    
    // Click on 30-60 days bucket to see claims
    cy.get('[data-testid="bucket-30days"]').click();
    cy.wait('@getAgingClaims');
    
    // Verify claims list displays
    cy.get('[data-testid="aging-claims-dialog"]').should('be.visible');
    cy.get('[data-testid="aging-claims-table"]').should('be.visible');
    cy.get('[data-testid="aging-claim-row"]').should('have.length.at.least', 1);
    
    // Verify claim details
    cy.get('[data-testid="aging-claim-row"]').first().within(() => {
      cy.get('[data-testid="claim-id"]').should('not.be.empty');
      cy.get('[data-testid="claim-client"]').should('not.be.empty');
      cy.get('[data-testid="claim-amount"]').should('not.be.empty');
      cy.get('[data-testid="claim-date"]').should('not.be.empty');
      cy.get('[data-testid="claim-payer"]').should('not.be.empty');
      cy.get('[data-testid="claim-age"]').should('contain', 'days');
    });
    
    // Close dialog
    cy.get('[data-testid="close-dialog-button"]').click();
    cy.get('[data-testid="aging-claims-dialog"]').should('not.exist');
  });
});