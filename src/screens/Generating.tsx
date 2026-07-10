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
    return (
      <div className="screen center" style={{ gap: 20 }}>
        <div className="card stack center" style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <h2>Topic a little too narrow</h2>
          <p className="muted" style={{ margin: 0 }}>
            {gen.message ||
              'Not enough real items matched all the constraints.'}
          </p>
          {gen.found != null && gen.requested != null && (
            <div className="info-banner">
              Found <strong>{gen.found}</strong> real{' '}
              {gen.found === 1 ? 'item' : 'items'}, needed{' '}
              <strong>{gen.requested}</strong>. Try broadening the topic — widen a
              date range, drop a price cap, or be less specific.
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
