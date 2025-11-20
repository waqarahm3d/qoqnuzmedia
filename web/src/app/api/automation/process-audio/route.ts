/**
 * Audio Processing API
 * Processes tracks to create quality variants with loudness normalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { processTrack, deleteTrackVariants } from '@/lib/audio-processor';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for audio processing

/**
 * Download file from R2
 */
async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);
  const chunks: Uint8Array[] = [];

  if (response.Body) {
    // @ts-ignore - Body is a readable stream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * POST /api/automation/process-audio
 * Process a track to create quality variants
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, taskId } = body;

    if (!trackId) {
      return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Fetch track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url, duration_ms')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      console.error('Track not found:', trackError);
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (!track.audio_url) {
      return NextResponse.json({ error: 'Track has no audio file' }, { status: 400 });
    }

    console.log(`[Process Audio] Starting processing for track: ${track.title}`);

    // Process the track
    const result = await processTrack(trackId, track.audio_url, downloadFromR2);

    if (!result.success) {
      console.error(`[Process Audio] Failed:`, result.error);

      // Update task status if taskId provided
      if (taskId) {
        await supabase
          .from('background_tasks')
          .update({
            status: 'failed',
            error_message: result.error,
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId);
      }

      return NextResponse.json(
        { error: 'Audio processing failed', details: result.error },
        { status: 500 }
      );
    }

    // Update track with processing results
    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        duration_ms: result.metadata.duration || track.duration_ms,
        audio_quality_variants: result.variants.map(v => ({
          quality: v.quality,
          path: v.path,
          bitrate: v.bitrate,
        })),
        loudness_lufs: result.metadata.loudness,
        processed_at: new Date().toISOString(),
      })
      .eq('id', trackId);

    if (updateError) {
      console.error('[Process Audio] Failed to update track:', updateError);
    }

    // Update task status if taskId provided
    if (taskId) {
      await supabase
        .from('background_tasks')
        .update({
          status: 'completed',
          result: result,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    }

    console.log(`[Process Audio] Completed for track: ${track.title}`);

    return NextResponse.json({
      success: true,
      trackId,
      variants: result.variants,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('[Process Audio] Error:', error);
    return NextResponse.json(
      { error: 'Audio processing failed', details: error.message },
      { status: 500 }
    );
  }
}
