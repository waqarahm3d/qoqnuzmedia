-- Add profile fields for enhanced signup
-- Date: 2025-01-15
-- Description: Add name, date of birth, and gender fields to profiles table

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN full_name TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender TEXT CHECK (gender IN ('man', 'woman', 'non-binary', 'other', 'prefer-not-to-say'));

-- Update existing records to have nullable values
-- New signups will be required to fill these
COMMENT ON COLUMN profiles.full_name IS 'User full name (required during signup)';
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth (required during signup)';
COMMENT ON COLUMN profiles.gender IS 'User gender identity (required during signup)';
