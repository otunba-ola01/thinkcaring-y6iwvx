import {
  UUID,
  ISO8601DateTime,
  ThemeMode
} from '../../types/common.types';

import {
  Setting,
  SettingType,
  SettingDataType,
  OrganizationSettings,
  SystemSettings,
  UserSettings,
  NotificationSettings,
  NotificationChannel,
  NotificationFrequency,
  IntegrationSettings,
  IntegrationConnection,
  IntegrationType,
  IntegrationStatus,
  BillingSettings,
  SettingListResponse
} from '../../types/settings.types';

/**
 * Mock setting objects for testing and development
 */
export const mockSettings: Setting[] = [
  {
    id: '1',
    key: 'organization.name',
    value: 'ThinkCaring',
    dataType: SettingDataType.STRING,
    type: SettingType.ORGANIZATION,
    name: 'Organization Name',
    description: 'Name of the organization',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '2',
    key: 'system.defaultDateFormat',
    value: 'MM/DD/YYYY',
    dataType: SettingDataType.STRING,
    type: SettingType.SYSTEM,
    name: 'Default Date Format',
    description: 'Default format for displaying dates',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '3',
    key: 'system.defaultTheme',
    value: 'light',
    dataType: SettingDataType.STRING,
    type: SettingType.SYSTEM,
    name: 'Default Theme',
    description: 'Default theme for the application',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '4',
    key: 'notification.emailEnabled',
    value: true,
    dataType: SettingDataType.BOOLEAN,
    type: SettingType.NOTIFICATION,
    name: 'Email Notifications',
    description: 'Enable email notifications',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '5',
    key: 'integration.defaultClearinghouse',
    value: 'clearinghouse-1',
    dataType: SettingDataType.STRING,
    type: SettingType.INTEGRATION,
    name: 'Default Clearinghouse',
    description: 'Default clearinghouse connection',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '6',
    key: 'billing.defaultClaimFormat',
    value: '837P',
    dataType: SettingDataType.STRING,
    type: SettingType.BILLING,
    name: 'Default Claim Format',
    description: 'Default format for claim submission',
    isSystem: true,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '7',
    key: 'user.theme',
    value: 'dark',
    dataType: SettingDataType.STRING,
    type: SettingType.USER,
    name: 'User Theme',
    description: 'User preferred theme',
    isSystem: false,
    isEncrypted: false,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: '8',
    key: 'api.key',
    value: 'mock-api-key-value',
    dataType: SettingDataType.STRING,
    type: SettingType.INTEGRATION,
    name: 'API Key',
    description: 'API key for external integrations',
    isSystem: true,
    isEncrypted: true,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z'
  }
];

/**
 * Mock organization settings for testing and development
 */
export const mockOrganizationSettings: OrganizationSettings = {
  name: 'ThinkCaring',
  legalName: 'ThinkCaring Healthcare Services, Inc.',
  taxId: '12-3456789',
  npi: '1234567890',
  medicaidId: 'MCD12345',
  address: {
    street1: '123 Healthcare Ave',
    street2: 'Suite 400',
    city: 'Healthville',
    state: 'CA',
    zipCode: '90210',
    country: 'USA'
  },
  contactInfo: {
    phone: '(555) 123-4567',
    fax: '(555) 123-4568',
    email: 'info@thinkcaring.com',
    website: 'https://www.thinkcaring.com'
  },
  logo: 'https://example.com/logo.png',
  primaryColor: '#0F52BA',
  secondaryColor: '#4CAF50',
  licenseInfo: [
    {
      type: 'State Provider License',
      number: 'SPL-12345',
      expirationDate: '2024-12-31'
    },
    {
      type: 'HCBS Waiver Provider',
      number: 'HCBS-67890',
      expirationDate: '2024-12-31'
    }
  ],
  updatedAt: '2023-06-15T10:30:00Z'
};

/**
 * Mock system settings for testing and development
 */
export const mockSystemSettings: SystemSettings = {
  defaultDateFormat: 'MM/DD/YYYY',
  defaultTimeFormat: 'hh:mm A',
  defaultCurrencyFormat: '$#,##0.00',
  defaultTheme: ThemeMode.LIGHT,
  defaultPageSize: 25,
  sessionTimeout: 15,
  mfaRequired: true,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    expirationDays: 90
  },
  fileUploadLimits: {
    maxSizeMB: 10,
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
  },
  updatedAt: '2023-06-10T08:45:00Z'
};

