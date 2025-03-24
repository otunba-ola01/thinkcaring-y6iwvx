import { 
  ReportType, ReportCategory, ReportFormat, ReportStatus, ScheduleFrequency, TimeFrame, 
  ComparisonType, ChartType, MetricTrend, AgingBucket, ReportDefinition, ReportInstance,
  ScheduledReport, ReportData, ReportParameters, GenerateReportResponse,
  RevenueByProgramData, RevenueByPayerData, ClaimsStatusData, AgingReceivablesData,
  DenialAnalysisData, PayerPerformanceData, ServiceUtilizationData
} from '../../types/reports.types';
import { UUID, ISO8601Date, ISO8601DateTime, Money } from '../../types/common.types';
import { ClaimStatus } from '../../types/claims.types';
import { REPORT_TEMPLATES, REPORT_TYPE_LABELS } from '../../constants/reports.constants';

/**
 * Generates mock report data based on the report type
 * @param reportType - The type of report to generate data for
 * @returns Record with data arrays for the specified report type
 */
function generateMockReportData(reportType: ReportType): Record<string, any[]> {
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
      return {
        programRevenue: [
          { programId: '123e4567-e89b-12d3-a456-426614174000', programName: 'Personal Care', revenue: 456789, previousRevenue: 432567, change: 5.6, percentOfTotal: 36.7, claimCount: 120, clientCount: 45 },
          { programId: '223e4567-e89b-12d3-a456-426614174001', programName: 'Residential', revenue: 345678, previousRevenue: 356789, change: -3.1, percentOfTotal: 27.8, claimCount: 85, clientCount: 32 },
          { programId: '323e4567-e89b-12d3-a456-426614174002', programName: 'Day Services', revenue: 234567, previousRevenue: 210456, change: 11.5, percentOfTotal: 18.9, claimCount: 65, clientCount: 28 },
          { programId: '423e4567-e89b-12d3-a456-426614174003', programName: 'Respite', revenue: 123456, previousRevenue: 118765, change: 4.0, percentOfTotal: 9.9, claimCount: 42, clientCount: 20 },
          { programId: '523e4567-e89b-12d3-a456-426614174004', programName: 'Other', revenue: 85188, previousRevenue: 76543, change: 11.3, percentOfTotal: 6.7, claimCount: 30, clientCount: 15 }
        ],
        revenueTrend: [
          { month: 'Jan', program1: 38000, program2: 29000, program3: 19000 },
          { month: 'Feb', program1: 42000, program2: 30000, program3: 20000 },
          { month: 'Mar', program1: 45000, program2: 32000, program3: 22000 },
          { month: 'Apr', program1: 37000, program2: 29000, program3: 18000 },
          { month: 'May', program1: 40000, program2: 31000, program3: 20000 },
          { month: 'Jun', program1: 43000, program2: 33000, program3: 21000 }
        ]
      };
    
    case ReportType.REVENUE_BY_PAYER:
      return {
        payerRevenue: [
          { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', revenue: 678901, previousRevenue: 654321, change: 3.8, percentOfTotal: 52.1, claimCount: 180, averageProcessingDays: 21 },
          { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', revenue: 345678, previousRevenue: 320987, change: 7.7, percentOfTotal: 26.5, claimCount: 95, averageProcessingDays: 18 },
          { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', revenue: 156789, previousRevenue: 167890, change: -6.6, percentOfTotal: 12.0, claimCount: 45, averageProcessingDays: 15 },
          { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', revenue: 98765, previousRevenue: 87654, change: 12.7, percentOfTotal: 7.6, claimCount: 28, averageProcessingDays: 23 },
          { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', revenue: 23456, previousRevenue: 22345, change: 5.0, percentOfTotal: 1.8, claimCount: 15, averageProcessingDays: 5 }
        ],
        revenueTrend: [
          { month: 'Jan', payer1: 56000, payer2: 29000, payer3: 13000 },
          { month: 'Feb', payer1: 57000, payer2: 30000, payer3: 14000 },
          { month: 'Mar', payer1: 59000, payer2: 32000, payer3: 15000 },
          { month: 'Apr', payer1: 54000, payer2: 29000, payer3: 13000 },
          { month: 'May', payer1: 56000, payer2: 31000, payer3: 14000 },
          { month: 'Jun', payer1: 58000, payer2: 33000, payer3: 15000 }
        ]
      };
    
    case ReportType.CLAIMS_STATUS:
      return {
        claimsByStatus: [
          { status: ClaimStatus.DRAFT, count: 24, amount: 78900, percentOfTotal: 6.9, averageAge: 2 },
          { status: ClaimStatus.SUBMITTED, count: 56, amount: 189600, percentOfTotal: 16.7, averageAge: 5 },
          { status: ClaimStatus.ACKNOWLEDGED, count: 15, amount: 45300, percentOfTotal: 4.0, averageAge: 7 },
          { status: ClaimStatus.PENDING, count: 45, amount: 167800, percentOfTotal: 14.8, averageAge: 12 },
          { status: ClaimStatus.PAID, count: 98, amount: 345600, percentOfTotal: 30.4, averageAge: 32 },
          { status: ClaimStatus.PARTIAL_PAID, count: 22, amount: 78500, percentOfTotal: 6.9, averageAge: 28 },
          { status: ClaimStatus.DENIED, count: 20, amount: 56700, percentOfTotal: 5.0, averageAge: 18 },
          { status: ClaimStatus.APPEALED, count: 12, amount: 43200, percentOfTotal: 3.8, averageAge: 25 },
          { status: ClaimStatus.VOID, count: 5, amount: 12300, percentOfTotal: 1.1, averageAge: 15 }
        ],
        processingByPayer: [
          { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', days: 21 },
          { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', days: 18 },
          { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', days: 15 },
          { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', days: 23 },
          { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', days: 5 }
        ]
      };
    
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return {
        agingBuckets: [
          { bucket: 'Current', amount: 245678, percentOfTotal: 49.5, claimCount: 85 },
          { bucket: '1-30 Days', amount: 123456, percentOfTotal: 24.9, claimCount: 42 },
          { bucket: '31-60 Days', amount: 78901, percentOfTotal: 15.9, claimCount: 26 },
          { bucket: '61-90 Days', amount: 35687, percentOfTotal: 7.2, claimCount: 15 },
          { bucket: '91+ Days', amount: 12345, percentOfTotal: 2.5, claimCount: 8 }
        ],
        agingByPayer: [
          { 
            payerId: '623e4567-e89b-12d3-a456-426614174000', 
            payerName: 'Medicaid', 
            current: 120000, 
            days1To30: 65000, 
            days31To60: 34000, 
            days61To90: 15000, 
            days91Plus: 5000 
          },
          { 
            payerId: '723e4567-e89b-12d3-a456-426614174001', 
            payerName: 'Medicare', 
            current: 80000, 
            days1To30: 35000, 
            days31To60: 25000, 
            days61To90: 12000, 
            days91Plus: 3000 
          },
          { 
            payerId: '823e4567-e89b-12d3-a456-426614174002', 
            payerName: 'Blue Cross', 
            current: 25000, 
            days1To30: 15000, 
            days31To60: 9000, 
            days61To90: 4000, 
            days91Plus: 2000 
          },
          { 
            payerId: '923e4567-e89b-12d3-a456-426614174003', 
            payerName: 'United Healthcare', 
            current: 15000, 
            days1To30: 7000, 
            days31To60: 6000, 
            days61To90: 3000, 
            days91Plus: 1500 
          },
          { 
            payerId: 'a23e4567-e89b-12d3-a456-426614174004', 
            payerName: 'Private Pay', 
            current: 5678, 
            days1To30: 1456, 
            days31To60: 4901, 
            days61To90: 1687, 
            days91Plus: 845 
          }
        ]
      };
    
    case ReportType.DENIAL_ANALYSIS:
      return {
        denialsByReason: [
          { 
            denialReason: 'Authorization Missing', 
            denialCode: 'CO:54', 
            count: 28, 
            amount: 98765, 
            percentOfTotal: 35.0,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 15 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 8 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 5 }
            ]
          },
          { 
            denialReason: 'Service Not Covered', 
            denialCode: 'CO:96', 
            count: 18, 
            amount: 65432, 
            percentOfTotal: 23.2,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 6 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 9 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
            ]
          },
          { 
            denialReason: 'Duplicate Claim', 
            denialCode: 'CO:18', 
            count: 14, 
            amount: 43210, 
            percentOfTotal: 15.3,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 8 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 3 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
            ]
          },
          { 
            denialReason: 'Timely Filing', 
            denialCode: 'CO:29', 
            count: 12, 
            amount: 34567, 
            percentOfTotal: 12.2,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 5 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 4 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
            ]
          },
          { 
            denialReason: 'Client Ineligible', 
            denialCode: 'CO:24', 
            count: 8, 
            amount: 23456, 
            percentOfTotal: 8.3,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 5 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 2 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 1 }
            ]
          },
          { 
            denialReason: 'Other', 
            denialCode: 'CO:16', 
            count: 6, 
            amount: 17890, 
            percentOfTotal: 6.0,
            payerBreakdown: [
              { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 2 },
              { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 2 },
              { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 2 }
            ]
          }
        ],
        denialsByPayer: [
          { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', rate: 8.5 },
          { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', rate: 5.2 },
          { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', rate: 12.3 },
          { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', rate: 9.7 },
          { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', rate: 4.1 }
        ],
        denialTrend: [
          { month: 'Jan', rate: 9.2 },
          { month: 'Feb', rate: 8.7 },
          { month: 'Mar', rate: 8.3 },
          { month: 'Apr', rate: 7.9 },
          { month: 'May', rate: 8.1 },
          { month: 'Jun', rate: 7.5 }
        ]
      };
    
    case ReportType.PAYER_PERFORMANCE:
      return {
        payerPerformance: [
          { 
            payerId: '623e4567-e89b-12d3-a456-426614174000', 
            payerName: 'Medicaid', 
            claimsSubmitted: 450, 
            claimsPaid: 398, 
            claimsDenied: 37, 
            denialRate: 8.2, 
            averageProcessingDays: 21, 
            paymentRate: 95.4 
          },
          { 
            payerId: '723e4567-e89b-12d3-a456-426614174001', 
            payerName: 'Medicare', 
            claimsSubmitted: 320, 
            claimsPaid: 298, 
            claimsDenied: 18, 
            denialRate: 5.6, 
            averageProcessingDays: 18, 
            paymentRate: 97.8 
          },
          { 
            payerId: '823e4567-e89b-12d3-a456-426614174002', 
            payerName: 'Blue Cross', 
            claimsSubmitted: 180, 
            claimsPaid: 152, 
            claimsDenied: 22, 
            denialRate: 12.2, 
            averageProcessingDays: 15, 
            paymentRate: 92.5 
          },
          { 
            payerId: '923e4567-e89b-12d3-a456-426614174003', 
            payerName: 'United Healthcare', 
            claimsSubmitted: 120, 
            claimsPaid: 105, 
            claimsDenied: 12, 
            denialRate: 10.0, 
            averageProcessingDays: 23, 
            paymentRate: 93.8 
          },
          { 
            payerId: 'a23e4567-e89b-12d3-a456-426614174004', 
            payerName: 'Private Pay', 
            claimsSubmitted: 50, 
            claimsPaid: 47, 
            claimsDenied: 2, 
            denialRate: 4.0, 
            averageProcessingDays: 5, 
            paymentRate: 98.2 
          }
        ]
      };
    
    case ReportType.SERVICE_UTILIZATION:
      return {
        utilizationByProgram: [
          { 
            programId: '123e4567-e89b-12d3-a456-426614174000', 
            programName: 'Personal Care', 
            unitsAuthorized: 5000, 
            unitsDelivered: 4250, 
            utilizationRate: 85, 
            clientCount: 45 
          },
          { 
            programId: '223e4567-e89b-12d3-a456-426614174001', 
            programName: 'Residential', 
            unitsAuthorized: 4200, 
            unitsDelivered: 3990, 
            utilizationRate: 95, 
            clientCount: 32 
          },
          { 
            programId: '323e4567-e89b-12d3-a456-426614174002', 
            programName: 'Day Services', 
            unitsAuthorized: 3800, 
            unitsDelivered: 3420, 
            utilizationRate: 90, 
            clientCount: 28 
          },
          { 
            programId: '423e4567-e89b-12d3-a456-426614174003', 
            programName: 'Respite', 
            unitsAuthorized: 2500, 
            unitsDelivered: 1875, 
            utilizationRate: 75, 
            clientCount: 20 
          },
          { 
            programId: '523e4567-e89b-12d3-a456-426614174004', 
            programName: 'Other', 
            unitsAuthorized: 1200, 
            unitsDelivered: 840, 
            utilizationRate: 70, 
            clientCount: 15 
          }
        ],
        utilizationByService: [
          { 
            serviceTypeId: 'b23e4567-e89b-12d3-a456-426614174000', 
            serviceTypeName: 'Personal Assistance', 
            programId: '123e4567-e89b-12d3-a456-426614174000',
            programName: 'Personal Care',
            unitsAuthorized: 3000, 
            unitsDelivered: 2550, 
            utilizationRate: 85, 
            clientCount: 35 
          },
          { 
            serviceTypeId: 'c23e4567-e89b-12d3-a456-426614174001', 
            serviceTypeName: 'Group Home', 
            programId: '223e4567-e89b-12d3-a456-426614174001',
            programName: 'Residential',
            unitsAuthorized: 2800, 
            unitsDelivered: 2660, 
            utilizationRate: 95, 
            clientCount: 20 
          },
          { 
            serviceTypeId: 'd23e4567-e89b-12d3-a456-426614174002', 
            serviceTypeName: 'Day Habilitation', 
            programId: '323e4567-e89b-12d3-a456-426614174002',
            programName: 'Day Services',
            unitsAuthorized: 2200, 
            unitsDelivered: 1980, 
            utilizationRate: 90, 
            clientCount: 18 
          },
          { 
            serviceTypeId: 'e23e4567-e89b-12d3-a456-426614174003', 
            serviceTypeName: 'In-Home Respite', 
            programId: '423e4567-e89b-12d3-a456-426614174003',
            programName: 'Respite',
            unitsAuthorized: 1500, 
            unitsDelivered: 1125, 
            utilizationRate: 75, 
            clientCount: 15 
          },
          { 
            serviceTypeId: 'f23e4567-e89b-12d3-a456-426614174004', 
            serviceTypeName: 'Nursing', 
            programId: '523e4567-e89b-12d3-a456-426614174004',
            programName: 'Other',
            unitsAuthorized: 800, 
            unitsDelivered: 560, 
            utilizationRate: 70, 
            clientCount: 10 
          }
        ]
      };
    
    default:
      return {};
  }
}

/**
 * Generates mock visualization configuration for report visualizations
 * @param reportType - The type of report to generate visualizations for
 * @returns Array of visualization configurations
 */
function generateMockVisualization(reportType: ReportType): Array<any> {
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
      return [
        {
          id: 'revByProgramBar',
          title: 'Revenue by Program',
          type: ChartType.BAR,
          dataKey: 'programRevenue',
          xAxis: { key: 'programName', label: 'Program' },
          yAxis: { key: 'revenue', label: 'Revenue ($)' },
          series: [{ key: 'revenue', label: 'Revenue', color: '#2196f3' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'revByProgramPie',
          title: 'Revenue Distribution',
          type: ChartType.PIE,
          dataKey: 'programRevenue',
          series: [{ key: 'revenue', label: 'Revenue' }],
          options: { showLegend: true, showLabels: true }
        },
        {
          id: 'revTrendByProgram',
          title: 'Revenue Trend by Program',
          type: ChartType.LINE,
          dataKey: 'revenueTrend',
          xAxis: { key: 'month', label: 'Month' },
          yAxis: { key: 'revenue', label: 'Revenue ($)' },
          series: [
            { key: 'program1', label: 'Personal Care', color: '#2196f3' },
            { key: 'program2', label: 'Residential', color: '#4caf50' },
            { key: 'program3', label: 'Day Services', color: '#ff9800' }
          ],
          options: { showPoints: true, curveType: 'monotone' }
        }
      ];
    
    case ReportType.REVENUE_BY_PAYER:
      return [
        {
          id: 'revByPayerBar',
          title: 'Revenue by Payer',
          type: ChartType.BAR,
          dataKey: 'payerRevenue',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'revenue', label: 'Revenue ($)' },
          series: [{ key: 'revenue', label: 'Revenue', color: '#2196f3' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'revByPayerPie',
          title: 'Revenue Distribution',
          type: ChartType.PIE,
          dataKey: 'payerRevenue',
          series: [{ key: 'revenue', label: 'Revenue' }],
          options: { showLegend: true, showLabels: true }
        },
        {
          id: 'revTrendByPayer',
          title: 'Revenue Trend by Payer',
          type: ChartType.LINE,
          dataKey: 'revenueTrend',
          xAxis: { key: 'month', label: 'Month' },
          yAxis: { key: 'revenue', label: 'Revenue ($)' },
          series: [
            { key: 'payer1', label: 'Medicaid', color: '#2196f3' },
            { key: 'payer2', label: 'Medicare', color: '#4caf50' },
            { key: 'payer3', label: 'Blue Cross', color: '#ff9800' }
          ],
          options: { showPoints: true, curveType: 'monotone' }
        }
      ];
    
    case ReportType.CLAIMS_STATUS:
      return [
        {
          id: 'claimsByStatusPie',
          title: 'Claims by Status',
          type: ChartType.PIE,
          dataKey: 'claimsByStatus',
          series: [{ key: 'count', label: 'Claims' }],
          options: { showLegend: true, showLabels: true }
        },
        {
          id: 'claimsByStatusBar',
          title: 'Claims Amount by Status',
          type: ChartType.BAR,
          dataKey: 'claimsByStatus',
          xAxis: { key: 'status', label: 'Status' },
          yAxis: { key: 'amount', label: 'Amount ($)' },
          series: [{ key: 'amount', label: 'Amount', color: '#2196f3' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'claimsProcessingTime',
          title: 'Average Claim Processing Time by Payer',
          type: ChartType.BAR,
          dataKey: 'processingByPayer',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'days', label: 'Days' },
          series: [{ key: 'days', label: 'Processing Days', color: '#ff9800' }],
          options: { horizontal: true, stacked: false }
        }
      ];
    
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return [
        {
          id: 'agingBucketsBar',
          title: 'Accounts Receivable Aging',
          type: ChartType.BAR,
          dataKey: 'agingBuckets',
          xAxis: { key: 'bucket', label: 'Aging Bucket' },
          yAxis: { key: 'amount', label: 'Amount ($)' },
          series: [{ key: 'amount', label: 'Amount', color: '#2196f3' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'agingByPayer',
          title: 'Aging by Payer',
          type: ChartType.BAR,
          dataKey: 'agingByPayer',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'amount', label: 'Amount ($)' },
          series: [
            { key: 'current', label: 'Current', color: '#4caf50' },
            { key: 'days1To30', label: '1-30 Days', color: '#8bc34a' },
            { key: 'days31To60', label: '31-60 Days', color: '#ffeb3b' },
            { key: 'days61To90', label: '61-90 Days', color: '#ff9800' },
            { key: 'days91Plus', label: '91+ Days', color: '#f44336' }
          ],
          options: { horizontal: false, stacked: true }
        }
      ];
    
    case ReportType.DENIAL_ANALYSIS:
      return [
        {
          id: 'denialsByReasonPie',
          title: 'Denials by Reason',
          type: ChartType.PIE,
          dataKey: 'denialsByReason',
          series: [{ key: 'count', label: 'Denials' }],
          options: { showLegend: true, showLabels: true }
        },
        {
          id: 'denialsByPayerBar',
          title: 'Denial Rate by Payer',
          type: ChartType.BAR,
          dataKey: 'denialsByPayer',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'rate', label: 'Denial Rate (%)' },
          series: [{ key: 'rate', label: 'Denial Rate', color: '#f44336' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'denialTrend',
          title: 'Denial Trend',
          type: ChartType.LINE,
          dataKey: 'denialTrend',
          xAxis: { key: 'month', label: 'Month' },
          yAxis: { key: 'rate', label: 'Denial Rate (%)' },
          series: [{ key: 'rate', label: 'Denial Rate', color: '#f44336' }],
          options: { showPoints: true, curveType: 'monotone' }
        }
      ];
    
    case ReportType.PAYER_PERFORMANCE:
      return [
        {
          id: 'payerProcessingTime',
          title: 'Average Processing Time by Payer',
          type: ChartType.BAR,
          dataKey: 'payerPerformance',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'averageProcessingDays', label: 'Days' },
          series: [{ key: 'averageProcessingDays', label: 'Avg. Processing Days', color: '#2196f3' }],
          options: { horizontal: true, stacked: false }
        },
        {
          id: 'payerPaymentRate',
          title: 'Payment Rate by Payer',
          type: ChartType.BAR,
          dataKey: 'payerPerformance',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'paymentRate', label: 'Payment Rate (%)' },
          series: [{ key: 'paymentRate', label: 'Payment Rate', color: '#4caf50' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'payerDenialRate',
          title: 'Denial Rate by Payer',
          type: ChartType.BAR,
          dataKey: 'payerPerformance',
          xAxis: { key: 'payerName', label: 'Payer' },
          yAxis: { key: 'denialRate', label: 'Denial Rate (%)' },
          series: [{ key: 'denialRate', label: 'Denial Rate', color: '#f44336' }],
          options: { horizontal: false, stacked: false }
        }
      ];
    
    case ReportType.SERVICE_UTILIZATION:
      return [
        {
          id: 'utilizationByProgram',
          title: 'Utilization by Program',
          type: ChartType.BAR,
          dataKey: 'utilizationByProgram',
          xAxis: { key: 'programName', label: 'Program' },
          yAxis: { key: 'utilizationRate', label: 'Utilization Rate (%)' },
          series: [{ key: 'utilizationRate', label: 'Utilization Rate', color: '#2196f3' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'utilizationByService',
          title: 'Utilization by Service Type',
          type: ChartType.BAR,
          dataKey: 'utilizationByService',
          xAxis: { key: 'serviceTypeName', label: 'Service Type' },
          yAxis: { key: 'utilizationRate', label: 'Utilization Rate (%)' },
          series: [{ key: 'utilizationRate', label: 'Utilization Rate', color: '#4caf50' }],
          options: { horizontal: false, stacked: false }
        },
        {
          id: 'unitsDeliveredVsAuthorized',
          title: 'Units Delivered vs. Authorized',
          type: ChartType.BAR,
          dataKey: 'utilizationByProgram',
          xAxis: { key: 'programName', label: 'Program' },
          yAxis: { key: 'units', label: 'Units' },
          series: [
            { key: 'unitsAuthorized', label: 'Authorized', color: '#9e9e9e' },
            { key: 'unitsDelivered', label: 'Delivered', color: '#2196f3' }
          ],
          options: { horizontal: false, stacked: false }
        }
      ];
    
    default:
      return [];
  }
}

/**
 * Generates mock summary metrics for report headers
 * @param reportType - The type of report to generate summary metrics for
 * @returns Array of summary metric objects
 */
function generateMockSummaryMetrics(reportType: ReportType): Array<any> {
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
      return [
        { 
          label: 'Total Revenue', 
          value: 1245678, 
          previousValue: 1195120, 
          change: 4.2, 
          trend: MetricTrend.UP, 
          format: 'currency' 
        },
        { 
          label: 'Total Claims', 
          value: 342, 
          previousValue: 325, 
          change: 5.2, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Revenue per Claim', 
          value: 3642.33, 
          previousValue: 3677.29, 
          change: -0.9, 
          trend: MetricTrend.DOWN, 
          format: 'currency' 
        },
        { 
          label: 'Top Program', 
          value: 'Personal Care', 
          previousValue: 'Personal Care', 
          change: 0, 
          trend: MetricTrend.FLAT, 
          format: 'text' 
        }
      ];
    
    case ReportType.REVENUE_BY_PAYER:
      return [
        { 
          label: 'Total Revenue', 
          value: 1303589, 
          previousValue: 1253197, 
          change: 4.0, 
          trend: MetricTrend.UP, 
          format: 'currency' 
        },
        { 
          label: 'Total Claims', 
          value: 363, 
          previousValue: 342, 
          change: 6.1, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Top Payer', 
          value: 'Medicaid', 
          previousValue: 'Medicaid', 
          change: 0, 
          trend: MetricTrend.FLAT, 
          format: 'text' 
        },
        { 
          label: 'Avg Processing Days', 
          value: 19.2, 
          previousValue: 21.5, 
          change: -10.7, 
          trend: MetricTrend.DOWN, 
          format: 'number' 
        }
      ];
    
    case ReportType.CLAIMS_STATUS:
      return [
        { 
          label: 'Total Claims', 
          value: 297, 
          previousValue: 278, 
          change: 6.8, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Total Amount', 
          value: 967900, 
          previousValue: 892400, 
          change: 8.5, 
          trend: MetricTrend.UP, 
          format: 'currency' 
        },
        { 
          label: 'Denial Rate', 
          value: 8.2, 
          previousValue: 9.1, 
          change: -9.9, 
          trend: MetricTrend.DOWN, 
          format: 'percentage' 
        },
        { 
          label: 'Avg Claim Age', 
          value: 16.5, 
          previousValue: 18.3, 
          change: -9.8, 
          trend: MetricTrend.DOWN, 
          format: 'number' 
        }
      ];
    
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return [
        { 
          label: 'Total Outstanding', 
          value: 496067, 
          previousValue: 523450, 
          change: -5.2, 
          trend: MetricTrend.DOWN, 
          format: 'currency' 
        },
        { 
          label: 'Current Percentage', 
          value: 49.5, 
          previousValue: 46.2, 
          change: 7.1, 
          trend: MetricTrend.UP, 
          format: 'percentage' 
        },
        { 
          label: '91+ Days Amount', 
          value: 12345, 
          previousValue: 15675, 
          change: -21.2, 
          trend: MetricTrend.DOWN, 
          format: 'currency' 
        },
        { 
          label: 'Days Sales Outstanding', 
          value: 32.4, 
          previousValue: 35.8, 
          change: -9.5, 
          trend: MetricTrend.DOWN, 
          format: 'number' 
        }
      ];
    
    case ReportType.DENIAL_ANALYSIS:
      return [
        { 
          label: 'Total Denials', 
          value: 86, 
          previousValue: 92, 
          change: -6.5, 
          trend: MetricTrend.DOWN, 
          format: 'number' 
        },
        { 
          label: 'Denial Amount', 
          value: 283320, 
          previousValue: 312450, 
          change: -9.3, 
          trend: MetricTrend.DOWN, 
          format: 'currency' 
        },
        { 
          label: 'Denial Rate', 
          value: 8.2, 
          previousValue: 9.1, 
          change: -9.9, 
          trend: MetricTrend.DOWN, 
          format: 'percentage' 
        },
        { 
          label: 'Top Denial Reason', 
          value: 'Authorization Missing', 
          previousValue: 'Authorization Missing', 
          change: 0, 
          trend: MetricTrend.FLAT, 
          format: 'text' 
        }
      ];
    
    case ReportType.PAYER_PERFORMANCE:
      return [
        { 
          label: 'Total Claims Submitted', 
          value: 1120, 
          previousValue: 1050, 
          change: 6.7, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Average Denial Rate', 
          value: 8.2, 
          previousValue: 9.1, 
          change: -9.9, 
          trend: MetricTrend.DOWN, 
          format: 'percentage' 
        },
        { 
          label: 'Average Processing Time', 
          value: 19.2, 
          previousValue: 21.5, 
          change: -10.7, 
          trend: MetricTrend.DOWN, 
          format: 'number' 
        },
        { 
          label: 'Best Performing Payer', 
          value: 'Private Pay', 
          previousValue: 'Private Pay', 
          change: 0, 
          trend: MetricTrend.FLAT, 
          format: 'text' 
        }
      ];
    
    case ReportType.SERVICE_UTILIZATION:
      return [
        { 
          label: 'Total Units Authorized', 
          value: 16700, 
          previousValue: 15900, 
          change: 5.0, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Total Units Delivered', 
          value: 14375, 
          previousValue: 13515, 
          change: 6.4, 
          trend: MetricTrend.UP, 
          format: 'number' 
        },
        { 
          label: 'Overall Utilization Rate', 
          value: 86.1, 
          previousValue: 85.0, 
          change: 1.3, 
          trend: MetricTrend.UP, 
          format: 'percentage' 
        },
        { 
          label: 'Total Clients Served', 
          value: 140, 
          previousValue: 135, 
          change: 3.7, 
          trend: MetricTrend.UP, 
          format: 'number' 
        }
      ];
    
    default:
      return [];
  }
}

// Mock report definitions
export const mockReportDefinitions: ReportDefinition[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Revenue by Program',
    description: 'Analysis of revenue distributed across different programs',
    type: ReportType.REVENUE_BY_PROGRAM,
    category: ReportCategory.REVENUE,
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.REVENUE_BY_PROGRAM),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:30:00Z',
    updatedAt: '2023-05-15T08:30:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Revenue by Payer',
    description: 'Analysis of revenue distributed across different payers',
    type: ReportType.REVENUE_BY_PAYER,
    category: ReportCategory.REVENUE,
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'payer',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.REVENUE_BY_PAYER),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:35:00Z',
    updatedAt: '2023-05-15T08:35:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    name: 'Claims Status Report',
    description: 'Analysis of claims by status and processing metrics',
    type: ReportType.CLAIMS_STATUS,
    category: ReportCategory.CLAIMS,
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'status',
      sortBy: 'count',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.CLAIMS_STATUS),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:40:00Z',
    updatedAt: '2023-05-15T08:40:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '423e4567-e89b-12d3-a456-426614174003',
    name: 'Aging Accounts Receivable',
    description: 'Analysis of accounts receivable by aging buckets',
    type: ReportType.AGING_ACCOUNTS_RECEIVABLE,
    category: ReportCategory.FINANCIAL,
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: '2023-05-31',
      groupBy: 'agingBucket',
      sortBy: 'amount',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.AGING_ACCOUNTS_RECEIVABLE),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:45:00Z',
    updatedAt: '2023-05-15T08:45:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '523e4567-e89b-12d3-a456-426614174004',
    name: 'Denial Analysis',
    description: 'Analysis of claim denials by reason and payer',
    type: ReportType.DENIAL_ANALYSIS,
    category: ReportCategory.CLAIMS,
    parameters: {
      timeFrame: TimeFrame.LAST_90_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'denialReason',
      sortBy: 'count',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.DENIAL_ANALYSIS),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:50:00Z',
    updatedAt: '2023-05-15T08:50:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '623e4567-e89b-12d3-a456-426614174005',
    name: 'Payer Performance',
    description: 'Comparison of performance metrics across different payers',
    type: ReportType.PAYER_PERFORMANCE,
    category: ReportCategory.CLAIMS,
    parameters: {
      timeFrame: TimeFrame.LAST_90_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'payer',
      sortBy: 'denialRate',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.PAYER_PERFORMANCE),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T08:55:00Z',
    updatedAt: '2023-05-15T08:55:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '723e4567-e89b-12d3-a456-426614174006',
    name: 'Service Utilization',
    description: 'Analysis of service delivery and utilization rates',
    type: ReportType.SERVICE_UTILIZATION,
    category: ReportCategory.OPERATIONAL,
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'utilizationRate',
      limit: 100,
      customParameters: {}
    },
    visualizations: generateMockVisualization(ReportType.SERVICE_UTILIZATION),
    isTemplate: true,
    isSystem: true,
    createdAt: '2023-05-15T09:00:00Z',
    updatedAt: '2023-05-15T09:00:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: '823e4567-e89b-12d3-a456-426614174007',
    name: 'Monthly Revenue Review',
    description: 'Custom revenue report for monthly executive review',
    type: ReportType.REVENUE_BY_PROGRAM,
    category: ReportCategory.REVENUE,
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {
        showYearToDate: true,
        includeProjections: true
      }
    },
    visualizations: generateMockVisualization(ReportType.REVENUE_BY_PROGRAM),
    isTemplate: false,
    isSystem: false,
    createdAt: '2023-05-20T10:15:00Z',
    updatedAt: '2023-05-20T10:15:00Z',
    createdBy: '323e4567-e89b-12d3-a456-426614174000'
  }
];

// Mock report instances
export const mockReportInstances: ReportInstance[] = [
  {
    id: '923e4567-e89b-12d3-a456-426614174000',
    reportDefinitionId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Revenue by Program - May 2023',
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: '2023-05-01', endDate: '2023-05-31' },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: '2023-04-01', endDate: '2023-04-30' },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    status: ReportStatus.COMPLETED,
    generatedAt: '2023-06-01T09:30:00Z',
    expiresAt: '2023-07-01T09:30:00Z',
    fileUrls: {
      [ReportFormat.PDF]: 'https://example.com/reports/revenue-by-program-may-2023.pdf',
      [ReportFormat.EXCEL]: 'https://example.com/reports/revenue-by-program-may-2023.xlsx',
      [ReportFormat.CSV]: 'https://example.com/reports/revenue-by-program-may-2023.csv',
      [ReportFormat.JSON]: 'https://example.com/reports/revenue-by-program-may-2023.json'
    },
    errorMessage: '',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'a23e4567-e89b-12d3-a456-426614174001',
    reportDefinitionId: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Revenue by Payer - May 2023',
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: '2023-05-01', endDate: '2023-05-31' },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: '2023-04-01', endDate: '2023-04-30' },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'payer',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    status: ReportStatus.COMPLETED,
    generatedAt: '2023-06-01T09:35:00Z',
    expiresAt: '2023-07-01T09:35:00Z',
    fileUrls: {
      [ReportFormat.PDF]: 'https://example.com/reports/revenue-by-payer-may-2023.pdf',
      [ReportFormat.EXCEL]: 'https://example.com/reports/revenue-by-payer-may-2023.xlsx',
      [ReportFormat.CSV]: 'https://example.com/reports/revenue-by-payer-may-2023.csv',
      [ReportFormat.JSON]: 'https://example.com/reports/revenue-by-payer-may-2023.json'
    },
    errorMessage: '',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'b23e4567-e89b-12d3-a456-426614174002',
    reportDefinitionId: '323e4567-e89b-12d3-a456-426614174002',
    name: 'Claims Status Report - Q2 2023',
    parameters: {
      timeFrame: TimeFrame.CUSTOM,
      dateRange: { startDate: '2023-04-01', endDate: '2023-06-30' },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: '2023-01-01', endDate: '2023-03-31' },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'status',
      sortBy: 'count',
      limit: 100,
      customParameters: {}
    },
    status: ReportStatus.GENERATING,
    generatedAt: '2023-07-01T10:00:00Z',
    expiresAt: '2023-08-01T10:00:00Z',
    fileUrls: {
      [ReportFormat.PDF]: '',
      [ReportFormat.EXCEL]: '',
      [ReportFormat.CSV]: '',
      [ReportFormat.JSON]: ''
    },
    errorMessage: '',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'c23e4567-e89b-12d3-a456-426614174003',
    reportDefinitionId: '423e4567-e89b-12d3-a456-426614174003',
    name: 'Aging Accounts Receivable - June 30, 2023',
    parameters: {
      timeFrame: TimeFrame.CUSTOM,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: '2023-06-30',
      groupBy: 'agingBucket',
      sortBy: 'amount',
      limit: 100,
      customParameters: {}
    },
    status: ReportStatus.COMPLETED,
    generatedAt: '2023-07-01T08:00:00Z',
    expiresAt: '2023-08-01T08:00:00Z',
    fileUrls: {
      [ReportFormat.PDF]: 'https://example.com/reports/aging-ar-june-30-2023.pdf',
      [ReportFormat.EXCEL]: 'https://example.com/reports/aging-ar-june-30-2023.xlsx',
      [ReportFormat.CSV]: 'https://example.com/reports/aging-ar-june-30-2023.csv',
      [ReportFormat.JSON]: 'https://example.com/reports/aging-ar-june-30-2023.json'
    },
    errorMessage: '',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'd23e4567-e89b-12d3-a456-426614174004',
    reportDefinitionId: '523e4567-e89b-12d3-a456-426614174004',
    name: 'Denial Analysis - Q2 2023',
    parameters: {
      timeFrame: TimeFrame.CUSTOM,
      dateRange: { startDate: '2023-04-01', endDate: '2023-06-30' },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: '2023-01-01', endDate: '2023-03-31' },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'denialReason',
      sortBy: 'count',
      limit: 100,
      customParameters: {}
    },
    status: ReportStatus.FAILED,
    generatedAt: '2023-07-01T08:15:00Z',
    expiresAt: '2023-08-01T08:15:00Z',
    fileUrls: {
      [ReportFormat.PDF]: '',
      [ReportFormat.EXCEL]: '',
      [ReportFormat.CSV]: '',
      [ReportFormat.JSON]: ''
    },
    errorMessage: 'Unable to retrieve denial data for the specified date range.',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  }
];

