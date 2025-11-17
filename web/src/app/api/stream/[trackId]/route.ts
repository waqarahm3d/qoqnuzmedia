/**
 * Track Streaming API Route
 *
 * This endpoint generates signed URLs for streaming audio tracks from R2.
 * It includes authentication checks and play history tracking.
 *
 * Usage: GET /api/stream/[trackId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { getTrackStreamUrl } from '@/lib/r2';

// Type definition for track query result
interface TrackWithArtist {
  id: string;
  title: string;
  audio_url: string;
  artist_id: string;
  artists: {
    name: string;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const { trackId } = params;

    console.log('[Stream API] Requesting track:', trackId);

    if (!trackId) {
      console.error('[Stream API] No track ID provided');
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Use admin client for reading tracks (bypasses RLS)
    const adminSupabase = createAdminSupabaseClient();

    // Use server client for auth check
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[Stream API] User authenticated:', !!user);

    // Fetch track details from database using admin client
    console.log('[Stream API] Fetching track from database...');
    const { data: track, error: trackError } = (await adminSupabase
      .from('tracks')
      .select('id, title, audio_url, artist_id, artists!tracks_artist_id_fkey(name)')
      .eq('id', trackId)
      .single()) as { data: TrackWithArtist | null; error: any };

    if (trackError) {
      console.error('[Stream API] Track fetch error:', {
        code: trackError.code,
        message: trackError.message,
        details: trackError.details,
        hint: trackError.hint,
      });

      // PGRST116 means no rows found
      if (trackError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Track not found in database',
          details: `No track exists with ID: ${trackId}`,
          code: 'TRACK_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json({
        error: 'Database error while fetching track',
        details: trackError.message,
        code: trackError.code
      }, { status: 500 });
    }

    if (!track) {
      console.error('[Stream API] Track is null');
      return NextResponse.json({
        error: 'Track not found',
        details: `Track with ID ${trackId} does not exist`,
        code: 'TRACK_NOT_FOUND'
      }, { status: 404 });
    }

    if (!track.audio_url) {
      console.error('[Stream API] Track has no audio_url:', track);
      return NextResponse.json({
        error: 'Track has no audio file',
        details: 'The track exists but has no associated audio file',
        code: 'NO_AUDIO_FILE'
      }, { status: 404 });
    }

    console.log('[Stream API] Track found:', {
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
    });

    // Generate signed URL for streaming (expires in 1 hour)
    console.log('[Stream API] Generating R2 signed URL...');
    const streamUrl = await getTrackStreamUrl(track.audio_url, 3600);
    console.log('[Stream API] Signed URL generated successfully');

    // Track play history (if user is authenticated)
    if (user) {
      console.log('[Stream API] Recording play history for user:', user.id);
      await supabase.from('play_history').insert({
        user_id: user.id,
        track_id: trackId,
        played_at: new Date().toISOString(),
        source: 'web',
        device_type: 'web',
      });
    }

    // Return the signed URL
    return NextResponse.json({
      url: streamUrl,  // Note: frontend expects "url" not "streamUrl"
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      track: {
        id: track.id,
        title: track.title,
        artist: track.artists?.name || 'Unknown Artist',
      },
    });
  } catch (error: any) {
    console.error('[Stream API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to generate stream URL',
        details: error.message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
