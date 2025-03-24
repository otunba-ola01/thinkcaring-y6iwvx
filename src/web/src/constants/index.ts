/**
 * Central export file for all constants used throughout the HCBS Revenue Management System web application.
 * This file aggregates and re-exports constants from various domain-specific constant files to provide a single import point for all application constants.
 */

import * as apiConstants from './api.constants';
import * as authConstants from './auth.constants';
import * as routesConstants from './routes.constants';
import * as uiConstants from './ui.constants';
import * as navigationConstants from './navigation.constants';
import * as claimsConstants from './claims.constants';
import * as servicesConstants from './services.constants';
import * as paymentsConstants from './payments.constants';
import * as reportsConstants from './reports.constants';
import * as dashboardConstants from './dashboard.constants';

export {
  apiConstants, // Export API-related constants
  authConstants, // Export authentication-related constants
  routesConstants, // Export route-related constants
  uiConstants, // Export UI-related constants
  navigationConstants, // Export navigation-related constants
  claimsConstants, // Export claims-related constants
  servicesConstants, // Export services-related constants
  paymentsConstants, // Export payments-related constants
  reportsConstants, // Export reports-related constants
  dashboardConstants, // Export dashboard-related constants
};