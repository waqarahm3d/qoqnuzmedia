import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/library/liked-tracks
 * Get user's liked tracks
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const { data: likedTracks, error } = await supabase
      .from('liked_tracks')
      .select(`
        created_at,
        track:tracks(
          id,
          title,
          duration_ms,
          artists!tracks_artist_id_fkey(id, name),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ likedTracks: likedTracks || [] });
  } catch (error: any) {
    console.error('Get liked tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked tracks', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library/liked-tracks
 * Like a track
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { track_id } = body;

    if (!track_id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('liked_tracks')
      .insert({ user_id: user.id, track_id });

    if (error) throw error;

    return NextResponse.json({ message: 'Track liked successfully' });
  } catch (error: any) {
    console.error('Like track error:', error);
    return NextResponse.json(
      { error: 'Failed to like track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library/liked-tracks
 * Unlike a track
 */
export async function DELETE(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const track_id = searchParams.get('track_id');

  if (!track_id) {
    return NextResponse.json(
      { error: 'Track ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('liked_tracks')
      .delete()
      .eq('user_id', user.id)
      .eq('track_id', track_id);

    if (error) throw error;

    return NextResponse.json({ message: 'Track unliked successfully' });
  } catch (error: any) {
    console.error('Unlike track error:', error);
    return NextResponse.json(
      { error: 'Failed to unlike track', details: error.message },
      { status: 500 }
    );
  }
}
