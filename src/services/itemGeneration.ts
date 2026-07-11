// Client-side item generation orchestrator.
//
// Priority:
//   1. Host-entered key (Gemini or Claude) — called directly from the browser.
//      This is the zero-backend path that works on static hosts (GitHub Pages).
//   2. Same-origin / external serverless function at /api/generate-items
//      (for Vercel-style deploys that keep the key server-side).
//   3. Offline bundled real-item pack, so the full loop stays testable with no
//      key and no backend at all.

import type { Item } from '../types';
import { makeId } from '../utils/misc';
import { dedupeItems } from '../game/logic';
import { sampleItemsForTopic } from './sampleItems';
import {
  loadAiConfig,
  effectiveModel,
  isAiReady,
  type AiConfig,
} from './aiConfig';
import { generateWithGemini } from './generators/gemini';
import { generateWithAnthropic } from './generators/anthropic';
import { enrichItemsWithImages } from './images';
import { isAnniversaryCode, anniversaryItems } from '../secret/anniversary';

export interface GenerationResult {
  items: Item[];
  requested: number;
  found: number;
  /** How the items were produced. */
  source: 'gemini' | 'anthropic' | 'server' | 'offline';
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function withIds(items: Array<Omit<Item, 'id'>>): Item[] {
  return dedupeItems(items.map((it) => ({ ...it, id: makeId('item') })));
}

/**
 * Resolve raw items into a result: assign ids, then attach images once (so in
 * multiplayer the host stores the artwork in shared state and every player sees
 * the same images without each client fetching independently).
 */
async function pack(
  raw: Array<Omit<Item, 'id'>>,
  count: number,
  source: GenerationResult['source'],
  context = ''
): Promise<GenerationResult> {
  const items = await enrichItemsWithImages(withIds(raw), context);
  return { items, requested: count, found: items.length, source };
}

export async function generateItems(
  topic: string,
  count: number,
  config: AiConfig = loadAiConfig()
): Promise<GenerationResult> {
  // 0. 💛 Hidden anniversary auction — unlocked by entering the date as the
  //    topic. Skips generation entirely; works with no key.
  if (isAnniversaryCode(topic)) {
    return pack(anniversaryItems(), count, 'offline');
  }

  // 1. Direct provider call using the host's own key.
  if (isAiReady(config)) {
    const model = effectiveModel(config);
    const raw =
      config.provider === 'gemini'
        ? await generateWithGemini(topic, count, config.apiKey, model)
        : await generateWithAnthropic(topic, count, config.apiKey, model);
    return pack(raw, count, config.provider === 'gemini' ? 'gemini' : 'anthropic', topic);
  }

  // 2. Serverless function (keeps the key server-side, e.g. on Vercel).
  try {
    const res = await fetch(`${API_BASE}/api/generate-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, count }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    const data = (await res.json()) as { items: Array<Omit<Item, 'id'>> };
    return pack(data.items, count, 'server', topic);
  } catch (err) {
    // 3. Offline fallback pack.
    console.warn(
      '[YourBid] No provider key set and /api unavailable — using offline sample pack.',
      err
    );
    return pack(sampleItemsForTopic(topic), count, 'offline', topic);
  }
}
