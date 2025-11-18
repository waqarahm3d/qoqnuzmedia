import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

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
 * Checks both:
 * 1. admin_users table in database
 * 2. ADMIN_EMAILS environment variable
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

  // Check if user is in admin_users table
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id, role_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Check if user email is in ADMIN_EMAILS environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  const isAutoAdmin = user.email && adminEmails.includes(user.email.toLowerCase());

  // User is admin if they're in database OR in ADMIN_EMAILS
  if (adminUser || isAutoAdmin) {
    return {
      user,
      isAdmin: true,
      isDatabaseAdmin: !!adminUser,
      isEnvAdmin: isAutoAdmin,
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
