'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PlayerProvider } from '@/lib/contexts/PlayerContext';
import { PWAInstallPrompt } from './PWAInstallPrompt';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        {children}
        <PWAInstallPrompt />
      </PlayerProvider>
    </AuthProvider>
  );
}
