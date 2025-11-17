import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { apiSuccess, apiError, apiServerError, apiValidationError, withErrorHandling } from '@/lib/api-response';

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
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate admin
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const permissionError = requirePermission(adminUser, 'content.create');
  if (permissionError) return permissionError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e: any) {
    console.error('FormData parse error:', e);
    return apiValidationError('Invalid form data - ensure you are sending multipart/form-data');
  }

  // Get form fields
  const audioFile = formData.get('audioFile') as File | null;
  const title = formData.get('title') as string;
  const artistId = formData.get('artistId') as string;
  const albumId = formData.get('albumId') as string | null;
  const duration_ms_str = formData.get('duration_ms') as string;
  const explicit = formData.get('explicit') === 'true';
  const description = formData.get('description') as string || '';
  const tags = formData.get('tags') as string || '';
  const releaseDate = formData.get('releaseDate') as string;
  const genreIdsStr = formData.get('genreIds') as string;
  const coverImage = formData.get('coverImage') as File | null;

  // Validate required fields
  if (!audioFile) {
    return apiValidationError('Audio file is required');
  }
  if (!title) {
    return apiValidationError('Track title is required');
  }
  if (!artistId) {
    return apiValidationError('Artist is required');
  }

  const duration_ms = parseInt(duration_ms_str);
  if (isNaN(duration_ms) || duration_ms <= 0) {
    return apiValidationError('Valid track duration is required');
  }

  // Validate audio file
  const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
  if (!validAudioTypes.includes(audioFile.type)) {
    return apiValidationError(`Invalid audio file type. Supported: ${validAudioTypes.join(', ')}`);
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (audioFile.size > maxSize) {
    return apiValidationError('Audio file too large. Maximum size is 100MB');
  }

  // Parse genre IDs
  let genreIds: string[] = [];
  try {
    genreIds = genreIdsStr ? JSON.parse(genreIdsStr) : [];
  } catch (e) {
    console.warn('Failed to parse genreIds:', e);
    // Continue without genres rather than failing
  }

  try {
    // Get genre names from IDs
    const genreNames: string[] = [];
    if (genreIds.length > 0) {
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select('name')
        .in('id', genreIds);

      if (genresError) {
        console.error('Genre fetch error:', genresError);
        // Continue without genres
      } else if (genresData) {
        genreNames.push(...genresData.map(g => g.name));
      }
    }

    // Verify artist exists
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('name')
      .eq('id', artistId)
      .single();

    if (artistError || !artistData) {
      return apiValidationError('Artist not found');
    }

    // Generate R2 paths
    const timestamp = Date.now();
    const artistName = artistData.name || 'unknown';
    const cleanArtistName = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extension = audioFile.name.split('.').pop() || 'mp3';
    const audioPath = `tracks/${cleanArtistName}/${cleanTitle}-${timestamp}.${extension}`;

    // Upload audio file to R2
    console.log('Uploading audio file to R2:', audioPath);
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    } catch (e: any) {
      console.error('Failed to read audio file:', e);
      return apiServerError('Failed to read audio file');
    }

    const { uploadToR2 } = await import('@/lib/r2');
    try {
      await uploadToR2(audioPath, audioBuffer, audioFile.type);
    } catch (e: any) {
      console.error('R2 upload error:', e);
      return apiServerError('Failed to upload audio file to storage: ' + e.message);
    }

    // Upload cover image if provided
    let coverArtUrl: string | null = null;
    if (coverImage && coverImage.size > 0) {
      const coverExtension = coverImage.name.split('.').pop() || 'jpg';
      const coverPath = `covers/${cleanArtistName}/${cleanTitle}-${timestamp}.${coverExtension}`;

      try {
        const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
        await uploadToR2(coverPath, coverBuffer, coverImage.type);
        coverArtUrl = coverPath;
      } catch (e: any) {
        console.error('Cover upload error:', e);
        // Continue without cover rather than failing
      }
    }

    // Create track in database
    const trackData: any = {
      title,
      artist_id: artistId,
      album_id: albumId || null,
      audio_url: audioPath,
      duration_ms,
      explicit,
      genres: genreNames.length > 0 ? genreNames : null,
      lyrics: description || null,
      released_at: releaseDate || null,
      cover_art_url: coverArtUrl,
      popularity: 50,
      play_count: 0,
    };

    console.log('Creating track in database:', trackData);
    const { data: track, error: dbError } = await supabase
      .from('tracks')
      .insert(trackData)
      .select(`
        *,
        artists!tracks_artist_id_fkey(id, name, avatar_url),
        albums!tracks_album_id_fkey(id, title, cover_art_url)
      `)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!track) {
      throw new Error('Track was not created');
    }

    console.log('Track created successfully:', track.id);
    return apiSuccess({ track, success: true }, 201);

  } catch (error: any) {
    console.error('Create track error:', error);
    return apiServerError('Failed to create track: ' + error.message, error);
  }
});
