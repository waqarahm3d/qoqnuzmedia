import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';
import {
  generateDailyMix,
  generateNewForYou,
  generateForgottenFavorites,
  generateDiscovery,
} from '@/lib/smart-playlists/algorithms';

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

      default:
        return apiValidationError('Invalid playlist type. Must be: daily_mix, new_for_you, forgotten_favorites, or discovery');
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
  };
  return names[type] || 'Smart Playlist';
}

function getPlaylistDescription(type: string): string {
  const descriptions: Record<string, string> = {
    daily_mix: 'Your personalized mix based on recent listening',
    new_for_you: 'Fresh tracks in your favorite genres',
    forgotten_favorites: 'Rediscover your liked tracks',
    discovery: 'New music similar to what you love',
  };
  return descriptions[type] || 'Auto-generated playlist';
}
