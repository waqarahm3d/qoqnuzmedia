import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/email/campaigns
 * Get all email campaigns
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select(
        `
        *,
        creator:created_by (
          id,
          full_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email/campaigns?id=xxx
 * Delete a specific email campaign
 */
export async function DELETE(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign', details: error.message },
      { status: 500 }
    );
  }
}
