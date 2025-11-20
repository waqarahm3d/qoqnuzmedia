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
