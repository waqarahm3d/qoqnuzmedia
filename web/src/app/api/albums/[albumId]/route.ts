import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/albums/[albumId]
 * Get album details with tracks (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { albumId } = params;

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
    const { data: album, error } = await supabase
      .from('albums')
      .select(`
        *,
        artists!albums_artist_id_fkey(id, name, avatar_url, verified),
        tracks(
          id,
          title,
          track_number,
          duration_ms,
          play_count,
          explicit,
          audio_url,
          artists!tracks_artist_id_fkey(id, name)
        )
      `)
      .eq('id', albumId)
      .single();

    if (error) throw error;

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Sort tracks by track_number
    if (album.tracks) {
      album.tracks.sort((a: any, b: any) => (a.track_number || 0) - (b.track_number || 0));
    }

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error('Get album error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album', details: error.message },
      { status: 500 }
    );
  }
}
