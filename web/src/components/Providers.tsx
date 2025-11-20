'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { PlayerProvider } from '@/lib/contexts/PlayerContext';
import { SiteSettingsProvider } from '@/lib/contexts/SiteSettingsContext';
import { PWAInstallPrompt } from './PWAInstallPrompt';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <PlayerProvider>
          {children}
          <PWAInstallPrompt />
        </PlayerProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}
