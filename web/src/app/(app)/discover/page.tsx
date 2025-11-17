'use client';

import { useAlbums, useArtists } from '@/lib/hooks/useMusic';
import { Card } from '@/components/ui/Card';

export default function DiscoverPage() {
  const { albums } = useAlbums(24);
  const { artists } = useArtists(24);

  return (
    <div className="px-4 lg:px-8 py-6">
      <h1 className="text-4xl font-bold mb-2">Discover</h1>
      <p className="text-gray-400 mb-8">Fresh music picks for you</p>

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
                image={artist.avatar_url}
                type="circle"
              />
            ))}
          </div>
        </section>
      )}

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
                image={album.cover_art_url}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
