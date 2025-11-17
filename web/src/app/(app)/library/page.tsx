'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PlaylistIcon, MusicIcon, MicrophoneIcon, HeartFilledIcon } from '@/components/icons';
import { useUserLibrary, useLikedTracks } from '@/lib/hooks/useMusic';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');
  const { library, loading } = useUserLibrary();
  const { tracks: likedTracks } = useLikedTracks();

  const tabs = [
    { id: 'playlists' as const, label: 'Playlists', icon: PlaylistIcon },
    { id: 'artists' as const, label: 'Artists', icon: MicrophoneIcon },
    { id: 'albums' as const, label: 'Albums', icon: MusicIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold">Your Library</h1>
        <a href="/playlist/create" className="text-white/60 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </a>
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
              <p className="text-sm text-white/60">Playlist • {likedTracks.length} songs</p>
            </div>
          </a>

          {/* Playlists Grid */}
          {library.playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {library.playlists.map((playlist: any) => (
                <Card
                  key={playlist.id}
                  title={playlist.name}
                  subtitle={playlist.description || `${playlist.track_count || 0} songs`}
                  href={`/playlist/${playlist.id}`}
                  image={playlist.cover_url}
                  onPlay={() => window.location.href = `/playlist/${playlist.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">No playlists yet</p>
              <a href="/playlist/create" className="text-primary hover:underline">Create your first playlist</a>
            </div>
          )}
        </div>
      )}

      {activeTab === 'artists' && (
        library.artists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {library.artists.map((artist: any) => (
              <Card
                key={artist.id}
                title={artist.name}
                subtitle="Artist"
                href={`/artist/${artist.id}`}
                image={artist.avatar_url}
                type="circle"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">No followed artists yet</p>
          </div>
        )
      )}

      {activeTab === 'albums' && (
        library.albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {library.albums.map((album: any) => (
              <Card
                key={album.id}
                title={album.title}
                subtitle={album.artists?.name || 'Unknown Artist'}
                href={`/album/${album.id}`}
                image={album.cover_art_url}
                onPlay={() => window.location.href = `/album/${album.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">No saved albums yet</p>
          </div>
        )
      )}
    </div>
  );
}
