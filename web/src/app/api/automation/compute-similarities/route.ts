/**
 * Track Similarity Computation API
 * Computes and stores track similarities for recommendation algorithms
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import {
  computeTrackSimilarities,
  computeAllTrackSimilarities,
} from '@/lib/smart-playlists/algorithms';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch processing

/**
 * POST /api/automation/compute-similarities
 * Compute track similarities
 *
 * Body:
 * - trackId: (optional) specific track to compute, or omit for all tracks
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => ({}));
    const { trackId } = body;

    if (trackId) {
      // Compute for a single track
      console.log(`[Compute Similarities] Processing single track: ${trackId}`);
      const result = await computeTrackSimilarities(trackId);

      return NextResponse.json({
        success: true,
        trackId,
        computed: result.computed,
        stored: result.stored,
        message: `Computed similarities for track ${trackId}`,
      });
    } else {
      // Compute for all tracks
      console.log(`[Compute Similarities] Processing all tracks`);
      const result = await computeAllTrackSimilarities();

      return NextResponse.json({
        success: true,
        totalTracks: result.totalTracks,
        processed: result.processed,
        message: `Computed similarities for ${result.processed} tracks`,
      });
    }
  } catch (error: any) {
    console.error('[Compute Similarities] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute similarities', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/compute-similarities
 * Get similarity computation status
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    // Get counts
    const [
      { count: totalTracks },
      { count: tracksWithSimilarities },
      { count: totalSimilarities },
    ] = await Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }),
      supabase.from('track_similarities').select('track_id', { count: 'exact', head: true }),
      supabase.from('track_similarities').select('*', { count: 'exact', head: true }),
    ]);

    // Get unique tracks with similarities
    const { data: uniqueTracks } = await supabase
      .from('track_similarities')
      .select('track_id')
      .limit(10000);

    const uniqueTracksWithSimilarities = new Set(uniqueTracks?.map(t => t.track_id) || []).size;

    return NextResponse.json({
      totalTracks: totalTracks || 0,
      tracksWithSimilarities: uniqueTracksWithSimilarities,
      totalSimilarityRecords: totalSimilarities || 0,
      coveragePercent: totalTracks ? Math.round((uniqueTracksWithSimilarities / totalTracks) * 100) : 0,
    });
  } catch (error: any) {
    console.error('[Compute Similarities] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}
