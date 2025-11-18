# Audio Downloader Integration Guide

## Overview

This guide explains how the Audio Downloader has been integrated into the Qoqnuz Music platform. The audio downloader allows you to download and process audio from YouTube and SoundCloud directly from your admin panel.

---

## Architecture

### Microservice Architecture

The audio downloader uses a **microservice architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Qoqnuz Music Platform                     │
│                  (Next.js + Supabase)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │          Admin Panel (Next.js)                   │     │
│  │  - Downloads Management UI                        │     │
│  │  - Job Monitoring                                 │     │
│  │  - Whitelist Configuration                        │     │
│  └──────────────┬───────────────────────────────────┘     │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────┐     │
│  │      Next.js API Routes                          │     │
│  │  - /api/admin/downloads                          │     │
│  │  - /api/admin/downloads/[jobId]                  │     │
│  │  - /api/admin/downloads/callback                 │     │
│  │  - /api/admin/downloads/whitelist                │     │
│  └──────────────┬───────────────────────────────────┘     │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────┐     │
│  │       Supabase Database                          │     │
│  │  - download_jobs                                 │     │
│  │  - downloaded_tracks                             │     │
│  │  - download_whitelist                            │     │
│  │  - download_statistics                           │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP API Calls
┌─────────────────▼───────────────────────────────────────────┐
│         Audio Processor Service (Python)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │          FastAPI Application                      │     │
│  │  - Download endpoints                             │     │
│  │  - Job status endpoints                           │     │
│  └──────────────┬───────────────────────────────────┘     │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────┐     │
│  │      Celery Workers (Background)                 │     │
│  │  - YouTube Downloader (yt-dlp)                   │     │
│  │  - SoundCloud Downloader (scdl)                  │     │
│  │  - Audio Processor (FFmpeg)                      │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │             Redis Queue                           │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## What Was Added

### 1. Database Schema

**Location:** `web/supabase-migrations/001_audio_downloader.sql`

Four new tables were added to your Supabase database:

- **`download_jobs`**: Tracks download job status and progress
- **`downloaded_tracks`**: Individual tracks downloaded from jobs
- **`download_whitelist`**: Approved channels/users for downloading
- **`download_statistics`**: Daily statistics for monitoring

### 2. Next.js API Routes

**Location:** `web/src/app/api/admin/downloads/`

- **`route.ts`**: Submit new jobs, list all jobs, cleanup old jobs
- **`[jobId]/route.ts`**: Get job details, cancel job, delete job
- **`callback/route.ts`**: Webhook endpoint for status updates from audio processor
- **`whitelist/route.ts`**: Manage whitelist entries

### 3. Admin UI

**Location:** `web/src/app/admin/downloads/page.tsx`

A complete download management interface with:
- Submit new download jobs
- Monitor job progress in real-time
- Filter by status
- Cancel/delete jobs
- View error messages

### 4. Admin Navigation

Updated `AdminLayout.tsx` to include "Downloads" in the navigation menu.

### 5. Configuration Files

- **`web/.env.local.example`**: Added audio processor configuration
- **`audio-processor/.env.supabase.example`**: Supabase-specific configuration
- **`audio-processor/app/config_supabase.py`**: Python configuration for Supabase

### 6. Docker Integration

**Location:** `docker-compose.integrated.yml`

A complete Docker Compose setup for running the audio processor alongside your Next.js app.

---

## Setup Instructions

### Step 1: Run Database Migration

```bash
cd web

# Connect to your Supabase project
# Go to https://app.supabase.com → SQL Editor

# Copy and run the contents of:
cat supabase-migrations/001_audio_downloader.sql
# Paste into SQL Editor and execute
```

### Step 2: Configure Environment Variables

#### Next.js App (.env.local)

```bash
cd web
cp .env.local.example .env.local
```

Add these new variables:

```bash
# Audio Processor Integration
AUDIO_PROCESSOR_URL=http://localhost:8000
AUDIO_PROCESSOR_API_KEY=your-strong-api-key-here
DOWNLOAD_WHITELIST_ENABLED=false
```

#### Audio Processor (.env)

```bash
cd ../audio-processor
cp .env.supabase.example .env
```

Update with your Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
AUDIO_PROCESSOR_API_KEY=your-strong-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
CALLBACK_URL=http://localhost:3000/api/admin/downloads/callback
```

### Step 3: Install Dependencies

#### Audio Processor

```bash
cd audio-processor

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg (if not already installed)
# Ubuntu/Debian:
sudo apt update && sudo apt install -y ffmpeg

