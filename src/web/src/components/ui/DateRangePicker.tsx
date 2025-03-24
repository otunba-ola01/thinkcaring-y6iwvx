import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Popover,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  SelectChangeEvent
} from '@mui/material'; // v5.13.0
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'; // v6.0.0
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // v6.0.0
import { CalendarMonth, ArrowDropDown } from '@mui/icons-material'; // v5.13.0

import { DateRangePickerProps } from '../../types/ui.types';
import { ISO8601Date } from '../../types/common.types';
import { formatDate, parseDate, isValidDate, getDateRangeForPeriod } from '../../utils/date';
import { DATE_RANGE_PRESETS, DISPLAY_DATE_FORMAT } from '../../config/date.config';

/**
 * A component that allows users to select a date range with start and end dates
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  presets = DATE_RANGE_PRESETS,
  minDate,
  maxDate,
  disabled = false,
  sx
}) => {
  // State for the popover
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  // Local state for start and end dates
  const [localStartDate, setLocalStartDate] = useState<Date | null>(
    startDate ? parseDate(startDate) : null
  );
  const [localEndDate, setLocalEndDate] = useState<Date | null>(
    endDate ? parseDate(endDate) : null
  );
  
  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(startDate ? parseDate(startDate) : null);
    setLocalEndDate(endDate ? parseDate(endDate) : null);
    
    // Determine if current dates match a preset
    if (startDate && endDate) {
      const startDateObj = parseDate(startDate);
      const endDateObj = parseDate(endDate);
      
      if (startDateObj && endDateObj) {
        // Check if the current date range matches any preset
        const matchingPreset = presets.find(preset => {
          if (preset.value === 'custom') return false;
          
          if (preset.range?.startDate && preset.range?.endDate) {
            // Use the preset's pre-calculated range
            const presetStartDate = parseDate(preset.range.startDate);
            const presetEndDate = parseDate(preset.range.endDate);
            
            return presetStartDate && presetEndDate && 
                   isSameDay(startDateObj, presetStartDate) && 
                   isSameDay(endDateObj, presetEndDate);
          } else {
            // Calculate range based on preset value
            const range = getDateRangeForPeriod(preset.value);
            return isSameDay(startDateObj, range.startDate) && 
                   isSameDay(endDateObj, range.endDate);
          }
        });
        
        setSelectedPreset(matchingPreset?.value || 'custom');
      }
    }
  }, [startDate, endDate, presets]);

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Handle opening the popover
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  // Handle closing the popover
  const handleClose = () => {
    // Reset local state to match props when closing without applying
    setLocalStartDate(startDate ? parseDate(startDate) : null);
    setLocalEndDate(endDate ? parseDate(endDate) : null);
    setAnchorEl(null);
  };

  // Handle applying the selected date range
  const handleApply = () => {
    // Format dates as ISO strings for the onChange callback
    const formattedStartDate = localStartDate 
      ? formatDate(localStartDate, 'yyyy-MM-dd') as ISO8601Date 
      : null;
    
    const formattedEndDate = localEndDate 
      ? formatDate(localEndDate, 'yyyy-MM-dd') as ISO8601Date 
      : null;
    
    onChange(formattedStartDate, formattedEndDate);
    setAnchorEl(null);
  };

  // Handle selecting a preset
  const handlePresetChange = (event: SelectChangeEvent<string>) => {
    const presetValue = event.target.value;
    setSelectedPreset(presetValue);
    
    if (presetValue !== 'custom') {
      // Find the selected preset
      const selectedPreset = presets.find(preset => preset.value === presetValue);
      
      if (selectedPreset?.range?.startDate && selectedPreset?.range?.endDate) {
        // Use the preset's pre-calculated date range
        setLocalStartDate(parseDate(selectedPreset.range.startDate));
        setLocalEndDate(parseDate(selectedPreset.range.endDate));
      } else {
        // Calculate range based on preset value
        const range = getDateRangeForPeriod(presetValue);
        setLocalStartDate(range.startDate);
        setLocalEndDate(range.endDate);
      }
    }
  };

  // Handle start date changes
  const handleStartDateChange = (date: Date | null) => {
    setLocalStartDate(date);
    setSelectedPreset('custom');
    
    // If start date is after end date, update end date
    if (date && localEndDate && date > localEndDate) {
      setLocalEndDate(date);
    }
  };

  // Handle end date changes
  const handleEndDateChange = (date: Date | null) => {
    setLocalEndDate(date);
    setSelectedPreset('custom');
    
    // If end date is before start date, update start date
    if (date && localStartDate && date < localStartDate) {
      setLocalStartDate(date);
    }
  };

  // Format the display value for the TextField
  const getDisplayValue = useCallback(() => {
    if (!startDate && !endDate) {
      return '';
    }
    
    if (startDate && endDate) {
      const formattedStart = formatDate(startDate, DISPLAY_DATE_FORMAT);
      const formattedEnd = formatDate(endDate, DISPLAY_DATE_FORMAT);
      
      if (formattedStart === formattedEnd) {
        return formattedStart;
      }
      
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    if (startDate) {
      return `${formatDate(startDate, DISPLAY_DATE_FORMAT)} - `;
    }
    
    if (endDate) {
      return ` - ${formatDate(endDate, DISPLAY_DATE_FORMAT)}`;
    }
    
    return '';
  }, [startDate, endDate]);

  // Check if the popover is open
  const open = Boolean(anchorEl);
  const id = open ? 'date-range-picker-popover' : undefined;

  // Determine if Apply button should be disabled
  const isApplyDisabled = () => {
    if (!localStartDate && !localEndDate) {
      // Allow clearing both dates
      return false;
    }
    
    // Require both dates to be set
    if (!localStartDate || !localEndDate) {
      return true;
    }
    
    // Ensure start date is not after end date
    return localStartDate > localEndDate;
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <TextField
        fullWidth
        value={getDisplayValue()}
        placeholder="Select date range"
        InputProps={{
          readOnly: true,
          startAdornment: <CalendarMonth color="action" sx={{ mr: 1 }} />,
          endAdornment: <ArrowDropDown color="action" />,
        }}
        onClick={handleOpen}
        disabled={disabled}
        aria-describedby={id}
        aria-label="Date range selector"
        sx={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: '500px', p: 2 }
        }}
      >
        <Grid container spacing={2}>
          {/* Preset selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="date-range-preset-label">Preset</InputLabel>
              <Select
                labelId="date-range-preset-label"
                value={selectedPreset}
                onChange={handlePresetChange}
                label="Preset"
              >
                {presets.map((preset) => (
                  <MenuItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Date pickers */}
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={localStartDate}
                onChange={handleStartDateChange}
                minDate={minDate ? parseDate(minDate) : undefined}
                maxDate={maxDate ? parseDate(maxDate) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: localStartDate && localEndDate ? localStartDate > localEndDate : false,
                    helperText: localStartDate && localEndDate && localStartDate > localEndDate 
                      ? 'Start date cannot be after end date' 
                      : ''
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={localEndDate}
                onChange={handleEndDateChange}
                minDate={localStartDate || (minDate ? parseDate(minDate) : undefined)}
                maxDate={maxDate ? parseDate(maxDate) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: localStartDate && localEndDate ? localEndDate < localStartDate : false,
                    helperText: localStartDate && localEndDate && localEndDate < localStartDate 
                      ? 'End date cannot be before start date' 
                      : ''
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Action buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handleClose} 
              sx={{ mr: 1 }}
              aria-label="Cancel date selection"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleApply} 
              disabled={isApplyDisabled()}
              aria-label="Apply selected date range"
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Popover>
    </Box>
  );
};

export default DateRangePicker;