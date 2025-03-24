import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * Schema definition for a Setting object
 */
const settingSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the setting'
    },
    key: {
      type: 'string',
      description: 'Unique key for the setting'
    },
    value: {
      type: 'string',
      description: 'Setting value stored as string'
    },
    description: {
      type: 'string',
      description: 'Description of the setting'
    },
    category: {
      type: 'string',
      enum: ['SYSTEM', 'ORGANIZATION', 'USER', 'NOTIFICATION', 'INTEGRATION', 'BILLING', 'REPORTING'],
      description: 'Category of the setting'
    },
    dataType: {
      type: 'string',
      enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE'],
      description: 'Data type of the setting value'
    },
    isEditable: {
      type: 'boolean',
      description: 'Whether the setting can be edited by users'
    },
    isHidden: {
      type: 'boolean',
      description: 'Whether the setting should be hidden in the UI'
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata for the setting'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the setting was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the setting was last updated'
    }
  },
  required: ['id', 'key', 'value', 'category', 'dataType']
};

/**
 * Schema for creating a new setting
 */
const createSettingRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    key: {
      type: 'string',
      description: 'Unique key for the setting'
    },
    value: {
      type: 'string',
      description: 'Setting value stored as string'
    },
    description: {
      type: 'string',
      description: 'Description of the setting'
    },
    category: {
      type: 'string',
      enum: ['SYSTEM', 'ORGANIZATION', 'USER', 'NOTIFICATION', 'INTEGRATION', 'BILLING', 'REPORTING'],
      description: 'Category of the setting'
    },
    dataType: {
      type: 'string',
      enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE'],
      description: 'Data type of the setting value'
    },
    isEditable: {
      type: 'boolean',
      description: 'Whether the setting can be edited by users',
      default: true
    },
    isHidden: {
      type: 'boolean',
      description: 'Whether the setting should be hidden in the UI',
      default: false
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata for the setting'
    }
  },
  required: ['key', 'value', 'category', 'dataType']
};

/**
 * Schema for updating an existing setting
 */
const updateSettingRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    value: {
      type: 'string',
      description: 'Setting value stored as string'
    },
    description: {
      type: 'string',
      description: 'Description of the setting'
    },
    isEditable: {
      type: 'boolean',
      description: 'Whether the setting can be edited by users'
    },
    isHidden: {
      type: 'boolean',
      description: 'Whether the setting should be hidden in the UI'
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata for the setting'
    }
  },
  required: ['value']
};

/**
 * Schema for bulk updating multiple settings
 */
const bulkUpdateSettingsRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    settings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Setting key'
          },
          value: {
            type: 'string',
            description: 'Setting value'
          }
        },
        required: ['key', 'value']
      },
      minItems: 1
    }
  },
  required: ['settings']
};

/**
 * Response schema for a single setting
 */
const settingResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      $ref: '#/components/schemas/Setting'
    }
  },
  required: ['data']
};

/**
 * Response schema for a list of settings
 */
const settingsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Setting'
      }
    }
  },
  required: ['data']
};

/**
 * Response schema for organization settings
 */
const organizationSettingsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      example: {
        organizationName: 'HCBS Provider Inc.',
        organizationLogo: 'https://example.com/logo.png',
        contactEmail: 'info@example.com',
        contactPhone: '555-123-4567',
        address: '123 Main St, Anytown, USA'
      }
    }
  },
  required: ['data']
};

/**
 * Response schema for system settings
 */
const systemSettingsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      example: {
        defaultPaginationLimit: '20',
        sessionTimeout: '15',
        passwordExpiryDays: '90',
        mfaRequired: 'true',
        fileUploadSizeLimit: '10485760'
      }
    }
  },
  required: ['data']
};

/**
 * Response schema for user settings
 */
const userSettingsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      example: {
        theme: 'dark',
        dashboardLayout: 'compact',
        defaultDateRange: '30',
        timezone: 'America/New_York',
        language: 'en-US'
      }
    }
  },
  required: ['data']
};

/**
 * Response schema for notification settings
 */
const notificationSettingsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      example: {
        emailNotifications: 'true',
        smsNotifications: 'false',
        inAppNotifications: 'true',
        claimDenialAlerts: 'true',
        paymentReceivedAlerts: 'true',
        authorizationExpiryAlerts: 'true',
        reportCompletionAlerts: 'true',
        digestFrequency: 'daily'
      }
    }
  },
  required: ['data']
};

/**
 * Settings API path definitions
 */
