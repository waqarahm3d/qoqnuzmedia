'use client';

import { useEffect, useState } from 'react';
import { getPlayHistory } from '@/lib/api/client';
import { TrackRow } from '@/components/ui/TrackRow';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';

export default function RecentPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data: any = await getPlayHistory(50);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artists?.name || 'Unknown Artist',
      artistId: track.artist_id,
      album: track.albums?.title || 'Unknown Album',
      albumId: track.album_id,
      image: getMediaUrl(track.albums?.cover_art_url),
      duration: track.duration_ms || 0,
    });
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
      <h1 className="text-4xl font-bold mb-8">Recently Played</h1>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No playback history yet</p>
          <p className="text-gray-500 text-sm mt-2">Start listening to see your history here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((item: any, index: number) => {
            const track = item.track || item.tracks;
            if (!track) return null;

            return (
              <TrackRow
                key={`${track.id}-${index}`}
                title={track.title}
                artist={track.artists?.name || track.artist || 'Unknown Artist'}
                album={track.albums?.title || track.album || 'Unknown Album'}
                duration={track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '0:00'}
                image={getMediaUrl(track.albums?.cover_art_url || track.image)}
                showImage={true}
                onPlay={() => handlePlayTrack(track)}
                onLike={() => {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
