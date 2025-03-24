import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+
import { ThemeMode } from '../../types/common.types';
import { ToastProps } from '../../types/ui.types';

// Define the UI state interface
interface UIState {
  themeMode: ThemeMode;
  sidebar: {
    isOpen: boolean;
  };
  mobileMenu: {
    isOpen: boolean;
  };
  toasts: Array<ToastProps & { id: string }>;
  modal: {
    isOpen: boolean;
    modalType: string | null;
    modalProps: Record<string, any> | null;
  };
}

// Define the payload for opening a modal
interface OpenModalPayload {
  modalType: string;
  modalProps: Record<string, any>;
}

// Get stored theme preference from localStorage if available
const getInitialThemeMode = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('themeMode');
    if (storedTheme && Object.values(ThemeMode).includes(storedTheme as ThemeMode)) {
      return storedTheme as ThemeMode;
    }
  }
  return ThemeMode.SYSTEM;
};

// Define the initial state
const initialState: UIState = {
  themeMode: getInitialThemeMode(),
  sidebar: {
    isOpen: true
  },
  mobileMenu: {
    isOpen: false
  },
  toasts: [],
  modal: {
    isOpen: false,
    modalType: null,
    modalProps: null
  }
};

// Create the UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', action.payload);
      }
    },
    
    // Sidebar actions
    toggleSidebar(state) {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebar.isOpen = action.payload;
    },
    
    // Mobile menu actions
    toggleMobileMenu(state) {
      state.mobileMenu.isOpen = !state.mobileMenu.isOpen;
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.mobileMenu.isOpen = action.payload;
    },
    
    // Toast notification actions
    addToast(state, action: PayloadAction<ToastProps>) {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    
    // Modal actions
    openModal(state, action: PayloadAction<OpenModalPayload>) {
      state.modal.isOpen = true;
      state.modal.modalType = action.payload.modalType;
      state.modal.modalProps = action.payload.modalProps;
    },
    closeModal(state) {
      state.modal.isOpen = false;
      state.modal.modalType = null;
      state.modal.modalProps = null;
    }
  }
});

// Export actions and reducer
export const uiActions = uiSlice.actions;
export default uiSlice.reducer;