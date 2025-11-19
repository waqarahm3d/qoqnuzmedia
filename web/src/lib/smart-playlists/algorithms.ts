/**
 * Smart Playlist Generation Algorithms
 * Auto-generate playlists based on listening patterns and track metadata
 */

import { createServerSupabaseClient } from '@/lib/supabase';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  genres?: string[];
  mood_tags?: string[];
  activity_tags?: string[];
  tempo_bpm?: number;
  energy_level?: number;
  valence?: number;
  play_count?: number;
  created_at?: string;
  [key: string]: any;
}

interface GenerationResult {
  tracks: Track[];
  metadata: {
    algorithm: string;
    generatedAt: string;
    trackCount: number;
    criteria: Record<string, any>;
  };
}

/**
 * Daily Mix - Personalized mix based on recent listening
 *
 * Algorithm:
 * 1. Get user's most played tracks (last 30 days)
 * 2. Extract common genres and artists
 * 3. Find similar tracks they haven't played recently
 * 4. Mix in some new releases
 * 5. Shuffle with variety (avoid same artist back-to-back)
 */
export async function generateDailyMix(userId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get user's recent listening history
  const { data: recentPlays } = await supabase
    .from('play_history')
    .select(`
      track_id,
      tracks (
        id, title, artist_id, genres, mood_tags,
        artists (id, name)
      )
    `)
    .eq('user_id', userId)
    .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('played_at', { ascending: false })
    .limit(100);

  if (!recentPlays || recentPlays.length === 0) {
    // Fallback: popular tracks
    return generatePopularMix(limit);
  }

  // Extract preferences
  const genreFrequency: Record<string, number> = {};
  const artistFrequency: Record<string, number> = {};
  const playedTrackIds = new Set<string>();

  recentPlays.forEach(({ tracks: track }: any) => {
    if (!track) return;

    playedTrackIds.add(track.id);

    // Count genres
    if (track.genres) {
      track.genres.forEach((genre: string) => {
        genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
      });
    }

    // Count artists
    if (track.artists) {
      artistFrequency[track.artists.id] = (artistFrequency[track.artists.id] || 0) + 1;
    }
  });

  // Get top genres
  const topGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  // Get top artists
  const topArtists = Object.entries(artistFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([artistId]) => artistId);

  // Find similar tracks from favorite genres
  let query = supabase
    .from('tracks')
    .select(`
      *,
      artists (id, name)
    `)
    .not('id', 'in', `(${Array.from(playedTrackIds).join(',')})`)
    .limit(limit);

  // Filter by genres if we have any
  if (topGenres.length > 0) {
    query = query.overlaps('genres', topGenres);
  }

  const { data: similarTracks, error } = await query;

  if (error || !similarTracks || similarTracks.length === 0) {
    return generatePopularMix(limit);
  }

  // Score tracks
  const scoredTracks = similarTracks.map((track: any) => {
    let score = 0;

    // Bonus for favorite genres
    if (track.genres) {
      track.genres.forEach((genre: string) => {
        if (topGenres.includes(genre)) {
          score += 10 * (topGenres.indexOf(genre) === 0 ? 2 : 1);
        }
      });
    }

    // Bonus for favorite artists
    if (track.artist_id && topArtists.includes(track.artist_id)) {
      score += 20;
    }

    // Bonus for popularity
    if (track.play_count) {
      score += Math.min(track.play_count / 10, 10);
    }

    // Slight bonus for newer tracks
    if (track.created_at) {
      const daysSinceCreated = (Date.now() - new Date(track.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) {
        score += 5;
      }
    }

    return { ...track, _score: score };
  });

  // Sort by score and take top tracks
  const selectedTracks = scoredTracks
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  // Shuffle with variety (avoid same artist consecutively)
  const shuffled = shuffleWithVariety(selectedTracks);

  return {
    tracks: shuffled.map(({ _score, ...track }) => track),
    metadata: {
      algorithm: 'daily_mix',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        topGenres,
        topArtistCount: topArtists.length,
        recentPlaysAnalyzed: recentPlays.length,
      },
    },
  };
}

/**
 * New For You - Recent uploads in user's favorite genres
 */
