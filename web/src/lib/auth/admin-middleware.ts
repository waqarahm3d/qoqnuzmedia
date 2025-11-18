import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminSupabaseClient } from '@/lib/supabase';

/**
 * Admin authentication middleware
 * Verifies user is authenticated AND has admin role
 */
export async function requireAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create Supabase client with proper SSR cookie handling
  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set() {},
      remove() {},
    },
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

  // Check if user has admin role in the database
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:admin_roles(*)
    `)
    .eq('user_id', user.id)
    .single();

  // If no admin user found, deny access
  if (adminError || !adminUser) {
    return {
      user,
      adminUser: null,
      response: NextResponse.json(
        {
          error: 'Forbidden - Admin access required.',
          message: 'You must be granted admin access by an existing administrator. Contact your system administrator to request access.',
        },
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
