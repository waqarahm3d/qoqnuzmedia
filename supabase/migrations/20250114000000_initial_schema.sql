-- =====================================================
-- QOQNUZ MUSIC STREAMING PLATFORM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Milestone A: Foundation & Infrastructure
-- This schema includes ALL tables needed for the complete platform
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE USER & PROFILE TABLES
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    is_artist BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- User settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    private_profile BOOLEAN DEFAULT FALSE,
    show_activity BOOLEAN DEFAULT TRUE,
    allow_messages BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    audio_quality TEXT DEFAULT 'high' CHECK (audio_quality IN ('low', 'medium', 'high', 'lossless')),
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en',
    explicit_content BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ARTIST TABLES
-- =====================================================

CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    monthly_listeners INTEGER DEFAULT 0,
    total_plays BIGINT DEFAULT 0,
    genres TEXT[], -- Array of genre tags
    social_links JSONB DEFAULT '{}', -- {instagram: "url", twitter: "url", etc}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link users to artists (one user can manage multiple artists)
CREATE TABLE artist_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artist_id, user_id)
);

-- =====================================================
-- MUSIC CATALOG TABLES
-- =====================================================

CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    cover_art_url TEXT,
    release_date DATE,
    album_type TEXT DEFAULT 'album' CHECK (album_type IN ('album', 'single', 'ep', 'compilation')),
    total_tracks INTEGER DEFAULT 0,
    genres TEXT[],
    label TEXT,
    copyright TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    track_number INTEGER,
    disc_number INTEGER DEFAULT 1,
    duration_ms INTEGER NOT NULL, -- Duration in milliseconds
    audio_url TEXT NOT NULL, -- Cloudflare R2 path
    cover_art_url TEXT,
    isrc TEXT, -- International Standard Recording Code
    explicit BOOLEAN DEFAULT FALSE,
    genres TEXT[],
    lyrics TEXT,
    play_count BIGINT DEFAULT 0,
    popularity INTEGER DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),
    released_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional artists for tracks (featured artists)
CREATE TABLE track_artists (
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'featured' CHECK (role IN ('primary', 'featured', 'composer', 'producer')),
    PRIMARY KEY (track_id, artist_id, role)
);

-- =====================================================
-- PLAYLIST TABLES
-- =====================================================

CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    follower_count INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, position)
);

-- Collaborative playlist members
CREATE TABLE playlist_collaborators (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, user_id)
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- User follows (follow other users)
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Artist follows
CREATE TABLE artist_follows (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, artist_id)
);

-- Playlist follows
CREATE TABLE playlist_follows (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, playlist_id)
);

-- Liked tracks
CREATE TABLE liked_tracks (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);

-- Liked albums
CREATE TABLE liked_albums (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, album_id)
);

-- =====================================================
-- ACTIVITY & FEED
-- =====================================================

-- User activity feed (what users are listening to)
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('listening', 'liked_track', 'liked_album', 'followed_artist', 'followed_user', 'created_playlist', 'posted')),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID, -- Will reference posts table
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for feed queries
CREATE INDEX idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC);

-- User posts (social feed posts)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS & REACTIONS
-- =====================================================

-- Comments on tracks
CREATE TABLE track_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_ms INTEGER, -- Optional timestamp in track for timestamped comments
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on playlists
CREATE TABLE playlist_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on posts
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emoji reactions (unified for all content types)
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('track', 'playlist', 'post', 'comment')),
    target_id UUID NOT NULL,
    emoji TEXT NOT NULL, -- 🔥 ❤️ 😍 👍 etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id, emoji)
);

-- =====================================================
-- MESSAGING
-- =====================================================

-- Direct messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL, -- Optional shared track
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);

-- Conversations (for easier querying)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    unread_count_user1 INTEGER DEFAULT 0,
    unread_count_user2 INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- =====================================================
-- STORIES (Optional - like Instagram/Snapchat stories)
-- =====================================================

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'track')),
    content_url TEXT NOT NULL,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    caption TEXT,
    views_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL, -- Stories expire after 24 hours
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_user_expires ON stories(user_id, expires_at);

CREATE TABLE story_views (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

-- =====================================================
-- GROUP LISTENING SESSIONS (Realtime sync)
-- =====================================================

CREATE TABLE listening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    current_position_ms INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    max_participants INTEGER DEFAULT 50,
    active_participants INTEGER DEFAULT 0,
    queue JSONB DEFAULT '[]', -- Array of track IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE session_participants (
    session_id UUID NOT NULL REFERENCES listening_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (session_id, user_id)
);

-- =====================================================
-- ANALYTICS & METRICS
-- =====================================================

-- Track play history
CREATE TABLE play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    duration_played_ms INTEGER, -- How long they actually listened
    completed BOOLEAN DEFAULT FALSE, -- Did they finish the track?
    source TEXT, -- 'playlist', 'album', 'artist', 'search', 'radio'
    device_type TEXT -- 'web', 'mobile', 'tablet'
);

CREATE INDEX idx_play_history_user ON play_history(user_id, played_at DESC);
CREATE INDEX idx_play_history_track ON play_history(track_id, played_at DESC);

