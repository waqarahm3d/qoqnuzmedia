import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/comments/tracks
 * Get comments for a track (public, no auth required)
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { searchParams } = new URL(request.url);
  const track_id = searchParams.get('track_id');

  if (!track_id) {
    return NextResponse.json(
      { error: 'Track ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user:profiles(id, username, display_name, avatar_url)
      `)
      .eq('track_id', track_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments/tracks
 * Add a comment to a track (requires auth)
 */
export async function POST(request: NextRequest) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { track_id, content } = body;

    if (!track_id || !content) {
      return NextResponse.json(
        { error: 'Track ID and content are required' },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        track_id,
        user_id: user.id,
        content,
      })
      .select(`
        id,
        content,
        created_at,
        user:profiles(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}
