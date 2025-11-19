'use client';

import { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import * as api from '@/lib/api/client';
import { getMediaUrl } from '@/lib/media-utils';

interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  image?: string;
  duration: number;
  url?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLiked: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  queue: Track[];
  showStillListeningPrompt: boolean;
  showOverlay: boolean;
  isLoading: boolean;
  error: string | null;
  // Control methods
  playTrack: (track: Track, skipQueueUpdate?: boolean) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLike: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  confirmStillListening: () => void;
  openOverlay: () => void;
  closeOverlay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  // Ref to hold the latest handleTrackEnd function
  const handleTrackEndRef = useRef<() => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showStillListeningPrompt, setShowStillListeningPrompt] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [playbackStartTime, setPlaybackStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stillListeningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    // Set initial volume
    audio.volume = volume / 100;

    // Enable background playback on iOS
    audio.setAttribute('playsinline', 'true');

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Update Media Session position state
      if ('mediaSession' in navigator && audio.duration) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleTrackEndRef.current();
    };

    const handleError = () => {
      setError('Playback error');
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Media Session API - Lock screen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // Set metadata for lock screen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork: currentTrack.image ? [
        { src: currentTrack.image, sizes: '96x96', type: 'image/jpeg' },
        { src: currentTrack.image, sizes: '128x128', type: 'image/jpeg' },
        { src: currentTrack.image, sizes: '192x192', type: 'image/jpeg' },
        { src: currentTrack.image, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.image, sizes: '384x384', type: 'image/jpeg' },
        { src: currentTrack.image, sizes: '512x512', type: 'image/jpeg' },
      ] : [],
    });

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentTime > 3) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      } else if (queueIndex > 0) {
        const prevTrack = queue[queueIndex - 1];
        if (prevTrack) {
          setQueueIndex(queueIndex - 1);
          setCurrentTrack(prevTrack);
          api.getStreamUrl(prevTrack.id).then(({ url }) => {
            if (audioRef.current) {
              audioRef.current.src = url;
              audioRef.current.play();
            }
            api.trackPlay(prevTrack.id);
          });
        }
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (queue.length === 0) return;
      const nextIndex = shuffle
        ? Math.floor(Math.random() * queue.length)
        : Math.min(queueIndex + 1, queue.length - 1);

      const nextTrack = queue[nextIndex];
      if (nextTrack) {
        setQueueIndex(nextIndex);
        setCurrentTrack(nextTrack);
        api.getStreamUrl(nextTrack.id).then(({ url }) => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }
          api.trackPlay(nextTrack.id);
        });
      }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + skipTime,
          audioRef.current.duration || 0
        );
      }
    });

    return () => {
      // Clean up action handlers
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
  }, [currentTrack, currentTime, queueIndex, queue, shuffle]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Check if track is liked
  useEffect(() => {
    if (currentTrack) {
      api.isTrackLiked(currentTrack.id).then(setIsLiked);
    }
  }, [currentTrack]);

  // Monitor playback time for "still listening" prompt (3 hours)
  useEffect(() => {
    if (isPlaying) {
      // Start or resume timer
      if (!playbackStartTime) {
        setPlaybackStartTime(Date.now());
      }

      // Check every minute if 3 hours have passed
      stillListeningTimerRef.current = setInterval(() => {
        if (playbackStartTime) {
          const elapsedTime = Date.now() - playbackStartTime;
          const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

          if (elapsedTime >= threeHours) {
            // Pause and show prompt
            audioRef.current?.pause();
            setShowStillListeningPrompt(true);

            // Clear the timer
            if (stillListeningTimerRef.current) {
              clearInterval(stillListeningTimerRef.current);
              stillListeningTimerRef.current = null;
            }
          }
        }
      }, 60000); // Check every minute
    } else {
      // Clear timer when paused
      if (stillListeningTimerRef.current) {
        clearInterval(stillListeningTimerRef.current);
        stillListeningTimerRef.current = null;
      }
    }

    return () => {
      if (stillListeningTimerRef.current) {
        clearInterval(stillListeningTimerRef.current);
        stillListeningTimerRef.current = null;
      }
    };
  }, [isPlaying, playbackStartTime]);

  const handleTrackEnd = useCallback(async () => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (repeat === 'all' && queueIndex === queue.length - 1) {
      // Play first track
      const firstTrack = queue[0];
      if (firstTrack && audioRef.current) {
        setQueueIndex(0);
        setCurrentTrack(firstTrack);
        api.getStreamUrl(firstTrack.id).then(({ url }) => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }
          api.trackPlay(firstTrack.id);
        });
      }
      return;
    }

    if (queueIndex < queue.length - 1) {
      // Move to next track
      const nextIndex = queueIndex + 1;
      const nextTrack = queue[nextIndex];
      if (nextTrack && audioRef.current) {
        setQueueIndex(nextIndex);
        setCurrentTrack(nextTrack);
        api.getStreamUrl(nextTrack.id).then(({ url }) => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }
          api.trackPlay(nextTrack.id);
        });
      }
    } else if (queue.length > 0) {
      // At the end of queue with repeat off - fetch more related tracks
      const lastTrack = queue[queue.length - 1];
      if (lastTrack) {
        try {
          const response = await fetch(`/api/tracks/${lastTrack.id}/related?limit=20`);
          if (response.ok) {
            const data = await response.json();
            const relatedTracks = data.tracks.map((t: any) => ({
              id: t.id,
              title: t.title,
              artist: t.artists.name,
              artistId: t.artist_id,
              album: t.albums?.title || 'Single',
              albumId: t.album_id,
              image: getMediaUrl(t.albums?.cover_art_url || t.cover_art_url),
              duration: t.duration_ms,
            }));

            if (relatedTracks.length > 0 && audioRef.current) {
              // Add related tracks to queue and play the first one
              setQueue([...queue, ...relatedTracks]);
              const nextIndex = queue.length;
              setQueueIndex(nextIndex);
              setCurrentTrack(relatedTracks[0]);
              const { url } = await api.getStreamUrl(relatedTracks[0].id);
              audioRef.current.src = url;
              audioRef.current.play();
              api.trackPlay(relatedTracks[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching related tracks:', error);
        }
      }
    }
  }, [repeat, queueIndex, queue]);

  // Keep the ref updated with latest handleTrackEnd
  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  const playTrack = useCallback(async (track: Track, skipQueueUpdate = false) => {
    try {
      setCurrentTrack(track);

      // Get streaming URL from backend
      const { url } = await api.getStreamUrl(track.id);

      // Load and play
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }

      // Track play in history
      api.trackPlay(track.id);

      // Auto-queue related tracks if queue is empty or has only current track
      if (!skipQueueUpdate && queue.length <= 1) {
        fetchAndQueueRelatedTracks(track);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [queue.length]);

  const fetchAndQueueRelatedTracks = async (track: Track) => {
    try {
      const response = await fetch(`/api/tracks/${track.id}/related?limit=20`);
      if (response.ok) {
        const data = await response.json();
        const relatedTracks = data.tracks.map((t: any) => ({
          id: t.id,
          title: t.title,
          artist: t.artists.name,
          artistId: t.artist_id,
          album: t.albums?.title || 'Single',
          albumId: t.album_id,
          image: getMediaUrl(t.albums?.cover_art_url || t.cover_art_url),
          duration: t.duration_ms,
        }));

        // Add current track and related tracks to queue
        setQueue([track, ...relatedTracks]);
        setQueueIndex(0);
      }
    } catch (error) {
      console.error('Error fetching related tracks:', error);
    }
  };

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleLike = async () => {
    if (!currentTrack) return;

    try {
      if (isLiked) {
        await api.unlikeTrack(currentTrack.id);
        setIsLiked(false);
      } else {
        await api.likeTrack(currentTrack.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    const states: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = states.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % states.length;
    setRepeat(states[nextIndex]);
  };

  const skipForward = useCallback(() => {
    if (queue.length === 0) return;

    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : Math.min(queueIndex + 1, queue.length - 1);

    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex], true); // Skip queue update when navigating queue
  }, [queue, shuffle, queueIndex, playTrack]);

  const skipBackward = useCallback(() => {
    if (currentTime > 3) {
      // If more than 3 seconds into track, restart it
      seek(0);
    } else if (queueIndex > 0) {
      // Otherwise, go to previous track
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex], true); // Skip queue update when navigating queue
    }
  }, [currentTime, queueIndex, queue, seek, playTrack]);

  const addToQueue = (track: Track) => {
    setQueue([...queue, track]);
  };

  const setQueueWithTracks = (tracks: Track[]) => {
    setQueue(tracks);
    setQueueIndex(0);
    if (tracks.length > 0) {
      playTrack(tracks[0], true); // Skip queue update when manually setting queue
    }
  };

  const confirmStillListening = useCallback(() => {
    // Reset the timer and resume playback
    setPlaybackStartTime(Date.now());
    setShowStillListeningPrompt(false);
    resume();
  }, [resume]);

  const openOverlay = () => {
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  return (
    <PlayerContext.Provider
      value={{
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
        showOverlay,
        isLoading,
        error,
        // Control methods
        playTrack,
        pause,
        resume,
        togglePlayPause,
        seek,
        setVolume,
        toggleMute,
        toggleLike,
        toggleShuffle,
        toggleRepeat,
        skipForward,
        skipBackward,
        addToQueue,
        setQueue: setQueueWithTracks,
        confirmStillListening,
        openOverlay,
        closeOverlay,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
