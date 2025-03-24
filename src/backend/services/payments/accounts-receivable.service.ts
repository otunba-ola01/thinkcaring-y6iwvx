import { UUID, Money, ISO8601Date, RepositoryOptions } from '../../types/common.types'; // Import common type definitions used in accounts receivable operations
import { AccountsReceivableAging, ReconciliationStatus, ClaimPayment } from '../../types/payments.types'; // Import payment-related type definitions for accounts receivable
import { ClaimStatus } from '../../types/claims.types'; // Import claim status enum for filtering unpaid claims
import { paymentRepository } from '../../database/repositories/payment.repository'; // Access payment data for accounts receivable operations
import { claimRepository } from '../../database/repositories/claim.repository'; // Access claim data for accounts receivable operations
import { PaymentModel } from '../../models/payment.model'; // Use payment model for business logic operations
import { ClaimModel } from '../../models/claim.model'; // Use claim model for business logic operations
import { paymentMatchingService } from './payment-matching.service'; // Use payment matching service for finding potential claim matches
import { formatDate, formatCurrency } from '../../utils/formatter'; // Format dates and currency amounts for reports
import { NotFoundError } from '../../errors/not-found-error'; // Error handling for entity not found scenarios
import { BusinessError } from '../../errors/business-error'; // Error handling for business rule violations
import { logger } from '../../utils/logger'; // Logging for accounts receivable operations

/**
 * Service for managing accounts receivable, including aging reports and outstanding payment tracking
 */
class AccountsReceivableService {
  /**
   * Creates a new accounts receivable service instance
   */
  constructor() {
    // Initialize service
    // Log service initialization
    logger.info('AccountsReceivableService initialized');
  }

