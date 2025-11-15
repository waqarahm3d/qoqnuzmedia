import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/history
 * Get user's play history
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const { data: history, error } = await supabase
      .from('play_history')
      .select(`
        played_at,
        track:tracks(
          id,
          title,
          duration_ms,
          artists!tracks_artist_id_fkey(id, name),
          albums!tracks_album_id_fkey(id, title, cover_image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ history: history || [] });
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/history
 * Record a play event
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
      .from('play_history')
      .insert({ user_id: user.id, track_id });

    if (error) throw error;

    return NextResponse.json({ message: 'Play recorded successfully' });
  } catch (error: any) {
    console.error('Record play error:', error);
    return NextResponse.json(
      { error: 'Failed to record play', details: error.message },
      { status: 500 }
    );
  }
}
