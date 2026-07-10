// Tiny zero-dependency (besides the Anthropic SDK) dev API server.
//
//   node server/dev-server.mjs   (or: npm run dev:api)
//
// Serves POST /api/generate-items on API_PORT (default 8787). Vite proxies /api
// to it during development so the browser calls the same relative path it will
// in production. Reads ANTHROPIC_API_KEY from the environment / a .env file.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateItems } from './anthropic.mjs';

// Minimal .env loader (avoids a dotenv dependency).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const PORT = process.env.API_PORT || 8787;

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === 'POST' && req.url === '/api/generate-items') {
    try {
      const raw = await readBody(req);
      const { topic, count } = raw ? JSON.parse(raw) : {};
      const result = await generateItems({
        topic: topic ?? '',
        count: count ?? 15,
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      const status = err.statusCode ?? 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message ?? 'Failed' }));
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  console.log(`[YourBid] dev API server on http://localhost:${PORT}`);
  console.log(
    `[YourBid] ANTHROPIC_API_KEY ${hasKey ? 'detected' : 'MISSING (set it in .env)'}`
  );
});
