# Qoqnuz Music - Feature Comparison Report

**Comparison Against**: Essential Listening Features Priority List
**Date**: January 18, 2025
**Current Implementation**: 70% Complete

---

## 📊 Overall Status Summary

| Category | Priority | Status | Completion | Effort to Complete |
|----------|----------|--------|------------|-------------------|
| **1. Smart Queue & Playback** | ✅ MUST HAVE | ⚠️ Partial | 60% | 1-2 weeks |
| **2. Personal Radio Stations** | ✅ MUST HAVE | ❌ Missing | 0% | 2-3 weeks |
| **3. Listening History & Stats** | ✅ MUST HAVE | ✅ Complete | 95% | 1-2 days |
| **4. Smart Playlists** | ✅ HIGH VALUE | ❌ Missing | 10% | 3-4 weeks |
| **5. Enhanced Search & Filters** | ✅ HIGH VALUE | ⚠️ Partial | 40% | 1-2 weeks |
| **6. Offline Mode (PWA)** | ✅ HIGH VALUE | ❌ Missing | 0% | 2-3 weeks |
| **7. Social Listening** | 🎯 MEDIUM | ⚠️ Partial | 30% | 2-3 weeks |
| **8. Music Discovery Tools** | 🎯 MEDIUM | ⚠️ Partial | 40% | 2-3 weeks |

---

## 1. Smart Queue & Playback ✅ MUST HAVE

### Status: ⚠️ **60% Complete**

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Up Next queue** | ✅ Done | `PlayerContext.tsx` | Queue array with current index |
| **Drag-and-drop reorder** | ❌ Missing | N/A | No drag-drop UI implemented |
| **Queue persistence** | ⚠️ Partial | `PlayerContext.tsx` | localStorage only, no Supabase sync |
| **Add to queue** | ✅ Done | `PlayerContext.tsx` | `addToQueue()` function |
| **"Play Next" option** | ❌ Missing | N/A | Only add to end of queue |
| **Crossfade** | ❌ Missing | N/A | No crossfade implementation |
| **Repeat modes** | ✅ Done | `PlayerContext.tsx` | Off, one, all |
| **Shuffle algorithm** | ⚠️ Basic | `PlayerContext.tsx` | Fisher-Yates shuffle, but no anti-repetition |

**What Exists**:
```typescript
// PlayerContext.tsx (lines 20-50)
- queue: Track[]
- currentTrackIndex: number
- isShuffled: boolean
- repeatMode: 'off' | 'one' | 'all'
- addToQueue(track: Track)
- toggleShuffle()
- setRepeatMode()
```

**What's Missing**:
```typescript
// Need to add:
- addToQueueNext(track: Track)  // Play next in queue
- reorderQueue(oldIndex, newIndex)  // Drag-drop support
- crossfadeEnabled: boolean
- crossfadeDuration: number (3-5 seconds)
- persistQueueToSupabase()  // Sync to database
- loadQueueFromSupabase()
- smartShuffle()  // Avoid artist repetition
```

**Files to Modify**:
- `src/lib/contexts/PlayerContext.tsx` - Add missing queue functions
- `src/components/layout/Player.tsx` - Add drag-drop UI for queue
- Add crossfade using Web Audio API

**Effort**: 1-2 weeks
- Drag-drop reorder: 2-3 days
- Play Next feature: 1 day
- Queue persistence to Supabase: 2-3 days
- Crossfade implementation: 3-5 days
- Smart shuffle: 1-2 days

---

## 2. Personal Radio Stations ✅ MUST HAVE

### Status: ❌ **0% Complete - CRITICAL MISSING**

| Feature | Status | Notes |
|---------|--------|-------|
| **Artist radio** | ❌ Missing | No similar artist algorithm |
| **Song radio** | ❌ Missing | No genre/mood/tempo matching |
| **Genre stations** | ❌ Missing | Genres exist but no radio feature |
| **Similarity scoring** | ❌ Missing | No recommendation engine |

**What Exists**:
- Genre tags on tracks (`tracks.genres` JSONB)
- Related tracks API (`/api/tracks/[trackId]/related`) - but basic implementation