const settingsPaths: OpenAPIV3.PathsObject = {
  '/settings': {
    get: {
      tags: ['Settings'],
      summary: 'Get all settings',
      description: 'Retrieves all settings with optional filtering by category and pagination',
      operationId: 'getSettings',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        {
          name: 'category',
          in: 'query',
          description: 'Filter settings by category',
          schema: {
            type: 'string',
            enum: ['SYSTEM', 'ORGANIZATION', 'USER', 'NOTIFICATION', 'INTEGRATION', 'BILLING', 'REPORTING']
          }
        }
      ],
      responses: {
        '200': {
          description: 'Settings retrieved successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Setting' }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    post: {
      tags: ['Settings'],
      summary: 'Create or update setting',
      description: 'Creates a new setting or updates an existing one if the key already exists',
      operationId: 'createOrUpdateSetting',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateSettingRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Setting created or updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SettingResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/category/{category}': {
    get: {
      tags: ['Settings'],
      summary: 'Get settings by category',
      description: 'Retrieves settings filtered by the specified category',
      operationId: 'getSettingsByCategory',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'category',
          in: 'path',
          required: true,
          description: 'Setting category',
          schema: {
            type: 'string',
            enum: ['SYSTEM', 'ORGANIZATION', 'USER', 'NOTIFICATION', 'INTEGRATION', 'BILLING', 'REPORTING']
          }
        },
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' }
      ],
      responses: {
        '200': {
          description: 'Settings retrieved successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Setting' }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Invalid category',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/{key}': {
    get: {
      tags: ['Settings'],
      summary: 'Get setting by key',
      description: 'Retrieves a single setting by its unique key',
      operationId: 'getSetting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'key',
          in: 'path',
          required: true,
          description: 'Setting key',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Setting retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SettingResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '404': {
          description: 'Setting not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update setting',
      description: 'Updates an existing setting by its key',
      operationId: 'updateSetting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'key',
          in: 'path',
          required: true,
          description: 'Setting key',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateSettingRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Setting updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SettingResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '404': {
          description: 'Setting not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Settings'],
      summary: 'Delete setting',
      description: 'Deletes a setting by its key',
      operationId: 'deleteSetting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'key',
          in: 'path',
          required: true,
          description: 'Setting key',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Setting deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '404': {
          description: 'Setting not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/bulk': {
    put: {
      tags: ['Settings'],
      summary: 'Bulk update settings',
      description: 'Updates multiple settings in a single operation',
      operationId: 'bulkUpdateSettings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BulkUpdateSettingsRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Settings updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  updated: {
                    type: 'integer',
                    description: 'Number of settings updated successfully',
                    example: 5
                  },
                  failed: {
                    type: 'integer',
                    description: 'Number of settings that failed to update',
                    example: 0
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/organization': {
    get: {
      tags: ['Settings'],
      summary: 'Get organization settings',
      description: 'Retrieves all organization settings',
      operationId: 'getOrganizationSettings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Organization settings retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationSettingsResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update organization settings',
      description: 'Updates organization settings',
      operationId: 'updateOrganizationSettings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              example: {
                organizationName: 'HCBS Provider Inc.',
                organizationLogo: 'https://example.com/logo.png',
                contactEmail: 'info@example.com',
                contactPhone: '555-123-4567',
                address: '123 Main St, Anytown, USA'
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Organization settings updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationSettingsResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/system': {
    get: {
      tags: ['Settings'],
      summary: 'Get system settings',
      description: 'Retrieves all system settings',
      operationId: 'getSystemSettings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'System settings retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SystemSettingsResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update system settings',
      description: 'Updates system settings',
      operationId: 'updateSystemSettings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              example: {
                defaultPaginationLimit: '20',
                sessionTimeout: '15',
                passwordExpiryDays: '90',
                mfaRequired: 'true',
                fileUploadSizeLimit: '10485760'
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'System settings updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SystemSettingsResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/user': {
    get: {
      tags: ['Settings'],
      summary: 'Get user settings',
      description: 'Retrieves settings for the current user',
      operationId: 'getUserSettings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User settings retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserSettingsResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update user settings',
      description: 'Updates settings for the current user',
      operationId: 'updateUserSettings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              example: {
                theme: 'dark',
                dashboardLayout: 'compact',
                defaultDateRange: '30',
                timezone: 'America/New_York',
                language: 'en-US'
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'User settings updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserSettingsResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/notifications': {
    get: {
      tags: ['Settings'],
      summary: 'Get notification settings',
      description: 'Retrieves notification settings for the current user',
      operationId: 'getNotificationSettings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Notification settings retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotificationSettingsResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update notification settings',
      description: 'Updates notification settings for the current user',
      operationId: 'updateNotificationSettings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              example: {
                emailNotifications: 'true',
                smsNotifications: 'false',
                inAppNotifications: 'true',
                claimDenialAlerts: 'true',
                paymentReceivedAlerts: 'true',
                authorizationExpiryAlerts: 'true',
                reportCompletionAlerts: 'true',
                digestFrequency: 'daily'
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Notification settings updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotificationSettingsResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/settings/initialize': {
    post: {
      tags: ['Settings'],
      summary: 'Initialize default settings',
      description: 'Initializes default system and organization settings',
      operationId: 'initializeDefaultSettings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Default settings initialized successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

export default settingsPaths;