# Qoqnuz Automation System - Complete Guide

## Overview

This automation system provides production-ready background processing for your music platform, including:

1. **Smart Playlist Generation** - Automated daily/weekly playlist creation
2. **Trending Tracks Calculation** - Real-time trending analysis
3. **Listening History Aggregation** - User statistics and insights
4. **Background Task Queue** - Mood detection, energy analysis, genre classification
5. **Scheduled Cron Jobs** - Automatic execution of all automation tasks

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Database                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              pg_cron (Scheduler)                       │ │
│  │  • Daily at 2 AM: Aggregate listening history         │ │
│  │  • Daily at 3 AM: Generate smart playlists            │ │
│  │  • Every 6 hours: Calculate trending tracks           │ │
│  │  • Weekly: Cleanup old tasks                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                             ↓                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Database Functions & Tables                  │ │
│  │  • user_listening_stats                                │ │
│  │  • smart_playlists                                     │ │
│  │  • trending_tracks                                     │ │
│  │  • background_tasks (queue)                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  • /api/automation/smart-playlists (GET, POST)              │
│  • /api/automation/trending (GET, POST)                     │
│  • /api/automation/worker (POST) - Background processor     │
│  • /api/automation/trigger (POST) - Manual triggers         │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│              External Worker (Optional)                      │
│  Continuously processes background_tasks queue              │
│  • Mood detection                                           │
│  • Energy analysis                                          │
│  • Genre classification                                     │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Enable pg_cron in Supabase

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron` and enable it

**Option B: Via SQL Editor**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Run the Migration

Apply the automation system migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL file in Supabase SQL Editor
# File: supabase/migrations/20250118000000_automation_system.sql
```

This will create:
- All necessary tables
- Database functions
- Scheduled cron jobs
- Triggers

### 3. Verify Cron Jobs are Running

Check cron job status via SQL:

```sql
SELECT * FROM cron.job ORDER BY jobid;
```

Or via API (admin only):
```bash
GET /api/automation/trigger
```

### 4. Set Environment Variables

Add to your `.env.local`:

```env
# Worker authentication (generate a secure random string)
WORKER_SECRET=your-secure-random-secret-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 5. Initial Data Population (Optional)

Manually trigger all automations for the first time:

```bash
# Via SQL
SELECT trigger_all_automations();

# Or via API (requires admin authentication)
POST /api/automation/trigger
{
  "task": "all"
}
```

## Cron Job Schedules

| Job | Schedule | Description |
|-----|----------|-------------|
| `aggregate-listening-history` | `0 2 * * *` | Daily at 2 AM - Aggregates user listening stats |
| `generate-smart-playlists` | `0 3 * * *` | Daily at 3 AM - Generates all smart playlists |
| `calculate-trending` | `0 */6 * * *` | Every 6 hours - Calculates trending tracks |
| `cleanup-background-tasks` | `0 4 * * 0` | Sunday at 4 AM - Cleans up old completed tasks |
| `cleanup-expired-playlists` | `0 5 * * *` | Daily at 5 AM - Removes expired smart playlists |

### Modifying Schedules

To change a schedule, update the migration file and re-run, or manually via SQL:

```sql
-- Example: Change trending calculation to every 3 hours
SELECT cron.unschedule('calculate-trending');
SELECT cron.schedule(
    'calculate-trending',
    '0 */3 * * *',
    $$SELECT calculate_trending_tracks();$$
);
```

## API Endpoints

### 1. Smart Playlists

#### Get User's Smart Playlists
```bash
GET /api/automation/smart-playlists
GET /api/automation/smart-playlists?type=daily_mix

Response:
{
  "playlists": [
    {
      "id": "uuid",
      "playlist_type": "daily_mix",
      "track_ids": ["track-id-1", "track-id-2"],
      "tracks": [...full track objects...],
      "track_count": 50,
      "generated_at": "2025-01-18T03:00:00Z",
      "expires_at": "2025-01-19T03:00:00Z"
    }
  ]
}
```

#### Manually Generate Playlist
```bash
POST /api/automation/smart-playlists
{
  "playlistType": "daily_mix"
}

Response:
{
  "success": true,
  "playlist_type": "daily_mix",
  "track_ids": [...],
  "message": "Playlist generated successfully"
}
```

Supported playlist types:
- `daily_mix` - Personalized mix of recent favorites + similar tracks
- `discovery_weekly` - New tracks matching user taste
- `new_for_you` - Latest releases from favorite artists
- `forgotten_favorites` - Old favorites user hasn't played recently

### 2. Trending Tracks

#### Get Trending Tracks
```bash
GET /api/automation/trending?limit=50

