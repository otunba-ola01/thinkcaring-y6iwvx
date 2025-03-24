import { OpenAPIV3 } from '../../config/swagger.config';

// Schema Definitions

/**
 * Schema for a payment object with all its properties
 */
const paymentSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    paymentDate: {
      type: 'string',
      format: 'date'
    },
    paymentAmount: {
      type: 'number',
      format: 'float'
    },
    paymentMethod: {
      type: 'string',
      enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
    },
    referenceNumber: {
      type: 'string',
      nullable: true
    },
    checkNumber: {
      type: 'string',
      nullable: true
    },
    remittanceId: {
      type: 'string',
      nullable: true
    },
    reconciliationStatus: {
      type: 'string',
      enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
    },
    notes: {
      type: 'string',
      nullable: true
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
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
    'payerId', 
    'paymentDate', 
    'paymentAmount', 
    'paymentMethod', 
    'reconciliationStatus', 
    'status', 
    'createdAt', 
    'updatedAt'
  ]
};

/**
 * Schema for a payment with related entities like payer, claim payments, and remittance info
 */
const paymentWithRelationsSchema: OpenAPIV3.SchemaObject = {
  allOf: [
    { $ref: '#/components/schemas/Payment' },
    {
      type: 'object',
      properties: {
        payer: {
          $ref: '#/components/schemas/PayerSummary'
        },
        claimPayments: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ClaimPayment'
          }
        },
        remittanceInfo: {
          $ref: '#/components/schemas/RemittanceInfo',
          nullable: true
        }
      }
    }
  ]
};

/**
 * Schema for a simplified payment summary used in lists and dashboards
 */
const paymentSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    payerName: {
      type: 'string'
    },
    paymentDate: {
      type: 'string',
      format: 'date'
    },
    paymentAmount: {
      type: 'number',
      format: 'float'
    },
    paymentMethod: {
      type: 'string',
      enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
    },
    referenceNumber: {
      type: 'string',
      nullable: true
    },
    reconciliationStatus: {
      type: 'string',
      enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
    },
    claimCount: {
      type: 'integer'
    }
  },
  required: [
    'id', 
    'payerId', 
    'payerName', 
    'paymentDate', 
    'paymentAmount', 
    'paymentMethod', 
    'reconciliationStatus'
  ]
};

/**
 * Schema for the association between payments and claims
 */
const claimPaymentSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    paymentId: {
      type: 'string',
      format: 'uuid'
    },
    claimId: {
      type: 'string',
      format: 'uuid'
    },
    paidAmount: {
      type: 'number',
      format: 'float'
    },
    claim: {
      $ref: '#/components/schemas/ClaimSummary'
    },
    adjustments: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/PaymentAdjustment'
      }
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'id', 
    'paymentId', 
    'claimId', 
    'paidAmount', 
    'status', 
    'createdAt', 
    'updatedAt'
  ]
};

/**
 * Schema for payment adjustments such as contractual adjustments, deductibles, etc.
 */
const paymentAdjustmentSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    claimPaymentId: {
      type: 'string',
      format: 'uuid'
    },
    adjustmentType: {
      type: 'string',
      enum: ['CONTRACTUAL', 'DEDUCTIBLE', 'COINSURANCE', 'COPAY', 'NONCOVERED', 'TRANSFER', 'OTHER']
    },
    adjustmentCode: {
      type: 'string'
    },
    adjustmentAmount: {
      type: 'number',
      format: 'float'
    },
    description: {
      type: 'string',
      nullable: true
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'id', 
    'claimPaymentId', 
    'adjustmentType', 
    'adjustmentCode', 
    'adjustmentAmount', 
    'status', 
    'createdAt', 
    'updatedAt'
  ]
};

/**
 * Schema for remittance advice information associated with a payment
 */
const remittanceInfoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    paymentId: {
      type: 'string',
      format: 'uuid'
    },
    remittanceNumber: {
      type: 'string'
    },
    remittanceDate: {
      type: 'string',
      format: 'date'
    },
    payerIdentifier: {
      type: 'string'
    },
    payerName: {
      type: 'string'
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    claimCount: {
      type: 'integer'
    },
    fileType: {
      type: 'string',
      enum: ['EDI_835', 'CSV', 'PDF', 'EXCEL', 'CUSTOM']
    },
    originalFilename: {
      type: 'string',
      nullable: true
    },
    storageLocation: {
      type: 'string',
      nullable: true
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'id', 
    'paymentId', 
    'remittanceNumber', 
    'remittanceDate', 
    'payerIdentifier', 
    'payerName', 
    'totalAmount', 
    'claimCount', 
    'fileType', 
    'status', 
    'createdAt', 
    'updatedAt'
  ]
};

