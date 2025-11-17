/**
 * API Client - Centralized API calls for frontend
 */

import { supabase } from '@/lib/supabase-client';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// ALBUMS
// ============================================================================

export async function getAlbums(params?: { limit?: number; offset?: number }) {
  const query = supabase
    .from('albums')
    .select(`
      *,
      artists (
        id,
        name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.range(params.offset, params.offset + (params.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAlbum(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      artists (
        id,
        name,
        avatar_url
      ),
      tracks (
        id,
        title,
        duration,
        track_number,
        play_count
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// ARTISTS
// ============================================================================

export async function getArtists(params?: { limit?: number; offset?: number }) {
  const query = supabase
    .from('artists')
    .select('*')
    .order('follower_count', { ascending: false });

  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.range(params.offset, params.offset + (params.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getArtist(id: string) {
  const { data, error } = await supabase
    .from('artists')
    .select(`
      *,
      albums (
        id,
        title,
        cover_art_url,
        release_date
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getArtistTracks(artistId: string, limit = 10) {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id,
      title,
      duration,
      play_count,
      albums (
        id,
        title,
        cover_art_url
      )
    `)
    .eq('artist_id', artistId)
    .order('play_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function followArtist(artistId: string) {
  return fetchAPI('/api/social/follow/artists', {
    method: 'POST',
    body: JSON.stringify({ artistId }),
  });
}

export async function unfollowArtist(artistId: string) {
  return fetchAPI(`/api/social/follow/artists?artistId=${artistId}`, {
    method: 'DELETE',
  });
}

export async function isFollowingArtist(artistId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('artist_follows')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('artist_id', artistId)
    .single();

  return !error && !!data;
}

// ============================================================================
// TRACKS
// ============================================================================

export async function getTracks(params?: { limit?: number; offset?: number }) {
  const query = supabase
    .from('tracks')
    .select(`
      *,
      artists (
        id,
        name
      ),
      albums (
        id,
        title,
        cover_art_url
      )
    `)
    .order('created_at', { ascending: false });

  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.range(params.offset, params.offset + (params.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getStreamUrl(trackId: string) {
  return fetchAPI<{ url: string; expiresAt: string }>(`/api/stream/${trackId}`);
}

// ============================================================================
// PLAYLISTS
// ============================================================================

export async function getPlaylists(params?: { limit?: number; offset?: number }) {
  const { data: { user } } = await supabase.auth.getUser();

  const query = supabase
    .from('playlists')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .or(`is_public.eq.true,owner_id.eq.${user?.id || 'null'}`)
    .order('created_at', { ascending: false });

  if (params?.limit) query.limit(params.limit);
  if (params?.offset) query.range(params.offset, params.offset + (params.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getUserPlaylists() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPlaylist(id: string) {
  const { data, error} = await supabase
    .from('playlists')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      ),
      playlist_tracks (
        position,
        tracks (
          id,
          title,
          duration,
          artists (
            id,
            name
          ),
          albums (
            id,
            title,
            cover_art_url
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPlaylist(name: string, description?: string) {
  return fetchAPI('/api/playlists', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  return fetchAPI(`/api/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ trackId }),
  });
}

// ============================================================================
// SEARCH
// ============================================================================

export async function search(query: string, type?: 'all' | 'tracks' | 'albums' | 'artists' | 'playlists') {
  const params = new URLSearchParams({ q: query });
  if (type && type !== 'all') params.append('type', type);

  return fetchAPI(`/api/search?${params.toString()}`);
}

// ============================================================================
// LIBRARY
// ============================================================================

export async function getLikedTracks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('liked_tracks')
    .select(`
      created_at,
      tracks (
        id,
        title,
        duration,
        artists (
          id,
          name
        ),
        albums (
          id,
          title,
          cover_art_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function likeTrack(trackId: string) {
  return fetchAPI('/api/library/liked-tracks', {
    method: 'POST',
    body: JSON.stringify({ trackId }),
  });
}

export async function unlikeTrack(trackId: string) {
  return fetchAPI(`/api/library/liked-tracks?trackId=${trackId}`, {
    method: 'DELETE',
  });
}

export async function isTrackLiked(trackId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('liked_tracks')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('track_id', trackId)
    .single();

  return !error && !!data;
}

export async function getUserLibrary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { playlists: [], artists: [], albums: [] };

  // Get user's playlists
  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .eq('owner_id', user.id);

  // Get followed artists
  const { data: artistFollows } = await supabase
    .from('artist_follows')
    .select(`
      artists (
        id,
        name,
        avatar_url
      )
    `)
    .eq('user_id', user.id);

  // Get liked albums
  const { data: likedAlbums } = await supabase
    .from('liked_albums')
    .select(`
      albums (
        id,
        title,
        cover_art_url,
        artists (
          id,
          name
        )
      )
    `)
    .eq('user_id', user.id);

  return {
    playlists: playlists || [],
    artists: artistFollows?.map(f => f.artists).filter(Boolean) || [],
    albums: likedAlbums?.map(l => l.albums).filter(Boolean) || [],
  };
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

export async function getActivityFeed(limit = 20) {
  return fetchAPI(`/api/feed?limit=${limit}`);
}

export async function getPlayHistory(limit = 50) {
  return fetchAPI(`/api/history?limit=${limit}`);
}

export async function trackPlay(trackId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Record play in history
  await supabase.from('play_history').insert({
    user_id: user.id,
    track_id: trackId,
    played_at: new Date().toISOString(),
  });
}

// ============================================================================
// GENRES
// ============================================================================

export async function getGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getGenrePlaylists(genreId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .contains('genre_ids', [genreId])
    .eq('is_public', true)
    .limit(20);

  if (error) throw error;
  return data;
}

// ============================================================================
// USER
// ============================================================================

export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(updates: any) {
  return fetchAPI('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}
