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

/** Resolve one item's image, trying the most likely sources in order. */
export async function resolveItemImage(item: Item): Promise<string | null> {
  const kind = classify(item);
  const name = item.name;
  const tries: Array<() => Promise<string | null>> = [];
  if (kind === 'music') {
    tries.push(() => fromItunes(name, 'music'));
    tries.push(() => fromWikipedia(`${name} song`));
  } else if (kind === 'movie') {
    tries.push(() => fromItunes(name, 'movie'));
    tries.push(() => fromWikipedia(`${name} film`));
  } else {
    tries.push(() => fromWikipedia(name));
  }
  // Openverse is the broad catch-all so places, houses, foods, products, etc.
  // still get a real photo when the specific sources miss. Try the exact name
  // first, then add category context as a looser fallback.
  tries.push(() => fromOpenverse(name));
  tries.push(() => fromOpenverse(`${name} ${item.category}`.trim()));

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
  perItemBudgetMs = 7000
): Promise<Item[]> {
  const urls = await Promise.all(
    items.map((it) =>
      Promise.race<string | null>([
        resolveItemImage(it).catch(() => null),
        new Promise<null>((r) => setTimeout(() => r(null), perItemBudgetMs)),
      ])
    )
  );
  // Items still without a URL are left for the per-client lazy lookup during
  // play (useItemImage), so a couple of slow lookups never hold up game start.
  return items.map((it, i) => (urls[i] ? { ...it, imageUrl: urls[i] } : it));
}
