import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        admin_users!admin_users_user_id_fkey(role_id)
      `, { count: 'exact' });

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch emails for all users from auth.users
    const usersWithEmail = await Promise.all(
      (users || []).map(async (profile) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: authUser?.user?.email || null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithEmail,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Bulk delete users
 */
export async function DELETE(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (user_ids.includes(user!.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if any of the users are admins
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .in('user_id', user_ids);

    if (adminCheck && adminCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete admin users. Remove their admin role first.' },
        { status: 400 }
      );
    }

    // Delete users from auth.users (this will cascade to profiles)
    const deleteResults = [];
    const errors = [];

    for (const userId of user_ids) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        errors.push({ userId, error: error.message });
      } else {
        deleteResults.push(userId);
      }
    }

    if (errors.length > 0 && deleteResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete users', details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully deleted ${deleteResults.length} user(s)`,
      deleted: deleteResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Delete users error:', error);
    return NextResponse.json(
      { error: 'Failed to delete users', details: error.message },
      { status: 500 }
    );
  }
}
