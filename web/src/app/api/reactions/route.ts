import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/reactions
 * Get reactions for a specific item (public)
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { searchParams } = new URL(request.url);
  const track_id = searchParams.get('track_id');
  const playlist_id = searchParams.get('playlist_id');
  const post_id = searchParams.get('post_id');

  if (!track_id && !playlist_id && !post_id) {
    return NextResponse.json(
      { error: 'Must provide track_id, playlist_id, or post_id' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('reactions')
      .select(`
        id,
        emoji,
        created_at,
        user:profiles(id, username, display_name, avatar_url)
      `);

    if (track_id) query = query.eq('track_id', track_id);
    if (playlist_id) query = query.eq('playlist_id', playlist_id);
    if (post_id) query = query.eq('post_id', post_id);

    const { data: reactions, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ reactions: reactions || [] });
  } catch (error: any) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reactions
 * Add a reaction (requires auth)
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { track_id, playlist_id, post_id, emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    if (!track_id && !playlist_id && !post_id) {
      return NextResponse.json(
        { error: 'Must provide track_id, playlist_id, or post_id' },
        { status: 400 }
      );
    }

    const { data: reaction, error } = await supabase
      .from('reactions')
      .insert({
        user_id: user.id,
        track_id,
        playlist_id,
        post_id,
        emoji,
      })
      .select(`
        id,
        emoji,
        created_at,
        user:profiles(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error: any) {
    console.error('Create reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create reaction', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reactions
 * Remove a reaction (requires auth)
 */
export async function DELETE(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const reaction_id = searchParams.get('reaction_id');

  if (!reaction_id) {
    return NextResponse.json(
      { error: 'Reaction ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', reaction_id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Reaction removed successfully' });
  } catch (error: any) {
    console.error('Delete reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction', details: error.message },
      { status: 500 }
    );
  }
}
