# Phase 3: Extended Features - Implementation Plan

**Sprint 3 (Weeks 5-6): Extended Features**
**Branch**: `claude/qoqnuz-music-app-milestone-a-01FsBbWkEomLV135pmo8aE1w`
**Status**: 🚧 In Progress
**Target**: Add social, library, and playlist features

---

## 🎯 Objectives

Build out the extended features that make Qoqnuz a complete social music platform:

1. **Playlist Management** - Full CRUD operations for user playlists
2. **Social Features** - Follow users, share content, social interactions
3. **Comments System** - Engage with tracks through comments
4. **User Library** - Manage liked songs, albums, and artists
5. **Collaborative Playlists** - Multiple users editing same playlist
6. **Activity Feed** - See what friends are listening to

---

## 📦 Features to Build

### 1. Playlist Management System

#### Components
- `CreatePlaylistModal` - Modal for creating new playlists
- `EditPlaylistModal` - Edit playlist details (name, description, cover)
- `PlaylistCard` - Display playlists in grid view
- `PlaylistHeader` - Playlist page header with actions
- `AddToPlaylistMenu` - Dropdown menu to add tracks to playlists

#### Pages
- `/library/playlists` - User's playlists library
- `/playlist/[id]` - Individual playlist page with tracks

#### Store
- `playlistStore.ts` - Manage playlists state

#### API Integration
- GET `/api/playlists` - Fetch user playlists
- POST `/api/playlists` - Create playlist
- PUT `/api/playlists/[id]` - Update playlist
- DELETE `/api/playlists/[id]` - Delete playlist
- POST `/api/playlists/[id]/tracks` - Add track to playlist
- DELETE `/api/playlists/[id]/tracks/[trackId]` - Remove track

---

### 2. Social Features

#### Components
- `FollowButton` - Follow/unfollow users
- `ShareMenu` - Share tracks, albums, playlists
- `UserCard` - Display user profile cards
- `SocialStats` - Show followers, following counts

#### Pages
- `/user/[id]` - User profile page
- `/library/following` - Users you follow
- `/library/followers` - Your followers

#### Store
- `socialStore.ts` - Manage social relationships

#### API Integration
- POST `/api/users/[id]/follow` - Follow user
- DELETE `/api/users/[id]/follow` - Unfollow user
- GET `/api/users/[id]/followers` - Get followers
- GET `/api/users/[id]/following` - Get following
- POST `/api/share` - Generate share links

---

### 3. Comments System

#### Components
- `CommentThread` - Display comments on a track
- `CommentForm` - Add new comment
- `Comment` - Individual comment with actions (like, reply, delete)
- `CommentSection` - Full comment section with loading states

#### Store
- `commentStore.ts` - Manage comments state

#### API Integration
- GET `/api/tracks/[id]/comments` - Fetch comments
- POST `/api/tracks/[id]/comments` - Add comment
- DELETE `/api/comments/[id]` - Delete comment
- POST `/api/comments/[id]/like` - Like comment
- POST `/api/comments/[id]/reply` - Reply to comment

---

### 4. User Library Management

#### Components
- `LibrarySidebar` - Library navigation
- `LibrarySection` - Reusable library section component
- `LikedSongsCard` - Special card for liked songs collection
- `EmptyLibraryState` - Empty states for library sections

#### Pages
- `/library` - Library overview
- `/library/tracks` - Liked tracks
- `/library/albums` - Saved albums
- `/library/artists` - Following artists
- `/library/playlists` - User playlists

#### Store
- `libraryStore.ts` - Manage library state

#### API Integration
- GET `/api/library/tracks` - Fetch liked tracks
- POST `/api/library/tracks` - Like track
- DELETE `/api/library/tracks/[id]` - Unlike track
- GET `/api/library/albums` - Fetch saved albums
- POST `/api/library/albums` - Save album
- DELETE `/api/library/albums/[id]` - Remove album
- GET `/api/library/artists` - Fetch followed artists
- POST `/api/library/artists` - Follow artist
- DELETE `/api/library/artists/[id]` - Unfollow artist

---

### 5. Collaborative Playlists

#### Components
- `PlaylistCollaborators` - List of collaborators
- `InviteCollaboratorModal` - Invite users to collaborate
- `CollaboratorPermissions` - Manage collaborator permissions

#### Features
- Add/remove collaborators
- Real-time updates (using Supabase Realtime)
- Permission levels (view, edit, admin)
- Activity log showing who added what

#### API Integration
- POST `/api/playlists/[id]/collaborators` - Add collaborator
- DELETE `/api/playlists/[id]/collaborators/[userId]` - Remove collaborator
- PUT `/api/playlists/[id]/collaborators/[userId]` - Update permissions

---

### 6. Activity Feed

#### Components
- `ActivityFeed` - Main feed component
- `ActivityItem` - Individual activity item
- `ActivityFilter` - Filter by activity type