/**
 * Schema for detailed line items within a remittance advice
 */
const remittanceDetailSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid'
    },
    remittanceInfoId: {
      type: 'string',
      format: 'uuid'
    },
    claimNumber: {
      type: 'string'
    },
    claimId: {
      type: 'string',
      format: 'uuid',
      nullable: true
    },
    serviceDate: {
      type: 'string',
      format: 'date'
    },
    billedAmount: {
      type: 'number',
      format: 'float'
    },
    paidAmount: {
      type: 'number',
      format: 'float'
    },
    adjustmentAmount: {
      type: 'number',
      format: 'float'
    },
    adjustmentCodes: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      nullable: true
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'DELETED']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'id', 
    'remittanceInfoId', 
    'claimNumber', 
    'serviceDate', 
    'billedAmount', 
    'paidAmount', 
    'adjustmentAmount', 
    'status', 
    'createdAt', 
    'updatedAt'
  ]
};

/**
 * Schema for creating a new payment
 */
const createPaymentRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    paymentDate: {
      type: 'string',
      format: 'date'
    },
    paymentAmount: {
      type: 'number',
      format: 'float'
    },
    paymentMethod: {
      type: 'string',
      enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
    },
    referenceNumber: {
      type: 'string',
      nullable: true
    },
    checkNumber: {
      type: 'string',
      nullable: true
    },
    remittanceId: {
      type: 'string',
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: [
    'payerId', 
    'paymentDate', 
    'paymentAmount', 
    'paymentMethod'
  ]
};

/**
 * Schema for updating an existing payment
 */
const updatePaymentRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    paymentDate: {
      type: 'string',
      format: 'date'
    },
    paymentAmount: {
      type: 'number',
      format: 'float'
    },
    paymentMethod: {
      type: 'string',
      enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
    },
    referenceNumber: {
      type: 'string',
      nullable: true
    },
    checkNumber: {
      type: 'string',
      nullable: true
    },
    remittanceId: {
      type: 'string',
      nullable: true
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: [
    'payerId', 
    'paymentDate', 
    'paymentAmount', 
    'paymentMethod'
  ]
};

/**
 * Schema for reconciling a payment with claims
 */
const reconcilePaymentRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    claimPayments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            format: 'uuid'
          },
          amount: {
            type: 'number',
            format: 'float'
          },
          adjustments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                adjustmentType: {
                  type: 'string',
                  enum: ['CONTRACTUAL', 'DEDUCTIBLE', 'COINSURANCE', 'COPAY', 'NONCOVERED', 'TRANSFER', 'OTHER']
                },
                adjustmentCode: {
                  type: 'string'
                },
                adjustmentAmount: {
                  type: 'number',
                  format: 'float'
                },
                description: {
                  type: 'string',
                  nullable: true
                }
              },
              required: [
                'adjustmentType',
                'adjustmentCode',
                'adjustmentAmount'
              ]
            }
          }
        },
        required: [
          'claimId',
          'amount'
        ]
      }
    },
    notes: {
      type: 'string',
      nullable: true
    }
  },
  required: [
    'claimPayments'
  ]
};

/**
 * Schema for importing a remittance advice file
 */
const importRemittanceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payerId: {
      type: 'string',
      format: 'uuid'
    },
    fileContent: {
      type: 'string',
      format: 'binary'
    },
    fileType: {
      type: 'string',
      enum: ['EDI_835', 'CSV', 'PDF', 'EXCEL', 'CUSTOM']
    },
    originalFilename: {
      type: 'string'
    },
    mappingConfig: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      },
      nullable: true
    }
  },
  required: [
    'payerId',
    'fileContent',
    'fileType',
    'originalFilename'
  ]
};

/**
 * Schema for the results of processing a remittance advice file
 */
const remittanceProcessingResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payment: {
      $ref: '#/components/schemas/PaymentWithRelations'
    },
    remittanceInfo: {
      $ref: '#/components/schemas/RemittanceInfo'
    },
    detailsProcessed: {
      type: 'integer'
    },
    claimsMatched: {
      type: 'integer'
    },
    claimsUnmatched: {
      type: 'integer'
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    matchedAmount: {
      type: 'number',
      format: 'float'
    },
    unmatchedAmount: {
      type: 'number',
      format: 'float'
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          line: {
            type: 'integer'
          },
          message: {
            type: 'string'
          }
        }
      }
    }
  },
  required: [
    'payment',
    'remittanceInfo',
    'detailsProcessed',
    'claimsMatched',
    'claimsUnmatched',
    'totalAmount',
    'matchedAmount',
    'unmatchedAmount',
    'errors'
  ]
};

