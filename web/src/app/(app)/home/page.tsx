'use client';

import React from 'react';
import { AlbumCard, TrackCard } from '@/components/ui';
import { Album, Track } from '@/lib/types/music';
import { usePlayerStore, useQueueStore } from '@/lib/stores';

/**
 * Home Page
 *
 * Main discovery page featuring:
 * - Personalized recommendations
 * - Recently played
 * - New releases
 * - Popular tracks
 * - Genre sections
 *
 * Features:
 * - Horizontal scrolling sections
 * - Lazy loading
 * - Skeleton loaders
 * - Responsive grid
 */

export default function HomePage() {
  const { play } = usePlayerStore();
  const { setQueue } = useQueueStore();

  const handlePlayAlbum = (album: Album) => {
    // In real app, fetch album tracks
    const mockTracks: Track[] = [
      {
        id: '1',
        title: `${album.title} - Track 1`,
        artist: album.artist,
        artist_id: album.artist_id,
        album: album.title,
        album_id: album.id,
        duration: 210,
        audio_url: '/audio/demo.mp3',
        artwork_url: album.artwork_url,
      },
    ];

    setQueue(mockTracks, 0);
    play(mockTracks[0]);
  };

  const handlePlayTrack = (track: Track) => {
    play(track);
  };

  return (
    <div className="space-y-8 px-6 py-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Good {getGreeting()}
        </h1>
        <p className="text-[var(--qz-text-secondary)]">
          Discover new music and enjoy your favorites
        </p>
      </section>

      {/* Recently Played */}
      <Section title="Recently Played">
        <HorizontalScroll>
          {mockAlbums.slice(0, 6).map((album) => (
            <div key={album.id} className="w-48 flex-shrink-0">
              <AlbumCard album={album} onPlay={handlePlayAlbum} />
            </div>
          ))}
        </HorizontalScroll>
      </Section>

      {/* Made For You */}
      <Section title="Made For You">
        <HorizontalScroll>
          {mockAlbums.slice(3, 9).map((album) => (
            <div key={album.id} className="w-48 flex-shrink-0">
              <AlbumCard album={album} onPlay={handlePlayAlbum} />
            </div>
          ))}
        </HorizontalScroll>
      </Section>

      {/* Popular Tracks */}
      <Section title="Popular Right Now">
        <div className="space-y-1">
          {mockTracks.slice(0, 5).map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              index={index + 1}
              onPlay={handlePlayTrack}
              showArtwork
              showAlbum
            />
          ))}
        </div>
      </Section>

      {/* New Releases */}
      <Section title="New Releases">
        <HorizontalScroll>
          {mockAlbums.slice(2, 8).map((album) => (
            <div key={album.id} className="w-48 flex-shrink-0">
              <AlbumCard album={album} onPlay={handlePlayAlbum} />
            </div>
          ))}
        </HorizontalScroll>
      </Section>

      {/* Genres */}
      <Section title="Browse by Genre">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {genres.map((genre) => (
            <GenreCard key={genre.name} genre={genre} />
          ))}
        </div>
      </Section>
    </div>
  );
}

// Section Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

// Horizontal Scroll Container
function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
      {children}
    </div>
  );
}

// Genre Card Component
function GenreCard({ genre }: { genre: { name: string; color: string } }) {
  return (
    <div
      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group"
      style={{ backgroundColor: genre.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40 group-hover:to-black/60 transition-all" />
      <div className="absolute inset-0 p-4 flex items-end">
        <h3 className="text-lg font-bold text-white">{genre.name}</h3>
      </div>
    </div>
  );
}

// Utilities
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// Mock Data
const mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    artist_id: 'a1',
    artwork_url: 'https://picsum.photos/seed/album1/300/300',
    release_date: '2024-01-15',
    tracks_count: 12,
    genre: 'Electronic',
  },
  {
    id: '2',
    title: 'Summer Vibes',
    artist: 'Sunset Boulevard',
    artist_id: 'a2',
    artwork_url: 'https://picsum.photos/seed/album2/300/300',
    release_date: '2024-06-20',
    tracks_count: 10,
    genre: 'Pop',
  },
  {
    id: '3',
    title: 'Urban Rhythm',
    artist: 'Metro Beats',
    artist_id: 'a3',
    artwork_url: 'https://picsum.photos/seed/album3/300/300',
    release_date: '2024-03-10',
    tracks_count: 14,
    genre: 'Hip Hop',
  },
  {
    id: '4',
    title: 'Acoustic Sessions',
    artist: 'James River',
    artist_id: 'a4',
    artwork_url: 'https://picsum.photos/seed/album4/300/300',
    release_date: '2024-02-28',
    tracks_count: 8,
    genre: 'Folk',
  },
  {
    id: '5',
    title: 'Neon Nights',
    artist: 'Synth Wave',
    artist_id: 'a5',
    artwork_url: 'https://picsum.photos/seed/album5/300/300',
    release_date: '2024-05-12',
    tracks_count: 11,
    genre: 'Electronic',
  },
  {
    id: '6',
    title: 'Jazz Classics',
    artist: 'The Blue Notes',
    artist_id: 'a6',
    artwork_url: 'https://picsum.photos/seed/album6/300/300',
    release_date: '2024-04-05',
    tracks_count: 15,
    genre: 'Jazz',
  },
];

const mockTracks: Track[] = [
  {
    id: 't1',
    title: 'Electric Dreams',
    artist: 'Luna Eclipse',
    artist_id: 'a1',
    album: 'Midnight Dreams',
    album_id: '1',
    duration: 234,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/track1/300/300',
    plays: 1250000,
    is_liked: true,
  },
  {
    id: 't2',
    title: 'Sunset Drive',
    artist: 'Sunset Boulevard',
    artist_id: 'a2',
    album: 'Summer Vibes',
    album_id: '2',
    duration: 198,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/track2/300/300',
    plays: 980000,
    is_liked: false,
  },
  {
    id: 't3',
    title: 'City Lights',
    artist: 'Metro Beats',
    artist_id: 'a3',
    album: 'Urban Rhythm',
    album_id: '3',
    duration: 256,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/track3/300/300',
    plays: 1500000,
    is_liked: true,
    explicit: true,
  },
  {
    id: 't4',
    title: 'Morning Coffee',
    artist: 'James River',
    artist_id: 'a4',
    album: 'Acoustic Sessions',
    album_id: '4',
    duration: 189,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/track4/300/300',
    plays: 750000,
    is_liked: false,
  },
  {
    id: 't5',
    title: 'Neon Paradise',
    artist: 'Synth Wave',
    artist_id: 'a5',
    album: 'Neon Nights',
    album_id: '5',
    duration: 312,
    audio_url: '/audio/demo.mp3',
    artwork_url: 'https://picsum.photos/seed/track5/300/300',
    plays: 2100000,
    is_liked: true,
  },
];

const genres = [
  { name: 'Pop', color: '#8e44ad' },
  { name: 'Rock', color: '#c0392b' },
  { name: 'Hip Hop', color: '#d35400' },
  { name: 'Electronic', color: '#2980b9' },
  { name: 'Jazz', color: '#16a085' },
  { name: 'Classical', color: '#7f8c8d' },
  { name: 'R&B', color: '#e74c3c' },
  { name: 'Country', color: '#f39c12' },
  { name: 'Indie', color: '#27ae60' },
  { name: 'Latin', color: '#e67e22' },
];
