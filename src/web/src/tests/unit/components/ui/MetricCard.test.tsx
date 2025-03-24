import React from 'react'; // v18.2.0
import { render } from '@testing-library/react'; // v13.4.0
import userEvent from '@testing-library/user-event'; // v14.4.3
import { vi } from 'vitest'; // v0.32.0
import { MetricCard } from '../../../../components/ui/MetricCard'; // Import the MetricCard component to be tested
import { renderWithProviders, screen } from '../../../utils/test-utils'; // Import testing utilities for rendering components and querying the DOM
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import { Box, Skeleton } from '@mui/material';

/**
 * Creates test props for the MetricCard component
 * @returns Returns an object with default props and helper functions
 */
const setup = () => {
  // Create default props for the MetricCard component
  const title = 'Test Metric';
  const value = 1234;
  const trend = 5;

  // Create mock onClick function using vi.fn()
  const onClick = vi.fn();

  // Return the test setup object
  return { title, value, trend, onClick };
};

describe('MetricCard', () => {
  it('renders correctly with title and value', () => {
    // Render the MetricCard component with title and value props
    const { title, value } = setup();
    renderWithProviders(<MetricCard title={title} value={value} />);

    // Verify that the title is displayed
    expect(screen.getByText(title)).toBeInTheDocument();

    // Verify that the value is displayed
    expect(screen.getByText(value.toLocaleString())).toBeInTheDocument();
  });

  it('renders positive trend indicator correctly', () => {
    // Render the MetricCard with a positive trend value
    const { title, value, trend } = setup();
    renderWithProviders(<MetricCard title={title} value={value} trend={trend} />);

    // Verify that the trend indicator is displayed
    const trendIndicator = screen.getByText('+5%');
    expect(trendIndicator).toBeInTheDocument();

    // Verify that the trend indicator has the correct color
    expect(trendIndicator).toHaveStyle({ color: 'green' });

    // Verify that the TrendingUp icon is displayed
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  it('renders negative trend indicator correctly', () => {
    // Render the MetricCard with a negative trend value
    const { title, value } = setup();
    renderWithProviders(<MetricCard title={title} value={value} trend={-5} />);

    // Verify that the trend indicator is displayed
    const trendIndicator = screen.getByText('-5%');
    expect(trendIndicator).toBeInTheDocument();

    // Verify that the trend indicator has the correct color
    expect(trendIndicator).toHaveStyle({ color: 'red' });

    // Verify that the TrendingDown icon is displayed
    expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
  });

  it('renders custom trend label when provided', () => {
    // Render the MetricCard with a trend value and custom trend label
    const { title, value, trend } = setup();
    const trendLabel = 'vs Last Month';
    renderWithProviders(<MetricCard title={title} value={value} trend={trend} trendLabel={trendLabel} />);

    // Verify that the custom trend label is displayed
    expect(screen.getByText(`+5% ${trendLabel}`)).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    // Render the MetricCard with an icon prop
    const { title, value } = setup();
    const icon = <span data-testid="custom-icon">Icon</span>;
    renderWithProviders(<MetricCard title={title} value={value} icon={icon} />);

    // Verify that the icon is displayed
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders skeleton when loading is true', () => {
    // Render the MetricCard with loading set to true
    renderWithProviders(<MetricCard title="Test Metric" value={1234} loading={true} />);

    // Verify that skeleton components are displayed
    expect(screen.getByRole('skeleton', { name: /test metric/i })).toBeInTheDocument();
    expect(screen.getByRole('skeleton', { name: /1234/i })).toBeInTheDocument();

    // Verify that the actual content is not displayed
    expect(screen.queryByText('Test Metric')).not.toBeInTheDocument();
    expect(screen.queryByText('1,234')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    // Create a mock onClick function
    const { title, value, onClick } = setup();
    const user = userEvent.setup();

    // Render the MetricCard with the onClick prop
    renderWithProviders(<MetricCard title={title} value={value} onClick={onClick} />);

    // Click on the MetricCard
    await user.click(screen.getByText(title).closest('div') as Element);

    // Verify that the onClick function was called
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom styles when sx prop is provided', () => {
    // Create custom styles object
    const customStyles = {
      backgroundColor: 'red',
      color: 'white',
    };

    // Render the MetricCard with the sx prop
    const { title, value } = setup();
    const { container } = renderWithProviders(<MetricCard title={title} value={value} sx={customStyles} />);

    // Verify that the custom styles are applied
    expect(container.firstChild).toHaveStyle({
      backgroundColor: 'red',
      color: 'white',
    });
  });
});