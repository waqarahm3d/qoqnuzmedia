import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

/**
 * GET /api/admin/albums/[albumId]
 * Get album details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { albumId } = params;

  try {
    const { data: album, error } = await supabase
      .from('albums')
      .select(`
        *,
        artists!albums_artist_id_fkey(id, name, avatar_url),
        tracks(id, title, track_number, duration_ms, play_count)
      `)
      .eq('id', albumId)
      .single();

    if (error) throw error;

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error('Get album error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/albums/[albumId]
 * Update album with optional cover image upload
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.edit');
  if (permissionError) return permissionError;

  const { albumId } = params;

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const release_date = formData.get('release_date') as string;
    const album_type = formData.get('album_type') as string;
    const coverFile = formData.get('cover') as File | null;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (release_date !== undefined) updateData.release_date = release_date;
    if (album_type !== undefined) updateData.album_type = album_type;

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
      const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-cover.${fileExt}`;
      const filePath = `albums/covers/${fileName}`;

      const buffer = Buffer.from(await coverFile.arrayBuffer());
      await uploadToR2(filePath, buffer, coverFile.type);
      updateData.cover_art_url = filePath;
    }

    const { data: album, error } = await supabase
      .from('albums')
      .update(updateData)
      .eq('id', albumId)
      .select(`
        *,
        artists!albums_artist_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error('Update album error:', error);
    return NextResponse.json(
      { error: 'Failed to update album', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/albums/[albumId]
 * Delete album
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.delete');
  if (permissionError) return permissionError;

  const { albumId } = params;

  try {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId);

    if (error) throw error;

    return NextResponse.json({ message: 'Album deleted successfully' });
  } catch (error: any) {
    console.error('Delete album error:', error);
    return NextResponse.json(
      { error: 'Failed to delete album', details: error.message },
      { status: 500 }
    );
  }
}
