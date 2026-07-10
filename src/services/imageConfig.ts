// Optional image-search key (Pexels). Stored ONLY in the host's browser
// (localStorage), sent directly to Pexels, never to Firebase or any server.
//
// Pexels gives a real photo for almost any query — great for places, houses,
// foods, scenery, and products. It's used as a strong fallback after the
// exact-match sources (iTunes art / Wikipedia). Without a key, the app still
// uses the free keyless sources (Wikipedia + Openverse).

export interface ImageConfig {
  pexelsKey: string;
}

const STORAGE_KEY = 'yourbid.images.config';

export function loadImageConfig(): ImageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pexelsKey: '' };
    const parsed = JSON.parse(raw) as Partial<ImageConfig>;
    return { pexelsKey: typeof parsed.pexelsKey === 'string' ? parsed.pexelsKey : '' };
  } catch {
    return { pexelsKey: '' };
  }
}

export function saveImageConfig(config: ImageConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* storage unavailable — image lookup just uses keyless sources */
  }
}
