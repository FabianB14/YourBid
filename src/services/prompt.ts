// Shared prompt + response parsing for client-side item generation. Mirrors the
// rules in server/anthropic.mjs so every provider (Gemini, Claude, or the
// serverless function) enforces the same "real items only, strict JSON" bar.

import type { Item } from '../types';

export function buildSystemPrompt(): string {
  return [
    'You generate items for an auction party game called YourBid.',
    'The user gives a free-form TOPIC which is a search string, not a category.',
    '',
    'CRITICAL RULES:',
    '1. Every item MUST be a REAL, verifiable thing that actually exists and',
    '   genuinely matches the topic. Never invent, guess, or approximate.',
    '2. Respect EVERY constraint embedded in the topic string: date ranges,',
    '   named people, genres, decades, price ranges, locations, etc. If the',
    '   topic says "Denzel Washington movies 2000-2010", every item must be a',
    '   real Denzel Washington film released in that window.',
    '3. Only include an item if you are confident it exists and matches ALL',
    '   constraints. When unsure, OMIT it. Return FEWER items rather than',
    '   fabricate or include borderline matches.',
    '4. No duplicates.',
    '',
    'Return STRICT JSON only (no markdown, no prose) in exactly this shape:',
    '{"items":[{"name":"...","description":"one sentence with year/album/context where relevant","category":"short tag"}]}',
    'Each description is a single sentence. Each category is a short tag like',
    '"Song", "Movie", "Sneaker", or "Dish".',
  ].join('\n');
}

export function buildUserPrompt(topic: string, count: number): string {
  return [
    `TOPIC: ${topic}`,
    `Return up to ${count} items that match the topic and all its constraints.`,
    'Prefer well-known, clearly verifiable items. If the topic is too narrow to',
    `reach ${count}, return only the ones you are confident about.`,
  ].join('\n');
}

/** Extract the first JSON object from model text and parse its `items`. */
export function parseItems(text: string): Array<Omit<Item, 'id'>> {
  let jsonText = text.trim();
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) jsonText = fence[1].trim();
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start !== -1 && end !== -1) jsonText = jsonText.slice(start, end + 1);

  const parsed = JSON.parse(jsonText);
  const rawItems = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(rawItems)) throw new Error('Response missing items array');

  const items: Array<Omit<Item, 'id'>> = [];
  const seen = new Set<string>();
  for (const it of rawItems) {
    if (!it || typeof it.name !== 'string') continue;
    const name = it.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      name,
      description: typeof it.description === 'string' ? it.description.trim() : '',
      category:
        typeof it.category === 'string' && it.category.trim()
          ? it.category.trim()
          : 'Item',
    });
  }
  return items;
}
