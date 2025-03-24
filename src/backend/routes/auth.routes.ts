import { Router } from 'express'; // express ^4.18.2
import Joi from 'joi'; // joi ^17.9.2

import authController from '../controllers/auth.controller';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware';
import { resetPasswordSchema, changePasswordSchema } from '../validation/schemas/user.schema';

const router = Router();

// Route for user login
router.post(
  '/login',
  rateLimiterMiddleware('auth'),
  authController.login
);

// Route for verifying MFA code during login
router.post(
  '/verify-mfa',
  rateLimiterMiddleware('auth'),
  authController.verifyMfa
);

// Route for refreshing access token using refresh token
router.post(
  '/refresh-token',
  authController.refreshToken
);

// Route for user logout
router.post(
  '/logout',
  authController.logout
);

// Route for logging out user from all devices/sessions
router.post(
  '/logout-all',
  requireAuth,
  authController.logoutAll
);

// Route for initiating password reset process
router.post(
  '/forgot-password',
  rateLimiterMiddleware('auth'),
  authController.forgotPassword
);

// Route for resetting password using reset token
router.post(
  '/reset-password',
  rateLimiterMiddleware('auth'),
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// Route for changing password for authenticated user
router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  authController.changePassword
);

// Route for setting up multi-factor authentication
router.post(
  '/setup-mfa',
  requireAuth,
  authController.setupMfa
);

// Route for verifying MFA setup with test code
router.post(
  '/verify-mfa-setup',
  requireAuth,
  authController.verifyMfaSetup
);

// Route for disabling multi-factor authentication
router.post(
  '/disable-mfa',
  requireAuth,
  authController.disableMfa
);

// Route for generating new MFA backup codes
router.post(
  '/generate-backup-codes',
  requireAuth,
  authController.generateMfaBackupCodes
);

// Route for unlocking a locked user account (admin only)
router.post(
  '/users/:userId/unlock',
  requireAuth,
  requirePermission('user:unlock'),
  validateParams(Joi.object({ userId: Joi.string().uuid().required() }).options({ abortEarly: false })),
  authController.unlockUserAccount
);

export default router;