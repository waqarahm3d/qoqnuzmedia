import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    const supabase = createServerClient();
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
 * Process mood detection for a track
 * This is a placeholder - you would integrate with a real mood detection service/ML model
 */
async function processMoodDetection(trackId: string, supabase: any) {
  // Fetch track details
  const { data: track } = await supabase
    .from('tracks')
    .select('id, title, audio_url, bpm, energy_level')
    .eq('id', trackId)
    .single();

  if (!track) {
    throw new Error('Track not found');
  }

  // Placeholder: In production, you would:
  // 1. Download the audio file
  // 2. Extract audio features (using librosa, essentia, or a cloud service)
  // 3. Run ML model to detect mood
  // 4. Return mood classification

  // For now, return a mock result based on energy/BPM
  let mood = 'neutral';
  const energy = track.energy_level || 0.5;
  const bpm = track.bpm || 120;

  if (energy > 0.7 && bpm > 130) {
    mood = 'energetic';
  } else if (energy > 0.6 && bpm > 120) {
    mood = 'happy';
  } else if (energy < 0.4 && bpm < 100) {
    mood = 'calm';
  } else if (energy < 0.3) {
    mood = 'sad';
  }

  // Update track with detected mood
  await supabase
    .from('tracks')
    .update({ mood })
    .eq('id', trackId);

  return {
    mood,
    confidence: 0.85,
    method: 'rule-based',
  };
}

/**
 * Process energy analysis for a track
 */
async function processEnergyAnalysis(trackId: string, supabase: any) {
  // Fetch track details
  const { data: track } = await supabase
    .from('tracks')
    .select('id, title, audio_url, bpm')
    .eq('id', trackId)
    .single();

  if (!track) {
    throw new Error('Track not found');
  }

  // Placeholder: In production, analyze audio features
  // For now, calculate based on BPM
  const bpm = track.bpm || 120;
  let energyLevel = 0.5;

  if (bpm < 80) {
    energyLevel = 0.2;
  } else if (bpm < 100) {
    energyLevel = 0.4;
  } else if (bpm < 120) {
    energyLevel = 0.6;
  } else if (bpm < 140) {
    energyLevel = 0.8;
  } else {
    energyLevel = 0.95;
  }

  // Update track with energy level
  await supabase
    .from('tracks')
    .update({ energy_level: energyLevel })
    .eq('id', trackId);

  return {
    energy_level: energyLevel,
    confidence: 0.8,
    method: 'bpm-based',
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

    const supabase = createServerClient();

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
