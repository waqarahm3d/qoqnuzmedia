'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  ShuffleIcon,
  RepeatIcon,
  VolumeIcon,
  VolumeMutedIcon,
  HeartIcon,
  HeartFilledIcon,
  QueueIcon,
} from '../icons';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image?: string;
  duration: number;
  url?: string;
}

export const Player = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');

  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Demo track for UI purposes
  useEffect(() => {
    setCurrentTrack({
      id: '1',
      title: 'Sample Track',
      artist: 'Sample Artist',
      album: 'Sample Album',
      duration: 210,
    });
    setDuration(210);
  }, []);

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-white/10 px-4 py-3 z-50 lg:mb-0 mb-16">
      <audio ref={audioRef} />

      <div className="flex items-center justify-between gap-4">
        {/* Current Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:w-[30%]">
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
            <div className="w-14 h-14 bg-surface rounded flex items-center justify-center flex-shrink-0 hidden sm:block">
              <span className="text-white/40">♪</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">
              {currentTrack.title}
            </div>
            <div className="text-xs text-white/60 truncate">
              {currentTrack.artist}
            </div>
          </div>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className="text-white/60 hover:text-white transition-colors hidden sm:block"
          >
            {isLiked ? (
              <HeartFilledIcon size={16} className="text-primary" />
            ) : (
              <HeartIcon size={16} />
            )}
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          {/* Control Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`hidden sm:block transition-colors ${
                shuffle ? 'text-primary' : 'text-white/60 hover:text-white'
              }`}
            >
              <ShuffleIcon size={16} />
            </button>

            <button className="text-white/60 hover:text-white transition-colors">
              <SkipBackIcon size={20} />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <PauseIcon size={18} className="text-black" />
              ) : (
                <PlayIcon size={18} className="text-black ml-0.5" />
              )}
            </button>

            <button className="text-white/60 hover:text-white transition-colors">
              <SkipForwardIcon size={20} />
            </button>

            <button
              onClick={() => {
                const states: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
                const currentIndex = states.indexOf(repeat);
                const nextIndex = (currentIndex + 1) % states.length;
                setRepeat(states[nextIndex]);
              }}
              className={`hidden sm:block transition-colors ${
                repeat !== 'off' ? 'text-primary' : 'text-white/60 hover:text-white'
              }`}
            >
              <RepeatIcon size={16} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-white/60 tabular-nums hidden sm:inline">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:opacity-0
                hover:[&::-webkit-slider-thumb]:opacity-100
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:opacity-0
                hover:[&::-moz-range-thumb]:opacity-100"
              style={{
                background: `linear-gradient(to right, #fff ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%)`,
              }}
            />
            <span className="text-xs text-white/60 tabular-nums hidden sm:inline">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Queue Controls */}
        <div className="hidden lg:flex items-center gap-2 justify-end flex-1 lg:w-[30%]">
          <button className="text-white/60 hover:text-white transition-colors">
            <QueueIcon size={16} />
          </button>

          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeMutedIcon size={16} />
            ) : (
              <VolumeIcon size={16} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:opacity-0
              hover:[&::-webkit-slider-thumb]:opacity-100
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:opacity-0
              hover:[&::-moz-range-thumb]:opacity-100"
            style={{
              background: `linear-gradient(to right, #fff ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
