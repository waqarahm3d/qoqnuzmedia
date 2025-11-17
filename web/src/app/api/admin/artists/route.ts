import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/artists
 * Get all artists with pagination
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
      .from('artists')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    const { data: artists, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      artists: artists || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get artists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/artists
 * Create new artist
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.create');
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const {
      name,
      bio,
      avatar_url,
      cover_image_url,
      verified,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    const { data: artist, error } = await supabase
      .from('artists')
      .insert({
        name,
        bio,
        avatar_url,
        cover_image_url,
        verified: verified || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ artist }, { status: 201 });
  } catch (error: any) {
    console.error('Create artist error:', error);
    return NextResponse.json(
      { error: 'Failed to create artist', details: error.message },
      { status: 500 }
    );
  }
}
