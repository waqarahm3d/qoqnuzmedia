'use client';

import { useEffect, useState } from 'react';
import { getLikedTracks } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface Track {
  id: string;
  title: string;
  duration_ms: number;
  artists: { id: string; name: string };
  albums: { id: string; title: string; cover_art_url: string };
}

interface LikedTrack {
  created_at: string;
  tracks: Track;
}

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<LikedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchLikedTracks();
  }, [user]);

  const fetchLikedTracks = async () => {
    try {
      const data = await getLikedTracks();
      setTracks(data);
    } catch (error) {
      console.error('Failed to fetch liked tracks:', error);
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
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-700 to-purple-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <div className="w-52 h-52 bg-gradient-to-br from-purple-400 to-blue-500 rounded shadow-2xl flex items-center justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="white"
                className="opacity-90"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase mb-2">Playlist</p>
              <h1 className="text-7xl font-black mb-6">Liked Songs</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{user?.email}</span>
                <span>•</span>
                <span>{tracks.length} songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {tracks.length === 0 ? (
          <div className="text-center py-20">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mx-auto mb-6 text-gray-600"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h3 className="text-2xl font-bold mb-2">No liked songs yet</h3>
            <p className="text-gray-400">
              Songs you like will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-[3rem_3fr_2fr_1fr] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
              <div className="text-center">#</div>
              <div>TITLE</div>
              <div>ALBUM</div>
              <div className="text-right">DURATION</div>
            </div>

            {/* Track List */}
            {tracks.map((item, index) => {
              const track = item.tracks;
              return (
                <div
                  key={track.id}
                  className="grid grid-cols-[3rem_3fr_2fr_1fr] gap-4 px-4 py-3 rounded hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-center text-gray-400 group-hover:text-white">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.albums.cover_art_url || '/placeholder-album.png'}
                      alt={track.albums.title}
                      className="w-10 h-10 rounded"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{track.title}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.artists.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-400 truncate">
                    {track.albums.title}
                  </div>
                  <div className="flex items-center justify-end text-gray-400">
                    {formatDuration(track.duration_ms)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
