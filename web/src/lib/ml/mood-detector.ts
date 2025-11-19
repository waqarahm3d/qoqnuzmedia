/**
 * Mood Detection Service
 *
 * High-level service for detecting mood from audio files.
 * Integrates with storage and database.
 */

import { extractAudioFeatures, classifyMood, MoodPrediction } from './audio-features';

// Use any for Supabase client to avoid complex generic type issues
type SupabaseClient = any;

// Mood tag mappings for database storage
const MOOD_TAG_MAPPINGS: Record<string, string[]> = {
  happy: ['happy', 'joyful', 'cheerful', 'upbeat'],
  sad: ['sad', 'melancholic', 'emotional', 'somber'],
  energetic: ['energetic', 'intense', 'powerful', 'dynamic'],
  chill: ['chill', 'relaxed', 'mellow', 'laid-back'],
  focused: ['focus', 'concentration', 'productive', 'ambient'],
  romantic: ['romantic', 'intimate', 'love', 'sensual'],
  angry: ['angry', 'aggressive', 'intense', 'raw'],
  peaceful: ['peaceful', 'calm', 'tranquil', 'serene']
};

// Activity tag mappings based on mood and features
const ACTIVITY_TAG_MAPPINGS: Record<string, { moods: string[]; features: { energy?: [number, number]; tempo?: [number, number] } }> = {
  workout: { moods: ['energetic', 'angry'], features: { energy: [7, 10], tempo: [120, 180] } },
  running: { moods: ['energetic'], features: { energy: [6, 10], tempo: [130, 170] } },
  study: { moods: ['focused', 'peaceful'], features: { energy: [3, 6] } },
  sleep: { moods: ['peaceful', 'chill'], features: { energy: [1, 4], tempo: [50, 80] } },
  party: { moods: ['energetic', 'happy'], features: { energy: [7, 10], tempo: [110, 150] } },
  driving: { moods: ['energetic', 'happy', 'chill'], features: { energy: [4, 8] } },
  cooking: { moods: ['happy', 'chill'], features: { energy: [4, 7] } },
  meditation: { moods: ['peaceful'], features: { energy: [1, 3] } },
  relax: { moods: ['chill', 'peaceful', 'romantic'], features: { energy: [2, 5] } },
  focus: { moods: ['focused'], features: { energy: [3, 6] } }
};

export interface MoodDetectionResult {
  trackId: string;
  prediction: MoodPrediction;
  moodTags: string[];
  activityTags: string[];
  success: boolean;
  error?: string;
  processingTimeMs: number;
}

/**
 * Detect mood for a track by fetching audio from storage
 */
