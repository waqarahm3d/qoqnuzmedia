import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/genres/[slug]
 * Get a genre with all related content (artists, albums, tracks, playlists)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createAdminSupabaseClient();
  const { slug } = params;

  try {
    // First, get the genre by slug or ID
    let genreQuery = supabase
      .from('genres')
      .select('*')
      .eq('is_active', true);

    // Check if slug is a UUID (ID) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    if (isUUID) {
      genreQuery = genreQuery.eq('id', slug);
    } else {
      genreQuery = genreQuery.eq('slug', slug);
    }

    const { data: genre, error: genreError } = await genreQuery.single();

    if (genreError || !genre) {
      return apiNotFound('Genre not found');
    }

    // Get artists in this genre
    // First try the junction table, then fall back to TEXT[] array
    let artists: any[] = [];

    // Try junction table first
    const { data: artistGenres } = await supabase
      .from('artist_genres')
      .select('artist_id')
      .eq('genre_id', genre.id);

    if (artistGenres && artistGenres.length > 0) {
      const artistIds = artistGenres.map(ag => ag.artist_id);
      const { data: artistsData } = await supabase
        .from('artists')
        .select('id, name, avatar_url, follower_count')
        .in('id', artistIds)
        .order('follower_count', { ascending: false })
        .limit(20);
      artists = artistsData || [];
    } else {
      // Fall back to TEXT[] array search
      const { data: artistsData } = await supabase
        .from('artists')
        .select('id, name, avatar_url, follower_count')
        .contains('genres', [genre.name])
        .order('follower_count', { ascending: false })
        .limit(20);
      artists = artistsData || [];
    }

    // Get albums in this genre
    let albums: any[] = [];

    // Try junction table first
    const { data: albumGenres } = await supabase
      .from('album_genres')
      .select('album_id')
      .eq('genre_id', genre.id);

    if (albumGenres && albumGenres.length > 0) {
      const albumIds = albumGenres.map(ag => ag.album_id);
      const { data: albumsData } = await supabase
        .from('albums')
        .select(`
          id, title, cover_art_url, release_date,
          artists!albums_artist_id_fkey (id, name)
        `)
        .in('id', albumIds)
        .order('release_date', { ascending: false })
        .limit(20);
      albums = albumsData || [];
    } else {
      // Fall back to TEXT[] array search
      const { data: albumsData } = await supabase
        .from('albums')
        .select(`
          id, title, cover_art_url, release_date,
          artists!albums_artist_id_fkey (id, name)
        `)
        .contains('genres', [genre.name])
        .order('release_date', { ascending: false })
        .limit(20);
      albums = albumsData || [];
    }

    // Get tracks in this genre
    let tracks: any[] = [];

    // Try junction table first
    const { data: trackGenres } = await supabase
      .from('track_genres')
      .select('track_id')
      .eq('genre_id', genre.id);

    if (trackGenres && trackGenres.length > 0) {
      const trackIds = trackGenres.map(tg => tg.track_id);
      const { data: tracksData } = await supabase
        .from('tracks')
        .select(`
          id, title, duration_ms, play_count,
          artists!tracks_artist_id_fkey (id, name),
          albums (id, title, cover_art_url)
        `)
        .in('id', trackIds)
        .order('play_count', { ascending: false })
        .limit(50);
      tracks = tracksData || [];
    } else {
      // Fall back to TEXT[] array search
      const { data: tracksData } = await supabase
        .from('tracks')
        .select(`
          id, title, duration_ms, play_count,
          artists!tracks_artist_id_fkey (id, name),
          albums (id, title, cover_art_url)
        `)
        .contains('genres', [genre.name])
        .order('play_count', { ascending: false })
        .limit(50);
      tracks = tracksData || [];
    }

    // Get playlists in this genre
    const { data: playlists } = await supabase
      .from('playlists')
      .select(`
        id, name, description, cover_image_url,
        profiles (display_name)
      `)
      .contains('genre_ids', [genre.id])
      .eq('is_public', true)
      .limit(20);

    return apiSuccess({
      genre,
      artists: artists || [],
      albums: albums || [],
      tracks: tracks || [],
      playlists: playlists || [],
    });
  } catch (error: any) {
    console.error('Get genre error:', error);
    return apiServerError('Failed to fetch genre', error);
  }
}
