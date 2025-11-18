'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  DiscoverIcon,
} from '../icons';

const navItems = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Discover', href: '/discover', icon: DiscoverIcon },
  { name: 'Search', href: '/search', icon: SearchIcon },
  { name: 'Library', href: '/library', icon: LibraryIcon },
];

export const MobileNav = () => {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 z-50 pb-safe">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive(item.href) ? 'text-white' : 'text-white/60'
            }`}
          >
            <item.icon size={24} />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
