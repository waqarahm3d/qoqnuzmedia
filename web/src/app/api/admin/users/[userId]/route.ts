import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/users/[userId]
 * Get a specific user's details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
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

    return NextResponse.json({ user: profile });
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
    const { display_name, bio, avatar_url, is_verified } = body;

    // Build update object with only provided fields
    const updates: any = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (is_verified !== undefined) updates.is_verified = is_verified;

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
