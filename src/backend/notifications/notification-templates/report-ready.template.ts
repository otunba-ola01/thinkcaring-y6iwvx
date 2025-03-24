/**
 * Notification templates for report generation completion in the HCBS Revenue Management System.
 * Provides templates for different types of reports (standard, scheduled, custom) with
 * customizable messages based on report type, format, and other parameters.
 * 
 * @module notification-templates/report-ready
 */

import { NotificationType, NotificationSeverity, NotificationTemplate } from '../../types/notification.types';
import { ReportType, ReportFormat } from '../../types/reports.types';
import { formatDate } from '../../utils/date';

/**
 * Template for standard one-time report generation notifications
 */
export const standardReportReadyTemplate: NotificationTemplate = {
  title: 'Report Ready: {{reportName}}',
  message: 'Your {{reportType}} report is now ready to view and download. ' +
    'Generated at {{generatedAt}}. ' +
    'Available formats: {{formats}}. ' +
    'Click to view the report.',
  type: NotificationType.REPORT_READY,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Report',
      url: '/reports/view/{{reportId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Download',
      url: '/reports/download/{{reportId}}',
      actionType: 'download',
      data: { format: '{{defaultFormat}}' }
    }
  ],
  expirationDays: 30
};

/**
 * Template for scheduled reports that run automatically
 */
export const scheduledReportReadyTemplate: NotificationTemplate = {
  title: 'Scheduled Report Ready: {{reportName}}',
  message: 'Your scheduled {{reportType}} report for {{dateRange}} is now ready. ' +
    'Generated at {{generatedAt}}. ' +
    'Available formats: {{formats}}. ' +
    'This report will expire on {{expiresAt}}.',
  type: NotificationType.REPORT_READY,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Report',
      url: '/reports/view/{{reportId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Download',
      url: '/reports/download/{{reportId}}',
      actionType: 'download',
      data: { format: '{{defaultFormat}}' }
    },
    {
      label: 'Manage Schedule',
      url: '/reports/schedules',
      actionType: 'manage',
      data: { scheduleId: '{{scheduleId}}' }
    }
  ],
  expirationDays: 90
};

/**
 * Template for custom user-defined reports
 */
export const customReportReadyTemplate: NotificationTemplate = {
  title: 'Custom Report Ready: {{reportName}}',
  message: 'Your custom report is now ready to view and download. ' +
    'Generated at {{generatedAt}}. ' +
    'Available formats: {{formats}}. ' +
    'This report will expire on {{expiresAt}}.',
  type: NotificationType.REPORT_READY,
  severity: NotificationSeverity.LOW,
  defaultActions: [
    {
      label: 'View Report',
      url: '/reports/view/{{reportId}}',
      actionType: 'view',
      data: {}
    },
    {
      label: 'Download',
      url: '/reports/download/{{reportId}}',
      actionType: 'download',
      data: { format: '{{defaultFormat}}' }
    },
    {
      label: 'Edit Report',
      url: '/reports/custom/{{reportId}}/edit',
      actionType: 'edit',
      data: {}
    }
  ],
  expirationDays: 60
};

/**
 * Gets the appropriate notification template based on report characteristics
 * 
 * @param reportData - Report data including type, format, and scheduling information
 * @returns The appropriate notification template for the report ready event
 */
export function getReportReadyTemplate(reportData: {
  type: ReportType;
  name: string;
  formats: ReportFormat[];
  isScheduled?: boolean;
  isCustom?: boolean;
  generatedAt: Date;
  expiresAt?: Date;
  dateRange?: { startDate: string; endDate: string };
  scheduleId?: string;
  reportId: string;
}): NotificationTemplate {
  // Determine which template to use based on report characteristics
  let template: NotificationTemplate;
  
  if (reportData.isScheduled) {
    template = { ...scheduledReportReadyTemplate };
  } else if (reportData.isCustom || reportData.type === ReportType.CUSTOM) {
    template = { ...customReportReadyTemplate };
  } else {
    template = { ...standardReportReadyTemplate };
  }
  
  // Format the message with report-specific details
  template.message = formatReportReadyMessage(template.message, reportData);
  template.title = formatReportReadyMessage(template.title, reportData);
  
  // Update actions with report-specific data
  template.defaultActions = template.defaultActions.map(action => {
    const updatedData = { ...action.data };
    
    // Replace placeholders in action data
    if (updatedData.format === '{{defaultFormat}}' && reportData.formats.length > 0) {
      updatedData.format = reportData.formats[0];
    }
    
    // Replace placeholders in URL
    let url = action.url
      .replace('{{reportId}}', reportData.reportId)
      .replace('{{scheduleId}}', reportData.scheduleId || '');
    
    return {
      ...action,
      url,
      data: updatedData
    };
  });
  
  return template;
}

