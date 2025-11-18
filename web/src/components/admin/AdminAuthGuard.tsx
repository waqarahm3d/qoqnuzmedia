'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is logged in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // Not logged in - redirect to signin
        router.push('/auth/signin?redirectTo=/admin');
        return;
      }

      // Check if user has admin access
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (adminError || !adminUser) {
        // Logged in but not admin - redirect to home
        router.push('/home');
        return;
      }

      // User is authenticated and is admin
      setIsAuthorized(true);
    } catch (error) {
      console.error('Admin auth check failed:', error);
      router.push('/auth/signin');
    } finally {
      setIsChecking(false);
    }
  };

  // Show nothing while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff4a14] mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
