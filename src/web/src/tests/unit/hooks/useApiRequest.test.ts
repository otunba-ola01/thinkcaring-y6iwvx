import { renderHook, act, waitFor } from '@testing-library/react'; // @testing-library/react v13.4+
import { useApiRequest } from '../../../hooks/useApiRequest';
import { apiClient } from '../../../api/client';
import renderHookWithProviders from '../../utils/render-hook';
import { mockApiResponse, mockApiErrorResponse, mockNetworkError } from '../../utils/mock-api';
import { HttpMethod, ApiRequestOptions } from '../../../types/api.types';

// Mock apiClient methods
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

describe('useApiRequest', () => {
  beforeEach(() => {
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.put as jest.Mock).mockReset();
    (apiClient.patch as jest.Mock).mockReset();
    (apiClient.del as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHookWithProviders(() => useApiRequest());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful GET request', async () => {
    const mockData = { message: 'Success' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith(options.url, undefined, undefined);
  });

  it('should handle successful POST request', async () => {
    const mockData = { message: 'Success' };
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.POST,
    };

    const payload = { key: 'value' };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute(payload);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.post).toHaveBeenCalledWith(options.url, payload, undefined);
  });

  it('should handle successful PUT request', async () => {
    const mockData = { message: 'Success' };
    (apiClient.put as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.PUT,
    };

    const payload = { key: 'value' };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute(payload);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.put).toHaveBeenCalledWith(options.url, payload, undefined);
  });

  it('should handle successful PATCH request', async () => {
    const mockData = { message: 'Success' };
    (apiClient.patch as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.PATCH,
    };

    const payload = { key: 'value' };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute(payload);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.patch).toHaveBeenCalledWith(options.url, payload, undefined);
  });

  it('should handle successful DELETE request', async () => {
    const mockData = { message: 'Success' };
    (apiClient.del as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.DELETE,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.del).toHaveBeenCalledWith(options.url, undefined);
  });

  it('should handle API error response', async () => {
    const mockError = mockApiErrorResponse('API Error', 500);
    (apiClient.get as jest.Mock).mockRejectedValue(mockError);

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError.error);
    expect(apiClient.get).toHaveBeenCalledWith(options.url, undefined, undefined);
  });

  it('should handle network error', async () => {
    const mockError = mockNetworkError('Network Error');
    (apiClient.get as jest.Mock).mockRejectedValue(mockError);

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual({
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      details: null
    });
    expect(apiClient.get).toHaveBeenCalledWith(options.url, undefined, undefined);
  });

  it('should reset data and error states', async () => {
    const mockData = { message: 'Success' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => expect(result.current.data).toEqual(mockData));

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle immediate execution with options', async () => {
    const mockData = { message: 'Success' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
      immediate: true,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    expect(apiClient.get).toHaveBeenCalledWith(options.url, undefined, undefined);

    await waitFor(() => expect(result.current.data).toEqual(mockData));
  });

  it('should handle retry on failure', async () => {
    const mockError = mockApiErrorResponse('API Error', 500);
    const mockData = { message: 'Success' };
    (apiClient.get as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockApiResponse(mockData));

    const options: ApiRequestOptions = {
      url: '/test',
      method: HttpMethod.GET,
      retry: 1,
    };

    const { result } = renderHookWithProviders(() => useApiRequest(options));

    act(() => {
      result.current.execute();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.data).toEqual(mockData));

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });
});