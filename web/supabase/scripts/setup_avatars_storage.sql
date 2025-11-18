-- Setup avatars storage bucket for user profile images
-- Run this in your Supabase SQL editor

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY IF NOT EXISTS "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload avatars
CREATE POLICY IF NOT EXISTS "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own avatars, admins can update any
CREATE POLICY IF NOT EXISTS "Users can update own avatars or admins can update any"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete their own avatars, admins can delete any
CREATE POLICY IF NOT EXISTS "Users can delete own avatars or admins can delete any"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
);

-- Note: Since we store files as avatars/{userId}-{timestamp}.ext
-- the policies check the folder name matches the user ID
