'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, UserIcon, LogoutIcon } from '../icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { useState, useRef, useEffect } from 'react';

export const Header = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Go forward"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-full px-1 pr-3 py-1 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <span className="text-sm font-semibold hidden sm:inline">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-xl border border-white/10 py-1">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <UserIcon size={16} />
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m6-9h-6m0 0H6m6 0V7" />
                </svg>
                Settings
              </Link>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors w-full text-left"
              >
                <LogoutIcon size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Need to import Link
import Link from 'next/link';
