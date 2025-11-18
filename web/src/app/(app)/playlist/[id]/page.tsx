'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { TrackRow, TrackListHeader } from '@/components/ui/TrackRow';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon, DownloadIcon, ShareIcon, UserIcon } from '@/components/icons';
import { useState, useEffect } from 'react';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMediaUrl } from '@/lib/media-utils';
import { EmbedModal } from '@/components/ui/EmbedModal';
import { CollaboratorList } from '@/components/playlists/CollaboratorList';

export default function PlaylistPage() {
  const params = useParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const { playTrack, setQueue } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    fetchPlaylist();
  }, [params?.id]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      const data = await response.json();
      setPlaylist(data.playlist);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (trackData: any) => {
    const track = trackData.track || trackData.tracks;
    if (!track) return;

    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artists?.name || 'Unknown Artist',
      artistId: track.artists?.id,
      album: track.albums?.title || 'Unknown Album',
      albumId: track.albums?.id,
      image: getMediaUrl(track.albums?.cover_art_url),
      duration: track.duration_ms || 0,
    });
  };

  const handlePlayAll = () => {
    if (!playlist?.playlist_tracks || playlist.playlist_tracks.length === 0) return;

    const queue = playlist.playlist_tracks
      .map((item: any) => {
        const track = item.track || item.tracks;
        if (!track) return null;

        return {
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          artistId: track.artists?.id,
          album: track.albums?.title || 'Unknown Album',
          albumId: track.albums?.id,
          image: getMediaUrl(track.albums?.cover_art_url),
          duration: track.duration_ms || 0,
        };
      })
      .filter(Boolean);

    if (queue.length > 0) {
      setQueue(queue);
      playTrack(queue[0]);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist?.playlist_tracks) return '0 min';
    const totalMs = playlist.playlist_tracks.reduce((sum: number, item: any) => {
      const track = item.track || item.tracks;
      return sum + (track?.duration_ms || 0);
    }, 0);
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes % 60} min`;
    }
    return `${minutes} min`;
  };

  const handleShare = async () => {
    const shareData = {
      title: playlist.name,
      text: `Check out "${playlist.name}" playlist on Qoqnuz Music`,
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

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
          <p className="text-white/60">The playlist you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const trackCount = playlist.playlist_tracks?.length || 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-900/40 to-background px-4 lg:px-8 pt-16 pb-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          {/* Playlist Cover */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 shadow-2xl">
            {playlist.cover_url && getMediaUrl(playlist.cover_url) ? (
              <Image
                src={getMediaUrl(playlist.cover_url)!}
                alt={playlist.name}
                fill
                className="object-cover rounded"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-900 rounded flex items-center justify-center">
                <span className="text-6xl text-white/60">♪</span>
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase mb-2">
              {playlist.is_public ? 'Public Playlist' : 'Private Playlist'}
            </p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-white/80 mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-semibold">{playlist.owner_id === user?.id ? 'You' : 'Playlist'}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{trackCount} songs</span>
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
          <button
            onClick={handleShare}
            className="text-white/60 hover:text-white transition-colors"
            title="Share playlist"
          >
            <ShareIcon size={32} />
          </button>
          <button
            onClick={() => setShowEmbedModal(true)}
            className="text-white/60 hover:text-white transition-colors"
            title="Embed playlist"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
          <button
            onClick={() => setShowCollaborators(true)}
            className="text-white/60 hover:text-white transition-colors"
            title="Manage collaborators"
          >
            <UserIcon size={32} />
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <DownloadIcon size={28} />
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreIcon size={32} />
          </button>
        </div>

        {/* Track List */}
        {playlist.playlist_tracks && playlist.playlist_tracks.length > 0 ? (
          <div className="space-y-1">
            <TrackListHeader />
            {playlist.playlist_tracks.map((item: any, index: number) => {
              const track = item.track || item.tracks;
              if (!track) return null;

              return (
                <TrackRow
                  key={`${track.id}-${index}`}
                  number={index + 1}
                  title={track.title}
                  artist={track.artists?.name || 'Unknown Artist'}
                  album={track.albums?.title || 'Unknown Album'}
                  duration={formatDuration(track.duration_ms || 0)}
                  image={getMediaUrl(track.albums?.cover_art_url)}
                  showImage={true}
                  onPlay={() => handlePlayTrack(item)}
                  onLike={() => console.log('Like track:', track.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">This playlist is empty</p>
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {playlist && (
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          type="playlist"
          id={playlist.id}
          title={playlist.name}
        />
      )}

      {/* Collaborators Modal */}
      {showCollaborators && playlist && (
        <CollaboratorList
          playlistId={playlist.id}
          isOwner={playlist.owner_id === user?.id}
          onClose={() => setShowCollaborators(false)}
        />
      )}
    </div>
  );
}