// Mock scheduled reports
export const mockScheduledReports: ScheduledReport[] = [
  {
    id: 'e23e4567-e89b-12d3-a456-426614174000',
    reportDefinitionId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Monthly Revenue by Program',
    description: 'Automated monthly report showing revenue distribution by program',
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    frequency: ScheduleFrequency.MONTHLY,
    dayOfWeek: null,
    dayOfMonth: 1,
    time: '08:00',
    formats: [ReportFormat.PDF, ReportFormat.EXCEL],
    recipients: [
      { email: 'finance@example.com', userId: '223e4567-e89b-12d3-a456-426614174000', name: 'Finance Team' },
      { email: 'director@example.com', userId: '323e4567-e89b-12d3-a456-426614174000', name: 'Executive Director' }
    ],
    isActive: true,
    lastRunAt: '2023-06-01T08:00:00Z',
    nextRunAt: '2023-07-01T08:00:00Z',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-06-01T08:15:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'f23e4567-e89b-12d3-a456-426614174001',
    reportDefinitionId: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Bi-weekly Payer Analysis',
    description: 'Bi-weekly analysis of revenue by payer with trends',
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'payer',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    frequency: ScheduleFrequency.BIWEEKLY,
    dayOfWeek: 1, // Monday
    dayOfMonth: null,
    time: '09:00',
    formats: [ReportFormat.PDF, ReportFormat.EXCEL, ReportFormat.CSV],
    recipients: [
      { email: 'billing@example.com', userId: '423e4567-e89b-12d3-a456-426614174000', name: 'Billing Team' },
      { email: 'finance@example.com', userId: '223e4567-e89b-12d3-a456-426614174000', name: 'Finance Team' }
    ],
    isActive: true,
    lastRunAt: '2023-06-26T09:00:00Z',
    nextRunAt: '2023-07-10T09:00:00Z',
    createdAt: '2023-02-10T11:30:00Z',
    updatedAt: '2023-06-26T09:15:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'g23e4567-e89b-12d3-a456-426614174002',
    reportDefinitionId: '423e4567-e89b-12d3-a456-426614174003',
    name: 'Weekly AR Aging Report',
    description: 'Weekly accounts receivable aging analysis',
    parameters: {
      timeFrame: TimeFrame.CUSTOM,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null, // Will be set dynamically to current date
      groupBy: 'agingBucket',
      sortBy: 'amount',
      limit: 100,
      customParameters: {}
    },
    frequency: ScheduleFrequency.WEEKLY,
    dayOfWeek: 1, // Monday
    dayOfMonth: null,
    time: '07:00',
    formats: [ReportFormat.PDF, ReportFormat.EXCEL],
    recipients: [
      { email: 'billing@example.com', userId: '423e4567-e89b-12d3-a456-426614174000', name: 'Billing Team' },
      { email: 'collections@example.com', userId: '523e4567-e89b-12d3-a456-426614174000', name: 'Collections Team' }
    ],
    isActive: true,
    lastRunAt: '2023-06-26T07:00:00Z',
    nextRunAt: '2023-07-03T07:00:00Z',
    createdAt: '2023-03-01T14:00:00Z',
    updatedAt: '2023-06-26T07:15:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'h23e4567-e89b-12d3-a456-426614174003',
    reportDefinitionId: '523e4567-e89b-12d3-a456-426614174004',
    name: 'Quarterly Denial Analysis',
    description: 'Quarterly analysis of claim denials by reason and payer',
    parameters: {
      timeFrame: TimeFrame.CUSTOM, // Will be set dynamically to current quarter
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'denialReason',
      sortBy: 'count',
      limit: 100,
      customParameters: {}
    },
    frequency: ScheduleFrequency.QUARTERLY,
    dayOfWeek: null,
    dayOfMonth: 5, // 5th day of the first month of the quarter
    time: '08:30',
    formats: [ReportFormat.PDF, ReportFormat.EXCEL, ReportFormat.CSV],
    recipients: [
      { email: 'billing@example.com', userId: '423e4567-e89b-12d3-a456-426614174000', name: 'Billing Team' },
      { email: 'finance@example.com', userId: '223e4567-e89b-12d3-a456-426614174000', name: 'Finance Team' },
      { email: 'director@example.com', userId: '323e4567-e89b-12d3-a456-426614174000', name: 'Executive Director' }
    ],
    isActive: true,
    lastRunAt: '2023-04-05T08:30:00Z',
    nextRunAt: '2023-07-05T08:30:00Z',
    createdAt: '2023-01-20T16:45:00Z',
    updatedAt: '2023-04-05T08:45:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  },
  {
    id: 'i23e4567-e89b-12d3-a456-426614174004',
    reportDefinitionId: '623e4567-e89b-12d3-a456-426614174005',
    name: 'Monthly Payer Performance',
    description: 'Monthly analysis of payer performance metrics',
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: null, endDate: null },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: null, endDate: null },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'payer',
      sortBy: 'denialRate',
      limit: 100,
      customParameters: {}
    },
    frequency: ScheduleFrequency.MONTHLY,
    dayOfWeek: null,
    dayOfMonth: 5,
    time: '09:30',
    formats: [ReportFormat.PDF, ReportFormat.EXCEL],
    recipients: [
      { email: 'billing@example.com', userId: '423e4567-e89b-12d3-a456-426614174000', name: 'Billing Team' },
      { email: 'claimsManager@example.com', userId: '623e4567-e89b-12d3-a456-426614174000', name: 'Claims Manager' }
    ],
    isActive: false, // Temporarily disabled
    lastRunAt: '2023-05-05T09:30:00Z',
    nextRunAt: '2023-07-05T09:30:00Z',
    createdAt: '2023-02-15T13:20:00Z',
    updatedAt: '2023-06-02T15:45:00Z',
    createdBy: '223e4567-e89b-12d3-a456-426614174000'
  }
];

