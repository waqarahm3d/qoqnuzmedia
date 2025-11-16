'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { TrackRow, TrackListHeader } from '@/components/ui/TrackRow';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon, ClockIcon } from '@/components/icons';
import { useState } from 'react';

export default function AlbumPage() {
  const params = useParams();
  const [isLiked, setIsLiked] = useState(false);

  // Demo data
  const album = {
    id: params?.id,
    title: 'Midnight Dreams',
    artist: 'The Dreamers',
    artistId: '1',
    cover: '',
    year: '2024',
    type: 'Album',
    totalTracks: 12,
    duration: '45 min',
  };

  const tracks = [
    { id: '1', title: 'Intro', artist: 'The Dreamers', duration: '1:23' },
    { id: '2', title: 'Midnight Dreams', artist: 'The Dreamers', duration: '3:45' },
    { id: '3', title: 'Sunset Boulevard', artist: 'The Dreamers', duration: '4:12' },
    { id: '4', title: 'Neon Lights', artist: 'The Dreamers', duration: '3:28' },
    { id: '5', title: 'Dream Catcher', artist: 'The Dreamers', duration: '4:05' },
    { id: '6', title: 'Starlight', artist: 'The Dreamers', duration: '3:52' },
    { id: '7', title: 'City Nights', artist: 'The Dreamers', duration: '4:18' },
    { id: '8', title: 'Electric Dreams', artist: 'The Dreamers', duration: '3:35' },
    { id: '9', title: 'Moonlight Serenade', artist: 'The Dreamers', duration: '4:42' },
    { id: '10', title: 'Dancing Shadows', artist: 'The Dreamers', duration: '3:58' },
    { id: '11', title: 'Twilight Zone', artist: 'The Dreamers', duration: '4:15' },
    { id: '12', title: 'Dream On (Outro)', artist: 'The Dreamers', duration: '2:45' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-purple-900/40 to-background px-4 lg:px-8 pt-16 pb-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          {/* Album Cover */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 shadow-2xl">
            {album.cover ? (
              <Image
                src={album.cover}
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
            <p className="text-sm font-semibold uppercase mb-2">{album.type}</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">{album.title}</h1>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <a
                href={`/artist/${album.artistId}`}
                className="font-semibold hover:underline"
              >
                {album.artist}
              </a>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{album.year}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{album.totalTracks} songs</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{album.duration}</span>
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
            <MoreIcon size={32} />
          </button>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          <TrackListHeader showAlbum={false} />
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              number={index + 1}
              title={track.title}
              artist={track.artist}
              duration={track.duration}
              showImage={false}
              showAlbum={false}
              onPlay={() => console.log('Play track:', track.id)}
              onLike={() => console.log('Like track:', track.id)}
            />
          ))}
        </div>

        {/* Album Info */}
        <div className="mt-12 text-sm text-white/60">
          <p className="mb-1">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p>&copy; 2024 Qoqnuz Music</p>
          <p>&reg; 2024 {album.artist}</p>
        </div>
      </div>
    </div>
  );
}
