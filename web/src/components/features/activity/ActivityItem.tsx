'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { Activity } from '@/lib/types/music';

/**
 * ActivityItem Component
 *
 * Individual activity item with:
 * - User avatar and name
 * - Activity description
 * - Entity link (track, album, playlist, etc.)
 * - Timestamp
 * - Unread indicator
 *
 * @example
 * ```tsx
 * <ActivityItem activity={activity} />
 * ```
 */

export interface ActivityItemProps {
  /** Activity data */
  activity: Activity;
  /** Callback when clicked */
  onClick?: () => void;
}

export function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'follow':
        return 'started following you';
      case 'playlist_create':
        return 'created a playlist';
      case 'playlist_update':
        return 'updated a playlist';
      case 'track_add':
        return 'added a track to';
      case 'track_like':
        return 'liked';
      case 'album_save':
        return 'saved an album';
      case 'artist_follow':
        return 'started following';
      case 'comment':
        return 'commented on';
      case 'playlist_like':
        return 'liked your playlist';
      default:
        return 'did something';
    }
  };

  const getEntityLink = () => {
    if (!activity.entity_type || !activity.entity_id) return null;

    const routes: Record<string, string> = {
      track: `/track/${activity.entity_id}`,
      album: `/album/${activity.entity_id}`,
      playlist: `/playlist/${activity.entity_id}`,
      user: `/user/${activity.entity_id}`,
      artist: `/artist/${activity.entity_id}`,
    };

    return routes[activity.entity_type];
  };

  const entityLink = getEntityLink();

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors cursor-pointer',
        'hover:bg-[var(--qz-bg-surface-hover)]',
        !activity.is_read && 'bg-[var(--qz-bg-surface)]'
      )}
    >
      {/* Unread Indicator */}
      {!activity.is_read && (
        <div className="flex-shrink-0 w-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-[var(--qz-primary)]" />
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--qz-bg-base)]">
          {activity.actor_avatar ? (
            <img
              src={activity.actor_avatar}
              alt={activity.actor_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-[var(--qz-text-tertiary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--qz-text-primary)]">
          <span className="font-semibold">{activity.actor_name}</span>{' '}
          <span className="text-[var(--qz-text-secondary)]">{getActivityText()}</span>
          {activity.entity_name && (
            <>
              {' '}
              <span className="font-semibold">{activity.entity_name}</span>
            </>
          )}
        </p>

        <p className="text-xs text-[var(--qz-text-tertiary)] mt-0.5">
          {formatTimestamp(activity.created_at)}
        </p>
      </div>

      {/* Entity Image (if available) */}
      {activity.entity_image && (
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded overflow-hidden bg-[var(--qz-bg-base)]">
            <img
              src={activity.entity_image}
              alt={activity.entity_name || ''}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (entityLink) {
    return (
      <Link href={entityLink} className="block">
        {content}
      </Link>
    );
  }

  return content;
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
