# 🚀 Complete Migration Plan: play.qoqnuz.com → New Platform

This document outlines the complete strategy for migrating from play.qoqnuz.com to your new Qoqnuz platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Phases](#migration-phases)
4. [Rollback Plan](#rollback-plan)
5. [Post-Migration Tasks](#post-migration-tasks)
6. [Timeline](#timeline)

---

## 🎯 Overview

### What's Being Migrated

| Category | Items | Estimated Size |
|----------|-------|----------------|
| **Users** | User accounts, profiles, preferences | ~X users |
| **Music Content** | Artists, albums, tracks, genres | ~X tracks |
| **User Data** | Playlists, likes, listening history | ~X playlists |
| **Media Files** | Audio files, images | ~X GB |
| **Admin Data** | Admin users, settings | ~X records |

### Migration Strategy

**Approach:** Blue-Green Deployment with Progressive Migration

- ✅ Zero-downtime migration
- ✅ Ability to rollback
- ✅ Data validation at each step
- ✅ Progressive user migration (optional)

---

## ✅ Pre-Migration Checklist

### 1. Environment Setup

- [ ] New platform deployed and tested
- [ ] Database migrations applied
- [ ] Storage buckets configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] DNS records prepared (but not yet changed)

### 2. Backup Everything

```bash
# Backup old database
pg_dump $OLD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup media files
rsync -avz user@play.qoqnuz.com:/path/to/media ./backup/media/

# Create database snapshot in Supabase dashboard
```

### 3. Test New Platform

- [ ] All features working
- [ ] OAuth providers configured
- [ ] Email service working
- [ ] PWA installable
- [ ] Mobile responsive
- [ ] Audio playback working
- [ ] Admin panel accessible

### 4. Prepare Communication

- [ ] Draft user notification email
- [ ] Prepare status page
- [ ] Set up monitoring/alerts
- [ ] Notify team about migration window

---

## 🔄 Migration Phases

### **Phase 1: Data Export** (1-2 hours)

**Run on OLD database:**

```bash
# Export all data
psql $OLD_DATABASE_URL -f migration/01_export_data.sql

# Download export files
scp user@play.qoqnuz.com:/tmp/export_*.csv ./migration/
```

**Deliverables:**
- CSV files for all tables
- Migration statistics
- Data validation report

### **Phase 2: Data Import** (2-3 hours)

**Run on NEW database:**

```bash
# Import artists, albums, tracks, genres first (no dependencies)
psql $NEW_DATABASE_URL -f migration/02_import_data.sql

# Verify counts match
```

**Validation:**
```sql
-- Compare record counts
SELECT COUNT(*) FROM tracks; -- Should match old database
SELECT COUNT(*) FROM artists; -- Should match old database
```

### **Phase 3: User Migration** (2-4 hours)

**Run Node.js script:**

```bash
# Install dependencies
npm install csv-parser

# Run migration
node migration/03_migrate_users.js

# Review migration_errors.json if any failures
```

**Important:** Users will need to reset passwords or you can set a temporary password.

**Notification Strategy:**
- Send email to all users with new login instructions
- Include password reset link
- Explain why migration was necessary
- Highlight new features

### **Phase 4: Media Files Migration** (4-24 hours depending on size)

**Option A: Full Migration (Recommended)**
```bash
# Download from old server
./migration/download_media.sh

# Upload to Supabase Storage
node migration/upload_media.js

# Update URLs in database
psql $NEW_DATABASE_URL -f migration/update_media_urls.sql
```

**Option B: Progressive Migration (For large libraries)**
- Keep media on old server initially
- Set up media proxy in new platform
- Migrate files in background over several days
- Update URLs progressively

### **Phase 5: DNS Cutover** (5-15 minutes)

**When ready to switch:**

```bash
# 1. Update DNS records
# Point play.qoqnuz.com to new server IP

# A Record: play.qoqnuz.com → NEW_SERVER_IP
# Wait for DNS propagation (5-60 minutes)

# 2. Update Vercel/hosting configuration if using cloud
vercel domains add play.qoqnuz.com
vercel dns add play.qoqnuz.com A @NEW_SERVER_IP

# 3. Monitor traffic switch
# Watch old server logs - should see decreasing traffic
# Watch new server logs - should see increasing traffic
```

**DNS Propagation Check:**
```bash
# Check DNS propagation
dig play.qoqnuz.com +short

# Should show new IP address
```

### **Phase 6: Validation & Monitoring** (1-2 hours)

**Test everything:**

- [ ] Users can log in
- [ ] Music plays correctly
- [ ] Playlists load
- [ ] Search works
- [ ] Admin panel accessible
- [ ] Downloads work
- [ ] PWA installs correctly

**Monitor:**
```bash
# Check error logs
tail -f /var/log/application.log

# Monitor database connections
# Monitor API response times
# Check storage usage
```

---

## 🔙 Rollback Plan

If something goes wrong, you can rollback:

### Quick Rollback (5 minutes)

```bash
# 1. Point DNS back to old server
# Update A record to OLD_SERVER_IP

# 2. Notify users of temporary issue
# 3. Investigate problem
# 4. Fix and retry migration
```

### Data Rollback

```bash
# Restore old database backup
psql $NEW_DATABASE_URL < backup_20250120_120000.sql
```

**When to Rollback:**
- Critical bugs discovered
- Data integrity issues
- Major performance problems
- High error rate (>5%)

---

## 📝 Post-Migration Tasks

### Immediate (Day 1)

- [ ] Send welcome email to all users
- [ ] Post announcement on social media
- [ ] Update support documentation
- [ ] Monitor error rates and performance
- [ ] Check backup systems
- [ ] Verify all cron jobs running

### Week 1

- [ ] Send password reset reminder to inactive users
- [ ] Analyze user feedback
- [ ] Fix any migration-related bugs
- [ ] Optimize slow queries
- [ ] Review storage usage
- [ ] Check email deliverability

### Week 2-4

- [ ] User survey for feedback
- [ ] Performance optimization
- [ ] Decommission old server (after verification)
- [ ] Delete temporary migration files
- [ ] Update monitoring dashboards
- [ ] Document lessons learned

---

## 📅 Recommended Timeline

### **Option A: Weekend Migration** (Recommended)

**Friday Evening:**
- 8:00 PM: Start data export
- 9:00 PM: Begin data import
- 11:00 PM: Start user migration

**Saturday:**
- 1:00 AM: Start media migration
- 8:00 AM: Complete validation
- 10:00 AM: DNS cutover
- 12:00 PM: Send user notifications
- Rest of day: Monitor and fix issues

**Sunday:**
- Continue monitoring
- Address any user reports

### **Option B: Phased Migration** (Lower Risk)

**Week 1:**
- Migrate data and media
- Set up new platform alongside old
- Test with internal users

**Week 2:**
- Beta test with subset of users (10%)
- Collect feedback
- Fix issues

**Week 3:**
- Migrate 50% of users
- Monitor performance
- Adjust resources

**Week 4:**
- Migrate remaining users
- DNS cutover
- Decommission old platform

---

## 🔧 Technical Requirements

### New Server Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 50 GB storage (+ media storage)
- 1 Gbps network

**Recommended:**
- 4+ CPU cores
- 8+ GB RAM
- 100 GB storage
- CDN for media delivery

### Database

- PostgreSQL 14+
- Supabase project with sufficient resources
- Connection pooling configured
- Backups enabled

### Storage

- Supabase Storage buckets
- OR External storage (S3, R2, etc.)
- CDN configured
- Backup system

---

## 📞 Support Plan

### During Migration

**Contact Information:**
- Tech Lead: [Your contact]
- Database Admin: [Your contact]
- Support Email: support@qoqnuz.com

**Communication Channels:**
- Slack channel: #migration
- Status page: status.qoqnuz.com
- Email updates every 2 hours

### User Support

**Expected Support Volume:**
- Day 1: High (password resets, login issues)
- Week 1: Medium (feature questions)
- Week 2+: Normal

**Prepare:**
- FAQ document
- Video tutorials
- Support ticket system
- Live chat (optional)

---

## 🎉 Success Criteria

Migration is successful when:

- ✅ 95%+ users can log in successfully
- ✅ All music content accessible
- ✅ Zero data loss
- ✅ Performance equal or better than old platform
- ✅ Error rate < 1%
- ✅ All critical features working
- ✅ Positive user feedback

---

## 📚 Additional Resources

- `01_export_data.sql` - Export script for old database
- `02_import_data.sql` - Import script for new database
- `03_migrate_users.js` - User migration via Supabase API
- `04_migrate_media.md` - Media files migration guide
- `05_validation.sql` - Data validation queries

---

## ⚠️ Important Notes

1. **Always backup before migration**
2. **Test the migration process on staging first**
3. **Communicate clearly with users**
4. **Have rollback plan ready**
5. **Monitor closely for 48 hours after migration**
6. **Don't delete old data until verified (30 days minimum)**

---

## 🤝 Need Help?

If you encounter issues during migration:

1. Check troubleshooting guide
2. Review error logs
3. Contact support team
4. Execute rollback if critical

**Good luck with the migration! 🚀**
