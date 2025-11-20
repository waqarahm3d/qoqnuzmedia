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
        artists!tracks_artist_id_fkey (id, name)
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
      artists!tracks_artist_id_fkey (id, name)
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
      .select('*, artists!tracks_artist_id_fkey (id, name)')
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
    .select('*, artists!tracks_artist_id_fkey (id, name)')
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
        artists!tracks_artist_id_fkey (id, name)
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
        artists!tracks_artist_id_fkey (id, name)
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

  // Determine which tags to search for
  // If preset exists, use its tags; otherwise use the mood name directly
  const searchTags = moodPreset?.tags || [mood];

  console.log(`[MoodPlaylist] Searching for mood: ${mood}, tags: ${JSON.stringify(searchTags)}`);

  // Build query based on filters
  // Use overlaps - matches tracks with ANY of the tags
  // Use explicit relationship hint for artists since there's also a junction table
  let query = supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .overlaps('mood_tags', searchTags);

  // Apply filters from preset (only if preset exists)
  const filters = moodPreset?.filters as any;
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

  const { data: tracks, error } = await query
    .order('play_count', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[MoodPlaylist] Query error:', error);
    console.error('[MoodPlaylist] Error details:', JSON.stringify(error));
  }

  console.log(`[MoodPlaylist] Found ${tracks?.length || 0} tracks for mood: ${mood}`);
  if (tracks && tracks.length > 0) {
    console.log(`[MoodPlaylist] First track: ${tracks[0].title}`);
  }

  return {
    tracks: (tracks || []).sort(() => Math.random() - 0.5),
    metadata: {
      algorithm: 'mood',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {
        mood,
        moodTags: searchTags,
        filters: filters || {},
        presetFound: !!moodPreset,
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

  // Build query - use overlaps to match ANY tag
  // Use explicit relationship hint for artists since there's also a junction table
  let query = supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .overlaps('activity_tags', activityPreset.tags);

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
    .select('*, artists!tracks_artist_id_fkey (id, name)')
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
    .select('*, artists!tracks_artist_id_fkey (id, name)')
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

/**
 * ============================================
 * NEW PLAYLIST ALGORITHMS
 * ============================================
 */

/**
 * Trending Now - Most played tracks in the last 7 days
 */
export async function generateTrendingNow(limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get play counts from last 7 days
  const { data: recentPlays } = await supabase
    .from('play_history')
    .select('track_id')
    .gte('played_at', sevenDaysAgo);

  if (!recentPlays || recentPlays.length === 0) {
    return generatePopularMix(limit);
  }

  // Count plays per track
  const playCountMap = new Map<string, number>();
  recentPlays.forEach(({ track_id }) => {
    playCountMap.set(track_id, (playCountMap.get(track_id) || 0) + 1);
  });

  // Sort by play count
  const topTrackIds = Array.from(playCountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => id);

  if (topTrackIds.length === 0) {
    return generatePopularMix(limit);
  }

  // Fetch track details
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .in('id', topTrackIds);

  // Sort tracks by play count
  const sortedTracks = (tracks || []).sort((a, b) => {
    return (playCountMap.get(b.id) || 0) - (playCountMap.get(a.id) || 0);
  });

  return {
    tracks: sortedTracks,
    metadata: {
      algorithm: 'trending_now',
      generatedAt: new Date().toISOString(),
      trackCount: sortedTracks.length,
      criteria: {
        periodDays: 7,
        totalPlays: recentPlays.length,
      },
    },
  };
}

/**
 * Recently Added - Newest tracks on the platform
 */
export async function generateRecentlyAdded(limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    tracks: tracks || [],
    metadata: {
      algorithm: 'recently_added',
      generatedAt: new Date().toISOString(),
      trackCount: tracks?.length || 0,
      criteria: {
        sortBy: 'created_at',
      },
    },
  };
}

/**
 * Genre Mix - Deep dive into a specific genre
 */
export async function generateGenreMix(genre: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .contains('genres', [genre])
    .order('play_count', { ascending: false, nullsFirst: false })
    .limit(limit * 2);

  // Shuffle to add variety
  const shuffled = (tracks || []).sort(() => Math.random() - 0.5).slice(0, limit);

  return {
    tracks: shuffled,
    metadata: {
      algorithm: 'genre_mix',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        genre,
      },
    },
  };
}

/**
 * Decade Mix - Tracks from a specific decade/era
 */
export async function generateDecadeMix(decade: number, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  const startYear = decade;
  const endYear = decade + 9;

  // Try release_date first, fallback to created_at for newer uploads
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .or(`release_date.gte.${startYear}-01-01,release_date.lte.${endYear}-12-31`)
    .order('play_count', { ascending: false, nullsFirst: false })
    .limit(limit * 2);

  // Shuffle for variety
  const shuffled = (tracks || []).sort(() => Math.random() - 0.5).slice(0, limit);

  return {
    tracks: shuffled,
    metadata: {
      algorithm: 'decade_mix',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        decade,
        yearRange: `${startYear}-${endYear}`,
      },
    },
  };
}

