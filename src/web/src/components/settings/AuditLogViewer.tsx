# src/web/src/components/settings/AuditLogViewer.tsx
```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react v18.2.0
import { Box, Typography, Button, Chip, Tooltip, IconButton, Paper, Divider } from '@mui/material'; // v5.13.0
import { Download, Refresh, Info } from '@mui/icons-material'; // v5.13.0
import { format as formatDate } from 'date-fns'; // v2.30.0

import DataTable from '../ui/DataTable';
import FilterPanel from '../ui/FilterPanel';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import { 
  DateRange, 
  PaginationParams, 
  SortDirection, 
  FilterOperator 
} from '../../types/common.types';
import { 
  FilterType, 
  FilterConfig, 
  TableColumn 
} from '../../types/ui.types';
import useApiRequest from '../../hooks/useApiRequest';
import useToast from '../../hooks/useToast';
import { API_ENDPOINTS } from '../../constants/api.constants';

/**
 * Interface for the AuditLogViewer component props
 */
interface AuditLogViewerProps {
  sx?: any;
}

/**
 * Formats audit event type for display
 * @param {string} eventType
 * @returns {string} Formatted event type string
 */
const formatAuditEventType = (eventType: string): string => {
  // Convert event type from uppercase with underscores to title case with spaces
  const formattedEventType = eventType
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return formattedEventType;
};

/**
 * Formats audit resource type for display
 * @param {string} resourceType
 * @returns {string} Formatted resource type string
 */
const formatAuditResourceType = (resourceType: string): string => {
  // Convert resource type from uppercase with underscores to title case with spaces
  const formattedResourceType = resourceType
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return formattedResourceType;
};

/**
 * Gets the appropriate color for a severity level
 * @param {string} severity
 * @returns {string} Color code for the severity level
 */
const getSeverityColor = (severity: string): string => {
  // Map severity levels to appropriate colors (INFO to blue, WARNING to amber, ERROR to red, CRITICAL to dark red)
  switch (severity) {
    case 'INFO':
      return 'blue';
    case 'WARNING':
      return 'amber';
    case 'ERROR':
      return 'red';
    case 'CRITICAL':
      return 'darkred';
    default:
      return 'grey';
  }
};

/**
 * Exports audit logs as a CSV file
 * @param {Array} auditLogs
 * @returns {void} No return value
 */
const exportAuditLogs = (auditLogs: any[]) => {
  // Convert audit logs to CSV format
  const csvData = auditLogs.map(log => ({
    Timestamp: formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    User: log.user,
    EventType: formatAuditEventType(log.eventType),
    ResourceType: formatAuditResourceType(log.resourceType),
    ResourceId: log.resourceId,
    Details: log.details,
    Severity: log.severity
  }));

  const csvHeaders = Object.keys(csvData[0]).join(',');
  const csvRows = csvData.map(log => Object.values(log).join(',')).join('\\n');
  const csvContent = `${csvHeaders}\\n${csvRows}`;

  // Create a Blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv' });

  // Create a download link and trigger download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'audit_logs.csv');
  document.body.appendChild(a);
  a.click();

  // Clean up the temporary download link
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Component for viewing and filtering system audit logs
 * @param {AuditLogViewerProps} props
 * @returns {JSX.Element} The rendered AuditLogViewer component
 */
const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ sx }) => {
  // Initialize state for pagination, sorting, and filtering
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, pageSize: 10 });
  const [sort, setSort] = useState<{ field: string; direction: SortDirection } | null>(null);
  const [filters, setFilters] = useState<{[key: string]: any}>({});

  // Define filter configurations for the FilterPanel component
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: FilterType.DATE_RANGE,
      field: 'timestamp',
      operator: FilterOperator.BETWEEN
    },
    {
      id: 'eventType',
      label: 'Event Type',
      type: FilterType.TEXT,
      field: 'eventType',
      operator: FilterOperator.CONTAINS
    },
    {
      id: 'resourceType',
      label: 'Resource Type',
      type: FilterType.TEXT,
      field: 'resourceType',
      operator: FilterOperator.CONTAINS
    },
    {
      id: 'severity',
      label: 'Severity',
      type: FilterType.SELECT,
      field: 'severity',
      operator: FilterOperator.EQUALS,
      options: [
        { value: 'INFO', label: 'Info' },
        { value: 'WARNING', label: 'Warning' },
        { value: 'ERROR', label: 'Error' },
        { value: 'CRITICAL', label: 'Critical' }
      ]
    }
  ], []);

  // Define table columns for the DataTable component
  const columns: TableColumn[] = useMemo(() => [
    { field: 'timestamp', headerName: 'Timestamp', width: 180 },
    { field: 'user', headerName: 'User', width: 150 },
    { field: 'eventType', headerName: 'Event Type', width: 150, valueFormatter: (value) => formatAuditEventType(value) },
    { field: 'resourceType', headerName: 'Resource Type', width: 150, valueFormatter: (value) => formatAuditResourceType(value) },
    { field: 'resourceId', headerName: 'Resource ID', width: 120 },
    { field: 'details', headerName: 'Details', width: 250 },
    { 
      field: 'severity', 
      headerName: 'Severity', 
      width: 100,
      renderCell: (params) => (
        <StatusBadge status={params.value} type="audit" />
      )
    }
  ], []);

  // Use useApiRequest hook to fetch audit logs from the API
  const { data, loading, error, execute, reset } = useApiRequest<{ items: any[]; totalItems: number }>({
    url: API_ENDPOINTS.SETTINGS.AUDIT_LOG,
    method: 'GET',
    params: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortField: sort?.field,
      sortDirection: sort?.direction,
      ...filters
    }
  });

  // Use useToast hook to display toast notifications
  const toast = useToast();

  // Handle filter changes by updating filter state and refetching data
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  // Handle sort changes by updating sort state and refetching data
  const handleSortChange = useCallback((newSort: { field: string; direction: SortDirection }[]) => {
    const sortField = newSort[0].field;
    const sortDirection = newSort[0].direction;
    setSort({ field: sortField, direction: sortDirection });
  }, []);

  // Handle pagination changes by updating pagination state and refetching data
  const handlePageChange = useCallback((newPagination: PaginationParams) => {
    setPagination(newPagination);
  }, []);

  // Implement export functionality to download audit logs as CSV
  const handleExport = useCallback(() => {
    if (data && data.items) {
      exportAuditLogs(data.items);
    } else {
      toast.warning('No audit logs to export.');
    }
  }, [data, toast]);

  // Implement refresh functionality to manually reload data
  const handleRefresh = useCallback(() => {
    reset();
    execute();
  }, [execute, reset]);

  return (
    <Card title="Audit Log" sx={sx}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FilterPanel filters={filterConfigs} onFilterChange={handleFilterChange} loading={loading} />
        <Box>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExport} aria-label="Export to CSV">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} aria-label="Refresh">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {loading && <Typography>Loading audit logs...</Typography>}
      {error && <Typography color="error">Error: {error.message}</Typography>}
      {data && data.items && (
        <DataTable
          columns={columns}
          data={data.items}
          loading={loading}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize }}
          totalItems={data.totalItems}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
        />
      )}
    </Card>
  );
};

export default AuditLogViewer;