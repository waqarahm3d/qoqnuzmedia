'use client';

import { useState } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  image?: string;
  duration: number;
}

interface SongListProps {
  tracks?: Track[];
  showQueue?: boolean;
  title?: string;
  emptyMessage?: string;
  onTrackClick?: (track: Track, index: number) => void;
  showIndex?: boolean;
  showDuration?: boolean;
  showAlbum?: boolean;
  compact?: boolean;
  maxHeight?: string;
}

// SVG Icons
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const MusicNoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const EqualizerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
    <rect x="4" y="4" width="3" height="16" rx="1"/>
    <rect x="10.5" y="8" width="3" height="12" rx="1"/>
    <rect x="17" y="2" width="3" height="18" rx="1"/>
  </svg>
);

// Format duration from milliseconds to mm:ss
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function SongList({
  tracks,
  showQueue = false,
  title,
  emptyMessage = 'No tracks available',
  onTrackClick,
  showIndex = true,
  showDuration = true,
  showAlbum = false,
  compact = false,
  maxHeight = '400px',
}: SongListProps) {
  const { queue, currentTrack, isPlaying, playTrack, setQueue, togglePlayPause } = usePlayer();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use provided tracks or queue
  const displayTracks = tracks || (showQueue ? queue : []);

  const handleTrackClick = (track: Track, index: number) => {
    if (onTrackClick) {
      onTrackClick(track, index);
      return;
    }

    // If clicking on currently playing track, toggle play/pause
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    // If using queue mode, set queue and play from index
    if (showQueue || tracks) {
      const trackList = tracks || queue;
      setQueue(trackList);
      // Find the track in the list and play it
      const trackToPlay = trackList.find(t => t.id === track.id);
      if (trackToPlay) {
        playTrack(trackToPlay);
      }
    } else {
      playTrack(track);
    }
  };

  const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

  if (displayTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/40">
        <MusicNoteIcon />
        <p className="mt-2 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}

      <div
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        <div className="space-y-1">
          {displayTracks.map((track, index) => {
            const isCurrent = isCurrentTrack(track.id);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={`${track.id}-${index}`}
                className={`
                  group flex items-center gap-3 p-2 rounded-lg cursor-pointer
                  transition-colors duration-150
                  ${isCurrent ? 'bg-primary/10' : 'hover:bg-white/5'}
                  ${compact ? 'py-2' : 'py-3'}
                `}
                onClick={() => handleTrackClick(track, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Index / Play indicator */}
                {showIndex && (
                  <div className="w-8 flex-shrink-0 text-center">
                    {isCurrent && isPlaying ? (
                      <span className="text-primary">
                        <EqualizerIcon />
                      </span>
                    ) : isHovered ? (
                      <span className="text-white">
                        {isCurrent && !isPlaying ? <PlayIcon /> : <PlayIcon />}
                      </span>
                    ) : (
                      <span className={`text-sm ${isCurrent ? 'text-primary' : 'text-white/40'}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                )}

                {/* Album art */}
                <div className={`flex-shrink-0 bg-white/10 rounded overflow-hidden ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
                  {track.image ? (
                    <img
                      src={track.image}
                      alt={track.album}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <MusicNoteIcon />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isCurrent ? 'text-primary' : 'text-white'} ${compact ? 'text-sm' : ''}`}>
                    {track.title}
                  </p>
                  <p className={`text-white/60 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                    {track.artist}
                    {showAlbum && track.album && (
                      <span className="text-white/40"> &bull; {track.album}</span>
                    )}
                  </p>
                </div>

                {/* Duration */}
                {showDuration && (
                  <div className={`flex-shrink-0 text-white/40 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {formatDuration(track.duration)}
                  </div>
                )}

                {/* Play/Pause button on hover (alternative to index) */}
                {!showIndex && (
                  <button
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-150
                      ${isCurrent ? 'bg-primary text-black' : 'bg-white/10 text-white opacity-0 group-hover:opacity-100'}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackClick(track, index);
                    }}
                  >
                    {isCurrent && isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export Track type for external use
export type { Track };
