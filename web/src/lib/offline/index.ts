/**
 * Offline functionality exports
 */

// Database
export {
  db,
  formatBytes,
  getStorageUsed,
  getStorageEstimate,
  isTrackDownloaded,
  getDownloadedTrackIds,
  getDownloadedTrackCount,
  cleanupStorage,
  clearAllOfflineData,
} from './db';

export type {
  DownloadedTrack,
  DownloadQueueItem,
  CachedCoverArt,
  OfflinePlayHistory,
  OfflineLikedTrack,
} from './db';

// Download manager
export { downloadManager } from './download-manager';

// React hooks
export {
  useIsDownloaded,
  useDownloadedTracks,
  useDownloadedTrackIds,
  useDownloadQueue,
  usePendingDownloads,
  useStorageInfo,
  useDownloadManager,
  useOnlineStatus,
  useOfflineTrackUrl,
} from './hooks';

// Sync
export {
  syncPlayHistory,
  syncLikedTracks,
  syncAll,
  recordOfflinePlay,
  recordOfflineLike,
  getUnsyncedCount,
  cleanupSyncedItems,
  initializeSync,
} from './sync';
