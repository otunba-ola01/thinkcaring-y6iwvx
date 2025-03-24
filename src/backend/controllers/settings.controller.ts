import { Response, NextFunction } from 'express'; // express 4.18+
import { 
  settingsService 
} from '../services/settings.service';
import { 
  Request, 
  RequestWithParams, 
  RequestWithQuery, 
  RequestWithBody, 
  RequestWithParamsAndBody 
} from '../types/request.types';
import { 
  SuccessResponse, 
  EmptyResponse 
} from '../types/response.types';
import { 
  Setting, 
  CreateSettingDto, 
  UpdateSettingDto, 
  SettingCategory 
} from '../models/setting.model';
import { 
  logger 
} from '../utils/logger';
import { 
  PaginationParams, 
  SortParams 
} from '../types/common.types';
import { 
  OrderBy 
} from '../types/database.types';
import { ValidationError } from '../errors/validation-error';
import { NotFoundError } from '../errors/not-found-error';

/**
 * Retrieves all settings with pagination and sorting
 */
async function getSettings(
  req: RequestWithQuery<{ category?: string; pagination?: PaginationParams; sort?: SortParams }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('Getting settings with query parameters', {
      query: req.query
    });

    const { category, pagination = { page: 1, limit: 25 }, sort } = req.query;
    
    // Convert sort parameters to OrderBy format
    let orderBy: OrderBy[] = [];
    if (sort) {
      orderBy = [{
        column: sort.sortBy,
        direction: sort.sortDirection === 'desc' ? 'DESC' : 'ASC'
      }];
    }

    // Get settings for the specified category, or all settings if no category provided
    const result = await settingsService.getSettingsByCategory(
      category ? (SettingCategory[category as keyof typeof SettingCategory] || category as SettingCategory) : SettingCategory.SYSTEM,
      pagination,
      orderBy
    );
    
    res.json(SuccessResponse({
      settings: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalItems: result.total,
        totalPages: result.totalPages
      }
    }));
  } catch (error) {
    logger.error('Error getting settings', { error });
    next(error);
  }
}

/**
 * Retrieves settings by category with pagination and sorting
 */
async function getSettingsByCategory(
  req: RequestWithParamsAndBody<{ category: string }, { pagination?: PaginationParams; sort?: SortParams }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category } = req.params;
    const { pagination = { page: 1, limit: 25 }, sort } = req.body;
    
    logger.debug(`Getting settings for category: ${category}`, {
      pagination,
      sort
    });

    // Convert sort parameters to OrderBy format
    let orderBy: OrderBy[] = [];
    if (sort) {
      orderBy = [{
        column: sort.sortBy,
        direction: sort.sortDirection === 'desc' ? 'DESC' : 'ASC'
      }];
    }

    const settingCategory = SettingCategory[category as keyof typeof SettingCategory] || category as SettingCategory;
    
    const result = await settingsService.getSettingsByCategory(
      settingCategory,
      pagination,
      orderBy
    );
    
    res.json(SuccessResponse({
      settings: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalItems: result.total,
        totalPages: result.totalPages
      }
    }));
  } catch (error) {
    logger.error(`Error getting settings for category: ${req.params.category}`, { error });
    next(error);
  }
}

/**
 * Retrieves a single setting by key
 */
async function getSetting(
  req: RequestWithParams<{ key: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.params;
    logger.debug(`Getting setting with key: ${key}`);

    const setting = await settingsService.getSetting(key);
    
    if (setting === null) {
      throw new NotFoundError(`Setting with key ${key} not found`, 'setting', key);
    }
    
    res.json(SuccessResponse({ key, value: setting }));
  } catch (error) {
    logger.error(`Error getting setting with key: ${req.params.key}`, { error });
    next(error);
  }
}

/**
 * Creates a new setting or updates if it already exists
 */
async function createOrUpdateSetting(
  req: RequestWithBody<CreateSettingDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settingData = req.body;
    logger.debug('Creating or updating setting', { settingData });

    // Validate required fields
    if (!settingData.key || !settingData.category || settingData.value === undefined) {
      throw new ValidationError({
        message: 'Missing required fields',
        validationErrors: [
          {
            field: !settingData.key ? 'key' : !settingData.category ? 'category' : 'value',
            message: 'This field is required',
            value: null,
            code: 'REQUIRED_FIELD'
          }
        ]
      });
    }

    // Check if the setting already exists
    const existingSetting = await settingsService.getSetting(settingData.key, null);
    
    let result;
    if (existingSetting !== null) {
      // Update existing setting
      result = await settingsService.updateSetting(settingData.key, {
        value: String(settingData.value),
        description: settingData.description,
        isEditable: settingData.isEditable,
        isHidden: settingData.isHidden,
        metadata: settingData.metadata
      });
      logger.info(`Updated setting: ${settingData.key}`);
    } else {
      // Create new setting
      result = await settingsService.createSetting(settingData);
      logger.info(`Created setting: ${settingData.key}`);
    }
    
    res.status(existingSetting !== null ? 200 : 201).json(SuccessResponse(
      result,
      existingSetting !== null ? 'Setting updated successfully' : 'Setting created successfully'
    ));
  } catch (error) {
    logger.error('Error creating or updating setting', { error, data: req.body });
    next(error);
  }
}