/**
 * Formats the notification message with report-specific details
 * 
 * @param template - Message template with placeholders
 * @param reportData - Report data to use for filling placeholders
 * @returns Formatted message with placeholders replaced
 */
export function formatReportReadyMessage(template: string, reportData: {
  type: ReportType;
  name: string;
  formats: ReportFormat[];
  generatedAt: Date;
  expiresAt?: Date;
  dateRange?: { startDate: string; endDate: string };
  [key: string]: any;
}): string {
  let message = template;
  
  // Replace common placeholders
  message = message.replace(/{{reportName}}/g, reportData.name);
  message = message.replace(/{{reportType}}/g, getReportTypeText(reportData.type));
  message = message.replace(/{{generatedAt}}/g, formatDate(reportData.generatedAt) || 'Unknown date');
  message = message.replace(/{{formats}}/g, formatReportFormats(reportData.formats));
  
  // Replace optional placeholders if data is provided
  if (reportData.expiresAt) {
    message = message.replace(/{{expiresAt}}/g, formatDate(reportData.expiresAt) || 'Unknown date');
  }
  
  if (reportData.dateRange) {
    const startDate = formatDate(reportData.dateRange.startDate) || 'Unknown date';
    const endDate = formatDate(reportData.dateRange.endDate) || 'Unknown date';
    message = message.replace(/{{dateRange}}/g, `${startDate} to ${endDate}`);
  }
  
  // Replace any other placeholders with properties from reportData
  Object.keys(reportData).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    if (message.match(placeholder)) {
      message = message.replace(placeholder, reportData[key].toString());
    }
  });
  
  return message;
}

/**
 * Gets a user-friendly text description for a report type
 * 
 * @param type - Report type enum value
 * @returns User-friendly description of the report type
 */
export function getReportTypeText(type: ReportType): string {
  switch (type) {
    case ReportType.REVENUE_BY_PROGRAM:
      return 'Revenue by Program';
    case ReportType.REVENUE_BY_PAYER:
      return 'Revenue by Payer';
    case ReportType.CLAIMS_STATUS:
      return 'Claims Status';
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return 'Aging Accounts Receivable';
    case ReportType.DENIAL_ANALYSIS:
      return 'Denial Analysis';
    case ReportType.PAYER_PERFORMANCE:
      return 'Payer Performance';
    case ReportType.SERVICE_UTILIZATION:
      return 'Service Utilization';
    case ReportType.CUSTOM:
      return 'Custom';
    default:
      return type.toString();
  }
}

/**
 * Gets a user-friendly text description for a report format
 * 
 * @param format - Report format enum value
 * @returns User-friendly description of the report format
 */
export function getReportFormatText(format: ReportFormat): string {
  switch (format) {
    case ReportFormat.PDF:
      return 'PDF';
    case ReportFormat.EXCEL:
      return 'Excel';
    case ReportFormat.CSV:
      return 'CSV';
    case ReportFormat.JSON:
      return 'JSON';
    default:
      return format.toString();
  }
}

/**
 * Formats a list of report formats into a readable string
 * 
 * @param formats - Array of report format enum values
 * @returns Comma-separated list of report formats
 */
export function formatReportFormats(formats: ReportFormat[]): string {
  if (!formats || formats.length === 0) {
    return 'None';
  }
  
  return formats.map(format => getReportFormatText(format)).join(', ');
}