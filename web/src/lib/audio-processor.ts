/**
 * Audio Processing Service
 * Handles transcoding, loudness normalization, and quality variants
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { uploadToR2, deleteFromR2 } from './r2';

const execAsync = promisify(exec);

// Quality presets for transcoding
export const QUALITY_PRESETS = {
  low: { bitrate: '128k', suffix: '_128' },
  medium: { bitrate: '256k', suffix: '_256' },
  high: { bitrate: '320k', suffix: '_320' },
} as const;

export type QualityLevel = keyof typeof QUALITY_PRESETS;

// Target loudness for normalization (Spotify uses -14 LUFS)
const TARGET_LOUDNESS = -14;

interface AudioMetadata {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  loudness?: number;
}

interface ProcessingResult {
  success: boolean;
  originalPath: string;
  variants: {
    quality: QualityLevel;
    path: string;
    bitrate: string;
  }[];
  metadata: AudioMetadata;
  error?: string;
}

/**
 * Get temporary directory for processing
 */
function getTempDir(): string {
  const tmpDir = path.join(process.cwd(), 'tmp', 'audio-processing');
  return tmpDir;
}

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<string> {
  const tmpDir = getTempDir();
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true });
  }
  return tmpDir;
}

/**
 * Get audio metadata using FFprobe
 */
export async function getAudioMetadata(filePath: string): Promise<AudioMetadata> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );

    const data = JSON.parse(stdout);
    const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
    const format = data.format;

    return {
      duration: parseFloat(format?.duration || '0') * 1000, // Convert to ms
      bitrate: parseInt(format?.bit_rate || '0'),
      sampleRate: parseInt(audioStream?.sample_rate || '44100'),
      channels: audioStream?.channels || 2,
      codec: audioStream?.codec_name || 'unknown',
    };
  } catch (error: any) {
    console.error('Failed to get audio metadata:', error.message);
    throw new Error(`Failed to analyze audio: ${error.message}`);
  }
}

/**
 * Measure loudness using FFmpeg loudnorm filter
 */
export async function measureLoudness(filePath: string): Promise<number> {
  try {
    const { stderr } = await execAsync(
      `ffmpeg -i "${filePath}" -af loudnorm=print_format=json -f null - 2>&1`
    );

    // Extract JSON from FFmpeg output
    const jsonMatch = stderr.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
    if (jsonMatch) {
      const loudnessData = JSON.parse(jsonMatch[0]);
      return parseFloat(loudnessData.input_i);
    }

    return -23; // Default if measurement fails
  } catch (error: any) {
    console.error('Failed to measure loudness:', error.message);
    return -23;
  }
}

/**
 * Transcode audio to specific quality with loudness normalization
 */
export async function transcodeAudio(
  inputPath: string,
  outputPath: string,
  bitrate: string,
  normalize: boolean = true
): Promise<void> {
  let filterChain = '';

  if (normalize) {
    // Two-pass loudness normalization to target LUFS
    filterChain = `-af loudnorm=I=${TARGET_LOUDNESS}:TP=-1.5:LRA=11`;
  }

  const command = `ffmpeg -y -i "${inputPath}" ${filterChain} -c:a libmp3lame -b:a ${bitrate} -ar 44100 -ac 2 "${outputPath}"`;

  try {
    await execAsync(command);
  } catch (error: any) {
    console.error('Transcode error:', error.message);
    throw new Error(`Failed to transcode audio: ${error.message}`);
  }
}

/**
 * Process a track: create quality variants and normalize loudness
 */
export async function processTrack(
  trackId: string,
  audioUrl: string,
  downloadFromR2: (key: string) => Promise<Buffer>
): Promise<ProcessingResult> {
  const tmpDir = await ensureTempDir();
  const inputFile = path.join(tmpDir, `${trackId}_input.mp3`);
  const variants: ProcessingResult['variants'] = [];

  try {
    console.log(`[Audio Processor] Starting processing for track ${trackId}`);

    // Download original file from R2
    console.log(`[Audio Processor] Downloading from R2: ${audioUrl}`);
    const audioBuffer = await downloadFromR2(audioUrl);
    await writeFile(inputFile, audioBuffer);

    // Get metadata
    const metadata = await getAudioMetadata(inputFile);
    console.log(`[Audio Processor] Metadata:`, metadata);

    // Measure original loudness
    const originalLoudness = await measureLoudness(inputFile);
    metadata.loudness = originalLoudness;
    console.log(`[Audio Processor] Original loudness: ${originalLoudness} LUFS`);

    // Generate quality variants
    for (const [quality, preset] of Object.entries(QUALITY_PRESETS)) {
      const outputFile = path.join(tmpDir, `${trackId}${preset.suffix}.mp3`);

      console.log(`[Audio Processor] Creating ${quality} variant (${preset.bitrate})`);
      await transcodeAudio(inputFile, outputFile, preset.bitrate, true);

      // Generate R2 path for variant
      const originalDir = path.dirname(audioUrl);
      const originalName = path.basename(audioUrl, path.extname(audioUrl));
      const variantPath = `${originalDir}/${originalName}${preset.suffix}.mp3`;

      // Upload to R2
      const { readFile } = await import('fs/promises');
      const variantBuffer = await readFile(outputFile);
      await uploadToR2(variantPath, variantBuffer, 'audio/mpeg');
      console.log(`[Audio Processor] Uploaded ${quality} variant to R2: ${variantPath}`);

      variants.push({
        quality: quality as QualityLevel,
        path: variantPath,
        bitrate: preset.bitrate,
      });

      // Clean up variant file
      await unlink(outputFile).catch(() => {});
    }

    // Clean up input file
    await unlink(inputFile).catch(() => {});

    console.log(`[Audio Processor] Processing complete for track ${trackId}`);

    return {
      success: true,
      originalPath: audioUrl,
      variants,
      metadata,
    };
  } catch (error: any) {
    console.error(`[Audio Processor] Error processing track ${trackId}:`, error);

    // Clean up on error
    await unlink(inputFile).catch(() => {});

    return {
      success: false,
      originalPath: audioUrl,
      variants: [],
      metadata: {
        duration: 0,
        bitrate: 0,
        sampleRate: 44100,
        channels: 2,
        codec: 'unknown',
      },
      error: error.message,
    };
  }
}

/**
 * Delete all quality variants for a track
 */
export async function deleteTrackVariants(audioUrl: string): Promise<void> {
  const dir = path.dirname(audioUrl);
  const name = path.basename(audioUrl, path.extname(audioUrl));

  for (const preset of Object.values(QUALITY_PRESETS)) {
    const variantPath = `${dir}/${name}${preset.suffix}.mp3`;
    try {
      await deleteFromR2(variantPath);
      console.log(`[Audio Processor] Deleted variant: ${variantPath}`);
    } catch (error) {
      // Variant might not exist, ignore
    }
  }
}

/**
 * Get the appropriate quality variant path
 */
export function getQualityVariantPath(audioUrl: string, quality: QualityLevel): string {
  const preset = QUALITY_PRESETS[quality];
  const dir = path.dirname(audioUrl);
  const name = path.basename(audioUrl, path.extname(audioUrl));
  return `${dir}/${name}${preset.suffix}.mp3`;
}
