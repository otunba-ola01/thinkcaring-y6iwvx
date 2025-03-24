/**
 * Navigation Constants
 * 
 * This file defines navigation constants for the HCBS Revenue Management System web application.
 * It contains the structure of navigation items, their hierarchy, icons, and required permissions.
 * These constants serve as the central source of navigation data used by various navigation
 * components including Sidebar, Topbar, and MobileNavigation.
 */

import { ROUTES } from './routes.constants';

/**
 * Interface defining the structure of navigation items used throughout the application
 * Each navigation item may contain children for nested navigation and permission requirements
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display label for the navigation item */
  label: string;
  /** Route path for the navigation item */
  path: string;
  /** Icon identifier for the navigation item */
  icon: string;
  /** Child navigation items for nested navigation */
  children?: NavigationItem[];
  /** Permissions required to view this navigation item */
  requiredPermissions?: string[];
}

/**
 * Primary navigation items for the main sidebar navigation
 * These items represent the core features of the HCBS Revenue Management System
 * and are organized according to the navigation flow defined in the technical specifications
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD.ROOT,
    icon: 'dashboard',
    requiredPermissions: ['dashboard:view'],
    children: [
      {
        id: 'revenue-metrics',
        label: 'Revenue Metrics',
        path: ROUTES.DASHBOARD.REVENUE_METRICS,
        icon: 'chart',
        requiredPermissions: ['dashboard:view'],
      },
      {
        id: 'alerts',
        label: 'Alerts',
        path: ROUTES.DASHBOARD.ALERTS,
        icon: 'notifications',
        requiredPermissions: ['dashboard:view'],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    path: ROUTES.CLIENTS.ROOT,
    icon: 'people',
    requiredPermissions: ['clients:view'],
    children: [
      {
        id: 'client-list',
        label: 'Client List',
        path: ROUTES.CLIENTS.ROOT,
        icon: 'list',
        requiredPermissions: ['clients:view'],
      },
      {
        id: 'new-client',
        label: 'New Client',
        path: ROUTES.CLIENTS.NEW,
        icon: 'personAdd',
        requiredPermissions: ['clients:create'],
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    path: ROUTES.SERVICES.ROOT,
    icon: 'assignment',
    requiredPermissions: ['services:view'],
    children: [
      {
        id: 'service-dashboard',
        label: 'Service Dashboard',
        path: ROUTES.SERVICES.DASHBOARD,
        icon: 'dashboard',
        requiredPermissions: ['services:view'],
      },
      {
        id: 'service-list',
        label: 'Service List',
        path: ROUTES.SERVICES.ROOT,
        icon: 'list',
        requiredPermissions: ['services:view'],
      },
      {
        id: 'new-service',
        label: 'New Service',
        path: ROUTES.SERVICES.NEW,
        icon: 'add',
        requiredPermissions: ['services:create'],
      },
      {
        id: 'service-validation',
        label: 'Service Validation',
        path: ROUTES.SERVICES.VALIDATION,
        icon: 'checkCircle',
        requiredPermissions: ['services:validate'],
      },
    ],
  },
  {
    id: 'claims',
    label: 'Claims',
    path: ROUTES.CLAIMS.ROOT,
    icon: 'description',
    requiredPermissions: ['claims:view'],
    children: [
      {
        id: 'claims-dashboard',
        label: 'Claims Dashboard',
        path: ROUTES.CLAIMS.DASHBOARD,
        icon: 'dashboard',
        requiredPermissions: ['claims:view'],
      },
      {
        id: 'claims-list',
        label: 'Claims List',
        path: ROUTES.CLAIMS.ROOT,
        icon: 'list',
        requiredPermissions: ['claims:view'],
      },
      {
        id: 'new-claim',
        label: 'New Claim',
        path: ROUTES.CLAIMS.NEW,
        icon: 'add',
        requiredPermissions: ['claims:create'],
      },
      {
        id: 'batch-claims',
        label: 'Batch Claims',
        path: ROUTES.CLAIMS.BATCH,
        icon: 'batch',
        requiredPermissions: ['claims:create'],
      },
      {
        id: 'status-tracking',
        label: 'Status Tracking',
        path: ROUTES.CLAIMS.STATUS_TRACKING,
        icon: 'tracking',
        requiredPermissions: ['claims:view'],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    path: ROUTES.BILLING.ROOT,
    icon: 'receipt',
    requiredPermissions: ['billing:view'],
    children: [
      {
        id: 'billing-dashboard',
        label: 'Billing Dashboard',
        path: ROUTES.BILLING.DASHBOARD,
        icon: 'dashboard',
        requiredPermissions: ['billing:view'],
      },
      {
        id: 'billing-queue',
        label: 'Billing Queue',
        path: ROUTES.BILLING.QUEUE,
        icon: 'queue',
        requiredPermissions: ['billing:view'],
      },
      {
        id: 'billing-validation',
        label: 'Validation',
        path: ROUTES.BILLING.VALIDATION,
        icon: 'checkCircle',
        requiredPermissions: ['billing:validate'],
      },
      {
        id: 'claim-creation',
        label: 'Claim Creation',
        path: ROUTES.BILLING.CLAIM_CREATION,
        icon: 'create',
        requiredPermissions: ['billing:create'],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    path: ROUTES.PAYMENTS.ROOT,
    icon: 'payments',
    requiredPermissions: ['payments:view'],
    children: [
      {
        id: 'payments-dashboard',
        label: 'Payments Dashboard',
        path: ROUTES.PAYMENTS.DASHBOARD,
        icon: 'dashboard',
        requiredPermissions: ['payments:view'],
      },
      {
        id: 'payments-list',
        label: 'Payments List',
        path: ROUTES.PAYMENTS.ROOT,
        icon: 'list',
        requiredPermissions: ['payments:view'],
      },
      {
        id: 'new-payment',
        label: 'New Payment',
        path: ROUTES.PAYMENTS.NEW,
        icon: 'add',
        requiredPermissions: ['payments:create'],
      },
      {
        id: 'reconciliation',
        label: 'Reconciliation',
        path: ROUTES.PAYMENTS.RECONCILIATION,
        icon: 'compareArrows',
        requiredPermissions: ['payments:reconcile'],
      },
      {
        id: 'accounts-receivable',
        label: 'Accounts Receivable',
        path: ROUTES.PAYMENTS.ACCOUNTS_RECEIVABLE,
        icon: 'accountBalance',
        requiredPermissions: ['payments:view'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: ROUTES.REPORTS.ROOT,
    icon: 'barChart',
    requiredPermissions: ['reports:view'],
    children: [
      {
        id: 'reports-dashboard',
        label: 'Reports Dashboard',
        path: ROUTES.REPORTS.DASHBOARD,
        icon: 'dashboard',
        requiredPermissions: ['reports:view'],
      },
      {
        id: 'report-selection',
        label: 'Report Selection',
        path: ROUTES.REPORTS.SELECTION,
        icon: 'list',
        requiredPermissions: ['reports:view'],
      },
      {
        id: 'revenue-reports',
        label: 'Revenue Reports',
        path: ROUTES.REPORTS.REVENUE,
        icon: 'monetizationOn',
        requiredPermissions: ['reports:view'],
      },
      {
        id: 'claims-reports',
        label: 'Claims Reports',
        path: ROUTES.REPORTS.CLAIMS,
        icon: 'description',
        requiredPermissions: ['reports:view'],
      },
      {
        id: 'financial-reports',
        label: 'Financial Reports',
        path: ROUTES.REPORTS.FINANCIAL,
        icon: 'accountBalance',
        requiredPermissions: ['reports:view'],
      },
      {
        id: 'custom-reports',
        label: 'Custom Reports',
        path: ROUTES.REPORTS.CUSTOM_BUILDER,
        icon: 'build',
        requiredPermissions: ['reports:create'],
      },
    ],
  },
];

/**
 * Simplified navigation items for mobile bottom navigation
 * These items represent the top-level sections available in the mobile view
 * following the responsive design approach defined in the technical specifications
 */
