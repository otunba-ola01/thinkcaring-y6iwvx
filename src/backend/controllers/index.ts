import authController from './auth.controller'; // Import authentication controller for handling auth-related requests
import usersController from './users.controller'; // Import users controller for handling user management requests
import clientsController from './clients.controller'; // Import clients controller for handling client management requests
import servicesController from './services.controller'; // Import services controller for handling service management requests
import claimsController from './claims.controller'; // Import claims controller for handling claim management requests
import billingController from './billing.controller'; // Import billing controller for handling billing workflow requests
import paymentsController from './payments.controller'; // Import payments controller for handling payment processing requests
import reportsController from './reports.controller'; // Import reports controller for handling report generation requests
import dashboardController from './dashboard.controller'; // Import dashboard controller for handling dashboard data requests
import settingsController from './settings.controller'; // Import settings controller for handling system settings requests

/**
 * @file Central export file for all controllers in the HCBS Revenue Management System.
 * This file aggregates and re-exports all controller modules to provide a single entry point for route configuration and API endpoint handlers.
 * @requirements_addressed 
 * 1. API Endpoints Design - Provides a centralized export of all controller functions that implement the RESTful API endpoints for the HCBS Revenue Management System.
 * 2. Service Layer Architecture - Supports the service layer architecture by organizing controller components that handle HTTP requests and delegate business logic to appropriate services.
 */
export {
  authController, // Export authentication controller for route configuration
  usersController, // Export users controller for route configuration
  clientsController, // Export clients controller for route configuration
  servicesController, // Export services controller for route configuration
  claimsController, // Export claims controller for route configuration
  billingController, // Export billing controller for route configuration
  paymentsController, // Export payments controller for route configuration
  reportsController, // Export reports controller for route configuration
  dashboardController, // Export dashboard controller for route configuration
  settingsController // Export settings controller for route configuration
};