// Mock report data for a specific report instance
export const mockReportData: ReportData = {
  metadata: {
    reportName: 'Revenue by Program - May 2023',
    reportType: ReportType.REVENUE_BY_PROGRAM,
    generatedAt: '2023-06-01T09:30:00Z',
    generatedBy: { id: '223e4567-e89b-12d3-a456-426614174000', name: 'Finance Manager' },
    parameters: {
      timeFrame: TimeFrame.CURRENT_MONTH,
      dateRange: { startDate: '2023-05-01', endDate: '2023-05-31' },
      comparisonType: ComparisonType.PREVIOUS_PERIOD,
      comparisonDateRange: { startDate: '2023-04-01', endDate: '2023-04-30' },
      programIds: [],
      payerIds: [],
      facilityIds: [],
      serviceTypeIds: [],
      asOfDate: null,
      groupBy: 'program',
      sortBy: 'revenue',
      limit: 100,
      customParameters: {}
    },
    organization: { id: '123e4567-e89b-12d3-a456-426614174000', name: 'ThinkCaring HCBS Provider' }
  },
  summaryMetrics: generateMockSummaryMetrics(ReportType.REVENUE_BY_PROGRAM),
  visualizations: generateMockVisualization(ReportType.REVENUE_BY_PROGRAM),
  data: generateMockReportData(ReportType.REVENUE_BY_PROGRAM)
};

