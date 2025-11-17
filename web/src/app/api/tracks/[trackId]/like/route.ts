import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/tracks/[trackId]/like
 * Like a track
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { trackId } = params;

    // Check if already liked
    const { data: existing } = await supabase
      .from('liked_tracks')
      .select('id')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: 'Track already liked', liked: true },
        { status: 200 }
      );
    }

    // Insert like
    const { error } = await supabase
      .from('liked_tracks')
      .insert({
        user_id: user.id,
        track_id: trackId,
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Track liked', liked: true });
  } catch (error: any) {
    console.error('Like track error:', error);
    return NextResponse.json(
      { error: 'Failed to like track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracks/[trackId]/like
 * Unlike a track
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { trackId } = params;

    const { error } = await supabase
      .from('liked_tracks')
      .delete()
      .eq('user_id', user.id)
      .eq('track_id', trackId);

    if (error) throw error;

    return NextResponse.json({ message: 'Track unliked', liked: false });
  } catch (error: any) {
    console.error('Unlike track error:', error);
    return NextResponse.json(
      { error: 'Failed to unlike track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracks/[trackId]/like
 * Check if user liked a track and get like count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { trackId } = params;

    // Get like count
    const { count } = await supabase
      .from('liked_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    let isLiked = false;

    // Check if current user liked it
    if (user) {
      const { data } = await supabase
        .from('liked_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .maybeSingle();

      isLiked = !!data;
    }

    return NextResponse.json({
      liked: isLiked,
      likeCount: count || 0,
    });
  } catch (error: any) {
    console.error('Get like status error:', error);
    return NextResponse.json(
      { error: 'Failed to get like status', details: error.message },
      { status: 500 }
    );
  }
}
