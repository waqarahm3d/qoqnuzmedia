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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }

      const data = await response.json();
      const settingsMap: Record<string, Setting> = {};
      data.settings.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting;
      });
      setSettings(settingsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: {
        ...settings[key],
        value,
      },
    });
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
            background: 'rgba(29, 185, 84, 0.1)',
            border: '1px solid #1DB954',
            color: '#1ed760',
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
              value={settings.theme_primary_color?.value || '#1DB954'}
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
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
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

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '12px 32px',
              background: saving ? '#282828' : '#1DB954',
              color: '#ffffff',
              border: 'none',
              borderRadius: '500px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!saving) e.currentTarget.style.background = '#1ed760';
            }}
            onMouseOut={(e) => {
              if (!saving) e.currentTarget.style.background = '#1DB954';
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
        onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
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
          background: value ? '#1DB954' : '#727272',
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
