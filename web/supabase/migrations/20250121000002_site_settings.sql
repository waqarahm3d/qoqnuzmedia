-- =====================================================
-- Site Settings System
-- Global configuration for branding, features, and OAuth
-- =====================================================

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    setting_type TEXT NOT NULL DEFAULT 'string', -- string, boolean, number, json
    category TEXT NOT NULL DEFAULT 'general', -- branding, features, oauth, smtp, etc.
    is_public BOOLEAN DEFAULT true, -- whether this setting is publicly accessible
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

-- Insert default settings
INSERT INTO site_settings (key, value, description, setting_type, category, is_public) VALUES
-- Branding
('site_name', 'Qoqnuz Music', 'Site name displayed in header and titles', 'string', 'branding', true),
('site_tagline', 'Stream Your Soundtrack', 'Site tagline or slogan', 'string', 'branding', true),
('site_logo_url', '', 'URL to site logo image', 'string', 'branding', true),
('site_favicon_url', '', 'URL to site favicon', 'string', 'branding', true),

-- App Information
('app_description', 'Modern music streaming platform with social features', 'App description for SEO', 'string', 'general', true),
('app_short_description', 'Stream your favorite music', 'Short app description', 'string', 'general', true),
('footer_text', 'Built with ❤️ for music lovers', 'Footer text', 'string', 'branding', true),
('copyright_text', '© 2025 Qoqnuz Music. All rights reserved.', 'Copyright notice', 'string', 'branding', true),

-- Contact & Social
('support_email', 'support@qoqnuz.com', 'Support email address', 'string', 'contact', true),
('contact_email', 'contact@qoqnuz.com', 'General contact email', 'string', 'contact', true),
('social_twitter', '', 'Twitter profile URL', 'string', 'social', true),
('social_facebook', '', 'Facebook page URL', 'string', 'social', true),
('social_instagram', '', 'Instagram profile URL', 'string', 'social', true),
('social_youtube', '', 'YouTube channel URL', 'string', 'social', true),

-- Theme Colors
('theme_primary_color', '#ff4a14', 'Primary brand color', 'string', 'theme', true),
('theme_secondary_color', '#191414', 'Secondary color', 'string', 'theme', true),
('theme_accent_color', '#FFFFFF', 'Accent color', 'string', 'theme', true),

-- Features
('enable_stories', 'false', 'Enable stories feature', 'boolean', 'features', true),
('enable_group_sessions', 'false', 'Enable group listening sessions', 'boolean', 'features', true),
('enable_user_uploads', 'false', 'Allow users to upload content', 'boolean', 'features', true),
('enable_social_features', 'true', 'Enable social features', 'boolean', 'features', true),

-- Upload Settings
('max_upload_size_mb', '500', 'Maximum upload size in MB', 'number', 'features', true),

-- OAuth Providers (all disabled by default)
('oauth_google_enabled', 'false', 'Enable Google OAuth sign-in', 'boolean', 'oauth', true),
('oauth_apple_enabled', 'false', 'Enable Apple OAuth sign-in', 'boolean', 'oauth', true),
('oauth_facebook_enabled', 'false', 'Enable Facebook OAuth sign-in', 'boolean', 'oauth', true),
('oauth_github_enabled', 'false', 'Enable GitHub OAuth sign-in', 'boolean', 'oauth', true),
('oauth_twitter_enabled', 'false', 'Enable Twitter OAuth sign-in', 'boolean', 'oauth', true),
('oauth_discord_enabled', 'false', 'Enable Discord OAuth sign-in', 'boolean', 'oauth', true),
('oauth_microsoft_enabled', 'false', 'Enable Microsoft OAuth sign-in', 'boolean', 'oauth', true),
('oauth_spotify_enabled', 'false', 'Enable Spotify OAuth sign-in', 'boolean', 'oauth', true),

-- Headers & Messages
('home_hero_title', 'Welcome to Qoqnuz Music', 'Home page hero title', 'string', 'content', true),
('home_hero_subtitle', 'Discover and stream millions of songs', 'Home page hero subtitle', 'string', 'content', true),
('discover_page_title', 'Discover Music', 'Discover page title', 'string', 'content', true),
('discover_page_subtitle', 'Explore new releases and trending tracks', 'Discover page subtitle', 'string', 'content', true),
('search_placeholder', 'Search for songs, artists, albums...', 'Search input placeholder', 'string', 'content', true),

-- PWA
('pwa_install_title', 'Install Qoqnuz Music', 'PWA install prompt title', 'string', 'pwa', true),
('pwa_install_subtitle', 'Listen offline, faster access', 'PWA install prompt subtitle', 'string', 'pwa', true),

-- Authentication
('signin_title', 'Sign in to Qoqnuz', 'Signin page title', 'string', 'auth', true),
('signin_subtitle', 'Continue your music journey', 'Signin page subtitle', 'string', 'auth', true),
('signup_title', 'Join Qoqnuz Music', 'Signup page title', 'string', 'auth', true),
('signup_subtitle', 'Create an account to start listening', 'Signup page subtitle', 'string', 'auth', true),

-- SMTP Email Configuration (sensitive, not public)
('smtp_enabled', 'false', 'Enable SMTP email', 'boolean', 'smtp', false),
('smtp_host', 'smtp.zeptomail.com', 'SMTP server host', 'string', 'smtp', false),
('smtp_port', '587', 'SMTP server port', 'number', 'smtp', false),
('smtp_secure', 'false', 'Use TLS/SSL', 'boolean', 'smtp', false),
('smtp_username', '', 'SMTP username', 'string', 'smtp', false),
('smtp_password', '', 'SMTP password', 'string', 'smtp', false),
('smtp_from_email', 'noreply@yourdomain.com', 'From email address', 'string', 'smtp', false),
('smtp_from_name', 'Qoqnuz Music', 'From name', 'string', 'smtp', false)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for public settings
CREATE POLICY "Public settings are viewable by everyone"
    ON site_settings
    FOR SELECT
    USING (is_public = true);

-- Admins can view all settings
CREATE POLICY "Admins can view all settings"
    ON site_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
    ON site_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
    ON site_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_site_settings_timestamp
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_timestamp();
