import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * Schema defining a claim entity with all its properties
 * @version 1.0.0
 */
const claimSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    claimNumber: {
      type: 'string'
    },
    externalClaimId: {
      type: 'string',
      nullable: true
    },
    clientId: {
      type: 'string',
      format: 'uuid'
    },
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    claimType: {
      type: 'string',
      enum: ['ORIGINAL', 'ADJUSTMENT', 'REPLACEMENT', 'VOID']
    },
    claimStatus: {
      type: 'string',
      enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    serviceStartDate: {
      type: 'string',
      format: 'date'
    },
    serviceEndDate: {
      type: 'string',
      format: 'date'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      nullable: true
    },
    submissionMethod: {
      type: 'string',
      enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT'],
      nullable: true
    },
    adjudicationDate: {
      type: 'string',
      format: 'date',
      nullable: true
    },
    denialReason: {
      type: 'string',
      enum: [
        'DUPLICATE_CLAIM',
        'SERVICE_NOT_COVERED',
        'AUTHORIZATION_MISSING',
        'AUTHORIZATION_INVALID',
        'CLIENT_INELIGIBLE',
        'PROVIDER_INELIGIBLE',
        'TIMELY_FILING',
        'INVALID_CODING',
        'MISSING_INFORMATION',
        'OTHER'
      ],
      nullable: true
    },
    denialDetails: {
      type: 'string',
      nullable: true
    },
    adjustmentCodes: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      nullable: true
    },
    originalClaimId: {
      type: 'string',
      format: 'uuid',
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    },
    createdBy: {
      type: 'string',
      format: 'uuid',
      nullable: true
    },
    updatedBy: {
      type: 'string',
      format: 'uuid',
      nullable: true
    }
  },
  required: [
    'id',
    'claimNumber',
    'clientId',
    'payerId',
    'claimType',
    'claimStatus',
    'totalAmount',
    'serviceStartDate',
    'serviceEndDate',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Schema defining a client summary for use in claim responses
 * @version 1.0.0
 */
const clientSummarySchema: OpenAPIV3.SchemaObject = {
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
    },
    dateOfBirth: {
      type: 'string',
      format: 'date'
    },
    status: {
      type: 'string'
    }
  },
  required: ['id', 'firstName', 'lastName']
};

/**
 * Schema defining a payer summary for use in claim responses
 * @version 1.0.0
 */
const payerSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    name: {
      type: 'string'
    },
    payerType: {
      type: 'string',
      enum: ['MEDICAID', 'MEDICARE', 'PRIVATE_INSURANCE', 'MANAGED_CARE', 'SELF_PAY', 'GRANT', 'OTHER']
    },
    isElectronic: {
      type: 'boolean'
    },
    status: {
      type: 'string'
    }
  },
  required: ['id', 'name', 'payerType', 'isElectronic']
};

/**
 * Schema defining a service summary for use in claim responses
 * @version 1.0.0
 */
const serviceSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    clientId: {
      type: 'string',
      format: 'uuid'
    },
    serviceCode: {
      type: 'string'
    },
    serviceDate: {
      type: 'string',
      format: 'date'
    },
    units: {
      type: 'number',
      format: 'float'
    },
    rate: {
      type: 'number',
      format: 'float'
    },
    amount: {
      type: 'number',
      format: 'float'
    },
    billedUnits: {
      type: 'number',
      format: 'float'
    },
    billedAmount: {
      type: 'number',
      format: 'float'
    },
    serviceLineNumber: {
      type: 'integer',
      nullable: true
    }
  },
  required: [
    'id',
    'clientId',
    'serviceCode',
    'serviceDate',
    'units',
    'rate',
    'amount'
  ]
};

/**
 * Schema defining a claim with its related entities
 * @version 1.0.0
 */
const claimWithRelationsSchema: OpenAPIV3.SchemaObject = {
  allOf: [
    { $ref: '#/components/schemas/Claim' },
    {
      type: 'object',
      properties: {
        client: {
          $ref: '#/components/schemas/ClientSummary'
        },
        payer: {
          $ref: '#/components/schemas/PayerSummary'
        },
        originalClaim: {
          $ref: '#/components/schemas/ClaimSummary',
          nullable: true
        },
        services: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ServiceSummary'
          }
        },
        statusHistory: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ClaimStatusHistory'
          }
        }
      }
    }
  ]
};

/**
 * Schema defining a simplified claim summary for lists and dashboards
 * @version 1.0.0
 */
const claimSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    claimNumber: {
      type: 'string'
    },
    clientId: {
      type: 'string',
      format: 'uuid'
    },
    clientName: {
      type: 'string'
    },
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    payerName: {
      type: 'string'
    },
    claimStatus: {
      type: 'string',
      enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    serviceStartDate: {
      type: 'string',
      format: 'date'
    },
    serviceEndDate: {
      type: 'string',
      format: 'date'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      nullable: true
    },
    claimAge: {
      type: 'integer',
      description: 'Age in days'
    }
  },
  required: [
    'id',
    'claimNumber',
    'clientId',
    'clientName',
    'payerId',
    'payerName',
    'claimStatus',
    'totalAmount',
    'serviceStartDate',
    'serviceEndDate',
    'claimAge'
  ]
};

/**
 * Schema defining a claim status history entry
 * @version 1.0.0
 */
const claimStatusHistorySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    claimId: {
      type: 'string',
      format: 'uuid'
    },
    status: {
      type: 'string',
      enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
    },
    timestamp: {
      type: 'string',
      format: 'date-time'
    },
    notes: {
      type: 'string',
      nullable: true
    },
    userId: {
      type: 'string',
      format: 'uuid',
      nullable: true
    }
  },
  required: ['id', 'claimId', 'status', 'timestamp']
};

/**
 * Schema for creating a new claim
 * @version 1.0.0
 */
const createClaimRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    clientId: {
      type: 'string',
      format: 'uuid'
    },
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    claimType: {
      type: 'string',
      enum: ['ORIGINAL', 'ADJUSTMENT', 'REPLACEMENT', 'VOID']
    },
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    },
    originalClaimId: {
      type: 'string',
      format: 'uuid',
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: ['clientId', 'payerId', 'claimType', 'serviceIds']
};

/**
 * Schema for updating an existing claim
 * @version 1.0.0
 */
const updateClaimRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: ['payerId', 'serviceIds']
};

/**
 * Schema for updating a claim's status
 * @version 1.0.0
 */
const updateClaimStatusRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
    },
    adjudicationDate: {
      type: 'string',
      format: 'date',
      nullable: true
    },
    denialReason: {
      type: 'string',
      enum: [
        'DUPLICATE_CLAIM',
        'SERVICE_NOT_COVERED',
        'AUTHORIZATION_MISSING',
        'AUTHORIZATION_INVALID',
        'CLIENT_INELIGIBLE',
        'PROVIDER_INELIGIBLE',
        'TIMELY_FILING',
        'INVALID_CODING',
        'MISSING_INFORMATION',
        'OTHER'
      ],
      nullable: true
    },
    denialDetails: {
      type: 'string',
      nullable: true
    },
    adjustmentCodes: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: ['status']
};

/**
 * Schema for submitting a claim to a payer
 * @version 1.0.0
 */
const submitClaimRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    submissionMethod: {
      type: 'string',
      enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT']
    },
    submissionDate: {
      type: 'string',
      format: 'date'
    },
    externalClaimId: {
      type: 'string',
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: ['submissionMethod', 'submissionDate']
};

/**
 * Schema for submitting multiple claims in a batch
 * @version 1.0.0
 */
const batchSubmitClaimsRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claimIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    },
    submissionMethod: {
      type: 'string',
      enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT']
    },
    submissionDate: {
      type: 'string',
      format: 'date'
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: ['claimIds', 'submissionMethod', 'submissionDate']
};

/**
 * Schema for claim validation error
 * @version 1.0.0
 */
const claimValidationErrorSchema: OpenAPIV3.SchemaObject = {
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
    },
    context: {
      type: 'object',
      nullable: true
    }
  },
  required: ['code', 'message']
};

/**
 * Schema for claim validation warning
 * @version 1.0.0
 */
const claimValidationWarningSchema: OpenAPIV3.SchemaObject = {
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
    },
    context: {
      type: 'object',
      nullable: true
    }
  },
  required: ['code', 'message']
};

/**
 * Schema for claim validation results
 * @version 1.0.0
 */
const claimValidationResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claimId: {
      type: 'string',
      format: 'uuid'
    },
    isValid: {
      type: 'boolean'
    },
    errors: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimValidationError'
      }
    },
    warnings: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimValidationWarning'
      }
    }
  },
  required: ['claimId', 'isValid', 'errors', 'warnings']
};

/**
 * Schema for batch claim validation results
 * @version 1.0.0
 */
const batchClaimValidationResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimValidationResult'
      }
    },
    isValid: {
      type: 'boolean'
    },
    totalErrors: {
      type: 'integer'
    },
    totalWarnings: {
      type: 'integer'
    }
  },
  required: ['results', 'isValid', 'totalErrors', 'totalWarnings']
};

