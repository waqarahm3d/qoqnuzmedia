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

    // Get play history for last 30 days
    const { data: recentPlays } = await supabase
      .from('play_history')
      .select(`
        track_id,
        played_at,
        tracks(
          id,
          title,
          artist_id,
          album_id,
          artists!tracks_artist_id_fkey(id, name, avatar_url),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        )
      `)
      .gte('played_at', thirtyDaysAgo.toISOString())
      .order('played_at', { ascending: false });

    // Aggregate top tracks from play history
    const trackPlayCounts = new Map<string, { track: any; count: number }>();
    const artistPlayCounts = new Map<string, { artist: any; count: number }>();
    const albumPlayCounts = new Map<string, { album: any; count: number }>();
    const dailyPlaysMap = new Map<string, number>();

    recentPlays?.forEach((play: any) => {
      if (!play.tracks) return;

      const track = play.tracks;

      // Count track plays
      const trackKey = track.id;
      const currentTrack = trackPlayCounts.get(trackKey);
      trackPlayCounts.set(trackKey, {
        track: {
          id: track.id,
          title: track.title,
          artists: track.artists
        },
        count: (currentTrack?.count || 0) + 1
      });

      // Count artist plays
      if (track.artists) {
        const artistKey = track.artists.id;
        const currentArtist = artistPlayCounts.get(artistKey);
        artistPlayCounts.set(artistKey, {
          artist: track.artists,
          count: (currentArtist?.count || 0) + 1
        });
      }

      // Count album plays
      if (track.albums) {
        const albumKey = track.albums.id;
        const currentAlbum = albumPlayCounts.get(albumKey);
        albumPlayCounts.set(albumKey, {
          album: {
            ...track.albums,
            artists: track.artists
          },
          count: (currentAlbum?.count || 0) + 1
        });
      }

      // Count daily plays
      const date = play.played_at.split('T')[0];
      dailyPlaysMap.set(date, (dailyPlaysMap.get(date) || 0) + 1);
    });

    // Sort and format top tracks
    const topTracks = Array.from(trackPlayCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        track_id: item.track.id,
        total_plays: item.count,
        tracks: item.track
      }));

    // Sort and format top artists
    const topArtists = Array.from(artistPlayCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        artist_id: item.artist.id,
        total_plays: item.count,
        artists: item.artist
      }));

    // Sort and format top albums
    const topAlbums = Array.from(albumPlayCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        id: item.album.id,
        title: item.album.title,
        cover_url: item.album.cover_art_url,
        total_plays: item.count,
        artists: item.album.artists
      }));

    // Get top playlists (by track count since we don't have play data for playlists)
    const { data: playlistsData } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        cover_url,
        is_public,
        profiles(id, display_name),
        playlist_tracks(count)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5);

    const topPlaylists = playlistsData?.map(p => ({
      id: p.id,
      name: p.name,
      cover_url: p.cover_url,
      is_public: p.is_public,
      profiles: p.profiles,
      track_count: Array.isArray(p.playlist_tracks) ? p.playlist_tracks.length : 0
    })) || [];

    // Format daily plays chart
    const dailyPlaysChart = Array.from(dailyPlaysMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, plays]) => ({ date, plays }));

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
