import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issues/[issueId]
 * Get issue details with comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = params;

    // Get issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .eq('user_id', user.id)
      .single();

    if (issueError) throw issueError;

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('issue_comments')
      .select(
        `
        *,
        user:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    return NextResponse.json({
      issue,
      comments: comments || [],
    });
  } catch (error: any) {
    console.error('Get issue details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue details', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues/[issueId]/comments
 * Add a comment to an issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = params;
    const body = await request.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Verify user owns the issue
    const { data: issue } = await supabase
      .from('issues')
      .select('user_id')
      .eq('id', issueId)
      .single();

    if (!issue || issue.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: newComment, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        user_id: user.id,
        comment,
        is_admin_reply: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment', details: error.message },
      { status: 500 }
    );
  }
}
