import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { detectTrackMood, updateTrackMood } from '@/lib/ml';
import { getMediaUrl } from '@/lib/media-utils';

/**
 * Background task worker endpoint
 * Processes queued tasks like mood detection, energy analysis, etc.
 * Should be called by a cron job or continuously running worker
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized (use a secret token)
    const authHeader = request.headers.get('authorization');
    const workerSecret = process.env.WORKER_SECRET || 'your-worker-secret';

    if (authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();
    const { taskType, batchSize = 10 } = body;

    // Get next batch of pending tasks
    const { data: tasks, error } = await supabase.rpc('get_next_background_task', {
      p_task_type: taskType || null,
    });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending tasks',
        processed: 0,
      });
    }

    const processedTasks = [];

    // Process each task
    for (const task of tasks.slice(0, batchSize)) {
      try {
        let result;

        switch (task.task_type) {
          case 'mood_detection':
            result = await processMoodDetection(task.entity_id, supabase);
            break;
          case 'energy_analysis':
            result = await processEnergyAnalysis(task.entity_id, supabase);
            break;
          case 'genre_classification':
            result = await processGenreClassification(task.entity_id, supabase);
            break;
          default:
            throw new Error(`Unknown task type: ${task.task_type}`);
        }

        // Mark task as completed
        await supabase.rpc('complete_background_task', {
          p_task_id: task.id,
          p_success: true,
          p_result: result,
        });

        processedTasks.push({
          id: task.id,
          type: task.task_type,
          status: 'completed',
        });
      } catch (taskError: any) {
        console.error(`Error processing task ${task.id}:`, taskError);

        // Mark task as failed
        await supabase.rpc('complete_background_task', {
          p_task_id: task.id,
          p_success: false,
          p_error_message: taskError.message,
        });

        processedTasks.push({
          id: task.id,
          type: task.task_type,
          status: 'failed',
          error: taskError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedTasks.length,
      tasks: processedTasks,
    });
  } catch (error: any) {
    console.error('Worker error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process mood detection for a track using ML model
 * Extracts audio features and classifies mood
 */
async function processMoodDetection(trackId: string, supabase: any) {
  // Fetch track details
  const { data: track } = await supabase
    .from('tracks')
    .select('id, title, audio_url')
    .eq('id', trackId)
    .single();

  if (!track) {
    throw new Error('Track not found');
  }

  if (!track.audio_url) {
    throw new Error('Track has no audio URL');
  }

  // Get full URL for audio file
  const audioUrl = getMediaUrl(track.audio_url);

  if (!audioUrl) {
    throw new Error('Could not resolve audio URL');
  }

  // Ensure environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Run ML mood detection
  const result = await detectTrackMood(
    trackId,
    audioUrl,
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  if (!result.success) {
    throw new Error(result.error || 'Mood detection failed');
  }

  // Update track with detected mood and features
  await updateTrackMood(supabase, trackId, result);

  return {
    primaryMood: result.prediction.primaryMood,
    confidence: result.prediction.confidence,
    moodTags: result.moodTags,
    activityTags: result.activityTags,
    energyLevel: result.prediction.energyLevel,
    valence: result.prediction.valence,
    danceability: result.prediction.danceability,
    acousticness: result.prediction.acousticness,
    instrumentalness: result.prediction.instrumentalness,
    tempo: result.prediction.audioFeatures.tempo,
    processingTimeMs: result.processingTimeMs,
    method: 'ml-audio-analysis',
  };
}

/**
 * Process energy analysis for a track using ML audio analysis
 */
async function processEnergyAnalysis(trackId: string, supabase: any) {
  // Fetch track details
  const { data: track } = await supabase
    .from('tracks')
    .select('id, title, audio_url')
    .eq('id', trackId)
    .single();

  if (!track) {
    throw new Error('Track not found');
  }

  if (!track.audio_url) {
    throw new Error('Track has no audio URL');
  }

  // Get full URL for audio file
  const audioUrl = getMediaUrl(track.audio_url);

  if (!audioUrl) {
    throw new Error('Could not resolve audio URL');
  }

  // Ensure environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Run ML mood detection (which includes energy analysis)
  const result = await detectTrackMood(
    trackId,
    audioUrl,
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  if (!result.success) {
    throw new Error(result.error || 'Energy analysis failed');
  }

  // Update track with energy level
  await supabase
    .from('tracks')
    .update({
      energy_level: result.prediction.energyLevel,
      tempo_bpm: Math.round(result.prediction.audioFeatures.tempo),
      last_metadata_update: new Date().toISOString()
    })
    .eq('id', trackId);

  return {
    energy_level: result.prediction.energyLevel,
    tempo: result.prediction.audioFeatures.tempo,
    confidence: result.prediction.confidence,
    processingTimeMs: result.processingTimeMs,
    method: 'ml-audio-analysis',
  };
}

/**
 * Process genre classification for a track
 */
async function processGenreClassification(trackId: string, supabase: any) {
  // Placeholder: In production, use ML model for genre classification
  // For now, just return success
  return {
    genres: [],
    confidence: 0.0,
    method: 'manual',
  };
}

/**
 * GET endpoint to check worker status
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const workerSecret = process.env.WORKER_SECRET || 'your-worker-secret';

    if (authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get task statistics
    const { data: stats } = await supabase
      .from('background_tasks')
      .select('status, task_type')
      .order('created_at', { ascending: false })
      .limit(1000);

    const summary: any = {
      total: stats?.length || 0,
      by_status: {},
      by_type: {},
    };

    stats?.forEach((task) => {
      summary.by_status[task.status] = (summary.by_status[task.status] || 0) + 1;
      summary.by_type[task.task_type] =
        (summary.by_type[task.task_type] || 0) + 1;
    });

    return NextResponse.json({
      status: 'healthy',
      summary,
    });
  } catch (error: any) {
    console.error('Worker status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
