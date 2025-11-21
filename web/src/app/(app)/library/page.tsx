'use client';

import React from 'react';
import Link from 'next/link';
import { Button, AlbumCard, PlaylistCard, TrackCard } from '@/components/ui';
import { useLibraryStore } from '@/lib/stores/libraryStore';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useQueueStore } from '@/lib/stores/queueStore';
import type { Track, Album, Playlist } from '@/lib/types/music';

/**
 * Library Overview Page
 *
 * Main library page showing:
 * - Quick stats (tracks, albums, artists, playlists count)
 * - Recently liked tracks
 * - Recently saved albums
 * - User's playlists
 * - Followed artists preview
 */

export default function LibraryPage() {
  const { likedTracks, savedAlbums, followedArtists } = useLibraryStore();
  const { playlists } = usePlaylistStore();
  const { play } = usePlayerStore();
  const { setQueue } = useQueueStore();

  // Mock user ID - in real app, get from auth
  const currentUserId = 'current-user-id';
  const userPlaylists = playlists.filter((p) => p.owner_id === currentUserId);

  const handlePlayTrack = (track: Track) => {
    const index = likedTracks.findIndex((t) => t.id === track.id);
    setQueue(likedTracks, index);
    play(track);
  };

  const handlePlayAlbum = (album: Album) => {
    // Mock album tracks
    const mockTracks: Track[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${album.id}-track-${i + 1}`,
      title: `${album.title} - Track ${i + 1}`,
      artist: album.artist,
      artist_id: album.artist_id,
      album: album.title,
      album_id: album.id,
      duration: 180 + Math.floor(Math.random() * 120),
      audio_url: '/audio/demo.mp3',
      artwork_url: album.artwork_url,
    }));
    setQueue(mockTracks, 0);
    play(mockTracks[0]);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setQueue(playlist.tracks, 0);
      play(playlist.tracks[0]);
    }
  };

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Your Library</h1>
        <p className="mt-2 text-[var(--qz-text-secondary)]">
          All your music in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/library/tracks"
          className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg transition-all group"
        >
          <HeartIcon className="w-8 h-8 mb-3 text-purple-400" filled />
          <div className="text-2xl font-bold mb-1">{likedTracks.length}</div>
          <div className="text-sm text-[var(--qz-text-secondary)] group-hover:text-[var(--qz-text-primary)]">
            Liked Songs
          </div>
        </Link>

        <Link
          href="/library/albums"
          className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 rounded-lg transition-all group"
        >
          <AlbumIcon className="w-8 h-8 mb-3 text-blue-400" />
          <div className="text-2xl font-bold mb-1">{savedAlbums.length}</div>
          <div className="text-sm text-[var(--qz-text-secondary)] group-hover:text-[var(--qz-text-primary)]">
            Saved Albums
          </div>
        </Link>

        <Link
          href="/library/artists"
          className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-lg transition-all group"
        >
          <UserIcon className="w-8 h-8 mb-3 text-green-400" />
          <div className="text-2xl font-bold mb-1">{followedArtists.length}</div>
          <div className="text-sm text-[var(--qz-text-secondary)] group-hover:text-[var(--qz-text-primary)]">
            Following
          </div>
        </Link>

        <Link
          href="/library/playlists"
          className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 rounded-lg transition-all group"
        >
          <PlaylistIcon className="w-8 h-8 mb-3 text-orange-400" />
          <div className="text-2xl font-bold mb-1">{userPlaylists.length}</div>
          <div className="text-sm text-[var(--qz-text-secondary)] group-hover:text-[var(--qz-text-primary)]">
            Playlists
          </div>
        </Link>
      </div>

      {/* Recently Liked Tracks */}
      {likedTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recently Liked</h2>
            <Link
              href="/library/tracks"
              className="text-sm font-semibold text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="space-y-1">
            {likedTracks.slice(0, 5).map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={handlePlayTrack}
                showArtwork
                showAlbum
              />
            ))}
          </div>
        </section>
      )}

      {/* Saved Albums */}
      {savedAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Saved Albums</h2>
            <Link
              href="/library/albums"
              className="text-sm font-semibold text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {savedAlbums.slice(0, 6).map((album) => (
              <AlbumCard key={album.id} album={album} onPlay={handlePlayAlbum} />
            ))}
          </div>
        </section>
      )}

      {/* Your Playlists */}
      {userPlaylists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Playlists</h2>
            <Link
              href="/library/playlists"
              className="text-sm font-semibold text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {userPlaylists.slice(0, 6).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} onPlay={handlePlayPlaylist} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {likedTracks.length === 0 &&
        savedAlbums.length === 0 &&
        followedArtists.length === 0 &&
        userPlaylists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
              <LibraryIcon className="w-12 h-12 text-[var(--qz-text-tertiary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--qz-text-primary)] mb-2">
              Your library is empty
            </h3>
            <p className="text-[var(--qz-text-secondary)] mb-6 max-w-md">
              Start building your music collection by liking songs, saving albums, and creating playlists
            </p>
            <Button onClick={() => (window.location.href = '/search')} size="lg">
              Explore Music
            </Button>
          </div>
        )}
    </div>
  );
}

// Icons

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function AlbumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
      <circle cx="6" cy="6" r="1" />
      <circle cx="6" cy="12" r="1" />
      <circle cx="6" cy="18" r="1" />
    </svg>
  );
}
