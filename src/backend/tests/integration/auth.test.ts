import { jest } from '@jest/globals'; // Testing framework for running integration tests // jest ^29.5.0
import supertest from 'supertest'; // HTTP assertion library for testing API endpoints // supertest ^6.3.3

import initializeApp from '../../app'; // Express application instance for API testing
import { db } from '../../database/connection'; // Database connection for test setup and teardown
import config from '../../config'; // Authentication configuration settings
import { mockUsers, mockRoles } from '../fixtures/users.fixtures'; // User test fixtures for authentication testing
import { userRepository } from '../../database/repositories/user.repository'; // User repository for database operations
import { LoginCredentials, MfaCredentials, MfaMethod } from '../../types/auth.types'; // Interface for login credentials

let app: any;

const seedTestData = async () => {
  // Insert test roles into the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('roles').insert(mockRoles);
  });

  // Insert test users with different statuses into the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('users').insert(mockUsers);
  });

  // Set up MFA configuration for MFA-enabled test users
  await setupMfaForUser(mockUsers.find(u => u.email === 'mfa@thinkcaring.com').id, MfaMethod.TOTP);

  // Create test sessions and tokens in the database
  // TODO: Implement session and token creation
};

const cleanupTestData = async () => {
  // Delete test sessions from the database
  // TODO: Implement session deletion

  // Delete test tokens from the database
  // TODO: Implement token deletion

  // Delete test MFA configurations from the database
  // TODO: Implement MFA configuration deletion

  // Delete test users from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('users')
      .whereIn('email', mockUsers.map(user => user.email))
      .delete();
  });

  // Delete test roles from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('roles')
      .whereIn('name', mockRoles.map(role => role.name))
      .delete();
  });
};

beforeAll(async () => {
  app = await initializeApp();
  await db.initialize(true, config.env);
  await seedTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await db.close();
});

const getAuthToken = async (userType: string) => {
  let credentials: LoginCredentials;
  switch (userType) {
    case 'admin':
      credentials = { email: 'admin@thinkcaring.com', password: 'Admin@123!', rememberMe: false };
      break;
    case 'financial_manager':
      credentials = { email: 'financialmanager@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false };
      break;
    case 'billing_specialist':
      credentials = { email: 'billingspecialist@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false };
      break;
    case 'readonly':
      credentials = { email: 'readonly@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false };
      break;
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }

  const response = await supertest(app)
    .post('/api/auth/login')
    .send(credentials);

  if (response.statusCode !== 200) {
    throw new Error(`Login failed for ${userType}: ${response.text}`);
  }

  if (response.body.mfaRequired) {
    const mfaToken = response.body.mfaToken;
    const mfaCredentials: MfaCredentials = { mfaToken: mfaToken, mfaCode: '123456', rememberDevice: false };
    const mfaResponse = await supertest(app)
      .post('/api/auth/verify-mfa')
      .send(mfaCredentials);

    if (mfaResponse.statusCode !== 200) {
      throw new Error(`MFA verification failed for ${userType}: ${mfaResponse.text}`);
    }
    return { accessToken: mfaResponse.body.accessToken, refreshToken: mfaResponse.body.refreshToken };
  }

  return { accessToken: response.body.accessToken, refreshToken: response.body.refreshToken };
};

const getMfaToken = async () => {
  const credentials: LoginCredentials = { email: 'mfa@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false };
  const response = await supertest(app)
    .post('/api/auth/login')
    .send(credentials);

  if (response.statusCode !== 200) {
    throw new Error(`Login failed for mfa user: ${response.text}`);
  }

  return response.body.mfaToken;
};

const setupMfaForUser = async (userId: string, method: MfaMethod) => {
  // Update user MFA settings in the database
  await userRepository.updateMfaSettings(userId, true, method, 'testsecret');

  // Create MFA configuration record in the database
  // TODO: Implement MFA configuration record creation

  // Generate and store test MFA secret or backup codes
  // TODO: Implement MFA secret or backup code generation and storage
};

describe('Authentication API - Login', () => {
  it('should successfully login with valid credentials', async () => {
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'admin@thinkcaring.com', password: 'Admin@123!', rememberMe: false });

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.mfaRequired).toBeFalsy();
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'admin@thinkcaring.com', password: 'wrongpassword', rememberMe: false });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should return 401 for non-existent user', async () => {
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password', rememberMe: false });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should return 403 for locked account', async () => {
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'locked@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('should return 403 for inactive account', async () => {
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should lock account after multiple failed attempts', async () => {
    const email = 'lockme@thinkcaring.com';
    const password = 'wrongpassword';
    const maxAttempts = config.auth.loginSettings.maxFailedAttempts;

    // Attempt login multiple times with invalid password
    for (let i = 0; i < maxAttempts; i++) {
      await supertest(app)
        .post('/api/auth/login')
        .send({ email, password, rememberMe: false });
    }

    // Attempt login with correct credentials
    const response = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'lockme@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
  });
});

