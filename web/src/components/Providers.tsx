'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PlayerProvider } from '@/lib/contexts/PlayerContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </AuthProvider>
  );
}
