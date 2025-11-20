'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';
import { useIsDownloaded, useDownloadManager } from '@/lib/offline';

interface TrackContextMenuProps {
  trackId: string;
  trackTitle: string;
  trackArtist?: string;
  trackImage?: string;
  trackDuration?: number;
  artistId?: string;
  albumId?: string;
  albumTitle?: string;
  onClose: () => void;
}

export const TrackContextMenu = ({
  trackId,
  trackTitle,
  trackArtist,
  trackImage,
  trackDuration,
  artistId,
  albumId,
  albumTitle,
  onClose,
}: TrackContextMenuProps) => {
  const router = useRouter();
  const { addToQueue } = usePlayer();
  const isDownloaded = useIsDownloaded(trackId);
  const { addToQueue: addToDownloadQueue } = useDownloadManager();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
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
    }, 200);
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
          text: `Listen to ${trackTitle}${trackArtist ? ` by ${trackArtist}` : ''} on Qoqnuz`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
    handleClose();
  };

  const handleAddToPlaylist = () => {
    router.push(`/playlists?addTrack=${trackId}`);
    handleClose();
  };

  const handleAddToQueue = () => {
    addToQueue({
      id: trackId,
      title: trackTitle,
      artist: trackArtist || 'Unknown Artist',
      artistId: artistId,
      album: albumTitle || 'Single',
      albumId: albumId,
      image: trackImage,
      duration: trackDuration || 0,
    });
    handleClose();
  };

  const handleGoToQueue = () => {
    // Navigate to a queue view or open queue panel
    // For now, we can use the player's queue view
    router.push('/queue');
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

  const handleDownload = async () => {
    if (!isDownloaded) {
      await addToDownloadQueue({
        id: trackId,
        title: trackTitle,
        artistName: trackArtist || 'Unknown Artist',
        coverArtUrl: trackImage,
      });
    }
    handleClose();
  };

  const handleEmbed = () => {
    setShowEmbedModal(true);
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/track/${trackId}" width="100%" height="152" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
    setShowEmbedModal(false);
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
      {showEmbedModal ? (
        /* Embed Modal */
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`
            bg-gradient-to-b from-gray-800 to-gray-900
            rounded-t-3xl sm:rounded-2xl w-full sm:w-[420px] max-w-md
            shadow-2xl border border-white/10
            transition-all duration-200 ease-out
            ${isVisible
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-full opacity-0 sm:scale-95'
            }
          `}
        >
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-base text-white">Embed Track</h3>
            <button
              onClick={() => setShowEmbedModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all duration-150 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm text-gray-400 mb-3">Copy this code to embed the track on your website:</p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
              {`<iframe src="${window.location.origin}/embed/track/${trackId}" width="100%" height="152" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`}
            </div>
            <button
              onClick={copyEmbedCode}
              className="mt-4 w-full py-3 bg-primary text-black rounded-xl font-semibold hover:bg-[#ff5c2e] transition-colors"
            >
              Copy Embed Code
            </button>
          </div>

          <div className="h-6 sm:h-2" />
        </div>
      ) : (
        /* Main Menu */
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
              <h3 className="font-semibold text-base text-white truncate max-w-[280px]">{trackTitle}</h3>
              {trackArtist && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{trackArtist}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all duration-150 active:scale-95"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div className="py-2 px-2">
            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Share</span>
            </button>

            {/* Add to Playlist */}
            <button
              onClick={handleAddToPlaylist}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Add to Playlist</span>
            </button>

            {/* Add to Queue */}
            <button
              onClick={handleAddToQueue}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                  <path d="M21 15V6" />
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 12H3" />
                  <path d="M16 6H3" />
                  <path d="M12 18H3" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Add to Queue</span>
            </button>

            {/* Download for Offline */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
              disabled={isDownloaded}
            >
              <div className={`w-10 h-10 rounded-full ${isDownloaded ? 'bg-green-500/20' : 'bg-white/5 group-hover:bg-white/10'} flex items-center justify-center transition-colors`}>
                {isDownloaded ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium ${isDownloaded ? 'text-green-400' : 'text-white'}`}>
                {isDownloaded ? 'Downloaded' : 'Download for Offline'}
              </span>
            </button>

            {/* Go to Queue */}
            <button
              onClick={handleGoToQueue}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Go to Queue</span>
            </button>

            <div className="border-t border-white/5 my-2 mx-4" />

            {/* Go to Album */}
            {albumId && (
              <button
                onClick={handleViewAlbum}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white">Go to Album</span>
              </button>
            )}

            {/* Go to Artist */}
            {artistId && (
              <button
                onClick={handleViewArtist}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white">Go to Artist</span>
              </button>
            )}

            {/* Embed */}
            <button
              onClick={handleEmbed}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Embed</span>
            </button>
          </div>

          {/* Safe area for mobile */}
          <div className="h-6 sm:h-2" />
        </div>
      )}
    </div>
  );
};
