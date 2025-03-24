/**
 * Settings Service
 * 
 * Provides business logic for managing system settings, organization settings, 
 * and user preferences in the HCBS Revenue Management System. This service 
 * handles CRUD operations for settings with caching support, type conversion, 
 * and validation.
 */

import { 
  Setting, 
  CreateSettingDto, 
  UpdateSettingDto, 
  SettingCategory,
  SettingDataType 
} from '../models/setting.model';
import { settingRepository } from '../database/repositories/setting.repository';
import { UUID } from '../types/common.types';
import { 
  PaginatedResult, 
  Pagination, 
  OrderBy, 
  RepositoryOptions 
} from '../types/database.types';
import { NotFoundError } from '../errors/not-found-error';
import { BusinessError } from '../errors/business-error';
import { logger } from '../utils/logger';
import { cache, CACHE_STORES } from '../utils/cache';

// Cache namespace for settings
const SETTINGS_CACHE_NAMESPACE = 'settings';

/**
 * Retrieves a setting by its key with proper type conversion
 * 
 * @param key Setting key to retrieve
 * @param defaultValue Default value to return if setting not found
 * @param options Repository options
 * @returns Setting value with proper type conversion or default value if not found
 */
async function getSetting(
  key: string,
  defaultValue: any = null,
  options: RepositoryOptions = {}
): Promise<any> {
  try {
    logger.debug(`Getting setting: ${key}`);
    
    // Generate cache key
    const cacheKey = `setting:${key}`;
    
    // Try to get from cache first
    const cachedValue = await cache.get(cacheKey, {
      namespace: SETTINGS_CACHE_NAMESPACE,
      storeName: CACHE_STORES.REFERENCE_DATA
    });
    
    if (cachedValue !== null) {
      logger.debug(`Cache hit for setting: ${key}`);
      return cachedValue;
    }
    
    // Cache miss, get from database
    logger.debug(`Cache miss for setting: ${key}, fetching from database`);
    const value = await settingRepository.getSettingValue(key, defaultValue, options);
    
    // Cache the result for next time
    if (value !== null) {
      await cache.set(cacheKey, value, {
        namespace: SETTINGS_CACHE_NAMESPACE,
        storeName: CACHE_STORES.REFERENCE_DATA,
        ttl: 3600 // Cache for 1 hour
      });
    }
    
    return value;
  } catch (error) {
    logger.error(`Error getting setting: ${key}`, { error });
    throw error;
  }
}

/**
 * Retrieves settings by category with pagination and sorting
 * 
 * @param category Category to filter by
 * @param pagination Pagination options
 * @param orderBy Sorting options
 * @param options Repository options
 * @returns Paginated list of settings in the specified category
 */
async function getSettingsByCategory(
  category: SettingCategory,
  pagination: Pagination = { page: 1, limit: 25 },
  orderBy: OrderBy[] = [],
  options: RepositoryOptions = {}
): Promise<PaginatedResult<Setting>> {
  try {
    logger.debug(`Getting settings by category: ${category}`);
    return await settingRepository.findByCategory(category, pagination, orderBy, options);
  } catch (error) {
    logger.error(`Error getting settings by category: ${category}`, { error });
    throw error;
  }
}

/**
 * Retrieves settings specific to a user
 * 
 * @param userId User ID to get settings for
 * @param options Repository options
 * @returns List of user-specific settings
 */
async function getUserSettings(
  userId: UUID,
  options: RepositoryOptions = {}
): Promise<Setting[]> {
  try {
    logger.debug(`Getting user settings for user: ${userId}`);
    return await settingRepository.findByUserPreferences(userId, options);
  } catch (error) {
    logger.error(`Error getting user settings for user: ${userId}`, { error });
    throw error;
  }
}

/**
 * Creates a new setting
 * 
 * @param settingData Setting data to create
 * @param options Repository options
 * @returns Created setting
 */
