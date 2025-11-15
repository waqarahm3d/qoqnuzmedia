import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/feed
 * Get activity feed from followed users
 */
export async function GET(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    // Get list of users the current user follows
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map((f) => f.following_id) || [];

    // Get posts from followed users
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        user:profiles(id, username, display_name, avatar_url),
        track:tracks(id, title, artists!tracks_artist_id_fkey(name))
      `)
      .in('user_id', [...followingIds, user.id])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ posts: posts || [] });
  } catch (error: any) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed', details: error.message },
      { status: 500 }
    );
  }
}
