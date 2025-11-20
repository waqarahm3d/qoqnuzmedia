'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  DiscoverIcon,
  DownloadIcon,
} from '../icons';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  display_in_footer: boolean;
}

const navItems = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Discover', href: '/discover', icon: DiscoverIcon },
  { name: 'Search', href: '/search', icon: SearchIcon },
  { name: 'Downloads', href: '/downloads', icon: DownloadIcon },
  { name: 'Library', href: '/library', icon: LibraryIcon },
];

export const MobileNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showPagesMenu, setShowPagesMenu] = useState(false);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    fetchCustomPages();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPagesMenu(false);
      }
    };

    if (showPagesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPagesMenu]);

  const fetchCustomPages = async () => {
    try {
      setPagesLoading(true);
      const response = await fetch('/api/pages');
      if (response.ok) {
        const data = await response.json();
        setCustomPages(data.pages.filter((p: CustomPage) => p.display_in_footer));
      }
    } catch (error) {
      console.error('Failed to fetch custom pages:', error);
    } finally {
      setPagesLoading(false);
    }
  };

  const handleHomeClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href && customPages.length > 0) {
      e.preventDefault();
      setShowPagesMenu(!showPagesMenu);
    } else {
      setShowPagesMenu(false);
    }
  };

  return (
    <>
      {/* Pages Menu - Slides up from bottom */}
      {showPagesMenu && customPages.length > 0 && (
        <div
          ref={menuRef}
          className="lg:hidden fixed bottom-16 left-0 right-0 bg-[#181818] border-t border-white/10 z-40 animate-slide-up max-h-[50vh] overflow-y-auto"
        >
          <div className="p-4">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Pages
            </div>
            <div className="space-y-1">
              {customPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  onClick={() => setShowPagesMenu(false)}
                  className={`block px-4 py-3 rounded-lg text-sm transition-colors ${
                    pathname === `/${page.slug}`
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 z-50 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isHome = item.href === '/home';
            const hasPages = customPages.length > 0;

            return isHome && hasPages ? (
              <button
                key={item.name}
                onClick={(e) => {
                  if (pathname === item.href) {
                    handleHomeClick(e, item.href);
                  } else {
                    router.push(item.href);
                    setShowPagesMenu(false);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  isActive(item.href) ? 'text-white' : 'text-white/60'
                }`}
              >
                <item.icon size={24} />
                <span className="text-xs font-medium">{item.name}</span>
                {hasPages && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#ff4a14] rounded-full" />
                )}
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setShowPagesMenu(false)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive(item.href) ? 'text-white' : 'text-white/60'
                }`}
              >
                <item.icon size={24} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
