/**
 * Qoqnuz State Management
 *
 * Centralized exports for all Zustand stores.
 * Import stores from this file for consistency.
 *
 * @example
 * ```tsx
 * import { usePlayerStore, useQueueStore } from '@/lib/stores';
 * ```
 */

export { usePlayerStore, type PlayerState } from './playerStore';
export { useQueueStore, type QueueState } from './queueStore';
export { useUIStore, type UIState, type Toast, type ModalType } from './uiStore';
export { usePlaylistStore } from './playlistStore';
export { useLibraryStore } from './libraryStore';
export { useSocialStore } from './socialStore';
