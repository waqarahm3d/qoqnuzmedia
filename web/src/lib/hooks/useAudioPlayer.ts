import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useQueueStore } from '../stores/queueStore';
import { Track } from '../types/music';

/**
 * useAudioPlayer Hook
 *
 * Manages audio playback using HTML Audio API.
 * Syncs with playerStore and queueStore for global state management.
 *
 * Features:
 * - Audio playback control
 * - Progress tracking
 * - Volume management
 * - Media Session API integration (lock screen controls)
 * - Automatic queue progression
 * - Error handling and retry logic
 *
 * @example
 * ```tsx
 * function Player() {
 *   useAudioPlayer();
 *   // Player state is managed globally via stores
 * }
 * ```
 */

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Player Store
  const {
    currentTrack,
    isPlaying,
    volume,
    repeat,
    setProgress,
    setCurrentTime,
    setDuration,
    setIsLoading,
    pause,
    play: playStore,
  } = usePlayerStore();

  // Queue Store
  const { queue, currentIndex, next, shuffleQueue, unshuffleQueue } = useQueueStore();
  const shuffle = usePlayerStore((state) => state.shuffle);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update Media Session API
  const updateMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator && track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        artwork: track.artwork_url
          ? [
              { src: track.artwork_url, sizes: '96x96', type: 'image/jpeg' },
              { src: track.artwork_url, sizes: '128x128', type: 'image/jpeg' },
              { src: track.artwork_url, sizes: '192x192', type: 'image/jpeg' },
              { src: track.artwork_url, sizes: '256x256', type: 'image/jpeg' },
              { src: track.artwork_url, sizes: '384x384', type: 'image/jpeg' },
              { src: track.artwork_url, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });
    }
  }, []);

  // Load and play track
  const loadAndPlayTrack = useCallback(
    async (track: Track) => {
      if (!audioRef.current) return;

      setIsLoading(true);

      try {
        audioRef.current.src = track.audio_url;
        audioRef.current.load();

        updateMediaSession(track);

        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing track:', error);
        setIsLoading(false);
        pause();
      }
    },
    [setIsLoading, pause, updateMediaSession]
  );

  // Handle track change
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      loadAndPlayTrack(currentTrack);
    }
  }, [currentTrack?.id]); // Only trigger on track ID change

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing:', error);
        pause();
      });
    } else if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying, pause]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle shuffle
  useEffect(() => {
    if (shuffle) {
      shuffleQueue();
    } else {
      unshuffleQueue();
    }
  }, [shuffle]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      // Track ended - handle repeat/next logic
      if (repeat === 'one') {
        // Repeat current track
        audio.currentTime = 0;
        audio.play();
      } else {
        // Get next track
        const nextTrack = next();

        if (nextTrack) {
          // Play next track
          playStore(nextTrack);
        } else if (repeat === 'all' && queue.length > 0) {
          // Restart queue from beginning
          playStore(queue[0]);
        } else {
          // End of queue, stop playback
          pause();
          setProgress(0);
          setCurrentTime(0);
        }
      }
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      pause();
      // Could show toast notification here
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    // Attach event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [repeat, next, queue, playStore, pause, setDuration, setIsLoading, setProgress, setCurrentTime]);

  // Progress tracking
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100); // Update every 100ms for smooth progress

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [isPlaying, setCurrentTime]);

  // Media Session API controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const { previous: prevTrack } = useQueueStore.getState();
      const { togglePlayPause } = usePlayerStore.getState();

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = prevTrack();
        if (prev) {
          playStore(prev);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const nextTrack = next();
        if (nextTrack) {
          playStore(nextTrack);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [next, playStore, setCurrentTime]);

  // Expose audio element for direct manipulation if needed
  return {
    audioElement: audioRef.current,
    seek: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
  };
}
