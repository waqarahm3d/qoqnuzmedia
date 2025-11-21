import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/lib/types/music';

/**
 * Social Store
 *
 * Manages social relationships including:
 * - Following/followers
 * - User connections
 * - Share functionality
 */

interface SocialState {
  // State
  following: User[];
  followers: User[];
  suggestedUsers: User[];
  isLoading: boolean;
  error: string | null;

  // Actions - Following
  setFollowing: (users: User[]) => void;
  setFollowers: (users: User[]) => void;
  setSuggestedUsers: (users: User[]) => void;
  followUser: (user: User) => void;
  unfollowUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;

  // Actions - Share
  generateShareUrl: (entityType: 'track' | 'album' | 'playlist' | 'artist', entityId: string) => string;
  copyShareUrl: (url: string) => Promise<boolean>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  getFollowingCount: () => number;
  getFollowersCount: () => number;
  getMutualFollowers: (userId: string) => User[];
  reset: () => void;
}

const initialState = {
  following: [],
  followers: [],
  suggestedUsers: [],
  isLoading: false,
  error: null,
};

export const useSocialStore = create<SocialState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setFollowing: (users) => set({ following: users }),

      setFollowers: (users) => set({ followers: users }),

      setSuggestedUsers: (users) => set({ suggestedUsers: users }),

      // Following actions
      followUser: (user) =>
        set((state) => {
          // Prevent duplicates
          if (state.following.some((u) => u.id === user.id)) {
            return state;
          }

          return {
            following: [
              { ...user, is_following: true, followers_count: (user.followers_count || 0) + 1 },
              ...state.following,
            ],
          };
        }),

      unfollowUser: (userId) =>
        set((state) => ({
          following: state.following.filter((user) => user.id !== userId),
        })),

      isFollowing: (userId) => {
        return get().following.some((user) => user.id === userId);
      },

      // Share actions
      generateShareUrl: (entityType, entityId) => {
        // In a real app, this would generate a proper share URL
        // For now, return a mock URL based on entity type
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

        const routes = {
          track: `/track/${entityId}`,
          album: `/album/${entityId}`,
          playlist: `/playlist/${entityId}`,
          artist: `/artist/${entityId}`,
        };

        return `${baseUrl}${routes[entityType]}`;
      },

      copyShareUrl: async (url) => {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
          return false;
        }
      },

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Utility
      getFollowingCount: () => {
        return get().following.length;
      },

      getFollowersCount: () => {
        return get().followers.length;
      },

      getMutualFollowers: (userId) => {
        const state = get();
        // In a real app, this would check server-side for mutual followers
        // For now, return empty array
        return [];
      },

      reset: () => set(initialState),
    }),
    { name: 'SocialStore' }
  )
);
