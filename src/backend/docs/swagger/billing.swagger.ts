import { OpenAPIV3 } from '../../config/swagger.config';

// Schema definitions for service validation
const serviceValidationSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    serviceId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the service being validated'
    },
    isValid: {
      type: 'boolean',
      description: 'Whether the service is valid for billing'
    },
    errors: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ServiceValidationError'
      },
      description: 'Validation errors'
    },
    warnings: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ServiceValidationWarning'
      },
      description: 'Validation warnings'
    },
    documentation: {
      $ref: '#/components/schemas/DocumentationValidationResult',
      description: 'Documentation validation results'
    },
    authorization: {
      $ref: '#/components/schemas/AuthorizationValidationResult',
      description: 'Authorization validation results'
    }
  },
  required: ['serviceId', 'isValid', 'errors', 'warnings', 'documentation', 'authorization']
};

// Schema for documentation validation
const documentationValidationSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    isComplete: {
      type: 'boolean',
      description: 'Whether documentation is complete'
    },
    missingItems: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of missing documentation items'
    },
    serviceId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the service being validated'
    }
  },
  required: ['isComplete', 'missingItems', 'serviceId']
};

// Schema for authorization validation
const authorizationValidationSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    isAuthorized: {
      type: 'boolean',
      description: 'Whether service is authorized'
    },
    authorizationId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'ID of the authorization if found'
    },
    serviceId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the service being validated'
    },
    errors: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of authorization errors'
    },
    authorizedUnits: {
      type: 'number',
      format: 'float',
      nullable: true,
      description: 'Total units authorized'
    },
    usedUnits: {
      type: 'number',
      format: 'float',
      nullable: true,
      description: 'Units already used'
    },
    remainingUnits: {
      type: 'number',
      format: 'float',
      nullable: true,
      description: 'Units remaining in authorization'
    },
    expirationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'Expiration date of the authorization'
    }
  },
  required: ['isAuthorized', 'serviceId', 'errors']
};

// Schema for service validation error
const serviceValidationErrorSchema: OpenAPIV3.SchemaObject = {
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
      description: 'Field with error, if applicable'
    }
  },
  required: ['code', 'message']
};

// Schema for service validation warning
const serviceValidationWarningSchema: OpenAPIV3.SchemaObject = {
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
      description: 'Field with warning, if applicable'
    }
  },
  required: ['code', 'message']
};

// Schema for billing validation request
const billingValidationRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'IDs of services to validate'
    }
  },
  required: ['serviceIds']
};

// Schema for billing validation result
const billingValidationResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    serviceId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the service being validated'
    },
    isValid: {
      type: 'boolean',
      description: 'Whether the service is valid for billing'
    },
    errors: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ServiceValidationError'
      },
      description: 'Validation errors'
    },
    warnings: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ServiceValidationWarning'
      },
      description: 'Validation warnings'
    },
    documentation: {
      $ref: '#/components/schemas/DocumentationValidationResult',
      description: 'Documentation validation results'
    },
    authorization: {
      $ref: '#/components/schemas/AuthorizationValidationResult',
      description: 'Authorization validation results'
    }
  },
  required: ['serviceId', 'isValid', 'errors', 'warnings', 'documentation', 'authorization']
};

// Schema for billing validation response
const billingValidationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/BillingValidationResult'
      },
      description: 'Validation results for each service'
    },
    isValid: {
      type: 'boolean',
      description: 'Whether all services are valid for billing'
    },
    totalErrors: {
      type: 'integer',
      description: 'Total number of errors across all services'
    },
    totalWarnings: {
      type: 'integer',
      description: 'Total number of warnings across all services'
    }
  },
  required: ['results', 'isValid', 'totalErrors', 'totalWarnings']
};

// Schema for service-to-claim request
const serviceToClaimRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    serviceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'IDs of services to convert to a claim'
    },
    payerId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the payer for the claim'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Optional notes for the claim'
    }
  },
  required: ['serviceIds', 'payerId']
};

// Schema for service-to-claim response
const serviceToClaimResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claim: {
      $ref: '#/components/schemas/ClaimSummary',
      nullable: true,
      description: 'Created claim if successful'
    },
    validationResult: {
      $ref: '#/components/schemas/ValidationResult',
      nullable: true,
      description: 'Validation results if validation failed'
    },
    success: {
      type: 'boolean',
      description: 'Whether the conversion was successful'
    },
    message: {
      type: 'string',
      description: 'Message describing the result'
    }
  },
  required: ['success', 'message']
};

