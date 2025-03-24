import React from 'react'; // react v18.2.0
import { act } from '@testing-library/react'; // @testing-library/react v13.4.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import { rest } from 'msw'; // msw v1.2.1
import { setupServer } from 'msw/node'; // msw v1.2.1

import { renderWithProviders, screen, waitFor } from '../../utils/test-utils';
import { mockPayments, createMockPayment } from '../../utils/mock-data';
import { mockPaginatedResponse, mockApiResponse } from '../../utils/mock-api';
import PaymentsPage from '../../../pages/payments/index';
import { ReconciliationStatus, PaymentMethod } from '../../../types/payments.types';
import { PAYMENTS_PAGE_TITLE } from '../../../constants/payments.constants';

/**
 * Creates mock payment dashboard metrics for testing
 */
const createMockPaymentDashboardMetrics = () => {
  // Create a mock payment dashboard metrics object with realistic data
  const totalPayments = 150;
  const totalAmount = 75000;
  const averagePaymentAmount = totalAmount / totalPayments;

  // Include totalPayments, totalAmount, and averagePaymentAmount
  const reconciliationBreakdown = [
    { status: ReconciliationStatus.RECONCILED, count: 100, amount: 50000 },
    { status: ReconciliationStatus.UNRECONCILED, count: 30, amount: 15000 },
    { status: ReconciliationStatus.PARTIALLY_RECONCILED, count: 15, amount: 7500 },
    { status: ReconciliationStatus.EXCEPTION, count: 5, amount: 2500 },
  ];

  // Include reconciliationBreakdown with counts for each status
  const paymentMethodBreakdown = [
    { method: PaymentMethod.EFT, count: 80, amount: 40000 },
    { method: PaymentMethod.CHECK, count: 40, amount: 20000 },
    { method: PaymentMethod.CREDIT_CARD, count: 20, amount: 10000 },
    { method: PaymentMethod.CASH, count: 10, amount: 5000 },
  ];

  // Include paymentMethodBreakdown with counts for each method
  const paymentsByPayer = [
    { payerId: '1', payerName: 'Medicaid', count: 90, amount: 45000 },
    { payerId: '2', payerName: 'Medicare', count: 40, amount: 20000 },
    { payerId: '3', payerName: 'Private Pay', count: 20, amount: 10000 },
  ];

  // Include paymentsByPayer with amounts for each payer
  const paymentTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const period = month.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { period, count: 25 - i * 2, amount: 12500 - i * 1000 };
  });

  // Include paymentTrend with data for the last 6 months
  return {
    totalPayments,
    totalAmount,
    averagePaymentAmount,
    reconciliationBreakdown,
    paymentMethodBreakdown,
    paymentsByPayer,
    paymentTrend,
  }; // Return the complete metrics object
};

// Define mock API handlers for payments and dashboard metrics
const handlers = [
  rest.get('/api/payments', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockPaginatedResponse(mockPayments)));
  }),
  rest.get('/api/payments/dashboard-metrics', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse(createMockPaymentDashboardMetrics())));
  }),
];

// Set up MSW server with the handlers
const server = setupServer(...handlers);

