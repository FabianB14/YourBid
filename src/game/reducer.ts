// The authoritative game state machine.
//
// `reduce(state, action, now)` is a pure function: given the current state and
// an action (plus the current epoch-ms clock for timer math) it returns the
// next state. The practice engine runs this locally; the Firebase host runs the
// exact same reducer and writes results to the Realtime Database. Keeping all
// transitions here means practice mode and multiplayer share identical rules.

import type {
  AuctionState,
  GameState,
  Item,
  Player,
  Settings,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DISCONNECT_AUTO_RATING,
  MIN_OPENING_BID,
  RAISE_SECONDS,
} from '../config/gameConfig';
import {
  auctionExhausted,
  canBid,
  computeTotalItems,
  dedupeItems,
  nextTurnOrder,
} from './logic';
import { makeId, shuffle } from '../utils/misc';

export type Action =
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'SET_CONNECTED'; playerId: string; connected: boolean }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'SET_GENERATION'; generation: GameState['generation'] }
  | { type: 'START_GAME'; items: Item[] }
  | { type: 'OPEN_BID'; playerId: string; amount: number }
  | { type: 'PASS'; playerId: string }
  | { type: 'RAISE'; playerId: string; amount: number }
  | { type: 'RESOLVE_ITEM' }
  | { type: 'SUBMIT_RATING'; raterId: string; key: string; value: number }
  | { type: 'PLAY_AGAIN' };

export function createInitialState(params: {
  mode: GameState['mode'];
  code: string;
  hostId: string;
  host: Player;
}): GameState {
  return {
    mode: params.mode,
    phase: 'lobby',
    code: params.code,
    hostId: params.hostId,
    players: { [params.host.id]: params.host },
    playerOrder: [params.host.id],
    settings: { ...DEFAULT_SETTINGS },
    topic: '',
    items: [],
    totalItems: 0,
    currentItemIndex: 0,
    discardedCount: 0,
    auction: null,
    lastWinnerId: null,
    generation: { status: 'idle' },
    version: 0,
  };
}

function bump(state: GameState): GameState {
  return { ...state, version: state.version + 1 };
}

/** Build the auction sub-state for the item at `currentItemIndex`. */
function startAuctionForCurrentItem(
  state: GameState,
  prevOrder: string[] | null,
  winnerId: string | null
): AuctionState {
  const baseOrder =
    prevOrder && prevOrder.length ? prevOrder : shuffle(state.playerOrder);
  const order =
    prevOrder && prevOrder.length
      ? nextTurnOrder(prevOrder, winnerId)
      : baseOrder;
  return {
    order,
    openerIndex: 0,
    phase: 'opening',
    highBid: 0,
    highBidderId: null,
    deadline: null,
    passedIds: [],
  };
}

/** Advance to the next item, or transition out of the auction if finished. */
function advance(state: GameState, prevOrder: string[], winnerId: string | null): GameState {
  const nextIndex = state.currentItemIndex + 1;
  const finished = nextIndex >= state.totalItems || auctionExhausted(state);
  if (finished) {
    return enterRating({ ...state, currentItemIndex: nextIndex });
  }
  const auction = startAuctionForCurrentItem(
    { ...state, currentItemIndex: nextIndex },
    prevOrder,
    winnerId
  );
  return { ...state, currentItemIndex: nextIndex, auction, lastWinnerId: winnerId };
}

/** Move into the rating phase (or straight to results if nothing was won). */
function enterRating(state: GameState): GameState {
  const anyWon = state.playerOrder.some(
    (id) => state.players[id].wonItems.length > 0
  );
  if (!anyWon) {
    return { ...state, phase: 'results', auction: null };
  }
  // Pre-fill disconnected players' ratings with the auto value so completion
  // only depends on connected players.
  const players = { ...state.players };
  for (const id of state.playerOrder) {
    const p = players[id];
    if (p.connected) continue;
    autoRateFor(state, p.id, players);
  }
  return { ...state, phase: 'rating', auction: null, players };
}

/** Fill in `raterId`'s ratings on every won item with the auto value. */
function autoRateFor(
  state: GameState,
  raterId: string,
  playersDraft: Record<string, Player>
): void {
  for (const ownerId of state.playerOrder) {
    const owner = playersDraft[ownerId];
    owner.wonItems = owner.wonItems.map((w) =>
      w.ratings[raterId] != null
        ? w
        : { ...w, ratings: { ...w.ratings, [raterId]: DISCONNECT_AUTO_RATING } }
    );
  }
}

