import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import { 
  Transaction, 
  QueryBuilder, 
  WhereCondition, 
  OrderBy, 
  Pagination, 
  PaginatedResult, 
  RepositoryOptions 
} from '../../types/database.types';
import { 
  UUID, 
  ISO8601Date, 
  Money 
} from '../../types/common.types';
import { 
  Payment, 
  PaymentWithRelations, 
  ClaimPayment, 
  PaymentAdjustment, 
  ReconciliationStatus, 
  PaymentQueryParams, 
  RemittanceInfo 
} from '../../types/payments.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for payment database operations, extending the base repository
 */
class PaymentRepository extends BaseRepository<Payment> {
  /**
   * Creates a new PaymentRepository instance
   */
  constructor() {
    // Initialize with payments table, id as primary key, and soft delete enabled
    super('payments', 'id', true);
  }

  /**
   * Finds a payment by ID with all related entities (payer, claim payments, remittance info)
   * 
   * @param id Payment ID
   * @param options Repository options
   * @returns The payment with relations if found, null otherwise
   */
  async findByIdWithRelations(id: UUID, options: RepositoryOptions = {}): Promise<PaymentWithRelations | null> {
    try {
      logger.debug(`Finding payment by ID with relations: ${id}`);
      
      // Get a query builder for the payments table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Join the payers table to get payer information
      const payment = await queryBuilder
        .where(`${this.tableName}.id`, id)
        .join('payers', 'payments.payer_id', 'payers.id')
        .select(
          'payments.*',
          'payers.id as payer_id',
          'payers.name as payer_name',
          'payers.payer_type as payer_type',
          'payers.is_electronic as payer_is_electronic',
          'payers.status as payer_status'
        )
        .first();
      
      if (!payment) {
        return null;
      }
      
      // Transform the result to the PaymentWithRelations interface
      const paymentWithRelations: PaymentWithRelations = {
        id: payment.id,
        payerId: payment.payer_id,
        payer: {
          id: payment.payer_id,
          name: payment.payer_name,
          payerType: payment.payer_type,
          isElectronic: payment.payer_is_electronic,
          status: payment.payer_status
        },
        paymentDate: payment.payment_date,
        paymentAmount: payment.payment_amount,
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number,
        checkNumber: payment.check_number,
        remittanceId: payment.remittance_id,
        reconciliationStatus: payment.reconciliation_status,
        notes: payment.notes,
        status: payment.status,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        createdBy: payment.created_by,
        updatedBy: payment.updated_by,
        claimPayments: [],
        remittanceInfo: null
      };
      
      // Fetch claim payments for this payment
      const claimPayments = await this.getClaimPayments(id, options);
      paymentWithRelations.claimPayments = claimPayments;
      
      // Fetch remittance info if available
      const remittanceInfo = await this.getRemittanceInfo(id, options);
      paymentWithRelations.remittanceInfo = remittanceInfo;
      
      return paymentWithRelations;
    } catch (error) {
      this.handleDatabaseError(error, 'findByIdWithRelations');
    }
  }

