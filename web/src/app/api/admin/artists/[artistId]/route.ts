import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

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
 * Update artist
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
    const body = await request.json();
    const {
      name,
      bio,
      avatar_url,
      cover_image_url,
      verified,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined)
      updateData.avatar_url = avatar_url;
    if (cover_image_url !== undefined)
      updateData.cover_image_url = cover_image_url;
    if (verified !== undefined) updateData.verified = verified;

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
