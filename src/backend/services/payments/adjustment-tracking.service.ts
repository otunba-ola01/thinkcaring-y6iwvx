import { UUID, Money, DateRange, RepositoryOptions } from '../../types/common.types';
import { 
    PaymentAdjustment, 
    AdjustmentType, 
    ClaimPayment 
} from '../../types/payments.types';
import { paymentRepository } from '../../database/repositories/payment.repository';
import { db } from '../../database/connection';
import { NotFoundError } from '../../errors/not-found-error';
import { ValidationError } from '../../errors/validation-error';
import { logger } from '../../utils/logger';

/**
 * Service for tracking, analyzing, and managing payment adjustments
 * 
 * This service provides functionality to add, retrieve, and analyze payment adjustments,
 * helping providers understand denial reasons and financial impacts of adjustments.
 */
class AdjustmentTrackingService {
    /**
     * Creates a new adjustment tracking service instance
     */
    constructor() {
        logger.debug('AdjustmentTrackingService initialized');
    }

    /**
     * Adds a payment adjustment to a claim payment
     * 
     * @param claimPaymentId ID of the claim payment to add adjustment to
     * @param adjustmentData Adjustment data to add
     * @param options Repository options
     * @returns The created payment adjustment
     */
    async addAdjustment(
        claimPaymentId: UUID,
        adjustmentData: PaymentAdjustment,
        options: RepositoryOptions = {}
    ): Promise<PaymentAdjustment> {
        try {
            // Validate adjustment data
            this.validateAdjustmentData(adjustmentData);

            // Use existing transaction or create new one
            const trx = options.transaction || await db.getTransaction();
            const useInternalTrx = !options.transaction;

            try {
                // Add adjustment using repository
                const adjustment = await paymentRepository.addPaymentAdjustment(
                    claimPaymentId,
                    adjustmentData,
                    { 
                        ...options, 
                        transaction: trx 
                    }
                );

                // Commit transaction if we started it
                if (useInternalTrx) {
                    await trx.commit();
                }

                logger.info(`Added adjustment of ${adjustmentData.adjustmentAmount} to claim payment ${claimPaymentId}`, {
                    adjustmentType: adjustmentData.adjustmentType,
                    adjustmentCode: adjustmentData.adjustmentCode
                });

                return adjustment;
            } catch (error) {
                // Rollback transaction if we started it
                if (useInternalTrx) {
                    await trx.rollback();
                }
                throw error;
            }
        } catch (error) {
            logger.error(`Error adding adjustment to claim payment ${claimPaymentId}`, { error });
            throw error;
        }
    }

    /**
     * Retrieves all adjustments associated with a payment
     * 
     * @param paymentId ID of the payment
     * @param options Repository options
     * @returns Array of payment adjustments with claim IDs
     */
    async getAdjustmentsForPayment(
        paymentId: UUID,
        options: RepositoryOptions = {}
    ): Promise<Array<PaymentAdjustment & { claimId: UUID }>> {
        try {
            logger.debug(`Getting adjustments for payment: ${paymentId}`);
            
            // Get claim payments for this payment
            const claimPayments = await paymentRepository.getClaimPayments(paymentId, options);
            
            if (!claimPayments || claimPayments.length === 0) {
                logger.debug(`No claim payments found for payment ${paymentId}`);
                return [];
            }
            
            // Collect all adjustments from all claim payments
            const adjustments: Array<PaymentAdjustment & { claimId: UUID }> = [];
            
            for (const claimPayment of claimPayments) {
                const claimAdjustments = claimPayment.adjustments.map(adj => ({
                    ...adj,
                    claimId: claimPayment.claimId
                }));
                
                adjustments.push(...claimAdjustments);
            }
            
            return adjustments;
        } catch (error) {
            logger.error(`Error retrieving adjustments for payment ${paymentId}`, { error });
            throw error;
        }
    }