// Mock data for specific report types
export const mockRevenueByProgramData: RevenueByProgramData[] = [
  {
    programId: '123e4567-e89b-12d3-a456-426614174000',
    programName: 'Personal Care',
    revenue: 456789,
    previousRevenue: 432567,
    change: 5.6,
    percentOfTotal: 36.7,
    claimCount: 120,
    clientCount: 45,
    monthlyData: [
      { month: 'Jan', revenue: 38000 },
      { month: 'Feb', revenue: 42000 },
      { month: 'Mar', revenue: 45000 },
      { month: 'Apr', revenue: 37000 },
      { month: 'May', revenue: 40000 },
      { month: 'Jun', revenue: 43000 }
    ]
  },
  {
    programId: '223e4567-e89b-12d3-a456-426614174001',
    programName: 'Residential',
    revenue: 345678,
    previousRevenue: 356789,
    change: -3.1,
    percentOfTotal: 27.8,
    claimCount: 85,
    clientCount: 32,
    monthlyData: [
      { month: 'Jan', revenue: 29000 },
      { month: 'Feb', revenue: 30000 },
      { month: 'Mar', revenue: 32000 },
      { month: 'Apr', revenue: 29000 },
      { month: 'May', revenue: 31000 },
      { month: 'Jun', revenue: 33000 }
    ]
  },
  {
    programId: '323e4567-e89b-12d3-a456-426614174002',
    programName: 'Day Services',
    revenue: 234567,
    previousRevenue: 210456,
    change: 11.5,
    percentOfTotal: 18.9,
    claimCount: 65,
    clientCount: 28,
    monthlyData: [
      { month: 'Jan', revenue: 19000 },
      { month: 'Feb', revenue: 20000 },
      { month: 'Mar', revenue: 22000 },
      { month: 'Apr', revenue: 18000 },
      { month: 'May', revenue: 20000 },
      { month: 'Jun', revenue: 21000 }
    ]
  },
  {
    programId: '423e4567-e89b-12d3-a456-426614174003',
    programName: 'Respite',
    revenue: 123456,
    previousRevenue: 118765,
    change: 4.0,
    percentOfTotal: 9.9,
    claimCount: 42,
    clientCount: 20,
    monthlyData: [
      { month: 'Jan', revenue: 10000 },
      { month: 'Feb', revenue: 10500 },
      { month: 'Mar', revenue: 11000 },
      { month: 'Apr', revenue: 9800 },
      { month: 'May', revenue: 10200 },
      { month: 'Jun', revenue: 10800 }
    ]
  },
  {
    programId: '523e4567-e89b-12d3-a456-426614174004',
    programName: 'Other',
    revenue: 85188,
    previousRevenue: 76543,
    change: 11.3,
    percentOfTotal: 6.7,
    claimCount: 30,
    clientCount: 15,
    monthlyData: [
      { month: 'Jan', revenue: 7000 },
      { month: 'Feb', revenue: 7200 },
      { month: 'Mar', revenue: 7500 },
      { month: 'Apr', revenue: 6800 },
      { month: 'May', revenue: 7100 },
      { month: 'Jun', revenue: 7400 }
    ]
  }
];

