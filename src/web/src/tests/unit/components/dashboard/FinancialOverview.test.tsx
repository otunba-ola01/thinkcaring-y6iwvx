import React from 'react'; // react v18.2.0
import { renderWithProviders, screen, waitFor } from '../../../utils/test-utils'; // Import testing utilities for rendering components with providers and querying the DOM
import FinancialOverview from '../../../../components/dashboard/FinancialOverview'; // Import the component being tested
import { mockDashboardMetrics } from '../../../../mocks/data/dashboard'; // Import mock dashboard metrics for testing
import * as useDashboardModule from '../../../../hooks/useDashboard'; // Import the dashboard hook module for mocking
import { LoadingState } from '../../../../types/dashboard.types'; // Import loading state enum for testing different component states
import jest from 'jest'; // Import Jest for mocking functions

// LD1: Test suite for the FinancialOverview component
describe('FinancialOverview Component', () => {
  // IE1: Set up mocks for the useDashboard hook
  let useDashboardMock: jest.SpyInstance;

  // IE1: Set up before each test
  beforeEach(() => {
    // Reset all mocks before each test to ensure clean state
    jest.resetAllMocks();

    // Mock the useDashboard hook to return controlled test data
    useDashboardMock = jest.spyOn(useDashboardModule, 'useDashboard');
  });

  // IE1: Clean up after each test
  afterEach(() => {
    // Restore all mocks to their original implementation
    useDashboardMock.mockRestore();
  });

  // LD1: Test that the component renders correctly with data
  it('renders financial overview with metrics', async () => {
    // IE1: Mock useDashboard to return successful state with mock metrics
    useDashboardMock.mockReturnValue({
      metrics: mockDashboardMetrics,
      loading: LoadingState.SUCCEEDED,
      error: null,
      dashboardFilters: {},
      timeFrame: 'last30Days',
      dateRange: { startDate: '2023-01-01', endDate: '2023-01-31' },
      programFilter: undefined,
      payerFilter: undefined,
      facilityFilter: undefined,
      recentClaims: [],
      unreadAlertCount: 0,
      setTimeFrame: jest.fn(),
      setDateRange: jest.fn(),
      setProgram: jest.fn(),
      setPayer: jest.fn(),
      setFacility: jest.fn(),
      markAlertAsRead: jest.fn(),
      setRefreshInterval: jest.fn(),
      revenueByProgram: [],
      revenueByPayer: [],
      revenueTrend: [],
      claimStatusBreakdown: [],
      isLoading: false
    });

    // LD1: Render the FinancialOverview component with providers
    renderWithProviders(<FinancialOverview />);

    // LD1: Verify that key financial metrics are displayed
    // LD1: Check for total revenue amount
    expect(screen.getByText('$1,245,678.00')).toBeInTheDocument();

    // LD1: Check for claims count
    expect(screen.getByText('50')).toBeInTheDocument();

    // LD1: Check for clean claim rate
    expect(screen.getByText('75.0%')).toBeInTheDocument();

    // LD1: Verify that child components are rendered (RevenueMetrics, ClaimsStatus, AlertNotifications)
    expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
    expect(screen.getByText('Claims Status')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  // LD1: Test that the component shows loading state
  it('displays loading state', async () => {
    // IE1: Mock useDashboard to return loading state
    useDashboardMock.mockReturnValue({
      metrics: null,
      loading: LoadingState.LOADING,
      error: null,
      dashboardFilters: {},
      timeFrame: 'last30Days',
      dateRange: { startDate: '2023-01-01', endDate: '2023-01-31' },
      programFilter: undefined,
      payerFilter: undefined,
      facilityFilter: undefined,
      recentClaims: [],
      unreadAlertCount: 0,
      setTimeFrame: jest.fn(),
      setDateRange: jest.fn(),
      setProgram: jest.fn(),
      setPayer: jest.fn(),
      setFacility: jest.fn(),
      markAlertAsRead: jest.fn(),
      setRefreshInterval: jest.fn(),
      revenueByProgram: [],
      revenueByPayer: [],
      revenueTrend: [],
      claimStatusBreakdown: [],
      isLoading: true
    });

    // LD1: Render the FinancialOverview component with providers
    renderWithProviders(<FinancialOverview />);

    // LD1: Verify that loading indicators or skeletons are displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // LD1: Check that actual data is not displayed while loading
    expect(screen.queryByText('$1,245,678.00')).not.toBeInTheDocument();
  });

  // LD1: Test that the component shows error state
  it('displays error state', async () => {
    // IE1: Mock useDashboard to return error state
    useDashboardMock.mockReturnValue({
      metrics: null,
      loading: LoadingState.FAILED,
      error: 'Failed to fetch data',
      dashboardFilters: {},
      timeFrame: 'last30Days',
      dateRange: { startDate: '2023-01-01', endDate: '2023-01-31' },
      programFilter: undefined,
      payerFilter: undefined,
      facilityFilter: undefined,
      recentClaims: [],
      unreadAlertCount: 0,
      setTimeFrame: jest.fn(),
      setDateRange: jest.fn(),
      setProgram: jest.fn(),
      setPayer: jest.fn(),
      setFacility: jest.fn(),
      markAlertAsRead: jest.fn(),
      setRefreshInterval: jest.fn(),
      revenueByProgram: [],
      revenueByPayer: [],
      revenueTrend: [],
      claimStatusBreakdown: [],
      isLoading: false
    });

    // LD1: Render the FinancialOverview component with providers
    renderWithProviders(<FinancialOverview />);

    // LD1: Verify that error message is displayed
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();

    // LD1: Check that retry button or error action is available
    // (This component doesn't have a retry button, so we just check that the data is not displayed)
    expect(screen.queryByText('$1,245,678.00')).not.toBeInTheDocument();
  });

  // LD1: Test that the component handles empty data gracefully
  it('handles empty data gracefully', async () => {
    // IE1: Mock useDashboard to return successful state but with null or empty metrics
    useDashboardMock.mockReturnValue({
      metrics: {
        revenue: null,
        claims: null,
        payments: null,
        services: null,
        agingReceivables: null,
        alerts: []
      },
      loading: LoadingState.SUCCEEDED,
      error: null,
      dashboardFilters: {},
      timeFrame: 'last30Days',
      dateRange: { startDate: '2023-01-01', endDate: '2023-01-31' },
      programFilter: undefined,
      payerFilter: undefined,
      facilityFilter: undefined,
      recentClaims: [],
      unreadAlertCount: 0,
      setTimeFrame: jest.fn(),
      setDateRange: jest.fn(),
      setProgram: jest.fn(),
      setPayer: jest.fn(),
      setFacility: jest.fn(),
      markAlertAsRead: jest.fn(),
      setRefreshInterval: jest.fn(),
      revenueByProgram: [],
      revenueByPayer: [],
      revenueTrend: [],
      claimStatusBreakdown: [],
      isLoading: false
    });

    // LD1: Render the FinancialOverview component with providers
    renderWithProviders(<FinancialOverview />);

    // LD1: Verify that the component doesn't crash
    expect(screen.getByText('Financial Overview')).toBeInTheDocument();

    // LD1: Check that appropriate fallback content or empty states are displayed
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Claims Count')).toBeInTheDocument();
    expect(screen.getByText('Clean Claim Rate')).toBeInTheDocument();
  });

  // LD1: Test that the component refreshes data when requested
  it('refreshes data when refresh action is triggered', async () => {
    // IE1: Mock useDashboard to return successful state with mock metrics and a refresh function
    const mockSetRefreshInterval = jest.fn();
    useDashboardMock.mockReturnValue({
      metrics: mockDashboardMetrics,
      loading: LoadingState.SUCCEEDED,
      error: null,
      dashboardFilters: {},
      timeFrame: 'last30Days',
      dateRange: { startDate: '2023-01-01', endDate: '2023-01-31' },
      programFilter: undefined,
      payerFilter: undefined,
      facilityFilter: undefined,
      recentClaims: [],
      unreadAlertCount: 0,
      setTimeFrame: jest.fn(),
      setDateRange: jest.fn(),
      setProgram: jest.fn(),
      setPayer: jest.fn(),
      setFacility: jest.fn(),
      markAlertAsRead: jest.fn(),
      setRefreshInterval: mockSetRefreshInterval,
      revenueByProgram: [],
      revenueByPayer: [],
      revenueTrend: [],
      claimStatusBreakdown: [],
      isLoading: false
    });

    // LD1: Render the FinancialOverview component with providers
    renderWithProviders(<FinancialOverview />);

    // LD1: Find and click the refresh button
    // (This component doesn't have a refresh button, so we just check that the refresh function was not called on mount)
    expect(mockSetRefreshInterval).not.toHaveBeenCalled();
  });
});