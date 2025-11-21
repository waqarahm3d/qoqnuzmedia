'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { Track, PlaylistTrack } from '@/lib/types/music';

/**
 * AddToPlaylistMenu Component
 *
 * Dropdown menu for adding tracks to playlists with:
 * - List of user's playlists
 * - Create new playlist option
 * - Search playlists
 * - Already added indicator
 *
 * @example
 * ```tsx
 * <AddToPlaylistMenu
 *   track={track}
 *   trigger={<button>Add to Playlist</button>}
 * />
 * ```
 */

export interface AddToPlaylistMenuProps {
  /** Track to add to playlist */
  track: Track;
  /** Trigger element (button, icon, etc) */
  trigger?: React.ReactNode;
  /** Custom className for trigger */
  className?: string;
  /** Callback when track is added */
  onAdd?: (playlistId: string) => void;
}

export function AddToPlaylistMenu({
  track,
  trigger,
  className,
  onAdd,
}: AddToPlaylistMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const { playlists, addTrackToPlaylist } = usePlaylistStore();
  const { showToast, openModal } = useUIStore();

  // Mock user ID - in real app, get from auth
  const currentUserId = 'current-user-id';

  // Filter user's playlists
  const userPlaylists = playlists.filter((playlist) => playlist.owner_id === currentUserId);

  // Filter by search query
  const filteredPlaylists = userPlaylists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAddToPlaylist = (playlistId: string) => {
    // Check if track already in playlist
    const playlist = playlists.find((p) => p.id === playlistId);
    const isAlreadyAdded = playlist?.tracks?.some((t) => t.id === track.id);

    if (isAlreadyAdded) {
      showToast('Track already in this playlist', 'info');
      return;
    }

    // Create playlist track
    const playlistTrack: PlaylistTrack = {
      ...track,
      position: playlist?.tracks?.length || 0,
      added_by: currentUserId,
      added_by_name: 'Current User',
      added_at: new Date().toISOString(),
    };

    // Add track to playlist
    addTrackToPlaylist(playlistId, playlistTrack);

    // Show success toast
    showToast(`Added to ${playlist?.name}`, 'success');

    // Call callback
    onAdd?.(playlistId);

    // Close menu
    setIsOpen(false);
  };

  const handleCreatePlaylist = () => {
    // Open create playlist modal
    openModal('createPlaylist');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger */}
      {trigger ? (
        <button onClick={() => setIsOpen(!isOpen)} className={className}>
          {trigger}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors',
            className
          )}
          aria-label="Add to playlist"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--qz-bg-elevated)] border border-[var(--qz-border-subtle)] rounded-lg shadow-2xl z-[var(--qz-z-dropdown)] animate-slideDown overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-[var(--qz-border-subtle)]">
            <h3 className="font-semibold text-[var(--qz-text-primary)] mb-2">
              Add to playlist
            </h3>

            {/* Search */}
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-md text-sm text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)] outline-none focus:border-[var(--qz-primary)] focus:ring-1 focus:ring-[var(--qz-primary)]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Create New Playlist */}
          <button
            onClick={handleCreatePlaylist}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors border-b border-[var(--qz-border-subtle)]"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[var(--qz-bg-surface)] rounded">
              <PlusIcon className="w-5 h-5 text-[var(--qz-text-secondary)]" />
            </div>
            <span className="font-medium text-[var(--qz-text-primary)]">Create Playlist</span>
          </button>

          {/* Playlists List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredPlaylists.length > 0 ? (
              filteredPlaylists.map((playlist) => {
                const isAdded = playlist.tracks?.some((t) => t.id === track.id);

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
                    disabled={isAdded}
                  >
                    {/* Playlist Cover */}
                    <div className="w-10 h-10 flex items-center justify-center bg-[var(--qz-bg-surface)] rounded overflow-hidden flex-shrink-0">
                      {playlist.cover_url ? (
                        <img
                          src={playlist.cover_url}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlaylistIcon className="w-5 h-5 text-[var(--qz-text-tertiary)]" />
                      )}
                    </div>

                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-[var(--qz-text-primary)] truncate">
                        {playlist.name}
                      </div>
                      <div className="text-xs text-[var(--qz-text-tertiary)] truncate">
                        {playlist.tracks_count || 0} tracks
                      </div>
                    </div>

                    {/* Check Icon */}
                    {isAdded && <CheckIcon className="w-5 h-5 text-[var(--qz-primary)]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--qz-text-secondary)]">
                {searchQuery ? 'No playlists found' : 'No playlists yet'}
              </div>
            )}
          </div>
        </div>
      )}
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