/** True once every connected player has rated every won item. */
function ratingsComplete(state: GameState): boolean {
  const raters = state.playerOrder.filter((id) => state.players[id].connected);
  for (const ownerId of state.playerOrder) {
    for (const w of state.players[ownerId].wonItems) {
      for (const r of raters) {
        if (w.ratings[r] == null) return false;
      }
    }
  }
  return true;
}

export function reduce(state: GameState, action: Action, now: number): GameState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      if (state.players[action.player.id]) return state;
      // Coerce fields that Firebase may strip when relaying the join action
      // (empty arrays/objects become null/undefined). Without this, a joined
      // player can arrive with `wonItems === undefined`, which crashes
      // consumers that read `wonItems.length`.
      const player: Player = {
        ...action.player,
        connected: action.player.connected !== false,
        isBot: Boolean(action.player.isBot),
        isHost: Boolean(action.player.isHost),
        currency: action.player.currency ?? state.settings.startingCurrency,
        wonItems: Array.isArray(action.player.wonItems)
          ? action.player.wonItems
          : [],
      };
      return bump({
        ...state,
        players: { ...state.players, [player.id]: player },
        playerOrder: [...state.playerOrder, player.id],
      });
    }

    case 'REMOVE_PLAYER': {
      if (!state.players[action.playerId]) return state;
      const players = { ...state.players };
      delete players[action.playerId];
      const playerOrder = state.playerOrder.filter((id) => id !== action.playerId);
      let hostId = state.hostId;
      if (hostId === action.playerId && playerOrder.length) {
        hostId = playerOrder[0];
        if (players[hostId]) players[hostId] = { ...players[hostId], isHost: true };
      }
      return bump({ ...state, players, playerOrder, hostId });
    }

    case 'SET_CONNECTED': {
      const p = state.players[action.playerId];
      if (!p) return state;
      const players = {
        ...state.players,
        [action.playerId]: { ...p, connected: action.connected },
      };
      let next: GameState = { ...state, players };
      // Host dropped -> promote next connected player.
      if (!action.connected && action.playerId === state.hostId) {
        const heir = state.playerOrder.find(
          (id) => id !== action.playerId && players[id]?.connected
        );
        if (heir) {
          players[heir] = { ...players[heir], isHost: true };
          next = { ...next, hostId: heir, players };
        }
      }
      // If rating and this player just dropped, auto-rate their pending items.
      if (!action.connected && state.phase === 'rating') {
        const draft = { ...players };
        for (const id of state.playerOrder) draft[id] = { ...draft[id] };
        autoRateFor(next, action.playerId, draft);
        next = { ...next, players: draft };
        if (ratingsComplete(next)) next = { ...next, phase: 'results' };
      }
      return bump(next);
    }

    case 'UPDATE_SETTINGS':
      if (state.phase !== 'lobby') return state;
      return bump({ ...state, settings: { ...state.settings, ...action.settings } });

    case 'SET_TOPIC':
      return bump({ ...state, topic: action.topic });

    case 'SET_GENERATION':
      return bump({ ...state, generation: action.generation });

    case 'START_GAME': {
      const items = shuffle(dedupeItems(action.items));
      const totalItems = computeTotalItems(state.playerOrder.length, state.settings);
      const trimmed = items.slice(0, totalItems);
      // Reset every player's bank and slots for a fresh game.
      const players: Record<string, Player> = {};
      for (const id of state.playerOrder) {
        players[id] = {
          ...state.players[id],
          currency: state.settings.startingCurrency,
          wonItems: [],
        };
      }
      const seeded: GameState = {
        ...state,
        players,
        phase: 'auction',
        items: trimmed,
        totalItems: trimmed.length,
        currentItemIndex: 0,
        discardedCount: 0,
        lastWinnerId: null,
      };
      const auction = startAuctionForCurrentItem(seeded, null, null);
      return bump({ ...seeded, auction });
    }

    case 'OPEN_BID': {
      const a = state.auction;
      if (state.phase !== 'auction' || !a || a.phase !== 'opening') return state;
      const opener = currentOpener(state);
      if (opener !== action.playerId) return state;
      const player = state.players[action.playerId];
      if (!canBid(player, state.settings)) return state;
      const amount = Math.floor(action.amount);
      if (amount < MIN_OPENING_BID || amount > player.currency) return state;
      return bump({
        ...state,
        auction: {
          ...a,
          phase: 'raising',
          highBid: amount,
          highBidderId: action.playerId,
          deadline: now + RAISE_SECONDS * 1000,
        },
      });
    }

    case 'PASS': {
      const a = state.auction;
      if (state.phase !== 'auction' || !a || a.phase !== 'opening') return state;
      const opener = currentOpener(state);
      if (opener !== action.playerId) return state;
      const passedIds = [...a.passedIds, action.playerId];
      const withPass: GameState = { ...state, auction: { ...a, passedIds } };
      const nextOpener = currentOpener(withPass);
      if (nextOpener == null) {
        // Everyone passed / no one eligible -> discard this item.
        return bump(
          advance(
            { ...withPass, discardedCount: withPass.discardedCount + 1 },
            a.order,
            null
          )
        );
      }
      return bump(withPass);
    }

    case 'RAISE': {
      const a = state.auction;
      if (state.phase !== 'auction' || !a || a.phase !== 'raising') return state;
      const player = state.players[action.playerId];
      if (!player || action.playerId === a.highBidderId) return state;
      if (!canBid(player, state.settings)) return state;
      const amount = Math.floor(action.amount);
      if (amount <= a.highBid || amount > player.currency) return state;
      return bump({
        ...state,
        auction: {
          ...a,
          highBid: amount,
          highBidderId: action.playerId,
          deadline: now + RAISE_SECONDS * 1000,
        },
      });
    }

    case 'RESOLVE_ITEM': {
      const a = state.auction;
      if (state.phase !== 'auction' || !a || a.phase !== 'raising') return state;
      if (!a.highBidderId) return state;
      const winnerId = a.highBidderId;
      const winner = state.players[winnerId];
      const item = state.items[state.currentItemIndex];
      const wonItem = {
        key: makeId('won'),
        item,
        ownerId: winnerId,
        price: a.highBid,
        ratings: {} as Record<string, number>,
      };
      const players = {
        ...state.players,
        [winnerId]: {
          ...winner,
          currency: winner.currency - a.highBid,
          wonItems: [...winner.wonItems, wonItem],
        },
      };
      return bump(advance({ ...state, players }, a.order, winnerId));
    }

    case 'SUBMIT_RATING': {
      if (state.phase !== 'rating') return state;
      const value = Math.round(action.value);
      const players = { ...state.players };
      let changed = false;
      for (const ownerId of state.playerOrder) {
        const owner = players[ownerId];
        const idx = owner.wonItems.findIndex((w) => w.key === action.key);
        if (idx === -1) continue;
        const w = owner.wonItems[idx];
        if (w.ratings[action.raterId] === value) return state;
        const wonItems = owner.wonItems.slice();
        wonItems[idx] = {
          ...w,
          ratings: { ...w.ratings, [action.raterId]: value },
        };
        players[ownerId] = { ...owner, wonItems };
        changed = true;
        break;
      }
      if (!changed) return state;
      let next: GameState = { ...state, players };
      if (ratingsComplete(next)) next = { ...next, phase: 'results' };
      return bump(next);
    }

    case 'PLAY_AGAIN': {
      const players: Record<string, Player> = {};
      for (const id of state.playerOrder) {
        players[id] = {
          ...state.players[id],
          currency: state.settings.startingCurrency,
          wonItems: [],
        };
      }
      return bump({
        ...state,
        phase: 'lobby',
        players,
        items: [],
        totalItems: 0,
        currentItemIndex: 0,
        discardedCount: 0,
        auction: null,
        lastWinnerId: null,
        topic: '',
        generation: { status: 'idle' },
      });
    }

    default:
      return state;
  }
}

/**
 * The player currently entitled to open (or pass on) the item, skipping any who
 * are ineligible or have already passed. Returns null when no one can open.
 */
export function currentOpener(state: GameState): string | null {
  const a = state.auction;
  if (!a) return null;
  for (let i = a.openerIndex; i < a.order.length; i++) {
    const id = a.order[i];
    const p = state.players[id];
    if (!p) continue;
    if (a.passedIds.includes(id)) continue;
    if (!canBid(p, state.settings)) continue;
    return id;
  }
  return null;
}
