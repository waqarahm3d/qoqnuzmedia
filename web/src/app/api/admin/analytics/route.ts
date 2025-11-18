import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics
 * Get platform analytics and statistics
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    // Get total counts
    const [
      { count: totalUsers },
      { count: totalArtists },
      { count: totalAlbums },
      { count: totalTracks },
      { count: totalPlaylists },
      { count: totalPlays },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('artists').select('*', { count: 'exact', head: true }),
      supabase.from('albums').select('*', { count: 'exact', head: true }),
      supabase.from('tracks').select('*', { count: 'exact', head: true }),
      supabase.from('playlists').select('*', { count: 'exact', head: true }),
      supabase.from('play_history').select('*', { count: 'exact', head: true }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsersLast30Days } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: playsLast30Days } = await supabase
      .from('play_history')
      .select('*', { count: 'exact', head: true })
      .gte('played_at', thirtyDaysAgo.toISOString());

    // Get top tracks (last 30 days)
    const { data: topTracks } = await supabase
      .from('daily_track_stats')
      .select(`
        track_id,
        total_plays:play_count,
        tracks(id, title, artists!tracks_artist_id_fkey(name))
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('play_count', { ascending: false })
      .limit(10);

    // Get top artists (last 30 days)
    const { data: topArtists } = await supabase
      .from('daily_artist_stats')
      .select(`
        artist_id,
        total_plays:play_count,
        artists(id, name, avatar_url)
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('play_count', { ascending: false })
      .limit(10);

    // Get top albums (by play count of their tracks)
    const { data: topAlbums } = await supabase
      .from('albums')
      .select(`
        id,
        title,
        cover_url,
        artists(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get top playlists (by follower count or track count)
    const { data: topPlaylists } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        cover_url,
        is_public,
        profiles(id, display_name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get daily plays for chart (last 30 days)
    const { data: dailyPlays } = await supabase
      .from('daily_track_stats')
      .select('date, play_count')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Aggregate daily plays by date
    const dailyPlaysMap = new Map<string, number>();
    dailyPlays?.forEach((record) => {
      const current = dailyPlaysMap.get(record.date) || 0;
      dailyPlaysMap.set(record.date, current + record.play_count);
    });

    const dailyPlaysChart = Array.from(dailyPlaysMap.entries()).map(
      ([date, plays]) => ({ date, plays })
    );

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalArtists: totalArtists || 0,
        totalAlbums: totalAlbums || 0,
        totalTracks: totalTracks || 0,
        totalPlaylists: totalPlaylists || 0,
        totalPlays: totalPlays || 0,
        newUsersLast30Days: newUsersLast30Days || 0,
        playsLast30Days: playsLast30Days || 0,
      },
      topTracks: topTracks || [],
      topArtists: topArtists || [],
      topAlbums: topAlbums || [],
      topPlaylists: topPlaylists || [],
      dailyPlaysChart: dailyPlaysChart || [],
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
