/**
 * React hooks for offline functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, {
  DownloadedTrack,
  DownloadQueueItem,
  getStorageUsed,
  getStorageEstimate,
  formatBytes,
  isTrackDownloaded,
  getDownloadedTrackIds,
} from './db';
import downloadManager from './download-manager';

/**
 * Hook to check if a track is downloaded
 */
export function useIsDownloaded(trackId: string): boolean {
  const track = useLiveQuery(
    () => db.downloadedTracks.get(trackId),
    [trackId]
  );
  return !!track;
}

/**
 * Hook to get all downloaded tracks
 */
export function useDownloadedTracks(): DownloadedTrack[] {
  return useLiveQuery(
    () => db.downloadedTracks.orderBy('downloadedAt').reverse().toArray(),
    []
  ) || [];
}

/**
 * Hook to get downloaded track IDs as a Set
 */
export function useDownloadedTrackIds(): Set<string> {
  const tracks = useLiveQuery(
    () => db.downloadedTracks.toArray(),
    []
  );
  return new Set(tracks?.map(t => t.id) || []);
}

/**
 * Hook to get download queue
 */
export function useDownloadQueue(): DownloadQueueItem[] {
  return useLiveQuery(
    () => db.downloadQueue.orderBy('addedAt').toArray(),
    []
  ) || [];
}

/**
 * Hook to get pending download count
 */
export function usePendingDownloads(): number {
  return useLiveQuery(
    () => db.downloadQueue
      .where('status')
      .anyOf(['pending', 'downloading'])
      .count(),
    []
  ) || 0;
}

/**
 * Hook for storage information
 */
export function useStorageInfo(): {
  used: number;
  quota: number;
  usedFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
} {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    quota: 0,
    usedFormatted: '0 B',
    quotaFormatted: '0 B',
    percentUsed: 0,
  });

  useEffect(() => {
    const updateStorage = async () => {
      const estimate = await getStorageEstimate();
      setStorageInfo({
        used: estimate.used,
        quota: estimate.quota,
        usedFormatted: formatBytes(estimate.used),
        quotaFormatted: formatBytes(estimate.quota),
        percentUsed: estimate.quota > 0
          ? Math.round((estimate.used / estimate.quota) * 100)
          : 0,
      });
    };

    updateStorage();
    const interval = setInterval(updateStorage, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  return storageInfo;
}

/**
 * Hook for download manager operations
 */
export function useDownloadManager() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const unsubProgress = downloadManager.on('progress', (data) => {
      setIsDownloading(true);
      setCurrentProgress(data.progress);
    });

    const unsubComplete = downloadManager.on('complete', () => {
      setIsDownloading(false);
      setCurrentProgress(0);
    });

    const unsubError = downloadManager.on('error', () => {
      setIsDownloading(false);
      setCurrentProgress(0);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  const addToQueue = useCallback(async (track: {
    id: string;
    title: string;
    artistName: string;
    coverArtUrl?: string;
  }) => {
    await downloadManager.addToQueue(track);
  }, []);

  const removeFromQueue = useCallback(async (trackId: string) => {
    await downloadManager.removeFromQueue(trackId);
  }, []);

  const deleteDownload = useCallback(async (trackId: string) => {
    await downloadManager.deleteDownload(trackId);
  }, []);

  const clearCompleted = useCallback(async () => {
    await downloadManager.clearCompleted();
  }, []);

  const retryFailed = useCallback(async () => {
    await downloadManager.retryFailed();
  }, []);

  const cancelCurrent = useCallback(() => {
    downloadManager.cancelCurrent();
  }, []);

  return {
    isDownloading,
    currentProgress,
    addToQueue,
    removeFromQueue,
    deleteDownload,
    clearCompleted,
    retryFailed,
    cancelCurrent,
  };
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to get a downloaded track's blob URL for playback
 */
export function useOfflineTrackUrl(trackId: string): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    const loadUrl = async () => {
      url = await downloadManager.getTrackBlobUrl(trackId);
      setBlobUrl(url);
    };

    loadUrl();

    // Cleanup blob URL on unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [trackId]);

  return blobUrl;
}
