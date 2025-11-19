'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { useAlbums, useArtists, usePlaylists, useTracks, useGenres } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ShuffleIcon, RepeatIcon, HeartIcon } from '@/components/icons';

// UGEM-style Music Player - Dark theme with purple/pink accents
// Based on Dribbble shot 6981278

export default function HomeExperimentalPage() {
  const router = useRouter();
  const { albums, loading: albumsLoading } = useAlbums(20);
  const { artists, loading: artistsLoading } = useArtists(12);
  const { playlists, loading: playlistsLoading } = usePlaylists(12);
  const { tracks, loading: tracksLoading } = useTracks(30);
  const { genres, loading: genresLoading } = useGenres();
  const { setQueue, playTrack, currentTrack, isPlaying, togglePlayPause, skipForward, skipBackward, currentTime, duration } = usePlayer();

  // Playlist generator state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [generatorStep, setGeneratorStep] = useState<'genres' | 'recommendations'>('genres');
  const [activeTab, setActiveTab] = useState<'discover' | 'library' | 'generator'>('discover');

  const loading = albumsLoading || artistsLoading || playlistsLoading || tracksLoading || genresLoading;

  const toggleGenreSelection = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

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

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get recommendations based on selected genres
  const recommendations = tracks.filter((track: any) => {
    if (selectedGenres.length === 0) return true;
    // Simple filter - in real app would be more sophisticated
    return true;
  }).slice(0, 12);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0D0D1A 100%)' }}>
      <div className="flex h-screen">
        {/* Left Sidebar - Navigation */}
        <aside className="w-72 flex-shrink-0 p-6 flex flex-col border-r border-white/5">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Qoqnuz<span className="text-purple-500">.</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-2 mb-8">
            {[
              { id: 'discover', label: 'Discover', icon: '🎵' },
              { id: 'library', label: 'Library', icon: '📚' },
              { id: 'generator', label: 'Playlist Generator', icon: '✨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Playlists */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-4">
              Your Playlists
            </h3>
            <div className="space-y-1">
              {playlists.slice(0, 6).map((playlist: any) => (
                <button
                  key={playlist.id}
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  className="w-full text-left px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all truncate"
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Player */}
          {currentTrack && (
            <div className="mt-4 p-4 rounded-2xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {currentTrack.image ? (
                    <img src={currentTrack.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
                  <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={skipBackward} className="text-white/60 hover:text-white">
                  <SkipBackIcon size={18} />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
                >
                  {isPlaying ? <PauseIcon size={18} className="text-white" /> : <PlayIcon size={18} className="text-white ml-0.5" />}
                </button>
                <button onClick={skipForward} className="text-white/60 hover:text-white">
                  <SkipForwardIcon size={18} />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'discover' && (
            <>
              {/* Hero Section */}
              <section className="mb-10">
                <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm mb-2">FEATURED PLAYLIST</p>
                    <h2 className="text-4xl font-bold text-white mb-4">Today's Top Hits</h2>
                    <p className="text-white/80 mb-6 max-w-md">
                      The hottest tracks right now. Updated daily with the best new music.
                    </p>
                    <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:scale-105 transition-transform">
                      Play Now
                    </button>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
                </div>
              </section>

              {/* Browse Genres */}
              <section className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4">Browse by Genre</h2>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {genres.map((genre: any) => (
                    <button
                      key={genre.id}
                      onClick={() => router.push(`/genre/${genre.id}`)}
                      className="flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm text-white transition-all duration-300 hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${genre.color || '#8B5CF6'}90, ${genre.color || '#EC4899'}70)`,
                      }}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Trending Tracks */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Trending Now</h2>
                  <button className="text-sm text-purple-400 hover:text-purple-300">See all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tracks.slice(0, 8).map((track: any, index: number) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group text-left"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="w-6 text-center text-sm text-white/40 font-medium">
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {track.albums?.cover_art_url ? (
                          <img src={getMediaUrl(track.albums.cover_art_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <PlayIcon size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-white/50 truncate">{track.artists?.name}</p>
                      </div>
                      <span className="text-xs text-white/40">{formatTime(track.duration_ms || 0)}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Popular Albums */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Popular Albums</h2>
                  <button className="text-sm text-purple-400 hover:text-purple-300">See all</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {albums.slice(0, 6).map((album: any) => (
                    <button
                      key={album.id}
                      onClick={() => router.push(`/album/${album.id}`)}
                      className="group text-left"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                        {album.cover_art_url ? (
                          <img
                            src={getMediaUrl(album.cover_art_url)}
                            alt={album.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                            <PlayIcon size={20} className="text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm text-white truncate">{album.title}</h3>
                      <p className="text-xs text-white/50 truncate">{album.artists?.name}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'generator' && (
            <div className="max-w-2xl mx-auto">
              {generatorStep === 'genres' ? (
                <>
                  {/* Genre Selection Step */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Create Your Playlist</h2>
                    <p className="text-white/60">Choose genres that match your mood</p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {genres.map((genre: any) => (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenreSelection(genre.id)}
                        className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                          selectedGenres.includes(genre.id)
                            ? 'text-white scale-105'
                            : 'text-white/70 hover:text-white'
                        }`}
                        style={{
                          background: selectedGenres.includes(genre.id)
                            ? `linear-gradient(135deg, ${genre.color || '#8B5CF6'}, ${genre.color || '#EC4899'})`
                            : 'rgba(255,255,255,0.05)',
                          border: selectedGenres.includes(genre.id) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setGeneratorStep('recommendations')}
                      disabled={selectedGenres.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                      Get Recommendations →
                    </button>
                    {selectedGenres.length > 0 && (
                      <p className="text-sm text-white/40 mt-3">{selectedGenres.length} genres selected</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Recommendations Step */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Your Recommendations</h2>
                      <p className="text-white/60 text-sm">Based on your selected genres</p>
                    </div>
                    <button
                      onClick={() => setGeneratorStep('genres')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      ← Change genres
                    </button>
                  </div>

                  <div className="space-y-2">
                    {recommendations.map((track: any, index: number) => (
                      <button
                        key={track.id}
                        onClick={() => handlePlayTrack(track)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group text-left"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <span className="w-6 text-center text-sm text-white/40">{index + 1}</span>
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {track.albums?.cover_art_url ? (
                            <img src={getMediaUrl(track.albums.cover_art_url)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{track.title}</p>
                          <p className="text-xs text-white/50 truncate">{track.artists?.name}</p>
                        </div>
                        <button className="p-2 text-white/40 hover:text-pink-400 transition-colors">
                          <HeartIcon size={18} />
                        </button>
                        <span className="text-xs text-white/40">{formatTime(track.duration_ms || 0)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:scale-105 transition-transform">
                      Save as Playlist
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Your Library</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist: any) => (
                  <button
                    key={playlist.id}
                    onClick={() => router.push(`/playlist/${playlist.id}`)}
                    className="group text-left"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                      {playlist.cover_image_url ? (
                        <img
                          src={getMediaUrl(playlist.cover_image_url)}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎵</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-white truncate">{playlist.name}</h3>
                    <p className="text-xs text-white/50">Playlist</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Right Panel - Now Playing */}
        <aside className="w-80 flex-shrink-0 p-6 border-l border-white/5 hidden xl:flex flex-col">
          <h2 className="text-sm font-semibold text-white/60 mb-6">Now Playing</h2>

          {currentTrack ? (
            <>
              {/* Album Art */}
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-6">
                {currentTrack.image ? (
                  <img src={currentTrack.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
                )}
              </div>

              {/* Track Info */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg text-white truncate">{currentTrack.title}</h3>
                <p className="text-sm text-white/60 truncate">{currentTrack.artist}</p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button className="text-white/40 hover:text-white transition-colors">
                  <ShuffleIcon size={18} />
                </button>
                <button onClick={skipBackward} className="text-white/60 hover:text-white transition-colors">
                  <SkipBackIcon size={24} />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <PauseIcon size={24} className="text-white" /> : <PlayIcon size={24} className="text-white ml-1" />}
                </button>
                <button onClick={skipForward} className="text-white/60 hover:text-white transition-colors">
                  <SkipForwardIcon size={24} />
                </button>
                <button className="text-white/40 hover:text-white transition-colors">
                  <RepeatIcon size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl opacity-50">🎵</span>
              </div>
              <p className="text-white/50 text-sm">No track playing</p>
              <p className="text-white/30 text-xs mt-1">Select a song to start</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
