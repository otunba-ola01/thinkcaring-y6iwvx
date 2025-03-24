import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+
import { 
  ReportDefinition, 
  ReportInstance, 
  ScheduledReport, 
  ReportData, 
  FinancialMetric,
  GenerateReportResponse
} from '../../types/reports.types';
import { PaginatedResponse, UUID } from '../../types/common.types';

/**
 * Interface defining the structure of the reports state slice
 */
interface ReportsState {
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
}

/**
 * Initial state for the reports slice
 */
const initialState: ReportsState = {
  reportDefinitions: [],
  currentReportDefinition: null,
  reportInstances: {
    items: [],
    totalItems: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  },
  currentReportInstance: null,
  currentReportData: null,
  scheduledReports: [],
  currentScheduledReport: null,
  financialMetrics: [],
  isGeneratingReport: false,
  generationResponse: null,
  generationError: null,
  isLoading: false,
  error: null
};

/**
 * Reports slice for Redux store
 * Manages state related to reports, including report definitions, instances,
 * scheduled reports, financial metrics, and report generation status
 */
export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    // Report definitions
    setReportDefinitions(state, action: PayloadAction<ReportDefinition[]>) {
      state.reportDefinitions = action.payload;
    },
    setReportDefinition(state, action: PayloadAction<ReportDefinition>) {
      state.currentReportDefinition = action.payload;
    },
    addReportDefinition(state, action: PayloadAction<ReportDefinition>) {
      state.reportDefinitions.push(action.payload);
    },
    updateReportDefinition(state, action: PayloadAction<ReportDefinition>) {
      const index = state.reportDefinitions.findIndex(def => def.id === action.payload.id);
      if (index !== -1) {
        state.reportDefinitions[index] = action.payload;
        if (state.currentReportDefinition?.id === action.payload.id) {
          state.currentReportDefinition = action.payload;
        }
      }
    },
    removeReportDefinition(state, action: PayloadAction<UUID>) {
      state.reportDefinitions = state.reportDefinitions.filter(def => def.id !== action.payload);
      if (state.currentReportDefinition?.id === action.payload) {
        state.currentReportDefinition = null;
      }
    },

    // Report instances
    setReportInstances(state, action: PayloadAction<PaginatedResponse<ReportInstance>>) {
      state.reportInstances = action.payload;
    },
    setReportInstance(state, action: PayloadAction<ReportInstance>) {
      state.currentReportInstance = action.payload;
    },
    addReportInstance(state, action: PayloadAction<ReportInstance>) {
      state.reportInstances.items.push(action.payload);
      state.reportInstances.totalItems += 1;
    },
    updateReportInstance(state, action: PayloadAction<ReportInstance>) {
      const index = state.reportInstances.items.findIndex(instance => instance.id === action.payload.id);
      if (index !== -1) {
        state.reportInstances.items[index] = action.payload;
        if (state.currentReportInstance?.id === action.payload.id) {
          state.currentReportInstance = action.payload;
        }
      }
    },
    removeReportInstance(state, action: PayloadAction<UUID>) {
      state.reportInstances.items = state.reportInstances.items.filter(instance => instance.id !== action.payload);
      state.reportInstances.totalItems -= 1;
      if (state.currentReportInstance?.id === action.payload) {
        state.currentReportInstance = null;
      }
    },

    // Report data
    setReportData(state, action: PayloadAction<ReportData>) {
      state.currentReportData = action.payload;
    },

    // Scheduled reports
    setScheduledReports(state, action: PayloadAction<ScheduledReport[]>) {
      state.scheduledReports = action.payload;
    },
    setScheduledReport(state, action: PayloadAction<ScheduledReport>) {
      state.currentScheduledReport = action.payload;
    },
    addScheduledReport(state, action: PayloadAction<ScheduledReport>) {
      state.scheduledReports.push(action.payload);
    },
    updateScheduledReport(state, action: PayloadAction<ScheduledReport>) {
      const index = state.scheduledReports.findIndex(report => report.id === action.payload.id);
      if (index !== -1) {
        state.scheduledReports[index] = action.payload;
        if (state.currentScheduledReport?.id === action.payload.id) {
          state.currentScheduledReport = action.payload;
        }
      }
    },
    removeScheduledReport(state, action: PayloadAction<UUID>) {
      state.scheduledReports = state.scheduledReports.filter(report => report.id !== action.payload);
      if (state.currentScheduledReport?.id === action.payload) {
        state.currentScheduledReport = null;
      }
    },

    // Financial metrics
    setFinancialMetrics(state, action: PayloadAction<FinancialMetric[]>) {
      state.financialMetrics = action.payload;
    },

    // Report generation status
    setReportGenerating(state, action: PayloadAction<boolean>) {
      state.isGeneratingReport = action.payload;
      if (action.payload) {
        state.generationResponse = null;
        state.generationError = null;
      }
    },
    setReportGenerationResponse(state, action: PayloadAction<GenerateReportResponse>) {
      state.generationResponse = action.payload;
      state.generationError = null;
    },
    setReportGenerationError(state, action: PayloadAction<string>) {
      state.generationError = action.payload;
      state.generationResponse = null;
    },

    // Loading and error states
    setReportsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setReportsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

// Export action creators
export const {
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
} = reportsSlice.actions;

// Export reducer
export const reportsReducer = reportsSlice.reducer;

// Default export
export default reportsSlice.reducer;