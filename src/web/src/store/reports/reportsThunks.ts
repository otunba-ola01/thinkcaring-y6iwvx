import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { Dispatch, AnyAction } from 'redux'; // v4.2+

import { 
  ReportDefinition, 
  ReportInstance, 
  ScheduledReport, 
  ReportParameters, 
  GenerateReportRequest, 
  ReportData, 
  FinancialMetric, 
  GetReportListParams, 
  ScheduleReportRequest,
  ReportFormat,
  GenerateReportResponse,
  UUID
} from '../../types/reports.types';
import { ApiResponse, ApiPaginatedResponse } from '../../types/api.types';
import { 
  reportsApi 
} from '../../api/reports.api';
import {
  setReportDefinitions,
  setReportDefinition,
  addReportDefinition,
  updateReportDefinition,
  removeReportDefinition,
  setReportInstances,
  setReportInstance,
  addReportInstance,
  updateReportInstance,
  removeReportInstance,
  setReportData,
  setScheduledReports,
  setScheduledReport,
  addScheduledReport,
  updateScheduledReport,
  removeScheduledReport,
  setFinancialMetrics,
  setReportGenerating,
  setReportGenerationResponse,
  setReportGenerationError,
  setReportsLoading,
  setReportsError
} from './reportsSlice';

/**
 * Type definition for Redux thunk actions with generic state
 */
export type AppThunk<ReturnType = void> = (
  dispatch: Dispatch<AnyAction>,
  getState: () => any
) => ReturnType;

/**
 * Thunk action to fetch report definitions with optional filtering
 * 
 * @param params - Query parameters for filtering
 * @returns Thunk action that returns a Promise<ReportDefinition[]>
 */
export const fetchReportDefinitions = createAsyncThunk<
  ReportDefinition[],
  GetReportListParams | undefined