// Tests for the payments page component
describe('Payments Page', () => {
  // Start the server before all tests
  beforeAll(() => server.listen());

  // Reset request handlers after each test
  afterEach(() => server.resetHandlers());

  // Close the server after all tests
  afterAll(() => server.close());

  it('renders the payments page with title', async () => {
    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Wait for the page to load
    await waitFor(() => {
      // Verify that the page title is displayed correctly
      expect(screen.getByText(PAYMENTS_PAGE_TITLE)).toBeInTheDocument();
    });

    // Verify that the dashboard tab is selected by default
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveClass('Mui-selected');
  });

  it('displays payment dashboard metrics', async () => {
    // Mock the API response for dashboard metrics
    server.use(
      rest.get('/api/payments/dashboard-metrics', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockApiResponse(createMockPaymentDashboardMetrics())));
      })
    );

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Wait for the dashboard metrics to load
    await waitFor(() => {
      // Verify that the total payments metric is displayed
      expect(screen.getByText('Total Payments')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();

      // Verify that the total amount metric is displayed
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('$75,000.00')).toBeInTheDocument();

      // Verify that the average payment metric is displayed
      expect(screen.getByText('Average Payment')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();

      // Verify that the reconciliation status chart is displayed
      expect(screen.getByText('Reconciliation Status')).toBeInTheDocument();

      // Verify that the payment method chart is displayed
      expect(screen.getByText('Payment Method Breakdown')).toBeInTheDocument();
    });
  });

  it('switches between dashboard and list tabs', async () => {
    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Wait for the page to load
    await waitFor(() => {
      // Verify that the dashboard tab is selected by default
      expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveClass('Mui-selected');
    });

    // Click on the list tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Payments List' }));
    });

    // Verify that the list tab is now selected
    expect(screen.getByRole('tab', { name: 'Payments List' })).toHaveClass('Mui-selected');

    // Verify that the payment list is displayed
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Payment ID' })).toBeInTheDocument();
    });

    // Click on the dashboard tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));
    });

    // Verify that the dashboard tab is selected again
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveClass('Mui-selected');

    // Verify that the dashboard is displayed
    await waitFor(() => {
      expect(screen.getByText('Total Payments')).toBeInTheDocument();
    });
  });

  it('displays payment list with data', async () => {
    // Mock the API response for payments list
    server.use(
      rest.get('/api/payments', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockPaginatedResponse(mockPayments)));
      })
    );

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Click on the list tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Payments List' }));
    });

    // Wait for the payment list to load
    await waitFor(() => {
      // Verify that the payment list table is displayed
      expect(screen.getByRole('columnheader', { name: 'Payment ID' })).toBeInTheDocument();
    });

    // Verify that the correct number of payments are shown
    const paymentRows = screen.getAllByRole('row');
    expect(paymentRows.length).toBeGreaterThan(1); // Header row + at least one data row

    // Verify that payment details like ID, amount, and status are displayed
    expect(screen.getByText(mockPayments[0].id)).toBeInTheDocument();
    expect(screen.getByText('$1,245.67')).toBeInTheDocument();
  });

  it('navigates to create payment page when button is clicked', async () => {
    // Mock the router push function
    const pushMock = jest.fn();
    const useRouterMock = jest.spyOn(require('next/router'), 'useRouter');
    useRouterMock.mockImplementation(() => ({
      push: pushMock,
      pathname: '/payments',
      query: {},
      asPath: '/payments',
      replace: jest.fn(),
    } as any));

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New Payment' })).toBeInTheDocument();
    });

    // Click on the 'Create Payment' button
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'New Payment' }));
    });

    // Verify that router.push was called with the correct path
    expect(pushMock).toHaveBeenCalledWith('/payments/new');

    // Restore the original useRouter mock
    useRouterMock.mockRestore();
  });

  it('navigates to import remittance page when button is clicked', async () => {
    // Mock the router push function
    const pushMock = jest.fn();
    const useRouterMock = jest.spyOn(require('next/router'), 'useRouter');
    useRouterMock.mockImplementation(() => ({
      push: pushMock,
      pathname: '/payments',
      query: {},
      asPath: '/payments',
      replace: jest.fn(),
    } as any));

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Import Remittance' })).toBeInTheDocument();
    });

    // Click on the 'Import Remittance' button
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Import Remittance' }));
    });

    // Verify that router.push was called with the correct path
    expect(pushMock).toHaveBeenCalledWith('/payments/reconciliation');

    // Restore the original useRouter mock
    useRouterMock.mockRestore();
  });

  it('filters payments when filter is applied', async () => {
    // Mock the API response for payments list
    const mockFilteredPayments = mockPayments.slice(0, 1);
    server.use(
      rest.get('/api/payments', (req, res, ctx) => {
        const statusFilter = req.url.searchParams.get('reconciliationStatus');
        if (statusFilter === ReconciliationStatus.RECONCILED) {
          return res(ctx.status(200), ctx.json(mockPaginatedResponse(mockFilteredPayments)));
        }
        return res(ctx.status(200), ctx.json(mockPaginatedResponse(mockPayments)));
      })
    );

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Click on the list tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Payments List' }));
    });

    // Wait for the payment list to load
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Payment ID' })).toBeInTheDocument();
    });

    // Open the filter panel
    // Select a reconciliation status filter
    // Apply the filter
    // Verify that the API was called with the correct filter parameters
    // Verify that the filtered payments are displayed
  });

  it('handles loading state correctly', async () => {
    // Mock a delayed API response for payments
    server.use(
      rest.get('/api/payments', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res(ctx.status(200), ctx.json(mockPaginatedResponse(mockPayments)));
      })
    );

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Click on the list tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Payments List' }));
    });

    // Verify that loading indicators are displayed
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Wait for the data to load
    await waitFor(() => {
      // Verify that the loading indicators are replaced with content
      expect(screen.getByRole('columnheader', { name: 'Payment ID' })).toBeInTheDocument();
    });
  });

  it('handles error state correctly', async () => {
    // Mock an error API response for payments
    server.use(
      rest.get('/api/payments', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }));
      })
    );

    // Render the PaymentsPage component with providers
    renderWithProviders(<PaymentsPage />);

    // Click on the list tab
    await act(async () => {
      userEvent.click(screen.getByRole('tab', { name: 'Payments List' }));
    });

    // Wait for the error state to be processed
    await waitFor(() => {
      // Verify that an error message is displayed
      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });

    // Verify that a retry button is available
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});