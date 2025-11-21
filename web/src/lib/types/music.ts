/**
 * Music Data Types
 * Type definitions for music-related entities
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  artist_id: string;
  album?: string;
  album_id?: string;
  duration: number; // in seconds
  artwork_url?: string;
  audio_url: string;
  plays?: number;
  likes?: number;
  is_liked?: boolean;
  release_date?: string;
  genre?: string;
  mood?: string;
  explicit?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artist_id: string;
  artwork_url?: string;
  release_date?: string;
  tracks_count?: number;
  duration?: number;
  genre?: string;
  description?: string;
  tracks?: Track[];
}

export interface Artist {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  followers?: number;
  is_following?: boolean;
  genres?: string[];
  verified?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  tracks_count?: number;
  duration?: number;
  is_public?: boolean;
  is_collaborative?: boolean;
  tracks?: PlaylistTrack[];
  collaborators?: PlaylistCollaborator[];
  created_at?: string;
  updated_at?: string;
}

export interface PlaylistTrack extends Track {
  position: number;
  added_by?: string;
  added_by_name?: string;
  added_at?: string;
}

export interface PlaylistCollaborator {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  invited_by?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  created_at?: string;
}

export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  parent_id?: string;
  content: string;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
  created_at: string;
  updated_at?: string;
}

export type ActivityType =
  | 'follow'
  | 'playlist_create'
  | 'playlist_update'
  | 'track_add'
  | 'track_like'
  | 'album_save'
  | 'artist_follow'
  | 'comment'
  | 'playlist_like';

export interface Activity {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  type: ActivityType;
  entity_type?: 'track' | 'album' | 'playlist' | 'user' | 'artist';
  entity_id?: string;
  entity_name?: string;
  entity_image?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// Player-specific types
export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number; // 0-100
  duration: number; // in seconds
  repeat: RepeatMode;
  shuffle: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
