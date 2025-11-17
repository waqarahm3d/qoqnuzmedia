import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase';

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
      supabase: createAdminSupabaseClient(),
    };
  }

  // Create authenticated client for user verification
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      adminUser: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      supabase: createAdminSupabaseClient(),
    };
  }

  // Use admin client for database operations (bypasses RLS)
  const supabase = createAdminSupabaseClient();

  // Check if user has admin role
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:admin_roles(*)
    `)
    .eq('user_id', user.id)
    .single();

  // If no admin user found, check if this is the first user (auto-admin)
  // or if user email is in ADMIN_EMAILS environment variable
  if (adminError || !adminUser) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const isAutoAdmin = adminEmails.includes(user.email?.toLowerCase() || '');

    if (isAutoAdmin) {
      // Get Super Admin role
      const { data: superAdminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('name', 'Super Admin')
        .single();

      if (superAdminRole) {
        // Auto-create admin user entry
        const { data: newAdminUser } = await supabase
          .from('admin_users')
          .insert({
            user_id: user.id,
            role_id: superAdminRole.id,
          })
          .select(`
            *,
            role:admin_roles(*)
          `)
          .single();

        return { user, adminUser: newAdminUser, response: null, supabase };
      }
    }

    return {
      user,
      adminUser: null,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required. Contact administrator to grant access.' },
        { status: 403 }
      ),
      supabase,
    };
  }

  return { user, adminUser, response: null, supabase };
}

/**
 * Check if user has specific admin permission
 */
export function hasPermission(adminUser: any, permission: string): boolean {
  if (!adminUser || !adminUser.role) return false;

  // Handle JSONB permissions from database
  let permissions = adminUser.role.permissions || [];

  // If permissions is a string (JSONB), parse it
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch (e) {
      console.error('Failed to parse permissions:', e);
      return false;
    }
  }

  // Ensure permissions is an array
  if (!Array.isArray(permissions)) {
    console.error('Permissions is not an array:', permissions);
    return false;
  }

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
