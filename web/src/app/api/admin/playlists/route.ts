import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/playlists
 * Get all playlists with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('playlists')
      .select(`
        *,
        profiles!playlists_owner_id_fkey(id, display_name, avatar_url)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: playlists, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      playlists: playlists || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get playlists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: error.message },
      { status: 500 }
    );
  }
}
