import { useMemo } from 'react';
import type { GameController } from '../store/controller';
import type { GameState, WonItem } from '../types';
import { RATING_MAX, RATING_MIN } from '../config/gameConfig';
import { ItemImage } from '../components/ItemImage';

export function Rating({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const meId = controller.localPlayerId;

  const allWon = useMemo(() => {
    const list: Array<WonItem & { ownerName: string }> = [];
    for (const id of state.playerOrder) {
      for (const w of state.players[id].wonItems) {
        list.push({ ...w, ownerName: state.players[id].name });
      }
    }
    return list;
  }, [state]);

  const pending = allWon.filter((w) => w.ratings[meId] == null);
  const total = allWon.length;
  const done = total - pending.length;

  if (pending.length === 0) {
    // Overall progress across everyone still rating.
    const raters = state.playerOrder.filter((id) => state.players[id].connected);
    let filled = 0;
    let need = 0;
    for (const w of allWon) {
      for (const r of raters) {
        need++;
        if (w.ratings[r] != null) filled++;
      }
    }
    const pct = need ? Math.round((filled / need) * 100) : 100;
    return (
      <div className="screen center" style={{ gap: 20 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2>All rated!</h2>
        <p className="muted">Waiting for everyone else to finish…</p>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div className="progress-track">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="faint tiny" style={{ textAlign: 'center', marginTop: 8 }}>
            {pct}% of ratings in
          </p>
        </div>
      </div>
    );
  }

  const current = pending[0];

  return (
    <div className="screen" style={{ gap: 18 }}>
      <div className="stack" style={{ gap: 6 }}>
        <div className="brand-sub">
          Rate the items · {done + 1} / {total}
        </div>
        <div className="progress-track">
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      <div className="item-card" key={current.key}>
        <ItemImage item={current.item} />
        <span className="tag" style={{ marginBottom: 10 }}>
          {current.item.category}
        </span>
        <div className="item-name">{current.item.name}</div>
        <div className="item-desc">{current.item.description}</div>
        <div className="faint tiny" style={{ marginTop: 12 }}>
          Won by {current.ownerName} · How good is this item?
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <div className="row spread tiny faint">
          <span>Terrible · {RATING_MIN}</span>
          <span>{RATING_MAX} · Amazing</span>
        </div>
        <div className="rating-grid">
          {Array.from({ length: RATING_MAX - RATING_MIN + 1 }).map((_, i) => {
            const value = RATING_MIN + i;
            return (
              <button
                key={value}
                className="rate-btn"
                onClick={() => controller.submitRating(current.key, value)}
              >
                {value}
              </button>
            );
          })}
        </div>
        <p className="faint tiny" style={{ textAlign: 'center' }}>
          Tap a score to lock it in and move to the next item.
        </p>
      </div>
    </div>
  );
}
