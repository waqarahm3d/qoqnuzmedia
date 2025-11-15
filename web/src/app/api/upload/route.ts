import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'qoqnuz-media';

/**
 * POST /api/upload
 * Upload an MP3 file to R2 and create database records
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const artistName = formData.get('artist_name') as string;
    const trackTitle = formData.get('track_title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!artistName || !trackTitle) {
      return NextResponse.json(
        { error: 'Artist name and track title are required' },
        { status: 400 }
      );
    }

    // Create admin Supabase client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find or create artist
    let { data: artist } = await supabase
      .from('artists')
      .select('id')
      .eq('name', artistName)
      .single();

    if (!artist) {
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert({ name: artistName })
        .select('id')
        .single();

      if (artistError) throw artistError;
      artist = newArtist;
    }

    // Generate clean filename
    const timestamp = Date.now();
    const cleanTitle = trackTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `tracks/${cleanTitle}_${timestamp}.mp3`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'audio/mpeg',
      })
    );

    // Create track record
    const audio_url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}`;

    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        artist_id: artist.id,
        audio_url,
        duration_ms: 0, // Could be calculated from file metadata
      })
      .select(`
        id,
        title,
        audio_url,
        artists!tracks_artist_id_fkey(id, name)
      `)
      .single();

    if (trackError) throw trackError;

    return NextResponse.json(
      {
        message: 'Upload successful',
        track,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
