'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define all available site settings with their types
export interface SiteSettings {
  // Branding
  site_name: string;
  site_tagline: string;
  site_logo_url: string;
  site_favicon_url: string;

  // App Information
  app_description: string;
  app_short_description: string;
  footer_text: string;
  copyright_text: string;

  // Contact & Social
  support_email: string;
  contact_email: string;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;

  // Theme Colors
  theme_primary_color: string;
  theme_secondary_color: string;
  theme_accent_color: string;

  // Features
  enable_stories: boolean;
  enable_group_sessions: boolean;
  enable_user_uploads: boolean;
  enable_social_features: boolean;

  // Upload Settings
  max_upload_size_mb: number;

  // OAuth Providers
  oauth_google_enabled: boolean;
  oauth_apple_enabled: boolean;
  oauth_facebook_enabled: boolean;
  oauth_github_enabled: boolean;
  oauth_twitter_enabled: boolean;
  oauth_discord_enabled: boolean;
  oauth_microsoft_enabled: boolean;
  oauth_spotify_enabled: boolean;

  // Headers & Messages
  home_hero_title: string;
  home_hero_subtitle: string;
  discover_page_title: string;
  discover_page_subtitle: string;
  search_placeholder: string;

  // PWA
  pwa_install_title: string;
  pwa_install_subtitle: string;

  // Authentication
  signin_title: string;
  signin_subtitle: string;
  signup_title: string;
  signup_subtitle: string;

  // SMTP Email Configuration
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
}

// Default values for all settings
const defaultSettings: SiteSettings = {
  // Branding
  site_name: 'Qoqnuz Music',
  site_tagline: 'Stream Your Soundtrack',
  site_logo_url: '',
  site_favicon_url: '',

  // App Information
  app_description: 'Modern music streaming platform with social features',
  app_short_description: 'Stream your favorite music',
  footer_text: 'Built with ❤️ for music lovers',
  copyright_text: '© 2025 Qoqnuz Music. All rights reserved.',

  // Contact & Social
  support_email: 'support@qoqnuz.com',
  contact_email: 'contact@qoqnuz.com',
  social_twitter: '',
  social_facebook: '',
  social_instagram: '',
  social_youtube: '',

  // Theme Colors
  theme_primary_color: '#ff4a14',
  theme_secondary_color: '#191414',
  theme_accent_color: '#FFFFFF',

  // Features
  enable_stories: false,
  enable_group_sessions: false,
  enable_user_uploads: false,
  enable_social_features: true,

  // Upload Settings
  max_upload_size_mb: 500,

  // OAuth Providers
  oauth_google_enabled: false,
  oauth_apple_enabled: false,
  oauth_facebook_enabled: false,
  oauth_github_enabled: false,
  oauth_twitter_enabled: false,
  oauth_discord_enabled: false,
  oauth_microsoft_enabled: false,
  oauth_spotify_enabled: false,

  // Headers & Messages
  home_hero_title: 'Welcome to Qoqnuz Music',
  home_hero_subtitle: 'Discover and stream millions of songs',
  discover_page_title: 'Discover Music',
  discover_page_subtitle: 'Explore new releases and trending tracks',
  search_placeholder: 'Search for songs, artists, albums...',

  // PWA
  pwa_install_title: 'Install Qoqnuz Music',
  pwa_install_subtitle: 'Listen offline, faster access',

  // Authentication
  signin_title: 'Sign in to Qoqnuz',
  signin_subtitle: 'Continue your music journey',
  signup_title: 'Join Qoqnuz Music',
  signup_subtitle: 'Create an account to start listening',

  // SMTP Email Configuration
  smtp_enabled: false,
  smtp_host: 'smtp.zeptomail.com',
  smtp_port: 587,
  smtp_secure: false,
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: 'noreply@yourdomain.com',
  smtp_from_name: 'Qoqnuz Music',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();

      // Merge fetched settings with defaults
      const mergedSettings = { ...defaultSettings };

      if (data.settings && Array.isArray(data.settings)) {
        data.settings.forEach((setting: any) => {
          const key = setting.key as keyof SiteSettings;
          if (key in mergedSettings) {
            (mergedSettings as any)[key] = setting.value;
          }
        });
      }

      setSettings(mergedSettings);
    } catch (err: any) {
      console.error('Error fetching site settings:', err);
      setError(err.message);
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// Hook to use site settings
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }

  return context;
}

// Convenience hook to get a single setting with fallback
export function useSetting<K extends keyof SiteSettings>(
  key: K,
  fallback?: SiteSettings[K]
): SiteSettings[K] {
  const { settings } = useSiteSettings();
  return settings[key] ?? fallback ?? defaultSettings[key];
}
