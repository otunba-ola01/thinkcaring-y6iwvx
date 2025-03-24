import React from 'react'; // react v18.2.0
import { renderWithProviders, screen, waitFor, userEvent } from '../../utils/test-utils';
import { mockApiResponse, mockPaginatedResponse } from '../../utils/mock-api';
import { createMockClaim, createMockClaimWithRelations, mockClaims } from '../../utils/mock-data';
import ClaimsPage from '../../../pages/claims/index';
import { ClaimStatus, ClaimSummary } from '../../../types/claims.types';
import { API_ENDPOINTS } from '../../../constants/api.constants';
import { CLAIM_STATUS_LABELS } from '../../../constants/claims.constants';
import { rest } from 'msw'; // msw v1.2.1
import { setupServer } from 'msw/node'; // msw/node v1.2.1

/**
 * Sets up the mock server with handlers for claims API endpoints
 */
const setupMockServer = () => {
  // Define handlers for GET /api/claims endpoint to return paginated mock claims
  const claimsHandler = rest.get(API_ENDPOINTS.CLAIMS.BASE, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockPaginatedResponse(mockClaims))
    );
  });

  // Define handlers for GET /api/claims/:id endpoint to return a specific claim
  const claimByIdHandler = rest.get(API_ENDPOINTS.CLAIMS.BASE + '/:id', (req, res, ctx) => {
    const { id } = req.params;
    const claim = mockClaims.find(claim => claim.id === id);
    if (claim) {
      return res(
        ctx.status(200),
        ctx.json(mockApiResponse(createMockClaimWithRelations({ id: claim.id })))
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Claim not found' })
      );
    }
  });

  // Define handlers for POST /api/claims endpoint to create a new claim
  const createClaimHandler = rest.post(API_ENDPOINTS.CLAIMS.BASE, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(mockApiResponse(createMockClaimWithRelations()))
    );
  });

  // Define handlers for PUT /api/claims/:id endpoint to update a claim
  const updateClaimHandler = rest.put(API_ENDPOINTS.CLAIMS.BASE + '/:id', (req, res, ctx) => {
    const { id } = req.params;
    const claim = mockClaims.find(claim => claim.id === id);
    if (claim) {
      return res(
        ctx.status(200),
        ctx.json(mockApiResponse(createMockClaimWithRelations({ id: claim.id })))
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Claim not found' })
      );
    }
  });

  // Define handlers for POST /api/claims/:id/submit endpoint to submit a claim
  const submitClaimHandler = rest.post(API_ENDPOINTS.CLAIMS.BASE + '/:id/submit', (req, res, ctx) => {
    const { id } = req.params;
    const claim = mockClaims.find(claim => claim.id === id);
    if (claim) {
      return res(
        ctx.status(200),
        ctx.json(mockApiResponse(createMockClaimWithRelations({ id: claim.id, claimStatus: ClaimStatus.SUBMITTED })))
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Claim not found' })
      );
    }
  });

  // Define handlers for GET /api/claims/metrics endpoint to return claim metrics
  const claimMetricsHandler = rest.get(API_ENDPOINTS.CLAIMS.BASE + '/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockApiResponse({
        totalClaims: mockClaims.length,
        totalAmount: mockClaims.reduce((sum, claim) => sum + claim.totalAmount, 0),
        statusBreakdown: Object.values(ClaimStatus).map(status => ({
          status,
          count: mockClaims.filter(claim => claim.claimStatus === status).length,
          amount: mockClaims.filter(claim => claim.claimStatus === status).reduce((sum, claim) => sum + claim.totalAmount, 0)
        })),
        denialRate: 0.15,
        averageProcessingTime: 7,
        claimsByPayer: [],
      }))
    );
  });

  // Set up the server with the defined handlers
  const server = setupServer(
    claimsHandler,
    claimByIdHandler,
    createClaimHandler,
    updateClaimHandler,
    submitClaimHandler,
    claimMetricsHandler
  );

  return server;
};

