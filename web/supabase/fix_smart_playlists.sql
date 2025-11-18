-- =====================================================
-- FIX: Smart Playlists Table Schema Issue
-- Run this BEFORE the main automation migration
-- =====================================================

-- Check if smart_playlists table exists
DO $$
BEGIN
    -- If table exists, check its structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_playlists') THEN
        RAISE NOTICE 'smart_playlists table exists, checking structure...';

        -- Check if playlist_type column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'smart_playlists'
            AND column_name = 'playlist_type'
        ) THEN
            RAISE NOTICE 'playlist_type column missing - will recreate table';

            -- Drop the old table (backup data first if needed)
            DROP TABLE IF EXISTS smart_playlists CASCADE;
            RAISE NOTICE 'Dropped old smart_playlists table';
        ELSE
            RAISE NOTICE 'playlist_type column exists - table structure is correct';
        END IF;
    ELSE
        RAISE NOTICE 'smart_playlists table does not exist - will be created by migration';
    END IF;
END $$;

-- Now create the table with correct structure
CREATE TABLE IF NOT EXISTS smart_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    playlist_type TEXT NOT NULL, -- 'daily_mix', 'discovery_weekly', 'new_for_you', 'forgotten_favorites'
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    track_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, playlist_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smart_playlists_user ON smart_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_type ON smart_playlists(playlist_type);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_expires ON smart_playlists(expires_at);

-- Verify the table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'smart_playlists'
ORDER BY ordinal_position;