export const mockRevenueByPayerData: RevenueByPayerData[] = [
  {
    payerId: '623e4567-e89b-12d3-a456-426614174000',
    payerName: 'Medicaid',
    revenue: 678901,
    previousRevenue: 654321,
    change: 3.8,
    percentOfTotal: 52.1,
    claimCount: 180,
    averageProcessingDays: 21,
    monthlyData: [
      { month: 'Jan', revenue: 56000 },
      { month: 'Feb', revenue: 57000 },
      { month: 'Mar', revenue: 59000 },
      { month: 'Apr', revenue: 54000 },
      { month: 'May', revenue: 56000 },
      { month: 'Jun', revenue: 58000 }
    ]
  },
  {
    payerId: '723e4567-e89b-12d3-a456-426614174001',
    payerName: 'Medicare',
    revenue: 345678,
    previousRevenue: 320987,
    change: 7.7,
    percentOfTotal: 26.5,
    claimCount: 95,
    averageProcessingDays: 18,
    monthlyData: [
      { month: 'Jan', revenue: 29000 },
      { month: 'Feb', revenue: 30000 },
      { month: 'Mar', revenue: 32000 },
      { month: 'Apr', revenue: 29000 },
      { month: 'May', revenue: 31000 },
      { month: 'Jun', revenue: 33000 }
    ]
  },
  {
    payerId: '823e4567-e89b-12d3-a456-426614174002',
    payerName: 'Blue Cross',
    revenue: 156789,
    previousRevenue: 167890,
    change: -6.6,
    percentOfTotal: 12.0,
    claimCount: 45,
    averageProcessingDays: 15,
    monthlyData: [
      { month: 'Jan', revenue: 13000 },
      { month: 'Feb', revenue: 14000 },
      { month: 'Mar', revenue: 15000 },
      { month: 'Apr', revenue: 13000 },
      { month: 'May', revenue: 14000 },
      { month: 'Jun', revenue: 15000 }
    ]
  },
  {
    payerId: '923e4567-e89b-12d3-a456-426614174003',
    payerName: 'United Healthcare',
    revenue: 98765,
    previousRevenue: 87654,
    change: 12.7,
    percentOfTotal: 7.6,
    claimCount: 28,
    averageProcessingDays: 23,
    monthlyData: [
      { month: 'Jan', revenue: 8200 },
      { month: 'Feb', revenue: 8500 },
      { month: 'Mar', revenue: 8900 },
      { month: 'Apr', revenue: 8100 },
      { month: 'May', revenue: 8400 },
      { month: 'Jun', revenue: 8700 }
    ]
  },
  {
    payerId: 'a23e4567-e89b-12d3-a456-426614174004',
    payerName: 'Private Pay',
    revenue: 23456,
    previousRevenue: 22345,
    change: 5.0,
    percentOfTotal: 1.8,
    claimCount: 15,
    averageProcessingDays: 5,
    monthlyData: [
      { month: 'Jan', revenue: 1900 },
      { month: 'Feb', revenue: 2000 },
      { month: 'Mar', revenue: 2100 },
      { month: 'Apr', revenue: 1850 },
      { month: 'May', revenue: 1950 },
      { month: 'Jun', revenue: 2050 }
    ]
  }
];