**What's Missing**:
```typescript
// Database additions needed:
ALTER TABLE tracks ADD COLUMN tempo_bpm INTEGER;
ALTER TABLE tracks ADD COLUMN mood_tags TEXT[];
ALTER TABLE tracks ADD COLUMN energy_level INTEGER; // 1-10 scale

// New API endpoints needed:
POST /api/radio/artist/[artistId]
POST /api/radio/song/[trackId]
POST /api/radio/genre/[genreId]
GET /api/radio/recommendations

// Algorithm needed:
function generateArtistRadio(artistId) {
  // 1. Get tracks from artist
  // 2. Find similar genres
  // 3. Find tracks from different artists in same genres
  // 4. Score by popularity, recency
  // 5. Return shuffled playlist
}

function generateSongRadio(trackId) {
  // 1. Get track metadata (genre, mood, tempo)
  // 2. Find similar tracks by:
  //    - Same genre (50% weight)
  //    - Similar tempo ±10 BPM (20% weight)
  //    - Same mood tags (20% weight)
  //    - Artist similarity (10% weight)
  // 3. Exclude recently played
  // 4. Return shuffled playlist
}
```

**Implementation Plan**:

1. **Database Schema** (1 day):
   ```sql
   -- Add to tracks table
   ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tempo_bpm INTEGER;
   ALTER TABLE tracks ADD COLUMN IF NOT EXISTS mood_tags TEXT[];
   ALTER TABLE tracks ADD COLUMN IF NOT EXISTS energy_level INTEGER;
   ALTER TABLE tracks ADD COLUMN IF NOT EXISTS key_signature VARCHAR(3); -- C, Am, etc.

   -- New table for track similarity
   CREATE TABLE track_similarities (
     track_id UUID REFERENCES tracks(id),
     similar_track_id UUID REFERENCES tracks(id),
     similarity_score DECIMAL(3,2), -- 0.00 to 1.00
     reason TEXT, -- 'genre', 'tempo', 'mood', etc.
     PRIMARY KEY (track_id, similar_track_id)
   );

   -- Index for fast lookups
   CREATE INDEX idx_track_similarities_score ON track_similarities(similarity_score DESC);
   ```

2. **API Routes** (3-4 days):
   - `/api/radio/artist/[artistId]/route.ts`
   - `/api/radio/song/[trackId]/route.ts`
   - `/api/radio/genre/[genreId]/route.ts`
   - `/api/radio/recommendations/route.ts`

3. **UI Components** (2-3 days):
   - Radio station cards
   - "Start Radio" button on artist/track pages
   - Radio mode indicator in player

**Effort**: 2-3 weeks
- Database schema: 1 day
- Similarity algorithm: 5-7 days
- API implementation: 3-4 days
- UI components: 2-3 days
- Testing & tuning: 2-3 days

**Priority**: 🔥 **CRITICAL** - This is a core differentiator

---

## 3. Listening History & Stats ✅ MUST HAVE

### Status: ✅ **95% Complete - EXCELLENT**

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Recently played** | ✅ Done | `/api/history`, `/(app)/recent` | Last 50 tracks |
| **Most played** | ✅ Done | `/api/admin/analytics` | Week/month/all-time |
| **Listening time stats** | ⚠️ Partial | Play history tracks duration | Can calculate but no UI |
| **Top artists/songs** | ✅ Done | `/api/admin/analytics` | Available in admin |
| **Year in Review** | ❌ Missing | N/A | Not implemented |

**What Exists**:
```typescript
// Database table
play_history (
  id, user_id, track_id, played_at, duration_played
)

// API endpoints
GET /api/history - Get user's play history
POST /api/history - Record play event
GET /api/admin/analytics - Top tracks/artists

// UI
/(app)/recent/page.tsx - Recently played page
```

**What's Missing**:
```typescript
// Stats API needed:
GET /api/stats/user
Response: {
  totalListeningTime: number,  // in minutes
  topArtistsThisWeek: Artist[],
  topTracksThisMonth: Track[],
  uniqueArtists: number,
  totalTracks: number,
  mostPlayedGenre: string
}

// Year in Review
GET /api/stats/year-in-review/[year]
Response: {
  topTracks: Track[],  // Top 100
  topArtists: Artist[],  // Top 50
  topGenres: string[],
  totalMinutes: number,
  uniqueTracks: number,
  mostPlayedMonth: string,
  listeningPersonality: string,  // "Explorer", "Loyalist", etc.
  shareableImage: string  // Generated image URL
}
```

