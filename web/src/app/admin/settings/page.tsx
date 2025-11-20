'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Setting {
  key: string;
  value: any;
  description: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch settings';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to fetch settings (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText) {
        // Empty response, initialize with empty settings
        setSettings({});
        return;
      }

      const data = JSON.parse(responseText);
      const settingsMap: Record<string, Setting> = {};

      if (Array.isArray(data.settings)) {
        data.settings.forEach((setting: Setting) => {
          settingsMap[setting.key] = setting;
        });
      }

      setSettings(settingsMap);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching settings');
      console.error('Settings fetch error:', err);
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

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Generate unique filename
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Logo upload error:', err);
      throw new Error(err.message || 'Failed to upload logo');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          const logoUrl = await uploadLogo();
          if (logoUrl) {
            updateSetting('site_logo_url', logoUrl);
            // Update settings state with new logo URL
            setSettings(prev => ({
              ...prev,
              site_logo_url: {
                key: 'site_logo_url',
                value: logoUrl,
                description: 'URL of the site logo',
              },
            }));
          }
        } catch (uploadErr: any) {
          throw new Error(`Logo upload failed: ${uploadErr.message}`);
        }
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccessMessage('Settings saved successfully!');
      setLogoFile(null); // Clear the logo file after successful save
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <div style={{ color: '#b3b3b3' }}>Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Settings
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Manage platform-wide settings and configuration
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: 'rgba(255, 74, 20, 0.1)',
            border: '1px solid #ff4a14',
            color: '#ff5c2e',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Branding Section */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Branding
          </h2>
          <div>
            <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
              Site Logo
            </label>
            <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '16px' }}>
              Upload your site logo. This will appear in the header and throughout the platform. Recommended size: 200x50px (PNG or SVG)
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '200px',
                  height: '80px',
                  background: '#121212',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {logoPreview || settings.site_logo_url?.value ? (
                    <img
                      src={logoPreview || settings.site_logo_url?.value}
                      alt="Logo preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: '#b3b3b3', fontSize: '14px', textAlign: 'center' }}>
                      No logo uploaded
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#ff4a14',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#ff5c2e'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ff4a14'}
                >
                  {logoPreview || settings.site_logo_url?.value ? 'Replace Logo' : 'Upload Logo'}
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '12px', marginTop: '8px' }}>
                  Max file size: 2MB. Supported formats: PNG, JPG, SVG, WEBP
                </p>
                {logoFile && (
                  <p style={{ color: '#ff5c2e', fontSize: '12px', marginTop: '4px' }}>
                    New logo selected: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Site Settings */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Site Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Site Name"
              description="The name of your music platform"
              value={settings.site_name?.value || ''}
              onChange={(value) => updateSetting('site_name', value)}
            />
            <SettingField
              label="Site Tagline"
              description="A short description of your platform"
              value={settings.site_tagline?.value || ''}
              onChange={(value) => updateSetting('site_tagline', value)}
            />
            <SettingField
              label="Site Favicon URL"
              description="URL to your site favicon (16x16 or 32x32px, .ico or .png)"
              value={settings.site_favicon_url?.value || ''}
              onChange={(value) => updateSetting('site_favicon_url', value)}
            />
          </div>
        </div>

        {/* App Information */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            App Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="App Description"
              description="Full app description for SEO and marketing"
              value={settings.app_description?.value || ''}
              onChange={(value) => updateSetting('app_description', value)}
            />
            <SettingField
              label="Short Description"
              description="Brief description for app stores and previews"
              value={settings.app_short_description?.value || ''}
              onChange={(value) => updateSetting('app_short_description', value)}
            />
          </div>
        </div>

        {/* Footer & Copyright */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Footer & Copyright
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Footer Text"
              description="Text displayed in the footer"
              value={settings.footer_text?.value || ''}
              onChange={(value) => updateSetting('footer_text', value)}
            />
            <SettingField
              label="Copyright Text"
              description="Copyright notice displayed in footer"
              value={settings.copyright_text?.value || ''}
              onChange={(value) => updateSetting('copyright_text', value)}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Contact Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Support Email"
              description="Email address for user support inquiries"
              value={settings.support_email?.value || ''}
              onChange={(value) => updateSetting('support_email', value)}
            />
            <SettingField
              label="Contact Email"
              description="General contact email address"
              value={settings.contact_email?.value || ''}
              onChange={(value) => updateSetting('contact_email', value)}
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Social Media Links
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Twitter/X Profile URL"
              description="Full URL to your Twitter/X profile"
              value={settings.social_twitter?.value || ''}
              onChange={(value) => updateSetting('social_twitter', value)}
            />
            <SettingField
              label="Facebook Page URL"
              description="Full URL to your Facebook page"
              value={settings.social_facebook?.value || ''}
              onChange={(value) => updateSetting('social_facebook', value)}
            />
            <SettingField
              label="Instagram Profile URL"
              description="Full URL to your Instagram profile"
              value={settings.social_instagram?.value || ''}
              onChange={(value) => updateSetting('social_instagram', value)}
            />
            <SettingField
              label="YouTube Channel URL"
              description="Full URL to your YouTube channel"
              value={settings.social_youtube?.value || ''}
              onChange={(value) => updateSetting('social_youtube', value)}
            />
          </div>
        </div>

        {/* Theme Settings */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Theme Colors
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Primary Color"
              description="Main brand color (hex code)"
              value={settings.theme_primary_color?.value || '#ff4a14'}
              onChange={(value) => updateSetting('theme_primary_color', value)}
              type="color"
            />
            <SettingField
              label="Secondary Color"
              description="Secondary brand color (hex code)"
              value={settings.theme_secondary_color?.value || '#191414'}
              onChange={(value) => updateSetting('theme_secondary_color', value)}
              type="color"
            />
            <SettingField
              label="Accent Color"
              description="Accent/highlight color (hex code)"
              value={settings.theme_accent_color?.value || '#FFFFFF'}
              onChange={(value) => updateSetting('theme_accent_color', value)}
              type="color"
            />
          </div>
        </div>

        {/* Upload Settings */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Upload Configuration
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Max Upload Size (MB)"
              description="Maximum file size for uploads in megabytes"
              value={settings.max_upload_size_mb?.value || 500}
              onChange={(value) => updateSetting('max_upload_size_mb', parseInt(value) || 500)}
              type="number"
            />
          </div>
        </div>

        {/* Feature Flags */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Features
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingToggle
              label="Enable Stories"
              description="Allow users to post stories"
              value={settings.enable_stories?.value || false}
              onChange={(value) => updateSetting('enable_stories', value)}
            />
            <SettingToggle
              label="Enable Group Sessions"
              description="Allow users to create group listening sessions"
              value={settings.enable_group_sessions?.value || false}
              onChange={(value) => updateSetting('enable_group_sessions', value)}
            />
            <SettingToggle
              label="Enable User Uploads"
              description="Allow users to upload their own content"
              value={settings.enable_user_uploads?.value || false}
              onChange={(value) => updateSetting('enable_user_uploads', value)}
            />
            <SettingToggle
              label="Enable Social Features"
              description="Enable social features like following, likes, and comments"
              value={settings.enable_social_features?.value || false}
              onChange={(value) => updateSetting('enable_social_features', value)}
            />
          </div>
        </div>

        {/* Page Content */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Page Content & Copy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Home Page
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SettingField
                  label="Hero Title"
                  description="Main title displayed on home page hero section"
                  value={settings.home_hero_title?.value || ''}
                  onChange={(value) => updateSetting('home_hero_title', value)}
                />
                <SettingField
                  label="Hero Subtitle"
                  description="Subtitle displayed below hero title"
                  value={settings.home_hero_subtitle?.value || ''}
                  onChange={(value) => updateSetting('home_hero_subtitle', value)}
                />
              </div>
            </div>
            <div style={{ paddingTop: '16px', borderTop: '1px solid #282828' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Discover Page
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SettingField
                  label="Page Title"
                  description="Title displayed on discover page"
                  value={settings.discover_page_title?.value || ''}
                  onChange={(value) => updateSetting('discover_page_title', value)}
                />
                <SettingField
                  label="Page Subtitle"
                  description="Subtitle displayed on discover page"
                  value={settings.discover_page_subtitle?.value || ''}
                  onChange={(value) => updateSetting('discover_page_subtitle', value)}
                />
              </div>
            </div>
            <div style={{ paddingTop: '16px', borderTop: '1px solid #282828' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Search
              </h3>
              <SettingField
                label="Search Placeholder"
                description="Placeholder text in search input"
                value={settings.search_placeholder?.value || ''}
                onChange={(value) => updateSetting('search_placeholder', value)}
              />
            </div>
          </div>
        </div>

        {/* PWA Install Prompts */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            PWA Install Prompts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingField
              label="Install Prompt Title"
              description="Title shown in PWA install prompt"
              value={settings.pwa_install_title?.value || ''}
              onChange={(value) => updateSetting('pwa_install_title', value)}
            />
            <SettingField
              label="Install Prompt Subtitle"
              description="Subtitle/description shown in PWA install prompt"
              value={settings.pwa_install_subtitle?.value || ''}
              onChange={(value) => updateSetting('pwa_install_subtitle', value)}
            />
          </div>
        </div>

        {/* Authentication Pages */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Authentication Pages
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Sign In Page
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SettingField
                  label="Page Title"
                  description="Title displayed on sign in page"
                  value={settings.signin_title?.value || ''}
                  onChange={(value) => updateSetting('signin_title', value)}
                />
                <SettingField
                  label="Page Subtitle"
                  description="Subtitle displayed on sign in page"
                  value={settings.signin_subtitle?.value || ''}
                  onChange={(value) => updateSetting('signin_subtitle', value)}
                />
              </div>
            </div>
            <div style={{ paddingTop: '16px', borderTop: '1px solid #282828' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Sign Up Page
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SettingField
                  label="Page Title"
                  description="Title displayed on sign up page"
                  value={settings.signup_title?.value || ''}
                  onChange={(value) => updateSetting('signup_title', value)}
                />
                <SettingField
                  label="Page Subtitle"
                  description="Subtitle displayed on sign up page"
                  value={settings.signup_subtitle?.value || ''}
                  onChange={(value) => updateSetting('signup_subtitle', value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OAuth Provider Configuration */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            OAuth Providers
          </h2>
          <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px' }}>
            Configure social login providers. After entering credentials here, you must also configure them in your Supabase Dashboard under Authentication &gt; Providers.
          </p>

          {/* Google OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Google
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_google_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_google_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_google_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Google Sign-In"
                description="Allow users to sign in with their Google account"
                value={settings.oauth_google_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_google_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="Google OAuth 2.0 Client ID from Google Cloud Console"
                value={settings.oauth_google_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_google_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Google OAuth 2.0 Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_google_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_google_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Apple OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Apple
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_apple_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_apple_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_apple_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Apple Sign-In"
                description="Allow users to sign in with their Apple ID"
                value={settings.oauth_apple_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_apple_enabled', value)}
              />
              <SettingField
                label="Services ID"
                description="Apple Services ID from Apple Developer Portal"
                value={settings.oauth_apple_services_id?.value || ''}
                onChange={(value) => updateSetting('oauth_apple_services_id', value)}
              />
              <SettingField
                label="Team ID"
                description="Your Apple Developer Team ID"
                value={settings.oauth_apple_team_id?.value || ''}
                onChange={(value) => updateSetting('oauth_apple_team_id', value)}
              />
              <SettingField
                label="Key ID"
                description="Apple Sign-In Key ID"
                value={settings.oauth_apple_key_id?.value || ''}
                onChange={(value) => updateSetting('oauth_apple_key_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Private Key
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Apple Sign-In private key (.p8 file contents)
                </p>
                <textarea
                  value={settings.oauth_apple_private_key?.value || ''}
                  onChange={(e) => updateSetting('oauth_apple_private_key', e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  rows={4}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Facebook OAuth */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Facebook
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_facebook_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_facebook_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_facebook_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Facebook Sign-In"
                description="Allow users to sign in with their Facebook account"
                value={settings.oauth_facebook_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_facebook_enabled', value)}
              />
              <SettingField
                label="App ID"
                description="Facebook App ID from Meta Developer Portal"
                value={settings.oauth_facebook_app_id?.value || ''}
                onChange={(value) => updateSetting('oauth_facebook_app_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  App Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Facebook App Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_facebook_app_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_facebook_app_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* GitHub OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.430.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                GitHub
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_github_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_github_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_github_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable GitHub Sign-In"
                description="Allow users to sign in with their GitHub account"
                value={settings.oauth_github_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_github_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="GitHub OAuth App Client ID"
                value={settings.oauth_github_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_github_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  GitHub OAuth App Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_github_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_github_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Twitter/X OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Twitter / X
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_twitter_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_twitter_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_twitter_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Twitter Sign-In"
                description="Allow users to sign in with their Twitter/X account"
                value={settings.oauth_twitter_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_twitter_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="Twitter/X OAuth 2.0 Client ID"
                value={settings.oauth_twitter_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_twitter_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Twitter/X OAuth 2.0 Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_twitter_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_twitter_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Discord OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Discord
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_discord_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_discord_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_discord_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Discord Sign-In"
                description="Allow users to sign in with their Discord account"
                value={settings.oauth_discord_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_discord_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="Discord Application Client ID"
                value={settings.oauth_discord_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_discord_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Discord Application Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_discord_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_discord_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Microsoft OAuth */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #282828' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Microsoft
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_microsoft_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_microsoft_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_microsoft_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Microsoft Sign-In"
                description="Allow users to sign in with their Microsoft account"
                value={settings.oauth_microsoft_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_microsoft_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="Azure AD Application (client) ID"
                value={settings.oauth_microsoft_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_microsoft_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Azure AD Application Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_microsoft_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_microsoft_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Spotify OAuth */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                Spotify
              </h3>
              <div style={{
                padding: '4px 8px',
                background: settings.oauth_spotify_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: settings.oauth_spotify_enabled?.value ? '#22c55e' : '#6b7280',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {settings.oauth_spotify_enabled?.value ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingToggle
                label="Enable Spotify Sign-In"
                description="Allow users to sign in with their Spotify account"
                value={settings.oauth_spotify_enabled?.value || false}
                onChange={(value) => updateSetting('oauth_spotify_enabled', value)}
              />
              <SettingField
                label="Client ID"
                description="Spotify App Client ID"
                value={settings.oauth_spotify_client_id?.value || ''}
                onChange={(value) => updateSetting('oauth_spotify_client_id', value)}
              />
              <div>
                <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                  Client Secret
                </label>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                  Spotify App Client Secret (stored securely)
                </p>
                <input
                  type="password"
                  value={settings.oauth_spotify_client_secret?.value || ''}
                  onChange={(e) => updateSetting('oauth_spotify_client_secret', e.target.value)}
                  placeholder="••••••••••••••••"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
                />
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#121212', borderRadius: '8px', border: '1px solid #282828' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              Setup Instructions
            </h4>
            <ol style={{ color: '#b3b3b3', fontSize: '13px', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Enable the OAuth providers you want to use above</li>
              <li>Go to your Supabase Dashboard &gt; Authentication &gt; Providers</li>
              <li>Enable each provider in Supabase and configure according to provider documentation</li>
              <li>Set the redirect URL to: <code style={{ background: '#282828', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback</code></li>
              <li>The enabled providers will automatically appear on signin and signup pages</li>
            </ol>
          </div>
        </div>

        {/* SMTP Email Configuration */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              Email Configuration (SMTP)
            </h2>
            <div style={{
              padding: '4px 12px',
              background: settings.smtp_enabled?.value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              color: settings.smtp_enabled?.value ? '#22c55e' : '#6b7280',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {settings.smtp_enabled?.value ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
          <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px' }}>
            Configure SMTP server for sending transactional emails (verification, password reset, notifications). Supports Zoho ZeptoMail, Gmail, SendGrid, and other SMTP providers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingToggle
              label="Enable SMTP Email"
              description="Enable email sending via SMTP server"
              value={settings.smtp_enabled?.value || false}
              onChange={(value) => updateSetting('smtp_enabled', value)}
            />

            <SettingField
              label="SMTP Host"
              description="SMTP server hostname (e.g., smtp.zeptomail.com for ZeptoMail)"
              value={settings.smtp_host?.value || ''}
              onChange={(value) => updateSetting('smtp_host', value)}
            />

            <SettingField
              label="SMTP Port"
              description="SMTP port number (587 for TLS, 465 for SSL)"
              value={settings.smtp_port?.value || 587}
              onChange={(value) => updateSetting('smtp_port', value)}
              type="number"
            />

            <SettingToggle
              label="Use SSL/TLS"
              description="Enable SSL/TLS encryption (use for port 465)"
              value={settings.smtp_secure?.value || false}
              onChange={(value) => updateSetting('smtp_secure', value)}
            />

            <SettingField
              label="SMTP Username"
              description="SMTP authentication username (often your email address)"
              value={settings.smtp_username?.value || ''}
              onChange={(value) => updateSetting('smtp_username', value)}
            />

            <div>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                SMTP Password
              </label>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
                SMTP authentication password (stored securely)
              </p>
              <input
                type="password"
                value={settings.smtp_password?.value || ''}
                onChange={(e) => updateSetting('smtp_password', e.target.value)}
                placeholder="••••••••••••••••"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '12px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
              />
            </div>

            <SettingField
              label="From Email Address"
              description="Email address that emails will be sent from"
              value={settings.smtp_from_email?.value || ''}
              onChange={(value) => updateSetting('smtp_from_email', value)}
            />

            <SettingField
              label="From Name"
              description="Name that will appear as the sender"
              value={settings.smtp_from_name?.value || ''}
              onChange={(value) => updateSetting('smtp_from_name', value)}
            />
          </div>

          {/* ZeptoMail Instructions */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#121212', borderRadius: '8px', border: '1px solid #282828' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              Zoho ZeptoMail Configuration
            </h4>
            <ol style={{ color: '#b3b3b3', fontSize: '13px', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Sign up at <a href="https://www.zoho.com/zeptomail/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff4a14' }}>zoho.com/zeptomail</a></li>
              <li>Verify your domain and create Mail Agent</li>
              <li>Get SMTP credentials from Settings → Mail Agents → Your Agent → SMTP</li>
              <li>SMTP Host: <code style={{ background: '#282828', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>smtp.zeptomail.com</code></li>
              <li>SMTP Port: <code style={{ background: '#282828', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>587</code> (TLS) or <code style={{ background: '#282828', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>465</code> (SSL)</li>
              <li>Username: Your ZeptoMail username (usually your email)</li>
              <li>Password: Generate from Mail Agent settings</li>
              <li>From Email: Must match your verified domain</li>
            </ol>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            onMouseOver={(e) => {
              if (!saving) e.currentTarget.style.background = '#ff5c2e';
            }}
            onMouseOut={(e) => {
              if (!saving) e.currentTarget.style.background = '#ff4a14';
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

interface SettingFieldProps {
  label: string;
  description: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'color';
}

function SettingField({ label, description, value, onChange, type = 'text' }: SettingFieldProps) {
  return (
    <div>
      <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
        {label}
      </label>
      <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '12px' }}>
        {description}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: type === 'color' ? '100px' : '100%',
          maxWidth: type === 'color' ? '100px' : '400px',
          padding: type === 'color' ? '8px' : '12px 16px',
          background: '#121212',
          color: '#ffffff',
          border: '1px solid #282828',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#ff4a14'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
      />
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function SettingToggle({ label, description, value, onChange }: SettingToggleProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
          {label}
        </label>
        <p style={{ color: '#b3b3b3', fontSize: '14px' }}>
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '50px',
          height: '28px',
          background: value ? '#ff4a14' : '#727272',
          border: 'none',
          borderRadius: '500px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: '#ffffff',
          borderRadius: '50%',
          position: 'absolute',
          top: '4px',
          left: value ? '26px' : '4px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