// Schema for billing submission request
const billingSubmissionRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claimId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the claim to submit'
    },
    submissionMethod: {
      type: 'string',
      enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT'],
      description: 'Method of claim submission'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      description: 'Date of submission'
    },
    externalClaimId: {
      type: 'string',
      nullable: true,
      description: 'External claim ID if available'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Optional notes for the submission'
    }
  },
  required: ['claimId', 'submissionMethod', 'submissionDate']
};

// Schema for billing submission response
const billingSubmissionResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Whether the submission was successful'
    },
    message: {
      type: 'string',
      description: 'Message describing the result'
    },
    confirmationNumber: {
      type: 'string',
      nullable: true,
      description: 'Confirmation number from the payer or clearinghouse'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      description: 'Date of submission'
    },
    claimId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the submitted claim'
    },
    validationResult: {
      $ref: '#/components/schemas/ValidationResult',
      nullable: true,
      description: 'Validation results if validation failed'
    }
  },
  required: ['success', 'message', 'submissionDate', 'claimId']
};

// Schema for batch billing submission request
const batchBillingSubmissionRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claimIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'IDs of claims to submit'
    },
    submissionMethod: {
      type: 'string',
      enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT'],
      description: 'Method of claim submission'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      description: 'Date of submission'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Optional notes for the submission'
    }
  },
  required: ['claimIds', 'submissionMethod', 'submissionDate']
};

// Schema for batch billing submission response
const batchBillingSubmissionResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    totalProcessed: {
      type: 'integer',
      description: 'Total number of claims processed'
    },
    successCount: {
      type: 'integer',
      description: 'Number of successfully submitted claims'
    },
    errorCount: {
      type: 'integer',
      description: 'Number of failed submissions'
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the claim that failed'
          },
          message: {
            type: 'string',
            description: 'Error message'
          }
        },
        required: ['claimId', 'message']
      },
      description: 'Details of errors encountered'
    },
    processedClaims: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      },
      description: 'IDs of successfully submitted claims'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      description: 'Date of submission'
    }
  },
  required: ['totalProcessed', 'successCount', 'errorCount', 'errors', 'processedClaims', 'submissionDate']
};

// Schema for billing queue filter
const billingQueueFilterSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'Filter by client ID'
    },
    programId: {
      type: 'string',
      format: 'uuid',
      description: 'Filter by program ID'
    },
    serviceTypeId: {
      type: 'string',
      format: 'uuid',
      description: 'Filter by service type ID'
    },
    payerId: {
      type: 'string',
      format: 'uuid',
      description: 'Filter by payer ID'
    },
    dateRangeStart: {
      type: 'string',
      format: 'date',
      description: 'Filter by service start date (inclusive)'
    },
    dateRangeEnd: {
      type: 'string',
      format: 'date',
      description: 'Filter by service end date (inclusive)'
    },
    documentationStatus: {
      type: 'string',
      enum: ['COMPLETE', 'INCOMPLETE', 'PENDING_REVIEW'],
      description: 'Filter by documentation status'
    },
    billingStatus: {
      type: 'string',
      enum: ['UNBILLED', 'BILLED', 'READY_TO_BILL', 'HOLD', 'DENIED', 'VOID'],
      description: 'Filter by billing status'
    }
  }
};

// Schema for billing queue response
const billingQueueResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    services: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ServiceSummary'
      },
      description: 'Services ready for billing'
    },
    total: {
      type: 'integer',
      description: 'Total number of services matching the filter'
    },
    page: {
      type: 'integer',
      description: 'Current page number'
    },
    limit: {
      type: 'integer',
      description: 'Number of items per page'
    },
    totalPages: {
      type: 'integer',
      description: 'Total number of pages'
    },
    totalAmount: {
      type: 'number',
      format: 'float',
      description: 'Total amount of all services matching the filter'
    }
  },
  required: ['services', 'total', 'page', 'limit', 'totalPages', 'totalAmount']
};

// Schema for billing dashboard metrics
const billingDashboardMetricsSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    unbilledServicesCount: {
      type: 'integer',
      description: 'Number of services ready for billing'
    },
    unbilledServicesAmount: {
      type: 'number',
      format: 'float',
      description: 'Total amount of unbilled services'
    },
    incompleteDocumentationCount: {
      type: 'integer',
      description: 'Number of services with incomplete documentation'
    },
    pendingClaimsCount: {
      type: 'integer',
      description: 'Number of claims pending adjudication'
    },
    pendingClaimsAmount: {
      type: 'number',
      format: 'float',
      description: 'Total amount of pending claims'
    },
    upcomingFilingDeadlines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          serviceCount: {
            type: 'integer',
            description: 'Number of services approaching deadline'
          },
          daysRemaining: {
            type: 'integer',
            description: 'Days remaining until deadline'
          },
          amount: {
            type: 'number',
            format: 'float',
            description: 'Total amount of services approaching deadline'
          }
        },
        required: ['serviceCount', 'daysRemaining', 'amount']
      },
      description: 'Services approaching filing deadlines'
    },
    recentBillingActivity: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
            description: 'Activity date'
          },
          claimsSubmitted: {
            type: 'integer',
            description: 'Number of claims submitted'
          },
          amount: {
            type: 'number',
            format: 'float',
            description: 'Total amount of claims submitted'
          }
        },
        required: ['date', 'claimsSubmitted', 'amount']
      },
      description: 'Recent billing activity'
    }
  },
  required: ['unbilledServicesCount', 'unbilledServicesAmount', 'incompleteDocumentationCount', 'pendingClaimsCount', 'pendingClaimsAmount', 'upcomingFilingDeadlines', 'recentBillingActivity']
};

