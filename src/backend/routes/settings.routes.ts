import express from 'express'; // express 4.18+
import {
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
} from '../controllers/settings.controller'; // Import settings controller for route handlers
import {
  requireAuth,
  requirePermission,
  requirePermissionForAction
} from '../middleware/auth.middleware'; // Import authentication and authorization middleware
import {
  validateParams,
  validateBody,
  validateParamsAndBody
} from '../middleware/validation.middleware'; // Import validation middleware for request data validation
import {
  PermissionCategory,
  PermissionAction
} from '../types/users.types'; // Import permission enums for authorization checks
import { z } from 'zod'; // zod 3.21+

const router = express.Router(); // Express router instance for settings routes

const settingKeySchema = z.object({ key: z.string().min(1) }); // Zod schema for validating setting key parameter
const settingCategorySchema = z.object({ category: z.string().min(1) }); // Zod schema for validating setting category parameter
const createSettingSchema = z.object({ // Zod schema for validating create setting request body
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().min(1),
  dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE']),
  isEditable: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});
const updateSettingSchema = z.object({ // Zod schema for validating update setting request body
  value: z.string(),
  description: z.string().optional(),
  isEditable: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});
const bulkUpdateSettingsSchema = z.object({ // Zod schema for validating bulk update settings request body
  settings: z.array(z.object({ key: z.string().min(1), value: z.string() })).min(1)
});

/**
 * Configures and returns the Express router for settings management
 * @returns Configured Express router with settings routes
 */
function configureSettingsRoutes(): express.Router {
  // Route for getting all settings with optional filtering
  router.get('/', requireAuth, requirePermission('settings.view'), getSettings);

  // Route for getting settings by category
  router.get('/category/:category', requireAuth, requirePermission('settings.view'), validateParams(settingCategorySchema), getSettingsByCategory);

  // Route for getting a single setting by key
  router.get('/:key', requireAuth, requirePermission('settings.view'), validateParams(settingKeySchema), getSetting);

  // Route for creating a new setting or updating if it exists
  router.post('/', requireAuth, requirePermissionForAction(PermissionCategory.SETTINGS, PermissionAction.CREATE), validateBody(createSettingSchema), createOrUpdateSetting);

  // Route for updating an existing setting
  router.put('/:key', requireAuth, requirePermissionForAction(PermissionCategory.SETTINGS, PermissionAction.UPDATE), validateParamsAndBody(settingKeySchema, updateSettingSchema), updateSetting);

  // Route for deleting a setting
  router.delete('/:key', requireAuth, requirePermissionForAction(PermissionCategory.SETTINGS, PermissionAction.DELETE), validateParams(settingKeySchema), deleteSetting);

  // Route for updating multiple settings in a single operation
  router.put('/bulk', requireAuth, requirePermissionForAction(PermissionCategory.SETTINGS, PermissionAction.UPDATE), validateBody(bulkUpdateSettingsSchema), bulkUpdateSettings);

  // Route for getting all organization settings
  router.get('/organization', requireAuth, requirePermission('settings.view'), getOrganizationSettings);

  // Route for updating organization settings
  router.put('/organization', requireAuth, requirePermissionForAction(PermissionCategory.SETTINGS, PermissionAction.UPDATE), updateOrganizationSettings);

  // Route for getting all system settings
  router.get('/system', requireAuth, requirePermissionForAction(PermissionCategory.SYSTEM, PermissionAction.VIEW), getSystemSettings);

  // Route for updating system settings
  router.put('/system', requireAuth, requirePermissionForAction(PermissionCategory.SYSTEM, PermissionAction.UPDATE), updateSystemSettings);

  // Route for getting settings for the current user
  router.get('/user', requireAuth, getUserSettings);

  // Route for updating settings for the current user
  router.put('/user', requireAuth, updateUserSettings);

  // Route for getting notification settings for the current user
  router.get('/notifications', requireAuth, getNotificationSettings);

  // Route for updating notification settings for the current user
  router.put('/notifications', requireAuth, updateNotificationSettings);

  // Route for initializing default system and organization settings
  router.post('/initialize', requireAuth, requirePermissionForAction(PermissionCategory.SYSTEM, PermissionAction.MANAGE), initializeDefaultSettings);

  return router; // Return the configured router
}

export default configureSettingsRoutes(); // Export configured Express router with settings routes