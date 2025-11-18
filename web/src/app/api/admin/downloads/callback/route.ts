import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/downloads/callback
 * Webhook callback from audio processor service
 * Updates job status and progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, status, progress, error_message, downloaded_files, metadata } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update job in database
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      if (status === 'downloading') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (progress !== undefined) {
      updateData.progress_percent = progress;
      if (progress.current_item) {
        updateData.current_item = progress.current_item;
      }
      if (progress.completed_items !== undefined) {
        updateData.completed_items = progress.completed_items;
      }
      if (progress.total_items !== undefined) {
        updateData.total_items = progress.total_items;
      }
      if (progress.failed_items !== undefined) {
        updateData.failed_items = progress.failed_items;
      }
    }

    if (error_message) {
      updateData.error_message = error_message;
    }

    if (downloaded_files) {
      updateData.downloaded_files = downloaded_files;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data: job, error: updateError } = await supabase
      .from('download_jobs')
      .update(updateData)
      .eq('id', job_id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update job:', updateError);
      throw updateError;
    }

    // If files were downloaded, create downloaded_tracks records
    if (downloaded_files && Array.isArray(downloaded_files) && downloaded_files.length > 0) {
      const tracksToInsert = downloaded_files.map((file: any) => ({
        download_job_id: job_id,
        title: file.title || 'Unknown',
        artist: file.artist || 'Unknown Artist',
        album: file.album || null,
        duration_ms: file.duration_ms || 0,
        source_type: file.source_type || job.source_type,
        source_url: file.source_url || file.url,
        source_id: file.source_id || file.id,
        file_path: file.file_path,
        file_size_bytes: file.file_size_bytes || 0,
        audio_format: file.audio_format || 'mp3',
        bitrate: file.bitrate || 320,
        metadata: file.metadata || {},
        processed: false,
        uploaded_to_platform: false,
      }));

      const { error: tracksError } = await supabase
        .from('downloaded_tracks')
        .insert(tracksToInsert);

      if (tracksError) {
        console.error('Failed to insert downloaded tracks:', tracksError);
        // Don't fail the whole callback, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: job,
    });

  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process callback', details: error.message },
      { status: 500 }
    );
  }
}
