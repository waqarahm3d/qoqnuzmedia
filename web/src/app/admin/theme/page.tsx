'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface ThemeSettings {
  site_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  text_secondary_color: string;
  logo_url: string;
  favicon_url: string;
}

export default function ThemeCustomization() {
  const [settings, setSettings] = useState<ThemeSettings>({
    site_name: 'Qoqnuz Music',
    primary_color: '#1DB954',
    secondary_color: '#191414',
    background_color: '#121212',
    surface_color: '#181818',
    text_color: '#FFFFFF',
    text_secondary_color: '#B3B3B3',
    logo_url: '',
    favicon_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();

      // Merge with defaults
      setSettings({
        site_name: data.settings.site_name || 'Qoqnuz Music',
        primary_color: data.settings.primary_color || '#1DB954',
        secondary_color: data.settings.secondary_color || '#191414',
        background_color: data.settings.background_color || '#121212',
        surface_color: data.settings.surface_color || '#181818',
        text_color: data.settings.text_color || '#FFFFFF',
        text_secondary_color: data.settings.text_secondary_color || '#B3B3B3',
        logo_url: data.settings.logo_url || '',
        favicon_url: data.settings.favicon_url || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Theme settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!confirm('Reset all theme settings to default values?')) return;

    setSettings({
      site_name: 'Qoqnuz Music',
      primary_color: '#1DB954',
      secondary_color: '#191414',
      background_color: '#121212',
      surface_color: '#181818',
      text_color: '#FFFFFF',
      text_secondary_color: '#B3B3B3',
      logo_url: '',
      favicon_url: '',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-400 py-12">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Theme Customization</h1>
            <p className="text-gray-400 mt-1">
              Customize your platform's appearance and branding
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-200 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Branding Section */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Branding</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) =>
                setSettings({ ...settings, site_name: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={settings.logo_url}
              onChange={(e) =>
                setSettings({ ...settings, logo_url: e.target.value })
              }
              placeholder="https://example.com/logo.png"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <p className="text-xs text-gray-400 mt-1">
              Recommended: PNG or SVG, transparent background
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Favicon URL
            </label>
            <input
              type="url"
              value={settings.favicon_url}
              onChange={(e) =>
                setSettings({ ...settings, favicon_url: e.target.value })
              }
              placeholder="https://example.com/favicon.ico"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <p className="text-xs text-gray-400 mt-1">
              Recommended: 32x32 or 64x64 pixels
            </p>
          </div>
        </div>

        {/* Color Scheme Section */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Color Scheme</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorPicker
              label="Primary Color"
              description="Main brand color (buttons, links)"
              value={settings.primary_color}
              onChange={(color) =>
                setSettings({ ...settings, primary_color: color })
              }
            />

            <ColorPicker
              label="Secondary Color"
              description="Accent color"
              value={settings.secondary_color}
              onChange={(color) =>
                setSettings({ ...settings, secondary_color: color })
              }
            />

            <ColorPicker
              label="Background Color"
              description="Main background"
              value={settings.background_color}
              onChange={(color) =>
                setSettings({ ...settings, background_color: color })
              }
            />

            <ColorPicker
              label="Surface Color"
              description="Cards and panels"
              value={settings.surface_color}
              onChange={(color) =>
                setSettings({ ...settings, surface_color: color })
              }
            />

            <ColorPicker
              label="Text Color"
              description="Primary text"
              value={settings.text_color}
              onChange={(color) =>
                setSettings({ ...settings, text_color: color })
              }
            />

            <ColorPicker
              label="Secondary Text Color"
              description="Muted text"
              value={settings.text_secondary_color}
              onChange={(color) =>
                setSettings({ ...settings, text_secondary_color: color })
              }
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview</h2>

          <div
            className="rounded-lg p-6 space-y-4"
            style={{ backgroundColor: settings.background_color }}
          >
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: settings.surface_color }}
            >
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: settings.text_color }}
              >
                {settings.site_name}
              </h3>
              <p style={{ color: settings.text_secondary_color }}>
                This is how your theme will look
              </p>
              <button
                className="mt-4 px-6 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: settings.primary_color }}
              >
                Primary Button
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded cursor-pointer"
        />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
