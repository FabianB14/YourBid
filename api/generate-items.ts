// Vercel-style serverless function: POST /api/generate-items
//
// Body: { topic: string, count?: number }
// Returns: { items: Array<{ name, description, category }>, requested: number }
//
// The Anthropic API key is read from the ANTHROPIC_API_KEY environment variable
// on the server only — it is never sent to the browser.
//
// Deploy target: Vercel (or any platform that runs /api/*.ts as a Node
// function). For local development use `npm run dev:api` (server/dev-server.mjs),
// which Vite proxies to.

// @ts-ignore - shared JS module, no type declarations needed here.
import { generateItems } from '../server/anthropic.mjs';

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (k: string, v: string) => void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { topic, count } = body as { topic?: string; count?: number };
    const result = await generateItems({
      topic: topic ?? '',
      count: count ?? 15,
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL,
    });
    res.status(200).json(result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    res.status(e.statusCode ?? 500).json({
      error: e.message ?? 'Failed to generate items',
    });
  }
}
