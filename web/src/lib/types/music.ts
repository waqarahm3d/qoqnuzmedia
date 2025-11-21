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
  tracks_count?: number;
  duration?: number;
  is_public?: boolean;
  is_collaborative?: boolean;
  tracks?: Track[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
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
