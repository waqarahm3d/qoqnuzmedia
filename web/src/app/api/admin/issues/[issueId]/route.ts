import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { sendEmail } from '@/lib/email/email-service';
import { genericEmail } from '@/lib/email/email-templates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/issues/[issueId]
 * Get issue details with all comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { issueId } = params;

    // Get issue with user details
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select(
        `
        *,
        user:user_id (
          id,
          full_name,
          email
        ),
        resolved_by_user:resolved_by (
          id,
          full_name
        )
      `
      )
      .eq('id', issueId)
      .single();

    if (issueError) throw issueError;

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Get comments with user details
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
 * PATCH /api/admin/issues/[issueId]
 * Update issue (resolve, change status, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { issueId } = params;
    const body = await request.json();
    const { status, priority, resolution_comment } = body;

    // Get current issue details
    const { data: currentIssue, error: fetchError } = await supabase
      .from('issues')
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
      .eq('id', issueId)
      .single();

    if (fetchError) throw fetchError;

    if (!currentIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // If resolving, set resolved_at and resolved_by
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (resolution_comment !== undefined) {
      updateData.resolution_comment = resolution_comment;
    }

    // Update issue
    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If issue is resolved and there's a resolution comment, send email to user
    if (status === 'resolved' && resolution_comment && currentIssue.user) {
      try {
        // Fetch site settings for email
        const { data: settings } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_name', 'site_url']);

        const settingsMap: Record<string, any> = {};
        settings?.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });

        const siteName = settingsMap.site_name || 'Qoqnuz Music';
        const siteUrl = settingsMap.site_url || 'https://qoqnuz.com';

        const emailContent = `
          <h2>Your Issue Has Been Resolved</h2>
          <p>Hi ${currentIssue.user.full_name || 'there'},</p>
          <p>Good news! The issue you reported has been resolved by our team.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #ff4a14; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Issue Details:</h3>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${currentIssue.title}</p>
            <p style="margin: 10px 0;"><strong>Category:</strong> ${currentIssue.category}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> Resolved</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2e7d32;">Resolution:</h3>
            <p style="white-space: pre-wrap;">${resolution_comment}</p>
          </div>

          <p>If you have any additional questions or if the issue persists, please don't hesitate to submit a new report or reply to this issue.</p>

          <p style="margin-top: 30px;">
            <a href="${siteUrl}/feedback" style="display: inline-block; padding: 12px 24px; background-color: #ff4a14; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Your Issues
            </a>
          </p>

          <p style="margin-top: 20px;">Thank you for helping us improve ${siteName}!</p>
        `;

        await sendEmail({
          to: currentIssue.user.email,
          subject: `Issue Resolved: ${currentIssue.title}`,
          html: genericEmail(
            `Issue Resolved: ${currentIssue.title}`,
            emailContent,
            {
              siteName,
              siteUrl,
            }
          ),
        });
      } catch (emailError) {
        console.error('Failed to send resolution email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ issue: updatedIssue });
  } catch (error: any) {
    console.error('Update issue error:', error);
    return NextResponse.json(
      { error: 'Failed to update issue', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/issues/[issueId]/comments
 * Add admin comment to issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { issueId } = params;
    const body = await request.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    const { data: newComment, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        user_id: user.id,
        comment,
        is_admin_reply: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error('Add admin comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment', details: error.message },
      { status: 500 }
    );
  }
}
