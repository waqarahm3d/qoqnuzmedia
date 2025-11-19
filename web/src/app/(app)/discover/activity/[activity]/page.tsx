'use client';

import { useEffect, useState } from 'react';
import { TrackRow } from '@/components/ui/TrackRow';
import { useParams, useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { SparklesIcon, MusicIcon } from '@/components/icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const activityInfo: Record<string, { icon: React.ComponentType<any>; title: string; description: string }> = {
  workout: { icon: SparklesIcon, title: 'Workout', description: 'High-energy tracks for your gym session' },
  running: { icon: SparklesIcon, title: 'Running', description: 'Perfect cadence for your run' },
  study: { icon: MusicIcon, title: 'Study & Focus', description: 'Concentration-friendly music' },
  sleep: { icon: MusicIcon, title: 'Sleep & Rest', description: 'Calm tracks for peaceful sleep' },
  party: { icon: SparklesIcon, title: 'Party', description: 'Dance and celebration music' },
  driving: { icon: MusicIcon, title: 'Driving', description: 'Road trip soundtrack' },
  cooking: { icon: MusicIcon, title: 'Cooking', description: 'Kitchen background music' },
  meditation: { icon: MusicIcon, title: 'Meditation', description: 'Mindful and peaceful tracks' },
};

export default function ActivityBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { playTrack, setQueue, currentTrack, isPlaying } = usePlayer();
  const activity = params.activity as string;
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const info = activityInfo[activity] || { icon: MusicIcon, title: activity, description: 'Browse tracks by activity' };
  const IconComponent = info.icon;

  // Format track for player and play it
  const handlePlayTrack = (track: any) => {
    const formattedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artists?.name || track.artist || 'Unknown Artist',
      artistId: track.artists?.id || track.artist_id,
      album: track.albums?.title || track.album || 'Unknown Album',
      albumId: track.albums?.id || track.album_id,
      image: getMediaUrl(track.albums?.cover_art_url || track.cover_art_url),
      duration: track.duration_ms || 0,
    };

    // Set the full list as queue for continuous playback
    const formattedQueue = tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artists?.name || t.artist || 'Unknown Artist',
      artistId: t.artists?.id || t.artist_id,
      album: t.albums?.title || t.album || 'Unknown Album',
      albumId: t.albums?.id || t.album_id,
      image: getMediaUrl(t.albums?.cover_art_url || t.cover_art_url),
      duration: t.duration_ms || 0,
    }));

    setQueue(formattedQueue);
    playTrack(formattedTrack, true);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/signin');
      return;
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!user) return;

    const fetchTracks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/discovery/activity?activity=${activity}&limit=50`);

        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }

        const data = await response.json();
        // API returns data directly via apiSuccess(), not wrapped in data.data
        setTracks(data.tracks || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [activity, user]);

  if (loading || authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-white/60 hover:text-white transition-colors flex items-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="mb-8">
        <div className="mb-4">
          <IconComponent className="text-primary" size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-2 capitalize">{info.title}</h1>
        <p className="text-white/60">{info.description}</p>
      </div>

      {/* Track List */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-400">Error: {error}</p>
        </div>
      ) : tracks.length > 0 ? (
        <div className="bg-surface/20 rounded-lg overflow-hidden">
          <div className="divide-y divide-white/5">
            {tracks.map((track: any) => (
              <TrackRow
                key={track.id}
                title={track.title}
                artist={track.artists?.name || track.artist || 'Unknown Artist'}
                image={getMediaUrl(track.albums?.cover_art_url || track.cover_art_url)}
                showImage={true}
                trackId={track.id}
                artistId={track.artists?.id || track.artist_id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => handlePlayTrack(track)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/60 mb-2">No tracks found for this activity.</p>
          <p className="text-sm text-white/40">
            Tracks need activity metadata to appear here. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