export const mockClaimsStatusData: ClaimsStatusData[] = [
  {
    status: ClaimStatus.DRAFT,
    count: 24,
    amount: 78900,
    percentOfTotal: 6.9,
    averageAge: 2
  },
  {
    status: ClaimStatus.VALIDATED,
    count: 18,
    amount: 56700,
    percentOfTotal: 5.0,
    averageAge: 1
  },
  {
    status: ClaimStatus.SUBMITTED,
    count: 56,
    amount: 189600,
    percentOfTotal: 16.7,
    averageAge: 5
  },
  {
    status: ClaimStatus.ACKNOWLEDGED,
    count: 15,
    amount: 45300,
    percentOfTotal: 4.0,
    averageAge: 7
  },
  {
    status: ClaimStatus.PENDING,
    count: 45,
    amount: 167800,
    percentOfTotal: 14.8,
    averageAge: 12
  },
  {
    status: ClaimStatus.PAID,
    count: 98,
    amount: 345600,
    percentOfTotal: 30.4,
    averageAge: 32
  },
  {
    status: ClaimStatus.PARTIAL_PAID,
    count: 22,
    amount: 78500,
    percentOfTotal: 6.9,
    averageAge: 28
  },
  {
    status: ClaimStatus.DENIED,
    count: 20,
    amount: 56700,
    percentOfTotal: 5.0,
    averageAge: 18
  },
  {
    status: ClaimStatus.APPEALED,
    count: 12,
    amount: 43200,
    percentOfTotal: 3.8,
    averageAge: 25
  },
  {
    status: ClaimStatus.VOID,
    count: 5,
    amount: 12300,
    percentOfTotal: 1.1,
    averageAge: 15
  }
];

