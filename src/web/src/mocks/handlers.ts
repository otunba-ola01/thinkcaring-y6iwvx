// msw: ^1.0.0
import { rest } from 'msw';
import { API_ENDPOINTS, API_RESPONSE_CODES } from '../constants/api.constants';
import {
  mockLoginResponse,
  mockMfaRequiredResponse,
  mockLoginErrorResponse,
  mockPasswordResetResponse,
  mockUsers,
  mockTokens
} from './data/auth';
import {
  mockClaims,
  mockClaimWithRelations,
  mockClaimSummaries,
  mockClaimValidationResponse,
  mockClaimBatchResult,
  mockClaimMetrics
} from './data/claims';
import {
  mockClients,
  mockClientDetails
} from './data/clients';
import {
  mockServices,
  mockServiceDetails
} from './data/services';
import {
  mockPayments,
  mockPaymentDetails,
  mockRemittanceProcessingResult
} from './data/payments';
import {
  mockReports,
  mockReportParameters,
  mockReportData
} from './data/reports';
import { mockDashboardData } from './data/dashboard';
import { mockSettings } from './data/settings';

/**
 * Helper function to find an item by ID in an array
 * @param items 
 * @param id 
 * @returns Found item or undefined
 */
const findById = <T extends { id: string }>(items: T[], id: string): T | undefined => {
  return items.find(item => item.id === id);
};

/**
 * Helper function to paginate an array of results
 * @param items 
 * @param params 
 * @returns Paginated results with metadata
 */
const paginateResults = <T>(items: T[], params: { page?: number; pageSize?: number }): { data: T[]; totalItems: number; page: number; pageSize: number; totalPages: number } => {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = items.slice(startIndex, endIndex);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return { data, totalItems, page, pageSize, totalPages };
};

/**
 * Helper function to filter results based on query parameters
 * @param items 
 * @param filters 
 * @returns Filtered array of items
 */
const filterResults = <T>(items: T[], filters: Record<string, any>): T[] => {
  if (!filters || Object.keys(filters).length === 0) {
    return items;
  }

  return items.filter(item => {
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        const filterValue = filters[key];
        if (filterValue && item[key] !== filterValue) {
          return false;
        }
      }
    }
    return true;
  });
};

/**
 * Helper function to simulate network delay
 * @param ms 
 * @returns Promise that resolves after the specified delay
 */
const delay = (ms?: number): Promise<void> => {
  const randomDelay = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
  const actualDelay = ms !== undefined ? ms : randomDelay;
  return new Promise(resolve => setTimeout(resolve, actualDelay));
};

/**
 * Array of request handlers for MSW to intercept and mock API requests
 */
