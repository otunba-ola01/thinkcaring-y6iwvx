import { 
  TimeFrame, 
  AlertCategory, 
  Severity, 
  DashboardMetrics, 
  RevenueMetrics, 
  ClaimsMetrics, 
  ServiceMetrics, 
  AgingReceivablesSummary, 
  AlertNotification, 
  ClaimStatusBreakdown, 
  RevenueByProgram, 
  RevenueByPayer, 
  RevenueByFacility, 
  RevenueTrendPoint, 
  DashboardApiResponse 
} from '../../types/dashboard.types';
import { ClaimStatus, ClaimType } from '../../types/claims.types';
import { ServiceStatus } from '../../types/services.types';
import { mockClaimMetrics } from './claims';
import { mockPaymentDashboardMetrics, mockAccountsReceivableSummary } from './payments';

/**
 * Generates mock revenue trend data for the specified number of periods
 */
const generateMockRevenueTrend = (periods: number): RevenueTrendPoint[] => {
  const trendPoints: RevenueTrendPoint[] = [];
  
  // Start date is X periods ago from today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (periods - 1));
  
  // Generate a trend point for each period
  for (let i = 0; i < periods; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate a revenue amount between $80,000 and $120,000
    const baseAmount = 100000;
    const variance = 20000;
    const amount = Math.round((baseAmount + (Math.random() * variance * 2) - variance) * 100) / 100;
    
    // Previous amount should be slightly different
    const previousAmount = i === 0 ? null : Math.round((amount * (0.9 + Math.random() * 0.2)) * 100) / 100;
    
    trendPoints.push({
      date: date.toISOString().split('T')[0],
      amount,
      previousAmount
    });
  }
  
  return trendPoints;
};

/**
 * Generates mock revenue breakdown by program
 */
const generateMockRevenueByProgram = (): RevenueByProgram[] => {
  const programs = [
    { id: 'program-1', name: 'Personal Care', amount: 456789 },
    { id: 'program-2', name: 'Residential', amount: 345678 },
    { id: 'program-3', name: 'Day Services', amount: 234567 },
    { id: 'program-4', name: 'Respite', amount: 123456 },
    { id: 'program-5', name: 'Other', amount: 85188 }
  ];
  
  // Calculate total revenue
  const totalRevenue = programs.reduce((sum, program) => sum + program.amount, 0);
  
  // Calculate percentages and add previous period amounts
  return programs.map(program => {
    const percentage = parseFloat(((program.amount / totalRevenue) * 100).toFixed(1));
    
    // Previous amount varies by ±10%
    const changeMultiplier = 0.9 + Math.random() * 0.2;
    const previousAmount = Math.round(program.amount * changeMultiplier);
    const changePercentage = parseFloat(((program.amount / previousAmount - 1) * 100).toFixed(1));
    
    return {
      programId: program.id,
      programName: program.name,
      amount: program.amount,
      percentage,
      previousAmount,
      changePercentage
    };
  });
};

/**
 * Generates mock revenue breakdown by payer
 */
const generateMockRevenueByPayer = (): RevenueByPayer[] => {
  const payers = [
    { id: 'payer-1', name: 'Medicaid', amount: 624567 },
    { id: 'payer-2', name: 'Medicare', amount: 235678 },
    { id: 'payer-3', name: 'Blue Cross', amount: 134567 },
    { id: 'payer-4', name: 'Aetna', amount: 112345 },
    { id: 'payer-5', name: 'United Healthcare', amount: 138521 }
  ];
  
  // Calculate total revenue
  const totalRevenue = payers.reduce((sum, payer) => sum + payer.amount, 0);
  
  // Calculate percentages and add previous period amounts
  return payers.map(payer => {
    const percentage = parseFloat(((payer.amount / totalRevenue) * 100).toFixed(1));
    
    // Previous amount varies by ±15%
    const changeMultiplier = 0.85 + Math.random() * 0.3;
    const previousAmount = Math.round(payer.amount * changeMultiplier);
    const changePercentage = parseFloat(((payer.amount / previousAmount - 1) * 100).toFixed(1));
    
    return {
      payerId: payer.id,
      payerName: payer.name,
      amount: payer.amount,
      percentage,
      previousAmount,
      changePercentage
    };
  });
};

/**
 * Generates mock revenue breakdown by facility
 */
