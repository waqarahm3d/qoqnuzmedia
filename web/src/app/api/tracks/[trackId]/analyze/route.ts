import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { detectTrackMood, updateTrackMood } from '@/lib/ml';
import { getMediaUrl } from '@/lib/media-utils';

/**
 * POST /api/tracks/[trackId]/analyze
 * Trigger on-demand mood analysis for a track
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for database operations
    const adminSupabase = createAdminSupabaseClient();

    // Fetch track details
    const { data: track, error: trackError } = await adminSupabase
      .from('tracks')
      .select('id, title, audio_url, artist_id')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    if (!track.audio_url) {
      return NextResponse.json(
        { error: 'Track has no audio file' },
        { status: 400 }
      );
    }

    // Get full URL for audio file
    const audioUrl = getMediaUrl(track.audio_url);

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Could not resolve audio URL' },
        { status: 500 }
      );
    }

    // Ensure environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Run ML mood detection
    const result = await detectTrackMood(
      trackId,
      audioUrl,
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    // Update track with results
    await updateTrackMood(adminSupabase, trackId, result);

    return NextResponse.json({
      success: true,
      trackId,
      analysis: {
        primaryMood: result.prediction.primaryMood,
        confidence: result.prediction.confidence,
        moodScores: result.prediction.moodScores,
        moodTags: result.moodTags,
        activityTags: result.activityTags,
        features: {
          energyLevel: result.prediction.energyLevel,
          valence: result.prediction.valence,
          danceability: result.prediction.danceability,
          acousticness: result.prediction.acousticness,
          instrumentalness: result.prediction.instrumentalness,
          tempo: result.prediction.audioFeatures.tempo
        },
        processingTimeMs: result.processingTimeMs
      }
    });
  } catch (error) {
    console.error('Error analyzing track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracks/[trackId]/analyze
 * Get current mood analysis for a track
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;

    const supabase = await createServerSupabaseClient();

    // Fetch track with mood data
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        mood_tags,
        activity_tags,
        energy_level,
        valence,
        danceability,
        acousticness,
        instrumentalness,
        tempo_bpm,
        last_metadata_update
      `)
      .eq('id', trackId)
      .single();

    if (error || !track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if analysis exists
    const hasAnalysis = track.mood_tags && track.mood_tags.length > 0;

    return NextResponse.json({
      trackId,
      hasAnalysis,
      analysis: hasAnalysis ? {
        moodTags: track.mood_tags,
        activityTags: track.activity_tags,
        features: {
          energyLevel: track.energy_level,
          valence: track.valence,
          danceability: track.danceability,
          acousticness: track.acousticness,
          instrumentalness: track.instrumentalness,
          tempo: track.tempo_bpm
        },
        lastUpdated: track.last_metadata_update
      } : null
    });
  } catch (error) {
    console.error('Error getting track analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
