import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { apiSuccess, apiError, apiServerError, apiValidationError } from '@/lib/api-response';

const AUDIO_PROCESSOR_URL = process.env.AUDIO_PROCESSOR_URL || 'http://localhost:8000';
const AUDIO_PROCESSOR_API_KEY = process.env.AUDIO_PROCESSOR_API_KEY || '';

/**
 * GET /api/admin/downloads
 * Get all download jobs with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || '';
  const sourceType = searchParams.get('source_type') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('download_jobs')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data: jobs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get download jobs error:', error);
    return apiServerError('Failed to fetch download jobs', error);
  }
}

/**
 * POST /api/admin/downloads
 * Submit a new download job
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { url, source_type, download_type, options } = body;

    // Validate required fields
    if (!url) {
      return apiValidationError('URL is required');
    }
    if (!source_type || !['youtube', 'soundcloud'].includes(source_type)) {
      return apiValidationError('Valid source_type is required (youtube or soundcloud)');
    }
    if (!download_type || !['single', 'playlist', 'channel', 'user'].includes(download_type)) {
      return apiValidationError('Valid download_type is required (single, playlist, channel, user)');
    }

    // Check whitelist if enabled
    const whitelistEnabled = process.env.DOWNLOAD_WHITELIST_ENABLED === 'true';
    if (whitelistEnabled) {
      // Extract identifier from URL
      let identifier: string | null = null;

      if (source_type === 'youtube') {
        // Extract channel ID from YouTube URL
        // Supports: /channel/UC..., /@username, /c/channelname
        const channelMatch = url.match(/\/channel\/(UC[\w-]+)/);
        const handleMatch = url.match(/\/@([\w-]+)/);
        const customMatch = url.match(/\/c\/([\w-]+)/);

        identifier = channelMatch?.[1] || handleMatch?.[1] || customMatch?.[1] || null;
      } else if (source_type === 'soundcloud') {
        // Extract username from SoundCloud URL
        // Supports: soundcloud.com/username
        const userMatch = url.match(/soundcloud\.com\/([\w-]+)/);
        identifier = userMatch?.[1] || null;
      }

      if (!identifier) {
        return apiValidationError('Unable to extract channel/user identifier from URL for whitelist check');
      }

      // Check if identifier is in whitelist
      const { data: whitelistEntries } = await supabase
        .from('download_whitelist')
        .select('*')
        .eq('source_type', source_type === 'youtube' ? 'youtube_channel' : 'soundcloud_user')
        .eq('enabled', true);

      if (!whitelistEntries || whitelistEntries.length === 0) {
        return apiError('Whitelist is enabled but no entries found. Please add approved channels/users first.', 403);
      }

      // Check if extracted identifier matches any whitelist entry
      const isWhitelisted = whitelistEntries.some(
        entry => entry.identifier === identifier || url.includes(entry.identifier)
      );

      if (!isWhitelisted) {
        return apiError(
          `This ${source_type === 'youtube' ? 'channel' : 'user'} is not whitelisted. Only approved channels/users can be downloaded.`,
          403
        );
      }
    }

    // Create job in database
    const { data: job, error: dbError } = await supabase
      .from('download_jobs')
      .insert({
        url,
        source_type,
        download_type,
        status: 'pending',
        options: options || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!job) {
      throw new Error('Job was not created');
    }

    // Submit job to audio processor service
    try {
      const audioProcessorResponse = await fetch(`${AUDIO_PROCESSOR_URL}/api/v1/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AUDIO_PROCESSOR_API_KEY,
        },
        body: JSON.stringify({
          job_id: job.id,
          url,
          source_type,
          download_type,
          options: options || {},
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/downloads/callback`,
        }),
      });

      if (!audioProcessorResponse.ok) {
        const errorData = await audioProcessorResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit job to audio processor');
      }

      const processorData = await audioProcessorResponse.json();

      // Update job with celery task ID
      if (processorData.celery_task_id) {
        await supabase
          .from('download_jobs')
          .update({
            celery_task_id: processorData.celery_task_id,
            status: 'queued',
          })
          .eq('id', job.id);
      }

      return apiSuccess({
        job: {
          ...job,
          celery_task_id: processorData.celery_task_id,
          status: 'queued',
        },
        success: true
      }, 201);

    } catch (processorError: any) {
      console.error('Audio processor error:', processorError);

      // Update job status to failed
      await supabase
        .from('download_jobs')
        .update({
          status: 'failed',
          error_message: processorError.message,
        })
        .eq('id', job.id);

      return apiError('Failed to submit job to audio processor: ' + processorError.message, 500);
    }

  } catch (error: any) {
    console.error('Create download job error:', error);
    return apiServerError('Failed to create download job', error);
  }
}

/**
 * DELETE /api/admin/downloads/cleanup
 * Clean up old or failed jobs
 */
export async function DELETE(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'failed';
  const daysOld = parseInt(searchParams.get('days_old') || '30');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('download_jobs')
      .delete()
      .eq('status', status)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    return apiSuccess({ success: true, message: `Cleaned up ${status} jobs older than ${daysOld} days` });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return apiServerError('Failed to cleanup jobs', error);
  }
}
