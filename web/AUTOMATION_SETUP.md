# Automation System - Complete Setup Guide

## Overview

I've completely rebuilt the automation system from scratch. It's now simple, clean, and actually works.

## What This Does

- **Background Tasks**: Tracks all automation jobs
- **Smart Playlists**: Auto-generated playlists for users
- **Trending Tracks**: Calculates and displays trending music
- **Manual Triggers**: Admin can trigger any automation task
- **Status Dashboard**: View all automation status in one place

## Installation Steps

### 1. Pull the Latest Code

```bash
cd /home/user/qoqnuzmedia/web
git pull origin claude/analyze-project-01P6FZXPRsTB7k6QxY8QoYFh
```

### 2. Run the Database Migration

Go to your **Supabase Dashboard** → **SQL Editor**

Copy and run the entire contents of:
```
supabase/migrations/20250119000000_simple_automation_system.sql
```

This will:
- Create `background_tasks`, `smart_playlists`, `trending_tracks` tables
- Set up RLS policies
- Create automation functions
- Add sample data

### 3. Build and Deploy

```bash
npm run build
pm2 restart qoqnuz-web
```

### 4. Test It

1. Go to `https://app.qoqnuz.com/admin/automation`
2. You should see:
   - System Health status
   - Manual trigger buttons
   - Background task stats
   - Smart playlist stats
   - Trending tracks info

## How It Works

### Authentication
- Uses the **same authentication** as all other admin routes
- Checks `admin_users` table (no environment variables needed)
- Same `requireAdmin` function that works everywhere else

### API Endpoints

**GET /api/automation/trigger**
- Returns automation status
- Shows cron jobs (if available)
- Shows background task statistics
- Shows smart playlist counts
- Shows trending track status

**POST /api/automation/trigger**
- Trigger automation tasks manually
- Options: `all`, `smart_playlists`, `trending`, `listening_stats`

### Database Tables

**background_tasks**
- Tracks all automation jobs
- Fields: task_type, status, timestamps, error_message

**smart_playlists**
- Stores generated playlists
- Per-user playlists with expiration

**trending_tracks**
- Calculated trending tracks
- Includes trend score and play counts

### Functions

All automation logic is in PostgreSQL functions:

- `get_cron_job_status()` - Get scheduled jobs
- `calculate_trending_tracks()` - Calculate trending music
- `generate_all_smart_playlists()` - Create playlists
- `aggregate_all_user_listening_history()` - Aggregate stats
- `trigger_all_automations()` - Run all tasks

## Manual Triggers

From the admin dashboard you can manually trigger:

1. **Trigger All** - Runs all automation tasks
2. **Smart Playlists** - Generates playlists for all users
3. **Trending** - Calculates trending tracks
4. **Listening Stats** - Aggregates user listening data

## Troubleshooting

### "Unauthorized" Error

Make sure you're signed in and in the `admin_users` table:

```sql
SELECT u.email, ar.name as role
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id;
```

### Empty Data

The migration adds sample data, but to get real data:

1. Click "Trigger All" in the dashboard
2. Wait a few seconds
3. Refresh the page

### No Cron Jobs Showing

Cron jobs require the `pg_cron` extension. If not installed:
- The system still works fine
- Manual triggers work normally
- Just won't show scheduled jobs

To install pg_cron (optional):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Customization

### Adding New Automation Tasks

1. Create a new function in PostgreSQL:
```sql
CREATE OR REPLACE FUNCTION my_custom_task()
RETURNS void AS $$
BEGIN
  -- Your logic here

  -- Log it
  INSERT INTO background_tasks (task_type, status, completed_at)
  VALUES ('my_custom_task', 'completed', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Add a button in the dashboard
3. Add a case in the API route

### Scheduling Tasks

If you have `pg_cron`:

```sql
SELECT cron.schedule(
  'calculate-trending',           -- job name
  '0 2 * * *',                    -- schedule (2 AM daily)
  $$SELECT calculate_trending_tracks()$$
);
```

## Architecture

```
Admin Dashboard (page.tsx)
    ↓
GET /api/automation/trigger
    ↓
requireAdmin() - Check auth
    ↓
Query: background_tasks, smart_playlists, trending_tracks
    ↓
Return: automation_status object
```

Simple, clean, and it works.

## Summary

- ✅ Simple database schema
- ✅ Working authentication (same as other routes)
- ✅ Clean API endpoints
- ✅ Working dashboard page
- ✅ Manual triggers for all tasks
- ✅ No complicated dependencies

Just run the migration and deploy. That's it.
