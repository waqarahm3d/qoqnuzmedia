'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { TrackRow, TrackListHeader } from '@/components/ui/TrackRow';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon, DownloadIcon } from '@/components/icons';
import { useState } from 'react';

export default function PlaylistPage() {
  const params = useParams();
  const [isLiked, setIsLiked] = useState(false);

  // Demo data
  const playlist = {
    id: params?.id,
    name: 'Chill Vibes',
    description: 'Relax and unwind with these smooth tracks',
    cover: '',
    owner: 'John Doe',
    ownerId: 'user1',
    isPublic: true,
    totalTracks: 28,
    duration: '1 hr 45 min',
    followers: '12,345',
  };

  const tracks = [
    { id: '1', title: 'Midnight Dreams', artist: 'The Dreamers', album: 'Night Sessions', duration: '3:45', image: '' },
    { id: '2', title: 'Sunset Boulevard', artist: 'Beach Boys Redux', album: 'Coastal Sounds', duration: '4:12', image: '' },
    { id: '3', title: 'Neon Lights', artist: 'Urban Sound', album: 'Metropolitan', duration: '3:28', image: '' },
    { id: '4', title: 'Dream Catcher', artist: 'The Dreamers', album: 'Night Sessions', duration: '4:05', image: '' },
    { id: '5', title: 'Starlight', artist: 'Indie Folk', album: 'Acoustic Dreams', duration: '3:52', image: '' },
    { id: '6', title: 'Ocean Waves', artist: 'Nature Sounds', album: 'Relaxation', duration: '5:18', image: '' },
    { id: '7', title: 'Coffee Shop Jazz', artist: 'Jazz Ensemble', album: 'Café Moods', duration: '4:35', image: '' },
    { id: '8', title: 'Rainy Day', artist: 'Ambient Collective', album: 'Weather Sounds', duration: '3:58', image: '' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-900/40 to-background px-4 lg:px-8 pt-16 pb-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          {/* Playlist Cover */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 shadow-2xl">
            {playlist.cover ? (
              <Image
                src={playlist.cover}
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
              {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
            </p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-white/80 mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <a
                href={`/user/${playlist.ownerId}`}
                className="font-semibold hover:underline"
              >
                {playlist.owner}
              </a>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{playlist.followers} likes</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{playlist.totalTracks} songs</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{playlist.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Tracks */}
      <div className="px-4 lg:px-8 py-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <Button size="lg" className="!w-14 !h-14 !p-0">
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
            <DownloadIcon size={28} />
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreIcon size={32} />
          </button>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          <TrackListHeader />
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              number={index + 1}
              title={track.title}
              artist={track.artist}
              album={track.album}
              duration={track.duration}
              image={track.image}
              showImage={true}
              onPlay={() => console.log('Play track:', track.id)}
              onLike={() => console.log('Like track:', track.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
