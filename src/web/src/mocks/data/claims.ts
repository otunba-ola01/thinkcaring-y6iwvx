import { UUID, ISO8601Date, ISO8601DateTime, Money } from '../types/common.types';
import {
  ClaimStatus,
  ClaimType,
  SubmissionMethod,
  DenialReason,
  Claim,
  ClaimWithRelations,
  ClaimSummary,
  ClaimStatusHistory,
  ClaimService,
  ClaimValidationResult,
  ClaimMetrics,
  ClaimValidationResponse,
  ClaimBatchResult
} from '../types/claims.types';

/**
 * Helper function to generate an array of mock claims with different statuses
 */
const generateMockClaims = (count: number): Claim[] => {
  const claims: Claim[] = [];
  
  // Current date for reference
  const now = new Date();
  
  // Create claims with different statuses to represent lifecycle
  for (let i = 0; i < count; i++) {
    const claimNumber = `CLM-2023-${String(10001 + i).padStart(5, '0')}`;
    
    // Vary the status based on index to get a mix of statuses
    let claimStatus: ClaimStatus;
    if (i % 8 === 0) claimStatus = ClaimStatus.DRAFT;
    else if (i % 8 === 1) claimStatus = ClaimStatus.VALIDATED;
    else if (i % 8 === 2) claimStatus = ClaimStatus.SUBMITTED;
    else if (i % 8 === 3) claimStatus = ClaimStatus.ACKNOWLEDGED;
    else if (i % 8 === 4) claimStatus = ClaimStatus.PENDING;
    else if (i % 8 === 5) claimStatus = ClaimStatus.PAID;
    else if (i % 8 === 6) claimStatus = ClaimStatus.DENIED;
    else claimStatus = ClaimStatus.APPEALED;
    
    // Create a date X days ago based on the index
    const daysAgo = i * 2; // Every other day
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Format date as ISO string
    const createdDate = date.toISOString().split('T')[0] as ISO8601Date;
    
    // Service start date is a few days before creation
    const serviceStartDate = new Date(date);
    serviceStartDate.setDate(serviceStartDate.getDate() - 5);
    
    // Service end date is the same as start date for single-day services
    // or a few days after for multi-day services
    const serviceEndDate = new Date(serviceStartDate);
    if (i % 3 === 0) { // Make some multi-day services
      serviceEndDate.setDate(serviceEndDate.getDate() + 2);
    }
    
    // Submission date exists for all statuses except DRAFT and VALIDATED
    const submissionDate = 
      claimStatus !== ClaimStatus.DRAFT && 
      claimStatus !== ClaimStatus.VALIDATED 
        ? new Date(date).toISOString().split('T')[0] as ISO8601Date
        : null;
    
    // Adjudication date exists only for PAID and DENIED statuses
    const adjudicationDate = 
      claimStatus === ClaimStatus.PAID || 
      claimStatus === ClaimStatus.DENIED || 
      claimStatus === ClaimStatus.PARTIAL_PAID
        ? new Date(date).toISOString().split('T')[0] as ISO8601Date
        : null;
    
    // Set denial reason only for DENIED status
    const denialReason = 
      claimStatus === ClaimStatus.DENIED
        ? [
            DenialReason.DUPLICATE_CLAIM,
            DenialReason.SERVICE_NOT_COVERED,
            DenialReason.AUTHORIZATION_MISSING,
            DenialReason.CLIENT_INELIGIBLE,
            DenialReason.TIMELY_FILING
          ][i % 5]
        : null;
    
    // Determine amount (between $100 and $5000)
    const totalAmount = parseFloat((Math.random() * 4900 + 100).toFixed(2));
    
    claims.push({
      id: `claim-${i}` as UUID,
      claimNumber,
      externalClaimId: submissionDate ? `EXT-${claimNumber}` : null,
      clientId: `client-${i % 20}` as UUID, // Cycling through 20 clients
      payerId: `payer-${i % 5}` as UUID, // Cycling through 5 payers
      claimType: ClaimType.ORIGINAL,
      claimStatus,
      totalAmount,
      serviceStartDate: serviceStartDate.toISOString().split('T')[0] as ISO8601Date,
      serviceEndDate: serviceEndDate.toISOString().split('T')[0] as ISO8601Date,
      submissionDate,
      submissionMethod: submissionDate 
        ? [SubmissionMethod.ELECTRONIC, SubmissionMethod.CLEARINGHOUSE][i % 2]
        : null,
      adjudicationDate,
      denialReason,
      denialDetails: denialReason 
        ? `Denial details for ${denialReason}`
        : null,
      adjustmentCodes: 
        claimStatus === ClaimStatus.PARTIAL_PAID || claimStatus === ClaimStatus.DENIED
          ? { 'CO45': 'Service not covered', 'CO42': 'Charges exceed authorization' }
          : null,
      originalClaimId: 
        claimStatus === ClaimStatus.APPEALED
          ? `claim-${i - 1}` as UUID
          : null,
      notes: `Notes for claim ${claimNumber}`,
      createdAt: date.toISOString() as ISO8601DateTime,
      updatedAt: date.toISOString() as ISO8601DateTime,
      createdBy: `user-1` as UUID,
      updatedBy: `user-1` as UUID
    });
  }
  
  return claims;
};

