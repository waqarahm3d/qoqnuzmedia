'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores';
import { cn } from '@/lib/utils/cn';

/**
 * Sidebar Component
 *
 * Main navigation sidebar with:
 * - Primary navigation links
 * - Playlists section
 * - Collapse/expand functionality
 * - Active link highlighting
 * - Responsive design
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const primaryNavItems: NavItem[] = [
  { label: 'Home', href: '/home', icon: HomeIcon, exact: true },
  { label: 'Search', href: '/search', icon: SearchIcon },
  { label: 'Your Library', href: '/library', icon: LibraryIcon },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Create Playlist', href: '/library/playlists', icon: PlusIcon },
  { label: 'Liked Songs', href: '/library/tracks', icon: HeartIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-[var(--qz-z-sticky)] bg-[var(--qz-bg-base)] border-r border-[var(--qz-border-subtle)] transition-all duration-300',
        sidebarCollapsed ? 'w-[var(--qz-sidebar-collapsed)]' : 'w-[var(--qz-sidebar-width)]',
        'hidden lg:block' // Hidden on mobile, shown on desktop
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--qz-border-subtle)]">
          {sidebarCollapsed ? (
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--qz-primary)] to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--qz-primary)] to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-xl font-bold text-gradient-primary">Qoqnuz</span>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto qz-scrollbar-thin py-4">
          {/* Primary Navigation */}
          <div className="px-3 mb-6">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-lg transition-colors mb-1',
                  isActive(item.href, item.exact)
                    ? 'bg-[var(--qz-bg-surface-hover)] text-[var(--qz-text-primary)]'
                    : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-overlay-light)]'
                )}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Secondary Navigation */}
          <div className="px-3 mb-6">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-lg transition-colors mb-1',
                  isActive(item.href)
                    ? 'bg-[var(--qz-bg-surface-hover)] text-[var(--qz-text-primary)]'
                    : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-overlay-light)]'
                )}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Playlists Section */}
          {!sidebarCollapsed && (
            <div className="px-3">
              <div className="px-3 py-2 text-xs font-semibold text-[var(--qz-text-tertiary)] uppercase tracking-wider">
                Playlists
              </div>
              <div className="space-y-1">
                {/* Placeholder playlists */}
                <PlaylistLink name="Chill Vibes" href="/playlist/1" />
                <PlaylistLink name="Workout Mix" href="/playlist/2" />
                <PlaylistLink name="Discover Weekly" href="/playlist/3" />
              </div>
            </div>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-4 border-t border-[var(--qz-border-subtle)]">
          <button
            onClick={toggleSidebarCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

// Playlist Link Component
function PlaylistLink({ name, href }: { name: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'block px-3 py-2 rounded-lg transition-colors truncate',
        isActive
          ? 'bg-[var(--qz-bg-surface-hover)] text-[var(--qz-text-primary)]'
          : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] hover:bg-[var(--qz-overlay-light)]'
      )}
    >
      {name}
    </Link>
  );
}

// Icons

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