/**
 * Updates an existing setting by key
 */
async function updateSetting(
  req: RequestWithParamsAndBody<{ key: string }, UpdateSettingDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.params;
    const updateData = req.body;
    
    logger.debug(`Updating setting with key: ${key}`, { updateData });

    const updatedSetting = await settingsService.updateSetting(key, updateData);
    
    res.json(SuccessResponse(updatedSetting, 'Setting updated successfully'));
  } catch (error) {
    logger.error(`Error updating setting with key: ${req.params.key}`, { error, data: req.body });
    next(error);
  }
}

/**
 * Deletes a setting by key
 */
async function deleteSetting(
  req: RequestWithParams<{ key: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.params;
    logger.debug(`Deleting setting with key: ${key}`);

    const result = await settingsService.deleteSetting(key);
    
    if (!result) {
      throw new NotFoundError(`Setting with key ${key} not found`, 'setting', key);
    }
    
    res.json(EmptyResponse('Setting deleted successfully'));
  } catch (error) {
    logger.error(`Error deleting setting with key: ${req.params.key}`, { error });
    next(error);
  }
}

/**
 * Updates multiple settings in a single operation
 */
async function bulkUpdateSettings(
  req: RequestWithBody<{ settings: Array<{ key: string; value: string }> }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { settings } = req.body;
    logger.debug('Bulk updating settings', { count: settings?.length });

    // Validate settings array
    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      throw new ValidationError({
        message: 'Invalid settings data',
        validationErrors: [
          {
            field: 'settings',
            message: 'Settings must be a non-empty array',
            value: settings,
            code: 'INVALID_FORMAT'
          }
        ]
      });
    }

    // Track success and failures
    const results = {
      successful: 0,
      failed: 0,
      failures: [] as { key: string; error: string }[]
    };

    // Update each setting
    for (const setting of settings) {
      try {
        if (!setting.key) {
          results.failed++;
          results.failures.push({ key: 'unknown', error: 'Missing key' });
          continue;
        }

        await settingsService.updateSetting(setting.key, { value: setting.value });
        results.successful++;
      } catch (error) {
        results.failed++;
        results.failures.push({ 
          key: setting.key, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    res.json(SuccessResponse({
      results: {
        successful: results.successful,
        failed: results.failed,
        total: settings.length
      },
      failures: results.failures.length > 0 ? results.failures : undefined
    }, `Updated ${results.successful} of ${settings.length} settings`));
  } catch (error) {
    logger.error('Error bulk updating settings', { error, data: req.body });
    next(error);
  }
}

/**
 * Retrieves all organization settings
 */
async function getOrganizationSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('Getting organization settings');

    const result = await settingsService.getSettingsByCategory(
      SettingCategory.ORGANIZATION,
      { page: 1, limit: 100 } // Get all organization settings
    );
    
    // Transform settings into a more user-friendly format
    const organizationSettings = result.data.reduce((acc, setting) => {
      // Remove the organization prefix from keys
      const keyWithoutPrefix = setting.key.startsWith('organization.') 
        ? setting.key.substring('organization.'.length) 
        : setting.key;
      
      // Parse JSON values
      let value = setting.value;
      try {
        if (setting.dataType === 'json') {
          value = JSON.parse(value);
        } else if (setting.dataType === 'boolean') {
          value = value === 'true';
        } else if (setting.dataType === 'number') {
          value = parseFloat(value);
        }
      } catch (e) {
        // Keep original value if parsing fails
      }
      
      acc[keyWithoutPrefix] = value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(SuccessResponse(organizationSettings));
  } catch (error) {
    logger.error('Error getting organization settings', { error });
    next(error);
  }
}

/**
 * Updates organization settings
 */
async function updateOrganizationSettings(
  req: RequestWithBody<Record<string, any>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = req.body;
    logger.debug('Updating organization settings', { settings });

    const updatedSettings: Record<string, any> = {};
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Add organization prefix if not present
      const fullKey = key.startsWith('organization.') ? key : `organization.${key}`;
      
      try {
        // Try to update existing setting
        await settingsService.updateSetting(fullKey, { 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        });
      } catch (error) {
        // If not found, create it
        if (error instanceof NotFoundError) {
          await settingsService.createSetting({
            key: fullKey,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: `Organization setting: ${key}`,
            category: SettingCategory.ORGANIZATION,
            dataType: typeof value === 'object' ? 'json' :
                    typeof value === 'boolean' ? 'boolean' : 
                    typeof value === 'number' ? 'number' : 'string',
            isEditable: true,
            isHidden: false,
            metadata: {}
          });
        } else {
          throw error;
        }
      }
      
      updatedSettings[key] = value;
    }
    
    res.json(SuccessResponse(updatedSettings, 'Organization settings updated successfully'));
  } catch (error) {
    logger.error('Error updating organization settings', { error, data: req.body });
    next(error);
  }
}

