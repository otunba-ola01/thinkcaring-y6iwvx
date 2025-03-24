/**
 * Type definitions for external system integrations in the HCBS Revenue Management System.
 * This file provides interfaces, enums, and types for integration configurations, 
 * protocols, data formats, and request/response handling across various integration types
 * including EHR systems, clearinghouses, accounting systems, and remittance processing.
 */

import { UUID, ISO8601Date } from './common.types';
import { ErrorCode, ErrorCategory, IntegrationErrorDetail } from './error.types';

/**
 * Enum defining the types of external systems that can be integrated with
 */
export enum IntegrationType {
  EHR = 'ehr',
  CLEARINGHOUSE = 'clearinghouse',
  ACCOUNTING = 'accounting',
  MEDICAID = 'medicaid',
  REMITTANCE = 'remittance',
  CUSTOM = 'custom'
}

/**
 * Enum defining the communication protocols used for integration
 */
export enum IntegrationProtocol {
  REST = 'rest',
  SOAP = 'soap',
  SFTP = 'sftp',
  FTP = 'ftp',
  HL7_FHIR = 'hl7_fhir',
  HL7_V2 = 'hl7_v2',
  DATABASE = 'database',
  FILE = 'file',
  CUSTOM = 'custom'
}

/**
 * Enum defining the data formats used in integration exchanges
 */
export enum DataFormat {
  JSON = 'json',
  XML = 'xml',
  CSV = 'csv',
  X12 = 'x12',
  HL7 = 'hl7',
  FHIR = 'fhir',
  CUSTOM = 'custom'
}

/**
 * Enum defining the types of EDI transactions used in healthcare integrations
 */
export enum EDITransactionType {
  CLAIM_837P = '837p',
  CLAIM_837I = '837i',
  REMITTANCE_835 = '835',
  ELIGIBILITY_270 = '270',
  ELIGIBILITY_271 = '271',
  CLAIM_STATUS_276 = '276',
  CLAIM_STATUS_277 = '277'
}

/**
 * Enum defining the operational status of an integration
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  TESTING = 'testing'
}

/**
 * Enum defining the authentication methods used for integration
 */
export enum AuthenticationType {
  BASIC = 'basic',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  JWT = 'jwt',
  CERTIFICATE = 'certificate',
  NONE = 'none'
}

/**
 * Interface for the base configuration of any integration
 */
export interface IntegrationConfig {
  id: UUID;
  name: string;
  description: string;
  type: IntegrationType;
  protocol: IntegrationProtocol;
  baseUrl: string;
  authType: AuthenticationType;
  credentials: Record<string, string>;
  headers: Record<string, string>;
  status: IntegrationStatus;
  timeout: number;
  retryLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for EHR-specific integration configuration
 */
export interface EHRIntegrationConfig {
  ehrSystem: string;
  version: string;
  dataFormat: DataFormat;
  endpoints: Record<string, string>;
  clientMapping: Record<string, string>;
  serviceMapping: Record<string, string>;
  authorizationMapping: Record<string, string>;
  syncFrequency: string;
  lastSyncDate: Date;
}

/**
 * Interface for clearinghouse-specific integration configuration
 */
export interface ClearinghouseIntegrationConfig {
  clearinghouseSystem: string;
  submitterInfo: Record<string, string>;
  receiverInfo: Record<string, string>;
  supportedTransactions: EDITransactionType[];
  endpoints: Record<string, string>;
  testMode: boolean;
  batchSize: number;
  submissionSchedule: string;
  lastSubmissionDate: Date;
}

/**
 * Interface for accounting system-specific integration configuration
 */
export interface AccountingIntegrationConfig {
  accountingSystem: string;
  version: string;
  dataFormat: DataFormat;
  endpoints: Record<string, string>;
  accountMapping: Record<string, string>;
  syncFrequency: string;
  lastSyncDate: Date;
}

/**
 * Interface for Medicaid portal-specific integration configuration
 */
export interface MedicaidIntegrationConfig {
  state: string;
  portalSystem: string;
  providerNumber: string;
  submitterInfo: Record<string, string>;
  supportedTransactions: EDITransactionType[];
  endpoints: Record<string, string>;
  testMode: boolean;
}

/**
 * Interface for remittance processing-specific integration configuration
 */
export interface RemittanceIntegrationConfig {
  sourceType: string;
  fileFormat: DataFormat;
  importDirectory: string;
  archiveDirectory: string;
  errorDirectory: string;
  processingFrequency: string;
  lastProcessedDate: Date;
  archiveProcessedFiles: boolean;
  archiveFailedFiles: boolean;
}

/**
 * Interface for options that can be passed with integration requests
 */
export interface IntegrationRequestOptions {
  timeout: number;
  retryCount: number;
  retryDelay: number;
  headers: Record<string, string>;
  correlationId: string;
  priority: number;
}

/**
 * Interface for standardized integration response structure
 */
export interface IntegrationResponse {
  success: boolean;
  statusCode: number;
  data: any;
  error: IntegrationError | null;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * Interface for integration-specific error information
 */
export interface IntegrationError {
  code: ErrorCode;
  message: string;
  category: ErrorCategory;
  details: IntegrationErrorDetail;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Interface for integration health check results
 */
export interface IntegrationHealthStatus {
  status: IntegrationStatus;
  responseTime: number | null;
  lastChecked: Date;
  message: string;
  details: Record<string, any>;
}

/**
 * Interface defining the common methods that all integration adapters must implement
 */
export interface IntegrationAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  execute(operation: string, data: any, options?: IntegrationRequestOptions): Promise<IntegrationResponse>;
  checkHealth(): Promise<IntegrationHealthStatus>;
}

/**
 * Interface defining the common methods that all integration transformers must implement
 */
export interface IntegrationTransformer {
  transformRequest(data: any, format: DataFormat): any;
  transformResponse(data: any, format: DataFormat): any;
}

/**
 * Enum defining the possible states of a circuit breaker for integration resilience
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Interface for circuit breaker configuration used in integration resilience
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenSuccessThreshold: number;
}

/**
 * Interface for circuit breaker statistics used in monitoring integration health
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  lastStateChange: Date | null;
}

/**
 * Interface for integration events used in event-driven integration patterns
 */
export interface IntegrationEvent {
  id: UUID;
  type: string;
  integrationId: UUID;
  timestamp: Date;
  data: Record<string, any>;
  correlationId: string;
}