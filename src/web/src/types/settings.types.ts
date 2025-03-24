/**
 * TypeScript type definitions for system settings in the HCBS Revenue Management System.
 * This file contains types, interfaces, and enums for managing various categories of settings
 * including organization settings, system settings, user preferences, notification configurations,
 * integration settings, and billing settings.
 */

import {
  UUID,
  ISO8601DateTime,
  EntityBase,
  PaginationParams,
  Address,
  ContactInfo,
  ThemeMode,
  LoadingState
} from './common.types';

/**
 * Enum for categorizing different types of settings
 */
export enum SettingType {
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
  USER = 'user',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  BILLING = 'billing'
}

/**
 * Enum for the data types of setting values
 */
export enum SettingDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  DATE = 'date',
  DATETIME = 'datetime',
  ARRAY = 'array'
}

/**
 * Enum for types of external system integrations
 */
export enum IntegrationType {
  EHR = 'ehr',
  CLEARINGHOUSE = 'clearinghouse',
  ACCOUNTING = 'accounting',
  MEDICAID = 'medicaid',
  PAYMENT_GATEWAY = 'payment_gateway',
  EMAIL = 'email',
  SMS = 'sms'
}

/**
 * Enum for the status of integration connections
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error'
}

/**
 * Enum for notification delivery channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
  PUSH = 'push'
}

/**
 * Enum for notification delivery frequency options
 */
export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

/**
 * Interface for individual setting items
 */
