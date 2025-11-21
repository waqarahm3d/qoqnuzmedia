import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Activity, ActivityType } from '@/lib/types/music';

/**
 * Activity Store
 *
 * Manages user activity feed including:
 * - Friend activity
 * - Activity notifications
 * - Read/unread status
 * - Real-time updates (future)
 */

interface ActivityState {
  // State
  activities: Activity[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  markAsRead: (activityId: string) => void;
  markAllAsRead: () => void;
  removeActivity: (activityId: string) => void;

  // Filters
  filterByType: (type: ActivityType | 'all') => Activity[];
  getUnreadActivities: () => Activity[];

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  reset: () => void;
}

const initialState = {
  activities: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const useActivityStore = create<ActivityState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setActivities: (activities) =>
        set({
          activities,
          unreadCount: activities.filter((a) => !a.is_read).length,
        }),

      addActivity: (activity) =>
        set((state) => ({
          activities: [activity, ...state.activities],
          unreadCount: activity.is_read ? state.unreadCount : state.unreadCount + 1,
        })),

      markAsRead: (activityId) =>
        set((state) => {
          const activities = state.activities.map((activity) =>
            activity.id === activityId ? { ...activity, is_read: true } : activity
          );

          return {
            activities,
            unreadCount: activities.filter((a) => !a.is_read).length,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          activities: state.activities.map((activity) => ({ ...activity, is_read: true })),
          unreadCount: 0,
        })),

      removeActivity: (activityId) =>
        set((state) => {
          const activity = state.activities.find((a) => a.id === activityId);
          const activities = state.activities.filter((a) => a.id !== activityId);

          return {
            activities,
            unreadCount:
              activity && !activity.is_read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        }),

      // Filters
      filterByType: (type) => {
        const activities = get().activities;
        if (type === 'all') {
          return activities;
        }
        return activities.filter((activity) => activity.type === type);
      },

      getUnreadActivities: () => {
        return get().activities.filter((activity) => !activity.is_read);
      },

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Utility
      reset: () => set(initialState),
    }),
    { name: 'ActivityStore' }
  )
);
