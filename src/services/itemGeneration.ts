// Client-side item generation.
//
// Calls the server endpoint (which holds the Anthropic key). If the endpoint is
// unreachable or not configured, falls back to a bundled real-item pack so the
// full game loop stays testable before any backend is wired up (practice mode).

import type { Item } from '../types';
import { makeId } from '../utils/misc';
import { dedupeItems } from '../game/logic';
import { sampleItemsForTopic } from './sampleItems';

export interface GenerationResult {
  items: Item[];
  requested: number;
  found: number;
  usedFallback: boolean;
}

export async function generateItems(
  topic: string,
  count: number
): Promise<GenerationResult> {
  const requested = count;
  try {
    const res = await fetch('/api/generate-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, count }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    const data = (await res.json()) as {
      items: Array<Omit<Item, 'id'>>;
      requested?: number;
    };
    const items = dedupeItems(
      data.items.map((it) => ({ ...it, id: makeId('item') }))
    );
    return {
      items,
      requested: data.requested ?? requested,
      found: items.length,
      usedFallback: false,
    };
  } catch (err) {
    // Fallback: bundled real items so the loop is testable offline.
    console.warn(
      '[YourBid] /api/generate-items unavailable, using offline sample pack.',
      err
    );
    const items = dedupeItems(sampleItemsForTopic(topic));
    return { items, requested, found: items.length, usedFallback: true };
  }
}
