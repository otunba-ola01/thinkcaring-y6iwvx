import React from 'react'; // v18.2.0
import { render, fireEvent } from '@testing-library/react'; // v13.4.0
import userEvent from '@testing-library/user-event'; // v14.4.3
import { vi } from 'vitest'; // v0.32.0

import FilterPanel from '../../../../components/ui/FilterPanel';
import { FilterType } from '../../../../types/ui.types';
import { renderWithProviders, screen, waitFor } from '../../../utils/test-utils';

/**
 * Creates test filter configurations and mock functions for testing
 */
const setup = () => {
  // Create mock filter configurations for different filter types
  const testFilters = [
    { id: 'textFilter', label: 'Text Filter', type: FilterType.TEXT, field: 'textField', operator: 'contains' },
    { id: 'selectFilter', label: 'Select Filter', type: FilterType.SELECT, field: 'selectField', operator: 'eq', options: [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }] },
    { id: 'multiSelectFilter', label: 'Multi-Select Filter', type: FilterType.MULTI_SELECT, field: 'multiSelectField', operator: 'in', options: [{ value: 'value1', label: 'Value 1' }, { value: 'value2', label: 'Value 2' }] },
    { id: 'dateFilter', label: 'Date Filter', type: FilterType.DATE, field: 'dateField', operator: 'eq' },
    { id: 'dateRangeFilter', label: 'Date Range Filter', type: FilterType.DATE_RANGE, field: 'dateRangeField', operator: 'between' },
    { id: 'numberFilter', label: 'Number Filter', type: FilterType.NUMBER, field: 'numberField', operator: 'eq', min: 0, max: 100 },
    { id: 'booleanFilter', label: 'Boolean Filter', type: FilterType.BOOLEAN, field: 'booleanField', operator: 'eq' },
  ];

  // Create mock onFilterChange function using vi.fn()
  const onFilterChange = vi.fn();

  // Return the test setup object
  return { testFilters, onFilterChange };
};

