import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/issues/stats
 * Get issue statistics for dashboard
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    // Get statistics using the database function
    const { data: stats, error } = await supabase.rpc('get_issue_statistics');

    if (error) throw error;

    // Get category breakdown
    const { data: categoryBreakdown, error: catError } = await supabase
      .from('issues')
      .select('category')
      .then((result: any) => {
        if (result.error) throw result.error;

        const breakdown: Record<string, number> = {};
        result.data?.forEach((issue: any) => {
          breakdown[issue.category] = (breakdown[issue.category] || 0) + 1;
        });

        return { data: breakdown, error: null };
      });

    if (catError) throw catError;

    return NextResponse.json({
      stats: stats?.[0] || {},
      categoryBreakdown: categoryBreakdown || {},
    });
  } catch (error: any) {
    console.error('Get issue stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}
