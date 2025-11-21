'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import type { Playlist } from '@/lib/types/music';

/**
 * PlaylistCard Component
 *
 * Card for displaying playlists with:
 * - Cover image with lazy loading
 * - Play button on hover
 * - Playlist name and owner
 * - Track count and duration
 * - Collaborative badge
 * - Lock icon for private playlists
 *
 * @example
 * ```tsx
 * <PlaylistCard
 *   playlist={playlist}
 *   onPlay={(playlist) => handlePlay(playlist)}
 * />
 * ```
 */

export interface PlaylistCardProps {
  /** Playlist data */
  playlist: Playlist;
  /** Callback when play button is clicked */
  onPlay?: (playlist: Playlist) => void;
  /** Show play button on hover */
  showPlayButton?: boolean;
  /** Custom className */
  className?: string;
}

export function PlaylistCard({
  playlist,
  onPlay,
  showPlayButton = true,
  className,
}: PlaylistCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-lg bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {/* Cover Image */}
      <Link href={`/playlist/${playlist.id}`} className="relative aspect-square w-full overflow-hidden rounded-md bg-[var(--qz-bg-base)] shadow-lg">
        {playlist.cover_url ? (
          <Image
            src={playlist.cover_url}
            alt={`${playlist.name} cover`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-all duration-300 group-hover:scale-105',
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlaylistIcon className="w-16 h-16 text-[var(--qz-text-tertiary)]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!playlist.is_public && (
            <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full">
              <LockIcon className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {playlist.is_collaborative && (
            <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full">
              <UsersIcon className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Play Button */}
        {showPlayButton && onPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay(playlist);
            }}
            className="absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center bg-[var(--qz-primary)] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110"
            aria-label={`Play ${playlist.name}`}
          >
            <PlayIcon className="w-5 h-5 ml-0.5" />
          </button>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          href={`/playlist/${playlist.id}`}
          className="font-semibold text-[var(--qz-text-primary)] truncate hover:underline"
        >
          {playlist.name}
        </Link>

        {/* Description or Owner */}
        {playlist.description ? (
          <p className="text-sm text-[var(--qz-text-secondary)] line-clamp-2">
            {playlist.description}
          </p>
        ) : (
          <p className="text-sm text-[var(--qz-text-secondary)] truncate">
            By {playlist.owner_name || 'Unknown'}
          </p>
        )}

        {/* Track Count & Duration */}
        <div className="flex items-center gap-2 text-xs text-[var(--qz-text-tertiary)] mt-0.5">
          <span>{playlist.tracks_count || 0} tracks</span>
          <span>•</span>
          <span>{formatDuration(playlist.duration)}</span>
        </div>
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

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
