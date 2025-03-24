import { logger } from '../utils/logger'; // winston 3.8.2
import { DateRange, UUID } from '../types/common.types';
import { ClaimStatus, ClaimSummary, ClaimMetrics } from '../types/claims.types';
import { PaymentSummary, AccountsReceivableAging, PaymentMetrics } from '../types/payments.types';
import { FinancialMetric, TimeFrame } from '../types/reports.types';
import { claimRepository } from '../database/repositories/claim.repository';
import { paymentRepository } from '../database/repositories/payment.repository';
import { programRepository } from '../database/repositories/program.repository';
import { payerRepository } from '../database/repositories/payer.repository';
import { serviceRepository } from '../database/repositories/service.repository';
import { notificationRepository } from '../database/repositories/notification.repository';
import { dateUtils } from '../utils/date';
import { FinancialMetricsService } from './reports/financial-metrics.service';
import { BusinessError } from '../errors/business-error';

/**
 * Service for providing dashboard data and metrics
 */
class DashboardService {
  private financialMetricsService: FinancialMetricsService;

  /**
   * Creates a new instance of the DashboardService
   * @param financialMetricsService 
   */
  constructor(financialMetricsService: FinancialMetricsService) {
    this.financialMetricsService = financialMetricsService;
  }

  /**
   * Retrieves comprehensive metrics for the dashboard
   * @param filters 
   * @returns Dashboard metrics including revenue, claims, alerts, and recent claims
   */
  async getDashboardMetrics(filters: any): Promise<{
    revenue: any;
    claims: any;
    alerts: any;
    recentClaims: ClaimSummary[];
  }> {
    try {
      logger.debug('Retrieving dashboard metrics', { filters });

      // Extract date range or time frame from filters
      let timeFrame: TimeFrame | DateRange = filters.timeFrame;

      // Convert time frame to date range if needed
      if (!filters.dateRange && filters.timeFrame) {
        timeFrame = dateUtils.getDateRangeFromTimeFrame(filters.timeFrame);
      }

      // Get revenue metrics using getRevenueMetrics
      const revenue = await this.getRevenueMetrics(timeFrame, filters);

      // Get claims metrics using getClaimsMetrics
      const claims = await this.getClaimsMetrics(timeFrame, filters);

      // Get alert notifications using getAlertNotifications
      const alerts = await this.getAlertNotifications(filters);

      // Get recent claims using getRecentClaims
      const recentClaims = await this.getRecentClaims(filters, 5);

      // Combine all metrics into a single response object
      const dashboardMetrics = {
        revenue,
        claims,
        alerts,
        recentClaims
      };

      // Return the combined dashboard metrics
      return dashboardMetrics;
    } catch (error) {
      logger.error('Error retrieving dashboard metrics', { error });
      throw error;
    }
  }

  /**
   * Retrieves revenue metrics for the dashboard
   * @param timeFrame 
   * @param filters 
   * @returns Revenue metrics including total revenue, revenue by program, and revenue by payer
   */
  async getRevenueMetrics(timeFrame: TimeFrame | DateRange, filters: any): Promise<{
    metrics: FinancialMetric[];
    byProgram: any[];
    byPayer: any[];
  }> {
    try {
      logger.debug('Retrieving revenue metrics', { timeFrame, filters });

      // Convert time frame to date range if needed
      let dateRange: DateRange = timeFrame as DateRange;
      if (typeof timeFrame === 'string') {
        dateRange = dateUtils.getDateRangeFromTimeFrame(timeFrame);
      }

      // Get financial metrics from financialMetricsService.getRevenueMetrics
      const metrics = await this.financialMetricsService.getRevenueMetrics(dateRange, filters);

      // Get revenue by program from programRepository.getRevenueByProgram
      const byProgram = await this.getRevenueByProgram(dateRange, filters);

      // Get revenue by payer from payerRepository.getRevenueByPayer
      const byPayer = await this.getRevenueByPayer(dateRange, filters);

      // Format and combine all revenue metrics
      const revenueMetrics = {
        metrics,
        byProgram,
        byPayer
      };

      // Return the combined revenue metrics
      return revenueMetrics;
    } catch (error) {
      logger.error('Error retrieving revenue metrics', { error });
      throw error;
    }
  }

