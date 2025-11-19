'use client';

import { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import * as api from '@/lib/api/client';
import { getMediaUrl } from '@/lib/media-utils';
import { useWebAudioPlayer } from '@/lib/hooks';

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
  isBuffering: boolean;
  error: string | null;
  // Visualization methods
  getFrequencyData: () => Uint8Array | null;
  getWaveformData: () => Uint8Array | null;
  getAverageFrequency: () => number;
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

  // Use Web Audio API player hook
  const [audioState, audioControls, audioRef] = useWebAudioPlayer({
    initialVolume: 80,
    fftSize: 256,
    enableVisualization: true,
    onEnded: () => handleTrackEndRef.current(),
    onError: (e) => {
      console.error('Audio playback error:', e);
    },
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showStillListeningPrompt, setShowStillListeningPrompt] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [playbackStartTime, setPlaybackStartTime] = useState<number | null>(null);
  const stillListeningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract state from Web Audio hook
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    isBuffering,
    error
  } = audioState;

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
            audioControls.pause();
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
  }, [isPlaying, playbackStartTime, audioControls]);

  const handleTrackEnd = useCallback(async () => {
    if (repeat === 'one') {
      audioControls.play();
      return;
    }

    if (repeat === 'all' && queueIndex === queue.length - 1) {
      // Play first track - we need to call playTrackInternal
      const firstTrack = queue[0];
      if (firstTrack) {
        setQueueIndex(0);
        setCurrentTrack(firstTrack);
        api.getStreamUrl(firstTrack.id).then(({ url }) => {
          audioControls.loadTrack(url);
          audioControls.play();
          api.trackPlay(firstTrack.id);
        });
      }
      return;
    }

    if (queueIndex < queue.length - 1) {
      // Move to next track
      const nextIndex = queueIndex + 1;
      const nextTrack = queue[nextIndex];
      if (nextTrack) {
        setQueueIndex(nextIndex);
        setCurrentTrack(nextTrack);
        api.getStreamUrl(nextTrack.id).then(({ url }) => {
          audioControls.loadTrack(url);
          audioControls.play();
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

            if (relatedTracks.length > 0) {
              // Add related tracks to queue and play the first one
              setQueue([...queue, ...relatedTracks]);
              const nextIndex = queue.length;
              setQueueIndex(nextIndex);
              setCurrentTrack(relatedTracks[0]);
              const { url } = await api.getStreamUrl(relatedTracks[0].id);
              audioControls.loadTrack(url);
              audioControls.play();
              api.trackPlay(relatedTracks[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching related tracks:', error);
        }
      }
    }
  }, [repeat, queueIndex, queue, audioControls]);

  // Keep the ref updated with latest handleTrackEnd
  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  const playTrack = useCallback(async (track: Track, skipQueueUpdate = false) => {
    try {
      setCurrentTrack(track);

      // Get streaming URL from backend
      const { url } = await api.getStreamUrl(track.id);

      // Load and play using Web Audio controls
      audioControls.loadTrack(url);
      await audioControls.play();

      // Track play in history
      api.trackPlay(track.id);

      // Auto-queue related tracks if queue is empty or has only current track
      if (!skipQueueUpdate && queue.length <= 1) {
        fetchAndQueueRelatedTracks(track);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [audioControls, queue.length]);

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
    audioControls.pause();
  }, [audioControls]);

  const resume = useCallback(() => {
    audioControls.play();
  }, [audioControls]);

  const togglePlayPause = useCallback(() => {
    audioControls.toggle();
  }, [audioControls]);

  const seek = useCallback((time: number) => {
    audioControls.seek(time);
  }, [audioControls]);

  const setVolume = useCallback((newVolume: number) => {
    audioControls.setVolume(newVolume);
  }, [audioControls]);

  const toggleMute = useCallback(() => {
    audioControls.toggleMute();
  }, [audioControls]);

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
        isBuffering,
        error,
        // Visualization methods from Web Audio API
        getFrequencyData: audioControls.getFrequencyData,
        getWaveformData: audioControls.getWaveformData,
        getAverageFrequency: audioControls.getAverageFrequency,
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
