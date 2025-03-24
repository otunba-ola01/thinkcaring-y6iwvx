import { useState, useCallback, useEffect, useMemo } from 'react'; // react v18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux v8.1.2

import useApiRequest from './useApiRequest';
import useToast from './useToast';
import {
  ReportType,
  ReportParameters,
  ReportFormat,
  ReportDefinition,
  ReportInstance,
  ReportData,
  ScheduledReport,
  ScheduleReportRequest,
  GenerateReportRequest,
  GenerateReportResponse,
  GetReportListParams,
  FinancialMetric
} from '../types/reports.types';
import {
  UUID,
  PaginatedResponse,
  LoadingState
} from '../types/common.types';
import * as reportsApi from '../api/reports.api';
import {
  fetchReportDefinitions,
  fetchReportDefinition,
  createReportDefinition,
  updateReportDefinition,
  deleteReportDefinition,
  generateReport,
  generateReportFromDefinition,
  fetchReportInstances,
  fetchReportInstance,
  fetchReportData,
  exportReport as exportReportFile,
  deleteReportInstance as deleteExistingReportInstance,
  fetchScheduledReports,
  fetchScheduledReport,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  executeScheduledReport as executeScheduledReportNow,
  fetchFinancialMetrics
} from '../store/reports/reportsThunks';
import { resetReportsState } from '../store/reports/reportsSlice';
import {
  selectReportDefinitions,
  selectCurrentReportDefinition,
  selectReportDefinitionsByType,
  selectReportInstances,
  selectCurrentReportInstance,
  selectCurrentReportData,
  selectScheduledReports,
  selectCurrentScheduledReport,
  selectScheduledReportsByType,
  selectFinancialMetrics,
  selectFinancialMetricByName,
  selectIsGeneratingReport,
  selectGenerationResponse,
  selectGenerationError,
  selectIsReportsLoading,
  selectReportsError,
  selectReportParameters
} from '../store/reports/reportsSelectors';
import usePagination from './usePagination';

/**
 * Interface for options passed to useReports hook
 */
export interface UseReportsOptions {
  initialPage?: number;
  initialPageSize?: number;
  autoFetch?: boolean;
  reportType?: ReportType | undefined;
}

/**
 * Interface for the result returned by useReports hook
 */
export interface UseReportsResult {
  reportDefinitions: ReportDefinition[];
  currentReportDefinition: ReportDefinition | null;
  reportInstances: PaginatedResponse<ReportInstance>;
  currentReportInstance: ReportInstance | null;
  currentReportData: ReportData | null;
  scheduledReports: ScheduledReport[];
  currentScheduledReport: ScheduledReport | null;
  financialMetrics: FinancialMetric[];
  isGeneratingReport: boolean;
  generationResponse: GenerateReportResponse | null;
  generationError: string | null;
  isLoading: boolean;
  error: string | null;
  paginationState: PaginationState;

  getReportDefinitions: (params?: object) => Promise<ReportDefinition[]>;
  getReportDefinition: (id: UUID) => Promise<ReportDefinition | null>;
  createReportDefinition: (data: Partial<ReportDefinition>) => Promise<ReportDefinition | null>;
  updateReportDefinition: (id: UUID, data: Partial<ReportDefinition>) => Promise<ReportDefinition | null>;
  deleteReportDefinition: (id: UUID) => Promise<void>;
  generateReport: (request: GenerateReportRequest) => Promise<GenerateReportResponse | null>;
  generateReportFromDefinition: (definitionId: UUID, parameters?: ReportParameters, formats?: ReportFormat[]) => Promise<GenerateReportResponse | null>;
  getReportInstances: (params: GetReportListParams) => Promise<PaginatedResponse<ReportInstance>>;
  getReportInstance: (id: UUID) => Promise<ReportInstance | null>;
  getReportData: (id: UUID) => Promise<ReportData | null>;
  exportReport: (id: UUID, format: ReportFormat) => Promise<Blob | null>;
  deleteReportInstance: (id: UUID) => Promise<void>;
  getScheduledReports: (params?: object) => Promise<ScheduledReport[]>;
  getScheduledReport: (id: UUID) => Promise<ScheduledReport | null>;
  createScheduledReport: (request: ScheduleReportRequest) => Promise<ScheduledReport | null>;
  updateScheduledReport: (id: UUID, request: Partial<ScheduleReportRequest>) => Promise<ScheduledReport | null>;
  deleteScheduledReport: (id: UUID) => Promise<void>;
  executeScheduledReport: (id: UUID) => Promise<GenerateReportResponse | null>;
  getFinancialMetrics: (params?: object) => Promise<FinancialMetric[]>;
  getFinancialMetricByName: (metricName: string) => FinancialMetric | undefined;
  resetState: () => void;
}

