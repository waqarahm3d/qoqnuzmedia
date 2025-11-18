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

const moodInfo: Record<string, { emoji: string; title: string; description: string }> = {
  happy: { emoji: '😊', title: 'Happy & Upbeat', description: 'Joyful tracks to lift your spirits' },
  sad: { emoji: '😢', title: 'Sad & Melancholic', description: 'Emotional music for reflection' },
  energetic: { emoji: '⚡', title: 'Energetic & Powerful', description: 'High-energy tracks to pump you up' },
  chill: { emoji: '😌', title: 'Chill & Relaxed', description: 'Laid-back vibes for relaxation' },
  focused: { emoji: '🎯', title: 'Focused & Productive', description: 'Music to help you concentrate' },
  romantic: { emoji: '❤️', title: 'Romantic & Intimate', description: 'Love songs and intimate moments' },
  angry: { emoji: '😠', title: 'Angry & Aggressive', description: 'Intense tracks to channel emotions' },
  peaceful: { emoji: '☮️', title: 'Peaceful & Calm', description: 'Tranquil music for inner peace' },
};

export default function MoodBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const mood = params.mood as string;
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const info = moodInfo[mood] || { emoji: '🎵', title: mood, description: 'Browse tracks by mood' };

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/discovery/mood?mood=${mood}&limit=50`);

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

    fetchTracks();
  }, [mood]);

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
        <div className="text-6xl mb-4">{info.emoji}</div>
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
      ) : (
        <div className="text-center py-12">
          <p className="text-white/60 mb-2">No tracks found for this mood.</p>
          <p className="text-sm text-white/40">
            Tracks need mood metadata to appear here. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
