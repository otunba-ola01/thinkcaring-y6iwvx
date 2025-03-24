import { 
  Claim, 
  ClaimWithRelations, 
  ClaimStatus, 
  ClaimType,
  ClaimSummary,
  SubmissionMethod,
  DenialReason 
} from '../types/claims.types';
import { 
  UUID, 
  ISO8601Date, 
  Money, 
  Timestamp 
} from '../types/common.types';
import { ClientSummary } from '../types/clients.types';
import { PayerSummary } from '../types/claims.types';
import { ServiceSummary } from '../types/services.types';
import { claimRepository } from '../database/repositories/claim.repository';
import { transaction } from '../database/connection';

/**
 * Model class representing a claim in the HCBS Revenue Management System
 * Provides methods for managing the claim lifecycle and accessing claim data
 */
export class ClaimModel {
  id: UUID;
  claimNumber: string;
  externalClaimId: string | null;
  clientId: UUID;
  client: ClientSummary | null;
  payerId: UUID;
  payer: PayerSummary | null;
  claimType: ClaimType;
  claimStatus: ClaimStatus;
  totalAmount: Money;
  serviceStartDate: ISO8601Date;
  serviceEndDate: ISO8601Date;
  submissionDate: ISO8601Date | null;
  submissionMethod: SubmissionMethod | null;
  adjudicationDate: ISO8601Date | null;
  denialReason: DenialReason | null;
  denialDetails: string | null;
  adjustmentCodes: Record<string, string> | null;
  originalClaimId: UUID | null;
  originalClaim: ClaimSummary | null;
  services: ServiceSummary[] | null;
  statusHistory: Array<{ status: ClaimStatus, timestamp: ISO8601Date, notes: string | null, userId: UUID | null }> | null;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;

  /**
   * Creates a new ClaimModel instance
   * @param claimData Claim data to initialize the model
   */
  constructor(claimData: Claim | ClaimWithRelations) {
    this.id = claimData.id;
    this.claimNumber = claimData.claimNumber;
    this.externalClaimId = claimData.externalClaimId;
    this.clientId = claimData.clientId;
    this.payerId = claimData.payerId;
    this.claimType = claimData.claimType;
    this.claimStatus = claimData.claimStatus;
    this.totalAmount = claimData.totalAmount;
    this.serviceStartDate = claimData.serviceStartDate;
    this.serviceEndDate = claimData.serviceEndDate;
    this.submissionDate = claimData.submissionDate;
    this.submissionMethod = claimData.submissionMethod;
    this.adjudicationDate = claimData.adjudicationDate;
    this.denialReason = claimData.denialReason;
    this.denialDetails = claimData.denialDetails;
    this.adjustmentCodes = claimData.adjustmentCodes;
    this.originalClaimId = claimData.originalClaimId;
    this.notes = claimData.notes;
    this.createdAt = claimData.createdAt;
    this.updatedAt = claimData.updatedAt;
    this.createdBy = claimData.createdBy;
    this.updatedBy = claimData.updatedBy;

    // Handle related entities which may only be present in ClaimWithRelations
    if ('client' in claimData) {
      const withRelations = claimData as ClaimWithRelations;
      this.client = withRelations.client;
      this.payer = withRelations.payer;
      this.originalClaim = withRelations.originalClaim;
      this.services = withRelations.services;
      this.statusHistory = withRelations.statusHistory;
    } else {
      this.client = null;
      this.payer = null;
      this.originalClaim = null;
      this.services = null;
      this.statusHistory = null;
    }
  }

  /**
   * Checks if the claim is in draft status
   * @returns True if the claim status is DRAFT
   */
  isDraft(): boolean {
    return this.claimStatus === ClaimStatus.DRAFT;
  }

  /**
   * Checks if the claim has been submitted
   * @returns True if the claim status is SUBMITTED or later in the workflow
   */
  isSubmitted(): boolean {
    const submittedStatuses = [
      ClaimStatus.SUBMITTED, 
      ClaimStatus.ACKNOWLEDGED, 
      ClaimStatus.PENDING, 
      ClaimStatus.PAID,
      ClaimStatus.PARTIAL_PAID,
      ClaimStatus.DENIED,
      ClaimStatus.APPEALED
    ];
    return submittedStatuses.includes(this.claimStatus);
  }

  /**
   * Checks if the claim has been paid
   * @returns True if the claim status is PAID or PARTIAL_PAID
   */
  isPaid(): boolean {
    return this.claimStatus === ClaimStatus.PAID || this.claimStatus === ClaimStatus.PARTIAL_PAID;
  }

  /**
   * Checks if the claim has been denied
   * @returns True if the claim status is DENIED or FINAL_DENIED
   */
  isDenied(): boolean {
    return this.claimStatus === ClaimStatus.DENIED || this.claimStatus === ClaimStatus.FINAL_DENIED;
  }

