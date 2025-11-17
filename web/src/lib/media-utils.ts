/**
 * Media URL utilities
 * Converts R2 storage paths to accessible media URLs
 */

/**
 * Convert an R2 storage path to a media API URL
 * @param r2Path - Path in R2 storage (e.g., "albums/covers/image.jpg")
 * @returns Accessible URL (e.g., "/api/media/albums/covers/image.jpg")
 */
export function getMediaUrl(r2Path: string | null | undefined): string | undefined {
  if (!r2Path) return undefined;

  // If it's already a full URL, return as-is
  if (r2Path.startsWith('http://') || r2Path.startsWith('https://')) {
    return r2Path;
  }

  // If it's already a media API URL, return as-is
  if (r2Path.startsWith('/api/media/')) {
    return r2Path;
  }

  // Convert R2 path to media API URL
  return `/api/media/${r2Path}`;
}

/**
 * Get cover art URL with fallback
 */
export function getCoverArtUrl(
  coverArtUrl: string | null | undefined,
  fallbackUrl?: string
): string | undefined {
  const url = getMediaUrl(coverArtUrl);
  if (url) return url;
  return fallbackUrl;
}

/**
 * Get avatar URL with fallback
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  fallbackUrl?: string
): string | undefined {
  const url = getMediaUrl(avatarUrl);
  if (url) return url;
  return fallbackUrl;
}
