import { LoginCredentials } from '../../src/types/auth.types';
import { PaymentStatus } from '../../src/types/common.types';

// Test user credentials
const testUser: LoginCredentials = {
  email: 'finance@example.com',
  password: 'Password123!',
  rememberMe: false
};

// Test payment data
const testPayment = {
  payerId: '550e8400-e29b-41d4-a716-446655440010',
  paymentDate: '2023-06-01',
  paymentAmount: 5678.9,
  paymentMethod: 'EFT',
  referenceNumber: 'EF123',
  notes: 'Test payment created by Cypress'
};

// Test reconciliation data
const testReconciliationData = {
  claimPayments: [
    {
      claimId: 'cl1d8c7b6-a5a4-4f3e-9d2c-1b0d9f8e7c6b',
      amount: 450.0,
      adjustments: []
    },
    {
      claimId: 'cl4g1f2e3-d4c5-4f3e-9d2c-1b0d9f8e7c6b',
      amount: 3600.0,
      adjustments: []
    }
  ],
  notes: 'Reconciled by Cypress test'
};

// Selectors organized by component
const selectors = {
  paymentList: {
    container: "[data-testid='payment-list']",
    rows: "[data-testid='payment-row']",
    pagination: "[data-testid='pagination']",
    filterButton: "[data-testid='filter-button']",
    filterPanel: "[data-testid='filter-panel']",
    statusFilter: "[data-testid='status-filter']",
    dateRangeFilter: "[data-testid='date-range-filter']",
    payerFilter: "[data-testid='payer-filter']",
    searchInput: "[data-testid='search-input']",
    addButton: "[data-testid='add-payment-button']",
    importButton: "[data-testid='import-remittance-button']",
    batchReconcileButton: "[data-testid='batch-reconcile-button']",
    checkboxes: "[data-testid='payment-checkbox']"
  },
  paymentDetail: {
    container: "[data-testid='payment-detail']",
    header: "[data-testid='payment-header']",
    info: "[data-testid='payment-info']",
    status: "[data-testid='payment-status']",
    reconcileButton: "[data-testid='reconcile-button']",
    editButton: "[data-testid='edit-button']",
    deleteButton: "[data-testid='delete-button']",
    claimsList: "[data-testid='claims-list']"
  },
  paymentForm: {
    container: "[data-testid='payment-form']",
    payerSelect: "[data-testid='payer-select']",
    dateInput: "[data-testid='payment-date-input']",
    amountInput: "[data-testid='payment-amount-input']",
    methodSelect: "[data-testid='payment-method-select']",
    referenceInput: "[data-testid='reference-number-input']",
    notesInput: "[data-testid='notes-input']",
    submitButton: "[data-testid='submit-button']",
    cancelButton: "[data-testid='cancel-button']"
  },
  reconciliationForm: {
    container: "[data-testid='reconciliation-form']",
    paymentInfo: "[data-testid='payment-info']",
    claimsTable: "[data-testid='claims-table']",
    claimCheckboxes: "[data-testid='claim-checkbox']",
    amountInputs: "[data-testid='amount-input']",
    addAdjustmentButtons: "[data-testid='add-adjustment-button']",
    adjustmentForms: "[data-testid='adjustment-form']",
    notesInput: "[data-testid='notes-input']",
    submitButton: "[data-testid='submit-button']",
    cancelButton: "[data-testid='cancel-button']"
  },
  remittanceImport: {
    container: "[data-testid='remittance-import']",
    fileInput: "[data-testid='file-input']",
    payerSelect: "[data-testid='payer-select']",
    fileTypeSelect: "[data-testid='file-type-select']",
    submitButton: "[data-testid='submit-button']",
    cancelButton: "[data-testid='cancel-button']"
  },
  agingReport: {
    container: "[data-testid='aging-report']",
    summary: "[data-testid='aging-summary']",
    agingBuckets: "[data-testid='aging-buckets']",
    payerBreakdown: "[data-testid='payer-breakdown']",
    programBreakdown: "[data-testid='program-breakdown']",
    exportButton: "[data-testid='export-button']",
    dateFilter: "[data-testid='as-of-date-filter']"
  },
  toast: {
    success: '.Toastify__toast--success',
    error: '.Toastify__toast--error'
  },
  login: {
    emailInput: "[data-testid='email-input']",
    passwordInput: "[data-testid='password-input']",
    submitButton: "[data-testid='login-button']"
  }
};

