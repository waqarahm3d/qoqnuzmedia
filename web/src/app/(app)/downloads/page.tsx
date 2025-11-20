'use client';

import { useState } from 'react';
import {
  useDownloadedTracks,
  useDownloadQueue,
  useStorageInfo,
  useDownloadManager,
  useOnlineStatus,
  formatBytes,
} from '@/lib/offline';
import { usePlayer } from '@/lib/contexts/PlayerContext';

// Icons
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const WifiOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function DownloadsPage() {
  const downloadedTracks = useDownloadedTracks();
  const downloadQueue = useDownloadQueue();
  const storageInfo = useStorageInfo();
  const { deleteDownload, clearCompleted, retryFailed } = useDownloadManager();
  const isOnline = useOnlineStatus();
  const { setQueue, playTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<'downloads' | 'queue'>('downloads');

  const pendingQueue = downloadQueue.filter(q => q.status === 'pending' || q.status === 'downloading');
  const completedQueue = downloadQueue.filter(q => q.status === 'completed' || q.status === 'failed');

  const handlePlay = async (track: any) => {
    // Play from offline storage - format matches PlayerContext Track type
    const offlineTrack = {
      id: track.id,
      title: track.title,
      artist: track.artistName,
      artistId: track.artistId,
      album: track.albumTitle || '',
      albumId: track.albumId,
      image: track.coverArtUrl,
      duration: Math.floor(track.duration_ms / 1000),
      isOffline: true,
    };

    const queue = downloadedTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artistName,
      artistId: t.artistId,
      album: t.albumTitle || '',
      albumId: t.albumId,
      image: t.coverArtUrl,
      duration: Math.floor(t.duration_ms / 1000),
      isOffline: true,
    }));

    setQueue(queue);
    playTrack(offlineTrack);
  };

  const handleDelete = async (trackId: string) => {
    if (confirm('Delete this download?')) {
      await deleteDownload(trackId);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DownloadIcon />
            Downloads
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {downloadedTracks.length} tracks downloaded
          </p>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full text-sm">
            <WifiOffIcon />
            Offline
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-surface/50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Storage Used</span>
          <span className="text-sm font-medium">
            {storageInfo.usedFormatted} / {storageInfo.quotaFormatted}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
          />
        </div>
        <p className="text-xs text-white/40 mt-2">
          {storageInfo.percentUsed}% of available storage used
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'downloads'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Downloads ({downloadedTracks.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Queue ({pendingQueue.length})
        </button>
      </div>

      {/* Downloads Tab */}
      {activeTab === 'downloads' && (
        <div className="space-y-2">
          {downloadedTracks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <DownloadIcon />
              </div>
              <p className="text-white/60">No downloaded tracks</p>
              <p className="text-white/40 text-sm mt-1">
                Download tracks to listen offline
              </p>
            </div>
          ) : (
            downloadedTracks.map(track => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 bg-surface/30 rounded-lg hover:bg-surface/50 transition-colors group"
              >
                {/* Cover */}
                <div className="w-12 h-12 rounded bg-white/10 flex-shrink-0 overflow-hidden">
                  {track.coverArtUrl ? (
                    <img
                      src={track.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <DownloadIcon />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-white/60 truncate">{track.artistName}</p>
                  <p className="text-xs text-white/40">
                    {formatBytes(track.audioSize)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlay(track)}
                    className="p-2 rounded-full bg-primary hover:bg-primary/80 transition-colors"
                  >
                    <PlayIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(track.id)}
                    className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Active Downloads */}
          {pendingQueue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">
                Downloading ({pendingQueue.length})
              </h3>
              <div className="space-y-2">
                {pendingQueue.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-surface/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded bg-white/10 flex-shrink-0 overflow-hidden">
                        {item.coverArtUrl ? (
                          <img
                            src={item.coverArtUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                            <DownloadIcon />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{item.title}</p>
                        <p className="text-xs text-white/60 truncate">{item.artistName}</p>
                      </div>
                      <span className="text-xs text-primary">
                        {item.status === 'downloading' ? `${item.progress}%` : 'Pending'}
                      </span>
                    </div>
                    {item.status === 'downloading' && (
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed/Failed */}
          {completedQueue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white/60">
                  History ({completedQueue.length})
                </h3>
                <button
                  onClick={clearCompleted}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {completedQueue.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-surface/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.title}</p>
                      <p className="text-xs text-white/60 truncate">{item.artistName}</p>
                    </div>
                    {item.status === 'completed' ? (
                      <span className="text-green-400">
                        <CheckIcon />
                      </span>
                    ) : (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                ))}
              </div>
              {completedQueue.some(q => q.status === 'failed') && (
                <button
                  onClick={retryFailed}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Retry failed downloads
                </button>
              )}
            </div>
          )}

          {pendingQueue.length === 0 && completedQueue.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">No downloads in queue</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