async function createSetting(
  settingData: CreateSettingDto,
  options: RepositoryOptions = {}
): Promise<Setting> {
  try {
    logger.debug(`Creating setting: ${settingData.key}`);
    
    // Validate required fields
    if (!settingData.key || !settingData.category || !settingData.dataType) {
      throw new BusinessError(
        'Key, category, and dataType are required', 
        { settingData },
        'INVALID_SETTING_DATA'
      );
    }
    
    // Create the setting
    const createdSetting = await settingRepository.createSetting(settingData, options);
    
    // Invalidate cache for this category
    await invalidateSettingsCache(settingData.category);
    
    logger.info(`Created setting: ${createdSetting.key}`);
    return createdSetting;
  } catch (error) {
    logger.error(`Error creating setting: ${settingData.key}`, { 
      error, 
      settingData 
    });
    throw error;
  }
}

/**
 * Updates an existing setting
 * 
 * @param key Setting key to update
 * @param updateData Data to update the setting with
 * @param options Repository options
 * @returns Updated setting
 */
async function updateSetting(
  key: string,
  updateData: UpdateSettingDto,
  options: RepositoryOptions = {}
): Promise<Setting> {
  try {
    logger.debug(`Updating setting: ${key}`);
    
    // Validate key
    if (!key) {
      throw new BusinessError(
        'Setting key is required',
        { key },
        'INVALID_SETTING_KEY'
      );
    }
    
    // Update the setting
    const updatedSetting = await settingRepository.updateSetting(key, updateData, options);
    
    if (!updatedSetting) {
      throw new NotFoundError(`Setting with key ${key} not found`, 'setting', key);
    }
    
    // Invalidate cache for this setting
    await invalidateSettingsCache(key);
    
    logger.info(`Updated setting: ${key}`);
    return updatedSetting;
  } catch (error) {
    logger.error(`Error updating setting: ${key}`, { 
      error, 
      key, 
      updateData 
    });
    throw error;
  }
}

/**
 * Deletes a setting by key
 * 
 * @param key Setting key to delete
 * @param options Repository options
 * @returns True if setting was deleted successfully
 */
async function deleteSetting(
  key: string,
  options: RepositoryOptions = {}
): Promise<boolean> {
  try {
    logger.debug(`Deleting setting: ${key}`);
    
    // Validate key
    if (!key) {
      throw new BusinessError(
        'Setting key is required',
        { key },
        'INVALID_SETTING_KEY'
      );
    }
    
    // Delete the setting
    const result = await settingRepository.deleteSetting(key, options);
    
    if (!result) {
      throw new NotFoundError(`Setting with key ${key} not found`, 'setting', key);
    }
    
    // Invalidate cache for this setting
    await invalidateSettingsCache(key);
    
    logger.info(`Deleted setting: ${key}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting setting: ${key}`, { error, key });
    throw error;
  }
}

/**
 * Initializes default system and organization settings if they don't exist
 * 
 * @param options Repository options
 */
async function initializeSettings(options: RepositoryOptions = {}): Promise<void> {
  try {
    logger.debug('Initializing default settings');
    await settingRepository.initializeDefaultSettings(options);
    
    // Invalidate settings cache to ensure fresh settings are fetched
    await invalidateSettingsCache();
    
    logger.info('Default settings initialized');
  } catch (error) {
    logger.error('Error initializing default settings', { error });
    throw error;
  }
}

/**
 * Invalidates the settings cache for a specific key or category
 * 
 * @param keyOrCategory Setting key or category to invalidate
 */
async function invalidateSettingsCache(keyOrCategory?: string): Promise<void> {
  try {
    if (keyOrCategory) {
      logger.debug(`Invalidating settings cache for: ${keyOrCategory}`);
      await cache.invalidateCache(`${SETTINGS_CACHE_NAMESPACE}:setting:${keyOrCategory}`);
    } else {
      logger.debug('Invalidating all settings cache');
      await cache.invalidateCache(SETTINGS_CACHE_NAMESPACE);
    }
  } catch (error) {
    logger.error('Error invalidating settings cache', { 
      error, 
      keyOrCategory 
    });
    // Don't throw an error here as cache operations shouldn't break main functionality
  }
}

// Export as a singleton service
export const settingsService = {
  getSetting,
  getSettingsByCategory,
  getUserSettings,
  createSetting,
  updateSetting,
  deleteSetting,
  initializeSettings,
  invalidateSettingsCache
};