Response:
{
  "tracks": [
    {
      "id": "track-id",
      "title": "Track Title",
      "artists": {...},
      "albums": {...},
      "trending_data": {
        "trend_score": 1250.50,
        "play_count_24h": 125,
        "play_count_7d": 450,
        "unique_listeners_24h": 89,
        "unique_listeners_7d": 234,
        "calculated_at": "2025-01-18T00:00:00Z"
      }
    }
  ],
  "total": 50,
  "calculated_at": "2025-01-18T00:00:00Z"
}
```

#### Manually Calculate Trending (Admin Only)
```bash
POST /api/automation/trending

Response:
{
  "success": true,
  "message": "Trending tracks calculated successfully"
}
```

### 3. Background Worker

#### Process Background Tasks
```bash
POST /api/automation/worker
Authorization: Bearer YOUR_WORKER_SECRET
{
  "taskType": "mood_detection",  // optional, processes all types if omitted
  "batchSize": 10
}

Response:
{
  "success": true,
  "processed": 5,
  "tasks": [
    {
      "id": "task-id",
      "type": "mood_detection",
      "status": "completed"
    }
  ]
}
```

#### Check Worker Status
```bash
GET /api/automation/worker
Authorization: Bearer YOUR_WORKER_SECRET

Response:
{
  "status": "healthy",
  "summary": {
    "total": 150,
    "by_status": {
      "pending": 45,
      "processing": 2,
      "completed": 98,
      "failed": 5
    },
    "by_type": {
      "mood_detection": 80,
      "energy_analysis": 70
    }
  }
}
```

### 4. Manual Triggers (Admin Only)

#### Trigger Automations
```bash
POST /api/automation/trigger
{
  "task": "all"  // Options: all, smart_playlists, trending, listening_stats
}

Response:
{
  "success": true,
  "triggered_at": "2025-01-18T10:30:00Z",
  "tasks": [
    {
      "name": "all_automations",
      "status": "success",
      "message": "All automations triggered successfully"
    }
  ]
}
```

#### Get Automation Status
```bash
GET /api/automation/trigger

Response:
{
  "success": true,
  "automation_status": {
    "cron_jobs": [...],
    "background_tasks": {
      "total": 150,
      "by_status": {...},
      "by_type": {...}
    },
    "smart_playlists": {
      "total": 500,
      "by_type": {...},
      "latest_generation": "2025-01-18T03:00:00Z"
    },
    "trending_tracks": {
      "last_calculated": "2025-01-18T00:00:00Z"
    }
  }
}
```

## Smart Playlist Algorithms

### Daily Mix
- **60%** User's recent plays (last 30 days)
- **40%** Similar tracks from favorite artists/genres
- **Refresh:** Daily
- **Expires:** 24 hours

### Discovery Weekly
- Tracks user hasn't heard
- Matches user's favorite genres (top 5)
- Recent tracks (last 90 days)
- Sorted by popularity + randomness
- **Refresh:** Weekly (Monday)
- **Expires:** 7 days

### New For You
- Latest releases (last 30 days)
- From user's top 10 artists
- **Refresh:** Daily
- **Expires:** 24 hours

### Forgotten Favorites
- Tracks played 3+ times
- Not played in last 60 days
- Played more than 60 days ago
- **Refresh:** Weekly
- **Expires:** 7 days

## Background Task Processing

### Task Queue System

Tasks are automatically queued when:
- New track is uploaded → `mood_detection` + `energy_analysis` tasks created
- Can also be manually queued via database

### Processing Tasks

**Option 1: Manual Processing (Testing)**
```bash
POST /api/automation/worker
Authorization: Bearer YOUR_WORKER_SECRET
{
  "batchSize": 10
}
```

**Option 2: Continuous Worker (Production)**

Create a worker service that runs continuously:

```typescript
// worker.ts
import fetch from 'node-fetch';

const WORKER_URL = 'https://your-app.vercel.app/api/automation/worker';
const WORKER_SECRET = process.env.WORKER_SECRET;

async function processTaskBatch() {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKER_SECRET}`,
      },
      body: JSON.stringify({ batchSize: 10 }),
    });

    const result = await response.json();
    console.log('Processed tasks:', result.processed);
  } catch (error) {
    console.error('Worker error:', error);
  }
}

// Run every 30 seconds
setInterval(processTaskBatch, 30000);
```

**Option 3: Vercel Cron (Recommended for Production)**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/automation/worker",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Then modify the worker endpoint to accept Vercel's cron secret.

### Implementing Mood Detection

The worker currently uses placeholder mood detection. To implement real mood detection:

