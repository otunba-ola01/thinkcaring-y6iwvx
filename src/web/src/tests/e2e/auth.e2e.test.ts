import { mockUsers } from '../utils/mock-data';
import '@testing-library/cypress';

describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should login successfully with valid credentials', () => {
      // Mock successful login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: mockUsers[0].id,
            email: mockUsers[0].email,
            firstName: mockUsers[0].firstName,
            lastName: mockUsers[0].lastName,
            role: mockUsers[0].roleName,
            permissions: ['claims:view', 'claims:create', 'billing:submit'],
            mfaEnabled: false,
            lastLogin: new Date().toISOString(),
            status: 'active',
            organization: {
              id: '12345',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date().getTime() + 3600000 // 1 hour from now
          },
          mfaRequired: false,
          mfaResponse: null
        }
      }).as('loginRequest');

      // Fill login form
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();

      // Verify request and redirect
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
      cy.getCookie('auth-token').should('exist');
    });

    it('should show error message with invalid credentials', () => {
      // Mock failed login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            details: null
          }
        }
      }).as('loginRequest');

      // Fill login form with invalid credentials
      cy.findByLabelText(/email/i).type('invalid@example.com');
      cy.findByLabelText(/password/i).type('wrongpassword');
      cy.findByRole('button', { name: /login/i }).click();

      // Verify request and error message
      cy.wait('@loginRequest');
      cy.findByText(/invalid email or password/i).should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      // Try to submit without filling in any fields
      cy.findByRole('button', { name: /login/i }).click();

      // Check validation messages
      cy.findByText(/email is required/i).should('be.visible');
      cy.findByText(/password is required/i).should('be.visible');

      // Fill in only email and check password validation
      cy.findByLabelText(/email/i).type('test@example.com');
      cy.findByRole('button', { name: /login/i }).click();
      cy.findByText(/password is required/i).should('be.visible');
      cy.findByText(/email is required/i).should('not.exist');

      // Clear and fill in only password and check email validation
      cy.findByLabelText(/email/i).clear();
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();
      cy.findByText(/email is required/i).should('be.visible');
      cy.findByText(/password is required/i).should('not.exist');
    });

    it('should remember user when remember me is checked', () => {
      // Mock successful login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: mockUsers[0].id,
            email: mockUsers[0].email,
            firstName: mockUsers[0].firstName,
            lastName: mockUsers[0].lastName,
            role: mockUsers[0].roleName,
            permissions: ['claims:view', 'claims:create', 'billing:submit'],
            mfaEnabled: false,
            lastLogin: new Date().toISOString(),
            status: 'active',
            organization: {
              id: '12345',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date().getTime() + 3600000 // 1 hour from now
          },
          mfaRequired: false,
          mfaResponse: null
        }
      }).as('loginRequest');

      // Fill login form and check remember me
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByLabelText(/remember me/i).check();
      cy.findByRole('button', { name: /login/i }).click();

      // Verify request and cookie settings
      cy.wait('@loginRequest');
      cy.getCookie('remember-me').should('exist');

      // Simulate browser restart by clearing memory but preserving cookies
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });

      // Verify user session is still active after browser restart
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Set up authentication state for logout tests
      cy.setCookie('auth-token', 'mock-access-token');
      cy.window().then((win) => {
        win.localStorage.setItem('auth-user', JSON.stringify({
          id: mockUsers[0].id,
          email: mockUsers[0].email,
          firstName: mockUsers[0].firstName,
          lastName: mockUsers[0].lastName,
          role: mockUsers[0].roleName
        }));
      });
      cy.visit('/dashboard');
    });

    it('should logout successfully', () => {
      // Mock successful logout response
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          success: true
        }
      }).as('logoutRequest');

      // Click on user profile menu and then logout
      cy.findByRole('button', { name: new RegExp(mockUsers[0].firstName, 'i') }).click();
      cy.findByText(/logout/i).click();

      // Verify request and redirect
      cy.wait('@logoutRequest');
      cy.url().should('include', '/login');
      cy.getCookie('auth-token').should('not.exist');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth-user')).to.be.null;
      });
    });
  });

  describe('Forgot Password', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should send password reset email', () => {
      // Mock successful password reset request
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: {
          success: true
        }
      }).as('forgotPasswordRequest');

      // Click on forgot password link
      cy.findByText(/forgot password/i).click();
      cy.url().should('include', '/forgot-password');

      // Fill in email and submit
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByRole('button', { name: /send reset link/i }).click();

      // Verify request and success message
      cy.wait('@forgotPasswordRequest');
      cy.findByText(/password reset email sent/i).should('be.visible');

      // Verify back to login link works
      cy.findByText(/back to login/i).click();
      cy.url().should('include', '/login');
    });

    it('should validate email format', () => {
      // Navigate to forgot password page
      cy.findByText(/forgot password/i).click();
      
      // Submit with invalid email format
      cy.findByLabelText(/email/i).type('invalid-email');
      cy.findByRole('button', { name: /send reset link/i }).click();
      
      // Verify validation error
      cy.findByText(/valid email/i).should('be.visible');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      // Visit password reset page with token
      cy.visit('/reset-password?token=mock-valid-token');
    });

    it('should reset password with valid token', () => {
      // Mock successful password reset
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          success: true
        }
      }).as('resetPasswordRequest');

      // Fill in new password and confirm
      cy.findByLabelText(/new password/i).type('NewPassword123!');
      cy.findByLabelText(/confirm password/i).type('NewPassword123!');
      cy.findByRole('button', { name: /reset password/i }).click();

      // Verify request and success message
      cy.wait('@resetPasswordRequest');
      cy.findByText(/password has been reset successfully/i).should('be.visible');

      // Verify redirect to login page
      cy.findByRole('button', { name: /back to login/i }).click();
      cy.url().should('include', '/login');
    });

    it('should show error for password mismatch', () => {
      // Fill in mismatched passwords
      cy.findByLabelText(/new password/i).type('NewPassword123!');
      cy.findByLabelText(/confirm password/i).type('DifferentPassword123!');
      cy.findByRole('button', { name: /reset password/i }).click();

      // Verify error message
      cy.findByText(/passwords do not match/i).should('be.visible');
    });

    it('should validate password strength', () => {
      // Try a weak password
      cy.findByLabelText(/new password/i).type('password');
      cy.findByRole('button', { name: /reset password/i }).click();

      // Verify validation error
      cy.findByText(/password must include at least/i).should('be.visible');
    });

    it('should handle invalid token', () => {
      // Mock invalid token response
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 400,
        body: {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Password reset token is invalid or has expired',
            details: null
          }
        }
      }).as('resetPasswordRequest');

      // Fill in password and submit
      cy.findByLabelText(/new password/i).type('NewPassword123!');
      cy.findByLabelText(/confirm password/i).type('NewPassword123!');
      cy.findByRole('button', { name: /reset password/i }).click();

      // Verify error message
      cy.wait('@resetPasswordRequest');
      cy.findByText(/token is invalid or has expired/i).should('be.visible');
    });
  });

  describe('Multi-Factor Authentication', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should verify MFA code and complete login', () => {
      // Mock login response with MFA required
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: null,
          tokens: null,
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'app',
            expiresAt: new Date().getTime() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');

      // Fill login form
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();

      // Verify MFA form is displayed
      cy.wait('@loginRequest');
      cy.findByText(/authentication code/i).should('be.visible');

      // Mock successful MFA verification
      cy.intercept('POST', '/api/auth/verify-mfa', {
        statusCode: 200,
        body: {
          user: {
            id: mockUsers[0].id,
            email: mockUsers[0].email,
            firstName: mockUsers[0].firstName,
            lastName: mockUsers[0].lastName,
            role: mockUsers[0].roleName,
            permissions: ['claims:view', 'claims:create', 'billing:submit'],
            mfaEnabled: true,
            lastLogin: new Date().toISOString(),
            status: 'active',
            organization: {
              id: '12345',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date().getTime() + 3600000 // 1 hour from now
          },
          mfaRequired: false,
          mfaResponse: null
        }
      }).as('verifyMfaRequest');

      // Fill in MFA code and submit
      cy.findByLabelText(/code/i).type('123456');
      cy.findByRole('button', { name: /verify/i }).click();

      // Verify request and redirect
      cy.wait('@verifyMfaRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should show error for invalid MFA code', () => {
      // Set up login with MFA required
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: null,
          tokens: null,
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'app',
            expiresAt: new Date().getTime() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');

      // Fill login form
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();
      cy.wait('@loginRequest');

      // Mock failed MFA verification
      cy.intercept('POST', '/api/auth/verify-mfa', {
        statusCode: 400,
        body: {
          error: {
            code: 'INVALID_MFA_CODE',
            message: 'Invalid authentication code',
            details: null
          }
        }
      }).as('verifyMfaRequest');

      // Fill in invalid MFA code and submit
      cy.findByLabelText(/code/i).type('111111');
      cy.findByRole('button', { name: /verify/i }).click();

      // Verify error message
      cy.wait('@verifyMfaRequest');
      cy.findByText(/invalid authentication code/i).should('be.visible');
    });

    it('should allow resending MFA code', () => {
      // Set up login with MFA required
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: null,
          tokens: null,
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'app',
            expiresAt: new Date().getTime() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');

      // Fill login form
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();
      cy.wait('@loginRequest');

      // Mock resend code endpoint
      cy.intercept('POST', '/api/auth/resend-mfa', {
        statusCode: 200,
        body: {
          success: true
        }
      }).as('resendMfaRequest');

      // Click resend code button
      cy.findByText(/resend code/i).click();

      // Verify request and success message
      cy.wait('@resendMfaRequest');
      cy.findByText(/code has been sent/i).should('be.visible');
    });

    it('should support remember device option', () => {
      // Set up login with MFA required
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: null,
          tokens: null,
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'app',
            expiresAt: new Date().getTime() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');

      // Fill login form
      cy.findByLabelText(/email/i).type(mockUsers[0].email);
      cy.findByLabelText(/password/i).type('Password123!');
      cy.findByRole('button', { name: /login/i }).click();
      cy.wait('@loginRequest');

      // Mock successful MFA verification with remember device
      cy.intercept('POST', '/api/auth/verify-mfa', {
        statusCode: 200,
        body: {
          user: {
            id: mockUsers[0].id,
            email: mockUsers[0].email,
            firstName: mockUsers[0].firstName,
            lastName: mockUsers[0].lastName,
            role: mockUsers[0].roleName,
            permissions: ['claims:view', 'claims:create', 'billing:submit'],
            mfaEnabled: true,
            lastLogin: new Date().toISOString(),
            status: 'active',
            organization: {
              id: '12345',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date().getTime() + 3600000 // 1 hour from now
          },
          mfaRequired: false,
          mfaResponse: null
        }
      }).as('verifyMfaRequest');

      // Fill in MFA code, check remember device, and submit
      cy.findByLabelText(/code/i).type('123456');
      cy.findByLabelText(/remember this device/i).check();
      cy.findByRole('button', { name: /verify/i }).click();

      // Verify request includes remember device parameter
      cy.wait('@verifyMfaRequest').its('request.body').should('include', { rememberDevice: true });
      
      // Verify redirect and trusted device cookie
      cy.url().should('include', '/dashboard');
      cy.getCookie('trusted-device').should('exist');
    });
  });
});