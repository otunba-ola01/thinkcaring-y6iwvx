import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Pagination as MuiPagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import { PaginationProps } from '../../types/ui.types';
import { PAGINATION_OPTIONS } from '../../constants/ui.constants';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * A reusable pagination component that provides a consistent way to navigate
 * through paginated data throughout the HCBS Revenue Management System.
 * Supports page navigation, page size selection, and displays information
 * about the current page and total items.
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = PAGINATION_OPTIONS,
  onPageChange,
  onPageSizeChange,
  sx
}) => {
  const { isMobile } = useResponsive();

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Calculate current range of items being displayed
  const itemRange = useMemo(() => {
    if (totalItems === 0) {
      return { start: 0, end: 0 };
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return { start, end };
  }, [page, pageSize, totalItems]);

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  // Handle page size change
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(Number(event.target.value));
  };

  // Don't render pagination if there are no items
  if (totalItems === 0) {
    return null;
  }

  // Render mobile version
  if (isMobile) {
    return (
      <Box sx={{ width: '100%', py: 2, ...sx }}>
        <Stack spacing={1} alignItems="center">
          <MuiPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            shape="rounded"
            size="small"
            siblingCount={0}
            boundaryCount={1}
            color="primary"
          />
          
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <FormControl size="small" variant="outlined" sx={{ minWidth: 100 }}>
              <Select
                id="pagination-size-select-mobile"
                value={pageSize}
                onChange={handlePageSizeChange}
                displayEmpty
                size="small"
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option} per page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Box>
    );
  }

  // Render desktop version
  return (
    <Box sx={{ width: '100%', py: 2, ...sx }}>
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={2}
        justifyContent="space-between"
      >
        {/* Page size selector */}
        <Box sx={{ minWidth: 120 }}>
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <FormControl size="small" variant="outlined" fullWidth>
              <InputLabel id="pagination-size-select-label">Per Page</InputLabel>
              <Select
                labelId="pagination-size-select-label"
                id="pagination-size-select"
                value={pageSize}
                onChange={handlePageSizeChange}
                label="Per Page"
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Pagination controls */}
        <MuiPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          shape="rounded"
          size="medium"
          showFirstButton
          showLastButton
          color="primary"
          siblingCount={1}
          boundaryCount={1}
        />

        {/* Items count information */}
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, textAlign: 'right' }}>
          Showing {itemRange.start}-{itemRange.end} of {totalItems} items
        </Typography>
      </Stack>
    </Box>
  );
};

export default Pagination;