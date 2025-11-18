'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ResponsivePlayer } from './ResponsivePlayer';
import { MobileNav } from './MobileNav';
import { NowPlayingOverlay } from '../player/NowPlayingOverlay';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-background text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-24 lg:pb-24">
            {children}
          </div>
        </main>
      </div>

      {/* Responsive Player - Fixed at bottom */}
      <ResponsivePlayer />

      {/* Mobile Navigation - Fixed at bottom on mobile */}
      <MobileNav />

      {/* Now Playing Overlay - Full screen when open */}
      <NowPlayingOverlay />
    </div>
  );
};