const generateMockRevenueByFacility = (): RevenueByFacility[] => {
  const facilities = [
    { id: 'facility-1', name: 'Main Street Center', amount: 389567 },
    { id: 'facility-2', name: 'Westside Facility', amount: 278945 },
    { id: 'facility-3', name: 'North County Location', amount: 198765 },
    { id: 'facility-4', name: 'Southbay Center', amount: 167890 },
    { id: 'facility-5', name: 'Eastwood Facility', amount: 210511 }
  ];
  
  // Calculate total revenue
  const totalRevenue = facilities.reduce((sum, facility) => sum + facility.amount, 0);
  
  // Calculate percentages and add previous period amounts
  return facilities.map(facility => {
    const percentage = parseFloat(((facility.amount / totalRevenue) * 100).toFixed(1));
    
    // Previous amount varies by ±12%
    const changeMultiplier = 0.88 + Math.random() * 0.24;
    const previousAmount = Math.round(facility.amount * changeMultiplier);
    const changePercentage = parseFloat(((facility.amount / previousAmount - 1) * 100).toFixed(1));
    
    return {
      facilityId: facility.id,
      facilityName: facility.name,
      amount: facility.amount,
      percentage,
      previousAmount,
      changePercentage
    };
  });
};

/**
 * Generates mock alert notifications for the dashboard
 */
const generateMockAlerts = (): AlertNotification[] => {
  const now = new Date();
  const alerts: AlertNotification[] = [
    {
      id: 'alert-1',
      title: 'Claims Approaching Deadline',
      message: '5 claims are approaching their filing deadline in the next 7 days',
      category: AlertCategory.CLAIM,
      severity: Severity.WARNING,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false,
      entityType: 'claim',
      entityId: null,
      actionUrl: '/claims?filter=approaching_deadline',
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    },
    {
      id: 'alert-2',
      title: 'Denied Claim',
      message: 'Claim #C10043 for Brown, Bob was denied due to missing authorization',
      category: AlertCategory.CLAIM,
      severity: Severity.ERROR,
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      read: false,
      entityType: 'claim',
      entityId: 'claim-23',
      actionUrl: '/claims/claim-23',
      expiresAt: null
    },
    {
      id: 'alert-3',
      title: 'Authorization Expiring',
      message: 'Service authorization for Sarah Johnson expires in 15 days',
      category: AlertCategory.AUTHORIZATION,
      severity: Severity.WARNING,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      read: true,
      entityType: 'authorization',
      entityId: 'auth-45',
      actionUrl: '/clients/client-12/authorizations/auth-45',
      expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
    },
    {
      id: 'alert-4',
      title: 'Payment Received',
      message: 'Payment of $12,456.78 received from Medicaid',
      category: AlertCategory.PAYMENT,
      severity: Severity.INFO,
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      read: false,
      entityType: 'payment',
      entityId: 'payment-89',
      actionUrl: '/payments/payment-89',
      expiresAt: null
    },
    {
      id: 'alert-5',
      title: 'Unbilled Services',
      message: '12 services are ready for billing',
      category: AlertCategory.BILLING,
      severity: Severity.INFO,
      timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      read: true,
      entityType: 'service',
      entityId: null,
      actionUrl: '/billing/queue',
      expiresAt: null
    },
    {
      id: 'alert-6',
      title: 'Compliance Warning',
      message: 'Documentation missing for 3 recent services',
      category: AlertCategory.COMPLIANCE,
      severity: Severity.WARNING,
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      read: false,
      entityType: 'service',
      entityId: null,
      actionUrl: '/services?filter=missing_documentation',
      expiresAt: null
    },
    {
      id: 'alert-7',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur on Saturday at 11:00 PM',
      category: AlertCategory.SYSTEM,
      severity: Severity.INFO,
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      read: true,
      entityType: null,
      entityId: null,
      actionUrl: null,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
    },
    {
      id: 'alert-8',
      title: 'Payment Reconciliation Exception',
      message: 'Payment #P5042 has unmatched claims totaling $2,345.67',
      category: AlertCategory.PAYMENT,
      severity: Severity.WARNING,
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      read: false,
      entityType: 'payment',
      entityId: 'payment-42',
      actionUrl: '/payments/payment-42/reconcile',
      expiresAt: null
    }
  ];
  
  return alerts;
};

/**
 * Generates mock service delivery metrics
 */
