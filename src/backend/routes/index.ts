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
import { errorMiddleware, notFoundMiddleware } from '../middleware/index'; // Import error handling middleware for direct export

const router = Router(); // Express router instance for the main API

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

// Error handling middleware - Mount after all other routes
router.use(errorMiddleware);

// Not found middleware - Mount after all other routes
router.use(notFoundMiddleware);

export { router as apiRoutes };
export { authRoutes };
export { usersRoutes };
export { claimsRoutes };
export { billingRoutes };
export { paymentsRoutes };
export { reportsRoutes };
export { dashboardRoutes };
export { settingsRoutes };
export { clientsRoutes };
export { servicesRoutes };
export { integrationsRoutes };
export { errorMiddleware };
export { notFoundMiddleware };