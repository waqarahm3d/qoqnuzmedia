'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Setting {
  key: string;
  value: any;
  description: string;
}

interface FeaturedSection {
  id: string;
  title: string;
  section_type: string;
  is_active: boolean;
  display_order: number;
}

export default function ContentManagementPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [featuredSections, setFeaturedSections] = useState<FeaturedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'homepage' | 'pages' | 'navigation'>('homepage');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch settings
      const settingsResponse = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        const settingsMap: Record<string, Setting> = {};
        data.settings.forEach((setting: Setting) => {
          settingsMap[setting.key] = setting;
        });
        setSettings(settingsMap);
      }

      // Fetch featured sections
      const sectionsResponse = await fetch('/api/admin/featured-sections', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (sectionsResponse.ok) {
        const data = await sectionsResponse.json();
        setFeaturedSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: {
        key,
        value,
        description: settings[key]?.description || '',
      },
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ settings: Object.values(settings) }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Content updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div style={{ color: '#b3b3b3' }}>Loading content management...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Content Management
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Manage all front-end content dynamically - homepage, pages, navigation, and more
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#22c55e' : '#fca5a5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #282828',
          paddingBottom: '0'
        }}>
          {[
            { id: 'homepage', label: 'Homepage', icon: '🏠' },
            { id: 'pages', label: 'Pages & Copy', icon: '📄' },
            { id: 'navigation', label: 'Navigation & Footer', icon: '🧭' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id ? '#ff4a14' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#b3b3b3',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Homepage Tab */}
        {activeTab === 'homepage' && (
          <div>
            {/* Hero Section */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                Hero Section
              </h2>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px' }}>
                Main banner content displayed on the homepage
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.home_hero_title?.value || ''}
                    onChange={(e) => updateSetting('home_hero_title', e.target.value)}
                    placeholder="Welcome to Qoqnuz Music"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Hero Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.home_hero_subtitle?.value || ''}
                    onChange={(e) => updateSetting('home_hero_subtitle', e.target.value)}
                    placeholder="Discover and stream millions of songs"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Featured Sections */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                    Featured Sections
                  </h2>
                  <p style={{ color: '#b3b3b3', fontSize: '14px' }}>
                    Content sections displayed on the homepage (tracks, albums, artists, playlists)
                  </p>
                </div>
                <button
                  onClick={() => router.push('/admin/featured-sections')}
                  style={{
                    padding: '10px 20px',
                    background: '#ff4a14',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Manage Sections →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {featuredSections.length > 0 ? (
                  featuredSections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        padding: '16px',
                        background: '#121212',
                        borderRadius: '8px',
                        border: '1px solid #282828',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {section.section_type === 'tracks' && '🎵'}
                          {section.section_type === 'albums' && '💿'}
                          {section.section_type === 'artists' && '🎤'}
                          {section.section_type === 'playlists' && '📋'}
                        </span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                            {section.title}
                          </div>
                          <div style={{ fontSize: '13px', color: '#b3b3b3' }}>
                            Type: {section.section_type} • Order: {section.display_order}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background: section.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        color: section.is_active ? '#22c55e' : '#6b7280',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {section.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
                    No featured sections yet. Click "Manage Sections" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pages & Copy Tab */}
        {activeTab === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Discover Page */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Discover Page
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={settings.discover_page_title?.value || ''}
                    onChange={(e) => updateSetting('discover_page_title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Page Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.discover_page_subtitle?.value || ''}
                    onChange={(e) => updateSetting('discover_page_subtitle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Authentication Pages */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Authentication Pages
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Sign In */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    Sign In Page
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={settings.signin_title?.value || ''}
                        onChange={(e) => updateSetting('signin_title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#121212',
                          color: '#ffffff',
                          border: '1px solid #282828',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={settings.signin_subtitle?.value || ''}
                        onChange={(e) => updateSetting('signin_subtitle', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#121212',
                          color: '#ffffff',
                          border: '1px solid #282828',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sign Up */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #282828' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    Sign Up Page
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={settings.signup_title?.value || ''}
                        onChange={(e) => updateSetting('signup_title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#121212',
                          color: '#ffffff',
                          border: '1px solid #282828',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={settings.signup_subtitle?.value || ''}
                        onChange={(e) => updateSetting('signup_subtitle', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#121212',
                          color: '#ffffff',
                          border: '1px solid #282828',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Search
              </h2>
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Search Placeholder Text
                </label>
                <input
                  type="text"
                  value={settings.search_placeholder?.value || ''}
                  onChange={(e) => updateSetting('search_placeholder', e.target.value)}
                  placeholder="Search for songs, artists, albums..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* PWA Install */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                PWA Install Prompt
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={settings.pwa_install_title?.value || ''}
                    onChange={(e) => updateSetting('pwa_install_title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.pwa_install_subtitle?.value || ''}
                    onChange={(e) => updateSetting('pwa_install_subtitle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Footer Tab */}
        {activeTab === 'navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Footer */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Footer Content
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={settings.footer_text?.value || ''}
                    onChange={(e) => updateSetting('footer_text', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Copyright Text
                  </label>
                  <input
                    type="text"
                    value={settings.copyright_text?.value || ''}
                    onChange={(e) => updateSetting('copyright_text', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Social Media Links
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Twitter/X
                  </label>
                  <input
                    type="url"
                    value={settings.social_twitter?.value || ''}
                    onChange={(e) => updateSetting('social_twitter', e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.social_facebook?.value || ''}
                    onChange={(e) => updateSetting('social_facebook', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.social_instagram?.value || ''}
                    onChange={(e) => updateSetting('social_instagram', e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.social_youtube?.value || ''}
                    onChange={(e) => updateSetting('social_youtube', e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '12px 32px',
              background: saving ? '#282828' : '#ff4a14',
              color: '#ffffff',
              border: 'none',
              borderRadius: '500px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
