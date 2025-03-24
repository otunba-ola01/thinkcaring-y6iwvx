import { OpenAPIV3 } from 'openapi3-ts'; // openapi3-ts v3.2.0

/**
 * Current version of the API for documentation
 */
export const API_VERSION = '1.0.0';

/**
 * Title of the API for documentation
 */
export const API_TITLE = 'HCBS Revenue Management System API';

/**
 * Description of the API for documentation
 */
export const API_DESCRIPTION = 'API for the HCBS Revenue Management System, providing endpoints for claims management, billing workflows, payment reconciliation, and financial reporting.';

/**
 * Base path for all API endpoints
 */
export const API_BASE_PATH = '/api';

/**
 * Standard error response schema used across all endpoints
 */
export const errorResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Error code'
        },
        message: {
          type: 'string',
          description: 'Error message'
        },
        details: {
          type: 'object',
          description: 'Additional error details'
        }
      },
      required: ['code', 'message']
    }
  },
  required: ['error']
};

/**
 * Standard paginated response schema used across list endpoints
 */
export const paginatedResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object'
      }
    },
    pagination: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Current page number'
        },
        limit: {
          type: 'integer',
          description: 'Items per page'
        },
        totalItems: {
          type: 'integer',
          description: 'Total number of items'
        },
        totalPages: {
          type: 'integer',
          description: 'Total number of pages'
        }
      },
      required: ['page', 'limit', 'totalItems', 'totalPages']
    }
  },
  required: ['data', 'pagination']
};

/**
 * Security schemes used across the API
 */
export const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Authorization header using the Bearer scheme'
  }
};

/**
 * Common pagination parameters used across list endpoints
 */
export const paginationParameters: OpenAPIV3.ParameterObject[] = [
  {
    name: 'page',
    in: 'query',
    description: 'Page number for pagination',
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1
    }
  },
  {
    name: 'limit',
    in: 'query',
    description: 'Number of items per page',
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20
    }
  },
  {
    name: 'sortBy',
    in: 'query',
    description: 'Field to sort by',
    schema: {
      type: 'string'
    }
  },
  {
    name: 'sortOrder',
    in: 'query',
    description: 'Sort order (asc or desc)',
    schema: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  }
];

/**
 * Common filter parameters used across list endpoints
 */
export const filterParameters: OpenAPIV3.ParameterObject[] = [
  {
    name: 'search',
    in: 'query',
    description: 'Search term',
    schema: {
      type: 'string'
    }
  },
  {
    name: 'status',
    in: 'query',
    description: 'Filter by status',
    schema: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
    }
  }
];

/**
 * Common components used across the API documentation
 */
export const commonComponents: OpenAPIV3.ComponentsObject = {
  securitySchemes,
  schemas: {
    ErrorResponse: errorResponseSchema,
    PaginatedResponse: paginatedResponseSchema
  },
  parameters: {
    PageParam: paginationParameters[0],
    LimitParam: paginationParameters[1],
    SortByParam: paginationParameters[2],
    SortOrderParam: paginationParameters[3],
    SearchParam: filterParameters[0],
    StatusParam: filterParameters[1]
  }
};

/**
 * Base Swagger definition with common configuration
 */
export const swaggerDefinition: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: API_TITLE,
    description: API_DESCRIPTION,
    version: API_VERSION,
    contact: {
      name: 'HCBS Support',
      email: 'support@thinkcaring.com',
      url: 'https://thinkcaring.com/support'
    },
    license: {
      name: 'Proprietary',
      url: 'https://thinkcaring.com/license'
    }
  },
  servers: [
    {
      url: API_BASE_PATH,
      description: 'Production API'
    },
    {
      url: `${API_BASE_PATH}/v1`,
      description: 'Versioned API'
    }
  ],
  components: commonComponents,
  tags: [
    { name: 'Authentication', description: 'Authentication and session management endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Clients', description: 'Client management endpoints' },
    { name: 'Services', description: 'Service management endpoints' },
    { name: 'Claims', description: 'Claim management endpoints' },
    { name: 'Billing', description: 'Billing workflow endpoints' },
    { name: 'Payments', description: 'Payment management endpoints' },
    { name: 'Reports', description: 'Reporting and analytics endpoints' },
    { name: 'Settings', description: 'System settings endpoints' }
  ],
  security: [
    { bearerAuth: [] }
  ],
  paths: {}
};

/**
 * Swagger middleware options
 */
export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/backend/routes/*.ts', './src/backend/controllers/*.ts']
};

/**
 * Swagger UI middleware options
 */
export const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    }
  }
};

/**
 * Complete Swagger configuration
 */
export const swaggerConfig = {
  swaggerOptions,
  swaggerUiOptions
};

// Re-export OpenAPIV3 for use in other swagger documentation files
export { OpenAPIV3 };