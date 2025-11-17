import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/search
 * Universal search across tracks, artists, albums, playlists, users
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    const results: any = {};

    if (type === 'all' || type === 'tracks') {
      const { data: tracks } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration_ms,
          artists!tracks_artist_id_fkey(id, name),
          albums!tracks_album_id_fkey(id, title, cover_art_url)
        `)
        .ilike('title', `%${query}%`)
        .limit(limit);

      results.tracks = tracks || [];
    }

    if (type === 'all' || type === 'artists') {
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, avatar_url, verified')
        .ilike('name', `%${query}%`)
        .limit(limit);

      results.artists = artists || [];
    }

    if (type === 'all' || type === 'albums') {
      const { data: albums } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          cover_art_url,
          release_date,
          artists!albums_artist_id_fkey(id, name)
        `)
        .ilike('title', `%${query}%`)
        .limit(limit);

      results.albums = albums || [];
    }

    if (type === 'all' || type === 'playlists') {
      const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name, description, cover_image_url, is_public')
        .ilike('name', `%${query}%`)
        .eq('is_public', true)
        .limit(limit);

      results.playlists = playlists || [];
    }

    if (type === 'all' || type === 'users') {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit);

      results.users = users || [];
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}
