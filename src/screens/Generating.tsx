import type { GameController } from '../store/controller';
import type { GameState } from '../types';

export function Generating({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const isHost = state.hostId === controller.localPlayerId;
  const gen = state.generation;

  if (gen.status === 'error') {
    // A "too narrow" error carries a found count; anything else (bad API key,
    // network, etc.) is a generation failure and gets a different message.
    const tooNarrow = gen.found != null;
    const looksLikeKey = /api key|invalid|401|403|400|permission|unauthor/i.test(
      gen.message || ''
    );
    return (
      <div className="screen center" style={{ gap: 20 }}>
        <div className="card stack center" style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 48 }}>{tooNarrow ? '🔍' : '⚠️'}</div>
          <h2>{tooNarrow ? 'Topic a little too narrow' : 'Couldn’t generate items'}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {gen.message ||
              'Not enough real items matched all the constraints.'}
          </p>
          {tooNarrow && gen.requested != null && (
            <div className="info-banner">
              Found <strong>{gen.found}</strong> real{' '}
              {gen.found === 1 ? 'item' : 'items'}, needed at least{' '}
              <strong>{gen.requested}</strong>. Try broadening the topic — widen a
              date range, drop a price cap, or be less specific.
            </div>
          )}
          {!tooNarrow && looksLikeKey && (
            <div className="info-banner" style={{ textAlign: 'left' }}>
              This usually means the API key is wrong. In the lobby’s Item
              Generation panel, make sure you pasted the actual key:
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                <li>
                  <strong>Gemini</strong> keys start with <code>AIza…</code> (from
                  aistudio.google.com/apikey) — not the project ID like{' '}
                  <code>gen-lang-client-…</code>.
                </li>
                <li>
                  <strong>Claude</strong> keys start with <code>sk-ant-…</code>.
                </li>
                <li>Or switch the provider to “Offline demo” to play now.</li>
              </ul>
            </div>
          )}
          {isHost ? (
            <button
              className="btn btn-primary btn-block"
              onClick={() =>
                controller.dispatch({
                  type: 'SET_GENERATION',
                  generation: { status: 'idle' },
                })
              }
            >
              ← Edit topic
            </button>
          ) : (
            <p className="faint">Waiting for the host to adjust the topic…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen center" style={{ gap: 22 }}>
      <div className="spinner" />
      <div className="stack center" style={{ gap: 6 }}>
        <h2>Finding real items…</h2>
        <p className="muted" style={{ margin: 0 }}>
          Searching for <strong>“{state.topic}”</strong>
        </p>
        <p className="faint tiny" style={{ margin: 0 }}>
          Verifying every item is real and matches your constraints.
        </p>
      </div>
    </div>
  );
}
