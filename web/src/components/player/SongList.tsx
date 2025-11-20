'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import * as api from '@/lib/api/client';
import { useDownloadManager } from '@/lib/offline';

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

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="12" cy="19" r="2"/>
  </svg>
);

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#ff4a14' : 'none'} stroke={filled ? '#ff4a14' : 'currentColor'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const PlaylistAddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 12H3"/>
    <path d="M16 6H3"/>
    <path d="M12 18H3"/>
    <path d="M21 12v6"/>
    <path d="M18 15h6"/>
  </svg>
);

const AlbumIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
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
  showDuration = false,
  showAlbum = false,
  compact = false,
  maxHeight = '400px',
}: SongListProps) {
  const router = useRouter();
  const { queue, currentTrack, isPlaying, playTrack, setQueue, togglePlayPause } = usePlayer();
  const { addToQueue: addToDownloadQueue } = useDownloadManager();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuIndex(null);
      }
    };

    if (openMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex]);

  // Check liked status for all tracks
  useEffect(() => {
    const checkLikedStatus = async () => {
      const displayTracks = tracks || (showQueue ? queue : []);
      const likedSet = new Set<string>();

      for (const track of displayTracks) {
        try {
          const isLiked = await api.isTrackLiked(track.id);
          if (isLiked) {
            likedSet.add(track.id);
          }
        } catch {
          // Ignore errors
        }
      }

      setLikedTracks(likedSet);
    };

    checkLikedStatus();
  }, [tracks, queue, showQueue]);

  const handleLike = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (likedTracks.has(track.id)) {
        await api.unlikeTrack(track.id);
        setLikedTracks(prev => {
          const newSet = new Set(prev);
          newSet.delete(track.id);
          return newSet;
        });
      } else {
        await api.likeTrack(track.id);
        setLikedTracks(prev => new Set(prev).add(track.id));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
    setOpenMenuIndex(null);
  };

  const handleShare = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/track/${track.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Listen to ${track.title} by ${track.artist}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
    setOpenMenuIndex(null);
  };

  const handleAddToPlaylist = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open playlist selection modal
    alert('Add to playlist coming soon!');
    setOpenMenuIndex(null);
  };

  const handleViewAlbum = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.albumId) {
      router.push(`/album/${track.albumId}`);
    }
    setOpenMenuIndex(null);
  };

  const handleDownload = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToDownloadQueue({
        id: track.id,
        title: track.title,
        artistName: track.artist,
        coverArtUrl: track.image,
      });
    } catch (error) {
      console.error('Error adding to download queue:', error);
    }
    setOpenMenuIndex(null);
  };

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

                {/* More options menu */}
                <div className="relative flex-shrink-0">
                  <button
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      text-white/40 hover:text-white hover:bg-white/10
                      transition-all duration-150
                      ${openMenuIndex === index ? 'text-white bg-white/10' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === index ? null : index);
                    }}
                  >
                    <MoreIcon />
                  </button>

                  {/* Dropdown menu */}
                  {openMenuIndex === index && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <button
                        onClick={(e) => handleLike(track, e)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <HeartIcon filled={likedTracks.has(track.id)} />
                        <span className="text-sm">
                          {likedTracks.has(track.id) ? 'Unlike' : 'Like'}
                        </span>
                      </button>

                      <button
                        onClick={(e) => handleShare(track, e)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <ShareIcon />
                        <span className="text-sm">Share</span>
                      </button>

                      <button
                        onClick={(e) => handleAddToPlaylist(track, e)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <PlaylistAddIcon />
                        <span className="text-sm">Add to playlist</span>
                      </button>

                      <button
                        onClick={(e) => handleDownload(track, e)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <DownloadIcon />
                        <span className="text-sm">Download for Offline</span>
                      </button>

                      {track.albumId && (
                        <button
                          onClick={(e) => handleViewAlbum(track, e)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <AlbumIcon />
                          <span className="text-sm">View album</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

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
