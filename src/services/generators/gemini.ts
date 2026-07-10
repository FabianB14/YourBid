// Call the Google Gemini API directly from the browser. The generativelanguage
// endpoint is CORS-enabled, so no server is required — the host's key goes
// straight from their browser to Google.

import type { Item } from '../../types';
import { buildSystemPrompt, buildUserPrompt, parseItems } from '../prompt';

export async function generateWithGemini(
  topic: string,
  count: number,
  apiKey: string,
  model: string
): Promise<Array<Omit<Item, 'id'>>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(topic, count) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body?.error?.message || `Gemini request failed (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: { text?: string }) => p.text || '')
    .join('\n');
  if (!text.trim()) throw new Error('Gemini returned an empty response.');
  return parseItems(text);
}