/**
 * Artist Radio - Generate playlist based on a seed artist
 * Finds tracks from the artist and similar artists
 */
export async function generateArtistRadio(artistId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get seed artist info and their tracks
  const { data: artistData } = await supabase
    .from('artists')
    .select('id, name, genres')
    .eq('id', artistId)
    .single();

  if (!artistData) {
    return {
      tracks: [],
      metadata: {
        algorithm: 'artist_radio',
        generatedAt: new Date().toISOString(),
        trackCount: 0,
        criteria: { error: 'Artist not found' },
      },
    };
  }

  // Get tracks from the seed artist (up to 30%)
  const { data: artistTracks } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .eq('artist_id', artistId)
    .order('play_count', { ascending: false, nullsFirst: false })
    .limit(Math.ceil(limit * 0.3));

  // Find similar artists by genre overlap
  const artistGenres = artistData.genres || [];
  let similarArtistTracks: any[] = [];

  if (artistGenres.length > 0) {
    // Get artists with similar genres
    const { data: similarArtists } = await supabase
      .from('artists')
      .select('id')
      .neq('id', artistId)
      .overlaps('genres', artistGenres)
      .limit(20);

    if (similarArtists && similarArtists.length > 0) {
      const similarArtistIds = similarArtists.map(a => a.id);

      // Get tracks from similar artists
      const { data: simTracks } = await supabase
        .from('tracks')
        .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
        .in('artist_id', similarArtistIds)
        .order('play_count', { ascending: false, nullsFirst: false })
        .limit(limit);

      similarArtistTracks = simTracks || [];
    }
  }

  // Also get tracks with similar genres
  let genreMatches: any[] = [];
  if (artistGenres.length > 0) {
    const { data: genreTracks } = await supabase
      .from('tracks')
      .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
      .neq('artist_id', artistId)
      .overlaps('genres', artistGenres)
      .order('play_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    genreMatches = genreTracks || [];
  }

  // Combine and deduplicate
  const trackMap = new Map<string, any>();

  // Add artist's own tracks first
  (artistTracks || []).forEach(t => trackMap.set(t.id, { ...t, _priority: 3 }));

  // Add similar artist tracks
  similarArtistTracks.forEach(t => {
    if (!trackMap.has(t.id)) {
      trackMap.set(t.id, { ...t, _priority: 2 });
    }
  });

  // Add genre matches
  genreMatches.forEach(t => {
    if (!trackMap.has(t.id)) {
      trackMap.set(t.id, { ...t, _priority: 1 });
    }
  });

  // Sort by priority then shuffle within priority groups
  const allTracks = Array.from(trackMap.values())
    .sort((a, b) => b._priority - a._priority)
    .slice(0, limit);

  // Apply variety shuffle
  const shuffled = shuffleWithVariety(allTracks).map(({ _priority, ...t }) => t);

  return {
    tracks: shuffled,
    metadata: {
      algorithm: 'artist_radio',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        seedArtist: artistData.name,
        seedArtistId: artistId,
        artistGenres,
        artistTracksIncluded: artistTracks?.length || 0,
        similarArtistTracksFound: similarArtistTracks.length,
      },
    },
  };
}

/**
 * Track Radio - Generate playlist based on a seed track
 * Finds similar tracks by genre, mood, tempo, and energy
 */
