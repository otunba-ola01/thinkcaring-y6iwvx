import { OpenAPIV3 } from '../../config/swagger.config';

/**
 * Schema for client object with all properties
 */
const clientSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the client'
    },
    firstName: {
      type: 'string',
      description: "Client's first name"
    },
    lastName: {
      type: 'string',
      description: "Client's last name"
    },
    middleName: {
      type: 'string',
      nullable: true,
      description: "Client's middle name"
    },
    dateOfBirth: {
      type: 'string',
      format: 'date',
      description: "Client's date of birth"
    },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'],
      description: "Client's gender"
    },
    medicaidId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicaid identifier"
    },
    medicareId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicare identifier"
    },
    ssn: {
      type: 'string',
      nullable: true,
      description: "Client's Social Security Number (masked)"
    },
    address: {
      type: 'object',
      properties: {
        street1: {
          type: 'string',
          description: 'Street address line 1'
        },
        street2: {
          type: 'string',
          nullable: true,
          description: 'Street address line 2'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        state: {
          type: 'string',
          description: 'State/province'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country'
        }
      },
      required: ['street1', 'city', 'state', 'postalCode', 'country'],
      description: "Client's address"
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Primary phone number'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative phone number'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Email address'
        }
      },
      required: ['phone'],
      description: "Client's contact information"
    },
    emergencyContact: {
      type: 'object',
      nullable: true,
      properties: {
        name: {
          type: 'string',
          description: 'Emergency contact name'
        },
        relationship: {
          type: 'string',
          description: 'Relationship to client'
        },
        phone: {
          type: 'string',
          description: 'Emergency contact phone'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative emergency contact phone'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Emergency contact email'
        }
      },
      required: ['name', 'relationship', 'phone'],
      description: "Client's emergency contact information"
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED'],
      description: "Client's status"
    },
    programs: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClientProgram'
      },
      description: "Client's program enrollments"
    },
    insurances: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ClientInsurance'
      },
      description: "Client's insurance information"
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the client'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the client record was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the client record was last updated'
    },
    createdBy: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'ID of the user who created the client record'
    },
    updatedBy: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'ID of the user who last updated the client record'
    }
  },
  required: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 'contactInfo', 'status', 'createdAt', 'updatedAt']
};

/**
 * Schema for client summary used in dropdowns and lists
 */
const clientSummarySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the client'
    },
    firstName: {
      type: 'string',
      description: "Client's first name"
    },
    lastName: {
      type: 'string',
      description: "Client's last name"
    },
    middleName: {
      type: 'string',
      nullable: true,
      description: "Client's middle name"
    },
    medicaidId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicaid identifier"
    },
    dateOfBirth: {
      type: 'string',
      format: 'date',
      description: "Client's date of birth"
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED'],
      description: "Client's status"
    }
  },
  required: ['id', 'firstName', 'lastName', 'dateOfBirth', 'status']
};

/**
 * Schema for client program enrollment
 */
const clientProgramSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the program enrollment'
    },
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the client enrolled in the program'
    },
    programId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the program'
    },
    programName: {
      type: 'string',
      description: 'Name of the program'
    },
    startDate: {
      type: 'string',
      format: 'date',
      description: 'When the client was enrolled in the program'
    },
    endDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the client was discharged from the program (if applicable)'
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD'],
      description: 'Status of the program enrollment'
    },
    fundingSource: {
      type: 'string',
      nullable: true,
      description: 'Funding source for the program enrollment'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the program enrollment'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the program enrollment was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the program enrollment was last updated'
    }
  },
  required: ['id', 'clientId', 'programId', 'programName', 'startDate', 'status', 'createdAt', 'updatedAt']
};

/**
 * Schema for client insurance information
 */
const clientInsuranceSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the insurance record'
    },
    clientId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the client with this insurance'
    },
    payerId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the insurance payer'
    },
    payerName: {
      type: 'string',
      description: 'Name of the insurance payer'
    },
    policyNumber: {
      type: 'string',
      description: 'Insurance policy number'
    },
    groupNumber: {
      type: 'string',
      nullable: true,
      description: 'Insurance group number'
    },
    subscriberName: {
      type: 'string',
      nullable: true,
      description: 'Name of the policy subscriber if different from client'
    },
    subscriberRelationship: {
      type: 'string',
      nullable: true,
      description: 'Relationship of the subscriber to the client'
    },
    isPrimary: {
      type: 'boolean',
      description: 'Whether this is the primary insurance'
    },
    effectiveDate: {
      type: 'string',
      format: 'date',
      description: 'When the insurance coverage became effective'
    },
    terminationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage terminates (if applicable)'
    },
    verificationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage was last verified'
    },
    verificationNotes: {
      type: 'string',
      nullable: true,
      description: 'Notes from the insurance verification'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the insurance record was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the insurance record was last updated'
    }
  },
  required: ['id', 'clientId', 'payerId', 'payerName', 'policyNumber', 'isPrimary', 'effectiveDate', 'createdAt', 'updatedAt']
};

/**
 * Schema for create client request
 */
const createClientRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      description: "Client's first name"
    },
    lastName: {
      type: 'string',
      description: "Client's last name"
    },
    middleName: {
      type: 'string',
      nullable: true,
      description: "Client's middle name"
    },
    dateOfBirth: {
      type: 'string',
      format: 'date',
      description: "Client's date of birth"
    },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'],
      description: "Client's gender"
    },
    medicaidId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicaid identifier"
    },
    medicareId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicare identifier"
    },
    ssn: {
      type: 'string',
      nullable: true,
      description: "Client's Social Security Number"
    },
    address: {
      type: 'object',
      properties: {
        street1: {
          type: 'string',
          description: 'Street address line 1'
        },
        street2: {
          type: 'string',
          nullable: true,
          description: 'Street address line 2'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        state: {
          type: 'string',
          description: 'State/province'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country'
        }
      },
      required: ['street1', 'city', 'state', 'postalCode', 'country'],
      description: "Client's address"
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Primary phone number'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative phone number'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Email address'
        }
      },
      required: ['phone'],
      description: "Client's contact information"
    },
    emergencyContact: {
      type: 'object',
      nullable: true,
      properties: {
        name: {
          type: 'string',
          description: 'Emergency contact name'
        },
        relationship: {
          type: 'string',
          description: 'Relationship to client'
        },
        phone: {
          type: 'string',
          description: 'Emergency contact phone'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative emergency contact phone'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Emergency contact email'
        }
      },
      required: ['name', 'relationship', 'phone'],
      description: "Client's emergency contact information"
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED'],
      default: 'ACTIVE',
      description: "Client's status"
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the client'
    },
    programs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          programId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the program'
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: 'When the client was enrolled in the program'
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD'],
            default: 'ACTIVE',
            description: 'Status of the program enrollment'
          },
          fundingSource: {
            type: 'string',
            nullable: true,
            description: 'Funding source for the program enrollment'
          },
          notes: {
            type: 'string',
            nullable: true,
            description: 'Additional notes about the program enrollment'
          }
        },
        required: ['programId', 'startDate']
      },
      description: "Client's program enrollments"
    },
    insurances: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          payerId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the insurance payer'
          },
          policyNumber: {
            type: 'string',
            description: 'Insurance policy number'
          },
          groupNumber: {
            type: 'string',
            nullable: true,
            description: 'Insurance group number'
          },
          subscriberName: {
            type: 'string',
            nullable: true,
            description: 'Name of the policy subscriber if different from client'
          },
          subscriberRelationship: {
            type: 'string',
            nullable: true,
            description: 'Relationship of the subscriber to the client'
          },
          isPrimary: {
            type: 'boolean',
            description: 'Whether this is the primary insurance'
          },
          effectiveDate: {
            type: 'string',
            format: 'date',
            description: 'When the insurance coverage became effective'
          },
          verificationDate: {
            type: 'string',
            format: 'date',
            nullable: true,
            description: 'When the insurance coverage was last verified'
          },
          verificationNotes: {
            type: 'string',
            nullable: true,
            description: 'Notes from the insurance verification'
          }
        },
        required: ['payerId', 'policyNumber', 'isPrimary', 'effectiveDate']
      },
      description: "Client's insurance information"
    }
  },
  required: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 'contactInfo']
};

/**
 * Schema for update client request
 */
const updateClientRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      description: "Client's first name"
    },
    lastName: {
      type: 'string',
      description: "Client's last name"
    },
    middleName: {
      type: 'string',
      nullable: true,
      description: "Client's middle name"
    },
    dateOfBirth: {
      type: 'string',
      format: 'date',
      description: "Client's date of birth"
    },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'],
      description: "Client's gender"
    },
    medicaidId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicaid identifier"
    },
    medicareId: {
      type: 'string',
      nullable: true,
      description: "Client's Medicare identifier"
    },
    ssn: {
      type: 'string',
      nullable: true,
      description: "Client's Social Security Number"
    },
    address: {
      type: 'object',
      properties: {
        street1: {
          type: 'string',
          description: 'Street address line 1'
        },
        street2: {
          type: 'string',
          nullable: true,
          description: 'Street address line 2'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        state: {
          type: 'string',
          description: 'State/province'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country'
        }
      },
      required: ['street1', 'city', 'state', 'postalCode', 'country'],
      description: "Client's address"
    },
    contactInfo: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Primary phone number'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative phone number'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Email address'
        }
      },
      required: ['phone'],
      description: "Client's contact information"
    },
    emergencyContact: {
      type: 'object',
      nullable: true,
      properties: {
        name: {
          type: 'string',
          description: 'Emergency contact name'
        },
        relationship: {
          type: 'string',
          description: 'Relationship to client'
        },
        phone: {
          type: 'string',
          description: 'Emergency contact phone'
        },
        alternatePhone: {
          type: 'string',
          nullable: true,
          description: 'Alternative emergency contact phone'
        },
        email: {
          type: 'string',
          nullable: true,
          description: 'Emergency contact email'
        }
      },
      required: ['name', 'relationship', 'phone'],
      description: "Client's emergency contact information"
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the client'
    }
  }
};

/**
 * Schema for update client status request
 */
const updateClientStatusRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED'],
      description: "Client's status"
    },
    statusReason: {
      type: 'string',
      nullable: true,
      description: 'Reason for the status change'
    }
  },
  required: ['status']
};

/**
 * Schema for create client program request
 */
const createClientProgramRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    programId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the program'
    },
    startDate: {
      type: 'string',
      format: 'date',
      description: 'When the client was enrolled in the program'
    },
    endDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the client was discharged from the program (if applicable)'
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD'],
      default: 'ACTIVE',
      description: 'Status of the program enrollment'
    },
    fundingSource: {
      type: 'string',
      nullable: true,
      description: 'Funding source for the program enrollment'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the program enrollment'
    }
  },
  required: ['programId', 'startDate', 'status']
};

/**
 * Schema for update client program request
 */
const updateClientProgramRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    startDate: {
      type: 'string',
      format: 'date',
      description: 'When the client was enrolled in the program'
    },
    endDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the client was discharged from the program (if applicable)'
    },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD'],
      description: 'Status of the program enrollment'
    },
    fundingSource: {
      type: 'string',
      nullable: true,
      description: 'Funding source for the program enrollment'
    },
    notes: {
      type: 'string',
      nullable: true,
      description: 'Additional notes about the program enrollment'
    }
  }
};

/**
 * Schema for create client insurance request
 */
const createClientInsuranceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    payerId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the insurance payer'
    },
    policyNumber: {
      type: 'string',
      description: 'Insurance policy number'
    },
    groupNumber: {
      type: 'string',
      nullable: true,
      description: 'Insurance group number'
    },
    subscriberName: {
      type: 'string',
      nullable: true,
      description: 'Name of the policy subscriber if different from client'
    },
    subscriberRelationship: {
      type: 'string',
      nullable: true,
      description: 'Relationship of the subscriber to the client'
    },
    isPrimary: {
      type: 'boolean',
      description: 'Whether this is the primary insurance'
    },
    effectiveDate: {
      type: 'string',
      format: 'date',
      description: 'When the insurance coverage became effective'
    },
    terminationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage terminates (if applicable)'
    },
    verificationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage was last verified'
    },
    verificationNotes: {
      type: 'string',
      nullable: true,
      description: 'Notes from the insurance verification'
    }
  },
  required: ['payerId', 'policyNumber', 'isPrimary', 'effectiveDate']
};

