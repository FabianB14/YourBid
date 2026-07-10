// Call the Anthropic Messages API directly from the browser. Anthropic blocks
// browser calls by default; the `anthropic-dangerous-direct-browser-access`
// header opts in. The host's key goes straight from their browser to Anthropic.

import type { Item } from '../../types';
import { buildSystemPrompt, buildUserPrompt, parseItems } from '../prompt';

export async function generateWithAnthropic(
  topic: string,
  count: number,
  apiKey: string,
  model: string
): Promise<Array<Omit<Item, 'id'>>> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(topic, count) }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || `Claude request failed (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text: string = (data?.content || [])
    .filter((b: { type?: string }) => b.type === 'text')
    .map((b: { text?: string }) => b.text || '')
    .join('\n');
  if (!text.trim()) throw new Error('Claude returned an empty response.');
  return parseItems(text);
}
