'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon } from '../icons';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { SignupPrompt } from './SignupPrompt';

interface TrackRowProps {
  number?: number;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  image?: string;
  isPlaying?: boolean;
  isLiked?: boolean;
  onPlay?: () => void;
  onLike?: () => void;
  showImage?: boolean;
  showAlbum?: boolean;
  trackId?: string;
  artistId?: string;
  albumId?: string;
}

export const TrackRow = ({
  title,
  artist,
  image,
  isPlaying = false,
  isLiked = false,
  onPlay,
  onLike,
  showImage = true,
  trackId,
  artistId,
}: TrackRowProps) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowSignupPrompt(true);
      return;
    }
    onLike?.();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackId) {
      const url = `${window.location.origin}/track/${trackId}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `Listen to ${title} by ${artist}`,
            url: url,
          });
        } catch (err) {
          // User cancelled
        }
      } else {
        navigator.clipboard.writeText(url);
        alert('Link copied!');
      }
    }
    setShowMenu(false);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Add to playlist coming soon!');
    setShowMenu(false);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.();
  };

  return (
    <>
      <div
        onClick={onPlay}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group ${
          isPlaying ? 'bg-white/5' : ''
        }`}
      >
        {/* Album Art with Play Overlay */}
        {showImage && (
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-white/5">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
            {/* Play overlay or Sound wave for playing track */}
            {isPlaying ? (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                {/* Animated sound wave bars */}
                <div className="flex items-end gap-[3px] h-4">
                  <span className="w-[3px] bg-primary animate-soundwave-1 rounded-full"></span>
                  <span className="w-[3px] bg-primary animate-soundwave-2 rounded-full"></span>
                  <span className="w-[3px] bg-primary animate-soundwave-3 rounded-full"></span>
                  <span className="w-[3px] bg-primary animate-soundwave-4 rounded-full"></span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <PlayIcon size={20} className="text-white" />
              </div>
            )}
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate text-sm ${isPlaying ? 'text-primary' : 'text-white'}`}>
            {title}
          </div>
          <div className="text-xs text-white/60 truncate">{artist}</div>
        </div>

        {/* Actions - stop propagation to prevent playing */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Like */}
          <button
            onClick={handleLike}
            className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          >
            {isLiked ? (
              <HeartFilledIcon size={16} className="text-primary" />
            ) : (
              <HeartIcon size={16} className="text-white/60 hover:text-white" />
            )}
          </button>

          {/* More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            >
              <MoreIcon size={16} className="text-white/60 hover:text-white" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 rounded-lg shadow-xl z-50 py-1">
                {user && (
                  <button
                    onClick={handleAddToPlaylist}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add to playlist
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
                {trackId && (
                  <Link
                    href={`/track/${trackId}`}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    View details
                  </Link>
                )}
                {artistId && (
                  <Link
                    href={`/artist/${artistId}`}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    View artist
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SignupPrompt
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        action="like this track"
      />
    </>
  );
};

// Simplified header
export const TrackListHeader = () => {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 text-xs text-white/40 uppercase tracking-wider">
      <div className="w-12 flex-shrink-0"></div>
      <div className="flex-1">Title</div>
      <div className="w-20"></div>
    </div>
  );
};