# macOS:
brew install ffmpeg
```

### Step 4: Start Services

#### Option A: Docker (Recommended)

```bash
# From project root
docker-compose -f docker-compose.integrated.yml up -d

# View logs
docker-compose -f docker-compose.integrated.yml logs -f
```

#### Option B: Manual

Terminal 1 - Redis:
```bash
redis-server
```

Terminal 2 - Audio Processor API:
```bash
cd audio-processor
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 3 - Celery Worker:
```bash
cd audio-processor
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info --concurrency=2
```

Terminal 4 - Next.js App:
```bash
cd web
pnpm dev
```

### Step 5: Test the Integration

1. **Access Admin Panel**: http://localhost:3000/admin
2. **Navigate to Downloads**: Click "Downloads" in sidebar
3. **Submit a Test Download**:
   - Click "+ New Download"
   - Enter a YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Select source type: YouTube
   - Select download type: Single
   - Click "Submit Download"
4. **Monitor Progress**: The job will appear in the list with real-time progress updates

---

## How It Works

### Workflow

1. **Admin submits download** via admin panel UI
2. **Next.js API** creates job in Supabase (`download_jobs` table)
3. **Next.js API** forwards request to Audio Processor service
4. **Audio Processor** queues job in Celery
5. **Celery Worker** processes the download:
   - Downloads audio using yt-dlp or scdl
   - Processes audio with FFmpeg (MP3, 320kbps, normalization)
   - Sends progress updates via webhook callback
6. **Callback endpoint** updates job status in Supabase
7. **Admin UI** polls for updates and displays progress
8. **Completed files** are stored locally, can be uploaded to R2

### API Communication

```javascript
// Next.js → Audio Processor
POST http://localhost:8000/api/v1/download
Headers: X-API-Key: your-api-key
Body: {
  job_id: "uuid",
  url: "https://youtube.com/...",
  source_type: "youtube",
  download_type: "single",
  callback_url: "http://localhost:3000/api/admin/downloads/callback"
}

// Audio Processor → Next.js (callback)
POST http://localhost:3000/api/admin/downloads/callback
Body: {
  job_id: "uuid",
  status: "downloading",
  progress: {
    current_item: "Track name",
    completed_items: 5,
    total_items: 10,
    progress_percent: 50
  }
}
```

---

## Features

### ✅ Supported Sources

- **YouTube**:
  - Single videos
  - Playlists
  - Channels
- **SoundCloud**:
  - Single tracks
  - Playlists
  - User profiles

### ✅ Audio Processing

- **Format**: MP3
- **Bitrate**: 320kbps
- **Sample Rate**: 48kHz
- **Processing**:
  - Audio normalization
  - Metadata embedding
  - Cover art extraction

### ✅ Job Management

- Real-time progress tracking
- Cancel running jobs
- Delete old jobs
- Filter by status (pending, downloading, completed, failed)
- Automatic cleanup of old jobs

### ✅ Whitelist System

- Restrict downloads to approved channels/users
- Manage whitelist via admin panel
- Prevent unauthorized downloads

### ✅ Monitoring

- Job statistics dashboard
- Celery monitoring with Flower (port 5555)
- Detailed error logging
- Progress percentage tracking

---

## Production Deployment

### VPS Deployment

1. **Deploy Audio Processor**:
   ```bash
   # Follow audio-processor/VPS_SETUP.md
   # Or use audio-processor/DEPLOYMENT.md
   ```

2. **Update Next.js .env.local**:
   ```bash
   AUDIO_PROCESSOR_URL=https://audio.qoqnuz.com
   # or http://your-vps-ip:8000
   ```

3. **Configure Firewall**:
   ```bash
   # Allow port 8000 for audio processor
   sudo ufw allow 8000/tcp
   ```

4. **Use Systemd Services**:
   ```bash
   sudo cp audio-processor/systemd/*.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable audio-processor-api
   sudo systemctl enable audio-processor-worker
   sudo systemctl start audio-processor-api
   sudo systemctl start audio-processor-worker
   ```

### Docker Deployment

```bash
# Production docker-compose
docker-compose -f docker-compose.integrated.yml up -d

# Check logs
docker-compose -f docker-compose.integrated.yml logs -f

# Scale workers
docker-compose -f docker-compose.integrated.yml scale audio-processor-worker=4
```

---

## Security Considerations

### API Key

