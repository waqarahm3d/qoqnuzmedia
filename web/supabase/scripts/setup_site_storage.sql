-- Setup storage buckets for site assets (logos, etc.)
-- Run this in your Supabase SQL editor

-- Create the site-assets bucket for logos and other admin uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Policy: Anyone can view site assets (public bucket)
CREATE POLICY IF NOT EXISTS "Public Site Assets Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Policy: Admins can upload site assets
CREATE POLICY IF NOT EXISTS "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets'
  AND EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can update site assets
CREATE POLICY IF NOT EXISTS "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-assets'
  AND EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can delete site assets
CREATE POLICY IF NOT EXISTS "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-assets'
  AND EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Also create avatars bucket if not exists (for user avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
CREATE POLICY IF NOT EXISTS "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
