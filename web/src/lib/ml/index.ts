/**
 * ML Module Exports
 *
 * Audio analysis and mood detection utilities
 */

export {
  extractAudioFeatures,
  classifyMood,
  type AudioFeatures,
  type MoodPrediction
} from './audio-features';

export {
  detectTrackMood,
  updateTrackMood,
  batchDetectMoods,
  getTracksNeedingMoodDetection,
  type MoodDetectionResult
} from './mood-detector';
