import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/automation/trigger
 * Get automation system status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user, adminUser, response, supabase } = await requireAdmin(request);
    if (response) return response;

    // Get cron job status
    let cronJobs: any[] = [];
    try {
      const { data } = await supabase.rpc('get_cron_job_status');
      cronJobs = data || [];
    } catch (error) {
      console.log('Cron jobs not available:', error);
      // Not a critical error - cron might not be installed
    }

    // Get background task stats
    const { data: taskStats } = await supabase
      .from('background_tasks')
      .select('status, task_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const taskSummary = {
      total: taskStats?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      recent_tasks: taskStats?.slice(0, 10) || [],
    };

    taskStats?.forEach((task) => {
      taskSummary.by_status[task.status] = (taskSummary.by_status[task.status] || 0) + 1;
      taskSummary.by_type[task.task_type] = (taskSummary.by_type[task.task_type] || 0) + 1;
    });

    // Get smart playlist stats
    const { data: playlistStats } = await supabase
      .from('smart_playlists')
      .select('playlist_type, generated_at, expires_at')
      .order('generated_at', { ascending: false });

    const playlistSummary = {
      total: playlistStats?.length || 0,
      by_type: {} as Record<string, number>,
      latest_generation: playlistStats?.[0]?.generated_at || null,
    };

    playlistStats?.forEach((playlist) => {
      playlistSummary.by_type[playlist.playlist_type] =
        (playlistSummary.by_type[playlist.playlist_type] || 0) + 1;
    });

    // Get trending tracks stats
    const { data: trendingStats } = await supabase
      .from('trending_tracks')
      .select('calculated_at')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      automation_status: {
        cron_jobs: cronJobs,
        background_tasks: taskSummary,
        smart_playlists: playlistSummary,
        trending_tracks: {
          last_calculated: trendingStats?.calculated_at || null,
        },
      },
    });
  } catch (error: any) {
    console.error('Automation status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation/trigger
 * Manually trigger automation tasks
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { user, adminUser, response, supabase } = await requireAdmin(request);
    if (response) return response;

    const body = await request.json();
    const { task } = body;

    const results: any = {
      triggered_at: new Date().toISOString(),
      tasks: [],
    };

    try {
      switch (task) {
        case 'all':
          await supabase.rpc('trigger_all_automations');
          results.tasks.push({
            name: 'all_automations',
            status: 'success',
            message: 'All automations triggered successfully',
          });
          break;

        case 'smart_playlists':
          await supabase.rpc('generate_all_smart_playlists');
          results.tasks.push({
            name: 'smart_playlists',
            status: 'success',
            message: 'Smart playlists generated for all users',
          });
          break;

        case 'trending':
          await supabase.rpc('calculate_trending_tracks');
          results.tasks.push({
            name: 'trending',
            status: 'success',
            message: 'Trending tracks calculated',
          });
          break;

        case 'listening_stats':
          await supabase.rpc('aggregate_all_user_listening_history');
          results.tasks.push({
            name: 'listening_stats',
            status: 'success',
            message: 'Listening statistics aggregated for all users',
          });
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid task. Valid options: all, smart_playlists, trending, listening_stats' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        ...results,
      });
    } catch (taskError: any) {
      console.error('Task execution error:', taskError);
      results.tasks.push({
        name: task,
        status: 'failed',
        error: taskError.message,
      });

      return NextResponse.json({
        success: false,
        ...results,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Automation trigger error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
