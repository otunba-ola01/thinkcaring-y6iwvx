/**
 * Defines the Payer model class that represents funding sources such as Medicaid, Medicare, 
 * private insurance, and other payers in the HCBS Revenue Management System. This model 
 * encapsulates payer data and provides methods for payer-related operations including 
 * configuration, validation, and submission requirements.
 */

import { Payer, PayerWithRelations, PayerSummary } from '../types/claims.types';
import { UUID, StatusType, Timestamp, Address, ContactInfo } from '../types/common.types';
import { formatDate } from '../utils/formatter';

/**
 * Enum defining the types of payers in the system
 */
export enum PayerType {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE_INSURANCE = 'private_insurance',
  SELF_PAY = 'self_pay',
  OTHER = 'other'
}

/**
 * Enum defining the formats for claim submission
 */
export enum SubmissionFormat {
  EDI_837P = 'edi_837p',    // Electronic Data Interchange claim format
  CMS1500 = 'cms1500',       // Paper claim form
  PORTAL = 'portal',         // Web portal submission
  CUSTOM = 'custom'          // Custom format
}

/**
 * Interface defining payer-specific billing requirements
 */
export interface BillingRequirements {
  submissionFormat: SubmissionFormat;
  timely_filing_days: number;
  requires_authorization: boolean;
  required_fields: string[];
  claim_frequency_limit: number | null;
  service_line_limit: number | null;
  custom_requirements: Record<string, any> | null;
}

/**
 * Interface defining payer submission method configuration
 */
export interface SubmissionMethod {
  method: string;
  endpoint: string | null;
  credentials: {
    username?: string;
    password?: string;
    api_key?: string;
  } | null;
  clearinghouse: string | null;
  trading_partner_id: string | null;
  configuration: Record<string, any> | null;
}

/**
 * Model class representing a payer in the system with methods for payer operations
 */
export class PayerModel {
  id: UUID;
  name: string;
  payerType: PayerType;
  payerId: string;
  address: Address | null;
  contactInfo: ContactInfo | null;
  billingRequirements: BillingRequirements | null;
  submissionMethod: SubmissionMethod | null;
  isElectronic: boolean;
  status: StatusType;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;

  /**
   * Creates a new PayerModel instance
   * @param payerData The payer data to initialize the model with
   */
  constructor(payerData: Payer | PayerWithRelations) {
    this.id = payerData.id;
    this.name = payerData.name;
    this.payerType = payerData.payerType;
    this.payerId = payerData.payerId;
    this.address = payerData.address || null;
    this.contactInfo = payerData.contactInfo || null;
    this.billingRequirements = payerData.billingRequirements || null;
    this.submissionMethod = payerData.submissionMethod || null;
    this.isElectronic = payerData.isElectronic || false;
    this.status = payerData.status || StatusType.ACTIVE;
    this.notes = payerData.notes || null;
    this.createdAt = payerData.createdAt;
    this.updatedAt = payerData.updatedAt;
    this.createdBy = payerData.createdBy || null;
    this.updatedBy = payerData.updatedBy || null;
  }

  /**
   * Checks if the payer is active
   * @returns True if the payer status is ACTIVE
   */
  isActive(): boolean {
    return this.status === StatusType.ACTIVE;
  }

  /**
   * Checks if the payer is inactive
   * @returns True if the payer status is INACTIVE
   */
  isInactive(): boolean {
    return this.status === StatusType.INACTIVE;
  }

