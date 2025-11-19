'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { MusicIcon } from '@/components/icons';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  image_url: string | null;
  is_active: boolean;
}

// Genre Chip Component with three states and dramatic animations
function GenreChip({
  genre,
  disabled = false,
  onClick
}: {
  genre: Genre;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const color = genre.color || '#ff4a14';

  // Create lighter version of color for effects
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
  };

  const lightColor = lightenColor(color, 30);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`
        relative flex-shrink-0 flex items-center gap-3
        px-5 py-3 rounded-full
        border-2 transition-all duration-300 ease-out
        ${disabled
          ? 'opacity-40 grayscale cursor-not-allowed border-gray-600 bg-gray-800'
          : 'cursor-pointer'
        }
        ${!disabled && isHovered
          ? 'scale-110 -translate-y-1'
          : 'scale-100 translate-y-0'
        }
      `}
      style={{
        '--chip-color': color,
        '--chip-color-light': lightColor,
        borderColor: disabled ? undefined : color,
        backgroundColor: disabled ? undefined : `${color}15`,
        boxShadow: !disabled && isHovered
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 2px 8px rgba(0,0,0,0.2)`,
      } as React.CSSProperties}
    >
      {/* Shimmer overlay on hover */}
      {!disabled && isHovered && (
        <div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'chip-shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Glow ring on hover */}
      {!disabled && isHovered && (
        <div
          className="absolute -inset-1 rounded-full pointer-events-none animate-chip-pulse"
          style={{
            border: `2px solid ${color}60`,
          }}
        />
      )}

      {/* Icon */}
      <div
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
          transition-transform duration-300
          ${!disabled && isHovered ? 'scale-110' : 'scale-100'}
        `}
        style={{
          backgroundColor: disabled ? '#4b5563' : `${color}30`,
        }}
      >
        {genre.image_url ? (
          <img
            src={getMediaUrl(genre.image_url)}
            alt={genre.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <MusicIcon
            size={16}
            className={disabled ? 'text-gray-500' : 'text-white'}
          />
        )}

        {/* Icon glow on hover */}
        {!disabled && isHovered && (
          <div
            className="absolute inset-0 rounded-full animate-chip-glow"
            style={{ '--chip-color': color } as React.CSSProperties}
          />
        )}
      </div>

      {/* Text */}
      <span
        className={`
          font-semibold text-sm whitespace-nowrap
          transition-all duration-300
          ${disabled ? 'text-gray-500' : 'text-white'}
        `}
        style={{
          textShadow: !disabled && isHovered ? `0 0 10px ${color}` : 'none',
        }}
      >
        {genre.name}
      </span>

      {/* Floating particles on hover */}
      {!disabled && isHovered && (
        <>
          <span
            className="absolute w-1 h-1 rounded-full animate-chip-float"
            style={{
              backgroundColor: color,
              top: '20%',
              right: '15%',
              animationDelay: '0s',
            }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full animate-chip-float"
            style={{
              backgroundColor: lightColor,
              bottom: '25%',
              left: '20%',
              animationDelay: '0.5s',
            }}
          />
          <span
            className="absolute w-1 h-1 rounded-full animate-chip-float"
            style={{
              backgroundColor: color,
              top: '30%',
              left: '30%',
              animationDelay: '1s',
            }}
          />
        </>
      )}
    </button>
  );
}

export default function GenreExplorePage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (response.ok) {
        const data = await response.json();
        setGenres(data.genres || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = (genre: Genre) => {
    router.push(`/genre/${genre.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-black mb-2">
          Explore Genres
        </h1>
        <p className="text-white/60">
          Experimental chip-based genre UI with dramatic animations
        </p>
        <p className="text-xs text-primary mt-2">
          Hover over chips to see animations - This is an experimental page
        </p>
      </div>

      {/* Active Genres - Horizontal Scroll */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Genre</h2>
        <div className="relative">
          {/* Gradient fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrollable container */}
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {genres.filter(g => g.is_active !== false).map((genre) => (
              <GenreChip
                key={genre.id}
                genre={genre}
                onClick={() => handleGenreClick(genre)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section - Different States */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Chip States Demo</h2>
        <div className="bg-surface/50 rounded-xl p-6">
          <div className="space-y-6">
            {/* Default State */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
                Default State
              </h3>
              <div className="flex gap-4 flex-wrap">
                {genres.slice(0, 3).map((genre) => (
                  <GenreChip
                    key={`default-${genre.id}`}
                    genre={genre}
                    onClick={() => handleGenreClick(genre)}
                  />
                ))}
              </div>
            </div>

            {/* Hover State Info */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
                Hover State (Mouse over to see)
              </h3>
              <p className="text-white/40 text-sm">
                Hover effects include: Scale up, glow, shimmer, floating particles, and text shadow
              </p>
            </div>

            {/* Disabled State */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
                Disabled State
              </h3>
              <div className="flex gap-4 flex-wrap">
                {genres.slice(0, 3).map((genre) => (
                  <GenreChip
                    key={`disabled-${genre.id}`}
                    genre={genre}
                    disabled={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Variants */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Animation Preview</h2>
        <p className="text-white/60 mb-4">
          All chips use the same hover animations. Colors are derived from each genre's assigned color.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Scale & Lift</h3>
            <p className="text-sm text-white/60">
              Chip scales up 10% and lifts 4px on hover for a bouncy feel
            </p>
          </div>

          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Glow Effect</h3>
            <p className="text-sm text-white/60">
              Dynamic box shadow using genre color creates a neon glow
            </p>
          </div>

          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Shimmer Sweep</h3>
            <p className="text-sm text-white/60">
              Gradient animation sweeps across the chip for a shine effect
            </p>
          </div>

          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Floating Particles</h3>
            <p className="text-sm text-white/60">
              Small dots float around the chip for a magical feel
            </p>
          </div>

          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Pulse Ring</h3>
            <p className="text-sm text-white/60">
              Outer ring pulses to draw attention to the hovered chip
            </p>
          </div>

          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Text Shadow</h3>
            <p className="text-sm text-white/60">
              Genre name gets a colored glow matching the chip color
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Note */}
      <section className="mb-8">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <h3 className="font-bold mb-2 text-primary">Experimental Feature</h3>
          <p className="text-sm text-white/80">
            This is an experimental design. Compare this with the current genre display on the home page.
            If this design works better, we can integrate it into the main app.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 bg-surface text-white rounded-lg hover:bg-surface/80 transition-colors text-sm"
            >
              View Current Home
            </button>
            <button
              onClick={() => router.push('/browse')}
              className="px-4 py-2 bg-surface text-white rounded-lg hover:bg-surface/80 transition-colors text-sm"
            >
              View Browse Page
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
