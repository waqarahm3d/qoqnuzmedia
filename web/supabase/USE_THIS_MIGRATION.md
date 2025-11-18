# ⚠️ IMPORTANT - Use the Fixed Migration

## Which File to Use

**❌ DO NOT USE:**
- `migrations/20250118000000_automation_system.sql` (has syntax error)

**✅ USE THIS ONE:**
- `migrations/20250118000001_automation_system_fixed.sql` (syntax errors fixed)

---

## What Was Fixed

The original migration had two syntax errors:

### Error 1: Line 237 - UNION ALL syntax
**Problem:** The `generate_daily_mix()` function had an incorrect UNION ALL structure.

**Fixed:** Restructured using CTEs (Common Table Expressions):
```sql
WITH recent_plays AS (...),
     similar_tracks AS (...)
SELECT ... FROM recent_plays
UNION ALL
SELECT ... FROM similar_tracks
```

### Error 2: Listening patterns query
**Problem:** Cross join syntax was causing issues in `aggregate_user_listening_history()`.

**Fixed:** Used proper CTEs with explicit FROM clause:
```sql
WITH hour_stats AS (...),
     day_stats AS (...)
SELECT ... FROM hour_stats, day_stats
```

---

## Setup Instructions

### Step 1: Clean Install (if you tried the old one)

If you already tried the broken migration:

```sql
-- Run this in Supabase SQL Editor
\i supabase/clean_install.sql
```

### Step 2: Enable pg_cron

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 3: Run the FIXED Migration

1. Open Supabase SQL Editor
2. Copy **ALL** contents of: `migrations/20250118000001_automation_system_fixed.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for "Success. No rows returned"

### Step 4: Verify

```sql
-- Run the quick check
\i supabase/quick_check.sql
```

Expected output:
```
✅ pg_cron ENABLED
✅ All tables exist
✅ All cron jobs ACTIVE
✅ Functions exist
✅ AUTOMATION SYSTEM IS READY!
```

---

## Migration Differences

Both files create the same structure, but the fixed version has:
- ✅ Correct SQL syntax
- ✅ Better CTE usage
- ✅ More robust query structure
- ✅ Same functionality

---

## If You Still Get Errors

See `TROUBLESHOOTING.md` for solutions to:
- Extension not found
- Permission denied
- Table conflicts
- Function errors

---

## Quick Command Reference

```bash
# 1. Clean (if needed)
\i supabase/clean_install.sql

# 2. Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

# 3. Run FIXED migration
\i supabase/migrations/20250118000001_automation_system_fixed.sql

# 4. Verify
\i supabase/quick_check.sql

# 5. Test
SELECT trigger_all_automations();
```

---

**Summary:** Always use `20250118000001_automation_system_fixed.sql` for setup!
