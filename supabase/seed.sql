-- =====================================================
-- QOQNUZ MUSIC - SEED DATA
-- =====================================================
-- Sample data for development and testing
-- This creates realistic sample data to test all features
-- =====================================================

-- Note: In production, you'll create a real user via Supabase Auth
-- For now, we'll create sample UUID references

-- =====================================================
-- SAMPLE ARTISTS
-- =====================================================

INSERT INTO artists (id, name, bio, avatar_url, verified, monthly_listeners, genres) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Luna Eclipse', 'Electronic music producer and DJ from Berlin. Known for atmospheric soundscapes and driving beats.', 'https://i.pravatar.cc/300?img=1', true, 1250000, ARRAY['Electronic', 'House', 'Techno']),
    ('a2222222-2222-2222-2222-222222222222', 'The Crimson Waves', 'Indie rock band from Portland. Four-piece creating melodic, guitar-driven anthems.', 'https://i.pravatar.cc/300?img=2', true, 890000, ARRAY['Indie Rock', 'Alternative']),
    ('a3333333-3333-3333-3333-333333333333', 'Maya Rivers', 'Singer-songwriter blending folk, soul, and R&B. Two-time Grammy nominee.', 'https://i.pravatar.cc/300?img=3', true, 2100000, ARRAY['Folk', 'Soul', 'R&B']),
    ('a4444444-4444-4444-4444-444444444444', 'Neon Pulse', 'Synthwave artist bringing 80s vibes to the modern era.', 'https://i.pravatar.cc/300?img=4', false, 450000, ARRAY['Synthwave', 'Electronic', 'Retro']),
    ('a5555555-5555-5555-5555-555555555555', 'DJ Spectrum', 'Genre-bending producer and turntablist. Pioneer of the new wave sound.', 'https://i.pravatar.cc/300?img=5', true, 1800000, ARRAY['Hip Hop', 'Electronic', 'Experimental']);

-- =====================================================
-- SAMPLE ALBUMS
-- =====================================================

INSERT INTO albums (id, title, artist_id, cover_art_url, release_date, album_type, total_tracks, genres, label) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'Midnight Frequencies', 'a1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/album1/600', '2024-03-15', 'album', 12, ARRAY['Electronic', 'House'], 'Eclipse Records'),
    ('b2222222-2222-2222-2222-222222222222', 'Tides of Tomorrow', 'a2222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/album2/600', '2024-01-20', 'album', 10, ARRAY['Indie Rock'], 'Independent'),
    ('b3333333-3333-3333-3333-333333333333', 'Whispers & Echoes', 'a3333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/album3/600', '2023-11-10', 'album', 11, ARRAY['Folk', 'Soul'], 'River Sound Music'),
    ('b4444444-4444-4444-4444-444444444444', 'Neon Dreams', 'a4444444-4444-4444-4444-444444444444', 'https://picsum.photos/seed/album4/600', '2024-05-01', 'ep', 6, ARRAY['Synthwave'], 'Retro Wave Records'),
    ('b5555555-5555-5555-5555-555555555555', 'Spectrum', 'a5555555-5555-5555-5555-555555555555', 'https://picsum.photos/seed/album5/600', '2024-06-15', 'album', 14, ARRAY['Hip Hop'], 'Spectrum Music Group');

-- =====================================================
-- SAMPLE TRACKS
-- =====================================================

-- Luna Eclipse - Midnight Frequencies
INSERT INTO tracks (id, title, artist_id, album_id, track_number, duration_ms, audio_url, cover_art_url, explicit, genres, play_count, popularity) VALUES
    ('t1111111-1111-1111-1111-111111111111', 'Aurora', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 1, 245000, 'tracks/luna-eclipse/aurora.mp3', 'https://picsum.photos/seed/album1/600', false, ARRAY['Electronic', 'House'], 1250000, 85),
    ('t1111111-1111-1111-1111-111111111112', 'Midnight Drive', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 2, 312000, 'tracks/luna-eclipse/midnight-drive.mp3', 'https://picsum.photos/seed/album1/600', false, ARRAY['Electronic', 'House'], 980000, 82),
    ('t1111111-1111-1111-1111-111111111113', 'Frequencies', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 3, 298000, 'tracks/luna-eclipse/frequencies.mp3', 'https://picsum.photos/seed/album1/600', false, ARRAY['Electronic', 'Techno'], 750000, 78);

