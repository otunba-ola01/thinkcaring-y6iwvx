import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react v18.2.0
import { Box, Typography, Tooltip, IconButton, Stack } from '@mui/material'; // v5.13.0
import { Visibility, Edit, Delete, PlayArrow, Schedule, Download } from '@mui/icons-material'; // v5.13.0
import { format as formatDate } from 'date-fns'; // v2.30.0

import { DataTable, TableColumn } from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import ActionButton from '../ui/ActionButton';
import EmptyState from '../ui/EmptyState';
import useReports from '../../hooks/useReports';
import { 
  ReportDefinition, 
  ReportInstance, 
  ScheduledReport, 
  ReportStatus, 
  ReportType,
  ReportCategory 
} from '../../types/reports.types';
import { ReportListProps } from '../../types/ui.types';

/**
 * A component that displays a paginated list of reports with filtering, sorting, and action capabilities
 * @param props - The component props
 * @returns The rendered ReportList component
 */
const ReportList: React.FC<ReportListProps> = (props) => {
  // Destructure props to extract listType, reportType, category, onView, onEdit, onDelete, onExecute, onSchedule, onExport, and sx
  const { 
    listType, 
    reportType, 
    category, 
    onView, 
    onEdit, 
    onDelete, 
    onExecute, 
    onSchedule, 
    onExport, 
    sx 
  } = props;

  // Initialize the useReports hook with appropriate options
  const { 
    reportDefinitions,
    reportInstances,
    scheduledReports,
    isLoading,
    getReportInstances,
    deleteReportInstance,
    getScheduledReports,
    deleteScheduledReport,
    executeScheduledReport,
    exportReport
  } = useReports({ autoFetch: false, reportType });

  // Set up state for pagination, sorting, and filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Define getReportData function to fetch the appropriate report data based on listType
  const getReportData = useCallback(() => {
    if (listType === 'definitions') {
      return reportDefinitions;
    } else if (listType === 'instances') {
      return reportInstances.items;
    } else if (listType === 'scheduled') {
      return scheduledReports;
    }
    return [];
  }, [listType, reportDefinitions, reportInstances, scheduledReports]);

  // Define handleView, handleEdit, handleDelete, handleExecute, and handleExport functions
  const handleView = (id: string) => {
    if (onView) {
      onView(id);
    }
  };

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      if (listType === 'instances') {
        await deleteReportInstance(id);
      } else if (listType === 'scheduled') {
        await deleteScheduledReport(id);
      }
      onDelete(id);
    }
  };

  const handleExecute = async (id: string) => {
    if (onExecute) {
      await executeScheduledReport(id);
      onExecute(id);
    }
  };

  const handleSchedule = (id: string) => {
    if (onSchedule) {
      onSchedule(id);
    }
  };

  const handleExport = async (id: string, format: string) => {
    if (onExport) {
      await exportReport(id, format);
      onExport(id, format);
    }
  };

  // Define getColumns function to create appropriate table columns based on listType
  const getColumns = useCallback((): TableColumn[] => {
    const handlers = {
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onExecute: handleExecute,
      onSchedule: handleSchedule,
      onExport: handleExport
    };

    if (listType === 'definitions') {
      return getDefinitionColumns(handlers);
    } else if (listType === 'instances') {
      return getInstanceColumns(handlers);
    } else if (listType === 'scheduled') {
      return getScheduledColumns(handlers);
    }
    return [];
  }, [handleView, handleEdit, handleDelete, handleExecute, handleSchedule, handleExport, listType]);

  // Use useEffect to fetch report data when component mounts or dependencies change
  useEffect(() => {
    if (listType === 'instances') {
      getReportInstances({ page, pageSize, reportType, category });
    } else if (listType === 'scheduled') {
      getScheduledReports();
    }
  }, [listType, page, pageSize, reportType, category, getReportInstances, getScheduledReports]);

  // Use useMemo to create and memoize the table columns
  const columns = useMemo(() => getColumns(), [getColumns]);

  // Render a Box container with the DataTable component
  return (
    <Box sx={{ height: 400, width: '100%', ...sx }}>
      {getReportData() && getReportData().length > 0 ? (
        <DataTable
          columns={columns}
          data={getReportData()}
          loading={isLoading}
        />
      ) : (
        <EmptyState title="No Reports Found" description="There are no reports available." />
      )}
    </Box>
  );
};

/**
 * Creates table columns for report definitions
 * @param handlers - Object containing handler functions for actions
 * @returns Array of column definitions for report definitions
 */