    /**
     * Retrieves all adjustments associated with a claim across all payments
     * 
     * @param claimId ID of the claim
     * @param options Repository options
     * @returns Array of payment adjustments with payment IDs
     */
    async getAdjustmentsForClaim(
        claimId: UUID,
        options: RepositoryOptions = {}
    ): Promise<Array<PaymentAdjustment & { paymentId: UUID }>> {
        try {
            logger.debug(`Getting adjustments for claim: ${claimId}`);
            
            // Query database for claim payments associated with this claim
            const knex = options.transaction || db.query;
            const claimPayments = await knex('claim_payments')
                .where('claim_id', claimId)
                .whereNull('deleted_at');
            
            if (!claimPayments || claimPayments.length === 0) {
                logger.debug(`No claim payments found for claim ${claimId}`);
                return [];
            }
            
            // Collect all adjustments from all claim payments
            const adjustments: Array<PaymentAdjustment & { paymentId: UUID }> = [];
            
            for (const claimPayment of claimPayments) {
                // Get the adjustments for this claim payment
                const paymentAdjustments = await knex('payment_adjustments')
                    .where('claim_payment_id', claimPayment.id)
                    .whereNull('deleted_at');
                
                // Add payment ID to each adjustment
                const claimAdjustments = paymentAdjustments.map(adj => ({
                    id: adj.id,
                    claimPaymentId: adj.claim_payment_id,
                    adjustmentType: adj.adjustment_type,
                    adjustmentCode: adj.adjustment_code,
                    adjustmentAmount: adj.adjustment_amount,
                    description: adj.description,
                    status: adj.status,
                    createdAt: adj.created_at,
                    updatedAt: adj.updated_at,
                    paymentId: claimPayment.payment_id
                }));
                
                adjustments.push(...claimAdjustments);
            }
            
            return adjustments;
        } catch (error) {
            logger.error(`Error retrieving adjustments for claim ${claimId}`, { error });
            throw error;
        }
    }

    /**
     * Analyzes adjustment trends over time and by payer
     * 
     * @param filters Filters for adjustments to analyze
     * @param options Repository options
     * @returns Adjustment trends analysis by period and payer
     */
    async getAdjustmentTrends(
        filters: {
            dateRange?: DateRange;
            payerId?: UUID;
            adjustmentType?: AdjustmentType;
        },
        options: RepositoryOptions = {}
    ): Promise<{
        byPeriod: Array<{
            period: string;
            adjustmentType: AdjustmentType;
            count: number;
            amount: Money;
        }>;
        byPayer: Array<{
            payerId: UUID;
            payerName: string;
            adjustmentType: AdjustmentType;
            count: number;
            amount: Money;
        }>;
    }> {
        try {
            logger.debug('Analyzing adjustment trends', { filters });
            
            const { dateRange, payerId, adjustmentType } = filters;
            
            // Build query to get adjustment data with payment and payer information
            const knex = options.transaction || db.query;
            let query = knex('payment_adjustments AS pa')
                .join('claim_payments AS cp', 'pa.claim_payment_id', 'cp.id')
                .join('payments AS p', 'cp.payment_id', 'p.id')
                .join('payers AS pyr', 'p.payer_id', 'pyr.id')
                .join('claims AS c', 'cp.claim_id', 'c.id')
                .whereNull('pa.deleted_at')
                .whereNull('cp.deleted_at')
                .whereNull('p.deleted_at')
                .select(
                    'pa.id',
                    'pa.adjustment_type',
                    'pa.adjustment_code',
                    'pa.adjustment_amount',
                    'pa.created_at',
                    'p.payer_id',
                    'pyr.name as payer_name',
                    'c.id as claim_id'
                );
            
            // Apply filters
            if (dateRange) {
                query = query.whereBetween('p.payment_date', [dateRange.startDate, dateRange.endDate]);
            }
            
            if (payerId) {
                query = query.where('p.payer_id', payerId);
            }
            
            if (adjustmentType) {
                query = query.where('pa.adjustment_type', adjustmentType);
            }
            
            // Execute query
            const adjustments = await query;
            
            // Process trends by period (month)
            const byPeriodMap = new Map<string, Map<AdjustmentType, { count: number; amount: Money }>>();
            
            // Process trends by payer
            const byPayerMap = new Map<UUID, Map<AdjustmentType, { payerName: string; count: number; amount: Money }>>();
            
            // Process each adjustment
            for (const adj of adjustments) {
                const date = new Date(adj.created_at);
                const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const adjType = adj.adjustment_type as AdjustmentType;
                
                // Add to period trends
                if (!byPeriodMap.has(period)) {
                    byPeriodMap.set(period, new Map<AdjustmentType, { count: number; amount: Money }>());
                }
                
                const periodTypeMap = byPeriodMap.get(period)!;
                if (!periodTypeMap.has(adjType)) {
                    periodTypeMap.set(adjType, { count: 0, amount: 0 });
                }
                
                const periodTypeData = periodTypeMap.get(adjType)!;
                periodTypeData.count += 1;
                periodTypeData.amount += adj.adjustment_amount;
                
                // Add to payer trends
                if (!byPayerMap.has(adj.payer_id)) {
                    byPayerMap.set(adj.payer_id, new Map<AdjustmentType, { payerName: string; count: number; amount: Money }>());
                }
                
                const payerTypeMap = byPayerMap.get(adj.payer_id)!;
                if (!payerTypeMap.has(adjType)) {
                    payerTypeMap.set(adjType, { payerName: adj.payer_name, count: 0, amount: 0 });
                }
                
                const payerTypeData = payerTypeMap.get(adjType)!;
                payerTypeData.count += 1;
                payerTypeData.amount += adj.adjustment_amount;
            }
            
            // Convert maps to arrays for response
            const byPeriod: Array<{
                period: string;
                adjustmentType: AdjustmentType;
                count: number;
                amount: Money;
            }> = [];
            
            byPeriodMap.forEach((typeMap, period) => {
                typeMap.forEach((data, adjustmentType) => {
                    byPeriod.push({
                        period,
                        adjustmentType,
                        count: data.count,
                        amount: data.amount
                    });
                });
            });
            
            const byPayer: Array<{
                payerId: UUID;
                payerName: string;
                adjustmentType: AdjustmentType;
                count: number;
                amount: Money;
            }> = [];
            
            byPayerMap.forEach((typeMap, payerId) => {
                typeMap.forEach((data, adjustmentType) => {
                    byPayer.push({
                        payerId,
                        payerName: data.payerName,
                        adjustmentType,
                        count: data.count,
                        amount: data.amount
                    });
                });
            });
            
            // Sort by period/payer and then by amount
            byPeriod.sort((a, b) => a.period.localeCompare(b.period) || b.amount - a.amount);
            byPayer.sort((a, b) => a.payerName.localeCompare(b.payerName) || b.amount - a.amount);
            
            return { byPeriod, byPayer };
        } catch (error) {
            logger.error('Error analyzing adjustment trends', { error, filters });
            throw error;
        }
    }

