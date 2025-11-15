import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/playlists/[playlistId]
 * Get playlist details with tracks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(
          id,
          added_at,
          track:tracks(
            id,
            title,
            duration_ms,
            artists!tracks_artist_id_fkey(id, name),
            albums!tracks_album_id_fkey(id, title, cover_image_url)
          )
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
 * PUT /api/playlists/[playlistId]
 * Update playlist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const body = await request.json();
    const { name, description, is_public, cover_image_url } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (cover_image_url !== undefined)
      updateData.cover_image_url = cover_image_url;

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updateData)
      .eq('id', playlistId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
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
 * DELETE /api/playlists/[playlistId]
 * Delete playlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('owner_id', user.id);

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
