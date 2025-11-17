'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TrackRow } from '@/components/ui/TrackRow';
import { PlayIcon, MoreIcon, ShareIcon } from '@/components/icons';
import { useState, useEffect } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';
import { EmbedModal } from '@/components/ui/EmbedModal';

export default function ArtistPage() {
  const params = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const { playTrack } = usePlayer();

  useEffect(() => {
    fetchArtist();
  }, [params?.id]);

  const fetchArtist = async () => {
    try {
      const response = await fetch(`/api/artists/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch artist');
      const data = await response.json();
      setArtist(data.artist);
    } catch (error) {
      console.error('Failed to fetch artist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: artist?.name || 'Unknown Artist',
      artistId: artist?.id,
      album: track.albums?.title || 'Unknown Album',
      albumId: track.album_id,
      image: getMediaUrl(track.albums?.cover_art_url),
      duration: track.duration_ms || 0,
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPlayCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleShare = async () => {
    const shareData = {
      title: artist.name,
      text: `Check out ${artist.name} on Qoqnuz Music`,
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

  if (!artist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
          <p className="text-white/60">The artist you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-80 lg:h-96 bg-gradient-to-b from-purple-900 to-background">
        {artist.cover_image_url && getMediaUrl(artist.cover_image_url) ? (
          <div className="absolute inset-0">
            <Image
              src={getMediaUrl(artist.cover_image_url)!}
              alt={artist.name}
              fill
              className="object-cover opacity-40"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent" />
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 pb-6">
          <div className="flex items-center gap-2 mb-2">
            {artist.verified && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            )}
            <span className="text-sm font-semibold">{artist.verified ? 'Verified Artist' : 'Artist'}</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-4">{artist.name}</h1>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 lg:px-8 py-6 bg-gradient-to-b from-background/60 to-background">
        <div className="flex items-center gap-4 mb-8">
          <Button
            size="lg"
            className="!w-14 !h-14 !p-0"
            onClick={() => {
              if (artist.tracks && artist.tracks.length > 0) {
                handlePlayTrack(artist.tracks[0]);
              }
            }}
          >
            <PlayIcon size={24} />
          </Button>
          <Button
            variant={isFollowing ? 'ghost' : 'secondary'}
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <button
            onClick={handleShare}
            className="text-white/60 hover:text-white transition-colors"
            title="Share artist"
          >
            <ShareIcon size={24} />
          </button>
          <button
            onClick={() => setShowEmbedModal(true)}
            className="text-white/60 hover:text-white transition-colors"
            title="Embed artist"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreIcon size={24} />
          </button>
        </div>

        {/* Popular Tracks */}
        {artist.tracks && artist.tracks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Popular</h2>
            <div className="space-y-1">
              {artist.tracks.map((track: any, index: number) => (
                <div key={track.id} className="group">
                  <TrackRow
                    number={index + 1}
                    title={track.title}
                    artist={artist.name}
                    album={track.albums?.title || 'Single'}
                    duration={formatDuration(track.duration_ms || 0)}
                    image={getMediaUrl(track.albums?.cover_art_url)}
                    showImage={true}
                    showAlbum={true}
                    onPlay={() => handlePlayTrack(track)}
                    onLike={() => console.log('Like track:', track.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discography */}
        {artist.albums && artist.albums.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Discography</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {artist.albums.map((album: any) => (
                <Card
                  key={album.id}
                  title={album.title}
                  subtitle={`${album.release_date ? new Date(album.release_date).getFullYear() : ''} • ${album.album_type || 'Album'}`}
                  href={`/album/${album.id}`}
                  image={getMediaUrl(album.cover_art_url)}
                  onPlay={() => (window.location.href = `/album/${album.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {artist.bio && (
          <section className="mt-12 max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="space-y-4">
              <p className="text-white/80 whitespace-pre-line">{artist.bio}</p>
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!artist.tracks || artist.tracks.length === 0) &&
          (!artist.albums || artist.albums.length === 0) && (
            <div className="text-center py-12">
              <p className="text-white/60">No content available for this artist yet</p>
            </div>
          )}
      </div>

      {/* Embed Modal */}
      {artist && (
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          type="artist"
          id={artist.id}
          title={artist.name}
        />
      )}
    </div>
  );
}
