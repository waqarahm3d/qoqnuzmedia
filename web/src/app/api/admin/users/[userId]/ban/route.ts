import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

/**
 * POST /api/admin/users/[userId]/ban
 * Ban or unban a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    // Prevent banning yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot ban yourself' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_banned } = body;

    if (typeof is_banned !== 'boolean') {
      return NextResponse.json(
        { error: 'is_banned must be a boolean' },
        { status: 400 }
      );
    }

    // Check if the user is an admin
    const { data: targetUserAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Prevent banning other admins (optional - you can remove this check if needed)
    if (targetUserAdmin && is_banned) {
      return NextResponse.json(
        { error: 'Cannot ban admin users. Remove their admin role first.' },
        { status: 400 }
      );
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        is_banned,
        updated_at: new Date().toISOString()
      })
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
      message: `User ${is_banned ? 'banned' : 'unbanned'} successfully`,
      user: updatedProfile
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'Failed to ban/unban user', details: error.message },
      { status: 500 }
    );
  }
}