- Generate strong API key:
  ```bash
  openssl rand -hex 32
  ```
- Use same key in both Next.js and Audio Processor
- Keep it secret, never commit to git

### Whitelist

- Enable whitelist for production:
  ```bash
  DOWNLOAD_WHITELIST_ENABLED=true
  ```
- Only add your own channels/users to whitelist

### Firewall

```bash
# Only allow necessary ports
sudo ufw allow 3000/tcp  # Next.js
sudo ufw allow 8000/tcp  # Audio Processor (if separate VPS)
sudo ufw allow 6379/tcp  # Redis (only if remote)
```

### Database

- Use Supabase Row Level Security (RLS) policies
- Already configured in migration file
- Only admins can access download jobs

---

## Troubleshooting

### Jobs stuck in "pending"

**Cause**: Celery worker not running or can't connect to Redis

**Solution**:
```bash
# Check worker status
docker-compose logs audio-processor-worker
# or
systemctl status audio-processor-worker

# Restart worker
docker-compose restart audio-processor-worker
# or
sudo systemctl restart audio-processor-worker
```

### Downloads failing

**Cause**: yt-dlp outdated or FFmpeg missing

**Solution**:
```bash
# Update yt-dlp
pip install --upgrade yt-dlp

# Check FFmpeg
ffmpeg -version
```

### Callback not updating status

**Cause**: CALLBACK_URL incorrect or firewall blocking

**Solution**:
```bash
# Test callback manually
curl -X POST http://localhost:3000/api/admin/downloads/callback \
  -H "Content-Type: application/json" \
  -d '{"job_id":"test","status":"completed"}'

# Check audio processor logs
docker-compose logs audio-processor-api
```

### Can't connect to audio processor

**Cause**: Service not running or wrong URL

**Solution**:
```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
docker-compose logs audio-processor-api

# Verify AUDIO_PROCESSOR_URL in .env.local
```

---

## Monitoring

### Celery Tasks (Flower)

Access: http://localhost:5555

- View active tasks
- Monitor worker status
- Check task history
- View task arguments and results

### Database Statistics

```sql
-- Total jobs by status
SELECT status, COUNT(*) FROM download_jobs GROUP BY status;

-- Daily statistics
SELECT * FROM download_statistics ORDER BY date DESC LIMIT 30;

-- Recent jobs
SELECT * FROM download_jobs ORDER BY created_at DESC LIMIT 10;
```

### Logs

```bash
# Docker
docker-compose logs -f audio-processor-api
docker-compose logs -f audio-processor-worker

# Systemd
sudo journalctl -u audio-processor-api -f
sudo journalctl -u audio-processor-worker -f

# Application logs
tail -f audio-processor/logs/app.log
tail -f audio-processor/logs/celery-worker.log
```

---

## Next Steps

### 1. Integrate with Track Upload

Link downloaded tracks to your track upload system:

```typescript
// In admin panel, add button to upload downloaded track
const uploadDownloadedTrack = async (downloadedTrack) => {
  // Read file from downloads directory
  // Upload to R2 via existing upload API
  // Create track in database
  // Update downloaded_tracks.uploaded_to_platform = true
};
```

### 2. Automated Processing

Set up automatic upload of completed downloads:

```python
# In audio processor, after download completes:
# - Upload to R2 via Qoqnuz API
# - Create track entry
# - Link to artist
```

### 3. Scheduled Downloads

Add ability to schedule downloads:

```sql
-- Add scheduled_at column to download_jobs
ALTER TABLE download_jobs ADD COLUMN scheduled_at TIMESTAMP;

-- Celery beat can check for scheduled jobs
```

### 4. Notification System

Notify when downloads complete:

```typescript
// Send email or push notification
// Update admin dashboard with toast notification
```

---

## Support

For issues and questions:

- **Audio Processor Docs**: `audio-processor/README.md`
- **VPS Setup**: `audio-processor/VPS_SETUP.md`
- **Deployment Guide**: `audio-processor/DEPLOYMENT.md`
- **Quick Start**: `audio-processor/QUICK_START.md`

---

## Summary

The audio downloader is now fully integrated into your Qoqnuz Music platform:

✅ **Database tables** created in Supabase
✅ **API routes** for job management
✅ **Admin UI** for downloads management
✅ **Python microservice** for processing
✅ **Docker setup** for easy deployment
✅ **Documentation** for setup and maintenance

You can now download audio from YouTube and SoundCloud directly from your admin panel!
