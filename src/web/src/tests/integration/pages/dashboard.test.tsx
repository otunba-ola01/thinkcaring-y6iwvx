import React from 'react'; // react v18.2.0
import { rest } from 'msw'; // msw v^1.0.0
import { server } from '../../../mocks/server';
import { renderWithProviders, screen, waitFor } from '../../utils/test-utils';
import DashboardPage from '../../../pages/dashboard';
import { mockDashboardData } from '../../../mocks/data/dashboard';
import { fetchDashboardMetrics } from '../../../store/dashboard/dashboardThunks';
import { handlers } from '../../../mocks/handlers';

describe('Dashboard Page', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('renders dashboard with financial metrics', async () => {
    renderWithProviders(<DashboardPage />);

    // Verify loading indicators are displayed initially
    expect(screen.getByText(/Loading\.\.\./i)).toBeInTheDocument();

    // Wait for data to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    });

    // Verify financial metrics are displayed correctly
    expect(screen.getByText(`$${mockDashboardData.metrics.revenue.currentPeriodRevenue}`)).toBeInTheDocument();

    // Verify revenue metrics section is displayed
    expect(screen.getByText(/Revenue by Program/i)).toBeInTheDocument();

    // Verify claims status section is displayed
    expect(screen.getByText(/Claims Status/i)).toBeInTheDocument();

    // Verify alerts section is displayed
    expect(screen.getByText(/Alerts/i)).toBeInTheDocument();

    // Verify recent claims section is displayed
    expect(screen.getByText(/Recent Claims/i)).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    // Override MSW handler to return error response for dashboard metrics
    server.use(
      rest.get(API_ENDPOINTS.DASHBOARD.METRICS, async (req, res, ctx) => {
        await delay();
        return res(
          ctx.status(500),
          ctx.json({ message: 'Failed to fetch dashboard metrics' })
        );
      })
    );

    renderWithProviders(<DashboardPage />);

    // Wait for error state to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch dashboard metrics/i)).toBeInTheDocument();
    });

    // Verify error message is displayed
    expect(screen.getByText(/Failed to fetch dashboard metrics/i)).toBeInTheDocument();

    // Verify retry button is displayed and functional
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('allows filtering dashboard data', async () => {
    renderWithProviders(<DashboardPage />);

    // Wait for data to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    });

    // Find and interact with date range filter
    const dateRangeFilter = screen.getByLabelText(/Date Range/i);
    fireEvent.click(dateRangeFilter);
    await waitFor(() => {
      expect(screen.getByText(/Today/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Today/i));

    // Verify API is called with updated filter parameters
    expect(fetchDashboardMetrics).toHaveBeenCalledWith(expect.objectContaining({ timeFrame: 'today' }));

    // Find and interact with program filter
    const programFilter = screen.getByLabelText(/Program/i);
    fireEvent.click(programFilter);
    await waitFor(() => {
      expect(screen.getByText(/Personal Care/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Personal Care/i));

    // Verify API is called with updated filter parameters
    expect(fetchDashboardMetrics).toHaveBeenCalledWith(expect.objectContaining({ programId: 'program-1' }));

    // Find and interact with payer filter
    const payerFilter = screen.getByLabelText(/Payer/i);
    fireEvent.click(payerFilter);
    await waitFor(() => {
      expect(screen.getByText(/Medicaid/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Medicaid/i));

    // Verify API is called with updated filter parameters
    expect(fetchDashboardMetrics).toHaveBeenCalledWith(expect.objectContaining({ payerId: 'payer-1' }));
  });

  it('refreshes dashboard data periodically', async () => {
    jest.useFakeTimers();
    renderWithProviders(<DashboardPage />);

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    });

    // Advance timers to trigger refresh interval
    jest.advanceTimersByTime(30000);

    // Verify API is called again to refresh data
    expect(fetchDashboardMetrics).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('allows interaction with alert notifications', async () => {
    renderWithProviders(<DashboardPage />);

    // Wait for data to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Alerts/i)).toBeInTheDocument();
    });

    // Find alert notifications section
    const alertsSection = screen.getByText(/Alerts/i).closest('div');

    // Click on an alert to mark it as read
    const alert = alertsSection.querySelector('.MuiAlert-root');
    fireEvent.click(alert);

    // Verify API is called to update alert status
    expect(markAlertAsRead).toHaveBeenCalledWith({ alertId: 'alert-1', read: true });

    // Verify alert is visually marked as read
    expect(alert).toHaveClass('MuiAlert-filledSuccess');
  });
});

// Helper function to simulate network delay
const delay = (ms?: number): Promise<void> => {
  const randomDelay = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
  const actualDelay = ms !== undefined ? ms : randomDelay;
  return new Promise(resolve => setTimeout(resolve, actualDelay));
};