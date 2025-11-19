'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-utils';
import { useAlbums, useArtists, usePlaylists, useTracks, useGenres } from '@/lib/hooks/useMusic';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, HeartIcon } from '@/components/icons';

// SIFloatingCollection-style Physics-based Floating Bubbles
// Inspired by Apple Music genre selection

// Color palette
const COLORS = {
  primary: '#2427BA',
  secondary: '#148784',
  accent: '#FB4E2F',
  background: '#0D0D1A',
  surface: '#1A1A2E',
};

// Physics constants
const PHYSICS = {
  gravity: 0.02,
  friction: 0.99,
  bounceDamping: 0.7,
  repulsion: 0.5,
  attraction: 0.001,
  maxVelocity: 3,
  floatStrength: 0.15,
};

// Bubble physics state
interface BubbleState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  name: string;
  isSelected: boolean;
}

// Floating Bubbles Container Component
function FloatingBubbles({
  genres,
  selectedGenres,
  onToggleGenre,
  containerRef,
}: {
  genres: any[];
  selectedGenres: string[];
  onToggleGenre: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const animationRef = useRef<number>();
  const bubblesRef = useRef<BubbleState[]>([]);

  // Initialize bubbles with random positions and velocities
  useEffect(() => {
    if (!genres || genres.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const colors = [COLORS.primary, COLORS.secondary, COLORS.accent, '#6B46C1', '#D53F8C', '#38B2AC'];

    const initialBubbles: BubbleState[] = genres.map((genre: any, index: number) => {
      // Size based on index (popularity simulation)
      const radius = Math.max(30, Math.min(50, 50 - index * 1.5));

      // Random initial position within container
      const x = Math.random() * (rect.width - radius * 2) + radius;
      const y = Math.random() * (rect.height - radius * 2) + radius;

      // Random initial velocity
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;

      return {
        id: genre.id,
        x,
        y,
        vx,
        vy,
        radius,
        color: genre.color || colors[index % colors.length],
        name: genre.name,
        isSelected: selectedGenres.includes(genre.id),
      };
    });

    setBubbles(initialBubbles);
    bubblesRef.current = initialBubbles;
  }, [genres, containerRef]);

  // Update selection state
  useEffect(() => {
    bubblesRef.current = bubblesRef.current.map(bubble => ({
      ...bubble,
      isSelected: selectedGenres.includes(bubble.id),
    }));
    setBubbles([...bubblesRef.current]);
  }, [selectedGenres]);

  // Physics simulation loop
  const simulate = useCallback(() => {
    if (!containerRef.current || bubblesRef.current.length === 0) {
      animationRef.current = requestAnimationFrame(simulate);
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    bubblesRef.current = bubblesRef.current.map((bubble, i) => {
      let { x, y, vx, vy, radius, isSelected } = bubble;

      // Apply floating force (gentle upward drift)
      vy -= PHYSICS.floatStrength * (Math.random() - 0.3);

      // Apply slight attraction to center
      const dx = centerX - x;
      const dy = centerY - y;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      if (distToCenter > 50) {
        vx += (dx / distToCenter) * PHYSICS.attraction * distToCenter;
        vy += (dy / distToCenter) * PHYSICS.attraction * distToCenter;
      }

      // Apply gentle gravity
      vy += PHYSICS.gravity;

      // Collision detection with other bubbles
      for (let j = 0; j < bubblesRef.current.length; j++) {
        if (i === j) continue;

        const other = bubblesRef.current[j];
        const dx = other.x - x;
        const dy = other.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = radius + other.radius + 4; // 4px gap

        if (dist < minDist && dist > 0) {
          // Collision response - push apart
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Move bubbles apart
          x -= nx * overlap * 0.5;
          y -= ny * overlap * 0.5;

          // Apply repulsion force
          vx -= nx * PHYSICS.repulsion;
          vy -= ny * PHYSICS.repulsion;
        }
      }

      // Apply friction
      vx *= PHYSICS.friction;
      vy *= PHYSICS.friction;

      // Clamp velocity
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > PHYSICS.maxVelocity) {
        vx = (vx / speed) * PHYSICS.maxVelocity;
        vy = (vy / speed) * PHYSICS.maxVelocity;
      }

      // Update position
      x += vx;
      y += vy;

      // Boundary collision
      if (x - radius < 0) {
        x = radius;
        vx = Math.abs(vx) * PHYSICS.bounceDamping;
      }
      if (x + radius > rect.width) {
        x = rect.width - radius;
        vx = -Math.abs(vx) * PHYSICS.bounceDamping;
      }
      if (y - radius < 0) {
        y = radius;
        vy = Math.abs(vy) * PHYSICS.bounceDamping;
      }
      if (y + radius > rect.height) {
        y = rect.height - radius;
        vy = -Math.abs(vy) * PHYSICS.bounceDamping;
      }

      return { ...bubble, x, y, vx, vy };
    });

    setBubbles([...bubblesRef.current]);
    animationRef.current = requestAnimationFrame(simulate);
  }, [containerRef]);

  // Start/stop animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulate]);

  // Handle bubble click with impulse
  const handleBubbleClick = (bubble: BubbleState, e: React.MouseEvent) => {
    e.stopPropagation();

    // Apply impulse on click
    const index = bubblesRef.current.findIndex(b => b.id === bubble.id);
    if (index !== -1) {
      bubblesRef.current[index].vy -= 3; // Bounce up on click
      bubblesRef.current[index].vx += (Math.random() - 0.5) * 2;
    }

    onToggleGenre(bubble.id);
  };

  return (
    <>
      {bubbles.map((bubble) => {
        // Selected bubbles are 1.5x larger with zoom effect
        const displayRadius = bubble.isSelected ? bubble.radius * 1.5 : bubble.radius;
        const scale = bubble.isSelected ? 1.2 : 1;

        return (
          <button
            key={bubble.id}
            onClick={(e) => handleBubbleClick(bubble, e)}
            className="absolute rounded-full flex items-center justify-center font-medium select-none"
            style={{
              left: bubble.x,
              top: bubble.y,
              width: displayRadius * 2,
              height: displayRadius * 2,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
              background: bubble.isSelected
                ? `radial-gradient(circle at 30% 30%, ${bubble.color}, ${bubble.color}dd)`
                : `radial-gradient(circle at 30% 30%, ${bubble.color}cc, ${bubble.color}88)`,
              boxShadow: bubble.isSelected
                ? `0 0 60px ${bubble.color}, 0 0 100px ${bubble.color}80, 0 0 140px ${bubble.color}40, 0 8px 32px rgba(0,0,0,0.4), inset 0 -4px 20px ${bubble.color}60`
                : `0 4px 20px ${bubble.color}40, inset 0 -4px 12px ${bubble.color}20`,
              border: bubble.isSelected ? `4px solid white` : '2px solid transparent',
              fontSize: bubble.isSelected
                ? (bubble.radius < 35 ? '12px' : bubble.radius < 45 ? '14px' : '16px')
                : (bubble.radius < 35 ? '9px' : bubble.radius < 45 ? '11px' : '13px'),
              fontWeight: bubble.isSelected ? '600' : '500',
              color: 'white',
              textShadow: bubble.isSelected
                ? '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.3)'
                : '0 1px 3px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              zIndex: bubble.isSelected ? 20 : 1,
            }}
            aria-label={`Select ${bubble.name} genre`}
            aria-pressed={bubble.isSelected}
          >
            <span className="px-2 text-center leading-tight truncate">
              {bubble.name}
            </span>
          </button>
        );
      })}
    </>
  );
}

export default function HomeExperimentalPage() {
  const router = useRouter();
  const { albums, loading: albumsLoading } = useAlbums(20);
  const { artists, loading: artistsLoading } = useArtists(12);
  const { playlists, loading: playlistsLoading } = usePlaylists(12);
  const { tracks, loading: tracksLoading } = useTracks(30);
  const { genres, loading: genresLoading } = useGenres();
  const { setQueue, playTrack, currentTrack, isPlaying, togglePlayPause, skipForward, skipBackward, currentTime, duration } = usePlayer();

  const bubbleContainerRef = useRef<HTMLDivElement>(null);

  // Playlist generator state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [generatorStep, setGeneratorStep] = useState<'genres' | 'recommendations'>('genres');
  const [activeView, setActiveView] = useState<'home' | 'generator' | 'favorites' | 'settings'>('home');

  const loading = albumsLoading || artistsLoading || playlistsLoading || tracksLoading || genresLoading;

  const toggleGenreSelection = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handlePlayTrack = (track: any) => {
    const formattedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artists?.name || 'Unknown Artist',
      artistId: track.artists?.id,
      album: track.albums?.title || 'Unknown Album',
      albumId: track.albums?.id,
      image: getMediaUrl(track.albums?.cover_art_url),
      duration: track.duration_ms || 0,
    };

    const formattedQueue = tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artists?.name || 'Unknown Artist',
      artistId: t.artists?.id,
      album: t.albums?.title || 'Unknown Album',
      albumId: t.albums?.id,
      image: getMediaUrl(t.albums?.cover_art_url),
      duration: t.duration_ms || 0,
    }));

    setQueue(formattedQueue);
    playTrack(formattedTrack, true);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get recommendations based on selected genres
  const recommendations = tracks.filter((track: any) => {
    if (selectedGenres.length === 0) return true;
    return true;
  }).slice(0, 12);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: COLORS.accent }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.background} 100%)` }}>
      {/* Left Sidebar - Icon Navigation */}
      <aside className="w-20 flex-shrink-0 flex flex-col items-center py-8 border-r border-white/5">
        {/* Logo */}
        <div className="mb-12">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
          >
            <span className="text-white font-bold text-lg">Q</span>
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          {[
            { id: 'home', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            ), label: 'Home' },
            { id: 'generator', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            ), label: 'Generator' },
            { id: 'favorites', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            ), label: 'Favorites' },
            { id: 'settings', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            ), label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeView === item.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/80'
              }`}
              style={{
                background: activeView === item.id
                  ? `linear-gradient(135deg, ${COLORS.primary}80, ${COLORS.secondary}80)`
                  : 'transparent',
              }}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="mt-auto">
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeView === 'home' && (
          <div className="p-8">
            {/* Hero Section */}
            <section className="mb-10">
              <div
                className="relative rounded-3xl overflow-hidden p-8 min-h-[280px]"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.accent}80 100%)`
                }}
              >
                <div className="relative z-10 max-w-md">
                  <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                    All in your hands,<br />choose music
                  </h1>
                  <p className="text-white/80 mb-6">
                    Create personalized playlists by selecting your favorite genres. Our algorithm will do the rest.
                  </p>
                  <button
                    onClick={() => setActiveView('generator')}
                    className="px-6 py-3 bg-white font-semibold rounded-full hover:scale-105 transition-transform"
                    style={{ color: COLORS.primary }}
                  >
                    Start Creating
                  </button>
                </div>

                {/* Decorative bubbles */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
                  <div className="relative w-64 h-64">
                    <div className="absolute w-20 h-20 rounded-full animate-bounce" style={{ background: `${COLORS.accent}80`, top: '10%', right: '20%', animationDuration: '3s' }} />
                    <div className="absolute w-16 h-16 rounded-full animate-bounce" style={{ background: `${COLORS.secondary}80`, top: '50%', right: '10%', animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    <div className="absolute w-12 h-12 rounded-full animate-bounce" style={{ background: `${COLORS.primary}80`, bottom: '20%', right: '30%', animationDuration: '2s', animationDelay: '1s' }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Trending Tracks */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Trending Now</h2>
                <button className="text-sm hover:opacity-80 transition-opacity" style={{ color: COLORS.secondary }}>
                  See all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tracks.slice(0, 8).map((track: any, index: number) => (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group text-left"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <span className="w-6 text-center text-sm text-white/40 font-medium">
                      {index + 1}
                    </span>
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {track.albums?.cover_art_url ? (
                        <img src={getMediaUrl(track.albums.cover_art_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayIcon size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white"
                         style={{ color: currentTrack?.id === track.id ? COLORS.accent : undefined }}>
                        {track.title}
                      </p>
                      <p className="text-xs text-white/50 truncate">{track.artists?.name}</p>
                    </div>
                    <span className="text-xs text-white/40">{formatTime(track.duration_ms || 0)}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Popular Albums */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Popular Albums</h2>
                <button className="text-sm hover:opacity-80 transition-opacity" style={{ color: COLORS.secondary }}>
                  See all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.slice(0, 6).map((album: any) => (
                  <button
                    key={album.id}
                    onClick={() => router.push(`/album/${album.id}`)}
                    className="group text-left"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                      {album.cover_art_url ? (
                        <img
                          src={getMediaUrl(album.cover_art_url)}
                          alt={album.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: COLORS.accent }}>
                          <PlayIcon size={20} className="text-white ml-1" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-white truncate">{album.title}</h3>
                    <p className="text-xs text-white/50 truncate">{album.artists?.name}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === 'generator' && (
          <div className="h-full flex flex-col">
            {generatorStep === 'genres' ? (
              <>
                {/* Mobile: Full screen bubbles experience */}
                {/* Desktop: Contained view */}

                {/* Header - fixed on mobile */}
                <div className="text-center py-6 px-4 md:py-8 md:px-8 relative z-30 bg-gradient-to-b from-black/80 to-transparent md:bg-transparent">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Playlist Generator</h2>
                  <p className="text-white/60 text-sm md:text-base">Tap bubbles to select your favorite genres</p>
                </div>

                {/* Floating Bubbles Container - Full screen on mobile */}
                <div
                  ref={bubbleContainerRef}
                  className="flex-1 relative overflow-hidden
                    fixed inset-0 md:relative md:inset-auto
                    md:mx-8 md:mb-8 md:rounded-2xl
                    touch-pan-y"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    minHeight: '400px',
                  }}
                >
                  <FloatingBubbles
                    genres={genres}
                    selectedGenres={selectedGenres}
                    onToggleGenre={toggleGenreSelection}
                    containerRef={bubbleContainerRef}
                  />
                </div>

                {/* Action Button - fixed at bottom on mobile */}
                <div className="text-center py-6 px-4 md:pb-8 md:px-8
                  fixed bottom-0 left-0 right-0 md:relative
                  bg-gradient-to-t from-black/90 via-black/60 to-transparent md:bg-transparent
                  z-30">
                  <button
                    onClick={() => setGeneratorStep('recommendations')}
                    disabled={selectedGenres.length === 0}
                    className="px-8 py-3 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
                  >
                    Generate Playlist →
                  </button>
                  {selectedGenres.length > 0 && (
                    <p className="text-sm text-white/40 mt-2 md:mt-3">{selectedGenres.length} genres selected</p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8">
                {/* Recommendations Step */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Playlist</h2>
                    <p className="text-white/60 text-sm">Based on your selected genres</p>
                  </div>
                  <button
                    onClick={() => setGeneratorStep('genres')}
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: COLORS.secondary }}
                  >
                    ← Change genres
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  {recommendations.map((track: any, index: number) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group text-left"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="w-6 text-center text-sm text-white/40">{index + 1}</span>
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {track.albums?.cover_art_url ? (
                          <img src={getMediaUrl(track.albums.cover_art_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{track.title}</p>
                        <p className="text-xs text-white/50 truncate">{track.artists?.name}</p>
                      </div>
                      <button className="p-2 text-white/40 hover:opacity-80 transition-colors" style={{ color: COLORS.accent }}>
                        <HeartIcon size={18} />
                      </button>
                      <span className="text-xs text-white/40">{formatTime(track.duration_ms || 0)}</span>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    className="px-8 py-3 text-white font-semibold rounded-full hover:scale-105 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
                  >
                    Save as Playlist
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'favorites' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Favorites</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((playlist: any) => (
                <button
                  key={playlist.id}
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  className="group text-left"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3" style={{ background: `${COLORS.primary}40` }}>
                    {playlist.cover_image_url ? (
                      <img
                        src={getMediaUrl(playlist.cover_image_url)}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                          <path d="M9 18V5l12-2v13"/>
                          <circle cx="6" cy="18" r="3"/>
                          <circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-white truncate">{playlist.name}</h3>
                  <p className="text-xs text-white/50">Playlist</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <p className="text-white/60">Settings panel coming soon...</p>
          </div>
        )}
      </main>

      {/* Now Playing Mini Bar */}
      {currentTrack && (
        <div
          className="fixed bottom-0 left-20 right-0 h-20 flex items-center px-6 border-t border-white/5"
          style={{ background: `linear-gradient(to right, ${COLORS.surface}, ${COLORS.background})` }}
        >
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
              {currentTrack.image ? (
                <img src={currentTrack.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white truncate">{currentTrack.title}</p>
              <p className="text-sm text-white/60 truncate">{currentTrack.artist}</p>
            </div>
            <button className="p-2 text-white/40 hover:opacity-80 transition-colors ml-2">
              <HeartIcon size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button onClick={skipBackward} className="text-white/60 hover:text-white transition-colors">
              <SkipBackIcon size={20} />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: COLORS.accent }}
            >
              {isPlaying ? <PauseIcon size={20} className="text-white" /> : <PlayIcon size={20} className="text-white ml-0.5" />}
            </button>
            <button onClick={skipForward} className="text-white/60 hover:text-white transition-colors">
              <SkipForwardIcon size={20} />
            </button>
          </div>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-3 ml-6">
            <span className="text-xs text-white/40 w-10">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  background: `linear-gradient(to right, ${COLORS.accent}, ${COLORS.secondary})`
                }}
              />
            </div>
            <span className="text-xs text-white/40 w-10">{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
