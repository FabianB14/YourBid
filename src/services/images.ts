// Best-effort item image resolution — no API key, no backend.
//
// Two free, CORS-enabled sources are used so this works from a static host
// (GitHub Pages) in the player's browser:
//   - iTunes Search API  → official artwork for songs, albums, movies.
//   - Wikipedia action API (generator=search + pageimages) → thumbnails for
//     everything else (sneakers, foods, places, people, landmarks…).
//
// Every lookup is best-effort with a short timeout; a miss simply leaves the
// item without an image and the UI shows its styled placeholder card.

import type { Item } from '../types';
import { loadImageConfig } from './imageConfig';

const TIMEOUT_MS = 4000;

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function classify(item: Item): 'music' | 'movie' | 'other' {
  const hay = `${item.category} ${item.description}`.toLowerCase();
  if (/\b(song|album|single|track|ep|music|artist|band)\b/.test(hay)) return 'music';
  if (/\b(movie|film|cinema|show|series|tv|documentary)\b/.test(hay)) return 'movie';
  return 'other';
}

/** iTunes artwork (upgraded to a larger size). */
async function fromItunes(
  term: string,
  media: 'music' | 'movie'
): Promise<string | null> {
  const entity = media === 'music' ? 'musicTrack' : 'movie';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term
  )}&media=${media}&entity=${entity}&limit=1`;
  const data = await fetchJson(url);
  const art: string | undefined = data?.results?.[0]?.artworkUrl100;
  if (!art) return null;
  // e.g. .../100x100bb.jpg -> .../600x600bb.jpg
  return art.replace(/\/\d+x\d+bb\.(jpg|png)/, '/600x600bb.$1');
}

/** Wikipedia page thumbnail via fuzzy search (handles imperfect names well). */
async function fromWikipedia(query: string): Promise<string | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=500' +
    `&gsrsearch=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const pages = data?.query?.pages;
  if (!pages) return null;
  for (const key of Object.keys(pages)) {
    const thumb = pages[key]?.thumbnail?.source;
    if (thumb) return thumb;
  }
  return null;
}

/**
 * Pexels image search — keyed (free), CORS-enabled. Returns a real photo for
 * almost any query, so it's the reliable catch-all when a key is provided.
 */
async function fromPexels(query: string, key: string): Promise<string | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape`;
  const data = await fetchJson(url, { headers: { Authorization: key } });
  const photo = data?.photos?.[0]?.src;
  return photo?.large || photo?.medium || photo?.original || null;
}

/**
 * Openverse image search — keyless, CORS-enabled, ~700M openly-licensed images
 * (incl. Flickr/Wikimedia). Broad coverage for real-world products (sneakers,
 * foods, gadgets) that don't have a Wikipedia page.
 */
async function fromOpenverse(query: string): Promise<string | null> {
  const url =
    'https://api.openverse.org/v1/images/' +
    `?q=${encodeURIComponent(query)}&page_size=1&mature=false`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } });
  const first = data?.results?.[0];
  return first?.thumbnail || first?.url || null;
}

export function looksLikeAnime(text: string): boolean {
  return /\b(anime|manga|naruto|dragon ?ball|one piece|pok[eé]mon|studio ghibli|shonen|shounen|cartoon|animated (series|character))\b/i.test(
    text
  );
}

/** Jikan (MyAnimeList) — real anime character art, keyless & CORS-enabled. */
async function fromJikanCharacters(name: string, limit: number): Promise<string[]> {
  const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(
    name
  )}&order_by=favorites&sort=desc&limit=${limit}`;
  const data = await fetchJson(url);
  return (data?.data || [])
    .map((c: any) => c?.images?.webp?.image_url || c?.images?.jpg?.image_url)
    .filter(Boolean);
}

/** Wikipedia page thumbnails via fuzzy search (multiple results). */
async function fromWikipediaMany(query: string, limit: number): Promise<string[]> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    `&generator=search&gsrlimit=${limit}&prop=pageimages&piprop=thumbnail&pithumbsize=500` +
    `&gsrsearch=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const pages = data?.query?.pages || {};
  return Object.values(pages)
    .map((p: any) => p?.thumbnail?.source)
    .filter(Boolean);
}

async function fromPexelsMany(query: string, key: string, limit: number): Promise<string[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=${limit}`;
  const data = await fetchJson(url, { headers: { Authorization: key } });
  return (data?.photos || [])
    .map((p: any) => p?.src?.large || p?.src?.medium)
    .filter(Boolean);
}

