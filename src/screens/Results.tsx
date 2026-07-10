import { useMemo, useState } from 'react';
import type { GameController } from '../store/controller';
import type { GameState } from '../types';
import { computeResults } from '../game/logic';
import { useGame } from '../store/GameContext';
import { Avatar, Bids } from '../components/ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Results({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const { leave } = useGame();
  const isHost = state.hostId === controller.localPlayerId;
  const canReset = isHost || state.mode === 'practice';
  const rows = useMemo(() => computeResults(state), [state]);
  const [expanded, setExpanded] = useState<string | null>(rows[0]?.playerId ?? null);

  return (
    <div className="screen" style={{ gap: 16 }}>
      <div className="stack center" style={{ gap: 4 }}>
        <div className="brand" style={{ fontSize: 44 }}>Results</div>
        <div className="brand-sub">“{state.topic}”</div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {rows.map((r, i) => {
          const open = expanded === r.playerId;
          return (
            <div key={r.playerId} className={`leader-row${i === 0 ? ' first' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div
                className="row"
                style={{ gap: 14, cursor: 'pointer' }}
                onClick={() => setExpanded(open ? null : r.playerId)}
              >
                <span className={`rank${i === 0 ? ' gold' : ''}`}>
                  {MEDALS[i] ?? i + 1}
                </span>
                <Avatar name={r.name} id={r.playerId} />
                <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 800 }}>
                    {r.name}
                    {r.playerId === controller.localPlayerId ? ' (you)' : ''}
                    {r.isBot ? ' 🤖' : ''}
                  </span>
                  <span className="faint tiny">
                    {r.items.length} {r.items.length === 1 ? 'item' : 'items'} ·{' '}
                    {r.unfilledSlots} empty {r.unfilledSlots === 1 ? 'slot' : 'slots'}
                  </span>
                </div>
                <span className="score">{r.score.toFixed(1)}</span>
              </div>

              {open && (
                <div className="stack" style={{ gap: 6, marginTop: 12 }}>
                  <div className="divider" />
                  {r.items.length === 0 && (
                    <span className="faint tiny">Won no items.</span>
                  )}
                  {r.items.map((it, idx) => (
                    <div key={idx} className="row spread">
                      <div className="stack" style={{ gap: 0, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.item.name}
                        </span>
                        <span className="faint tiny">
                          paid <Bids amount={it.price} />
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--accent-3)' }}>
                        {it.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                  <div className="divider" />
                  <div className="row spread tiny">
                    <span className="muted">Items value</span>
                    <span style={{ fontWeight: 700 }}>+{r.itemsValue.toFixed(1)}</span>
                  </div>
                  <div className="row spread tiny">
                    <span className="muted">
                      Empty-slot penalty ({r.unfilledSlots} × −1)
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                      −{r.penalty.toFixed(1)}
                    </span>
                  </div>
                  <div className="row spread">
                    <span style={{ fontWeight: 800 }}>Final score</span>
                    <span className="score" style={{ fontSize: 22 }}>
                      {r.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canReset ? (
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => controller.playAgain()}
        >
          🔁 Play Again
        </button>
      ) : (
        <div className="info-banner" style={{ textAlign: 'center' }}>
          Waiting for the host to start a new round…
        </div>
      )}
      <button className="btn btn-ghost btn-block" onClick={leave}>
        Exit to Home
      </button>
    </div>
  );
}
