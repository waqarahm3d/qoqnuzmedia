'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useLibraryStore } from '@/lib/stores/libraryStore';
import type { Artist } from '@/lib/types/music';

/**
 * Library Followed Artists Page
 *
 * Displays user's followed artists with:
 * - Grid layout of artist cards
 * - Sort options (recently followed, name, followers)
 * - Total count
 * - Empty state
 */

type SortType = 'recent' | 'name' | 'followers';

export default function LibraryArtistsPage() {
  const [sort, setSort] = useState<SortType>('recent');

  const { followedArtists } = useLibraryStore();

  // Sort artists
  const sortedArtists = [...followedArtists].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'followers':
        return (b.followers || 0) - (a.followers || 0);
      default:
        // Recent - no timestamp in mock data, so just preserve order
        return 0;
    }
  });

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Following</h1>
          <p className="mt-2 text-[var(--qz-text-secondary)]">
            {sortedArtists.length} {sortedArtists.length === 1 ? 'artist' : 'artists'}
          </p>
        </div>

        {/* Sort Dropdown */}
        {sortedArtists.length > 0 && (
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-full text-[var(--qz-text-primary)] font-medium outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] transition-colors cursor-pointer"
            >
              <option value="recent">Recently Followed</option>
              <option value="name">Name</option>
              <option value="followers">Most Followers</option>
            </select>
          </div>
        )}
      </div>

      {/* Artists Grid */}
      {sortedArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
            <UserIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
            No followed artists yet
          </h3>
          <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
            Artists you follow will appear here
          </p>
          <Button onClick={() => (window.location.href = '/search')} size="lg">
            Find Artists
          </Button>
        </div>
      )}
    </div>
  );
}

// Artist Card Component
function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group p-4 bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] rounded-lg transition-colors"
    >
      {/* Avatar */}
      <div className="aspect-square rounded-full overflow-hidden bg-[var(--qz-bg-base)] mb-4">
        {artist.avatar_url ? (
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon className="w-16 h-16 text-[var(--qz-text-tertiary)]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-semibold text-[var(--qz-text-primary)] truncate mb-1 group-hover:underline">
          {artist.name}
        </h3>
        <p className="text-sm text-[var(--qz-text-secondary)]">
          Artist
          {artist.verified && (
            <span className="ml-1 inline-flex items-center">
              <VerifiedIcon className="w-4 h-4 text-[var(--qz-primary)]" />
            </span>
          )}
        </p>
        {artist.followers !== undefined && (
          <p className="text-xs text-[var(--qz-text-tertiary)] mt-1">
            {formatFollowers(artist.followers)} followers
          </p>
        )}
      </div>
    </Link>
  );
}

// Utility
function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
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

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
