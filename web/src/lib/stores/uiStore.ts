import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * UI Store
 *
 * Manages global UI state including:
 * - Sidebar visibility (desktop/mobile)
 * - Modals and drawers
 * - Toast notifications
 * - Theme
 */

export type ModalType =
  | 'create-playlist'
  | 'edit-playlist'
  | 'add-to-playlist'
  | 'share'
  | 'delete-confirm'
  | null;

export interface ModalData {
  [key: string]: any;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: ModalType;
  modalData: ModalData;

  // Toasts
  toasts: Toast[];

  // Theme
  theme: 'dark' | 'light';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;

  openModal: (modal: ModalType, data?: ModalData) => void;
  closeModal: () => void;

  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        sidebarOpen: true,
        sidebarCollapsed: false,

        activeModal: null,
        modalData: {},

        toasts: [],

        theme: 'dark',

        // Actions

        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }));
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },

        toggleSidebarCollapse: () => {
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        },

        openModal: (modal, data = {}) => {
          set({ activeModal: modal, modalData: data });
        },

        closeModal: () => {
          set({ activeModal: null, modalData: {} });
        },

        showToast: (message, type = 'info', duration = 3000) => {
          const id = `toast-${Date.now()}-${Math.random()}`;
          const toast: Toast = { id, message, type, duration };

          set((state) => ({
            toasts: [...state.toasts, toast],
          }));

          // Auto-remove after duration
          if (duration > 0) {
            setTimeout(() => {
              set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
              }));
            }, duration);
          }
        },

        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        },

        setTheme: (theme) => {
          set({ theme });
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
          }
        },

        toggleTheme: () => {
          set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            if (typeof document !== 'undefined') {
              document.documentElement.setAttribute('data-theme', newTheme);
            }
            return { theme: newTheme };
          });
        },
      }),
      {
        name: 'qoqnuz-ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
