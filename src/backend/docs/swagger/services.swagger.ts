import { OpenAPIV3 } from '../../config/swagger.config';
import { ServiceType, DocumentationStatus, BillingStatus } from '../../types/services.types';
import { StatusType } from '../../types/common.types';

/**
 * Reusable schema components for service objects
 */
const serviceComponents = {
  // Common service properties for reuse
  serviceProperties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique service identifier'
    },
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'Client receiving the service'
    },
    serviceTypeId: {
      type: 'string',
      format: 'uuid',
      description: 'Reference to service type'
    },
    serviceCode: {
      type: 'string',
      description: 'Service billing code'
    },
    serviceDate: {
      type: 'string',
      format: 'date',
      description: 'Date service was provided'
    },
    startTime: {
      type: 'string',
      format: 'time',
      nullable: true,
      description: 'Service start time (if applicable)'
    },
    endTime: {
      type: 'string',
      format: 'time',
      nullable: true,
      description: 'Service end time (if applicable)'
    },
    units: {
      type: 'number',
      format: 'float',
      description: 'Service units provided'
    },
    rate: {
      type: 'number',
      format: 'float',
      description: 'Rate per unit'
    },
    amount: {
      type: 'number',
      format: 'float',
      description: 'Total amount (units * rate)'
    },
    staffId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Staff who provided the service'
    },
    facilityId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Facility where service was provided'
    },
    programId: {
      type: 'string',
      format: 'uuid',
      description: 'Program under which service was provided'
    },
    authorizationId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Authorization covering this service'
    },
    documentationStatus: {
      type: 'string',
      enum: Object.values(DocumentationStatus),
      description: 'Documentation completion status'
    },
    billingStatus: {
      type: 'string',
      enum: Object.values(BillingStatus),
      description: 'Billing status of the service'
    },
    claimId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Claim this service is part of (if billed)'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the service'
    },
    documentIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'Documentation files associated with this service'
    },
    status: {
      type: 'string',
      enum: Object.values(StatusType),
      description: 'Record status'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the record was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the record was last updated'
    }
  }
};

/**
 * Schema for create service request
 */
const createServiceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: [
    'clientId',
    'serviceTypeId',
    'serviceCode',
    'serviceDate',
    'units',
    'rate',
    'programId',
    'documentationStatus'
  ],
  properties: {
    clientId: serviceComponents.serviceProperties.clientId,
    serviceTypeId: serviceComponents.serviceProperties.serviceTypeId,
    serviceCode: serviceComponents.serviceProperties.serviceCode,
    serviceDate: serviceComponents.serviceProperties.serviceDate,
    startTime: serviceComponents.serviceProperties.startTime,
    endTime: serviceComponents.serviceProperties.endTime,
    units: serviceComponents.serviceProperties.units,
    rate: serviceComponents.serviceProperties.rate,
    staffId: serviceComponents.serviceProperties.staffId,
    facilityId: serviceComponents.serviceProperties.facilityId,
    programId: serviceComponents.serviceProperties.programId,
    authorizationId: serviceComponents.serviceProperties.authorizationId,
    documentationStatus: serviceComponents.serviceProperties.documentationStatus,
    notes: serviceComponents.serviceProperties.notes,
    documentIds: serviceComponents.serviceProperties.documentIds
  }
};

/**
 * Schema for update service request
 */
const updateServiceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: [
    'serviceTypeId',
    'serviceCode',
    'serviceDate',
    'units',
    'rate',
    'programId',
    'documentationStatus',
    'billingStatus',
    'status'
  ],
  properties: {
    serviceTypeId: serviceComponents.serviceProperties.serviceTypeId,
    serviceCode: serviceComponents.serviceProperties.serviceCode,
    serviceDate: serviceComponents.serviceProperties.serviceDate,
    startTime: serviceComponents.serviceProperties.startTime,
    endTime: serviceComponents.serviceProperties.endTime,
    units: serviceComponents.serviceProperties.units,
    rate: serviceComponents.serviceProperties.rate,
    staffId: serviceComponents.serviceProperties.staffId,
    facilityId: serviceComponents.serviceProperties.facilityId,
    programId: serviceComponents.serviceProperties.programId,
    authorizationId: serviceComponents.serviceProperties.authorizationId,
    documentationStatus: serviceComponents.serviceProperties.documentationStatus,
    billingStatus: serviceComponents.serviceProperties.billingStatus,
    notes: serviceComponents.serviceProperties.notes,
    documentIds: serviceComponents.serviceProperties.documentIds,
    status: serviceComponents.serviceProperties.status
  }
};

/**
 * Schema for service response
 */
const serviceResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        ...serviceComponents.serviceProperties,
        client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            medicaidId: {
              type: 'string',
              nullable: true
            }
          }
        },
        serviceType: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            code: {
              type: 'string'
            }
          }
        },
        staff: {
          type: 'object',
          nullable: true,
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            title: {
              type: 'string',
              nullable: true
            }
          }
        },
        facility: {
          type: 'object',
          nullable: true,
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            type: {
              type: 'string'
            }
          }
        },
        program: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            code: {
              type: 'string'
            }
          }
        },
        authorization: {
          type: 'object',
          nullable: true,
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            number: {
              type: 'string'
            },
            startDate: {
              type: 'string',
              format: 'date'
            },
            endDate: {
              type: 'string',
              format: 'date'
            },
            authorizedUnits: {
              type: 'number',
              format: 'float'
            },
            usedUnits: {
              type: 'number',
              format: 'float'
            }
          }
        },
        claim: {
          type: 'object',
          nullable: true,
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            claimNumber: {
              type: 'string'
            },
            status: {
              type: 'string'
            }
          }
        },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              },
              fileName: {
                type: 'string'
              },
              fileSize: {
                type: 'number'
              },
              mimeType: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Schema for service summary response
 */
const serviceSummaryResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        id: serviceComponents.serviceProperties.id,
        clientName: {
          type: 'string',
          description: 'Full name of the client'
        },
        serviceType: {
          type: 'string',
          description: 'Service type name'
        },
        serviceDate: serviceComponents.serviceProperties.serviceDate,
        units: serviceComponents.serviceProperties.units,
        amount: serviceComponents.serviceProperties.amount,
        documentationStatus: serviceComponents.serviceProperties.documentationStatus,
        billingStatus: serviceComponents.serviceProperties.billingStatus,
        programName: {
          type: 'string',
          description: 'Program name'
        }
      }
    }
  }
};

/**
 * Schema for service list response
 */
const serviceListResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: serviceComponents.serviceProperties
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
      }
    }
  }
};

/**
 * Schema for updating service billing status
 */
const updateServiceBillingStatusRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['billingStatus'],
  properties: {
    billingStatus: {
      type: 'string',
      enum: Object.values(BillingStatus),
      description: 'New billing status'
    },
    claimId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Claim ID if the service is being added to a claim'
    }
  }
};

/**
 * Schema for updating service documentation status
 */
const updateServiceDocumentationStatusRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['documentationStatus'],
  properties: {
    documentationStatus: {
      type: 'string',
      enum: Object.values(DocumentationStatus),
      description: 'New documentation status'
    },
    documentIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'Updated list of document IDs'
    }
  }
};

/**
 * Schema for service validation request
 */
const serviceValidationRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['serviceIds'],
  properties: {
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'List of service IDs to validate'
    }
  }
};

/**
 * Schema for service validation response
 */
const serviceValidationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                format: 'uuid',
                description: 'Service ID'
              },
              isValid: {
                type: 'boolean',
                description: 'Whether the service is valid for billing'
              },
              errors: {
                type: 'array',
                items: {
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
                    field: {
                      type: 'string',
                      nullable: true,
                      description: 'Field with the error, if applicable'
                    }
                  }
                }
              },
              warnings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'string',
                      description: 'Warning code'
                    },
                    message: {
                      type: 'string',
                      description: 'Warning message'
                    },
                    field: {
                      type: 'string',
                      nullable: true,
                      description: 'Field with the warning, if applicable'
                    }
                  }
                }
              }
            }
          }
        },
        isValid: {
          type: 'boolean',
          description: 'Whether all services are valid'
        },
        totalErrors: {
          type: 'integer',
          description: 'Total number of errors across all services'
        },
        totalWarnings: {
          type: 'integer',
          description: 'Total number of warnings across all services'
        }
      }
    }
  }
};

/**
 * Schema for service metrics response
 */
const serviceMetricsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        totalServices: {
          type: 'integer',
          description: 'Total number of services in the selected period'
        },
        totalUnbilledServices: {
          type: 'integer',
          description: 'Number of services not yet billed'
        },
        totalUnbilledAmount: {
          type: 'number',
          format: 'float',
          description: 'Total amount of unbilled services'
        },
        incompleteDocumentation: {
          type: 'integer',
          description: 'Number of services with incomplete documentation'
        },
        servicesByProgram: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              programId: {
                type: 'string',
                format: 'uuid'
              },
              programName: {
                type: 'string'
              },
              count: {
                type: 'integer'
              },
              amount: {
                type: 'number',
                format: 'float'
              }
            }
          }
        },
        servicesByType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceTypeId: {
                type: 'string',
                format: 'uuid'
              },
              serviceTypeName: {
                type: 'string'
              },
              count: {
                type: 'integer'
              },
              amount: {
                type: 'number',
                format: 'float'
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Schema for bulk billing status update request
 */
const bulkBillingStatusUpdateRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['serviceIds', 'billingStatus'],
  properties: {
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'List of service IDs to update'
    },
    billingStatus: {
      type: 'string',
      enum: Object.values(BillingStatus),
      description: 'New billing status'
    },
    claimId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Claim ID if the services are being added to a claim'
    }
  }
};

