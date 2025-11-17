# Frontend-Backend Integration Guide

## ✅ What's Been Connected

### 1. API Integration Layer
**Location:** `web/src/lib/api/client.ts`

Complete API client with functions for:
- Albums (getAlbums, getAlbum)
- Artists (getArtists, getArtist, followArtist, unfollowArtist)
- Tracks (getTracks, getStreamUrl)
- Playlists (getPlaylists, getPlaylist, createPlaylist, addTrackToPlaylist)
- Search (search)
- Library (getLikedTracks, likeTrack, unlikeTrack, getUserLibrary)
- Activity (getActivityFeed, getPlayHistory, trackPlay)
- Genres (getGenres, getGenrePlaylists)
- User (getUserProfile, updateUserProfile)

### 2. React Hooks
**Location:** `web/src/lib/hooks/useMusic.ts`

Custom hooks for easy data fetching:
- `useAlbums(limit)` - Fetch albums
- `useAlbum(id)` - Fetch single album with tracks
- `useArtists(limit)` - Fetch artists
- `useArtist(id)` - Fetch artist with tracks
- `usePlaylists(limit)` - Fetch playlists
- `usePlaylist(id)` - Fetch playlist with tracks
- `useUserLibrary()` - Fetch user's full library
- `useLikedTracks()` - Fetch liked tracks
- `useSearch(query, type)` - Search functionality
- `useGenres()` - Fetch all genres

### 3. Player Context
**Location:** `web/src/lib/contexts/PlayerContext.tsx`

Global music player state management:
- Play/pause/skip functionality
- Queue management
- Volume control
- Like/unlike tracks
- Shuffle and repeat modes
- Real streaming from `/api/stream/[trackId]`
- Automatic play history tracking

### 4. Connected Pages

#### ✅ Home Page (`/home`)
- Fetches real albums, artists, and playlists from database
- Shows empty state with link to admin panel if no content
- Play buttons navigate to album/playlist pages

#### ⏳ Still Need Connection:
- Search page
- Library page
- Artist page
- Album page
- Playlist page
- Player component

---

## 🎯 How It Works: Content Flow

```
Admin Panel → Database → Backend API → Frontend → User
```

### Step 1: Add Content via Admin Panel

**Navigate to:** `http://your-vps-ip/admin`

#### Add an Artist:
1. Go to **Admin → Artists**
2. Click **"Add Artist"**
3. Fill in:
   - Name
   - Bio
   - Image URL (optional, or upload to R2)
4. Click **Save**

#### Add an Album:
1. Go to **Admin → Albums**
2. Click **"Add Album"**
3. Fill in:
   - Title
   - Artist (select from dropdown)
   - Release Date
   - Cover Image URL
   - Genre
4. Click **Save**

#### Add Tracks:
1. Go to **Admin → Tracks**
2. Click **"Add Track"**
3. Fill in:
   - Title
   - Artist (select)
   - Album (select)
   - Duration
   - Upload audio file to R2 (or provide file_path)
4. Click **Save**

#### Create Playlist:
1. Go to **Admin → Playlists**
2. Click **"Create Playlist"**
3. Fill in:
   - Name
   - Description
   - Public/Private
   - Add tracks
4. Click **Save**

### Step 2: Content Appears on Frontend

Once you add content via admin:

**Home Page** (`/home`):
- New albums appear in "New Releases"
- Artists appear in "Popular Artists"
- Public playlists appear in "Featured Playlists"

**Search** (`/search`):
- All content becomes searchable

**Library** (`/library`):
- User's playlists and liked content

---

## 🔧 Testing the Integration

### 1. Add Test Content

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Access your database (via Supabase dashboard or psql)
# Or use the admin panel UI
```

**Via Admin Panel (Recommended):**
```
1. Visit http://your-vps-ip/admin
2. Sign in with your admin email (set in ADMIN_EMAILS env var)
3. Add:
   - 2-3 artists
   - 2-3 albums
   - 5-10 tracks
   - 1-2 playlists
```

### 2. Check Frontend

Visit `http://your-vps-ip/home` and you should see:
- Your albums in "New Releases"
- Your artists in "Popular Artists"
- Your playlists in "Featured Playlists"

### 3. Test API Directly

```bash
# Test getting albums
curl http://your-vps-ip/api/admin/albums

# Test search
curl "http://your-vps-ip/api/search?q=test"

# Test streaming URL (replace with real track ID)
curl http://your-vps-ip/api/stream/TRACK_ID
```

---

## 📋 What Still Needs Connection

I've created the foundation. Here's what needs to be finished:

### High Priority (Core Functionality):

1. **Search Page** (`/search`)
   - ✅ API client ready (`api.search()`)
   - ✅ Hook ready (`useSearch()`)
   - ⏳ Need to update page to use hook

