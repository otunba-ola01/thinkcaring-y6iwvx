import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, 
  Paper, Checkbox, Box, Typography, Card, CardContent, Skeleton, Tooltip, IconButton, useTheme 
} from '@mui/material'; // v5.13.0
import { FilterList, ArrowUpward, ArrowDownward } from '@mui/icons-material'; // v5.13.0
import { format as formatDate } from 'date-fns'; // v2.30.0
import { formatCurrency } from '../../utils/currency';

import { DataTableProps, TableColumn } from '../../types/ui.types';
import { SortDirection, FilterOperator, PaginationParams } from '../../types/common.types';
import StatusBadge from './StatusBadge';
import Pagination from './Pagination';
import useResponsive from '../../hooks/useResponsive';

/**
 * A reusable data table component that provides a consistent way to display tabular data
 * throughout the HCBS Revenue Management System. Supports sorting, filtering, pagination,
 * row selection, and customizable cell rendering.
 */
const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination,
  totalItems = 0,
  onPageChange,
  onSortChange,
  onFilterChange,
  onRowClick,
  selectable = false,
  onSelectionChange,
  sx
}) => {
  // State for sorting
  const [sortModel, setSortModel] = useState<{ field: string; direction: SortDirection }[]>([]);
  
  // State for filtering
  const [filterModel, setFilterModel] = useState<{ field: string; operator: FilterOperator; value: any }[]>([]);
  
  // State for row selection
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // State for mobile view details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Get responsive info
  const { isMobile, isTablet } = useResponsive();

  // Get theme
  const theme = useTheme();

  // Reset selected rows when data changes
  useEffect(() => {
    setSelectedRows([]);
  }, [data]);

  /**
   * Formats a cell value based on the column type
   * @param value The raw cell value
   * @param column The column configuration
   * @returns The formatted cell value as a React node
   */
  const formatCellValue = (value: any, column: TableColumn): React.ReactNode => {
    // Use custom renderer if provided
    if (column.renderCell) {
      return column.renderCell({ value, row: value });
    }
    
    // Use value formatter if provided
    if (column.valueFormatter) {
      return column.valueFormatter(value);
    }
    
    // If value is null or undefined, return empty string
    if (value === undefined || value === null) {
      return '';
    }
    
    // Default formatting based on column type
    switch (column.type) {
      case 'string':
        return value;
        
      case 'number':
        return typeof value === 'number' 
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
          : value;
        
      case 'date':
        try {
          return formatDate(new Date(value), 'MM/dd/yyyy');
        } catch (e) {
          return value;
        }
        
      case 'currency':
        return formatCurrency(value);
        
      case 'boolean':
        return value ? 'Yes' : 'No';
        
      case 'status':
        return column.statusType ? (
          <StatusBadge status={value} type={column.statusType} />
        ) : value;
        
      case 'actions':
        return value;
        
      default:
        return String(value);
    }
  };

  /**
   * Handles sort change for a column
   * @param field The field to sort by
   */
  const handleSortChange = (field: string) => {
    const isAsc = sortModel[0]?.field === field && sortModel[0]?.direction === SortDirection.ASC;
    const newDirection = isAsc ? SortDirection.DESC : SortDirection.ASC;
    
    const newSortModel = [{ field, direction: newDirection }];
    setSortModel(newSortModel);
    
    if (onSortChange) {
      onSortChange(newSortModel);
    }
  };

  /**
   * Handles filter change for a column
   * @param field The field to filter by
   * @param operator The filter operator
   * @param value The filter value
   */
  const handleFilterChange = (field: string, operator: FilterOperator, value: any) => {
    const newFilterModel = [...filterModel];
    const existingFilterIndex = newFilterModel.findIndex(filter => filter.field === field);
    
    if (existingFilterIndex >= 0) {
      if (value === undefined || value === null || value === '') {
        newFilterModel.splice(existingFilterIndex, 1);
      } else {
        newFilterModel[existingFilterIndex] = { field, operator, value };
      }
    } else if (value !== undefined && value !== null && value !== '') {
      newFilterModel.push({ field, operator, value });
    }
    
    setFilterModel(newFilterModel);
    
    if (onFilterChange) {
      onFilterChange(newFilterModel);
    }
  };

  /**
   * Handles selection of a row
   * @param row The row to select or deselect
   */
  const handleSelectRow = (row: any) => {
    const selectedIndex = selectedRows.findIndex(selectedRow => selectedRow === row);
    let newSelectedRows: any[] = [];
    
    if (selectedIndex === -1) {
      newSelectedRows = [...selectedRows, row];
    } else {
      newSelectedRows = selectedRows.filter(selectedRow => selectedRow !== row);
    }
    
    setSelectedRows(newSelectedRows);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  /**
   * Handles selection of all rows
   * @param event The checkbox change event
   */
  const handleSelectAllRows = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows([...data]);
      if (onSelectionChange) {
        onSelectionChange([...data]);
      }
    } else {
      setSelectedRows([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  /**
   * Renders a loading skeleton
   * @param isMobileView Whether to render a mobile or desktop skeleton
   * @returns The loading skeleton JSX
   */
  const renderLoadingSkeleton = (isMobileView: boolean) => {
    if (isMobileView) {
      return (
        <Box sx={{ width: '100%', mt: 1 }}>
          {[1, 2, 3].map((item) => (
            <Card key={item} sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Box sx={{ mt: 2 }}>
                  {[1, 2, 3].map((subItem) => (
                    <Box key={subItem} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} elevation={2} sx={{ width: '100%', overflow: 'hidden', ...sx }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={24} height={24} />
                </TableCell>
              )}
              {columns
                .filter(column => !column.hide && (!isTablet || column.field !== 'actions'))
                .map(column => (
                  <TableCell key={column.field}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Skeleton variant="rectangular" width={24} height={24} />
                  </TableCell>
                )}
                {columns
                  .filter(column => !column.hide && (!isTablet || column.field !== 'actions'))
                  .map(column => (
                    <TableCell key={column.field}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  /**
   * Renders a mobile-friendly stacked card view of the data
   * @param data The data to render
   * @param columns The column definitions
   * @param onRowClick Optional row click handler
   * @returns The mobile view JSX
   */
  const renderMobileView = (data: any[], columns: TableColumn[], onRowClick?: (row: any) => void) => {
    if (!data || data.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1">No data to display</Typography>
        </Box>
      );
    }

    // Find the primary column (usually the first non-hidden column)
    const primaryColumn = columns.find(col => !col.hide) || columns[0];

    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        {data.map((row, index) => (
          <Card 
            key={index} 
            sx={{ 
              mb: 2, 
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': {
                backgroundColor: onRowClick ? theme.palette.action.hover : 'inherit'
              }
            }}
            onClick={() => onRowClick && onRowClick(row)}
          >
            <CardContent>
              {/* Card header with primary column value */}
              <Typography variant="h6" component="div">
                {formatCellValue(row[primaryColumn.field], primaryColumn)}
              </Typography>
              
              {/* Card content with other visible columns */}
              <Box sx={{ mt: 2 }}>
                {columns
                  .filter(column => !column.hide && column.field !== primaryColumn.field && column.type !== 'actions')
                  .map(column => (
                    <Box key={column.field} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {column.headerName}:
                      </Typography>
                      <Typography variant="body2">
                        {formatCellValue(row[column.field], column)}
                      </Typography>
                    </Box>
                  ))}
              </Box>
              
              {/* Action buttons if any */}
              {columns.find(column => column.type === 'actions' && !column.hide) && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  {formatCellValue(
                    row[columns.find(column => column.type === 'actions' && !column.hide)!.field],
                    columns.find(column => column.type === 'actions' && !column.hide)!
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  /**
   * Renders a standard table view of the data
   * @param data The data to render
   * @param columns The column definitions
   * @param sortModel The current sort model
   * @param handleSortChange The sort change handler
   * @param selectable Whether rows are selectable
   * @param selectedRows The currently selected rows
   * @param handleSelectRow The row selection handler
   * @param handleSelectAllRows The select all rows handler
   * @param onRowClick Optional row click handler
   * @param isTablet Whether the viewport is a tablet
   * @returns The table view JSX
   */
  const renderTableView = (
    data: any[], 
    columns: TableColumn[], 
    sortModel: { field: string; direction: SortDirection }[],
    handleSortChange: (field: string) => void,
    selectable: boolean,
    selectedRows: any[],
    handleSelectRow: (row: any) => void,
    handleSelectAllRows: (event: React.ChangeEvent<HTMLInputElement>) => void,
    onRowClick?: (row: any) => void,
    isTablet = false
  ) => {
    if (!data || data.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No data to display</Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} elevation={2} sx={{ width: '100%', overflow: 'hidden', ...sx }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                    checked={data.length > 0 && selectedRows.length === data.length}
                    onChange={handleSelectAllRows}
                  />
                </TableCell>
              )}
              {columns
                .filter(column => !column.hide && (!isTablet || column.field !== 'actions'))
                .map(column => (
                  <TableCell 
                    key={column.field}
                    align={column.type === 'number' || column.type === 'currency' ? 'right' : 'left'}
                    sx={{ 
                      width: column.width,
                      minWidth: column.width,
                      maxWidth: column.width
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortModel[0]?.field === column.field}
                        direction={sortModel[0]?.field === column.field ? sortModel[0]?.direction.toLowerCase() as 'asc' | 'desc' : 'asc'}
                        onClick={() => handleSortChange(column.field)}
                        IconComponent={
                          sortModel[0]?.field === column.field && sortModel[0]?.direction === SortDirection.DESC 
                            ? ArrowDownward 
                            : ArrowUpward
                        }
                      >
                        {column.headerName}
                      </TableSortLabel>
                    ) : (
                      column.headerName
                    )}
                    {column.filterable && (
                      <Tooltip title="Filter">
                        <IconButton 
                          size="small" 
                          onClick={() => handleFilterChange(
                            column.field, 
                            FilterOperator.EQUALS, 
                            '' // Open filter dialog in the real implementation
                          )}
                        >
                          <FilterList fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                hover={!!onRowClick}
                onClick={() => onRowClick && onRowClick(row)}
                sx={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(row)}
                      onChange={(event) => {
                        event.stopPropagation();
                        handleSelectRow(row);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns
                  .filter(column => !column.hide && (!isTablet || column.field !== 'actions'))
                  .map(column => (
                    <TableCell 
                      key={column.field}
                      align={column.type === 'number' || column.type === 'currency' ? 'right' : 'left'}
                    >
                      {formatCellValue(row[column.field], column)}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Main content: skeleton, mobile view, or table view */}
      {loading ? (
        renderLoadingSkeleton(isMobile)
      ) : isMobile ? (
        renderMobileView(data, columns, onRowClick)
      ) : (
        renderTableView(
          data, 
          columns, 
          sortModel, 
          handleSortChange, 
          selectable, 
          selectedRows, 
          handleSelectRow, 
          handleSelectAllRows, 
          onRowClick,
          isTablet
        )
      )}
      
      {/* Pagination controls (if pagination is enabled) */}
      {pagination && onPageChange && totalItems > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={(pageSize) => {
            if (pagination && onPageChange) {
              onPageChange({
                ...pagination,
                pageSize,
                page: 1 // Reset to first page when changing page size
              });
            }
          }}
        />
      )}
    </Box>
  );
};

export default DataTable;