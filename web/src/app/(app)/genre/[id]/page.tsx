'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGenres, getGenrePlaylists } from '@/lib/api/client';
import { getMediaUrl } from '@/lib/media-utils';
import { ShareIcon, MusicIcon, PlaylistIcon } from '@/components/icons';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  image_url: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  profiles?: {
    display_name: string;
  };
}

export default function GenrePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [genre, setGenre] = useState<Genre | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenreData();
  }, [id]);

  const fetchGenreData = async () => {
    try {
      // Get all genres and find the one matching the ID
      const genres = await getGenres();
      const foundGenre = genres.find((g: Genre) => g.id === id);

      if (foundGenre) {
        setGenre(foundGenre);
        // Fetch playlists for this genre
        const genrePlaylists = await getGenrePlaylists(foundGenre.id);
        setPlaylists(genrePlaylists || []);
      }
    } catch (error) {
      console.error('Failed to fetch genre data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!genre) return;

    const shareData = {
      title: `${genre.name} Music`,
      text: `Explore ${genre.name} tracks on Qoqnuz Music`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="px-4 lg:px-8 py-20 text-center">
        <h1 className="text-4xl font-black mb-4">Genre Not Found</h1>
        <p className="text-white/60 mb-6">
          The genre could not be found.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-[#ff5c2e] transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const bgColor = genre.color || '#ff4a14';

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8 flex items-end gap-6">
        <div
          className="w-52 h-52 rounded shadow-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: bgColor }}
        >
          {genre.image_url ? (
            <img
              src={getMediaUrl(genre.image_url)}
              alt={genre.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <MusicIcon size={80} className="text-white opacity-90" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase mb-2 text-white/60">Genre</p>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl lg:text-7xl font-black">{genre.name}</h1>
            <button
              onClick={handleShare}
              className="text-white/60 hover:text-white transition-colors"
              title="Share genre"
            >
              <ShareIcon size={32} />
            </button>
          </div>
          {genre.description && (
            <p className="text-lg text-white/80">{genre.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <h2 className="text-2xl font-bold mb-4">Popular {genre.name} Playlists</h2>

      {playlists.length === 0 ? (
        <div className="text-center py-20 bg-black/20 rounded-lg">
          <PlaylistIcon size={80} className="mx-auto mb-6 text-white/20" />
          <h3 className="text-2xl font-bold mb-2">No playlists found</h3>
          <p className="text-white/60">
            There are no playlists available for this genre yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group bg-surface/40 hover:bg-surface rounded-lg p-4 transition-all hover:shadow-xl"
            >
              <div className="aspect-square bg-surface rounded mb-3 overflow-hidden">
                {playlist.cover_image_url ? (
                  <img
                    src={getMediaUrl(playlist.cover_image_url)}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: bgColor }}
                  >
                    <MusicIcon size={48} className="text-white opacity-90" />
                  </div>
                )}
              </div>
              <h3 className="font-bold mb-1 truncate text-white group-hover:text-primary transition-colors">
                {playlist.name}
              </h3>
              <p className="text-sm text-white/60 line-clamp-2">
                {playlist.description || `${genre.name} playlist`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
