import { useState, useEffect, useCallback, useMemo } from 'react'; // react v18.2+
import { 
  Client, 
  ClientSummary, 
  ClientQueryParams, 
  ClientListResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientProgram,
  ClientInsurance,
  CreateClientProgramDto,
  UpdateClientProgramDto,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
  ClientStatus
} from '../types/clients.types';
import { UUID, PaginationMeta, LoadingState, StatusType } from '../types/common.types';
import useApiRequest from './useApiRequest';
import useFilter from './useFilter';
import { 
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,
  addClientProgram,
  updateClientProgram,
  removeClientProgram,
  addClientInsurance,
  updateClientInsurance,
  removeClientInsurance,
  fetchClientServices,
  fetchClientClaims,
  fetchClientAuthorizations
} from '../api/clients.api';
import useToast from './useToast';
import { FilterConfig, FilterType } from '../types/ui.types';
import { FilterOperator } from '../types/common.types';

/**
 * Options for the useClients hook
 */
export interface UseClientsOptions {
  /**
   * Initial filter values for client queries
   */
  initialFilters?: Partial<ClientQueryParams>;
  
  /**
   * Whether to automatically load clients when the hook is initialized
   * @default true
   */
  autoLoad?: boolean;
}

/**
 * Return type for the useClients hook
 */
export interface UseClientsResult {
  // State
  clients: ClientSummary[];
  selectedClient: Client | null;
  pagination: PaginationMeta;
  loading: LoadingState;
  error: string | null;
  filters: ClientQueryParams;
  
  // Data operations
  fetchClientsList: () => Promise<void>;
  getClientById: (id: UUID) => Promise<Client | null>;
  addClient: (client: CreateClientDto) => Promise<Client | null>;
  editClient: (id: UUID, client: UpdateClientDto) => Promise<Client | null>;
  removeClient: (id: UUID) => Promise<boolean>;
  
  // Program operations
  addProgram: (clientId: UUID, program: CreateClientProgramDto) => Promise<ClientProgram | null>;
  updateProgram: (clientId: UUID, programId: UUID, program: UpdateClientProgramDto) => Promise<ClientProgram | null>;
  removeProgram: (clientId: UUID, programId: UUID) => Promise<boolean>;
  
  // Insurance operations
  addInsurance: (clientId: UUID, insurance: CreateClientInsuranceDto) => Promise<ClientInsurance | null>;
  updateInsurance: (clientId: UUID, insuranceId: UUID, insurance: UpdateClientInsuranceDto) => Promise<ClientInsurance | null>;
  removeInsurance: (clientId: UUID, insuranceId: UUID) => Promise<boolean>;
  
  // Related data operations
  getClientServices: (clientId: UUID, params?: object) => Promise<any>;
  getClientClaims: (clientId: UUID, params?: object) => Promise<any>;
  getClientAuthorizations: (clientId: UUID, params?: object) => Promise<any>;
  
  // Filter operations
  handleSearchChange: (search: string) => void;
  handleStatusChange: (status: ClientStatus | undefined) => void;
  handleProgramChange: (programId: UUID | undefined) => void;
  
  // Pagination operations
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  handleSortChange: (field: string, direction: 'asc' | 'desc') => void;
  
  // Misc
  clearFilters: () => void;
}

/**
 * Interface for client filter form values
 */
export interface ClientFilterValues {
  search: string | undefined;
  status: ClientStatus | undefined;
  programId: UUID | undefined;
}

/**
 * Creates filter configurations for client filtering
 * @returns Array of filter configurations
 */
function getFilterConfigs(): FilterConfig[] {
  return [
    {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'search',
      operator: FilterOperator.CONTAINS,
      placeholder: 'Search by name, ID or Medicaid ID'
    },
    {
      id: 'status',
      label: 'Status',
      type: FilterType.SELECT,
      field: 'status',
      operator: FilterOperator.EQUALS,
      options: Object.values(ClientStatus).map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      }))
    },
    {
      id: 'programId',
      label: 'Program',
      type: FilterType.SELECT,
      field: 'programId',
      operator: FilterOperator.EQUALS
      // Program options would be loaded dynamically from API
    }
  ];
}

/**
 * Custom React hook that provides client management functionality for the HCBS Revenue Management System.
 * This hook manages client data fetching, filtering, creation, updating, and deletion, providing a unified
 * interface for client-related components to interact with the client API and manage state.
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing client state and operations
 */
