import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Track, Album, Artist } from '@/lib/types/music';

/**
 * Library Store
 *
 * Manages user's music library including:
 * - Liked tracks
 * - Saved albums
 * - Followed artists
 * - Library statistics
 */

interface LibraryState {
  // State
  likedTracks: Track[];
  savedAlbums: Album[];
  followedArtists: Artist[];
  isLoading: boolean;
  error: string | null;

  // Actions - Tracks
  setLikedTracks: (tracks: Track[]) => void;
  likeTrack: (track: Track) => void;
  unlikeTrack: (trackId: string) => void;
  isTrackLiked: (trackId: string) => boolean;

  // Actions - Albums
  setSavedAlbums: (albums: Album[]) => void;
  saveAlbum: (album: Album) => void;
  unsaveAlbum: (albumId: string) => void;
  isAlbumSaved: (albumId: string) => boolean;

  // Actions - Artists
  setFollowedArtists: (artists: Artist[]) => void;
  followArtist: (artist: Artist) => void;
  unfollowArtist: (artistId: string) => void;
  isArtistFollowed: (artistId: string) => boolean;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  getStats: () => {
    tracksCount: number;
    albumsCount: number;
    artistsCount: number;
    totalDuration: number;
  };
  reset: () => void;
}

const initialState = {
  likedTracks: [],
  savedAlbums: [],
  followedArtists: [],
  isLoading: false,
  error: null,
};

export const useLibraryStore = create<LibraryState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Tracks
      setLikedTracks: (tracks) => set({ likedTracks: tracks }),

      likeTrack: (track) =>
        set((state) => {
          // Prevent duplicates
          if (state.likedTracks.some((t) => t.id === track.id)) {
            return state;
          }

          return {
            likedTracks: [
              { ...track, is_liked: true, likes: (track.likes || 0) + 1 },
              ...state.likedTracks,
            ],
          };
        }),

      unlikeTrack: (trackId) =>
        set((state) => ({
          likedTracks: state.likedTracks.filter((track) => track.id !== trackId),
        })),

      isTrackLiked: (trackId) => {
        return get().likedTracks.some((track) => track.id === trackId);
      },

      // Albums
      setSavedAlbums: (albums) => set({ savedAlbums: albums }),

      saveAlbum: (album) =>
        set((state) => {
          // Prevent duplicates
          if (state.savedAlbums.some((a) => a.id === album.id)) {
            return state;
          }

          return {
            savedAlbums: [album, ...state.savedAlbums],
          };
        }),

      unsaveAlbum: (albumId) =>
        set((state) => ({
          savedAlbums: state.savedAlbums.filter((album) => album.id !== albumId),
        })),

      isAlbumSaved: (albumId) => {
        return get().savedAlbums.some((album) => album.id === albumId);
      },

      // Artists
      setFollowedArtists: (artists) => set({ followedArtists: artists }),

      followArtist: (artist) =>
        set((state) => {
          // Prevent duplicates
          if (state.followedArtists.some((a) => a.id === artist.id)) {
            return state;
          }

          return {
            followedArtists: [
              { ...artist, is_following: true, followers: (artist.followers || 0) + 1 },
              ...state.followedArtists,
            ],
          };
        }),

      unfollowArtist: (artistId) =>
        set((state) => ({
          followedArtists: state.followedArtists.filter((artist) => artist.id !== artistId),
        })),

      isArtistFollowed: (artistId) => {
        return get().followedArtists.some((artist) => artist.id === artistId);
      },

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Utility
      getStats: () => {
        const state = get();
        return {
          tracksCount: state.likedTracks.length,
          albumsCount: state.savedAlbums.length,
          artistsCount: state.followedArtists.length,
          totalDuration: state.likedTracks.reduce((sum, track) => sum + track.duration, 0),
        };
      },

      reset: () => set(initialState),
    }),
    { name: 'LibraryStore' }
  )
);
