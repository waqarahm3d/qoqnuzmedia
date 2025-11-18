'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase-client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // If auth is still loading, wait
      if (authLoading) {
        console.log('[useAdminAuth] Auth still loading...');
        return;
      }

      // If no user, redirect to signin
      if (!user) {
        console.log('[useAdminAuth] No user found, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      console.log('[useAdminAuth] Checking admin status for user:', user.id);

      try {
        // Check if user has admin role
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id, role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[useAdminAuth] Admin check result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - that's expected for non-admins
          console.error('[useAdminAuth] Error querying admin_users:', error);
          throw error;
        }

        if (!data) {
          // Check if user should be auto-promoted based on email
          // This matches the server-side logic in admin-middleware.ts
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
          const isAutoAdmin = user.email && adminEmails.includes(user.email.toLowerCase());

          console.log('[useAdminAuth] Auto-admin check:', {
            userEmail: user.email,
            adminEmails,
            isAutoAdmin
          });

          if (isAutoAdmin) {
            // User should be auto-promoted - allow access
            // The server-side will create the admin_users record on first API call
            console.log('[useAdminAuth] User is in ADMIN_EMAILS, allowing access');
            setIsAdmin(true);
          } else {
            // User is not an admin, redirect to home
            console.log('[useAdminAuth] User is not an admin, redirecting to home');
            router.push('/home');
            return;
          }
        } else {
          // User is admin
          console.log('[useAdminAuth] User is admin!');
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('[useAdminAuth] Error checking admin status:', error);
        router.push('/home');
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, router]);

  return {
    isAdmin,
    loading: authLoading || checking,
    user,
  };
}
