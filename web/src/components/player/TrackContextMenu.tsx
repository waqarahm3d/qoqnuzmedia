'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import {
  HeartIcon,
  HeartFilledIcon,
  ShareIcon,
  ExternalLinkIcon,
  AlbumIcon,
  MusicIcon,
  PlaylistIcon,
  CloseIcon,
} from '../icons';

interface TrackContextMenuProps {
  trackId: string;
  trackTitle: string;
  artistId?: string;
  albumId?: string;
  onClose: () => void;
}

export const TrackContextMenu = ({
  trackId,
  trackTitle,
  artistId,
  albumId,
  onClose,
}: TrackContextMenuProps) => {
  const router = useRouter();
  const { isLiked, toggleLike } = usePlayer();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    // Small delay to trigger CSS transition
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Handle closing with animation
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/track/${trackId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: trackTitle,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
    handleClose();
  };

  const handleViewTrack = () => {
    router.push(`/track/${trackId}`);
    handleClose();
  };

  const handleViewAlbum = () => {
    if (albumId) {
      router.push(`/album/${albumId}`);
      handleClose();
    }
  };

  const handleViewArtist = () => {
    if (artistId) {
      router.push(`/artist/${artistId}`);
      handleClose();
    }
  };

  const handleLike = () => {
    toggleLike();
    handleClose();
  };

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex items-end sm:items-center justify-center
        transition-all duration-200 ease-out
        ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}
      `}
      onClick={handleClose}
    >
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-gradient-to-b from-gray-800 to-gray-900
          rounded-t-3xl sm:rounded-2xl w-full sm:w-[420px] max-w-md
          shadow-2xl border border-white/10
          transition-all duration-200 ease-out
          ${isVisible
            ? 'translate-y-0 sm:translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-4 opacity-0 sm:scale-95'
          }
        `}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="font-semibold text-base text-white">Track Options</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{trackTitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all duration-150 active:scale-95"
            aria-label="Close menu"
          >
            <CloseIcon size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Menu items */}
        <div className="py-2 px-2">
          <button
            onClick={handleLike}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              {isLiked ? (
                <HeartFilledIcon size={20} className="text-primary" />
              ) : (
                <HeartIcon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </div>
            <span className="text-sm font-medium text-white">
              {isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <ShareIcon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-medium text-white">Share</span>
          </button>

          <div className="border-t border-white/5 my-2 mx-4" />

          <button
            onClick={handleViewTrack}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <MusicIcon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-medium text-white">View Track</span>
          </button>

          {albumId && (
            <button
              onClick={handleViewAlbum}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <AlbumIcon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-medium text-white">View Album</span>
            </button>
          )}

          {artistId && (
            <button
              onClick={handleViewArtist}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <ExternalLinkIcon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-medium text-white">View Artist</span>
            </button>
          )}
        </div>

        {/* Safe area for mobile */}
        <div className="h-6 sm:h-2" />
      </div>
    </div>
  );
};
