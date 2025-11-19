'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import Image from 'next/image';
import Link from 'next/link';

interface DesktopPlayerProps {
  onExpand?: () => void;
}

export const DesktopPlayer = ({ onExpand }: DesktopPlayerProps) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLiked,
    shuffle,
    repeat,
    queue,
    isLoading,
    error,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    skipForward,
    skipBackward,
    playTrack,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);

  // Keyboard shortcuts for desktop
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          skipBackward();
        } else {
          seek(Math.max(0, currentTime - 5));
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          skipForward();
        } else {
          seek(Math.min(duration, currentTime + 5));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(100, volume + 5));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(0, volume - 5));
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyL':
        e.preventDefault();
        toggleLike();
        break;
      case 'KeyS':
        e.preventDefault();
        toggleShuffle();
        break;
      case 'KeyR':
        e.preventDefault();
        toggleRepeat();
        break;
    }
  }, [currentTime, duration, volume, togglePlayPause, seek, setVolume, toggleMute, toggleLike, toggleShuffle, toggleRepeat, skipForward, skipBackward]);

  useEffect(() => {
    if (currentTrack) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentTrack, handleKeyDown]);

  // Retry playback on error
  const handleRetry = () => {
    if (currentTrack) {
      playTrack(currentTrack, true);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  // Hide player when no track is playing
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-4 py-3 z-[60]">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        {/* Left: Current Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:w-[30%]">
          <div
            className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden cursor-pointer group"
            onClick={onExpand}
          >
            {currentTrack.image ? (
              <>
                <Image
                  src={currentTrack.image}
                  alt={currentTrack.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="56px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                  <svg
                    className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 15l7-7 7 7" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-600"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/track/${currentTrack.id}`}
              className="text-sm font-medium text-white truncate hover:underline cursor-pointer block"
            >
              {currentTrack.title}
            </Link>
            <Link
              href={currentTrack.artistId ? `/artist/${currentTrack.artistId}` : '#'}
              className="text-xs text-gray-400 truncate hover:underline cursor-pointer block"
            >
              {currentTrack.artist}
            </Link>
          </div>

          <button
            onClick={toggleLike}
            className="text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isLiked ? '#ff4a14' : 'none'}
              stroke={isLiked ? '#ff4a14' : 'currentColor'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Center: Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          {/* Control Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`hidden sm:block transition-colors ${
                shuffle ? 'text-[#ff5c2e]' : 'text-gray-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>

            {/* Previous */}
            <button onClick={skipBackward} className="text-gray-400 hover:text-white transition-colors" title="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={error ? handleRetry : togglePlayPause}
              className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 ${
                error ? 'bg-red-500' : 'bg-white'
              }`}
              title={error ? 'Retry' : isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : error ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              ) : isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button onClick={skipForward} className="text-gray-400 hover:text-white transition-colors" title="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`hidden sm:block transition-colors relative ${
                repeat !== 'off' ? 'text-[#ff5c2e]' : 'text-gray-400 hover:text-white'
              }`}
              title={`Repeat: ${repeat}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 tabular-nums min-w-[40px] text-right hidden sm:inline">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 group">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime || 0}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:opacity-0
                  group-hover:[&::-webkit-slider-thumb]:opacity-100
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:opacity-0
                  group-hover:[&::-moz-range-thumb]:opacity-100"
                style={{
                  background: `linear-gradient(to right, #ff4a14 ${((currentTime || 0) / (duration || 1)) * 100}%, #4B5563 ${((currentTime || 0) / (duration || 1)) * 100}%)`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 tabular-nums min-w-[40px] hidden sm:inline">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Queue Controls */}
        <div className="hidden lg:flex items-center gap-2 justify-end flex-1 lg:w-[30%]">
          {/* Queue */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`transition-colors ${showQueue ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            title="Queue"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15V6" />
              <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path d="M12 12H3" />
              <path d="M16 6H3" />
              <path d="M12 18H3" />
            </svg>
          </button>

          {/* Volume */}
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : volume < 50 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <div className="relative group">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:opacity-0
                group-hover:[&::-webkit-slider-thumb]:opacity-100
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:opacity-0
                group-hover:[&::-moz-range-thumb]:opacity-100"
              style={{
                background: `linear-gradient(to right, #fff ${isMuted ? 0 : volume}%, #4B5563 ${isMuted ? 0 : volume}%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Queue Popover */}
      {showQueue && (
        <div className="absolute bottom-full right-4 mb-2 w-96 max-h-96 bg-surface rounded-lg shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold">Queue</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto max-h-80 p-2">
            {queue.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No tracks in queue</p>
            ) : (
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 ${
                      track.id === currentTrack.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="w-6 text-gray-500 text-sm text-center">
                      {index + 1}
                    </div>
                    <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                      {track.image ? (
                        <Image src={track.image} alt={track.title} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full bg-gray-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{track.title}</div>
                      <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
