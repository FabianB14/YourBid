// Fully local, single-client controller with bot opponents. Runs the exact same
// reducer the multiplayer host runs, plus a local authoritative loop that fires
// the raise timer and drives the bots. Lets the whole game loop be played and
// tested before Firebase (or the Anthropic API) is configured.

import type { GameController } from './controller';
import type { GameState, Player, Settings } from '../types';
import { reduce, createInitialState, currentOpener, type Action } from '../game/reducer';
import {
  botOpenDecision,
  botRaiseDecision,
  botRating,
} from '../game/bots';
import { generateItems } from '../services/itemGeneration';
import { makeRoomCode, makeId } from '../utils/misc';
import { DEFAULT_SETTINGS } from '../config/gameConfig';

const BOT_NAMES = ['Botford', 'Cash Money', 'Nina Bot', 'Big Spender'];

function makePlayer(
  id: string,
  name: string,
  opts: Partial<Player> = {}
): Player {
  return {
    id,
    name,
    isHost: false,
    isBot: false,
    connected: true,
    currency: DEFAULT_SETTINGS.startingCurrency,
    wonItems: [],
    ...opts,
  };
}

export class PracticeController implements GameController {
  readonly mode = 'practice' as const;
  readonly localPlayerId: string;

  private state: GameState;
  private listeners = new Set<(s: GameState) => void>();
  private ticker: ReturnType<typeof setInterval> | null = null;
  private botTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(playerName: string, botCount = 2) {
    const hostId = makeId('me');
    this.localPlayerId = hostId;
    const host = makePlayer(hostId, playerName || 'You', { isHost: true });
    let state = createInitialState({
      mode: 'practice',
      code: makeRoomCode(),
      hostId,
      host,
    });
    for (let i = 0; i < botCount; i++) {
      const bot = makePlayer(makeId('bot'), BOT_NAMES[i % BOT_NAMES.length], {
        isBot: true,
      });
      state = reduce(state, { type: 'ADD_PLAYER', player: bot }, Date.now());
    }
    this.state = state;
    this.ticker = setInterval(() => this.tick(), 250);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: (s: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }

  private apply(action: Action): void {
    const next = reduce(this.state, action, Date.now());
    if (next === this.state) return;
    this.state = next;
    this.emit();
    this.scheduleBots();
  }

  dispatch(action: Action): void {
    this.apply(action);
  }

  // ---- GameController API ----
  updateSettings(settings: Partial<Settings>): void {
    this.apply({ type: 'UPDATE_SETTINGS', settings });
  }

  setTopic(topic: string): void {
    this.apply({ type: 'SET_TOPIC', topic });
  }

  async startGame(): Promise<void> {
    this.apply({ type: 'SET_GENERATION', generation: { status: 'loading' } });
    const target = this.itemTarget();
    try {
      const result = await generateItems(this.state.topic, Math.ceil(target * 1.5));
      if (result.found < target) {
        this.apply({
          type: 'SET_GENERATION',
          generation: {
            status: 'error',
            found: result.found,
            requested: target,
            message: `Only found ${result.found} real items for "${this.state.topic}". Try broadening your topic.`,
          },
        });
        return;
      }
      this.apply({
        type: 'SET_GENERATION',
        generation: { status: 'done', found: result.found },
      });
      this.apply({ type: 'START_GAME', items: result.items });
    } catch (err) {
      this.apply({
        type: 'SET_GENERATION',
        generation: {
          status: 'error',
          message: (err as Error).message || 'Failed to generate items.',
        },
      });
    }
  }

  openBid(amount: number): void {
    this.apply({ type: 'OPEN_BID', playerId: this.localPlayerId, amount });
  }
  pass(): void {
    this.apply({ type: 'PASS', playerId: this.localPlayerId });
  }
  raise(amount: number): void {
    this.apply({ type: 'RAISE', playerId: this.localPlayerId, amount });
  }
  submitRating(key: string, value: number): void {
    this.apply({ type: 'SUBMIT_RATING', raterId: this.localPlayerId, key, value });
  }
  playAgain(): void {
    this.apply({ type: 'PLAY_AGAIN' });
  }

  destroy(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.clearBotTimeouts();
    this.listeners.clear();
  }

  // ---- internals ----
  private itemTarget(): number {
    // Mirror computeTotalItems' base so we generate enough.
    const { playerOrder, settings } = this.state;
    const capacity = playerOrder.length * settings.slotsPerPlayer;
    return Math.max(settings.baseItemCount, Math.ceil(capacity * 0.6));
  }

  private tick(): void {
    const a = this.state.auction;
    if (
      this.state.phase === 'auction' &&
      a &&
      a.phase === 'raising' &&
      a.deadline != null &&
      Date.now() >= a.deadline
    ) {
      this.apply({ type: 'RESOLVE_ITEM' });
    }
  }

  private clearBotTimeouts(): void {
    for (const t of this.botTimeouts) clearTimeout(t);
    this.botTimeouts = [];
  }

  private scheduleBots(): void {
    this.clearBotTimeouts();
    const version = this.state.version;
    const guard = (fn: () => void) => () => {
      if (this.state.version === version) fn();
    };

    if (this.state.phase === 'auction' && this.state.auction) {
      const a = this.state.auction;
      if (a.phase === 'opening') {
        const opener = currentOpener(this.state);
        if (opener && this.state.players[opener]?.isBot) {
          const delay = 700 + Math.random() * 1100;
          this.botTimeouts.push(
            setTimeout(
              guard(() => {
                const p = this.state.players[opener];
                const dec = botOpenDecision(p, this.state);
                if (dec.action === 'open') this.openBidBy(opener, dec.amount);
                else this.apply({ type: 'PASS', playerId: opener });
              }),
              delay
            )
          );
        }
      } else if (a.phase === 'raising') {
        for (const id of this.state.playerOrder) {
          const p = this.state.players[id];
          if (!p.isBot || id === a.highBidderId) continue;
          const raise = botRaiseDecision(p, this.state);
          if (raise == null) continue;
          // Raise somewhere inside the 5s window so humans see the timer move.
          const delay = 800 + Math.random() * 2600;
          this.botTimeouts.push(
            setTimeout(
              guard(() => {
                const cur = this.state.auction;
                if (!cur || cur.phase !== 'raising' || cur.highBidderId === id)
                  return;
                const amt = botRaiseDecision(this.state.players[id], this.state);
                if (amt != null)
                  this.apply({ type: 'RAISE', playerId: id, amount: amt });
              }),
              delay
            )
          );
        }
      }
    } else if (this.state.phase === 'rating') {
      // Bots quickly rate one pending item at a time.
      const pending = this.firstBotPendingRating();
      if (pending) {
        this.botTimeouts.push(
          setTimeout(
            guard(() => {
              const value = botRating(pending.raterId, pending.key);
              this.apply({
                type: 'SUBMIT_RATING',
                raterId: pending.raterId,
                key: pending.key,
                value,
              });
            }),
            250
          )
        );
      }
    }
  }

  private openBidBy(playerId: string, amount: number): void {
    this.apply({ type: 'OPEN_BID', playerId, amount });
  }

  private firstBotPendingRating(): { raterId: string; key: string } | null {
    for (const raterId of this.state.playerOrder) {
      const rater = this.state.players[raterId];
      if (!rater.isBot) continue;
      for (const ownerId of this.state.playerOrder) {
        for (const w of this.state.players[ownerId].wonItems) {
          if (w.ratings[raterId] == null) return { raterId, key: w.key };
        }
      }
    }
    return null;
  }
}
