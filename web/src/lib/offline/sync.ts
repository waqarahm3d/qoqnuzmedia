/**
 * Background Sync Service
 * Syncs offline data when back online
 */

import db from './db';

/**
 * Sync offline play history to server
 */
export async function syncPlayHistory(): Promise<number> {
  const unsynced = await db.offlinePlayHistory
    .filter(item => !item.synced)
    .toArray();

  if (unsynced.length === 0) return 0;

  let synced = 0;

  for (const play of unsynced) {
    try {
      const response = await fetch('/api/play-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: play.trackId,
          playedAt: play.playedAt.toISOString(),
          duration: play.duration,
          source: 'offline',
        }),
      });

      if (response.ok && play.id) {
        await db.offlinePlayHistory.update(play.id, { synced: true });
        synced++;
      }
    } catch (error) {
      console.error('[Sync] Failed to sync play history:', error);
    }
  }

  console.log(`[Sync] Synced ${synced}/${unsynced.length} play history entries`);
  return synced;
}

/**
 * Sync offline liked tracks to server
 */
export async function syncLikedTracks(): Promise<number> {
  const unsynced = await db.offlineLikedTracks
    .filter(item => !item.synced)
    .toArray();

  if (unsynced.length === 0) return 0;

  let synced = 0;

  for (const like of unsynced) {
    try {
      const endpoint = like.action === 'like'
        ? `/api/tracks/${like.trackId}/like`
        : `/api/tracks/${like.trackId}/unlike`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok && like.id) {
        await db.offlineLikedTracks.update(like.id, { synced: true });
        synced++;
      }
    } catch (error) {
      console.error('[Sync] Failed to sync liked track:', error);
    }
  }

  console.log(`[Sync] Synced ${synced}/${unsynced.length} liked track changes`);
  return synced;
}

/**
 * Run all sync operations
 */
export async function syncAll(): Promise<{
  playHistory: number;
  likedTracks: number;
}> {
  const playHistory = await syncPlayHistory();
  const likedTracks = await syncLikedTracks();
  return { playHistory, likedTracks };
}

/**
 * Record offline play (to be synced later)
 */
export async function recordOfflinePlay(
  trackId: string,
  duration: number
): Promise<void> {
  await db.offlinePlayHistory.add({
    trackId,
    playedAt: new Date(),
    duration,
    synced: false,
  });
}

/**
 * Record offline like/unlike (to be synced later)
 */
export async function recordOfflineLike(
  trackId: string,
  action: 'like' | 'unlike'
): Promise<void> {
  await db.offlineLikedTracks.add({
    trackId,
    likedAt: new Date(),
    action,
    synced: false,
  });
}

/**
 * Get count of unsynced items
 */
export async function getUnsyncedCount(): Promise<{
  playHistory: number;
  likedTracks: number;
  total: number;
}> {
  const playHistory = await db.offlinePlayHistory
    .filter(item => !item.synced)
    .count();

  const likedTracks = await db.offlineLikedTracks
    .filter(item => !item.synced)
    .count();

  return {
    playHistory,
    likedTracks,
    total: playHistory + likedTracks,
  };
}

/**
 * Clear synced items older than specified days
 */
export async function cleanupSyncedItems(daysOld: number = 7): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  await db.offlinePlayHistory
    .filter(item => item.synced && item.playedAt < cutoff)
    .delete();

  await db.offlineLikedTracks
    .filter(item => item.synced && item.likedAt < cutoff)
    .delete();
}

/**
 * Initialize sync on app load and when coming online
 */
export function initializeSync(): () => void {
  // Sync when coming online
  const handleOnline = () => {
    console.log('[Sync] Back online, syncing...');
    syncAll();
  };

  window.addEventListener('online', handleOnline);

  // Initial sync if online
  if (navigator.onLine) {
    syncAll();
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