export async function generateTrackRadio(trackId: string, limit: number = 50): Promise<GenerationResult> {
  const supabase = await createServerSupabaseClient();

  // Get seed track info
  const { data: seedTrack } = await supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name)')
    .eq('id', trackId)
    .single();

  if (!seedTrack) {
    return {
      tracks: [],
      metadata: {
        algorithm: 'track_radio',
        generatedAt: new Date().toISOString(),
        trackCount: 0,
        criteria: { error: 'Track not found' },
      },
    };
  }

  // First, check if we have pre-computed similarities
  const { data: precomputedSimilar } = await supabase
    .from('track_similarities')
    .select(`
      similar_track_id,
      similarity_score,
      similar_tracks:similar_track_id (
        *,
        artists!tracks_artist_id_fkey (id, name),
        albums (id, title, cover_art_url)
      )
    `)
    .eq('track_id', trackId)
    .order('similarity_score', { ascending: false })
    .limit(limit);

  if (precomputedSimilar && precomputedSimilar.length >= limit / 2) {
    const tracks = precomputedSimilar
      .map((s: any) => s.similar_tracks)
      .filter(Boolean);

    return {
      tracks,
      metadata: {
        algorithm: 'track_radio',
        generatedAt: new Date().toISOString(),
        trackCount: tracks.length,
        criteria: {
          seedTrack: seedTrack.title,
          seedTrackId: trackId,
          source: 'precomputed_similarities',
        },
      },
    };
  }

  // Fallback: compute similarity on-the-fly
  const genres = seedTrack.genres || [];
  const moodTags = seedTrack.mood_tags || [];
  const tempo = seedTrack.tempo_bpm;
  const energy = seedTrack.energy_level;
  const valence = seedTrack.valence;

  // Build query for similar tracks
  let query = supabase
    .from('tracks')
    .select('*, artists!tracks_artist_id_fkey (id, name), albums (id, title, cover_art_url)')
    .neq('id', trackId);

  // Get tracks and score them
  const { data: candidateTracks } = await query.limit(500);

  if (!candidateTracks || candidateTracks.length === 0) {
    return generatePopularMix(limit);
  }

  // Score each track by similarity
  const scoredTracks = candidateTracks.map(track => {
    let score = 0;

    // Genre match (max 40 points)
    if (track.genres && genres.length > 0) {
      const genreOverlap = track.genres.filter((g: string) => genres.includes(g)).length;
      score += (genreOverlap / Math.max(genres.length, 1)) * 40;
    }

    // Mood match (max 20 points)
    if (track.mood_tags && moodTags.length > 0) {
      const moodOverlap = track.mood_tags.filter((m: string) => moodTags.includes(m)).length;
      score += (moodOverlap / Math.max(moodTags.length, 1)) * 20;
    }

    // Tempo similarity (max 15 points)
    if (tempo && track.tempo_bpm) {
      const tempoDiff = Math.abs(tempo - track.tempo_bpm);
      if (tempoDiff <= 10) score += 15;
      else if (tempoDiff <= 20) score += 10;
      else if (tempoDiff <= 30) score += 5;
    }

    // Energy similarity (max 15 points)
    if (energy && track.energy_level) {
      const energyDiff = Math.abs(energy - track.energy_level);
      score += Math.max(0, 15 - energyDiff * 3);
    }

    // Valence similarity (max 10 points)
    if (valence && track.valence) {
      const valenceDiff = Math.abs(valence - track.valence);
      score += Math.max(0, 10 - valenceDiff * 2);
    }

    // Same artist bonus (small)
    if (track.artist_id === seedTrack.artist_id) {
      score += 5;
    }

    return { ...track, _score: score };
  });

  // Sort by score and take top tracks
  const selectedTracks = scoredTracks
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  // Apply variety shuffle
  const shuffled = shuffleWithVariety(selectedTracks).map(({ _score, ...t }) => t);

  return {
    tracks: shuffled,
    metadata: {
      algorithm: 'track_radio',
      generatedAt: new Date().toISOString(),
      trackCount: shuffled.length,
      criteria: {
        seedTrack: seedTrack.title,
        seedTrackId: trackId,
        seedGenres: genres,
        seedMoods: moodTags,
        seedTempo: tempo,
        seedEnergy: energy,
        source: 'computed_similarity',
      },
    },
  };
}

/**
 * Compute and store track similarities for a track
 * This populates the track_similarities table
 */
