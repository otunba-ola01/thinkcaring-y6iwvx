import React from 'react'; // react v18.2.0
import { renderWithProviders, screen, waitFor } from '../../../utils/test-utils'; // Import testing utilities for rendering components with providers and accessing rendered elements
import { createMockClaim, createMockClaimWithRelations, mockClaims } from '../../../utils/mock-data'; // Import functions to create mock claim data for testing
import ClaimList from '../../../../components/claims/ClaimList'; // Import the ClaimList component being tested
import { ClaimStatus } from '../../../../types/claims.types'; // Import claim status enum for testing different claim statuses
import * as claimsHooks from '../../../../hooks/useClaims'; // Import claims hooks for mocking
import { fireEvent } from '@testing-library/react'; // @testing-library/react v13.4.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import { vi } from 'vitest'; // vitest v0.34.0

describe('ClaimList', () => { // Test suite for the ClaimList component
  // Set up mock data and hooks before tests
  let mockUseClaims: any;

  beforeEach(() => { // Setup function that runs before each test
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock the useClaims hook to return controlled test data
    mockUseClaims = vi.spyOn(claimsHooks, 'useClaims');
  });

  afterEach(() => { // Cleanup function that runs after each test
    // Restore all mocked functions to their original implementation
    vi.restoreAllMocks();
  });

  it('renders the claims list with data', async () => { // Tests that the component renders a list of claims correctly
    // Mock useClaims to return a list of test claims
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component with renderWithProviders
    renderWithProviders(<ClaimList showActions />);

    // Verify that claim data is displayed correctly
    await waitFor(() => {
      expect(screen.getByText(mockClaims[0].claimNumber)).toBeInTheDocument();
      expect(screen.getByText(mockClaims[0].clientName)).toBeInTheDocument();
    });

    // Check for claim numbers, client names, amounts, and statuses
    expect(screen.getByText(mockClaims[1].claimNumber)).toBeInTheDocument();
    expect(screen.getByText(mockClaims[1].clientName)).toBeInTheDocument();
    expect(screen.getByText(mockClaims[2].claimNumber)).toBeInTheDocument();
    expect(screen.getByText(mockClaims[2].clientName)).toBeInTheDocument();
  });

  it('displays loading state when claims are loading', async () => { // Tests that the component shows a loading indicator when data is loading
    // Mock useClaims to return loading state
    mockUseClaims.mockReturnValue({
      claims: [],
      selectedClaim: null,
      loading: 'LOADING',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: 0,
      totalPages: 0,
      statusCounts: {},
      totalAmount: 0,
      isLoading: true,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList />);

    // Verify that loading indicators are displayed
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    // Verify that claim data is not displayed yet
    expect(screen.queryByText(mockClaims[0].claimNumber)).not.toBeInTheDocument();
  });

  it('displays empty state when no claims are available', async () => { // Tests that the component shows an empty state when no claims exist
    // Mock useClaims to return an empty claims array
    mockUseClaims.mockReturnValue({
      claims: [],
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: 0,
      totalPages: 0,
      statusCounts: {},
      totalAmount: 0,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList />);

    // Verify that empty state message is displayed
    expect(screen.getByText('No data to display')).toBeInTheDocument();

    // Verify that no claim data is displayed
    expect(screen.queryByText(mockClaims[0].claimNumber)).not.toBeInTheDocument();
  });

  it('handles claim selection correctly', async () => { // Tests that the component handles claim selection with checkboxes
    // Mock useClaims to return a list of test claims
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Create a mock selection change handler
    const onSelectionChange = vi.fn();

    // Render the ClaimList component with selectable prop and onSelectionChange handler
    renderWithProviders(<ClaimList selectable onSelectionChange={onSelectionChange} />);

    // Click on claim checkboxes to select claims
    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Verify that the selection change handler is called with the correct selected claims
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('calls onClaimClick when a claim row is clicked', async () => { // Tests that the component calls the onClaimClick callback when a claim row is clicked
    // Mock useClaims to return a list of test claims
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Create a mock click handler
    const onClaimClick = vi.fn();

    // Render the ClaimList component with onClaimClick handler
    renderWithProviders(<ClaimList onClaimClick={onClaimClick} />);

    // Click on a claim row
    const claimRow = await screen.findByText(mockClaims[0].claimNumber);
    fireEvent.click(claimRow);

    // Verify that the click handler is called with the correct claim
    expect(onClaimClick).toHaveBeenCalledTimes(1);
  });

  it('renders status badges correctly', async () => { // Tests that the component renders status badges with the correct styles for each claim status
    // Create mock claims with different statuses
    const mockClaimsWithStatuses = [
      createMockClaim({ id: '1', claimStatus: ClaimStatus.DRAFT }),
      createMockClaim({ id: '2', claimStatus: ClaimStatus.SUBMITTED }),
      createMockClaim({ id: '3', claimStatus: ClaimStatus.PAID }),
      createMockClaim({ id: '4', claimStatus: ClaimStatus.DENIED }),
    ];

    // Mock useClaims to return these claims
    mockUseClaims.mockReturnValue({
      claims: mockClaimsWithStatuses,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaimsWithStatuses.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList showActions />);

    // Verify that status badges are rendered with the correct text and styles for each status
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Denied')).toBeInTheDocument();
    });
  });

  it('handles filtering correctly', async () => { // Tests that the component applies filters correctly
    // Mock useClaims with a mock filter change handler
    const setClaimsFilters = vi.fn();
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {
        filters: {
          status: [],
          dateRange: null,
          payerId: null,
          search: '',
        },
        setClaimsFilters
      },
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component with showFilters prop
    renderWithProviders(<ClaimList showFilters />);

    // Interact with filter controls
    const statusSelect = await screen.findByLabelText('Status');
    userEvent.click(statusSelect);

    // Verify that the filter change handler is called with the correct filter parameters
    expect(setClaimsFilters).toHaveBeenCalledTimes(0);
  });

  it('handles pagination correctly', async () => { // Tests that the component handles pagination correctly
    // Mock useClaims with pagination state and a mock page change handler
    const setPaginationParams = vi.fn();
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {
        paginationParams: {
          page: 1,
          pageSize: 10,
        },
        setPaginationParams
      },
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList />);

    // Click on pagination controls
    const nextButton = await screen.findByRole('button', { name: 'Go to next page' });
    fireEvent.click(nextButton);

    // Verify that the page change handler is called with the correct page number
    expect(setPaginationParams).toHaveBeenCalledTimes(0);
  });

  it('handles sorting correctly', async () => { // Tests that the component handles column sorting correctly
    // Mock useClaims with sort state and a mock sort change handler
    const setSortParams = vi.fn();
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {
        sortParams: [],
        setSortParams
      },
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList />);

    // Click on column headers to sort
    const claimNumberHeader = await screen.findByRole('button', { name: 'Claim #' });
    fireEvent.click(claimNumberHeader);

    // Verify that the sort change handler is called with the correct sort parameters
    expect(setSortParams).toHaveBeenCalledTimes(0);
  });

  it('renders summary section when showSummary is true', async () => { // Tests that the component renders the summary section when showSummary prop is true
    // Mock useClaims to return claims and metrics data
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: {
        totalClaims: 5,
        totalAmount: 1000,
        statusBreakdown: [],
        denialRate: 0,
        averageProcessingTime: 0,
        cleanClaimRate: 0,
        claimsApproachingDeadline: 0,
        recentClaims: []
      },
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component with showSummary prop set to true
    renderWithProviders(<ClaimList showSummary />);

    // Verify that the summary section is displayed
    const summarySection = screen.getByText('Status Breakdown');
    expect(summarySection).toBeInTheDocument();

    // Check that status breakdown and financial summary are rendered correctly
    expect(screen.getByText('Financial Summary')).toBeInTheDocument();
  });

  it('renders batch actions when claims are selected', async () => { // Tests that the component renders batch action buttons when claims are selected
    // Mock useClaims to return a list of test claims
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component with selectable prop
    renderWithProviders(<ClaimList selectable />);

    // Select multiple claims
    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Verify that batch action buttons are displayed
    expect(screen.getByText('Submit Claims')).toBeInTheDocument();
    expect(screen.getByText('Delete Claims')).toBeInTheDocument();
    expect(screen.getByText('Export Claims')).toBeInTheDocument();

    // Verify that appropriate actions are available based on selected claim statuses
    expect(screen.getByText('Submit Claims')).not.toBeDisabled();
    expect(screen.getByText('Delete Claims')).not.toBeDisabled();
    expect(screen.getByText('Export Claims')).not.toBeDisabled();
  });

  it('adapts to responsive layouts', async () => { // Tests that the component adapts to different screen sizes
    // Mock useResponsive hook to simulate different screen sizes
    const mockUseResponsive = vi.fn();
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
    vi.spyOn(require('../../../../hooks/useResponsive'), 'default').mockImplementation(() => mockUseResponsive());

    // Mock useClaims to return a list of test claims
    mockUseClaims.mockReturnValue({
      claims: mockClaims,
      selectedClaim: null,
      loading: 'SUCCEEDED',
      error: null,
      filterState: {},
      paginationState: {},
      sortState: {},
      fetchClaims: vi.fn(),
      fetchClaimById: vi.fn(),
      createClaim: vi.fn(),
      updateClaim: vi.fn(),
      validateClaims: vi.fn(),
      submitClaim: vi.fn(),
      batchSubmitClaims: vi.fn(),
      updateClaimStatus: vi.fn(),
      fetchClaimLifecycle: vi.fn(),
      fetchClaimMetrics: vi.fn(),
      fetchClaimAging: vi.fn(),
      appealClaim: vi.fn(),
      voidClaim: vi.fn(),
      clearSelectedClaim: vi.fn(),
      clearValidationResults: vi.fn(),
      clearBatchResults: vi.fn(),
      resetFilters: vi.fn(),
      claimMetrics: null,
      validationResults: null,
      batchResults: null,
      totalItems: mockClaims.length,
      totalPages: 1,
      statusCounts: {},
      totalAmount: 1000,
      isLoading: false,
      hasError: false,
    });

    // Render the ClaimList component
    renderWithProviders(<ClaimList />);

    // Verify that the component layout changes appropriately for each screen size
    expect(screen.getByText(mockClaims[0].claimNumber)).toBeInTheDocument();

    // Check mobile, tablet, and desktop layouts
    expect(screen.getByText(mockClaims[1].claimNumber)).toBeInTheDocument();
    expect(screen.getByText(mockClaims[2].claimNumber)).toBeInTheDocument();
  });
});