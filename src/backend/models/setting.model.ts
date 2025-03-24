/**
 * Setting Model
 * 
 * Defines the Setting model interface and related types for the HCBS Revenue Management System.
 * This model represents system-wide configuration, organization settings, and user preferences
 * that control application behavior.
 * 
 * @module models/setting.model
 */

import { UUID, AuditableEntity } from '../types/common.types';
import { DatabaseEntity } from '../types/database.types';

/**
 * Enum defining possible data types for setting values
 * Used for proper type conversion when retrieving settings
 */
export enum SettingDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  DATE = 'date'
}

/**
 * Enum defining categories of settings for organizational purposes
 */
export enum SettingCategory {
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
  USER = 'user',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  BILLING = 'billing',
  REPORTING = 'reporting'
}

/**
 * Interface defining the structure of a setting entity
 * Settings store configuration values that control system behavior
 */
export interface Setting extends AuditableEntity {
  id: UUID;
  key: string;             // Unique identifier for the setting
  value: string;           // Setting value stored as string (converted based on dataType)
  description: string;     // Human-readable description of the setting
  category: string;        // Category for grouping settings
  dataType: SettingDataType; // Data type for type conversion
  isEditable: boolean;     // Whether the setting can be edited by users
  isHidden: boolean;       // Whether the setting should be hidden in UI
  metadata: Record<string, any>; // Additional metadata (validation rules, options, etc.)
}

/**
 * DTO for creating a new setting
 */
export interface CreateSettingDto {
  key: string;
  value: string;
  description: string;
  category: string;
  dataType: SettingDataType;
  isEditable: boolean;
  isHidden: boolean;
  metadata: Record<string, any>;
}

/**
 * DTO for updating an existing setting
 * Only allows modification of specific fields
 */
export interface UpdateSettingDto {
  value: string;
  description?: string;
  isEditable?: boolean;
  isHidden?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Database schema definition for the settings table
 */
export const SettingModel = {
  tableName: 'settings',
  columns: {
    id: 'id',
    key: 'key',
    value: 'value',
    description: 'description',
    category: 'category',
    dataType: 'data_type',
    isEditable: 'is_editable',
    isHidden: 'is_hidden',
    metadata: 'metadata',
    createdAt: 'created_at',
    createdBy: 'created_by',
    updatedAt: 'updated_at',
    updatedBy: 'updated_by'
  },
  relationships: {},
  indexes: [
    { name: 'settings_key_unique', columns: ['key'], unique: true },
    { name: 'settings_category_idx', columns: ['category'], unique: false }
  ]
};

/**
 * Default system settings used during initial setup
 */
export const DEFAULT_SYSTEM_SETTINGS: CreateSettingDto[] = [
  {
    key: 'system.name',
    value: 'HCBS Revenue Management System',
    description: 'The name of the system',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.version',
    value: '1.0.0',
    description: 'The current version of the system',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.STRING,
    isEditable: false,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.maintenance_mode',
    value: 'false',
    description: 'Whether the system is in maintenance mode',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.BOOLEAN,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.maintenance_message',
    value: 'The system is currently undergoing maintenance. Please try again later.',
    description: 'Message to display during maintenance',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.session_timeout',
    value: '30',
    description: 'Session timeout in minutes',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.NUMBER,
    isEditable: true,
    isHidden: false,
    metadata: {
      min: 5,
      max: 120
    }
  },
  {
    key: 'system.audit_retention_days',
    value: '365',
    description: 'Number of days to retain audit logs',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.NUMBER,
    isEditable: true,
    isHidden: false,
    metadata: {
      min: 30,
      max: 3650
    }
  },
  {
    key: 'system.password_policy',
    value: JSON.stringify({
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90,
      preventReuse: 10
    }),
    description: 'Password policy configuration',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.JSON,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.mfa_enabled',
    value: 'true',
    description: 'Whether multi-factor authentication is enabled',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.BOOLEAN,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'system.api_rate_limit',
    value: '60',
    description: 'API rate limit per minute',
    category: SettingCategory.SYSTEM,
    dataType: SettingDataType.NUMBER,
    isEditable: true,
    isHidden: false,
    metadata: {
      min: 10,
      max: 1000
    }
  }
];

/**
 * Default organization settings used during initial setup
 */
export const DEFAULT_ORGANIZATION_SETTINGS: CreateSettingDto[] = [
  {
    key: 'organization.name',
    value: 'HCBS Provider Organization',
    description: 'The name of the organization',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.contact_email',
    value: 'contact@hcbsprovider.example.com',
    description: 'Contact email address for the organization',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.contact_phone',
    value: '(555) 123-4567',
    description: 'Contact phone number for the organization',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.address',
    value: JSON.stringify({
      street: '123 Healthcare Ave',
      city: 'Careville',
      state: 'NY',
      zipCode: '12345',
      country: 'USA'
    }),
    description: 'Organization address information',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.JSON,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.tax_id',
    value: '12-3456789',
    description: 'Organization tax ID number',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.npi',
    value: '1234567890',
    description: 'Organization NPI number',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.medicaid_provider_id',
    value: 'MP123456789',
    description: 'Organization Medicaid provider ID',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.logo_url',
    value: '/assets/default-logo.png',
    description: 'URL to the organization logo',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.primary_color',
    value: '#0F52BA',
    description: 'Primary branding color for the organization',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.time_zone',
    value: 'America/New_York',
    description: 'Organization time zone',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  },
  {
    key: 'organization.fiscal_year_start',
    value: '01-01',
    description: 'Start date of the fiscal year (MM-DD)',
    category: SettingCategory.ORGANIZATION,
    dataType: SettingDataType.STRING,
    isEditable: true,
    isHidden: false,
    metadata: {}
  }
];