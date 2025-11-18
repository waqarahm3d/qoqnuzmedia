'use client';

import { useEffect, useState } from 'react';
import { TrackRow } from '@/components/ui/TrackRow';
import { useParams, useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function BPMBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const bpm = parseInt(params.bpm as string);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(10);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/discovery/bpm?target=${bpm}&range=${range}&limit=50`);

        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }

        const data = await response.json();
        setTracks(data.data.tracks || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bpm && bpm >= 40 && bpm <= 220) {
      fetchTracks();
    }
  }, [bpm, range]);

  const getActivitySuggestion = (bpm: number) => {
    if (bpm < 80) return 'Perfect for yoga and meditation';
    if (bpm < 100) return 'Great for walking and gentle exercise';
    if (bpm < 130) return 'Ideal for cycling and steady cardio';
    if (bpm < 160) return 'Perfect for jogging and moderate running';
    if (bpm < 180) return 'Great for running and high-intensity training';
    return 'Ideal for sprinting and HIIT workouts';
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
        <div className="text-6xl mb-4">🎵</div>
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
              {tracks.map((track: any, index: number) => (
                <TrackRow
                  key={track.id}
                  number={index + 1}
                  title={track.title}
                  artist={track.artists?.name || track.artist || 'Unknown Artist'}
                  album={track.albums?.title || track.album || 'Unknown Album'}
                  duration={formatDuration(track.duration_ms || 0)}
                  image={getMediaUrl(track.albums?.cover_art_url || track.cover_art_url)}
                  showImage={true}
                  showAlbum={true}
                  trackId={track.id}
                  artistId={track.artists?.id || track.artist_id}
                  albumId={track.albums?.id || track.album_id}
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