describe('Payment Management', () => {
  beforeEach(() => {
    // Preserve cookies between tests to maintain login state
    cy.viewport(1280, 800);
    
    // Set up API intercepts
    cy.intercept('GET', '/api/payments*').as('getPayments');
    cy.intercept('GET', '/api/payments/*').as('getPayment');
    cy.intercept('POST', '/api/payments').as('createPayment');
    cy.intercept('PUT', '/api/payments/*').as('updatePayment');
    cy.intercept('DELETE', '/api/payments/*').as('deletePayment');
    cy.intercept('POST', '/api/payments/*/reconcile').as('reconcilePayment');
    cy.intercept('POST', '/api/payments/remittance').as('importRemittance');
    cy.intercept('GET', '/api/payments/aging*').as('getAgingReport');
    cy.intercept('GET', '/api/payments/*/suggested-matches').as('getSuggestedMatches');
    cy.intercept('POST', '/api/payments/batch-reconcile').as('batchReconcile');
    
    // Login before each test
    cy.session('finance-user', () => {
      cy.visit('/login');
      cy.get(selectors.login.emailInput).type(testUser.email);
      cy.get(selectors.login.passwordInput).type(testUser.password);
      cy.get(selectors.login.submitButton).click();
      
      // Verify successful login
      cy.url().should('not.include', '/login');
      cy.getCookie('auth_token').should('exist');
    });
    
    // Navigate to payments page
    cy.visit('/payments');
    cy.wait('@getPayments');
  });

  describe('Payment List View', () => {
    it('should display payment list', () => {
      cy.get(selectors.paymentList.container).should('be.visible');
      cy.get(selectors.paymentList.rows).should('have.length.gt', 0);
      cy.get(selectors.paymentList.pagination).should('be.visible');
      
      // Verify payment data is displayed correctly
      cy.get(selectors.paymentList.rows).first().within(() => {
        cy.contains(/\$[0-9,]+\.[0-9]{2}/); // Should contain a dollar amount
        cy.contains(/(EFT|Check|Credit Card)/i); // Should contain payment method
      });
    });

    it('should filter payments', () => {
      // Open filter panel
      cy.get(selectors.paymentList.filterButton).click();
      cy.get(selectors.paymentList.filterPanel).should('be.visible');
      
      // Filter by status
      cy.get(selectors.paymentList.statusFilter).click();
      cy.contains('Reconciled').click();
      cy.wait('@getPayments');
      
      // Filter by date range
      cy.get(selectors.paymentList.dateRangeFilter).click();
      cy.contains('Last 30 Days').click();
      cy.wait('@getPayments');
      
      // Filter by payer
      cy.get(selectors.paymentList.payerFilter).click();
      cy.contains('Medicaid').click();
      cy.wait('@getPayments');
      
      // Verify filters applied
      cy.get(selectors.paymentList.container).should('contain', 'Filters:');
      cy.get(selectors.paymentList.container).should('contain', 'Reconciled');
      cy.get(selectors.paymentList.container).should('contain', 'Last 30 Days');
      cy.get(selectors.paymentList.container).should('contain', 'Medicaid');
    });
  });

  describe('Payment Management', () => {
    it('should create a new payment', () => {
      cy.get(selectors.paymentList.addButton).click();
      
      // Fill out payment form
      cy.get(selectors.paymentForm.container).should('be.visible');
      cy.get(selectors.paymentForm.payerSelect).click();
      cy.contains('Medicaid').click();
      cy.get(selectors.paymentForm.dateInput).type(testPayment.paymentDate);
      cy.get(selectors.paymentForm.amountInput).type(testPayment.paymentAmount.toString());
      cy.get(selectors.paymentForm.methodSelect).click();
      cy.contains(testPayment.paymentMethod).click();
      cy.get(selectors.paymentForm.referenceInput).type(testPayment.referenceNumber);
      cy.get(selectors.paymentForm.notesInput).type(testPayment.notes);
      
      // Submit form
      cy.get(selectors.paymentForm.submitButton).click();
      cy.wait('@createPayment');
      
      // Verify success
      cy.get(selectors.toast.success).should('be.visible');
      cy.get(selectors.paymentList.container).should('be.visible');
      cy.get(selectors.paymentList.rows).should('contain', testPayment.referenceNumber);
    });

    it('should view payment details', () => {
      // Click on a payment
      cy.get(selectors.paymentList.rows).first().click();
      cy.wait('@getPayment');
      
      // Verify payment detail view
      cy.get(selectors.paymentDetail.container).should('be.visible');
      cy.get(selectors.paymentDetail.header).should('be.visible');
      cy.get(selectors.paymentDetail.info).should('be.visible');
      cy.get(selectors.paymentDetail.status).should('be.visible');
      
      // Verify payment actions are available
      cy.get(selectors.paymentDetail.editButton).should('be.visible');
    });
  });

  describe('Payment Reconciliation', () => {
    it('should reconcile a payment', () => {
      // Find an unreconciled payment
      cy.get(selectors.paymentList.filterButton).click();
      cy.get(selectors.paymentList.statusFilter).click();
      cy.contains('Received').click();
      cy.wait('@getPayments');
      
      // Click on an unreconciled payment
      cy.get(selectors.paymentList.rows).first().click();
      cy.wait('@getPayment');
      
      // Click reconcile button
      cy.get(selectors.paymentDetail.reconcileButton).click();
      cy.wait('@getSuggestedMatches');
      
      // Verify reconciliation form
      cy.get(selectors.reconciliationForm.container).should('be.visible');
      cy.get(selectors.reconciliationForm.paymentInfo).should('be.visible');
      cy.get(selectors.reconciliationForm.claimsTable).should('be.visible');
      
      // Select claims to reconcile
      cy.get(selectors.reconciliationForm.claimCheckboxes).first().check();
      cy.get(selectors.reconciliationForm.claimCheckboxes).eq(1).check();
      
      // Enter payment amounts
      cy.get(selectors.reconciliationForm.amountInputs).first().clear().type('450.00');
      cy.get(selectors.reconciliationForm.amountInputs).eq(1).clear().type('3600.00');
      
      // Add notes
      cy.get(selectors.reconciliationForm.notesInput).type(testReconciliationData.notes);
      
      // Submit reconciliation
      cy.get(selectors.reconciliationForm.submitButton).click();
      cy.wait('@reconcilePayment');
      
      // Verify success
      cy.get(selectors.toast.success).should('be.visible');
      cy.get(selectors.paymentDetail.status).should('contain', 'Reconciled');
    });

    it('should perform batch reconciliation', () => {
      // Find multiple unreconciled payments
      cy.get(selectors.paymentList.filterButton).click();
      cy.get(selectors.paymentList.statusFilter).click();
      cy.contains('Received').click();
      cy.wait('@getPayments');
      
      // Select two payments
      cy.get(selectors.paymentList.checkboxes).first().check();
      cy.get(selectors.paymentList.checkboxes).eq(1).check();
      
      // Click batch reconcile button
      cy.get(selectors.paymentList.batchReconcileButton).click();
      
      // Verify batch reconciliation interface
      cy.contains('Batch Reconciliation').should('be.visible');
      
      // Process each payment in batch
      cy.get('[data-testid="batch-payment-item"]').first().within(() => {
        cy.contains('Process').click();
        
        // Select claims and submit
        cy.get(selectors.reconciliationForm.claimCheckboxes).first().check();
        cy.get(selectors.reconciliationForm.amountInputs).first().clear().type('450.00');
        cy.get(selectors.reconciliationForm.submitButton).click();
      });
      
      cy.get('[data-testid="batch-payment-item"]').eq(1).within(() => {
        cy.contains('Process').click();
        
        // Select claims and submit
        cy.get(selectors.reconciliationForm.claimCheckboxes).first().check();
        cy.get(selectors.reconciliationForm.amountInputs).first().clear().type('550.00');
        cy.get(selectors.reconciliationForm.submitButton).click();
      });
      
      // Complete batch reconciliation
      cy.contains('Complete Batch').click();
      cy.wait('@batchReconcile');
      
      // Verify success
      cy.get(selectors.toast.success).should('be.visible');
      cy.contains('2 payments successfully reconciled').should('be.visible');
    });
  });

  describe('Remittance Processing', () => {
    it('should import a remittance file', () => {
      // Click import remittance button
      cy.get(selectors.paymentList.importButton).click();
      
      // Verify import form
      cy.get(selectors.remittanceImport.container).should('be.visible');
      
      // Select payer
      cy.get(selectors.remittanceImport.payerSelect).click();
      cy.contains('Medicaid').click();
      
      // Select file type
      cy.get(selectors.remittanceImport.fileTypeSelect).click();
      cy.contains('835 EDI').click();
      
      // Upload file
      cy.get(selectors.remittanceImport.fileInput).attachFile('test-remittance.835');
      
      // Submit import
      cy.get(selectors.remittanceImport.submitButton).click();
      cy.wait('@importRemittance');
      
      // Verify success
      cy.get(selectors.toast.success).should('be.visible');
      cy.contains('Remittance file successfully imported').should('be.visible');
    });
  });

  describe('Accounts Receivable', () => {
    it('should view accounts receivable aging report', () => {
      // Navigate to AR page
      cy.visit('/payments/aging');
      cy.wait('@getAgingReport');
      
      // Verify aging report components
      cy.get(selectors.agingReport.container).should('be.visible');
      cy.get(selectors.agingReport.summary).should('be.visible');
      cy.get(selectors.agingReport.agingBuckets).should('be.visible');
      
      // Verify aging buckets
      cy.get(selectors.agingReport.agingBuckets).should('contain', '0-30 Days');
      cy.get(selectors.agingReport.agingBuckets).should('contain', '31-60 Days');
      cy.get(selectors.agingReport.agingBuckets).should('contain', '61-90 Days');
      cy.get(selectors.agingReport.agingBuckets).should('contain', '91+ Days');
      
      // Verify payer breakdown
      cy.get(selectors.agingReport.payerBreakdown).should('be.visible');
      cy.get(selectors.agingReport.payerBreakdown).should('contain', 'Medicaid');
      
      // Verify program breakdown
      cy.get(selectors.agingReport.programBreakdown).should('be.visible');
    });
  });
});