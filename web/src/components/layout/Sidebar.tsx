'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlusIcon,
  HeartFilledIcon,
} from '../icons';

const navItems = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Search', href: '/search', icon: SearchIcon },
  { name: 'Your Library', href: '/library', icon: LibraryIcon },
];

const libraryItems = [
  { name: 'Create Playlist', href: '/playlist/create', icon: PlusIcon },
  { name: 'Liked Songs', href: '/liked', icon: HeartFilledIcon },
];

export const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-black p-6 gap-6">
      {/* Main Navigation */}
      <nav className="space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-4 text-sm font-semibold transition-colors hover:text-white ${
              isActive(item.href) ? 'text-white' : 'text-white/60'
            }`}
          >
            <item.icon size={24} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-6 space-y-4">
        {libraryItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-4 text-sm font-semibold transition-colors hover:text-white ${
              isActive(item.href) ? 'text-white' : 'text-white/60'
            }`}
          >
            <item.icon size={24} />
            {item.name}
          </Link>
        ))}
      </div>

      {/* Playlists Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="space-y-2 pr-2">
          {/* These will be dynamically loaded playlists */}
          {[
            'My Playlist #1',
            'Chill Vibes',
            'Workout Mix',
            'Study Session',
            'Party Hits',
          ].map((playlist, i) => (
            <Link
              key={i}
              href={`/playlist/${i + 1}`}
              className="block text-sm text-white/60 hover:text-white transition-colors py-1"
            >
              {playlist}
            </Link>
          ))}
        </div>
      </div>

      {/* Install App Prompt */}
      <div className="border-t border-white/10 pt-6">
        <Link
          href="/download"
          className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15.75 2H14V0h-1.5v2H7.5V0H6v2H4.25C3.01 2 2 3.01 2 4.25v11.5C2 16.99 3.01 18 4.25 18h11.5c1.24 0 2.25-1.01 2.25-2.25V4.25C18 3.01 16.99 2 15.75 2zM16.5 15.75c0 .41-.34.75-.75.75H4.25c-.41 0-.75-.34-.75-.75V7h13v8.75z" />
          </svg>
          Install App
        </Link>
      </div>
    </aside>
  );
};
