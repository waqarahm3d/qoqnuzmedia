'use client';

import React, { useState } from 'react';
import { Button, PlaylistCard } from '@/components/ui';
import { CreatePlaylistModal } from '@/components/features/playlist/CreatePlaylistModal';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import type { Playlist } from '@/lib/types/music';

/**
 * Library Playlists Page
 *
 * Displays user's playlists with:
 * - Grid layout of playlists
 * - Create new playlist button
 * - Filter by public/private/collaborative
 * - Sort options
 * - Empty state for no playlists
 */

type FilterType = 'all' | 'owned' | 'collaborative';
type SortType = 'recent' | 'name' | 'tracks';

export default function LibraryPlaylistsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');

  const { playlists } = usePlaylistStore();
  const { play } = usePlayerStore();
  const { setQueue } = useQueueStore();

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setQueue(playlist.tracks, 0);
      play(playlist.tracks[0]);
    }
  };

  // Mock user ID - in real app, get from auth
  const currentUserId = 'current-user-id';

  // Filter playlists
  const filteredPlaylists = playlists.filter((playlist) => {
    if (filter === 'owned') {
      return playlist.owner_id === currentUserId;
    } else if (filter === 'collaborative') {
      return playlist.is_collaborative;
    }
    return true;
  });

  // Sort playlists
  const sortedPlaylists = [...filteredPlaylists].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sort === 'tracks') {
      return (b.tracks_count || 0) - (a.tracks_count || 0);
    }
    // Default: recent (by created_at)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Playlists</h1>
          <p className="mt-2 text-[var(--qz-text-secondary)]">
            {sortedPlaylists.length} {sortedPlaylists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<PlusIcon className="w-5 h-5" />}
          size="lg"
        >
          Create Playlist
        </Button>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { value: 'all', label: 'All Playlists' },
            { value: 'owned', label: 'Created by You' },
            { value: 'collaborative', label: 'Collaborative' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as FilterType)}
              className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                filter === item.value
                  ? 'bg-[var(--qz-primary)] text-white'
                  : 'bg-[var(--qz-bg-surface)] text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-bg-surface-hover)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="sm:ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-4 py-2 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-full text-[var(--qz-text-primary)] font-medium outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] transition-colors cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Alphabetical</option>
            <option value="tracks">Most Tracks</option>
          </select>
        </div>
      </div>

      {/* Playlists Grid */}
      {sortedPlaylists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onPlay={handlePlayPlaylist} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
            <PlaylistIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
            {filter === 'all'
              ? 'No playlists yet'
              : filter === 'owned'
              ? "You haven't created any playlists"
              : 'No collaborative playlists'}
          </h3>
          <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
            {filter === 'all'
              ? 'Create your first playlist to start organizing your favorite tracks'
              : filter === 'owned'
              ? 'Create a playlist to organize your music collection'
              : 'Collaborative playlists you join will appear here'}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
            Create Playlist
          </Button>
        </div>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(playlist) => {
          console.log('Playlist created:', playlist);
        }}
      />
    </div>
  );
}

// Icons

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
