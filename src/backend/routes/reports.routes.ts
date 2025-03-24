import express from 'express'; // express v4.18+
const router = express.Router();

import reportsController from '../controllers/reports.controller';
import { requireAuth, requirePermission, requirePermissionForAction } from '../middleware/auth.middleware';
import { validateGenerateReport, validateScheduleReport, validateUpdateScheduledReport, validateReportQuery, validateReportIdParam } from '../validation/report.validation';
import { PermissionCategory, PermissionAction } from '../types/users.types';

// Route to generate a report based on report type and parameters
router.post('/generate',
  requireAuth,
  requirePermission('reports:read'),
  validateGenerateReport(),
  reportsController.generateReport
);

// Route to get all report definitions with optional filtering and pagination
router.get('/definitions',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getReportDefinitions
);

// Route to create a new report definition
router.post('/definitions',
  requireAuth,
  requirePermission('reports:create'),
  validateGenerateReport(),
  reportsController.createReportDefinition
);

// Route to get a report definition by ID
router.get('/definitions/:id',
  requireAuth,
  requirePermission('reports:read'),
  validateReportIdParam(),
  reportsController.getReportDefinition
);

// Route to update an existing report definition
router.put('/definitions/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.REPORTS, PermissionAction.UPDATE, 'report'),
  validateReportIdParam(),
  validateGenerateReport(),
  reportsController.updateReportDefinition
);

// Route to delete a report definition
router.delete('/definitions/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.REPORTS, PermissionAction.DELETE, 'report'),
  validateReportIdParam(),
  reportsController.deleteReportDefinition
);

// Route to generate a report based on a saved report definition
router.post('/definitions/:id/generate',
  requireAuth,
  requirePermission('reports:read'),
  validateReportIdParam(),
  reportsController.generateReportById
);

// Route to get all report instances with optional filtering and pagination
router.get('/instances',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getReportInstances
);

// Route to get a report instance by ID
router.get('/instances/:id',
  requireAuth,
  requirePermission('reports:read'),
  validateReportIdParam(),
  reportsController.getReportInstance
);

// Route to export a report in the specified format
router.get('/instances/:id/export',
  requireAuth,
  requirePermission('reports:read'),
  validateReportIdParam(),
  reportsController.exportReport
);

// Route to get all scheduled reports with optional filtering and pagination
router.get('/scheduled',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getScheduledReports
);

// Route to create a new scheduled report
router.post('/scheduled',
  requireAuth,
  requirePermission('reports:schedule'),
  validateScheduleReport(),
  reportsController.createScheduledReport
);

// Route to get a scheduled report by ID
router.get('/scheduled/:id',
  requireAuth,
  requirePermission('reports:read'),
  validateReportIdParam(),
  reportsController.getScheduledReport
);

// Route to update an existing scheduled report
router.put('/scheduled/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.REPORTS, PermissionAction.UPDATE, 'report'),
  validateReportIdParam(),
  validateUpdateScheduledReport(),
  reportsController.updateScheduledReport
);

// Route to delete a scheduled report
router.delete('/scheduled/:id',
  requireAuth,
  requirePermissionForAction(PermissionCategory.REPORTS, PermissionAction.DELETE, 'report'),
  validateReportIdParam(),
  reportsController.deleteScheduledReport
);

// Route to execute a scheduled report immediately
router.post('/scheduled/:id/execute',
  requireAuth,
  requirePermission('reports:schedule'),
  validateReportIdParam(),
  reportsController.executeScheduledReport
);

// Route to get financial metrics for dashboard and reporting
router.get('/metrics/financial',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getFinancialMetrics
);

// Route to get revenue-specific metrics
router.get('/metrics/revenue',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getRevenueMetrics
);

// Route to get claims-specific metrics
router.get('/metrics/claims',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getClaimsMetrics
);

// Route to get payment-specific metrics
router.get('/metrics/payments',
  requireAuth,
  requirePermission('reports:read'),
  validateReportQuery(),
  reportsController.getPaymentMetrics
);

export default router;