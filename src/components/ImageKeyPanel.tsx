import { useState } from 'react';
import { loadImageConfig, saveImageConfig } from '../services/imageConfig';

/**
 * Host-only panel to paste an optional Pexels key for reliable item images.
 * Stored only in this browser; sent directly to Pexels. Without it, the app
 * still uses free keyless image sources (Wikipedia + Openverse).
 */
export function ImageKeyPanel() {
  const [key, setKey] = useState(() => loadImageConfig().pexelsKey);
  const [reveal, setReveal] = useState(false);

  const update = (value: string) => {
    setKey(value);
    saveImageConfig({ pexelsKey: value });
  };

  const set = key.trim().length > 0;

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row spread">
        <span className="brand-sub">Item images</span>
        <span
          className="tag"
          style={{ color: set ? 'var(--accent-3)' : 'var(--text-dim)' }}
        >
          {set ? 'Pexels on' : 'Free sources'}
        </span>
      </div>

      <div className="field">
        <label>Pexels API key (optional)</label>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            type={reveal ? 'text' : 'password'}
            value={key}
            placeholder="Paste your Pexels key…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => update(e.target.value)}
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
          Free key in ~1 min at pexels.com/api — gives real photos for almost any
          item (places, houses, foods, products). Optional: without it, images
          still come from free Wikipedia + Openverse sources.
        </span>
      </div>

      {set && (
        <div className="info-banner tiny">
          🔒 Stored in this browser only and sent straight to Pexels — never
          saved to the game or shared with players.
        </div>
      )}
    </div>
  );
}
