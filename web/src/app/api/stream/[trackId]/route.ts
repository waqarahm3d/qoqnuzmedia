/**
 * Track Streaming API Route
 *
 * This endpoint generates signed URLs for streaming audio tracks from R2.
 * It includes authentication checks and play history tracking.
 *
 * Usage: GET /api/stream/[trackId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getTrackStreamUrl } from '@/lib/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const { trackId } = params;

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();

    // Check if user is authenticated (optional - depends on your requirements)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // For now, we'll allow unauthenticated streaming for demo purposes
    // In production, you might want to require authentication
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch track details from database
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url, artist_id, artists(name)')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
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