/**
 * Helper function to generate claims with related entities
 */
const generateMockClaimWithRelations = (baseClaims: Claim[]): ClaimWithRelations[] => {
  return baseClaims.map(claim => {
    // Client details
    const clientId = parseInt(claim.clientId.split('-')[1]);
    const clientFirstName = ['John', 'Jane', 'Robert', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa', 'William', 'Emily'][clientId % 10];
    const clientLastName = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][clientId % 10];
    
    // Payer details
    const payerId = parseInt(claim.payerId.split('-')[1]);
    const payerNames = ['Medicaid', 'Medicare', 'Blue Cross', 'Aetna', 'United Healthcare'];
    
    // Service details
    const serviceCount = Math.floor(Math.random() * 3) + 1; // 1-3 services per claim
    const services = [];
    
    let totalServiceAmount = 0;
    
    for (let i = 0; i < serviceCount; i++) {
      const serviceAmount = parseFloat((claim.totalAmount / serviceCount).toFixed(2));
      totalServiceAmount += serviceAmount;
      
      services.push({
        id: `service-${claim.id}-${i}` as UUID,
        serviceCode: ['H2019', 'T2020', 'S5125', 'H2023', 'T1020'][Math.floor(Math.random() * 5)],
        description: ['Personal Care', 'Residential', 'Day Services', 'Respite', 'Therapy'][Math.floor(Math.random() * 5)],
        units: Math.floor(Math.random() * 10) + 1,
        rate: parseFloat((serviceAmount / (Math.floor(Math.random() * 10) + 1)).toFixed(2)),
        amount: serviceAmount,
        serviceDate: claim.serviceStartDate
      });
    }
    
    // Status history
    const statusHistory: ClaimStatusHistory[] = [];
    
    // Draft status (all claims have this)
    const draftDate = new Date(claim.createdAt);
    statusHistory.push({
      id: `status-${claim.id}-draft` as UUID,
      claimId: claim.id,
      status: ClaimStatus.DRAFT,
      timestamp: draftDate.toISOString() as ISO8601DateTime,
      notes: 'Claim created',
      userId: 'user-1' as UUID,
      userName: 'John Admin'
    });
    
    // Validated status (all except drafts have this)
    if (claim.claimStatus !== ClaimStatus.DRAFT) {
      const validatedDate = new Date(draftDate);
      validatedDate.setHours(validatedDate.getHours() + 2);
      statusHistory.push({
        id: `status-${claim.id}-validated` as UUID,
        claimId: claim.id,
        status: ClaimStatus.VALIDATED,
        timestamp: validatedDate.toISOString() as ISO8601DateTime,
        notes: 'Claim validated',
        userId: 'user-1' as UUID,
        userName: 'John Admin'
      });
    }
    
    // Submitted status
    if (claim.submissionDate) {
      const submittedDate = new Date(claim.submissionDate);
      statusHistory.push({
        id: `status-${claim.id}-submitted` as UUID,
        claimId: claim.id,
        status: ClaimStatus.SUBMITTED,
        timestamp: submittedDate.toISOString() as ISO8601DateTime,
        notes: `Claim submitted via ${claim.submissionMethod}`,
        userId: 'user-1' as UUID,
        userName: 'John Admin'
      });
      
      // Acknowledged status
      if (claim.claimStatus !== ClaimStatus.SUBMITTED) {
        const acknowledgedDate = new Date(submittedDate);
        acknowledgedDate.setHours(acknowledgedDate.getHours() + 12);
        statusHistory.push({
          id: `status-${claim.id}-acknowledged` as UUID,
          claimId: claim.id,
          status: ClaimStatus.ACKNOWLEDGED,
          timestamp: acknowledgedDate.toISOString() as ISO8601DateTime,
          notes: 'Claim acknowledged by payer',
          userId: null,
          userName: 'System'
        });
        
        // Pending status
        if (claim.claimStatus !== ClaimStatus.ACKNOWLEDGED) {
          const pendingDate = new Date(acknowledgedDate);
          pendingDate.setHours(pendingDate.getHours() + 24);
          statusHistory.push({
            id: `status-${claim.id}-pending` as UUID,
            claimId: claim.id,
            status: ClaimStatus.PENDING,
            timestamp: pendingDate.toISOString() as ISO8601DateTime,
            notes: 'Claim processing by payer',
            userId: null,
            userName: 'System'
          });
          
          // Final status (PAID, DENIED, APPEALED)
          if (claim.adjudicationDate) {
            const finalDate = new Date(claim.adjudicationDate);
            statusHistory.push({
              id: `status-${claim.id}-final` as UUID,
              claimId: claim.id,
              status: claim.claimStatus,
              timestamp: finalDate.toISOString() as ISO8601DateTime,
              notes: claim.claimStatus === ClaimStatus.DENIED 
                ? `Claim denied: ${claim.denialReason}` 
                : claim.claimStatus === ClaimStatus.PARTIAL_PAID
                ? 'Claim partially paid'
                : 'Claim paid in full',
              userId: null,
              userName: 'System'
            });
            
            // Add appealed status if needed
            if (claim.claimStatus === ClaimStatus.APPEALED) {
              const appealDate = new Date(finalDate);
              appealDate.setHours(appealDate.getHours() + 48);
              statusHistory.push({
                id: `status-${claim.id}-appeal` as UUID,
                claimId: claim.id,
                status: ClaimStatus.APPEALED,
                timestamp: appealDate.toISOString() as ISO8601DateTime,
                notes: 'Appeal submitted for denied claim',
                userId: 'user-1' as UUID,
                userName: 'John Admin'
              });
            }
          }
        }
      }
    }
    
    return {
      ...claim,
      client: {
        id: claim.clientId,
        firstName: clientFirstName,
        lastName: clientLastName,
        medicaidId: `MCD${100000000 + clientId}`,
        status: 'active'
      },
      payer: {
        id: claim.payerId,
        name: payerNames[payerId],
        payerType: payerId === 0 ? 'medicaid' : payerId === 1 ? 'medicare' : 'private',
        isElectronic: true,
        status: 'active'
      },
      originalClaim: claim.originalClaimId 
        ? {
            id: claim.originalClaimId,
            claimNumber: `CLM-2023-${String(10000 + parseInt(claim.originalClaimId.split('-')[1])).padStart(5, '0')}`,
            clientId: claim.clientId,
            clientName: `${clientFirstName} ${clientLastName}`,
            payerId: claim.payerId,
            payerName: payerNames[payerId],
            claimStatus: ClaimStatus.DENIED,
            totalAmount: claim.totalAmount,
            serviceStartDate: claim.serviceStartDate,
            serviceEndDate: claim.serviceEndDate,
            submissionDate: claim.submissionDate,
            claimAge: 14
          }
        : null,
      services,
      statusHistory
    };
  });
};

