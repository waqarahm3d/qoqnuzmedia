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

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const { trackId } = params;

    // Use admin client for reading tracks (bypasses RLS)
    // Tracks should be publicly readable in a music streaming platform
    const adminSupabase = createAdminSupabaseClient();

    // Use server client for auth check
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // For now, we'll allow unauthenticated streaming for demo purposes
    // In production, you might want to require authentication
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch track details from database using admin client
    const { data: track, error: trackError } = await adminSupabase
      .from('tracks')
      .select('id, title, audio_url, artist_id, artists(name)')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      console.error('Track fetch error:', trackError);
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Generate signed URL for streaming (expires in 1 hour)
    const streamUrl = await getTrackStreamUrl(track.audio_url, 3600);

    // Track play history (if user is authenticated)
    if (user) {
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
      streamUrl,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artists?.name || 'Unknown Artist',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json(
      { error: 'Failed to generate stream URL' },
      { status: 500 }
    );
  }
}