  /**
   * Generates an accounts receivable aging report as of a specific date
   * @param asOfDate - The date for which to generate the aging report (ISO8601Date or null for current date)
   * @param payerId - Optional payer ID to filter the report
   * @param programId - Optional program ID to filter the report
   * @param options - Repository options
   * @returns Accounts receivable aging report with buckets by age
   */
  async getAgingReport(
    asOfDate: ISO8601Date | null,
    payerId: UUID | null,
    programId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<AccountsReceivableAging> {
    // Set asOfDate to current date if not provided
    const reportDate: Date = asOfDate ? new Date(asOfDate) : new Date();
    const asOfDateString: ISO8601Date = formatDate(reportDate) || '';

    // Prepare query conditions based on payerId and programId filters
    const conditions: any = {};
    if (payerId) {
      conditions.payerId = payerId;
    }
    if (programId) {
      conditions.programId = programId;
    }

    // Get claim aging data from claimRepository.getClaimAging
    const claimAgingData = await claimRepository.getClaimAging(conditions, options);

    // Calculate aging buckets (current, 1-30, 31-60, 61-90, 90+ days)
    let current = 0;
    let days1to30 = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let days91Plus = 0;

    claimAgingData.buckets.forEach(bucket => {
      switch (bucket.range) {
        case '0-30':
          days1to30 = bucket.amount;
          break;
        case '31-60':
          days31to60 = bucket.amount;
          break;
        case '61-90':
          days61to90 = bucket.amount;
          break;
        case '91+':
          days91Plus = bucket.amount;
          break;
        default:
          current = bucket.amount;
          break;
      }
    });

    // Calculate total outstanding amount across all buckets
    const totalOutstanding = current + days1to30 + days31to60 + days61to90 + days91Plus;

    // Group aging data by payer if requested
    const agingByPayer: any[] = []; // TODO: Implement payer grouping logic
    // Group aging data by program if requested
    const agingByProgram: any[] = []; // TODO: Implement program grouping logic

    // Return the complete aging report with all calculated values
    const agingReport: AccountsReceivableAging = {
      asOfDate: asOfDateString,
      totalOutstanding: totalOutstanding,
      current: current,
      days1to30: days1to30,
      days31to60: days31to60,
      days61to90: days61to90,
      days91Plus: days91Plus,
      agingByPayer: agingByPayer,
      agingByProgram: agingByProgram
    };

    // Log aging report generation
    logger.info('Generated accounts receivable aging report', { asOfDate, payerId, programId });

    return agingReport;
  }

  /**
   * Gets a list of outstanding claims that need follow-up
   * @param minAge - Minimum age of the claim in days
   * @param payerId - Optional payer ID to filter the claims
   * @param programId - Optional program ID to filter the claims
   * @param options - Repository options
   * @returns List of outstanding claims with details
   */
  async getOutstandingClaims(
    minAge: number,
    payerId: UUID | null,
    programId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<Array<{ claimId: UUID; claimNumber: string; clientName: string; payerName: string; serviceDate: ISO8601Date; amount: Money; age: number; status: ClaimStatus }>> {
    // Prepare query conditions for outstanding claims
    const conditions: any = {};

    // Set status filter to include SUBMITTED, ACKNOWLEDGED, and PENDING statuses
    conditions.claimStatus = [ClaimStatus.SUBMITTED, ClaimStatus.ACKNOWLEDGED, ClaimStatus.PENDING];

    // If payerId provided, add payer filter
    if (payerId) {
      conditions.payerId = payerId;
    }

    // If programId provided, add program filter
    if (programId) {
      conditions.programId = programId;
    }

    // Get claims using claimRepository.findWithAdvancedQuery
    const claims = await claimRepository.findWithAdvancedQuery({
      pagination: { page: 1, limit: 100 }, // Limit to 100 outstanding claims
      filter: { conditions: [conditions], logicalOperator: 'AND' }
    }, options);

    // For each claim, calculate age in days
    const outstandingClaims = claims.data.map(claim => {
      const claimModel = new ClaimModel(claim);
      const age = claimModel.getClaimAge();
      return {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        clientName: claimModel.client ? `${claimModel.client.lastName}, ${claimModel.client.firstName}` : 'Unknown Client',
        payerName: claimModel.payer ? claimModel.payer.name : 'Unknown Payer',
        serviceDate: claim.serviceStartDate,
        amount: claim.totalAmount,
        age: age,
        status: claim.claimStatus
      };
    });

    // Filter claims by minimum age threshold
    const filteredClaims = outstandingClaims.filter(claim => claim.age >= minAge);

    // Sort claims by age in descending order (oldest first)
    const sortedClaims = filteredClaims.sort((a, b) => b.age - a.age);

    // Return the list of outstanding claims
    logger.info(`Retrieved ${sortedClaims.length} outstanding claims with minAge ${minAge}`, { payerId, programId });
    return sortedClaims;
  }

  /**
   * Gets a list of unreconciled payments that need attention
   * @param minAge - Minimum age of the payment in days
   * @param payerId - Optional payer ID to filter the payments
   * @param options - Repository options
   * @returns List of unreconciled payments with details
   */
  async getUnreconciledPayments(
    minAge: number,
    payerId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<Array<{ paymentId: UUID; referenceNumber: string | null; payerName: string; paymentDate: ISO8601Date; amount: Money; age: number; status: ReconciliationStatus }>> {
    // Prepare query conditions for unreconciled payments
    const conditions: any = {};

    // Set reconciliation status filter to include UNRECONCILED and PARTIALLY_RECONCILED statuses
    conditions.reconciliationStatus = [ReconciliationStatus.UNRECONCILED, ReconciliationStatus.PARTIALLY_RECONCILED];

    // If payerId provided, add payer filter
    if (payerId) {
      conditions.payerId = payerId;
    }

    // Get payments using paymentRepository.findByReconciliationStatus
    const payments = await paymentRepository.findAllWithRelations({
      pagination: { page: 1, limit: 100 }, // Limit to 100 unreconciled payments
      filter: { conditions: [conditions], logicalOperator: 'AND' }
    }, options);

    // For each payment, calculate age in days
    const unreconciledPayments = payments.data.map(payment => {
      const paymentModel = new PaymentModel(payment);
      const age = paymentModel.getPaymentAge();
      return {
        paymentId: payment.id,
        referenceNumber: payment.referenceNumber,
        payerName: payment.payer.name,
        paymentDate: payment.paymentDate,
        amount: payment.paymentAmount,
        age: age,
        status: payment.reconciliationStatus
      };
    });

    // Filter payments by minimum age threshold
    const filteredPayments = unreconciledPayments.filter(payment => payment.age >= minAge);

    // Sort payments by age in descending order (oldest first)
    const sortedPayments = filteredPayments.sort((a, b) => b.age - a.age);

    // Return the list of unreconciled payments
    logger.info(`Retrieved ${sortedPayments.length} unreconciled payments with minAge ${minAge}`, { payerId });
    return sortedPayments;
  }

  /**
   * Calculates the average days sales outstanding (DSO) for a specified period
   * @param startDate - Start date of the period (ISO8601Date)
   * @param endDate - End date of the period (ISO8601Date)
   * @param payerId - Optional payer ID to filter the calculation
   * @param options - Repository options
   * @returns DSO calculation with supporting metrics
   */
  async getDaysOutstanding(
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    payerId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ dso: number; totalRevenue: Money; averageAR: Money; details: Array<{ period: string; dso: number; revenue: Money; ar: Money }> }> {
    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BusinessError('Start date must be before end date', null, 'date.invalidRange');
    }

    // Get total revenue for the period from paid claims
    const totalRevenue: Money = 0; // TODO: Implement revenue calculation

    // Get average accounts receivable for the period
    const averageAR: Money = 0; // TODO: Implement AR calculation

    // Calculate DSO using formula: (Average AR / Total Revenue) * Number of days in period
    let dso = 0;
    if (totalRevenue > 0) {
      const daysInPeriod = calculateDateDifference(startDate, endDate, 'days');
      dso = (averageAR / totalRevenue) * daysInPeriod;
    }

    // Calculate monthly or quarterly breakdown if period is long enough
    const details: Array<{ period: string; dso: number; revenue: Money; ar: Money }> = []; // TODO: Implement period breakdown

    // Return DSO with supporting metrics and period breakdown
    logger.info(`Calculated DSO for period ${startDate} to ${endDate}`, { payerId, dso, totalRevenue, averageAR });
    return { dso, totalRevenue, averageAR, details };
  }

  /**
   * Calculates the collection rate (percentage of billed amount collected) for a period
   * @param startDate - Start date of the period (ISO8601Date)
   * @param endDate - End date of the period (ISO8601Date)
   * @param payerId - Optional payer ID to filter the calculation
   * @param options - Repository options
   * @returns Collection rate with supporting metrics
   */
  async getCollectionRate(
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    payerId: UUID | null,
    options: RepositoryOptions = {}
  ): Promise<{ collectionRate: number; billedAmount: Money; collectedAmount: Money; details: Array<{ period: string; rate: number; billed: Money; collected: Money }> }> {
    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BusinessError('Start date must be before end date', null, 'date.invalidRange');
    }

    // Get total billed amount for claims submitted in the period
    const billedAmount: Money = 0; // TODO: Implement billed amount calculation

    // Get total collected amount for those claims
    const collectedAmount: Money = 0; // TODO: Implement collected amount calculation

    // Calculate collection rate as (Collected Amount / Billed Amount) * 100
    let collectionRate = 0;
    if (billedAmount > 0) {
      collectionRate = (collectedAmount / billedAmount) * 100;
    }

    // Calculate monthly or quarterly breakdown if period is long enough
    const details: Array<{ period: string; rate: number; billed: Money; collected: Money }> = []; // TODO: Implement period breakdown

    // Return collection rate with supporting metrics and period breakdown
    logger.info(`Calculated collection rate for period ${startDate} to ${endDate}`, { payerId, collectionRate, billedAmount, collectedAmount });
    return { collectionRate, billedAmount, collectedAmount, details };
  }

  /**
   * Analyzes payer performance metrics including payment time, denial rate, and collection rate
   * @param startDate - Start date of the period (ISO8601Date)
   * @param endDate - End date of the period (ISO8601Date)
   * @param options - Repository options
   * @returns Payer performance metrics
   */
  async getPayerPerformance(
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    options: RepositoryOptions = {}
  ): Promise<Array<{ payerId: UUID; payerName: string; averagePaymentTime: number; denialRate: number; collectionRate: number; totalBilled: Money; totalCollected: Money }>> {
    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BusinessError('Start date must be before end date', null, 'date.invalidRange');
    }

    // Get list of all payers with claims in the period
    const payers: any[] = []; // TODO: Implement payer retrieval

    // For each payer, calculate average payment time (days from submission to payment)
    // For each payer, calculate denial rate (denied claims / total claims)
    // For each payer, calculate collection rate (collected amount / billed amount)
    // For each payer, calculate total billed and collected amounts
    const payerPerformance: any[] = []; // TODO: Implement payer performance calculation

    // Return array of payer performance metrics
    logger.info(`Analyzed payer performance for period ${startDate} to ${endDate}`);
    return payerPerformance;
  }

