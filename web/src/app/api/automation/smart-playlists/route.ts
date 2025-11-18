import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * API endpoint to get smart playlists for a user
 * Fetches pre-generated playlists from the database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get playlist type from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const playlistType = searchParams.get('type'); // 'daily_mix', 'discovery_weekly', etc.

    // Build query
    let query = supabase
      .from('smart_playlists')
      .select(`
        id,
        playlist_type,
        track_ids,
        generated_at,
        expires_at,
        metadata
      `)
      .eq('user_id', user.id);

    if (playlistType) {
      query = query.eq('playlist_type', playlistType);
    }

    const { data: playlists, error } = await query;

    if (error) {
      console.error('Error fetching smart playlists:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each playlist, fetch full track details
    const enrichedPlaylists = await Promise.all(
      (playlists || []).map(async (playlist) => {
        const trackIds = playlist.track_ids as string[];

        if (!trackIds || trackIds.length === 0) {
          return {
            ...playlist,
            tracks: [],
          };
        }

        // Fetch track details
        const { data: tracks } = await supabase
          .from('tracks')
          .select(`
            id,
            title,
            duration_ms,
            artist_id,
            album_id,
            play_count,
            artists (
              id,
              name
            ),
            albums (
              id,
              title,
              cover_art_url
            )
          `)
          .in('id', trackIds);

        return {
          ...playlist,
          tracks: tracks || [],
          track_count: trackIds.length,
        };
      })
    );

    return NextResponse.json({ playlists: enrichedPlaylists });
  } catch (error: any) {
    console.error('Smart playlists API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to manually trigger smart playlist generation for current user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { playlistType } = body; // 'daily_mix', 'discovery_weekly', etc.

    if (!playlistType) {
      return NextResponse.json(
        { error: 'Playlist type is required' },
        { status: 400 }
      );
    }

    // Call appropriate database function based on type
    let functionName: string;
    switch (playlistType) {
      case 'daily_mix':
        functionName = 'generate_daily_mix';
        break;
      case 'discovery_weekly':
        functionName = 'generate_discovery_weekly';
        break;
      case 'new_for_you':
        functionName = 'generate_new_for_you';
        break;
      case 'forgotten_favorites':
        functionName = 'generate_forgotten_favorites';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid playlist type' },
          { status: 400 }
        );
    }

    // Execute the generation function
    const { data, error } = await supabase.rpc(functionName, {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error generating playlist:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      playlist_type: playlistType,
      track_ids: data,
      message: 'Playlist generated successfully',
    });
  } catch (error: any) {
    console.error('Smart playlist generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
