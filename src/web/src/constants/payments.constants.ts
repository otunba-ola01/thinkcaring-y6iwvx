import { ReconciliationStatus, PaymentMethod, RemittanceFileType } from '../types/payments.types';

/**
 * Maps reconciliation status enum values to human-readable labels for display in the UI
 */
export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.UNRECONCILED]: 'Unreconciled',
  [ReconciliationStatus.PARTIALLY_RECONCILED]: 'Partially Reconciled',
  [ReconciliationStatus.RECONCILED]: 'Reconciled',
  [ReconciliationStatus.EXCEPTION]: 'Exception'
};

/**
 * Maps reconciliation status enum values to color codes for visual indicators in the UI
 */
export const RECONCILIATION_STATUS_COLORS: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.UNRECONCILED]: '#FFC107', // Amber (warning)
  [ReconciliationStatus.PARTIALLY_RECONCILED]: '#2196F3', // Blue (info)
  [ReconciliationStatus.RECONCILED]: '#4CAF50', // Green (success)
  [ReconciliationStatus.EXCEPTION]: '#F44336' // Red (error)
};

/**
 * Maps payment method enum values to human-readable labels for display in the UI
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.EFT]: 'Electronic Funds Transfer',
  [PaymentMethod.CHECK]: 'Check',
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.OTHER]: 'Other'
};

/**
 * Maps remittance file type enum values to human-readable labels for display in the UI
 */
export const REMITTANCE_FILE_TYPE_LABELS: Record<RemittanceFileType, string> = {
  [RemittanceFileType.EDI_835]: 'EDI 835',
  [RemittanceFileType.CSV]: 'CSV File',
  [RemittanceFileType.PDF]: 'PDF Document',
  [RemittanceFileType.EXCEL]: 'Excel Spreadsheet',
  [RemittanceFileType.CUSTOM]: 'Custom Format'
};

/**
 * Defines default filter values for payment list views
 */
export const DEFAULT_PAYMENT_FILTERS = {
  reconciliationStatus: [ReconciliationStatus.UNRECONCILED, ReconciliationStatus.PARTIALLY_RECONCILED],
  paymentMethod: [] as PaymentMethod[],
  dateRange: {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0] // Today
  },
  payerId: null as string | null,
  search: ''
};

/**
 * Defines column configuration for payment data tables, including headers, field mappings, and formatting
 */
export const PAYMENT_TABLE_COLUMNS = [
  {
    id: 'id',
    header: 'Payment ID',
    accessorKey: 'id',
    cell: (info: any) => info.getValue(),
    size: 100,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'payerName',
    header: 'Payer',
    accessorKey: 'payerName',
    cell: (info: any) => info.getValue(),
    size: 150,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'paymentDate',
    header: 'Date',
    accessorKey: 'paymentDate',
    cell: (info: any) => new Date(info.getValue()).toLocaleDateString(),
    size: 100,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'paymentAmount',
    header: 'Amount',
    accessorKey: 'paymentAmount',
    cell: (info: any) => `$${info.getValue().toFixed(2)}`,
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      isNumeric: true
    }
  },
  {
    id: 'paymentMethod',
    header: 'Method',
    accessorKey: 'paymentMethod',
    cell: (info: any) => PAYMENT_METHOD_LABELS[info.getValue() as PaymentMethod],
    size: 120,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'referenceNumber',
    header: 'Reference #',
    accessorKey: 'referenceNumber',
    cell: (info: any) => info.getValue() || '—',
    size: 120,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'reconciliationStatus',
    header: 'Status',
    accessorKey: 'reconciliationStatus',
    cell: (info: any) => {
      const status = info.getValue() as ReconciliationStatus;
      return {
        label: RECONCILIATION_STATUS_LABELS[status],
        color: RECONCILIATION_STATUS_COLORS[status]
      };
    },
    size: 150,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      isStatus: true
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => null, // Will be populated by the component
    size: 100,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      isActions: true
    }
  }
];