/**
 * Mock user settings for testing and development
 */
export const mockUserSettings: UserSettings = {
  userId: '1',
  theme: ThemeMode.DARK,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  currencyFormat: '$#,##0.00',
  pageSize: 50,
  dashboardLayout: {
    'revenue-metrics': { x: 0, y: 0, w: 6, h: 2 },
    'claims-status': { x: 6, y: 0, w: 6, h: 2 },
    'alerts': { x: 0, y: 2, w: 4, h: 2 },
    'recent-claims': { x: 4, y: 2, w: 8, h: 2 }
  },
  defaultFilters: {
    'claims': { status: 'pending', dateRange: 'last30Days' },
    'payments': { status: 'unreconciled' }
  },
  updatedAt: '2023-06-20T14:25:00Z'
};

/**
 * Mock notification settings for testing and development
 */
export const mockNotificationSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  inAppEnabled: true,
  emailFrom: 'notifications@thinkcaring.com',
  emailTemplate: '<div>{{content}}</div>',
  smsTemplate: '{{content}}',
  digestEnabled: true,
  digestFrequency: NotificationFrequency.DAILY,
  digestTime: '08:00',
  alertTypes: [
    {
      type: 'claim-denied',
      name: 'Claim Denied',
      description: 'Notification when a claim is denied',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      frequency: NotificationFrequency.IMMEDIATE,
      enabled: true
    },
    {
      type: 'payment-received',
      name: 'Payment Received',
      description: 'Notification when a payment is received',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      frequency: NotificationFrequency.IMMEDIATE,
      enabled: true
    },
    {
      type: 'authorization-expiring',
      name: 'Authorization Expiring',
      description: 'Notification when an authorization is about to expire',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      frequency: NotificationFrequency.DAILY,
      enabled: true
    },
    {
      type: 'filing-deadline',
      name: 'Filing Deadline',
      description: 'Notification for approaching filing deadlines',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      frequency: NotificationFrequency.DAILY,
      enabled: true
    },
    {
      type: 'system-update',
      name: 'System Update',
      description: 'Notification for system updates',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      frequency: NotificationFrequency.IMMEDIATE,
      enabled: true
    }
  ],
  updatedAt: '2023-06-18T11:20:00Z'
};

/**
 * Mock integration settings for testing and development
 */
export const mockIntegrationSettings: IntegrationSettings = {
  connections: [
    {
      id: 'clearinghouse-1',
      name: 'Change Healthcare',
      type: IntegrationType.CLEARINGHOUSE,
      provider: 'Change Healthcare',
      status: IntegrationStatus.ACTIVE,
      config: {
        apiEndpoint: 'https://api.changehealthcare.com/v1',
        submissionFormat: '837P'
      },
      credentials: {
        apiKey: 'mock-api-key',
        apiSecret: 'mock-api-secret'
      },
      lastConnected: '2023-06-25T09:15:00Z',
      lastError: null,
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: '2023-06-25T09:15:00Z'
    },
    {
      id: 'ehr-1',
      name: 'Therap',
      type: IntegrationType.EHR,
      provider: 'Therap Services',
      status: IntegrationStatus.ACTIVE,
      config: {
        apiEndpoint: 'https://api.therapservices.net/v1',
        dataSync: {
          enabled: true,
          frequency: 'hourly'
        }
      },
      credentials: {
        username: 'api_user',
        password: 'mock-password'
      },
      lastConnected: '2023-06-25T10:30:00Z',
      lastError: null,
      createdAt: '2023-01-20T00:00:00Z',
      updatedAt: '2023-06-25T10:30:00Z'
    },
    {
      id: 'accounting-1',
      name: 'QuickBooks',
      type: IntegrationType.ACCOUNTING,
      provider: 'Intuit',
      status: IntegrationStatus.ACTIVE,
      config: {
        apiEndpoint: 'https://api.quickbooks.com/v3',
        syncSettings: {
          invoices: true,
          payments: true,
          customers: true
        }
      },
      credentials: {
        clientId: 'mock-client-id',
        clientSecret: 'mock-client-secret',
        refreshToken: 'mock-refresh-token'
      },
      lastConnected: '2023-06-24T16:45:00Z',
      lastError: null,
      createdAt: '2023-02-10T00:00:00Z',
      updatedAt: '2023-06-24T16:45:00Z'
    },
    {
      id: 'medicaid-1',
      name: 'State Medicaid Portal',
      type: IntegrationType.MEDICAID,
      provider: 'State Medicaid',
      status: IntegrationStatus.ACTIVE,
      config: {
        apiEndpoint: 'https://medicaid.state.gov/api',
        submissionFormat: '837P'
      },
      credentials: {
        username: 'medicaid_user',
        password: 'mock-password'
      },
      lastConnected: '2023-06-23T14:20:00Z',
      lastError: null,
      createdAt: '2023-03-05T00:00:00Z',
      updatedAt: '2023-06-23T14:20:00Z'
    },
    {
      id: 'email-1',
      name: 'SendGrid',
      type: IntegrationType.EMAIL,
      provider: 'SendGrid',
      status: IntegrationStatus.ACTIVE,
      config: {
        apiEndpoint: 'https://api.sendgrid.com/v3',
        defaultFromEmail: 'notifications@thinkcaring.com',
        defaultFromName: 'ThinkCaring Notifications'
      },
      credentials: {
        apiKey: 'mock-sendgrid-api-key'
      },
      lastConnected: '2023-06-25T08:00:00Z',
      lastError: null,
      createdAt: '2023-01-10T00:00:00Z',
      updatedAt: '2023-06-25T08:00:00Z'
    }
  ],
  defaultEhrConnection: 'ehr-1',
  defaultClearinghouseConnection: 'clearinghouse-1',
  defaultAccountingConnection: 'accounting-1',
  defaultMedicaidConnection: 'medicaid-1',
  defaultPaymentGatewayConnection: null,
  defaultEmailConnection: 'email-1',
  defaultSmsConnection: null,
  updatedAt: '2023-06-25T11:00:00Z'
};