-- The Crimson Waves - Tides of Tomorrow
INSERT INTO tracks (id, title, artist_id, album_id, track_number, duration_ms, audio_url, cover_art_url, explicit, genres, play_count, popularity) VALUES
    ('t2222222-2222-2222-2222-222222222221', 'Sunrise Boulevard', 'a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 1, 234000, 'tracks/crimson-waves/sunrise-boulevard.mp3', 'https://picsum.photos/seed/album2/600', false, ARRAY['Indie Rock'], 560000, 75),
    ('t2222222-2222-2222-2222-222222222222', 'Ocean Heart', 'a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 2, 267000, 'tracks/crimson-waves/ocean-heart.mp3', 'https://picsum.photos/seed/album2/600', false, ARRAY['Indie Rock'], 890000, 88),
    ('t2222222-2222-2222-2222-222222222223', 'Tomorrow Never Waits', 'a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 3, 289000, 'tracks/crimson-waves/tomorrow-never-waits.mp3', 'https://picsum.photos/seed/album2/600', false, ARRAY['Alternative'], 720000, 80);

-- Maya Rivers - Whispers & Echoes
INSERT INTO tracks (id, title, artist_id, album_id, track_number, duration_ms, audio_url, cover_art_url, explicit, genres, play_count, popularity) VALUES
    ('t3333333-3333-3333-3333-333333333331', 'Golden', 'a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 1, 201000, 'tracks/maya-rivers/golden.mp3', 'https://picsum.photos/seed/album3/600', false, ARRAY['Folk', 'Soul'], 2100000, 95),
    ('t3333333-3333-3333-3333-333333333332', 'River Flow', 'a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 2, 256000, 'tracks/maya-rivers/river-flow.mp3', 'https://picsum.photos/seed/album3/600', false, ARRAY['Soul', 'R&B'], 1800000, 92),
    ('t3333333-3333-3333-3333-333333333333', 'Whispers in the Wind', 'a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 3, 278000, 'tracks/maya-rivers/whispers-wind.mp3', 'https://picsum.photos/seed/album3/600', false, ARRAY['Folk'], 1200000, 87);

-- Neon Pulse - Neon Dreams EP
INSERT INTO tracks (id, title, artist_id, album_id, track_number, duration_ms, audio_url, cover_art_url, explicit, genres, play_count, popularity) VALUES
    ('t4444444-4444-4444-4444-444444444441', 'Neon Lights', 'a4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 1, 223000, 'tracks/neon-pulse/neon-lights.mp3', 'https://picsum.photos/seed/album4/600', false, ARRAY['Synthwave'], 450000, 72),
    ('t4444444-4444-4444-4444-444444444442', 'Retrograde', 'a4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 2, 289000, 'tracks/neon-pulse/retrograde.mp3', 'https://picsum.photos/seed/album4/600', false, ARRAY['Synthwave', 'Electronic'], 380000, 68);

-- DJ Spectrum - Spectrum
INSERT INTO tracks (id, title, artist_id, album_id, track_number, duration_ms, audio_url, cover_art_url, explicit, genres, play_count, popularity) VALUES
    ('t5555555-5555-5555-5555-555555555551', 'Wavelength', 'a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 1, 198000, 'tracks/dj-spectrum/wavelength.mp3', 'https://picsum.photos/seed/album5/600', true, ARRAY['Hip Hop'], 1600000, 90),
    ('t5555555-5555-5555-5555-555555555552', 'Digital Dreams', 'a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 2, 234000, 'tracks/dj-spectrum/digital-dreams.mp3', 'https://picsum.photos/seed/album5/600', false, ARRAY['Electronic', 'Hip Hop'], 1400000, 88),
    ('t5555555-5555-5555-5555-555555555553', 'Bassline Theory', 'a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 3, 267000, 'tracks/dj-spectrum/bassline-theory.mp3', 'https://picsum.photos/seed/album5/600', true, ARRAY['Hip Hop', 'Experimental'], 1100000, 85);

-- =====================================================
-- SAMPLE DEMO USER PROFILE
-- =====================================================
-- Note: This will need to be created via Supabase Auth in reality
-- For demonstration purposes, we'll insert placeholder data

-- Example insert (you'll do this properly via Supabase Auth signup):
-- INSERT INTO profiles (id, username, display_name, bio, avatar_url, is_artist) VALUES
--     ('u0000000-0000-0000-0000-000000000000', 'demo_user', 'Demo User', 'Music lover and playlist curator', 'https://i.pravatar.cc/300?img=10', false);

-- =====================================================
-- SAMPLE PLAYLISTS
-- =====================================================
-- Note: Requires user_id - in production this will be created by authenticated users
-- Placeholder example:

-- INSERT INTO playlists (id, name, description, cover_image_url, owner_id, is_public) VALUES
--     ('p1111111-1111-1111-1111-111111111111', 'Chill Vibes', 'Perfect for relaxing and unwinding', 'https://picsum.photos/seed/playlist1/600', 'u0000000-0000-0000-0000-000000000000', true),
--     ('p2222222-2222-2222-2222-222222222222', 'Workout Energy', 'High-energy tracks to power your workout', 'https://picsum.photos/seed/playlist2/600', 'u0000000-0000-0000-0000-000000000000', true);

-- =====================================================
-- INITIAL SITE PAGES
-- =====================================================

INSERT INTO pages (slug, title, content, is_published) VALUES
    ('terms-of-service', 'Terms of Service', '# Terms of Service

Welcome to Qoqnuz Music. By using our service, you agree to these terms.

## 1. Acceptance of Terms
By accessing and using Qoqnuz Music, you accept and agree to be bound by these Terms of Service.

## 2. Use License
We grant you a limited, non-exclusive, non-transferable license to access and use Qoqnuz Music for personal, non-commercial use.

## 3. User Accounts
- You must be 13 years or older to create an account
- You are responsible for maintaining the security of your account
- You must provide accurate and complete information

## 4. Prohibited Activities
You may not:
- Upload copyrighted content without permission
- Harass or abuse other users
- Attempt to hack or disrupt the service
- Use the service for illegal activities

## 5. Content Rights
- You retain rights to content you upload
- You grant us license to store and distribute your content
- We respect copyright and DMCA takedown requests

## 6. Termination
We reserve the right to terminate accounts that violate these terms.

Last updated: January 2025', true),

    ('privacy-policy', 'Privacy Policy', '# Privacy Policy

Your privacy is important to us. This policy explains how we collect and use your data.

## Information We Collect

### Account Information
- Email address
- Username and display name
- Profile photo (optional)

### Usage Data
- Songs you listen to
- Playlists you create
- Search history
- Device information

### Social Features
- Your followers and who you follow
- Comments and reactions
- Messages (encrypted)

## How We Use Your Data

We use your information to:
- Provide and improve our service
- Personalize your experience
- Send important updates
- Analyze usage patterns
- Prevent fraud and abuse

## Data Sharing

We do not sell your personal data. We may share data with:
- Service providers (hosting, analytics)
- Legal authorities (when required by law)

## Your Rights

You have the right to:
- Access your data
- Delete your account
- Export your data
- Opt out of marketing emails

## Data Security

We use industry-standard encryption and security measures to protect your data.

## Cookies

We use cookies to improve your experience and analyze usage.

## Contact

For privacy concerns, email: privacy@qoqnuz.com

Last updated: January 2025', true),

    ('about', 'About Qoqnuz Music', '# About Qoqnuz Music

Qoqnuz Music is a modern music streaming platform designed for music lovers, by music lovers.

## Our Mission

To connect artists with fans and make music accessible to everyone.

## Features

- **Stream millions of songs** - High-quality audio streaming
- **Create playlists** - Organize your favorite music
- **Follow artists** - Stay updated with new releases
- **Social features** - Share music with friends
- **Discover new music** - Personalized recommendations

## For Artists

Upload your music, reach new fans, and track your analytics.

## Technology

Built with modern web technologies for the best streaming experience:
- Next.js for web
- Flutter for mobile
- Supabase for backend
- Cloudflare for content delivery

## Contact

Have questions? Reach out to support@qoqnuz.com

Join us in celebrating music! 🎵', true);

-- =====================================================
-- END OF SEED DATA
-- =====================================================

-- To apply this seed data:
-- 1. First apply the schema migration
-- 2. Create a real user via Supabase Auth signup
-- 3. Then run this seed file (update user IDs as needed for playlists)
