import React from 'react'; // v18.2.0
import { act } from 'react-dom/test-utils'; // v18.2.0

import DataTable from '../../../../components/ui/DataTable'; // Import the DataTable component to be tested
import { TableColumn } from '../../../../types/ui.types'; // Import the TableColumn interface for defining test data
import { SortDirection, FilterOperator, PaginationParams } from '../../../../types/common.types'; // Import common types for sorting, filtering, and pagination
import { renderWithProviders, screen, waitFor, userEvent } from '../../../utils/test-utils'; // Import testing utilities for rendering components and simulating user interactions

/**
 * Sets up the test data and columns for the DataTable tests
 * @returns Returns an object containing test data, columns, and mock functions
 */
const setup = () => {
  // Create mock data array with test records
  const mockData = [
    { id: '1', name: 'John Smith', age: 35, status: 'active', dateJoined: '2023-01-15', balance: 1250.75 },
    { id: '2', name: 'Jane Doe', age: 28, status: 'inactive', dateJoined: '2022-11-03', balance: 875.50 },
    { id: '3', name: 'Bob Johnson', age: 42, status: 'pending', dateJoined: '2023-03-22', balance: 2340.00 },
  ];

  // Define column configurations for the DataTable
  const mockColumns: TableColumn[] = [
    { field: 'id', headerName: 'ID', width: 100, sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { field: 'age', headerName: 'Age', width: 100, type: 'number', sortable: true },
    { field: 'status', headerName: 'Status', width: 150, type: 'status', statusType: 'documentation', sortable: true },
    { field: 'dateJoined', headerName: 'Date Joined', width: 150, type: 'date', sortable: true },
    { field: 'balance', headerName: 'Balance', width: 150, type: 'currency', sortable: true },
  ];

  // Create mock callback functions for events
  const onSortChange = jest.fn();
  const onPageChange = jest.fn();
  const onSelectionChange = jest.fn();
  const onRowClick = jest.fn();

  // Return the test setup object
  return { mockData, mockColumns, onSortChange, onPageChange, onSelectionChange, onRowClick };
};

/**
 * Mock implementation to control viewport size for responsive tests
 */
jest.mock('../../../../hooks/useResponsive', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'lg',
    up: jest.fn(),
    down: jest.fn(),
    between: jest.fn(),
    getResponsiveValue: jest.fn()
  })),
}));