/**
 * Schema for the results of reconciling a payment with claims
 */
const reconciliationResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payment: {
      $ref: '#/components/schemas/PaymentWithRelations'
    },
    claimPayments: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClaimPayment'
      }
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    matchedAmount: {
      type: 'number',
      format: 'float'
    },
    unmatchedAmount: {
      type: 'number',
      format: 'float'
    },
    reconciliationStatus: {
      type: 'string',
      enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
    },
    updatedClaims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            format: 'uuid'
          },
          previousStatus: {
            type: 'string',
            enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
          },
          newStatus: {
            type: 'string',
            enum: ['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'PENDING', 'PAID', 'PARTIAL_PAID', 'DENIED', 'APPEALED', 'VOID', 'FINAL_DENIED']
          }
        }
      }
    }
  },
  required: [
    'payment',
    'claimPayments',
    'totalAmount',
    'matchedAmount',
    'unmatchedAmount',
    'reconciliationStatus',
    'updatedClaims'
  ]
};

/**
 * Schema for payment metrics used in dashboards and reporting
 */
const paymentMetricsSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    totalPayments: {
      type: 'integer'
    },
    totalAmount: {
      type: 'number',
      format: 'float'
    },
    reconciliationBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
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
    paymentMethodBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
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
    paymentsByPayer: {
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
    },
    paymentTrend: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          period: {
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
    averagePaymentAmount: {
      type: 'number',
      format: 'float'
    }
  },
  required: [
    'totalPayments',
    'totalAmount',
    'reconciliationBreakdown',
    'paymentMethodBreakdown',
    'paymentsByPayer',
    'paymentTrend',
    'averagePaymentAmount'
  ]
};

/**
 * Schema for accounts receivable aging report data
 */
const accountsReceivableAgingSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    asOfDate: {
      type: 'string',
      format: 'date'
    },
    totalOutstanding: {
      type: 'number',
      format: 'float'
    },
    current: {
      type: 'number',
      format: 'float'
    },
    days1to30: {
      type: 'number',
      format: 'float'
    },
    days31to60: {
      type: 'number',
      format: 'float'
    },
    days61to90: {
      type: 'number',
      format: 'float'
    },
    days91Plus: {
      type: 'number',
      format: 'float'
    },
    agingByPayer: {
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
          current: {
            type: 'number',
            format: 'float'
          },
          days1to30: {
            type: 'number',
            format: 'float'
          },
          days31to60: {
            type: 'number',
            format: 'float'
          },
          days61to90: {
            type: 'number',
            format: 'float'
          },
          days91Plus: {
            type: 'number',
            format: 'float'
          },
          total: {
            type: 'number',
            format: 'float'
          }
        }
      }
    },
    agingByProgram: {
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
          current: {
            type: 'number',
            format: 'float'
          },
          days1to30: {
            type: 'number',
            format: 'float'
          },
          days31to60: {
            type: 'number',
            format: 'float'
          },
          days61to90: {
            type: 'number',
            format: 'float'
          },
          days91Plus: {
            type: 'number',
            format: 'float'
          },
          total: {
            type: 'number',
            format: 'float'
          }
        }
      }
    }
  },
  required: [
    'asOfDate',
    'totalOutstanding',
    'current',
    'days1to30',
    'days31to60',
    'days61to90',
    'days91Plus'
  ]
};

/**
 * Schema for responses containing a single payment
 */
const paymentResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payment: {
      $ref: '#/components/schemas/PaymentWithRelations'
    }
  },
  required: [
    'payment'
  ]
};

/**
 * Schema for responses containing multiple payments with pagination
 */
const paymentsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payments: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/PaymentWithRelations'
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
  required: [
    'payments',
    'total',
    'page',
    'limit',
    'totalPages'
  ]
};

/**
 * Schema for responses containing multiple payment summaries with pagination
 */
const paymentSummariesResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payments: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/PaymentSummary'
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
  required: [
    'payments',
    'total',
    'page',
    'limit',
    'totalPages'
  ]
};

/**
 * Schema for responses containing remittance processing results
 */
const remittanceProcessingResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    result: {
      $ref: '#/components/schemas/RemittanceProcessingResult'
    }
  },
  required: [
    'result'
  ]
};

