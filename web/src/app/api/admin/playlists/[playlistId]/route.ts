import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/playlists/[playlistId]
 * Get playlist details with tracks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        *,
        profiles!playlists_owner_id_fkey(id, display_name, avatar_url),
        playlist_tracks(
          id,
          position,
          added_at,
          tracks(id, title, duration_ms, artists!tracks_artist_id_fkey(id, name))
        )
      `)
      .eq('id', playlistId)
      .single();

    if (error) throw error;

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error: any) {
    console.error('Get playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/playlists/[playlistId]
 * Update playlist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.edit');
  if (permissionError) return permissionError;

  const { playlistId } = params;

  try {
    const body = await request.json();
    const { name, description, cover_image_url, is_public, is_collaborative } =
      body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (cover_image_url !== undefined)
      updateData.cover_image_url = cover_image_url;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (is_collaborative !== undefined)
      updateData.is_collaborative = is_collaborative;

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updateData)
      .eq('id', playlistId)
      .select(`
        *,
        profiles!playlists_owner_id_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error: any) {
    console.error('Update playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/playlists/[playlistId]
 * Delete playlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.delete');
  if (permissionError) return permissionError;

  const { playlistId } = params;

  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;

    return NextResponse.json({ message: 'Playlist deleted successfully' });
  } catch (error: any) {
    console.error('Delete playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist', details: error.message },
      { status: 500 }
    );
  }
}