  /**
   * Finds a payment by its reference number
   * 
   * @param referenceNumber Reference number to search for
   * @param options Repository options
   * @returns The payment if found, null otherwise
   */
  async findByReferenceNumber(referenceNumber: string, options: RepositoryOptions = {}): Promise<Payment | null> {
    try {
      logger.debug(`Finding payment by reference number: ${referenceNumber}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder
        .where('reference_number', referenceNumber)
        .first();
      
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByReferenceNumber');
    }
  }

  /**
   * Finds all payments for a specific payer with pagination
   * 
   * @param payerId Payer ID
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated payments for the payer
   */
  async findByPayerId(
    payerId: UUID, 
    pagination: Pagination = { page: 1, limit: 25 }, 
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Payment>> {
    try {
      logger.debug(`Finding payments for payer: ${payerId}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply where condition for payer ID
      const query = queryBuilder.where('payer_id', payerId);
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute query
      const payments = await sortedQuery;
      
      // Count total payments for this payer
      const countResult = await query.count({ count: '*' }).first();
      const total = parseInt(countResult.count, 10);
      
      return {
        data: payments as Payment[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByPayerId');
    }
  }

  /**
   * Finds all payments with a specific reconciliation status with pagination
   * 
   * @param status Reconciliation status or array of statuses
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated payments with the specified status
   */
  async findByReconciliationStatus(
    status: ReconciliationStatus | ReconciliationStatus[],
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Payment>> {
    try {
      logger.debug(`Finding payments by reconciliation status: ${Array.isArray(status) ? status.join(', ') : status}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      let query;
      
      // Handle array of statuses differently from single status
      if (Array.isArray(status)) {
        query = queryBuilder.whereIn('reconciliation_status', status);
      } else {
        query = queryBuilder.where('reconciliation_status', status);
      }
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute query
      const payments = await sortedQuery;
      
      // Count total payments with this status
      const countResult = await query.count({ count: '*' }).first();
      const total = parseInt(countResult.count, 10);
      
      return {
        data: payments as Payment[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByReconciliationStatus');
    }
  }

  /**
   * Finds payments with related entities based on query parameters
   * 
   * @param queryParams Query parameters for filtering, sorting, and pagination
   * @param options Repository options
   * @returns Paginated payments with relations matching the query parameters
   */
  async findAllWithRelations(
    queryParams: PaymentQueryParams,
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<PaymentWithRelations>> {
    try {
      logger.debug('Finding payments with relations', { queryParams });
      
      // Extract pagination, sort, filter, and search from query params
      const { 
        pagination = { page: 1, limit: 25 }, 
        sort = { sortBy: 'payment_date', sortDirection: 'desc' },
        filter = { conditions: [], logicalOperator: 'AND' },
        search = '',
        payerId,
        reconciliationStatus,
        paymentMethod,
        dateRange,
        includeRemittance = false
      } = queryParams;
      
      // Build order by array from sort
      const orderBy: OrderBy[] = [
        {
          column: sort.sortBy,
          direction: sort.sortDirection === 'asc' ? 'ASC' : 'DESC'
        }
      ];
      
      // Start building the query
      const knex = getKnexInstance();
      let queryBuilder = knex('payments')
        .join('payers', 'payments.payer_id', 'payers.id')
        .select(
          'payments.*',
          'payers.id as payer_id',
          'payers.name as payer_name',
          'payers.payer_type as payer_type',
          'payers.is_electronic as payer_is_electronic',
          'payers.status as payer_status'
        )
        .whereNull('payments.deleted_at');
      
      // Use transaction if provided
      if (options.transaction) {
        queryBuilder = options.transaction('payments')
          .join('payers', 'payments.payer_id', 'payers.id')
          .select(
            'payments.*',
            'payers.id as payer_id',
            'payers.name as payer_name',
            'payers.payer_type as payer_type',
            'payers.is_electronic as payer_is_electronic',
            'payers.status as payer_status'
          )
          .whereNull('payments.deleted_at');
      }
      
      // Apply payer ID filter if provided
      if (payerId) {
        queryBuilder.where('payments.payer_id', payerId);
      }
      
      // Apply reconciliation status filter if provided
      if (reconciliationStatus) {
        if (Array.isArray(reconciliationStatus)) {
          queryBuilder.whereIn('payments.reconciliation_status', reconciliationStatus);
        } else {
          queryBuilder.where('payments.reconciliation_status', reconciliationStatus);
        }
      }
      
      // Apply payment method filter if provided
      if (paymentMethod) {
        if (Array.isArray(paymentMethod)) {
          queryBuilder.whereIn('payments.payment_method', paymentMethod);
        } else {
          queryBuilder.where('payments.payment_method', paymentMethod);
        }
      }
      
      // Apply date range filter if provided
      if (dateRange) {
        queryBuilder.whereBetween('payments.payment_date', [dateRange.startDate, dateRange.endDate]);
      }
      
      // Apply search filter if provided
      if (search) {
        queryBuilder.where(function() {
          this.where('payments.reference_number', 'like', `%${search}%`)
            .orWhere('payments.check_number', 'like', `%${search}%`)
            .orWhere('payers.name', 'like', `%${search}%`);
        });
      }
      
      // Clone query for counting
      const countQuery = queryBuilder.clone().count({ count: '*' }).first();
      
      // Apply pagination and sorting
      queryBuilder.orderBy(orderBy[0].column, orderBy[0].direction)
        .limit(pagination.limit)
        .offset((pagination.page - 1) * pagination.limit);
      
      // Execute the query
      const [payments, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      // Initialize result array
      const paymentResults: PaymentWithRelations[] = [];
      
      // Fetch related data for each payment if needed
      for (const payment of payments) {
        const paymentWithRelations: PaymentWithRelations = {
          id: payment.id,
          payerId: payment.payer_id,
          payer: {
            id: payment.payer_id,
            name: payment.payer_name,
            payerType: payment.payer_type,
            isElectronic: payment.payer_is_electronic,
            status: payment.payer_status
          },
          paymentDate: payment.payment_date,
          paymentAmount: payment.payment_amount,
          paymentMethod: payment.payment_method,
          referenceNumber: payment.reference_number,
          checkNumber: payment.check_number,
          remittanceId: payment.remittance_id,
          reconciliationStatus: payment.reconciliation_status,
          notes: payment.notes,
          status: payment.status,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
          createdBy: payment.created_by,
          updatedBy: payment.updated_by,
          claimPayments: [],
          remittanceInfo: null
        };
        
        // Fetch claim payments
        const claimPayments = await this.getClaimPayments(payment.id, options);
        paymentWithRelations.claimPayments = claimPayments;
        
        // Fetch remittance info if requested
        if (includeRemittance) {
          const remittanceInfo = await this.getRemittanceInfo(payment.id, options);
          paymentWithRelations.remittanceInfo = remittanceInfo;
        }
        
        paymentResults.push(paymentWithRelations);
      }
      
      // Return paginated result
      const total = parseInt(countResult.count, 10);
      return {
        data: paymentResults,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAllWithRelations');
    }
  }

  /**
   * Gets the claim payments associated with a payment
   * 
   * @param paymentId Payment ID
   * @param options Repository options
   * @returns Array of claim payment associations
   */
  async getClaimPayments(paymentId: UUID, options: RepositoryOptions = {}): Promise<ClaimPayment[]> {
    try {
      logger.debug(`Getting claim payments for payment: ${paymentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_payments')
        .where('payment_id', paymentId)
        .whereNull('deleted_at');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_payments')
          .where('payment_id', paymentId)
          .whereNull('deleted_at');
      }
      
      // Join with claims to get claim information
      const claimPayments = await queryBuilder
        .join('claims', 'claim_payments.claim_id', 'claims.id')
        .select(
          'claim_payments.*',
          'claims.id as claim_id',
          'claims.claim_number as claim_number',
          'claims.client_id as client_id',
          'claims.total_amount as claim_total_amount',
          'claims.claim_status as claim_status'
        );
      
      // Format the results to match the ClaimPayment interface
      const formattedClaimPayments: ClaimPayment[] = claimPayments.map(cp => ({
        id: cp.id,
        paymentId: cp.payment_id,
        claimId: cp.claim_id,
        paidAmount: cp.paid_amount,
        claim: {
          id: cp.claim_id,
          claimNumber: cp.claim_number,
          clientId: cp.client_id,
          clientName: '', // Would need to be fetched with additional join
          payerId: '', // Would need to be fetched with additional join
          payerName: '', // Would need to be fetched with additional join
          claimStatus: cp.claim_status,
          totalAmount: cp.claim_total_amount,
          serviceStartDate: '', // Would need to be fetched with additional join
          serviceEndDate: '', // Would need to be fetched with additional join
          submissionDate: null, // Would need to be fetched with additional join
          claimAge: 0 // Would need to be calculated
        },
        adjustments: [], // Will be populated below
        status: cp.status,
        createdAt: cp.created_at,
        updatedAt: cp.updated_at
      }));
      
      // For each claim payment, get the payment adjustments
      for (const claimPayment of formattedClaimPayments) {
        let adjustmentQuery = knex('payment_adjustments')
          .where('claim_payment_id', claimPayment.id)
          .whereNull('deleted_at');
          
        if (options.transaction) {
          adjustmentQuery = options.transaction('payment_adjustments')
            .where('claim_payment_id', claimPayment.id)
            .whereNull('deleted_at');
        }
        
        const adjustments = await adjustmentQuery;
        
        claimPayment.adjustments = adjustments.map(adj => ({
          id: adj.id,
          claimPaymentId: adj.claim_payment_id,
          adjustmentType: adj.adjustment_type,
          adjustmentCode: adj.adjustment_code,
          adjustmentAmount: adj.adjustment_amount,
          description: adj.description,
          status: adj.status,
          createdAt: adj.created_at,
          updatedAt: adj.updated_at
        }));
      }
      
      return formattedClaimPayments;
    } catch (error) {
      this.handleDatabaseError(error, 'getClaimPayments');
    }
  }

  /**
   * Adds a claim payment association to a payment
   * 
   * @param paymentId Payment ID
   * @param claimId Claim ID
   * @param paidAmount Amount paid for this claim
   * @param options Repository options
   * @returns The created claim payment association
   */
  async addClaimPayment(
    paymentId: UUID, 
    claimId: UUID, 
    paidAmount: Money, 
    options: RepositoryOptions = {}
  ): Promise<ClaimPayment> {
    try {
      logger.debug(`Adding claim payment for payment: ${paymentId}, claim: ${claimId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_payments');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_payments');
      }
      
      // Create a new claim payment object
      const now = new Date();
      const claimPayment = {
        payment_id: paymentId,
        claim_id: claimId,
        paid_amount: paidAmount,
        status: 'active',
        created_at: now,
        updated_at: now,
        created_by: options.createdBy || null,
        updated_by: options.updatedBy || null
      };
      
      // Insert the claim payment
      const [result] = await queryBuilder.insert(claimPayment).returning('*');
      
      // Get claim details to return a complete ClaimPayment object
      let claimQuery = knex('claims').where('id', claimId).first();
      if (options.transaction) {
        claimQuery = options.transaction('claims').where('id', claimId).first();
      }
      
      const claim = await claimQuery;
      
      return {
        id: result.id,
        paymentId: result.payment_id,
        claimId: result.claim_id,
        paidAmount: result.paid_amount,
        claim: {
          id: claim.id,
          claimNumber: claim.claim_number,
          clientId: claim.client_id,
          clientName: '', // Would need additional query to get client name
          payerId: claim.payer_id,
          payerName: '', // Would need additional query to get payer name
          claimStatus: claim.claim_status,
          totalAmount: claim.total_amount,
          serviceStartDate: claim.service_start_date,
          serviceEndDate: claim.service_end_date,
          submissionDate: claim.submission_date,
          claimAge: Math.floor((Date.now() - new Date(claim.created_at).getTime()) / (1000 * 60 * 60 * 24))
        },
        adjustments: [],
        status: result.status,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      this.handleDatabaseError(error, 'addClaimPayment');
    }
  }

  /**
   * Adds a payment adjustment to a claim payment
   * 
   * @param claimPaymentId Claim payment ID
   * @param adjustment Adjustment details
   * @param options Repository options
   * @returns The created payment adjustment
   */
  async addPaymentAdjustment(
    claimPaymentId: UUID, 
    adjustment: PaymentAdjustment, 
    options: RepositoryOptions = {}
  ): Promise<PaymentAdjustment> {
    try {
      logger.debug(`Adding payment adjustment for claim payment: ${claimPaymentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('payment_adjustments');
      
      if (options.transaction) {
        queryBuilder = options.transaction('payment_adjustments');
      }
      
      // Create a new payment adjustment object
      const now = new Date();
      const paymentAdjustment = {
        claim_payment_id: claimPaymentId,
        adjustment_type: adjustment.adjustmentType,
        adjustment_code: adjustment.adjustmentCode,
        adjustment_amount: adjustment.adjustmentAmount,
        description: adjustment.description,
        status: 'active',
        created_at: now,
        updated_at: now,
        created_by: options.createdBy || null,
        updated_by: options.updatedBy || null
      };
      
      // Insert the payment adjustment
      const [result] = await queryBuilder.insert(paymentAdjustment).returning('*');
      
      // Format the result to match the PaymentAdjustment interface
      return {
        id: result.id,
        claimPaymentId: result.claim_payment_id,
        adjustmentType: result.adjustment_type,
        adjustmentCode: result.adjustment_code,
        adjustmentAmount: result.adjustment_amount,
        description: result.description,
        status: result.status,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      this.handleDatabaseError(error, 'addPaymentAdjustment');
    }
  }

  /**
   * Removes all claim payment associations from a payment
   * 
   * @param paymentId Payment ID
   * @param options Repository options
   * @returns True if the associations were removed successfully
   */
  async removeClaimPayments(paymentId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Removing claim payments for payment: ${paymentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('claim_payments');
      
      if (options.transaction) {
        queryBuilder = options.transaction('claim_payments');
      }
      
      // Soft delete claim payments
      const now = new Date();
      const updateData = {
        deleted_at: now,
        updated_at: now,
        updated_by: options.updatedBy || null
      };
      
      const result = await queryBuilder
        .where('payment_id', paymentId)
        .update(updateData);
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeClaimPayments');
    }
  }

  /**
   * Gets the remittance information associated with a payment
   * 
   * @param paymentId Payment ID
   * @param options Repository options
   * @returns The remittance information if found, null otherwise
   */
  async getRemittanceInfo(paymentId: UUID, options: RepositoryOptions = {}): Promise<RemittanceInfo | null> {
    try {
      logger.debug(`Getting remittance info for payment: ${paymentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('remittance_info')
        .where('payment_id', paymentId)
        .whereNull('deleted_at');
      
      if (options.transaction) {
        queryBuilder = options.transaction('remittance_info')
          .where('payment_id', paymentId)
          .whereNull('deleted_at');
      }
      
      const result = await queryBuilder.first();
      
      if (!result) {
        return null;
      }
      
      // Format the result to match the RemittanceInfo interface
      return {
        id: result.id,
        paymentId: result.payment_id,
        remittanceNumber: result.remittance_number,
        remittanceDate: result.remittance_date,
        payerIdentifier: result.payer_identifier,
        payerName: result.payer_name,
        totalAmount: result.total_amount,
        claimCount: result.claim_count,
        fileType: result.file_type,
        originalFilename: result.original_filename,
        storageLocation: result.storage_location,
        status: result.status,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getRemittanceInfo');
    }
  }

  /**
   * Saves remittance information for a payment
   * 
   * @param paymentId Payment ID
   * @param remittanceData Remittance data to save
   * @param options Repository options
   * @returns The created or updated remittance information
   */
  async saveRemittanceInfo(
    paymentId: UUID, 
    remittanceData: Partial<RemittanceInfo>, 
    options: RepositoryOptions = {}
  ): Promise<RemittanceInfo> {
    try {
      logger.debug(`Saving remittance info for payment: ${paymentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex('remittance_info');
      
      if (options.transaction) {
        queryBuilder = options.transaction('remittance_info');
      }
      
      // Check if remittance info already exists for this payment
      const existing = await queryBuilder
        .where('payment_id', paymentId)
        .whereNull('deleted_at')
        .first();
      
      const now = new Date();
      
      // Convert camelCase keys to snake_case for database
      const convertToSnakeCase = (obj: Record<string, any>): Record<string, any> => {
        const result: Record<string, any> = {};
        Object.entries(obj).forEach(([key, value]) => {
          // Skip already snake_case keys
          if (key.includes('_')) {
            result[key] = value;
          } else {
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            result[snakeKey] = value;
          }
        });
        return result;
      };
      
      if (existing) {
        // Update existing remittance info
        const updateData = {
          ...convertToSnakeCase(remittanceData as Record<string, any>),
          updated_at: now,
          updated_by: options.updatedBy || null
        };
        
        const [result] = await queryBuilder
          .where('id', existing.id)
          .update(updateData)
          .returning('*');
        
        // Format the result to match the RemittanceInfo interface
        return {
          id: result.id,
          paymentId: result.payment_id,
          remittanceNumber: result.remittance_number,
          remittanceDate: result.remittance_date,
          payerIdentifier: result.payer_identifier,
          payerName: result.payer_name,
          totalAmount: result.total_amount,
          claimCount: result.claim_count,
          fileType: result.file_type,
          originalFilename: result.original_filename,
          storageLocation: result.storage_location,
          status: result.status,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        };
      } else {
        // Create new remittance info
        const insertData = {
          payment_id: paymentId,
          ...convertToSnakeCase(remittanceData as Record<string, any>),
          status: 'active',
          created_at: now,
          updated_at: now,
          created_by: options.createdBy || null,
          updated_by: options.updatedBy || null
        };
        
        const [result] = await queryBuilder.insert(insertData).returning('*');
        
        // Format the result to match the RemittanceInfo interface
        return {
          id: result.id,
          paymentId: result.payment_id,
          remittanceNumber: result.remittance_number,
          remittanceDate: result.remittance_date,
          payerIdentifier: result.payer_identifier,
          payerName: result.payer_name,
          totalAmount: result.total_amount,
          claimCount: result.claim_count,
          fileType: result.file_type,
          originalFilename: result.original_filename,
          storageLocation: result.storage_location,
          status: result.status,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        };
      }
    } catch (error) {
      this.handleDatabaseError(error, 'saveRemittanceInfo');
    }
  }

  /**
   * Updates the reconciliation status of a payment
   * 
   * @param paymentId Payment ID
   * @param status New reconciliation status
   * @param options Repository options
   * @returns The updated payment
   */
  async updateReconciliationStatus(
    paymentId: UUID, 
    status: ReconciliationStatus, 
    options: RepositoryOptions = {}
  ): Promise<Payment> {
    try {
      logger.debug(`Updating reconciliation status for payment: ${paymentId} to ${status}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      const now = new Date();
      const updateData = {
        reconciliation_status: status,
        updated_at: now
      };
      
      // Add updated_by if provided in options
      if ('updatedBy' in options) {
        updateData['updated_by'] = options.updatedBy;
      }
      
      const [result] = await queryBuilder
        .where('id', paymentId)
        .update(updateData)
        .returning('*');
      
      // Format the result to match the Payment interface
      return {
        id: result.id,
        payerId: result.payer_id,
        paymentDate: result.payment_date,
        paymentAmount: result.payment_amount,
        paymentMethod: result.payment_method,
        referenceNumber: result.reference_number,
        checkNumber: result.check_number,
        remittanceId: result.remittance_id,
        reconciliationStatus: result.reconciliation_status,
        notes: result.notes,
        status: result.status,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        createdBy: result.created_by,
        updatedBy: result.updated_by
      };
    } catch (error) {
      this.handleDatabaseError(error, 'updateReconciliationStatus');
    }
  }

  /**
   * Gets metrics for payments based on specified conditions
   * 
   * @param conditions Where conditions for filtering payments
   * @param options Repository options
   * @returns Payment metrics including totals and status breakdown
   */
  async getPaymentMetrics(
    conditions: WhereCondition = {}, 
    options: RepositoryOptions = {}
  ): Promise<{ 
    totalPayments: number; 
    totalAmount: number; 
    statusBreakdown: Array<{ 
      status: ReconciliationStatus; 
      count: number; 
      amount: number 
    }> 
  }> {
    try {
      logger.debug('Getting payment metrics', { conditions });
      
      const knex = getKnexInstance();
      let queryBuilder = knex('payments').whereNull('deleted_at');
      
      if (options.transaction) {
        queryBuilder = options.transaction('payments').whereNull('deleted_at');
      }
      
      // Apply conditions
      if (Object.keys(conditions).length > 0) {
        queryBuilder = this.applyWhereConditions(queryBuilder, conditions);
      }
      
      // Get total counts and amount
      const totalsResult = await queryBuilder
        .count('* as count')
        .sum('payment_amount as total_amount')
        .first();
      
      // Get breakdown by reconciliation status
      const statusBreakdown = await queryBuilder
        .select('reconciliation_status')
        .count('* as count')
        .sum('payment_amount as total_amount')
        .groupBy('reconciliation_status');
      
      // Format the status breakdown
      const formattedBreakdown = statusBreakdown.map(item => ({
        status: item.reconciliation_status as ReconciliationStatus,
        count: parseInt(item.count, 10),
        amount: parseFloat(item.total_amount) || 0
      }));
      
      return {
        totalPayments: parseInt(totalsResult.count, 10),
        totalAmount: parseFloat(totalsResult.total_amount) || 0,
        statusBreakdown: formattedBreakdown
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getPaymentMetrics');
    }
  }

  /**
   * Gets payments within a specific date range
   * 
   * @param startDate Start of date range
   * @param endDate End of date range
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated payments within the date range
   */
  async getPaymentsByDateRange(
    startDate: ISO8601Date,
    endDate: ISO8601Date,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Payment>> {
    try {
      logger.debug(`Getting payments in date range: ${startDate} to ${endDate}`);
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Add date range condition
      const query = queryBuilder.whereBetween('payment_date', [startDate, endDate]);
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute query
      const payments = await sortedQuery;
      
      // Count total payments in this date range
      const countResult = await query.count({ count: '*' }).first();
      const total = parseInt(countResult.count, 10);
      
      return {
        data: payments as Payment[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      this.handleDatabaseError(error, 'getPaymentsByDateRange');
    }
  }
}

// Create a singleton instance of the repository
const paymentRepository = new PaymentRepository();

// Export the repository instance for use throughout the application
export { paymentRepository };