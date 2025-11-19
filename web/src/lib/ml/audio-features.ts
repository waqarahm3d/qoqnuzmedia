/**
 * Audio Feature Extraction using TensorFlow.js and Meyda
 *
 * Extracts audio features from audio files for mood detection:
 * - Spectral features (centroid, rolloff, flatness)
 * - Rhythm features (RMS energy, zero crossing rate)
 * - Perceptual features (loudness, brightness)
 */

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
 * Optimized for low CPU usage - uses statistical analysis instead of FFT
 */
export async function extractAudioFeatures(
  audioBuffer: ArrayBuffer | Buffer
): Promise<AudioFeatures> {
  // Convert to Float32Array for processing
  const audioData = await decodeAudioBuffer(audioBuffer);

  // Sample the audio to reduce processing (analyze ~10 seconds max)
  const sampleRate = 44100;
  const maxSamples = sampleRate * 10; // 10 seconds
  const step = Math.max(1, Math.floor(audioData.length / maxSamples));
  const sampledData = new Float32Array(Math.ceil(audioData.length / step));

  for (let i = 0, j = 0; i < audioData.length; i += step, j++) {
    sampledData[j] = audioData[i];
  }

  // Calculate basic statistics (fast operations)
  const features = calculateBasicFeatures(sampledData);

  // Estimate tempo using simple zero-crossing method
  const tempo = estimateTempoSimple(audioData, sampleRate);

  return {
    ...features,
    tempo
  };
}

/**
 * Calculate basic audio features using simple statistics
 * Much faster than FFT-based analysis
 */
function calculateBasicFeatures(samples: Float32Array): Omit<AudioFeatures, 'tempo'> {
  const n = samples.length;

  // RMS Energy
  let sumSquares = 0;
  let sum = 0;
  let zeroCrossings = 0;
  let maxAbs = 0;
  let minAbs = Infinity;

  for (let i = 0; i < n; i++) {
    const abs = Math.abs(samples[i]);
    sumSquares += samples[i] * samples[i];
    sum += abs;
    if (abs > maxAbs) maxAbs = abs;
    if (abs > 0.01 && abs < minAbs) minAbs = abs;

    if (i > 0 && ((samples[i] >= 0) !== (samples[i - 1] >= 0))) {
      zeroCrossings++;
    }
  }

  const rms = Math.sqrt(sumSquares / n);
  const meanAbs = sum / n;
  const zcr = zeroCrossings / n;

  // Energy normalized to 0-1
  const energy = Math.min(1, rms * 5);

  // Brightness estimation from zero crossing rate
  // Higher ZCR = more high frequency content = brighter
  const brightness = Math.min(1, zcr * 10);

  // Spectral characteristics estimated from statistics
  const spectralCentroid = brightness * 100; // Approximate
  const spectralRolloff = brightness * 0.85;
  const spectralFlatness = 1 - (rms / (meanAbs + 0.0001)); // Noise vs tone
  const spectralSpread = brightness * 50;

  // Dynamic range
  const dynamicRange = maxAbs > 0 && minAbs < Infinity && minAbs > 0
    ? 20 * Math.log10(maxAbs / minAbs)
    : 20;

  // Loudness approximation
  const loudness = -23 + (energy * 23);

  // Roughness from ZCR variance (approximate)
  const roughness = Math.min(1, zcr * 5);

  return {
    spectralCentroid,
    spectralRolloff,
    spectralFlatness,
    spectralSpread,
    rms,
    energy,
    loudness,
    zeroCrossingRate: zcr,
    brightness,
    roughness,
    dynamicRange,
    averageEnergy: energy
  };
}

/**
 * Simple tempo estimation using zero-crossing peaks
 * Much faster than autocorrelation
 */
function estimateTempoSimple(samples: Float32Array, sampleRate: number): number {
  // Downsample for speed
  const windowSize = 1024;
  const hopSize = 512;
  const energyEnvelope: number[] = [];

  for (let i = 0; i < samples.length - windowSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += samples[i + j] * samples[i + j];
    }
    energyEnvelope.push(energy);
  }

  // Find peaks in energy envelope
  const peaks: number[] = [];
  for (let i = 1; i < energyEnvelope.length - 1; i++) {
    if (energyEnvelope[i] > energyEnvelope[i - 1] &&
        energyEnvelope[i] > energyEnvelope[i + 1] &&
        energyEnvelope[i] > 0.1) {
      peaks.push(i);
    }
  }

  // Calculate average time between peaks
  if (peaks.length < 2) return 120; // Default

  let totalInterval = 0;
  for (let i = 1; i < Math.min(peaks.length, 20); i++) {
    totalInterval += peaks[i] - peaks[i - 1];
  }
  const avgInterval = totalInterval / (Math.min(peaks.length, 20) - 1);

  // Convert to BPM
  const secondsPerBeat = (avgInterval * hopSize) / sampleRate;
  const bpm = 60 / secondsPerBeat;

  // Clamp to reasonable range
  return Math.max(60, Math.min(200, bpm));
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
