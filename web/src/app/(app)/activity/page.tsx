'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { ActivityFeed } from '@/components/features/activity/ActivityFeed';
import { useActivityStore } from '@/lib/stores/activityStore';

/**
 * Activity Page
 *
 * Main activity feed page showing:
 * - Friend activity
 * - Filter options
 * - Mark all as read
 * - Activity statistics
 */

export default function ActivityPage() {
  const { unreadCount, markAllAsRead } = useActivityStore();

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Activity</h1>
          <p className="mt-2 text-[var(--qz-text-secondary)]">
            See what your friends are listening to
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[var(--qz-primary)] text-white text-xs font-semibold rounded-full">
                {unreadCount} new
              </span>
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="md" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeed showFilter />
    </div>
  );
}
