import { Router } from 'express'; // express ^4.18.2
import authRoutes from './auth.routes'; // Import authentication routes for login, logout, password management, and MFA
import usersRoutes from './users.routes'; // Import user management routes
import settingsRoutes from './settings.routes'; // Import system settings routes
import clientsRoutes from './clients.routes'; // Import client management routes
import servicesRoutes from './services.routes'; // Import service management routes
import claimsRoutes from './claims.routes'; // Import claims management routes
import billingRoutes from './billing.routes'; // Import billing workflow routes
import paymentsRoutes from './payments.routes'; // Import payment and reconciliation routes
import reportsRoutes from './reports.routes'; // Import reporting and analytics routes
import dashboardRoutes from './dashboard.routes'; // Import dashboard data routes
import integrationsRoutes from './integrations.routes'; // Import external system integration routes
import { authenticate } from '../middleware/auth.middleware'; // Import authentication middleware to verify JWT tokens
import { auditMiddleware } from '../middleware/audit.middleware'; // Import audit logging middleware for security compliance
import { standardRateLimiter } from '../middleware/rateLimiter.middleware'; // Import rate limiting middleware to prevent abuse

const router = Router(); // Express router instance for the main API

// Apply global middleware
router.use(authenticate); // Attempt to authenticate all API requests, setting req.user if valid token provided
router.use(auditMiddleware); // Log all API access for security and compliance purposes
router.use(standardRateLimiter); // Apply rate limiting to prevent abuse of the API

// Mount feature-specific route modules
router.use('/auth', authRoutes); // Authentication endpoints for login, logout, password management, and MFA
router.use('/users', usersRoutes); // User management endpoints for creating, reading, updating, and deleting users
router.use('/settings', settingsRoutes); // System settings endpoints for configuration management
router.use('/clients', clientsRoutes); // Client management endpoints for HCBS service recipients
router.use('/services', servicesRoutes); // Service management endpoints for tracking delivered services
router.use('/claims', claimsRoutes); // Claims management endpoints for the entire claim lifecycle
router.use('/billing', billingRoutes); // Billing workflow endpoints for converting services to claims
router.use('/payments', paymentsRoutes); // Payment processing and reconciliation endpoints
router.use('/reports', reportsRoutes); // Reporting and analytics endpoints
router.use('/dashboard', dashboardRoutes); // Dashboard data endpoints for metrics and visualizations
router.use('/integrations', integrationsRoutes); // External system integration endpoints

export default router;