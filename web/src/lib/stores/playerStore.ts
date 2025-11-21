import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Track, RepeatMode } from '../types/music';

/**
 * Player Store
 *
 * Global state management for the music player using Zustand.
 * Handles playback state, volume, progress, and player controls.
 *
 * Features:
 * - Persistent state (volume, repeat, shuffle)
 * - DevTools integration for debugging
 * - Type-safe actions and state
 */

export interface PlayerState {
  // Playback State
  currentTrack: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;

  // Audio State
  volume: number; // 0-1
  isMuted: boolean;
  previousVolume: number;

  // Progress
  progress: number; // 0-100 percentage
  currentTime: number; // seconds
  duration: number; // seconds

  // Playback Modes
  repeat: RepeatMode;
  shuffle: boolean;

  // Actions
  play: (track?: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: () => void;

  setVolume: (volume: number) => void;
  toggleMute: () => void;

  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  setRepeat: (mode: RepeatMode) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;

  setIsLoading: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentTrack: null,
        isPlaying: false,
        isPaused: false,
        isLoading: false,

        volume: 0.7,
        isMuted: false,
        previousVolume: 0.7,

        progress: 0,
        currentTime: 0,
        duration: 0,

        repeat: 'off',
        shuffle: false,

        // Actions

        play: (track) => {
          if (track) {
            set({
              currentTrack: track,
              isPlaying: true,
              isPaused: false,
              progress: 0,
              currentTime: 0,
              isLoading: true,
            });
          } else {
            // Resume current track
            set({ isPlaying: true, isPaused: false });
          }
        },

        pause: () => {
          set({ isPlaying: false, isPaused: true });
        },

        resume: () => {
          set({ isPlaying: true, isPaused: false });
        },

        stop: () => {
          set({
            isPlaying: false,
            isPaused: false,
            progress: 0,
            currentTime: 0,
          });
        },

        togglePlayPause: () => {
          const { isPlaying } = get();
          if (isPlaying) {
            get().pause();
          } else {
            get().resume();
          }
        },

        setVolume: (volume) => {
          const clampedVolume = Math.max(0, Math.min(1, volume));
          set({
            volume: clampedVolume,
            isMuted: clampedVolume === 0,
            previousVolume: clampedVolume > 0 ? clampedVolume : get().previousVolume,
          });
        },

        toggleMute: () => {
          const { isMuted, volume, previousVolume } = get();
          if (isMuted) {
            set({ isMuted: false, volume: previousVolume });
          } else {
            set({ isMuted: true, previousVolume: volume, volume: 0 });
          }
        },

        setProgress: (progress) => {
          set({ progress: Math.max(0, Math.min(100, progress)) });
        },

        setCurrentTime: (time) => {
          const { duration } = get();
          const clampedTime = Math.max(0, Math.min(duration, time));
          const progress = duration > 0 ? (clampedTime / duration) * 100 : 0;
          set({ currentTime: clampedTime, progress });
        },

        setDuration: (duration) => {
          set({ duration });
        },

        setRepeat: (mode) => {
          set({ repeat: mode });
        },

        toggleRepeat: () => {
          const { repeat } = get();
          const modes: RepeatMode[] = ['off', 'all', 'one'];
          const currentIndex = modes.indexOf(repeat);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          set({ repeat: nextMode });
        },

        toggleShuffle: () => {
          set((state) => ({ shuffle: !state.shuffle }));
        },

        setIsLoading: (loading) => {
          set({ isLoading: loading });
        },
      }),
      {
        name: 'qoqnuz-player-storage',
        partialize: (state) => ({
          volume: state.volume,
          isMuted: state.isMuted,
          repeat: state.repeat,
          shuffle: state.shuffle,
        }),
      }
    ),
    { name: 'PlayerStore' }
  )
);
