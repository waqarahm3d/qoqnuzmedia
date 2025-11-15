import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/tracks
 * Get all tracks with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const artistId = searchParams.get('artist_id');
  const albumId = searchParams.get('album_id');

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('tracks')
      .select(`
        *,
        artists(id, name),
        albums(id, title, cover_image_url)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (artistId) {
      query = query.eq('artist_id', artistId);
    }

    if (albumId) {
      query = query.eq('album_id', albumId);
    }

    const { data: tracks, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      tracks: tracks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tracks
 * Create new track
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
      title,
      artist_id,
      album_id,
      audio_url,
      duration_ms,
      track_number,
      lyrics,
      is_explicit,
    } = body;

    if (!title || !artist_id || !audio_url) {
      return NextResponse.json(
        { error: 'Title, artist ID, and audio URL are required' },
        { status: 400 }
      );
    }

    const { data: track, error } = await supabase
      .from('tracks')
      .insert({
        title,
        artist_id,
        album_id,
        audio_url,
        duration_ms: duration_ms || 0,
        track_number,
        lyrics,
        is_explicit: is_explicit || false,
      })
      .select(`
        *,
        artists(id, name),
        albums(id, title, cover_image_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ track }, { status: 201 });
  } catch (error: any) {
    console.error('Create track error:', error);
    return NextResponse.json(
      { error: 'Failed to create track', details: error.message },
      { status: 500 }
    );
  }
}