#### Activity Types
- User started following you
- User added track to playlist
- User created new playlist
- User liked your playlist
- User commented on track

#### Pages
- `/activity` - Activity feed page
- Integration in `/home` page (sidebar widget)

#### Store
- `activityStore.ts` - Manage activity feed state

#### API Integration
- GET `/api/activity` - Fetch activity feed
- POST `/api/activity/mark-read` - Mark activities as read

---

## 🗂️ Database Schema Updates

### New Tables

```sql
-- Playlists table
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_collaborative BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist tracks (many-to-many)
CREATE TABLE playlist_tracks (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

-- Playlist collaborators
CREATE TABLE playlist_collaborators (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- viewer, editor, admin
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (playlist_id, user_id)
);

-- User follows (many-to-many)
CREATE TABLE user_follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Track comments
CREATE TABLE track_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES track_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE comment_likes (
  comment_id UUID REFERENCES track_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- User library - liked tracks
CREATE TABLE user_liked_tracks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

-- User library - saved albums
CREATE TABLE user_saved_albums (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, album_id)
);

-- User library - followed artists
CREATE TABLE user_followed_artists (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, artist_id)
);

-- Activity feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- who the activity is for
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- who performed the action
  type TEXT NOT NULL, -- 'follow', 'playlist_create', 'track_add', 'comment', etc.
  entity_type TEXT, -- 'track', 'album', 'playlist', 'user'
  entity_id UUID,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Design Patterns

### Modal System
- Use `useUIStore` for modal state management
- Create reusable `Modal` base component
- Implement backdrop, animations, accessibility

### Form Handling
- Use React Hook Form for complex forms
- Zod validation schemas
- Error handling and display

### Real-time Updates
- Supabase Realtime for collaborative features
- Optimistic updates for better UX
- Conflict resolution strategies

### Infinite Scrolling
- Use React Query with infinite queries
- Intersection Observer for scroll detection
- Loading states and skeletons

---

## 🚀 Implementation Order

### Part 1: Playlist System (Day 1-2)
1. Create playlist store and types
2. Build CreatePlaylistModal component
3. Build PlaylistCard component
4. Create /library/playlists page
5. Create /playlist/[id] page
6. Implement AddToPlaylistMenu
7. Add API routes for playlists

### Part 2: User Library (Day 2-3)
1. Create library store
2. Build LibrarySidebar component
3. Create /library pages (tracks, albums, artists)
4. Implement like/save/follow actions
5. Update existing components with library integration
6. Add API routes for library operations

### Part 3: Social Features (Day 3-4)
1. Create social store
2. Build FollowButton component
3. Build ShareMenu component
4. Create user profile page
5. Create followers/following pages
6. Add API routes for social features

### Part 4: Comments System (Day 4-5)
1. Create comment store
2. Build Comment component
3. Build CommentForm component
4. Build CommentThread component
5. Integrate into track pages
6. Add API routes for comments

### Part 5: Collaborative Playlists (Day 5-6)
1. Update playlist store for collaboration
2. Build InviteCollaboratorModal
3. Build PlaylistCollaborators component
4. Implement real-time updates
5. Add API routes for collaborators

### Part 6: Activity Feed (Day 6)
1. Create activity store
2. Build ActivityFeed component
3. Build ActivityItem component
4. Create /activity page
5. Add activity widgets to home page
6. Add API routes for activities

---

## ✅ Success Criteria

- [ ] Users can create, edit, delete playlists
- [ ] Users can add/remove tracks from playlists
- [ ] Users can like tracks, save albums, follow artists
- [ ] Users can follow/unfollow other users
- [ ] Users can share tracks, albums, playlists
- [ ] Users can comment on tracks
- [ ] Users can collaborate on playlists
- [ ] Users can see activity feed of friends
- [ ] All features are fully responsive
- [ ] All features have loading and error states
- [ ] All features are type-safe
- [ ] All features are accessible (WCAG 2.1 AA)

---

## 📊 Technical Specifications

### Component Architecture
- Modal system for dialogs
- Menu/dropdown components
- Form components with validation
- Real-time subscription management

### State Management
- Zustand stores for client state
- React Query for server state
- Optimistic updates for better UX
- Cache invalidation strategies

### API Design
- RESTful endpoints
- Consistent error handling
- Request/response validation
- Rate limiting consideration

### Performance
- Virtualized lists for long content
- Infinite scroll pagination
- Debounced search/filter
- Optimistic UI updates

---

## 🧪 Testing Strategy

### Unit Tests
- Store actions and selectors
- Utility functions
- Component rendering

### Integration Tests
- Form submissions
- API interactions
- Store updates

### E2E Tests
- Create playlist flow
- Add track to playlist
- Follow user flow
- Comment on track

---

Let's build these features! 🚀
