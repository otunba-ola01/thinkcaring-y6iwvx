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

// Import custom Cypress commands
import './commands';
// Set default viewport size for consistent testing across different screens
Cypress.config("viewportWidth", 1280);
Cypress.config("viewportHeight", 720);

// Set base URL for the application under test
Cypress.config("baseUrl", "http://localhost:3000");

// Set default command timeout to allow for slower operations
Cypress.config("defaultCommandTimeout", 10000);

// Set timeout for network requests
Cypress.config("requestTimeout", 15000);

// Set timeout for network responses
Cypress.config("responseTimeout", 15000);

// Set timeout for page loads
Cypress.config("pageLoadTimeout", 30000);