    /**
     * Identifies the most common adjustment reasons by frequency and amount
     * 
     * @param filters Filters for adjustments to analyze
     * @param limit Maximum number of results to return
     * @param options Repository options
     * @returns Top adjustment reasons
     */
    async getTopAdjustmentReasons(
        filters: {
            dateRange?: DateRange;
            payerId?: UUID;
            adjustmentType?: AdjustmentType;
        },
        limit: number = 10,
        options: RepositoryOptions = {}
    ): Promise<Array<{
        code: string;
        description: string;
        type: AdjustmentType;
        count: number;
        amount: Money;
    }>> {
        try {
            logger.debug('Getting top adjustment reasons', { filters, limit });
            
            const { dateRange, payerId, adjustmentType } = filters;
            
            // Build query to get adjustment data with grouping by code
            const knex = options.transaction || db.query;
            let query = knex('payment_adjustments AS pa')
                .join('claim_payments AS cp', 'pa.claim_payment_id', 'cp.id')
                .join('payments AS p', 'cp.payment_id', 'p.id')
                .whereNull('pa.deleted_at')
                .whereNull('cp.deleted_at')
                .whereNull('p.deleted_at')
                .select(
                    'pa.adjustment_code as code',
                    'pa.adjustment_type as type',
                    knex.raw('COALESCE(MAX(pa.description), \'\') as description'),
                    knex.raw('COUNT(*) as count'),
                    knex.raw('SUM(pa.adjustment_amount) as amount')
                )
                .groupBy('pa.adjustment_code', 'pa.adjustment_type')
                .orderBy('count', 'desc')
                .limit(limit);
            
            // Apply filters
            if (dateRange) {
                query = query.whereBetween('p.payment_date', [dateRange.startDate, dateRange.endDate]);
            }
            
            if (payerId) {
                query = query.where('p.payer_id', payerId);
            }
            
            if (adjustmentType) {
                query = query.where('pa.adjustment_type', adjustmentType);
            }
            
            // Execute query
            const results = await query;
            
            // Format results
            return results.map(r => ({
                code: r.code,
                description: r.description,
                type: r.type as AdjustmentType,
                count: parseInt(r.count, 10),
                amount: parseFloat(r.amount)
            }));
        } catch (error) {
            logger.error('Error getting top adjustment reasons', { error, filters });
            throw error;
        }
    }