**Option 1: External API (Spotify, AcousticBrainz)**
```typescript
async function processMoodDetection(trackId: string, supabase: any) {
  const { data: track } = await supabase
    .from('tracks')
    .select('audio_url, title')
    .eq('id', trackId)
    .single();

  // Use external API
  const response = await fetch('https://api.spotify.com/v1/audio-features/...', {
    headers: { Authorization: 'Bearer YOUR_TOKEN' }
  });

  const features = await response.json();

  // Map valence and energy to mood
  const mood = calculateMoodFromFeatures(features.valence, features.energy);

  await supabase
    .from('tracks')
    .update({ mood, energy_level: features.energy })
    .eq('id', trackId);
}
```

**Option 2: Self-Hosted ML Model**
```typescript
async function processMoodDetection(trackId: string, supabase: any) {
  // Use essentia.js or librosa via Python subprocess
  const audioFeatures = await extractAudioFeatures(audioFilePath);
  const mood = await mlModel.predict(audioFeatures);

  await supabase
    .from('tracks')
    .update({ mood })
    .eq('id', trackId);
}
```

## Monitoring & Maintenance

### Check System Health

```sql
-- Check cron job status
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Check pending background tasks
SELECT status, COUNT(*)
FROM background_tasks
GROUP BY status;

-- Check smart playlist coverage
SELECT playlist_type, COUNT(DISTINCT user_id) as user_count
FROM smart_playlists
GROUP BY playlist_type;

-- Check trending tracks freshness
SELECT calculated_at
FROM trending_tracks
LIMIT 1;
```

### Common Issues

**Issue: Cron jobs not running**
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check cron schedule
SELECT * FROM cron.job;

-- Check recent errors
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

**Issue: Background tasks stuck in processing**
```sql
-- Reset stuck tasks (processing for > 30 minutes)
UPDATE background_tasks
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
AND started_at < NOW() - INTERVAL '30 minutes';
```

**Issue: Smart playlists empty**
```sql
-- Check if user has enough play history
SELECT user_id, COUNT(*)
FROM play_history
WHERE played_at > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Manually generate for specific user
SELECT generate_daily_mix('user-uuid-here');
```

## Performance Optimization

### Database Indexes

The migration creates these indexes:
- `user_listening_stats(updated_at)`
- `smart_playlists(user_id, playlist_type, expires_at)`
- `trending_tracks(trend_score DESC)`
- `background_tasks(status, priority, created_at)`

### Scaling Considerations

For large user bases (>100k users):

1. **Partition smart_playlists table by user_id**
2. **Use Redis for caching trending tracks**
3. **Implement sharding for background_tasks**
4. **Run worker as distributed service**

## Testing

### Test Smart Playlist Generation

```bash
# Generate for current user
POST /api/automation/smart-playlists
{
  "playlistType": "daily_mix"
}

# Verify in database
SELECT * FROM smart_playlists WHERE user_id = 'your-user-id';
```

### Test Trending Calculation

```bash
# Trigger calculation
POST /api/automation/trigger
{
  "task": "trending"
}

# Check results
GET /api/automation/trending?limit=10
```

### Test Background Worker

```bash
# Process tasks
POST /api/automation/worker
Authorization: Bearer YOUR_WORKER_SECRET
{
  "batchSize": 5
}

# Check task status
SELECT * FROM background_tasks
ORDER BY created_at DESC
LIMIT 10;
```

## Production Deployment Checklist

- [ ] Enable pg_cron extension in Supabase
- [ ] Run automation migration
- [ ] Set WORKER_SECRET environment variable
- [ ] Verify cron jobs are scheduled
- [ ] Set up worker service (Vercel Cron or standalone)
- [ ] Test all API endpoints
- [ ] Monitor initial automation runs
- [ ] Set up error alerting
- [ ] Configure log aggregation
- [ ] Schedule database backups

## Support & Troubleshooting

### Logs

Check Supabase logs:
1. Go to Supabase Dashboard → Logs
2. Filter by "postgres logs" to see cron execution
3. Check for errors in function execution

### Manual Execution

Force run any automation:
```sql
-- Run specific automation
SELECT aggregate_all_user_listening_history();
SELECT generate_all_smart_playlists();
SELECT calculate_trending_tracks();

-- Run all
SELECT trigger_all_automations();
```

### Disable Automation

Temporarily disable cron jobs:
```sql
-- Disable specific job
SELECT cron.unschedule('job-name-here');

-- Re-enable
SELECT cron.schedule('job-name', 'schedule', 'command');
```

## Next Steps

1. **Implement Real Mood Detection**: Replace placeholder with actual ML model or API
2. **Add User Notifications**: Notify users when new playlists are ready
3. **Create Admin Dashboard**: UI to monitor automation status
4. **Add A/B Testing**: Test different playlist algorithms
5. **Implement Collaborative Filtering**: Use user similarity for better recommendations
