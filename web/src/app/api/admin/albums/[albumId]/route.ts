import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

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
        artists!albums_artist_id_fkey(id, name, profile_image_url),
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
 * Update album
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
    const body = await request.json();
    const {
      title,
      description,
      cover_image_url,
      release_date,
      album_type,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (cover_image_url !== undefined)
      updateData.cover_art_url = cover_image_url;
    if (release_date !== undefined) updateData.release_date = release_date;
    if (album_type !== undefined) updateData.album_type = album_type;

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