/**
 * A custom hook that provides comprehensive functionality for managing reports
 * @param options - Configuration options for the hook
 * @returns An object containing report state and operations
 */
const useReports = (options: UseReportsOptions = {}): UseReportsResult => {
  // Initialize Redux dispatch and selector hooks
  const dispatch = useDispatch();
  const reportDefinitions = useSelector(selectReportDefinitions);
  const currentReportDefinition = useSelector(selectCurrentReportDefinition);
  const reportInstances = useSelector(selectReportInstances);
  const currentReportInstance = useSelector(selectCurrentReportInstance);
  const currentReportData = useSelector(selectCurrentReportData);
  const scheduledReports = useSelector(selectScheduledReports);
  const currentScheduledReport = useSelector(selectCurrentScheduledReport);
  const financialMetrics = useSelector(selectFinancialMetrics);
  const isGeneratingReport = useSelector(selectIsGeneratingReport);
  const generationResponse = useSelector(selectGenerationResponse);
  const generationError = useSelector(selectGenerationError);
  const isLoading = useSelector(selectIsReportsLoading);
  const error = useSelector(selectReportsError);
  const reportParameters = useSelector(selectReportParameters);

  // Initialize pagination state using usePagination hook
  const paginationState = usePagination({
    initialPage: options.initialPage,
    initialPageSize: options.initialPageSize
  });

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Set up API request hooks for direct API operations not handled by Redux
  const { execute: executeExportReport } = useApiRequest<Blob, { id: UUID; format: ReportFormat }>();

  /**
   * Define getReportDefinitions function to dispatch fetchReportDefinitions thunk
   * @param params 
   * @returns 
   */
  const getReportDefinitions = useCallback(async (params?: object) => {
    try {
      // Dispatch the fetchReportDefinitions thunk with the provided parameters
      const result = await dispatch(fetchReportDefinitions(params) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching report definitions fails
      toast.error(`Failed to fetch report definitions: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getReportDefinition function to dispatch fetchReportDefinition thunk for a specific report definition
   * @param id 
   * @returns 
   */
  const getReportDefinition = useCallback(async (id: UUID) => {
    try {
      // Dispatch the fetchReportDefinition thunk with the provided ID
      const result = await dispatch(fetchReportDefinition(id) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching the report definition fails
      toast.error(`Failed to fetch report definition: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define createReportDefinition function to dispatch createNewReportDefinition thunk
   * @param data 
   * @returns 
   */
  const createReportDefinition = useCallback(async (data: Partial<ReportDefinition>) => {
    try {
      // Dispatch the createReportDefinition thunk with the provided data
      const result = await dispatch(createReportDefinition(data) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if creating the report definition fails
      toast.error(`Failed to create report definition: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define updateReportDefinition function to dispatch updateExistingReportDefinition thunk
   * @param id 
   * @param data 
   * @returns 
   */
  const updateReportDefinition = useCallback(async (id: UUID, data: Partial<ReportDefinition>) => {
    try {
      // Dispatch the updateReportDefinition thunk with the provided ID and data
      const result = await dispatch(updateReportDefinition({ id, reportDefinition: data }) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if updating the report definition fails
      toast.error(`Failed to update report definition: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define deleteReportDefinition function to dispatch deleteExistingReportDefinition thunk
   * @param id 
   * @returns 
   */
  const deleteReportDefinition = useCallback(async (id: UUID) => {
    try {
      // Dispatch the deleteReportDefinition thunk with the provided ID
      await dispatch(deleteReportDefinition(id) as any);
    } catch (e: any) {
      // Display an error toast if deleting the report definition fails
      toast.error(`Failed to delete report definition: ${e.message}`);
    }
  }, [dispatch, toast]);

  /**
   * Define generateReport function to dispatch generateNewReport thunk
   * @param request 
   * @returns 
   */
  const generateReport = useCallback(async (request: GenerateReportRequest) => {
    try {
      // Dispatch the generateReport thunk with the provided request
      const result = await dispatch(generateReport(request) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if generating the report fails
      toast.error(`Failed to generate report: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define generateReportFromDefinition function to dispatch generateReportFromDefinition thunk
   * @param definitionId 
   * @param parameters 
   * @returns 
   */
  const generateReportFromDefinition = useCallback(async (definitionId: UUID, parameters?: ReportParameters, formats?: ReportFormat[]) => {
    try {
      // Dispatch the generateReportFromDefinition thunk with the provided definition ID and parameters
      const result = await dispatch(generateReportFromDefinition({ definitionId, parameters }) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if generating the report from the definition fails
      toast.error(`Failed to generate report from definition: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getReportInstances function to dispatch fetchReportInstances thunk with pagination
   * @param params 
   * @returns 
   */
  const getReportInstances = useCallback(async (params: GetReportListParams) => {
    try {
      // Dispatch the fetchReportInstances thunk with the provided parameters
      const result = await dispatch(fetchReportInstances(params) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching report instances fails
      toast.error(`Failed to fetch report instances: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getReportInstance function to dispatch fetchReportInstance thunk
   * @param id 
   * @returns 
   */
  const getReportInstance = useCallback(async (id: UUID) => {
    try {
      // Dispatch the fetchReportInstance thunk with the provided ID
      const result = await dispatch(fetchReportInstance(id) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching the report instance fails
      toast.error(`Failed to fetch report instance: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getReportData function to dispatch fetchReportData thunk
   * @param id 
   * @returns 
   */
  const getReportData = useCallback(async (id: UUID) => {
    try {
      // Dispatch the fetchReportData thunk with the provided ID
      const result = await dispatch(fetchReportData(id) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching the report data fails
      toast.error(`Failed to fetch report data: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define exportReport function to dispatch exportReportFile thunk
   * @param id 
   * @param format 
   * @returns 
   */
  const exportReport = useCallback(async (id: UUID, format: ReportFormat) => {
    try {
      // Call the executeExportReport function with the provided ID and format
      const fileName = `${currentReportDefinition?.name || 'report'}.${format}`;
      return await reportsApi.exportReport(id, format, fileName);
    } catch (e: any) {
      // Display an error toast if exporting the report fails
      toast.error(`Failed to export report: ${e.message}`);
      return null;
    }
  }, [currentReportDefinition, toast]);

  /**
   * Define deleteReportInstance function to dispatch deleteExistingReportInstance thunk
   * @param id 
   * @returns 
   */
  const deleteReportInstance = useCallback(async (id: UUID) => {
    try {
      // Dispatch the deleteReportInstance thunk with the provided ID
      await dispatch(deleteExistingReportInstance(id) as any);
    } catch (e: any) {
      // Display an error toast if deleting the report instance fails
      toast.error(`Failed to delete report instance: ${e.message}`);
    }
  }, [dispatch, toast]);

  /**
   * Define getScheduledReports function to dispatch fetchScheduledReports thunk
   * @param params 
   * @returns 
   */
  const getScheduledReports = useCallback(async (params?: object) => {
    try {
      // Dispatch the fetchScheduledReports thunk with the provided parameters
      const result = await dispatch(fetchScheduledReports(params) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching scheduled reports fails
      toast.error(`Failed to fetch scheduled reports: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getScheduledReport function to dispatch fetchScheduledReport thunk
   * @param id 
   * @returns 
   */
  const getScheduledReport = useCallback(async (id: UUID) => {
    try {
      // Dispatch the fetchScheduledReport thunk with the provided ID
      const result = await dispatch(fetchScheduledReport(id) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching the scheduled report fails
      toast.error(`Failed to fetch scheduled report: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define createScheduledReport function to dispatch createScheduledReport thunk
   * @param request 
   * @returns 
   */
  const createScheduledReport = useCallback(async (request: ScheduleReportRequest) => {
    try {
      // Dispatch the createScheduledReport thunk with the provided request
      const result = await dispatch(createScheduledReport(request) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if creating the scheduled report fails
      toast.error(`Failed to create scheduled report: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define updateScheduledReport function to dispatch updateExistingScheduledReport thunk
   * @param id 
   * @param request 
   * @returns 
   */
  const updateScheduledReport = useCallback(async (id: UUID, request: Partial<ScheduleReportRequest>) => {
    try {
      // Dispatch the updateScheduledReport thunk with the provided ID and request
      const result = await dispatch(updateScheduledReport({ id, request }) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if updating the scheduled report fails
      toast.error(`Failed to update scheduled report: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define deleteScheduledReport function to dispatch deleteExistingScheduledReport thunk
   * @param id 
   * @returns 
   */
  const deleteScheduledReport = useCallback(async (id: UUID) => {
    try {
      // Dispatch the deleteScheduledReport thunk with the provided ID
      await dispatch(deleteScheduledReport(id) as any);
    } catch (e: any) {
      // Display an error toast if deleting the scheduled report fails
      toast.error(`Failed to delete scheduled report: ${e.message}`);
    }
  }, [dispatch, toast]);

  /**
   * Define executeScheduledReport function to dispatch executeScheduledReportNow thunk
   * @param id 
   * @returns 
   */
  const executeScheduledReport = useCallback(async (id: UUID) => {
    try {
      // Dispatch the executeScheduledReport thunk with the provided ID
      const result = await dispatch(executeScheduledReportNow(id) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if executing the scheduled report fails
      toast.error(`Failed to execute scheduled report: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getFinancialMetrics function to dispatch fetchFinancialMetrics thunk
   * @param params 
   * @returns 
   */
  const getFinancialMetrics = useCallback(async (params?: object) => {
    try {
      // Dispatch the fetchFinancialMetrics thunk with the provided parameters
      const result = await dispatch(fetchFinancialMetrics(params) as any);
      return result.payload;
    } catch (e: any) {
      // Display an error toast if fetching financial metrics fails
      toast.error(`Failed to fetch financial metrics: ${e.message}`);
      return null;
    }
  }, [dispatch, toast]);

  /**
   * Define getFinancialMetricByName function to select a specific metric by name
   * @param metricName 
   * @returns 
   */
  const getFinancialMetricByName = useCallback((metricName: string) => {
    return financialMetrics?.find(metric => metric.name === metricName);
  }, [financialMetrics]);

  /**
   * Define resetState function to dispatch resetReportsState action
   */
  const resetState = useCallback(() => {
    dispatch(resetReportsState());
  }, [dispatch]);

  // Use useEffect to fetch report definitions when autoFetch is true
  useEffect(() => {
    if (options.autoFetch) {
      getReportDefinitions({ reportType: options.reportType });
    }
  }, [options.autoFetch, options.reportType, getReportDefinitions]);

  // Return reports state and operations in a structured object
  return {
    reportDefinitions,
    currentReportDefinition,
    reportInstances,
    currentReportInstance,
    currentReportData,
    scheduledReports,
    currentScheduledReport,
    financialMetrics,
    isGeneratingReport,
    generationResponse,
    generationError,
    isLoading,
    error,
    paginationState,

    getReportDefinitions,
    getReportDefinition,
    createReportDefinition,
    updateReportDefinition,
    deleteReportDefinition,
    generateReport,
    generateReportFromDefinition,
    getReportInstances,
    getReportInstance,
    getReportData,
    exportReport,
    deleteReportInstance,
    getScheduledReports,
    getScheduledReport,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    executeScheduledReport,
    getFinancialMetrics,
    getFinancialMetricByName,
    resetState
  };
};

export default useReports;