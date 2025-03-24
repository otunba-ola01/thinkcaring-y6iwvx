import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * Schema for user profile data returned in responses
 */
const userProfileSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the user'
    },
    email: {
      type: 'string',
      format: 'email',
      description: "User's email address"
    },
    firstName: {
      type: 'string',
      description: "User's first name"
    },
    lastName: {
      type: 'string',
      description: "User's last name"
    },
    fullName: {
      type: 'string',
      description: "User's full name (firstName + lastName)"
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: "ID of the user's role"
    },
    roleName: {
      type: 'string',
      description: "Name of the user's role"
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED', 'PASSWORD_RESET'],
      description: 'Current status of the user account'
    },
    lastLogin: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: "Timestamp of the user's last login"
    },
    mfaEnabled: {
      type: 'boolean',
      description: 'Whether multi-factor authentication is enabled'
    },
    mfaMethod: {
      type: 'string',
      enum: ['APP', 'SMS', 'EMAIL'],
      nullable: true,
      description: 'MFA method if enabled'
    },
    authProvider: {
      type: 'string',
      enum: ['LOCAL', 'GOOGLE', 'MICROSOFT', 'OKTA'],
      description: 'Authentication provider for the user'
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          nullable: true,
          description: "User's phone number"
        },
        address: {
          type: 'object',
          nullable: true,
          properties: {
            line1: {
              type: 'string',
              description: 'Address line 1'
            },
            line2: {
              type: 'string',
              nullable: true,
              description: 'Address line 2'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State/Province'
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Country'
            }
          }
        }
      }
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the user was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the user was last updated'
    }
  },
  required: [
    'id',
    'email',
    'firstName',
    'lastName',
    'fullName',
    'roleId',
    'roleName',
    'status',
    'mfaEnabled',
    'authProvider',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Schema for create user request body
 */
const createUserRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: "User's email address"
    },
    firstName: {
      type: 'string',
      description: "User's first name"
    },
    lastName: {
      type: 'string',
      description: "User's last name"
    },
    password: {
      type: 'string',
      format: 'password',
      description: "User's initial password"
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: "ID of the user's role"
    },
    mfaEnabled: {
      type: 'boolean',
      description: 'Whether to enable MFA for the user',
      default: false
    },
    mfaMethod: {
      type: 'string',
      enum: ['APP', 'SMS', 'EMAIL'],
      nullable: true,
      description: 'MFA method if enabled'
    },
    passwordResetRequired: {
      type: 'boolean',
      description: 'Whether the user must reset their password on first login',
      default: true
    },
    authProvider: {
      type: 'string',
      enum: ['LOCAL', 'GOOGLE', 'MICROSOFT', 'OKTA'],
      description: 'Authentication provider for the user',
      default: 'LOCAL'
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          nullable: true,
          description: "User's phone number"
        },
        address: {
          type: 'object',
          nullable: true,
          properties: {
            line1: {
              type: 'string',
              description: 'Address line 1'
            },
            line2: {
              type: 'string',
              nullable: true,
              description: 'Address line 2'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State/Province'
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Country'
            }
          }
        }
      }
    }
  },
  required: ['email', 'firstName', 'lastName', 'password', 'roleId']
};

/**
 * Schema for update user request body
 */
const updateUserRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      description: "User's first name"
    },
    lastName: {
      type: 'string',
      description: "User's last name"
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: "ID of the user's role"
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          nullable: true,
          description: "User's phone number"
        },
        address: {
          type: 'object',
          nullable: true,
          properties: {
            line1: {
              type: 'string',
              description: 'Address line 1'
            },
            line2: {
              type: 'string',
              nullable: true,
              description: 'Address line 2'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State/Province'
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Country'
            }
          }
        }
      }
    }
  },
  required: ['firstName', 'lastName', 'roleId']
};

/**
 * Schema for update user status request
 */
const updateUserStatusRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED', 'PASSWORD_RESET'],
      description: 'New status for the user account'
    }
  },
  required: ['status']
};

/**
 * Schema for update user MFA request
 */
const updateUserMfaRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    mfaEnabled: {
      type: 'boolean',
      description: 'Whether MFA should be enabled'
    },
    mfaMethod: {
      type: 'string',
      enum: ['APP', 'SMS', 'EMAIL'],
      nullable: true,
      description: 'MFA method if enabled'
    }
  },
  required: ['mfaEnabled']
};

/**
 * Schema for reset password request
 */
const resetPasswordRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    newPassword: {
      type: 'string',
      format: 'password',
      description: 'New password for the user'
    },
    requireReset: {
      type: 'boolean',
      description: 'Whether the user must change the password on next login',
      default: true
    }
  },
  required: ['newPassword']
};

/**
 * Schema for permission data
 */
const permissionSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the permission'
    },
    name: {
      type: 'string',
      description: 'Permission name'
    },
    description: {
      type: 'string',
      description: 'Permission description'
    },
    category: {
      type: 'string',
      enum: ['USERS', 'CLIENTS', 'SERVICES', 'CLAIMS', 'BILLING', 'PAYMENTS', 'REPORTS', 'SETTINGS', 'SYSTEM'],
      description: 'Permission category'
    },
    action: {
      type: 'string',
      enum: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'SUBMIT', 'EXPORT', 'IMPORT', 'MANAGE'],
      description: 'Permission action'
    },
    resource: {
      type: 'string',
      nullable: true,
      description: 'Specific resource the permission applies to'
    },
    isSystem: {
      type: 'boolean',
      description: 'Whether this is a system-defined permission'
    }
  },
  required: ['id', 'name', 'category', 'action', 'isSystem']
};

/**
 * Schema for role data
 */
const roleSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the role'
    },
    name: {
      type: 'string',
      description: 'Role name'
    },
    description: {
      type: 'string',
      description: 'Role description'
    },
    isSystem: {
      type: 'boolean',
      description: 'Whether this is a system-defined role'
    },
    permissions: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Permission'
      },
      description: 'Permissions assigned to this role'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the role was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the role was last updated'
    }
  },
  required: ['id', 'name', 'isSystem', 'permissions', 'createdAt', 'updatedAt']
};

/**
 * Schema for user permissions response
 */
const userPermissionsSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      format: 'uuid',
      description: 'User ID'
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: 'Role ID'
    },
    roleName: {
      type: 'string',
      description: 'Role name'
    },
    permissions: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Permission'
      },
      description: 'Permissions assigned to the user through their role'
    }
  },
  required: ['userId', 'roleId', 'roleName', 'permissions']
};

/**
 * Schema for user filter parameters
 */
const userFilterParamsSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED', 'PASSWORD_RESET'],
      description: 'Filter by user status'
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: 'Filter by role ID'
    },
    mfaEnabled: {
      type: 'boolean',
      description: 'Filter by MFA status'
    }
  }
};

/**
 * Define the user management API paths
 */
const userPaths: OpenAPIV3.PathsObject = {
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'Get users',
      description: 'Retrieves a paginated list of users with optional filtering',
      operationId: 'getUsers',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by user status',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED', 'PASSWORD_RESET']
          }
        },
        {
          name: 'roleId',
          in: 'query',
          description: 'Filter by role ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'mfaEnabled',
          in: 'query',
          description: 'Filter by MFA status',
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/UserProfile'
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Invalid parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Users'],
      summary: 'Create user',
      description: 'Creates a new user in the system',
      operationId: 'createUser',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateUserRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/UserProfile'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Email already in use',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get current user',
      description: 'Retrieves the profile of the currently authenticated user',
      operationId: 'getCurrentUser',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/UserProfile'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Retrieves a specific user by their ID',
      operationId: 'getUserById',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/UserProfile'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Update user',
      description: "Updates an existing user's information",
      operationId: 'updateUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateUserRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/UserProfile'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user',
      description: 'Deletes a user from the system (soft delete)',
      operationId: 'deleteUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      responses: {
        '204': {
          description: 'User deleted successfully'
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/{id}/status': {
    patch: {
      tags: ['Users'],
      summary: 'Update user status',
      description: "Updates a user's status (active, inactive, locked, etc.)",
      operationId: 'updateUserStatus',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateUserStatusRequest'
            }
          }
        }
      },
      responses: {
        '204': {
          description: 'User status updated successfully'
        },
        '400': {
          description: 'Invalid status value',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/{id}/mfa': {
    patch: {
      tags: ['Users'],
      summary: 'Update user MFA settings',
      description: "Updates a user's multi-factor authentication settings",
      operationId: 'updateUserMfa',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateUserMfaRequest'
            }
          }
        }
      },
      responses: {
        '204': {
          description: 'User MFA settings updated successfully'
        },
        '400': {
          description: 'Invalid MFA settings',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/{id}/password': {
    post: {
      tags: ['Users'],
      summary: 'Reset user password',
      description: "Resets a user's password (admin function)",
      operationId: 'resetUserPassword',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetPasswordRequest'
            }
          }
        }
      },
      responses: {
        '204': {
          description: 'Password reset successfully'
        },
        '400': {
          description: 'Invalid password format',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/{id}/permissions': {
    get: {
      tags: ['Users'],
      summary: 'Get user permissions',
      description: 'Retrieves permissions for a specific user',
      operationId: 'getUserPermissions',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/UserPermissions'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/roles': {
    get: {
      tags: ['Users'],
      summary: 'Get all roles',
      description: 'Retrieves all roles in the system',
      operationId: 'getRoles',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Role'
                    }
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/users/roles/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get role by ID',
      description: 'Retrieves a specific role by its ID',
      operationId: 'getRoleById',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Role ID'
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: '#/components/schemas/Role'
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
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '403': {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }
};

// Export the user API paths
export default userPaths;