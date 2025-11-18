import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';
import { generateActivityPlaylist } from '@/lib/smart-playlists/algorithms';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/discovery/activity?activity=workout|running|study|sleep|party|driving|cooking|meditation
 * Get tracks by activity
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activity = searchParams.get('activity');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!activity) {
    return apiValidationError('activity parameter is required');
  }

  try {
    const result = await generateActivityPlaylist(activity, limit);

    if (result.tracks.length === 0) {
      return apiSuccess({
        tracks: [],
        message: 'No tracks found for this activity',
        activity,
      });
    }

    return apiSuccess({
      activity,
      ...result,
    });
  } catch (error: any) {
    console.error('Activity discovery error:', error);
    return apiServerError('Failed to get activity-based tracks', error);
  }
}

/**
 * POST /api/discovery/activity/presets
 * Get all available activity presets
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: activities, error } = await supabase
      .from('activity_presets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return apiSuccess({ activities: activities || [] });
  } catch (error: any) {
    console.error('Get activity presets error:', error);
    return apiServerError('Failed to get activity presets', error);
  }
}
