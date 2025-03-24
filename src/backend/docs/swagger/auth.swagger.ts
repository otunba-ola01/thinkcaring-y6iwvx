import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * Schema for login request body with email, password, and rememberMe fields
 */
const loginRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: "User's email address"
    },
    password: {
      type: 'string',
      format: 'password',
      description: "User's password"
    },
    rememberMe: {
      type: 'boolean',
      description: 'Whether to extend the session duration',
      default: false
    }
  },
  required: ['email', 'password']
};

/**
 * Schema for successful login response with user data and tokens
 */
const loginResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid'
        },
        email: {
          type: 'string',
          format: 'email'
        },
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        },
        roleName: {
          type: 'string'
        },
        permissions: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        mfaEnabled: {
          type: 'boolean'
        },
        lastLogin: {
          type: 'string',
          format: 'date-time',
          nullable: true
        }
      }
    },
    accessToken: {
      type: 'string'
    },
    refreshToken: {
      type: 'string'
    },
    expiresIn: {
      type: 'integer',
      description: 'Token expiration time in seconds'
    }
  },
  required: ['user', 'accessToken', 'refreshToken', 'expiresIn']
};

/**
 * Schema for response when MFA verification is required
 */
const mfaRequiredResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    mfaRequired: {
      type: 'boolean',
      enum: [true]
    },
    mfaToken: {
      type: 'string',
      description: 'Temporary token for MFA verification'
    },
    mfaMethods: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['app', 'sms', 'email', 'backup']
      },
      description: 'Available MFA methods for the user'
    }
  },
  required: ['mfaRequired', 'mfaToken', 'mfaMethods']
};

/**
 * Schema for MFA verification request with token and code
 */
const mfaVerifyRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    mfaToken: {
      type: 'string',
      description: 'Temporary token received after login'
    },
    code: {
      type: 'string',
      description: 'Verification code from MFA device',
      pattern: '^[0-9]{6}$'
    },
    method: {
      type: 'string',
      enum: ['app', 'sms', 'email', 'backup'],
      description: 'MFA method used for verification'
    },
    rememberDevice: {
      type: 'boolean',
      description: 'Whether to remember this device',
      default: false
    }
  },
  required: ['mfaToken', 'code', 'method']
};

/**
 * Schema for refresh token request with refresh token
 */
const refreshTokenRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    refreshToken: {
      type: 'string',
      description: 'Refresh token from previous authentication'
    }
  },
  required: ['refreshToken']
};

/**
 * Schema for response containing new access and refresh tokens
 */
const tokenResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    accessToken: {
      type: 'string'
    },
    refreshToken: {
      type: 'string'
    },
    expiresIn: {
      type: 'integer',
      description: 'Token expiration time in seconds'
    }
  },
  required: ['accessToken', 'refreshToken', 'expiresIn']
};

/**
 * Schema for forgot password request with email
 */
const forgotPasswordRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: "User's email address"
    }
  },
  required: ['email']
};

/**
 * Schema for reset password request with token and new password
 */
const resetPasswordRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      description: 'Reset token from email link'
    },
    password: {
      type: 'string',
      format: 'password',
      description: 'New password',
      minLength: 12
    },
    confirmPassword: {
      type: 'string',
      format: 'password',
      description: 'Confirm new password'
    }
  },
  required: ['token', 'password', 'confirmPassword']
};

/**
 * Schema for change password request with current and new password
 */
const changePasswordRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    currentPassword: {
      type: 'string',
      format: 'password',
      description: 'Current password'
    },
    newPassword: {
      type: 'string',
      format: 'password',
      description: 'New password',
      minLength: 12
    },
    confirmPassword: {
      type: 'string',
      format: 'password',
      description: 'Confirm new password'
    }
  },
  required: ['currentPassword', 'newPassword', 'confirmPassword']
};

/**
 * Schema for MFA setup request with method selection
 */
const setupMfaRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    method: {
      type: 'string',
      enum: ['app', 'sms', 'email'],
      description: 'MFA method to set up'
    },
    phoneNumber: {
      type: 'string',
      description: 'Phone number for SMS verification',
      pattern: '^\\+[1-9]\\d{1,14}$'
    }
  },
  required: ['method']
};

/**
 * Schema for MFA setup response with secret and QR code
 */
const setupMfaResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    secret: {
      type: 'string',
      description: 'Secret key for authenticator app'
    },
    qrCodeUrl: {
      type: 'string',
      description: 'URL for QR code to scan with authenticator app'
    },
    verificationMethod: {
      type: 'string',
      enum: ['app', 'sms', 'email'],
      description: 'Method being set up'
    }
  },
  required: ['secret', 'qrCodeUrl', 'verificationMethod']
};

/**
 * Schema for MFA setup verification with verification code
 */
const verifyMfaSetupRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'Verification code from MFA device',
      pattern: '^[0-9]{6}$'
    }
  },
  required: ['code']
};

/**
 * Schema for disable MFA request with password confirmation
 */
const disableMfaRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    password: {
      type: 'string',
      format: 'password',
      description: 'Current password for verification'
    }
  },
  required: ['password']
};

/**
 * Schema for response containing generated backup codes
 */
const generateBackupCodesResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    backupCodes: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[A-Z0-9]{10}$'
      },
      description: 'List of backup codes for account recovery',
      minItems: 10,
      maxItems: 10
    }
  },
  required: ['backupCodes']
};

/**
 * Schema for generic success response
 */
const successResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      enum: [true]
    },
    message: {
      type: 'string',
      description: 'Success message'
    }
  },
  required: ['success']
};

/**
 * Authentication API paths
 */
const authPaths: OpenAPIV3.PathsObject = {
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticates a user with email and password credentials',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Successful authentication',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/LoginResponse' },
                  { $ref: '#/components/schemas/MfaRequiredResponse' }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Account locked',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '429': {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/verify-mfa': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify MFA code',
      description: 'Verifies a multi-factor authentication code during the login process',
      operationId: 'verifyMfa',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MfaVerifyRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'MFA verification successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid MFA code',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Invalid or expired MFA token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '429': {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/refresh-token': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description: 'Refreshes an access token using a valid refresh token',
      operationId: 'refreshToken',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RefreshTokenRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Token refresh successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenResponse' }
            }
          }
        },
        '401': {
          description: 'Invalid or expired refresh token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout',
      description: 'Logs out a user by invalidating their current session and tokens',
      operationId: 'logout',
      responses: {
        '200': {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/logout-all': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout from all devices',
      description: 'Logs out a user from all devices by invalidating all their sessions and tokens',
      operationId: 'logoutAll',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Logout from all devices successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
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
  '/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Forgot password',
      description: "Initiates the password reset process by sending a reset link to the user's email",
      operationId: 'forgotPassword',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ForgotPasswordRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Password reset email sent (returns 200 even if email not found for security)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '429': {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password',
      description: "Resets a user's password using a valid reset token",
      operationId: 'resetPassword',
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
        '200': {
          description: 'Password reset successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid password format',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Invalid or expired reset token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '429': {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change password',
      description: "Changes a user's password after verifying the current password",
      operationId: 'changePassword',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChangePasswordRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Password change successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid password format or current password incorrect',
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
  '/auth/setup-mfa': {
    post: {
      tags: ['Authentication'],
      summary: 'Setup MFA',
      description: 'Sets up multi-factor authentication for a user',
      operationId: 'setupMfa',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SetupMfaRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'MFA setup initiated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SetupMfaResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid MFA method or MFA already enabled',
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
  '/auth/verify-mfa-setup': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify MFA setup',
      description: 'Verifies MFA setup by validating a test code',
      operationId: 'verifyMfaSetup',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyMfaSetupRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'MFA setup verified successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid verification code',
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
  '/auth/disable-mfa': {
    post: {
      tags: ['Authentication'],
      summary: 'Disable MFA',
      description: 'Disables multi-factor authentication for a user',
      operationId: 'disableMfa',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DisableMfaRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'MFA disabled successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid password or MFA not enabled',
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
  '/auth/generate-backup-codes': {
    post: {
      tags: ['Authentication'],
      summary: 'Generate MFA backup codes',
      description: 'Generates new backup codes for MFA recovery',
      operationId: 'generateMfaBackupCodes',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DisableMfaRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Backup codes generated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenerateBackupCodesResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid password or MFA not enabled',
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
  '/auth/users/{userId}/unlock': {
    post: {
      tags: ['Authentication'],
      summary: 'Unlock user account',
      description: 'Unlocks a locked user account (admin only)',
      operationId: 'unlockUserAccount',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID of the user to unlock'
        }
      ],
      responses: {
        '200': {
          description: 'Account unlocked successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid user ID',
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
          description: 'User not found',
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

export default authPaths;