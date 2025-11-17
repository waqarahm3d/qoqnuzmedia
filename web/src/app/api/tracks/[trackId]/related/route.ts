import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/tracks/[trackId]/related
 * Get related tracks for auto-play queue
 * Returns tracks from same artist, same album, or same genre
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { trackId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // First, get the current track details
    const { data: currentTrack, error: trackError } = await supabase
      .from('tracks')
      .select('artist_id, album_id, title')
      .eq('id', trackId)
      .single();

    if (trackError || !currentTrack) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Strategy: Get related tracks in this order of priority:
    // 1. Tracks from the same album (if available)
    // 2. Tracks from the same artist
    // 3. Popular tracks (based on play count)

    let relatedTracks: any[] = [];

    // Get tracks from same album (excluding current track)
    if (currentTrack.album_id) {
      const { data: albumTracks } = await supabase
        .from('tracks')
        .select(`
          *,
          artists!tracks_artist_id_fkey(id, name, avatar_url, verified),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        `)
        .eq('album_id', currentTrack.album_id)
        .neq('id', trackId)
        .order('title', { ascending: true })
        .limit(Math.min(limit, 5));

      if (albumTracks) {
        relatedTracks = [...relatedTracks, ...albumTracks];
      }
    }

    // Get tracks from same artist (excluding current track and already added album tracks)
    if (relatedTracks.length < limit) {
      const excludeIds = [trackId, ...relatedTracks.map(t => t.id)];
      const { data: artistTracks } = await supabase
        .from('tracks')
        .select(`
          *,
          artists!tracks_artist_id_fkey(id, name, avatar_url, verified),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        `)
        .eq('artist_id', currentTrack.artist_id)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('play_count', { ascending: false })
        .limit(Math.min(limit - relatedTracks.length, 5));

      if (artistTracks) {
        relatedTracks = [...relatedTracks, ...artistTracks];
      }
    }

    // Fill remaining slots with popular tracks
    if (relatedTracks.length < limit) {
      const excludeIds = [trackId, ...relatedTracks.map(t => t.id)];
      const { data: popularTracks } = await supabase
        .from('tracks')
        .select(`
          *,
          artists!tracks_artist_id_fkey(id, name, avatar_url, verified),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        `)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('play_count', { ascending: false })
        .limit(limit - relatedTracks.length);

      if (popularTracks) {
        relatedTracks = [...relatedTracks, ...popularTracks];
      }
    }

    // Shuffle the results for variety
    const shuffled = relatedTracks.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      tracks: shuffled.slice(0, limit),
      count: shuffled.length
    });
  } catch (error: any) {
    console.error('Get related tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get related tracks', details: error.message },
      { status: 500 }
    );
  }
}