  /**
   * Checks if the claim has been voided
   * @returns True if the claim status is VOID
   */
  isVoid(): boolean {
    return this.claimStatus === ClaimStatus.VOID;
  }

  /**
   * Calculates the age of the claim in days
   * @returns The age of the claim in days
   */
  getClaimAge(): number {
    const now = new Date();
    const creationDate = new Date(this.submissionDate || this.createdAt);
    const differenceInTime = now.getTime() - creationDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  }

  /**
   * Gets the service period as a formatted string
   * @returns Formatted service period (e.g., 'Jan 1, 2023 - Jan 15, 2023')
   */
  getServicePeriod(): string {
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    return `${formatDate(this.serviceStartDate)} - ${formatDate(this.serviceEndDate)}`;
  }

  /**
   * Updates the claim status
   * @param newStatus New claim status
   * @param notes Optional notes about the status change
   * @param userId Optional ID of the user making the change
   * @returns Promise resolving to true if the status was updated successfully
   */
  async updateStatus(
    newStatus: ClaimStatus, 
    notes: string | null = null, 
    userId: UUID | null = null
  ): Promise<boolean> {
    const updated = await claimRepository.updateStatus(
      this.id, 
      newStatus, 
      notes, 
      userId
    );

    if (updated) {
      this.claimStatus = newStatus;
    }

    return updated;
  }

  /**
   * Submits the claim to a payer
   * @param method Submission method
   * @param date Submission date
   * @param externalId Optional external claim ID
   * @param userId Optional ID of the user making the submission
   * @returns Promise resolving to true if the claim was submitted successfully
   */
  async submit(
    method: SubmissionMethod,
    date: ISO8601Date,
    externalId: string | null = null,
    userId: UUID | null = null
  ): Promise<boolean> {
    // Check if the claim is in a submittable state
    if (this.claimStatus !== ClaimStatus.DRAFT && this.claimStatus !== ClaimStatus.VALIDATED) {
      return false;
    }

    // Start a transaction
    const updated = await transaction(async (trx) => {
      // Update claim with submission details
      await claimRepository.update(this.id, {
        submissionMethod: method,
        submissionDate: date,
        externalClaimId: externalId,
        updatedBy: userId || this.updatedBy
      }, { transaction: trx });

      // Update status to SUBMITTED
      return await claimRepository.updateStatus(
        this.id, 
        ClaimStatus.SUBMITTED, 
        'Claim submitted to payer', 
        userId, 
        { transaction: trx }
      );
    });

    if (updated) {
      this.submissionMethod = method;
      this.submissionDate = date;
      this.externalClaimId = externalId;
      this.claimStatus = ClaimStatus.SUBMITTED;
      this.updatedBy = userId || this.updatedBy;
    }

    return updated;
  }

  /**
   * Marks the claim as paid
   * @param adjudicationDate Date of adjudication
   * @param userId Optional ID of the user making the change
   * @returns Promise resolving to true if the claim was marked as paid successfully
   */
  async markAsPaid(
    adjudicationDate: ISO8601Date,
    userId: UUID | null = null
  ): Promise<boolean> {
    // Check if the claim is in a payable state
    if (this.claimStatus !== ClaimStatus.PENDING && this.claimStatus !== ClaimStatus.ACKNOWLEDGED) {
      return false;
    }

    // Start a transaction
    const updated = await transaction(async (trx) => {
      // Update claim with adjudication date
      await claimRepository.update(this.id, {
        adjudicationDate,
        updatedBy: userId || this.updatedBy
      }, { transaction: trx });

      // Update status to PAID
      return await claimRepository.updateStatus(
        this.id, 
        ClaimStatus.PAID, 
        'Claim paid', 
        userId, 
        { transaction: trx }
      );
    });

    if (updated) {
      this.adjudicationDate = adjudicationDate;
      this.claimStatus = ClaimStatus.PAID;
      this.updatedBy = userId || this.updatedBy;
    }

    return updated;
  }

