import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/social/follow/users
 * Get user's following/followers list
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'following'; // 'following' or 'followers'
  const user_id = searchParams.get('user_id') || user.id;

  try {
    let query;

    if (type === 'following') {
      query = supabase
        .from('user_follows')
        .select(`
          created_at,
          following:profiles!user_follows_following_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('follower_id', user_id);
    } else {
      query = supabase
        .from('user_follows')
        .select(`
          created_at,
          follower:profiles!user_follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('following_id', user_id);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ users: data || [] });
  } catch (error: any) {
    console.error('Get follows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/follow/users
 * Follow a user
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: user_id,
      });

    if (error) throw error;

    return NextResponse.json(
      { message: 'User followed successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/follow/users
 * Unfollow a user
 */
export async function DELETE(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', user_id);

    if (error) throw error;

    return NextResponse.json({ message: 'User unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user', details: error.message },
      { status: 500 }
    );
  }
}