const useClients = (options: UseClientsOptions = {}): UseClientsResult => {
  const { initialFilters = {}, autoLoad = true } = options;
  
  // Client state
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Setup filters with useFilter hook
  const { 
    filters, 
    setFilter,
    clearAllFilters,
  } = useFilter({
    filterConfigs: getFilterConfigs(),
    initialFilters: {
      search: '',
      status: ClientStatus.ACTIVE,
      programId: undefined,
      page: 1,
      pageSize: 10,
      sortField: 'lastName',
      sortDirection: 'asc',
      ...initialFilters
    }
  });
  
  // Toast notifications
  const toast = useToast();
  
  // Fetch clients list with current filters
  const fetchClientsList = useCallback(async () => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await fetchClients(filters as ClientQueryParams);
      const { items, page, pageSize, totalItems, totalPages } = response.data;
      
      setClients(items);
      setPagination({
        page,
        pageSize,
        totalItems,
        totalPages
      });
      setLoading(LoadingState.LOADED);
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to fetch clients';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
    }
  }, [filters, toast]);
  
  // Get client by ID
  const getClientById = useCallback(async (id: UUID): Promise<Client | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await fetchClientById(id);
      const client = response.data;
      setSelectedClient(client);
      setLoading(LoadingState.LOADED);
      return client;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to fetch client details';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [toast]);
  
  // Add new client
  const addClient = useCallback(async (client: CreateClientDto): Promise<Client | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await createClient(client);
      const newClient = response.data;
      toast.success('Client created successfully');
      setLoading(LoadingState.LOADED);
      // Refresh client list
      fetchClientsList();
      return newClient;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to create client';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [fetchClientsList, toast]);
  
  // Edit client
  const editClient = useCallback(async (id: UUID, client: UpdateClientDto): Promise<Client | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await updateClient(id, client);
      const updatedClient = response.data;
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient(updatedClient);
      }
      
      toast.success('Client updated successfully');
      setLoading(LoadingState.LOADED);
      
      // Refresh client list
      fetchClientsList();
      return updatedClient;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to update client';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [fetchClientsList, selectedClient, toast]);
  
  // Remove client
  const removeClient = useCallback(async (id: UUID): Promise<boolean> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      await deleteClient(id);
      
      // Clear selected client if it's the same one
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient(null);
      }
      
      toast.success('Client deleted successfully');
      setLoading(LoadingState.LOADED);
      
      // Refresh client list
      fetchClientsList();
      return true;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to delete client';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return false;
    }
  }, [fetchClientsList, selectedClient, toast]);
  
  // Add program to client
  const addProgram = useCallback(async (
    clientId: UUID, 
    program: CreateClientProgramDto
  ): Promise<ClientProgram | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await addClientProgram(clientId, program);
      const newProgram = response.data;
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({
          ...selectedClient,
          programs: [...selectedClient.programs, newProgram]
        });
      }
      
      toast.success('Program added successfully');
      setLoading(LoadingState.LOADED);
      return newProgram;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to add program';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [selectedClient, toast]);
  
  // Update client program
  const updateProgram = useCallback(async (
    clientId: UUID,
    programId: UUID,
    program: UpdateClientProgramDto
  ): Promise<ClientProgram | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await updateClientProgram(clientId, programId, program);
      const updatedProgram = response.data;
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        const updatedPrograms = selectedClient.programs.map(p => 
          p.id === programId ? updatedProgram : p
        );
        setSelectedClient({
          ...selectedClient,
          programs: updatedPrograms
        });
      }
      
      toast.success('Program updated successfully');
      setLoading(LoadingState.LOADED);
      return updatedProgram;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to update program';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [selectedClient, toast]);
  
  // Remove client program
  const removeProgram = useCallback(async (
    clientId: UUID,
    programId: UUID
  ): Promise<boolean> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      await removeClientProgram(clientId, programId);
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        const filteredPrograms = selectedClient.programs.filter(p => p.id !== programId);
        setSelectedClient({
          ...selectedClient,
          programs: filteredPrograms
        });
      }
      
      toast.success('Program removed successfully');
      setLoading(LoadingState.LOADED);
      return true;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to remove program';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return false;
    }
  }, [selectedClient, toast]);
  
  // Add insurance to client
  const addInsurance = useCallback(async (
    clientId: UUID,
    insurance: CreateClientInsuranceDto
  ): Promise<ClientInsurance | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await addClientInsurance(clientId, insurance);
      const newInsurance = response.data;
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({
          ...selectedClient,
          insurances: [...selectedClient.insurances, newInsurance]
        });
      }
      
      toast.success('Insurance added successfully');
      setLoading(LoadingState.LOADED);
      return newInsurance;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to add insurance';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [selectedClient, toast]);
  
  // Update client insurance
  const updateInsurance = useCallback(async (
    clientId: UUID,
    insuranceId: UUID,
    insurance: UpdateClientInsuranceDto
  ): Promise<ClientInsurance | null> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await updateClientInsurance(clientId, insuranceId, insurance);
      const updatedInsurance = response.data;
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        const updatedInsurances = selectedClient.insurances.map(i => 
          i.id === insuranceId ? updatedInsurance : i
        );
        setSelectedClient({
          ...selectedClient,
          insurances: updatedInsurances
        });
      }
      
      toast.success('Insurance updated successfully');
      setLoading(LoadingState.LOADED);
      return updatedInsurance;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to update insurance';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [selectedClient, toast]);
  
  // Remove client insurance
  const removeInsurance = useCallback(async (
    clientId: UUID,
    insuranceId: UUID
  ): Promise<boolean> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      await removeClientInsurance(clientId, insuranceId);
      
      // Update selected client if it's the same one
      if (selectedClient && selectedClient.id === clientId) {
        const filteredInsurances = selectedClient.insurances.filter(i => i.id !== insuranceId);
        setSelectedClient({
          ...selectedClient,
          insurances: filteredInsurances
        });
      }
      
      toast.success('Insurance removed successfully');
      setLoading(LoadingState.LOADED);
      return true;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to remove insurance';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return false;
    }
  }, [selectedClient, toast]);
  
  // Get client services
  const getClientServices = useCallback(async (
    clientId: UUID,
    params: object = {}
  ): Promise<any> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await fetchClientServices(clientId, params);
      setLoading(LoadingState.LOADED);
      return response.data;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to fetch client services';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [toast]);
  
  // Get client claims
  const getClientClaims = useCallback(async (
    clientId: UUID,
    params: object = {}
  ): Promise<any> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await fetchClientClaims(clientId, params);
      setLoading(LoadingState.LOADED);
      return response.data;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to fetch client claims';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [toast]);
  
  // Get client authorizations
  const getClientAuthorizations = useCallback(async (
    clientId: UUID,
    params: object = {}
  ): Promise<any> => {
    setLoading(LoadingState.LOADING);
    setError(null);
    
    try {
      const response = await fetchClientAuthorizations(clientId, params);
      setLoading(LoadingState.LOADED);
      return response.data;
    } catch (err) {
      const errorMessage = err.error?.message || 'Failed to fetch client authorizations';
      setError(errorMessage);
      setLoading(LoadingState.ERROR);
      toast.error(errorMessage);
      return null;
    }
  }, [toast]);
  
  // Filter handlers
  const handleSearchChange = useCallback((search: string) => {
    setFilter('search', search);
  }, [setFilter]);
  
  const handleStatusChange = useCallback((status: ClientStatus | undefined) => {
    setFilter('status', status);
  }, [setFilter]);
  
  const handleProgramChange = useCallback((programId: UUID | undefined) => {
    setFilter('programId', programId);
  }, [setFilter]);
  
  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setFilter('page', page);
  }, [setFilter]);
  
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilter('pageSize', pageSize);
  }, [setFilter]);
  
  // Sorting handler
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setFilter('sortField', field);
    setFilter('sortDirection', direction);
  }, [setFilter]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);
  
  // Initial data fetch
  useEffect(() => {
    if (autoLoad) {
      fetchClientsList();
    }
  }, [autoLoad, fetchClientsList]);
  
  // Fetch when filters change
  useEffect(() => {
    fetchClientsList();
  }, [
    filters.page, 
    filters.pageSize, 
    filters.sortField, 
    filters.sortDirection,
    filters.search,
    filters.status,
    filters.programId,
    fetchClientsList
  ]);
  
  return {
    // State
    clients,
    selectedClient,
    pagination,
    loading,
    error,
    filters: filters as ClientQueryParams,
    
    // Data operations
    fetchClientsList,
    getClientById,
    addClient,
    editClient,
    removeClient,
    
    // Program operations
    addProgram,
    updateProgram,
    removeProgram,
    
    // Insurance operations
    addInsurance,
    updateInsurance,
    removeInsurance,
    
    // Related data operations
    getClientServices,
    getClientClaims,
    getClientAuthorizations,
    
    // Filter operations
    handleSearchChange,
    handleStatusChange,
    handleProgramChange,
    
    // Pagination operations
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    
    // Misc
    clearFilters
  };
};

export default useClients;