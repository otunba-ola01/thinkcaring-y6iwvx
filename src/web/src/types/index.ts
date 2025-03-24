/**
 * Central export file for all TypeScript types, interfaces, and enums used throughout the HCBS Revenue Management System frontend.
 * This file serves as the main entry point for importing type definitions, ensuring consistent type usage across the application.
 */

// Import all type namespaces
import * as CommonTypes from './common.types';
import * as ApiTypes from './api.types';
import * as UiTypes from './ui.types';
import * as FormTypes from './form.types';
import * as AuthTypes from './auth.types';
import * as ClaimsTypes from './claims.types';
import * as PaymentsTypes from './payments.types';

// Re-export all type namespaces
export { CommonTypes, ApiTypes, UiTypes, FormTypes, AuthTypes, ClaimsTypes, PaymentsTypes };

// Re-export common types for direct import convenience
export { 
  UUID, 
  ISO8601Date, 
  ISO8601DateTime, 
  Money, 
  Percentage, 
  DateRange, 
  PaginationParams,
  SortDirection, 
  FilterOperator,
  ClaimStatus,
  PaymentStatus,
  ServiceStatus,
  PaymentMethod,
  Severity,
  Size,
  ThemeMode
} from './common.types';

export { HttpMethod } from './api.types';
export { AuthStatus } from './auth.types';
export { FormFieldType } from './form.types';