2. **Library Page** (`/library`)
   - ✅ API ready (`getUserLibrary()`)
   - ✅ Hook ready (`useUserLibrary()`)
   - ⏳ Need to update page

3. **Artist Page** (`/artist/[id]`)
   - ✅ API ready (`getArtist()`, `getArtistTracks()`)
   - ✅ Hook ready (`useArtist()`)
   - ⏳ Need to update page

4. **Album Page** (`/album/[id]`)
   - ✅ API ready (`getAlbum()`)
   - ✅ Hook ready (`useAlbum()`)
   - ⏳ Need to update page
   - ⏳ Connect play button to player

5. **Playlist Page** (`/playlist/[id]`)
   - ✅ API ready (`getPlaylist()`)
   - ✅ Hook ready (`usePlaylist()`)
   - ⏳ Need to update page
   - ⏳ Connect play button to player

6. **Player Component** (`/components/layout/Player.tsx`)
   - ✅ Context ready
   - ⏳ Update component to use PlayerContext
   - ⏳ Connect streaming

7. **TrackRow Component** (`/components/ui/TrackRow.tsx`)
   - ⏳ Connect play button to player
   - ⏳ Connect like button to API
   - ⏳ Show liked state from database

### Medium Priority:

8. **Authentication Guards**
   - ⏳ Protect `/library`, `/liked`, `/playlist/create`
   - ⏳ Redirect to `/auth/signin` if not logged in

9. **Like/Unlike Functionality**
   - ✅ API ready
   - ⏳ Connect UI buttons throughout app

10. **Play History**
    - ✅ Automatic tracking in PlayerContext
    - ⏳ Create "Recently Played" page

### Low Priority (Nice to Have):

11. **Follow Artists**
    - ✅ API ready
    - ⏳ Add follow button to artist pages

12. **Add to Playlist**
    - ✅ API ready
    - ⏳ Add "Add to Playlist" button to track menus

13. **Create Playlist** (User-facing)
    - ✅ API ready
    - ⏳ Add "Create Playlist" button in Library

14. **Share Functionality**
    - ⏳ Implement share buttons

---

## 🚀 Quick Start for You

### Option 1: I Continue Connecting Everything

I can continue and connect all remaining pages. This will take some time as each page needs careful integration.

**Just say:** "Continue connecting all pages"

### Option 2: You Want to Add Content First

Test what's already working:

1. **Add content via Admin Panel**
   ```
   http://your-vps-ip/admin
   ```

2. **Check Home Page**
   ```
   http://your-vps-ip/home
   ```

3. **Let me know what you see** - I'll help troubleshoot

### Option 3: Focus on Specific Pages

Tell me which pages are most important:
- "Connect the Album page first"
- "Connect the Player first so music actually plays"
- "Connect Search so I can find content"

---

## 🔍 Current Status Summary

| Component | Status | Can Use? |
|-----------|--------|----------|
| **API Client** | ✅ Complete | Yes |
| **React Hooks** | ✅ Complete | Yes |
| **Player Context** | ✅ Complete | Yes |
| **Home Page** | ✅ Connected | Yes - Shows real data |
| **Admin Panel** | ✅ Working | Yes - Add content here |
| **Search Page** | ⏳ Needs Connection | No - Still demo data |
| **Library Page** | ⏳ Needs Connection | No - Still demo data |
| **Artist Page** | ⏳ Needs Connection | No - Still demo data |
| **Album Page** | ⏳ Needs Connection | No - Still demo data |
| **Playlist Page** | ⏳ Needs Connection | No - Still demo data |
| **Player** | ⏳ Needs Connection | No - Not playing yet |
| **Track Rows** | ⏳ Needs Connection | No - Buttons don't work |

---

## 💡 What This Means

**Right now:**
- ✅ You can add content via Admin Panel
- ✅ Home page will show your content
- ✅ Foundation is built for everything else
- ⚠️ Individual pages still show demo data
- ⚠️ Player doesn't stream yet
- ⚠️ Like buttons don't work yet

**Once fully connected:**
- ✅ Admin panel controls all content
- ✅ Changes appear immediately on frontend
- ✅ Music actually plays
- ✅ Users can like/unlike
- ✅ Play history tracked
- ✅ Search works
- ✅ Everything is functional

---

## 🎯 Next Steps

**Tell me how you want to proceed:**

1. **"Continue connecting everything"** - I'll finish all pages
2. **"Show me how to add content first"** - I'll guide you through admin panel
3. **"Connect [specific page] first"** - Tell me priority
4. **"Fix any issues first"** - If something's not working

The foundation is solid. Now we just need to connect the UI components to use the APIs and state management I've built!
