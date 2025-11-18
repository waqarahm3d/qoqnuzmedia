'use client';

import { useEffect, useState } from 'react';
import { getLikedTracks } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { TrackRow } from '@/components/ui/TrackRow';
import { HeartFilledIcon } from '@/components/icons';

interface Track {
  id: string;
  title: string;
  duration_ms: number;
  artist_id: string;
  album_id?: string;
  artists: { id: string; name: string };
  albums?: { id: string; title: string; cover_art_url: string };
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
  const { playTrack } = usePlayer();

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchLikedTracks();
  }, [user, router]);

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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8 flex items-end gap-6">
        <div className="w-52 h-52 bg-gradient-to-br from-purple-400 to-blue-500 rounded shadow-2xl flex items-center justify-center flex-shrink-0">
          <HeartFilledIcon size={80} className="text-white opacity-90" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase mb-2 text-white/60">Playlist</p>
          <h1 className="text-4xl lg:text-7xl font-black mb-6">Liked Songs</h1>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="font-semibold text-white">{user?.email}</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {tracks.length === 0 ? (
        <div className="text-center py-20">
          <HeartFilledIcon size={80} className="mx-auto mb-6 text-white/20" />
          <h3 className="text-2xl font-bold mb-2">No liked songs yet</h3>
          <p className="text-white/60">
            Songs you like will appear here
          </p>
        </div>
      ) : (
        <div className="bg-black/20 rounded-lg p-4">
          <div className="space-y-2">
            {tracks.map((item, index) => {
              const track = item.tracks;
              if (!track) return null;
              return (
                <TrackRow
                  key={track.id}
                  number={index + 1}
                  title={track.title}
                  artist={track.artists?.name || 'Unknown Artist'}
                  album={track.albums?.title || 'Single'}
                  image={getMediaUrl(track.albums?.cover_art_url)}
                  duration={formatDuration(track.duration_ms)}
                  trackId={track.id}
                  artistId={track.artist_id}
                  albumId={track.album_id}
                  showImage={true}
                  onPlay={() => {
                    playTrack({
                      id: track.id,
                      title: track.title,
                      artist: track.artists?.name || 'Unknown Artist',
                      artistId: track.artist_id,
                      album: track.albums?.title || 'Single',
                      albumId: track.album_id,
                      image: getMediaUrl(track.albums?.cover_art_url),
                      duration: track.duration_ms || 0,
                    });
                  }}
                  onLike={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
