import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[userId]/convert-to-artist
 * Convert a user to an artist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const body = await request.json();
    const { artist_name, bio, genres } = body;

    if (!artist_name) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    // Check if user already has an artist profile
    const { data: existingLink } = await supabase
      .from('user_artist_links')
      .select('artist_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { error: 'User already has an artist profile' },
        { status: 400 }
      );
    }

    // Get user's profile for avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, display_name')
      .eq('id', userId)
      .single();

    // Create artist
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .insert({
        name: artist_name,
        bio: bio || null,
        avatar_url: profile?.avatar_url || null,
        verified: false,
        genres: genres || [],
      })
      .select()
      .single();

    if (artistError) throw artistError;

    // Link user to artist
    const { error: linkError } = await supabase
      .from('user_artist_links')
      .insert({
        user_id: userId,
        artist_id: artist.id,
        is_primary: true,
      });

    if (linkError) throw linkError;

    return NextResponse.json({
      message: 'User converted to artist successfully',
      artist,
    });
  } catch (error: any) {
    console.error('Convert to artist error:', error);
    return NextResponse.json(
      { error: 'Failed to convert user to artist', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]/convert-to-artist
 * Remove artist profile from user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    // Get the artist link
    const { data: link } = await supabase
      .from('user_artist_links')
      .select('artist_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!link) {
      return NextResponse.json(
        { error: 'User does not have an artist profile' },
        { status: 404 }
      );
    }

    // Delete the link
    const { error: linkError } = await supabase
      .from('user_artist_links')
      .delete()
      .eq('user_id', userId);

    if (linkError) throw linkError;

    // Optionally delete the artist (or keep it orphaned)
    // For now, we'll keep the artist but unlink it

    return NextResponse.json({
      message: 'Artist profile unlinked from user',
    });
  } catch (error: any) {
    console.error('Remove artist link error:', error);
    return NextResponse.json(
      { error: 'Failed to remove artist profile', details: error.message },
      { status: 500 }
    );
  }
}
