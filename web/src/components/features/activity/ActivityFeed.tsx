'use client';

import React, { useState } from 'react';
import { ActivityItem } from './ActivityItem';
import { useActivityStore } from '@/lib/stores/activityStore';
import type { ActivityType } from '@/lib/types/music';

/**
 * ActivityFeed Component
 *
 * Activity feed with:
 * - List of activities
 * - Filter by activity type
 * - Mark as read
 * - Empty state
 * - Infinite scroll (future)
 *
 * @example
 * ```tsx
 * <ActivityFeed />
 * ```
 */

export interface ActivityFeedProps {
  /** Show filter tabs */
  showFilter?: boolean;
  /** Limit number of activities shown */
  limit?: number;
}

export function ActivityFeed({ showFilter = true, limit }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');

  const { activities, filterByType, markAsRead } = useActivityStore();

  const filteredActivities = filterByType(activeFilter);
  const displayActivities = limit ? filteredActivities.slice(0, limit) : filteredActivities;

  const handleActivityClick = (activityId: string) => {
    markAsRead(activityId);
  };

  const filters: Array<{ value: ActivityType | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'follow', label: 'Follows' },
    { value: 'playlist_create', label: 'Playlists' },
    { value: 'track_like', label: 'Likes' },
    { value: 'comment', label: 'Comments' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      {showFilter && activities.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.value
                  ? 'bg-[var(--qz-primary)] text-white'
                  : 'bg-[var(--qz-bg-surface)] text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-bg-surface-hover)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Activities List */}
      {displayActivities.length > 0 ? (
        <div className="space-y-1">
          {displayActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onClick={() => handleActivityClick(activity.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
            <ActivityIcon className="w-8 h-8 text-[var(--qz-text-tertiary)]" />
          </div>
          <h4 className="text-lg font-semibold text-[var(--qz-text-primary)] mb-1">
            {activeFilter === 'all' ? 'No activity yet' : `No ${activeFilter} activity`}
          </h4>
          <p className="text-sm text-[var(--qz-text-secondary)]">
            {activeFilter === 'all'
              ? 'Follow some friends to see their activity here'
              : 'Activity will appear here when it happens'}
          </p>
        </div>
      )}

      {/* Show More (if limited) */}
      {limit && filteredActivities.length > limit && (
        <div className="text-center pt-2">
          <button className="text-sm font-semibold text-[var(--qz-primary)] hover:underline">
            Show all {filteredActivities.length} activities
          </button>
        </div>
      )}
    </div>
  );
}

// Icons

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
