import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/playlists
 * Get user's playlists
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ playlists: playlists || [] });
  } catch (error: any) {
    console.error('Get playlists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/playlists
 * Create a new playlist
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { name, description, is_public, cover_image_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      );
    }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        name,
        description,
        is_public: is_public ?? true,
        cover_image_url,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error: any) {
    console.error('Create playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist', details: error.message },
      { status: 500 }
    );
  }
}