const generateMockServiceMetrics = (): ServiceMetrics => {
  // Service status breakdown
  const statusBreakdown = [
    {
      status: ServiceStatus.DOCUMENTED,
      count: 45,
      amount: 58765.23,
      percentage: 15.8
    },
    {
      status: ServiceStatus.VALIDATED,
      count: 62,
      amount: 87234.56,
      percentage: 21.7
    },
    {
      status: ServiceStatus.BILLABLE,
      count: 38,
      amount: 43567.89,
      percentage: 13.3
    },
    {
      status: ServiceStatus.BILLED,
      count: 124,
      amount: 152345.67,
      percentage: 43.5
    },
    {
      status: ServiceStatus.INCOMPLETE,
      count: 16,
      amount: 16543.21,
      percentage: 5.7
    }
  ];

  // Services by program
  const servicesByProgram = [
    {
      programId: 'program-1',
      programName: 'Personal Care',
      count: 135,
      amount: 168432.56,
      percentage: 47.1
    },
    {
      programId: 'program-2',
      programName: 'Residential',
      count: 62,
      amount: 98765.43,
      percentage: 27.6
    },
    {
      programId: 'program-3',
      programName: 'Day Services',
      count: 48,
      amount: 54321.98,
      percentage: 15.2
    },
    {
      programId: 'program-4',
      programName: 'Respite',
      count: 29,
      amount: 32198.76,
      percentage: 9.0
    },
    {
      programId: 'program-5',
      programName: 'Other',
      count: 11,
      amount: 4737.83,
      percentage: 1.1
    }
  ];
  
  // Calculate totals
  const totalServices = statusBreakdown.reduce((sum, status) => sum + status.count, 0);
  const totalAmount = statusBreakdown.reduce((sum, status) => sum + status.amount, 0);
  
  // Calculate unbilled services (DOCUMENTED, VALIDATED, BILLABLE, INCOMPLETE)
  const unbilledServices = statusBreakdown
    .filter(s => s.status !== ServiceStatus.BILLED)
    .reduce((sum, status) => sum + status.count, 0);
  
  const unbilledAmount = statusBreakdown
    .filter(s => s.status !== ServiceStatus.BILLED)
    .reduce((sum, status) => sum + status.amount, 0);
  
  return {
    totalServices,
    totalAmount,
    unbilledServices,
    unbilledAmount,
    statusBreakdown,
    servicesByProgram
  };
};

// Create mock revenue metrics data
export const mockRevenueMetrics: RevenueMetrics = {
  currentPeriodRevenue: 1245678.00,
  previousPeriodRevenue: 1112345.00,
  changePercentage: 12.0,
  ytdRevenue: 8765432.10,
  previousYtdRevenue: 7654321.09,
  ytdChangePercentage: 14.5,
  projectedRevenue: 14500000.00,
  revenueByProgram: generateMockRevenueByProgram(),
  revenueByPayer: generateMockRevenueByPayer(),
  revenueByFacility: generateMockRevenueByFacility(),
  revenueTrend: generateMockRevenueTrend(12) // 12 months of trend data
};

// Create mock claims metrics data (imported from claims.ts)
export const mockClaimsMetrics = mockClaimMetrics;

// Create mock service metrics data
export const mockServiceMetrics: ServiceMetrics = generateMockServiceMetrics();

// Create mock alert notifications
export const mockAlertNotifications: AlertNotification[] = generateMockAlerts();

// Create combined dashboard metrics
export const mockDashboardMetrics: DashboardMetrics = {
  revenue: mockRevenueMetrics,
  claims: mockClaimMetrics,
  payments: mockPaymentDashboardMetrics,
  services: mockServiceMetrics,
  agingReceivables: mockAccountsReceivableSummary,
  alerts: mockAlertNotifications
};

// Create mock API responses
export const mockDashboardApiResponse: DashboardApiResponse = {
  metrics: mockDashboardMetrics,
  timestamp: new Date().toISOString()
};

export const mockRevenueMetricsApiResponse = {
  metrics: mockRevenueMetrics,
  timestamp: new Date().toISOString()
};

export const mockClaimsMetricsApiResponse = {
  metrics: mockClaimMetrics,
  timestamp: new Date().toISOString()
};

export const mockAlertNotificationsApiResponse = {
  alerts: mockAlertNotifications,
  timestamp: new Date().toISOString()
};

export const mockMarkAlertReadResponse = {
  success: true,
  alertId: 'alert-1',
  read: true
};