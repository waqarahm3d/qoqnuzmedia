import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from './supabase';

/**
 * Create Supabase client from request cookies
 */
export function createClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Check if a user has admin access
 * Returns the authenticated user if they are an admin, null otherwise
 *
 * This function ONLY checks the admin_users table in the database.
 * There is no environment variable fallback - users must be granted admin access
 * through the database.
 */
export async function checkAdminAccess(request: NextRequest) {
  // Use regular client to get authenticated user from cookies
  const authClient = createClient(request);

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      error: 'Unauthorized',
      status: 401,
    };
  }

  // Use admin client (service role) to check admin status
  // This bypasses RLS and ensures we can read admin_users table
  const adminClient = createAdminSupabaseClient();

  // Check if user is in admin_users table
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users')
    .select('user_id, role_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // User is admin only if they're in the database
  if (adminUser && !adminError) {
    return {
      user,
      isAdmin: true,
      adminUser,
      error: null,
      status: 200,
    };
  }

  return {
    user: null,
    error: 'Forbidden - Admin access required. Contact administrator to request access.',
    status: 403,
  };
}