/**
 * Retrieves all system settings
 */
async function getSystemSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('Getting system settings');

    const result = await settingsService.getSettingsByCategory(
      SettingCategory.SYSTEM,
      { page: 1, limit: 100 } // Get all system settings
    );
    
    // Transform settings into a more user-friendly format
    const systemSettings = result.data.reduce((acc, setting) => {
      // Remove the system prefix from keys
      const keyWithoutPrefix = setting.key.startsWith('system.') 
        ? setting.key.substring('system.'.length) 
        : setting.key;
      
      // Parse JSON values
      let value = setting.value;
      try {
        if (setting.dataType === 'json') {
          value = JSON.parse(value);
        } else if (setting.dataType === 'boolean') {
          value = value === 'true';
        } else if (setting.dataType === 'number') {
          value = parseFloat(value);
        }
      } catch (e) {
        // Keep original value if parsing fails
      }
      
      acc[keyWithoutPrefix] = value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(SuccessResponse(systemSettings));
  } catch (error) {
    logger.error('Error getting system settings', { error });
    next(error);
  }
}

/**
 * Updates system settings
 */
async function updateSystemSettings(
  req: RequestWithBody<Record<string, any>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = req.body;
    logger.debug('Updating system settings', { settings });

    const updatedSettings: Record<string, any> = {};
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Add system prefix if not present
      const fullKey = key.startsWith('system.') ? key : `system.${key}`;
      
      try {
        // Try to update existing setting
        await settingsService.updateSetting(fullKey, { 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value) 
        });
      } catch (error) {
        // If not found, create it
        if (error instanceof NotFoundError) {
          await settingsService.createSetting({
            key: fullKey,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: `System setting: ${key}`,
            category: SettingCategory.SYSTEM,
            dataType: typeof value === 'object' ? 'json' :
                    typeof value === 'boolean' ? 'boolean' : 
                    typeof value === 'number' ? 'number' : 'string',
            isEditable: true,
            isHidden: false,
            metadata: {}
          });
        } else {
          throw error;
        }
      }
      
      updatedSettings[key] = value;
    }
    
    res.json(SuccessResponse(updatedSettings, 'System settings updated successfully'));
  } catch (error) {
    logger.error('Error updating system settings', { error, data: req.body });
    next(error);
  }
}

/**
 * Retrieves settings for the current user
 */
async function getUserSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ValidationError({
        message: 'User ID is required',
        validationErrors: [
          {
            field: 'userId',
            message: 'User ID is required',
            value: null,
            code: 'REQUIRED_FIELD'
          }
        ]
      });
    }

    logger.debug(`Getting user settings for user: ${userId}`);

    const userSettings = await settingsService.getUserSettings(userId);
    
    // Transform settings into a more user-friendly format
    const formattedSettings = userSettings.reduce((acc, setting) => {
      // Remove the user prefix from keys
      const keyWithoutPrefix = setting.key.startsWith('user.') 
        ? setting.key.substring('user.'.length) 
        : setting.key;
      
      // Parse JSON values
      let value = setting.value;
      try {
        if (setting.dataType === 'json') {
          value = JSON.parse(value);
        } else if (setting.dataType === 'boolean') {
          value = value === 'true';
        } else if (setting.dataType === 'number') {
          value = parseFloat(value);
        }
      } catch (e) {
        // Keep original value if parsing fails
      }
      
      acc[keyWithoutPrefix] = value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(SuccessResponse(formattedSettings));
  } catch (error) {
    logger.error('Error getting user settings', { error, userId: req.user?.id });
    next(error);
  }
}

/**
 * Updates settings for the current user
 */
