import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Authentication middleware for API routes
 * Verifies user is authenticated and returns authenticated Supabase client
 */
export async function requireAuth(request: NextRequest) {
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
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, response: null, supabase };
}