**Implementation Plan**:

1. **User Stats API** (1 day):
   - Create `/api/stats/user/route.ts`
   - Aggregate play history data
   - Cache results for performance

2. **Stats Dashboard Page** (1 day):
   - Create `/(app)/stats/page.tsx`
   - Display listening time, top content
   - Charts for trends

3. **Year in Review** (Optional, 3-4 days):
   - Generate yearly summary
   - Create shareable graphics
   - Social media sharing

**Effort**: 1-2 days (or 5-6 days with Year in Review)

**Priority**: ⭐ **NICE TO HAVE** - Core functionality exists, just needs UI polish

---

## 4. Smart Playlists ✅ HIGH VALUE

### Status: ❌ **10% Complete - MAJOR GAP**

| Feature | Status | Notes |
|---------|--------|-------|
| **Auto-generated playlists** | ❌ Missing | No auto-generation |
| **"Your Daily Mix"** | ❌ Missing | Would be valuable |
| **"New for You"** | ❌ Missing | Simple to implement |
| **"Forgotten Favorites"** | ❌ Missing | Easy with play history |
| **"Discovery"** | ❌ Missing | Needs similarity engine |
| **Collaborative playlists** | ❌ Missing | Was in original requirements |
| **Playlist folders** | ❌ Missing | Good organizational feature |

**What Exists**:
- Basic playlists (create, edit, delete)
- `playlists` table with `is_public` flag
- Playlist CRUD API

**What's Missing**:

1. **Collaborative Playlists**:
   ```sql
   CREATE TABLE playlist_collaborators (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     permission VARCHAR(20) DEFAULT 'edit', -- 'view', 'edit', 'admin'
     invited_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(playlist_id, user_id)
   );

   -- API needed:
   POST /api/playlists/[id]/collaborators
   DELETE /api/playlists/[id]/collaborators/[userId]
   GET /api/playlists/[id]/collaborators
   ```

2. **Auto-Generated Playlists**:
   ```typescript
   // New API endpoints:
   GET /api/playlists/smart/daily-mix
   GET /api/playlists/smart/new-for-you
   GET /api/playlists/smart/forgotten-favorites
   GET /api/playlists/smart/discovery

   // Algorithm examples:
   async function generateDailyMix(userId: string) {
     // 1. Get user's most played tracks (last 30 days)
     // 2. Get their liked genres
     // 3. Find similar tracks they haven't played recently
     // 4. Mix in some new releases in their genres
     // 5. Shuffle with variety algorithm
     return tracks; // 50-100 tracks
   }

   async function generateForgottenFavorites(userId: string) {
     // 1. Get liked tracks
     // 2. Filter: not played in last 90 days
     // 3. Sort by original play count
     // 4. Return top 50
   }

   async function generateNewForYou(userId: string) {
     // 1. Get user's liked genres
     // 2. Find tracks uploaded in last 7 days
     // 3. Filter by user's genres
     // 4. Exclude already played
     // 5. Sort by popularity
   }
   ```

3. **Playlist Folders**:
   ```sql
   CREATE TABLE playlist_folders (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name VARCHAR(100),
     parent_folder_id UUID REFERENCES playlist_folders(id),
     created_at TIMESTAMP DEFAULT NOW()
   );

   ALTER TABLE playlists ADD COLUMN folder_id UUID REFERENCES playlist_folders(id);
   ```

**Implementation Plan**:

1. **Collaborative Playlists** (2-3 days):
   - Database schema
   - API endpoints
   - Invite UI
   - Permission system

2. **Smart Playlists** (2 weeks):
   - Daily Mix algorithm
   - New for You algorithm
   - Forgotten Favorites algorithm
   - Discovery algorithm
   - Cron job to update daily
   - UI to display smart playlists

3. **Playlist Folders** (1 week):
   - Database schema
   - Folder CRUD API
   - Folder UI in library
   - Drag-drop to folders

**Effort**: 3-4 weeks total
- Collaborative: 2-3 days
- Smart Playlists: 2 weeks
- Folders: 1 week

