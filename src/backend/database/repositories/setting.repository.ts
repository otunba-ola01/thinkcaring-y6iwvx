import { BaseRepository } from './base.repository';
import { 
  Setting, 
  CreateSettingDto, 
  UpdateSettingDto,
  SettingCategory,
  SettingDataType,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_ORGANIZATION_SETTINGS
} from '../../models/setting.model';
import { UUID } from '../../types/common.types';
import { 
  PaginatedResult,
  Pagination,
  OrderBy,
  RepositoryOptions,
  Transaction
} from '../../types/database.types';
import { getKnexInstance } from '../connection';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for setting entity database operations
 */
class SettingRepository extends BaseRepository<Setting> {
  /**
   * Creates a new SettingRepository instance
   */
  constructor() {
    // Call the parent BaseRepository constructor with 'settings' table name
    super('settings', 'id', false); // Disable soft delete for settings
  }

  /**
   * Finds a setting by its unique key
   *
   * @param key Setting key
   * @param options Repository options
   * @returns Setting if found, null otherwise
   */
  async findByKey(key: string, options: RepositoryOptions = {}): Promise<Setting | null> {
    try {
      logger.debug(`Finding setting by key: ${key}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      const result = await queryBuilder.where('key', key).first();
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByKey');
    }
  }

  /**
   * Finds settings by category with pagination and sorting
   *
   * @param category Setting category
   * @param pagination Pagination parameters
   * @param orderBy Sorting parameters
   * @param options Repository options
   * @returns Paginated list of settings
   */
  async findByCategory(
    category: SettingCategory,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [{ column: 'key', direction: 'ASC' }],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Setting>> {
    try {
      logger.debug(`Finding settings by category: ${category}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply where condition for category
      const query = queryBuilder.where('category', category);
      
      // Create count query
      const countQuery = this.getQueryBuilder(options.transaction).where('category', category);
      
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
        data: data as Setting[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findByCategory');
    }
  }

  /**
   * Finds user-specific preference settings
   *
   * @param userId User ID
   * @param options Repository options
   * @returns List of user preference settings
   */
  async findByUserPreferences(userId: UUID, options: RepositoryOptions = {}): Promise<Setting[]> {
    try {
      logger.debug(`Finding user preference settings for user: ${userId}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      const result = await queryBuilder
        .where('category', SettingCategory.USER)
        .whereRaw("metadata->>'userId' = ?", [userId]);
      
      return result as Setting[];
    } catch (error) {
      this.handleDatabaseError(error, 'findByUserPreferences');
    }
  }

  /**
   * Creates a new setting
   *
   * @param settingData Setting data to create
   * @param options Repository options
   * @returns Created setting
   */
  async createSetting(settingData: CreateSettingDto, options: RepositoryOptions = {}): Promise<Setting> {
    try {
      logger.debug(`Creating new setting with key: ${settingData.key}`);
      
      // Check if setting with the same key already exists
      const existingSettings = await this.findByKey(settingData.key, options);
      if (existingSettings) {
        throw new DatabaseError(`Setting with key '${settingData.key}' already exists`, {
          operation: 'createSetting',
          entity: this.tableName,
          code: 'DUPLICATE_KEY'
        });
      }
      
      // Create the setting
      return this.create(settingData as Partial<Setting>, options);
    } catch (error) {
      this.handleDatabaseError(error, 'createSetting');
    }
  }

  /**
   * Updates an existing setting
   *
   * @param key Setting key
   * @param updateData Setting data to update
   * @param options Repository options
   * @returns Updated setting
   */
  async updateSetting(key: string, updateData: UpdateSettingDto, options: RepositoryOptions = {}): Promise<Setting> {
    try {
      logger.debug(`Updating setting with key: ${key}`);
      
      // Find the setting by key
      const setting = await this.findByKey(key, options);
      if (!setting) {
        throw new DatabaseError(`Setting with key '${key}' not found`, {
          operation: 'updateSetting',
          entity: this.tableName
        });
      }
      
      // Update the setting
      return this.update(setting.id, updateData as Partial<Setting>, options);
    } catch (error) {
      this.handleDatabaseError(error, 'updateSetting');
    }
  }

  /**
   * Deletes a setting by key
   *
   * @param key Setting key
   * @param options Repository options
   * @returns True if setting was deleted successfully
   */
  async deleteSetting(key: string, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Deleting setting with key: ${key}`);
      
      // Find the setting by key
      const setting = await this.findByKey(key, options);
      if (!setting) {
        return false;
      }
      
      // Delete the setting
      return this.delete(setting.id, options);
    } catch (error) {
      this.handleDatabaseError(error, 'deleteSetting');
    }
  }

  /**
   * Gets a setting value with proper type conversion based on its dataType
   *
   * @param setting Setting object
   * @returns Setting value converted to its proper type
   */
  getTypedValue(setting: Setting): any {
    try {
      switch (setting.dataType) {
        case SettingDataType.STRING:
          return setting.value;
        case SettingDataType.NUMBER:
          return parseFloat(setting.value);
        case SettingDataType.BOOLEAN:
          return setting.value === 'true';
        case SettingDataType.JSON:
          return JSON.parse(setting.value);
        case SettingDataType.DATE:
          return new Date(setting.value);
        default:
          return setting.value;
      }
    } catch (error) {
      logger.error(`Error converting setting value for key: ${setting.key}`, { error });
      return setting.value; // Return original value if conversion fails
    }
  }

  /**
   * Gets a setting value by key with proper type conversion
   *
   * @param key Setting key
   * @param defaultValue Default value if setting not found
   * @param options Repository options
   * @returns Setting value or default value if not found
   */
  async getSettingValue(key: string, defaultValue: any = null, options: RepositoryOptions = {}): Promise<any> {
    try {
      const setting = await this.findByKey(key, options);
      if (!setting) {
        return defaultValue;
      }
      
      return this.getTypedValue(setting);
    } catch (error) {
      this.handleDatabaseError(error, 'getSettingValue');
    }
  }

  /**
   * Creates multiple settings in a single transaction
   *
   * @param settingsData Array of setting data
   * @param options Repository options
   * @returns Array of created settings
   */
  async bulkCreateSettings(settingsData: CreateSettingDto[], options: RepositoryOptions = {}): Promise<Setting[]> {
    // Get database instance
    const knex = getKnexInstance();
    
    // Determine if we need to create a new transaction or use an existing one
    const shouldManageTransaction = !options.transaction;
    const transaction = options.transaction || await knex.transaction();
    
    try {
      logger.debug(`Creating ${settingsData.length} settings in bulk`);
      
      const createdSettings: Setting[] = [];
      
      // Create each setting
      for (const settingData of settingsData) {
        const setting = await this.createSetting(settingData, { 
          ...options, 
          transaction 
        });
        createdSettings.push(setting);
      }
      
      // Commit transaction if we created it
      if (shouldManageTransaction) {
        await transaction.commit();
      }
      
      return createdSettings;
    } catch (error) {
      // Rollback transaction if we created it
      if (shouldManageTransaction) {
        await transaction.rollback();
      }
      
      this.handleDatabaseError(error, 'bulkCreateSettings');
    }
  }

  /**
   * Initializes default system and organization settings if they don't exist
   *
   * @param options Repository options
   */
  async initializeDefaultSettings(options: RepositoryOptions = {}): Promise<void> {
    // Get database instance
    const knex = getKnexInstance();
    
    // Determine if we need to create a new transaction or use an existing one
    const shouldManageTransaction = !options.transaction;
    const transaction = options.transaction || await knex.transaction();
    
    try {
      logger.debug('Initializing default settings');
      
      // Check if system settings exist
      const systemSettingsCount = await this.getQueryBuilder(transaction)
        .where('category', SettingCategory.SYSTEM)
        .count('id as count')
        .first();
      
      // Create default system settings if none exist
      if (parseInt(systemSettingsCount.count, 10) === 0) {
        logger.info('Creating default system settings');
        await this.bulkCreateSettings(DEFAULT_SYSTEM_SETTINGS, { 
          ...options, 
          transaction 
        });
      }
      
      // Check if organization settings exist
      const orgSettingsCount = await this.getQueryBuilder(transaction)
        .where('category', SettingCategory.ORGANIZATION)
        .count('id as count')
        .first();
      
      // Create default organization settings if none exist
      if (parseInt(orgSettingsCount.count, 10) === 0) {
        logger.info('Creating default organization settings');
        await this.bulkCreateSettings(DEFAULT_ORGANIZATION_SETTINGS, { 
          ...options, 
          transaction 
        });
      }
      
      // Commit transaction if we created it
      if (shouldManageTransaction) {
        await transaction.commit();
      }
      
      logger.info('Default settings initialization complete');
    } catch (error) {
      // Rollback transaction if we created it
      if (shouldManageTransaction) {
        await transaction.rollback();
      }
      
      this.handleDatabaseError(error, 'initializeDefaultSettings');
    }
  }
}

// Create a singleton instance of the repository
export const settingRepository = new SettingRepository();