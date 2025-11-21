'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/ui/input/SearchInput';
import { AlbumCard, TrackCard } from '@/components/ui';
import { Album, Track } from '@/lib/types/music';
import { usePlayerStore } from '@/lib/stores';
import { cn } from '@/lib/utils/cn';

/**
 * Search Page
 *
 * Advanced search with:
 * - Real-time search results
 * - Multiple content types (tracks, albums, artists, playlists)
 * - Filters
 * - Top result highlighting
 * - Empty states
 *
 * Features:
 * - Debounced search (300ms)
 * - Tab-based filtering
 * - Responsive grid layouts
 * - Loading states
 * - No results state
 */

type FilterTab = 'all' | 'tracks' | 'albums' | 'artists' | 'playlists';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(false);

  const { play } = usePlayerStore();

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handlePlayTrack = (track: Track) => {
    play(track);
  };

  const handlePlayAlbum = (album: Album) => {
    // In real app, fetch album tracks
    console.log('Play album:', album.id);
  };

  const hasResults = query.length > 0;
  const showResults = hasResults && !loading;

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Search Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Search</h1>
        <SearchInput
          placeholder="What do you want to listen to?"
          onSearch={handleSearch}
          loading={loading}
          initialQuery={initialQuery}
          size="lg"
        />
      </div>

      {/* Results */}
      {showResults ? (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {(['all', 'tracks', 'albums', 'artists', 'playlists'] as FilterTab[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap',
                  activeFilter === filter
                    ? 'bg-[var(--qz-primary)] text-white'
                    : 'bg-[var(--qz-bg-surface)] text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-bg-surface-hover)]'
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Results Content */}
          <div className="space-y-8">
            {/* Top Result */}
            {(activeFilter === 'all' || activeFilter === 'tracks') && mockTracks.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Top Result</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TopResult
                    type="track"
                    title={mockTracks[0].title}
                    subtitle={mockTracks[0].artist}
                    image={mockTracks[0].artwork_url}
                    onPlay={() => handlePlayTrack(mockTracks[0])}
                  />

                  {/* Quick Tracks */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold mb-2">Songs</h3>
                    {mockTracks.slice(0, 4).map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        onPlay={handlePlayTrack}
                        showArtwork={false}
                        showAlbum={false}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Songs */}
            {(activeFilter === 'all' || activeFilter === 'tracks') && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Songs</h2>
                <div className="space-y-1">
                  {mockTracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      index={activeFilter === 'tracks' ? index + 1 : undefined}
                      onPlay={handlePlayTrack}
                      showArtwork
                      showAlbum
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {(activeFilter === 'all' || activeFilter === 'albums') && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mockAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} onPlay={handlePlayAlbum} />
                  ))}
                </div>
              </section>
            )}

            {/* Artists */}
            {(activeFilter === 'all' || activeFilter === 'artists') && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mockArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      ) : query.length > 0 && loading ? (
        /* Loading State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-[var(--qz-text-secondary)]">Searching...</p>
          </div>
        </div>
      ) : query.length === 0 ? (
        /* Browse Categories */
        <section>
          <h2 className="text-2xl font-bold mb-4">Browse All</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {browseCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// Top Result Component
function TopResult({
  type,
  title,
  subtitle,
  image,
  onPlay,
}: {
  type: string;
  title: string;
  subtitle: string;
  image?: string;
  onPlay: () => void;
}) {
  return (
    <div className="group relative p-6 bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] rounded-lg transition-colors cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-[var(--qz-bg-base)] flex-shrink-0">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MusicIcon className="w-10 h-10 text-[var(--qz-text-tertiary)]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-2">
          <h3 className="text-2xl font-bold mb-1 truncate">{title}</h3>
          <p className="text-[var(--qz-text-secondary)] truncate">{subtitle}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-[var(--qz-bg-base)] rounded text-xs font-medium capitalize">
            {type}
          </span>
        </div>
      </div>

      <button
        onClick={onPlay}
        className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-[var(--qz-primary)] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all hover:scale-110"
      >
        <PlayIcon className="w-5 h-5 ml-0.5" />
      </button>
    </div>
  );
}

// Artist Card Component
function ArtistCard({ artist }: { artist: { id: string; name: string; image?: string } }) {
  return (
    <div className="group p-4 bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] rounded-lg transition-colors cursor-pointer">
      <div className="aspect-square rounded-full overflow-hidden bg-[var(--qz-bg-base)] mb-4">
        {artist.image ? (
          <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon className="w-16 h-16 text-[var(--qz-text-tertiary)]" />
          </div>
        )}
      </div>
      <h3 className="font-semibold truncate">{artist.name}</h3>
      <p className="text-sm text-[var(--qz-text-secondary)]">Artist</p>
    </div>
  );
}

// Category Card Component
function CategoryCard({ category }: { category: { name: string; color: string } }) {
  return (
    <div
      className="relative h-48 rounded-lg overflow-hidden cursor-pointer group"
      style={{ backgroundColor: category.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40 group-hover:to-black/60 transition-all" />
      <div className="absolute inset-0 p-4 flex items-end">
        <h3 className="text-xl font-bold text-white">{category.name}</h3>
      </div>
    </div>
  );
}

// Icons

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-12 h-12 text-[var(--qz-primary)]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Mock Data
const mockTracks: Track[] = [
  {
    id: 't1',
    title: 'Electric Dreams',
    artist: 'Luna Eclipse',
    artist_id: 'a1',
    album: 'Midnight Dreams',
    album_id: '1',
    duration: 234,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/search1/300/300',
  },
  {
    id: 't2',
    title: 'Sunset Drive',
    artist: 'Sunset Boulevard',
    artist_id: 'a2',
    album: 'Summer Vibes',
    album_id: '2',
    duration: 198,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/search2/300/300',
  },
  {
    id: 't3',
    title: 'City Lights',
    artist: 'Metro Beats',
    artist_id: 'a3',
    album: 'Urban Rhythm',
    album_id: '3',
    duration: 256,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/search3/300/300',
    explicit: true,
  },
];

const mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    artist_id: 'a1',
    artwork_url: 'https://picsum.photos/seed/searchalbum1/300/300',
  },
  {
    id: '2',
    title: 'Summer Vibes',
    artist: 'Sunset Boulevard',
    artist_id: 'a2',
    artwork_url: 'https://picsum.photos/seed/searchalbum2/300/300',
  },
  {
    id: '3',
    title: 'Urban Rhythm',
    artist: 'Metro Beats',
    artist_id: 'a3',
    artwork_url: 'https://picsum.photos/seed/searchalbum3/300/300',
  },
];

const mockArtists = [
  { id: 'a1', name: 'Luna Eclipse', image: 'https://picsum.photos/seed/artist1/300/300' },
  { id: 'a2', name: 'Sunset Boulevard', image: 'https://picsum.photos/seed/artist2/300/300' },
  { id: 'a3', name: 'Metro Beats', image: 'https://picsum.photos/seed/artist3/300/300' },
];

const browseCategories = [
  { name: 'Pop', color: '#8e44ad' },
  { name: 'Hip Hop', color: '#d35400' },
  { name: 'Rock', color: '#c0392b' },
  { name: 'Electronic', color: '#2980b9' },
  { name: 'Jazz', color: '#16a085' },
  { name: 'R&B', color: '#e74c3c' },
  { name: 'Classical', color: '#7f8c8d' },
  { name: 'Country', color: '#f39c12' },
];
