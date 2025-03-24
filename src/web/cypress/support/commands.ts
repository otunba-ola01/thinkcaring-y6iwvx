// Import necessary types and interfaces
import { LoginCredentials } from '../../src/types/auth.types';
import { ClaimStatus, PaymentStatus } from '../../src/types/common.types';
import { createMockAuthUser, createMockClaim, createMockPayment, createMockService } from '../../src/utils/test-utils';
import { AUTH_STORAGE_KEYS } from '../../src/constants/auth.constants';

// Import Cypress commands and plugins
import cypress from 'cypress'; // cypress v12.0+
import '@testing-library/cypress/add-commands'; // @testing-library/cypress v9.0+
import 'cypress-axe'; // cypress-axe v1.4+
import 'cypress-real-events/support'; // cypress-real-events v1.7+
import 'cypress-localstorage-commands'; // cypress-localstorage-commands v2.2+

// Extend the existing Cypress interface with custom commands
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      login(credentials: LoginCredentials): Chainable<Element>;
      loginByApi(credentials: LoginCredentials): Chainable<any>;
      logout(): Chainable<Element>;
      setupAuthState(user: any, tokens: any): Chainable<void>;
      checkAccessibility(options?: any): Chainable<void>;
      fillClaimForm(claimData: any): Chainable<Element>;
      fillPaymentForm(paymentData: any): Chainable<Element>;
      selectFromDropdown(selector: string, optionText: string): Chainable<Element>;
      selectDateFromPicker(selector: string, date: string): Chainable<Element>;
      uploadFile(selector: string, filePath: string, fileType: string): Chainable<Element>;
      mockApiResponse(method: string, url: string, response: any, statusCode?: number): Chainable<null>;
      waitForTableToLoad(selector: string): Chainable<Element>;
      verifyToastMessage(message: string, type: string): Chainable<Element>;
      navigateToMenu(menuName: string, subMenuName?: string): Chainable<Element>;
      createClaim(claimData: any): Chainable<any>;
      createPayment(paymentData: any): Chainable<any>;
      createService(serviceData: any): Chainable<any>;
    }
  }
}

// Custom command to log in a user with the specified credentials
Cypress.Commands.add('login', (credentials: LoginCredentials) => {
  cy.visit('/auth/login'); // Visit the login page
  cy.findByLabelText(/email/i).type(credentials.email); // Type username/email into the email field
  cy.findByLabelText(/password/i).type(credentials.password); // Type password into the password field
  cy.findByRole('button', { name: /log in/i }).click(); // Click the login button
  cy.url().should('include', '/dashboard'); // Wait for the dashboard page to load
  cy.findByText(/revenue metrics/i).should('be.visible'); // Verify successful login by checking for dashboard elements
});

// Custom command to log in a user via API call, bypassing the UI
Cypress.Commands.add('loginByApi', (credentials: LoginCredentials) => {
  cy.request({ // Make a POST request to the login API endpoint with credentials
    method: 'POST',
    url: '/api/auth/login',
    body: credentials
  }).then((response) => {
    // Store the returned tokens in localStorage
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.body.tokens.accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.body.tokens.refreshToken);
    // Store the user data in localStorage
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.body.user));
    return response; // Return the API response for chaining
  });
});

// Custom command to log out the current user
Cypress.Commands.add('logout', () => {
  cy.findByRole('button', { name: /open user menu/i }).click(); // Click on the user profile menu
  cy.findByRole('menuitem', { name: /logout/i }).click(); // Click on the logout option
  cy.url().should('include', '/auth/login'); // Wait for redirect to login page
  cy.findByRole('button', { name: /log in/i }).should('be.visible'); // Verify logout by checking for login form
});

// Custom command to set up authentication state without going through the login flow
Cypress.Commands.add('setupAuthState', (user: any, tokens: any) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken); // Set localStorage items for access token, refresh token, and user data
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  cy.visit('/dashboard'); // Visit the dashboard page
});

// Custom command to check accessibility of the current page
Cypress.Commands.add('checkAccessibility', (options?: any) => {
  cy.injectAxe(); // Inject axe-core into the page
  cy.configureAxe({
    rules: [
      {
        id: 'color-contrast',
        enabled: false,
      },
    ],
  });
  cy.checkA11y(undefined, options, (violations) => { // Run accessibility checks with specified options
    cy.task('log', `${violations.length} accessibility violations found`) // Log accessibility violations to the console
    if (violations.length) {
      cy.task(
        'log',
        violations.map(
          ({ id, impact, description, nodes }) =>
            `${id} (${impact}): ${description}\n${nodes
              .map((node) => node.html)
              .join('\n')}`
        )
      )
    }
  });
});

