'use client';

import React, { useState } from 'react';
import { Button, TrackCard } from '@/components/ui';
import { useLibraryStore } from '@/lib/stores/libraryStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import type { Track } from '@/lib/types/music';

/**
 * Library Liked Tracks Page
 *
 * Displays user's liked tracks with:
 * - List view of all liked tracks
 * - Play all button
 * - Sort options (recently added, title, artist, album)
 * - Filter by genre/mood
 * - Total count and duration
 * - Empty state
 */

type SortType = 'recent' | 'title' | 'artist' | 'album' | 'duration';

export default function LibraryTracksPage() {
  const [sort, setSort] = useState<SortType>('recent');

  const { likedTracks, unlikeTrack } = useLibraryStore();
  const { currentTrack, play, isPlaying } = usePlayerStore();
  const { setQueue } = useQueueStore();

  const handlePlayAll = () => {
    if (likedTracks.length > 0) {
      setQueue(sortedTracks, 0);
      play(sortedTracks[0]);
    }
  };

  const handlePlayTrack = (track: Track) => {
    const index = sortedTracks.findIndex((t) => t.id === track.id);
    setQueue(sortedTracks, index);
    play(track);
  };

  const handleUnlikeTrack = (trackId: string) => {
    unlikeTrack(trackId);
  };

  // Sort tracks
  const sortedTracks = [...likedTracks].sort((a, b) => {
    switch (sort) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'album':
        return (a.album || '').localeCompare(b.album || '');
      case 'duration':
        return b.duration - a.duration;
      default:
        // Recent (we don't have a liked_at timestamp in mock data, so just reverse order)
        return 0;
    }
  });

  // Calculate total duration
  const totalDuration = likedTracks.reduce((sum, track) => sum + track.duration, 0);
  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-purple-900/40 to-transparent">
        <div className="px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Icon */}
            <div className="w-full md:w-60 md:h-60 aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl flex items-center justify-center flex-shrink-0">
              <HeartIcon className="w-24 h-24 text-white" filled />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--qz-text-primary)] mb-2">
                Playlist
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[var(--qz-text-primary)] mb-4">
                Liked Songs
              </h1>
              <div className="flex items-center gap-2 text-sm text-[var(--qz-text-primary)]">
                <span className="font-semibold">Your Library</span>
                <span>•</span>
                <span>{likedTracks.length} songs</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatTotalDuration()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {likedTracks.length > 0 && (
        <div className="px-6 py-6 flex items-center gap-4">
          <Button
            size="xl"
            onClick={handlePlayAll}
            className="rounded-full w-14 h-14 p-0"
          >
            <PlayIcon className="w-6 h-6 ml-1" />
          </Button>

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-full text-[var(--qz-text-primary)] font-medium outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] transition-colors cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="px-6 pb-24">
        {sortedTracks.length > 0 ? (
          <div className="space-y-1">
            {sortedTracks.map((track, index) => (
              <div key={track.id} className="group relative">
                <TrackCard
                  track={track}
                  index={index + 1}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={handlePlayTrack}
                  showArtwork
                  showAlbum
                />

                {/* Unlike Button */}
                <button
                  onClick={() => handleUnlikeTrack(track.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-[var(--qz-overlay-light)] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove from liked songs"
                >
                  <HeartIcon className="w-4 h-4 text-[var(--qz-primary)]" filled />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
              <HeartIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
              No liked songs yet
            </h3>
            <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
              Songs you like will appear here
            </p>
            <Button onClick={() => (window.location.href = '/search')} size="lg">
              Find Music
            </Button>
          </div>
        )}
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

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
