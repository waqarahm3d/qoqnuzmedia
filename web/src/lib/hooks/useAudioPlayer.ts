'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioPlayerOptions {
  initialVolume?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onError?: (error: Event) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}

interface AudioPlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  seekPercentage: (percentage: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  loadTrack: (url: string) => void;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): [AudioPlayerState, AudioPlayerControls, React.RefObject<HTMLAudioElement>] {
  const {
    initialVolume = 80,
    onTimeUpdate,
    onDurationChange,
    onEnded,
    onError,
    onPlay,
    onPause,
    onLoadStart,
    onCanPlay,
    onWaiting,
    onPlaying,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    // Set initial volume
    audio.volume = initialVolume / 100;

    // Event handlers
    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (!isNaN(dur)) {
        setDuration(dur);
        onDurationChange?.(dur);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      let errorMessage = 'Unknown playback error';

      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
        }
      }

      setError(errorMessage);
      setIsPlaying(false);
      setIsLoading(false);
      onError?.(e);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      onCanPlay?.();
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      onWaiting?.();
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      onPlaying?.();
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);

      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update audio volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Control functions
  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      }
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      const clampedTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [duration]);

  const seekPercentage = useCallback((percentage: number) => {
    if (duration > 0) {
      const time = (percentage / 100) * duration;
      seek(time);
    }
  }, [duration, seek]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const mute = useCallback(() => {
    setIsMuted(true);
  }, []);

  const unmute = useCallback(() => {
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const loadTrack = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(0);
      setError(null);
    }
  }, []);

  const state: AudioPlayerState = {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    isBuffering,
    error,
  };

  const controls: AudioPlayerControls = {
    play,
    pause,
    stop,
    toggle,
    seek,
    seekPercentage,
    setVolume,
    mute,
    unmute,
    toggleMute,
    loadTrack,
  };

  return [state, controls, audioRef];
}

// Utility functions
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  return formatTime(ms / 1000);
}

export function getProgressPercentage(currentTime: number, duration: number): number {
  if (duration === 0) return 0;
  return (currentTime / duration) * 100;
}
