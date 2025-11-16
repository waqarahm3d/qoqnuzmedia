'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PlaylistIcon, MusicIcon, MicrophoneIcon, HeartFilledIcon } from '@/components/icons';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');

  const tabs = [
    { id: 'playlists' as const, label: 'Playlists', icon: PlaylistIcon },
    { id: 'artists' as const, label: 'Artists', icon: MicrophoneIcon },
    { id: 'albums' as const, label: 'Albums', icon: MusicIcon },
  ];

  const playlists = [
    { id: 'liked', name: 'Liked Songs', description: '42 songs', color: 'from-purple-700 to-purple-900', href: '/liked' },
    { id: '1', name: 'My Playlist #1', description: '15 songs' },
    { id: '2', name: 'Chill Vibes', description: '28 songs' },
    { id: '3', name: 'Workout Mix', description: '35 songs' },
    { id: '4', name: 'Study Session', description: '22 songs' },
    { id: '5', name: 'Party Hits', description: '50 songs' },
  ];

  const artists = [
    { id: '1', name: 'The Dreamers' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Rock Masters' },
    { id: '4', name: 'Pop Icons' },
  ];

  const albums = [
    { id: '1', title: 'Midnight Dreams', artist: 'The Dreamers' },
    { id: '2', title: 'Summer Vibes', artist: 'Beach Boys Redux' },
    { id: '3', title: 'City Lights', artist: 'Urban Sound' },
    { id: '4', title: 'Acoustic Sessions', artist: 'John Smith' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold">Your Library</h1>
        <button className="text-white/60 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <button className="text-white/60 hover:text-white transition-colors">
            Recent
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            Recently Added
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            Alphabetical
          </button>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'playlists' && (
        <div>
          {/* Liked Songs Special Card */}
          <a
            href="/liked"
            className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors group mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded flex items-center justify-center flex-shrink-0">
              <HeartFilledIcon size={32} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white">Liked Songs</h3>
              <p className="text-sm text-white/60">Playlist • 42 songs</p>
            </div>
          </a>

          {/* Playlists Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.slice(1).map((playlist) => (
              <Card
                key={playlist.id}
                title={playlist.name}
                subtitle={playlist.description}
                href={`/playlist/${playlist.id}`}
                onPlay={() => console.log('Play playlist:', playlist.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              title={artist.name}
              subtitle="Artist"
              href={`/artist/${artist.id}`}
              type="circle"
            />
          ))}
        </div>
      )}

      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albums.map((album) => (
            <Card
              key={album.id}
              title={album.title}
              subtitle={album.artist}
              href={`/album/${album.id}`}
              onPlay={() => console.log('Play album:', album.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
