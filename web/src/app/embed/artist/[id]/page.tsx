'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlayIcon } from '@/components/icons';
import { getMediaUrl } from '@/lib/media-utils';

export default function ArtistEmbedPage() {
  const params = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtist();
  }, [params?.id]);

  const fetchArtist = async () => {
    try {
      const response = await fetch(`/api/artists/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch artist');
      const data = await response.json();
      setArtist(data.artist);
    } catch (error) {
      console.error('Failed to fetch artist:', error);
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

  if (!artist) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Artist not found</div>
      </div>
    );
  }

  const avatarImage = getMediaUrl(artist.avatar_url);

  return (
    <div className="h-full bg-gradient-to-br from-purple-900/20 to-black overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {avatarImage ? (
            <img
              src={avatarImage}
              alt={artist.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👤</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {artist.verified && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              )}
              <h3 className="text-white font-bold truncate">{artist.name}</h3>
            </div>
            <p className="text-gray-400 text-sm">
              {artist.verified ? 'Verified Artist' : 'Artist'}
            </p>
            <a
              href={`${window.location.origin}/artist/${artist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#ff5c2e] hover:text-[#ff5c2e]"
            >
              Open in Qoqnuz
            </a>
          </div>
        </div>
      </div>

      {/* Popular Tracks */}
      <div className="p-2">
        {artist.tracks && artist.tracks.length > 0 ? (
          <>
            <div className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase">
              Popular Tracks
            </div>
            <div className="space-y-1">
              {artist.tracks.slice(0, 10).map((track: any, index: number) => (
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
                      {track.albums?.title || 'Single'}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatDuration(track.duration_ms || 0)}
                  </span>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tracks available
          </div>
        )}
      </div>
    </div>
  );
}
