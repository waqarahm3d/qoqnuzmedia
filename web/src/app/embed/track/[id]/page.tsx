'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { getMediaUrl } from '@/lib/media-utils';

export default function TrackEmbedPage() {
  const params = useParams();
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrack();
  }, [params?.id]);

  const fetchTrack = async () => {
    try {
      const response = await fetch(`/api/tracks/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch track');
      const data = await response.json();
      setTrack(data.track);
    } catch (error) {
      console.error('Failed to fetch track:', error);
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

  if (!track) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Track not found</div>
      </div>
    );
  }

  const coverImage = getMediaUrl(track.albums?.cover_art_url || track.cover_art_url);

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-black flex items-center p-4">
      <div className="flex items-center gap-4 w-full">
        {/* Album Art */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={track.title}
            className="w-20 h-20 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">♪</span>
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{track.title}</h3>
          <p className="text-gray-400 text-sm truncate">
            {track.artists?.name || 'Unknown Artist'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatDuration(track.duration_ms || 0)}
            </span>
            <span className="text-xs text-gray-600">•</span>
            <a
              href={`${window.location.origin}/track/${track.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-500 hover:text-green-400"
            >
              Listen on Qoqnuz
            </a>
          </div>
        </div>

        {/* Play Button */}
        <a
          href={`${window.location.origin}/track/${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <PlayIcon size={20} className="ml-0.5" />
        </a>
      </div>
    </div>
  );
}
