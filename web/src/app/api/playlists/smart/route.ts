import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';
import {
  generateDailyMix,
  generateNewForYou,
  generateForgottenFavorites,
  generateDiscovery,
  generateTrendingNow,
  generateRecentlyAdded,
  generateGenreMix,
  generateDecadeMix,
  generateArtistRadio,
  generateTrackRadio,
} from '@/lib/smart-playlists/algorithms';

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

/**
 * GET /api/playlists/smart?type=daily_mix|new_for_you|forgotten_favorites|discovery
 * Generate a smart playlist for the authenticated user
 */
export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily_mix';
  const limit = parseInt(searchParams.get('limit') || '50');
  const genre = searchParams.get('genre');
  const decade = searchParams.get('decade');
  const artistId = searchParams.get('artistId');
  const trackId = searchParams.get('trackId');

  try {
    let result;

    switch (type) {
      case 'daily_mix':
        result = await generateDailyMix(user.id, limit);
        break;

      case 'new_for_you':
        result = await generateNewForYou(user.id, limit);
        break;

      case 'forgotten_favorites':
        result = await generateForgottenFavorites(user.id, limit);
        break;

      case 'discovery':
        result = await generateDiscovery(user.id, limit);
        break;

      case 'trending_now':
        result = await generateTrendingNow(limit);
        break;

      case 'recently_added':
        result = await generateRecentlyAdded(limit);
        break;

      case 'genre_mix':
        if (!genre) {
          return apiValidationError('genre parameter is required for genre_mix');
        }
        result = await generateGenreMix(genre, limit);
        break;

      case 'decade_mix':
        if (!decade) {
          return apiValidationError('decade parameter is required for decade_mix (e.g., 1990, 2000, 2010)');
        }
        result = await generateDecadeMix(parseInt(decade), limit);
        break;

      case 'artist_radio':
        if (!artistId) {
          return apiValidationError('artistId parameter is required for artist_radio');
        }
        result = await generateArtistRadio(artistId, limit);
        break;

      case 'track_radio':
        if (!trackId) {
          return apiValidationError('trackId parameter is required for track_radio');
        }
        result = await generateTrackRadio(trackId, limit);
        break;

      default:
        return apiValidationError('Invalid playlist type. Must be: daily_mix, new_for_you, forgotten_favorites, discovery, trending_now, recently_added, genre_mix, decade_mix, artist_radio, or track_radio');
    }

    return apiSuccess({
      playlist: {
        name: getPlaylistName(type),
        description: getPlaylistDescription(type),
        type,
        ...result,
      },
    });
  } catch (error: any) {
    console.error('Generate smart playlist error:', error);
    return apiServerError('Failed to generate smart playlist', error);
  }
}

function getPlaylistName(type: string): string {
  const names: Record<string, string> = {
    daily_mix: 'Daily Mix',
    new_for_you: 'New for You',
    forgotten_favorites: 'Forgotten Favorites',
    discovery: 'Discover Weekly',
    trending_now: 'Trending Now',
    recently_added: 'Recently Added',
    genre_mix: 'Genre Mix',
    decade_mix: 'Decade Mix',
    artist_radio: 'Artist Radio',
    track_radio: 'Track Radio',
  };
  return names[type] || 'Smart Playlist';
}

function getPlaylistDescription(type: string): string {
  const descriptions: Record<string, string> = {
    daily_mix: 'Your personalized mix based on recent listening',
    new_for_you: 'Fresh tracks in your favorite genres',
    forgotten_favorites: 'Rediscover your liked tracks',
    discovery: 'New music similar to what you love',
    trending_now: 'Most played tracks this week',
    recently_added: 'Newest tracks on the platform',
    genre_mix: 'Deep dive into your selected genre',
    decade_mix: 'Tracks from your chosen era',
    artist_radio: 'Tracks from and similar to your selected artist',
    track_radio: 'Tracks similar to your selected song',
  };
  return descriptions[type] || 'Auto-generated playlist';
}
