'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TrackRow, TrackListHeader } from '@/components/ui/TrackRow';
import { PlayIcon, MoreIcon, ShareIcon } from '@/components/icons';
import { useState } from 'react';

export default function ArtistPage() {
  const params = useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  // Demo data
  const artist = {
    id: params?.id,
    name: 'The Dreamers',
    image: '',
    verified: true,
    monthlyListeners: '2,345,678',
    followers: '1,234,567',
  };

  const popularTracks = [
    { id: '1', title: 'Midnight Dreams', artist: 'The Dreamers', album: 'Night Sessions', duration: '3:45', plays: '12M' },
    { id: '2', title: 'Sunset Boulevard', artist: 'The Dreamers', album: 'Night Sessions', duration: '4:12', plays: '8M' },
    { id: '3', title: 'Neon Lights', artist: 'The Dreamers', album: 'City Sounds', duration: '3:28', plays: '6M' },
    { id: '4', title: 'Dream Catcher', artist: 'The Dreamers', album: 'Night Sessions', duration: '4:05', plays: '5M' },
    { id: '5', title: 'Starlight', artist: 'The Dreamers', album: 'City Sounds', duration: '3:52', plays: '4M' },
  ];

  const albums = [
    { id: '1', title: 'Night Sessions', artist: 'The Dreamers', year: '2024' },
    { id: '2', title: 'City Sounds', artist: 'The Dreamers', year: '2023' },
    { id: '3', title: 'Urban Dreams', artist: 'The Dreamers', year: '2022' },
  ];

  const relatedArtists = [
    { id: '1', name: 'Night Owls' },
    { id: '2', name: 'Dream Collective' },
    { id: '3', name: 'Urban Legends' },
    { id: '4', name: 'Sound Waves' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-80 lg:h-96 bg-gradient-to-b from-purple-900 to-background">
        {artist.image ? (
          <div className="absolute inset-0">
            <Image
              src={artist.image}
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
            <span className="text-sm font-semibold">Verified Artist</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-4">{artist.name}</h1>
          <p className="text-sm text-white/80">{artist.monthlyListeners} monthly listeners</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 lg:px-8 py-6 bg-gradient-to-b from-background/60 to-background">
        <div className="flex items-center gap-4 mb-8">
          <Button size="lg" className="!w-14 !h-14 !p-0">
            <PlayIcon size={24} />
          </Button>
          <Button
            variant={isFollowing ? 'ghost' : 'secondary'}
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreIcon size={24} />
          </button>
        </div>

        {/* Popular Tracks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Popular</h2>
          <div className="space-y-1">
            {popularTracks.map((track, index) => (
              <div key={track.id} className="group">
                <TrackRow
                  number={index + 1}
                  title={track.title}
                  artist={track.artist}
                  album={track.album}
                  duration={track.duration}
                  showImage={false}
                  showAlbum={false}
                  onPlay={() => console.log('Play track:', track.id)}
                  onLike={() => console.log('Like track:', track.id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Discography */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Discography</h2>
            <a href={`/artist/${artist.id}/discography`} className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Show all
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <Card
                key={album.id}
                title={album.title}
                subtitle={`${album.year} • Album`}
                href={`/album/${album.id}`}
                onPlay={() => console.log('Play album:', album.id)}
              />
            ))}
          </div>
        </section>

        {/* Fans Also Like */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Fans also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {relatedArtists.map((relatedArtist) => (
              <Card
                key={relatedArtist.id}
                title={relatedArtist.name}
                subtitle="Artist"
                href={`/artist/${relatedArtist.id}`}
                type="circle"
              />
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">About</h2>
          <div className="space-y-4">
            <p className="text-white/80">
              The Dreamers are an innovative musical collective pushing the boundaries of contemporary sound.
              Their unique blend of electronic and acoustic elements has captivated audiences worldwide.
            </p>
            <div className="flex items-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-bold">{artist.followers}</div>
                <div className="text-white/60">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{artist.monthlyListeners}</div>
                <div className="text-white/60">Monthly Listeners</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