// Additional required schemas for references
const claimSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Claim ID'
    },
    claimNumber: {
      type: 'string',
      description: 'Claim number'
    },
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'Client ID'
    },
    clientName: {
      type: 'string',
      description: 'Client name'
    },
    payerId: {
      type: 'string',
      format: 'uuid',
      description: 'Payer ID'
    },
    payerName: {
      type: 'string',
      description: 'Payer name'
    },
    claimStatus: {
      type: 'string',
      enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED'],
      description: 'Current claim status'
    },
    totalAmount: {
      type: 'number',
      format: 'float',
      description: 'Total claim amount'
    },
    serviceStartDate: {
      type: 'string',
      format: 'date',
      description: 'First service date in claim'
    },
    serviceEndDate: {
      type: 'string',
      format: 'date',
      description: 'Last service date in claim'
    },
    submissionDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'Date claim was submitted'
    },
    claimAge: {
      type: 'integer',
      description: 'Age of claim in days'
    }
  },
  required: ['id', 'claimNumber', 'clientId', 'clientName', 'payerId', 'payerName', 'claimStatus', 'totalAmount', 'serviceStartDate', 'serviceEndDate', 'claimAge']
};

const serviceSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Service ID'
    },
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'Client ID'
    },
    clientName: {
      type: 'string',
      description: 'Client name'
    },
    serviceCode: {
      type: 'string',
      description: 'Service code'
    },
    serviceDescription: {
      type: 'string',
      description: 'Service description'
    },
    serviceDate: {
      type: 'string',
      format: 'date',
      description: 'Date of service'
    },
    units: {
      type: 'number',
      format: 'float',
      description: 'Service units'
    },
    rate: {
      type: 'number',
      format: 'float',
      description: 'Rate per unit'
    },
    amount: {
      type: 'number',
      format: 'float',
      description: 'Total service amount'
    },
    programId: {
      type: 'string',
      format: 'uuid',
      description: 'Program ID'
    },
    programName: {
      type: 'string',
      description: 'Program name'
    },
    documentationStatus: {
      type: 'string',
      enum: ['COMPLETE', 'INCOMPLETE', 'PENDING_REVIEW'],
      description: 'Documentation status'
    },
    billingStatus: {
      type: 'string',
      enum: ['UNBILLED', 'BILLED', 'READY_TO_BILL', 'HOLD', 'DENIED', 'VOID'],
      description: 'Billing status'
    },
    authorizationId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Authorization ID if applicable'
    }
  },
  required: ['id', 'clientId', 'clientName', 'serviceCode', 'serviceDate', 'units', 'rate', 'amount', 'documentationStatus', 'billingStatus']
};

const validationResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    isValid: {
      type: 'boolean',
      description: 'Whether validation passed'
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
            description: 'Field with error, if applicable'
          }
        },
        required: ['code', 'message']
      },
      description: 'Validation errors'
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
            description: 'Field with warning, if applicable'
          }
        },
        required: ['code', 'message']
      },
      description: 'Validation warnings'
    }
  },
  required: ['isValid', 'errors', 'warnings']
};