/**
 * Schema for claim metrics used in dashboards and reporting
 * @version 1.0.0
 */
const claimMetricsSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    totalClaims: {
      type: 'integer'
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    statusBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: {
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
    agingBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          range: {
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
    denialRate: {
      type: 'number',
      format: 'float'
    },
    averageProcessingTime: {
      type: 'number',
      format: 'float'
    },
    claimsByPayer: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          payerId: {
            type: 'string',
            format: 'uuid'
          },
          payerName: {
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
  },
  required: ['totalClaims', 'totalAmount', 'statusBreakdown', 'agingBreakdown', 'denialRate']
};

/**
 * Schema for responses containing a single claim
 * @version 1.0.0
 */
const claimResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claim: {
      $ref: '#/components/schemas/ClaimWithRelations'
    }
  },
  required: ['claim']
};

/**
 * Schema for responses containing multiple claims with pagination
 * @version 1.0.0
 */
const claimsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimWithRelations'
      }
    },
    total: {
      type: 'integer'
    },
    page: {
      type: 'integer'
    },
    limit: {
      type: 'integer'
    },
    totalPages: {
      type: 'integer'
    }
  },
  required: ['claims', 'total', 'page', 'limit', 'totalPages']
};

/**
 * Schema for responses containing multiple claim summaries with pagination
 * @version 1.0.0
 */
const claimSummariesResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimSummary'
      }
    },
    total: {
      type: 'integer'
    },
    page: {
      type: 'integer'
    },
    limit: {
      type: 'integer'
    },
    totalPages: {
      type: 'integer'
    }
  },
  required: ['claims', 'total', 'page', 'limit', 'totalPages']
};

/**
 * Schema for responses containing claim validation results
 * @version 1.0.0
 */
const claimValidationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    validationResult: {
      $ref: '#/components/schemas/ClaimValidationResult'
    }
  },
  required: ['validationResult']
};

/**
 * Schema for responses containing batch claim validation results
 * @version 1.0.0
 */
const batchClaimValidationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimValidationResult'
      }
    },
    isValid: {
      type: 'boolean'
    },
    totalErrors: {
      type: 'integer'
    },
    totalWarnings: {
      type: 'integer'
    }
  },
  required: ['results', 'isValid', 'totalErrors', 'totalWarnings']
};

/**
 * Schema for responses containing batch claim submission results
 * @version 1.0.0
 */
const batchSubmitClaimsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    totalProcessed: {
      type: 'integer'
    },
    successCount: {
      type: 'integer'
    },
    errorCount: {
      type: 'integer'
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            format: 'uuid'
          },
          message: {
            type: 'string'
          }
        }
      }
    },
    processedClaims: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    }
  },
  required: ['totalProcessed', 'successCount', 'errorCount', 'errors', 'processedClaims']
};

/**
 * Schema for responses containing claim status history
 * @version 1.0.0
 */
const claimStatusHistoryResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    statusHistory: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimStatusHistory'
      }
    }
  },
  required: ['statusHistory']
};

/**
 * Schema for responses containing claim metrics
 * @version 1.0.0
 */
const claimMetricsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    metrics: {
      $ref: '#/components/schemas/ClaimMetrics'
    }
  },
  required: ['metrics']
};

/**
 * Defines all claim-related API paths with their operations
 * @version 1.0.0
 */