  /**
   * Gets a human-readable text for the payer type
   * @returns Human-readable payer type text
   */
  getPayerTypeText(): string {
    switch (this.payerType) {
      case PayerType.MEDICAID:
        return 'Medicaid';
      case PayerType.MEDICARE:
        return 'Medicare';
      case PayerType.PRIVATE_INSURANCE:
        return 'Private Insurance';
      case PayerType.SELF_PAY:
        return 'Self Pay';
      case PayerType.OTHER:
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets a human-readable text for the payer status
   * @returns Human-readable status text
   */
  getStatusText(): string {
    switch (this.status) {
      case StatusType.ACTIVE:
        return 'Active';
      case StatusType.INACTIVE:
        return 'Inactive';
      case StatusType.PENDING:
        return 'Pending';
      case StatusType.DELETED:
        return 'Deleted';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets the payer address as a formatted string
   * @returns Formatted address string
   */
  getFormattedAddress(): string {
    if (!this.address) {
      return '';
    }

    const parts = [
      this.address.street1,
      this.address.street2,
      `${this.address.city}, ${this.address.state} ${this.address.zipCode}`,
      this.address.country !== 'USA' && this.address.country !== 'US' ? this.address.country : null
    ].filter(Boolean); // Filter out empty/undefined/null parts

    return parts.join(', ');
  }

  /**
   * Gets a human-readable text for the submission method
   * @returns Human-readable submission method text
   */
  getSubmissionMethodText(): string {
    if (!this.submissionMethod) {
      return 'Not Configured';
    }

    switch (this.submissionMethod.method) {
      case 'direct':
        return 'Direct to Payer';
      case 'clearinghouse':
        return `Via Clearinghouse${this.submissionMethod.clearinghouse ? `: ${this.submissionMethod.clearinghouse}` : ''}`;
      case 'portal':
        return 'Web Portal';
      case 'paper':
        return 'Paper Claims';
      default:
        return this.submissionMethod.method;
    }
  }

  /**
   * Updates the payer status (to be called from service layer)
   * @param newStatus The new status to set
   * @param userId ID of the user making the change
   * @param updateDbFunc Function to update the status in the database
   * @returns True if the status was updated successfully
   */
  async updateStatus(newStatus: StatusType, userId: UUID | null, updateDbFunc: Function): Promise<boolean> {
    const updated = await updateDbFunc(this.id, newStatus, userId);
    if (updated) {
      this.status = newStatus;
      this.updatedBy = userId;
      this.updatedAt = new Date();
    }
    return updated;
  }

  /**
   * Activates the payer (to be called from service layer)
   * @param userId ID of the user making the change
   * @param updateDbFunc Function to update the status in the database
   * @returns True if the payer was activated successfully
   */
  async activate(userId: UUID | null, updateDbFunc: Function): Promise<boolean> {
    return this.updateStatus(StatusType.ACTIVE, userId, updateDbFunc);
  }

  /**
   * Deactivates the payer (to be called from service layer)
   * @param userId ID of the user making the change
   * @param updateDbFunc Function to update the status in the database
   * @returns True if the payer was deactivated successfully
   */
  async deactivate(userId: UUID | null, updateDbFunc: Function): Promise<boolean> {
    return this.updateStatus(StatusType.INACTIVE, userId, updateDbFunc);
  }

  /**
   * Validates that the payer has all required billing configuration
   * @returns Validation result with any missing requirements
   */
  validateBillingRequirements(): { isValid: boolean, missingRequirements: string[] } {
    const missingRequirements: string[] = [];

    if (!this.billingRequirements) {
      missingRequirements.push('Billing requirements not configured');
      return {
        isValid: false,
        missingRequirements
      };
    }

    // Check required fields
    if (!this.billingRequirements.submissionFormat) {
      missingRequirements.push('Submission format is required');
    }

    if (this.billingRequirements.timely_filing_days <= 0) {
      missingRequirements.push('Timely filing days must be a positive number');
    }

    if (!this.billingRequirements.required_fields || this.billingRequirements.required_fields.length === 0) {
      missingRequirements.push('Required fields must be specified');
    }

    return {
      isValid: missingRequirements.length === 0,
      missingRequirements
    };
  }

  /**
   * Validates that the payer has a properly configured submission method
   * @returns Validation result with any missing configuration
   */
  validateSubmissionMethod(): { isValid: boolean, missingConfiguration: string[] } {
    const missingConfiguration: string[] = [];

    if (!this.submissionMethod) {
      missingConfiguration.push('Submission method not configured');
      return {
        isValid: false,
        missingConfiguration
      };
    }

    // Check required fields
    if (!this.submissionMethod.method) {
      missingConfiguration.push('Submission method is required');
    }

    // Check specific requirements based on method
    if (this.submissionMethod.method === 'direct' || this.submissionMethod.method === 'clearinghouse') {
      if (!this.submissionMethod.endpoint) {
        missingConfiguration.push('Endpoint is required for direct or clearinghouse submission');
      }

      if (!this.submissionMethod.credentials) {
        missingConfiguration.push('Credentials are required for direct or clearinghouse submission');
      }
    }

    if (this.submissionMethod.method === 'clearinghouse' && !this.submissionMethod.clearinghouse) {
      missingConfiguration.push('Clearinghouse name is required for clearinghouse submission');
    }

    if (this.submissionMethod.method === 'portal' && !this.submissionMethod.endpoint) {
      missingConfiguration.push('Portal URL is required for portal submission');
    }

    // Additional validation based on submission format
    if (this.billingRequirements && this.billingRequirements.submissionFormat === SubmissionFormat.EDI_837P) {
      if (!this.submissionMethod.trading_partner_id) {
        missingConfiguration.push('Trading partner ID is required for EDI 837P submission');
      }
    }

    return {
      isValid: missingConfiguration.length === 0,
      missingConfiguration
    };
  }

  /**
   * Converts the payer model to a payer summary object
   * @returns Payer summary object with essential information
   */
  toSummary(): PayerSummary {
    return {
      id: this.id,
      name: this.name,
      payerType: this.payerType,
      isElectronic: this.isElectronic,
      status: this.status
    };
  }

  /**
   * Creates a PayerModel instance from payer data
   * @param payerData The payer data to create an instance from
   * @returns PayerModel instance if data provided, null otherwise
   */
  static createInstance(payerData: Payer | PayerWithRelations | null): PayerModel | null {
    if (!payerData) {
      return null;
    }
    return new PayerModel(payerData);
  }
}