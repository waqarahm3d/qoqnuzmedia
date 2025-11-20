'use client';

import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  HeartIcon,
  HeartFilledIcon,
  ShuffleIcon,
  RepeatIcon,
  MoreIcon,
  VolumeIcon,
  VolumeMutedIcon,
} from '../icons';
import { TrackContextMenu } from './TrackContextMenu';
import DownloadButton from '../DownloadButton';

export const NowPlayingOverlay = () => {
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
    showOverlay,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    skipForward,
    skipBackward,
    closeOverlay,
  } = usePlayer();

  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  // Close overlay when no track is playing
  useEffect(() => {
    if (!currentTrack && showOverlay) {
      closeOverlay();
    }
  }, [currentTrack, showOverlay, closeOverlay]);

  if (!showOverlay || !currentTrack) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      seek(percent * duration);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current) {
      const rect = volumeBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      setVolume(Math.round(percent * 100));
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-black">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={closeOverlay}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <ChevronDownIcon size={24} />
          </button>
          <div className="text-sm font-medium">Now Playing</div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="More options"
          >
            <MoreIcon size={24} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center px-6 lg:px-12 pb-32 pt-8">
          {/* Album artwork */}
          <div className="w-full max-w-md lg:max-w-lg aspect-square relative mb-8 shadow-2xl">
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-surface rounded-lg flex items-center justify-center">
                <div className="text-6xl text-white/40">♪</div>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="w-full max-w-md lg:max-w-lg mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center truncate">
              {currentTrack.title}
            </h1>
            <p className="text-base lg:text-lg text-white/60 text-center truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md lg:max-w-lg mb-2">
            <div
              ref={progressBarRef}
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-white rounded-full relative transition-all group-hover:bg-primary"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Time indicators */}
          <div className="w-full max-w-md lg:max-w-lg flex justify-between text-sm text-white/60 mb-8">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Player controls */}
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Main controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-colors ${
                  shuffle ? 'text-primary' : 'text-white/60 hover:text-white'
                }`}
                aria-label="Shuffle"
              >
                <ShuffleIcon size={20} />
              </button>

              <button
                onClick={skipBackward}
                className="p-3 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Previous track"
              >
                <SkipBackIcon size={24} />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon size={28} className="text-black" />
                ) : (
                  <PlayIcon size={28} className="text-black" />
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-3 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Next track"
              >
                <SkipForwardIcon size={24} />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-full transition-colors ${
                  repeat !== 'off' ? 'text-primary' : 'text-white/60 hover:text-white'
                }`}
                aria-label={`Repeat: ${repeat}`}
              >
                <RepeatIcon size={20} />
                {repeat === 'one' && (
                  <span className="absolute text-xs font-bold">1</span>
                )}
              </button>
            </div>

            {/* Secondary controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLike}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  {isLiked ? (
                    <HeartFilledIcon size={24} className="text-primary" />
                  ) : (
                    <HeartIcon size={24} />
                  )}
                </button>

                {/* Download button */}
                {currentTrack && (
                  <DownloadButton
                    track={{
                      id: currentTrack.id,
                      title: currentTrack.title,
                      artists: { name: currentTrack.artist },
                      cover_art_url: currentTrack.image,
                    }}
                    size="md"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeMutedIcon size={20} /> : <VolumeIcon size={20} />}
                </button>
                <div
                  ref={volumeBarRef}
                  className="w-24 h-1 bg-white/20 rounded-full cursor-pointer group"
                  onClick={handleVolumeClick}
                >
                  <div
                    className="h-full bg-white rounded-full relative transition-all group-hover:bg-primary"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {showMenu && (
        <TrackContextMenu
          trackId={currentTrack.id}
          trackTitle={currentTrack.title}
          artistId={currentTrack.artistId}
          albumId={currentTrack.albumId}
          onClose={() => setShowMenu(false)}
        />
      )}
    </>
  );
};
