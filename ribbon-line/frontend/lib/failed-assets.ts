// Simple in-memory cache for failed asset URLs to prevent repeated 404 requests
const failedAssets = new Set<string>();

export function markAssetAsFailed(url: string) {
  failedAssets.add(url);
}

export function hasAssetFailed(url: string): boolean {
  return failedAssets.has(url);
}

export function clearFailedAssetCache() {
  failedAssets.clear();
}
