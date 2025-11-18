'use client';

import { useAlbums, useArtists } from '@/lib/hooks/useMusic';
import { Card } from '@/components/ui/Card';
import { MoodCard } from '@/components/discovery/MoodCard';
import { ActivityCard } from '@/components/discovery/ActivityCard';
import { BPMCalculator } from '@/components/discovery/BPMCalculator';
import { getMediaUrl } from '@/lib/media-utils';
import Link from 'next/link';

export default function DiscoverPage() {
  const { albums } = useAlbums(24);
  const { artists } = useArtists(24);

  const moods = [
    { name: 'happy', emoji: '😊', description: 'Happy & Upbeat', color: 'bg-gradient-to-br from-yellow-500 to-orange-500' },
    { name: 'energetic', emoji: '⚡', description: 'Energetic & Powerful', color: 'bg-gradient-to-br from-red-500 to-pink-500' },
    { name: 'chill', emoji: '😌', description: 'Chill & Relaxed', color: 'bg-gradient-to-br from-blue-400 to-cyan-400' },
    { name: 'focused', emoji: '🎯', description: 'Focused & Productive', color: 'bg-gradient-to-br from-purple-500 to-indigo-500' },
    { name: 'sad', emoji: '😢', description: 'Sad & Melancholic', color: 'bg-gradient-to-br from-blue-600 to-blue-800' },
    { name: 'romantic', emoji: '❤️', description: 'Romantic & Intimate', color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    { name: 'angry', emoji: '😠', description: 'Angry & Aggressive', color: 'bg-gradient-to-br from-red-600 to-orange-700' },
    { name: 'peaceful', emoji: '☮️', description: 'Peaceful & Calm', color: 'bg-gradient-to-br from-green-400 to-emerald-500' },
  ];

  const activities = [
    { name: 'workout', emoji: '💪', description: 'High energy tracks' },
    { name: 'running', emoji: '🏃', description: 'Perfect running cadence' },
    { name: 'study', emoji: '📚', description: 'Focus & concentration' },
    { name: 'sleep', emoji: '😴', description: 'Calm & restful' },
    { name: 'party', emoji: '🎉', description: 'Dance & celebrate' },
    { name: 'driving', emoji: '🚗', description: 'Road trip vibes' },
    { name: 'cooking', emoji: '👨‍🍳', description: 'Kitchen background' },
    { name: 'meditation', emoji: '🧘', description: 'Mindful & peaceful' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6">
      <h1 className="text-4xl font-bold mb-2">Discover</h1>
      <p className="text-gray-400 mb-8">Fresh music picks and personalized discovery</p>

      {/* Smart Playlists Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Smart Playlists</h2>
          <Link href="/playlists/smart" className="text-primary hover:text-[#ff5c2e] text-sm font-semibold">
            View all →
          </Link>
        </div>
        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg p-6 border border-white/10">
          <p className="text-white/80 mb-3">
            Get personalized playlists based on your listening habits
          </p>
          <Link
            href="/playlists/smart"
            className="inline-block px-6 py-3 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-full transition-colors"
          >
            Generate Smart Playlists
          </Link>
        </div>
      </section>

      {/* Mood-Based Discovery */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {moods.map((mood) => (
            <MoodCard
              key={mood.name}
              name={mood.name}
              emoji={mood.emoji}
              description={mood.description}
              color={mood.color}
            />
          ))}
        </div>
      </section>

      {/* Activity-Based Discovery */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.name}
              name={activity.name}
              emoji={activity.emoji}
              description={activity.description}
            />
          ))}
        </div>
      </section>

      {/* BPM Calculator */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Workout & Running</h2>
        <BPMCalculator />
      </section>

      {/* Trending Artists */}
      {artists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.slice(0, 12).map((artist: any) => (
              <Card
                key={artist.id}
                title={artist.name}
                subtitle="Artist"
                href={`/artist/${artist.id}`}
                image={getMediaUrl(artist.avatar_url)}
                type="circle"
              />
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {albums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.slice(0, 12).map((album: any) => (
              <Card
                key={album.id}
                title={album.title}
                subtitle={album.artists?.name || 'Unknown Artist'}
                href={`/album/${album.id}`}
                image={getMediaUrl(album.cover_art_url)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