**Priority**: 🔥 **HIGH** - Major user engagement feature

---

## 5. Enhanced Search & Filters ✅ HIGH VALUE

### Status: ⚠️ **40% Complete**

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Search filters** | ⚠️ Partial | `/api/search` | Type filter only, no year/genre/mood/tempo |
| **Search within playlists** | ❌ Missing | N/A | Not implemented |
| **Fuzzy search** | ❌ Missing | N/A | Uses ILIKE (exact substring) |
| **Search history** | ❌ Missing | N/A | Not tracked |
| **Voice search** | ❌ Missing | N/A | No Web Speech API |

**What Exists**:
```typescript
// /api/search/route.ts (lines 15-50)
GET /api/search?q=query&type=tracks|albums|artists|playlists|users

// Current implementation:
- Searches title/name using ILIKE '%query%'
- Can filter by type
- Returns all matching results
```

**What's Missing**:

1. **Advanced Filters**:
   ```typescript
   // Enhanced search endpoint:
   GET /api/search?q=query&type=tracks&year=2024&genre=rock&mood=energetic&bpm=120-140

   // Database additions:
   ALTER TABLE tracks ADD COLUMN release_year INTEGER;
   ALTER TABLE tracks ADD COLUMN tempo_bpm INTEGER;
   ALTER TABLE tracks ADD COLUMN mood_tags TEXT[];

   // Updated search query:
   let query = supabase.from('tracks').select('*');

   if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,artist.name.ilike.%${searchQuery}%`);
   if (year) query = query.eq('release_year', year);
   if (genre) query = query.contains('genres', [genre]);
   if (mood) query = query.contains('mood_tags', [mood]);
   if (minBpm && maxBpm) query = query.gte('tempo_bpm', minBpm).lte('tempo_bpm', maxBpm);
   ```

2. **Fuzzy Search**:
   ```sql
   -- Enable PostgreSQL fuzzy search extension
   CREATE EXTENSION IF NOT EXISTS pg_trgm;

   -- Add indexes for fuzzy search
   CREATE INDEX tracks_title_trgm_idx ON tracks USING gin (title gin_trgm_ops);
   CREATE INDEX artists_name_trgm_idx ON artists USING gin (name gin_trgm_ops);

   -- Search query with similarity scoring
   SELECT *, similarity(title, 'query') as score
   FROM tracks
   WHERE similarity(title, 'query') > 0.3
   ORDER BY score DESC;
   ```

3. **Search Within Playlist**:
   ```typescript
   // New API endpoint:
   GET /api/playlists/[id]/search?q=query

   // Implementation:
   const { data } = await supabase
     .from('playlist_tracks')
     .select('tracks(*)')
     .eq('playlist_id', playlistId)
     .ilike('tracks.title', `%${query}%`);
   ```

4. **Search History**:
   ```sql
   CREATE TABLE search_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     query TEXT,
     result_count INTEGER,
     searched_at TIMESTAMP DEFAULT NOW()
   );

   -- API:
   GET /api/search/history
   POST /api/search/history
   DELETE /api/search/history/[id]
   ```

5. **Voice Search**:
   ```typescript
   // Client-side implementation using Web Speech API
   const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
   recognition.lang = 'en-US';
   recognition.continuous = false;

   recognition.onresult = (event) => {
     const transcript = event.results[0][0].transcript;
     performSearch(transcript);
   };

   // Add microphone button in search UI
   ```

**Implementation Plan**:

1. **Advanced Filters** (3-4 days):
   - Add database columns
   - Update search API
   - Update search UI with filter chips

2. **Fuzzy Search** (2 days):
   - Enable pg_trgm extension
   - Update search queries
   - Add relevance scoring

3. **Search Within Playlist** (1 day):
   - Add API endpoint
   - Add search bar to playlist page

4. **Search History** (2 days):
   - Database table
   - API endpoints
   - UI to show recent searches

5. **Voice Search** (2-3 days):
   - Implement Web Speech API
   - Add microphone button
   - Handle voice input

**Effort**: 1-2 weeks

**Priority**: ⭐ **MEDIUM-HIGH** - Improves discoverability

---

## 6. Offline Mode (PWA) ✅ HIGH VALUE

### Status: ❌ **0% Complete - MAJOR OPPORTUNITY**

| Feature | Status | Notes |
|---------|--------|-------|
| **Download songs** | ❌ Missing | No IndexedDB implementation |
| **Offline playlists** | ❌ Missing | Not available |
| **Smart caching** | ❌ Missing | No service worker |
| **Background sync** | ❌ Missing | No sync implementation |
| **PWA setup** | ❌ Missing | Not configured as PWA |

**What Exists**:
- Nothing related to offline mode

**What's Needed**:

1. **PWA Configuration**:
   ```json
   // public/manifest.json
   {
     "name": "Qoqnuz Music",
     "short_name": "Qoqnuz",
     "description": "Stream your favorite music",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#1a1a1a",
     "theme_color": "#ff4a14",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Service Worker**:
   ```typescript
   // public/sw.js
   const CACHE_NAME = 'qoqnuz-v1';
   const AUDIO_CACHE = 'qoqnuz-audio-v1';

   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => {
         return cache.addAll([
           '/',
           '/offline.html',
           '/styles/globals.css',
           // Static assets
         ]);
       })
     );
   });

   // Cache audio files
   self.addEventListener('fetch', (event) => {
     if (event.request.url.includes('/api/stream/')) {
       event.respondWith(
         caches.open(AUDIO_CACHE).then((cache) => {
           return cache.match(event.request).then((response) => {
             return response || fetch(event.request).then((fetchResponse) => {
               cache.put(event.request, fetchResponse.clone());
               return fetchResponse;
             });
           });
         })
       );
     }
   });
   ```

3. **Download Manager**:
   ```typescript
   // lib/offline/DownloadManager.ts
   class DownloadManager {
     async downloadTrack(trackId: string): Promise<void> {
       const audioUrl = await getSignedUrl(trackId);
       const response = await fetch(audioUrl);
       const blob = await response.blob();

       // Store in IndexedDB
       await db.tracks.put({
         id: trackId,
         audioBlob: blob,
         metadata: trackMetadata,
         downloadedAt: new Date()
       });
     }

     async downloadPlaylist(playlistId: string): Promise<void> {
       const tracks = await getPlaylistTracks(playlistId);
       for (const track of tracks) {
         await this.downloadTrack(track.id);
       }
     }

     async isAvailableOffline(trackId: string): Promise<boolean> {
       const track = await db.tracks.get(trackId);
       return !!track;
     }
   }
   ```

4. **IndexedDB Schema**:
   ```typescript
   // lib/offline/db.ts (using Dexie)
   import Dexie from 'dexie';

   class QoqnuzDB extends Dexie {
     tracks: Dexie.Table<OfflineTrack, string>;
     playlists: Dexie.Table<OfflinePlaylist, string>;

     constructor() {
       super('QoqnuzOffline');
       this.version(1).stores({
         tracks: 'id, downloadedAt, size',
         playlists: 'id, downloadedAt'
       });
     }
   }

   export const db = new QoqnuzDB();
   ```

5. **UI Components**:
   ```typescript
   // Download button on tracks
   <button onClick={() => downloadTrack(track.id)}>
     {isDownloaded ? '✓ Downloaded' : '↓ Download'}
   </button>

   // Downloads page
   /(app)/downloads/page.tsx
   - List of downloaded tracks
   - Storage usage
   - Clear cache button
   ```

**Implementation Plan**:

1. **PWA Setup** (1-2 days):
   - Create manifest.json
   - Generate app icons
   - Configure next.config.js

2. **Service Worker** (3-4 days):
   - Create service worker
   - Implement caching strategies
   - Add offline fallback

3. **Download Manager** (5-7 days):
   - IndexedDB setup with Dexie
   - Download functionality
   - Storage management
   - Queue system for downloads

4. **UI Implementation** (3-4 days):
   - Download buttons
   - Downloads page
   - Storage indicator
   - Sync status

5. **Background Sync** (2-3 days):
   - Sync play history when online
   - Sync liked tracks
   - Update metadata

**Effort**: 2-3 weeks

**Priority**: 🚀 **HIGH VALUE** - Major competitive advantage

---

## 7. Social Listening Features 🎯 MEDIUM PRIORITY

### Status: ⚠️ **30% Complete**

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Currently playing status** | ❌ Missing | N/A | No presence system |
| **Share timestamp** | ❌ Missing | N/A | No deep linking |
| **Collaborative queue** | ❌ Missing | N/A | No realtime sync |
| **Taste match %** | ❌ Missing | N/A | No comparison algorithm |
| **Friend activity digest** | ⚠️ Partial | `/api/feed` | Basic activity feed exists |

**What Exists**:
- Activity feed (basic)
- Follow users
- User profiles

**What's Missing**:

1. **Presence System** (Supabase Realtime):
   ```typescript
   // lib/presence/UserPresence.ts
   import { RealtimeChannel } from '@supabase/supabase-js';

   class UserPresence {
     private channel: RealtimeChannel;

     async trackPresence(userId: string, currentTrack: Track) {
       this.channel = supabase.channel('user-presence')
         .on('presence', { event: 'sync' }, () => {
           const state = this.channel.presenceState();
           // Update UI with who's online and what they're playing
         })
         .subscribe(async (status) => {
           if (status === 'SUBSCRIBED') {
             await this.channel.track({
               user_id: userId,
               currently_playing: currentTrack.id,
               timestamp: Date.now()
             });
           }
         });
     }
   }
   ```

2. **Timestamp Sharing**:
   ```typescript
   // Share URL with timestamp
   const shareUrl = `${APP_URL}/track/${trackId}?t=${currentTime}`;

   // Deep link handler
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const timestamp = params.get('t');
     if (timestamp) {
       audioRef.current.currentTime = parseInt(timestamp);
     }
   }, []);
   ```

3. **Collaborative Queue**:
   ```typescript
   // Realtime collaborative queue
   const collaborativeQueue = supabase.channel('queue-' + sessionId)
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'session_queue'
     }, (payload) => {
       // Update local queue when someone adds/removes
       updateQueue(payload.new);
     })
     .subscribe();

   // Database table:
   CREATE TABLE session_queues (
     id UUID PRIMARY KEY,
     session_id UUID,
     track_id UUID,
     added_by UUID,
     position INTEGER,
     created_at TIMESTAMP
   );
   ```

4. **Taste Match**:
   ```typescript
   async function calculateTasteMatch(user1Id: string, user2Id: string) {
     // Get both users' top artists
     const user1Artists = await getTopArtists(user1Id);
     const user2Artists = await getTopArtists(user2Id);

     // Calculate overlap
     const commonArtists = user1Artists.filter(a =>
       user2Artists.some(b => b.id === a.id)
     );

     // Get genre overlap
     const user1Genres = await getTopGenres(user1Id);
     const user2Genres = await getTopGenres(user2Id);
     const commonGenres = intersection(user1Genres, user2Genres);

     // Calculate score
     const score = (
       (commonArtists.length / user1Artists.length) * 0.6 +
       (commonGenres.length / user1Genres.length) * 0.4
     ) * 100;

     return {
       score: Math.round(score),
       commonArtists,
       commonGenres
     };
   }
   ```

**Implementation Plan**:

1. **Presence System** (1 week):
   - Supabase Realtime setup
   - Track user presence
   - Display friends' current track
   - Online/offline indicators

2. **Timestamp Sharing** (1 day):
   - Add share button with timestamp
   - Deep link handler
   - Social media preview cards

3. **Collaborative Queue** (1 week):
   - Realtime queue sync
   - Multi-user session management
   - Permission system

4. **Taste Match** (3-4 days):
   - Algorithm implementation
   - Comparison UI
   - Friend recommendations

**Effort**: 2-3 weeks

**Priority**: ⭐ **MEDIUM** - Nice to have, good for engagement

---

## 8. Music Discovery Tools 🎯 MEDIUM PRIORITY

### Status: ⚠️ **40% Complete**

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Mood tags** | ⚠️ Partial | Track metadata | Genres exist, no mood tags |
| **Activity playlists** | ❌ Missing | N/A | No workout/study/sleep playlists |
| **BPM-based playlists** | ❌ Missing | N/A | No BPM tracking |
| **"More like this"** | ⚠️ Basic | `/api/tracks/[trackId]/related` | Basic implementation |
| **Genre deep-dive** | ⚠️ Partial | `/genre/[slug]/page.tsx` | Page exists, basic |

**What Exists**:
- Genre pages
- Related tracks (basic)
- Genre tags on tracks

**What's Missing**:

1. **Mood & Activity Tags**:
   ```sql
   ALTER TABLE tracks ADD COLUMN mood_tags TEXT[]; -- happy, sad, energetic, chill
   ALTER TABLE tracks ADD COLUMN activity_tags TEXT[]; -- workout, study, sleep, party
   ALTER TABLE tracks ADD COLUMN tempo_bpm INTEGER;
   ALTER TABLE tracks ADD COLUMN energy_level INTEGER; -- 1-10

   -- Mood/activity playlists
   GET /api/playlists/mood/[mood] -- happy, sad, energetic, chill
   GET /api/playlists/activity/[activity] -- workout, study, sleep
   ```

2. **BPM-Based Playlists**:
   ```typescript
   // Running playlists by BPM
   GET /api/playlists/bpm/[bpm]?range=10

   // Example: Running at 160 steps/min = 160 BPM songs
   const runningTempo = 160;
   const tracks = await supabase
     .from('tracks')
     .select('*')
     .gte('tempo_bpm', runningTempo - 5)
     .lte('tempo_bpm', runningTempo + 5)
     .order('popularity', { ascending: false });
   ```

3. **Enhanced "More Like This"**:
   ```typescript
   async function getMoreLikeThis(trackId: string) {
     const track = await getTrack(trackId);

     // Multi-factor similarity
     const similar = await supabase
       .from('tracks')
       .select('*')
       .neq('id', trackId)
       .contains('genres', track.genres) // Same genres
       .gte('tempo_bpm', track.tempo_bpm - 10) // Similar tempo
       .lte('tempo_bpm', track.tempo_bpm + 10)
       .overlaps('mood_tags', track.mood_tags) // Similar mood
       .limit(50);

     // Score and sort by similarity
     return similar.map(t => ({
       ...t,
       similarity: calculateSimilarity(track, t)
     })).sort((a, b) => b.similarity - a.similarity);
   }
   ```

4. **Genre Deep-Dive Enhancements**:
   ```typescript
   // Enhanced genre page
   /(app)/genre/[slug]/page.tsx

   Features to add:
   - Top tracks in genre
   - Top artists in genre
   - Subgenres
   - Related genres
   - Genre timeline (tracks by release year)
   - Genre radio
   - Trending in genre
   ```

**Implementation Plan**:

1. **Mood & Activity Tags** (1 week):
   - Database schema updates
   - Tag UI in admin
   - Auto-tagging algorithm (ML optional)
   - Mood/activity playlist generation

2. **BPM System** (3-4 days):
   - Add BPM to tracks
   - BPM detection (using audio analysis or manual)
   - BPM-based playlists
   - Running tempo calculator

3. **Enhanced Similarity** (3-4 days):
   - Multi-factor algorithm
   - Similarity scoring
   - Better "More Like This" UI

4. **Genre Deep-Dive** (2-3 days):
   - Enhanced genre page
   - Genre analytics
   - Subgenre navigation

**Effort**: 2-3 weeks

**Priority**: ⭐ **MEDIUM** - Enhances discovery

---

## 🎯 PRIORITY RANKING FOR IMPLEMENTATION

### Critical (Next 2-3 Weeks)

1. **Personal Radio Stations** 🔥
   - Effort: 2-3 weeks
   - Impact: Massive user engagement
   - Why: Core differentiator from competitors

2. **Smart Playlists (Daily Mix, etc.)** 🔥
   - Effort: 2 weeks
   - Impact: High retention
   - Why: Keeps content fresh automatically

3. **Queue Enhancements** (Drag-drop, Play Next, Crossfade)
   - Effort: 1-2 weeks
   - Impact: Better UX
   - Why: Core listening experience

### High Value (Next 1-2 Months)

4. **Offline Mode / PWA** 🚀
   - Effort: 2-3 weeks
   - Impact: Huge competitive advantage
   - Why: Works without internet, reduces server load

5. **Enhanced Search & Filters**
   - Effort: 1-2 weeks
   - Impact: Better discoverability
   - Why: Users can find what they want faster

6. **Collaborative Playlists**
   - Effort: 2-3 days
   - Impact: Social engagement
   - Why: Was in original requirements

### Medium (Next 2-3 Months)

7. **Music Discovery Tools** (Mood, BPM, etc.)
   - Effort: 2-3 weeks
   - Impact: Medium
   - Why: Nice to have for power users

8. **Social Listening** (Presence, Collaborative Queue)
   - Effort: 2-3 weeks
   - Impact: Social engagement
   - Why: Fun but not critical

9. **User Stats Dashboard** (Listening time, Year in Review)
   - Effort: 1-2 days (or 1 week with full Year in Review)
   - Impact: User delight
   - Why: Users love this feature

---

## 📊 SUMMARY TABLE

| Feature Category | Must Have | Current % | Effort | Priority | Quick Wins |
|-----------------|-----------|-----------|--------|----------|------------|
| Queue & Playback | ✅ Yes | 60% | 1-2 weeks | 🔥 High | Play Next, Persistence |
| Radio Stations | ✅ Yes | 0% | 2-3 weeks | 🔥 Critical | Genre Radio |
| History & Stats | ✅ Yes | 95% | 1-2 days | ⭐ Low | Stats Dashboard |
| Smart Playlists | ✅ Yes | 10% | 3-4 weeks | 🔥 High | Forgotten Favorites |
| Search & Filters | ✅ Yes | 40% | 1-2 weeks | ⭐ Medium | Fuzzy Search |
| Offline / PWA | ✅ Yes | 0% | 2-3 weeks | 🚀 High | PWA Setup |
| Social Listening | 🎯 Medium | 30% | 2-3 weeks | ⭐ Medium | Timestamp Share |
| Discovery Tools | 🎯 Medium | 40% | 2-3 weeks | ⭐ Medium | Mood Tags |

---

## 🚀 RECOMMENDED 6-WEEK SPRINT

### Week 1-2: Radio Stations & Smart Playlists
- Implement artist/song/genre radio
- Build Daily Mix algorithm
- Create "New for You" and "Forgotten Favorites"
- **Impact**: Massive engagement boost

### Week 3-4: Queue Improvements & Collaborative Playlists
- Add drag-drop queue reordering
- Implement "Play Next"
- Add crossfade
- Build collaborative playlist feature
- **Impact**: Better core UX + social features

### Week 5-6: PWA & Enhanced Search
- Set up PWA infrastructure
- Implement offline downloads
- Add advanced search filters
- Implement fuzzy search
- **Impact**: Works offline + better discovery

**After 6 weeks**: You'll have all MUST HAVE features + major value adds

---

## 💡 QUICK WINS (Can Do This Week)

1. **Play Next Function** (4 hours)
   - Add `addToQueueNext()` function
   - Insert at currentIndex + 1

2. **Queue Persistence to Supabase** (1 day)
   - Save queue to `user_queue` table
   - Load on app start

3. **Forgotten Favorites Playlist** (1 day)
   - Simple query: liked tracks not played in 90 days
   - Auto-generate playlist

4. **Search Within Playlist** (4 hours)
   - Add search input to playlist page
   - Filter tracks client-side

5. **Timestamp Sharing** (4 hours)
   - Add `?t=` parameter support
   - Share button with timestamp

---

## 📈 EXPECTED IMPACT AFTER IMPLEMENTATION

### User Engagement
- **Radio Stations**: +40% listening time
- **Smart Playlists**: +30% session duration
- **Offline Mode**: +50% mobile usage
- **Queue Improvements**: +20% user satisfaction

### Technical Benefits
- **PWA/Offline**: -30% server bandwidth
- **Smart Caching**: -20% API calls
- **Better Search**: +40% content discovery

### Competitive Advantage
- Radio stations on par with Spotify
- Offline mode better than many competitors
- Smart playlists unique to your platform

---

**Bottom Line**: You have 40-60% of these essential features. Focusing on **Radio Stations**, **Smart Playlists**, and **Offline Mode** in the next 6 weeks will bring you to 90%+ feature parity with major platforms.