describe('DataTable', () => {
  it('renders the DataTable with data', () => {
    // Set up test data and columns
    const { mockData, mockColumns } = setup();

    // Render the DataTable component with basic props
    renderWithProviders(<DataTable columns={mockColumns} data={mockData} />);

    // Verify that the table headers are displayed
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Verify that the data rows are displayed correctly
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('displays loading skeleton when loading prop is true', () => {
    // Set up test data and columns
    const { mockData, mockColumns } = setup();

    // Render the DataTable component with loading=true
    renderWithProviders(<DataTable columns={mockColumns} data={mockData} loading={true} />);

    // Verify that loading skeletons are displayed
    expect(screen.getAllByRole('progressbar')).toHaveLength(mockColumns.length);

    // Verify that actual data is not displayed
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
  });

  it('handles sorting when clicking on sortable column headers', async () => {
    // Set up test data and columns with sortable columns
    const { mockData, mockColumns, onSortChange } = setup();
    const { user } = renderWithProviders(<DataTable columns={mockColumns} data={mockData} onSortChange={onSortChange} />);

    // Click on a sortable column header
    const nameHeader = screen.getByText('Name');
    await userEvent.click(nameHeader);

    // Verify that onSortChange callback is called with correct parameters
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', direction: 'asc' }]);

    // Click again to test sort direction toggle
    await userEvent.click(nameHeader);

    // Verify callback is called with updated sort direction
    expect(onSortChange).toHaveBeenCalledTimes(2);
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', direction: 'desc' }]);
  });

  it('handles pagination correctly', async () => {
    // Set up test data and columns
    const { mockData, mockColumns, onPageChange } = setup();
    const pagination: PaginationParams = { page: 1, pageSize: 10 };
    const { user } = renderWithProviders(<DataTable columns={mockColumns} data={mockData} pagination={pagination} totalItems={30} onPageChange={onPageChange} />);

    // Click on next page button
    const nextPageButton = screen.getByRole('button', { name: 'Go to next page' });
    await userEvent.click(nextPageButton);

    // Verify that onPageChange callback is called with updated page number
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 });

    // Change page size using the page size selector
    const pageSizeSelect = screen.getByLabelText('Per Page');
    await userEvent.selectOptions(pageSizeSelect, ['25']);

    // Verify callback is called with updated page size
    expect(onPageChange).toHaveBeenCalledTimes(2);
    expect(onPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
  });

  it('allows row selection when selectable prop is true', async () => {
    // Set up test data and columns
    const { mockData, mockColumns, onSelectionChange } = setup();
    const { user } = renderWithProviders(<DataTable columns={mockColumns} data={mockData} selectable={true} onSelectionChange={onSelectionChange} />);

    // Click on a row checkbox
    const rowCheckbox = screen.getAllByRole('checkbox')[1];
    await userEvent.click(rowCheckbox);

    // Verify that onSelectionChange callback is called with selected row
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith([mockData[0]]);

    // Click on header checkbox to select all rows
    const headerCheckbox = screen.getByRole('checkbox', { name: 'Select all rows' });
    await userEvent.click(headerCheckbox);

    // Verify callback is called with all rows selected
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledWith(mockData);
  });

  it('calls onRowClick when a row is clicked', async () => {
    // Set up test data and columns
    const { mockData, mockColumns, onRowClick } = setup();
    const { user } = renderWithProviders(<DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);

    // Click on a data row
    const row = screen.getByText('John Smith').closest('tr');
    await userEvent.click(row as Element);

    // Verify that onRowClick callback is called with the correct row data
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders mobile view on small screens', async () => {
    // Mock useResponsive hook to simulate mobile viewport
    jest.mock('../../../../hooks/useResponsive', () => ({
      __esModule: true,
      default: jest.fn(() => ({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'xs',
        up: jest.fn(),
        down: jest.fn(),
        between: jest.fn(),
        getResponsiveValue: jest.fn()
      })),
    }));

    // Set up test data and columns
    const { mockData, mockColumns, onRowClick } = setup();

    // Render the DataTable component
    const { user } = renderWithProviders(<DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);

    // Verify that card-based mobile view is rendered instead of table
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Verify that primary column is displayed prominently
    expect(screen.getByText('John Smith')).toBeVisible();

    // Click on a card
    const card = screen.getByText('John Smith').closest('div[class*="MuiCard-root"]');
    await userEvent.click(card as Element);

    // Verify that onRowClick callback is called with correct data
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders tablet view with simplified columns', () => {
    // Mock useResponsive hook to simulate tablet viewport
    jest.mock('../../../../hooks/useResponsive', () => ({
      __esModule: true,
      default: jest.fn(() => ({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        breakpoint: 'md',
        up: jest.fn(),
        down: jest.fn(),
        between: jest.fn(),
        getResponsiveValue: jest.fn()
      })),
    }));

    // Set up test data and columns
    const { mockData, mockColumns } = setup();

    // Render the DataTable component
    renderWithProviders(<DataTable columns={mockColumns} data={mockData} />);

    // Verify that table is rendered with only important columns
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();

    // Verify that less important columns are hidden
    expect(screen.queryByText('Age')).toBeInTheDocument();
  });

  it('formats cell values based on column type', () => {
    // Set up test data with various data types
    const mockData = [
      {
        id: '1',
        name: 'John Smith',
        age: 35.5,
        status: 'active',
        dateJoined: '2023-01-15',
        balance: 1250.75,
      },
    ];

    // Define columns with different types (string, number, date, currency, status)
    const mockColumns: TableColumn[] = [
      { field: 'name', headerName: 'Name', width: 200, type: 'string' },
      { field: 'age', headerName: 'Age', width: 100, type: 'number' },
      { field: 'dateJoined', headerName: 'Date Joined', width: 150, type: 'date' },
      { field: 'balance', headerName: 'Balance', width: 150, type: 'currency' },
      { field: 'status', headerName: 'Status', width: 150, type: 'status', statusType: 'documentation' },
    ];

    // Render the DataTable component
    renderWithProviders(<DataTable columns={mockColumns} data={mockData} />);

    // Verify that string values are displayed as is
    expect(screen.getByText('John Smith')).toBeInTheDocument();

    // Verify that number values are formatted with appropriate decimal places
    expect(screen.getByText('35.5')).toBeInTheDocument();

    // Verify that date values are formatted correctly
    expect(screen.getByText('01/15/2023')).toBeInTheDocument();

    // Verify that currency values are formatted with currency symbol
    expect(screen.getByText('$1,250.75')).toBeInTheDocument();

    // Verify that status values are rendered as StatusBadge components
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('uses custom renderCell function when provided', () => {
    // Set up test data and columns
    const { mockData, mockColumns } = setup();

    // Add a custom renderCell function to one column
    const customColumns = [...mockColumns];
    customColumns[0] = {
      ...customColumns[0],
      renderCell: ({ value }) => <strong>{value}</strong>,
    };

    // Render the DataTable component
    renderWithProviders(<DataTable columns={customColumns} data={mockData} />);

    // Verify that the custom cell renderer is used for that column
    expect(screen.getByText('1')).toBeInstanceOf(HTMLElement);
    expect(screen.getByText('1')).toContainHTML('<strong>1</strong>');
  });
});