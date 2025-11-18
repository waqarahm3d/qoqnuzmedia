# Supabase Database Files

This directory contains all Supabase database migrations and helper scripts.

## Directory Structure

```
supabase/
├── migrations/          # Database migration files (run in order)
│   ├── 20250117000001_audio_downloader.sql
│   ├── 20250117000002_smart_playlists_discovery.sql
│   ├── 20250117000003_smart_playlists_discovery_fixed.sql
│   ├── 20250117000004_helper_functions.sql
│   ├── 20250118000000_automation_system.sql (deprecated - use fixed version)
│   └── 20250118000001_automation_system_fixed.sql (✅ USE THIS ONE)
│
└── scripts/             # Helper and utility scripts (run manually as needed)
    ├── add_admin_user.sql           # Add yourself as admin user
    ├── check_admin_schema.sql       # Check admin table structure
    ├── clean_install.sql            # Clean up automation tables for fresh install
    ├── fix_smart_playlists.sql      # Fix smart playlists schema conflicts
    ├── quick_check.sql              # Quick verification of automation setup
    └── verify_automation.sql        # Verify automation system is working
```

## How to Use

### Running Migrations

**Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file
4. Run them in order (by timestamp)

**Option 2: Supabase CLI**
```bash
supabase db push
```

### Running Helper Scripts

Helper scripts in the `scripts/` folder are meant to be run manually when needed:

```bash
# Example: Add yourself as admin
# 1. Open Supabase SQL Editor
# 2. Copy contents of scripts/add_admin_user.sql
# 3. Replace 'your-email@example.com' with your email
# 4. Run the query
```

## Migration Order

If setting up from scratch, run migrations in this order:

1. ✅ `20250117000001_audio_downloader.sql` - Audio download system
2. ✅ `20250117000003_smart_playlists_discovery_fixed.sql` - Smart playlists (use fixed version)
3. ✅ `20250117000004_helper_functions.sql` - Helper functions
4. ✅ `20250118000001_automation_system_fixed.sql` - Automation system (use fixed version)

**Note:** Skip the non-"fixed" versions (they have known issues).

## Important Scripts

### For Admin Setup
- `scripts/add_admin_user.sql` - Make yourself an admin (required for admin panel access)
- `scripts/check_admin_schema.sql` - Debug admin table structure

### For Automation Setup
- `scripts/quick_check.sql` - Verify automation is set up correctly
- `scripts/verify_automation.sql` - Test automation functions
- `scripts/clean_install.sql` - Clean up if you need to reinstall automation

### For Schema Issues
- `scripts/fix_smart_playlists.sql` - Fix smart playlists table conflicts

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Documentation

- [AUTOMATION_GUIDE.md](../AUTOMATION_GUIDE.md) - Complete automation system guide
- [USE_THIS_MIGRATION.md](./USE_THIS_MIGRATION.md) - Which migration files to use
