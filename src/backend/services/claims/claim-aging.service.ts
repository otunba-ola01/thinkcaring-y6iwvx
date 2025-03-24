/**
 * Service responsible for managing claim aging functionality in the HCBS Revenue Management System.
 * This service provides methods for generating aging reports, identifying claims approaching filing deadlines,
 * calculating aging metrics, and sending alerts for claims requiring attention based on their age.
 */

import { UUID, DateRange } from '../../types/common.types'; // Import common type definitions for IDs and date ranges
import { ClaimStatus, ClaimQueryParams, ClaimSummary } from '../../types/claims.types'; // Import claim-related types and interfaces
import { claimRepository } from '../../database/repositories/claim.repository'; // Import claim repository for database operations related to claim aging
import { NotificationService } from '../../services/notification.service'; // Import notification service for sending alerts about aging claims
import { logger } from '../../utils/logger'; // Import logger for logging aging operations
import { config } from '../../config'; // Import configuration settings for claims aging thresholds
import { formatDate, calculateDateDifference } from '../../utils/date'; // Import date utilities for formatting and calculating date differences
import { BusinessError } from '../../errors/business-error'; // Import error class for business rule violations

/**
 * ClaimAgingService: Provides functionality for managing claim aging, generating reports,
 * identifying claims approaching filing deadlines, calculating aging metrics, and sending alerts.
 */