export async function detectTrackMood(
  trackId: string,
  audioUrl: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<MoodDetectionResult> {
  const startTime = Date.now();

  try {
    // Fetch audio file
    const audioBuffer = await fetchAudioFile(audioUrl);

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Failed to fetch audio file or file is empty');
    }

    // Extract features and classify mood
    const features = await extractAudioFeatures(audioBuffer);
    const prediction = classifyMood(features);

    // Generate mood tags
    const moodTags = generateMoodTags(prediction);

    // Generate activity tags
    const activityTags = generateActivityTags(prediction);

    return {
      trackId,
      prediction,
      moodTags,
      activityTags,
      success: true,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    return {
      trackId,
      prediction: {
        primaryMood: 'neutral',
        confidence: 0,
        moodScores: {},
        audioFeatures: {} as any,
        energyLevel: 5,
        valence: 5,
        danceability: 5,
        acousticness: 5,
        instrumentalness: 5
      },
      moodTags: ['neutral'],
      activityTags: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Fetch audio file from URL
 */
async function fetchAudioFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Generate mood tags from prediction
 */
function generateMoodTags(prediction: MoodPrediction): string[] {
  const tags: string[] = [];

  // Add primary mood tags
  const primaryTags = MOOD_TAG_MAPPINGS[prediction.primaryMood] || [];
  tags.push(...primaryTags.slice(0, 2));

  // Add secondary mood tags for moods with >20% confidence
  for (const [mood, score] of Object.entries(prediction.moodScores)) {
    if (mood !== prediction.primaryMood && score > 0.2) {
      const secondaryTags = MOOD_TAG_MAPPINGS[mood] || [];
      tags.push(secondaryTags[0]);
    }
  }

  // Add energy-based tags
  if (prediction.energyLevel >= 8) {
    tags.push('high-energy');
  } else if (prediction.energyLevel <= 3) {
    tags.push('low-energy');
  }

  // Add valence-based tags
  if (prediction.valence >= 8) {
    tags.push('positive');
  } else if (prediction.valence <= 3) {
    tags.push('melancholic');
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate activity tags from prediction
 */
function generateActivityTags(prediction: MoodPrediction): string[] {
  const tags: string[] = [];

  for (const [activity, criteria] of Object.entries(ACTIVITY_TAG_MAPPINGS)) {
    let matches = false;

    // Check if mood matches
    if (criteria.moods.includes(prediction.primaryMood)) {
      matches = true;
    }

    // Check feature ranges
    if (criteria.features.energy) {
      const [min, max] = criteria.features.energy;
      if (prediction.energyLevel >= min && prediction.energyLevel <= max) {
        matches = true;
      } else {
        matches = false;
      }
    }

    if (criteria.features.tempo && prediction.audioFeatures.tempo) {
      const [min, max] = criteria.features.tempo;
      const tempo = prediction.audioFeatures.tempo;
      if (tempo < min || tempo > max) {
        matches = false;
      }
    }

    if (matches) {
      tags.push(activity);
    }
  }

  return tags;
}

/**
 * Update track with mood detection results
 */
export async function updateTrackMood(
  supabase: SupabaseClient,
  trackId: string,
  result: MoodDetectionResult
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {
      mood_tags: result.moodTags,
      activity_tags: result.activityTags,
      energy_level: result.prediction.energyLevel,
      valence: result.prediction.valence,
      danceability: result.prediction.danceability,
      acousticness: result.prediction.acousticness,
      instrumentalness: result.prediction.instrumentalness,
      last_metadata_update: new Date().toISOString()
    };

    // Add tempo if detected
    if (result.prediction.audioFeatures.tempo) {
      updateData.tempo_bpm = Math.round(result.prediction.audioFeatures.tempo);
    }

    const { error } = await supabase
      .from('tracks')
      .update(updateData)
      .eq('id', trackId);

    if (error) {
      console.error('Error updating track mood:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating track mood:', error);
    return false;
  }
}

/**
 * Batch process multiple tracks for mood detection
 */
export async function batchDetectMoods(
  trackIds: string[],
  supabase: SupabaseClient,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; results: MoodDetectionResult[] }> {
  const results: MoodDetectionResult[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < trackIds.length; i++) {
    const trackId = trackIds[i];

    try {
      // Fetch track details
      const { data: track, error } = await supabase
        .from('tracks')
        .select('id, audio_url')
        .eq('id', trackId)
        .single();

      if (error || !track?.audio_url) {
        failed++;
        results.push({
          trackId,
          prediction: {} as any,
          moodTags: [],
          activityTags: [],
          success: false,
          error: error?.message || 'Track not found',
          processingTimeMs: 0
        });
        continue;
      }

      // Detect mood
      const result = await detectTrackMood(
        trackId,
        track.audio_url,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      results.push(result);

      // Update database
      if (result.success) {
        await updateTrackMood(supabase, trackId, result);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      results.push({
        trackId,
        prediction: {} as any,
        moodTags: [],
        activityTags: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: 0
      });
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, trackIds.length);
    }

    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed, results };
}

/**
 * Get tracks that need mood detection
 */
export async function getTracksNeedingMoodDetection(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<string[]> {
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('id')
    .or('mood_tags.is.null,mood_tags.eq.{}')
    .not('audio_url', 'is', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }

  return tracks?.map((t: { id: string }) => t.id) || [];
}
