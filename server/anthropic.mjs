// Shared server-side item generation. Imported by both the Vercel serverless
// function (api/generate-items.ts) and the local dev API server
// (server/dev-server.mjs). Runs ONLY on the server so the API key is never
// exposed to the client.

import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export function buildSystemPrompt() {
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

export function buildUserPrompt(topic, count) {
  return [
    `TOPIC: ${topic}`,
    `Return up to ${count} items that match the topic and all its constraints.`,
    'Prefer well-known, clearly verifiable items. If the topic is too narrow to',
    `reach ${count}, return only the ones you are confident about.`,
  ].join('\n');
}

/** Extract the first JSON object from a model response and parse `items`. */
export function parseItems(text) {
  let jsonText = text.trim();
  // Strip code fences if the model added them despite instructions.
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) jsonText = fence[1].trim();
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start !== -1 && end !== -1) jsonText = jsonText.slice(start, end + 1);

  const parsed = JSON.parse(jsonText);
  const rawItems = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(rawItems)) throw new Error('Response missing items array');

  const items = [];
  const seen = new Set();
  for (const it of rawItems) {
    if (!it || typeof it.name !== 'string') continue;
    const name = it.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      name,
      description:
        typeof it.description === 'string' ? it.description.trim() : '',
      category:
        typeof it.category === 'string' && it.category.trim()
          ? it.category.trim()
          : 'Item',
    });
  }
  return items;
}

/**
 * Generate items for a topic. Returns { items } on success.
 * Throws on missing key / API / parse errors so callers can respond 4xx/5xx.
 */
export async function generateItems({ topic, count, apiKey, model }) {
  if (!topic || !topic.trim()) {
    const err = new Error('Missing topic');
    err.statusCode = 400;
    throw err;
  }
  if (!apiKey) {
    const err = new Error('Server is missing ANTHROPIC_API_KEY');
    err.statusCode = 500;
    throw err;
  }

  const client = new Anthropic({ apiKey });
  const requested = Math.max(1, Math.min(50, Math.floor(count || 15)));

  const message = await client.messages.create({
    model: model || DEFAULT_MODEL,
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(topic, requested) }],
  });

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const items = parseItems(text);
  return { items, requested };
}
