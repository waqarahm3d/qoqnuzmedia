'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { supabase } from '@/lib/supabase-client';

interface Track {
  id: string;
  title: string;
  duration_ms: number;
  explicit: boolean;
  audio_url: string;
  cover_art_url: string | null;
  lyrics: string | null;
  play_count: number;
  created_at: string;
  artist_id: string;
  album_id: string | null;
  artists: {
    id: string;
    name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  albums: {
    id: string;
    title: string;
    cover_art_url: string | null;
  } | null;
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchTrack();
  }, [trackId]);

  const fetchTrack = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          *,
          artists!tracks_artist_id_fkey(id, name, avatar_url, verified),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        `)
        .eq('id', trackId)
        .single();

      if (error) throw error;
      setTrack(data);
    } catch (error) {
      console.error('Error fetching track:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!track) return;

    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artists.name,
      artistId: track.artist_id,
      album: track.albums?.title || 'Single',
      albumId: track.album_id,
      image: track.albums?.cover_art_url || track.cover_art_url,
      duration: track.duration_ms,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `${track?.title} - ${track?.artists.name}`,
      text: `Listen to ${track?.title} by ${track?.artists.name} on Qoqnuz`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Track not found</h1>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-3 bg-primary text-black rounded-full font-semibold hover:bg-[#1ed760]"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const coverImage = track.albums?.cover_art_url || track.cover_art_url;

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Cover Art */}
            <div className="relative w-full md:w-64 h-64 flex-shrink-0 shadow-2xl">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={track.title}
                  fill
                  className="object-cover rounded"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold uppercase mb-2">Song</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 break-words">
                {track.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href={`/artist/${track.artist_id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  {track.artists.avatar_url && (
                    <Image
                      src={track.artists.avatar_url}
                      alt={track.artists.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span className="font-semibold">{track.artists.name}</span>
                  {track.artists.verified && (
                    <svg
                      className="w-4 h-4 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                  )}
                </Link>
                {track.albums && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/album/${track.album_id}`}
                      className="hover:underline"
                    >
                      {track.albums.title}
                    </Link>
                  </>
                )}
                <span>•</span>
                <span>{formatDate(track.created_at)}</span>
                <span>•</span>
                <span>{formatDuration(track.duration_ms)}</span>
                {track.explicit && (
                  <>
                    <span>•</span>
                    <span className="px-1 py-0.5 bg-gray-600 text-xs rounded">
                      E
                    </span>
                  </>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-400">
                {track.play_count?.toLocaleString() || 0} plays
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button
              onClick={handlePlay}
              className="w-14 h-14 rounded-full bg-primary hover:bg-[#1ed760] flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isCurrentlyPlaying ? (
                <svg
                  className="w-7 h-7 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7 text-black ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>

            {/* Like Button */}
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
            >
              <svg
                className="w-8 h-8"
                fill={isLiked ? '#1DB954' : 'none'}
                stroke={isLiked ? '#1DB954' : 'currentColor'}
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="text-gray-400 hover:text-white transition-colors"
              title="Share"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {/* More Options */}
            <button
              className="text-gray-400 hover:text-white transition-colors"
              title="More options"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      {track.lyrics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold mb-4">Lyrics</h2>
          <div className="bg-gray-900/50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
              {track.lyrics}
            </pre>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/50 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">About the artist</h2>
          </div>
          <Link href={`/artist/${track.artist_id}`}>
            <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-800/50 transition-colors">
              {track.artists.avatar_url ? (
                <Image
                  src={track.artists.avatar_url}
                  alt={track.artists.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl">🎤</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{track.artists.name}</h3>
                  {track.artists.verified && (
                    <svg
                      className="w-5 h-5 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-400">Artist</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
