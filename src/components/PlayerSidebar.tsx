import type { GameState } from '../types';
import { Avatar, Bids, Slots } from './ui';

/** Live roster shown during the auction: currency, slots, who's leading/turn. */
export function PlayerSidebar({
  state,
  highBidderId,
  turnId,
  localPlayerId,
}: {
  state: GameState;
  highBidderId: string | null;
  turnId: string | null;
  localPlayerId: string;
}) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      <h3 className="brand-sub">Players</h3>
      {state.playerOrder.map((id) => {
        const p = state.players[id];
        const leading = id === highBidderId;
        const turn = id === turnId;
        return (
          <div
            key={id}
            className={`side-player${leading ? ' leading' : ''}${turn ? ' turn' : ''}`}
          >
            <Avatar name={p.name} id={p.id} />
            <div className="stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <div className="row spread">
                <span
                  style={{
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                  {id === localPlayerId ? ' (you)' : ''}
                  {p.isBot ? ' 🤖' : ''}
                  {!p.connected ? ' ⚡️' : ''}
                </span>
                <Bids amount={p.currency} />
              </div>
              <Slots
                filled={p.wonItems.length}
                total={state.settings.slotsPerPlayer}
              />
            </div>
            {leading && <span className="tag" style={{ color: 'var(--gold)' }}>HIGH</span>}
            {turn && !leading && <span className="tag" style={{ color: 'var(--accent)' }}>TURN</span>}
          </div>
        );
      })}
    </div>
  );
}
