import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/diagnostics
 * Get system diagnostics and health checks
 */
export async function GET(request: NextRequest) {
  try {
    const { response, supabase } = await requireAdmin(request);
    if (response) return response;

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: [],
      errors: [],
      warnings: [],
      info: [],
    };

    // 1. Check tracks table columns
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'tracks'
    }).maybeSingle();

    // Fallback: query tracks to check columns exist
    const { data: sampleTrack, error: sampleError } = await supabase
      .from('tracks')
      .select('id, mood_tags, activity_tags, energy_level, valence, tempo_bpm, audio_url')
      .limit(1)
      .maybeSingle();

    if (sampleError) {
      diagnostics.errors.push({
        category: 'Database',
        message: 'Cannot query tracks table',
        details: sampleError.message,
        fix: 'Check database connection and RLS policies'
      });
    } else {
      diagnostics.checks.push({
        name: 'Tracks table accessible',
        status: 'pass'
      });
    }

    // 2. Check mood_presets table
    const { data: moodPresets, error: moodPresetsError } = await supabase
      .from('mood_presets')
      .select('name, tags, is_active')
      .eq('is_active', true);

    if (moodPresetsError) {
      diagnostics.errors.push({
        category: 'Database',
        message: 'Cannot query mood_presets table',
        details: moodPresetsError.message,
        fix: 'Ensure mood_presets table exists. Run migration: supabase/migrations/*_smart_playlists.sql'
      });
    } else if (!moodPresets || moodPresets.length === 0) {
      diagnostics.warnings.push({
        category: 'Configuration',
        message: 'No active mood presets found',
        details: 'Mood discovery will fall back to direct tag matching',
        fix: 'Insert mood presets into mood_presets table or ensure is_active = true'
      });
    } else {
      diagnostics.checks.push({
        name: 'Mood presets configured',
        status: 'pass',
        count: moodPresets.length
      });

      // Check preset tags
      moodPresets.forEach((preset: any) => {
        if (!preset.tags || preset.tags.length === 0) {
          diagnostics.warnings.push({
            category: 'Configuration',
            message: `Mood preset "${preset.name}" has no tags`,
            details: 'This preset will not match any tracks',
            fix: `Update mood_presets SET tags = ARRAY['${preset.name}'] WHERE name = '${preset.name}'`
          });
        }
      });
    }

    // 3. Check activity_presets table
    const { data: activityPresets, error: activityPresetsError } = await supabase
      .from('activity_presets')
      .select('name, tags, is_active')
      .eq('is_active', true);

    if (activityPresetsError) {
      diagnostics.errors.push({
        category: 'Database',
        message: 'Cannot query activity_presets table',
        details: activityPresetsError.message,
        fix: 'Ensure activity_presets table exists. Run migration: supabase/migrations/*_smart_playlists.sql'
      });
    } else if (!activityPresets || activityPresets.length === 0) {
      diagnostics.warnings.push({
        category: 'Configuration',
        message: 'No active activity presets found',
        details: 'Activity discovery will not work',
        fix: 'Insert activity presets into activity_presets table'
      });
    } else {
      diagnostics.checks.push({
        name: 'Activity presets configured',
        status: 'pass',
        count: activityPresets.length
      });
    }

    // 4. Check track mood data
    const { count: totalTracks } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true });

    const { count: analyzedTracks } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .not('mood_tags', 'is', null)
      .neq('mood_tags', '{}');

    const { count: tracksWithAudio } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .not('audio_url', 'is', null);

    const { count: pendingAnalysis } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .or('mood_tags.is.null,mood_tags.eq.{}')
      .not('audio_url', 'is', null);

    diagnostics.info.push({
      category: 'Track Statistics',
      data: {
        totalTracks: totalTracks || 0,
        analyzedTracks: analyzedTracks || 0,
        tracksWithAudio: tracksWithAudio || 0,
        pendingAnalysis: pendingAnalysis || 0,
        percentAnalyzed: totalTracks
          ? Math.round(((analyzedTracks || 0) / totalTracks) * 100)
          : 0
      }
    });

    if (analyzedTracks === 0) {
      diagnostics.warnings.push({
        category: 'Mood Analysis',
        message: 'No tracks have been analyzed for mood',
        details: 'Discover page mood sections will show empty results',
        fix: 'Go to Admin > Mood Analysis and run batch analysis'
      });
    }

    // 5. Check mood tag matching
    const moods = ['happy', 'sad', 'energetic', 'chill', 'focused', 'romantic', 'angry', 'peaceful'];
    const moodCounts: Record<string, number> = {};

    for (const mood of moods) {
      const { count } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .contains('mood_tags', [mood]);

      moodCounts[mood] = count || 0;
    }

    const moodsWithTracks = Object.entries(moodCounts).filter(([, count]) => count > 0);
    const moodsWithoutTracks = Object.entries(moodCounts).filter(([, count]) => count === 0);

    if (moodsWithoutTracks.length > 0 && analyzedTracks && analyzedTracks > 0) {
      diagnostics.warnings.push({
        category: 'Mood Distribution',
        message: `Some moods have no matching tracks: ${moodsWithoutTracks.map(([m]) => m).join(', ')}`,
        details: 'These moods will show empty results on discover page',
        fix: 'This may be normal based on your music catalog'
      });
    }

    diagnostics.info.push({
      category: 'Mood Distribution',
      data: moodCounts
    });

    // 6. Check environment variables
    const envChecks = [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', value: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', value: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
      { name: 'NEXT_PUBLIC_APP_URL', value: !!process.env.NEXT_PUBLIC_APP_URL },
    ];

    envChecks.forEach(({ name, value }) => {
      if (!value) {
        diagnostics.errors.push({
          category: 'Environment',
          message: `Missing environment variable: ${name}`,
          details: 'This may cause API failures',
          fix: `Add ${name} to your .env.local file`
        });
      }
    });

    // 7. Test mood preset matching
    if (moodPresets && moodPresets.length > 0) {
      for (const preset of moodPresets) {
        if (preset.tags && preset.tags.length > 0) {
          const { count } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .overlaps('mood_tags', preset.tags);

          if (count === 0 && analyzedTracks && analyzedTracks > 0) {
            diagnostics.warnings.push({
              category: 'Preset Matching',
              message: `Mood preset "${preset.name}" matches 0 tracks`,
              details: `Tags: ${preset.tags.join(', ')}`,
              fix: 'Check if preset tags match the tags generated by mood analysis'
            });
          }
        }
      }
    }

    // Summary
    diagnostics.summary = {
      totalChecks: diagnostics.checks.length,
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      status: diagnostics.errors.length > 0
        ? 'error'
        : diagnostics.warnings.length > 0
          ? 'warning'
          : 'healthy'
    };

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