    /**
     * Categorizes adjustments by type and provides summary statistics
     * 
     * @param adjustments Array of payment adjustments to categorize
     * @returns Categorized adjustments with statistics
     */
    categorizeAdjustments(adjustments: PaymentAdjustment[]): {
        byType: Record<AdjustmentType, { count: number; amount: Money }>;
        total: { count: number; amount: Money };
    } {
        logger.debug(`Categorizing ${adjustments.length} adjustments`);
        
        // Initialize result object with categories for each adjustment type
        const result: {
            byType: Record<AdjustmentType, { count: number; amount: Money }>;
            total: { count: number; amount: Money };
        } = {
            byType: {
                [AdjustmentType.CONTRACTUAL]: { count: 0, amount: 0 },
                [AdjustmentType.DEDUCTIBLE]: { count: 0, amount: 0 },
                [AdjustmentType.COINSURANCE]: { count: 0, amount: 0 },
                [AdjustmentType.COPAY]: { count: 0, amount: 0 },
                [AdjustmentType.NONCOVERED]: { count: 0, amount: 0 },
                [AdjustmentType.TRANSFER]: { count: 0, amount: 0 },
                [AdjustmentType.OTHER]: { count: 0, amount: 0 },
            },
            total: { count: 0, amount: 0 }
        };
        
        // Process each adjustment
        for (const adj of adjustments) {
            // Increment type-specific counters
            result.byType[adj.adjustmentType].count += 1;
            result.byType[adj.adjustmentType].amount += adj.adjustmentAmount;
            
            // Increment total counters
            result.total.count += 1;
            result.total.amount += adj.adjustmentAmount;
        }
        
        return result;
    }

    /**
     * Calculates the financial impact of adjustments on revenue
     * 
     * @param dateRange Date range for analysis
     * @param options Repository options
     * @returns Financial impact analysis
     */
    async getAdjustmentImpact(
        dateRange: DateRange,
        options: RepositoryOptions = {}
    ): Promise<{
        totalBilled: Money;
        totalPaid: Money;
        totalAdjusted: Money;
        adjustmentRate: number;
        impactByType: Record<AdjustmentType, Money>;
    }> {
        try {
            logger.debug('Calculating adjustment financial impact', { dateRange });
            
            const knex = options.transaction || db.query;
            
            // Get total billed amount from claims in date range
            const billedResult = await knex('claims')
                .whereNull('deleted_at')
                .whereBetween('service_start_date', [dateRange.startDate, dateRange.endDate])
                .sum('total_amount as totalBilled')
                .first();
            
            const totalBilled = parseFloat(billedResult.totalBilled) || 0;
            
            // Get total paid amount from payments in date range
            const paidResult = await knex('payments')
                .whereNull('deleted_at')
                .whereBetween('payment_date', [dateRange.startDate, dateRange.endDate])
                .sum('payment_amount as totalPaid')
                .first();
            
            const totalPaid = parseFloat(paidResult.totalPaid) || 0;
            
            // Get adjustment totals by type
            const adjustmentResults = await knex('payment_adjustments AS pa')
                .join('claim_payments AS cp', 'pa.claim_payment_id', 'cp.id')
                .join('payments AS p', 'cp.payment_id', 'p.id')
                .whereNull('pa.deleted_at')
                .whereNull('cp.deleted_at')
                .whereNull('p.deleted_at')
                .whereBetween('p.payment_date', [dateRange.startDate, dateRange.endDate])
                .select(
                    'pa.adjustment_type as type',
                    knex.raw('SUM(pa.adjustment_amount) as amount')
                )
                .groupBy('pa.adjustment_type');
            
            // Initialize impact by type with all adjustment types
            const impactByType: Record<AdjustmentType, Money> = {
                [AdjustmentType.CONTRACTUAL]: 0,
                [AdjustmentType.DEDUCTIBLE]: 0,
                [AdjustmentType.COINSURANCE]: 0,
                [AdjustmentType.COPAY]: 0,
                [AdjustmentType.NONCOVERED]: 0,
                [AdjustmentType.TRANSFER]: 0,
                [AdjustmentType.OTHER]: 0,
            };
            
            // Fill in adjustment amounts by type
            let totalAdjusted = 0;
            for (const adj of adjustmentResults) {
                const amount = parseFloat(adj.amount) || 0;
                impactByType[adj.type as AdjustmentType] = amount;
                totalAdjusted += amount;
            }
            
            // Calculate adjustment rate (total adjusted / total billed)
            const adjustmentRate = totalBilled > 0 ? (totalAdjusted / totalBilled) : 0;
            
            return {
                totalBilled,
                totalPaid,
                totalAdjusted,
                adjustmentRate,
                impactByType
            };
        } catch (error) {
            logger.error('Error calculating adjustment financial impact', { error, dateRange });
            throw error;
        }
    }

