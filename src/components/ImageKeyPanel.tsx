import { useState } from 'react';
import { loadImageConfig, saveImageConfig } from '../services/imageConfig';

/**
 * Host-only panel for item images. Optional Pexels key (stored ONLY in this
 * browser) powers the clean auto-image on each card. Without it, images use the
 * free Wikipedia + Openverse sources. Every item also has a "See images" button
 * that opens Google Images in a new tab — that needs no setup.
 */
export function ImageKeyPanel() {
  const [pexels, setPexels] = useState(() => loadImageConfig().pexelsKey);
  const [reveal, setReveal] = useState(false);

  const updatePexels = (value: string) => {
    setPexels(value);
    saveImageConfig({ pexelsKey: value });
  };

  const pexelsSet = pexels.trim().length > 0;

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

      <span className="faint tiny">
        Every item also has a “🔍 See images” button that opens Google Images for
        the exact item in a new tab — no setup needed.
      </span>

      {pexelsSet && (
        <div className="info-banner tiny">
          🔒 Your Pexels key stays in this browser only and is sent straight to
          Pexels — never saved to the game or shared with players.
        </div>
      )}
    </div>
  );
}
