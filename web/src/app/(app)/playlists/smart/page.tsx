'use client';

import { useState } from 'react';
import { SmartPlaylistCard } from '@/components/playlists/SmartPlaylistCard';
import { TrackRow } from '@/components/ui/TrackRow';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface SmartPlaylistResult {
  tracks: any[];
  metadata: {
    algorithm: string;
    generatedAt: string;
    trackCount: number;
    criteria: Record<string, any>;
  };
}

export default function SmartPlaylistsPage() {
  const [activePlaylist, setActivePlaylist] = useState<{
    type: string;
    data: SmartPlaylistResult | null;
  } | null>(null);
  const router = useRouter();

  const smartPlaylists = [
    {
      type: 'daily_mix',
      title: 'Daily Mix',
      description: 'Your personalized mix based on recent listening',
      icon: '🎧',
    },
    {
      type: 'new_for_you',
      title: 'New for You',
      description: 'Recent uploads in your favorite genres',
      icon: '✨',
    },
    {
      type: 'forgotten_favorites',
      title: 'Forgotten Favorites',
      description: 'Liked tracks you haven\'t played in a while',
      icon: '💎',
    },
    {
      type: 'discovery',
      title: 'Discovery Weekly',
      description: 'Similar tracks to your favorites, but unheard',
      icon: '🔍',
    },
  ];

  const generatePlaylist = async (type: string) => {
    try {
      const response = await fetch(`/api/playlists/smart?type=${type}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }

      const data = await response.json();

      setActivePlaylist({
        type,
        data: data.data.playlist || data.data,
      });
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Failed to generate playlist. Please try again.');
    }
  };

  const getPlaylistInfo = (type: string) => {
    return smartPlaylists.find((p) => p.type === type);
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Smart Playlists</h1>
        <p className="text-white/60">Auto-generated playlists based on your listening habits</p>
      </div>

      {/* Smart Playlist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {smartPlaylists.map((playlist) => (
          <SmartPlaylistCard
            key={playlist.type}
            title={playlist.title}
            description={playlist.description}
            icon={playlist.icon}
            type={playlist.type}
            trackCount={
              activePlaylist?.type === playlist.type
                ? activePlaylist.data?.tracks.length
                : undefined
            }
            onGenerate={() => generatePlaylist(playlist.type)}
          />
        ))}
      </div>

      {/* Generated Playlist */}
      {activePlaylist && activePlaylist.data && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {getPlaylistInfo(activePlaylist.type)?.title}
              </h2>
              <p className="text-white/60 text-sm">
                {activePlaylist.data.tracks.length} tracks • Generated just now
              </p>
            </div>
            <button
              onClick={() => setActivePlaylist(null)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Track List */}
          <div className="bg-surface/20 rounded-lg overflow-hidden">
            {activePlaylist.data.tracks.length > 0 ? (
              <div className="divide-y divide-white/5">
                {activePlaylist.data.tracks.map((track: any, index: number) => (
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
            ) : (
              <div className="p-8 text-center text-white/60">
                <p>No tracks found for this playlist.</p>
                <p className="text-sm mt-2">Try listening to more music to improve recommendations.</p>
              </div>
            )}
          </div>

          {/* Metadata (Debug Info) */}
          {activePlaylist.data.metadata && (
            <details className="mt-4 text-xs text-white/40">
              <summary className="cursor-pointer hover:text-white/60">
                Generation details
              </summary>
              <pre className="mt-2 p-3 bg-black/20 rounded overflow-auto">
                {JSON.stringify(activePlaylist.data.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Empty State */}
      {!activePlaylist && (
        <div className="text-center py-12 text-white/40">
          <div className="text-6xl mb-4">🎵</div>
          <p>Click "Generate" on any playlist to get started</p>
        </div>
      )}
    </div>
  );
}
