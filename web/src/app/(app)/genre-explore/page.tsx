'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { MusicIcon } from '@/components/icons';
import { getGenres } from '@/lib/api/client';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  image_url: string | null;
  is_active: boolean;
}

// Chip size configurations
const chipSizes = {
  small: {
    padding: 'px-3 py-1.5',
    text: 'text-xs',
    icon: 16,
    iconContainer: 'w-5 h-5',
    gap: 'gap-1.5',
  },
  medium: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    icon: 18,
    iconContainer: 'w-6 h-6',
    gap: 'gap-2',
  },
  large: {
    padding: 'px-5 py-2.5',
    text: 'text-base',
    icon: 20,
    iconContainer: 'w-7 h-7',
    gap: 'gap-2.5',
  },
};

type ChipSize = 'small' | 'medium' | 'large';
type ChipVariant = 'solid' | 'outline';

// Proper Design System Chip Component
function GenreChip({
  genre,
  variant = 'solid',
  size = 'medium',
  selected = false,
  disabled = false,
  onClick,
}: {
  genre: Genre;
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const color = genre.color || '#ff4a14';
  const sizeConfig = chipSizes[size];

  // Get chip styles based on variant and state
  const getChipStyles = () => {
    if (disabled) {
      return {
        container: variant === 'solid'
          ? 'bg-gray-700 border-gray-700 text-gray-500 cursor-not-allowed'
          : 'bg-transparent border-gray-600 text-gray-500 cursor-not-allowed',
        icon: 'bg-gray-600',
      };
    }

    if (selected) {
      return {
        container: variant === 'solid'
          ? 'text-white cursor-pointer'
          : 'text-white cursor-pointer',
        icon: '',
      };
    }

    // Default/Enabled state
    return {
      container: variant === 'solid'
        ? 'text-white cursor-pointer hover:brightness-110 active:brightness-90'
        : 'bg-transparent text-white cursor-pointer',
      icon: variant === 'solid' ? '' : '',
    };
  };

  const styles = getChipStyles();

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      className={`
        relative inline-flex items-center flex-shrink-0
        ${sizeConfig.padding} ${sizeConfig.gap}
        rounded-full border-2
        font-medium ${sizeConfig.text}
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
        ${styles.container}
        ${isPressed && !disabled ? 'scale-95' : 'scale-100'}
        ${selected ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
      `}
      style={{
        backgroundColor: disabled
          ? undefined
          : variant === 'solid'
            ? color
            : selected
              ? `${color}20`
              : 'transparent',
        borderColor: disabled
          ? undefined
          : color,
        '--tw-ring-color': color,
      } as React.CSSProperties}
    >
      {/* Leading Icon */}
      <span
        className={`
          ${sizeConfig.iconContainer}
          rounded-full flex items-center justify-center overflow-hidden
          transition-colors duration-150
          ${styles.icon}
        `}
        style={{
          backgroundColor: disabled
            ? undefined
            : variant === 'solid'
              ? 'rgba(255,255,255,0.2)'
              : `${color}30`,
        }}
      >
        {genre.image_url ? (
          <img
            src={getMediaUrl(genre.image_url)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <MusicIcon
            size={sizeConfig.icon}
            className={disabled ? 'text-gray-500' : 'text-white'}
          />
        )}
      </span>

      {/* Label */}
      <span className="whitespace-nowrap">
        {genre.name}
      </span>
    </button>
  );
}

export default function GenreExplorePage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      setGenres(data || []);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = (genre: Genre) => {
    router.push(`/genre/${genre.id}`);
  };

  const toggleSelection = (genreId: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genreId)) {
        newSet.delete(genreId);
      } else {
        newSet.add(genreId);
      }
      return newSet;
    });
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
          Genre Chips
        </h1>
        <p className="text-white/60">
          Design System Chip Component - Following LINE Design System patterns
        </p>
      </div>

      {/* Browse Genres - Horizontal Scroll */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Genre</h2>
        <div className="relative">
          {/* Gradient fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrollable container */}
          <div
            className="flex gap-3 overflow-x-auto pb-4 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {genres.filter(g => g.is_active !== false).map((genre) => (
              <GenreChip
                key={genre.id}
                genre={genre}
                variant="solid"
                size="medium"
                onClick={() => handleGenreClick(genre)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Chip Variants */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Fill Modes</h2>
        <div className="bg-surface/50 rounded-xl p-6 space-y-6">
          {/* Solid Variant */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Solid (Default)
            </h3>
            <p className="text-white/40 text-xs mb-3">
              Stronger emphasis - used for primary actions
            </p>
            <div className="flex gap-3 flex-wrap">
              {genres.slice(0, 4).map((genre) => (
                <GenreChip
                  key={`solid-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  size="medium"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>

          {/* Outline Variant */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Outline
            </h3>
            <p className="text-white/40 text-xs mb-3">
              Weaker emphasis - used for secondary options
            </p>
            <div className="flex gap-3 flex-wrap">
              {genres.slice(0, 4).map((genre) => (
                <GenreChip
                  key={`outline-${genre.id}`}
                  genre={genre}
                  variant="outline"
                  size="medium"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chip Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Sizes</h2>
        <div className="bg-surface/50 rounded-xl p-6 space-y-6">
          {/* Small */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Small
            </h3>
            <div className="flex gap-3 flex-wrap items-center">
              {genres.slice(0, 3).map((genre) => (
                <GenreChip
                  key={`small-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  size="small"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>

          {/* Medium */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Medium (Default)
            </h3>
            <div className="flex gap-3 flex-wrap items-center">
              {genres.slice(0, 3).map((genre) => (
                <GenreChip
                  key={`medium-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  size="medium"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>

          {/* Large */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Large
            </h3>
            <div className="flex gap-3 flex-wrap items-center">
              {genres.slice(0, 3).map((genre) => (
                <GenreChip
                  key={`large-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  size="large"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chip States */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">States</h2>
        <div className="bg-surface/50 rounded-xl p-6 space-y-6">
          {/* Enabled */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Enabled (Default)
            </h3>
            <div className="flex gap-3 flex-wrap">
              {genres.slice(0, 2).map((genre) => (
                <GenreChip
                  key={`enabled-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
              {genres.slice(0, 2).map((genre) => (
                <GenreChip
                  key={`enabled-outline-${genre.id}`}
                  genre={genre}
                  variant="outline"
                  onClick={() => handleGenreClick(genre)}
                />
              ))}
            </div>
          </div>

          {/* Selected */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Selected (Click to toggle)
            </h3>
            <div className="flex gap-3 flex-wrap">
              {genres.slice(0, 4).map((genre) => (
                <GenreChip
                  key={`selected-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  selected={selectedGenres.has(genre.id)}
                  onClick={() => toggleSelection(genre.id)}
                />
              ))}
            </div>
          </div>

          {/* Disabled */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              Disabled
            </h3>
            <div className="flex gap-3 flex-wrap">
              {genres.slice(0, 2).map((genre) => (
                <GenreChip
                  key={`disabled-${genre.id}`}
                  genre={genre}
                  variant="solid"
                  disabled
                />
              ))}
              {genres.slice(0, 2).map((genre) => (
                <GenreChip
                  key={`disabled-outline-${genre.id}`}
                  genre={genre}
                  variant="outline"
                  disabled
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive States Info */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Interactive Behaviors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Hover</h3>
            <p className="text-sm text-white/60">
              Brightness increases slightly to indicate interactivity
            </p>
          </div>
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Pressed</h3>
            <p className="text-sm text-white/60">
              Scales down to 95% to simulate physical button press
            </p>
          </div>
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Focus</h3>
            <p className="text-sm text-white/60">
              Ring outline appears for keyboard navigation accessibility
            </p>
          </div>
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Selected</h3>
            <p className="text-sm text-white/60">
              Ring with offset indicates active selection state
            </p>
          </div>
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Disabled</h3>
            <p className="text-sm text-white/60">
              Grayscale colors and not-allowed cursor
            </p>
          </div>
          <div className="bg-surface/30 rounded-lg p-4">
            <h3 className="font-bold mb-2">Transitions</h3>
            <p className="text-sm text-white/60">
              150ms ease-out for smooth, responsive feel
            </p>
          </div>
        </div>
      </section>

      {/* Anatomy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Chip Anatomy</h2>
        <div className="bg-surface/50 rounded-xl p-6">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              {genres[0] && (
                <GenreChip
                  genre={genres[0]}
                  variant="solid"
                  size="large"
                />
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span><strong>Container</strong> - Rounded pill shape with border</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span><strong>Leading Icon</strong> - SVG or uploaded image</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span><strong>Label Text</strong> - Genre name, concise and clear</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="mb-8">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <h3 className="font-bold mb-2 text-primary">Experimental Feature</h3>
          <p className="text-sm text-white/80 mb-3">
            This follows design system standards: proper states, sizes, and variants.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 bg-surface text-white rounded-lg hover:bg-surface/80 transition-colors text-sm"
            >
              View Home Page
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
