# src/backend/controllers/auth.controller.ts
import { Request, Response, RequestWithBody } from '../types/request.types'; // Import Express Request and Response types
import { LoginCredentials, MfaCredentials } from '../types/auth.types'; // Import authentication types
import { MfaMethod, RequestInfo } from '../types/auth.types'; // Import MFA method enum
import {
  login as authServiceLogin,
  verifyMfa as authServiceVerifyMfa,
  refreshToken as authServiceRefreshToken,
  logout as authServiceLogout,
  logoutAll as authServiceLogoutAll,
  requestPasswordReset as authServiceRequestPasswordReset,
  resetPassword as authServiceResetPassword,
  changePassword as authServiceChangePassword,
  setupMfa as authServiceSetupMfa,
  verifyMfaSetup as authServiceVerifyMfaSetup,
  disableMfa as authServiceDisableMfa,
  generateMfaCode as authServiceGenerateMfaCode,
  validateToken as authServiceValidateToken,
  validateSession as authServiceValidateSession,
} from '../services/auth.service'; // Import authentication service for handling authentication logic
import { logger } from '../utils/logger'; // Import logging functionality
import { AuthError } from '../errors/auth-error'; // Import authentication error handling
import { userRepository } from '../database/repositories/user.repository'; // Import user repository for database operations
import { auditLog } from '../security/audit-logging'; // Import audit logging functionality
import { generateBackupCodes } from '../security/authentication'; // Import backup code generation functionality
import { validationResult } from 'express-validator'; // express-validator ^7.0.1

/**
 * Handles user login requests, authenticating credentials and returning appropriate tokens
 * @param req Express Request
 * @param res Express Response
 */
export async function login(req: RequestWithBody<LoginCredentials>, res: Response): Promise<void> {
  try {
    // Extract login credentials from request body
    const credentials = req.body;

    // Extract request information (IP, user agent) for context
    const requestInfo: RequestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      deviceId: req.get('Device-Id') || null,
    };

    // Call authService.login with credentials and request info
    const result = await authServiceLogin(credentials, requestInfo);

    // If MFA is required, return 200 with MFA token and mfaRequired flag
    if (result.mfaRequired) {
      res.status(200).json({
        mfaRequired: true,
        mfaToken: result.mfaToken,
      });
    } else {
      // If MFA is not required, return 200 with user info, access token, and refresh token
      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }

    // Log successful login attempt
    logger.info('User login successful', { email: credentials.email });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('Authentication error', { error: error.message, email: req.body.email });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('Login failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Login failed' } });
    }
  }
}

/**
 * Handles MFA verification during the login process
 * @param req Express Request
 * @param res Express Response
 */
export async function verifyMfa(req: RequestWithBody<MfaCredentials>, res: Response): Promise<void> {
  try {
    // Extract MFA credentials from request body
    const credentials = req.body;

    // Extract request information (IP, user agent) for context
    const requestInfo: RequestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      deviceId: req.get('Device-Id') || null,
    };

    // Call authService.verifyMfa with credentials and request info
    const result = await authServiceVerifyMfa(credentials, requestInfo);

    // Return 200 with user info, access token, and refresh token
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Log successful MFA verification
    logger.info('MFA verification successful', { userId: result.user.id });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('MFA verification error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('MFA verification failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA verification failed' } });
    }
  }
}

/**
 * Refreshes an access token using a valid refresh token
 * @param req Express Request
 * @param res Express Response
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Extract refresh token from request body or cookies
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    // Extract request information (IP, user agent) for context
    const requestInfo: RequestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      deviceId: req.get('Device-Id') || null,
    };

    // Call authService.refreshToken with token and request info
    const result = await authServiceRefreshToken(refreshToken, requestInfo);

    // Return 200 with new access token and refresh token
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Log successful token refresh
    logger.info('Token refresh successful');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('Token refresh error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('Token refresh failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Token refresh failed' } });
    }
  }
}

/**
 * Logs out a user by invalidating their current session and tokens
 * @param req Express Request
 * @param res Express Response
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Extract access token, refresh token, and session ID from request
    const accessToken = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    const sessionId = req.headers['session-id'] as string;

    // Call authService.logout with tokens and session ID
    const success = await authServiceLogout(accessToken, refreshToken, sessionId);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'Logout successful' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Logout failed' } });
    }

    // Log successful logout
    logger.info('Logout successful');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    logger.error('Logout failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Logout failed' } });
  }
}

/**
 * Logs out a user from all devices by invalidating all their sessions and tokens
 * @param req Express Request
 * @param res Express Response
 */
export async function logoutAll(req: Request, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Call authService.logoutAll with access token
    const success = await authServiceLogoutAll(accessToken);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'Logout from all devices successful' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Logout from all devices failed' } });
    }

    // Log successful logout from all devices
    logger.info('Logout from all devices successful');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    logger.error('Logout from all devices failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Logout from all devices failed' } });
  }
}

/**
 * Initiates the password reset process by sending a reset link to the user's email
 * @param req Express Request
 * @param res Express Response
 */
export async function forgotPassword(req: RequestWithBody<{ email: string }>, res: Response): Promise<void> {
  try {
    // Extract email from request body
    const email = req.body.email;

    // Extract request information (IP, user agent) for context
    const requestInfo: RequestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      deviceId: req.get('Device-Id') || null,
    };

    // Call authService.requestPasswordReset with email and request info
    const success = await authServiceRequestPasswordReset(email, requestInfo);

    // Return 200 with success message (even if email not found for security)
    res.status(200).json({ message: 'Password reset link sent to email' });

    // Log password reset request
    logger.info('Password reset link sent to email', { email });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    logger.error('Password reset request failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Password reset request failed' } });
  }
}

