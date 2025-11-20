# Migration Tools & Documentation

Complete migration toolkit for migrating from play.qoqnuz.com to the new Qoqnuz platform.

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `00_MIGRATION_PLAN.md` | **START HERE** - Complete migration strategy | Planning phase |
| `01_export_data.sql` | Export data from old database | Phase 1: Export |
| `02_import_data.sql` | Import data into new database | Phase 2: Import |
| `03_migrate_users.js` | Migrate users via Supabase API | Phase 3: Users |
| `04_migrate_media.md` | Media files migration guide | Phase 4: Media |
| `05_validation.sql` | Validate migrated data | Phase 6: Validation |
| `06_upload_media.js` | Upload media to Supabase Storage | Phase 4: Media |

## 🚀 Quick Start

### 1. Read the Migration Plan
```bash
cat migration/00_MIGRATION_PLAN.md
```

### 2. Backup Everything
```bash
# Backup old database
pg_dump $OLD_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup media files
rsync -avz user@play.qoqnuz.com:/path/to/media ./backup/
```

### 3. Export Data from Old Platform
```bash
# On old database server
psql $OLD_DATABASE_URL -f migration/01_export_data.sql

# Download CSV files
scp user@play.qoqnuz.com:/tmp/export_*.csv ./migration/
```

### 4. Import Data to New Platform
```bash
# On new database
psql $NEW_DATABASE_URL -f migration/02_import_data.sql
```

### 5. Migrate Users
```bash
npm install csv-parser @supabase/supabase-js
node migration/03_migrate_users.js
```

### 6. Migrate Media Files
```bash
# Option A: Direct upload to Supabase Storage
node migration/06_upload_media.js audio ./migration/media_export/audio
node migration/06_upload_media.js album-covers ./migration/media_export/album_covers
node migration/06_upload_media.js artist-images ./migration/media_export/artist_images

# Option B: Follow progressive migration guide
cat migration/04_migrate_media.md
```

### 7. Validate Migration
```bash
psql $NEW_DATABASE_URL -f migration/05_validation.sql
```

### 8. DNS Cutover
```bash
# Update DNS A record
# play.qoqnuz.com → NEW_SERVER_IP

# Wait for propagation (5-60 minutes)
dig play.qoqnuz.com +short
```

## 📋 Pre-Migration Checklist

Before starting migration, ensure:

- [ ] New platform is fully deployed and tested
- [ ] All database migrations are applied
- [ ] Storage buckets are configured
- [ ] Environment variables are set
- [ ] Backups of old platform are complete
- [ ] Team is notified of migration window
- [ ] Rollback plan is prepared
- [ ] Status page is ready

## 🔄 Migration Phases

### Phase 1: Export (1-2 hours)
- Run `01_export_data.sql` on old database
- Download CSV export files
- Verify export counts

### Phase 2: Import (2-3 hours)
- Run `02_import_data.sql` on new database
- Verify import counts match exports
- Check for foreign key violations

### Phase 3: Users (2-4 hours)
- Run `03_migrate_users.js`
- Review error log if any failures
- Send password reset emails

### Phase 4: Media (4-24 hours)
- Choose migration strategy from `04_migrate_media.md`
- Upload files using `06_upload_media.js`
- Update database URLs
- Test playback

### Phase 5: DNS (15 minutes)
- Update DNS records
- Monitor traffic switch
- Test from multiple locations

### Phase 6: Validation (1-2 hours)
- Run `05_validation.sql`
- Test all features
- Monitor error logs
- Check user feedback

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# Old platform (for export)
export OLD_DATABASE_URL="postgresql://user:pass@play.qoqnuz.com:5432/db"

# New platform (for import)
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export NEW_DATABASE_URL="postgresql://postgres:pass@db.your-project.supabase.co:5432/postgres"
```

### Install Dependencies

```bash
npm install csv-parser @supabase/supabase-js glob
```

## ⚠️ Important Notes

1. **Test on Staging First**
   - Run complete migration on staging environment
   - Verify all features work correctly
   - Time each phase to plan production migration

2. **Keep Backups**
   - Don't delete old data for at least 30 days
   - Keep multiple backup versions
   - Test backup restoration

3. **Monitor Closely**
   - Watch error logs for 48 hours after migration
   - Monitor database performance
   - Track user feedback

4. **Communication**
   - Notify users before migration
   - Send welcome email after migration
   - Provide support documentation

## 🔙 Rollback Procedure

If migration fails:

```bash
# 1. Point DNS back to old server
# Update A record to OLD_SERVER_IP

# 2. Restore database if needed
psql $NEW_DATABASE_URL < backup_YYYYMMDD.sql

# 3. Notify users
# Send status update email

# 4. Investigate issues
# Review error logs
# Fix problems

# 5. Retry migration
# Follow migration plan again
```

## 📊 Success Metrics

Migration is successful when:

- ✅ 95%+ users can log in
- ✅ All music plays correctly
- ✅ Zero data loss confirmed
- ✅ Error rate < 1%
- ✅ Performance equal or better
- ✅ All features working

## 🆘 Troubleshooting

### Common Issues

**Issue:** CSV import fails with "permission denied"
```bash
# Solution: Check file permissions
chmod 644 migration/export_*.csv
```

**Issue:** User migration fails with "email already exists"
```bash
# Solution: Users already exist, skip or handle duplicates
# Modify 03_migrate_users.js to handle existing users
```

**Issue:** Media upload is very slow
```bash
# Solution: Increase concurrency in upload config
# Edit UPLOAD_CONFIG.concurrency in 06_upload_media.js
```

**Issue:** Validation shows data integrity issues
```bash
# Solution: Review issues in validation report
# Fix data in old database and re-export
# Or fix manually in new database
```

## 📞 Support

If you need help during migration:

1. Check `00_MIGRATION_PLAN.md` for detailed guidance
2. Review error logs in `./migration/` directory
3. Contact tech lead or database admin
4. Execute rollback if critical

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Migration Best Practices](https://www.postgresql.org/docs/current/migration.html)

---

**⚠️ REMEMBER:** Always test on staging first!

**Good luck with your migration! 🚀**