describe('Claims Page Integration Tests', () => {
  const server = setupMockServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('renders the claims page with loading state and then data', async () => {
    // Render the ClaimsPage component with renderWithProviders
    renderWithProviders(<ClaimsPage />);

    // Verify loading indicator is displayed initially
    expect(screen.getByText(/Loading claims/i)).toBeInTheDocument();

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Verify page title is displayed
    expect(screen.getByText(/Claims Management/i)).toBeInTheDocument();

    // Verify claims table is rendered with correct columns
    expect(screen.getByText(/Claim #/i)).toBeInTheDocument();
    expect(screen.getByText(/Client/i)).toBeInTheDocument();
    expect(screen.getByText(/Service Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Payer/i)).toBeInTheDocument();
    expect(screen.getByText(/Age/i)).toBeInTheDocument();

    // Verify claim rows are displayed with correct data
    mockClaims.forEach(claim => {
      expect(screen.getByText(claim.claimNumber)).toBeInTheDocument();
    });
  });

  it('allows filtering claims by status', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click the status filter dropdown
    const statusFilter = screen.getByLabelText(/Status/i);
    userEvent.click(statusFilter);

    // Select a specific status option
    const statusOption = screen.getByRole('option', { name: CLAIM_STATUS_LABELS[ClaimStatus.SUBMITTED] });
    userEvent.click(statusOption);

    // Verify API is called with correct filter parameters
    // TODO: Implement API mocking and verification

    // Verify filtered claims are displayed
    // TODO: Implement data filtering and verification
  });

  it('allows searching claims by claim number or client name', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find the search input field
    const searchInput = screen.getByPlaceholderText(/Search by Claim # or Client Name/i);

    // Type a search term
    userEvent.type(searchInput, 'CLM-2023');

    // Verify API is called with correct search parameter
    // TODO: Implement API mocking and verification

    // Verify search results are displayed
    // TODO: Implement data filtering and verification
  });

  it('allows sorting claims by different columns', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click a column header to sort
    const claimNumberHeader = screen.getByRole('button', { name: /Claim #/i });
    userEvent.click(claimNumberHeader);

    // Verify API is called with correct sort parameters
    // TODO: Implement API mocking and verification

    // Verify claims are displayed in sorted order
    // TODO: Implement data sorting and verification

    // Click the same column header again to reverse sort
    userEvent.click(claimNumberHeader);

    // Verify API is called with updated sort parameters
    // TODO: Implement API mocking and verification

    // Verify claims are displayed in reverse sorted order
    // TODO: Implement data sorting and verification
  });

  it('allows pagination through claims', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click the next page button
    const nextPageButton = screen.getByRole('button', { name: /Go to next page/i });
    userEvent.click(nextPageButton);

    // Verify API is called with correct page parameter
    // TODO: Implement API mocking and verification

    // Verify next page of claims is displayed
    // TODO: Implement data verification

    // Find and click the previous page button
    const previousPageButton = screen.getByRole('button', { name: /Go to previous page/i });
    userEvent.click(previousPageButton);

    // Verify API is called with correct page parameter
    // TODO: Implement API mocking and verification

    // Verify previous page of claims is displayed
    // TODO: Implement data verification
  });

  it('navigates to claim detail page when clicking a claim', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click on a claim row
    const claimRow = screen.getByText(mockClaims[0].claimNumber).closest('tr');
    userEvent.click(claimRow);

    // Verify navigation to claim detail page with correct claim ID
    // TODO: Implement navigation verification
  });

  it('navigates to create claim page when clicking create button', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click the create claim button
    const createClaimButton = screen.getByRole('button', { name: /Create Claim/i });
    userEvent.click(createClaimButton);

    // Verify navigation to create claim page
    // TODO: Implement navigation verification
  });

  it('displays claim summary section with correct metrics', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Verify claim summary section is displayed
    expect(screen.getByText(/Status Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Summary/i)).toBeInTheDocument();

    // Verify status breakdown shows correct counts
    // TODO: Implement data verification

    // Verify financial summary shows correct amounts
    // TODO: Implement data verification
  });

  it('allows selecting multiple claims for batch actions', async () => {
    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Wait for claims data to be loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading claims/i)).not.toBeInTheDocument();
    });

    // Find and click checkboxes for multiple claims
    const claimCheckboxes = screen.getAllByRole('checkbox');
    userEvent.click(claimCheckboxes[0]);
    userEvent.click(claimCheckboxes[1]);

    // Verify batch action buttons appear
    // TODO: Implement UI verification

    // Verify correct number of selected claims is displayed
    // TODO: Implement UI verification
  });

  it('handles API errors gracefully', async () => {
    // Set up server to return an error for claims endpoint
    server.use(
      rest.get(API_ENDPOINTS.CLAIMS.BASE, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ message: 'Internal Server Error' })
        );
      })
    );

    // Render the ClaimsPage component
    renderWithProviders(<ClaimsPage />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch claims/i)).toBeInTheDocument();
    });

    // Verify retry button is available
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry button
    userEvent.click(retryButton);

    // Verify new API request is made
    // TODO: Implement API mocking and verification
  });
});