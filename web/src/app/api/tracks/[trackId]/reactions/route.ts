import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/tracks/[trackId]/reactions
 * Add emoji reaction to a track
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
    const { emoji } = await request.json();

    if (!emoji || emoji.length > 10) {
      return NextResponse.json(
        { error: 'Invalid emoji' },
        { status: 400 }
      );
    }

    // Insert or ignore if already exists
    const { error } = await supabase
      .from('track_reactions')
      .insert({
        user_id: user.id,
        track_id: trackId,
        emoji,
      });

    if (error && error.code !== '23505') { // Ignore unique violation
      throw error;
    }

    return NextResponse.json({ message: 'Reaction added', emoji });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracks/[trackId]/reactions
 * Get all reactions for a track and user's reactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { trackId } = params;

    // Get reaction counts using the helper function
    const { data, error } = await supabase
      .rpc('get_track_reaction_counts', { track_uuid: trackId });

    if (error) throw error;

    // Get user's reactions if authenticated
    let userReactions: string[] = [];
    if (user) {
      const { data: userReactionData } = await supabase
        .from('track_reactions')
        .select('emoji')
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      userReactions = userReactionData?.map(r => r.emoji) || [];
    }

    return NextResponse.json({
      reactions: data || [],
      userReactions
    });
  } catch (error: any) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get reactions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracks/[trackId]/reactions
 * Remove user's emoji reaction from a track
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
    const { emoji } = await request.json();

    const { error } = await supabase
      .from('track_reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .eq('emoji', emoji);

    if (error) throw error;

    return NextResponse.json({ message: 'Reaction removed' });
  } catch (error: any) {
    console.error('Remove reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction', details: error.message },
      { status: 500 }
    );
  }
}
