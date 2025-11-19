import { NextRequest, NextResponse } from 'next/server';
import { batchDetectMoods, getTracksNeedingMoodDetection } from '@/lib/ml';
import { requireAdmin } from '@/lib/auth/admin-middleware';

/**
 * POST /api/admin/analyze-tracks
 * Batch analyze tracks for mood detection
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { response, supabase } = await requireAdmin(request);
    if (response) return response;

    const adminSupabase = supabase;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { trackIds, limit = 20 } = body;

    let tracksToAnalyze: string[] = [];

    if (trackIds && Array.isArray(trackIds)) {
      // Analyze specific tracks
      tracksToAnalyze = trackIds.slice(0, 100); // Max 100 at a time
    } else {
      // Get tracks that need analysis
      tracksToAnalyze = await getTracksNeedingMoodDetection(adminSupabase, limit);
    }

    if (tracksToAnalyze.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tracks need analysis',
        processed: 0
      });
    }

    // Run batch analysis
    const result = await batchDetectMoods(tracksToAnalyze, adminSupabase);

    return NextResponse.json({
      success: true,
      processed: tracksToAnalyze.length,
      successful: result.success,
      failed: result.failed,
      results: result.results.map(r => ({
        trackId: r.trackId,
        success: r.success,
        mood: r.success ? r.prediction.primaryMood : null,
        confidence: r.success ? r.prediction.confidence : null,
        error: r.error,
        processingTimeMs: r.processingTimeMs
      }))
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/analyze-tracks
 * Get status of tracks needing analysis
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { response, supabase } = await requireAdmin(request);
    if (response) return response;

    const adminSupabase = supabase;

    // Get counts
    const { count: totalTracks } = await adminSupabase
      .from('tracks')
      .select('*', { count: 'exact', head: true });

    const { count: analyzedTracks } = await adminSupabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .not('mood_tags', 'is', null)
      .neq('mood_tags', '{}');

    const { count: pendingTracks } = await adminSupabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .or('mood_tags.is.null,mood_tags.eq.{}')
      .not('audio_url', 'is', null);

    // Get mood distribution
    const { data: moodDistribution } = await adminSupabase
      .from('tracks')
      .select('mood_tags')
      .not('mood_tags', 'is', null)
      .neq('mood_tags', '{}');

    const moodCounts: Record<string, number> = {};
    moodDistribution?.forEach(track => {
      const primaryMood = track.mood_tags?.[0];
      if (primaryMood) {
        moodCounts[primaryMood] = (moodCounts[primaryMood] || 0) + 1;
      }
    });

    return NextResponse.json({
      stats: {
        totalTracks: totalTracks || 0,
        analyzedTracks: analyzedTracks || 0,
        pendingTracks: pendingTracks || 0,
        percentComplete: totalTracks ? Math.round((analyzedTracks || 0) / totalTracks * 100) : 0
      },
      moodDistribution: moodCounts
    });
  } catch (error) {
    console.error('Error getting analysis status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
