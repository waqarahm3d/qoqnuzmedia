import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

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
 * Create new artist with optional image uploads
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.create');
  if (permissionError) return permissionError;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const verified = formData.get('verified') === 'true';
    const genresJson = formData.get('genres') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const coverFile = formData.get('cover') as File | null;

    if (!name) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    // Parse genres
    const genreIds: string[] = genresJson ? JSON.parse(genresJson) : [];

    // Get genre names from IDs
    let genreNames: string[] = [];
    if (genreIds.length > 0) {
      const { data: genresData } = await supabase
        .from('genres')
        .select('id, name')
        .in('id', genreIds);

      if (genresData) {
        genreNames = genresData.map(g => g.name);
      }
    }

    // Upload avatar if provided
    let avatar_url = null;
    if (avatarFile && avatarFile.size > 0) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: 'Invalid avatar file type. Use JPG, PNG, or WebP' },
          { status: 400 }
        );
      }

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-avatar.${fileExt}`;
      const filePath = `artists/avatars/${fileName}`;

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await uploadToR2(filePath, buffer, avatarFile.type);
      avatar_url = filePath;
    }

    // Upload cover image if provided
    let cover_image_url = null;
    if (coverFile && coverFile.size > 0) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(coverFile.type)) {
        return NextResponse.json(
          { error: 'Invalid cover file type. Use JPG, PNG, or WebP' },
          { status: 400 }
        );
      }

      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-cover.${fileExt}`;
      const filePath = `artists/covers/${fileName}`;

      const buffer = Buffer.from(await coverFile.arrayBuffer());
      await uploadToR2(filePath, buffer, coverFile.type);
      cover_image_url = filePath;
    }

    const { data: artist, error } = await supabase
      .from('artists')
      .insert({
        name,
        bio: bio || null,
        avatar_url,
        cover_image_url,
        verified: verified || false,
        genres: genreNames,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert into artist_genres junction table
    if (genreIds.length > 0 && artist) {
      const artistGenresData = genreIds.map(genreId => ({
        artist_id: artist.id,
        genre_id: genreId,
      }));

      await supabase
        .from('artist_genres')
        .insert(artistGenresData);
    }

    return NextResponse.json({ artist }, { status: 201 });
  } catch (error: any) {
    console.error('Create artist error:', error);
    return NextResponse.json(
      { error: 'Failed to create artist', details: error.message },
      { status: 500 }
    );
  }
}
