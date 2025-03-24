import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+ Configure Redux store with simplified setup and good defaults
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'; // react-redux v8.0+ Typed hooks for accessing Redux store from React components
import rootReducer from './rootReducer'; // Import the combined root reducer

/**
 * Configures the Redux store with the root reducer, middleware, and devtools.
 * @returns The configured Redux store.
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'] // Ignore the serializability check for 'persist/PERSIST' actions
      }
    }),
  devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools only in non-production environments
});

/**
 * Type representing the complete Redux state tree
 * Provides type safety for state access
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Type representing the store's dispatch function
 * Provides type safety for action dispatching
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Custom typed useDispatch hook for dispatching actions with correct typing
 * @returns Typed dispatch function
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Custom typed useSelector hook for selecting state with correct typing
 * @param selector function
 * @returns Selected state portion
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;