/**
 * Mock billing settings for testing and development
 */
export const mockBillingSettings: BillingSettings = {
  defaultClaimFormat: '837P',
  autoValidateServices: true,
  requireDocumentationForBilling: true,
  requireAuthorizationForBilling: true,
  allowOverrideValidation: false,
  defaultBillingSchedule: 'weekly',
  defaultSubmissionMethod: 'electronic',
  defaultGroupingMethod: 'payer',
  claimNumberPrefix: 'TC',
  claimNumberSequence: 10045,
  updatedAt: '2023-06-22T15:30:00Z'
};

/**
 * Mock response for settings list API requests
 */
export const mockSettingListResponse: SettingListResponse = {
  items: mockSettings,
  totalItems: mockSettings.length,
  page: 1,
  pageSize: 25,
  totalPages: 1
};

/**
 * Mock response for integration connection testing
 */
export const mockConnectionTestResponse = {
  success: true,
  message: 'Connection successful. API version: 3.2.1'
};

/**
 * Mock audit logs for settings changes
 */
export const mockAuditLogs = [
  {
    id: '1',
    userId: '1',
    username: 'admin@thinkcaring.com',
    action: 'SETTING_UPDATE',
    resource: 'settings',
    resourceId: '1',
    details: {
      key: 'organization.name',
      oldValue: 'ThinkCaring',
      newValue: 'ThinkCaring Healthcare'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2023-06-25T14:30:00Z'
  },
  {
    id: '2',
    userId: '1',
    username: 'admin@thinkcaring.com',
    action: 'INTEGRATION_CREATE',
    resource: 'integration',
    resourceId: 'email-1',
    details: {
      name: 'SendGrid',
      type: 'EMAIL',
      provider: 'SendGrid'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2023-06-25T13:45:00Z'
  },
  {
    id: '3',
    userId: '2',
    username: 'finance@thinkcaring.com',
    action: 'SETTING_VIEW',
    resource: 'settings',
    resourceId: null,
    details: {
      type: 'BILLING'
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: '2023-06-25T11:20:00Z'
  },
  {
    id: '4',
    userId: '1',
    username: 'admin@thinkcaring.com',
    action: 'INTEGRATION_TEST',
    resource: 'integration',
    resourceId: 'clearinghouse-1',
    details: {
      result: 'success'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2023-06-24T16:15:00Z'
  },
  {
    id: '5',
    userId: '1',
    username: 'admin@thinkcaring.com',
    action: 'SETTING_UPDATE',
    resource: 'settings',
    resourceId: '6',
    details: {
      key: 'billing.defaultClaimFormat',
      oldValue: 'CMS-1500',
      newValue: '837P'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2023-06-24T15:30:00Z'
  }
];