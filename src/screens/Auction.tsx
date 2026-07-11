import { useEffect, useState } from 'react';
import type { GameController } from '../store/controller';
import type { GameState } from '../types';
import { currentOpener } from '../game/reducer';
import { canBid } from '../game/logic';
import { MIN_OPENING_BID } from '../config/gameConfig';
import { TimerBar } from '../components/TimerBar';
import { PlayerSidebar } from '../components/PlayerSidebar';
import { ItemImage } from '../components/ItemImage';
import { ItemImageSearch } from '../components/ItemImageSearch';
import { ItemMessage } from '../components/ItemMessage';
import { GameControls } from '../components/GameControls';
import { isAnniversaryCode, WIFE_NAME } from '../secret/anniversary';
import { Avatar, Bids } from '../components/ui';
import { clamp } from '../utils/misc';

export function Auction({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const a = state.auction;
  const me = state.players[controller.localPlayerId];
  const item = state.items[state.currentItemIndex];

  const opener = a ? currentOpener(state) : null;
  const isOpening = a?.phase === 'opening';
  const isRaising = a?.phase === 'raising';
  const amInLead = a?.highBidderId === controller.localPlayerId;
  const isMyOpen = isOpening && opener === controller.localPlayerId;
  const eligible = me ? canBid(me, state.settings) : false;

  const minBid = isRaising ? (a?.highBid ?? 0) + 1 : MIN_OPENING_BID;
  const maxBid = me?.currency ?? 0;

  const [amount, setAmount] = useState(minBid);

  // Reset the proposed amount when the item or phase changes.
  useEffect(() => {
    setAmount(clamp(minBid, minBid, Math.max(minBid, maxBid)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentItemIndex, a?.phase]);

  if (!a || !item) {
    return (
      <div className="screen center">
        <div className="spinner" />
      </div>
    );
  }

  const effAmount = clamp(Math.max(amount, minBid), minBid, Math.max(minBid, maxBid));
  const canAfford = maxBid >= minBid;
  const canRaiseNow = isRaising && !amInLead && eligible && canAfford;
  const leader = a.highBidderId ? state.players[a.highBidderId] : null;

  const inc = (d: number) =>
    setAmount((v) => clamp(Math.max(v, minBid) + d, minBid, Math.max(minBid, maxBid)));

  return (
    <div className="screen" style={{ gap: 16 }}>
      <GameControls controller={controller} state={state} />
      {isAnniversaryCode(state.topic) && (
        <div
          className="info-banner"
          style={{ textAlign: 'center', borderColor: 'var(--accent-2)', color: '#ffd0e0' }}
        >
          ❤️ Remember I love you, {WIFE_NAME} — every item here is really just “I love you.” ❤️
        </div>
      )}
      <div className="row spread" style={{ gap: 8 }}>
        <span className="brand-sub" style={{ flex: '0 0 auto' }}>
          Item {Math.min(state.currentItemIndex + 1, state.totalItems)} /{' '}
          {state.totalItems}
        </span>
        <span className="tag truncate" title={state.topic}>
          {state.topic}
        </span>
      </div>

      <div className="auction-layout">
        <div className="stack" style={{ gap: 16 }}>
          {/* Item card */}
          <div className="item-card" key={state.currentItemIndex}>
            <ItemImage item={item} />
            <span className="tag" style={{ marginBottom: 10 }}>
              {item.category}
            </span>
            <div className="item-name">{item.name}</div>
            <div className="item-desc">{item.description}</div>
            <div className="row" style={{ marginTop: 12, gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <ItemImageSearch item={item} />
              <ItemMessage item={item} />
            </div>
          </div>

          {/* Bid status */}
          <div className="card stack center" style={{ gap: 10 }}>
            {leader ? (
              <>
                <span className="muted tiny">High bid</span>
                <div className="high-bid bump" key={a.highBid}>
                  🪙 {a.highBid}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Avatar name={leader.name} id={leader.id} />
                  <span style={{ fontWeight: 800 }}>
                    {amInLead ? 'You’re leading!' : leader.name}
                  </span>
                </div>
                <TimerBar deadline={a.deadline} />
              </>
            ) : (
              <>
                <span className="muted">No bids yet</span>
                {opener ? (
                  <div className="row" style={{ gap: 8 }}>
                    <Avatar
                      name={state.players[opener].name}
                      id={state.players[opener].id}
                    />
                    <span style={{ fontWeight: 800 }}>
                      {isMyOpen
                        ? 'Your turn to open'
                        : `${state.players[opener].name} to open`}
                    </span>
                  </div>
                ) : (
                  <span className="faint">Resolving…</span>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="card bidpad">
            {isMyOpen && (
              <>
                <span className="brand-sub">Open the bidding</span>
                <BidAmount
                  value={effAmount}
                  min={minBid}
                  max={maxBid}
                  onInc={inc}
                  disabled={!canAfford}
                />
                <div className="grid-2">
                  <button
                    className="btn btn-ghost"
                    onClick={() => controller.pass()}
                  >
                    Pass
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!canAfford}
                    onClick={() => controller.openBid(effAmount)}
                  >
                    Open · <Bids amount={effAmount} />
                  </button>
                </div>
              </>
            )}

            {canRaiseNow && (
              <>
                <span className="brand-sub">Raise the bid</span>
                <BidAmount
                  value={effAmount}
                  min={minBid}
                  max={maxBid}
                  onInc={inc}
                  disabled={!canAfford}
                />
                <button
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() => controller.raise(effAmount)}
                >
                  Raise to <Bids amount={effAmount} />
                </button>
              </>
            )}

            {isRaising && amInLead && (
              <div className="info-banner" style={{ textAlign: 'center' }}>
                You hold the high bid at <Bids amount={a.highBid} />. Hang on…
              </div>
            )}

            {isRaising && !amInLead && !canRaiseNow && (
              <div className="faint" style={{ textAlign: 'center' }}>
                {eligible
                  ? `You can't outbid ${a.highBid} — not enough Bids or slots.`
                  : me.wonItems.length >= state.settings.slotsPerPlayer
                    ? 'Your slots are full — sitting this one out.'
                    : 'You’re out of Bids for this item.'}
              </div>
            )}

            {isOpening && !isMyOpen && (
              <div className="faint" style={{ textAlign: 'center' }}>
                Waiting for {opener ? state.players[opener].name : 'the next player'} to
                open…
              </div>
            )}
          </div>

          <div className="row spread tiny faint">
            <span>
              Your Bids: <Bids amount={me?.currency ?? 0} />
            </span>
            <span>
              Slots: {me?.wonItems.length ?? 0}/{state.settings.slotsPerPlayer}
            </span>
            {state.discardedCount > 0 && <span>{state.discardedCount} discarded</span>}
          </div>
        </div>

        <PlayerSidebar
          state={state}
          highBidderId={a.highBidderId}
          turnId={leader ? a.highBidderId : opener}
          localPlayerId={controller.localPlayerId}
        />
      </div>
    </div>
  );
}

function BidAmount({
  value,
  min,
  max,
  onInc,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onInc: (d: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="bid-amount">
      <button
        className="stepper"
        disabled={disabled || value <= min}
        onClick={() => onInc(-1)}
      >
        −
      </button>
      <span className="val">🪙 {value}</span>
      <button
        className="stepper"
        disabled={disabled || value >= max}
        onClick={() => onInc(1)}
      >
        +
      </button>
    </div>
  );
}
