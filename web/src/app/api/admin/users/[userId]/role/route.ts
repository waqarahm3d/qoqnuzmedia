import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * POST /api/admin/users/[userId]/role
 * Assign admin role to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'users.manage');
  if (permissionError) return permissionError;

  const { userId } = params;

  try {
    const body = await request.json();
    const { role_id } = body;

    if (!role_id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if user already has admin role
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingAdmin) {
      // Update existing role
      const { data, error } = await supabase
        .from('admin_users')
        .update({ role_id })
        .eq('user_id', userId)
        .select(`
          *,
          role:admin_roles(*)
        `)
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new admin user
      const { data, error } = await supabase
        .from('admin_users')
        .insert({ user_id: userId, role_id })
        .select(`
          *,
          role:admin_roles(*)
        `)
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ adminUser: result });
  } catch (error: any) {
    console.error('Assign role error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]/role
 * Remove admin role from user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'users.manage');
  if (permissionError) return permissionError;

  const { userId } = params;

  try {
    // Prevent removing own admin role
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin role' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Admin role removed successfully' });
  } catch (error: any) {
    console.error('Remove role error:', error);
    return NextResponse.json(
      { error: 'Failed to remove role', details: error.message },
      { status: 500 }
    );
  }
}
