import { LoginCredentials } from '../../src/types/auth.types';
import { AUTH_ROUTES } from '../../src/constants/auth.constants';

describe('Authentication', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Load test user data
    cy.fixture('users.json').as('users');
  });

  // Login tests
  it('should login with valid credentials', () => {
    cy.get('@users').then((users: any) => {
      const user = users.validUser;
      
      // Intercept login API request
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: user.email,
            firstName: 'Test',
            lastName: 'User',
            role: 'Admin',
            permissions: [],
            mfaEnabled: false,
            lastLogin: null,
            status: 'active',
            organization: {
              id: 'test-org-id',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 900000 // 15 minutes from now
          }
        }
      }).as('loginRequest');
      
      // Visit login page
      cy.visit(AUTH_ROUTES.LOGIN);
      
      // Enter credentials
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for login request to complete
      cy.wait('@loginRequest');
      
      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Verify authenticated state
      cy.get('[data-testid="user-profile"]').should('exist');
    });
  });

  it('should show error with invalid credentials', () => {
    cy.get('@users').then((users: any) => {
      const user = users.invalidUser;
      
      // Intercept login API request
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          message: 'Invalid username or password. Please try again.'
        }
      }).as('loginRequest');
      
      // Visit login page
      cy.visit(AUTH_ROUTES.LOGIN);
      
      // Enter credentials
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for login request to complete
      cy.wait('@loginRequest');
      
      // Verify error message
      cy.get('[data-testid="login-error"]').should('be.visible');
      cy.get('[data-testid="login-error"]').should('contain', 'Invalid username or password');
      
      // Verify still on login page
      cy.url().should('include', AUTH_ROUTES.LOGIN);
    });
  });

  it('should validate required fields on login form', () => {
    // Visit login page
    cy.visit(AUTH_ROUTES.LOGIN);
    
    // Submit empty form
    cy.get('[data-testid="login-button"]').click();
    
    // Verify validation errors
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="password-error"]').should('be.visible');
    
    // Enter invalid email format
    cy.get('[data-testid="email-input"]').type('invalid-email');
    
    // Verify email format validation
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('contain', 'valid email');
  });

  // Forgot password tests
  it('should redirect to forgot password page', () => {
    // Visit login page
    cy.visit(AUTH_ROUTES.LOGIN);
    
    // Click forgot password link
    cy.get('[data-testid="forgot-password-link"]').click();
    
    // Verify redirect to forgot password page
    cy.url().should('include', AUTH_ROUTES.FORGOT_PASSWORD);
  });

  it('should submit forgot password request', () => {
    cy.get('@users').then((users: any) => {
      const user = users.validUser;
      
      // Intercept forgot password API request
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: {
          message: 'Password reset instructions sent to your email'
        }
      }).as('forgotPasswordRequest');
      
      // Visit forgot password page
      cy.visit(AUTH_ROUTES.FORGOT_PASSWORD);
      
      // Enter email
      cy.get('[data-testid="email-input"]').type(user.email);
      
      // Submit form
      cy.get('[data-testid="submit-button"]').click();
      
      // Wait for request to complete
      cy.wait('@forgotPasswordRequest');
      
      // Verify success message
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="success-message"]').should('contain', 'sent to your email');
      
      // Verify back to login option
      cy.get('[data-testid="back-to-login"]').should('be.visible');
    });
  });

  it('should validate email on forgot password form', () => {
    // Visit forgot password page
    cy.visit(AUTH_ROUTES.FORGOT_PASSWORD);
    
    // Submit empty form
    cy.get('[data-testid="submit-button"]').click();
    
    // Verify validation errors
    cy.get('[data-testid="email-error"]').should('be.visible');
    
    // Enter invalid email format
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="submit-button"]').click();
    
    // Verify email format validation
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('contain', 'valid email');
  });

  // Reset password tests
  it('should reset password with valid token', () => {
    // Intercept reset password API request
    cy.intercept('POST', '/api/auth/reset-password', {
      statusCode: 200,
      body: {
        message: 'Password reset successful'
      }
    }).as('resetPasswordRequest');
    
    // Visit reset password page with token
    cy.visit(`${AUTH_ROUTES.RESET_PASSWORD}?token=valid-reset-token`);
    
    // Enter new password and confirmation
    cy.get('[data-testid="password-input"]').type('NewPassword123!');
    cy.get('[data-testid="confirm-password-input"]').type('NewPassword123!');
    
    // Submit form
    cy.get('[data-testid="reset-button"]').click();
    
    // Wait for request to complete
    cy.wait('@resetPasswordRequest');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Password reset successful');
    
    // Verify redirect to login
    cy.url().should('include', AUTH_ROUTES.LOGIN);
  });

  it('should validate password requirements on reset form', () => {
    // Visit reset password page with token
    cy.visit(`${AUTH_ROUTES.RESET_PASSWORD}?token=valid-reset-token`);
    
    // Enter password that doesn't meet requirements
    cy.get('[data-testid="password-input"]').type('weak');
    cy.get('[data-testid="confirm-password-input"]').type('weak');
    
    // Submit form
    cy.get('[data-testid="reset-button"]').click();
    
    // Verify validation errors for password requirements
    cy.get('[data-testid="password-error"]').should('be.visible');
    
    // Enter mismatched password confirmation
    cy.get('[data-testid="password-input"]').clear().type('StrongPassword123!');
    cy.get('[data-testid="confirm-password-input"]').clear().type('DifferentPassword123!');
    
    // Submit form
    cy.get('[data-testid="reset-button"]').click();
    
    // Verify validation error for password mismatch
    cy.get('[data-testid="confirm-password-error"]').should('be.visible');
    cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords do not match');
  });

  it('should handle invalid reset token', () => {
    // Intercept token validation request
    cy.intercept('GET', '/api/auth/validate-reset-token*', {
      statusCode: 400,
      body: {
        message: 'Invalid or expired reset token'
      }
    }).as('validateTokenRequest');
    
    // Visit reset password page with invalid token
    cy.visit(`${AUTH_ROUTES.RESET_PASSWORD}?token=invalid-reset-token`);
    
    // Wait for token validation
    cy.wait('@validateTokenRequest');
    
    // Verify error message for invalid token
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid or expired reset token');
    
    // Verify option to return to login
    cy.get('[data-testid="back-to-login"]').should('be.visible');
  });

  // MFA tests
  it('should handle MFA verification', () => {
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      
      // Intercept login API request that requires MFA
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'totp',
            expiresAt: Date.now() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');
      
      // Intercept MFA verification request
      cy.intercept('POST', '/api/auth/mfa-verify', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: user.email,
            firstName: 'Test',
            lastName: 'User',
            role: 'Admin',
            permissions: [],
            mfaEnabled: true,
            lastLogin: null,
            status: 'active',
            organization: {
              id: 'test-org-id',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 900000 // 15 minutes from now
          }
        }
      }).as('mfaVerifyRequest');
      
      // Visit login page
      cy.visit(AUTH_ROUTES.LOGIN);
      
      // Enter credentials
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for login request to complete
      cy.wait('@loginRequest');
      
      // Verify redirect to MFA page
      cy.url().should('include', AUTH_ROUTES.VERIFY_MFA);
      
      // Enter valid MFA code
      cy.get('[data-testid="mfa-code-input"]').type('123456');
      
      // Submit MFA form
      cy.get('[data-testid="verify-button"]').click();
      
      // Wait for MFA verification request to complete
      cy.wait('@mfaVerifyRequest');
      
      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Verify authenticated state
      cy.get('[data-testid="user-profile"]').should('exist');
    });
  });

  it('should validate MFA code format', () => {
    // Setup MFA state
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        mfaRequired: true,
        mfaResponse: {
          mfaToken: 'mock-mfa-token',
          method: 'totp',
          expiresAt: Date.now() + 300000 // 5 minutes from now
        }
      }
    }).as('loginRequest');
    
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      
      // Visit login page and submit credentials
      cy.visit(AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for redirect to MFA page
      cy.wait('@loginRequest');
      cy.url().should('include', AUTH_ROUTES.VERIFY_MFA);
      
      // Enter invalid MFA code format (too short)
      cy.get('[data-testid="mfa-code-input"]').type('123');
      
      // Submit MFA form
      cy.get('[data-testid="verify-button"]').click();
      
      // Verify validation error
      cy.get('[data-testid="mfa-code-error"]').should('be.visible');
      cy.get('[data-testid="mfa-code-error"]').should('contain', 'verification code');
    });
  });

  it('should handle incorrect MFA code', () => {
    // Setup MFA state
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        mfaRequired: true,
        mfaResponse: {
          mfaToken: 'mock-mfa-token',
          method: 'totp',
          expiresAt: Date.now() + 300000 // 5 minutes from now
        }
      }
    }).as('loginRequest');
    
    // Intercept MFA verification request with error
    cy.intercept('POST', '/api/auth/mfa-verify', {
      statusCode: 401,
      body: {
        message: 'Invalid verification code. Please try again.'
      }
    }).as('mfaVerifyRequest');
    
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      
      // Visit login page and submit credentials
      cy.visit(AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for redirect to MFA page
      cy.wait('@loginRequest');
      cy.url().should('include', AUTH_ROUTES.VERIFY_MFA);
      
      // Enter incorrect but valid format MFA code
      cy.get('[data-testid="mfa-code-input"]').type('123456');
      
      // Submit MFA form
      cy.get('[data-testid="verify-button"]').click();
      
      // Wait for MFA verification request
      cy.wait('@mfaVerifyRequest');
      
      // Verify error message
      cy.get('[data-testid="mfa-error"]').should('be.visible');
      cy.get('[data-testid="mfa-error"]').should('contain', 'Invalid verification code');
    });
  });

  it('should allow resending MFA code', () => {
    // Setup MFA state
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        mfaRequired: true,
        mfaResponse: {
          mfaToken: 'mock-mfa-token',
          method: 'totp',
          expiresAt: Date.now() + 300000 // 5 minutes from now
        }
      }
    }).as('loginRequest');
    
    // Intercept resend code request
    cy.intercept('POST', '/api/auth/mfa-resend', {
      statusCode: 200,
      body: {
        message: 'Verification code resent'
      }
    }).as('resendCodeRequest');
    
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      
      // Visit login page and submit credentials
      cy.visit(AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for redirect to MFA page
      cy.wait('@loginRequest');
      cy.url().should('include', AUTH_ROUTES.VERIFY_MFA);
      
      // Click resend code button
      cy.get('[data-testid="resend-code-button"]').click();
      
      // Wait for resend request
      cy.wait('@resendCodeRequest');
      
      // Verify success message
      cy.get('[data-testid="resend-success-message"]').should('be.visible');
      cy.get('[data-testid="resend-success-message"]').should('contain', 'Verification code resent');
    });
  });

  it('should remember device when option selected', () => {
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      
      // First login with MFA
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          mfaRequired: true,
          mfaResponse: {
            mfaToken: 'mock-mfa-token',
            method: 'totp',
            expiresAt: Date.now() + 300000 // 5 minutes from now
          }
        }
      }).as('loginRequest');
      
      cy.intercept('POST', '/api/auth/mfa-verify', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: user.email,
            firstName: 'Test',
            lastName: 'User',
            role: 'Admin',
            permissions: [],
            mfaEnabled: true,
            lastLogin: null,
            status: 'active',
            organization: {
              id: 'test-org-id',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 900000 // 15 minutes from now
          }
        }
      }).as('mfaVerifyRequest');
      
      // Visit login page
      cy.visit(AUTH_ROUTES.LOGIN);
      
      // Enter credentials
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for login request to complete
      cy.wait('@loginRequest');
      
      // On MFA page, check remember device option
      cy.get('[data-testid="remember-device-checkbox"]').check();
      
      // Enter valid MFA code
      cy.get('[data-testid="mfa-code-input"]').type('123456');
      
      // Submit MFA form
      cy.get('[data-testid="verify-button"]').click();
      
      // Wait for MFA verification request to complete
      cy.wait('@mfaVerifyRequest');
      
      // Now logout
      cy.get('[data-testid="user-profile"]').click();
      cy.get('[data-testid="logout-option"]').click();
      
      // Mock second login without MFA requirement (because device is remembered)
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: user.email,
            firstName: 'Test',
            lastName: 'User',
            role: 'Admin',
            permissions: [],
            mfaEnabled: true,
            lastLogin: null,
            status: 'active',
            organization: {
              id: 'test-org-id',
              name: 'Test Organization'
            }
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 900000 // 15 minutes from now
          },
          mfaRequired: false // MFA not required due to remembered device
        }
      }).as('secondLoginRequest');
      
      // Login again
      cy.visit(AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for login request
      cy.wait('@secondLoginRequest');
      
      // Verify direct login to dashboard without MFA
      cy.url().should('include', '/dashboard');
    });
  });

  // Logout tests
  it('should logout successfully', () => {
    // Setup authenticated state
    cy.fixture('users.json').then((users) => {
      const user = users.validUser;
      
      // Use custom command to login
      cy.loginByApi({
        email: user.email,
        password: user.password,
        rememberMe: false
      });
      
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Verify authenticated state
      cy.get('[data-testid="user-profile"]').should('exist');
      
      // Click on user profile menu
      cy.get('[data-testid="user-profile"]').click();
      
      // Click logout option
      cy.get('[data-testid="logout-option"]').click();
      
      // Verify redirect to login page
      cy.url().should('include', AUTH_ROUTES.LOGIN);
      
      // Attempt to access protected page
      cy.visit('/dashboard');
      
      // Verify redirect back to login
      cy.url().should('include', AUTH_ROUTES.LOGIN);
    });
  });

  // Session tests
  it('should maintain session across page navigation', () => {
    // Setup authenticated state
    cy.fixture('users.json').then((users) => {
      const user = users.validUser;
      
      // Use custom command to login
      cy.loginByApi({
        email: user.email,
        password: user.password,
        rememberMe: false
      } as LoginCredentials);
      
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Verify authenticated state
      cy.get('[data-testid="user-profile"]').should('exist');
      
      // Navigate to different pages
      cy.get('[data-testid="claims-nav"]').click();
      cy.url().should('include', '/claims');
      cy.get('[data-testid="user-profile"]').should('exist');
      
      cy.get('[data-testid="billing-nav"]').click();
      cy.url().should('include', '/billing');
      cy.get('[data-testid="user-profile"]').should('exist');
      
      // Refresh the page
      cy.reload();
      
      // Verify still authenticated
      cy.get('[data-testid="user-profile"]').should('exist');
    });
  });

  it('should redirect to login when session expires', () => {
    // Setup authenticated state
    cy.fixture('users.json').then((users) => {
      const user = users.validUser;
      
      // Use custom command to login
      cy.loginByApi({
        email: user.email,
        password: user.password,
        rememberMe: false
      } as LoginCredentials);
      
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Verify authenticated state
      cy.get('[data-testid="user-profile"]').should('exist');
      
      // Simulate session expiration by clearing token
      cy.clearLocalStorage();
      
      // Intercept API request that would fail due to missing token
      cy.intercept('GET', '/api/**', {
        statusCode: 401,
        body: {
          message: 'Your session has expired. Please log in again.'
        }
      });
      
      // Try to navigate to another page
      cy.get('[data-testid="claims-nav"]').click();
      
      // Verify redirect to login with message
      cy.url().should('include', AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="session-expired-message"]').should('be.visible');
    });
  });

  // Accessibility tests
  it('should check accessibility of authentication pages', () => {
    // Visit login page
    cy.visit(AUTH_ROUTES.LOGIN);
    cy.checkAccessibility();
    
    // Visit forgot password page
    cy.visit(AUTH_ROUTES.FORGOT_PASSWORD);
    cy.checkAccessibility();
    
    // Visit reset password page
    cy.visit(`${AUTH_ROUTES.RESET_PASSWORD}?token=valid-reset-token`);
    cy.checkAccessibility();
    
    // Setup MFA state and visit MFA page
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        mfaRequired: true,
        mfaResponse: {
          mfaToken: 'mock-mfa-token',
          method: 'totp',
          expiresAt: Date.now() + 300000 // 5 minutes from now
        }
      }
    });
    
    cy.get('@users').then((users: any) => {
      const user = users.mfaUser;
      cy.visit(AUTH_ROUTES.LOGIN);
      cy.get('[data-testid="email-input"]').type(user.email);
      cy.get('[data-testid="password-input"]').type(user.password);
      cy.get('[data-testid="login-button"]').click();
      cy.url().should('include', AUTH_ROUTES.VERIFY_MFA);
      cy.checkAccessibility();
    });
  });
});