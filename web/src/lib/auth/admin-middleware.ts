import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin authentication middleware
 * Verifies user is authenticated AND has admin role
 */
export async function requireAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Read from Authorization header
  const authHeader = request.headers.get('Authorization');
  let accessToken = authHeader?.replace('Bearer ', '');

  // Fallback to cookies
  if (!accessToken) {
    accessToken =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('sb-auth-token')?.value;
  }

  if (!accessToken) {
    return {
      user: null,
      adminUser: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Create authenticated client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      adminUser: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Check if user has admin role
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:admin_roles(*)
    `)
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminUser) {
    return {
      user,
      adminUser: null,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user, adminUser, response: null, supabase };
}

/**
 * Check if user has specific admin permission
 */
export function hasPermission(adminUser: any, permission: string): boolean {
  if (!adminUser || !adminUser.role) return false;

  const permissions = adminUser.role.permissions || [];
  return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Require specific permission
 */
export function requirePermission(adminUser: any, permission: string) {
  if (!hasPermission(adminUser, permission)) {
    return NextResponse.json(
      { error: `Forbidden - ${permission} permission required` },
      { status: 403 }
    );
  }
  return null;
}