const claimPaths: OpenAPIV3.PathsObject = {
  '/claims': {
    get: {
      tags: ['Claims'],
      summary: 'Get all claims',
      description: 'Retrieves all claims with optional filtering and pagination',
      operationId: 'getAllClaims',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'clientId',
          in: 'query',
          description: 'Filter by client ID',
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
          name: 'claimStatus',
          in: 'query',
          description: 'Filter by claim status',
          schema: {
            type: 'string',
            enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
          }
        },
        {
          name: 'dateRangeStart',
          in: 'query',
          description: 'Filter by service start date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Filter by service end date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'includeServices',
          in: 'query',
          description: 'Include service details in response',
          schema: {
            type: 'boolean',
            default: false
          }
        },
        {
          name: 'includeStatusHistory',
          in: 'query',
          description: 'Include status history in response',
          schema: {
            type: 'boolean',
            default: false
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimsResponse'
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    post: {
      tags: ['Claims'],
      summary: 'Create claim',
      description: 'Creates a new claim',
      operationId: 'createClaim',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateClaimRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Claim created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/summaries': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim summaries',
      description: 'Retrieves summarized claim information for lists and dashboards',
      operationId: 'getClaimSummaries',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'clientId',
          in: 'query',
          description: 'Filter by client ID',
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
          name: 'claimStatus',
          in: 'query',
          description: 'Filter by claim status',
          schema: {
            type: 'string',
            enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
          }
        },
        {
          name: 'dateRangeStart',
          in: 'query',
          description: 'Filter by service start date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Filter by service end date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimSummariesResponse'
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/validate': {
    post: {
      tags: ['Claims'],
      summary: 'Batch validate claims',
      description: 'Validates multiple claims for submission readiness',
      operationId: 'batchValidateClaims',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                claimIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'uuid'
                  },
                  description: 'Array of claim IDs to validate'
                }
              },
              required: ['claimIds']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Validation results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchClaimValidationResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/submit': {
    post: {
      tags: ['Claims'],
      summary: 'Batch submit claims',
      description: 'Submits multiple validated claims to payers',
      operationId: 'batchSubmitClaims',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BatchSubmitClaimsRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Submission results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchSubmitClaimsResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/validate-submit': {
    post: {
      tags: ['Claims'],
      summary: 'Batch validate and submit claims',
      description: 'Validates and submits multiple claims in one operation',
      operationId: 'batchValidateAndSubmitClaims',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BatchSubmitClaimsRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Validation and submission results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchSubmitClaimsResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/refresh-status': {
    post: {
      tags: ['Claims'],
      summary: 'Batch refresh claim status',
      description: 'Refreshes the status of multiple claims by checking with clearinghouses or payers',
      operationId: 'batchRefreshClaimStatus',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                claimIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'uuid'
                  },
                  description: 'Array of claim IDs to refresh'
                }
              },
              required: ['claimIds']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status refresh results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalProcessed: {
                    type: 'integer'
                  },
                  successCount: {
                    type: 'integer'
                  },
                  errorCount: {
                    type: 'integer'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        claimId: {
                          type: 'string',
                          format: 'uuid'
                        },
                        message: {
                          type: 'string'
                        }
                      }
                    }
                  },
                  processedClaims: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid'
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/aging': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim aging report',
      description: 'Generates an aging report for claims based on their current status and age',
      operationId: 'getClaimAging',
      parameters: [
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
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
        },
        {
          name: 'dateRangeStart',
          in: 'query',
          description: 'Filter by service start date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Filter by service end date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Aging report data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  agingBuckets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        range: {
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
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  },
                  totalClaims: {
                    type: 'integer'
                  }
                }
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/metrics': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim metrics',
      description: 'Retrieves claim metrics for dashboard and reporting',
      operationId: 'getClaimMetrics',
      parameters: [
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
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
        },
        {
          name: 'dateRange',
          in: 'query',
          description: 'Date range (current-month, previous-month, current-quarter, previous-quarter, ytd, custom)',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'dateRangeStart',
          in: 'query',
          description: 'Custom date range start (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Custom date range end (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claim metrics data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimMetricsResponse'
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/status/{status}': {
    get: {
      tags: ['Claims'],
      summary: 'Get claims by status',
      description: 'Retrieves claims filtered by status',
      operationId: 'getClaimsByStatus',
      parameters: [
        {
          name: 'status',
          in: 'path',
          required: true,
          description: 'Claim status to filter by',
          schema: {
            type: 'string',
            enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
          }
        },
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'clientId',
          in: 'query',
          description: 'Filter by client ID',
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
          name: 'dateRangeStart',
          in: 'query',
          description: 'Filter by service start date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Filter by service end date (inclusive)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'includeServices',
          in: 'query',
          description: 'Include service details in response',
          schema: {
            type: 'boolean',
            default: false
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimsResponse'
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim by ID',
      description: 'Retrieves a claim by its ID',
      operationId: 'getClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'includeServices',
          in: 'query',
          description: 'Include service details in response',
          schema: {
            type: 'boolean',
            default: true
          }
        },
        {
          name: 'includeStatusHistory',
          in: 'query',
          description: 'Include status history in response',
          schema: {
            type: 'boolean',
            default: true
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    },
    put: {
      tags: ['Claims'],
      summary: 'Update claim',
      description: 'Updates an existing claim',
      operationId: 'updateClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              $ref: '#/components/schemas/UpdateClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
          description: 'Forbidden',
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
        },
        '409': {
          description: 'Claim cannot be updated in current state',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/validate': {
    post: {
      tags: ['Claims'],
      summary: 'Validate claim',
      description: 'Validates a claim for submission readiness',
      operationId: 'validateClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Validation results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimValidationResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/submit': {
    post: {
      tags: ['Claims'],
      summary: 'Submit claim',
      description: 'Submits a validated claim to a payer',
      operationId: 'submitClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              $ref: '#/components/schemas/SubmitClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim submitted successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or claim not valid for submission',
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
          description: 'Forbidden',
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
        },
        '409': {
          description: 'Claim already submitted',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/validate-submit': {
    post: {
      tags: ['Claims'],
      summary: 'Validate and submit claim',
      description: 'Validates and submits a claim in one operation',
      operationId: 'validateAndSubmitClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              $ref: '#/components/schemas/SubmitClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim validated and submitted successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or claim validation failed',
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
          description: 'Forbidden',
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
        },
        '409': {
          description: 'Claim already submitted',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/resubmit': {
    post: {
      tags: ['Claims'],
      summary: 'Resubmit claim',
      description: 'Resubmits a previously submitted claim that was rejected or denied',
      operationId: 'resubmitClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              $ref: '#/components/schemas/SubmitClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim resubmitted successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or claim not eligible for resubmission',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/status': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim status',
      description: 'Retrieves the current status of a claim',
      operationId: 'getClaimStatus',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claim status information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
                  },
                  statusDate: {
                    type: 'string',
                    format: 'date-time'
                  },
                  claimAge: {
                    type: 'integer',
                    description: 'Age in days'
                  },
                  submissionDate: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true
                  },
                  adjudicationDate: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true
                  },
                  denialReason: {
                    type: 'string',
                    nullable: true
                  },
                  denialDetails: {
                    type: 'string',
                    nullable: true
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    },
    put: {
      tags: ['Claims'],
      summary: 'Update claim status',
      description: 'Updates the status of a claim',
      operationId: 'updateClaimStatus',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              $ref: '#/components/schemas/UpdateClaimStatusRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim status updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or invalid status transition',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/refresh-status': {
    post: {
      tags: ['Claims'],
      summary: 'Refresh claim status',
      description: 'Refreshes the status of a claim by checking with the clearinghouse or payer',
      operationId: 'refreshClaimStatus',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claim status refreshed successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
        },
        '422': {
          description: 'Claim not eligible for status refresh',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/timeline': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim timeline',
      description: "Generates a detailed timeline of a claim's lifecycle",
      operationId: 'getClaimTimeline',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claim timeline information',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimStatusHistoryResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/void': {
    post: {
      tags: ['Claims'],
      summary: 'Void claim',
      description: 'Voids a claim, marking it as no longer valid',
      operationId: 'voidClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'Notes explaining why the claim is being voided'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim voided successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
        },
        '409': {
          description: 'Claim cannot be voided in current state',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/appeal': {
    post: {
      tags: ['Claims'],
      summary: 'Appeal claim',
      description: 'Creates an appeal for a denied claim',
      operationId: 'appealClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
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
              type: 'object',
              properties: {
                appealReason: {
                  type: 'string',
                  description: 'Reason for appealing the claim'
                },
                supportingDocuments: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'IDs of supporting documents for the appeal'
                }
              },
              required: ['appealReason']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim appealed successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or claim not eligible for appeal',
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
          description: 'Forbidden',
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
        },
        '409': {
          description: 'Claim cannot be appealed in current state',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/adjust': {
    post: {
      tags: ['Claims'],
      summary: 'Create adjustment claim',
      description: 'Creates an adjustment claim based on an existing claim',
      operationId: 'createAdjustmentClaim',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Original claim ID',
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
              $ref: '#/components/schemas/CreateClaimRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Adjustment claim created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClaimResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or original claim not eligible for adjustment',
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
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Original claim not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/claims/{id}/lifecycle': {
    get: {
      tags: ['Claims'],
      summary: 'Get claim lifecycle',
      description: 'Retrieves the complete lifecycle information for a claim',
      operationId: 'getClaimLifecycle',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Claim ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Claim lifecycle information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  claim: {
                    $ref: '#/components/schemas/ClaimWithRelations'
                  },
                  statusHistory: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClaimStatusHistory'
                    }
                  },
                  relatedClaims: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClaimSummary'
                    }
                  },
                  timeline: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: {
                          type: 'string',
                          format: 'date-time'
                        },
                        event: {
                          type: 'string'
                        },
                        details: {
                          type: 'object'
                        },
                        user: {
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
        },
        '400': {
          description: 'Invalid ID format',
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
          description: 'Forbidden',
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
      },
      security: [{ bearerAuth: [] }]
    }
  }
};

/**
 * Export the Claims API paths for use in the Swagger documentation
 */
export default claimPaths;