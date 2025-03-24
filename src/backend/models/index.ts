/**
 * Central export file for all model classes in the HCBS Revenue Management System.
 * This file aggregates and re-exports all model classes to provide a single import point for consumers,
 * simplifying imports and ensuring consistent access to model functionality throughout the application.
 */

import { UserModel } from './user.model';
import { ClientModel } from './client.model';
import { ServiceModel } from './service.model';
import { ClaimModel } from './claim.model';
import { PaymentModel } from './payment.model';
import { AuthorizationModel } from './authorization.model';
import { AuditModel } from './audit.model';
import { ProgramModel } from './program.model';
import { PayerModel } from './payer.model';
import { FacilityModel } from './facility.model';
import { RoleModel } from './role.model';
import { PermissionModel } from './permission.model';
import { StaffModel } from './staff.model';
import { DocumentModel } from './document.model';
import { ReportModel } from './report.model';
import { NotificationModel } from './notification.model';
import { SettingModel } from './setting.model';

/**
 * Consolidated object containing all models for convenient access
 */
const Models = {
  UserModel,
  ClientModel,
  ServiceModel,
  ClaimModel,
  PaymentModel,
  AuthorizationModel,
  AuditModel,
  ProgramModel,
  PayerModel,
  FacilityModel,
  RoleModel,
  PermissionModel,
  StaffModel,
  DocumentModel,
  ReportModel,
  NotificationModel,
  SettingModel
};

// Export individual models
export {
  UserModel,
  ClientModel,
  ServiceModel,
  ClaimModel,
  PaymentModel,
  AuthorizationModel,
  AuditModel,
  ProgramModel,
  PayerModel,
  FacilityModel,
  RoleModel,
  PermissionModel,
  StaffModel,
  DocumentModel,
  ReportModel,
  NotificationModel,
  SettingModel
};

// Default export of the Models object for simplified imports
export default Models;