export async function computeTrackSimilarities(trackId: string): Promise<{ computed: number; stored: number }> {
  const supabase = await createServerSupabaseClient();

  // Get seed track
  const { data: seedTrack } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .single();

  if (!seedTrack) {
    throw new Error('Track not found');
  }

  const genres = seedTrack.genres || [];
  const moodTags = seedTrack.mood_tags || [];
  const tempo = seedTrack.tempo_bpm;
  const energy = seedTrack.energy_level;
  const valence = seedTrack.valence;

  // Get all other tracks
  const { data: allTracks } = await supabase
    .from('tracks')
    .select('id, genres, mood_tags, tempo_bpm, energy_level, valence, artist_id')
    .neq('id', trackId);

  if (!allTracks || allTracks.length === 0) {
    return { computed: 0, stored: 0 };
  }

  // Compute similarities
  const similarities: Array<{
    track_id: string;
    similar_track_id: string;
    similarity_score: number;
    genre_score: number;
    mood_score: number;
    audio_score: number;
  }> = [];

  allTracks.forEach(track => {
    let genreScore = 0;
    let moodScore = 0;
    let audioScore = 0;

    // Genre score (0-1)
    if (track.genres && genres.length > 0) {
      const overlap = track.genres.filter((g: string) => genres.includes(g)).length;
      genreScore = overlap / Math.max(genres.length, track.genres.length);
    }

    // Mood score (0-1)
    if (track.mood_tags && moodTags.length > 0) {
      const overlap = track.mood_tags.filter((m: string) => moodTags.includes(m)).length;
      moodScore = overlap / Math.max(moodTags.length, track.mood_tags.length);
    }

    // Audio features score (0-1)
    let audioFactors = 0;
    let audioTotal = 0;

    if (tempo && track.tempo_bpm) {
      const tempoDiff = Math.abs(tempo - track.tempo_bpm);
      audioTotal += Math.max(0, 1 - tempoDiff / 50);
      audioFactors++;
    }

    if (energy && track.energy_level) {
      audioTotal += Math.max(0, 1 - Math.abs(energy - track.energy_level) / 10);
      audioFactors++;
    }

    if (valence && track.valence) {
      audioTotal += Math.max(0, 1 - Math.abs(valence - track.valence) / 10);
      audioFactors++;
    }

    if (audioFactors > 0) {
      audioScore = audioTotal / audioFactors;
    }

    // Combined score (weighted average)
    const totalScore = genreScore * 0.4 + moodScore * 0.3 + audioScore * 0.3;

    // Only store if similarity is above threshold
    if (totalScore >= 0.3) {
      similarities.push({
        track_id: trackId,
        similar_track_id: track.id,
        similarity_score: Math.round(totalScore * 1000) / 1000,
        genre_score: Math.round(genreScore * 1000) / 1000,
        mood_score: Math.round(moodScore * 1000) / 1000,
        audio_score: Math.round(audioScore * 1000) / 1000,
      });
    }
  });

  // Sort by score and take top 100
  const topSimilarities = similarities
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 100);

  // Delete old similarities for this track
  await supabase
    .from('track_similarities')
    .delete()
    .eq('track_id', trackId);

  // Insert new similarities
  if (topSimilarities.length > 0) {
    const { error } = await supabase
      .from('track_similarities')
      .insert(topSimilarities);

    if (error) {
      console.error('Error storing similarities:', error);
    }
  }

  return {
    computed: allTracks.length,
    stored: topSimilarities.length,
  };
}

/**
 * Compute similarities for all tracks (batch job)
 */
export async function computeAllTrackSimilarities(): Promise<{ totalTracks: number; processed: number }> {
  const supabase = await createServerSupabaseClient();

  // Get all track IDs
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id')
    .order('created_at', { ascending: false });

  if (!tracks || tracks.length === 0) {
    return { totalTracks: 0, processed: 0 };
  }

  let processed = 0;
  for (const track of tracks) {
    try {
      await computeTrackSimilarities(track.id);
      processed++;
      console.log(`[Similarity] Processed ${processed}/${tracks.length}: ${track.id}`);
    } catch (error) {
      console.error(`[Similarity] Error processing ${track.id}:`, error);
    }
  }

  return {
    totalTracks: tracks.length,
    processed,
  };
}
