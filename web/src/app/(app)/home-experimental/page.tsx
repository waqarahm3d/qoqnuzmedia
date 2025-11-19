'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media-utils';
import { useAlbums, useArtists, usePlaylists, useTracks, useGenres } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ShuffleIcon, RepeatIcon, VolumeIcon } from '@/components/icons';

// Modern Card Component with glassmorphism
function ModernCard({
  title,
  subtitle,
  image,
  onClick,
  isPlaying = false,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  onClick?: () => void;
  isPlaying?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left w-full rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-4xl">♪</span>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
            {isPlaying ? (
              <PauseIcon size={24} className="text-white" />
            ) : (
              <PlayIcon size={24} className="text-white ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate text-sm">{title}</h3>
        {subtitle && (
          <p className="text-xs text-white/50 truncate mt-1">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

// Now Playing Panel Component
function NowPlayingPanel() {
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrevious, progress, duration, volume, setVolume } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!currentTrack) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center mb-4">
          <span className="text-4xl opacity-50">♪</span>
        </div>
        <p className="text-white/50 text-sm">No track playing</p>
        <p className="text-white/30 text-xs mt-1">Select a song to start</p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Album Art with Progress Ring */}
      <div className="relative flex-shrink-0 mb-6">
        <div className="relative aspect-square max-w-[280px] mx-auto">
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 3.02} 302`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B2FBF" />
                <stop offset="100%" stopColor="#FF006E" />
              </linearGradient>
            </defs>
          </svg>

          {/* Album Image */}
          <div className={`absolute inset-2 rounded-full overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '20s' }}>
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
            )}
          </div>
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center mb-6">
        <h3 className="font-bold text-lg text-white truncate">{currentTrack.title}</h3>
        <p className="text-sm text-white/60 truncate">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button className="p-2 text-white/60 hover:text-white transition-colors">
          <ShuffleIcon size={18} />
        </button>
        <button
          onClick={playPrevious}
          className="p-2 text-white/80 hover:text-white transition-colors"
        >
          <SkipBackIcon size={24} />
        </button>
        <button
          onClick={togglePlayPause}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <PauseIcon size={28} className="text-white" />
          ) : (
            <PlayIcon size={28} className="text-white ml-1" />
          )}
        </button>
        <button
          onClick={playNext}
          className="p-2 text-white/80 hover:text-white transition-colors"
        >
          <SkipForwardIcon size={24} />
        </button>
        <button className="p-2 text-white/60 hover:text-white transition-colors">
          <RepeatIcon size={18} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <VolumeIcon size={18} className="text-white/60" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
          style={{
            background: `linear-gradient(to right, #7B2FBF ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}

// Helper function
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Sidebar Navigation Component
function SidebarNav() {
  const router = useRouter();
  const navItems = [
    { name: 'Home', icon: '🏠', href: '/home-experimental' },
    { name: 'Search', icon: '🔍', href: '/search' },
    { name: 'Library', icon: '📚', href: '/library' },
    { name: 'Liked Songs', icon: '❤️', href: '/liked' },
  ];

  return (
    <div className="p-4 space-y-2">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => router.push(item.href)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
        >
          <span>{item.icon}</span>
          <span className="text-sm font-medium">{item.name}</span>
        </button>
      ))}
    </div>
  );
}

export default function HomeExperimentalPage() {
  const router = useRouter();
  const { albums, loading: albumsLoading } = useAlbums(12);
  const { artists, loading: artistsLoading } = useArtists(12);
  const { playlists, loading: playlistsLoading } = usePlaylists(12);
  const { tracks, loading: tracksLoading } = useTracks(20);
  const { genres, loading: genresLoading } = useGenres();
  const { setQueue, playTrack, currentTrack, isPlaying } = usePlayer();

  const loading = albumsLoading || artistsLoading || playlistsLoading || tracksLoading || genresLoading;

  const handlePlayTrack = (track: any) => {
    const formattedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artists?.name || 'Unknown Artist',
      artistId: track.artists?.id,
      album: track.albums?.title || 'Unknown Album',
      albumId: track.albums?.id,
      image: getMediaUrl(track.albums?.cover_art_url),
      duration: track.duration_ms || 0,
    };

    const formattedQueue = tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artists?.name || 'Unknown Artist',
      artistId: t.artists?.id,
      album: t.albums?.title || 'Unknown Album',
      albumId: t.albums?.id,
      image: getMediaUrl(t.albums?.cover_art_url),
      duration: t.duration_ms || 0,
    }));

    setQueue(formattedQueue);
    playTrack(formattedTrack, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #0A0E1B 0%, #1A1E2E 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #0A0E1B 0%, #1A1E2E 100%)' }}
    >
      {/* Left Sidebar - Navigation */}
      <aside
        className="w-64 flex-shrink-0 border-r border-white/5 hidden lg:block"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Qoqnuz
          </h1>
        </div>
        <SidebarNav />

        {/* Playlists */}
        <div className="p-4 border-t border-white/5">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Playlists
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {playlists.slice(0, 8).map((playlist: any) => (
              <button
                key={playlist.id}
                onClick={() => router.push(`/playlist/${playlist.id}`)}
                className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded transition-all truncate"
              >
                {playlist.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-white/40 text-sm mb-1">Experimental UI</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              Good Evening
            </h1>
          </div>

          {/* Quick Picks Grid */}
          <section className="mb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {albums.slice(0, 6).map((album: any) => (
                <button
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}`)}
                  className="flex items-center gap-3 rounded-lg overflow-hidden transition-all duration-300 hover:bg-white/10 group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="w-16 h-16 flex-shrink-0">
                    {album.cover_art_url ? (
                      <img
                        src={getMediaUrl(album.cover_art_url)}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                    )}
                  </div>
                  <span className="font-semibold text-sm text-white truncate pr-4">
                    {album.title}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Featured Albums */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Featured Albums</h2>
              <button
                onClick={() => router.push('/browse')}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Show all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {albums.slice(0, 6).map((album: any) => (
                <ModernCard
                  key={album.id}
                  title={album.title}
                  subtitle={album.artists?.name || 'Unknown Artist'}
                  image={getMediaUrl(album.cover_art_url)}
                  onClick={() => router.push(`/album/${album.id}`)}
                />
              ))}
            </div>
          </section>

          {/* Popular Artists */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Popular Artists</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {artists.slice(0, 6).map((artist: any) => (
                <button
                  key={artist.id}
                  onClick={() => router.push(`/artist/${artist.id}`)}
                  className="group flex flex-col items-center text-center p-4 rounded-xl transition-all duration-300 hover:bg-white/5"
                >
                  <div className="relative w-full aspect-square mb-3">
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      {artist.avatar_url ? (
                        <img
                          src={getMediaUrl(artist.avatar_url)}
                          alt={artist.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-white truncate w-full">
                    {artist.name}
                  </h3>
                  <p className="text-xs text-white/50">Artist</p>
                </button>
              ))}
            </div>
          </section>

          {/* Browse Genres */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Browse Genres</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {genres.map((genre: any) => (
                <button
                  key={genre.id}
                  onClick={() => router.push(`/genre/${genre.id}`)}
                  className="flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${genre.color || '#7B2FBF'}80, ${genre.color || '#FF006E'}60)`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </section>

          {/* Trending Tracks */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Trending Now</h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {tracks.slice(0, 8).map((track: any, index: number) => (
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="w-6 text-center text-sm text-white/40">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    {track.albums?.cover_art_url ? (
                      <img
                        src={getMediaUrl(track.albums.cover_art_url)}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {track.artists?.name || 'Unknown Artist'}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">
                    {formatTime(track.duration_ms || 0)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Right Panel - Now Playing */}
      <aside
        className="w-80 flex-shrink-0 border-l border-white/5 hidden xl:block"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/60">Now Playing</h2>
        </div>
        <NowPlayingPanel />
      </aside>
    </div>
  );
}