    /**
     * Analyzes claim denials based on adjustment codes
     * 
     * @param filters Filters for denials to analyze
     * @param options Repository options
     * @returns Denial analysis results
     */
    async getDenialAnalysis(
        filters: {
            dateRange?: DateRange;
            payerId?: UUID;
        },
        options: RepositoryOptions = {}
    ): Promise<{
        denialRate: number;
        totalDenied: Money;
        denialsByReason: Array<{
            code: string;
            description: string;
            count: number;
            amount: Money;
        }>;
        denialsByPayer: Array<{
            payerId: UUID;
            payerName: string;
            count: number;
            amount: Money;
        }>;
    }> {
        try {
            logger.debug('Analyzing claim denials', { filters });
            
            const { dateRange, payerId } = filters;
            
            const knex = options.transaction || db.query;
            
            // Get denial adjustments (NONCOVERED type)
            let query = knex('payment_adjustments AS pa')
                .join('claim_payments AS cp', 'pa.claim_payment_id', 'cp.id')
                .join('payments AS p', 'cp.payment_id', 'p.id')
                .join('payers AS pyr', 'p.payer_id', 'pyr.id')
                .join('claims AS c', 'cp.claim_id', 'c.id')
                .whereNull('pa.deleted_at')
                .whereNull('cp.deleted_at')
                .whereNull('p.deleted_at')
                .where('pa.adjustment_type', AdjustmentType.NONCOVERED);
            
            // Apply filters
            if (dateRange) {
                query = query.whereBetween('p.payment_date', [dateRange.startDate, dateRange.endDate]);
            }
            
            if (payerId) {
                query = query.where('p.payer_id', payerId);
            }
            
            // Get total claims for denial rate calculation
            let claimQuery = knex('claims AS c')
                .whereNull('c.deleted_at');
                
            if (dateRange) {
                claimQuery = claimQuery.whereBetween('c.service_start_date', [dateRange.startDate, dateRange.endDate]);
            }
            
            if (payerId) {
                claimQuery = claimQuery.where('c.payer_id', payerId);
            }
            
            // Get denials by reason (code)
            const denialsByReasonQuery = query.clone()
                .select(
                    'pa.adjustment_code as code',
                    knex.raw('COALESCE(MAX(pa.description), \'\') as description'),
                    knex.raw('COUNT(DISTINCT c.id) as count'),
                    knex.raw('SUM(pa.adjustment_amount) as amount')
                )
                .groupBy('pa.adjustment_code')
                .orderBy('count', 'desc');
            
            // Get denials by payer
            const denialsByPayerQuery = query.clone()
                .select(
                    'p.payer_id as payerId',
                    'pyr.name as payerName',
                    knex.raw('COUNT(DISTINCT c.id) as count'),
                    knex.raw('SUM(pa.adjustment_amount) as amount')
                )
                .groupBy('p.payer_id', 'pyr.name')
                .orderBy('count', 'desc');
            
            // Get total denied amount
            const totalDeniedQuery = query.clone()
                .sum('pa.adjustment_amount as totalDenied')
                .first();
            
            // Get total claim count
            const totalClaimsQuery = claimQuery.count('* as totalClaims').first();
            
            // Execute all queries in parallel
            const [
                denialsByReason,
                denialsByPayer,
                totalDeniedResult,
                totalClaimsResult
            ] = await Promise.all([
                denialsByReasonQuery,
                denialsByPayerQuery,
                totalDeniedQuery,
                totalClaimsQuery
            ]);
            
            // Calculate denial rate
            const totalClaims = parseInt(totalClaimsResult.totalClaims, 10);
            const totalDenied = parseFloat(totalDeniedResult.totalDenied) || 0;
            
            // Count distinct denied claims
            const distinctDeniedClaimsQuery = query.clone()
                .countDistinct('c.id as deniedCount')
                .first();
            
            const distinctDeniedClaimsResult = await distinctDeniedClaimsQuery;
            const deniedClaimCount = parseInt(distinctDeniedClaimsResult.deniedCount, 10);
            
            // Calculate denial rate
            const denialRate = totalClaims > 0 ? (deniedClaimCount / totalClaims) : 0;
            
            // Format results
            return {
                denialRate,
                totalDenied,
                denialsByReason: denialsByReason.map(r => ({
                    code: r.code,
                    description: r.description,
                    count: parseInt(r.count, 10),
                    amount: parseFloat(r.amount)
                })),
                denialsByPayer: denialsByPayer.map(r => ({
                    payerId: r.payerId,
                    payerName: r.payerName,
                    count: parseInt(r.count, 10),
                    amount: parseFloat(r.amount)
                }))
            };
        } catch (error) {
            logger.error('Error analyzing claim denials', { error, filters });
            throw error;
        }
    }

