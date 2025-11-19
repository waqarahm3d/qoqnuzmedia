'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import Image from 'next/image';
import Link from 'next/link';

interface MobilePlayerProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export const MobilePlayer = ({ isExpanded, onExpand, onCollapse }: MobilePlayerProps) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLiked,
    shuffle,
    repeat,
    queue,
    togglePlayPause,
    seek,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    skipForward,
    skipBackward,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Handle animation state
  useEffect(() => {
    if (isExpanded) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle swipe down to collapse
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd < -50 && isExpanded) {
      // Swipe down
      onCollapse();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  if (!currentTrack) return null;

  // Mini Player (Collapsed)
  if (!isExpanded) {
    return (
      <div
        onClick={onExpand}
        className="fixed bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900 to-black border-t border-white/10 z-50 cursor-pointer active:scale-[0.98] transition-all duration-300 ease-out animate-slide-up"
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Thumbnail */}
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
            {currentTrack.image ? (
              <Image
                src={currentTrack.image}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {currentTrack.artist}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? '#ff4a14' : 'none'}
                stroke={isLiked ? '#ff4a14' : 'currentColor'}
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="text-white"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Player (Expanded)
  return (
    <div
      ref={playerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`
        fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-black z-[100] flex flex-col overflow-y-auto
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'animate-expand-up' : ''}
      `}
      style={{
        animation: isAnimating ? 'expandUp 0.35s ease-out forwards' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <button
          onClick={onCollapse}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-sm font-medium">Now Playing</div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center -mr-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
              <button
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: currentTrack.title,
                      text: `Listen to ${currentTrack.title} by ${currentTrack.artist}`,
                      url: window.location.href,
                    });
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="text-sm">Share</span>
              </button>

              <button
                onClick={() => {
                  setShowQueue(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15V6" />
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 12H3" />
                  <path d="M16 6H3" />
                  <path d="M12 18H3" />
                </svg>
                <span className="text-sm">Queue</span>
              </button>

              <button
                onClick={() => {
                  // Lyrics functionality - to be implemented
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="text-sm">Lyrics</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Indicator */}
      <div className="flex justify-center py-2 flex-shrink-0">
        <div className="w-10 h-1 bg-gray-600 rounded-full" />
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div
          className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden shadow-2xl transition-all duration-500 ease-out"
          style={{
            animation: isAnimating ? 'scaleIn 0.4s ease-out forwards' : 'none',
          }}
        >
          {currentTrack.image ? (
            <Image
              src={currentTrack.image}
              alt={currentTrack.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <svg className="w-32 h-32 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div
        className="px-6 pb-4 flex-shrink-0"
        style={{
          animation: isAnimating ? 'fadeSlideUp 0.4s ease-out 0.15s forwards' : 'none',
          opacity: isAnimating ? 0 : 1,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate mb-1">
              {currentTrack.title}
            </h1>
            <Link
              href={currentTrack.artistId ? `/artist/${currentTrack.artistId}` : '#'}
              className="text-base text-gray-400 hover:text-white transition-colors"
            >
              {currentTrack.artist}
            </Link>
          </div>
          <button
            onClick={toggleLike}
            className="ml-4 flex-shrink-0"
          >
            <svg
              className="w-7 h-7"
              fill={isLiked ? '#ff4a14' : 'none'}
              stroke={isLiked ? '#ff4a14' : 'currentColor'}
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-2 flex-shrink-0">
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
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0"
          style={{
            background: `linear-gradient(to right, #ff4a14 ${((currentTime || 0) / (duration || 1)) * 100}%, #4B5563 ${((currentTime || 0) / (duration || 1)) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{
          animation: isAnimating ? 'fadeSlideUp 0.4s ease-out 0.25s forwards' : 'none',
          opacity: isAnimating ? 0 : 1,
        }}
      >
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${shuffle ? 'text-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>

          {/* Previous */}
          <button onClick={skipBackward} className="text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button onClick={skipForward} className="text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      </div>

      {/* Spacer for bottom padding */}
      <div className="pb-8 flex-shrink-0" />

      {/* Queue Overlay */}
      {showQueue && (
        <div className="absolute inset-0 bg-black z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <h2 className="text-xl font-bold">Queue</h2>
            <button onClick={() => setShowQueue(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-4 pb-32">
            {queue.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No tracks in queue</p>
            ) : (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className={`flex items-center gap-3 p-2 rounded ${
                      track.id === currentTrack.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 text-gray-500 text-sm text-center">
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
