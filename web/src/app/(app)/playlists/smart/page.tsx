'use client';

import { useState, useEffect } from 'react';
import { SmartPlaylistCard } from '@/components/playlists/SmartPlaylistCard';
import { TrackRow } from '@/components/ui/TrackRow';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { MusicIcon, SparklesIcon, HeartFilledIcon, DiscoverIcon } from '@/components/icons';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { supabase } from '@/lib/supabase-client';

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
  const [playlists, setPlaylists] = useState<Record<string, SmartPlaylistResult>>({});
  const [activePlaylist, setActivePlaylist] = useState<{
    type: string;
    data: SmartPlaylistResult | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { playTrack, setQueue, currentTrack, isPlaying } = usePlayer();

  // Helper to get auth headers for API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { 'Authorization': `Bearer ${session.access_token}` };
    }
    return {};
  };

  // Format track for player and play it
  const handlePlayTrack = (track: any, allTracks: any[]) => {
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

    // Set the full playlist as queue for continuous playback
    const formattedQueue = allTracks.map((t: any) => ({
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

  const smartPlaylists = [
    {
      type: 'daily_mix',
      title: 'Daily Mix',
      description: 'Your personalized mix based on recent listening',
      icon: MusicIcon,
    },
    {
      type: 'new_for_you',
      title: 'New for You',
      description: 'Recent uploads in your favorite genres',
      icon: SparklesIcon,
    },
    {
      type: 'forgotten_favorites',
      title: 'Forgotten Favorites',
      description: 'Liked tracks you haven\'t played in a while',
      icon: HeartFilledIcon,
    },
    {
      type: 'discovery',
      title: 'Discovery Weekly',
      description: 'Similar tracks to your favorites, but unheard',
      icon: DiscoverIcon,
    },
  ];

  // Fetch pre-generated playlists from automation system
  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);

      try {
        // Fetch all smart playlists from automation system
        const headers = await getAuthHeaders();
        const response = await fetch('/api/automation/smart-playlists', { headers });

        if (response.ok) {
          const data = await response.json();
          const results: Record<string, SmartPlaylistResult> = {};

          // Map playlists to our format
          data.playlists?.forEach((playlist: any) => {
            results[playlist.playlist_type] = {
              tracks: playlist.tracks || [],
              metadata: {
                algorithm: playlist.playlist_type,
                generatedAt: playlist.generated_at,
                trackCount: playlist.track_count || 0,
                criteria: playlist.metadata || {},
              },
            };
          });

          setPlaylists(results);
        } else if (response.status === 404) {
          // No playlists generated yet, show empty state
          setPlaylists({});
        }
      } catch (error) {
        console.error('Error fetching smart playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const [generating, setGenerating] = useState<string | null>(null);

  const viewPlaylist = async (type: string) => {
    // If we already have the playlist data, show it
    const playlistData = playlists[type];
    if (playlistData && playlistData.tracks.length > 0) {
      setActivePlaylist({
        type,
        data: playlistData,
      });
      return;
    }

    // Otherwise, generate it on-demand
    setGenerating(type);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/playlists/smart?type=${type}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const playlist = data.playlist || data;
        const result: SmartPlaylistResult = {
          tracks: playlist.tracks || [],
          metadata: playlist.metadata || {
            algorithm: type,
            generatedAt: new Date().toISOString(),
            trackCount: playlist.tracks?.length || 0,
            criteria: {},
          },
        };

        // Update playlists state
        setPlaylists(prev => ({
          ...prev,
          [type]: result,
        }));

        // Show the playlist
        setActivePlaylist({
          type,
          data: result,
        });
      } else {
        console.error('Failed to generate playlist:', response.status);
        alert('Failed to generate playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Error generating playlist. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const getPlaylistInfo = (type: string) => {
    return smartPlaylists.find((p) => p.type === type);
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="responsive-heading-lg font-bold mb-2">Smart Playlists</h1>
        <p className="text-white/60 responsive-text">Auto-generated playlists based on your listening habits</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Smart Playlist Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {smartPlaylists.map((playlist) => {
            const Icon = playlist.icon;
            const playlistData = playlists[playlist.type];

            return (
              <div
                key={playlist.type}
                onClick={() => viewPlaylist(playlist.type)}
                className="group relative bg-surface/40 hover:bg-surface rounded-lg p-6 transition-all duration-300 hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={32} className="text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white mb-1">{playlist.title}</h3>
                    <p className="text-sm text-white/60 mb-3">{playlist.description}</p>

                    {playlistData && (
                      <p className="text-xs text-white/40">{playlistData.tracks.length} tracks</p>
                    )}
                  </div>

                  {/* View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewPlaylist(playlist.type);
                    }}
                    disabled={generating === playlist.type}
                    className="px-4 py-2 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-full transition-all duration-200 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating === playlist.type ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>View</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generated Playlist */}
      {activePlaylist && activePlaylist.data && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="responsive-heading-md font-bold">
                {getPlaylistInfo(activePlaylist.type)?.title}
              </h2>
              <p className="text-white/60 responsive-text">
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
                {activePlaylist.data.tracks.map((track: any) => (
                  <TrackRow
                    key={track.id}
                    title={track.title}
                    artist={track.artists?.name || track.artist || 'Unknown Artist'}
                    image={getMediaUrl(track.albums?.cover_art_url || track.cover_art_url)}
                    showImage={true}
                    trackId={track.id}
                    artistId={track.artists?.id || track.artist_id}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                    onPlay={() => handlePlayTrack(track, activePlaylist.data!.tracks)}
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
      {!loading && !activePlaylist && Object.keys(playlists).length === 0 && (
        <div className="text-center py-12 text-white/40">
          <MusicIcon size={64} className="mx-auto mb-4 text-white/20" />
          <p>Listen to more music to get personalized playlists</p>
        </div>
      )}
    </div>
  );
}
