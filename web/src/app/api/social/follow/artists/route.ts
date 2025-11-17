import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/social/follow/artists
 * Get user's followed artists
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const { data: follows, error } = await supabase
      .from('artist_follows')
      .select(`
        created_at,
        artist:artists(
          id,
          name,
          avatar_url,
          verified
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ artists: follows || [] });
  } catch (error: any) {
    console.error('Get followed artists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followed artists', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/follow/artists
 * Follow an artist
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { artist_id } = body;

    if (!artist_id) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('artist_follows')
      .insert({
        user_id: user.id,
        artist_id,
      });

    if (error) throw error;

    return NextResponse.json(
      { message: 'Artist followed successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Follow artist error:', error);
    return NextResponse.json(
      { error: 'Failed to follow artist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/follow/artists
 * Unfollow an artist
 */
export async function DELETE(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const artist_id = searchParams.get('artist_id');

  if (!artist_id) {
    return NextResponse.json(
      { error: 'Artist ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('artist_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artist_id);

    if (error) throw error;

    return NextResponse.json({ message: 'Artist unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow artist error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow artist', details: error.message },
      { status: 500 }
    );
  }
}
