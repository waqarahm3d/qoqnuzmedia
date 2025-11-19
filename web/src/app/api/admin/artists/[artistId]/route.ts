import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/artists/[artistId]
 * Get artist details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { artistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { artistId } = params;

  try {
    const { data: artist, error } = await supabase
      .from('artists')
      .select(`
        *,
        albums(id, title, cover_art_url, release_date),
        tracks(id, title, play_count)
      `)
      .eq('id', artistId)
      .single();

    if (error) throw error;

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json({ artist });
  } catch (error: any) {
    console.error('Get artist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/artists/[artistId]
 * Update artist with optional image uploads
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { artistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.edit');
  if (permissionError) return permissionError;

  const { artistId } = params;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const verified = formData.get('verified') === 'true';
    const genresJson = formData.get('genres') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const coverFile = formData.get('cover') as File | null;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (verified !== undefined) updateData.verified = verified;

    // Parse genres
    const genreIds: string[] = genresJson ? JSON.parse(genresJson) : [];

    // Upload avatar if provided
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
      updateData.avatar_url = filePath;
    }

    // Upload cover image if provided
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
      updateData.cover_image_url = filePath;
    }

    // Handle genres - update both TEXT[] and junction table
    if (genreIds.length > 0) {
      // Fetch genre names
      const { data: genresData } = await supabase
        .from('genres')
        .select('id, name')
        .in('id', genreIds);

      if (genresData) {
        updateData.genres = genresData.map(g => g.name);
      }

      // Update artist_genres junction table
      // First delete existing
      await supabase
        .from('artist_genres')
        .delete()
        .eq('artist_id', artistId);

      // Then insert new
      const artistGenresData = genreIds.map(genreId => ({
        artist_id: artistId,
        genre_id: genreId,
      }));

      await supabase
        .from('artist_genres')
        .insert(artistGenresData);
    } else {
      // Clear genres if empty array provided
      updateData.genres = [];
      await supabase
        .from('artist_genres')
        .delete()
        .eq('artist_id', artistId);
    }

    const { data: artist, error } = await supabase
      .from('artists')
      .update(updateData)
      .eq('id', artistId)
      .select()
      .single();

    if (error) throw error;

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json({ artist });
  } catch (error: any) {
    console.error('Update artist error:', error);
    return NextResponse.json(
      { error: 'Failed to update artist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/artists/[artistId]
 * Delete artist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { artistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.delete');
  if (permissionError) return permissionError;

  const { artistId } = params;

  try {
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('id', artistId);

    if (error) throw error;

    return NextResponse.json({ message: 'Artist deleted successfully' });
  } catch (error: any) {
    console.error('Delete artist error:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist', details: error.message },
      { status: 500 }
    );
  }
}