/**
 * Defines column configuration for claim payment data tables in payment reconciliation views
 */
export const CLAIM_PAYMENT_TABLE_COLUMNS = [
  {
    id: 'claimNumber',
    header: 'Claim #',
    accessorKey: 'claim.claimNumber',
    cell: (info: any) => info.getValue(),
    size: 120,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'clientName',
    header: 'Client',
    accessorKey: 'claim.clientName',
    cell: (info: any) => info.getValue(),
    size: 150,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'serviceDate',
    header: 'Service Date',
    accessorKey: 'claim.serviceDate',
    cell: (info: any) => new Date(info.getValue()).toLocaleDateString(),
    size: 120,
    enableSorting: true,
    enableFiltering: true
  },
  {
    id: 'billedAmount',
    header: 'Billed',
    accessorKey: 'claim.totalAmount',
    cell: (info: any) => `$${info.getValue().toFixed(2)}`,
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      isNumeric: true
    }
  },
  {
    id: 'paidAmount',
    header: 'Paid',
    accessorKey: 'paidAmount',
    cell: (info: any) => `$${info.getValue().toFixed(2)}`,
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      isNumeric: true
    }
  },
  {
    id: 'adjustmentAmount',
    header: 'Adjustment',
    accessorKey: 'adjustmentAmount',
    cell: (info: any) => {
      const amount = info.getValue() || 0;
      return `$${amount.toFixed(2)}`;
    },
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      isNumeric: true
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => null, // Will be populated by the component
    size: 100,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      isActions: true
    }
  }
];

/**
 * Defines available batch actions for selected payments in payment list views
 */
export const PAYMENT_BATCH_ACTIONS = [
  {
    id: 'reconcile',
    label: 'Reconcile Payments',
    icon: 'ReceiptLong',
    action: 'reconcile',
    color: 'primary',
    requiredStatus: [ReconciliationStatus.UNRECONCILED, ReconciliationStatus.PARTIALLY_RECONCILED]
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: 'FileDownload',
    action: 'export',
    color: 'default'
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: 'Delete',
    action: 'delete',
    color: 'error',
    requireConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected payments? This action cannot be undone.'
  }
];

/**
 * Defines available sorting options for payment list views
 */
export const PAYMENT_SORT_OPTIONS = [
  {
    id: 'paymentDate',
    label: 'Payment Date',
    accessorKey: 'paymentDate',
    direction: 'desc'
  },
  {
    id: 'paymentAmount',
    label: 'Payment Amount',
    accessorKey: 'paymentAmount',
    direction: 'desc'
  },
  {
    id: 'payerName',
    label: 'Payer Name',
    accessorKey: 'payerName',
    direction: 'asc'
  },
  {
    id: 'reconciliationStatus',
    label: 'Reconciliation Status',
    accessorKey: 'reconciliationStatus',
    direction: 'asc'
  }
];

/**
 * Defines available export formats for payment data
 */
export const PAYMENT_EXPORT_FORMATS = [
  {
    id: 'csv',
    label: 'CSV File',
    extension: '.csv',
    mimeType: 'text/csv'
  },
  {
    id: 'excel',
    label: 'Excel Spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    id: 'pdf',
    label: 'PDF Document',
    extension: '.pdf',
    mimeType: 'application/pdf'
  }
];

/**
 * Maps aging bucket keys to human-readable labels for accounts receivable aging reports
 */
export const AGING_BUCKET_LABELS: Record<string, string> = {
  current: 'Current',
  days1to30: '1-30 Days',
  days31to60: '31-60 Days',
  days61to90: '61-90 Days',
  days91Plus: '90+ Days'
};

/**
 * Maps aging bucket keys to color codes for visual representation in aging reports and charts
 */
export const AGING_BUCKET_COLORS: Record<string, string> = {
  current: '#4CAF50', // Green
  days1to30: '#8BC34A', // Light Green
  days31to60: '#FFC107', // Amber
  days61to90: '#FF9800', // Orange
  days91Plus: '#F44336' // Red
};