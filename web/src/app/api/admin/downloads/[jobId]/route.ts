import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { apiSuccess, apiError, apiServerError, apiNotFound } from '@/lib/api-response';

const AUDIO_PROCESSOR_URL = process.env.AUDIO_PROCESSOR_URL || 'http://localhost:8000';
const AUDIO_PROCESSOR_API_KEY = process.env.AUDIO_PROCESSOR_API_KEY || '';

interface RouteParams {
  params: {
    jobId: string;
  };
}

/**
 * GET /api/admin/downloads/[jobId]
 * Get specific download job details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { jobId } = params;

  try {
    const { data: job, error } = await supabase
      .from('download_jobs')
      .select(`
        *,
        downloaded_tracks (*)
      `)
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Download job not found');
      }
      throw error;
    }

    // Optionally fetch real-time status from audio processor
    if (job.celery_task_id && job.status !== 'completed' && job.status !== 'failed') {
      try {
        const statusResponse = await fetch(
          `${AUDIO_PROCESSOR_URL}/api/v1/jobs/${job.celery_task_id}`,
          {
            headers: {
              'X-API-Key': AUDIO_PROCESSOR_API_KEY,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          job.current_item = statusData.current_item || job.current_item;
          job.progress_percent = statusData.progress_percent || job.progress_percent;
        }
      } catch (error) {
        console.warn('Failed to fetch real-time status:', error);
      }
    }

    return apiSuccess({ job });
  } catch (error: any) {
    console.error('Get download job error:', error);
    return apiServerError('Failed to fetch download job', error);
  }
}

/**
 * PATCH /api/admin/downloads/[jobId]
 * Update download job (e.g., cancel)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { jobId } = params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      // Cancel job in audio processor
      const { data: job } = await supabase
        .from('download_jobs')
        .select('celery_task_id')
        .eq('id', jobId)
        .single();

      if (job?.celery_task_id) {
        try {
          await fetch(
            `${AUDIO_PROCESSOR_URL}/api/v1/jobs/${job.celery_task_id}/cancel`,
            {
              method: 'POST',
              headers: {
                'X-API-Key': AUDIO_PROCESSOR_API_KEY,
              },
            }
          );
        } catch (error) {
          console.warn('Failed to cancel job in audio processor:', error);
        }
      }

      // Update status in database
      const { data: updatedJob, error } = await supabase
        .from('download_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      return apiSuccess({ job: updatedJob });
    }

    return apiError('Invalid action', 400);
  } catch (error: any) {
    console.error('Update download job error:', error);
    return apiServerError('Failed to update download job', error);
  }
}

/**
 * DELETE /api/admin/downloads/[jobId]
 * Delete a download job
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { jobId } = params;

  try {
    const { error } = await supabase
      .from('download_jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;

    return apiSuccess({ success: true, message: 'Download job deleted' });
  } catch (error: any) {
    console.error('Delete download job error:', error);
    return apiServerError('Failed to delete download job', error);
  }
}
