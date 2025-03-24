/**
 * Database Types and Interfaces
 * 
 * This file defines TypeScript types and interfaces for database interactions
 * in the HCBS Revenue Management System. It provides type definitions for
 * database configurations, query building, transaction management, and
 * repository patterns to ensure type safety and consistency across all
 * database operations.
 * 
 * @module database.types
 */

import { UUID, Timestamp } from './common.types';
import * as Knex from 'knex'; // v2.4.2

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  client: string;
  connection: ConnectionConfig;
  pool: PoolConfig;
  migrations: {
    tableName: string;
    directory: string;
  };
}

/**
 * Database connection configuration
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | object;
}

/**
 * Database connection pool configuration
 */
export interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  acquireTimeoutMillis: number;
}

/**
 * Type alias for Knex.Transaction for easier imports
 */
export type Transaction = Knex.Transaction;

/**
 * Type alias for Knex.QueryBuilder for easier imports
 */
export type QueryBuilder = Knex.QueryBuilder;

/**
 * Type for where conditions in database queries
 */
export type WhereCondition = string | number | boolean | Array<string | number> | null;

/**
 * Order direction enum for database queries
 */
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

/**
 * Interface for order by clauses in database queries
 */
export interface OrderBy {
  column: string;
  direction: OrderDirection;
}

/**
 * Interface for pagination parameters in database queries
 */
export interface Pagination {
  page: number;
  limit: number;
}

/**
 * Interface for options passed to repository methods
 */
export interface RepositoryOptions {
  transaction?: Transaction;
  traceId?: string;
}

/**
 * Base interface for all database entities with common fields
 */
export interface DatabaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID;
  updatedBy: UUID;
  deletedAt?: Timestamp | null;
}

/**
 * Interface for entities that support soft delete
 */
export interface SoftDeleteEntity {
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
}

/**
 * Interface for raw query results
 */
export interface QueryResult {
  rows: any[];
  rowCount: number;
}

/**
 * Generic interface for paginated query results
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type for transaction callback functions
 */
export type TransactionCallback<T> = (trx: Transaction) => Promise<T>;

/**
 * Enum for SQL join types
 */
export enum JoinType {
  INNER = 'INNER JOIN',
  LEFT = 'LEFT JOIN',
  RIGHT = 'RIGHT JOIN',
  FULL = 'FULL JOIN'
}

/**
 * Interface for join clauses in database queries
 */
export interface JoinClause {
  type: JoinType;
  table: string;
  on: {
    [key: string]: string;
  };
}

/**
 * Enum for database query operators
 */
export enum DatabaseOperator {
  EQ = '=',
  NEQ = '!=',
  GT = '>',
  GTE = '>=',
  LT = '<',
  LTE = '<=',
  IN = 'IN',
  NOT_IN = 'NOT IN',
  LIKE = 'LIKE',
  ILIKE = 'ILIKE',
  BETWEEN = 'BETWEEN',
  IS_NULL = 'IS NULL',
  IS_NOT_NULL = 'IS NOT NULL'
}

/**
 * Interface for where clauses in database queries
 */
export interface WhereClause {
  column: string;
  operator: DatabaseOperator;
  value: any;
}

/**
 * Enum for logical operators in database queries
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR'
}

/**
 * Interface for grouped where clauses in database queries
 */
export interface WhereGroup {
  clauses: WhereClause[];
  operator: LogicalOperator;
}

/**
 * Interface for database index definitions
 */
export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

/**
 * Migration table name constant
 */
export type MigrationTableName = string;