export interface Setting {
  id: UUID;
  key: string;
  value: any;
  dataType: SettingDataType;
  type: SettingType;
  name: string;
  description: string;
  isSystem: boolean;
  isEncrypted: boolean;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for creating a new setting
 */
export interface CreateSettingDto {
  key: string;
  value: any;
  dataType: SettingDataType;
  type: SettingType;
  name: string;
  description: string;
  isEncrypted: boolean;
}

/**
 * Interface for updating an existing setting
 */
export interface UpdateSettingDto {
  value: any;
  name: string;
  description: string;
}

/**
 * Interface for filtering settings in list operations
 */
export interface SettingFilterParams {
  type?: SettingType | SettingType[];
  key?: string;
  search?: string;
  isSystem?: boolean;
}

/**
 * Interface for settings list request parameters
 */
export interface SettingListParams {
  pagination: PaginationParams;
  filters?: SettingFilterParams;
}

/**
 * Interface for paginated settings list response
 */
export interface SettingListResponse {
  items: Setting[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface for organization settings
 */
export interface OrganizationSettings {
  name: string;
  legalName: string;
  taxId: string;
  npi: string;
  medicaidId: string;
  address: Address;
  contactInfo: ContactInfo;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  licenseInfo: { type: string; number: string; expirationDate: string; }[];
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating organization settings
 */
export interface UpdateOrganizationSettingsDto {
  name: string;
  legalName: string;
  taxId: string;
  npi: string;
  medicaidId: string;
  address: Address;
  contactInfo: ContactInfo;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  licenseInfo: { type: string; number: string; expirationDate: string; }[];
}

/**
 * Interface for system-wide settings
 */
export interface SystemSettings {
  defaultDateFormat: string;
  defaultTimeFormat: string;
  defaultCurrencyFormat: string;
  defaultTheme: ThemeMode;
  defaultPageSize: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expirationDays: number;
  };
  fileUploadLimits: {
    maxSizeMB: number;
    allowedTypes: string[];
  };
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating system settings
 */
export interface UpdateSystemSettingsDto {
  defaultDateFormat: string;
  defaultTimeFormat: string;
  defaultCurrencyFormat: string;
  defaultTheme: ThemeMode;
  defaultPageSize: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expirationDays: number;
  };
  fileUploadLimits: {
    maxSizeMB: number;
    allowedTypes: string[];
  };
}

/**
 * Interface for user-specific settings
 */
export interface UserSettings {
  userId: UUID;
  theme: ThemeMode;
  dateFormat: string;
  timeFormat: string;
  currencyFormat: string;
  pageSize: number;
  dashboardLayout: { [key: string]: { x: number; y: number; w: number; h: number; } };
  defaultFilters: { [key: string]: any };
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating user settings
 */
export interface UpdateUserSettingsDto {
  theme: ThemeMode;
  dateFormat: string;
  timeFormat: string;
  currencyFormat: string;
  pageSize: number;
  dashboardLayout: { [key: string]: { x: number; y: number; w: number; h: number; } };
  defaultFilters: { [key: string]: any };
}

/**
 * Interface for notification settings
 */
export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  emailFrom: string;
  emailTemplate: string;
  smsTemplate: string;
  digestEnabled: boolean;
  digestFrequency: NotificationFrequency;
  digestTime: string;
  alertTypes: {
    type: string;
    name: string;
    description: string;
    channels: NotificationChannel[];
    frequency: NotificationFrequency;
    enabled: boolean;
  }[];
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating notification settings
 */
export interface UpdateNotificationSettingsDto {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  emailFrom: string;
  emailTemplate: string;
  smsTemplate: string;
  digestEnabled: boolean;
  digestFrequency: NotificationFrequency;
  digestTime: string;
  alertTypes: {
    type: string;
    name: string;
    description: string;
    channels: NotificationChannel[];
    frequency: NotificationFrequency;
    enabled: boolean;
  }[];
}

/**
 * Interface for external system integration connections
 */
export interface IntegrationConnection {
  id: UUID;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  config: { [key: string]: any };
  credentials: { [key: string]: any };
  lastConnected: ISO8601DateTime | null;
  lastError: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for integration settings
 */
export interface IntegrationSettings {
  connections: IntegrationConnection[];
  defaultEhrConnection: UUID | null;
  defaultClearinghouseConnection: UUID | null;
  defaultAccountingConnection: UUID | null;
  defaultMedicaidConnection: UUID | null;
  defaultPaymentGatewayConnection: UUID | null;
  defaultEmailConnection: UUID | null;
  defaultSmsConnection: UUID | null;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating integration settings
 */
export interface UpdateIntegrationSettingsDto {
  defaultEhrConnection: UUID | null;
  defaultClearinghouseConnection: UUID | null;
  defaultAccountingConnection: UUID | null;
  defaultMedicaidConnection: UUID | null;
  defaultPaymentGatewayConnection: UUID | null;
  defaultEmailConnection: UUID | null;
  defaultSmsConnection: UUID | null;
}

/**
 * Interface for creating a new integration connection
 */
export interface CreateIntegrationConnectionDto {
  name: string;
  type: IntegrationType;
  provider: string;
  config: { [key: string]: any };
  credentials: { [key: string]: any };
}

/**
 * Interface for updating an integration connection
 */
export interface UpdateIntegrationConnectionDto {
  name: string;
  status: IntegrationStatus;
  config: { [key: string]: any };
  credentials: { [key: string]: any };
}

/**
 * Interface for billing workflow settings
 */
export interface BillingSettings {
  defaultClaimFormat: string;
  autoValidateServices: boolean;
  requireDocumentationForBilling: boolean;
  requireAuthorizationForBilling: boolean;
  allowOverrideValidation: boolean;
  defaultBillingSchedule: string;
  defaultSubmissionMethod: string;
  defaultGroupingMethod: string;
  claimNumberPrefix: string;
  claimNumberSequence: number;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for updating billing workflow settings
 */
export interface UpdateBillingSettingsDto {
  defaultClaimFormat: string;
  autoValidateServices: boolean;
  requireDocumentationForBilling: boolean;
  requireAuthorizationForBilling: boolean;
  allowOverrideValidation: boolean;
  defaultBillingSchedule: string;
  defaultSubmissionMethod: string;
  defaultGroupingMethod: string;
  claimNumberPrefix: string;
}

/**
 * Interface for settings state in Redux store
 */
export interface SettingsState {
  settings: Setting[];
  organizationSettings: OrganizationSettings | null;
  systemSettings: SystemSettings | null;
  userSettings: UserSettings | null;
  notificationSettings: NotificationSettings | null;
  integrationSettings: IntegrationSettings | null;
  billingSettings: BillingSettings | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  loading: LoadingState;
  error: any | null;
}