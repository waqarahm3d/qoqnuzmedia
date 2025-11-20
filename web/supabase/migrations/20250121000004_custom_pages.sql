-- =====================================================
-- Custom Pages System
-- Allows creation of dynamic pages like policies, terms, etc.
-- =====================================================

-- Create custom_pages table
CREATE TABLE IF NOT EXISTS custom_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    display_in_footer BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_pages_slug ON custom_pages(slug);
CREATE INDEX IF NOT EXISTS idx_custom_pages_published ON custom_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_custom_pages_order ON custom_pages(display_order);

-- Enable RLS
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Anyone can view published pages"
    ON custom_pages FOR SELECT
    USING (is_published = true);

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
    ON custom_pages FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );

-- Admins can create pages
CREATE POLICY "Admins can create pages"
    ON custom_pages FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );

-- Admins can update pages
CREATE POLICY "Admins can update pages"
    ON custom_pages FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );

-- Admins can delete pages
CREATE POLICY "Admins can delete pages"
    ON custom_pages FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_pages_updated_at
    BEFORE UPDATE ON custom_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_pages_updated_at();

-- Insert default pages
INSERT INTO custom_pages (title, slug, content, meta_description, is_published, display_in_footer, display_order) VALUES
('Privacy Policy', 'privacy-policy', '<h1>Privacy Policy</h1><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p><h2>Information We Collect</h2><p>We collect information you provide directly to us when you create an account, update your profile, or use our services.</p><h2>How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services.</p>', 'Learn about how we collect, use, and protect your personal information', true, true, 1),
('Terms of Service', 'terms-of-service', '<h1>Terms of Service</h1><p>Welcome to our music streaming platform. By using our services, you agree to these terms.</p><h2>Acceptance of Terms</h2><p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p><h2>User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account and password.</p>', 'Terms and conditions for using our music streaming platform', true, true, 2),
('About Us', 'about', '<h1>About Us</h1><p>We are passionate about music and connecting artists with listeners around the world.</p><h2>Our Mission</h2><p>To provide the best music streaming experience and support artists in sharing their creativity.</p>', 'Learn more about our music streaming platform and mission', true, true, 3),
('Contact', 'contact', '<h1>Contact Us</h1><p>Get in touch with our team.</p><h2>Support</h2><p>Email: support@example.com</p><h2>General Inquiries</h2><p>Email: hello@example.com</p>', 'Contact information and support details', true, true, 4)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE custom_pages IS 'Custom pages for policies, terms, about, and other static content';
