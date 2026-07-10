import { useState } from 'react';
import {
  loadAiConfig,
  saveAiConfig,
  PROVIDER_LABELS,
  DEFAULT_MODELS,
  isAiReady,
  type AiConfig,
  type AiProvider,
} from '../services/aiConfig';

const KEY_HINTS: Record<AiProvider, string> = {
  none: '',
  gemini: 'Get a key at aistudio.google.com/apikey',
  anthropic: 'Get a key at console.anthropic.com',
};

/**
 * Host-only panel to choose the item-generation provider and paste an API key.
 * The key is stored ONLY in this browser (localStorage) and sent directly to
 * the provider — never to Firebase or any YourBid server.
 */
export function AiKeyPanel() {
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());
  const [reveal, setReveal] = useState(false);

  const update = (patch: Partial<AiConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveAiConfig(next);
  };

  const ready = isAiReady(config);

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row spread">
        <span className="brand-sub">Item generation</span>
        <span
          className="tag"
          style={{ color: ready ? 'var(--accent-3)' : 'var(--text-dim)' }}
        >
          {config.provider === 'none'
            ? 'Offline demo'
            : ready
              ? `Live · ${PROVIDER_LABELS[config.provider]}`
              : 'Key needed'}
        </span>
      </div>

      <div className="field">
        <label>Provider</label>
        <select
          className="input"
          value={config.provider}
          onChange={(e) =>
            update({ provider: e.target.value as AiProvider, model: '' })
          }
        >
          {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {config.provider !== 'none' && (
        <>
          <div className="field">
            <label>API key</label>
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input"
                type={reveal ? 'text' : 'password'}
                value={config.apiKey}
                placeholder="Paste your key…"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => update({ apiKey: e.target.value })}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setReveal((r) => !r)}
                type="button"
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </div>
            <span className="faint tiny">{KEY_HINTS[config.provider]}</span>
          </div>

          <div className="field">
            <label>Model (optional)</label>
            <input
              className="input"
              value={config.model}
              placeholder={DEFAULT_MODELS[config.provider]}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => update({ model: e.target.value })}
            />
          </div>

          <div className="info-banner tiny">
            🔒 Your key stays in this browser only and is sent straight to{' '}
            {PROVIDER_LABELS[config.provider]}. It’s never saved to the game or
            shared with other players. For extra safety, restrict the key in the
            provider console.
          </div>
        </>
      )}

      {config.provider === 'none' && (
        <span className="faint tiny">
          No key needed — plays with a bundled pack of real sample items. Pick a
          provider and paste a key to generate real items for any topic.
        </span>
      )}
    </div>
  );
}
