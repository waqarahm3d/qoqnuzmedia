'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PlaylistCard } from '@/components/ui';
import { FollowButton } from '@/components/features/social/FollowButton';
import { ShareMenu } from '@/components/features/social/ShareMenu';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { useSocialStore } from '@/lib/stores/socialStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import type { User, Playlist } from '@/lib/types/music';

/**
 * User Profile Page
 *
 * Public profile page showing:
 * - User info (avatar, name, bio, stats)
 * - Follow button
 * - Public playlists
 * - Followers/following counts
 * - Recent activity (future)
 */

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [activeTab, setActiveTab] = useState<'playlists' | 'followers' | 'following'>('playlists');

  const { playlists } = usePlaylistStore();
  const { following, followers } = useSocialStore();
  const { play } = usePlayerStore();
  const { setQueue } = useQueueStore();

  // Mock user data - in real app, fetch from API
  const user: User = {
    id: userId,
    email: 'user@example.com',
    display_name: 'Music Lover',
    avatar_url: `https://picsum.photos/seed/${userId}/300/300`,
    bio: 'Just a music enthusiast sharing great tunes 🎵',
    followers_count: 1234,
    following_count: 567,
  };

  // Get user's public playlists
  const userPlaylists = playlists.filter(
    (playlist) => playlist.owner_id === userId && playlist.is_public
  );

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setQueue(playlist.tracks, 0);
      play(playlist.tracks[0]);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-[var(--qz-primary)]/20 to-transparent">
        <div className="px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar */}
            <div className="w-40 h-40 md:w-60 md:h-60 rounded-full overflow-hidden bg-[var(--qz-bg-surface)] shadow-2xl flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-24 h-24 text-[var(--qz-text-tertiary)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--qz-text-primary)] mb-2">
                Profile
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[var(--qz-text-primary)] mb-4">
                {user.display_name || user.email}
              </h1>
              {user.bio && (
                <p className="text-[var(--qz-text-secondary)] mb-4 max-w-2xl">{user.bio}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="font-bold text-[var(--qz-text-primary)]">
                    {userPlaylists.length}
                  </span>
                  <span className="text-[var(--qz-text-secondary)] ml-1">
                    Public Playlists
                  </span>
                </div>
                <div>
                  <span className="font-bold text-[var(--qz-text-primary)]">
                    {user.followers_count?.toLocaleString() || 0}
                  </span>
                  <span className="text-[var(--qz-text-secondary)] ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-[var(--qz-text-primary)]">
                    {user.following_count?.toLocaleString() || 0}
                  </span>
                  <span className="text-[var(--qz-text-secondary)] ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-6 flex items-center gap-4">
        <FollowButton user={user} size="lg" showIcon />

        <ShareMenu
          entityType="artist"
          entityId={user.id}
          entityName={user.display_name || user.email}
          className="p-2.5 rounded-full border border-[var(--qz-border-default)] hover:border-[var(--qz-border-strong)] transition-colors"
          trigger={<ShareIcon className="w-5 h-5" />}
        />

        <button className="p-2.5 rounded-full border border-[var(--qz-border-default)] hover:border-[var(--qz-border-strong)] transition-colors">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--qz-border-subtle)]">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'playlists'
                ? 'border-[var(--qz-primary)] text-[var(--qz-text-primary)]'
                : 'border-transparent text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'followers'
                ? 'border-[var(--qz-primary)] text-[var(--qz-text-primary)]'
                : 'border-transparent text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'following'
                ? 'border-[var(--qz-primary)] text-[var(--qz-text-primary)]'
                : 'border-transparent text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'playlists' && (
          <>
            {userPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {userPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onPlay={handlePlayPlaylist}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
                  <PlaylistIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
                  No public playlists
                </h3>
                <p className="text-[var(--qz-text-secondary)]">
                  This user hasn't created any public playlists yet
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'followers' && (
          <div className="text-center py-20 text-[var(--qz-text-secondary)]">
            Followers list (coming soon)
          </div>
        )}

        {activeTab === 'following' && (
          <div className="text-center py-20 text-[var(--qz-text-secondary)]">
            Following list (coming soon)
          </div>
        )}
      </div>
    </div>
  );
}

// Icons

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