-- Aggregate analytics (for performance)
CREATE TABLE daily_track_stats (
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    play_count INTEGER DEFAULT 0,
    unique_listeners INTEGER DEFAULT 0,
    total_duration_played_ms BIGINT DEFAULT 0,
    completion_rate DECIMAL(5,2), -- Percentage
    PRIMARY KEY (track_id, date)
);

CREATE TABLE daily_artist_stats (
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    play_count INTEGER DEFAULT 0,
    unique_listeners INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    PRIMARY KEY (artist_id, date)
);

-- =====================================================
-- ADMIN & MODERATION
-- =====================================================

-- Admin roles & permissions
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    permissions JSONB NOT NULL, -- {manage_users: true, manage_content: true, etc}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id)
);

-- Content moderation
CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'track', 'album', 'playlist', 'post', 'comment')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site-wide settings (theme, configuration)
CREATE TABLE site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Static pages (Terms, Privacy, etc)
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- SEARCH OPTIMIZATION
-- =====================================================

-- Full-text search indexes
CREATE INDEX idx_tracks_title ON tracks USING GIN(to_tsvector('english', title));
CREATE INDEX idx_albums_title ON albums USING GIN(to_tsvector('english', title));
CREATE INDEX idx_artists_name ON artists USING GIN(to_tsvector('english', name));
CREATE INDEX idx_playlists_name ON playlists USING GIN(to_tsvector('english', name));
CREATE INDEX idx_profiles_username ON profiles USING GIN(to_tsvector('english', username));
CREATE INDEX idx_profiles_display_name ON profiles USING GIN(to_tsvector('english', display_name));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update follower count on playlists
CREATE OR REPLACE FUNCTION update_playlist_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists SET follower_count = follower_count + 1 WHERE id = NEW.playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists SET follower_count = follower_count - 1 WHERE id = OLD.playlist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_playlist_followers AFTER INSERT OR DELETE ON playlist_follows
    FOR EACH ROW EXECUTE FUNCTION update_playlist_follower_count();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed THEN
        UPDATE tracks SET play_count = play_count + 1 WHERE id = NEW.track_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_track_plays AFTER INSERT ON play_history
    FOR EACH ROW EXECUTE FUNCTION increment_play_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all public profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- User settings: Users can only see/update their own
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Artists: Everyone can view, only members can update
CREATE POLICY "Artists are viewable by everyone"
    ON artists FOR SELECT
    USING (true);

-- Albums: Everyone can view
CREATE POLICY "Albums are viewable by everyone"
    ON albums FOR SELECT
    USING (true);

-- Tracks: Everyone can view
CREATE POLICY "Tracks are viewable by everyone"
    ON tracks FOR SELECT
    USING (true);

-- Playlists: Public playlists visible to all, private only to owner
CREATE POLICY "Public playlists are viewable by everyone"
    ON playlists FOR SELECT
    USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Users can create own playlists"
    ON playlists FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own playlists"
    ON playlists FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own playlists"
    ON playlists FOR DELETE
    USING (auth.uid() = owner_id);

-- Playlist tracks: Visible based on playlist visibility
CREATE POLICY "Playlist tracks viewable based on playlist"
    ON playlist_tracks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM playlists
            WHERE playlists.id = playlist_tracks.playlist_id
            AND (playlists.is_public = true OR playlists.owner_id = auth.uid())
        )
    );

-- Messages: Users can only see their own messages
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Play history: Users can only see their own
CREATE POLICY "Users can view own play history"
    ON play_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own play history"
    ON play_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INITIAL ADMIN ROLE SETUP
-- =====================================================

INSERT INTO admin_roles (name, permissions) VALUES
    ('Super Admin', '{"manage_users": true, "manage_content": true, "manage_settings": true, "manage_analytics": true, "manage_moderators": true}'::jsonb),
    ('Content Manager', '{"manage_content": true, "manage_analytics": true}'::jsonb),
    ('Moderator', '{"manage_reports": true, "moderate_content": true}'::jsonb);

-- =====================================================
-- INITIAL SITE SETTINGS
-- =====================================================

INSERT INTO site_settings (key, value, description) VALUES
    ('theme_primary_color', '"#1DB954"', 'Primary brand color (hex)'),
    ('theme_secondary_color', '"#191414"', 'Secondary color (hex)'),
    ('theme_accent_color', '"#FFFFFF"', 'Accent color (hex)'),
    ('site_name', '"Qoqnuz Music"', 'Site name'),
    ('site_tagline', '"Stream millions of songs and podcasts"', 'Site tagline'),
    ('max_upload_size_mb', '500', 'Maximum file upload size in MB'),
    ('enable_stories', 'true', 'Enable/disable stories feature'),
    ('enable_group_sessions', 'true', 'Enable/disable group listening sessions'),
    ('r2_bucket_name', '""', 'Cloudflare R2 bucket name'),
    ('r2_account_id', '""', 'Cloudflare R2 account ID'),
    ('r2_access_key', '""', 'Cloudflare R2 access key'),
    ('r2_secret_key', '""', 'Cloudflare R2 secret key (encrypted)'),
    ('smtp_host', '""', 'SMTP host for transactional emails'),
    ('smtp_port', '587', 'SMTP port'),
    ('smtp_user', '""', 'SMTP username'),
    ('smtp_password', '""', 'SMTP password (encrypted)');

-- =====================================================
-- END OF SCHEMA
-- =====================================================
