'use client';

import React, { useState } from 'react';
import { Button, AlbumCard } from '@/components/ui';
import { useLibraryStore } from '@/lib/stores/libraryStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import type { Album, Track } from '@/lib/types/music';

/**
 * Library Saved Albums Page
 *
 * Displays user's saved albums with:
 * - Grid layout of albums
 * - Sort options (recently added, title, artist, year)
 * - Total count
 * - Empty state
 */

type SortType = 'recent' | 'title' | 'artist' | 'year';

export default function LibraryAlbumsPage() {
  const [sort, setSort] = useState<SortType>('recent');

  const { savedAlbums } = useLibraryStore();
  const { play } = usePlayerStore();
  const { setQueue } = useQueueStore();

  const handlePlayAlbum = (album: Album) => {
    // In a real app, fetch album tracks
    // For now, create mock tracks
    const mockTracks: Track[] = Array.from({ length: album.tracks_count || 10 }, (_, i) => ({
      id: `${album.id}-track-${i + 1}`,
      title: `${album.title} - Track ${i + 1}`,
      artist: album.artist,
      artist_id: album.artist_id,
      album: album.title,
      album_id: album.id,
      duration: 180 + Math.floor(Math.random() * 120),
      audio_url: '/audio/demo.mp3',
      artwork_url: album.artwork_url,
    }));

    setQueue(mockTracks, 0);
    play(mockTracks[0]);
  };

  // Sort albums
  const sortedAlbums = [...savedAlbums].sort((a, b) => {
    switch (sort) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'year':
        return (b.release_date || '').localeCompare(a.release_date || '');
      default:
        // Recent - no timestamp in mock data, so just preserve order
        return 0;
    }
  });

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Saved Albums</h1>
          <p className="mt-2 text-[var(--qz-text-secondary)]">
            {sortedAlbums.length} {sortedAlbums.length === 1 ? 'album' : 'albums'}
          </p>
        </div>

        {/* Sort Dropdown */}
        {sortedAlbums.length > 0 && (
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-full text-[var(--qz-text-primary)] font-medium outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] transition-colors cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="year">Release Year</option>
            </select>
          </div>
        )}
      </div>

      {/* Albums Grid */}
      {sortedAlbums.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} onPlay={handlePlayAlbum} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
            <AlbumIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
            No saved albums yet
          </h3>
          <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
            Albums you save will appear here
          </p>
          <Button onClick={() => (window.location.href = '/search')} size="lg">
            Find Albums
          </Button>
        </div>
      )}
    </div>
  );
}

// Icons

function AlbumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
