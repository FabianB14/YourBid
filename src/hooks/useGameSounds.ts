import { useEffect, useRef } from 'react';
import type { GameState } from '../types';
import { sfx } from '../services/sfx';

interface Snapshot {
  inited: boolean;
  phase: GameState['phase'];
  itemIndex: number;
  highBid: number;
  highBidderId: string | null;
  wonTotal: number;
}

function totalWon(state: GameState): number {
  return state.playerOrder.reduce(
    (n, id) => n + (state.players[id]?.wonItems?.length ?? 0),
    0
  );
}

/**
 * Plays sound cues in response to game state transitions: bidding, getting
 * outbid, winning, and phase changes. Mount once where the live state is
 * available. No-op while muted (handled inside the sfx module).
 */
export function useGameSounds(state: GameState, localPlayerId: string): void {
  const prev = useRef<Snapshot | null>(null);

  useEffect(() => {
    const a = state.auction;
    const snap: Snapshot = {
      inited: true,
      phase: state.phase,
      itemIndex: state.currentItemIndex,
      highBid: a?.highBid ?? 0,
      highBidderId: a?.highBidderId ?? null,
      wonTotal: totalWon(state),
    };
    const p = prev.current;
    prev.current = snap;
    if (!p || !p.inited) return; // don't fire on first observation

    // Phase transitions
    if (p.phase !== snap.phase) {
      if (snap.phase === 'auction') sfx.start();
      else if (snap.phase === 'results') sfx.results();
    }

    // Bidding within the same item
    if (
      snap.phase === 'auction' &&
      p.phase === 'auction' &&
      p.itemIndex === snap.itemIndex &&
      snap.highBidderId &&
      snap.highBid > p.highBid
    ) {
      if (snap.highBidderId === localPlayerId) sfx.bid();
      else if (p.highBidderId === localPlayerId) sfx.outbid();
      else sfx.raise();
    }

    // An item was won (someone's slot count grew)
    if (snap.wonTotal > p.wonTotal) {
      if (state.lastWinnerId === localPlayerId) sfx.winBig();
      else sfx.win();
    }
  }, [state, localPlayerId]);
}
