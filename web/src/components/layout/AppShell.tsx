'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Player } from '../features/player/Player';
import { useUIStore } from '@/lib/stores';
import { cn } from '@/lib/utils/cn';

/**
 * AppShell Component
 *
 * Main application layout wrapper that orchestrates:
 * - Sidebar navigation (desktop)
 * - Top header
 * - Main content area
 * - Bottom player
 * - Mobile navigation
 *
 * Features:
 * - Responsive layout
 * - Player-aware padding
 * - Sidebar collapse handling
 * - Smooth transitions
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <HomePage />
 * </AppShell>
 * ```
 */

export interface AppShellProps {
  children: React.ReactNode;
  /** Hide the sidebar (e.g., for auth pages) */
  hideSidebar?: boolean;
  /** Hide the header (e.g., for landing pages) */
  hideHeader?: boolean;
  /** Hide the player (e.g., for auth pages) */
  hidePlayer?: boolean;
  /** Custom content className */
  contentClassName?: string;
}

export function AppShell({
  children,
  hideSidebar = false,
  hideHeader = false,
  hidePlayer = false,
  contentClassName,
}: AppShellProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--qz-bg-base)] text-[var(--qz-text-primary)]">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar />}

      {/* Main Content Area */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          !hideSidebar && 'lg:pl-[var(--qz-sidebar-width)]',
          !hideSidebar && sidebarCollapsed && 'lg:pl-[var(--qz-sidebar-collapsed)]'
        )}
      >
        {/* Header */}
        {!hideHeader && <Header />}

        {/* Main Content */}
        <main
          className={cn(
            'min-h-[calc(100vh-var(--qz-header-height))] pb-[calc(var(--qz-player-height)+env(safe-area-inset-bottom))] lg:pb-[var(--qz-player-height)]',
            !hideHeader && 'pt-0',
            hideHeader && 'pt-[var(--qz-header-height)]',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>

      {/* Player */}
      {!hidePlayer && <Player />}

      {/* Mobile Navigation */}
      {!hideSidebar && <MobileNav />}
    </div>
  );
}
