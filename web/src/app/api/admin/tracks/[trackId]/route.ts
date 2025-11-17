import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/tracks/[trackId]
 * Get track details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { trackId } = params;

  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        *,
        artists!tracks_artist_id_fkey(id, name, avatar_url),
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `)
      .eq('id', trackId)
      .single();

    if (error) throw error;

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error: any) {
    console.error('Get track error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tracks/[trackId]
 * Update track
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.edit');
  if (permissionError) return permissionError;

  const { trackId } = params;

  try {
    const body = await request.json();
    const {
      title,
      album_id,
      audio_url,
      duration_ms,
      track_number,
      lyrics,
      is_explicit,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (album_id !== undefined) updateData.album_id = album_id;
    if (audio_url !== undefined) updateData.audio_url = audio_url;
    if (duration_ms !== undefined) updateData.duration_ms = duration_ms;
    if (track_number !== undefined) updateData.track_number = track_number;
    if (lyrics !== undefined) updateData.lyrics = lyrics;
    if (is_explicit !== undefined) updateData.is_explicit = is_explicit;

    const { data: track, error } = await supabase
      .from('tracks')
      .update(updateData)
      .eq('id', trackId)
      .select(`
        *,
        artists!tracks_artist_id_fkey(id, name),
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `)
      .single();

    if (error) throw error;

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error: any) {
    console.error('Update track error:', error);
    return NextResponse.json(
      { error: 'Failed to update track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tracks/[trackId]
 * Delete track
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'content.delete');
  if (permissionError) return permissionError;

  const { trackId } = params;

  try {
    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (error) throw error;

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error: any) {
    console.error('Delete track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete track', details: error.message },
      { status: 500 }
    );
  }
}
