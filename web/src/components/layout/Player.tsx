'use client';

import { usePlayer } from '@/lib/contexts/PlayerContext';
import Image from 'next/image';

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
    openOverlay,
  } = usePlayer();

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

  // Always render the player bar, but show empty state when no track
  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-4 py-3 z-[60] mb-16 lg:mb-0">
        <div className="flex items-center justify-center h-20">
          <div className="text-center text-gray-500">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mx-auto mb-2 opacity-50"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-xs">No track playing</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-4 py-3 z-[60] mb-16 lg:mb-0">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        {/* Current Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:w-[30%]">
          <button
            onClick={openOverlay}
            className="flex items-center gap-3 min-w-0 flex-1 hover:bg-white/5 rounded-md p-1 -m-1 transition-colors"
          >
            {currentTrack.image ? (
              <div className="relative w-14 h-14 flex-shrink-0 hidden sm:block">
                <Image
                  src={currentTrack.image}
                  alt={currentTrack.title}
                  fill
                  className="object-cover rounded"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="w-14 h-14 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 hidden sm:block">
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

            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm font-medium text-white truncate">
                {currentTrack.title}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {currentTrack.artist}
              </div>
            </div>
          </button>

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

        {/* Player Controls */}
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
              onClick={togglePlayPause}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              title={isPlaying ? 'Pause' : 'Play'}
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

            {/* Next */}
            <button onClick={skipForward} className="text-gray-400 hover:text-white transition-colors" title="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`hidden sm:block transition-colors ${
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

        {/* Volume & Queue Controls */}
        <div className="hidden lg:flex items-center gap-2 justify-end flex-1 lg:w-[30%]">
          {/* Queue */}
          <button className="text-gray-400 hover:text-white transition-colors" title="Queue">
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

      {/* Still Listening Prompt Modal */}
      {showStillListeningPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]">
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
    </div>
  );
};
