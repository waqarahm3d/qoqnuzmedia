/**
 * Download Manager
 * Handles downloading tracks for offline playback
 */

import db, {
  DownloadedTrack,
  DownloadQueueItem,
  isTrackDownloaded,
  getStorageUsed,
  formatBytes,
} from './db';

// Event types
type DownloadEventType = 'progress' | 'complete' | 'error' | 'queue-update';
type DownloadEventCallback = (data: any) => void;

// Download manager singleton
class DownloadManager {
  private isProcessing = false;
  private abortController: AbortController | null = null;
  private listeners: Map<DownloadEventType, Set<DownloadEventCallback>> = new Map();
  private maxConcurrent = 1; // Process one at a time for now

  constructor() {
    // Initialize listener maps
    ['progress', 'complete', 'error', 'queue-update'].forEach(type => {
      this.listeners.set(type as DownloadEventType, new Set());
    });
  }

  /**
   * Subscribe to download events
   */
  on(event: DownloadEventType, callback: DownloadEventCallback): () => void {
    this.listeners.get(event)?.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: DownloadEventType, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Add a track to the download queue
   */
  async addToQueue(track: {
    id: string;
    title: string;
    artistName: string;
    coverArtUrl?: string;
  }): Promise<void> {
    // Check if already downloaded
    if (await isTrackDownloaded(track.id)) {
      console.log(`[Download] Track already downloaded: ${track.title}`);
      return;
    }

    // Check if already in queue
    const existing = await db.downloadQueue
      .where('trackId')
      .equals(track.id)
      .first();

    if (existing) {
      console.log(`[Download] Track already in queue: ${track.title}`);
      return;
    }

    // Add to queue
    await db.downloadQueue.add({
      trackId: track.id,
      title: track.title,
      artistName: track.artistName,
      coverArtUrl: track.coverArtUrl,
      status: 'pending',
      progress: 0,
      addedAt: new Date(),
    });

    console.log(`[Download] Added to queue: ${track.title}`);
    this.emit('queue-update', await this.getQueue());

    // Start processing if not already
    this.processQueue();
  }

  /**
   * Add multiple tracks to download queue
   */
  async addMultipleToQueue(tracks: Array<{
    id: string;
    title: string;
    artistName: string;
    coverArtUrl?: string;
  }>): Promise<void> {
    for (const track of tracks) {
      await this.addToQueue(track);
    }
  }

  /**
   * Remove a track from the queue
   */
  async removeFromQueue(trackId: string): Promise<void> {
    await db.downloadQueue.where('trackId').equals(trackId).delete();
    this.emit('queue-update', await this.getQueue());
  }

  /**
   * Get current download queue
   */
  async getQueue(): Promise<DownloadQueueItem[]> {
    return await db.downloadQueue.orderBy('addedAt').toArray();
  }

  /**
   * Get pending downloads count
   */
  async getPendingCount(): Promise<number> {
    return await db.downloadQueue
      .where('status')
      .anyOf(['pending', 'downloading'])
      .count();
  }

  /**
   * Process the download queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        // Get next pending item
        const item = await db.downloadQueue
          .where('status')
          .equals('pending')
          .first();

        if (!item || !item.id) break;

        // Update status to downloading
        await db.downloadQueue.update(item.id, { status: 'downloading' });
        this.emit('queue-update', await this.getQueue());

        try {
          await this.downloadTrack(item);

          // Mark as completed
          await db.downloadQueue.update(item.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
          });

          this.emit('complete', { trackId: item.trackId, title: item.title });
        } catch (error: any) {
          console.error(`[Download] Failed: ${item.title}`, error);

          // Mark as failed
          await db.downloadQueue.update(item.id, {
            status: 'failed',
            error: error.message,
          });

          this.emit('error', {
            trackId: item.trackId,
            title: item.title,
            error: error.message,
          });
        }

        this.emit('queue-update', await this.getQueue());
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Download a single track
   */
  private async downloadTrack(item: DownloadQueueItem): Promise<void> {
    if (!item.id) throw new Error('Invalid queue item');

    // Get stream URL
    const streamResponse = await fetch(`/api/stream/${item.trackId}?quality=high`);
    if (!streamResponse.ok) {
      throw new Error(`Failed to get stream URL: ${streamResponse.statusText}`);
    }

    const { url: streamUrl } = await streamResponse.json();
    if (!streamUrl) {
      throw new Error('No stream URL returned');
    }

    // Create abort controller for this download
    this.abortController = new AbortController();

    // Download the audio file
    const audioResponse = await fetch(streamUrl, {
      signal: this.abortController.signal,
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const contentLength = audioResponse.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength) : 0;

    // Read the response as a stream for progress tracking
    const reader = audioResponse.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const chunks: BlobPart[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // Update progress
      if (totalSize > 0) {
        const progress = Math.round((receivedLength / totalSize) * 100);
        await db.downloadQueue.update(item.id, { progress });
        this.emit('progress', {
          trackId: item.trackId,
          progress,
          received: receivedLength,
          total: totalSize,
        });
      }
    }

    // Create blob from chunks
    const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

    // Get track metadata
    const metadataResponse = await fetch(`/api/tracks/${item.trackId}`);
    const metadata = metadataResponse.ok ? await metadataResponse.json() : null;

    // Store downloaded track
    const downloadedTrack: DownloadedTrack = {
      id: item.trackId,
      title: item.title,
      artistId: metadata?.track?.artist_id || '',
      artistName: item.artistName,
      albumId: metadata?.track?.album_id,
      albumTitle: metadata?.track?.albums?.title,
      coverArtUrl: item.coverArtUrl,
      duration_ms: metadata?.track?.duration_ms || 0,
      genres: metadata?.track?.genres,
      audioBlob,
      audioSize: audioBlob.size,
      downloadedAt: new Date(),
      playCount: 0,
    };

    await db.downloadedTracks.put(downloadedTrack);

    // Cache cover art if available
    if (item.coverArtUrl) {
      try {
        await this.cacheCoverArt(item.coverArtUrl);
      } catch (e) {
        // Non-critical, ignore
      }
    }

    console.log(`[Download] Completed: ${item.title} (${formatBytes(audioBlob.size)})`);
  }

  /**
   * Cache cover art image
   */
  private async cacheCoverArt(url: string): Promise<void> {
    const existing = await db.cachedCovers.get(url);
    if (existing) return;

    const response = await fetch(url);
    if (!response.ok) return;

    const blob = await response.blob();
    await db.cachedCovers.put({
      url,
      blob,
      cachedAt: new Date(),
    });
  }

  /**
   * Cancel current download
   */
  cancelCurrent(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Clear completed/failed items from queue
   */
  async clearCompleted(): Promise<void> {
    await db.downloadQueue
      .where('status')
      .anyOf(['completed', 'failed'])
      .delete();
    this.emit('queue-update', await this.getQueue());
  }

  /**
   * Retry failed downloads
   */
  async retryFailed(): Promise<void> {
    await db.downloadQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', error: undefined, progress: 0 });
    this.emit('queue-update', await this.getQueue());
    this.processQueue();
  }

  /**
   * Delete a downloaded track
   */
  async deleteDownload(trackId: string): Promise<void> {
    await db.downloadedTracks.delete(trackId);
  }

  /**
   * Get all downloaded tracks
   */
  async getDownloadedTracks(): Promise<DownloadedTrack[]> {
    return await db.downloadedTracks.orderBy('downloadedAt').reverse().toArray();
  }

  /**
   * Get a downloaded track's audio blob URL
   */
  async getTrackBlobUrl(trackId: string): Promise<string | null> {
    const track = await db.downloadedTracks.get(trackId);
    if (!track) return null;

    // Update last played
    await db.downloadedTracks.update(trackId, {
      lastPlayedAt: new Date(),
      playCount: track.playCount + 1,
    });

    return URL.createObjectURL(track.audioBlob);
  }

  /**
   * Get cached cover art blob URL
   */
  async getCoverBlobUrl(url: string): Promise<string | null> {
    const cached = await db.cachedCovers.get(url);
    if (!cached) return null;
    return URL.createObjectURL(cached.blob);
  }
}

// Export singleton instance
export const downloadManager = new DownloadManager();
export default downloadManager;
