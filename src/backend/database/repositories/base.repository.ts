import { Knex } from 'knex'; // knex v2.4.2
import { getKnexInstance } from '../connection';
import {
  Transaction,
  QueryBuilder,
  WhereCondition,
  OrderBy,
  Pagination,
  PaginatedResult,
  RepositoryOptions,
  DatabaseEntity
} from '../../types/database.types';
import { UUID } from '../../types/common.types';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Abstract base repository class that provides common database operations for entity repositories
 * in the HCBS Revenue Management System. This class follows the repository pattern and provides
 * standardized methods for CRUD operations, pagination, filtering, and transaction management.
 */
export abstract class BaseRepository<T extends DatabaseEntity> {
  protected tableName: string;
  protected primaryKey: string;
  protected softDelete: boolean;

  /**
   * Creates a new BaseRepository instance
   * 
   * @param tableName Name of the database table
   * @param primaryKey Name of the primary key field (defaults to 'id')
   * @param softDelete Whether the entity supports soft delete (defaults to true)
   */
  constructor(tableName: string, primaryKey: string = 'id', softDelete: boolean = true) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.softDelete = softDelete;
  }

  /**
   * Gets a query builder for the repository's table
   * 
   * @param trx Optional transaction object
   * @returns A query builder for the table
   */
  protected getQueryBuilder(trx?: Transaction): QueryBuilder {
    const knex = getKnexInstance();
    let queryBuilder = knex(this.tableName);
    
    if (trx) {
      queryBuilder = trx(this.tableName);
    }
    
    // If soft delete is enabled, add a where condition to exclude soft-deleted records
    if (this.softDelete) {
      queryBuilder = queryBuilder.whereNull('deleted_at');
    }
    
    return queryBuilder;
  }

  /**
   * Finds an entity by its primary key
   * 
   * @param id ID of the entity to find
   * @param options Repository options
   * @returns The entity if found, null otherwise
   */
  async findById(id: UUID, options: RepositoryOptions = {}): Promise<T | null> {
    try {
      logger.debug(`Finding ${this.tableName} by ID: ${id}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where(this.primaryKey, id).first();
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findById');
    }
  }

  /**
   * Finds a single entity matching the provided conditions
   * 
   * @param conditions Where conditions
   * @param options Repository options
   * @returns The entity if found, null otherwise
   */
  async findOne(conditions: WhereCondition, options: RepositoryOptions = {}): Promise<T | null> {
    try {
      logger.debug(`Finding one ${this.tableName} with conditions`, { conditions });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const query = this.applyWhereConditions(queryBuilder, conditions);
      const result = await query.first();
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findOne');
    }
  }

  /**
   * Finds all entities matching the provided conditions with pagination and sorting
   * 
   * @param conditions Where conditions
   * @param pagination Pagination options
   * @param orderBy Sorting options
   * @param options Repository options
   * @returns Paginated results with entities and metadata
   */
  async findAll(
    conditions: WhereCondition = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      logger.debug(`Finding all ${this.tableName} with conditions and pagination`, { 
        conditions, 
        pagination,
        orderBy 
      });
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply where conditions
      const query = this.applyWhereConditions(queryBuilder, conditions);
      
      // Create count query
      const countQuery = this.applyWhereConditions(
        this.getQueryBuilder(options.transaction),
        conditions
      );
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(query.clone(), pagination);
      
      // Apply sorting
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute both queries
      const [data, totalResult] = await Promise.all([
        sortedQuery,
        countQuery.count({ count: '*' }).first()
      ]);
      
      const total = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: data as T[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findAll');
    }
  }

  /**
   * Creates a new entity in the database
   * 
   * @param data Entity data to insert
   * @param options Repository options
   * @returns The created entity with its assigned ID
   */
  async create(data: Partial<T>, options: RepositoryOptions = {}): Promise<T> {
    try {
      logger.debug(`Creating new ${this.tableName} record`, { data });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Add timestamps
      const now = new Date();
      const entityData: any = {
        ...data,
        created_at: now,
        updated_at: now
      };
      
      // Add created_by if provided in options
      if ('createdBy' in options) {
        entityData.created_by = options.createdBy;
      }
      
      const [result] = await queryBuilder.insert(entityData).returning('*');
      return result as T;
    } catch (error) {
      this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Updates an existing entity in the database
   * 
   * @param id ID of the entity to update
   * @param data Entity data to update
   * @param options Repository options
   * @returns The updated entity
   */
  async update(id: UUID, data: Partial<T>, options: RepositoryOptions = {}): Promise<T> {
    try {
      logger.debug(`Updating ${this.tableName} record with ID: ${id}`, { data });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Add updated_at timestamp
      const entityData: any = {
        ...data,
        updated_at: new Date()
      };
      
      // Add updated_by if provided in options
      if ('updatedBy' in options) {
        entityData.updated_by = options.updatedBy;
      }
      
      const [result] = await queryBuilder
        .where(this.primaryKey, id)
        .update(entityData)
        .returning('*');
      
      return result as T;
    } catch (error) {
      this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Deletes an entity from the database (hard or soft delete)
   * 
   * @param id ID of the entity to delete
   * @param options Repository options
   * @returns True if the entity was deleted successfully
   */
  async delete(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Deleting ${this.tableName} record with ID: ${id}`, {
        softDelete: this.softDelete
      });
      
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      let result;
      
      if (this.softDelete) {
        // Soft delete
        const now = new Date();
        const updateData: any = {
          deleted_at: now,
          updated_at: now
        };
        
        // Add deleted_by if provided in options
        if ('deletedBy' in options) {
          updateData.deleted_by = options.deletedBy;
        }
        
        // Add updated_by if provided in options
        if ('updatedBy' in options) {
          updateData.updated_by = options.updatedBy;
        }
        
        result = await queryBuilder
          .where(this.primaryKey, id)
          .update(updateData);
      } else {
        // Hard delete
        result = await queryBuilder
          .where(this.primaryKey, id)
          .delete();
      }
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'delete');
    }
  }

  /**
   * Restores a soft-deleted entity
   * 
   * @param id ID of the entity to restore
   * @param options Repository options
   * @returns True if the entity was restored successfully
   */
  async restore(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      if (!this.softDelete) {
        throw new Error('Restore operation is only supported for entities with soft delete enabled');
      }
      
      logger.debug(`Restoring ${this.tableName} record with ID: ${id}`);
      
      // Get query builder without the soft delete filter
      const knex = getKnexInstance();
      let queryBuilder = knex(this.tableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.tableName);
      }
      
      // Update data
      const updateData: any = {
        deleted_at: null,
        updated_at: new Date()
      };
      
      // Add updated_by if provided in options
      if ('updatedBy' in options) {
        updateData.updated_by = options.updatedBy;
      }
      
      const result = await queryBuilder
        .where(this.primaryKey, id)
        .update(updateData);
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'restore');
    }
  }

  /**
   * Counts entities matching the provided conditions
   * 
   * @param conditions Where conditions
   * @param options Repository options
   * @returns The count of matching entities
   */
  async count(conditions: WhereCondition = {}, options: RepositoryOptions = {}): Promise<number> {
    try {
      logger.debug(`Counting ${this.tableName} records with conditions`, { conditions });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const query = this.applyWhereConditions(queryBuilder, conditions);
      const result = await query.count({ count: '*' }).first();
      return parseInt(result.count, 10);
    } catch (error) {
      this.handleDatabaseError(error, 'count');
    }
  }

  /**
   * Checks if an entity exists matching the provided conditions
   * 
   * @param conditions Where conditions
   * @param options Repository options
   * @returns True if a matching entity exists
   */
  async exists(conditions: WhereCondition, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Checking if ${this.tableName} record exists with conditions`, { conditions });
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const query = this.applyWhereConditions(queryBuilder, conditions);
      const result = await query.select(1).first();
      return !!result;
    } catch (error) {
      this.handleDatabaseError(error, 'exists');
    }
  }

  /**
   * Applies where conditions to a query builder
   * 
   * @param queryBuilder Query builder to apply conditions to
   * @param conditions Where conditions
   * @returns The query builder with conditions applied
   */
  protected applyWhereConditions(queryBuilder: QueryBuilder, conditions: WhereCondition): QueryBuilder {
    if (!conditions || Object.keys(conditions).length === 0) {
      return queryBuilder;
    }
    
    if (Array.isArray(conditions)) {
      // Handle array of conditions
      conditions.forEach(condition => {
        if (typeof condition === 'object' && condition !== null) {
          Object.entries(condition).forEach(([key, value]) => {
            if (value === null) {
              queryBuilder.whereNull(key);
            } else {
              queryBuilder.where(key, value);
            }
          });
        }
      });
    } else if (typeof conditions === 'object' && conditions !== null) {
      // Handle object conditions
      Object.entries(conditions).forEach(([key, value]) => {
        if (value === null) {
          queryBuilder.whereNull(key);
        } else if (Array.isArray(value)) {
          queryBuilder.whereIn(key, value);
        } else {
          queryBuilder.where(key, value);
        }
      });
    }
    
    return queryBuilder;
  }

  /**
   * Applies pagination to a query builder
   * 
   * @param queryBuilder Query builder to apply pagination to
   * @param pagination Pagination options
   * @returns The query builder with pagination applied
   */
  protected applyPagination(queryBuilder: QueryBuilder, pagination: Pagination): QueryBuilder {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    return queryBuilder.limit(limit).offset(offset);
  }

  /**
   * Applies sorting to a query builder
   * 
   * @param queryBuilder Query builder to apply sorting to
   * @param orderBy Sorting options
   * @returns The query builder with sorting applied
   */
  protected applyOrderBy(queryBuilder: QueryBuilder, orderBy: OrderBy[]): QueryBuilder {
    if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) {
      // Default to ordering by primary key
      return queryBuilder.orderBy(this.primaryKey);
    }
    
    orderBy.forEach(({ column, direction }) => {
      queryBuilder.orderBy(column, direction);
    });
    
    return queryBuilder;
  }

  /**
   * Handles database errors with proper error translation
   * 
   * @param error The error to handle
   * @param operation The operation that caused the error
   * @throws DatabaseError with contextual information
   */
  protected handleDatabaseError(error: Error, operation: string): never {
    logger.error(`Database error in ${operation} operation on ${this.tableName}`, { error });
    
    throw new DatabaseError(`Database error in ${operation} operation`, {
      operation,
      entity: this.tableName,
      message: error.message
    }, error);
  }
}