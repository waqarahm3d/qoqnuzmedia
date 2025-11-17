'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { TrackRow, TrackListHeader } from '@/components/ui/TrackRow';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon } from '@/components/icons';
import { useState, useEffect } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { getMediaUrl } from '@/lib/media-utils';

export default function AlbumPage() {
  const params = useParams();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const { playTrack, setQueue } = usePlayer();

  useEffect(() => {
    fetchAlbum();
  }, [params?.id]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch album');
      const data = await response.json();
      setAlbum(data.album);
    } catch (error) {
      console.error('Failed to fetch album:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artists?.name || album?.artists?.name || 'Unknown Artist',
      artistId: track.artists?.id || album?.artists?.id,
      album: album?.title || 'Unknown Album',
      albumId: album?.id,
      image: getMediaUrl(album?.cover_art_url),
      duration: track.duration_ms || 0,
    });
  };

  const handlePlayAll = () => {
    if (!album?.tracks || album.tracks.length === 0) return;

    const queue = album.tracks.map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.artists?.name || album.artists?.name || 'Unknown Artist',
      artistId: track.artists?.id || album.artists?.id,
      album: album.title,
      albumId: album.id,
      image: getMediaUrl(album.cover_art_url),
      duration: track.duration_ms || 0,
    }));

    setQueue(queue);
    playTrack(queue[0]);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!album?.tracks) return '0 min';
    const totalMs = album.tracks.reduce((sum: number, track: any) => sum + (track.duration_ms || 0), 0);
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes % 60} min`;
    }
    return `${minutes} min`;
  };

  const getReleaseYear = () => {
    if (!album?.release_date) return new Date().getFullYear();
    return new Date(album.release_date).getFullYear();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Album not found</h2>
          <p className="text-white/60">The album you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-purple-900/40 to-background px-4 lg:px-8 pt-16 pb-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          {/* Album Cover */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 shadow-2xl">
            {album.cover_art_url && getMediaUrl(album.cover_art_url) ? (
              <Image
                src={getMediaUrl(album.cover_art_url)!}
                alt={album.title}
                fill
                className="object-cover rounded"
                priority
              />
            ) : (
              <div className="w-full h-full bg-surface rounded flex items-center justify-center">
                <span className="text-6xl text-white/20">♪</span>
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase mb-2">{album.album_type || 'Album'}</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">{album.title}</h1>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <a
                href={`/artist/${album.artists?.id}`}
                className="font-semibold hover:underline"
              >
                {album.artists?.name || 'Unknown Artist'}
              </a>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{getReleaseYear()}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{album.tracks?.length || 0} songs</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{getTotalDuration()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Tracks */}
      <div className="px-4 lg:px-8 py-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <Button size="lg" className="!w-14 !h-14 !p-0" onClick={handlePlayAll}>
            <PlayIcon size={24} />
          </Button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isLiked ? (
              <HeartFilledIcon size={32} className="text-primary" />
            ) : (
              <HeartIcon size={32} />
            )}
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreIcon size={32} />
          </button>
        </div>

        {/* Track List */}
        {album.tracks && album.tracks.length > 0 ? (
          <div className="space-y-1">
            <TrackListHeader showAlbum={false} />
            {album.tracks.map((track: any, index: number) => (
              <TrackRow
                key={track.id}
                number={index + 1}
                title={track.title}
                artist={track.artists?.name || album.artists?.name || 'Unknown Artist'}
                duration={formatDuration(track.duration_ms || 0)}
                showImage={false}
                showAlbum={false}
                onPlay={() => handlePlayTrack(track)}
                onLike={() => console.log('Like track:', track.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">No tracks in this album yet</p>
          </div>
        )}

        {/* Album Info */}
        <div className="mt-12 text-sm text-white/60">
          <p className="mb-1">
            {album.release_date
              ? new Date(album.release_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
          </p>
          <p>&copy; {getReleaseYear()} Qoqnuz Music</p>
          <p>&reg; {getReleaseYear()} {album.artists?.name}</p>
        </div>
      </div>
    </div>
  );
}
