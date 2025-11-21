'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import { cn } from '@/lib/utils/cn';

/**
 * Player Component
 *
 * Global music player that appears at the bottom of the screen.
 * Features:
 * - Persistent playback across navigation
 * - Progress bar with seek
 * - Playback controls (play, pause, next, previous)
 * - Volume control
 * - Shuffle and repeat modes
 * - Now playing info with artwork
 * - Like button integration
 * - Queue view toggle
 *
 * @example
 * ```tsx
 * <Player />
 * ```
 */

export function Player() {
  const { seek } = useAudioPlayer();

  // Player state
  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    progress,
    currentTime,
    duration,
    repeat,
    shuffle,
    togglePlayPause,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore();

  // Queue state
  const { queue, currentIndex, next, previous } = useQueueStore();

  // Local state
  const [showVolume, setShowVolume] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Handlers
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const newTime = (percent / 100) * duration;
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleNext = () => {
    const nextTrack = next();
    if (nextTrack) {
      usePlayerStore.getState().play(nextTrack);
    }
  };

  const handlePrevious = () => {
    const prevTrack = previous();
    if (prevTrack) {
      usePlayerStore.getState().play(prevTrack);
    }
  };

  // Don't render if no track
  if (!currentTrack) {
    return null;
  }

  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--qz-z-fixed)] bg-[var(--qz-bg-elevated)] border-t border-[var(--qz-border-subtle)] backdrop-blur-lg">
      {/* Progress Bar */}
      <div
        className="relative w-full h-1 bg-[var(--qz-bg-surface)] cursor-pointer group"
        onClick={handleProgressClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div
          className="absolute left-0 top-0 h-full bg-[var(--qz-primary)] transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Player Content */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 h-[var(--qz-player-height)]">
        {/* Now Playing */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Artwork */}
          <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden bg-[var(--qz-bg-surface)] shadow-md">
            {currentTrack.artwork_url ? (
              <Image
                src={currentTrack.artwork_url}
                alt={currentTrack.title}
                width={56}
                height={56}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MusicNoteIcon className="w-6 h-6 text-[var(--qz-text-tertiary)]" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/track/${currentTrack.id}`}
              className="block font-medium text-[var(--qz-text-primary)] truncate hover:underline"
            >
              {currentTrack.title}
            </Link>
            <Link
              href={`/artist/${currentTrack.artist_id}`}
              className="block text-sm text-[var(--qz-text-secondary)] truncate hover:underline"
            >
              {currentTrack.artist}
            </Link>
          </div>

          {/* Like Button */}
          <button
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label="Like"
          >
            <HeartIcon className="w-5 h-5" filled={currentTrack.is_liked} />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors',
                shuffle && 'text-[var(--qz-primary)]'
              )}
              aria-label="Shuffle"
            >
              <ShuffleIcon className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <PreviousIcon className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <NextIcon className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors',
                repeat !== 'off' && 'text-[var(--qz-primary)]'
              )}
              aria-label="Repeat"
            >
              <RepeatIcon className="w-4 h-4" active={repeat === 'one'} />
            </button>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-xs text-[var(--qz-text-tertiary)] tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Queue */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label="Queue"
          >
            <QueueIcon className="w-5 h-5" />
          </button>

          {/* Volume */}
          <div
            className="flex items-center gap-2"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon volume={isMuted ? 0 : volume} className="w-5 h-5" />
            </button>

            {/* Volume Slider */}
            {showVolume && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-[var(--qz-bg-surface)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                aria-label="Volume"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Functions

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

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

function PreviousIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}

function NextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 18h2V6h-2M6 18l8.5-6L6 6v12z" />
    </svg>
  );
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

function RepeatIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
      {active && <circle cx="12" cy="12" r="1" fill="currentColor" />}
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={cn(className, filled && 'text-[var(--qz-success)]')}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function VolumeIcon({ volume, className }: { volume: number; className?: string }) {
  if (volume === 0) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M23 9l-6 6M17 9l6 6" />
      </svg>
    );
  } else if (volume < 0.5) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
      </svg>
    );
  } else {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
      </svg>
    );
  }
}

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
