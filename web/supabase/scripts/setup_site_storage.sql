-- Setup storage buckets for site assets (logos, media, etc.)
-- Run this in your Supabase SQL editor

-- Create the media bucket for logos, track covers, and other uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit for audio/images
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'];

-- Policy: Anyone can view media (public bucket)
DROP POLICY IF EXISTS "Public Media Access" ON storage.objects;
CREATE POLICY "Public Media Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Policy: Authenticated users can upload media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own media or admins can update any
DROP POLICY IF EXISTS "Users can update media" ON storage.objects;
CREATE POLICY "Users can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own media or admins can delete any
DROP POLICY IF EXISTS "Users can delete media" ON storage.objects;
CREATE POLICY "Users can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
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
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
