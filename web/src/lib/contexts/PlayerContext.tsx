'use client';

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
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
  const stillListeningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('durationchange', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      handleTrackEnd();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

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
            setIsPlaying(false);
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

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      audioRef.current?.play();
      return;
    }

    if (repeat === 'all' && queueIndex === queue.length - 1) {
      playTrack(queue[0], true); // Skip queue update when repeating
      setQueueIndex(0);
      return;
    }

    if (queueIndex < queue.length - 1) {
      skipForward();
    } else {
      setIsPlaying(false);
    }
  };

  const playTrack = async (track: Track, skipQueueUpdate = false) => {
    try {
      setCurrentTrack(track);

      // Get streaming URL from backend
      const { url } = await api.getStreamUrl(track.id);

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
        setIsPlaying(true);

        // Track play in history
        api.trackPlay(track.id);

        // Auto-queue related tracks if queue is empty or has only current track
        if (!skipQueueUpdate && queue.length <= 1) {
          fetchAndQueueRelatedTracks(track);
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
    }
  };

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

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resume = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

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

  const skipForward = () => {
    if (queue.length === 0) return;

    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : Math.min(queueIndex + 1, queue.length - 1);

    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex], true); // Skip queue update when navigating queue
  };

  const skipBackward = () => {
    if (currentTime > 3) {
      // If more than 3 seconds into track, restart it
      seek(0);
    } else if (queueIndex > 0) {
      // Otherwise, go to previous track
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex], true); // Skip queue update when navigating queue
    }
  };

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

  const confirmStillListening = () => {
    // Reset the timer and resume playback
    setPlaybackStartTime(Date.now());
    setShowStillListeningPrompt(false);
    resume();
  };

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
