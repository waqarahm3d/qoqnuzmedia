'use client';

import { useEffect, useState } from 'react';
import { getGenres } from '@/lib/api/client';
import Link from 'next/link';

interface Genre {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export default function BrowsePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const genreColors = [
    '#1DB954', '#E13300', '#8D67AB', '#E8115B',
    '#148A08', '#DC148C', '#1E3264', '#E91429',
    '#509BF5', '#AF2896', '#BA5D07', '#477D95',
    '#8C1932', '#509BF5', '#D84000', '#27856A',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4">Browse All</h1>
          <p className="text-gray-400 text-lg">
            Explore music by genre and mood
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <p className="text-gray-400">Loading genres...</p>
        )}

        {/* Genre Grid */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {genres.map((genre, index) => {
              const bgColor = genre.color || genreColors[index % genreColors.length];
              return (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="relative aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform group"
                  style={{ background: bgColor }}
                >
                  <div className="p-4 h-full flex flex-col justify-between">
                    <h3 className="text-2xl font-black">{genre.name}</h3>
                    <div className="self-end transform rotate-25 translate-x-2 translate-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="rgba(0,0,0,0.2)"
                        className="drop-shadow-lg"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && genres.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No genres available</p>
          </div>
        )}
      </div>
    </div>
  );
}
