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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
    onClose();
  };

  const handleViewTrack = () => {
    router.push(`/track/${trackId}`);
    onClose();
  };

  const handleViewAlbum = () => {
    if (albumId) {
      router.push(`/album/${albumId}`);
      onClose();
    }
  };

  const handleViewArtist = () => {
    if (artistId) {
      router.push(`/artist/${artistId}`);
      onClose();
    }
  };

  const handleLike = () => {
    toggleLike();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
      <div
        ref={menuRef}
        className="bg-surface rounded-t-2xl sm:rounded-2xl w-full sm:w-96 max-w-md shadow-2xl border border-white/10 animate-slide-up sm:animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="font-semibold text-sm">Track Options</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Menu items */}
        <div className="py-2">
          <button
            onClick={handleLike}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            {isLiked ? (
              <HeartFilledIcon size={20} className="text-primary" />
            ) : (
              <HeartIcon size={20} />
            )}
            <span className="text-sm font-medium">
              {isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <ShareIcon size={20} />
            <span className="text-sm font-medium">Share</span>
          </button>

          <div className="border-t border-white/10 my-2" />

          <button
            onClick={handleViewTrack}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <MusicIcon size={20} />
            <span className="text-sm font-medium">View Track</span>
          </button>

          {albumId && (
            <button
              onClick={handleViewAlbum}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <AlbumIcon size={20} />
              <span className="text-sm font-medium">View Album</span>
            </button>
          )}

          {artistId && (
            <button
              onClick={handleViewArtist}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <ExternalLinkIcon size={20} />
              <span className="text-sm font-medium">View Artist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