export const ClaimAgingService = {
  /**
   * Generates a comprehensive aging report for claims based on specified filters.
   * @param params - ClaimQueryParams: Parameters for filtering claims.
   * @returns Promise<{ agingBuckets: Array<{ range: string, count: number, amount: number, claims: ClaimSummary[] }>, totalAmount: number, totalCount: number }>: Aging report with claims grouped by age ranges.
   */
  async getClaimAgingReport(params: ClaimQueryParams): Promise<{
    agingBuckets: Array<{ range: string; count: number; amount: number; claims: ClaimSummary[] }>;
    totalAmount: number;
    totalCount: number;
  }> {
    logger.info('Generating claim aging report', { params }); // Log aging report generation request with parameters

    try {
      // Prepare query conditions based on provided parameters
      const conditions: any = {};
      if (params.clientId) {
        conditions.client_id = params.clientId;
      }
      if (params.payerId) {
        conditions.payer_id = params.payerId;
      }
      if (params.claimStatus) {
        conditions.claim_status = params.claimStatus;
      }

      // Call claimRepository.getClaimAging with conditions
      const agingData = await claimRepository.getClaimAging(conditions);

      // Format aging buckets with standardized ranges (0-30, 31-60, 61-90, 90+ days)
      const agingBuckets = agingData.buckets.map(bucket => ({
        ...bucket,
        claims: [] as ClaimSummary[] // Initialize claims array for each bucket
      }));

      // For each bucket, retrieve claim summaries that fall within the age range
      for (const claim of agingData.claims) {
        const ageInDays = calculateDateDifference(claim.createdAt, new Date());
        if (ageInDays <= 30) {
          agingBuckets[0].claims.push(claim);
        } else if (ageInDays <= 60) {
          agingBuckets[1].claims.push(claim);
        } else if (ageInDays <= 90) {
          agingBuckets[2].claims.push(claim);
        } else {
          agingBuckets[3].claims.push(claim);
        }
      }

      // Calculate totals for count and amount across all buckets
      const totalAmount = agingData.totalAmount;
      const totalCount = agingData.totalCount;

      // Return the formatted aging report with buckets and totals
      return {
        agingBuckets,
        totalAmount,
        totalCount
      };
    } catch (error) {
      logger.error('Error generating claim aging report', { error }); // Handle and log any errors that occur during report generation
      throw error;
    }
  },

  /**
   * Retrieves claims that match specific aging criteria.
   * @param minAge - number: Minimum age of the claims in days.
   * @param maxAge - number: Maximum age of the claims in days.
   * @param status - ClaimStatus | ClaimStatus[] | null: Status or statuses of the claims to retrieve.
   * @param params - ClaimQueryParams: Additional parameters for filtering claims.
   * @returns Promise<{ claims: ClaimSummary[], total: number }>: Claims matching the aging criteria and total count.
   */
  async getAgingClaims(
    minAge: number,
    maxAge: number,
    status: ClaimStatus | ClaimStatus[] | null,
    params: ClaimQueryParams
  ): Promise<{ claims: ClaimSummary[]; total: number }> {
    logger.info('Retrieving aging claims', { minAge, maxAge, status, params }); // Log aging claims retrieval request with parameters

    try {
      // Calculate date thresholds based on minAge and maxAge parameters
      const now = new Date();
      const minDate = new Date(now.getTime() - maxAge * 24 * 60 * 60 * 1000);
      const maxDate = new Date(now.getTime() - minAge * 24 * 60 * 60 * 1000);

      // Prepare query conditions including date range and status filters
      const conditions: any = {
        created_at: {
          gte: formatDate(minDate),
          lte: formatDate(maxDate)
        }
      };

      if (status) {
        conditions.claim_status = status;
      }

      // Call claimRepository.findWithAdvancedQuery with conditions and pagination
      const queryParams: ClaimQueryParams = {
        ...params,
        filter: {
          conditions: Object.entries(conditions).map(([field, value]) => ({ field, operator: 'eq', value })),
          logicalOperator: 'AND'
        }
      };
      const { data, total } = await claimRepository.findWithAdvancedQuery(queryParams);

      // Transform results into claim summaries with aging information
      const claims = data.map(claim => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        clientId: claim.clientId,
        clientName: 'Client Name', // Replace with actual client name retrieval
        payerId: claim.payerId,
        payerName: 'Payer Name', // Replace with actual payer name retrieval
        claimStatus: claim.claimStatus,
        totalAmount: claim.totalAmount,
        serviceStartDate: claim.serviceStartDate,
        serviceEndDate: claim.serviceEndDate,
        submissionDate: claim.submissionDate,
        claimAge: calculateDateDifference(claim.createdAt, new Date())
      }));

      // Return the matching claims and total count
      return {
        claims,
        total
      };
    } catch (error) {
      logger.error('Error retrieving aging claims', { error }); // Handle and log any errors that occur during retrieval
      throw error;
    }
  },

  /**
   * Identifies claims approaching their filing deadline based on configuration thresholds.
   * @param daysThreshold - number: Number of days before the filing deadline to consider a claim as approaching the deadline.
   * @param params - ClaimQueryParams: Additional parameters for filtering claims.
   * @returns Promise<{ claims: ClaimSummary[], total: number }>: Claims approaching filing deadline and total count.
   */
  async getClaimsApproachingFilingDeadline(
    daysThreshold: number,
    params: ClaimQueryParams
  ): Promise<{ claims: ClaimSummary[]; total: number }> {
    logger.info('Retrieving claims approaching filing deadline', { daysThreshold, params }); // Log filing deadline check request with threshold

    try {
      // Get filing deadline configuration from config.claims
      const filingDeadlineConfig = config.claims?.filingDeadline;
      if (!filingDeadlineConfig) {
        throw new BusinessError('Filing deadline configuration not found', null, 'config.claims.filingDeadline.notFound');
      }

      // Calculate the date threshold based on current date and daysThreshold
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      // Prepare query conditions to find unbilled or draft claims created before threshold
      const conditions: any = {
        claim_status: [ClaimStatus.DRAFT],
        created_at: {
          lte: formatDate(thresholdDate)
        }
      };

      // Call claimRepository.findWithAdvancedQuery with conditions
      const queryParams: ClaimQueryParams = {
        ...params,
        filter: {
          conditions: Object.entries(conditions).map(([field, value]) => ({ field, operator: 'eq', value })),
          logicalOperator: 'AND'
        }
      };
      const { data, total } = await claimRepository.findWithAdvancedQuery(queryParams);

      // Transform results into claim summaries with deadline information
      const claims = data.map(claim => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        clientId: claim.clientId,
        clientName: 'Client Name', // Replace with actual client name retrieval
        payerId: claim.payerId,
        payerName: 'Payer Name', // Replace with actual payer name retrieval
        claimStatus: claim.claimStatus,
        totalAmount: claim.totalAmount,
        serviceStartDate: claim.serviceStartDate,
        serviceEndDate: claim.serviceEndDate,
        submissionDate: claim.submissionDate,
        claimAge: calculateDateDifference(claim.createdAt, new Date())
      }));

      // Return the claims approaching deadline and total count
      return {
        claims,
        total
      };
    } catch (error) {
      logger.error('Error retrieving claims approaching filing deadline', { error }); // Handle and log any errors that occur during retrieval
      throw error;
    }
  },

  /**
   * Calculates metrics related to claim aging for dashboards and reports.
   * @param dateRange - DateRange: Date range to calculate metrics for.
   * @param filters - object: Additional filters to apply.
   * @returns Promise<{ averageAgeDays: number, oldestClaimDays: number, agingByStatus: Record<ClaimStatus, { count: number, averageAge: number }>, agingByPayer: Array<{ payerId: UUID, payerName: string, count: number, averageAge: number }> }>: Aging metrics for analysis.
   */
  async getAgingMetrics(
    dateRange: DateRange,
    filters: object
  ): Promise<{
    averageAgeDays: number;
    oldestClaimDays: number;
    agingByStatus: Record<ClaimStatus, { count: number; averageAge: number }>;
    agingByPayer: Array<{ payerId: UUID; payerName: string; count: number; averageAge: number }>;
  }> {
    logger.info('Calculating claim aging metrics', { dateRange, filters }); // Log aging metrics calculation request

    try {
      // Prepare query conditions based on date range and filters
      const conditions: any = {
        created_at: {
          gte: formatDate(dateRange.startDate),
          lte: formatDate(dateRange.endDate)
        },
        ...filters
      };

      // Call claimRepository.getClaimMetrics to get base metrics
      const claimMetrics = await claimRepository.getClaimMetrics(conditions);

      // Calculate average age across all claims
      let totalAge = 0;
      claimMetrics.statusBreakdown.forEach(item => {
        totalAge += item.count * calculateDateDifference(item.status, new Date());
      });
      const averageAgeDays = claimMetrics.totalClaims > 0 ? totalAge / claimMetrics.totalClaims : 0;

      // Identify the oldest claim and its age in days
      let oldestClaimDays = 0;
      // TODO: Implement logic to find the oldest claim and calculate its age

      // Group claims by status and calculate average age per status
      const agingByStatus: Record<ClaimStatus, { count: number; averageAge: number }> = {};
      claimMetrics.statusBreakdown.forEach(item => {
        agingByStatus[item.status] = {
          count: item.count,
          averageAge: calculateDateDifference(item.status, new Date())
        };
      });

      // Group claims by payer and calculate average age per payer
      const agingByPayer: Array<{ payerId: UUID; payerName: string; count: number; averageAge: number }> = [];
      // TODO: Implement logic to group claims by payer and calculate average age

      // Return the compiled aging metrics
      return {
        averageAgeDays,
        oldestClaimDays,
        agingByStatus,
        agingByPayer
      };
    } catch (error) {
      logger.error('Error calculating claim aging metrics', { error }); // Handle and log any errors that occur during calculation
      throw error;
    }
  },

  /**
   * Identifies claims approaching filing deadlines and sends alerts to relevant users.
   * @param daysThreshold - number: Number of days before the filing deadline to send alerts.
   * @returns Promise<{ alertsSent: number, claims: ClaimSummary[] }>: Number of alerts sent and the affected claims.
   */
  async sendFilingDeadlineAlerts(daysThreshold: number): Promise<{ alertsSent: number; claims: ClaimSummary[] }> {
    logger.info('Starting filing deadline alert process', { daysThreshold }); // Log filing deadline alert process start

    try {
      // Get filing deadline threshold from config or use provided daysThreshold
      const filingDeadlineThreshold = daysThreshold || config.claims?.filingDeadline?.thresholdDays || 30;

      // Call getClaimsApproachingFilingDeadline to identify claims
      const { claims, total } = await this.getClaimsApproachingFilingDeadline(filingDeadlineThreshold, {
        pagination: { page: 1, limit: 100 } // Adjust pagination as needed
      } as ClaimQueryParams);

      // Group claims by responsible user or department
      const groupedClaims: { [key: string]: ClaimSummary[] } = {};
      claims.forEach(claim => {
        // Replace 'responsibleUser' with the actual property name
        const responsibleUser = 'responsibleUser'; // claim.responsibleUser || 'defaultDepartment';
        if (!groupedClaims[responsibleUser]) {
          groupedClaims[responsibleUser] = [];
        }
        groupedClaims[responsibleUser].push(claim);
      });

      let alertsSent = 0;

      // For each group, generate and send alerts using NotificationService
      for (const responsibleUser in groupedClaims) {
        if (groupedClaims.hasOwnProperty(responsibleUser)) {
          const claimList = groupedClaims[responsibleUser];

          // Generate alert message
          const message = `There are ${claimList.length} claims approaching their filing deadline.`;

          // Send alert using NotificationService
          await NotificationService.sendAlert(responsibleUser, 'Filing Deadline Alert', message);
          alertsSent++;
        }
      }

      // Return results with alert count and claim list
      return {
        alertsSent,
        claims
      };
    } catch (error) {
      logger.error('Error sending filing deadline alerts', { error }); // Handle and log any errors that occur during alert sending
      throw error;
    }
  },

  /**
   * Analyzes claim aging trends over time for trend analysis.
   * @param dateRange - DateRange: Date range to analyze trends for.
   * @param interval - string: Time interval for trend analysis (daily, weekly, monthly).
   * @param filters - object: Additional filters to apply.
   * @returns Promise<Array<{ date: string, metrics: { averageAgeDays: number, totalClaims: number, totalAmount: number, agingBuckets: Array<{ range: string, count: number, amount: number }> } }>>: Aging trends over the specified time period.
   */
  async getClaimAgingTrends(
    dateRange: DateRange,
    interval: string,
    filters: object
  ): Promise<Array<{
    date: string;
    metrics: {
      averageAgeDays: number;
      totalClaims: number;
      totalAmount: number;
      agingBuckets: Array<{ range: string; count: number; amount: number }>;
    };
  }>> {
    logger.info('Analyzing claim aging trends', { dateRange, interval, filters }); // Log aging trends analysis request

    try {
      // Validate date range and interval parameters
      // TODO: Implement validation logic

      // Generate date points based on interval (daily, weekly, monthly)
      // TODO: Implement date point generation

      // For each date point, calculate aging metrics as of that date
      // TODO: Implement aging metrics calculation

      // Compile trend data with metrics for each point in time
      const trendData: Array<{
        date: string;
        metrics: {
          averageAgeDays: number;
          totalClaims: number;
          totalAmount: number;
          agingBuckets: Array<{ range: string; count: number; amount: number }>;
        };
      }> = [];

      // Return the trend analysis data
      return trendData;
    } catch (error) {
      logger.error('Error analyzing claim aging trends', { error }); // Handle and log any errors that occur during analysis
      throw error;
    }
  },

  /**
   * Calculates risk scores for claims based on their age and status.
   * @param claim - ClaimSummary: Claim to assess risk for.
   * @returns { riskScore: number, riskLevel: 'low' | 'medium' | 'high' | 'critical', factors: string[] }: Risk assessment for the claim.
   */
  async calculateAgingRisk(claim: ClaimSummary): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  }> {
    logger.debug('Calculating aging risk for claim', { claim }); // Log risk calculation request

    try {
      // Initialize risk score and factors array
      let riskScore = 0;
      const factors: string[] = [];

      // Evaluate claim age and add to risk score based on thresholds
      const ageInDays = calculateDateDifference(claim.createdAt, new Date());
      if (ageInDays > 90) {
        riskScore += 50;
        factors.push('Age > 90 days');
      } else if (ageInDays > 60) {
        riskScore += 30;
        factors.push('Age > 60 days');
      } else if (ageInDays > 30) {
        riskScore += 10;
        factors.push('Age > 30 days');
      }

      // Evaluate claim status and adjust risk score accordingly
      switch (claim.claimStatus) {
        case ClaimStatus.DENIED:
          riskScore += 40;
          factors.push('Claim Denied');
          break;
        case ClaimStatus.PENDING:
          riskScore += 20;
          factors.push('Claim Pending');
          break;
        case ClaimStatus.DRAFT:
          riskScore += 15;
          factors.push('Claim in Draft');
          break;
        default:
          break;
      }

      // Consider payer type and historical payment patterns
      // TODO: Implement payer risk assessment

      // Consider claim amount in risk calculation
      if (claim.totalAmount > 10000) {
        riskScore += 20;
        factors.push('Claim Amount > $10,000');
      } else if (claim.totalAmount > 5000) {
        riskScore += 10;
        factors.push('Claim Amount > $5,000');
      }

      // Determine risk level based on final score (low, medium, high, critical)
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore > 80) {
        riskLevel = 'critical';
      } else if (riskScore > 50) {
        riskLevel = 'high';
      } else if (riskScore > 20) {
        riskLevel = 'medium';
      }

      // Compile risk factors that contributed to the score
      return {
        riskScore,
        riskLevel,
        factors
      };
    } catch (error) {
      logger.error('Error calculating aging risk', { error }); // Handle and log any errors that occur during calculation
      throw error;
    }
  },

  /**
   * Generates a prioritized list of claims requiring attention based on aging risk.
   * @param params - ClaimQueryParams: Parameters for filtering claims.
   * @returns Promise<Array<{ claim: ClaimSummary, riskAssessment: { riskScore: number, riskLevel: string, factors: string[] }, recommendedActions: string[] }>>: Prioritized list of claims with risk assessment and recommended actions.
   */
  async generateAgingPriorityList(
    params: ClaimQueryParams
  ): Promise<Array<{
    claim: ClaimSummary;
    riskAssessment: { riskScore: number; riskLevel: string; factors: string[] };
    recommendedActions: string[];
  }>> {
    logger.info('Generating aging priority list', { params }); // Log priority list generation request

    try {
      // Call getAgingClaims to retrieve claims with aging criteria
      const { claims, total } = await this.getAgingClaims(30, 365, [ClaimStatus.DRAFT, ClaimStatus.PENDING, ClaimStatus.DENIED], params);

      // For each claim, calculate risk using calculateAgingRisk
      const priorityList = claims.map(claim => {
        const riskAssessment = this.calculateAgingRisk(claim);

        // Determine recommended actions based on risk level and claim status
        const recommendedActions: string[] = [];
        if (riskAssessment.riskLevel === 'critical') {
          recommendedActions.push('Immediately review claim details');
          recommendedActions.push('Contact payer for status');
        } else if (riskAssessment.riskLevel === 'high') {
          recommendedActions.push('Review claim details');
          recommendedActions.push('Verify documentation');
        } else if (riskAssessment.riskLevel === 'medium') {
          recommendedActions.push('Check claim status');
        }

        return {
          claim,
          riskAssessment,
          recommendedActions
        };
      });

      // Sort claims by risk score in descending order
      priorityList.sort((a, b) => b.riskAssessment.riskScore - a.riskAssessment.riskScore);

      // Return prioritized list with risk assessments and recommendations
      return priorityList;
    } catch (error) {
      logger.error('Error generating aging priority list', { error }); // Handle and log any errors that occur during generation
      throw error;
    }
  }
};