export const mockAgingReceivablesData: AgingReceivablesData[] = [
  {
    agingBucket: AgingBucket.CURRENT,
    amount: 245678,
    percentOfTotal: 49.5,
    claimCount: 85,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', amount: 120000 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', amount: 80000 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', amount: 25000 },
      { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', amount: 15000 },
      { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', amount: 5678 }
    ]
  },
  {
    agingBucket: AgingBucket.DAYS_1_30,
    amount: 123456,
    percentOfTotal: 24.9,
    claimCount: 42,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', amount: 65000 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', amount: 35000 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', amount: 15000 },
      { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', amount: 7000 },
      { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', amount: 1456 }
    ]
  },
  {
    agingBucket: AgingBucket.DAYS_31_60,
    amount: 78901,
    percentOfTotal: 15.9,
    claimCount: 26,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', amount: 34000 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', amount: 25000 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', amount: 9000 },
      { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', amount: 6000 },
      { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', amount: 4901 }
    ]
  },
  {
    agingBucket: AgingBucket.DAYS_61_90,
    amount: 35687,
    percentOfTotal: 7.2,
    claimCount: 15,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', amount: 15000 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', amount: 12000 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', amount: 4000 },
      { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', amount: 3000 },
      { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', amount: 1687 }
    ]
  },
  {
    agingBucket: AgingBucket.DAYS_91_PLUS,
    amount: 12345,
    percentOfTotal: 2.5,
    claimCount: 8,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', amount: 5000 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', amount: 3000 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', amount: 2000 },
      { payerId: '923e4567-e89b-12d3-a456-426614174003', payerName: 'United Healthcare', amount: 1500 },
      { payerId: 'a23e4567-e89b-12d3-a456-426614174004', payerName: 'Private Pay', amount: 845 }
    ]
  }
];

export const mockDenialAnalysisData: DenialAnalysisData[] = [
  { 
    denialReason: 'Authorization Missing', 
    denialCode: 'CO:54', 
    count: 28, 
    amount: 98765, 
    percentOfTotal: 35.0,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 15 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 8 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 5 }
    ]
  },
  { 
    denialReason: 'Service Not Covered', 
    denialCode: 'CO:96', 
    count: 18, 
    amount: 65432, 
    percentOfTotal: 23.2,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 6 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 9 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
    ]
  },
  { 
    denialReason: 'Duplicate Claim', 
    denialCode: 'CO:18', 
    count: 14, 
    amount: 43210, 
    percentOfTotal: 15.3,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 8 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 3 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
    ]
  },
  { 
    denialReason: 'Timely Filing', 
    denialCode: 'CO:29', 
    count: 12, 
    amount: 34567, 
    percentOfTotal: 12.2,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 5 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 4 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 3 }
    ]
  },
  { 
    denialReason: 'Client Ineligible', 
    denialCode: 'CO:24', 
    count: 8, 
    amount: 23456, 
    percentOfTotal: 8.3,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 5 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 2 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 1 }
    ]
  },
  { 
    denialReason: 'Other', 
    denialCode: 'CO:16', 
    count: 6, 
    amount: 17890, 
    percentOfTotal: 6.0,
    payerBreakdown: [
      { payerId: '623e4567-e89b-12d3-a456-426614174000', payerName: 'Medicaid', count: 2 },
      { payerId: '723e4567-e89b-12d3-a456-426614174001', payerName: 'Medicare', count: 2 },
      { payerId: '823e4567-e89b-12d3-a456-426614174002', payerName: 'Blue Cross', count: 2 }
    ]
  }
];