export const MOBILE_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD.ROOT,
    icon: 'dashboard',
    requiredPermissions: ['dashboard:view'],
  },
  {
    id: 'claims',
    label: 'Claims',
    path: ROUTES.CLAIMS.ROOT,
    icon: 'description',
    requiredPermissions: ['claims:view'],
  },
  {
    id: 'billing',
    label: 'Billing',
    path: ROUTES.BILLING.ROOT,
    icon: 'receipt',
    requiredPermissions: ['billing:view'],
  },
  {
    id: 'payments',
    label: 'Payments',
    path: ROUTES.PAYMENTS.ROOT,
    icon: 'payments',
    requiredPermissions: ['payments:view'],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: ROUTES.REPORTS.ROOT,
    icon: 'barChart',
    requiredPermissions: ['reports:view'],
  },
];

/**
 * Secondary navigation items for settings, help, and profile sections
 * These items are typically displayed separately from the main navigation
 * and provide access to system configuration and user-specific features
 */
export const SECONDARY_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    path: ROUTES.SETTINGS.ROOT,
    icon: 'settings',
    requiredPermissions: ['settings:view'],
    children: [
      {
        id: 'users',
        label: 'User Management',
        path: ROUTES.SETTINGS.USERS,
        icon: 'people',
        requiredPermissions: ['settings:users:manage'],
      },
      {
        id: 'organization',
        label: 'Organization',
        path: ROUTES.SETTINGS.ORGANIZATION,
        icon: 'business',
        requiredPermissions: ['settings:organization:manage'],
      },
      {
        id: 'programs',
        label: 'Programs',
        path: ROUTES.SETTINGS.PROGRAMS,
        icon: 'category',
        requiredPermissions: ['settings:programs:manage'],
      },
      {
        id: 'payers',
        label: 'Payers',
        path: ROUTES.SETTINGS.PAYERS,
        icon: 'accountBalance',
        requiredPermissions: ['settings:payers:manage'],
      },
      {
        id: 'service-codes',
        label: 'Service Codes',
        path: ROUTES.SETTINGS.SERVICE_CODES,
        icon: 'code',
        requiredPermissions: ['settings:serviceCodes:manage'],
      },
      {
        id: 'integrations',
        label: 'Integrations',
        path: ROUTES.SETTINGS.INTEGRATIONS,
        icon: 'link',
        requiredPermissions: ['settings:integrations:manage'],
      },
      {
        id: 'notifications',
        label: 'Notifications',
        path: ROUTES.SETTINGS.NOTIFICATIONS,
        icon: 'notifications',
        requiredPermissions: ['settings:notifications:manage'],
      },
      {
        id: 'audit-log',
        label: 'Audit Log',
        path: ROUTES.SETTINGS.AUDIT_LOG,
        icon: 'history',
        requiredPermissions: ['settings:auditLog:view'],
      },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    path: ROUTES.HELP.ROOT,
    icon: 'help',
    requiredPermissions: [],
    children: [
      {
        id: 'knowledge-base',
        label: 'Knowledge Base',
        path: ROUTES.HELP.KNOWLEDGE_BASE,
        icon: 'book',
        requiredPermissions: [],
      },
      {
        id: 'tutorials',
        label: 'Tutorials',
        path: ROUTES.HELP.TUTORIALS,
        icon: 'ondemandVideo',
        requiredPermissions: [],
      },
      {
        id: 'support',
        label: 'Support',
        path: ROUTES.HELP.SUPPORT,
        icon: 'contactSupport',
        requiredPermissions: [],
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    path: ROUTES.PROFILE.ROOT,
    icon: 'accountCircle',
    requiredPermissions: [],
    children: [
      {
        id: 'user-profile',
        label: 'User Profile',
        path: ROUTES.PROFILE.ROOT,
        icon: 'person',
        requiredPermissions: [],
      },
      {
        id: 'password',
        label: 'Change Password',
        path: ROUTES.PROFILE.PASSWORD,
        icon: 'lock',
        requiredPermissions: [],
      },
      {
        id: 'notification-preferences',
        label: 'Notification Preferences',
        path: ROUTES.PROFILE.NOTIFICATIONS,
        icon: 'notifications',
        requiredPermissions: [],
      },
      {
        id: 'theme',
        label: 'Theme Settings',
        path: ROUTES.PROFILE.THEME,
        icon: 'palette',
        requiredPermissions: [],
      },
      {
        id: 'api-keys',
        label: 'API Keys',
        path: ROUTES.PROFILE.API_KEYS,
        icon: 'vpnKey',
        requiredPermissions: ['api:manage'],
      },
    ],
  },
];

/**
 * Mapping of navigation item IDs to their corresponding icon names
 * This allows consistent icon usage throughout the application
 * and centralizes icon management
 */
export const NAVIGATION_ICONS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'revenue-metrics': 'TrendingUp',
  'alerts': 'Notifications',
  'clients': 'People',
  'client-list': 'List',
  'new-client': 'PersonAdd',
  'services': 'Assignment',
  'service-dashboard': 'Dashboard',
  'service-list': 'List',
  'new-service': 'Add',
  'service-validation': 'CheckCircle',
  'claims': 'Description',
  'claims-dashboard': 'Dashboard',
  'claims-list': 'List',
  'new-claim': 'Add',
  'batch-claims': 'DynamicFeed',
  'status-tracking': 'Timeline',
  'billing': 'Receipt',
  'billing-dashboard': 'Dashboard',
  'billing-queue': 'Queue',
  'billing-validation': 'CheckCircle',
  'claim-creation': 'Create',
  'payments': 'Payments',
  'payments-dashboard': 'Dashboard',
  'payments-list': 'List',
  'new-payment': 'Add',
  'reconciliation': 'CompareArrows',
  'accounts-receivable': 'AccountBalance',
  'reports': 'BarChart',
  'reports-dashboard': 'Dashboard',
  'report-selection': 'List',
  'revenue-reports': 'MonetizationOn',
  'claims-reports': 'Description',
  'financial-reports': 'AccountBalance',
  'custom-reports': 'Build',
  'settings': 'Settings',
  'users': 'People',
  'organization': 'Business',
  'programs': 'Category',
  'payers': 'AccountBalance',
  'service-codes': 'Code',
  'integrations': 'Link',
  'notifications': 'Notifications',
  'audit-log': 'History',
  'help': 'Help',
  'knowledge-base': 'Book',
  'tutorials': 'OndemandVideo',
  'support': 'ContactSupport',
  'profile': 'AccountCircle',
  'user-profile': 'Person',
  'password': 'Lock',
  'notification-preferences': 'Notifications',
  'theme': 'Palette',
  'api-keys': 'VpnKey',
};