export async function generateNewForYou(userId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get user's liked genres from recent history
  const { data: likedGenres } = await supabase.rpc('get_user_favorite_genres', {
    user_id: userId,
    days_back: 60,
  });

  const genres = likedGenres?.map((g: any) => g.genre) || [];

  if (genres.length === 0) {
    // Fallback: newest tracks overall
    const { data: newTracks } = await supabase
      .from('tracks')
      .select('*, artists (id, name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    return {
      tracks: newTracks || [],
      metadata: {
        algorithm: 'new_for_you_fallback',
        generatedAt: new Date().toISOString(),
        trackCount: newTracks?.length || 0,
        criteria: {},
      },
    };
  }

  // Get played track IDs
  const { data: playedTracks } = await supabase
    .from('play_history')
    .select('track_id')
    .eq('user_id', userId)
    .gte('played_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const playedTrackIds = new Set((playedTracks || []).map(p => p.track_id));

  // Find new tracks in favorite genres, exclude already played
  const { data: newTracks } = await supabase
    .from('tracks')
    .select('*, artists (id, name)')
    .overlaps('genres', genres)
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
    .order('created_at', { ascending: false })
    .limit(limit * 2);

  const unplayedTracks = (newTracks || []).filter(track => !playedTrackIds.has(track.id)).slice(0, limit);

  return {
    tracks: unplayedTracks,
    metadata: {
      algorithm: 'new_for_you',
      generatedAt: new Date().toISOString(),
      trackCount: unplayedTracks.length,
      criteria: {
        genres,
        daysSinceRelease: 14,
      },
    },
  };
}

/**
 * Forgotten Favorites - Liked tracks not played recently
 */
export async function generateForgottenFavorites(userId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get liked tracks
  const { data: likedTracks } = await supabase
    .from('liked_tracks')
    .select(`
      track_id,
      tracks (
        *,
        artists (id, name)
      )
    `)
    .eq('user_id', userId);

  if (!likedTracks || likedTracks.length === 0) {
    return {
      tracks: [],
      metadata: {
        algorithm: 'forgotten_favorites',
        generatedAt: new Date().toISOString(),
        trackCount: 0,
        criteria: { reason: 'No liked tracks found' },
      },
    };
  }

  // Get recent play history (last 90 days)
  const { data: recentPlays } = await supabase
    .from('play_history')
    .select('track_id, played_at')
    .eq('user_id', userId)
    .gte('played_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const recentlyPlayedIds = new Set((recentPlays || []).map(p => p.track_id));

  // Filter liked tracks not played in last 90 days
  const forgotten: Track[] = likedTracks
    .filter(({ track_id }) => !recentlyPlayedIds.has(track_id))
    .map(({ tracks }) => tracks)
    .filter(track => track !== null && track !== undefined) as any;

  // Shuffle
  const shuffled = forgotten.sort(() => Math.random() - 0.5).slice(0, limit);

  return {
    tracks: shuffled,
    metadata: {
      algorithm: 'forgotten_favorites',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        totalLikedTracks: likedTracks.length,
        notPlayedSinceDays: 90,
      },
    },
  };
}

/**
 * Discovery - Tracks similar to liked songs, but unplayed
 */
export async function generateDiscovery(userId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get user's top tracks (by play count)
  const { data: topPlayed } = await supabase
    .from('play_history')
    .select('track_id, count')
    .eq('user_id', userId)
    .gte('played_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

  if (!topPlayed || topPlayed.length === 0) {
    // Fallback: trending tracks
    return generatePopularMix(limit);
  }

  // Count track plays
  const trackPlayCounts: Record<string, number> = {};
  topPlayed.forEach(({ track_id }: any) => {
    trackPlayCounts[track_id] = (trackPlayCounts[track_id] || 0) + 1;
  });

  // Get top 10 most played tracks
  const topTrackIds = Object.entries(trackPlayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  // Find similar tracks using pre-computed similarities
  const { data: similarTracks } = await supabase
    .from('track_similarities')
    .select(`
      similar_track_id,
      similarity_score,
      similar_tracks:similar_track_id (
        *,
        artists (id, name)
      )
    `)
    .in('track_id', topTrackIds)
    .gte('similarity_score', 0.6)
    .order('similarity_score', { ascending: false })
    .limit(limit * 2);

  if (!similarTracks || similarTracks.length === 0) {
    return generatePopularMix(limit);
  }

  // Get played track IDs
  const playedTrackIds = new Set(topPlayed.map(p => p.track_id));

  // Filter unplayed tracks
  const unplayedSimilar = similarTracks
    .filter((s: any) => !playedTrackIds.has(s.similar_track_id))
    .map((s: any) => s.similar_tracks)
    .filter(Boolean)
    .slice(0, limit);

  return {
    tracks: unplayedSimilar,
    metadata: {
      algorithm: 'discovery',
      generatedAt: new Date().toISOString(),
      trackCount: unplayedSimilar.length,
      criteria: {
        basedOnTopTracks: topTrackIds.length,
        minSimilarityScore: 0.6,
      },
    },
  };
}

/**
 * Mood-based playlist
 */
export async function generateMoodPlaylist(mood: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get mood preset
  const { data: moodPreset } = await supabase
    .from('mood_presets')
    .select('*')
    .eq('name', mood)
    .eq('is_active', true)
    .single();

  if (!moodPreset) {
    return {
      tracks: [],
      metadata: {
        algorithm: 'mood',
        generatedAt: new Date().toISOString(),
        trackCount: 0,
        criteria: { error: 'Mood preset not found' },
      },
    };
  }

  // Build query based on filters
  // Use overlaps instead of contains - matches tracks with ANY of the preset tags
  let query = supabase
    .from('tracks')
    .select('*, artists (id, name), albums (id, title, cover_art_url)')
    .overlaps('mood_tags', moodPreset.tags);

  // Apply filters from preset
  const filters = moodPreset.filters as any;
  if (filters) {
    if (filters.energy) {
      query = query.gte('energy_level', filters.energy[0]).lte('energy_level', filters.energy[1]);
    }
    if (filters.valence) {
      query = query.gte('valence', filters.valence[0]).lte('valence', filters.valence[1]);
    }
    if (filters.tempo) {
      query = query.gte('tempo_bpm', filters.tempo[0]).lte('tempo_bpm', filters.tempo[1]);
    }
    if (filters.acousticness) {
      query = query.gte('acousticness', filters.acousticness[0]).lte('acousticness', filters.acousticness[1]);
    }
  }

  const { data: tracks } = await query.order('popularity', { ascending: false }).limit(limit);

  return {
    tracks: (tracks || []).sort(() => Math.random() - 0.5),
    metadata: {
      algorithm: 'mood',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {
        mood,
        moodTags: moodPreset.tags,
        filters: filters || {},
      },
    },
  };
}

/**
 * Activity-based playlist
 */
export async function generateActivityPlaylist(activity: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get activity preset
  const { data: activityPreset } = await supabase
    .from('activity_presets')
    .select('*')
    .eq('name', activity)
    .eq('is_active', true)
    .single();

  if (!activityPreset) {
    return {
      tracks: [],
      metadata: {
        algorithm: 'activity',
        generatedAt: new Date().toISOString(),
        trackCount: 0,
        criteria: { error: 'Activity preset not found' },
      },
    };
  }

  // Build query
  let query = supabase
    .from('tracks')
    .select('*, artists (id, name)')
    .contains('activity_tags', activityPreset.tags);

  // Apply filters
  const filters = activityPreset.filters as any;
  if (filters) {
    if (filters.tempo) {
      query = query.gte('tempo_bpm', filters.tempo[0]).lte('tempo_bpm', filters.tempo[1]);
    }
    if (filters.energy) {
      query = query.gte('energy_level', filters.energy[0]).lte('energy_level', filters.energy[1]);
    }
    if (filters.instrumentalness) {
      query = query.gte('instrumentalness', filters.instrumentalness[0]).lte('instrumentalness', filters.instrumentalness[1]);
    }
  }

  const { data: tracks } = await query.order('popularity', { ascending: false }).limit(limit);

  return {
    tracks: (tracks || []).sort(() => Math.random() - 0.5),
    metadata: {
      algorithm: 'activity',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {
        activity,
        activityTags: activityPreset.tags,
        filters: filters || {},
      },
    },
  };
}

/**
 * BPM-based playlist (for running/workouts)
 */
export async function generateBPMPlaylist(targetBPM: number, range: number = 10, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const minBPM = targetBPM - range;
  const maxBPM = targetBPM + range;

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists (id, name)')
    .not('tempo_bpm', 'is', null)
    .gte('tempo_bpm', minBPM)
    .lte('tempo_bpm', maxBPM)
    .order('popularity', { ascending: false })
    .limit(limit);

  return {
    tracks: (tracks || []).sort(() => Math.random() - 0.5),
    metadata: {
      algorithm: 'bpm',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {
        targetBPM,
        minBPM,
        maxBPM,
        range,
      },
    },
  };
}

/**
 * Helper: Generate popular mix (fallback)
 */
async function generatePopularMix(limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists (id, name)')
    .order('popularity', { ascending: false })
    .limit(limit);

  return {
    tracks: (tracks || []).sort(() => Math.random() - 0.5),
    metadata: {
      algorithm: 'popular',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {},
    },
  };
}

/**
 * Helper: Shuffle with variety (avoid same artist consecutively)
 */
function shuffleWithVariety(tracks: any[]): any[] {
  if (tracks.length <= 1) return tracks;

  const shuffled = [...tracks].sort(() => Math.random() - 0.5);
  const result: any[] = [shuffled[0]];

  for (let i = 1; i < shuffled.length; i++) {
    let candidate = shuffled[i];
    let attempts = 0;

    // Try to avoid same artist as previous track
    while (
      attempts < 5 &&
      i < shuffled.length - 1 &&
      candidate.artist_id === result[result.length - 1].artist_id
    ) {
      attempts++;
      const swapIndex = i + 1 + Math.floor(Math.random() * (shuffled.length - i - 1));
      [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
      candidate = shuffled[i];
    }

    result.push(candidate);
  }

  return result;
}

// Database function for getting user's favorite genres (needs to be created in Supabase)
/*
CREATE OR REPLACE FUNCTION get_user_favorite_genres(user_id UUID, days_back INTEGER DEFAULT 60)
RETURNS TABLE (genre TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(t.genres) as genre, COUNT(*) as count
  FROM play_history ph
  JOIN tracks t ON t.id = ph.track_id
  WHERE ph.user_id = $1
    AND ph.played_at >= NOW() - INTERVAL '1 day' * days_back
    AND t.genres IS NOT NULL
  GROUP BY genre
  ORDER BY count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
*/
