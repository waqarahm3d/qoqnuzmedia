'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlayIcon } from '@/components/icons';
import { getMediaUrl } from '@/lib/media-utils';

export default function AlbumEmbedPage() {
  const params = useParams();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbum();
  }, [params?.id]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch album');
      const data = await response.json();
      setAlbum(data.album);
    } catch (error) {
      console.error('Failed to fetch album:', error);
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

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Album not found</div>
      </div>
    );
  }

  const coverImage = getMediaUrl(album.cover_art_url);

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-black overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {coverImage ? (
            <img
              src={coverImage}
              alt={album.title}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">♪</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{album.title}</h3>
            <p className="text-gray-400 text-sm truncate">
              {album.artists?.name || 'Unknown Artist'}
            </p>
            <a
              href={`${window.location.origin}/album/${album.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-500 hover:text-green-400"
            >
              Open in Qoqnuz
            </a>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="p-2">
        {album.tracks && album.tracks.length > 0 ? (
          <div className="space-y-1">
            {album.tracks.map((track: any, index: number) => (
              <a
                key={track.id}
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
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{track.title}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {track.artists?.name || album.artists?.name || 'Unknown'}
                  </p>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDuration(track.duration_ms || 0)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tracks available
          </div>
        )}
      </div>
    </div>
  );
}
