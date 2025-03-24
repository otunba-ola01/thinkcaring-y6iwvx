import { combineReducers } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import uiReducer from './ui/uiSlice';
import { authReducer } from './auth/authSlice';
import clientsReducer from './clients/clientsSlice';
import servicesReducer from './services/servicesSlice';
import claimsReducer from './claims/claimsSlice';
import paymentsReducer from './payments/paymentsSlice';
import reportsReducer from './reports/reportsSlice';
import dashboardReducer from './dashboard/dashboardSlice';
import settingsReducer from './settings/settingsSlice';

/**
 * Creates and returns the root reducer by combining all slice reducers
 * @returns Reducer Combined root reducer function
 */
const createRootReducer = () => {
  // Use combineReducers to create a single reducer from all slice reducers
  // Map each reducer to its corresponding state property
  return combineReducers({
    ui: uiReducer,
    auth: authReducer,
    clients: clientsReducer,
    services: servicesReducer,
    claims: claimsReducer,
    payments: paymentsReducer,
    reports: reportsReducer,
    dashboard: dashboardReducer,
    settings: settingsReducer
  });
};

// Export the combined root reducer as the default export
const rootReducer = createRootReducer();
export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;