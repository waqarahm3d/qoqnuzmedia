import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[userId]
 * Get a specific user's details with social links and artist info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    // Get user profile with admin info
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        admin_users!admin_users_user_id_fkey(
          role_id,
          role:admin_roles(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get social links
    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_id', userId);

    // Get linked artist (if user is an artist)
    const { data: artistLinks } = await supabase
      .from('user_artist_links')
      .select(`
        artist_id,
        is_primary,
        artists (
          id,
          name,
          bio,
          avatar_url,
          verified,
          genres
        )
      `)
      .eq('user_id', userId);

    // Get user's email from auth.users (admin only)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    return NextResponse.json({
      user: {
        ...profile,
        email: authUser?.user?.email,
        email_confirmed_at: authUser?.user?.email_confirmed_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at,
        social_links: socialLinks || [],
        artist_profiles: artistLinks || [],
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[userId]
 * Update user profile details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const body = await request.json();
    const {
      display_name,
      bio,
      avatar_url,
      is_verified,
      is_banned,
      username,
      full_name,
      country,
      website,
      phone,
      date_of_birth,
      gender,
      preferences
    } = body;

    // Build update object with only provided fields
    const updates: any = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (is_banned !== undefined) updates.is_banned = is_banned;
    if (username !== undefined) updates.username = username;
    if (full_name !== undefined) updates.full_name = full_name;
    if (country !== undefined) updates.country = country;
    if (website !== undefined) updates.website = website;
    if (phone !== undefined) updates.phone = phone;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (gender !== undefined) updates.gender = gender;
    if (preferences !== undefined) updates.preferences = preferences;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedProfile
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}
