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
        return;
      }

      // If no user, redirect to signin
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        // Check if user has admin role
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // User is not an admin, redirect to home
          router.push('/home');
          return;
        }

        // User is admin
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
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
