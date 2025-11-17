'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getGenres, getGenrePlaylists } from '@/lib/api/client';
import Link from 'next/link';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
}

export default function GenrePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [genre, setGenre] = useState<Genre | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenreData();
  }, [slug]);

  const fetchGenreData = async () => {
    try {
      // Get all genres and find the one matching the slug
      const genres = await getGenres();
      const foundGenre = genres.find((g: Genre) => g.slug === slug);

      if (foundGenre) {
        setGenre(foundGenre);
        // Fetch playlists for this genre
        const genrePlaylists = await getGenrePlaylists(foundGenre.id);
        setPlaylists(genrePlaylists);
      }
    } catch (error) {
      console.error('Failed to fetch genre data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black mb-4">Genre Not Found</h1>
          <p className="text-gray-400 mb-6">
            The genre "{slug}" could not be found.
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
          >
            Browse All Genres
          </Link>
        </div>
      </div>
    );
  }

  const bgColor = genre.color || '#1DB954';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div
        className="p-8"
        style={{
          background: `linear-gradient(to bottom, ${bgColor}, rgba(0,0,0,0.8))`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <div
              className="w-52 h-52 rounded shadow-2xl flex items-center justify-center text-6xl font-black"
              style={{ background: bgColor }}
            >
              🎵
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase mb-2">Genre</p>
              <h1 className="text-7xl font-black mb-6">{genre.name}</h1>
              {genre.description && (
                <p className="text-lg text-gray-200">{genre.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Popular {genre.name} Playlists</h2>

        {playlists.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-lg">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mx-auto mb-6 text-gray-600"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <h3 className="text-2xl font-bold mb-2">No playlists found</h3>
            <p className="text-gray-400">
              There are no playlists available for this genre yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 group"
              >
                <div className="aspect-square bg-gray-700 rounded mb-4 overflow-hidden">
                  {playlist.cover_image_url ? (
                    <img
                      src={playlist.cover_image_url}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-6xl"
                      style={{ background: bgColor }}
                    >
                      🎵
                    </div>
                  )}
                </div>
                <h3 className="font-bold mb-1 truncate">{playlist.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {playlist.description || `${genre.name} playlist`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
