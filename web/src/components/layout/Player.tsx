'use client';

import { usePlayer } from '@/lib/contexts/PlayerContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export const Player = () => {
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
    showStillListeningPrompt,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    skipForward,
    skipBackward,
    confirmStillListening,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

  // Click on progress bar to seek (mini player)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(Math.max(0, Math.min(duration, newTime)));
  };

  // Touch gesture handlers for swipe up/down
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (dragStartY === null || dragCurrentY === null) {
      setIsDragging(false);
      setDragStartY(null);
      setDragCurrentY(null);
      return;
    }

    const deltaY = dragCurrentY - dragStartY;
    const threshold = 50;

    if (!isExpanded && deltaY < -threshold) {
      setIsExpanded(true);
    } else if (isExpanded && deltaY > threshold) {
      setIsExpanded(false);
      setShowQueue(false);
    }

    setIsDragging(false);
    setDragStartY(null);
    setDragCurrentY(null);
  };

  // Close expanded view on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setShowQueue(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Handle copy to clipboard with feedback
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Generate share URL
  const getShareUrl = () => {
    if (!currentTrack) return '';
    return `${window.location.origin}/track/${currentTrack.id}`;
  };

  // Generate embed code
  const getEmbedCode = () => {
    if (!currentTrack) return '';
    return `<iframe src="${window.location.origin}/embed/track/${currentTrack.id}" width="100%" height="152" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  };

  // Don't render if no track
  if (!currentTrack) {
    return null;
  }

  // Calculate drag offset for smooth animation
  const dragOffset = isDragging && dragStartY !== null && dragCurrentY !== null
    ? dragCurrentY - dragStartY
    : 0;

  const progressPercent = ((currentTime || 0) / (duration || 1)) * 100;

  return (
    <>
      {/* Mini Player Bar - Premium Design */}
      <div
        ref={playerRef}
        className={`fixed left-0 right-0 bg-[#181818]/98 backdrop-blur-xl border-t border-white/5 z-[60] transition-all duration-300 ease-out ${
          isExpanded ? 'bottom-full opacity-0' : 'bottom-[64px] lg:bottom-0'
        }`}
        style={{
          transform: isDragging && !isExpanded ? `translateY(${Math.min(0, dragOffset)}px)` : undefined,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Clickable Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1 bg-white/10 cursor-pointer group relative"
        >
          <div
            className="h-full bg-primary transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Hover indicator */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `${progressPercent}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 lg:px-4">
          {/* Track Info - Clickable */}
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left group"
          >
            {currentTrack.image ? (
              <div className="relative w-11 h-11 flex-shrink-0 rounded shadow-lg overflow-hidden">
                <Image
                  src={currentTrack.image}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
            ) : (
              <div className="w-11 h-11 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                {currentTrack.title}
              </div>
              <div className="text-xs text-white/60 truncate">{currentTrack.artist}</div>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Like - Always visible */}
            <button
              onClick={toggleLike}
              className="p-2 transition-all hover:scale-110 active:scale-95"
              title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isLiked ? '#ff4a14' : 'none'}
                stroke={isLiked ? '#ff4a14' : 'currentColor'}
                strokeWidth="2"
                className={isLiked ? '' : 'text-white/60 hover:text-white'}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Previous - Desktop only */}
            <button
              onClick={skipBackward}
              className="hidden sm:flex p-2 text-white/60 hover:text-white transition-colors"
              title="Previous"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="black" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>

            {/* Next - Desktop only */}
            <button
              onClick={skipForward}
              className="hidden sm:flex p-2 text-white/60 hover:text-white transition-colors"
              title="Next"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
              </svg>
            </button>

            {/* Volume - Desktop only */}
            <div className="hidden lg:flex items-center gap-1 ml-2">
              <button
                onClick={toggleMute}
                className="p-2 text-white/60 hover:text-white transition-colors"
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
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-sm
                  [&::-webkit-slider-thumb]:opacity-0
                  hover:[&::-webkit-slider-thumb]:opacity-100
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-0"
                style={{
                  background: `linear-gradient(to right, #fff ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`,
                }}
              />
            </div>

            {/* Expand button - Mobile */}
            <button
              onClick={() => setIsExpanded(true)}
              className="sm:hidden p-2 text-white/60"
              title="Expand"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Full Screen Player */}
      <div
        className={`fixed inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-black z-[70] transition-all duration-300 ease-out overflow-hidden ${
          isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          transform: isDragging && isExpanded ? `translateY(${Math.max(0, dragOffset)}px)` : undefined,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-down indicator for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:pt-3">
          <button
            onClick={() => {
              setIsExpanded(false);
              setShowQueue(false);
            }}
            className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-xs text-white/40 uppercase tracking-wider font-medium">
              {currentTrack.album !== 'Single' ? 'Playing from Album' : 'Now Playing'}
            </div>
            {currentTrack.albumId ? (
              <Link
                href={`/album/${currentTrack.albumId}`}
                onClick={() => setIsExpanded(false)}
                className="text-xs text-white/60 hover:text-primary transition-colors truncate block"
              >
                {currentTrack.album}
              </Link>
            ) : (
              <div className="text-xs text-white/60 truncate">{currentTrack.album}</div>
            )}
          </div>

          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 -mr-2 transition-colors ${showQueue ? 'text-primary' : 'text-white/60 hover:text-white'}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15V6" />
              <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path d="M12 12H3" />
              <path d="M16 6H3" />
              <path d="M12 18H3" />
            </svg>
          </button>
        </div>

        {showQueue ? (
          /* Queue View */
          <div className="flex-1 overflow-y-auto px-4 pb-32">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Queue</h2>
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Now Playing */}
            <div className="mb-6">
              <h3 className="text-sm text-white/40 font-medium mb-2">Now Playing</h3>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                {currentTrack.image ? (
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={currentTrack.image}
                      alt={currentTrack.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{currentTrack.title}</div>
                  <div className="text-sm text-white/60 truncate">{currentTrack.artist}</div>
                </div>
                {/* Soundwave animation */}
                {isPlaying && (
                  <div className="flex items-center gap-0.5 h-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-0.5 bg-primary rounded-full animate-soundwave-${i}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Queue List */}
            {queue.length > 0 ? (
              <div>
                <h3 className="text-sm text-white/40 font-medium mb-2">Next Up</h3>
                <div className="space-y-1">
                  {queue.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors group"
                    >
                      {track.image ? (
                        <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={track.image}
                            alt={track.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{track.title}</div>
                        <div className="text-xs text-white/60 truncate">{track.artist}</div>
                      </div>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="p-1.5 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto text-white/20 mb-3"
                >
                  <path d="M21 15V6" />
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 12H3" />
                  <path d="M16 6H3" />
                  <path d="M12 18H3" />
                </svg>
                <p className="text-white/40 text-sm">No tracks in queue</p>
              </div>
            )}
          </div>
        ) : (
          /* Main Player View */
          <div className="flex flex-col h-full px-6 pb-8 lg:px-8">
            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center py-6 lg:py-8">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] aspect-square">
                {currentTrack.image ? (
                  <Image
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    fill
                    className="object-cover rounded-xl shadow-2xl"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 400px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center shadow-2xl">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-white/20">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/track/${currentTrack.id}`}
                    onClick={() => setIsExpanded(false)}
                    className="text-xl sm:text-2xl font-bold text-white truncate block hover:text-primary transition-colors"
                  >
                    {currentTrack.title}
                  </Link>
                  {currentTrack.artistId ? (
                    <Link
                      href={`/artist/${currentTrack.artistId}`}
                      className="text-base sm:text-lg text-white/60 hover:text-primary transition-colors truncate block"
                      onClick={() => setIsExpanded(false)}
                    >
                      {currentTrack.artist}
                    </Link>
                  ) : (
                    <p className="text-base sm:text-lg text-white/60 truncate">{currentTrack.artist}</p>
                  )}
                </div>
                <button
                  onClick={toggleLike}
                  className="p-2 transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={isLiked ? '#ff4a14' : 'none'}
                    stroke={isLiked ? '#ff4a14' : 'currentColor'}
                    strokeWidth="2"
                    className={isLiked ? '' : 'text-white/60 hover:text-white'}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-0
                    [&::-webkit-slider-thumb]:h-0
                    group-hover:[&::-webkit-slider-thumb]:w-4
                    group-hover:[&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-moz-range-thumb]:w-0
                    [&::-moz-range-thumb]:h-0
                    group-hover:[&::-moz-range-thumb]:w-4
                    group-hover:[&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0"
                  style={{
                    background: `linear-gradient(to right, #ff4a14 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-white/40 tabular-nums font-medium">{formatTime(currentTime)}</span>
                <span className="text-[11px] text-white/40 tabular-nums font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between mb-6 max-w-sm mx-auto w-full">
              <button
                onClick={toggleShuffle}
                className={`p-4 -m-1 transition-all hover:scale-110 active:scale-95 ${shuffle ? 'text-primary' : 'text-white/60 hover:text-white'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </button>

              <button
                onClick={skipBackward}
                className="p-4 -m-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlayPause}
                className="w-18 h-18 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
                style={{ width: '72px', height: '72px' }}
              >
                {isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="black">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="black" className="ml-1">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-4 -m-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
                </svg>
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-4 -m-1 transition-all hover:scale-110 active:scale-95 relative ${repeat !== 'off' ? 'text-primary' : 'text-white/60 hover:text-white'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {repeat === 'one' && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold text-primary">1</span>
                )}
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between max-w-sm mx-auto w-full">
              {/* Add to Playlist */}
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="p-4 -m-1 text-white/60 hover:text-white transition-colors active:scale-95"
                title="Add to Playlist"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>

              {/* Share */}
              <button
                onClick={() => setShowShareModal(true)}
                className="p-4 -m-1 text-white/60 hover:text-white transition-colors active:scale-95"
                title="Share"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>

              {/* Embed */}
              <button
                onClick={() => setShowEmbedModal(true)}
                className="p-4 -m-1 text-white/60 hover:text-white transition-colors active:scale-95"
                title="Embed"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </button>

              {/* Volume (Desktop) */}
              <div className="hidden lg:block">
                <button
                  onClick={toggleMute}
                  className="p-4 -m-1 text-white/60 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-[#282828] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Share</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/40 block mb-2">Copy link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShareUrl()}
                    readOnly
                    className="flex-1 bg-black/30 text-white text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => copyToClipboard(getShareUrl())}
                    className="px-4 py-2.5 bg-primary text-black rounded-lg font-medium hover:bg-[#ff5c2e] transition-colors"
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(`Check out "${currentTrack.title}" by ${currentTrack.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-black/30 text-white rounded-lg text-center font-medium hover:bg-black/50 transition-colors text-sm"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-black/30 text-white rounded-lg text-center font-medium hover:bg-black/50 transition-colors text-sm"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-[#282828] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Embed</h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div>
              <label className="text-sm text-white/40 block mb-2">Embed code</label>
              <textarea
                value={getEmbedCode()}
                readOnly
                rows={3}
                className="w-full bg-black/30 text-white text-sm px-4 py-3 rounded-lg border border-white/10 resize-none font-mono focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => copyToClipboard(getEmbedCode())}
                className="mt-3 w-full px-4 py-2.5 bg-primary text-black rounded-lg font-medium hover:bg-[#ff5c2e] transition-colors"
              >
                {copySuccess ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-[#282828] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add to Playlist</h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-center py-6">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto text-white/20 mb-3"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <p className="text-white/60 text-sm mb-4">Select a playlist to add this track</p>
              <Link
                href="/playlists"
                onClick={() => {
                  setShowPlaylistModal(false);
                  setIsExpanded(false);
                }}
                className="inline-block px-6 py-2.5 bg-primary text-black rounded-full font-medium hover:bg-[#ff5c2e] transition-colors"
              >
                Go to Playlists
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Still Listening Prompt */}
      {showStillListeningPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-[#282828] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Still listening?</h2>
              <p className="text-white/60 text-sm">
                You've been listening for a while. Tap below to continue.
              </p>
            </div>
            <button
              onClick={confirmStillListening}
              className="w-full px-6 py-3 bg-primary text-black rounded-full font-semibold hover:bg-[#ff5c2e] transition-colors"
            >
              Continue Listening
            </button>
          </div>
        </div>
      )}
    </>
  );
};
