'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Track } from '@/lib/types/music';
import { cn } from '@/lib/utils/cn';

/**
 * TrackCard Component
 *
 * Displays a track in a list format with play button, artwork, and actions.
 * Compact design for tracklists, playlists, and search results.
 *
 * @example
 * ```tsx
 * <TrackCard
 *   track={track}
 *   isPlaying={currentTrack?.id === track.id}
 *   onPlay={() => playTrack(track)}
 *   onLike={() => likeTrack(track.id)}
 * />
 * ```
 */

export interface TrackCardProps {
  track: Track;
  index?: number;
  isPlaying?: boolean;
  onPlay?: (track: Track) => void;
  onPause?: () => void;
  onLike?: (trackId: string) => void;
  onAddToQueue?: (track: Track) => void;
  showArtwork?: boolean;
  showAlbum?: boolean;
  className?: string;
}

export function TrackCard({
  track,
  index,
  isPlaying = false,
  onPlay,
  onPause,
  onLike,
  onAddToQueue,
  showArtwork = true,
  showAlbum = true,
  className,
}: TrackCardProps) {
  const handlePlayPause = () => {
    if (isPlaying && onPause) {
      onPause();
    } else if (onPlay) {
      onPlay(track);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-2 rounded-md hover:bg-[var(--qz-bg-surface-hover)] transition-colors duration-150',
        isPlaying && 'bg-[var(--qz-bg-surface-hover)]',
        className
      )}
    >
      {/* Index / Play Button */}
      <div className="flex-shrink-0 w-10 flex items-center justify-center">
        {index !== undefined && (
          <span className="text-sm text-[var(--qz-text-tertiary)] group-hover:hidden">
            {index}
          </span>
        )}
        <button
          onClick={handlePlayPause}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full transition-all',
            index !== undefined ? 'hidden group-hover:flex' : 'flex',
            isPlaying
              ? 'text-[var(--qz-primary)]'
              : 'hover:bg-[var(--qz-overlay-light)] text-[var(--qz-text-primary)]'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Artwork */}
      {showArtwork && (
        <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-[var(--qz-bg-surface)]">
          {track.artwork_url ? (
            <Image
              src={track.artwork_url}
              alt={track.title}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MusicNoteIcon className="w-5 h-5 text-[var(--qz-text-tertiary)]" />
            </div>
          )}
        </div>
      )}

      {/* Track Info */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium truncate',
              isPlaying ? 'text-[var(--qz-primary)]' : 'text-[var(--qz-text-primary)]'
            )}
          >
            {track.title}
          </span>
          {track.explicit && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-semibold bg-[var(--qz-text-tertiary)] text-[var(--qz-bg-base)] rounded">
              E
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--qz-text-secondary)]">
          <Link
            href={`/artist/${track.artist_id}`}
            className="truncate hover:underline hover:text-[var(--qz-text-primary)]"
          >
            {track.artist}
          </Link>
          {showAlbum && track.album && (
            <>
              <span>•</span>
              <Link
                href={`/album/${track.album_id}`}
                className="truncate hover:underline hover:text-[var(--qz-text-primary)]"
              >
                {track.album}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Like Button */}
        {onLike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(track.id);
            }}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors',
              track.is_liked && 'text-[var(--qz-success)]'
            )}
            aria-label={track.is_liked ? 'Unlike' : 'Like'}
          >
            <HeartIcon className="w-4 h-4" filled={track.is_liked} />
          </button>
        )}

        {/* Add to Queue */}
        {onAddToQueue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(track);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label="Add to queue"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}

        {/* More Options */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
          aria-label="More options"
        >
          <DotsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Duration */}
      <div className="flex-shrink-0 text-sm text-[var(--qz-text-tertiary)] tabular-nums">
        {formatDuration(track.duration)}
      </div>
    </div>
  );
}

// Utility function to format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Icons

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
