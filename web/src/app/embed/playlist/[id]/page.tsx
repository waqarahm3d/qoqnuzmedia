'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlayIcon } from '@/components/icons';
import { getMediaUrl } from '@/lib/media-utils';

export default function PlaylistEmbedPage() {
  const params = useParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [params?.id]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      const data = await response.json();
      setPlaylist(data.playlist);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Playlist not found</div>
      </div>
    );
  }

  const coverImage = getMediaUrl(playlist.cover_url);

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/20 to-black overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {coverImage ? (
            <img
              src={coverImage}
              alt={playlist.name}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">♪</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{playlist.name}</h3>
            <p className="text-gray-400 text-sm truncate">
              {playlist.description || 'Playlist'}
            </p>
            <a
              href={`${window.location.origin}/playlist/${playlist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#ff5c2e] hover:text-[#ff5c2e]"
            >
              Open in Qoqnuz
            </a>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="p-2">
        {playlist.playlist_tracks && playlist.playlist_tracks.length > 0 ? (
          <div className="space-y-1">
            {playlist.playlist_tracks.map((item: any, index: number) => {
              const track = item.track || item.tracks;
              if (!track) return null;

              return (
                <a
                  key={`${track.id}-${index}`}
                  href={`${window.location.origin}/track/${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/50 transition-colors group"
                >
                  <span className="text-gray-500 text-sm w-6 text-center group-hover:hidden">
                    {index + 1}
                  </span>
                  <PlayIcon
                    size={16}
                    className="text-white w-6 hidden group-hover:block"
                  />
                  {track.albums?.cover_art_url && (
                    <img
                      src={getMediaUrl(track.albums.cover_art_url) || ''}
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{track.title}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artists?.name || 'Unknown Artist'}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatDuration(track.duration_ms || 0)}
                  </span>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tracks in this playlist
          </div>
        )}
      </div>
    </div>
  );
}