/**
 * Schema for update client insurance request
 */
const updateClientInsuranceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    policyNumber: {
      type: 'string',
      description: 'Insurance policy number'
    },
    groupNumber: {
      type: 'string',
      nullable: true,
      description: 'Insurance group number'
    },
    subscriberName: {
      type: 'string',
      nullable: true,
      description: 'Name of the policy subscriber if different from client'
    },
    subscriberRelationship: {
      type: 'string',
      nullable: true,
      description: 'Relationship of the subscriber to the client'
    },
    isPrimary: {
      type: 'boolean',
      description: 'Whether this is the primary insurance'
    },
    effectiveDate: {
      type: 'string',
      format: 'date',
      description: 'When the insurance coverage became effective'
    },
    terminationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage terminates (if applicable)'
    },
    verificationDate: {
      type: 'string',
      format: 'date',
      nullable: true,
      description: 'When the insurance coverage was last verified'
    },
    verificationNotes: {
      type: 'string',
      nullable: true,
      description: 'Notes from the insurance verification'
    }
  }
};

/**
 * Schema for client response
 */
const clientResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      $ref: '#/components/schemas/Client'
    }
  },
  required: ['data']
};

/**
 * Schema for client summary response
 */
const clientSummaryResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      $ref: '#/components/schemas/ClientSummary'
    }
  },
  required: ['data']
};

/**
 * Schema for client program response
 */
const clientProgramResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      $ref: '#/components/schemas/ClientProgram'
    }
  },
  required: ['data']
};

/**
 * Schema for client insurance response
 */
const clientInsuranceResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      $ref: '#/components/schemas/ClientInsurance'
    }
  },
  required: ['data']
};

/**
 * Schema for client status counts response
 */
const clientStatusCountsResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        ACTIVE: {
          type: 'integer',
          description: 'Number of active clients'
        },
        INACTIVE: {
          type: 'integer',
          description: 'Number of inactive clients'
        },
        PENDING: {
          type: 'integer',
          description: 'Number of pending clients'
        },
        DISCHARGED: {
          type: 'integer',
          description: 'Number of discharged clients'
        },
        ON_HOLD: {
          type: 'integer',
          description: 'Number of clients on hold'
        },
        DECEASED: {
          type: 'integer',
          description: 'Number of deceased clients'
        }
      },
      required: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED']
    }
  },
  required: ['data']
};

/**
 * API paths for client management
 */
