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

          {/* Setup Instructions */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#121212', borderRadius: '8px', border: '1px solid #282828' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              Setup Instructions
            </h4>
            <ol style={{ color: '#b3b3b3', fontSize: '13px', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Enter your OAuth credentials above</li>
              <li>Go to your Supabase Dashboard &gt; Authentication &gt; Providers</li>
              <li>Enable each provider and enter the same credentials</li>
              <li>Set the redirect URL to: <code style={{ background: '#282828', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback</code></li>
              <li>Save settings in both places</li>
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
