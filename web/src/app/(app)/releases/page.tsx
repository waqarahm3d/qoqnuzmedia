'use client';

import { useAlbums } from '@/lib/hooks/useMusic';
import { Card } from '@/components/ui/Card';

export default function ReleasesPage() {
  const { albums, loading } = useAlbums(50);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      <h1 className="text-4xl font-bold mb-2">New Releases</h1>
      <p className="text-gray-400 mb-8">The latest albums and singles</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {albums.map((album: any) => (
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

      {albums.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No releases yet</p>
        </div>
      )}
    </div>
  );
}