const clientPaths: OpenAPIV3.PathsObject = {
  '/clients': {
    get: {
      tags: ['Clients'],
      summary: 'Get clients',
      description: 'Retrieves a paginated list of clients with optional filtering',
      operationId: 'getClients',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by client status',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED']
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
                          $ref: '#/components/schemas/Client'
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
          description: 'Invalid query parameters',
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
      tags: ['Clients'],
      summary: 'Create client',
      description: 'Creates a new client with optional program enrollments and insurances',
      operationId: 'createClient',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateClientRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Client created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientResponse'
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
  '/clients/summaries': {
    get: {
      tags: ['Clients'],
      summary: 'Get client summaries',
      description: 'Retrieves a list of client summaries for dropdowns and lists',
      operationId: 'getClientSummaries',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by client status',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'DISCHARGED', 'ON_HOLD', 'DECEASED']
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
                          $ref: '#/components/schemas/ClientSummary'
                        }
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
  '/clients/status-counts': {
    get: {
      tags: ['Clients'],
      summary: 'Get client status counts',
      description: 'Gets counts of clients grouped by their status',
      operationId: 'getClientStatusCounts',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientStatusCountsResponse'
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
  '/clients/program/{programId}': {
    get: {
      tags: ['Clients'],
      summary: 'Get clients by program',
      description: 'Retrieves clients enrolled in a specific program',
      operationId: 'getClientsByProgram',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'programId',
          in: 'path',
          required: true,
          description: 'ID of the program',
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
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClientSummary'
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid program ID',
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
  '/clients/payer/{payerId}': {
    get: {
      tags: ['Clients'],
      summary: 'Get clients by payer',
      description: 'Retrieves clients with insurance from a specific payer',
      operationId: 'getClientsByPayer',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'payerId',
          in: 'path',
          required: true,
          description: 'ID of the payer',
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
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClientSummary'
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid payer ID',
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
  '/clients/{id}': {
    get: {
      tags: ['Clients'],
      summary: 'Get client by ID',
      description: 'Retrieves a client by their ID with optional relations',
      operationId: 'getClientById',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'includeRelations',
          in: 'query',
          description: 'Whether to include related data (programs, insurances)',
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
                $ref: '#/components/schemas/ClientResponse'
              }
            }
          }
        },
        '400': {
          description: 'Invalid client ID',
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
    },
    put: {
      tags: ['Clients'],
      summary: 'Update client',
      description: "Updates an existing client's information",
      operationId: 'updateClient',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client to update',
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
              $ref: '#/components/schemas/UpdateClientRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Client updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientResponse'
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
    },
    delete: {
      tags: ['Clients'],
      summary: 'Delete client',
      description: 'Marks a client as inactive rather than physically deleting',
      operationId: 'deleteClient',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client to delete',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Client deleted successfully',
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
                    example: 'Client marked as inactive'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid client ID',
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
  '/clients/medicaid/{medicaidId}': {
    get: {
      tags: ['Clients'],
      summary: 'Get client by Medicaid ID',
      description: 'Retrieves a client by their Medicaid identifier',
      operationId: 'getClientByMedicaidId',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'medicaidId',
          in: 'path',
          required: true,
          description: 'Medicaid ID of the client',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientResponse'
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
  '/clients/{id}/status': {
    patch: {
      tags: ['Clients'],
      summary: 'Update client status',
      description: "Updates a client's status",
      operationId: 'updateClientStatus',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
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
              $ref: '#/components/schemas/UpdateClientStatusRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Client status updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientResponse'
              }
            }
          }
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
  '/clients/{id}/programs': {
    post: {
      tags: ['Clients'],
      summary: 'Add client program',
      description: 'Adds a program enrollment for a client',
      operationId: 'addClientProgram',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
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
              $ref: '#/components/schemas/CreateClientProgramRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Program enrollment added successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientProgramResponse'
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
  '/clients/{id}/programs/{programId}': {
    put: {
      tags: ['Clients'],
      summary: 'Update client program',
      description: "Updates a client's program enrollment",
      operationId: 'updateClientProgram',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'programId',
          in: 'path',
          required: true,
          description: 'ID of the program enrollment',
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
              $ref: '#/components/schemas/UpdateClientProgramRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Program enrollment updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientProgramResponse'
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
          description: 'Client or program enrollment not found',
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
      tags: ['Clients'],
      summary: 'Remove client program',
      description: 'Removes a program enrollment for a client',
      operationId: 'removeClientProgram',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'programId',
          in: 'path',
          required: true,
          description: 'ID of the program enrollment',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Program enrollment removed successfully',
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
                    example: 'Program enrollment removed'
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
          description: 'Client or program enrollment not found',
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
  '/clients/{id}/insurances': {
    post: {
      tags: ['Clients'],
      summary: 'Add client insurance',
      description: 'Adds insurance information for a client',
      operationId: 'addClientInsurance',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
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
              $ref: '#/components/schemas/CreateClientInsuranceRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Insurance information added successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientInsuranceResponse'
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
  '/clients/{id}/insurances/{insuranceId}': {
    put: {
      tags: ['Clients'],
      summary: 'Update client insurance',
      description: "Updates a client's insurance information",
      operationId: 'updateClientInsurance',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'insuranceId',
          in: 'path',
          required: true,
          description: 'ID of the insurance record',
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
              $ref: '#/components/schemas/UpdateClientInsuranceRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Insurance information updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClientInsuranceResponse'
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
          description: 'Client or insurance record not found',
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
      tags: ['Clients'],
      summary: 'Remove client insurance',
      description: 'Removes insurance information for a client',
      operationId: 'removeClientInsurance',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID of the client',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'insuranceId',
          in: 'path',
          required: true,
          description: 'ID of the insurance record',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Insurance information removed successfully',
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
                    example: 'Insurance information removed'
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
          description: 'Client or insurance record not found',
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

export default clientPaths;