  /**
   * Marks the claim as denied
   * @param adjudicationDate Date of adjudication
   * @param reason Reason for denial
   * @param details Optional additional details about the denial
   * @param userId Optional ID of the user making the change
   * @returns Promise resolving to true if the claim was marked as denied successfully
   */
  async markAsDenied(
    adjudicationDate: ISO8601Date,
    reason: DenialReason,
    details: string | null = null,
    userId: UUID | null = null
  ): Promise<boolean> {
    // Check if the claim is in a deniable state
    if (this.claimStatus !== ClaimStatus.PENDING && this.claimStatus !== ClaimStatus.ACKNOWLEDGED) {
      return false;
    }

    // Start a transaction
    const updated = await transaction(async (trx) => {
      // Update claim with denial information
      await claimRepository.update(this.id, {
        adjudicationDate,
        denialReason: reason,
        denialDetails: details,
        updatedBy: userId || this.updatedBy
      }, { transaction: trx });

      // Update status to DENIED
      return await claimRepository.updateStatus(
        this.id, 
        ClaimStatus.DENIED, 
        `Claim denied: ${reason}${details ? ` - ${details}` : ''}`, 
        userId, 
        { transaction: trx }
      );
    });

    if (updated) {
      this.adjudicationDate = adjudicationDate;
      this.denialReason = reason;
      this.denialDetails = details;
      this.claimStatus = ClaimStatus.DENIED;
      this.updatedBy = userId || this.updatedBy;
    }

    return updated;
  }

  /**
   * Appeals a denied claim
   * @param notes Optional notes about the appeal
   * @param userId Optional ID of the user making the appeal
   * @returns Promise resolving to true if the claim was appealed successfully
   */
  async appeal(
    notes: string | null = null,
    userId: UUID | null = null
  ): Promise<boolean> {
    // Check if the claim is in a DENIED state
    if (this.claimStatus !== ClaimStatus.DENIED) {
      return false;
    }

    const updated = await this.updateStatus(
      ClaimStatus.APPEALED, 
      notes || 'Claim appealed', 
      userId
    );

    return updated;
  }

  /**
   * Voids the claim
   * @param notes Optional notes about the void
   * @param userId Optional ID of the user voiding the claim
   * @returns Promise resolving to true if the claim was voided successfully
   */
  async void(
    notes: string | null = null,
    userId: UUID | null = null
  ): Promise<boolean> {
    // Check if claim can be voided (not already VOID or FINAL_DENIED)
    if (this.claimStatus === ClaimStatus.VOID || this.claimStatus === ClaimStatus.FINAL_DENIED) {
      return false;
    }

    const updated = await this.updateStatus(
      ClaimStatus.VOID, 
      notes || 'Claim voided', 
      userId
    );

    return updated;
  }

  /**
   * Gets the status history for the claim
   * @returns Promise resolving to an array of status history records
   */
  async getStatusHistory(): Promise<Array<{ 
    status: ClaimStatus, 
    timestamp: ISO8601Date, 
    notes: string | null, 
    userId: UUID | null 
  }>> {
    // If we already have the status history, return it
    if (this.statusHistory) {
      return this.statusHistory;
    }

    // Otherwise, fetch it from the repository
    const statusHistory = await claimRepository.getStatusHistory(this.id);
    this.statusHistory = statusHistory;
    return statusHistory;
  }

  /**
   * Gets the services associated with the claim
   * @returns Promise resolving to an array of service summaries
   */
  async getServices(): Promise<ServiceSummary[]> {
    // If we already have the services, return them
    if (this.services) {
      return this.services;
    }

    // Otherwise, fetch them from the repository
    const services = await claimRepository.getClaimServices(this.id);
    // Transform to ServiceSummary array
    const serviceSummaries = services.map(service => service.service);
    this.services = serviceSummaries;
    return serviceSummaries;
  }

  /**
   * Converts the claim model to a claim summary object
   * @returns Claim summary object with essential information
   */
  toSummary(): ClaimSummary {
    return {
      id: this.id,
      claimNumber: this.claimNumber,
      clientId: this.clientId,
      clientName: this.client ? `${this.client.lastName}, ${this.client.firstName}` : 'Unknown Client',
      payerId: this.payerId,
      payerName: this.payer ? this.payer.name : 'Unknown Payer',
      claimStatus: this.claimStatus,
      totalAmount: this.totalAmount,
      serviceStartDate: this.serviceStartDate,
      serviceEndDate: this.serviceEndDate,
      submissionDate: this.submissionDate,
      claimAge: this.getClaimAge()
    };
  }

  /**
   * Finds a claim by ID and returns a ClaimModel instance
   * @param id Claim ID
   * @returns Promise resolving to a ClaimModel if found, null otherwise
   */
  static async findById(id: UUID): Promise<ClaimModel | null> {
    const claim = await claimRepository.findByIdWithRelations(id);
    if (!claim) {
      return null;
    }
    return new ClaimModel(claim);
  }

  /**
   * Finds a claim by claim number and returns a ClaimModel instance
   * @param claimNumber Claim number
   * @returns Promise resolving to a ClaimModel if found, null otherwise
   */
  static async findByClaimNumber(claimNumber: string): Promise<ClaimModel | null> {
    const claim = await claimRepository.findByClaimNumber(claimNumber);
    if (!claim) {
      return null;
    }
    
    // Get the full claim with relations
    return ClaimModel.findById(claim.id);
  }
}