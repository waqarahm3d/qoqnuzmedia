import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/albums
 * Get all albums with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const artistId = searchParams.get('artist_id');

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('albums')
      .select(`
        *,
        artists!albums_artist_id_fkey(id, name)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (artistId) {
      query = query.eq('artist_id', artistId);
    }

    const { data: albums, error, count } = await query
      .order('release_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      albums: albums || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get albums error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/albums
 * Create new album with optional cover image upload
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.create');
  if (permissionError) return permissionError;

  try {
    const formData = await request.formData();
    const artist_id = formData.get('artist_id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const release_date = formData.get('release_date') as string;
    const album_type = formData.get('album_type') as string;
    const coverFile = formData.get('cover') as File | null;

    if (!artist_id || !title) {
      return NextResponse.json(
        { error: 'Artist ID and title are required' },
        { status: 400 }
      );
    }

    // Upload cover image if provided
    let cover_art_url = null;
    if (coverFile && coverFile.size > 0) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(coverFile.type)) {
        return NextResponse.json(
          { error: 'Invalid cover file type. Use JPG, PNG, or WebP' },
          { status: 400 }
        );
      }

      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-cover.${fileExt}`;
      const filePath = `albums/covers/${fileName}`;

      const buffer = Buffer.from(await coverFile.arrayBuffer());
      await uploadToR2(filePath, buffer, coverFile.type);
      cover_art_url = filePath;
    }

    const { data: album, error } = await supabase
      .from('albums')
      .insert({
        artist_id,
        title,
        description: description || null,
        cover_art_url,
        release_date: release_date || new Date().toISOString(),
        album_type: album_type || 'album',
      })
      .select(`
        *,
        artists!albums_artist_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ album }, { status: 201 });
  } catch (error: any) {
    console.error('Create album error:', error);
    return NextResponse.json(
      { error: 'Failed to create album', details: error.message },
      { status: 500 }
    );
  }
}
