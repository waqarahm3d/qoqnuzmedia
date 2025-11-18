import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';
import { generateBPMPlaylist } from '@/lib/smart-playlists/algorithms';

/**
 * GET /api/discovery/bpm?target=160&range=10
 * Get tracks by BPM (perfect for running/workouts)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetBPM = parseInt(searchParams.get('target') || '0');
  const range = parseInt(searchParams.get('range') || '10');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!targetBPM || targetBPM < 40 || targetBPM > 220) {
    return apiValidationError('Valid target BPM is required (40-220)');
  }

  if (range < 5 || range > 30) {
    return apiValidationError('Range must be between 5 and 30');
  }

  try {
    const result = await generateBPMPlaylist(targetBPM, range, limit);

    if (result.tracks.length === 0) {
      return apiSuccess({
        tracks: [],
        message: `No tracks found at ${targetBPM} BPM (±${range})`,
        targetBPM,
        range,
      });
    }

    return apiSuccess({
      targetBPM,
      range,
      ...result,
    });
  } catch (error: any) {
    console.error('BPM discovery error:', error);
    return apiServerError('Failed to get BPM-based tracks', error);
  }
}
