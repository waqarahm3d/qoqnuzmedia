'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlusIcon,
  HeartFilledIcon,
  DiscoverIcon,
  SparklesIcon,
} from '../icons';
import { usePlaylists } from '@/lib/hooks/useMusic';

const navItems = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Search', href: '/search', icon: SearchIcon },
  { name: 'Discover', href: '/discover', icon: DiscoverIcon },
  { name: 'Your Library', href: '/library', icon: LibraryIcon },
];

const libraryItems = [
  { name: 'Create Playlist', href: '/playlist/create', icon: PlusIcon },
  { name: 'Liked Songs', href: '/liked', icon: HeartFilledIcon },
  { name: 'Smart Playlists', href: '/playlists/smart', icon: SparklesIcon },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { playlists, loading } = usePlaylists(10);

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
          {loading ? (
            <div className="text-sm text-white/40 py-1">Loading playlists...</div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist: any) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="block text-sm text-white/60 hover:text-white transition-colors py-1"
              >
                {playlist.name}
              </Link>
            ))
          ) : (
            <div className="text-sm text-white/40 py-1">No playlists yet</div>
          )}
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
