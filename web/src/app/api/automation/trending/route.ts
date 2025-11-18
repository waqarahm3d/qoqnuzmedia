import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { createClient } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to get trending tracks
 * Returns pre-calculated trending tracks from the database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch trending tracks with full track details
    const { data: trendingTracks, error } = await supabase
      .from('trending_tracks')
      .select(`
        track_id,
        trend_score,
        play_count_24h,
        play_count_7d,
        unique_listeners_24h,
        unique_listeners_7d,
        calculated_at,
        tracks (
          id,
          title,
          duration_ms,
          artist_id,
          album_id,
          play_count,
          created_at,
          artists (
            id,
            name,
            avatar_url
          ),
          albums (
            id,
            title,
            cover_art_url
          )
        )
      `)
      .order('trend_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending tracks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the data structure
    const tracks = (trendingTracks || []).map((item) => ({
      ...(item.tracks as any),
      trending_data: {
        trend_score: item.trend_score,
        play_count_24h: item.play_count_24h,
        play_count_7d: item.play_count_7d,
        unique_listeners_24h: item.unique_listeners_24h,
        unique_listeners_7d: item.unique_listeners_7d,
        calculated_at: item.calculated_at,
      },
    }));

    return NextResponse.json({
      tracks,
      total: tracks.length,
      calculated_at: trendingTracks?.[0]?.calculated_at || null,
    });
  } catch (error: any) {
    console.error('Trending tracks API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to manually trigger trending calculation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has admin access
    const { user, adminUser, response, supabase } = await requireAdmin(request);
    if (response) return response;

    // Trigger trending calculation
    const { error } = await supabase.rpc('calculate_trending_tracks');

    if (error) {
      console.error('Error calculating trending:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trending tracks calculated successfully',
    });
  } catch (error: any) {
    console.error('Trending calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
