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
 * Checks admin_users table in database only
 */
export async function checkAdminAccess(request: NextRequest) {
  const supabase = createClient(request);

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      error: 'Unauthorized',
      status: 401,
    };
  }

  // Use admin client to check admin_users table (bypasses RLS)
  const adminClient = createAdminSupabaseClient();
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users')
    .select('user_id, role_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // User is admin only if they're in database
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
    error: 'Forbidden - Admin access required',
    status: 403,
  };
}
