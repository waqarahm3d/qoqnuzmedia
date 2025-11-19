'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon, ClockIcon } from '../icons';
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
  showImage = false,
  trackId,
  artistId,
}: TrackRowProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
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

  const handleLike = () => {
    if (!user) {
      setShowSignupPrompt(true);
      return;
    }
    onLike?.();
  };

  const handleShare = async () => {
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
          // User cancelled or error
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
    setShowMenu(false);
  };

  const handleAddToPlaylist = () => {
    // TODO: Open playlist selection modal
    alert('Add to playlist feature coming soon!');
    setShowMenu(false);
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group ${
          isPlaying ? 'text-primary' : 'text-white/80'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Play Button / Image */}
        <div className="relative w-10 h-10 flex-shrink-0">
          {showImage && image ? (
            <>
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover rounded"
                sizes="40px"
              />
              {isHovered && (
                <button
                  onClick={onPlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded"
                >
                  <PlayIcon size={16} className="text-white" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onPlay}
              className="w-full h-full flex items-center justify-center bg-white/5 rounded hover:bg-white/10 transition-colors"
            >
              <PlayIcon size={16} className={isPlaying ? 'text-primary' : 'text-white'} />
            </button>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          {trackId ? (
            <Link
              href={`/track/${trackId}`}
              className={`font-medium truncate hover:underline block text-sm ${
                isPlaying ? 'text-primary' : 'text-white'
              }`}
            >
              {title}
            </Link>
          ) : (
            <div className={`font-medium truncate text-sm ${isPlaying ? 'text-primary' : 'text-white'}`}>
              {title}
            </div>
          )}
          {artistId ? (
            <Link
              href={`/artist/${artistId}`}
              className="text-xs text-white/60 truncate hover:underline block"
            >
              {artist}
            </Link>
          ) : (
            <div className="text-xs text-white/60 truncate">{artist}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
          >
            {isLiked ? (
              <HeartFilledIcon size={16} className="text-primary" />
            ) : (
              <HeartIcon size={16} />
            )}
          </button>

          {/* More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
            >
              <MoreIcon size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                {user && (
                  <button
                    onClick={handleAddToPlaylist}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add to playlist
                  </button>
                )}
                <button
                  onClick={handleLike}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <HeartIcon size={16} />
                  {isLiked ? 'Remove from Liked' : 'Like'}
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    View track
                  </Link>
                )}
                {artistId && (
                  <Link
                    href={`/artist/${artistId}`}
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Signup Prompt Modal */}
      <SignupPrompt
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        action="like this track"
      />
    </>
  );
};

// Track List Header Component (simplified)
export const TrackListHeader = ({ showAlbum = true }: { showAlbum?: boolean }) => {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 text-xs text-white/60 uppercase tracking-wider">
      <div className="w-10 flex-shrink-0"></div>
      <div className="flex-1">Title</div>
      <div className="w-20"></div>
    </div>
  );
};
