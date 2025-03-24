import express from 'express'; // version 4.18.2
import dashboardController from '../controllers/dashboard.controller'; // Controller functions for handling dashboard-related requests
import { authenticate, requireAuth, requirePermission } from '../middleware/auth.middleware'; // Authentication and authorization middleware for protecting routes
import { validate } from '../middleware/validation.middleware'; // Request validation middleware

// Express router instance for dashboard routes
const router = express.Router();

/**
 * @description Get comprehensive dashboard metrics including revenue, claims, alerts, and recent claims
 * @route GET /api/dashboard/
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getDashboardMetrics
);

/**
 * @description Get revenue metrics for the dashboard
 * @route GET /api/dashboard/revenue
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/revenue',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getRevenueMetrics
);

/**
 * @description Get claims metrics for the dashboard
 * @route GET /api/dashboard/claims
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/claims',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getClaimsMetrics
);

/**
 * @description Get alert notifications for the dashboard
 * @route GET /api/dashboard/alerts
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/alerts',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getAlertNotifications
);

/**
 * @description Get recent claims for the dashboard
 * @route GET /api/dashboard/recent-claims
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/recent-claims',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getRecentClaims
);

/**
 * @description Get revenue breakdown by program for the dashboard
 * @route GET /api/dashboard/revenue-by-program
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/revenue-by-program',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getRevenueByProgram
);

/**
 * @description Get revenue breakdown by payer for the dashboard
 * @route GET /api/dashboard/revenue-by-payer
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/revenue-by-payer',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getRevenueByPayer
);

/**
 * @description Get aging receivables data for the dashboard
 * @route GET /api/dashboard/aging-receivables
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/aging-receivables',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getAgingReceivables
);

/**
 * @description Get claims breakdown by status for the dashboard
 * @route GET /api/dashboard/claims-by-status
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/claims-by-status',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getClaimsByStatus
);

/**
 * @description Get unbilled services metrics for the dashboard
 * @route GET /api/dashboard/unbilled-services
 * @middleware authenticate, requireAuth, requirePermission('dashboard:view')
 */
router.get('/unbilled-services',
  authenticate,
  requireAuth,
  requirePermission('dashboard:view'),
  dashboardController.getUnbilledServices
);

// Export configured Express router with dashboard routes
export default router;