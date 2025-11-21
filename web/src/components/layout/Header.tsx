'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores';
import { cn } from '@/lib/utils/cn';

/**
 * Header Component
 *
 * Top navigation bar with:
 * - Back/forward navigation
 * - Search bar
 * - User menu
 * - Theme toggle
 * - Notifications
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */

export function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-[var(--qz-z-sticky)] bg-[var(--qz-bg-base)]/80 backdrop-blur-lg border-b border-[var(--qz-border-subtle)]">
      <div className="flex items-center justify-between gap-4 px-6 h-[var(--qz-header-height)]">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)] hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
            aria-label="Go forward"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--qz-text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-full text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)] focus:outline-none focus:border-[var(--qz-primary)] focus:ring-2 focus:ring-[var(--qz-primary)]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[var(--qz-text-tertiary)] hover:text-[var(--qz-text-primary)]"
                aria-label="Clear search"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--qz-error)] rounded-full" />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

// User Menu Component
function UserMenu() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--qz-primary)] to-orange-600 flex items-center justify-center text-white font-semibold hover:opacity-90 transition-opacity"
        aria-label="User menu"
      >
        U
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-lg shadow-xl overflow-hidden z-20">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="w-5 h-5 text-[var(--qz-text-secondary)]" />
              <span className="text-sm font-medium">Profile</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="w-5 h-5 text-[var(--qz-text-secondary)]" />
              <span className="text-sm font-medium">Settings</span>
            </Link>

            <div className="h-px bg-[var(--qz-border-subtle)]" />

            <button
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[var(--qz-bg-surface-hover)] transition-colors text-[var(--qz-error)]"
              onClick={() => {
                setIsOpen(false);
                // Handle logout
              }}
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Icons

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