describe('FilterPanel', () => {
  it('renders correctly with all filter types', () => {
    // Set up test filters with all filter types
    const { testFilters } = setup();

    // Render the FilterPanel component with the test filters
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={() => { }} />);

    // Verify that all filter labels are displayed
    testFilters.forEach(filter => {
      expect(screen.getByText(filter.label)).toBeInTheDocument();
    });

    // Verify that the correct filter controls are rendered for each filter type
    expect(screen.getByPlaceholderText('Search by Text Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Multi-Select Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Range Filter')).toBeInTheDocument();
    expect(screen.getByText('Number Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Boolean Filter')).toBeInTheDocument();
  });

  it('handles text filter input correctly', async () => {
    // Set up test filters including a TEXT type filter
    const { testFilters, onFilterChange } = setup();
    const textFilter = testFilters.find(filter => filter.type === FilterType.TEXT);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find the text input field
    const inputElement = screen.getByPlaceholderText('Search by Text Filter');

    // Type a search term into the field
    await userEvent.type(inputElement, 'search term');

    // Verify that onFilterChange was called with the correct value
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          textFilter: 'search term'
        })
      );
    });
  });

  it('handles select filter changes correctly', async () => {
    // Set up test filters including a SELECT type filter
    const { testFilters, onFilterChange } = setup();
    const selectFilter = testFilters.find(filter => filter.type === FilterType.SELECT);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find and click the select dropdown
    const selectElement = screen.getByLabelText('Select Filter');
    fireEvent.mouseDown(selectElement);

    // Select an option from the dropdown
    const optionElement = screen.getByText('Option 1');
    fireEvent.click(optionElement);

    // Verify that onFilterChange was called with the correct value
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectFilter: 'option1'
        })
      );
    });
  });

  it('handles multi-select filter changes correctly', async () => {
    // Set up test filters including a MULTI_SELECT type filter
    const { testFilters, onFilterChange } = setup();
    const multiSelectFilter = testFilters.find(filter => filter.type === FilterType.MULTI_SELECT);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find and click the multi-select dropdown
    const multiSelectElement = screen.getByLabelText('Multi-Select Filter');
    fireEvent.mouseDown(multiSelectElement);

    // Select multiple options from the dropdown
    const option1Element = screen.getByText('Value 1');
    fireEvent.click(option1Element);
    const option2Element = screen.getByText('Value 2');
    fireEvent.click(option2Element);

    // Verify that onFilterChange was called with the correct values
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          multiSelectFilter: ['value1', 'value2']
        })
      );
    });
  });

  it('handles date filter changes correctly', async () => {
    // Set up test filters including a DATE type filter
    const { testFilters, onFilterChange } = setup();
    const dateFilter = testFilters.find(filter => filter.type === FilterType.DATE);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find the date input field
    const dateInput = screen.getByLabelText('Date Filter');

    // Enter a date value
    fireEvent.change(dateInput, { target: { value: '2023-08-15' } });

    // Verify that onFilterChange was called with the correct date value
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFilter: '2023-08-15'
        })
      );
    });
  });

  it('handles date range filter changes correctly', async () => {
    // Set up test filters including a DATE_RANGE type filter
    const { testFilters, onFilterChange } = setup();
    const dateRangeFilter = testFilters.find(filter => filter.type === FilterType.DATE_RANGE);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find the date range picker component
    const dateRangeInput = screen.getByPlaceholderText('Select date range');
    fireEvent.click(dateRangeInput);

    // Select start and end dates
    const startDate = new Date('2023-08-01');
    const endDate = new Date('2023-08-15');
    fireEvent.click(screen.getByRole('button', { name: startDate.getDate().toString() }));
    fireEvent.click(screen.getByRole('button', { name: endDate.getDate().toString() }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // Verify that onFilterChange was called with the correct date range
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRangeFilter: {
            startDate: '2023-08-01',
            endDate: '2023-08-15'
          }
        })
      );
    });
  });

  it('handles number filter changes correctly', async () => {
    // Set up test filters including a NUMBER type filter
    const { testFilters, onFilterChange } = setup();
    const numberFilter = testFilters.find(filter => filter.type === FilterType.NUMBER);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find the number input field or slider
    const slider = screen.getByRole('slider');

    // Change the number value
    fireEvent.change(slider, { target: { value: 50 } });

    // Verify that onFilterChange was called with the correct number value
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          numberFilter: 50
        })
      );
    });
  });

  it('handles boolean filter changes correctly', async () => {
    // Set up test filters including a BOOLEAN type filter
    const { testFilters, onFilterChange } = setup();
    const booleanFilter = testFilters.find(filter => filter.type === FilterType.BOOLEAN);

    // Render the FilterPanel component
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={onFilterChange} />);

    // Find the checkbox
    const checkbox = screen.getByLabelText('Boolean Filter');

    // Click the checkbox to toggle its state
    fireEvent.click(checkbox);

    // Verify that onFilterChange was called with the correct boolean value
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          booleanFilter: true
        })
      );
    });
  });

  it('applies initial filter values correctly', () => {
    // Set up test filters with various types
    const { testFilters } = setup();

    // Create initial values object with values for each filter
    const initialValues = {
      textFilter: 'initial text',
      selectFilter: 'option2',
      multiSelectFilter: ['value1'],
      dateFilter: '2023-08-01',
      dateRangeFilter: { startDate: '2023-07-01', endDate: '2023-07-15' },
      numberFilter: 75,
      booleanFilter: true
    };

    // Render the FilterPanel with the initial values
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={() => { }} initialValues={initialValues} />);

    // Verify that each filter control displays the correct initial value
    expect(screen.getByPlaceholderText('Search by Text Filter')).toHaveValue('initial text');
    expect(screen.getByLabelText('Select Filter')).toHaveValue('option2');
    expect(screen.getByLabelText('Multi-Select Filter')).toHaveValue('value1');
    expect(screen.getByLabelText('Date Filter')).toHaveValue('2023-08-01');
  });

  it('expands and collapses when collapsible is true', async () => {
    // Set up test filters
    const { testFilters } = setup();

    // Render the FilterPanel with collapsible set to true
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={() => { }} collapsible={true} />);

    // Verify that the panel is initially collapsed
    expect(screen.queryByPlaceholderText('Search by Text Filter')).not.toBeInTheDocument();

    // Click the expand button
    const expandButton = screen.getByRole('button', { name: 'Expand filters' });
    await userEvent.click(expandButton);

    // Verify that the panel expands and shows filter controls
    expect(screen.getByPlaceholderText('Search by Text Filter')).toBeInTheDocument();

    // Click the collapse button
    const collapseButton = screen.getByRole('button', { name: 'Collapse filters' });
    await userEvent.click(collapseButton);

    // Verify that the panel collapses again
    expect(screen.queryByPlaceholderText('Search by Text Filter')).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    // Set up test filters
    const { testFilters } = setup();

    // Render the FilterPanel with loading set to true
    renderWithProviders(<FilterPanel filters={testFilters} onFilterChange={() => { }} loading={true} />);

    // Verify that loading indicators are displayed for filter controls
    expect(screen.getByPlaceholderText('Search by Text Filter')).toBeDisabled();
    expect(screen.getByLabelText('Select Filter')).toBeDisabled();
    expect(screen.getByLabelText('Multi-Select Filter')).toBeDisabled();
    expect(screen.getByLabelText('Date Filter')).toBeDisabled();
  });
});