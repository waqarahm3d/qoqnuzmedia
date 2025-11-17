import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/tracks
 * Get all tracks with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const artistId = searchParams.get('artist_id');
  const albumId = searchParams.get('album_id');

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('tracks')
      .select(`
        *,
        artists!tracks_artist_id_fkey(id, name),
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (artistId) {
      query = query.eq('artist_id', artistId);
    }

    if (albumId) {
      query = query.eq('album_id', albumId);
    }

    const { data: tracks, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      tracks: tracks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tracks
 * Create new track with file upload
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const permissionError = requirePermission(adminUser, 'content.create');
  if (permissionError) return permissionError;

  try {
    const formData = await request.formData();

    // Get form fields
    const audioFile = formData.get('audioFile') as File;
    const title = formData.get('title') as string;
    const artistId = formData.get('artistId') as string;
    const albumId = formData.get('albumId') as string | null;
    const duration_ms = parseInt(formData.get('duration_ms') as string);
    const explicit = formData.get('explicit') === 'true';
    const description = formData.get('description') as string || '';
    const tags = formData.get('tags') as string || '';
    const releaseDate = formData.get('releaseDate') as string;
    const genreIdsStr = formData.get('genreIds') as string;
    const coverImage = formData.get('coverImage') as File | null;

    if (!audioFile || !title || !artistId) {
      return NextResponse.json(
        { error: 'Audio file, title, and artist are required' },
        { status: 400 }
      );
    }

    // Parse genre IDs
    let genreIds: string[] = [];
    try {
      genreIds = genreIdsStr ? JSON.parse(genreIdsStr) : [];
    } catch (e) {
      console.error('Failed to parse genreIds:', e);
    }

    // Get genre names from IDs
    const genreNames: string[] = [];
    if (genreIds.length > 0) {
      const { data: genresData } = await supabase
        .from('genres')
        .select('name')
        .in('id', genreIds);
      if (genresData) {
        genreNames.push(...genresData.map(g => g.name));
      }
    }

    // Generate R2 paths
    const timestamp = Date.now();
    const { data: artistData } = await supabase
      .from('artists')
      .select('name')
      .eq('id', artistId)
      .single();

    const artistName = artistData?.name || 'unknown';
    const cleanArtistName = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extension = audioFile.name.split('.').pop();
    const audioPath = `tracks/${cleanArtistName}/${cleanTitle}-${timestamp}.${extension}`;

    // Upload audio file to R2
    const { uploadToR2 } = await import('@/lib/r2');
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await uploadToR2(audioPath, audioBuffer, audioFile.type);

    // Upload cover image if provided
    let coverArtUrl: string | null = null;
    if (coverImage) {
      const coverExtension = coverImage.name.split('.').pop();
      const coverPath = `covers/${cleanArtistName}/${cleanTitle}-${timestamp}.${coverExtension}`;
      const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
      await uploadToR2(coverPath, coverBuffer, coverImage.type);
      coverArtUrl = coverPath;
    }

    // Parse tags
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    // Create track in database
    const trackData: any = {
      title,
      artist_id: artistId,
      album_id: albumId || null,
      audio_url: audioPath,
      duration_ms,
      explicit,
      genres: genreNames.length > 0 ? genreNames : null,
      lyrics: description, // Using description as lyrics/notes
      released_at: releaseDate || null,
      cover_art_url: coverArtUrl,
      popularity: 50,
      play_count: 0,
    };

    const { data: track, error } = await supabase
      .from('tracks')
      .insert(trackData)
      .select(`
        *,
        artists!tracks_artist_id_fkey(id, name, avatar_url),
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ track }, { status: 201 });
  } catch (error: any) {
    console.error('Create track error:', error);
    return NextResponse.json(
      { error: 'Failed to create track', details: error.message },
      { status: 500 }
    );
  }
}
