'use client';

import { Card } from '@/components/ui/Card';
import { TrackRow } from '@/components/ui/TrackRow';
import { useAlbums, useArtists, usePlaylists, useTracks, useGenres } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMediaUrl } from '@/lib/media-utils';
import {
  HeartIcon,
  SparklesIcon,
  RecentIcon,
  DiscoverIcon,
  PodcastIcon,
  NewReleasesIcon
} from '@/components/icons';

export default function HomePage() {
  const { user } = useAuth();
  const { albums, loading: albumsLoading } = useAlbums(12);
  const { artists, loading: artistsLoading } = useArtists(12);
  const { playlists, loading: playlistsLoading } = usePlaylists(12);
  const { tracks, loading: tracksLoading } = useTracks(20);
  const { genres, loading: genresLoading } = useGenres();
  const { setQueue, playTrack } = usePlayer();

  const loading = albumsLoading || artistsLoading || playlistsLoading || tracksLoading || genresLoading;

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
          { name: 'Liked Songs', href: '/liked', color: 'from-purple-700 to-purple-900', Icon: HeartIcon, requireAuth: true },
          { name: 'Smart Playlists', href: '/playlists/smart', color: 'from-primary/80 to-primary', Icon: SparklesIcon, requireAuth: true },
          { name: 'Recently Played', href: '/recent', color: 'from-[#d43e11] to-[#8a2a00]', Icon: RecentIcon, requireAuth: false },
          { name: 'Discover', href: '/discover', color: 'from-blue-600 to-blue-800', Icon: DiscoverIcon, requireAuth: false },
          { name: 'Your Episodes', href: '/episodes', color: 'from-green-600 to-green-800', Icon: PodcastIcon, requireAuth: false },
          { name: 'New Releases', href: '/releases', color: 'from-pink-600 to-pink-800', Icon: NewReleasesIcon, requireAuth: false },
        ]
          .filter(item => !item.requireAuth || user) // Only show auth-required items if user is logged in
          .map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="group relative bg-surface/40 hover:bg-surface rounded overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-center h-20">
                <div className={`w-20 h-20 bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <item.Icon size={36} className="text-white" />
                </div>
                <div className="px-4 flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">{item.name}</h3>
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

      {/* Recently Added Tracks */}
      {tracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recently Added Tracks</h2>
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

      {/* Featured Playlists */}
      {playlists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Featured Playlists</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.slice(0, 6).map((playlist: any) => (
              <Card
                key={playlist.id}
                title={playlist.name}
                subtitle={`By ${playlist.profiles?.display_name || 'Unknown'}`}
                href={`/playlist/${playlist.id}`}
                image={getMediaUrl(playlist.cover_image_url)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Albums and Singles */}
      {popularContent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Popular Albums and Singles</h2>
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
                      albumId: undefined,
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

      {/* Browse Genres */}
      {genres.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Browse Genres</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.slice(0, 10).map((genre: any) => (
              <a
                key={genre.id}
                href={`/genre/${genre.id}`}
                className="group relative bg-surface/40 hover:bg-surface rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                style={{ backgroundColor: genre.color ? `${genre.color}40` : undefined }}
              >
                <div className="aspect-square relative">
                  {genre.image_url ? (
                    <img
                      src={getMediaUrl(genre.image_url)}
                      alt={genre.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: genre.color || '#333' }}
                    >
                      ♪
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-lg text-white truncate">{genre.name}</h3>
                  </div>
                </div>
              </a>
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