async function fromOpenverseMany(query: string, limit: number): Promise<string[]> {
  const url =
    'https://api.openverse.org/v1/images/' +
    `?q=${encodeURIComponent(query)}&page_size=${limit}`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } });
  return (data?.results || []).map((r: any) => r?.thumbnail || r?.url).filter(Boolean);
}

/**
 * Return several candidate image URLs for the in-page gallery, using the best
 * sources for the content: real anime art (Jikan) when the topic is anime,
 * Wikipedia for notable subjects, Pexels/Openverse for real-world photos.
 */
export async function searchImages(opts: {
  name: string;
  query: string;
  pexelsKey?: string;
  anime?: boolean;
  limit?: number;
}): Promise<string[]> {
  const { name, query, pexelsKey = '', anime = false, limit = 9 } = opts;
  const out: string[] = [];
  const add = (u?: string | null) => {
    if (u && !out.includes(u) && out.length < limit) out.push(u);
  };

  const sources: Array<() => Promise<string[]>> = [];
  // Anime characters first when the topic looks like anime — the real art.
  if (anime) sources.push(() => fromJikanCharacters(name, limit));
  if (pexelsKey) sources.push(() => fromPexelsMany(query, pexelsKey, limit));
  sources.push(() => fromWikipediaMany(query, 4));
  sources.push(() => fromOpenverseMany(query, limit));

  for (const src of sources) {
    if (out.length >= limit) break;
    try {
      (await src()).forEach(add);
    } catch {
      /* try next */
    }
  }
  return out.slice(0, limit);
}

/** Resolve one item's image, trying the most likely sources in order.
 *  `context` (usually the topic) is appended to stock-library queries so an
 *  item like "Sasuke Uchiha" is searched as "Sasuke Uchiha Naruto anime". */
export async function resolveItemImage(
  item: Item,
  pexelsKey = '',
  context = ''
): Promise<string | null> {
  const kind = classify(item);
  const name = item.name;
  const anime = looksLikeAnime(`${context} ${item.category} ${name}`);
  // Contextual query for stock libraries; keep the plain name for exact-match
  // sources (iTunes/Wikipedia do better without extra words).
  const ctxQuery = [name, context].filter(Boolean).join(' ').trim();
  const tries: Array<() => Promise<string | null>> = [];

  // Real anime art first when the topic looks like anime.
  if (anime) {
    tries.push(async () => (await fromJikanCharacters(name, 1))[0] || null);
  }

  // Exact-match sources (accurate cover/poster art & article images).
  if (kind === 'music') {
    tries.push(() => fromItunes(name, 'music'));
    tries.push(() => fromWikipedia(`${name} song`));
  } else if (kind === 'movie') {
    tries.push(() => fromItunes(name, 'movie'));
    tries.push(() => fromWikipedia(`${name} film`));
  } else {
    tries.push(() => fromWikipedia(name));
  }

  // Pexels (if a key is set) — a real photo for almost anything.
  if (pexelsKey) {
    tries.push(() => fromPexels(ctxQuery, pexelsKey));
    tries.push(() => fromPexels(`${name} ${item.category}`.trim(), pexelsKey));
  }

  // Keyless catch-alls, last.
  tries.push(() => fromOpenverse(ctxQuery));
  tries.push(() => fromOpenverse(name));

  for (const attempt of tries) {
    try {
      const url = await attempt();
      if (url) return url;
    } catch {
      /* try next source */
    }
  }
  return null;
}

/**
 * Resolve images for many items in parallel (best-effort). Returns new item
 * objects with `imageUrl` set where found. Run once by the host at generation
 * time so every player sees the same artwork from synced state (rather than
 * each client fetching independently, which can miss).
 */
export async function enrichItemsWithImages(
  items: Item[],
  context = '',
  perItemBudgetMs = 7000
): Promise<Item[]> {
  const { pexelsKey } = loadImageConfig();
  const urls = await Promise.all(
    items.map((it) =>
      Promise.race<string | null>([
        resolveItemImage(it, pexelsKey, context).catch(() => null),
        new Promise<null>((r) => setTimeout(() => r(null), perItemBudgetMs)),
      ])
    )
  );
  // Items still without a URL are left for the per-client lazy lookup during
  // play (useItemImage), so a couple of slow lookups never hold up game start.
  return items.map((it, i) => (urls[i] ? { ...it, imageUrl: urls[i] } : it));
}