    /**
     * Validates adjustment data before creation
     * 
     * @param adjustmentData Adjustment data to validate
     * @throws ValidationError if validation fails
     */
    private validateAdjustmentData(adjustmentData: PaymentAdjustment): void {
        const errors: Array<{ field: string; message: string; value: any; code: string }> = [];
        
        // Check if adjustmentType is provided and valid
        if (!adjustmentData.adjustmentType) {
            errors.push({
                field: 'adjustmentType',
                message: 'Adjustment type is required',
                value: adjustmentData.adjustmentType,
                code: 'MISSING_REQUIRED_FIELD'
            });
        } else if (!Object.values(AdjustmentType).includes(adjustmentData.adjustmentType)) {
            errors.push({
                field: 'adjustmentType',
                message: `Invalid adjustment type: ${adjustmentData.adjustmentType}`,
                value: adjustmentData.adjustmentType,
                code: 'INVALID_FORMAT'
            });
        }
        
        // Check if adjustmentCode is provided
        if (!adjustmentData.adjustmentCode) {
            errors.push({
                field: 'adjustmentCode',
                message: 'Adjustment code is required',
                value: adjustmentData.adjustmentCode,
                code: 'MISSING_REQUIRED_FIELD'
            });
        }
        
        // Check if adjustmentAmount is provided and valid
        if (adjustmentData.adjustmentAmount === undefined || adjustmentData.adjustmentAmount === null) {
            errors.push({
                field: 'adjustmentAmount',
                message: 'Adjustment amount is required',
                value: adjustmentData.adjustmentAmount,
                code: 'MISSING_REQUIRED_FIELD'
            });
        } else if (isNaN(adjustmentData.adjustmentAmount) || adjustmentData.adjustmentAmount <= 0) {
            errors.push({
                field: 'adjustmentAmount',
                message: 'Adjustment amount must be a positive number',
                value: adjustmentData.adjustmentAmount,
                code: 'INVALID_FORMAT'
            });
        }
        
        // If any validation errors, throw ValidationError
        if (errors.length > 0) {
            const validationError = new ValidationError('Adjustment data validation failed');
            errors.forEach(error => {
                validationError.addValidationError(error);
            });
            throw validationError;
        }
    }
}

// Create singleton instance
const adjustmentTrackingService = new AdjustmentTrackingService();

// Export the service
export { AdjustmentTrackingService, adjustmentTrackingService };