  /**
   * Retrieves claims metrics for the dashboard
   * @param timeFrame 
   * @param filters 
   * @returns Claims metrics including total claims, claims by status, and aging claims
   */
  async getClaimsMetrics(timeFrame: TimeFrame | DateRange, filters: any): Promise<{
    metrics: FinancialMetric[];
    byStatus: any[];
    aging: any[];
  }> {
    try {
      logger.debug('Retrieving claims metrics', { timeFrame, filters });

      // Convert time frame to date range if needed
      let dateRange: DateRange = timeFrame as DateRange;
      if (typeof timeFrame === 'string') {
        dateRange = dateUtils.getDateRangeFromTimeFrame(timeFrame);
      }

      // Get financial metrics from financialMetricsService.getClaimsMetrics
      const metrics = await this.financialMetricsService.getClaimsMetrics(dateRange, filters);

      // Get claims by status from claimRepository.getClaimsByStatus
      const byStatus = await this.getClaimsByStatus(dateRange, filters);

      // Get claim metrics including aging from claimRepository.getClaimMetrics
      const aging = await claimRepository.getClaimMetrics({
        service_start_date: { '>=': dateRange.startDate, '<=': dateRange.endDate }
      });

      // Format and combine all claims metrics
      const claimsMetrics = {
        metrics,
        byStatus,
        aging
      };

      // Return the combined claims metrics
      return claimsMetrics;
    } catch (error) {
      logger.error('Error retrieving claims metrics', { error });
      throw error;
    }
  }

  /**
   * Retrieves alert notifications for the dashboard
   * @param filters 
   * @returns Alert notifications and total count
   */
  async getAlertNotifications(filters: any): Promise<{ alerts: any[]; count: number }> {
    try {
      logger.debug('Retrieving alert notifications', { filters });

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get alert notifications from notificationRepository.getAlertNotifications
      const notifications = await notificationRepository.getAlertNotifications({
        userId: organizationId // TODO: Replace with actual user ID
      });

      // Format alerts with priority, message, and action information
      const alerts = notifications.map(notification => ({
        priority: notification.severity,
        message: notification.content.message,
        action: notification.actions[0] // TODO: Handle multiple actions
      }));

      // Return the alerts with total count
      return {
        alerts,
        count: notifications.length
      };
    } catch (error) {
      logger.error('Error retrieving alert notifications', { error });
      throw error;
    }
  }

  /**
   * Retrieves recent claims for the dashboard
   * @param filters 
   * @param limit 
   * @returns List of recent claims
   */
  async getRecentClaims(filters: any, limit: number = 5): Promise<ClaimSummary[]> {
    try {
      logger.debug('Retrieving recent claims', { filters, limit });

      // Set default limit if not provided (typically 5 or 10)
      const recentClaimsLimit = limit || 5;

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get recent claims from claimRepository.getRecentClaims
      const recentClaims = await claimRepository.getRecentClaims({
        clientId: organizationId // TODO: Replace with actual client ID
      }, recentClaimsLimit);

      // Format claims with calculated age and other display properties
      const formattedClaims = recentClaims.map(claim => ({
        ...claim,
        claimAge: dateUtils.calculateDateDifference(claim.submissionDate, new Date())
      }));

      // Return the formatted recent claims
      return formattedClaims;
    } catch (error) {
      logger.error('Error retrieving recent claims', { error });
      throw error;
    }
  }

  /**
   * Retrieves revenue breakdown by program
   * @param timeFrame 
   * @param filters 
   * @returns Revenue data broken down by program
   */
  async getRevenueByProgram(timeFrame: TimeFrame | DateRange, filters: any): Promise<any[]> {
    try {
      logger.debug('Retrieving revenue by program', { timeFrame, filters });

      // Convert time frame to date range if needed
      let dateRange: DateRange = timeFrame as DateRange;
      if (typeof timeFrame === 'string') {
        dateRange = dateUtils.getDateRangeFromTimeFrame(timeFrame);
      }

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get revenue by program from programRepository.getRevenueByProgram
      const revenueByProgram = await programRepository.getRevenueByProgram(dateRange.startDate, dateRange.endDate, {
        organizationId // TODO: Replace with actual organization ID
      });

      // Format the data for chart display with program names and amounts
      const formattedData = revenueByProgram.map(item => ({
        programName: item.programName,
        revenue: item.revenue
      }));

      // Calculate percentages of total revenue for each program
      const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
      const dataWithPercentages = formattedData.map(item => ({
        ...item,
        percentage: (item.revenue / totalRevenue) * 100
      }));

      // Return the formatted revenue by program data
      return dataWithPercentages;
    } catch (error) {
      logger.error('Error retrieving revenue by program', { error });
      throw error;
    }
  }

