/**
 * Audio Feature Extraction using TensorFlow.js and Meyda
 *
 * Extracts audio features from audio files for mood detection:
 * - Spectral features (centroid, rolloff, flatness)
 * - Rhythm features (RMS energy, zero crossing rate)
 * - Perceptual features (loudness, brightness)
 */

import * as tf from '@tensorflow/tfjs-node';

// Audio feature types
export interface AudioFeatures {
  // Spectral features
  spectralCentroid: number;      // Brightness of sound
  spectralRolloff: number;       // Frequency below which 85% of energy lies
  spectralFlatness: number;      // Noisiness vs tonality
  spectralSpread: number;        // Bandwidth of spectrum

  // Energy features
  rms: number;                   // Root mean square energy
  energy: number;                // Total energy (0-1 normalized)
  loudness: number;              // Perceived loudness

  // Rhythm features
  zeroCrossingRate: number;      // Transitions through zero
  tempo: number;                 // Estimated BPM

  // Perceptual features
  brightness: number;            // High frequency content
  roughness: number;             // Dissonance/roughness

  // Summary stats
  dynamicRange: number;          // Difference between quiet and loud
  averageEnergy: number;         // Mean energy across track
}

// Mood prediction output
export interface MoodPrediction {
  primaryMood: string;
  confidence: number;
  moodScores: Record<string, number>;
  audioFeatures: AudioFeatures;
  energyLevel: number;        // 1-10 scale
  valence: number;            // 1-10 scale (sad to happy)
  danceability: number;       // 1-10 scale
  acousticness: number;       // 1-10 scale
  instrumentalness: number;   // 1-10 scale
}

/**
 * Analyze audio buffer and extract features
 */
export async function extractAudioFeatures(
  audioBuffer: ArrayBuffer | Buffer
): Promise<AudioFeatures> {
  // Convert to Float32Array for processing
  const audioData = await decodeAudioBuffer(audioBuffer);

  // Calculate frame-based features
  const frameSize = 2048;
  const hopSize = 1024;
  const frames: number[][] = [];

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    frames.push(Array.from(audioData.slice(i, i + frameSize)));
  }

  // Extract features from each frame
  const frameFeatures = frames.map(frame => extractFrameFeatures(frame));

  // Aggregate features across all frames
  const aggregated = aggregateFeatures(frameFeatures);

  // Estimate tempo using onset detection
  const tempo = estimateTempo(audioData, 44100);

  return {
    ...aggregated,
    tempo
  };
}

/**
 * Decode audio buffer to float samples
 */
async function decodeAudioBuffer(buffer: ArrayBuffer | Buffer): Promise<Float32Array> {
  // For server-side processing, we'll use a simplified approach
  // In production, you'd use ffmpeg or similar for proper decoding

  // Convert to ArrayBuffer
  let arrayBuffer: ArrayBuffer;
  if (Buffer.isBuffer(buffer)) {
    // Convert Node.js Buffer to ArrayBuffer
    const uint8 = new Uint8Array(buffer);
    arrayBuffer = uint8.buffer as ArrayBuffer;
  } else {
    arrayBuffer = buffer as ArrayBuffer;
  }

  // Simple PCM extraction (assumes 16-bit PCM)
  // For real implementation, use audio decoding library
  const dataView = new DataView(arrayBuffer);
  const samples = new Float32Array(Math.floor(arrayBuffer.byteLength / 2));

  for (let i = 0; i < samples.length; i++) {
    try {
      const int16 = dataView.getInt16(i * 2, true);
      samples[i] = int16 / 32768; // Normalize to -1 to 1
    } catch {
      samples[i] = 0;
    }
  }

  return samples;
}

/**
 * Extract features from a single frame
 */
function extractFrameFeatures(frame: number[]): Record<string, number> {
  const n = frame.length;

  // RMS Energy
  const rms = Math.sqrt(frame.reduce((sum, x) => sum + x * x, 0) / n);

  // Zero Crossing Rate
  let zcr = 0;
  for (let i = 1; i < n; i++) {
    if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
      zcr++;
    }
  }
  zcr /= n;

  // FFT for spectral features (simplified using TensorFlow.js)
  const fftResult = computeFFT(frame);
  const magnitudes = fftResult.map(x => Math.sqrt(x.re * x.re + x.im * x.im));

  // Spectral Centroid (brightness)
  let weightedSum = 0;
  let totalMag = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    weightedSum += i * magnitudes[i];
    totalMag += magnitudes[i];
  }
  const spectralCentroid = totalMag > 0 ? weightedSum / totalMag : 0;

  // Spectral Rolloff (85% energy threshold)
  const threshold = totalMag * 0.85;
  let cumSum = 0;
  let rolloffBin = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    cumSum += magnitudes[i];
    if (cumSum >= threshold) {
      rolloffBin = i;
      break;
    }
  }
  const spectralRolloff = rolloffBin / magnitudes.length;

  // Spectral Flatness (geometric mean / arithmetic mean)
  const logSum = magnitudes.reduce((sum, x) => sum + Math.log(x + 1e-10), 0);
  const geometricMean = Math.exp(logSum / magnitudes.length);
  const arithmeticMean = totalMag / magnitudes.length;
  const spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;

  // Spectral Spread (variance around centroid)
  let spreadSum = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    spreadSum += Math.pow(i - spectralCentroid, 2) * magnitudes[i];
  }
  const spectralSpread = totalMag > 0 ? Math.sqrt(spreadSum / totalMag) : 0;

  return {
    rms,
    zcr,
    spectralCentroid,
    spectralRolloff,
    spectralFlatness,
    spectralSpread
  };
}