>(
  'reports/fetchReportDefinitions',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getReportDefinitions with the provided parameters
      const response = await reportsApi.getReportDefinitions(params);

      // If successful, dispatch setReportDefinitions with the response data
      dispatch(setReportDefinitions(response.data.items));

      return response.data.items;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch a single report definition by ID
 * 
 * @param id - ID of the report definition to fetch
 * @returns Thunk action that returns a Promise<ReportDefinition>
 */
export const fetchReportDefinition = createAsyncThunk<
  ReportDefinition,
  UUID
>(
  'reports/fetchReportDefinition',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getReportDefinition with the provided ID
      const response = await reportsApi.getReportDefinition(id);

      // If successful, dispatch setReportDefinition with the response data
      dispatch(setReportDefinition(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to create a new report definition
 * 
 * @param reportDefinition - Data for the new report definition
 * @returns Thunk action that returns a Promise<ReportDefinition>
 */
export const createReportDefinition = createAsyncThunk<
  ReportDefinition,
  Partial<ReportDefinition>
>(
  'reports/createReportDefinition',
  async (reportDefinition, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.createReportDefinition with the provided report definition data
      const response = await reportsApi.createReportDefinition(reportDefinition);

      // If successful, dispatch addReportDefinition with the response data
      dispatch(addReportDefinition(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to update an existing report definition
 * 
 * @param params - Object containing the ID of the report definition and the updated data
 * @returns Thunk action that returns a Promise<ReportDefinition>
 */
export const updateReportDefinition = createAsyncThunk<
  ReportDefinition,
  { id: UUID; reportDefinition: Partial<ReportDefinition> }
>(
  'reports/updateReportDefinition',
  async (params, { dispatch, rejectWithValue }) => {
    // Destructure id and reportDefinition from the parameters
    const { id, reportDefinition } = params;

    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.updateReportDefinition with the id and reportDefinition
      const response = await reportsApi.updateReportDefinition(id, reportDefinition);

      // If successful, dispatch updateReportDefinition with the response data
      dispatch(updateReportDefinition(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to delete a report definition by ID
 * 
 * @param id - ID of the report definition to delete
 * @returns Thunk action that returns a Promise<void>
 */
export const deleteReportDefinition = createAsyncThunk<
  void,
  UUID
>(
  'reports/deleteReportDefinition',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.deleteReportDefinition with the provided ID
      await reportsApi.deleteReportDefinition(id);

      // If successful, dispatch removeReportDefinition with the ID
      dispatch(removeReportDefinition(id));
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to generate a new report based on provided parameters
 * 
 * @param request - Parameters for generating the report
 * @returns Thunk action that returns a Promise with the generation response
 */
export const generateReport = createAsyncThunk<
  GenerateReportResponse,
  GenerateReportRequest
>(
  'reports/generateReport',
  async (request, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportGenerating(true) to indicate generation in progress
      dispatch(setReportGenerating(true));

      // Call reportsApi.generateReport with the provided request
      const response = await reportsApi.generateReport(request);

      // If successful, dispatch setReportGenerationResponse with the response data
      dispatch(setReportGenerationResponse(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportGenerationError with the error message
      dispatch(setReportGenerationError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportGenerating(false) to end generation state
      dispatch(setReportGenerating(false));
    }
  }
);

/**
 * Thunk action to generate a report based on an existing definition
 * 
 * @param params - Object containing the definition ID and parameters for generating the report
 * @returns Thunk action that returns a Promise with the generation response
 */
export const generateReportFromDefinition = createAsyncThunk<
  GenerateReportResponse,
  { definitionId: UUID; parameters: ReportParameters }
>(
  'reports/generateReportFromDefinition',
  async (params, { dispatch, rejectWithValue }) => {
    // Destructure definitionId and parameters from the parameters
    const { definitionId, parameters } = params;

    try {
      // Dispatch setReportGenerating(true) to indicate generation in progress
      dispatch(setReportGenerating(true));

      // Call reportsApi.generateReportFromDefinition with the definitionId and parameters
      const response = await reportsApi.generateReportFromDefinition(definitionId, parameters);

      // If successful, dispatch setReportGenerationResponse with the response data
      dispatch(setReportGenerationResponse(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportGenerationError with the error message
      dispatch(setReportGenerationError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportGenerating(false) to end generation state
      dispatch(setReportGenerating(false));
    }
  }
);

/**
 * Thunk action to fetch report instances with optional filtering
 * 
 * @param params - Query parameters for filtering
 * @returns Thunk action that returns a Promise with paginated report instances
 */
export const fetchReportInstances = createAsyncThunk<
  PaginatedResponse<ReportInstance>,
  GetReportListParams | undefined
>(
  'reports/fetchReportInstances',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getReportInstances with the provided parameters
      const response = await reportsApi.getReportInstances(params);

      // If successful, dispatch setReportInstances with the response data
      dispatch(setReportInstances(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch a single report instance by ID
 * 
 * @param id - ID of the report instance to fetch
 * @returns Thunk action that returns a Promise<ReportInstance>
 */
export const fetchReportInstance = createAsyncThunk<
  ReportInstance,
  UUID
>(
  'reports/fetchReportInstance',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getReportInstance with the provided ID
      const response = await reportsApi.getReportInstance(id);

      // If successful, dispatch setReportInstance with the response data
      dispatch(setReportInstance(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch the data for a specific report instance
 * 
 * @param instanceId - ID of the report instance to fetch data for
 * @returns Thunk action that returns a Promise<ReportData>
 */
export const fetchReportData = createAsyncThunk<
  ReportData,
  UUID
>(
  'reports/fetchReportData',
  async (instanceId, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getReportData with the provided instance ID
      const response = await reportsApi.getReportData(instanceId);

      // If successful, dispatch setReportData with the response data
      dispatch(setReportData(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to export a report in the specified format
 * 
 * @param params - Object containing the instance ID, format, and file name for the export
 * @returns Thunk action that returns a Promise<Blob>
 */
export const exportReport = createAsyncThunk<
  Blob,
  { instanceId: UUID; format: ReportFormat; fileName: string }
>(
  'reports/exportReport',
  async (params, { dispatch, rejectWithValue }) => {
    // Destructure instanceId, format, and fileName from the parameters
    const { instanceId, format, fileName } = params;

    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.exportReport with the instanceId, format, and fileName
      const response = await reportsApi.exportReport(instanceId, format, fileName);

      return response;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to delete a report instance by ID
 * 
 * @param id - ID of the report instance to delete
 * @returns Thunk action that returns a Promise<void>
 */
export const deleteReportInstance = createAsyncThunk<
  void,
  UUID
>(
  'reports/deleteReportInstance',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.deleteReportInstance with the provided ID
      await reportsApi.deleteReportInstance(id);

      // If successful, dispatch removeReportInstance with the ID
      dispatch(removeReportInstance(id));
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch scheduled reports with optional filtering
 * 
 * @param params - Query parameters for filtering
 * @returns Thunk action that returns a Promise with scheduled reports
 */
export const fetchScheduledReports = createAsyncThunk<
  ScheduledReport[],
  GetReportListParams | undefined
>(
  'reports/fetchScheduledReports',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getScheduledReports with the provided parameters
      const response = await reportsApi.getScheduledReports(params);

      // If successful, dispatch setScheduledReports with the response data
      dispatch(setScheduledReports(response.data.items));

      return response.data.items;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch a single scheduled report by ID
 * 
 * @param id - ID of the scheduled report to fetch
 * @returns Thunk action that returns a Promise<ScheduledReport>
 */
export const fetchScheduledReport = createAsyncThunk<
  ScheduledReport,
  UUID
>(
  'reports/fetchScheduledReport',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getScheduledReport with the provided ID
      const response = await reportsApi.getScheduledReport(id);

      // If successful, dispatch setScheduledReport with the response data
      dispatch(setScheduledReport(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to create a new scheduled report
 * 
 * @param request - Data for the new scheduled report
 * @returns Thunk action that returns a Promise<ScheduledReport>
 */
export const scheduleReport = createAsyncThunk<
  ScheduledReport,
  ScheduleReportRequest
>(
  'reports/scheduleReport',
  async (request, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.scheduleReport with the provided request
      const response = await reportsApi.scheduleReport(request);

      // If successful, dispatch addScheduledReport with the response data
      dispatch(addScheduledReport(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to update an existing scheduled report
 * 
 * @param params - Object containing the ID of the scheduled report and the updated data
 * @returns Thunk action that returns a Promise<ScheduledReport>
 */
export const updateScheduledReport = createAsyncThunk<
  ScheduledReport,
  { id: UUID; request: Partial<ScheduleReportRequest> }
>(
  'reports/updateScheduledReport',
  async (params, { dispatch, rejectWithValue }) => {
    // Destructure id and request from the parameters
    const { id, request } = params;

    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.updateScheduledReport with the id and request
      const response = await reportsApi.updateScheduledReport(id, request);

      // If successful, dispatch updateScheduledReport with the response data
      dispatch(updateScheduledReport(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to delete a scheduled report by ID
 * 
 * @param id - ID of the scheduled report to delete
 * @returns Thunk action that returns a Promise<void>
 */
export const deleteScheduledReport = createAsyncThunk<
  void,
  UUID
>(
  'reports/deleteScheduledReport',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.deleteScheduledReport with the provided ID
      await reportsApi.deleteScheduledReport(id);

      // If successful, dispatch removeScheduledReport with the ID
      dispatch(removeScheduledReport(id));
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to manually execute a scheduled report
 * 
 * @param id - ID of the scheduled report to execute
 * @returns Thunk action that returns a Promise with the generation response
 */
export const executeScheduledReport = createAsyncThunk<
  GenerateReportResponse,
  UUID
>(
  'reports/executeScheduledReport',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportGenerating(true) to indicate generation in progress
      dispatch(setReportGenerating(true));

      // Call reportsApi.executeScheduledReport with the provided ID
      const response = await reportsApi.executeScheduledReport(id);

      // If successful, dispatch setReportGenerationResponse with the response data
      dispatch(setReportGenerationResponse(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportGenerationError with the error message
      dispatch(setReportGenerationError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportGenerating(false) to end generation state
      dispatch(setReportGenerating(false));
    }
  }
);

/**
 * Thunk action to fetch financial metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Thunk action that returns a Promise<FinancialMetric[]>
 */
export const fetchFinancialMetrics = createAsyncThunk<
  FinancialMetric[],
  ReportParameters | undefined
>(
  'reports/fetchFinancialMetrics',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getFinancialMetrics with the provided parameters
      const response = await reportsApi.getFinancialMetrics(params!);

      // If successful, dispatch setFinancialMetrics with the response data
      dispatch(setFinancialMetrics(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch revenue-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Thunk action that returns a Promise<FinancialMetric[]>
 */
export const fetchRevenueMetrics = createAsyncThunk<
  FinancialMetric[],
  ReportParameters | undefined
>(
  'reports/fetchRevenueMetrics',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getRevenueMetrics with the provided parameters
      const response = await reportsApi.getRevenueMetrics(params!);

      // If successful, dispatch setFinancialMetrics with the response data
      dispatch(setFinancialMetrics(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch claims-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Thunk action that returns a Promise<FinancialMetric[]>
 */
export const fetchClaimsMetrics = createAsyncThunk<
  FinancialMetric[],
  ReportParameters | undefined
>(
  'reports/fetchClaimsMetrics',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getClaimsMetrics with the provided parameters
      const response = await reportsApi.getClaimsMetrics(params!);

      // If successful, dispatch setFinancialMetrics with the response data
      dispatch(setFinancialMetrics(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

/**
 * Thunk action to fetch payment-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Thunk action that returns a Promise<FinancialMetric[]>
 */
export const fetchPaymentMetrics = createAsyncThunk<
  FinancialMetric[],
  ReportParameters | undefined
>(
  'reports/fetchPaymentMetrics',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch setReportsLoading(true) to indicate loading state
      dispatch(setReportsLoading(true));

      // Call reportsApi.getPaymentMetrics with the provided parameters
      const response = await reportsApi.getPaymentMetrics(params!);

      // If successful, dispatch setFinancialMetrics with the response data
      dispatch(setFinancialMetrics(response.data));

      return response.data;
    } catch (error) {
      // If error occurs, dispatch setReportsError with the error message
      dispatch(setReportsError((error as any).message));
      return rejectWithValue((error as any).message);
    } finally {
      // Finally, dispatch setReportsLoading(false) to end loading state
      dispatch(setReportsLoading(false));
    }
  }
);

// Export thunks
export {
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
    exportReport,
    deleteReportInstance,
    fetchScheduledReports,
    fetchScheduledReport,
    scheduleReport,
    updateScheduledReport,
    deleteScheduledReport,
    executeScheduledReport,
    fetchFinancialMetrics,
    fetchRevenueMetrics,
    fetchClaimsMetrics,
    fetchPaymentMetrics
};