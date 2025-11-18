import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper to create Supabase client from request cookies
function createClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Admin endpoint to manually trigger automation tasks
 * Useful for testing or forcing an immediate update
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { task } = body; // 'all', 'smart_playlists', 'trending', 'listening_stats'

    const results: any = {
      triggered_at: new Date().toISOString(),
      tasks: [],
    };

    try {
      switch (task) {
        case 'all':
          // Trigger all automations
          const { error: allError } = await supabase.rpc('trigger_all_automations');
          if (allError) throw allError;
          results.tasks.push({
            name: 'all_automations',
            status: 'success',
            message: 'All automations triggered successfully',
          });
          break;

        case 'smart_playlists':
          // Generate smart playlists for all users
          const { error: playlistError } = await supabase.rpc('generate_all_smart_playlists');
          if (playlistError) throw playlistError;
          results.tasks.push({
            name: 'smart_playlists',
            status: 'success',
            message: 'Smart playlists generated for all users',
          });
          break;

        case 'trending':
          // Calculate trending tracks
          const { error: trendingError } = await supabase.rpc('calculate_trending_tracks');
          if (trendingError) throw trendingError;
          results.tasks.push({
            name: 'trending',
            status: 'success',
            message: 'Trending tracks calculated',
          });
          break;

        case 'listening_stats':
          // Aggregate listening history
          const { error: statsError } = await supabase.rpc('aggregate_all_user_listening_history');
          if (statsError) throw statsError;
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

/**
 * GET endpoint to view automation status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('Auth check:', { user: user?.email, authError });

    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json({
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    console.log('Admin check:', { adminCheck, adminError, userId: user.id });

    if (!adminCheck) {
      console.error('Admin check failed:', adminError);
      return NextResponse.json({
        error: 'Forbidden - Admin access required',
        details: adminError?.message || 'User not in admin_users table'
      }, { status: 403 });
    }

    // Get cron job status
    const { data: cronJobs, error: cronError } = await supabase.rpc('get_cron_job_status');

    if (cronError) {
      console.error('Error fetching cron status:', cronError);
    }

    // Get background task stats
    const { data: taskStats } = await supabase
      .from('background_tasks')
      .select('status, task_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const taskSummary: any = {
      total: taskStats?.length || 0,
      by_status: {},
      by_type: {},
      recent_tasks: taskStats?.slice(0, 10) || [],
    };

    taskStats?.forEach((task) => {
      taskSummary.by_status[task.status] =
        (taskSummary.by_status[task.status] || 0) + 1;
      taskSummary.by_type[task.task_type] =
        (taskSummary.by_type[task.task_type] || 0) + 1;
    });

    // Get smart playlist stats
    const { data: playlistStats } = await supabase
      .from('smart_playlists')
      .select('playlist_type, generated_at, expires_at')
      .order('generated_at', { ascending: false });

    const playlistSummary: any = {
      total: playlistStats?.length || 0,
      by_type: {},
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
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      automation_status: {
        cron_jobs: cronJobs || [],
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