/**
 * Helper function to generate simplified claim summaries
 */
const generateMockClaimSummaries = (baseClaims: Claim[]): ClaimSummary[] => {
  return baseClaims.map(claim => {
    // Client details
    const clientId = parseInt(claim.clientId.split('-')[1]);
    const clientFirstName = ['John', 'Jane', 'Robert', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa', 'William', 'Emily'][clientId % 10];
    const clientLastName = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][clientId % 10];
    
    // Payer details
    const payerId = parseInt(claim.payerId.split('-')[1]);
    const payerNames = ['Medicaid', 'Medicare', 'Blue Cross', 'Aetna', 'United Healthcare'];
    
    // Calculate claim age in days
    let claimAge = 0;
    if (claim.submissionDate) {
      const submissionDate = new Date(claim.submissionDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
      claimAge = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return {
      id: claim.id,
      claimNumber: claim.claimNumber,
      clientId: claim.clientId,
      clientName: `${clientFirstName} ${clientLastName}`,
      payerId: claim.payerId,
      payerName: payerNames[payerId],
      claimStatus: claim.claimStatus,
      totalAmount: claim.totalAmount,
      serviceStartDate: claim.serviceStartDate,
      serviceEndDate: claim.serviceEndDate,
      submissionDate: claim.submissionDate,
      claimAge
    };
  });
};

// Generate base mock claims
export const mockClaims: Claim[] = generateMockClaims(50);

// Generate claims with relations
export const mockClaimWithRelations: ClaimWithRelations[] = generateMockClaimWithRelations(mockClaims);

// Generate claim summaries
export const mockClaimSummaries: ClaimSummary[] = generateMockClaimSummaries(mockClaims);

// Create mock claim status history
export const mockClaimStatusHistory: ClaimStatusHistory[] = mockClaimWithRelations.flatMap(claim => claim.statusHistory);

// Create mock claim services
export const mockClaimServices: ClaimService[] = mockClaimWithRelations.flatMap(claim => 
  claim.services.map((service, index) => ({
    id: `claim-service-${claim.id}-${index}` as UUID,
    claimId: claim.id,
    serviceId: service.id as UUID,
    serviceLineNumber: index + 1,
    billedUnits: service.units,
    billedAmount: service.amount,
    service: {
      id: service.id as UUID,
      serviceCode: service.serviceCode,
      description: service.description,
      serviceDate: service.serviceDate,
      units: service.units,
      rate: service.rate,
      amount: service.amount
    }
  }))
);

// Create mock claim validation results
export const mockClaimValidationResults: ClaimValidationResult[] = mockClaims.map((claim, index) => {
  // Introduce some validation errors for testing
  const hasErrors = index % 7 === 0;
  const hasWarnings = index % 5 === 0;
  
  return {
    claimId: claim.id,
    isValid: !hasErrors,
    errors: hasErrors 
      ? [
          {
            code: 'MISSING_AUTH',
            message: 'Service authorization not found',
            field: 'authorization',
            context: { serviceId: `service-${index}` }
          },
          {
            code: 'INVALID_DATES',
            message: 'Service dates outside authorization period',
            field: 'serviceDate',
            context: { 
              serviceDate: claim.serviceStartDate,
              authStartDate: '2023-01-01',
              authEndDate: '2023-03-31'
            }
          }
        ]
      : [],
    warnings: hasWarnings
      ? [
          {
            code: 'AUTH_EXPIRING',
            message: 'Service authorization expires soon',
            field: 'authorization',
            context: { 
              expirationDate: '2023-06-30',
              daysRemaining: 15
            }
          }
        ]
      : []
  };
});

// Create mock claim metrics for dashboards
export const mockClaimMetrics: ClaimMetrics = {
  totalClaims: mockClaims.length,
  totalAmount: mockClaims.reduce((sum, claim) => sum + claim.totalAmount, 0),
  statusBreakdown: [
    {
      status: ClaimStatus.DRAFT,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.DRAFT).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.DRAFT)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.VALIDATED,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.VALIDATED).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.VALIDATED)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.SUBMITTED,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.SUBMITTED).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.SUBMITTED)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.ACKNOWLEDGED,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.ACKNOWLEDGED).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.ACKNOWLEDGED)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.PENDING,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.PENDING).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.PENDING)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.PAID,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.PAID).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.PAID)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.DENIED,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.DENIED).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.DENIED)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      status: ClaimStatus.APPEALED,
      count: mockClaims.filter(c => c.claimStatus === ClaimStatus.APPEALED).length,
      amount: mockClaims.filter(c => c.claimStatus === ClaimStatus.APPEALED)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    }
  ],
  agingBreakdown: [
    {
      range: '0-30 days',
      count: mockClaimSummaries.filter(c => c.claimAge <= 30).length,
      amount: mockClaimSummaries.filter(c => c.claimAge <= 30)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      range: '31-60 days',
      count: mockClaimSummaries.filter(c => c.claimAge > 30 && c.claimAge <= 60).length,
      amount: mockClaimSummaries.filter(c => c.claimAge > 30 && c.claimAge <= 60)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      range: '61-90 days',
      count: mockClaimSummaries.filter(c => c.claimAge > 60 && c.claimAge <= 90).length,
      amount: mockClaimSummaries.filter(c => c.claimAge > 60 && c.claimAge <= 90)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      range: '90+ days',
      count: mockClaimSummaries.filter(c => c.claimAge > 90).length,
      amount: mockClaimSummaries.filter(c => c.claimAge > 90)
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    }
  ],
  denialRate: parseFloat(((mockClaims.filter(c => c.claimStatus === ClaimStatus.DENIED).length / 
    mockClaims.filter(c => c.submissionDate !== null).length) * 100).toFixed(1)),
  averageProcessingTime: 14, // Average days from submission to payment/denial
  claimsByPayer: [
    {
      payerId: 'payer-0' as UUID,
      payerName: 'Medicaid',
      count: mockClaims.filter(c => c.payerId === 'payer-0').length,
      amount: mockClaims.filter(c => c.payerId === 'payer-0')
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      payerId: 'payer-1' as UUID,
      payerName: 'Medicare',
      count: mockClaims.filter(c => c.payerId === 'payer-1').length,
      amount: mockClaims.filter(c => c.payerId === 'payer-1')
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      payerId: 'payer-2' as UUID,
      payerName: 'Blue Cross',
      count: mockClaims.filter(c => c.payerId === 'payer-2').length,
      amount: mockClaims.filter(c => c.payerId === 'payer-2')
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      payerId: 'payer-3' as UUID,
      payerName: 'Aetna',
      count: mockClaims.filter(c => c.payerId === 'payer-3').length,
      amount: mockClaims.filter(c => c.payerId === 'payer-3')
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    },
    {
      payerId: 'payer-4' as UUID,
      payerName: 'United Healthcare',
      count: mockClaims.filter(c => c.payerId === 'payer-4').length,
      amount: mockClaims.filter(c => c.payerId === 'payer-4')
        .reduce((sum, claim) => sum + claim.totalAmount, 0)
    }
  ]
};

// Create mock claim validation response
export const mockClaimValidationResponse: ClaimValidationResponse = {
  results: mockClaimValidationResults.slice(0, 5),
  isValid: mockClaimValidationResults.slice(0, 5).every(r => r.isValid),
  totalErrors: mockClaimValidationResults.slice(0, 5).reduce((sum, r) => sum + r.errors.length, 0),
  totalWarnings: mockClaimValidationResults.slice(0, 5).reduce((sum, r) => sum + r.warnings.length, 0)
};

// Create mock claim batch result
export const mockClaimBatchResult: ClaimBatchResult = {
  totalProcessed: 10,
  successCount: 8,
  errorCount: 2,
  errors: [
    {
      claimId: mockClaims[6].id,
      message: 'Failed to submit to clearinghouse: Connection timeout'
    },
    {
      claimId: mockClaims[9].id,
      message: 'Failed validation: Missing required fields'
    }
  ],
  processedClaims: mockClaims.slice(0, 10).map(claim => claim.id)
};