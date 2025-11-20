# Media Files Migration Guide

This guide covers migrating audio files, images, and other media from play.qoqnuz.com to the new platform.

## 📁 Media Types to Migrate

1. **Audio Files** - Track audio files (MP3, FLAC, etc.)
2. **Album Covers** - Album artwork images
3. **Artist Images** - Artist profile photos
4. **Playlist Covers** - Playlist cover images
5. **User Avatars** - User profile pictures

## 🎯 Migration Strategy Options

### Option 1: Cloud Storage (Recommended)
**Best for:** Large libraries, better performance, CDN support

Use Supabase Storage or external cloud storage (S3, Cloudflare R2, etc.)

### Option 2: Keep Files in Place
**Best for:** Quick migration, minimal downtime

Update URLs in database to point to old server temporarily, migrate files gradually.

### Option 3: Direct Transfer
**Best for:** Small libraries, self-hosted setups

Download and re-upload all files to new storage.

---

## 🚀 Recommended Approach: Supabase Storage Migration

### Step 1: Set Up Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('audio', 'audio', true),
  ('album-covers', 'album-covers', true),
  ('artist-images', 'artist-images', true),
  ('playlist-covers', 'playlist-covers', true),
  ('avatars', 'avatars', true);

-- Set up storage policies (public read, admin write)
CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Admins can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio' AND
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- Repeat for other buckets...
```

### Step 2: Download Files from Old Server

```bash
#!/bin/bash
# download_media.sh

OLD_SERVER="play.qoqnuz.com"
EXPORT_DIR="./migration/media_export"

mkdir -p "$EXPORT_DIR"/{audio,album_covers,artist_images,playlist_covers,avatars}

# Download audio files
rsync -avz --progress \
  user@$OLD_SERVER:/path/to/audio/ \
  "$EXPORT_DIR/audio/"

# Download album covers
rsync -avz --progress \
  user@$OLD_SERVER:/path/to/album_covers/ \
  "$EXPORT_DIR/album_covers/"

# Download artist images
rsync -avz --progress \
  user@$OLD_SERVER:/path/to/artist_images/ \
  "$EXPORT_DIR/artist_images/"

# Download playlist covers
rsync -avz --progress \
  user@$OLD_SERVER:/path/to/playlist_covers/ \
  "$EXPORT_DIR/playlist_covers/"

# Download avatars
rsync -avz --progress \
  user@$OLD_SERVER:/path/to/avatars/ \
  "$EXPORT_DIR/avatars/"

echo "✅ Media download complete!"
```

### Step 3: Upload to Supabase Storage

```javascript
// upload_media.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadFiles(bucketName, sourceDir) {
  const files = glob.sync(`${sourceDir}/**/*.*`);

  console.log(`📦 Uploading ${files.length} files to ${bucketName}...`);

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: getMimeType(filePath),
          upsert: true
        });

      if (error) throw error;
      console.log(`✅ Uploaded: ${fileName}`);

    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
    }
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function main() {
  await uploadFiles('audio', './migration/media_export/audio');
  await uploadFiles('album-covers', './migration/media_export/album_covers');
  await uploadFiles('artist-images', './migration/media_export/artist_images');
  await uploadFiles('playlist-covers', './migration/media_export/playlist_covers');
  await uploadFiles('avatars', './migration/media_export/avatars');

  console.log('✅ All media uploaded!');
}

main().catch(console.error);
```

### Step 4: Update Database URLs

```sql
-- Update track audio URLs
UPDATE tracks
SET audio_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/audio/',
  SUBSTRING(audio_url FROM '.*/([^/]+)$')
);

-- Update album cover URLs
UPDATE albums
SET cover_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/album-covers/',
  SUBSTRING(cover_url FROM '.*/([^/]+)$')
);

-- Update artist image URLs
UPDATE artists
SET image_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/artist-images/',
  SUBSTRING(image_url FROM '.*/([^/]+)$')
);

-- Update playlist cover URLs
UPDATE playlists
SET cover_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/playlist-covers/',
  SUBSTRING(cover_url FROM '.*/([^/]+)$')
);

-- Update user avatars
UPDATE profiles
SET avatar_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/avatars/',
  SUBSTRING(avatar_url FROM '.*/([^/]+)$')
);
```

---

## ⚡ Alternative: Progressive Migration

If you have a large library and want minimal downtime:

### 1. Keep URLs Pointing to Old Server
```sql
-- No immediate changes needed
-- Audio files remain on old server
```

### 2. Set Up Proxy (Temporary)
```javascript
// src/app/api/media-proxy/[...path]/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/media-proxy/', '');

  // Fetch from old server
  const oldServerUrl = `https://play.qoqnuz.com/media/${path}`;
  const response = await fetch(oldServerUrl);

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || '',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}
```

### 3. Migrate Files Gradually
Run migration script in background, updating URLs as files are migrated.

---

## 📊 Media Migration Checklist

- [ ] Back up all media files
- [ ] Set up storage buckets
- [ ] Configure storage policies
- [ ] Download files from old server
- [ ] Upload files to new storage
- [ ] Update database URLs
- [ ] Test media playback
- [ ] Test image loading
- [ ] Set up CDN (optional)
- [ ] Monitor storage usage
- [ ] Remove old media files (after verification)

---

## 🔍 Verification Script

```bash
#!/bin/bash
# verify_media.sh

echo "🔍 Verifying media migration..."

# Check for broken URLs in database
psql $DATABASE_URL << EOF
SELECT 'Tracks with null audio_url' as issue, COUNT(*)
FROM tracks WHERE audio_url IS NULL
UNION ALL
SELECT 'Albums with null cover_url', COUNT(*)
FROM albums WHERE cover_url IS NULL
UNION ALL
SELECT 'Artists with null image_url', COUNT(*)
FROM artists WHERE image_url IS NULL;
EOF

echo "✅ Verification complete!"
```

---

## 💡 Best Practices

1. **Test with subset first** - Migrate 10-20 files first to verify process
2. **Keep backups** - Don't delete old files until fully verified
3. **Use CDN** - Enable CDN for better performance
4. **Optimize images** - Compress images before uploading
5. **Monitor costs** - Track storage and bandwidth usage
6. **Progressive loading** - Implement lazy loading for images
7. **Set expiry headers** - Cache media files aggressively

---

## 🚨 Troubleshooting

**Issue:** Upload fails with "File too large"
**Solution:** Increase max file size in Supabase Storage settings

**Issue:** Slow upload speed
**Solution:** Use parallel uploads with Promise.all() in batches

**Issue:** Broken URLs after migration
**Solution:** Run URL update script again, check for typos in bucket names

**Issue:** Audio doesn't play
**Solution:** Check CORS settings and Content-Type headers
