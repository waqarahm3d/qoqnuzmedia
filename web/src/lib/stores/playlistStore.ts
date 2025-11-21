import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Playlist, PlaylistTrack, PlaylistCollaborator } from '@/lib/types/music';

/**
 * Playlist Store
 *
 * Manages playlist state including:
 * - User's playlists
 * - Current playlist being viewed
 * - Playlist tracks
 * - Playlist collaborators
 * - CRUD operations
 */

interface PlaylistState {
  // State
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;

  // Track management
  addTrackToPlaylist: (playlistId: string, track: PlaylistTrack) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, tracks: PlaylistTrack[]) => void;

  // Collaborator management
  addCollaborator: (playlistId: string, collaborator: PlaylistCollaborator) => void;
  removeCollaborator: (playlistId: string, userId: string) => void;
  updateCollaboratorRole: (
    playlistId: string,
    userId: string,
    role: PlaylistCollaborator['role']
  ) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  getPlaylistById: (id: string) => Playlist | undefined;
  getUserPlaylists: (userId: string) => Playlist[];
  reset: () => void;
}

const initialState = {
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,
};

export const usePlaylistStore = create<PlaylistState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setPlaylists: (playlists) => set({ playlists }),

      setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),

      addPlaylist: (playlist) =>
        set((state) => ({
          playlists: [playlist, ...state.playlists],
        })),

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id ? { ...playlist, ...updates } : playlist
          ),
          currentPlaylist:
            state.currentPlaylist?.id === id
              ? { ...state.currentPlaylist, ...updates }
              : state.currentPlaylist,
        })),

      deletePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
          currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
        })),

      // Track management
      addTrackToPlaylist: (playlistId, track) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            const tracks = [...(playlist.tracks || []), track];
            return {
              ...playlist,
              tracks,
              tracks_count: tracks.length,
              duration: tracks.reduce((sum, t) => sum + t.duration, 0),
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      removeTrackFromPlaylist: (playlistId, trackId) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            const tracks = (playlist.tracks || []).filter((t) => t.id !== trackId);
            return {
              ...playlist,
              tracks,
              tracks_count: tracks.length,
              duration: tracks.reduce((sum, t) => sum + t.duration, 0),
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      reorderPlaylistTracks: (playlistId, tracks) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            return {
              ...playlist,
              tracks: tracks.map((track, index) => ({ ...track, position: index })),
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      // Collaborator management
      addCollaborator: (playlistId, collaborator) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            return {
              ...playlist,
              collaborators: [...(playlist.collaborators || []), collaborator],
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      removeCollaborator: (playlistId, userId) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            return {
              ...playlist,
              collaborators: (playlist.collaborators || []).filter(
                (c) => c.user_id !== userId
              ),
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      updateCollaboratorRole: (playlistId, userId, role) =>
        set((state) => {
          const updatePlaylist = (playlist: Playlist) => {
            if (playlist.id !== playlistId) return playlist;

            return {
              ...playlist,
              collaborators: (playlist.collaborators || []).map((c) =>
                c.user_id === userId ? { ...c, role } : c
              ),
            };
          };

          return {
            playlists: state.playlists.map(updatePlaylist),
            currentPlaylist: state.currentPlaylist
              ? updatePlaylist(state.currentPlaylist)
              : null,
          };
        }),

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Utility
      getPlaylistById: (id) => {
        return get().playlists.find((playlist) => playlist.id === id);
      },

      getUserPlaylists: (userId) => {
        return get().playlists.filter((playlist) => playlist.owner_id === userId);
      },

      reset: () => set(initialState),
    }),
    { name: 'PlaylistStore' }
  )
);
