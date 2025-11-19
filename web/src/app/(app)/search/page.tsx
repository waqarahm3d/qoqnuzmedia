'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchIcon, MusicIcon, MicrophoneIcon, AlbumIcon, PlaylistIcon } from '@/components/icons';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { TrackRow } from '@/components/ui/TrackRow';
import { useSearch, useGenres } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'albums' | 'artists' | 'playlists'>('all');

  const { results, loading } = useSearch(query, activeTab === 'all' ? undefined : activeTab);
  const { genres } = useGenres();
  const { playTrack, setQueue, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artists?.name || track.artist || 'Unknown Artist',
      artistId: track.artist_id,
      album: track.albums?.title || track.album || 'Unknown Album',
      albumId: track.album_id,
      image: getMediaUrl(track.albums?.cover_art_url || track.image),
      duration: track.duration_ms || 0,
    });
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'tracks', label: 'Songs' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'playlists', label: 'Playlists' },
  ] as const;

  const hasResults = results && (
    (results.tracks && results.tracks.length > 0) ||
    (results.albums && results.albums.length > 0) ||
    (results.artists && results.artists.length > 0) ||
    (results.playlists && results.playlists.length > 0)
  );

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Search Bar */}
      <div className="max-w-2xl mb-6">
        <form onSubmit={handleSearch}>
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<SearchIcon size={20} />}
            className="text-base"
          />
        </form>
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Results */}
      {!loading && query && hasResults && (
        <div className="space-y-8">
          {/* Tracks */}
          {(activeTab === 'all' || activeTab === 'tracks') && results.tracks && results.tracks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MusicIcon size={24} className="text-primary" />
                <h2 className="responsive-heading-md font-bold">Songs</h2>
              </div>
              <div className="space-y-1">
                {results.tracks.slice(0, activeTab === 'all' ? 4 : undefined).map((track: any) => (
                  <div key={track.id} className="group relative">
                    <TrackRow
                      title={track.title}
                      artist={track.artists?.name || 'Unknown Artist'}
                      image={getMediaUrl(track.albums?.cover_art_url)}
                      showImage={true}
                      trackId={track.id}
                      artistId={track.artist_id || track.artists?.id}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onPlay={() => handlePlayTrack(track)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Track
                    </span>
                  </div>
                ))}
              </div>
              {activeTab === 'all' && results.tracks.length > 4 && (
                <button
                  onClick={() => setActiveTab('tracks')}
                  className="mt-4 text-sm font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Show all songs
                </button>
              )}
            </section>
          )}

          {/* Artists */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists && results.artists.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MicrophoneIcon size={24} className="text-primary" />
                <h2 className="responsive-heading-md font-bold">Artists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.artists.slice(0, activeTab === 'all' ? 6 : undefined).map((artist: any) => (
                  <div key={artist.id} className="relative group">
                    <Card
                      title={artist.name}
                      subtitle="Artist"
                      href={`/artist/${artist.id}`}
                      image={getMediaUrl(artist.avatar_url)}
                      type="circle"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      Artist
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {(activeTab === 'all' || activeTab === 'albums') && results.albums && results.albums.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlbumIcon size={24} className="text-primary" />
                <h2 className="responsive-heading-md font-bold">Albums</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.albums.slice(0, activeTab === 'all' ? 6 : undefined).map((album: any) => (
                  <div key={album.id} className="relative group">
                    <Card
                      title={album.title}
                      subtitle={album.artists?.name || 'Unknown Artist'}
                      href={`/album/${album.id}`}
                      image={getMediaUrl(album.cover_art_url)}
                      onPlay={() => window.location.href = `/album/${album.id}`}
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      Album
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {(activeTab === 'all' || activeTab === 'playlists') && results.playlists && results.playlists.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <PlaylistIcon size={24} className="text-primary" />
                <h2 className="responsive-heading-md font-bold">Playlists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.playlists.slice(0, activeTab === 'all' ? 6 : undefined).map((playlist: any) => (
                  <div key={playlist.id} className="relative group">
                    <Card
                      title={playlist.name}
                      subtitle={playlist.description}
                      href={`/playlist/${playlist.id}`}
                      image={getMediaUrl(playlist.cover_url)}
                      onPlay={() => window.location.href = `/playlist/${playlist.id}`}
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      Playlist
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && query && !hasResults && (
        <div className="text-center py-12">
          <p className="text-xl text-white/60">No results found for "{query}"</p>
          <p className="text-sm text-white/40 mt-2">Try searching for something else</p>
        </div>
      )}

      {/* Browse Genres (when no search) */}
      {!query && (
        <div>
          <h2 className="responsive-heading-md font-bold mb-4">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.length > 0 ? (
              genres.map((genre: any, index: number) => {
                const colors = [
                  'from-pink-500 to-pink-700',
                  'from-red-500 to-red-700',
                  'from-purple-500 to-purple-700',
                  'from-blue-500 to-blue-700',
                  'from-yellow-500 to-yellow-700',
                  'from-[#ff5c2e] to-[#d43e11]',
                  'from-indigo-500 to-indigo-700',
                  'from-orange-500 to-orange-700',
                ];
                const color = colors[index % colors.length];

                return (
                  <a
                    key={genre.id}
                    href={`/genre/${genre.slug || genre.name.toLowerCase()}`}
                    className={`relative h-40 rounded-lg overflow-hidden bg-gradient-to-br ${color} p-4 hover:scale-105 transition-transform`}
                  >
                    <h3 className="text-2xl font-bold">{genre.name}</h3>
                  </a>
                );
              })
            ) : (
              // Fallback genres if none in database
              [
                { name: 'Pop', color: 'from-pink-500 to-pink-700' },
                { name: 'Rock', color: 'from-red-500 to-red-700' },
                { name: 'Hip-Hop', color: 'from-purple-500 to-purple-700' },
                { name: 'Electronic', color: 'from-blue-500 to-blue-700' },
                { name: 'Jazz', color: 'from-yellow-500 to-yellow-700' },
                { name: 'Classical', color: 'from-[#ff5c2e] to-[#d43e11]' },
                { name: 'R&B', color: 'from-indigo-500 to-indigo-700' },
                { name: 'Country', color: 'from-orange-500 to-orange-700' },
              ].map((genre, index) => (
                <a
                  key={index}
                  href={`/genre/${genre.name.toLowerCase()}`}
                  className={`relative h-40 rounded-lg overflow-hidden bg-gradient-to-br ${genre.color} p-4 hover:scale-105 transition-transform`}
                >
                  <h3 className="text-2xl font-bold">{genre.name}</h3>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
