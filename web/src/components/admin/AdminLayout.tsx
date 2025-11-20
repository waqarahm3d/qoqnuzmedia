'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import {
  DashboardIcon,
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
  ChevronDownIcon,
  DownloadIcon,
  AutomationIcon,
  FeaturedIcon,
  ImageIcon,
  MoodIcon,
  DiagnosticsIcon,
  EmailIcon,
  IssuesIcon,
} from '@/components/icons/admin-icons';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('Qoqnuz');
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  // Fetch logo and site name from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          const logoSetting = data.settings.find((s: any) => s.key === 'site_logo_url');
          const nameSetting = data.settings.find((s: any) => s.key === 'site_name');

          if (logoSetting?.value) setLogoUrl(logoSetting.value);
          if (nameSetting?.value) setSiteName(nameSetting.value);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Auto-expand settings if on a settings sub-page
  useEffect(() => {
    const settingsPaths = ['/admin/settings', '/admin/theme', '/admin/email', '/admin/automation', '/admin/diagnostics', '/admin/issues'];
    if (settingsPaths.some(path => pathname?.startsWith(path))) {
      setSettingsExpanded(true);
    }
  }, [pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', Icon: DashboardIcon },
    { name: 'Analytics', href: '/admin/analytics', Icon: DiagnosticsIcon },
    { name: 'Content (CMS)', href: '/admin/content', Icon: FeaturedIcon },
    { name: 'Mood Analysis', href: '/admin/mood-analysis', Icon: MoodIcon },
    { name: 'Artists', href: '/admin/artists', Icon: MicrophoneIcon },
    { name: 'Albums', href: '/admin/albums', Icon: DiscIcon },
    { name: 'Tracks', href: '/admin/tracks', Icon: MusicIcon },
    { name: 'Playlists', href: '/admin/playlists', Icon: PlaylistIcon },
    { name: 'Genres', href: '/admin/genres', Icon: TheaterIcon },
    { name: 'Featured Sections', href: '/admin/featured-sections', Icon: ImageIcon },
    { name: 'Downloads', href: '/admin/downloads', Icon: DownloadIcon },
    { name: 'Users', href: '/admin/users', Icon: UsersIcon },
  ];

  const settingsNavigation = [
    { name: 'General Settings', href: '/admin/settings', Icon: SettingsIcon },
    { name: 'Theme', href: '/admin/theme', Icon: PaletteIcon },
    { name: 'Email', href: '/admin/email', Icon: EmailIcon },
    { name: 'Automation', href: '/admin/automation', Icon: AutomationIcon },
    { name: 'Issues & Feedback', href: '/admin/issues', Icon: IssuesIcon },
    { name: 'Diagnostics', href: '/admin/diagnostics', Icon: DiagnosticsIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <AdminAuthGuard>
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
            <Link href="/admin" className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${siteName} Admin`}
                  className="h-10 max-w-[140px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <ImageIcon size={24} className="text-[#ff4a14]" />
                  <span className="text-lg font-bold text-[#ff4a14]">{siteName}</span>
                </div>
              )}
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

            {/* Settings Section (Expandable) */}
            <div>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  settingsNavigation.some(item => isActive(item.href))
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <SettingsIcon className="mr-3" size={20} />
                  Settings
                </div>
                <ChevronDownIcon
                  size={16}
                  className={`transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {settingsExpanded && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-700 pl-4">
                  {settingsNavigation.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-[#ff4a14] text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-3" size={18} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
    </AdminAuthGuard>
  );
}
