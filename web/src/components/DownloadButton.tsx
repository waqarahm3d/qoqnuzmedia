'use client';

import { useState } from 'react';
import { useIsDownloaded, useDownloadManager } from '@/lib/offline';
import { useAuth } from '@/lib/auth/AuthContext';
import { SignupPrompt } from './ui/SignupPrompt';

interface DownloadButtonProps {
  track: {
    id: string;
    title: string;
    artists?: { name: string } | null;
    cover_art_url?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const DownloadIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const LoadingIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

export default function DownloadButton({
  track,
  size = 'md',
  showLabel = false,
  className = '',
}: DownloadButtonProps) {
  const { user } = useAuth();
  const isDownloaded = useIsDownloaded(track.id);
  const { addToQueue } = useDownloadManager();
  const [isAdding, setIsAdding] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check authentication first
    if (!user) {
      setShowSignupPrompt(true);
      return;
    }

    if (isDownloaded || isAdding) return;

    setIsAdding(true);
    try {
      await addToQueue({
        id: track.id,
        title: track.title,
        artistName: track.artists?.name || 'Unknown Artist',
        coverArtUrl: track.cover_art_url,
      });
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const padding = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';

  if (isDownloaded) {
    return (
      <button
        className={`${padding} rounded-full text-green-400 ${className}`}
        title="Downloaded"
        disabled
      >
        <CheckIcon size={iconSize} />
        {showLabel && <span className="ml-1.5 text-sm">Downloaded</span>}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${padding} rounded-full bg-white/10 hover:bg-white/20 transition-colors ${
          isAdding ? 'opacity-50' : ''
        } ${className}`}
        title={isAdding ? 'Adding to queue...' : 'Download for offline'}
        disabled={isAdding}
      >
        {isAdding ? (
          <LoadingIcon size={iconSize} />
        ) : (
          <DownloadIcon size={iconSize} />
        )}
        {showLabel && (
          <span className="ml-1.5 text-sm">
            {isAdding ? 'Adding...' : 'Download'}
          </span>
        )}
      </button>

      <SignupPrompt
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        action="download this track for offline listening"
      />
    </>
  );
}