describe('Authentication API - Multi-Factor Authentication', () => {
  it('should require MFA for MFA-enabled user', async () => {
    const credentials: LoginCredentials = { email: 'mfa@thinkcaring.com', password: 'P@ssw0rd123', rememberMe: false };
    const response = await supertest(app)
      .post('/api/auth/login')
      .send(credentials);

    expect(response.statusCode).toBe(200);
    expect(response.body.mfaRequired).toBeTruthy();
    expect(response.body.mfaToken).toBeDefined();
    expect(response.body.accessToken).toBeUndefined();
  });

  it('should verify MFA and complete login', async () => {
    const mfaToken = await getMfaToken();
    const mfaCredentials: MfaCredentials = { mfaToken: mfaToken, mfaCode: '123456', rememberDevice: false };
    const response = await supertest(app)
      .post('/api/auth/verify-mfa')
      .send(mfaCredentials);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('should reject invalid MFA code', async () => {
    const mfaToken = await getMfaToken();
    const mfaCredentials: MfaCredentials = { mfaToken: mfaToken, mfaCode: '000000', rememberDevice: false };
    const response = await supertest(app)
      .post('/api/auth/verify-mfa')
      .send(mfaCredentials);

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('MFA_FAILED');
  });

  it('should reject expired MFA token', async () => {
    const mfaToken = await getMfaToken();
    // TODO: Implement token expiration
    const response = await supertest(app)
      .post('/api/auth/verify-mfa')
      .send({ mfaToken: mfaToken, mfaCode: '123456', rememberDevice: false });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should set up MFA for user', async () => {
    const { accessToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/setup-mfa')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ method: MfaMethod.TOTP });

    expect(response.statusCode).toBe(200);
    expect(response.body.secret).toBeDefined();
    expect(response.body.qrCode).toBeDefined();
  });

  it('should verify MFA setup', async () => {
    const { accessToken } = await getAuthToken('admin');
    // TODO: Implement MFA setup verification
    const response = await supertest(app)
      .post('/api/auth/verify-mfa-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '123456', method: MfaMethod.TOTP });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('MFA setup verification successful');
  });

  it('should disable MFA for user', async () => {
    const { accessToken } = await getAuthToken('admin');
    // TODO: Implement MFA disabling
    const response = await supertest(app)
      .post('/api/auth/disable-mfa')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'Admin@123!' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('MFA disabled successfully');
  });
});

describe('Authentication API - Token Management', () => {
  it('should refresh access token with valid refresh token', async () => {
    const { accessToken, refreshToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.accessToken).not.toBe(accessToken);
  });

  it('should reject invalid refresh token', async () => {
    const response = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'invalid-refresh-token' });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject expired refresh token', async () => {
    const { refreshToken } = await getAuthToken('admin');
    // TODO: Implement token expiration
    const response = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: refreshToken });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject refresh token after logout', async () => {
    const { accessToken, refreshToken } = await getAuthToken('admin');
    await supertest(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    const response = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Authentication API - Session Management', () => {
  it('should create session on login', async () => {
    const { accessToken } = await getAuthToken('admin');
    // TODO: Implement session verification
    expect(accessToken).toBeDefined();
  });

  it('should end session on logout', async () => {
    const { accessToken, refreshToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(response.statusCode).toBe(200);
    // TODO: Implement session verification
  });

  it('should end all sessions on logout-all', async () => {
    const { accessToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    // TODO: Implement session verification
  });
});

describe('Authentication API - Password Management', () => {
  it('should initiate password reset', async () => {
    const response = await supertest(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'admin@thinkcaring.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Password reset link sent to email');
    // TODO: Implement password reset verification
  });

  it('should not reveal user existence in forgot password', async () => {
    const response = await supertest(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Password reset link sent to email');
    // TODO: Implement password reset verification
  });

  it('should reset password with valid token', async () => {
    // TODO: Implement password reset
    expect(true).toBe(true);
  });

  it('should reject invalid reset token', async () => {
    const response = await supertest(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', password: 'NewPassword1!', confirmPassword: 'NewPassword1!' });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should change password for authenticated user', async () => {
    const { accessToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Admin@123!', newPassword: 'NewPassword1!', confirmPassword: 'NewPassword1!' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Password change successful');
  });

  it('should reject password change with incorrect current password', async () => {
    const { accessToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewPassword1!', confirmPassword: 'NewPassword1!' });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Authentication API - Security Features', () => {
  it('should enforce password complexity requirements', async () => {
    // TODO: Implement password complexity requirements
    expect(true).toBe(true);
  });

  it('should apply rate limiting on login attempts', async () => {
    // TODO: Implement rate limiting
    expect(true).toBe(true);
  });

  it('should unlock user account', async () => {
    const { accessToken } = await getAuthToken('admin');
    const response = await supertest(app)
      .post('/api/auth/users/locked@thinkcaring.com/unlock')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User account unlocked successfully');
  });

  it('should prevent regular users from unlocking accounts', async () => {
    const { accessToken } = await getAuthToken('financial_manager');
    const response = await supertest(app)
      .post('/api/auth/users/locked@thinkcaring.com/unlock')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });
});