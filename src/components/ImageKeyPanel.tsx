import { useState } from 'react';
import type { GameController } from '../store/controller';
import type { GameState } from '../types';
import { loadImageConfig, saveImageConfig } from '../services/imageConfig';

/**
 * Host-only panel for item images:
 *  - Pexels key (optional): stored ONLY in this browser, used for the clean
 *    auto-image on each card.
 *  - Google Search Engine ID (cx, optional): public by design, so it's saved to
 *    the synced game settings and powers the "See real images" widget for every
 *    player.
 */
export function ImageKeyPanel({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const [pexels, setPexels] = useState(() => loadImageConfig().pexelsKey);
  const [cx, setCx] = useState(state.settings.imageSearchCx);
  const [reveal, setReveal] = useState(false);

  const updatePexels = (value: string) => {
    setPexels(value);
    saveImageConfig({ pexelsKey: value });
  };
  const updateCx = (value: string) => {
    setCx(value);
    controller.updateSettings({ imageSearchCx: value.trim() });
  };

  const pexelsSet = pexels.trim().length > 0;
  const cxSet = cx.trim().length > 0;

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row spread">
        <span className="brand-sub">Item images</span>
        <span
          className="tag"
          style={{ color: pexelsSet ? 'var(--accent-3)' : 'var(--text-dim)' }}
        >
          {pexelsSet ? 'Pexels on' : 'Free sources'}
        </span>
      </div>

      <div className="field">
        <label>Pexels API key (optional)</label>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            type={reveal ? 'text' : 'password'}
            value={pexels}
            placeholder="Paste your Pexels key…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => updatePexels(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => setReveal((r) => !r)}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className="faint tiny">
          Free key in ~1 min at pexels.com/api — a real photo for almost any
          item. Without it, images use free Wikipedia + Openverse.
        </span>
      </div>

      <div className="field">
        <label>Google image search ID (optional)</label>
        <input
          className="input"
          value={cx}
          placeholder="Search engine ID (cx)…"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => updateCx(e.target.value)}
        />
        <span className="faint tiny">
          Adds a “🔍 See real images” button on each item — live Google Images for
          the exact thing. Create a free engine at
          programmablesearchengine.google.com (turn on Image search) and paste
          its ID here. Shared with all players. {cxSet ? '✓ on' : ''}
        </span>
      </div>

      {(pexelsSet || cxSet) && (
        <div className="info-banner tiny">
          🔒 The Pexels key stays in your browser. The Google ID is public by
          design and shared with players so the button works for everyone.
        </div>
      )}
    </div>
  );
}
