import React, { useState, useEffect, useRef, useCallback } from 'react'; // v18.2.0
import { TextField, InputAdornment, IconButton, Popper, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material'; // v5.13.0
import { Search, Clear } from '@mui/icons-material'; // v5.13.0
import { SearchInputProps } from '../../types/ui.types';
import { isEmpty } from '../../utils/string';

/**
 * Custom hook to debounce a value with a specified delay
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value or delay changes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * A search input component with debounce functionality and autocomplete suggestions
 * Provides a standardized search experience across the HCBS Revenue Management System
 */
export default function SearchInput({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  suggestions = [],
  loading = false,
  debounceMs = 300,
  sx = {}
}: SearchInputProps): JSX.Element {
  // State for managing the input value and focus state
  const [inputValue, setInputValue] = useState<string>(value);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  
  // Create a ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Create debounced search value
  const debouncedSearchValue = useDebounce<string>(inputValue, debounceMs);

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== value) {
      onSearch(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearch, value]);

  // Update local input value when the prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue('');
    onChange('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    onSearch(suggestion);
    setIsFocused(false);
  };

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // If there are no suggestions or they're not showing, do nothing
    if (!suggestions.length || !isFocused) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex > 0 ? prevIndex - 1 : -1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onSearch(inputValue);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsFocused(false);
        break;
      default:
        break;
    }
  };

  // Determine if suggestions should be shown
  const showSuggestions = isFocused && suggestions.length > 0 && !isEmpty(inputValue);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        aria-label="Search"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
          },
          ...sx,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                !isEmpty(inputValue) && (
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClear}
                    edge="end"
                    size="small"
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                )
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Popper
          open={true}
          anchorEl={inputRef.current}
          placement="bottom-start"
          style={{
            width: inputRef.current?.clientWidth,
            zIndex: 1300,
          }}
        >
          <Paper elevation={3}>
            <List dense>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  button
                  selected={index === selectedIndex}
                  onClick={() => handleSuggestionClick(suggestion)}
                  dense
                >
                  <ListItemText 
                    primary={suggestion}
                    primaryTypographyProps={{
                      noWrap: true,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Popper>
      )}
    </div>
  );
}