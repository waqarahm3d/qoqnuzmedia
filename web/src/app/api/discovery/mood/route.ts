import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';
import { generateMoodPlaylist } from '@/lib/smart-playlists/algorithms';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/discovery/mood?mood=happy|sad|energetic|chill|focused|romantic|angry|peaceful
 * Get tracks by mood
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!mood) {
    return apiValidationError('mood parameter is required');
  }

  try {
    const result = await generateMoodPlaylist(mood, limit);

    if (result.tracks.length === 0) {
      return apiSuccess({
        tracks: [],
        message: 'No tracks found for this mood',
        mood,
      });
    }

    return apiSuccess({
      mood,
      ...result,
    });
  } catch (error: any) {
    console.error('Mood discovery error:', error);
    return apiServerError('Failed to get mood-based tracks', error);
  }
}

/**
 * GET /api/discovery/mood/presets
 * Get all available mood presets
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: moods, error } = await supabase
      .from('mood_presets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return apiSuccess({ moods: moods || [] });
  } catch (error: any) {
    console.error('Get mood presets error:', error);
    return apiServerError('Failed to get mood presets', error);
  }
}