/**
 * Simple FFT computation
 */
function computeFFT(signal: number[]): Array<{ re: number; im: number }> {
  const n = signal.length;
  const result: Array<{ re: number; im: number }> = [];

  // Simple DFT (for production, use FFT library)
  for (let k = 0; k < n / 2; k++) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += signal[t] * Math.cos(angle);
      im -= signal[t] * Math.sin(angle);
    }
    result.push({ re, im });
  }

  return result;
}

/**
 * Aggregate frame features into track-level features
 */
function aggregateFeatures(
  frameFeatures: Record<string, number>[]
): Omit<AudioFeatures, 'tempo'> {
  const keys = Object.keys(frameFeatures[0]);
  const aggregated: Record<string, number> = {};

  // Calculate mean for each feature
  for (const key of keys) {
    const values = frameFeatures.map(f => f[key]);
    aggregated[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Calculate dynamic range from RMS
  const rmsValues = frameFeatures.map(f => f.rms);
  const maxRms = Math.max(...rmsValues);
  const minRms = Math.min(...rmsValues.filter(x => x > 0));
  const dynamicRange = maxRms > 0 && minRms > 0
    ? 20 * Math.log10(maxRms / minRms)
    : 0;

  // Normalize energy to 0-1
  const energy = Math.min(1, aggregated.rms * 3);

  // Calculate brightness from spectral centroid
  const brightness = Math.min(1, aggregated.spectralCentroid / 100);

  // Estimate loudness (simplified LUFS-like measure)
  const loudness = -23 + (energy * 23); // Range: -23 to 0 LUFS approx

  // Estimate roughness from spectral flatness (inverse)
  const roughness = 1 - aggregated.spectralFlatness;

  return {
    spectralCentroid: aggregated.spectralCentroid,
    spectralRolloff: aggregated.spectralRolloff,
    spectralFlatness: aggregated.spectralFlatness,
    spectralSpread: aggregated.spectralSpread,
    rms: aggregated.rms,
    energy,
    loudness,
    zeroCrossingRate: aggregated.zcr,
    brightness,
    roughness,
    dynamicRange,
    averageEnergy: energy
  };
}

/**
 * Estimate tempo using onset detection
 */
function estimateTempo(samples: Float32Array, sampleRate: number): number {
  // Simple onset detection using energy envelope
  const frameSize = 1024;
  const hopSize = 512;
  const energyEnvelope: number[] = [];

  for (let i = 0; i < samples.length - frameSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < frameSize; j++) {
      energy += samples[i + j] * samples[i + j];
    }
    energyEnvelope.push(energy);
  }

  // Compute difference (onset strength)
  const onsetStrength: number[] = [];
  for (let i = 1; i < energyEnvelope.length; i++) {
    const diff = energyEnvelope[i] - energyEnvelope[i - 1];
    onsetStrength.push(diff > 0 ? diff : 0);
  }

  // Autocorrelation for tempo estimation
  const maxLag = Math.floor((60 / 60) * sampleRate / hopSize); // Min 60 BPM
  const minLag = Math.floor((60 / 200) * sampleRate / hopSize); // Max 200 BPM

  let bestLag = minLag;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < onsetStrength.length - lag; i++) {
      corr += onsetStrength[i] * onsetStrength[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  // Convert lag to BPM
  const tempo = (60 * sampleRate) / (bestLag * hopSize);

  // Clamp to reasonable range
  return Math.max(60, Math.min(200, tempo));
}

/**
 * Classify mood based on extracted audio features
 */
export function classifyMood(features: AudioFeatures): MoodPrediction {
  // Calculate derived features for mood classification
  const energyLevel = Math.round(features.energy * 10);
  const brightness = features.brightness;
  const tempo = features.tempo;
  const zcr = features.zeroCrossingRate;
  const flatness = features.spectralFlatness;

  // Calculate valence (happiness) from multiple features
  // High brightness + high energy + moderate tempo = happy
  // Low brightness + low energy = sad
  let valenceScore = 0;
  valenceScore += brightness * 3;
  valenceScore += features.energy * 2;
  valenceScore += (tempo > 100 && tempo < 140) ? 2 : 0;
  valenceScore += flatness * 1.5; // Tonal music tends to be happier
  valenceScore = Math.min(10, Math.max(1, Math.round(valenceScore)));

  // Calculate danceability
  // Regular rhythm (low zcr variance) + moderate-high tempo + good energy
  let danceability = 0;
  danceability += (tempo >= 90 && tempo <= 150) ? 4 : (tempo >= 80 && tempo <= 160) ? 2 : 0;
  danceability += features.energy * 3;
  danceability += (1 - zcr) * 3; // Lower zcr = more tonal = more danceable
  danceability = Math.min(10, Math.max(1, Math.round(danceability)));

  // Calculate acousticness (inverse of brightness and energy in high frequencies)
  let acousticness = 0;
  acousticness += (1 - brightness) * 4;
  acousticness += flatness * 3; // More harmonic = more acoustic
  acousticness += (1 - features.energy) * 3;
  acousticness = Math.min(10, Math.max(1, Math.round(acousticness)));

  // Calculate instrumentalness from spectral characteristics
  // Instrumental music tends to have more consistent spectral characteristics
  let instrumentalness = 0;
  instrumentalness += (1 - zcr) * 4; // Less zero crossings = less vocal
  instrumentalness += features.spectralSpread > 50 ? 3 : 1; // Wide spread = more instruments
  instrumentalness += flatness * 3;
  instrumentalness = Math.min(10, Math.max(1, Math.round(instrumentalness)));

  // Calculate mood scores based on feature combinations
  const moodScores: Record<string, number> = {
    happy: calculateHappyScore(energyLevel, valenceScore, tempo),
    sad: calculateSadScore(energyLevel, valenceScore, tempo),
    energetic: calculateEnergeticScore(energyLevel, tempo, brightness),
    chill: calculateChillScore(energyLevel, tempo, acousticness),
    focused: calculateFocusedScore(energyLevel, instrumentalness, tempo),
    romantic: calculateRomanticScore(valenceScore, energyLevel, acousticness),
    angry: calculateAngryScore(energyLevel, valenceScore, brightness),
    peaceful: calculatePeacefulScore(energyLevel, acousticness, tempo)
  };

  // Normalize scores to sum to 1
  const totalScore = Object.values(moodScores).reduce((a, b) => a + b, 0);
  for (const mood in moodScores) {
    moodScores[mood] = totalScore > 0 ? moodScores[mood] / totalScore : 0;
  }

  // Find primary mood
  let primaryMood = 'neutral';
  let maxScore = 0;
  for (const [mood, score] of Object.entries(moodScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryMood = mood;
    }
  }

  return {
    primaryMood,
    confidence: maxScore,
    moodScores,
    audioFeatures: features,
    energyLevel,
    valence: valenceScore,
    danceability,
    acousticness,
    instrumentalness
  };
}

// Mood scoring functions
function calculateHappyScore(energy: number, valence: number, tempo: number): number {
  let score = 0;
  score += valence >= 7 ? 4 : valence >= 5 ? 2 : 0;
  score += energy >= 6 ? 3 : energy >= 4 ? 1 : 0;
  score += (tempo >= 100 && tempo <= 140) ? 3 : 0;
  return score;
}

function calculateSadScore(energy: number, valence: number, tempo: number): number {
  let score = 0;
  score += valence <= 4 ? 4 : valence <= 6 ? 2 : 0;
  score += energy <= 5 ? 3 : energy <= 7 ? 1 : 0;
  score += tempo < 100 ? 3 : 0;
  return score;
}

function calculateEnergeticScore(energy: number, tempo: number, brightness: number): number {
  let score = 0;
  score += energy >= 8 ? 4 : energy >= 6 ? 2 : 0;
  score += tempo >= 120 ? 4 : tempo >= 100 ? 2 : 0;
  score += brightness >= 0.6 ? 2 : 0;
  return score;
}

function calculateChillScore(energy: number, tempo: number, acousticness: number): number {
  let score = 0;
  score += energy <= 5 ? 3 : energy <= 7 ? 1 : 0;
  score += (tempo >= 70 && tempo <= 110) ? 3 : 0;
  score += acousticness >= 5 ? 4 : acousticness >= 3 ? 2 : 0;
  return score;
}

function calculateFocusedScore(energy: number, instrumentalness: number, tempo: number): number {
  let score = 0;
  score += (energy >= 4 && energy <= 7) ? 3 : 0;
  score += instrumentalness >= 6 ? 4 : instrumentalness >= 4 ? 2 : 0;
  score += (tempo >= 80 && tempo <= 120) ? 3 : 0;
  return score;
}

function calculateRomanticScore(valence: number, energy: number, acousticness: number): number {
  let score = 0;
  score += (valence >= 5 && valence <= 8) ? 3 : 0;
  score += (energy >= 3 && energy <= 6) ? 3 : 0;
  score += acousticness >= 5 ? 4 : acousticness >= 3 ? 2 : 0;
  return score;
}

function calculateAngryScore(energy: number, valence: number, brightness: number): number {
  let score = 0;
  score += energy >= 8 ? 4 : energy >= 6 ? 2 : 0;
  score += valence <= 4 ? 3 : 0;
  score += brightness >= 0.7 ? 3 : brightness >= 0.5 ? 1 : 0;
  return score;
}

function calculatePeacefulScore(energy: number, acousticness: number, tempo: number): number {
  let score = 0;
  score += energy <= 3 ? 4 : energy <= 5 ? 2 : 0;
  score += acousticness >= 6 ? 4 : acousticness >= 4 ? 2 : 0;
  score += tempo < 90 ? 2 : 0;
  return score;
}
