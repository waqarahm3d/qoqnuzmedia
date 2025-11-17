import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/artists/[artistId]
 * Get artist details with albums and popular tracks (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { artistId: string } }
) {
  const { artistId } = params;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Get artist details
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (artistError) throw artistError;

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get artist's albums
    const { data: albums, error: albumsError } = await supabase
      .from('albums')
      .select('id, title, cover_art_url, release_date, album_type')
      .eq('artist_id', artistId)
      .order('release_date', { ascending: false });

    if (albumsError) throw albumsError;

    // Get artist's popular tracks (top 10 by play count)
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        duration_ms,
        play_count,
        explicit,
        audio_url,
        album_id,
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `)
      .eq('artist_id', artistId)
      .order('play_count', { ascending: false })
      .limit(10);

    if (tracksError) throw tracksError;

    return NextResponse.json({
      artist: {
        ...artist,
        albums: albums || [],
        tracks: tracks || [],
      },
    });
  } catch (error: any) {
    console.error('Get artist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist', details: error.message },
      { status: 500 }
    );
  }
}