  /**
   * Retrieves revenue breakdown by payer
   * @param timeFrame 
   * @param filters 
   * @returns Revenue data broken down by payer
   */
  async getRevenueByPayer(timeFrame: TimeFrame | DateRange, filters: any): Promise<any[]> {
    try {
      logger.debug('Retrieving revenue by payer', { timeFrame, filters });

      // Convert time frame to date range if needed
      let dateRange: DateRange = timeFrame as DateRange;
      if (typeof timeFrame === 'string') {
        dateRange = dateUtils.getDateRangeFromTimeFrame(timeFrame);
      }

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get revenue by payer from payerRepository.getRevenueByPayer
      const revenueByPayer = await payerRepository.getPayerSummaries({
        organizationId // TODO: Replace with actual organization ID
      });

      // Format the data for chart display with payer names and amounts
      const formattedData = revenueByPayer.map(item => ({
        payerName: item.name,
        revenue: 0 // TODO: Replace with actual revenue data
      }));

      // Calculate percentages of total revenue for each payer
      const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
      const dataWithPercentages = formattedData.map(item => ({
        ...item,
        percentage: (item.revenue / totalRevenue) * 100
      }));

      // Return the formatted revenue by payer data
      return dataWithPercentages;
    } catch (error) {
      logger.error('Error retrieving revenue by payer', { error });
      throw error;
    }
  }

  /**
   * Retrieves aging receivables for the dashboard
   * @param filters 
   * @returns Aging receivables data
   */
  async getAgingReceivables(filters: any): Promise<AccountsReceivableAging> {
    try {
      logger.debug('Retrieving aging receivables', { filters });

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get aging receivables from paymentRepository.getAgingReceivables
      const agingReceivables = await paymentRepository.getAgingReceivables({
        organizationId // TODO: Replace with actual organization ID
      });

      // Format the data for chart display with aging buckets
      const formattedData = {
        current: agingReceivables.current,
        days1to30: agingReceivables.days1to30,
        days31to60: agingReceivables.days31to60,
        days61to90: agingReceivables.days61to90,
        days91Plus: agingReceivables.days91Plus,
        totalOutstanding: agingReceivables.totalOutstanding,
        agingByPayer: agingReceivables.agingByPayer,
        agingByProgram: agingReceivables.agingByProgram,
        asOfDate: agingReceivables.asOfDate
      };

      // Return the formatted aging receivables data
      return formattedData;
    } catch (error) {
      logger.error('Error retrieving aging receivables', { error });
      throw error;
    }
  }

  /**
   * Retrieves claims breakdown by status
   * @param timeFrame 
   * @param filters 
   * @returns Claims data broken down by status
   */
  async getClaimsByStatus(timeFrame: TimeFrame | DateRange, filters: any): Promise<any[]> {
    try {
      logger.debug('Retrieving claims by status', { timeFrame, filters });

      // Convert time frame to date range if needed
      let dateRange: DateRange = timeFrame as DateRange;
      if (typeof timeFrame === 'string') {
        dateRange = dateUtils.getDateRangeFromTimeFrame(timeFrame);
      }

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get claims by status from claimRepository.getClaimsByStatus
      const claimsByStatus = await claimRepository.findByStatus([ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.PENDING, ClaimStatus.PAID, ClaimStatus.DENIED], {
        page: 1,
        limit: 100
      });

      // Format the data for chart display with status names and counts
      const formattedData = claimsByStatus.data.map(item => ({
        status: item.claimStatus,
        count: claimsByStatus.total
      }));

      // Calculate percentages of total claims for each status
      const totalClaims = formattedData.reduce((sum, item) => sum + item.count, 0);
      const dataWithPercentages = formattedData.map(item => ({
        ...item,
        percentage: (item.count / totalClaims) * 100
      }));

      // Return the formatted claims by status data
      return dataWithPercentages;
    } catch (error) {
      logger.error('Error retrieving claims by status', { error });
      throw error;
    }
  }

  /**
   * Retrieves unbilled services metrics for the dashboard
   * @param filters 
   * @returns Unbilled services metrics
   */
  async getUnbilledServices(filters: any): Promise<{ count: number; amount: number; oldestDate: string }> {
    try {
      logger.debug('Retrieving unbilled services', { filters });

      // Extract organization ID and other filters
      const organizationId = filters.organizationId; // TODO: Implement organization ID extraction

      // Get unbilled services from serviceRepository.getUnbilledServices
      const unbilledServices = await serviceRepository.getUnbilledServices({
        clientId: organizationId // TODO: Replace with actual client ID
      }, { page: 1, limit: 100 });

      // Calculate total count and amount of unbilled services
      const totalCount = unbilledServices.total;
      const totalAmount = unbilledServices.data.reduce((sum, service) => sum + service.amount, 0);

      // Determine the oldest unbilled service date
      const oldestDate = unbilledServices.data.length > 0 ? unbilledServices.data[0].serviceDate : null;

      // Return the unbilled services metrics
      return {
        count: totalCount,
        amount: totalAmount,
        oldestDate
      };
    } catch (error) {
      logger.error('Error retrieving unbilled services', { error });
      throw error;
    }
  }
}

// Export the DashboardService class
export { DashboardService };