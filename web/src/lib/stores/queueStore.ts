import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Track } from '../types/music';

/**
 * Queue Store
 *
 * Manages the playback queue, including next/previous track logic,
 * shuffle algorithm, and queue manipulation.
 */

export interface QueueState {
  // Queue
  originalQueue: Track[]; // Original order before shuffle
  queue: Track[]; // Current queue (may be shuffled)
  currentIndex: number;
  history: Track[]; // Playback history

  // Actions
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  addMultipleToQueue: (tracks: Track[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  next: () => Track | null;
  previous: () => Track | null;
  jumpTo: (index: number) => void;

  shuffleQueue: () => void;
  unshuffleQueue: () => void;

  moveTrack: (fromIndex: number, toIndex: number) => void;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useQueueStore = create<QueueState>()(
  devtools(
    (set, get) => ({
      // Initial State
      originalQueue: [],
      queue: [],
      currentIndex: -1,
      history: [],

      // Actions

      setQueue: (tracks, startIndex = 0) => {
        set({
          originalQueue: tracks,
          queue: tracks,
          currentIndex: startIndex,
          history: [],
        });
      },

      addToQueue: (track) => {
        set((state) => ({
          queue: [...state.queue, track],
          originalQueue: [...state.originalQueue, track],
        }));
      },

      addMultipleToQueue: (tracks) => {
        set((state) => ({
          queue: [...state.queue, ...tracks],
          originalQueue: [...state.originalQueue, ...tracks],
        }));
      },

      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index);
          const newOriginalQueue = state.originalQueue.filter((_, i) => i !== index);

          let newIndex = state.currentIndex;
          if (index < state.currentIndex) {
            newIndex = state.currentIndex - 1;
          } else if (index === state.currentIndex) {
            newIndex = Math.min(state.currentIndex, newQueue.length - 1);
          }

          return {
            queue: newQueue,
            originalQueue: newOriginalQueue,
            currentIndex: newIndex,
          };
        });
      },

      clearQueue: () => {
        set({
          originalQueue: [],
          queue: [],
          currentIndex: -1,
          history: [],
        });
      },

      next: () => {
        const { queue, currentIndex } = get();

        if (queue.length === 0) return null;

        const nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          // End of queue - return null, player will handle repeat logic
          return null;
        }

        const currentTrack = queue[currentIndex];
        const nextTrack = queue[nextIndex];

        set((state) => ({
          currentIndex: nextIndex,
          history: currentTrack ? [...state.history, currentTrack] : state.history,
        }));

        return nextTrack;
      },

      previous: () => {
        const { queue, currentIndex, history } = get();

        if (currentIndex === 0 && history.length > 0) {
          // Go back to history
          const previousTrack = history[history.length - 1];
          set({
            history: history.slice(0, -1),
          });
          return previousTrack;
        }

        if (currentIndex > 0) {
          const previousIndex = currentIndex - 1;
          const previousTrack = queue[previousIndex];

          set({ currentIndex: previousIndex });
          return previousTrack;
        }

        // Already at start
        return queue[0] || null;
      },

      jumpTo: (index) => {
        const { queue, currentIndex } = get();

        if (index < 0 || index >= queue.length) return;

        const currentTrack = queue[currentIndex];

        set((state) => ({
          currentIndex: index,
          history: currentTrack ? [...state.history, currentTrack] : state.history,
        }));
      },

      shuffleQueue: () => {
        const { queue, currentIndex } = get();

        if (queue.length <= 1) return;

        // Keep current track at position 0, shuffle the rest
        const currentTrack = queue[currentIndex];
        const otherTracks = queue.filter((_, i) => i !== currentIndex);
        const shuffledOthers = shuffleArray(otherTracks);
        const newQueue = [currentTrack, ...shuffledOthers];

        set({
          queue: newQueue,
          currentIndex: 0,
        });
      },

      unshuffleQueue: () => {
        const { originalQueue, queue, currentIndex } = get();

        const currentTrack = queue[currentIndex];
        const originalIndex = originalQueue.findIndex((t) => t.id === currentTrack?.id);

        set({
          queue: originalQueue,
          currentIndex: originalIndex >= 0 ? originalIndex : 0,
        });
      },

      moveTrack: (fromIndex, toIndex) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, removed);

          // Update currentIndex if needed
          let newCurrentIndex = state.currentIndex;
          if (fromIndex === state.currentIndex) {
            newCurrentIndex = toIndex;
          } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
            newCurrentIndex--;
          } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
            newCurrentIndex++;
          }

          return {
            queue: newQueue,
            currentIndex: newCurrentIndex,
          };
        });
      },
    }),
    { name: 'QueueStore' }
  )
);