/**
 * Schema for responses containing payment reconciliation results
 */
const reconciliationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    result: {
      $ref: '#/components/schemas/ReconciliationResult'
    }
  },
  required: [
    'result'
  ]
};

/**
 * Schema for responses containing batch payment reconciliation results
 */
const batchReconciliationResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    successful: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    },
    failed: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          paymentId: {
            type: 'string',
            format: 'uuid'
          },
          error: {
            type: 'string'
          }
        }
      }
    },
    results: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ReconciliationResult'
      }
    }
  },
  required: [
    'successful',
    'failed',
    'results'
  ]
};

/**
 * Schema for responses containing payment metrics
 */
const paymentMetricsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    metrics: {
      $ref: '#/components/schemas/PaymentMetrics'
    }
  },
  required: [
    'metrics'
  ]
};

/**
 * Schema for responses containing accounts receivable aging data
 */
const accountsReceivableResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    aging: {
      $ref: '#/components/schemas/AccountsReceivableAging'
    }
  },
  required: [
    'aging'
  ]
};

// Define the payment API paths
const paymentPaths: OpenAPIV3.PathsObject = {
  '/payments': {
    get: {
      tags: ['Payments'],
      summary: 'Get all payments',
      description: 'Retrieves all payments with optional filtering and pagination',
      operationId: 'getAllPayments',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SortByParam' },
        { $ref: '#/components/parameters/SortOrderParam' },
        { $ref: '#/components/parameters/SearchParam' },
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
          name: 'reconciliationStatus',
          in: 'query',
          description: 'Filter by reconciliation status',
          schema: {
            type: 'string',
            enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
          }
        },
        {
          name: 'paymentMethod',
          in: 'query',
          description: 'Filter by payment method',
          schema: {
            type: 'string',
            enum: ['CHECK', 'EFT', 'CREDIT_CARD', 'CASH', 'OTHER']
          }
        },
        {
          name: 'dateRangeStart',
          in: 'query',
          description: 'Filter by payment date (start)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'dateRangeEnd',
          in: 'query',
          description: 'Filter by payment date (end)',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'includeRemittance',
          in: 'query',
          description: 'Include remittance information in response',
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
                $ref: '#/components/schemas/PaymentsResponse'
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
    },
    post: {
      tags: ['Payments'],
      summary: 'Create payment',
      description: 'Creates a new payment record',
      operationId: 'createPayment',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreatePaymentRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Payment created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentResponse'
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
  '/payments/remittance': {
    post: {
      tags: ['Payments'],
      summary: 'Process remittance',
      description: 'Process a remittance file and create payment records',
      operationId: 'processRemittance',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ImportRemittanceRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Remittance processed successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RemittanceProcessingResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request or file format',
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
  '/payments/batch-reconcile': {
    post: {
      tags: ['Payments'],
      summary: 'Batch reconcile payments',
      description: 'Reconcile multiple payments in a batch operation',
      operationId: 'batchReconcilePayments',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  paymentId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the payment to reconcile'
                  },
                  reconcileData: {
                    $ref: '#/components/schemas/ReconcilePaymentRequest'
                  }
                },
                required: ['paymentId', 'reconcileData']
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Batch reconciliation completed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchReconciliationResponse'
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
  '/payments/aging-report': {
    get: {
      tags: ['Payments'],
      summary: 'Get aging report',
      description: 'Generate an accounts receivable aging report',
      operationId: 'getAgingReport',
      parameters: [
        {
          name: 'asOfDate',
          in: 'query',
          description: 'Date for aging calculation (defaults to current date)',
          schema: {
            type: 'string',
            format: 'date'
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Aging report generated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AccountsReceivableResponse'
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
  '/payments/outstanding-claims': {
    get: {
      tags: ['Payments'],
      summary: 'Get outstanding claims',
      description: 'Get a list of outstanding claims that need follow-up',
      operationId: 'getOutstandingClaims',
      parameters: [
        {
          name: 'minAge',
          in: 'query',
          description: 'Minimum age in days',
          schema: {
            type: 'integer',
            minimum: 0
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Outstanding claims retrieved successfully',
          content: {
            'application/json': {
              schema: {
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
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  }
                },
                required: ['claims', 'total', 'totalAmount']
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
  '/payments/unreconciled': {
    get: {
      tags: ['Payments'],
      summary: 'Get unreconciled payments',
      description: 'Get a list of unreconciled payments that need attention',
      operationId: 'getUnreconciledPayments',
      parameters: [
        {
          name: 'minAge',
          in: 'query',
          description: 'Minimum age in days',
          schema: {
            type: 'integer',
            minimum: 0
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
        }
      ],
      responses: {
        '200': {
          description: 'Unreconciled payments retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentSummariesResponse'
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
  '/payments/collection-worklist': {
    get: {
      tags: ['Payments'],
      summary: 'Get collection worklist',
      description: 'Generate a prioritized list of claims for collection follow-up',
      operationId: 'generateCollectionWorkList',
      responses: {
        '200': {
          description: 'Collection worklist generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  workItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        claimId: {
                          type: 'string',
                          format: 'uuid'
                        },
                        claimNumber: {
                          type: 'string'
                        },
                        clientName: {
                          type: 'string'
                        },
                        payerName: {
                          type: 'string'
                        },
                        amount: {
                          type: 'number',
                          format: 'float'
                        },
                        age: {
                          type: 'integer'
                        },
                        priority: {
                          type: 'integer'
                        },
                        lastContactDate: {
                          type: 'string',
                          format: 'date',
                          nullable: true
                        },
                        notes: {
                          type: 'string',
                          nullable: true
                        }
                      }
                    }
                  },
                  totalItems: {
                    type: 'integer'
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  }
                },
                required: ['workItems', 'totalItems', 'totalAmount']
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
  '/payments/adjustment-trends': {
    get: {
      tags: ['Payments'],
      summary: 'Get adjustment trends',
      description: 'Analyze adjustment trends over time and by payer',
      operationId: 'getAdjustmentTrends',
      parameters: [
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Adjustment trends retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  trends: {
                    type: 'object',
                    properties: {
                      byType: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            adjustmentType: {
                              type: 'string'
                            },
                            count: {
                              type: 'integer'
                            },
                            amount: {
                              type: 'number',
                              format: 'float'
                            },
                            percentage: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      },
                      byPayer: {
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
                            adjustments: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  adjustmentType: {
                                    type: 'string'
                                  },
                                  count: {
                                    type: 'integer'
                                  },
                                  amount: {
                                    type: 'number',
                                    format: 'float'
                                  },
                                  percentage: {
                                    type: 'number',
                                    format: 'float'
                                  }
                                }
                              }
                            },
                            totalAmount: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      },
                      byPeriod: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            period: {
                              type: 'string'
                            },
                            adjustments: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  adjustmentType: {
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
                            }
                          }
                        }
                      }
                    }
                  },
                  totalAdjustments: {
                    type: 'integer'
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  }
                },
                required: ['trends', 'totalAdjustments', 'totalAmount']
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
  '/payments/denial-analysis': {
    get: {
      tags: ['Payments'],
      summary: 'Get denial analysis',
      description: 'Analyze claim denials based on adjustment codes',
      operationId: 'getDenialAnalysis',
      parameters: [
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
          name: 'programId',
          in: 'query',
          description: 'Filter by program ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Denial analysis retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  denials: {
                    type: 'object',
                    properties: {
                      byReason: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            reason: {
                              type: 'string'
                            },
                            code: {
                              type: 'string'
                            },
                            count: {
                              type: 'integer'
                            },
                            amount: {
                              type: 'number',
                              format: 'float'
                            },
                            percentage: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      },
                      byPayer: {
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
                            denialRate: {
                              type: 'number',
                              format: 'float'
                            },
                            topReasons: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  reason: {
                                    type: 'string'
                                  },
                                  code: {
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
                            totalDenials: {
                              type: 'integer'
                            },
                            totalAmount: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      },
                      trend: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            period: {
                              type: 'string'
                            },
                            denialCount: {
                              type: 'integer'
                            },
                            denialAmount: {
                              type: 'number',
                              format: 'float'
                            },
                            denialRate: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      }
                    }
                  },
                  totalDenials: {
                    type: 'integer'
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  },
                  overallDenialRate: {
                    type: 'number',
                    format: 'float'
                  }
                },
                required: ['denials', 'totalDenials', 'totalAmount', 'overallDenialRate']
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
  '/payments/metrics': {
    get: {
      tags: ['Payments'],
      summary: 'Get payment metrics',
      description: 'Retrieve payment metrics for dashboard and reporting',
      operationId: 'getPaymentMetrics',
      parameters: [
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
                $ref: '#/components/schemas/PaymentMetricsResponse'
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
  '/payments/{id}': {
    get: {
      tags: ['Payments'],
      summary: 'Get payment by ID',
      description: 'Retrieves a payment by its ID',
      operationId: 'getPayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentResponse'
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
          description: 'Payment not found',
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
      tags: ['Payments'],
      summary: 'Update payment',
      description: 'Updates an existing payment record',
      operationId: 'updatePayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
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
              $ref: '#/components/schemas/UpdatePaymentRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Payment updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentResponse'
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
          description: 'Payment not found',
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
      tags: ['Payments'],
      summary: 'Delete payment',
      description: 'Deletes a payment record (soft delete)',
      operationId: 'deletePayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Payment deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean'
                  },
                  message: {
                    type: 'string'
                  }
                },
                required: ['success', 'message']
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
          description: 'Payment not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Payment cannot be deleted in current state',
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
  '/payments/{id}/suggested-matches': {
    get: {
      tags: ['Payments'],
      summary: 'Get suggested claim matches',
      description: 'Get suggested claim matches for a payment',
      operationId: 'getSuggestedMatches',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Suggested matches retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payment: {
                    $ref: '#/components/schemas/PaymentWithRelations'
                  },
                  suggestedMatches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        claim: {
                          $ref: '#/components/schemas/ClaimSummary'
                        },
                        matchScore: {
                          type: 'number',
                          format: 'float'
                        },
                        matchReason: {
                          type: 'string'
                        }
                      }
                    }
                  }
                },
                required: ['payment', 'suggestedMatches']
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
          description: 'Payment not found',
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
  '/payments/{id}/reconcile': {
    post: {
      tags: ['Payments'],
      summary: 'Reconcile payment',
      description: 'Reconcile a payment with claims',
      operationId: 'reconcilePayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
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
              $ref: '#/components/schemas/ReconcilePaymentRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Payment reconciled successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReconciliationResponse'
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
          description: 'Payment not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Payment already reconciled',
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
  '/payments/{id}/reconciliation': {
    get: {
      tags: ['Payments'],
      summary: 'Get reconciliation details',
      description: 'Get detailed reconciliation information for a payment',
      operationId: 'getReconciliationDetails',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Reconciliation details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payment: {
                    $ref: '#/components/schemas/PaymentWithRelations'
                  },
                  claimPayments: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClaimPayment'
                    }
                  },
                  reconciliationStatus: {
                    type: 'string',
                    enum: ['UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'EXCEPTION']
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  },
                  matchedAmount: {
                    type: 'number',
                    format: 'float'
                  },
                  unmatchedAmount: {
                    type: 'number',
                    format: 'float'
                  },
                  reconciliationDate: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true
                  },
                  reconciliationUser: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid'
                      },
                      name: {
                        type: 'string'
                      }
                    },
                    nullable: true
                  }
                },
                required: [
                  'payment',
                  'claimPayments',
                  'reconciliationStatus',
                  'totalAmount',
                  'matchedAmount',
                  'unmatchedAmount'
                ]
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
          description: 'Payment not found',
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
  '/payments/{id}/undo-reconciliation': {
    post: {
      tags: ['Payments'],
      summary: 'Undo reconciliation',
      description: 'Undo a previous reconciliation',
      operationId: 'undoReconciliation',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Reconciliation undone successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentResponse'
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
          description: 'Payment not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Payment not reconciled',
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
  '/payments/{id}/auto-reconcile': {
    post: {
      tags: ['Payments'],
      summary: 'Auto-reconcile payment',
      description: 'Automatically reconcile a payment using intelligent matching algorithms',
      operationId: 'autoReconcilePayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
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
                matchThreshold: {
                  type: 'number',
                  format: 'float',
                  minimum: 0,
                  maximum: 1,
                  description: 'Minimum match score threshold (0-1)'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Payment auto-reconciled successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReconciliationResponse'
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
          description: 'Payment not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Payment already reconciled',
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
  '/payments/{id}/adjustments': {
    get: {
      tags: ['Payments'],
      summary: 'Get payment adjustments',
      description: 'Get adjustments associated with a payment',
      operationId: 'getAdjustmentsForPayment',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Payment ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Adjustments retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  adjustments: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/PaymentAdjustment'
                    }
                  },
                  totalAdjustments: {
                    type: 'integer'
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'float'
                  }
                },
                required: ['adjustments', 'totalAdjustments', 'totalAmount']
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
          description: 'Payment not found',
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

// External schemas needed for references
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
  required: [
    'id',
    'name',
    'payerType',
    'isElectronic'
  ]
};

// Export the payment paths to be included in the main Swagger definition
export default paymentPaths;