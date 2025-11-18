'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  DashboardIcon,
  AnalyticsIcon,
  MicrophoneIcon,
  DiscIcon,
  MusicIcon,
  PlaylistIcon,
  TheaterIcon,
  UsersIcon,
  PaletteIcon,
  SettingsIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  ChevronLeftIcon,
} from '@/components/icons/admin-icons';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', Icon: DashboardIcon },
    { name: 'Analytics', href: '/admin/analytics', Icon: AnalyticsIcon },
    { name: 'Artists', href: '/admin/artists', Icon: MicrophoneIcon },
    { name: 'Albums', href: '/admin/albums', Icon: DiscIcon },
    { name: 'Tracks', href: '/admin/tracks', Icon: MusicIcon },
    { name: 'Playlists', href: '/admin/playlists', Icon: PlaylistIcon },
    { name: 'Genres', href: '/admin/genres', Icon: TheaterIcon },
    { name: 'Users', href: '/admin/users', Icon: UsersIcon },
    { name: 'Theme', href: '/admin/theme', Icon: PaletteIcon },
    { name: 'Settings', href: '/admin/settings', Icon: SettingsIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
            <Link href="/admin" className="text-xl font-bold text-[#ff5c2e]">
              Qoqnuz Admin
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#ff4a14] text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3" size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#ff4a14] rounded-full flex items-center justify-center text-white font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    Admin
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogoutIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        {/* Header */}
        <header className="bg-gray-800 shadow-lg">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MenuIcon size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeftIcon size={16} />
                Back to Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
