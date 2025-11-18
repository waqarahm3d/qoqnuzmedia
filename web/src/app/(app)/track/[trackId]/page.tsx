'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { supabase } from '@/lib/supabase-client';
import { getMediaUrl } from '@/lib/media-utils';
import { EmbedModal } from '@/components/ui/EmbedModal';

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

export default function TrackPage() {
  const params = useParams();
  const trackId = params?.trackId as string;
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrack();
    fetchLikeStatus();
    fetchReactions();
  }, [trackId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

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

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/tracks/${trackId}/like`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/tracks/${trackId}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || []);
        setUserReactions(data.userReactions || []);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        // Unlike
        const response = await fetch(`/api/tracks/${trackId}/like`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like
        const response = await fetch(`/api/tracks/${trackId}/like`, {
          method: 'POST',
        });

        if (response.ok) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        } else if (response.status === 401) {
          // Not authenticated
          alert('Please sign in to like tracks');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      const hasReacted = userReactions.includes(emoji);

      if (hasReacted) {
        // Remove reaction
        const response = await fetch(`/api/tracks/${trackId}/reactions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });

        if (response.ok) {
          setUserReactions(prev => prev.filter(e => e !== emoji));
          setReactions(prev =>
            prev.map(r => r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r)
              .filter(r => r.count > 0)
          );
        }
      } else {
        // Add reaction
        const response = await fetch(`/api/tracks/${trackId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });

        if (response.ok) {
          setUserReactions(prev => [...prev, emoji]);
          setReactions(prev => {
            const existing = prev.find(r => r.emoji === emoji);
            if (existing) {
              return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r);
            } else {
              return [...prev, { emoji, count: 1 }];
            }
          });
        } else if (response.status === 401) {
          alert('Please sign in to react to tracks');
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
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
      albumId: track.album_id || undefined,
      image: getMediaUrl(track.albums?.cover_art_url || track.cover_art_url) || undefined,
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
          className="px-6 py-3 bg-primary text-black rounded-full font-semibold hover:bg-[#ff5c2e]"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const coverImage = getMediaUrl(track.albums?.cover_art_url || track.cover_art_url);

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
                  {track.artists.avatar_url && getMediaUrl(track.artists.avatar_url) && (
                    <Image
                      src={getMediaUrl(track.artists.avatar_url)!}
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
              className="w-14 h-14 rounded-full bg-primary hover:bg-[#ff5c2e] flex items-center justify-center hover:scale-105 transition-transform"
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className="text-gray-400 hover:text-white transition-colors"
                title={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
              >
                <svg
                  className="w-8 h-8"
                  fill={isLiked ? '#ff4a14' : 'none'}
                  stroke={isLiked ? '#ff4a14' : 'currentColor'}
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {likeCount > 0 && (
                <span className="text-sm text-gray-400">{likeCount.toLocaleString()}</span>
              )}
            </div>

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

            {/* Embed Button */}
            <button
              onClick={() => setShowEmbedModal(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Embed"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
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

          {/* Emoji Reactions */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            {/* Existing Reactions */}
            {reactions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {reactions.map(({ emoji, count }) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                      userReactions.includes(emoji)
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                    }`}
                    title={`${userReactions.includes(emoji) ? 'Remove' : 'Add'} reaction`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Add Reaction Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-white transition-all"
                title="Add reaction"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                <span className="text-sm">React</span>
              </button>

              {/* Emoji Picker Dropdown */}
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 bg-surface rounded-lg shadow-2xl border border-white/10 p-3 z-50">
                  <div className="flex gap-2 flex-wrap max-w-[280px]">
                    {['🔥', '❤️', '👏', '🎵', '😍', '💯', '🎉', '🎸'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReaction(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                          userReactions.includes(emoji)
                            ? 'bg-primary/20 ring-2 ring-primary'
                            : 'hover:bg-white/10'
                        }`}
                        title={`${userReactions.includes(emoji) ? 'Remove' : 'Add'} ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              {track.artists.avatar_url && getMediaUrl(track.artists.avatar_url) ? (
                <Image
                  src={getMediaUrl(track.artists.avatar_url)!}
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

      {/* Embed Modal */}
      {track && (
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          type="track"
          id={track.id}
          title={`${track.title} - ${track.artists.name}`}
        />
      )}
    </div>
  );
}