export const mockPayerPerformanceData: PayerPerformanceData[] = [
  { 
    payerId: '623e4567-e89b-12d3-a456-426614174000', 
    payerName: 'Medicaid', 
    claimsSubmitted: 450, 
    claimsPaid: 398, 
    claimsDenied: 37, 
    denialRate: 8.2, 
    averageProcessingDays: 21, 
    paymentRate: 95.4 
  },
  { 
    payerId: '723e4567-e89b-12d3-a456-426614174001', 
    payerName: 'Medicare', 
    claimsSubmitted: 320, 
    claimsPaid: 298, 
    claimsDenied: 18, 
    denialRate: 5.6, 
    averageProcessingDays: 18, 
    paymentRate: 97.8 
  },
  { 
    payerId: '823e4567-e89b-12d3-a456-426614174002', 
    payerName: 'Blue Cross', 
    claimsSubmitted: 180, 
    claimsPaid: 152, 
    claimsDenied: 22, 
    denialRate: 12.2, 
    averageProcessingDays: 15, 
    paymentRate: 92.5 
  },
  { 
    payerId: '923e4567-e89b-12d3-a456-426614174003', 
    payerName: 'United Healthcare', 
    claimsSubmitted: 120, 
    claimsPaid: 105, 
    claimsDenied: 12, 
    denialRate: 10.0, 
    averageProcessingDays: 23, 
    paymentRate: 93.8 
  },
  { 
    payerId: 'a23e4567-e89b-12d3-a456-426614174004', 
    payerName: 'Private Pay', 
    claimsSubmitted: 50, 
    claimsPaid: 47, 
    claimsDenied: 2, 
    denialRate: 4.0, 
    averageProcessingDays: 5, 
    paymentRate: 98.2 
  }
];

export const mockServiceUtilizationData: ServiceUtilizationData[] = [
  { 
    serviceTypeId: 'b23e4567-e89b-12d3-a456-426614174000', 
    serviceTypeName: 'Personal Assistance', 
    programId: '123e4567-e89b-12d3-a456-426614174000',
    programName: 'Personal Care',
    unitsAuthorized: 3000, 
    unitsDelivered: 2550, 
    utilizationPercentage: 85, 
    clientCount: 35 
  },
  { 
    serviceTypeId: 'c23e4567-e89b-12d3-a456-426614174001', 
    serviceTypeName: 'Group Home', 
    programId: '223e4567-e89b-12d3-a456-426614174001',
    programName: 'Residential',
    unitsAuthorized: 2800, 
    unitsDelivered: 2660, 
    utilizationPercentage: 95, 
    clientCount: 20 
  },
  { 
    serviceTypeId: 'd23e4567-e89b-12d3-a456-426614174002', 
    serviceTypeName: 'Day Habilitation', 
    programId: '323e4567-e89b-12d3-a456-426614174002',
    programName: 'Day Services',
    unitsAuthorized: 2200, 
    unitsDelivered: 1980, 
    utilizationPercentage: 90, 
    clientCount: 18 
  },
  { 
    serviceTypeId: 'e23e4567-e89b-12d3-a456-426614174003', 
    serviceTypeName: 'In-Home Respite', 
    programId: '423e4567-e89b-12d3-a456-426614174003',
    programName: 'Respite',
    unitsAuthorized: 1500, 
    unitsDelivered: 1125, 
    utilizationPercentage: 75, 
    clientCount: 15 
  },
  { 
    serviceTypeId: 'f23e4567-e89b-12d3-a456-426614174004', 
    serviceTypeName: 'Nursing', 
    programId: '523e4567-e89b-12d3-a456-426614174004',
    programName: 'Other',
    unitsAuthorized: 800, 
    unitsDelivered: 560, 
    utilizationPercentage: 70, 
    clientCount: 10 
  }
];

// Mock API response for report generation
export const mockGenerateReportResponse: GenerateReportResponse = {
  reportInstanceId: 'j23e4567-e89b-12d3-a456-426614174000',
  reportDefinitionId: '123e4567-e89b-12d3-a456-426614174000',
  status: ReportStatus.GENERATING,
  message: 'Report generation has been initiated. You will be notified when it completes.'
};