/**
 * Resets a user's password using a valid reset token
 * @param req Express Request
 * @param res Express Response
 */
export async function resetPassword(req: RequestWithBody<{ token: string; password: string }>, res: Response): Promise<void> {
  try {
    // Extract token and new password from request body
    const { token, password } = req.body;

    // Extract request information (IP, user agent) for context
    const requestInfo: RequestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      deviceId: req.get('Device-Id') || null,
    };

    // Call authService.resetPassword with token, new password, and request info
    const success = await authServiceResetPassword(token, password, requestInfo);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'Password reset successful' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Password reset failed' } });
    }

    // Log successful password reset
    logger.info('Password reset successful');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('Password reset error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('Password reset failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Password reset failed' } });
    }
  }
}

/**
 * Changes a user's password after verifying the current password
 * @param req Express Request
 * @param res Express Response
 */
export async function changePassword(req: RequestWithBody<{ currentPassword: string; newPassword: string }>, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Extract current password and new password from request body
    const { currentPassword, newPassword } = req.body;

    // Call authService.changePassword with token and passwords
    const success = await authServiceChangePassword(accessToken, currentPassword, newPassword);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'Password change successful' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Password change failed' } });
    }

    // Log successful password change
    logger.info('Password change successful');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('Password change error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('Password change failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Password change failed' } });
    }
  }
}

/**
 * Sets up multi-factor authentication for a user
 * @param req Express Request
 * @param res Express Response
 */
export async function setupMfa(req: Request, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Extract MFA method from request body
    const method = req.body.method as MfaMethod;

    // Call authService.setupMfa with token and method
    const setupInfo = await authServiceSetupMfa(accessToken, method);

    // Return 200 with setup information (secret, QR code, etc.)
    res.status(200).json(setupInfo);

    // Log MFA setup initiation
    logger.info('MFA setup initiated', { method });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('MFA setup error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('MFA setup failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA setup failed' } });
    }
  }
}

/**
 * Verifies MFA setup by validating a test code
 * @param req Express Request
 * @param res Express Response
 */
export async function verifyMfaSetup(req: Request, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Extract verification code and MFA method from request body
    const { code, method } = req.body;

    // Call authService.verifyMfaSetup with token, code, and method
    const success = await authServiceVerifyMfaSetup(accessToken, code, method);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'MFA setup verification successful' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA setup verification failed' } });
    }

    // Log successful MFA setup completion
    logger.info('MFA setup verification successful', { method });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('MFA setup verification error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('MFA setup verification failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA setup verification failed' } });
    }
  }
}

/**
 * Disables multi-factor authentication for a user
 * @param req Express Request
 * @param res Express Response
 */
export async function disableMfa(req: RequestWithBody<{ password: string }>, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Extract password from request body for verification
    const { password } = req.body;

    // Call authService.disableMfa with token and password
    const success = await authServiceDisableMfa(accessToken, password);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'MFA disabled successfully' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA disable failed' } });
    }

    // Log MFA disabling
    logger.info('MFA disabled successfully');
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('MFA disable error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('MFA disable failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA disable failed' } });
    }
  }
}

/**
 * Generates new backup codes for MFA recovery
 * @param req Express Request
 * @param res Express Response
 */
export async function generateMfaBackupCodes(req: RequestWithBody<{ password: string }>, res: Response): Promise<void> {
  try {
    // Extract access token from request
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Call authService.validateToken to verify user
    const user = await authServiceValidateToken(accessToken);

    // Extract password from request body for verification
    const { password } = req.body;

    // Verify password using user.verifyPassword
    const userModel = await userRepository.findById(user.id);
    if (!userModel) {
      logger.warn('User not found for MFA backup code generation', { userId: user.id });
      throw AuthError.unauthorized('Unauthorized');
    }

    const passwordVerified = await userModel.verifyPassword(password);
    if (!passwordVerified) {
      logger.warn('Invalid password for MFA backup code generation', { userId: user.id });
      throw AuthError.invalidCredentials('Invalid password');
    }

    // Generate new backup codes using generateBackupCodes
    const backupCodes = generateBackupCodes();

    // Store backup codes in database
    // TODO: Implement backup code storage

    // Return 200 with new backup codes
    res.status(200).json({ backupCodes });

    // Log backup code generation
    logger.info('MFA backup codes generated successfully', { userId: user.id });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    if (error instanceof AuthError) {
      logger.warn('MFA backup code generation error', { error: error.message });
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else {
      logger.error('MFA backup code generation failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'MFA backup code generation failed' } });
    }
  }
}

/**
 * Unlocks a locked user account (admin only)
 * @param req Express Request
 * @param res Express Response
 */
export async function unlockUserAccount(req: Request, res: Response): Promise<void> {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract admin user ID from authenticated request
    const adminUserId = req.user?.id;

    // Call userRepository.unlockAccount with user ID
    const success = await userRepository.unlockAccount(userId, adminUserId);

    // Return 200 with success message
    if (success) {
      res.status(200).json({ message: 'User account unlocked successfully' });
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'User account unlock failed' } });
    }

    // Log account unlock action with admin ID
    logger.info('User account unlocked successfully', { userId, adminUserId });
  } catch (error) {
    // Handle errors with appropriate status codes and messages
    logger.error('User account unlock failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'User account unlock failed' } });
  }
}

export default {
  login,
  verifyMfa,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  setupMfa,
  verifyMfaSetup,
  disableMfa,
  generateMfaBackupCodes,
  unlockUserAccount
};