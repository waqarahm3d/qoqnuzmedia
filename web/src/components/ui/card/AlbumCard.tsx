'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/lib/types/music';
import { cn } from '@/lib/utils/cn';

/**
 * AlbumCard Component
 *
 * Displays an album with cover art, title, and artist.
 * Optimized for grid layouts with hover effects.
 *
 * @example
 * ```tsx
 * <AlbumCard
 *   album={album}
 *   onPlay={() => playAlbum(album.id)}
 * />
 * ```
 */

export interface AlbumCardProps {
  album: Album;
  onPlay?: (album: Album) => void;
  className?: string;
  showPlayButton?: boolean;
}

export function AlbumCard({
  album,
  onPlay,
  className,
  showPlayButton = true,
}: AlbumCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-lg bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] transition-all duration-200 cursor-pointer',
        className
      )}
    >
      <Link href={`/album/${album.id}`} className="relative aspect-square w-full overflow-hidden rounded-md bg-[var(--qz-bg-base)] shadow-lg">
        {/* Album Cover */}
        {album.artwork_url ? (
          <>
            {!isImageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-[var(--qz-bg-surface)]" />
            )}
            <Image
              src={album.artwork_url}
              alt={`${album.title} cover`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-all duration-300 group-hover:scale-105',
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--qz-bg-surface)] to-[var(--qz-bg-base)]">
            <MusicNoteIcon className="w-16 h-16 text-[var(--qz-text-tertiary)]" />
          </div>
        )}

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Play Button */}
        {showPlayButton && onPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay(album);
            }}
            className="absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center bg-[var(--qz-primary)] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110 hover:bg-[var(--qz-primary-hover)]"
            aria-label={`Play ${album.title}`}
          >
            <PlayIcon className="w-5 h-5 ml-0.5" />
          </button>
        )}
      </Link>

      {/* Album Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <Link href={`/album/${album.id}`}>
          <h3 className="font-semibold text-[var(--qz-text-primary)] truncate hover:underline">
            {album.title}
          </h3>
        </Link>
        <Link href={`/artist/${album.artist_id}`}>
          <p className="text-sm text-[var(--qz-text-secondary)] truncate hover:underline">
            {album.artist}
          </p>
        </Link>
        {album.release_date && (
          <p className="text-xs text-[var(--qz-text-tertiary)]">
            {new Date(album.release_date).getFullYear()}
          </p>
        )}
      </div>
    </div>
  );
}

// Icons

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
