# YourBid 🪙

A real-time multiplayer **auction party game**. A host enters a free-form topic,
the app generates real, verifiable items matching it, and up to 5 players bid a
limited virtual currency ("Bids") on the items one at a time. After bidding,
everyone rates every won item, and the ratings decide the winner.

Mobile-first (portrait phones), fully usable on desktop. Dark, game-like UI with
bid animations and a live countdown timer.

---

## Quick start (Practice mode — zero config)

```bash
npm install
npm run dev
```

Open the local URL, tap **Practice vs 2 Bots**, enter a topic (e.g. `Drake
songs`), and play the full loop against bots. Practice mode runs entirely in the
browser and needs **no** Firebase and **no** Anthropic key — item generation
falls back to a bundled pack of real items when the API isn't configured.

## Real item generation (recommended: bring your own key)

**No server or Vercel required.** In the **Lobby**, the host opens the **Item
generation** panel, picks a provider — **Google Gemini** or **Anthropic Claude**
— and pastes their own API key. The app then calls that provider directly from
the host's browser to generate real items for any topic.

- Get a Gemini key at <https://aistudio.google.com/apikey>, or a Claude key at
  <https://console.anthropic.com>.
- The key is stored **only in the host's browser** (localStorage). It is never
  written to Firebase, never sent to any YourBid server, and never committed.
- Because the request comes from the browser, restrict your key in the provider
  console for safety (e.g. an HTTP-referrer restriction on a Gemini key).
- No key? Leave the provider on **Offline demo** to play with a bundled pack of
  real sample items.

This is the whole point: it works on plain static hosting like GitHub Pages with
zero backend.

### Optional: server-side key instead (Vercel)

If you'd rather keep the key server-side, `api/generate-items.ts` runs as a
Vercel serverless function. Copy `.env.example` → `.env`, set
`ANTHROPIC_API_KEY`, and run the local dev API (`npm run dev:api` alongside
`npm run dev`; Vite proxies `/api` to it). On Vercel, just set `ANTHROPIC_API_KEY`
in the project env. The app uses this path automatically when no in-app key is
set. (For a static host, you can point at an off-origin function with the
`VITE_API_BASE_URL` build variable.)

## Multiplayer (Firebase Realtime Database)

Open **`src/firebase.ts`** and replace the clearly-marked `REPLACE_ME`
placeholders with your Firebase web-app config, then enable Realtime Database.
Until you do, **Create/Join Room** are disabled and the app runs in local /
practice mode only. Suggested database rules are documented in that same file.

## Deploy to GitHub Pages

A workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
builds and publishes the app on every push to `main`.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The site publishes to `https://<owner>.github.io/<repo>/`
   (the asset base path is set automatically from the repo name).

**What works on Pages** (it's static hosting):

- ✅ **Practice mode** — fully, offline, no setup.
- ✅ **Multiplayer** — Firebase is a hosted service, so it works from static
  hosting once you fill in `src/firebase.ts`.
- ✅ **Real item generation** — the host pastes a Gemini or Claude key into the
  in-app **Item generation** panel; the browser calls the provider directly. No
  serverless function needed on Pages.

> The `/api` serverless function does not run on Pages, but you don't need it —
> the in-app key path covers generation. (If you'd rather host the whole thing
> with a server-side key, deploy to **Vercel** with `ANTHROPIC_API_KEY` set; see
> [`vercel.json`](vercel.json).)

---

## How the game works

- **Topic** is a free-form search string, not a category. Constraints embedded in
  it — date ranges, people, genres, decades, prices — are respected. The
  generation model is instructed to return **only real items it's confident
  exist and match every constraint**, and to return *fewer* rather than
  fabricate. If too few real items are found, the host is asked to broaden the
  topic (with the found count shown). Items are deduplicated and shuffled.
- **Item scaling:** `total = max(baseItemCount, ceil(players × slots × 0.6))`,
  but always **less than** `players × slots`, so scarcity exists and not
  everyone can fill every slot.
- **Bidding:** items are auctioned one at a time. Turn order rotates each item
  and the previous winner bids last. The turn player opens (min bid 1) or passes;
  if everyone passes, the item is discarded. After any bid, others have **5
  seconds** to raise — each raise resets the timer. Highest bidder wins and pays.
  Players with 0 Bids or full slots are skipped.
- **Scoring:** each item's value = the average of all 1–10 ratings (one decimal).
  A player's score = the sum of their won items' values − 1 per unfilled slot.
  Leftover currency is worth nothing.
- **Disconnects:** a disconnected player's turns are auto-skipped and their
  pending ratings default to 5. If the host drops, the next player is promoted.

## Currency

The currency is labelled **"Bids"** but its name and icon are defined in one
place — [`src/config/currency.ts`](src/config/currency.ts) — so it can later
integrate with the external **VERSE** token system. Change it there only.

---

## Architecture

The game runs on a single pure state machine so practice and multiplayer share
identical rules:

- [`src/game/reducer.ts`](src/game/reducer.ts) — authoritative `reduce(state,
  action, now)` state machine (all bidding/rating/scoring transitions).
- [`src/game/logic.ts`](src/game/logic.ts) — pure helpers (item scaling, turn
  order, eligibility, scoring).
- [`src/game/bots.ts`](src/game/bots.ts) — bot decision logic for practice mode.
- [`src/store/practiceController.ts`](src/store/practiceController.ts) — local,
  single-client controller that runs the reducer + drives the timer and bots.
- [`src/store/firebaseController.ts`](src/store/firebaseController.ts) —
  host-authoritative multiplayer: clients push actions to a queue, the host runs
  the same reducer and writes state to the Realtime Database. Timers are
  authoritative from the host so all countdowns stay synced.
- `src/screens/*` — Home, Lobby, Generating, Auction, Rating, Results.
- `api/generate-items.ts` + `server/` — server-side Anthropic item generation.

### Verify the game logic

A headless full-game simulation drives the real reducer and bots end-to-end:

```bash
npm run sim
```

## Scripts

| command           | what it does                                   |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Vite dev server (frontend)                     |
| `npm run dev:api` | Local Anthropic item-generation API on :8787   |
| `npm run build`   | Type-check + production build to `dist/`       |
| `npm run preview` | Preview the production build                   |
| `npm run sim`     | Headless full-game logic simulation            |

## Tech

React + TypeScript + Vite · Firebase Realtime Database · Anthropic API
(server-side item generation).