const getDefinitionColumns = (handlers: any): TableColumn[] => [
  { field: 'name', headerName: 'Report Name', width: 250, sortable: true, filterable: true },
  { field: 'description', headerName: 'Description', width: 300 },
  { field: 'type', headerName: 'Type', width: 150, sortable: true, renderCell: (params) => formatReportType(params.row.type) },
  { field: 'category', headerName: 'Category', width: 150, sortable: true, renderCell: (params) => formatReportCategory(params.row.category) },
  { field: 'createdAt', headerName: 'Created Date', width: 150, sortable: true, type: 'date' },
  { field: 'actions', headerName: 'Actions', width: 200, sortable: false, 
    renderCell: (params) => renderActions(params.row, handlers, 'definitions') }
];

/**
 * Creates table columns for report instances
 * @param handlers - Object containing handler functions for actions
 * @returns Array of column definitions for report instances
 */
const getInstanceColumns = (handlers: any): TableColumn[] => [
  { field: 'name', headerName: 'Report Name', width: 250, sortable: true, filterable: true },
  { field: 'type', headerName: 'Type', width: 150, sortable: true, renderCell: (params) => formatReportType(params.row.type) },
  { field: 'status', headerName: 'Status', width: 120, sortable: true, type: 'status' },
  { field: 'generatedAt', headerName: 'Generated Date', width: 150, sortable: true, type: 'date' },
  { field: 'expiresAt', headerName: 'Expires Date', width: 150, sortable: true, type: 'date' },
  { field: 'actions', headerName: 'Actions', width: 150, sortable: false, 
    renderCell: (params) => renderActions(params.row, handlers, 'instances') }
];

/**
 * Creates table columns for scheduled reports
 * @param handlers - Object containing handler functions for actions
 * @returns Array of column definitions for scheduled reports
 */
const getScheduledColumns = (handlers: any): TableColumn[] => [
  { field: 'name', headerName: 'Report Name', width: 250, sortable: true, filterable: true },
  { field: 'type', headerName: 'Type', width: 150, sortable: true, renderCell: (params) => formatReportType(params.row.type) },
  { field: 'frequency', headerName: 'Frequency', width: 120, sortable: true, renderCell: (params) => formatScheduleFrequency(params.row.frequency) },
  { field: 'nextRunAt', headerName: 'Next Run', width: 150, sortable: true, type: 'date' },
  { field: 'lastRunAt', headerName: 'Last Run', width: 150, sortable: true, type: 'date' },
  { field: 'actions', headerName: 'Actions', width: 200, sortable: false, 
    renderCell: (params) => renderActions(params.row, handlers, 'scheduled') }
];

/**
 * Renders action buttons for a report row
 * @param row - The report data row
 * @param handlers - Object containing handler functions for actions
 * @param listType - The type of report list being displayed
 * @returns Stack of action buttons
 */
const renderActions = (row: any, handlers: any, listType: string): JSX.Element => {
  const { onView, onEdit, onDelete, onExecute, onSchedule, onExport } = handlers;

  return (
    <Stack direction="row" spacing={1}>
      {onView && (
        <ActionButton label="View" icon={<Visibility />} onClick={() => onView(row.id)} />
      )}
      {onEdit && (listType === 'definitions' || listType === 'scheduled') && (
        <ActionButton label="Edit" icon={<Edit />} onClick={() => onEdit(row.id)} />
      )}
      {onDelete && (
        <ActionButton label="Delete" icon={<Delete />} onClick={() => onDelete(row.id)} confirmText="Are you sure you want to delete this report?" />
      )}
      {onExecute && listType === 'scheduled' && (
        <ActionButton label="Execute" icon={<PlayArrow />} onClick={() => onExecute(row.id)} />
      )}
      {onSchedule && listType === 'definitions' && (
        <ActionButton label="Schedule" icon={<Schedule />} onClick={() => onSchedule(row.id)} />
      )}
      {onExport && (
        <ActionButton label="Export" icon={<Download />} onClick={() => onExport(row.id, 'pdf')} />
      )}
    </Stack>
  );
};

/**
 * Formats a report type enum value into a human-readable string
 * @param type - The report type enum value
 * @returns Human-readable report type
 */
const formatReportType = (type: ReportType): string => {
  const str = String(type);
  const replaced = str.replace(/_/g, ' ');
  return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

/**
 * Formats a report category enum value into a human-readable string
 * @param category - The report category enum value
 * @returns Human-readable report category
 */
const formatReportCategory = (category: ReportCategory): string => {
  const str = String(category);
  const replaced = str.replace(/_/g, ' ');
  return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

/**
 * Formats a schedule frequency enum value into a human-readable string
 * @param frequency - The schedule frequency enum value
 * @returns Human-readable schedule frequency
 */
const formatScheduleFrequency = (frequency: any): string => {
  if (!frequency) return '';
  const str = String(frequency);
  const replaced = str.replace(/_/g, ' ');
  return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

export default ReportList;