export const handlers = [
  // Authentication Handlers
  rest.post(API_ENDPOINTS.AUTH.LOGIN, async (req, res, ctx) => {
    await delay();
    const { email, password } = await req.json() as any;

    if (email === 'admin@thinkcaring.com' && password === 'password') {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockLoginResponse)
      );
    } else if (email === 'mfa@thinkcaring.com' && password === 'password') {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockMfaRequiredResponse)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.UNAUTHORIZED),
        ctx.json(mockLoginErrorResponse)
      );
    }
  }),
  rest.post(API_ENDPOINTS.AUTH.LOGOUT, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ success: true })
    );
  }),
  rest.post(API_ENDPOINTS.AUTH.REFRESH, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ accessToken: 'new-mock-access-token' })
    );
  }),
  rest.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockPasswordResetResponse)
    );
  }),
  rest.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ success: true })
    );
  }),
  rest.post(API_ENDPOINTS.AUTH.MFA_VERIFY, async (req, res, ctx) => {
    await delay();
    const { code } = await req.json() as any;

    if (code === '123456') {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockLoginResponse)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.BAD_REQUEST),
        ctx.json({ message: 'Invalid MFA code' })
      );
    }
  }),

  // User Handlers
  rest.get(API_ENDPOINTS.USERS.BASE, async (req, res, ctx) => {
    await delay();
    const { searchParams } = req.url;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const searchTerm = searchParams.get('search') || '';

    let filteredUsers = mockUsers;
    if (searchTerm) {
      filteredUsers = mockUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const paginatedResults = paginateResults(filteredUsers, { page, pageSize });

    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({
        items: paginatedResults.data,
        totalItems: paginatedResults.totalItems,
        page: paginatedResults.page,
        pageSize: paginatedResults.pageSize,
        totalPages: paginatedResults.totalPages
      })
    );
  }),
  rest.get(API_ENDPOINTS.USERS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const user = findById(mockUsers, id as string);

    if (user) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(user)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'User not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.USERS.BASE, async (req, res, ctx) => {
    await delay();
    const newUser = await req.json();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(newUser)
    );
  }),
  rest.put(API_ENDPOINTS.USERS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const updatedUser = await req.json();
    const userIndex = mockUsers.findIndex(user => user.id === id);

    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updatedUser };
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockUsers[userIndex])
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'User not found' })
      );
    }
  }),
  rest.delete(API_ENDPOINTS.USERS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const userIndex = mockUsers.findIndex(user => user.id === id);

    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return res(
        ctx.status(API_RESPONSE_CODES.NO_CONTENT)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'User not found' })
      );
    }
  }),

  // Client Handlers
  rest.get(API_ENDPOINTS.CLIENTS.BASE, async (req, res, ctx) => {
    await delay();
    const { searchParams } = req.url;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const searchTerm = searchParams.get('search') || '';

    let filteredClients = mockClients;
    if (searchTerm) {
      filteredClients = mockClients.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const paginatedResults = paginateResults(filteredClients, { page, pageSize });

    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({
        items: paginatedResults.data,
        totalItems: paginatedResults.totalItems,
        page: paginatedResults.page,
        pageSize: paginatedResults.pageSize,
        totalPages: paginatedResults.totalPages
      })
    );
  }),
  rest.get(API_ENDPOINTS.CLIENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const client = findById(mockClients, id as string);

    if (client) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(client)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Client not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.CLIENTS.BASE, async (req, res, ctx) => {
    await delay();
    const newClient = await req.json();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(newClient)
    );
  }),
  rest.put(API_ENDPOINTS.CLIENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const updatedClient = await req.json();
    const clientIndex = mockClients.findIndex(client => client.id === id);

    if (clientIndex !== -1) {
      mockClients[clientIndex] = { ...mockClients[clientIndex], ...updatedClient };
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockClients[clientIndex])
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Client not found' })
      );
    }
  }),
  rest.delete(API_ENDPOINTS.CLIENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const clientIndex = mockClients.findIndex(client => client.id === id);

    if (clientIndex !== -1) {
      mockClients.splice(clientIndex, 1);
      return res(
        ctx.status(API_RESPONSE_CODES.NO_CONTENT)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Client not found' })
      );
    }
  }),

  // Service Handlers
  rest.get(API_ENDPOINTS.SERVICES.BASE, async (req, res, ctx) => {
    await delay();
    const { searchParams } = req.url;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const searchTerm = searchParams.get('search') || '';

    let filteredServices = mockServices;
    if (searchTerm) {
      filteredServices = mockServices.filter(service =>
        service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const paginatedResults = paginateResults(filteredServices, { page, pageSize });

    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({
        items: paginatedResults.data,
        totalItems: paginatedResults.totalItems,
        page: paginatedResults.page,
        pageSize: paginatedResults.pageSize,
        totalPages: paginatedResults.totalPages
      })
    );
  }),
  rest.get(API_ENDPOINTS.SERVICES.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const service = findById(mockServices, id as string);

    if (service) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(service)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Service not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.SERVICES.BASE, async (req, res, ctx) => {
    await delay();
    const newService = await req.json();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(newService)
    );
  }),
  rest.put(API_ENDPOINTS.SERVICES.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const updatedService = await req.json();
    const serviceIndex = mockServices.findIndex(service => service.id === id);

    if (serviceIndex !== -1) {
      mockServices[serviceIndex] = { ...mockServices[serviceIndex], ...updatedService };
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockServices[serviceIndex])
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Service not found' })
      );
    }
  }),
  rest.delete(API_ENDPOINTS.SERVICES.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const serviceIndex = mockServices.findIndex(service => service.id === id);

    if (serviceIndex !== -1) {
      mockServices.splice(serviceIndex, 1);
      return res(
        ctx.status(API_RESPONSE_CODES.NO_CONTENT)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Service not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.SERVICES.VALIDATE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockServiceValidationResponse)
    );
  }),

  // Claim Handlers
  rest.get(API_ENDPOINTS.CLAIMS.BASE, async (req, res, ctx) => {
    await delay();
    const { searchParams } = req.url;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const searchTerm = searchParams.get('search') || '';

    let filteredClaims = mockClaims;
    if (searchTerm) {
      filteredClaims = mockClaims.filter(claim =>
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const paginatedResults = paginateResults(filteredClaims, { page, pageSize });

    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({
        items: paginatedResults.data,
        totalItems: paginatedResults.totalItems,
        page: paginatedResults.page,
        pageSize: paginatedResults.pageSize,
        totalPages: paginatedResults.totalPages
      })
    );
  }),
  rest.get(API_ENDPOINTS.CLAIMS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const claim = findById(mockClaims, id as string);

    if (claim) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(claim)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Claim not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.CLAIMS.BASE, async (req, res, ctx) => {
    await delay();
    const newClaim = await req.json();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(newClaim)
    );
  }),
  rest.put(API_ENDPOINTS.CLAIMS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const updatedClaim = await req.json();
    const claimIndex = mockClaims.findIndex(claim => claim.id === id);

    if (claimIndex !== -1) {
      mockClaims[claimIndex] = { ...mockClaims[claimIndex], ...updatedClaim };
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockClaims[claimIndex])
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Claim not found' })
      );
    }
  }),
  rest.delete(API_ENDPOINTS.CLAIMS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const claimIndex = mockClaims.findIndex(claim => claim.id === id);

    if (claimIndex !== -1) {
      mockClaims.splice(claimIndex, 1);
      return res(
        ctx.status(API_RESPONSE_CODES.NO_CONTENT)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Claim not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.CLAIMS.VALIDATE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockClaimValidationResponse)
    );
  }),
  rest.post(API_ENDPOINTS.CLAIMS.SUBMIT, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockClaimBatchResult)
    );
  }),
  rest.get(API_ENDPOINTS.CLAIMS.STATUS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockClaimMetrics)
    );
  }),

  // Billing Handlers
  rest.get(API_ENDPOINTS.BILLING.QUEUE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockServices)
    );
  }),
  rest.post(API_ENDPOINTS.BILLING.VALIDATION, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockServiceValidationResponse)
    );
  }),
  rest.post(API_ENDPOINTS.BILLING.CREATE_CLAIM, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(mockClaims)
    );
  }),
  rest.post(API_ENDPOINTS.BILLING.SUBMISSION, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockClaimBatchResult)
    );
  }),

  // Payment Handlers
  rest.get(API_ENDPOINTS.PAYMENTS.BASE, async (req, res, ctx) => {
    await delay();
    const { searchParams } = req.url;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const searchTerm = searchParams.get('search') || '';

    let filteredPayments = mockPayments;
    if (searchTerm) {
      filteredPayments = mockPayments.filter(payment =>
        payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const paginatedResults = paginateResults(filteredPayments, { page, pageSize });

    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({
        items: paginatedResults.data,
        totalItems: paginatedResults.totalItems,
        page: paginatedResults.page,
        pageSize: paginatedResults.pageSize,
        totalPages: paginatedResults.totalPages
      })
    );
  }),
  rest.get(API_ENDPOINTS.PAYMENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const payment = findById(mockPayments, id as string);

    if (payment) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(payment)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Payment not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.PAYMENTS.BASE, async (req, res, ctx) => {
    await delay();
    const newPayment = await req.json();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(newPayment)
    );
  }),
  rest.put(API_ENDPOINTS.PAYMENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const updatedPayment = await req.json();
    const paymentIndex = mockPayments.findIndex(payment => payment.id === id);

    if (paymentIndex !== -1) {
      mockPayments[paymentIndex] = { ...mockPayments[paymentIndex], ...updatedPayment };
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(mockPayments[paymentIndex])
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Payment not found' })
      );
    }
  }),
  rest.delete(API_ENDPOINTS.PAYMENTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const paymentIndex = mockPayments.findIndex(payment => payment.id === id);

    if (paymentIndex !== -1) {
      mockPayments.splice(paymentIndex, 1);
      return res(
        ctx.status(API_RESPONSE_CODES.NO_CONTENT)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Payment not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.PAYMENTS.REMITTANCE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockRemittanceProcessingResult)
    );
  }),
  rest.post(API_ENDPOINTS.PAYMENTS.RECONCILE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ success: true })
    );
  }),

  // Report Handlers
  rest.get(API_ENDPOINTS.REPORTS.BASE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockReports)
    );
  }),
  rest.get(API_ENDPOINTS.REPORTS.DETAIL, async (req, res, ctx) => {
    await delay();
    const { id } = req.params;
    const report = findById(mockReports, id as string);

    if (report) {
      return res(
        ctx.status(API_RESPONSE_CODES.OK),
        ctx.json(report)
      );
    } else {
      return res(
        ctx.status(API_RESPONSE_CODES.NOT_FOUND),
        ctx.json({ message: 'Report not found' })
      );
    }
  }),
  rest.post(API_ENDPOINTS.REPORTS.GENERATE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json(mockReportData)
    );
  }),
  rest.post(API_ENDPOINTS.REPORTS.SCHEDULE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.CREATED),
      ctx.json({ success: true })
    );
  }),
  rest.get(API_ENDPOINTS.REPORTS.EXPORT, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ success: true })
    );
  }),

  // Dashboard Handlers
  rest.get(API_ENDPOINTS.DASHBOARD.METRICS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockDashboardData)
    );
  }),
  rest.get(API_ENDPOINTS.DASHBOARD.REVENUE, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockDashboardData.revenue)
    );
  }),
  rest.get(API_ENDPOINTS.DASHBOARD.CLAIMS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockDashboardData.claims)
    );
  }),
  rest.get(API_ENDPOINTS.DASHBOARD.ALERTS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockDashboardData.alerts)
    );
  }),

  // Settings Handlers
  rest.get(API_ENDPOINTS.SETTINGS.ORGANIZATION, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),
  rest.put(API_ENDPOINTS.SETTINGS.ORGANIZATION, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),
  rest.get(API_ENDPOINTS.SETTINGS.PROGRAMS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),
  rest.get(API_ENDPOINTS.SETTINGS.PAYERS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),
  rest.get(API_ENDPOINTS.SETTINGS.SERVICE_CODES, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),
  rest.get(API_ENDPOINTS.SETTINGS.INTEGRATIONS, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json(mockSettings)
    );
  }),

  // Health Check Handler
  rest.get(API_ENDPOINTS.HEALTH.CHECK, async (req, res, ctx) => {
    await delay();
    return res(
      ctx.status(API_RESPONSE_CODES.OK),
      ctx.json({ status: 'OK' })
    );
  })
];