async function updateUserSettings(
  req: RequestWithBody<Record<string, any>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ValidationError({
        message: 'User ID is required',
        validationErrors: [
          {
            field: 'userId',
            message: 'User ID is required',
            value: null,
            code: 'REQUIRED_FIELD'
          }
        ]
      });
    }

    const settings = req.body;
    logger.debug(`Updating user settings for user: ${userId}`, { settings });

    const updatedSettings: Record<string, any> = {};
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Add user prefix if not present
      const fullKey = key.startsWith('user.') ? key : `user.${key}`;
      
      try {
        // Try to update existing setting
        await settingsService.updateSetting(fullKey, { 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          metadata: { userId }
        });
      } catch (error) {
        // If not found, create it
        if (error instanceof NotFoundError) {
          await settingsService.createSetting({
            key: fullKey,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: `User setting: ${key}`,
            category: SettingCategory.USER,
            dataType: typeof value === 'object' ? 'json' :
                    typeof value === 'boolean' ? 'boolean' : 
                    typeof value === 'number' ? 'number' : 'string',
            isEditable: true,
            isHidden: false,
            metadata: { userId }
          });
        } else {
          throw error;
        }
      }
      
      updatedSettings[key] = value;
    }
    
    res.json(SuccessResponse(updatedSettings, 'User settings updated successfully'));
  } catch (error) {
    logger.error('Error updating user settings', { error, userId: req.user?.id, data: req.body });
    next(error);
  }
}

/**
 * Retrieves notification settings for the current user
 */
async function getNotificationSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ValidationError({
        message: 'User ID is required',
        validationErrors: [
          {
            field: 'userId',
            message: 'User ID is required',
            value: null,
            code: 'REQUIRED_FIELD'
          }
        ]
      });
    }

    logger.debug(`Getting notification settings for user: ${userId}`);

    const result = await settingsService.getSettingsByCategory(
      SettingCategory.NOTIFICATION,
      { page: 1, limit: 100 } // Get all notification settings
    );
    
    // Filter settings relevant to the current user
    const userNotificationSettings = result.data.filter(setting => {
      return !setting.metadata.userId || setting.metadata.userId === userId;
    });
    
    // Transform settings into a more user-friendly format
    const formattedSettings = userNotificationSettings.reduce((acc, setting) => {
      // Remove the notification prefix from keys
      const keyWithoutPrefix = setting.key.startsWith('notification.') 
        ? setting.key.substring('notification.'.length) 
        : setting.key;
      
      // Parse JSON values
      let value = setting.value;
      try {
        if (setting.dataType === 'json') {
          value = JSON.parse(value);
        } else if (setting.dataType === 'boolean') {
          value = value === 'true';
        } else if (setting.dataType === 'number') {
          value = parseFloat(value);
        }
      } catch (e) {
        // Keep original value if parsing fails
      }
      
      acc[keyWithoutPrefix] = value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(SuccessResponse(formattedSettings));
  } catch (error) {
    logger.error('Error getting notification settings', { error, userId: req.user?.id });
    next(error);
  }
}

/**
 * Updates notification settings for the current user
 */
async function updateNotificationSettings(
  req: RequestWithBody<Record<string, any>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ValidationError({
        message: 'User ID is required',
        validationErrors: [
          {
            field: 'userId',
            message: 'User ID is required',
            value: null,
            code: 'REQUIRED_FIELD'
          }
        ]
      });
    }

    const settings = req.body;
    logger.debug(`Updating notification settings for user: ${userId}`, { settings });

    const updatedSettings: Record<string, any> = {};
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Add notification prefix if not present
      const fullKey = key.startsWith('notification.') ? key : `notification.${key}`;
      
      try {
        // Try to update existing setting
        await settingsService.updateSetting(fullKey, { 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          metadata: { userId }
        });
      } catch (error) {
        // If not found, create it
        if (error instanceof NotFoundError) {
          await settingsService.createSetting({
            key: fullKey,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: `Notification setting: ${key}`,
            category: SettingCategory.NOTIFICATION,
            dataType: typeof value === 'object' ? 'json' :
                    typeof value === 'boolean' ? 'boolean' : 
                    typeof value === 'number' ? 'number' : 'string',
            isEditable: true,
            isHidden: false,
            metadata: { userId }
          });
        } else {
          throw error;
        }
      }
      
      updatedSettings[key] = value;
    }
    
    res.json(SuccessResponse(updatedSettings, 'Notification settings updated successfully'));
  } catch (error) {
    logger.error('Error updating notification settings', { error, userId: req.user?.id, data: req.body });
    next(error);
  }
}

/**
 * Initializes default system and organization settings
 */
async function initializeDefaultSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('Initializing default settings');

    await settingsService.initializeSettings();
    
    res.json(EmptyResponse('Default settings initialized successfully'));
  } catch (error) {
    logger.error('Error initializing default settings', { error });
    next(error);
  }
}

// Export controller functions
export default {
  getSettings,
  getSettingsByCategory,
  getSetting,
  createOrUpdateSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
  getOrganizationSettings,
  updateOrganizationSettings,
  getSystemSettings,
  updateSystemSettings,
  getUserSettings,
  updateUserSettings,
  getNotificationSettings,
  updateNotificationSettings,
  initializeDefaultSettings
};