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
    playTrack,
  } = usePlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

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
      // Swipe up to expand
      setIsExpanded(true);
    } else if (isExpanded && deltaY > threshold) {
      // Swipe down to minimize
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

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  return (
    <>
      {/* Mini Player Bar */}
      <div
        ref={playerRef}
        className={`fixed left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-[60] transition-all duration-300 ease-out ${
          isExpanded ? 'bottom-full opacity-0' : 'bottom-0 mb-16 lg:mb-0'
        }`}
        style={{
          transform: isDragging && !isExpanded ? `translateY(${Math.min(0, dragOffset)}px)` : undefined,
        }}
      >
        {/* Drag handle indicator */}
        <div
          className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsExpanded(true)}
        >
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3 pt-4">
          {/* Track Info */}
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
          >
            {currentTrack.image ? (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={currentTrack.image}
                  alt={currentTrack.title}
                  fill
                  className="object-cover rounded"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{currentTrack.title}</div>
              <div className="text-xs text-gray-400 truncate">{currentTrack.artist}</div>
            </div>
          </button>

          {/* Mini Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLike}
              className="p-2 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isLiked ? '#ff4a14' : 'none'}
                stroke={isLiked ? '#ff4a14' : 'currentColor'}
                strokeWidth="2"
                className="text-gray-400"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
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
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Expanded Full Screen Player */}
      <div
        className={`fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-[70] transition-all duration-300 ease-out ${
          isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          transform: isDragging && isExpanded ? `translateY(${Math.max(0, dragOffset)}px)` : undefined,
        }}
      >
        {/* Header with drag handle */}
        <div
          className="flex items-center justify-between p-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => {
              setIsExpanded(false);
              setShowQueue(false);
            }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="w-10 h-1 bg-white/30 rounded-full" />

          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 transition-colors ${showQueue ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
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
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Now Playing */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-2">Now Playing</h3>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                {currentTrack.image ? (
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={currentTrack.image}
                      alt={currentTrack.title}
                      fill
                      className="object-cover rounded"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-gray-600">♪</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{currentTrack.title}</div>
                  <div className="text-sm text-gray-400 truncate">{currentTrack.artist}</div>
                </div>
                {/* Soundwave animation */}
                <div className="flex items-center gap-0.5 h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-primary rounded-full ${isPlaying ? `animate-soundwave-${i}` : 'h-1'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Queue List */}
            {queue.length > 0 ? (
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Next Up</h3>
                <div className="space-y-2">
                  {queue.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors"
                    >
                      {track.image ? (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={track.image}
                            alt={track.title}
                            fill
                            className="object-cover rounded"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-gray-600 text-sm">♪</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{track.title}</div>
                        <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                      </div>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
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
              <div className="text-center py-8">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto text-gray-600 mb-3"
                >
                  <path d="M21 15V6" />
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 12H3" />
                  <path d="M16 6H3" />
                  <path d="M12 18H3" />
                </svg>
                <p className="text-gray-500">No tracks in queue</p>
              </div>
            )}
          </div>
        ) : (
          /* Main Player View */
          <div className="flex flex-col h-full px-6 pb-8">
            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="relative w-full max-w-sm aspect-square">
                {currentTrack.image ? (
                  <Image
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    fill
                    className="object-cover rounded-lg shadow-2xl"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center shadow-2xl">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Track Info & Links */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-4">
                  <h2 className="text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
                  {currentTrack.artistId ? (
                    <Link
                      href={`/artist/${currentTrack.artistId}`}
                      className="text-lg text-gray-400 hover:text-primary transition-colors truncate block"
                      onClick={() => setIsExpanded(false)}
                    >
                      {currentTrack.artist}
                    </Link>
                  ) : (
                    <p className="text-lg text-gray-400 truncate">{currentTrack.artist}</p>
                  )}
                  {currentTrack.albumId && (
                    <Link
                      href={`/album/${currentTrack.albumId}`}
                      className="text-sm text-gray-500 hover:text-primary transition-colors truncate block mt-1"
                      onClick={() => setIsExpanded(false)}
                    >
                      {currentTrack.album}
                    </Link>
                  )}
                </div>
                <button
                  onClick={toggleLike}
                  className="p-2 transition-colors flex-shrink-0"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={isLiked ? '#ff4a14' : 'none'}
                    stroke={isLiked ? '#ff4a14' : 'currentColor'}
                    strokeWidth="2"
                    className={isLiked ? '' : 'text-gray-400 hover:text-white'}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0"
                  style={{
                    background: `linear-gradient(to right, #ff4a14 ${((currentTime || 0) / (duration || 1)) * 100}%, #4B5563 ${((currentTime || 0) / (duration || 1)) * 100}%)`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400 tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-xs text-gray-400 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${shuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </button>

              <button onClick={skipBackward} className="p-2 text-white hover:scale-110 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                )}
              </button>

              <button onClick={skipForward} className="p-2 text-white hover:scale-110 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
                </svg>
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {repeat === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold text-primary">1</span>
                )}
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-around">
              {/* Add to Playlist */}
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-xs">Playlist</span>
              </button>

              {/* Share */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="text-xs">Share</span>
              </button>

              {/* Embed */}
              <button
                onClick={() => setShowEmbedModal(true)}
                className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span className="text-xs">Embed</span>
              </button>

              {/* Volume (Desktop) */}
              <div className="hidden lg:flex flex-col items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
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
                    background: `linear-gradient(to right, #fff ${isMuted ? 0 : volume}%, #4B5563 ${isMuted ? 0 : volume}%)`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Share Track</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Share URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShareUrl()}
                    readOnly
                    className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-700"
                  />
                  <button
                    onClick={() => {
                      copyToClipboard(getShareUrl());
                    }}
                    className="px-4 py-2 bg-primary text-black rounded font-medium hover:bg-[#ff5c2e] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(`Check out "${currentTrack.title}" by ${currentTrack.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-[#1DA1F2] text-white rounded text-center font-medium hover:opacity-90 transition-opacity"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-[#4267B2] text-white rounded text-center font-medium hover:opacity-90 transition-opacity"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Embed Track</h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Embed Code</label>
              <textarea
                value={getEmbedCode()}
                readOnly
                rows={4}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-700 resize-none font-mono"
              />
              <button
                onClick={() => {
                  copyToClipboard(getEmbedCode());
                }}
                className="mt-3 w-full px-4 py-2 bg-primary text-black rounded font-medium hover:bg-[#ff5c2e] transition-colors"
              >
                Copy Embed Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add to Playlist</h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-center py-8">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto text-gray-600 mb-3"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <p className="text-gray-400 mb-4">Create or select a playlist to add this track</p>
              <Link
                href="/playlists"
                onClick={() => {
                  setShowPlaylistModal(false);
                  setIsExpanded(false);
                }}
                className="inline-block px-6 py-2 bg-primary text-black rounded-full font-medium hover:bg-[#ff5c2e] transition-colors"
              >
                Go to Playlists
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Still Listening Prompt Modal */}
      {showStillListeningPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80]">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-primary mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Still listening?</h2>
              <p className="text-gray-400">
                You've been listening for a while. Are you still there?
              </p>
            </div>
            <button
              onClick={confirmStillListening}
              className="w-full px-6 py-3 bg-primary text-black rounded-full font-semibold hover:bg-[#ff5c2e] transition-colors"
            >
              Yes, I'm still listening
            </button>
          </div>
        </div>
      )}
    </>
  );
};
