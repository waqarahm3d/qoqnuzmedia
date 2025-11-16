'use client';

import { Card } from '@/components/ui/Card';
import { useEffect, useState } from 'react';

interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
}

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
}

export default function HomePage() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from APIs
    const fetchData = async () => {
      try {
        // For now, using demo data until API is connected
        setRecentAlbums([
          { id: '1', title: 'Midnight Dreams', artist: 'The Dreamers' },
          { id: '2', title: 'Summer Vibes', artist: 'Beach Boys Redux' },
          { id: '3', title: 'City Lights', artist: 'Urban Sound' },
          { id: '4', title: 'Acoustic Sessions', artist: 'John Smith' },
          { id: '5', title: 'Electronic Waves', artist: 'DJ Pulse' },
          { id: '6', title: 'Jazz Nights', artist: 'The Jazz Collective' },
        ]);

        setPopularArtists([
          { id: '1', name: 'The Dreamers' },
          { id: '2', name: 'Sarah Johnson' },
          { id: '3', name: 'Rock Masters' },
          { id: '4', name: 'Pop Icons' },
          { id: '5', name: 'Classical Ensemble' },
          { id: '6', name: 'Hip Hop Crew' },
        ]);

        setFeaturedPlaylists([
          { id: '1', name: 'Today\'s Top Hits', description: 'The hottest tracks right now' },
          { id: '2', name: 'Chill Vibes', description: 'Relax and unwind' },
          { id: '3', name: 'Workout Motivation', description: 'Get pumped for your workout' },
          { id: '4', name: 'Focus Flow', description: 'Deep focus music' },
          { id: '5', name: 'Party Hits', description: 'Dance all night long' },
          { id: '6', name: 'Mood Booster', description: 'Feel good music' },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Greeting */}
      <h1 className="text-3xl lg:text-4xl font-bold mb-6">{getGreeting()}</h1>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { name: 'Liked Songs', href: '/liked', color: 'from-purple-700 to-purple-900' },
          { name: 'Your Top Songs 2024', href: '/playlist/top-2024', color: 'from-blue-700 to-blue-900' },
          { name: 'Recently Played', href: '/recent', color: 'from-green-700 to-green-900' },
          { name: 'Your Episodes', href: '/episodes', color: 'from-red-700 to-red-900' },
          { name: 'Discover Weekly', href: '/discover', color: 'from-pink-700 to-pink-900' },
          { name: 'Release Radar', href: '/releases', color: 'from-yellow-700 to-yellow-900' },
        ].map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="group relative bg-surface/40 hover:bg-surface rounded overflow-hidden transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex items-center h-20">
              <div className={`w-20 h-20 bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-2xl">♪</span>
              </div>
              <div className="px-4 flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{item.name}</h3>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Featured Playlists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Featured Playlists</h2>
          <a href="/browse/playlists" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Show all
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {featuredPlaylists.map((playlist) => (
            <Card
              key={playlist.id}
              title={playlist.name}
              subtitle={playlist.description}
              href={`/playlist/${playlist.id}`}
              image={playlist.cover_url}
              onPlay={() => console.log('Play playlist:', playlist.id)}
            />
          ))}
        </div>
      </section>

      {/* Recent Albums */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">New Releases</h2>
          <a href="/browse/albums" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Show all
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {recentAlbums.map((album) => (
            <Card
              key={album.id}
              title={album.title}
              subtitle={album.artist}
              href={`/album/${album.id}`}
              image={album.cover_url}
              onPlay={() => console.log('Play album:', album.id)}
            />
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Popular Artists</h2>
          <a href="/browse/artists" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Show all
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {popularArtists.map((artist) => (
            <Card
              key={artist.id}
              title={artist.name}
              subtitle="Artist"
              href={`/artist/${artist.id}`}
              image={artist.image_url}
              type="circle"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
