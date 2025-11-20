/**
 * Offline Storage Database
 * Uses Dexie (IndexedDB wrapper) for storing downloaded tracks and metadata
 */

import Dexie, { Table } from 'dexie';

// Downloaded track with audio blob
export interface DownloadedTrack {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumTitle?: string;
  coverArtUrl?: string;
  duration_ms: number;
  genres?: string[];
  audioBlob: Blob;
  audioSize: number;
  downloadedAt: Date;
  lastPlayedAt?: Date;
  playCount: number;
}

// Download queue item
export interface DownloadQueueItem {
  id?: number;
  trackId: string;
  title: string;
  artistName: string;
  coverArtUrl?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  addedAt: Date;
  completedAt?: Date;
}

// Cached cover art
export interface CachedCoverArt {
  url: string;
  blob: Blob;
  cachedAt: Date;
}

// Offline play history (to sync when online)
export interface OfflinePlayHistory {
  id?: number;
  trackId: string;
  playedAt: Date;
  duration: number;
  synced: boolean;
}

// Offline liked tracks (to sync when online)
export interface OfflineLikedTrack {
  id?: number;
  trackId: string;
  likedAt: Date;
  action: 'like' | 'unlike';
  synced: boolean;
}

// Settings
export interface OfflineSettings {
  key: string;
  value: any;
}

class QoqnuzOfflineDB extends Dexie {
  downloadedTracks!: Table<DownloadedTrack, string>;
  downloadQueue!: Table<DownloadQueueItem, number>;
  cachedCovers!: Table<CachedCoverArt, string>;
  offlinePlayHistory!: Table<OfflinePlayHistory, number>;
  offlineLikedTracks!: Table<OfflineLikedTrack, number>;
  settings!: Table<OfflineSettings, string>;

  constructor() {
    super('QoqnuzOfflineDB');

    this.version(1).stores({
      downloadedTracks: 'id, artistId, albumId, downloadedAt, lastPlayedAt',
      downloadQueue: '++id, trackId, status, addedAt',
      cachedCovers: 'url, cachedAt',
      offlinePlayHistory: '++id, trackId, playedAt, synced',
      offlineLikedTracks: '++id, trackId, likedAt, synced',
      settings: 'key',
    });
  }
}

// Singleton instance
export const db = new QoqnuzOfflineDB();

// Helper functions

/**
 * Get total storage used by downloaded tracks
 */
export async function getStorageUsed(): Promise<number> {
  const tracks = await db.downloadedTracks.toArray();
  return tracks.reduce((total, track) => total + track.audioSize, 0);
}

/**
 * Get storage estimate from browser
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if a track is downloaded
 */
export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const track = await db.downloadedTracks.get(trackId);
  return !!track;
}

/**
 * Get all downloaded track IDs
 */
export async function getDownloadedTrackIds(): Promise<Set<string>> {
  const tracks = await db.downloadedTracks.toArray();
  return new Set(tracks.map(t => t.id));
}

/**
 * Get downloaded track count
 */
export async function getDownloadedTrackCount(): Promise<number> {
  return await db.downloadedTracks.count();
}

/**
 * Delete old tracks if storage is getting full
 * Removes least recently played tracks
 */
export async function cleanupStorage(targetBytes: number): Promise<number> {
  const currentUsage = await getStorageUsed();
  if (currentUsage <= targetBytes) return 0;

  const bytesToFree = currentUsage - targetBytes;
  let freedBytes = 0;

  // Get tracks sorted by last played (oldest first)
  const tracks = await db.downloadedTracks
    .orderBy('lastPlayedAt')
    .toArray();

  for (const track of tracks) {
    if (freedBytes >= bytesToFree) break;

    await db.downloadedTracks.delete(track.id);
    freedBytes += track.audioSize;
  }

  return freedBytes;
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  await db.downloadedTracks.clear();
  await db.downloadQueue.clear();
  await db.cachedCovers.clear();
  await db.offlinePlayHistory.clear();
  await db.offlineLikedTracks.clear();
}

export default db;
