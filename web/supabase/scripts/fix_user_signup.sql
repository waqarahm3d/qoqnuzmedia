-- Fix User Signup Issue
-- This script creates the profiles table and trigger for automatic profile creation

-- 1. Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  country VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(50),
  preferences JSONB DEFAULT '{}',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- 4. Create RLS policies for profiles
-- Anyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything
CREATE POLICY "Service role can manage all profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_username VARCHAR(50);
BEGIN
  -- Generate a unique username from email
  new_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  new_username := REGEXP_REPLACE(new_username, '[^a-z0-9]', '', 'g');
  new_username := new_username || '_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);

  -- Insert the new profile
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    display_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username already exists, append more random characters
    new_username := new_username || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      display_name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      new_username,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      NOW(),
      NOW()
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 7. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;

-- Done!
-- Run this in your Supabase SQL Editor to fix signup issues