// Custom command to fill out a claim form with the specified data
Cypress.Commands.add('fillClaimForm', (claimData: any) => {
  cy.get('#client-dropdown').click(); // Select client from dropdown
  cy.get(`[data-value="${claimData.clientId}"]`).click();
  cy.get('#service-type-dropdown').click(); // Select service type from dropdown
  cy.get(`[data-value="${claimData.serviceTypeId}"]`).click();
  cy.get('#service-date').type(claimData.serviceDate); // Enter service date
  cy.get('#units').type(claimData.units); // Enter units and rate
  cy.get('#rate').type(claimData.rate);
  cy.get('#payer-dropdown').click(); // Select payer from dropdown
  cy.get(`[data-value="${claimData.payerId}"]`).click();
  // Fill any additional fields based on provided data
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to fill out a payment form with the specified data
Cypress.Commands.add('fillPaymentForm', (paymentData: any) => {
  cy.get('#payer-dropdown').click(); // Select payer from dropdown
  cy.get(`[data-value="${paymentData.payerId}"]`).click();
  cy.get('#payment-date').type(paymentData.paymentDate); // Enter payment date
  cy.get('#payment-amount').type(paymentData.paymentAmount); // Enter payment amount
  cy.get('#payment-method-dropdown').click(); // Select payment method
  cy.get(`[data-value="${paymentData.paymentMethod}"]`).click();
  if (paymentData.referenceNumber) { // Enter reference number if provided
    cy.get('#reference-number').type(paymentData.referenceNumber);
  }
  // Fill any additional fields based on provided data
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to select an option from a dropdown component
Cypress.Commands.add('selectFromDropdown', (selector: string, optionText: string) => {
  cy.get(selector).click(); // Click on the dropdown to open it
  cy.findByRole('option', { name: optionText }).click(); // Find and click on the option with the specified text
  cy.get(selector).should('contain', optionText); // Verify the selection was made correctly
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to select a date from a date picker component
Cypress.Commands.add('selectDateFromPicker', (selector: string, date: string) => {
  cy.get(selector).click(); // Click on the date picker to open it
  cy.get('.react-datepicker__navigation--next').click(); // Navigate to the correct month and year
  cy.findByText(date).click(); // Click on the specified date
  cy.get(selector).should('have.value', date); // Verify the date was selected correctly
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to upload a file to a file input
Cypress.Commands.add('uploadFile', (selector: string, filePath: string, fileType: string) => {
  cy.get(selector).then(subject => { // Get the file input element
    cy.fixture(filePath, 'base64') // Upload the specified file
      .then(Cypress.Blob.base64StringToBlob)
      .then(blob => {
        const el = subject[0] as HTMLInputElement;
        const testFile = new File([blob], 'test-file', { type: fileType });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(testFile);
        el.files = dataTransfer.files;
        cy.wrap(subject).trigger('change', { force: true });
      });
  });
  cy.get(selector).should('have.value', 'C:\\fakepath\\test-file'); // Verify the file was uploaded successfully
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to mock an API response
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any, statusCode: number = 200) => {
  cy.intercept(method, url, { // Set up a Cypress route to intercept the specified API call
    statusCode: statusCode,
    body: response, // Configure the mock response with provided data and status code
  }).as('mockApi');
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to wait for a data table to load
Cypress.Commands.add('waitForTableToLoad', (selector: string) => {
  cy.get(selector).should('be.visible'); // Wait for the table element to be visible
  cy.get(`${selector} .MuiTable-root`).should('be.visible'); // Wait for the loading indicator to disappear
  cy.get(`${selector} tbody tr`).should('have.length.greaterThan', 0); // Verify that the table contains rows
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to verify a toast notification message
Cypress.Commands.add('verifyToastMessage', (message: string, type: string) => {
  cy.get('.Toastify__toast-container').should('be.visible'); // Wait for toast notification to appear
  cy.get('.Toastify__toast-body').should('contain', message); // Verify the message text matches expected value
  cy.get(`.Toastify__toast--${type}`).should('be.visible'); // Verify the toast type (success, error, warning, info) matches expected value
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to navigate to a specific menu item
Cypress.Commands.add('navigateToMenu', (menuName: string, subMenuName?: string) => {
  cy.contains(menuName).click(); // Click on the main menu item
  if (subMenuName) { // If submenu is specified, wait for submenu to appear and click on it
    cy.contains(subMenuName).click();
  }
  cy.url().should('not.contain', 'auth/login'); // Wait for the page to load
  return cy.wrap(null); // Return the Cypress chainable for continued commands
});

// Custom command to create a claim via API
Cypress.Commands.add('createClaim', (claimData: any) => {
  cy.request({ // Make a POST request to the claims API endpoint with claim data
    method: 'POST',
    url: '/api/claims',
    body: claimData
  }).then((response) => {
    expect(response.status).to.eq(201); // Verify successful creation
    return response; // Return the API response for chaining
  });
});

// Custom command to create a payment via API
Cypress.Commands.add('createPayment', (paymentData: any) => {
  cy.request({ // Make a POST request to the payments API endpoint with payment data
    method: 'POST',
    url: '/api/payments',
    body: paymentData
  }).then((response) => {
    expect(response.status).to.eq(201); // Verify successful creation
    return response; // Return the API response for chaining
  });
});

// Custom command to create a service via API
Cypress.Commands.add('createService', (serviceData: any) => {
  cy.request({ // Make a POST request to the services API endpoint with service data
    method: 'POST',
    url: '/api/services',
    body: serviceData
  }).then((response) => {
    expect(response.status).to.eq(201); // Verify successful creation
    return response; // Return the API response for chaining
  });
});