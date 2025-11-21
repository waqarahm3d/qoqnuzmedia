'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, TrackCard } from '@/components/ui';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { PlaylistTrack } from '@/lib/types/music';

/**
 * Playlist Detail Page
 *
 * Individual playlist page with:
 * - Playlist header (cover, name, description, stats)
 * - Play all button
 * - Track list with drag-drop reordering
 * - Add tracks functionality
 * - Edit/delete playlist options
 * - Collaborator management
 */

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params?.id as string;

  const { playlists, getPlaylistById, setCurrentPlaylist, removeTrackFromPlaylist } =
    usePlaylistStore();
  const { currentTrack, play: playTrack, isPlaying } = usePlayerStore();
  const { setQueue } = useQueueStore();
  const { showToast } = useUIStore();

  const [playlist, setPlaylist] = useState(getPlaylistById(playlistId));

  useEffect(() => {
    const found = getPlaylistById(playlistId);
    if (found) {
      setPlaylist(found);
      setCurrentPlaylist(found);
    }
  }, [playlistId, playlists, getPlaylistById, setCurrentPlaylist]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-[var(--qz-text-primary)] mb-2">
          Playlist Not Found
        </h2>
        <p className="text-[var(--qz-text-secondary)] mb-6">
          The playlist you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/library/playlists')}>Back to Playlists</Button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setQueue(playlist.tracks, 0);
      playTrack(playlist.tracks[0]);
    }
  };

  const handlePlayTrack = (track: PlaylistTrack) => {
    if (playlist.tracks) {
      const index = playlist.tracks.findIndex((t) => t.id === track.id);
      setQueue(playlist.tracks, index);
      playTrack(track);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrackFromPlaylist(playlist.id, trackId);
    showToast('Track removed from playlist', 'success');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const isCurrentPlaylist = playlist.tracks?.some((track) => track.id === currentTrack?.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-[var(--qz-primary)]/20 to-transparent">
        <div className="px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Cover Image */}
            <div className="w-full md:w-60 md:h-60 aspect-square rounded-lg overflow-hidden bg-[var(--qz-bg-surface)] shadow-2xl flex-shrink-0">
              {playlist.cover_url ? (
                <Image
                  src={playlist.cover_url}
                  alt={`${playlist.name} cover`}
                  width={240}
                  height={240}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlaylistIcon className="w-24 h-24 text-[var(--qz-text-tertiary)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--qz-text-primary)] mb-2">
                {playlist.is_public ? 'Public' : 'Private'} Playlist
                {playlist.is_collaborative && ' • Collaborative'}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[var(--qz-text-primary)] mb-4 break-words">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-[var(--qz-text-secondary)] mb-4 max-w-2xl">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-[var(--qz-text-primary)]">
                <span className="font-semibold">{playlist.owner_name || 'Unknown'}</span>
                <span>•</span>
                <span>{playlist.tracks_count || 0} songs</span>
                {playlist.duration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(playlist.duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-6 flex items-center gap-4">
        <Button
          size="xl"
          onClick={handlePlayAll}
          disabled={!playlist.tracks || playlist.tracks.length === 0}
          className="rounded-full w-14 h-14 p-0"
        >
          {isCurrentPlaylist && isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6 ml-1" />
          )}
        </Button>

        <Button variant="ghost" size="lg" className="rounded-full">
          <HeartIcon className="w-6 h-6" />
        </Button>

        <Button variant="ghost" size="lg" className="rounded-full">
          <ShareIcon className="w-5 h-5" />
        </Button>

        <div className="ml-auto">
          <Button variant="ghost" size="lg" className="rounded-full">
            <MoreIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-6 pb-24">
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="space-y-1">
            {playlist.tracks.map((track, index) => (
              <div key={track.id} className="group relative">
                <TrackCard
                  track={track}
                  index={index + 1}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={handlePlayTrack}
                  showArtwork
                  showAlbum
                />

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveTrack(track.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-[var(--qz-overlay-light)] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove from playlist"
                >
                  <XIcon className="w-4 h-4 text-[var(--qz-text-secondary)]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
              <MusicIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
              No tracks in this playlist
            </h3>
            <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
              Add some tracks to get started
            </p>
            <Button size="lg">Find Music</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Icons

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
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

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
