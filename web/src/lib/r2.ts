/**
 * Cloudflare R2 Client Configuration
 *
 * This module provides utilities for interacting with Cloudflare R2 storage.
 * R2 is S3-compatible, so we use the AWS SDK.
 */

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate required environment variables
const requiredEnvVars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// R2 endpoint URL
const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * Initialize S3 client configured for Cloudflare R2
 */
export const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' for region
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * Generate a signed URL for streaming a track
 *
 * @param trackPath - Path to the track in R2 (e.g., "tracks/artist/song.mp3")
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL that can be used to stream the track
 */
export async function getTrackStreamUrl(
  trackPath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: trackPath,
  });

  // Generate a pre-signed URL
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return signedUrl;
}

/**
 * Upload a file to R2
 *
 * @param key - Object key (path) in R2
 * @param body - File content (Buffer or stream)
 * @param contentType - MIME type of the file
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

/**
 * Delete a file from R2
 *
 * @param key - Object key (path) to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Get a direct public URL (if bucket is public)
 * For private buckets, use getTrackStreamUrl instead
 *
 * @param key - Object key
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}
