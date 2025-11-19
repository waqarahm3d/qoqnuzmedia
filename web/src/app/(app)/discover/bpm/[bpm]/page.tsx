'use client';

import { useEffect, useState } from 'react';
import { TrackRow } from '@/components/ui/TrackRow';
import { useParams, useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { MusicIcon } from '@/components/icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function BPMBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { playTrack, setQueue, currentTrack, isPlaying } = usePlayer();
  const bpm = parseInt(params.bpm as string);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(10);

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
        const response = await fetch(`/api/discovery/bpm?target=${bpm}&range=${range}&limit=50`);

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

    if (bpm && bpm >= 40 && bpm <= 220) {
      fetchTracks();
    }
  }, [bpm, range, user]);

  const getActivitySuggestion = (bpm: number) => {
    if (bpm < 80) return 'Perfect for yoga and meditation';
    if (bpm < 100) return 'Great for walking and gentle exercise';
    if (bpm < 130) return 'Ideal for cycling and steady cardio';
    if (bpm < 160) return 'Perfect for jogging and moderate running';
    if (bpm < 180) return 'Great for running and high-intensity training';
    return 'Ideal for sprinting and HIIT workouts';
  };

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
          <MusicIcon className="text-primary" size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-2">{bpm} BPM</h1>
        <p className="text-white/60">{getActivitySuggestion(bpm)}</p>
      </div>

      {/* Range Control */}
      <div className="mb-6 bg-surface/40 rounded-lg p-4">
        <label className="block text-sm font-medium text-white/80 mb-2">
          BPM Range: ±{range}
        </label>
        <input
          type="range"
          min="5"
          max="30"
          value={range}
          onChange={(e) => setRange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{bpm - range} BPM</span>
          <span>{bpm + range} BPM</span>
        </div>
      </div>

      {/* Track List */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-400">Error: {error}</p>
        </div>
      ) : tracks.length > 0 ? (
        <div>
          <div className="mb-4 text-sm text-white/60">
            Found {tracks.length} tracks at {bpm} BPM (±{range})
          </div>
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
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/60 mb-2">No tracks found at {bpm} BPM (±{range}).</p>
          <p className="text-sm text-white/40">
            Try adjusting the range or tracks need BPM metadata to appear here.
          </p>
        </div>
      )}
    </div>
  );
}
