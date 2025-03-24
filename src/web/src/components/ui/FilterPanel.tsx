import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Slider,
  Typography,
  IconButton,
  Collapse,
  Paper,
  Button,
  SxProps,
  Theme
} from '@mui/material'; // v5.13.0
import { ExpandMore, ExpandLess, FilterList } from '@mui/icons-material'; // v5.13.0

import { FilterConfig, FilterType, FilterOption } from '../../types/ui.types';
import DateRangePicker from './DateRangePicker';
import SearchInput from './SearchInput';
import useFilter from '../../hooks/useFilter';

/**
 * A reusable component that provides a consistent filtering interface across the application.
 * It renders a configurable set of filter controls based on provided filter configurations,
 * supporting various filter types such as text, select, multi-select, date, date range, number, and boolean.
 */
const FilterPanel = ({
  filters,
  onFilterChange,
  initialValues = {},
  collapsible = false,
  loading = false,
  sx = {}
}) => {
  // State for collapsible behavior
  const [expanded, setExpanded] = useState(!collapsible);

  // Use the custom filter hook to manage filter state
  const {
    filters: filterValues,
    setFilter,
    clearAllFilters,
    applyFilters
  } = useFilter({
    filterConfigs: filters,
    initialFilters: initialValues,
    onFilterChange
  });

  // Handle expand/collapse toggle
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  /**
   * Renders the appropriate filter control based on filter configuration
   * 
   * @param filter - The filter configuration
   * @param values - Current filter values
   * @param onChange - Function to call when filter value changes
   * @param disabled - Whether the control should be disabled
   * @returns The rendered filter control component
   */
  const renderFilterControl = (
    filter: FilterConfig,
    values: Record<string, any>,
    onChange: (key: string, value: any) => void,
    disabled: boolean
  ): JSX.Element | null => {
    const value = values[filter.id] !== undefined ? values[filter.id] : filter.defaultValue;
    
    switch (filter.type) {
      case FilterType.TEXT:
        return (
          <SearchInput
            placeholder={filter.placeholder || `Search by ${filter.label}`}
            value={value || ''}
            onChange={(newValue) => onChange(filter.id, newValue)}
            onSearch={(newValue) => onChange(filter.id, newValue)}
            debounceMs={300}
            loading={loading}
            sx={{ width: '100%' }}
          />
        );
        
      case FilterType.SELECT:
        return (
          <FormControl fullWidth variant="outlined" size="small" disabled={disabled}>
            <InputLabel id={`filter-${filter.id}-label`}>{filter.label}</InputLabel>
            <Select
              labelId={`filter-${filter.id}-label`}
              id={`filter-${filter.id}`}
              value={value || ''}
              onChange={(e) => onChange(filter.id, e.target.value)}
              label={filter.label}
            >
              <MenuItem value="">All</MenuItem>
              {filter.options?.map((option) => (
                <MenuItem key={option.value.toString()} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case FilterType.MULTI_SELECT:
        return (
          <FormControl fullWidth variant="outlined" size="small" disabled={disabled}>
            <InputLabel id={`filter-${filter.id}-label`}>{filter.label}</InputLabel>
            <Select
              labelId={`filter-${filter.id}-label`}
              id={`filter-${filter.id}`}
              multiple
              value={value || []}
              onChange={(e) => onChange(filter.id, e.target.value)}
              label={filter.label}
              renderValue={(selected) => {
                if (Array.isArray(selected) && selected.length > 0) {
                  const selectedLabels = selected.map((val) => {
                    const option = filter.options?.find(opt => opt.value === val);
                    return option ? option.label : val;
                  });
                  return selectedLabels.join(', ');
                }
                return 'All';
              }}
            >
              {filter.options?.map((option) => (
                <MenuItem key={option.value.toString()} value={option.value}>
                  <Checkbox checked={Array.isArray(value) && value.indexOf(option.value) > -1} />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case FilterType.DATE:
        return (
          <TextField
            fullWidth
            label={filter.label}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(filter.id, e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            size="small"
            disabled={disabled}
          />
        );
        
      case FilterType.DATE_RANGE:
        return (
          <DateRangePicker
            startDate={value?.startDate || null}
            endDate={value?.endDate || null}
            onChange={(startDate, endDate) => 
              onChange(filter.id, { startDate, endDate })
            }
            disabled={disabled}
            sx={{ width: '100%' }}
          />
        );
        
      case FilterType.NUMBER:
        if (filter.min !== undefined && filter.max !== undefined) {
          return (
            <Box sx={{ width: '100%', px: 1 }}>
              <Typography variant="caption" gutterBottom>
                {filter.label}
              </Typography>
              <Slider
                value={value !== undefined ? value : filter.min}
                onChange={(_, newValue) => onChange(filter.id, newValue)}
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                marks
                valueLabelDisplay="auto"
                disabled={disabled}
              />
            </Box>
          );
        } else {
          return (
            <TextField
              fullWidth
              label={filter.label}
              type="number"
              value={value || ''}
              onChange={(e) => onChange(filter.id, e.target.value ? Number(e.target.value) : '')}
              size="small"
              disabled={disabled}
              InputProps={{
                inputProps: {
                  min: filter.min,
                  max: filter.max,
                  step: filter.step || 1
                }
              }}
            />
          );
        }
        
      case FilterType.BOOLEAN:
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => onChange(filter.id, e.target.checked)}
                disabled={disabled}
              />
            }
            label={filter.label}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ 
        p: 2, 
        mb: 2, 
        ...sx 
      }}
    >
      {collapsible && (
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={expanded ? 2 : 0}
          onClick={handleToggleExpand}
          sx={{ cursor: 'pointer' }}
        >
          <Box display="flex" alignItems="center">
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Filters</Typography>
          </Box>
          <IconButton size="small" aria-label={expanded ? "Collapse filters" : "Expand filters"}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      )}
      
      <Collapse in={expanded} timeout="auto">
        <Grid container spacing={2}>
          {filters.map((filter) => (
            <Grid 
              item 
              key={filter.id} 
              xs={12} 
              sm={filter.width ? 'auto' : 6} 
              md={filter.width ? 'auto' : 4} 
              lg={filter.width ? 'auto' : 3}
              sx={{ width: filter.width }}
            >
              {renderFilterControl(filter, filterValues, setFilter, loading)}
            </Grid>
          ))}
        </Grid>
        
        {expanded && filters.length > 0 && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="text" 
              onClick={clearAllFilters} 
              disabled={loading}
              sx={{ mr: 1 }}
              aria-label="Clear all filters"
            >
              Clear All
            </Button>
            <Button 
              variant="contained" 
              onClick={applyFilters} 
              disabled={loading}
              color="primary"
              aria-label="Apply filters"
            >
              Apply
            </Button>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default FilterPanel;