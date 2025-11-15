/**
 * Upload API Route
 * Handles file upload to R2 and creates database entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artistName = formData.get('artistName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!title || !artistName) {
      return NextResponse.json({ error: 'Title and artist name required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('audio')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Use admin client to bypass RLS
    const supabase = createAdminSupabaseClient();

    console.log('Creating/finding artist:', artistName);

    // Create or get artist
    let artistId: string;

    const { data: existingArtist, error: findError } = await supabase
      .from('artists')
      .select('id')
      .eq('name', artistName)
      .maybeSingle();

    if (findError) {
      console.error('Error finding artist:', findError);
    }

    if (existingArtist) {
      artistId = existingArtist.id;
      console.log('Using existing artist:', artistId);
    } else {
      console.log('Creating new artist...');
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: artistName,
          bio: `Artist: ${artistName}`,
          verified: false,
          monthly_listeners: 0,
          genres: ['Other'],
        })
        .select('id')
        .single();

      if (artistError) {
        console.error('Artist creation error:', artistError);
        return NextResponse.json({
          error: 'Failed to create artist',
          details: artistError.message
        }, { status: 500 });
      }

      if (!newArtist) {
        return NextResponse.json({ error: 'Artist created but no data returned' }, { status: 500 });
      }

      artistId = newArtist.id;
      console.log('Created new artist:', artistId);
    }

    // Generate clean filename
    const timestamp = Date.now();
    const cleanArtistName = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extension = file.name.split('.').pop();
    const r2Path = `tracks/${cleanArtistName}/${cleanTitle}-${timestamp}.${extension}`;

    console.log('Uploading to R2:', r2Path);

    // Upload to R2
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(r2Path, fileBuffer, file.type);

    console.log('R2 upload successful');
    console.log('Creating track record...');

    // Create track in database
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: title,
        artist_id: artistId,
        duration_ms: 180000,
        audio_url: r2Path,
        explicit: false,
        genres: ['Other'],
        play_count: 0,
        popularity: 50,
      })
      .select('id, title, audio_url')
      .single();

    if (trackError) {
      console.error('Track creation error:', trackError);
      return NextResponse.json({
        error: 'Failed to create track',
        details: trackError.message
      }, { status: 500 });
    }

    if (!track) {
      return NextResponse.json({ error: 'Track created but no data returned' }, { status: 500 });
    }

    console.log('Track created successfully:', track.id);

    return NextResponse.json({
      success: true,
      track: {
        id: track.id,
        title: track.title,
        artist: artistName,
        audio_url: track.audio_url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
