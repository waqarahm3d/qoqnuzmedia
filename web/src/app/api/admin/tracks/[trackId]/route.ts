import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { deleteFromR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

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
    console.log('[Track Update] Received data:', body);

    const {
      title,
      album_id,
      audio_url,
      cover_art_url,
      duration_ms,
      track_number,
      lyrics,
      explicit,
      is_explicit,
      genres,
    } = body;

    // Get genre names from genre IDs
    let genreNames: string[] | null = null;
    if (genres && Array.isArray(genres) && genres.length > 0) {
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select('name')
        .in('id', genres);

      if (!genresError && genresData) {
        genreNames = genresData.map(g => g.name);
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (album_id !== undefined) updateData.album_id = album_id || null;
    if (audio_url !== undefined) updateData.audio_url = audio_url;
    if (cover_art_url !== undefined) updateData.cover_art_url = cover_art_url || null;
    if (duration_ms !== undefined) updateData.duration_ms = duration_ms;
    if (track_number !== undefined) updateData.track_number = track_number;
    if (lyrics !== undefined) updateData.lyrics = lyrics || null;
    if (genreNames !== null) updateData.genres = genreNames;

    // Handle explicit field (accept both is_explicit and explicit)
    const explicitValue = explicit !== undefined ? explicit : is_explicit;
    if (explicitValue !== undefined) updateData.explicit = explicitValue;

    console.log('[Track Update] Updating with data:', updateData);

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

    if (error) {
      console.error('[Track Update] Database error:', error);
      throw error;
    }

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    console.log('[Track Update] Success:', track.id);
    return NextResponse.json({ track });
  } catch (error: any) {
    console.error('[Track Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update track', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tracks/[trackId]
 * Delete track and associated files from R2 storage
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
    // First, fetch the track to get file paths
    const { data: track, error: fetchError } = await supabase
      .from('tracks')
      .select('id, audio_url, cover_art_url')
      .eq('id', trackId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch track for deletion:', fetchError);
      throw fetchError;
    }

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Delete audio file from R2 storage
    if (track.audio_url) {
      try {
        console.log(`[Track Delete] Deleting audio from R2: ${track.audio_url}`);
        await deleteFromR2(track.audio_url);
        console.log(`[Track Delete] Audio deleted successfully`);
      } catch (r2Error: any) {
        // Log but don't fail - file might not exist or already deleted
        console.error(`[Track Delete] Failed to delete audio from R2: ${r2Error.message}`);
      }
    }

    // Delete cover art from R2 storage if it exists and is not shared with album
    if (track.cover_art_url && track.cover_art_url.startsWith('covers/')) {
      try {
        console.log(`[Track Delete] Deleting cover art from R2: ${track.cover_art_url}`);
        await deleteFromR2(track.cover_art_url);
        console.log(`[Track Delete] Cover art deleted successfully`);
      } catch (r2Error: any) {
        // Log but don't fail - file might not exist or already deleted
        console.error(`[Track Delete] Failed to delete cover art from R2: ${r2Error.message}`);
      }
    }

    // Delete the track record from database
    const { error: deleteError } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (deleteError) throw deleteError;

    console.log(`[Track Delete] Track ${trackId} deleted successfully with R2 cleanup`);
    return NextResponse.json({ message: 'Track and associated files deleted successfully' });
  } catch (error: any) {
    console.error('Delete track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete track', details: error.message },
      { status: 500 }
    );
  }
}
