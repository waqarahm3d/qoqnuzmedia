'use client';

import { Card } from '@/components/ui/Card';
import { TrackRow } from '@/components/ui/TrackRow';
import { useAlbums, useArtists, usePlaylists, useTracks } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';

export default function HomePage() {
  const { albums, loading: albumsLoading } = useAlbums(12);
  const { artists, loading: artistsLoading } = useArtists(12);
  const { playlists, loading: playlistsLoading } = usePlaylists(12);
  const { tracks, loading: tracksLoading } = useTracks(20);
  const { setQueue, playTrack } = usePlayer();

  const loading = albumsLoading || artistsLoading || playlistsLoading || tracksLoading;

  // Sort tracks by play_count for trending (client-side for now)
  const trendingTracks = [...tracks]
    .filter(t => t.play_count > 0)
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 10);

  // Get popular albums (sorted by release date for now, ideally by play count)
  const popularAlbums = [...albums]
    .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
    .slice(0, 8);

  // Get popular singles (tracks without album)
  const popularSingles = [...tracks]
    .filter(t => !t.album_id && t.play_count > 0)
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 4);

  // Combine popular albums and singles
  const popularContent = [
    ...popularAlbums.map((album: any) => ({
      ...album,
      type: 'album',
      subtitle: album.artists?.name || 'Unknown Artist',
      href: `/album/${album.id}`,
      image: getMediaUrl(album.cover_art_url),
    })),
    ...popularSingles.map((track: any) => ({
      ...track,
      type: 'single',
      subtitle: track.artists?.name || 'Unknown Artist',
      href: `/track/${track.id}`,
      image: getMediaUrl(track.albums?.cover_art_url || track.cover_art_url),
    })),
  ].slice(0, 12);

  const handlePlayAlbum = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    // Navigate to album page where tracks can be played
    window.location.href = `/album/${albumId}`;
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    // Navigate to playlist page where tracks can be played
    window.location.href = `/playlist/${playlistId}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

      {/* Trending Songs */}
      {trendingTracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Trending Songs</h2>
            <a href="/browse/trending" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="space-y-2">
              {trendingTracks.map((track: any, index: number) => (
                <TrackRow
                  key={track.id}
                  number={index + 1}
                  title={track.title}
                  artist={track.artists?.name || 'Unknown Artist'}
                  album={track.albums?.title || 'Single'}
                  image={getMediaUrl(track.albums?.cover_art_url || track.cover_art_url)}
                  duration={formatDuration(track.duration_ms || 0)}
                  trackId={track.id}
                  artistId={track.artist_id}
                  albumId={track.album_id}
                  showImage={true}
                  onPlay={() => {
                    playTrack({
                      id: track.id,
                      title: track.title,
                      artist: track.artists?.name || 'Unknown Artist',
                      artistId: track.artist_id,
                      album: track.albums?.title || 'Single',
                      albumId: track.album_id,
                      image: getMediaUrl(track.albums?.cover_art_url || track.cover_art_url),
                      duration: track.duration_ms || 0,
                    });
                  }}
                  onLike={() => {}}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New to Qoqnuz */}
      {tracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">New to Qoqnuz</h2>
            <a href="/browse/new" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="space-y-2">
              {tracks.slice(0, 10).map((track: any, index: number) => (
                <TrackRow
                  key={track.id}
                  number={index + 1}
                  title={track.title}
                  artist={track.artists?.name || 'Unknown Artist'}
                  album={track.albums?.title || 'Single'}
                  image={getMediaUrl(track.albums?.cover_art_url || track.cover_art_url)}
                  duration={formatDuration(track.duration_ms || 0)}
                  trackId={track.id}
                  artistId={track.artist_id}
                  albumId={track.album_id}
                  onPlay={() => {
                    playTrack({
                      id: track.id,
                      title: track.title,
                      artist: track.artists?.name || 'Unknown Artist',
                      artistId: track.artist_id,
                      album: track.albums?.title || 'Single',
                      albumId: track.album_id,
                      image: getMediaUrl(track.albums?.cover_art_url || track.cover_art_url),
                      duration: track.duration_ms || 0,
                    });
                  }}
                  onLike={() => {}}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Albums and Singles */}
      {popularContent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Popular Albums and Singles</h2>
            <a href="/browse/albums" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {popularContent.map((item: any) => (
              <Card
                key={item.id}
                title={item.title || item.name}
                subtitle={`${item.type === 'album' ? 'Album' : 'Single'} • ${item.subtitle}`}
                href={item.href}
                image={item.image}
                onPlay={() => {
                  if (item.type === 'album') {
                    handlePlayAlbum(item.id);
                  } else {
                    playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.subtitle,
                      artistId: item.artist_id,
                      album: 'Single',
                      albumId: null,
                      image: item.image,
                      duration: item.duration_ms || 0,
                    });
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Albums */}
      {albums.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">New Releases</h2>
            <a href="/browse/albums" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album: any) => (
              <Card
                key={album.id}
                title={album.title}
                subtitle={album.artists?.name || 'Unknown Artist'}
                href={`/album/${album.id}`}
                image={getMediaUrl(album.cover_art_url)}
                onPlay={() => handlePlayAlbum(album.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Artists */}
      {artists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Popular Artists</h2>
            <a href="/browse/artists" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.map((artist: any) => (
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

      {/* Empty State */}
      {!loading && albums.length === 0 && artists.length === 0 && playlists.length === 0 && tracks.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No content yet</h3>
          <p className="text-white/60 mb-4">Add some tracks, albums, artists, and playlists from the admin panel to get started!</p>
          <a href="/admin" className="inline-block px-6 py-3 bg-primary text-black rounded-full font-semibold hover:bg-[#1ed760] transition-colors">
            Go to Admin Panel
          </a>
        </div>
      )}
    </div>
  );
}
