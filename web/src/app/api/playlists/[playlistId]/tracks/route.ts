import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * POST /api/playlists/[playlistId]/tracks
 * Add a track to a playlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const body = await request.json();
    const { track_id } = body;

    if (!track_id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Verify playlist ownership
    const { data: playlist } = await supabase
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (!playlist || playlist.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get current max position
    const { data: maxPosition } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosition?.position || 0) + 1;

    const { error } = await supabase.from('playlist_tracks').insert({
      playlist_id: playlistId,
      track_id,
      position: newPosition,
    });

    if (error) throw error;

    return NextResponse.json(
      { message: 'Track added to playlist successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add track to playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/playlists/[playlistId]/tracks
 * Remove a track from a playlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;
  const { searchParams } = new URL(request.url);
  const track_id = searchParams.get('track_id');

  if (!track_id) {
    return NextResponse.json(
      { error: 'Track ID is required' },
      { status: 400 }
    );
  }

  try {
    // Verify playlist ownership
    const { data: playlist } = await supabase
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (!playlist || playlist.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', track_id);

    if (error) throw error;

    return NextResponse.json({
      message: 'Track removed from playlist successfully',
    });
  } catch (error: any) {
    console.error('Remove track from playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove track from playlist', details: error.message },
      { status: 500 }
    );
  }
}
