/**
 * Swagger/OpenAPI documentation for the reporting endpoints in the HCBS Revenue Management System.
 * This file defines all paths, schemas, and parameters for report-related API operations.
 * 
 * @file reports.swagger.ts
 * @version 1.0.0
 */

import { 
  ReportType, 
  ReportCategory, 
  ReportFormat, 
  ScheduleFrequency, 
  TimeFrame, 
  ComparisonType, 
  ChartType 
} from '../../types/reports.types';

import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * OpenAPI path definitions for all report-related endpoints in the HCBS Revenue Management System
 * Includes endpoints for report generation, management, scheduling, and metrics retrieval
 */
const reportsPaths: OpenAPIV3.PathsObject = {
  '/reports/generate': {
    post: {
      tags: ['Reports'],
      summary: 'Generate a report',
      description: 'Generates a report based on report type and parameters',
      operationId: 'generateReport',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GenerateReportRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Report generated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportData'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/definitions': {
    get: {
      tags: ['Reports'],
      summary: 'Get report definitions',
      description: 'Retrieves a list of report definitions with pagination and filtering options',
      operationId: 'getReportDefinitions',
      parameters: [
        {
          $ref: '#/components/parameters/pageParam'
        },
        {
          $ref: '#/components/parameters/limitParam'
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search term for report name or description',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'reportType',
          in: 'query',
          description: 'Filter by report type',
          schema: {
            type: 'string',
            enum: [
              'REVENUE_BY_PROGRAM',
              'REVENUE_BY_PAYER',
              'CLAIMS_STATUS',
              'AGING_ACCOUNTS_RECEIVABLE',
              'DENIAL_ANALYSIS',
              'PAYER_PERFORMANCE',
              'SERVICE_UTILIZATION',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'category',
          in: 'query',
          description: 'Filter by report category',
          schema: {
            type: 'string',
            enum: [
              'REVENUE',
              'CLAIMS',
              'FINANCIAL',
              'OPERATIONAL',
              'COMPLIANCE',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'isTemplate',
          in: 'query',
          description: 'Filter by template status',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'isSystem',
          in: 'query',
          description: 'Filter by system report status',
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report definitions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ReportDefinition'
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationResponse'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    post: {
      tags: ['Reports'],
      summary: 'Create report definition',
      description: 'Creates a new report definition',
      operationId: 'createReportDefinition',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateReportDefinitionRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Report definition created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportDefinition'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/definitions/{id}': {
    get: {
      tags: ['Reports'],
      summary: 'Get report definition',
      description: 'Retrieves a specific report definition by ID',
      operationId: 'getReportDefinition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report definition ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report definition retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportDefinition'
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    put: {
      tags: ['Reports'],
      summary: 'Update report definition',
      description: 'Updates an existing report definition',
      operationId: 'updateReportDefinition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report definition ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateReportDefinitionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Report definition updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportDefinition'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    delete: {
      tags: ['Reports'],
      summary: 'Delete report definition',
      description: 'Deletes a report definition',
      operationId: 'deleteReportDefinition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report definition ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report definition deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Report definition deleted successfully'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/definitions/{id}/generate': {
    post: {
      tags: ['Reports'],
      summary: 'Generate report by definition ID',
      description: 'Generates a report based on a saved report definition with optional parameter overrides',
      operationId: 'generateReportById',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report definition ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                parameters: {
                  $ref: '#/components/schemas/ReportParameters'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Report generated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportData'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/instances': {
    get: {
      tags: ['Reports'],
      summary: 'Get report instances',
      description: 'Retrieves a list of report instances with pagination and filtering options',
      operationId: 'getReportInstances',
      parameters: [
        {
          $ref: '#/components/parameters/pageParam'
        },
        {
          $ref: '#/components/parameters/limitParam'
        },
        {
          name: 'reportType',
          in: 'query',
          description: 'Filter by report type',
          schema: {
            type: 'string',
            enum: [
              'REVENUE_BY_PROGRAM',
              'REVENUE_BY_PAYER',
              'CLAIMS_STATUS',
              'AGING_ACCOUNTS_RECEIVABLE',
              'DENIAL_ANALYSIS',
              'PAYER_PERFORMANCE',
              'SERVICE_UTILIZATION',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter by generation date (start)',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter by generation date (end)',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report instances retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ReportInstance'
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationResponse'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/instances/{id}': {
    get: {
      tags: ['Reports'],
      summary: 'Get report instance',
      description: 'Retrieves a specific report instance by ID',
      operationId: 'getReportInstance',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report instance ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report instance retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReportInstance'
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/instances/{id}/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export report',
      description: 'Exports a report in the specified format',
      operationId: 'exportReport',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Report instance ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'format',
          in: 'query',
          description: 'Export format',
          required: true,
          schema: {
            type: 'string',
            enum: ['PDF', 'EXCEL', 'CSV', 'JSON']
          }
        }
      ],
      responses: {
        '200': {
          description: 'Report export URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL to download the exported report'
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Expiration time of the download URL'
                  }
                }
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/scheduled': {
    get: {
      tags: ['Reports'],
      summary: 'Get scheduled reports',
      description: 'Retrieves a list of scheduled reports with pagination and filtering options',
      operationId: 'getScheduledReports',
      parameters: [
        {
          $ref: '#/components/parameters/pageParam'
        },
        {
          $ref: '#/components/parameters/limitParam'
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active status',
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Scheduled reports retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ScheduledReport'
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationResponse'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    post: {
      tags: ['Reports'],
      summary: 'Create scheduled report',
      description: 'Creates a new scheduled report',
      operationId: 'createScheduledReport',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateScheduledReportRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Scheduled report created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScheduledReport'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/scheduled/{id}': {
    get: {
      tags: ['Reports'],
      summary: 'Get scheduled report',
      description: 'Retrieves a specific scheduled report by ID',
      operationId: 'getScheduledReport',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Scheduled report ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Scheduled report retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScheduledReport'
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    put: {
      tags: ['Reports'],
      summary: 'Update scheduled report',
      description: 'Updates an existing scheduled report',
      operationId: 'updateScheduledReport',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Scheduled report ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateScheduledReportRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Scheduled report updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScheduledReport'
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
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    delete: {
      tags: ['Reports'],
      summary: 'Delete scheduled report',
      description: 'Deletes a scheduled report',
      operationId: 'deleteScheduledReport',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Scheduled report ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Scheduled report deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Scheduled report deleted successfully'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/scheduled/{id}/execute': {
    post: {
      tags: ['Reports'],
      summary: 'Execute scheduled report',
      description: 'Executes a scheduled report immediately',
      operationId: 'executeScheduledReport',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Scheduled report ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Scheduled report execution initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Scheduled report execution initiated'
                  },
                  reportInstanceId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the generated report instance'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '404': {
          $ref: '#/components/responses/NotFoundError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/metrics/financial': {
    get: {
      tags: ['Reports'],
      summary: 'Get financial metrics',
      description: 'Retrieves financial metrics for dashboard and reporting',
      operationId: 'getFinancialMetrics',
      parameters: [
        {
          name: 'timeFrame',
          in: 'query',
          description: 'Time frame for metrics',
          schema: {
            type: 'string',
            enum: [
              'TODAY',
              'YESTERDAY',
              'THIS_WEEK',
              'LAST_WEEK',
              'THIS_MONTH',
              'LAST_MONTH',
              'THIS_QUARTER',
              'LAST_QUARTER',
              'THIS_YEAR',
              'LAST_YEAR',
              'LAST_30_DAYS',
              'LAST_60_DAYS',
              'LAST_90_DAYS',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Start date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'End date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'payerId',
          in: 'query',
          description: 'Filter by payer ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'facilityId',
          in: 'query',
          description: 'Filter by facility ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Financial metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/FinancialMetric'
                    }
                  },
                  dateRange: {
                    $ref: '#/components/schemas/DateRange'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/metrics/revenue': {
    get: {
      tags: ['Reports'],
      summary: 'Get revenue metrics',
      description: 'Retrieves revenue-specific metrics',
      operationId: 'getRevenueMetrics',
      parameters: [
        {
          name: 'timeFrame',
          in: 'query',
          description: 'Time frame for metrics',
          schema: {
            type: 'string',
            enum: [
              'TODAY',
              'YESTERDAY',
              'THIS_WEEK',
              'LAST_WEEK',
              'THIS_MONTH',
              'LAST_MONTH',
              'THIS_QUARTER',
              'LAST_QUARTER',
              'THIS_YEAR',
              'LAST_YEAR',
              'LAST_30_DAYS',
              'LAST_60_DAYS',
              'LAST_90_DAYS',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Start date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'End date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'payerId',
          in: 'query',
          description: 'Filter by payer ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'facilityId',
          in: 'query',
          description: 'Filter by facility ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Revenue metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/FinancialMetric'
                    }
                  },
                  dateRange: {
                    $ref: '#/components/schemas/DateRange'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/metrics/claims': {
    get: {
      tags: ['Reports'],
      summary: 'Get claims metrics',
      description: 'Retrieves claims-specific metrics',
      operationId: 'getClaimsMetrics',
      parameters: [
        {
          name: 'timeFrame',
          in: 'query',
          description: 'Time frame for metrics',
          schema: {
            type: 'string',
            enum: [
              'TODAY',
              'YESTERDAY',
              'THIS_WEEK',
              'LAST_WEEK',
              'THIS_MONTH',
              'LAST_MONTH',
              'THIS_QUARTER',
              'LAST_QUARTER',
              'THIS_YEAR',
              'LAST_YEAR',
              'LAST_30_DAYS',
              'LAST_60_DAYS',
              'LAST_90_DAYS',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Start date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'End date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'payerId',
          in: 'query',
          description: 'Filter by payer ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'facilityId',
          in: 'query',
          description: 'Filter by facility ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claims metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/FinancialMetric'
                    }
                  },
                  dateRange: {
                    $ref: '#/components/schemas/DateRange'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },

  '/reports/metrics/payments': {
    get: {
      tags: ['Reports'],
      summary: 'Get payment metrics',
      description: 'Retrieves payment-specific metrics',
      operationId: 'getPaymentMetrics',
      parameters: [
        {
          name: 'timeFrame',
          in: 'query',
          description: 'Time frame for metrics',
          schema: {
            type: 'string',
            enum: [
              'TODAY',
              'YESTERDAY',
              'THIS_WEEK',
              'LAST_WEEK',
              'THIS_MONTH',
              'LAST_MONTH',
              'THIS_QUARTER',
              'LAST_QUARTER',
              'THIS_YEAR',
              'LAST_YEAR',
              'LAST_30_DAYS',
              'LAST_60_DAYS',
              'LAST_90_DAYS',
              'CUSTOM'
            ]
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Start date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'End date for custom time frame',
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'payerId',
          in: 'query',
          description: 'Filter by payer ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'facilityId',
          in: 'query',
          description: 'Filter by facility ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Payment metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/FinancialMetric'
                    }
                  },
                  dateRange: {
                    $ref: '#/components/schemas/DateRange'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '403': {
          $ref: '#/components/responses/ForbiddenError'
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  }
};

export default reportsPaths;