// Define API paths
const billingPaths: OpenAPIV3.PathsObject = {
  '/billing/validate': {
    post: {
      tags: ['Billing'],
      summary: 'Validate services for billing',
      description: 'Validates services against all billing requirements including documentation and authorization',
      operationId: 'validateServicesForBilling',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BillingValidationRequest'
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
                $ref: '#/components/schemas/BillingValidationResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/convert': {
    post: {
      tags: ['Billing'],
      summary: 'Convert services to claim',
      description: 'Converts validated services into a billable claim',
      operationId: 'convertServicesToClaim',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ServiceToClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Claim created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceToClaimResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/validate-convert': {
    post: {
      tags: ['Billing'],
      summary: 'Validate and convert services to claim',
      description: 'Validates services and converts them to a claim if validation is successful',
      operationId: 'validateAndConvertToClaim',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ServiceToClaimRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Validation and conversion results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceToClaimResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/batch-convert': {
    post: {
      tags: ['Billing'],
      summary: 'Batch convert services to claims',
      description: 'Converts multiple sets of services into claims in a batch process',
      operationId: 'batchConvertServicesToClaims',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  serviceIds: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid'
                    },
                    description: 'IDs of services to convert to a claim'
                  },
                  payerId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the payer for the claim'
                  },
                  notes: {
                    type: 'string',
                    nullable: true,
                    description: 'Optional notes for the claim'
                  }
                },
                required: ['serviceIds', 'payerId']
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Batch conversion results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalProcessed: {
                    type: 'integer',
                    description: 'Total number of batches processed'
                  },
                  successCount: {
                    type: 'integer',
                    description: 'Number of successfully created claims'
                  },
                  errorCount: {
                    type: 'integer',
                    description: 'Number of failed claim creations'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: {
                          type: 'integer',
                          description: 'Index of the failed batch'
                        },
                        message: {
                          type: 'string',
                          description: 'Error message'
                        }
                      }
                    },
                    description: 'Details of errors encountered'
                  },
                  createdClaimIds: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid'
                    },
                    description: 'IDs of successfully created claims'
                  }
                },
                required: ['totalProcessed', 'successCount', 'errorCount', 'errors', 'createdClaimIds']
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/submit': {
    post: {
      tags: ['Billing'],
      summary: 'Submit claim',
      description: 'Submits a validated claim to a payer through the specified submission method',
      operationId: 'submitClaim',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BillingSubmissionRequest'
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
                $ref: '#/components/schemas/BillingSubmissionResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/validate-submit': {
    post: {
      tags: ['Billing'],
      summary: 'Validate and submit claim',
      description: 'Validates a claim and submits it if validation is successful',
      operationId: 'validateAndSubmitClaim',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BillingSubmissionRequest'
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
                $ref: '#/components/schemas/BillingSubmissionResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/batch-submit': {
    post: {
      tags: ['Billing'],
      summary: 'Batch submit claims',
      description: 'Submits multiple validated claims to payers in a batch process',
      operationId: 'batchSubmitClaims',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BatchBillingSubmissionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Batch submission results',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchBillingSubmissionResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/queue': {
    get: {
      tags: ['Billing'],
      summary: 'Get billing queue',
      description: 'Retrieves services that are ready for billing with optional filtering',
      operationId: 'getBillingQueue',
      parameters: [
        {
          $ref: '#/components/parameters/PageParam'
        },
        {
          $ref: '#/components/parameters/LimitParam'
        },
        {
          $ref: '#/components/parameters/SortByParam'
        },
        {
          $ref: '#/components/parameters/SortOrderParam'
        },
        {
          $ref: '#/components/parameters/SearchParam'
        },
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'serviceTypeId',
          in: 'query',
          description: 'Filter by service type ID',
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
          name: 'documentationStatus',
          in: 'query',
          description: 'Filter by documentation status',
          schema: {
            type: 'string',
            enum: ['COMPLETE', 'INCOMPLETE', 'PENDING_REVIEW']
          }
        },
        {
          name: 'billingStatus',
          in: 'query',
          description: 'Filter by billing status',
          schema: {
            type: 'string',
            enum: ['UNBILLED', 'BILLED', 'READY_TO_BILL', 'HOLD', 'DENIED', 'VOID']
          }
        }
      ],
      responses: {
        '200': {
          description: 'Billing queue retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BillingQueueResponse'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/claims/{id}/validate-submission': {
    post: {
      tags: ['Billing'],
      summary: 'Validate claim submission requirements',
      description: 'Validates that a claim meets all requirements for submission',
      operationId: 'validateSubmissionRequirements',
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
                submissionMethod: {
                  type: 'string',
                  enum: ['ELECTRONIC', 'PAPER', 'PORTAL', 'CLEARINGHOUSE', 'DIRECT'],
                  description: 'Method of claim submission'
                }
              },
              required: ['submissionMethod']
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
                $ref: '#/components/schemas/ValidationResult'
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
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  '/billing/dashboard': {
    get: {
      tags: ['Billing'],
      summary: 'Get billing dashboard metrics',
      description: 'Retrieves metrics for the billing dashboard',
      operationId: 'getBillingDashboardMetrics',
      responses: {
        '200': {
          description: 'Dashboard metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BillingDashboardMetrics'
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
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  }
};

// Export the billing paths for use in the complete swagger documentation
export default billingPaths;