/**
 * Schema for service import request
 */
const serviceImportRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['source', 'services'],
  properties: {
    source: {
      type: 'string',
      description: 'Source system of the import (e.g., "EHR", "CSV")'
    },
    services: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'clientId',
          'serviceTypeId',
          'serviceCode',
          'serviceDate',
          'units',
          'rate',
          'programId'
        ],
        properties: {
          clientId: serviceComponents.serviceProperties.clientId,
          serviceTypeId: serviceComponents.serviceProperties.serviceTypeId,
          serviceCode: serviceComponents.serviceProperties.serviceCode,
          serviceDate: serviceComponents.serviceProperties.serviceDate,
          units: serviceComponents.serviceProperties.units,
          rate: serviceComponents.serviceProperties.rate,
          staffId: serviceComponents.serviceProperties.staffId,
          programId: serviceComponents.serviceProperties.programId,
          notes: serviceComponents.serviceProperties.notes
        }
      }
    }
  }
};

/**
 * Schema for error response
 */
const errorResponseSchema: OpenAPIV3.SchemaObject = {
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
 * Swagger/OpenAPI path definitions for service endpoints
 */
const paths: OpenAPIV3.PathsObject = {
  '/services': {
    get: {
      tags: ['Services'],
      summary: 'Get all services',
      description: 'Retrieves all services with optional filtering and pagination',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'clientId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by client ID'
        },
        {
          name: 'programId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by program ID'
        },
        {
          name: 'serviceTypeId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by service type ID'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service start date (inclusive)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service end date (inclusive)'
        },
        {
          name: 'documentationStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(DocumentationStatus)
          },
          description: 'Filter by documentation status'
        },
        {
          name: 'billingStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(BillingStatus)
          },
          description: 'Filter by billing status'
        },
        {
          name: 'search',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Search term for client name or service code'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(StatusType)
          },
          description: 'Filter by record status'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            default: 'serviceDate'
          },
          description: 'Field to sort by'
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          description: 'Sort order (ascending or descending)'
        }
      ],
      responses: {
        '200': {
          description: 'Services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
      tags: ['Services'],
      summary: 'Create a new service',
      description: 'Creates a new service record',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateServiceRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Service created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceResponse'
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
          description: 'Client, program, or service type not found',
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
  '/services/summaries': {
    get: {
      tags: ['Services'],
      summary: 'Get service summaries',
      description: 'Retrieves summarized service information for lists and dashboards',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'clientId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by client ID'
        },
        {
          name: 'programId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by program ID'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service start date (inclusive)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service end date (inclusive)'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Service summaries retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceSummaryListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
    }
  },
  '/services/billable': {
    get: {
      tags: ['Services'],
      summary: 'Get billable services',
      description: 'Retrieves services that are ready for billing',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'clientId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by client ID'
        },
        {
          name: 'programId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by program ID'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service start date (inclusive)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service end date (inclusive)'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Billable services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
    }
  },
  '/services/metrics': {
    get: {
      tags: ['Services'],
      summary: 'Get service metrics',
      description: 'Retrieves service metrics for dashboard and reporting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'dateRange',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'today',
              'yesterday',
              'thisWeek',
              'lastWeek',
              'thisMonth',
              'lastMonth',
              'thisQuarter',
              'lastQuarter',
              'thisYear',
              'lastYear',
              'custom'
            ]
          },
          description: 'Predefined date range for metrics'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: "Custom start date (required if dateRange is 'custom')"
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: "Custom end date (required if dateRange is 'custom')"
        },
        {
          name: 'programId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by program ID'
        }
      ],
      responses: {
        '200': {
          description: 'Service metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceMetricsResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
    }
  },
  '/services/validate': {
    post: {
      tags: ['Services'],
      summary: 'Validate multiple services',
      description: 'Validates multiple services for billing readiness',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ServiceValidationRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Services validated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceValidationResponse'
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
          description: 'One or more services not found',
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
  '/services/bulk-billing-status': {
    put: {
      tags: ['Services'],
      summary: 'Update billing status for multiple services',
      description: 'Updates the billing status for multiple services at once',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BulkBillingStatusUpdateRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Billing status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean'
                      },
                      updated: {
                        type: 'integer'
                      },
                      failed: {
                        type: 'integer'
                      },
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            serviceId: {
                              type: 'string',
                              format: 'uuid'
                            },
                            message: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
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
        }
      }
    }
  },
  '/services/import': {
    post: {
      tags: ['Services'],
      summary: 'Import services',
      description: 'Imports services from external systems',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ServiceImportRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Services imported successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean'
                      },
                      imported: {
                        type: 'integer'
                      },
                      failed: {
                        type: 'integer'
                      },
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            index: {
                              type: 'integer'
                            },
                            message: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
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
        }
      }
    }
  },
  '/services/client/{id}': {
    get: {
      tags: ['Services'],
      summary: 'Get services by client ID',
      description: 'Retrieves services for a specific client',
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
          description: 'Client ID'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service start date (inclusive)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service end date (inclusive)'
        },
        {
          name: 'documentationStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(DocumentationStatus)
          },
          description: 'Filter by documentation status'
        },
        {
          name: 'billingStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(BillingStatus)
          },
          description: 'Filter by billing status'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Client services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
          description: 'Client not found',
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
  '/services/program/{id}': {
    get: {
      tags: ['Services'],
      summary: 'Get services by program ID',
      description: 'Retrieves services for a specific program',
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
          description: 'Program ID'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service start date (inclusive)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Filter by service end date (inclusive)'
        },
        {
          name: 'documentationStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(DocumentationStatus)
          },
          description: 'Filter by documentation status'
        },
        {
          name: 'billingStatus',
          in: 'query',
          schema: {
            type: 'string',
            enum: Object.values(BillingStatus)
          },
          description: 'Filter by billing status'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Program services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
          description: 'Program not found',
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
  '/services/authorization/{id}': {
    get: {
      tags: ['Services'],
      summary: 'Get services by authorization ID',
      description: 'Retrieves services for a specific authorization',
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
          description: 'Authorization ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Authorization services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
          description: 'Authorization not found',
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
  '/services/claim/{id}': {
    get: {
      tags: ['Services'],
      summary: 'Get services by claim ID',
      description: 'Retrieves services for a specific claim',
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
          description: 'Claim ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Claim services retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceListResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
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
          description: 'Claim not found',
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
  '/services/{id}': {
    get: {
      tags: ['Services'],
      summary: 'Get service by ID',
      description: 'Retrieves a specific service by ID',
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
          description: 'Service ID'
        }
      ],
      responses: {
        '200': {
          description: 'Service retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceResponse'
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
          description: 'Service not found',
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
      tags: ['Services'],
      summary: 'Update service',
      description: 'Updates an existing service',
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
          description: 'Service ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateServiceRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Service updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceResponse'
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
          description: 'Service not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Service cannot be updated in current state',
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
      tags: ['Services'],
      summary: 'Delete service',
      description: 'Marks a service as deleted (soft delete)',
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
          description: 'Service ID'
        }
      ],
      responses: {
        '204': {
          description: 'Service deleted successfully'
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
          description: 'Service not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Service cannot be deleted in current state',
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
  '/services/{id}/billing-status': {
    put: {
      tags: ['Services'],
      summary: 'Update service billing status',
      description: "Updates a service's billing status",
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
          description: 'Service ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateServiceBillingStatusRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Billing status updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceResponse'
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
          description: 'Service not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Invalid billing status transition',
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
  '/services/{id}/documentation-status': {
    put: {
      tags: ['Services'],
      summary: 'Update service documentation status',
      description: "Updates a service's documentation status",
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
          description: 'Service ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateServiceDocumentationStatusRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Documentation status updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceResponse'
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
          description: 'Service not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Invalid documentation status transition',
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
  '/services/{id}/validate': {
    post: {
      tags: ['Services'],
      summary: 'Validate service',
      description: 'Validates a service for billing readiness',
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
          description: 'Service ID'
        }
      ],
      responses: {
        '200': {
          description: 'Service validated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      serviceId: {
                        type: 'string',
                        format: 'uuid'
                      },
                      isValid: {
                        type: 'boolean'
                      },
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: {
                              type: 'string'
                            },
                            message: {
                              type: 'string'
                            },
                            field: {
                              type: 'string',
                              nullable: true
                            }
                          }
                        }
                      },
                      warnings: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: {
                              type: 'string'
                            },
                            message: {
                              type: 'string'
                            },
                            field: {
                              type: 'string',
                              nullable: true
                            }
                          }
                        }
                      }
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
        },
        '404': {
          description: 'Service not found',
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

// Export the Swagger/OpenAPI paths
export default paths;