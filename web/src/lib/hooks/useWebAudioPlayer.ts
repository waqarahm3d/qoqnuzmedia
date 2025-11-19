'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseWebAudioPlayerOptions {
  initialVolume?: number;
  fftSize?: number; // For visualization: 32, 64, 128, 256, 512, 1024, 2048
  enableVisualization?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onError?: (error: Event) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onFrequencyData?: (data: Uint8Array) => void;
  onWaveformData?: (data: Uint8Array) => void;
}

interface WebAudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
  audioContextState: AudioContextState | null;
}

interface WebAudioPlayerControls {
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
  getFrequencyData: () => Uint8Array | null;
  getWaveformData: () => Uint8Array | null;
  getAverageFrequency: () => number;
}

interface WebAudioNodes {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  analyserNode: AnalyserNode | null;
}

export function useWebAudioPlayer(options: UseWebAudioPlayerOptions = {}): [
  WebAudioPlayerState,
  WebAudioPlayerControls,
  React.RefObject<HTMLAudioElement>,
  WebAudioNodes
] {
  const {
    initialVolume = 80,
    fftSize = 256,
    enableVisualization = true,
    onTimeUpdate,
    onDurationChange,
    onEnded,
    onError,
    onPlay,
    onPause,
    onLoadStart,
    onCanPlay,
    onFrequencyData,
    onWaveformData,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);

  // Initialize Web Audio API
  const initWebAudio = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Create source node from audio element
      const sourceNode = audioContext.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = sourceNode;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = initialVolume / 100;
      gainNodeRef.current = gainNode;

      // Create analyser node for visualization
      if (enableVisualization) {
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = fftSize;
        analyserNode.smoothingTimeConstant = 0.8;
        analyserNodeRef.current = analyserNode;

        // Connect: source -> analyser -> gain -> destination
        sourceNode.connect(analyserNode);
        analyserNode.connect(gainNode);
      } else {
        // Connect: source -> gain -> destination
        sourceNode.connect(gainNode);
      }

      gainNode.connect(audioContext.destination);

      // Track context state
      setAudioContextState(audioContext.state);
      audioContext.onstatechange = () => {
        setAudioContextState(audioContext.state);
      };

    } catch (err) {
      console.error('Failed to initialize Web Audio API:', err);
      setError('Failed to initialize audio system');
    }
  }, [initialVolume, fftSize, enableVisualization]);

  // Initialize audio element and Web Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous'; // Required for Web Audio API

    const audio = audioRef.current;

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

      // Initialize Web Audio on first play (user gesture required)
      if (!audioContextRef.current) {
        initWebAudio();
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

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
    };

    const handlePlaying = () => {
      setIsBuffering(false);
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
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Remove event listeners
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

      // Clean up audio
      audio.pause();
      audio.src = '';

      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initWebAudio]);

  // Update volume through gain node
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    } else if (audioRef.current) {
      // Fallback to HTML5 audio volume
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Visualization loop
  useEffect(() => {
    if (!enableVisualization || !analyserNodeRef.current) return;

    const updateVisualization = () => {
      if (analyserNodeRef.current && isPlaying) {
        const frequencyData = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
        const waveformData = new Uint8Array(analyserNodeRef.current.frequencyBinCount);

        analyserNodeRef.current.getByteFrequencyData(frequencyData);
        analyserNodeRef.current.getByteTimeDomainData(waveformData);

        onFrequencyData?.(frequencyData);
        onWaveformData?.(waveformData);
      }

      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, enableVisualization, onFrequencyData, onWaveformData]);

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

  // Get frequency data for visualization
  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (!analyserNodeRef.current) return null;
    const data = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
    analyserNodeRef.current.getByteFrequencyData(data);
    return data;
  }, []);

  // Get waveform data for visualization
  const getWaveformData = useCallback((): Uint8Array | null => {
    if (!analyserNodeRef.current) return null;
    const data = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
    analyserNodeRef.current.getByteTimeDomainData(data);
    return data;
  }, []);

  // Get average frequency (useful for simple visualizations)
  const getAverageFrequency = useCallback((): number => {
    const data = getFrequencyData();
    if (!data) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }, [getFrequencyData]);

  const state: WebAudioPlayerState = {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    isBuffering,
    error,
    audioContextState,
  };

  const controls: WebAudioPlayerControls = {
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
    getFrequencyData,
    getWaveformData,
    getAverageFrequency,
  };

  const nodes: WebAudioNodes = {
    audioContext: audioContextRef.current,
    sourceNode: sourceNodeRef.current,
    gainNode: gainNodeRef.current,
    analyserNode: analyserNodeRef.current,
  };

  return [state, controls, audioRef, nodes];
}

// Export utility functions
export { formatTime, formatDuration, getProgressPercentage } from './useAudioPlayer';