  /**
   * Analyzes program performance metrics including payment time, denial rate, and collection rate
   * @param startDate - Start date of the period (ISO8601Date)
   * @param endDate - End date of the period (ISO8601Date)
   * @param options - Repository options
   * @returns Program performance metrics
   */
  async getProgramPerformance(
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    options: RepositoryOptions = {}
  ): Promise<Array<{ programId: UUID; programName: string; averagePaymentTime: number; denialRate: number; collectionRate: number; totalBilled: Money; totalCollected: Money }>> {
    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BusinessError('Start date must be before end date', null, 'date.invalidRange');
    }

    // Get list of all programs with claims in the period
    const programs: any[] = []; // TODO: Implement program retrieval

    // For each program, calculate average payment time (days from submission to payment)
    // For each program, calculate denial rate (denied claims / total claims)
    // For each program, calculate collection rate (collected amount / billed amount)
    // For each program, calculate total billed and collected amounts
    const programPerformance: any[] = []; // TODO: Implement program performance calculation

    // Return array of program performance metrics
    logger.info(`Analyzed program performance for period ${startDate} to ${endDate}`);
    return programPerformance;
  }

  /**
   * Generates a prioritized list of claims for collection follow-up
   * @param options - Repository options
   * @returns Prioritized collection work list
   */
  async generateCollectionWorkList(
    options: RepositoryOptions = {}
  ): Promise<Array<{ claimId: UUID; claimNumber: string; clientName: string; payerName: string; amount: Money; age: number; priority: 'high' | 'medium' | 'low'; followUpAction: string }>> {
    // Get outstanding claims with getOutstandingClaims
    const outstandingClaims = await this.getOutstandingClaims(90, null, null, options);

    // Calculate priority based on age, amount, and payer history
    const workList = outstandingClaims.map(claim => {
      let priority: 'high' | 'medium' | 'low' = 'low';
      let followUpAction = 'Review claim status';

      // Assign high priority to claims over 90 days or large amounts
      if (claim.age > 90 || claim.amount > 5000) {
        priority = 'high';
        followUpAction = 'Contact payer for status';
      }
      // Assign medium priority to claims 60-90 days or medium amounts
      else if (claim.age > 60 || claim.amount > 1000) {
        priority = 'medium';
        followUpAction = 'Check claim submission';
      }

      return {
        claimId: claim.claimId,
        claimNumber: claim.claimNumber,
        clientName: claim.clientName,
        payerName: claim.payerName,
        amount: claim.amount,
        age: claim.age,
        priority: priority,
        followUpAction: followUpAction
      };
    });

    // Sort work list by priority (high to low) and then by age (oldest first)
    const sortedWorkList = workList.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      if (a.priority === 'medium' && b.priority !== 'medium') return -1;
      if (a.priority !== 'medium' && b.priority === 'medium') return 1;
      return b.age - a.age;
    });

    // Return the prioritized collection work list
    logger.info(`Generated collection work list with ${sortedWorkList.length} items`);
    return sortedWorkList;
  }

  /**
   * Gets the payment history for a specific claim
   * @param claimId - Claim ID
   * @param options - Repository options
   * @returns Payment history for the claim
   */
  async getClaimPaymentHistory(
    claimId: UUID,
    options: RepositoryOptions = {}
  ): Promise<Array<{ paymentId: UUID; paymentDate: ISO8601Date; amount: Money; adjustments: Array<{ type: string; code: string; amount: Money }>; status: ReconciliationStatus }>> {
    // Get claim using ClaimModel.findById
    const claim = await ClaimModel.findById(claimId);

    // If claim not found, throw NotFoundError
    if (!claim) {
      throw new NotFoundError('Claim not found', 'Claim', claimId);
    }

    // Find all claim payments associated with the claim
    const claimPayments = await paymentRepository.getClaimPayments(claimId, options);

    // Transform payment data into simplified result objects
    const paymentHistory = claimPayments.map(claimPayment => ({
      paymentId: claimPayment.paymentId,
      paymentDate: claimPayment.claim.submissionDate,
      amount: claimPayment.paidAmount,
      adjustments: claimPayment.adjustments.map(adjustment => ({
        type: adjustment.adjustmentType,
        code: adjustment.adjustmentCode,
        amount: adjustment.adjustmentAmount
      })),
      status: claimPayment.status
    }));

    // Sort payments by date (newest first)
    paymentHistory.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Return the payment history for the claim
    logger.info(`Retrieved payment history for claim ${claimId}`);
    return paymentHistory;
  }

  /**
   * Gets the claim history for a specific payer with payment statistics
   * @param payerId - Payer ID
   * @param startDate - Start date of the period (ISO8601Date)
   * @param endDate - End date of the period (ISO8601Date)
   * @param options - Repository options
   * @returns Payer claim history with statistics
   */
  async getPayerClaimHistory(
    payerId: UUID,
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    options: RepositoryOptions = {}
  ): Promise<{ averagePaymentTime: number; denialRate: number; collectionRate: number; claims: Array<{ claimId: UUID; claimNumber: string; serviceDate: ISO8601Date; submissionDate: ISO8601Date | null; amount: Money; status: ClaimStatus; paymentDate: ISO8601Date | null; paidAmount: Money | null; adjustments: Money | null }> }> {
    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BusinessError('Start date must be before end date', null, 'date.invalidRange');
    }

    // Get claims for the payer in the date range
    const claims = await claimRepository.findWithAdvancedQuery({
      pagination: { page: 1, limit: 100 }, // Limit to 100 claims
      payerId: payerId,
      dateRange: { startDate, endDate }
    }, options);

    // Calculate average payment time for paid claims
    let totalPaymentTime = 0;
    let paidClaimCount = 0;
    claims.data.forEach(claim => {
      if (claim.submissionDate && claim.claimStatus === ClaimStatus.PAID) {
        const submissionDate = new Date(claim.submissionDate).getTime();
        const adjudicationDate = new Date(claim.adjudicationDate).getTime();
        totalPaymentTime += (adjudicationDate - submissionDate) / (1000 * 60 * 60 * 24);
        paidClaimCount++;
      }
    });
    const averagePaymentTime = paidClaimCount > 0 ? totalPaymentTime / paidClaimCount : 0;

    // Calculate denial rate (denied claims / total claims)
    let deniedClaimCount = 0;
    claims.data.forEach(claim => {
      if (claim.claimStatus === ClaimStatus.DENIED) {
        deniedClaimCount++;
      }
    });
    const denialRate = claims.total > 0 ? (deniedClaimCount / claims.total) * 100 : 0;

    // Calculate collection rate (collected amount / billed amount)
    let totalBilled = 0;
    let totalCollected = 0;
    claims.data.forEach(claim => {
      totalBilled += claim.totalAmount;
      if (claim.claimStatus === ClaimStatus.PAID) {
        totalCollected += claim.totalAmount; // Assuming full payment for simplicity
      }
    });
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // Transform claims into simplified result objects with payment details
    const claimHistory = claims.data.map(claim => ({
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      serviceDate: claim.serviceStartDate,
      submissionDate: claim.submissionDate,
      amount: claim.totalAmount,
      status: claim.claimStatus,
      paymentDate: claim.adjudicationDate,
      paidAmount: claim.totalAmount, // Assuming full payment for simplicity
      adjustments: 0 // TODO: Implement adjustment retrieval
    }));

    // Sort claims by submission date (newest first)
    claimHistory.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

    // Return the payer claim history with statistics
    logger.info(`Retrieved payer claim history for payer ${payerId} from ${startDate} to ${endDate}`);
    return {
      averagePaymentTime,
      denialRate,
      collectionRate,
      claims: claimHistory
    };
  }
}

// Create a singleton instance of the AccountsReceivableService
const accountsReceivableService = new AccountsReceivableService();

// Export the service instance for use throughout the application
export { AccountsReceivableService, accountsReceivableService };