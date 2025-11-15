-- Add is_banned column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Add comment
COMMENT ON COLUMN profiles.is_banned IS 'Whether the user has been banned by an admin';
