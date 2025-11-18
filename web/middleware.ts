import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // If no session, redirect to signin
    if (!session) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin access
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    // Check ADMIN_EMAILS environment variable for auto-admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const isAutoAdmin = session.user.email && adminEmails.includes(session.user.email.toLowerCase());

    // If not admin and not in auto-admin list, deny access
    if (!adminUser && !isAutoAdmin) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
