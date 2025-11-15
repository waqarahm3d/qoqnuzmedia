# 🎛️ Qoqnuz Music - Admin Portal Guide

Complete guide to using the Qoqnuz Music Admin Portal for platform management.

---

## 📋 Table of Contents

1. [Setup & Access](#setup--access)
2. [Dashboard Overview](#dashboard-overview)
3. [Artists Management](#artists-management)
4. [Theme Customization](#theme-customization)
5. [User Management](#user-management)
6. [Analytics](#analytics)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Access

### Step 1: Create Your User Account

If you haven't already signed up:

```bash
# Start the dev server
cd web
pnpm dev
```

Visit: http://localhost:3000/auth/signup

- Enter your email
- Create a password
- Check your email for verification link
- Click the verification link

### Step 2: Assign Admin Role to Your Account

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to https://app.supabase.com
2. Open your Qoqnuz Music project
3. Click "SQL Editor" in the sidebar
4. Run this SQL query:

```sql
-- Get your user ID
SELECT id, email FROM auth.users;
```

**Copy your user ID**, then run:

```sql
-- Create Super Admin role (if not exists)
INSERT INTO admin_roles (name, description, permissions)
VALUES (
  'Super Admin',
  'Full access to all admin features',
  ARRAY['*']
)
ON CONFLICT (name) DO NOTHING;

-- Assign admin role to your user
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ Replace with your actual user ID from above
  (SELECT id FROM admin_roles WHERE name = 'Super Admin'),
  true
);
```

**Option B: Create Additional Admin Roles**

```sql
-- Create Editor role (can create/edit content but not manage users)
INSERT INTO admin_roles (name, description, permissions)
VALUES (
  'Editor',
  'Can manage content but not users',
  ARRAY['content.create', 'content.edit', 'content.delete']
);

-- Create Moderator role (can manage users but not content)
INSERT INTO admin_roles (name, description, permissions)
VALUES (
  'Moderator',
  'Can manage users and moderation',
  ARRAY['users.manage', 'moderation.manage']
);

-- Assign Editor role to a user
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES (
  'USER_ID_HERE',
  (SELECT id FROM admin_roles WHERE name = 'Editor'),
  true
);
```

### Step 3: Access Admin Portal

1. Make sure you're signed in at http://localhost:3000
2. Visit: **http://localhost:3000/admin**

You should now see the admin dashboard!

---

## 📊 Dashboard Overview

**URL:** http://localhost:3000/admin

### Navigation Menu

The left sidebar contains:

| Icon | Section | Purpose |
|------|---------|---------|
| 📊 | Dashboard | Overview statistics and charts |
| 📈 | Analytics | Detailed analytics (planned) |
| 🎤 | Artists | Manage artists |
| 💿 | Albums | Manage albums (planned) |
| 🎵 | Tracks | Manage tracks (planned) |
| 👥 | Users | Manage users and roles |
| 🎨 | Theme | Customize platform appearance |
| ⚙️ | Settings | Configure platform settings (planned) |

### Dashboard Statistics

The main dashboard shows:

**Overview Cards:**
- **Total Users** - Number of registered users (+ growth last 30 days)
- **Total Tracks** - Number of tracks in catalog
- **Total Artists** - Number of artists
- **Total Plays** - All-time play count (+ last 30 days)
- **Albums** - Number of albums
- **Playlists** - User-created playlists
- **Plays (30d)** - Monthly plays

**Top Content (Last 30 Days):**
- **Top Tracks** - Most played tracks with play counts
- **Top Artists** - Most popular artists

**Daily Plays Chart:**
- Visual bar chart showing daily play trends
- Hover to see exact play count per day

### Mobile Navigation

On mobile devices:
- Click the **☰** menu icon (top left) to open sidebar
- Click **✕** to close sidebar

---

## 🎤 Artists Management

**URL:** http://localhost:3000/admin/artists

### Viewing Artists

**Search Artists:**
1. Use the search box at the top
2. Type artist name or bio keywords
3. Results filter automatically

**Pagination:**
- Shows 20 artists per page
- Use "Previous" / "Next" buttons to navigate
- Current page number displayed

**Artist Information Displayed:**
- Profile picture (or 🎤 icon if no image)
- Artist name
- Bio (truncated)
- Verified status (✓ if verified)
- Follower count
- Created date

### Creating a New Artist

1. Click **"+ Add Artist"** button (top right)
2. Fill in the modal form:

   **Required Fields:**
   - **Name** - Artist's display name

   **Optional Fields:**
   - **Bio** - Artist biography/description
   - **Profile Image URL** - Link to artist profile picture
     - Example: `https://your-cdn.com/artists/artist-name.jpg`
     - Or use R2: `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/qoqnuz-media/artists/profile.jpg`
   - **Cover Image URL** - Link to artist banner/cover image
   - **Verified Artist** - Check this box to add blue checkmark

3. Click **"Save"**

**Example:**

```
Name: The Weeknd
Bio: Canadian singer, songwriter, and record producer known for his sonic versatility
Profile Image URL: https://your-r2.com/qoqnuz-media/artists/weeknd-profile.jpg
Cover Image URL: https://your-r2.com/qoqnuz-media/artists/weeknd-cover.jpg
☑ Verified Artist
```

### Editing an Artist

1. Find the artist in the list
2. Click **"Edit"** in the Actions column
3. Modify fields in the modal
4. Click **"Save"**

**All fields can be updated** including verification status.

### Deleting an Artist

1. Find the artist in the list
2. Click **"Delete"** in the Actions column
3. Confirm deletion in the popup dialog

⚠️ **Warning:** This will also delete:
- All albums by this artist
- All tracks by this artist
- All related data

---

## 🎨 Theme Customization

**URL:** http://localhost:3000/admin/theme

Customize your platform's appearance and branding.

### Branding Section

**Site Name:**
- Default: "Qoqnuz Music"
- Appears in browser title, headers, etc.
- Example: "MyMusic", "StreamFlow", etc.

**Logo URL:**
- Upload logo to R2 first, then paste URL
- Recommended: PNG or SVG with transparent background
- Optimal size: 200x60 pixels (responsive)
- Example: `https://your-r2.com/qoqnuz-media/branding/logo.png`

**Favicon URL:**
- Small icon that appears in browser tab
- Recommended: ICO, PNG, or SVG
- Optimal size: 32x32 or 64x64 pixels
- Example: `https://your-r2.com/qoqnuz-media/branding/favicon.ico`

### Color Scheme Section

Use the color pickers to customize your platform's colors:

**Primary Color:**
- Main brand color
- Used for: buttons, links, active states
- Default: `#1DB954` (Spotify-like green)
- Try: `#FF1744` (red), `#2979FF` (blue), `#00E676` (green)

**Secondary Color:**
- Accent color
- Used for: secondary buttons, highlights
- Default: `#191414` (dark)

**Background Color:**
- Main page background
- Default: `#121212` (black)
- Keep dark for music apps

**Surface Color:**
- Color for cards and panels
- Default: `#181818` (dark gray)
- Should be lighter than background

**Text Color:**
- Primary text color
- Default: `#FFFFFF` (white)
- Should contrast with background

**Secondary Text Color:**
- Muted/subtle text
- Default: `#B3B3B3` (gray)
- Used for timestamps, metadata

### Using Color Pickers

**Method 1: Visual Picker**
1. Click the colored square
2. Use the color picker to select a color
3. See preview update instantly

**Method 2: Hex Code**
1. Type hex code directly in the text field
2. Example: `#FF5722`
3. Preview updates as you type

### Preview Section

- Live preview shows how your theme will look
- Updates in real-time as you change colors
- Test before saving

### Saving Changes

1. Customize colors and branding
2. Check the preview
3. Click **"Save Changes"** button
4. Success message will appear
5. Changes apply immediately to entire platform

### Resetting Theme

Click **"Reset to Defaults"** to restore original Qoqnuz theme:
- Confirms before resetting
- Restores all default colors
- Clears logo and favicon URLs

---

## 👥 User Management

**URL:** http://localhost:3000/admin/users

Manage platform users and assign admin roles.

### Viewing Users

**Search Users:**
- Type in search box to filter by name or bio
- Results update automatically

**Pagination:**
- 20 users per page
- Navigate with Previous/Next buttons

**User Information Displayed:**
- Avatar (or 👤 icon)
- Display name
- Bio (if set)
- Role badge (Admin or User)
- Join date

### Assigning Admin Role

**To make a user an admin:**

1. Find the user in the list
2. Click **"Make Admin"**
3. Select role from dropdown:
   - **Super Admin** - Full access to everything
   - **Editor** - Can manage content only
   - **Moderator** - Can manage users only
4. Click **"Assign Role"**

User will immediately have admin access.

### Removing Admin Role

**To remove admin privileges:**

1. Find the admin user in the list
2. Click **"Remove Admin"**
3. Confirm in the popup

⚠️ **Safeguard:** You cannot remove your own admin role (prevents lockout)

### Admin Roles & Permissions

| Role | Permissions | Can Do |
|------|-------------|--------|
| **Super Admin** | `*` (all) | Everything - full platform control |
| **Editor** | `content.*` | Create/edit/delete artists, albums, tracks |
| **Moderator** | `users.manage`, `moderation.manage` | Manage users, handle reports |

### Creating Custom Roles

Run this in Supabase SQL Editor:

```sql
-- Create custom role
INSERT INTO admin_roles (name, description, permissions)
VALUES (
  'Content Manager',
  'Can manage content and view analytics',
  ARRAY['content.create', 'content.edit', 'content.delete', 'analytics.view']
);

-- Assign to a user
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES (
  'USER_ID_HERE',
  (SELECT id FROM admin_roles WHERE name = 'Content Manager'),
  true
);
```

**Available Permissions:**
- `*` - All permissions (Super Admin)
- `content.create` - Create artists, albums, tracks
- `content.edit` - Edit existing content
- `content.delete` - Delete content
- `users.manage` - Manage user roles
- `settings.edit` - Change platform settings
- `analytics.view` - View analytics
- `moderation.manage` - Handle reports

---

## 📈 Analytics

**URL:** http://localhost:3000/admin (Dashboard section)

### Overview Statistics

**Platform Metrics:**
- Total users (all-time)
- Total artists
- Total albums
- Total tracks
- Total playlists
- Total plays (all-time)

**Growth Metrics (30 days):**
- New users this month
- Plays this month

### Top Content (Last 30 Days)

**Top Tracks:**
- Shows 5 most played tracks
- Displays: track title, artist name, play count
- Sorted by play count (highest first)

**Top Artists:**
- Shows 5 most popular artists
- Displays: artist name, total plays
- Aggregates plays across all their tracks

### Daily Plays Chart

**Visual representation:**
- Bar chart showing daily play counts
- Last 30 days of data
- Hover over bars to see:
  - Exact date
  - Number of plays

**Understanding the Chart:**
- Taller bars = more plays that day
- Helps identify trends and peak listening times
- Use for marketing and release planning

---

## 🔧 Advanced Operations

### Uploading Images to R2

Before setting artist images or logos, upload them to R2:

**Method 1: AWS CLI**

```bash
# Configure AWS CLI for R2 (one time setup)
aws configure
# Access Key: Your R2 Access Key ID
# Secret Key: Your R2 Secret Access Key
# Region: auto
# Format: json

# Set R2 endpoint
export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"

# Upload image
aws s3 cp my-artist-photo.jpg \
  s3://qoqnuz-media/artists/my-artist-photo.jpg \
  --endpoint-url $R2_ENDPOINT

# Get the URL
echo "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/qoqnuz-media/artists/my-artist-photo.jpg"
```

**Method 2: Cloudflare Dashboard**

1. Go to https://dash.cloudflare.com
2. Click "R2"
3. Select your bucket (qoqnuz-media)
4. Click "Upload"
5. Select files
6. Copy the object URL

**Method 3: Upload API (from Milestone B)**

Visit http://localhost:3000/test and use the upload feature (for audio files, but works for images too).

### Bulk Operations

**To create multiple artists at once:**

```sql
-- Run in Supabase SQL Editor
INSERT INTO artists (name, bio, is_verified) VALUES
  ('Artist One', 'Bio for artist one', true),
  ('Artist Two', 'Bio for artist two', false),
  ('Artist Three', 'Bio for artist three', true);
```

**To delete multiple artists:**

```sql
-- Delete artists by name pattern
DELETE FROM artists WHERE name LIKE '%Test%';

-- Delete artists created in last hour (testing)
DELETE FROM artists WHERE created_at > NOW() - INTERVAL '1 hour';
```

⚠️ **Warning:** Bulk deletes are permanent. Always backup first.

---

## 🐛 Troubleshooting

### "Forbidden - Admin access required"

**Problem:** You're not recognized as an admin.

**Solutions:**

1. **Check admin_users table:**
   ```sql
   SELECT * FROM admin_users WHERE user_id = 'YOUR_USER_ID';
   ```
   If empty, run the setup SQL from Step 2.

2. **Check is_active flag:**
   ```sql
   UPDATE admin_users
   SET is_active = true
   WHERE user_id = 'YOUR_USER_ID';
   ```

3. **Sign out and sign back in:**
   - Click user icon in sidebar
   - Click "Sign out"
   - Sign in again at /auth/signin

### "Unauthorized" Error

**Problem:** Session expired or not authenticated.

**Solutions:**

1. **Refresh the page**
2. **Sign out and sign back in**
3. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Clear "Cookies and site data"

### Images Not Showing

**Problem:** Artist images or logos not displaying.

**Solutions:**

1. **Check R2 CORS settings:**
   ```bash
   aws s3api get-bucket-cors \
     --bucket qoqnuz-media \
     --endpoint-url $R2_ENDPOINT
   ```

2. **Verify image URL is accessible:**
   - Paste URL directly in browser
   - Should download/display the image

3. **Check R2 permissions:**
   - Images should be publicly readable
   - Or use signed URLs

### Theme Changes Not Applying

**Problem:** Saved theme but colors didn't change.

**Solutions:**

1. **Hard refresh the page:**
   - Ctrl+F5 (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Check browser console:**
   - F12 to open DevTools
   - Look for errors

3. **Verify settings saved:**
   ```sql
   SELECT * FROM site_settings WHERE key = 'primary_color';
   ```

### Can't Delete Artist

**Problem:** Delete fails with error.

**Solutions:**

1. **Check permissions:**
   - Only Super Admin or users with `content.delete` can delete

2. **Foreign key constraints:**
   - Artist might have albums or tracks
   - Delete those first, or use CASCADE

3. **Manual deletion:**
   ```sql
   -- First delete albums
   DELETE FROM albums WHERE artist_id = 'ARTIST_ID';

   -- Then delete tracks
   DELETE FROM tracks WHERE artist_id = 'ARTIST_ID';

   -- Then delete artist
   DELETE FROM artists WHERE id = 'ARTIST_ID';
   ```

### Analytics Not Loading

**Problem:** Dashboard shows "Loading..." forever.

**Solutions:**

1. **Check Supabase connection:**
   - Open browser console (F12)
   - Look for network errors

2. **Verify admin permissions:**
   - Need admin role to view analytics

3. **Check if data exists:**
   ```sql
   SELECT COUNT(*) FROM play_history;
   SELECT COUNT(*) FROM tracks;
   SELECT COUNT(*) FROM artists;
   ```

---

## 💡 Best Practices

### Security

1. **Don't share admin credentials** - Each admin should have their own account
2. **Use strong passwords** - Minimum 12 characters
3. **Assign minimum necessary permissions** - Don't make everyone Super Admin
4. **Review admin users regularly** - Remove inactive admins

### Content Management

1. **Use verified badges sparingly** - Only for official/verified artists
2. **Optimize images** - Compress before uploading to R2
3. **Use consistent naming** - e.g., `artist-name-profile.jpg`
4. **Keep bios concise** - 2-3 sentences maximum
5. **Test before bulk operations** - Try on one item first

### Theme Customization

1. **Maintain contrast** - Text should be readable on backgrounds
2. **Test on mobile** - Responsive design is crucial
3. **Keep it professional** - Avoid overly bright or clashing colors
4. **Save screenshots** - Document your theme settings
5. **Test with users** - Get feedback before final changes

---

## 🎯 Quick Reference

### Common Tasks

| Task | Steps |
|------|-------|
| Add new artist | Artists → "+ Add Artist" → Fill form → Save |
| Change theme color | Theme → Pick color → Preview → Save |
| Make user admin | Users → Find user → "Make Admin" → Select role |
| View top tracks | Dashboard → Top Tracks section |
| Search artists | Artists → Type in search box |
| Delete artist | Artists → Find artist → Delete → Confirm |
| Reset theme | Theme → "Reset to Defaults" → Confirm |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle sidebar | Click ☰ icon |
| Refresh data | F5 |
| Open console | F12 |
| Search (when focused) | Start typing |

### URLs Quick Access

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000/admin |
| Artists | http://localhost:3000/admin/artists |
| Theme | http://localhost:3000/admin/theme |
| Users | http://localhost:3000/admin/users |
| Sign In | http://localhost:3000/auth/signin |
| Main Site | http://localhost:3000 |

---

## 📚 Additional Resources

- **Milestone C Summary:** `MILESTONE_C_SUMMARY.md` - Technical details
- **Main README:** `README.md` - Project overview
- **Verification Checklist:** `VERIFICATION_CHECKLIST.md` - Testing guide
- **Quick Start:** `QUICK_START.md` - Setup guide

---

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. **Check the browser console** (F12) for error messages
2. **Review Supabase logs** in your project dashboard
3. **Check database tables** in Supabase SQL Editor
4. **Verify environment variables** in `web/.env.local`
5. **Restart the dev server** (`pnpm dev`)

---

## ✅ Checklist for New Admins

- [ ] Created user account and verified email
- [ ] Assigned admin role in Supabase
- [ ] Can access /admin dashboard
- [ ] Customized theme colors
- [ ] Created first artist
- [ ] Viewed analytics
- [ ] Tested search functionality
- [ ] Assigned admin role to another user (optional)

---

**Happy Admin Portal Managing!** 🎵

*Built for Qoqnuz Music Platform*
