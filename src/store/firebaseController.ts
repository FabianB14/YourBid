// Multiplayer controller backed by Firebase Realtime Database.
//
// Model: host-authoritative. Exactly one client (the one whose id === hostId)
// owns the game state. Any client can push an *action* into `rooms/<code>/actions`;
// the host consumes the queue, runs the shared reducer, and writes the resulting
// state to `rooms/<code>/state`. Every client subscribes to the state node.
//
// Timers are authoritative from the host (it runs the tick loop and stamps
// deadlines), so all clients count down against the same epoch-ms deadline.
//
// Presence: each client marks itself present with an onDisconnect cleanup. The
// host reconciles presence into per-player `connected` flags, which drives the
// auto-skip / auto-rate / host-promotion rules in the reducer.

import {
  ref,
  child,
  set,
  get,
  push,
  remove,
  onValue,
  onChildAdded,
  onDisconnect,
  serverTimestamp,
  type Database,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database';
import type { GameController } from './controller';
import type { GameState, Player, Settings } from '../types';
import {
  reduce,
  createInitialState,
  type Action,
} from '../game/reducer';
import { generateItems } from '../services/itemGeneration';
import { getDb } from '../firebase';
import { makeRoomCode, makeId } from '../utils/misc';
import { DEFAULT_SETTINGS, MAX_PLAYERS } from '../config/gameConfig';

/** Firebase turns empty arrays/objects into null on read — restore shape. */
function normalize(raw: any): GameState {
  const players: Record<string, Player> = {};
  const rawPlayers = raw.players || {};
  for (const id of Object.keys(rawPlayers)) {
    const p = rawPlayers[id];
    players[id] = {
      ...p,
      connected: p.connected !== false,
      currency: p.currency ?? 0,
      wonItems: (p.wonItems || []).map((w: any) => ({
        ...w,
        ratings: w.ratings || {},
      })),
    };
  }
  return {
    ...raw,
    players,
    playerOrder: raw.playerOrder || [],
    items: raw.items || [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    generation: raw.generation || { status: 'idle' },
    auction: raw.auction
      ? {
          ...raw.auction,
          order: raw.auction.order || [],
          passedIds: raw.auction.passedIds || [],
        }
      : null,
  };
}

/** Strip undefined (Firebase rejects it) and empty structures. */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export class FirebaseController implements GameController {
  readonly mode = 'multiplayer' as const;
  readonly localPlayerId: string;
  readonly code: string;

  private roomRef: DatabaseReference;
  private stateRef: DatabaseReference;
  private actionsRef: DatabaseReference;
  private presenceRef: DatabaseReference;

  private state: GameState;
  private listeners = new Set<(s: GameState) => void>();

  private stateSub: Unsubscribe | null = null;
  private actionsSub: Unsubscribe | null = null;
  private presenceSub: Unsubscribe | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private isHost = false;

  private constructor(
    db: Database,
    code: string,
    localPlayerId: string,
    initialState: GameState
  ) {
    this.code = code;
    this.localPlayerId = localPlayerId;
    this.state = initialState;
    this.roomRef = ref(db, `rooms/${code}`);
    this.stateRef = child(this.roomRef, 'state');
    this.actionsRef = child(this.roomRef, 'actions');
    this.presenceRef = child(this.roomRef, `presence/${localPlayerId}`);
  }

  // ---- Factories -----------------------------------------------------------
  static async createRoom(playerName: string): Promise<FirebaseController> {
    const db = requireDb();
    const code = makeRoomCode();
    const hostId = makeId('p');
    const host: Player = {
      id: hostId,
      name: playerName || 'Host',
      isHost: true,
      isBot: false,
      connected: true,
      currency: DEFAULT_SETTINGS.startingCurrency,
      wonItems: [],
    };
    const initial = createInitialState({
      mode: 'multiplayer',
      code,
      hostId,
      host,
    });
    const controller = new FirebaseController(db, code, hostId, initial);
    await set(controller.stateRef, sanitize(initial));
    controller.attach();
    return controller;
  }

  static async joinRoom(
    code: string,
    playerName: string
  ): Promise<FirebaseController> {
    const db = requireDb();
    const normalizedCode = code.trim().toUpperCase();
    const stateRef = ref(db, `rooms/${normalizedCode}/state`);
    const snap = await get(stateRef);
    if (!snap.exists()) throw new Error('Room not found. Check the code.');
    const roomState = normalize(snap.val());
    if (roomState.phase !== 'lobby')
      throw new Error('That game has already started.');
    if (roomState.playerOrder.length >= MAX_PLAYERS)
      throw new Error('That room is full.');

    const myId = makeId('p');
    const me: Player = {
      id: myId,
      name: playerName || 'Player',
      isHost: false,
      isBot: false,
      connected: true,
      currency: roomState.settings.startingCurrency,
      wonItems: [],
    };
    const controller = new FirebaseController(db, normalizedCode, myId, roomState);
    controller.attach();
    // Ask the host to add us.
    await push(controller.actionsRef, { type: 'ADD_PLAYER', player: me });
    return controller;
  }

  // ---- Wiring --------------------------------------------------------------
  private attach(): void {
    // Presence: mark ourselves online, clear on disconnect.
    set(this.presenceRef, { online: true, at: serverTimestamp() });
    onDisconnect(this.presenceRef).remove();

    this.stateSub = onValue(this.stateRef, (snap) => {
      if (!snap.exists()) return;
      const incoming = normalize(snap.val());
      // Ignore stale / echoed snapshots (host holds the newest version).
      if (this.state && incoming.version <= this.state.version && !this.isHost)
        return;
      if (this.isHost && incoming.version <= this.state.version) return;
      this.state = incoming;
      this.emit();
      this.reconcileRole();
    });

    this.reconcileRole();
  }

  /** Attach or detach host duties based on the current hostId. */
  private reconcileRole(): void {
    const shouldHost = this.state.hostId === this.localPlayerId;
    if (shouldHost && !this.isHost) {
      this.isHost = true;
      this.startHostDuties();
    } else if (!shouldHost && this.isHost) {
      this.isHost = false;
      this.stopHostDuties();
    }
  }

  private startHostDuties(): void {
    // Drain and watch the action queue.
    this.actionsSub = onChildAdded(this.actionsRef, (snap) => {
      const action = snap.val() as Action;
      if (action) this.applyAsHost(action);
      remove(snap.ref);
    });
    // Reconcile presence -> connected flags.
    this.presenceSub = onValue(child(this.roomRef, 'presence'), (snap) => {
      const presence = (snap.val() as Record<string, unknown>) || {};
      for (const id of this.state.playerOrder) {
        const online = Boolean(presence[id]);
        const p = this.state.players[id];
        if (p && p.connected !== online) {
          this.applyAsHost({ type: 'SET_CONNECTED', playerId: id, connected: online });
        }
      }
    });
    // Authoritative raise timer.
    this.ticker = setInterval(() => {
      const a = this.state.auction;
      if (
        this.state.phase === 'auction' &&
        a &&
        a.phase === 'raising' &&
        a.deadline != null &&
        Date.now() >= a.deadline
      ) {
        this.applyAsHost({ type: 'RESOLVE_ITEM' });
      }
    }, 250);
  }

  private stopHostDuties(): void {
    this.actionsSub?.();
    this.actionsSub = null;
    this.presenceSub?.();
    this.presenceSub = null;
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
  }

  private applyAsHost(action: Action): void {
    const next = reduce(this.state, action, Date.now());
    if (next === this.state) return;
    this.state = next;
    set(this.stateRef, sanitize(next));
    this.emit();
    this.reconcileRole();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }

  // ---- GameController API ---------------------------------------------------
  getState(): GameState {
    return this.state;
  }

  subscribe(listener: (s: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(action: Action): void {
    if (this.isHost) this.applyAsHost(action);
    else push(this.actionsRef, sanitize(action));
  }

  updateSettings(settings: Partial<Settings>): void {
    this.dispatch({ type: 'UPDATE_SETTINGS', settings });
  }
  setTopic(topic: string): void {
    this.dispatch({ type: 'SET_TOPIC', topic });
  }

  async startGame(): Promise<void> {
    // Only the host generates items and starts the auction.
    if (!this.isHost) return;
    this.applyAsHost({
      type: 'SET_GENERATION',
      generation: { status: 'loading' },
    });
    const { playerOrder, settings, topic } = this.state;
    const capacity = playerOrder.length * settings.slotsPerPlayer;
    const target = Math.max(settings.baseItemCount, Math.ceil(capacity * 0.6));
    try {
      const result = await generateItems(topic, Math.ceil(target * 1.5));
      if (result.found < target) {
        this.applyAsHost({
          type: 'SET_GENERATION',
          generation: {
            status: 'error',
            found: result.found,
            requested: target,
            message: `Only found ${result.found} real items for "${topic}". Try broadening your topic.`,
          },
        });
        return;
      }
      this.applyAsHost({
        type: 'SET_GENERATION',
        generation: { status: 'done', found: result.found },
      });
      this.applyAsHost({ type: 'START_GAME', items: result.items });
    } catch (err) {
      this.applyAsHost({
        type: 'SET_GENERATION',
        generation: {
          status: 'error',
          message: (err as Error).message || 'Failed to generate items.',
        },
      });
    }
  }

  openBid(amount: number): void {
    this.dispatch({ type: 'OPEN_BID', playerId: this.localPlayerId, amount });
  }
  pass(): void {
    this.dispatch({ type: 'PASS', playerId: this.localPlayerId });
  }
  raise(amount: number): void {
    this.dispatch({ type: 'RAISE', playerId: this.localPlayerId, amount });
  }
  submitRating(key: string, value: number): void {
    this.dispatch({
      type: 'SUBMIT_RATING',
      raterId: this.localPlayerId,
      key,
      value,
    });
  }
  playAgain(): void {
    this.dispatch({ type: 'PLAY_AGAIN' });
  }

  destroy(): void {
    this.stopHostDuties();
    this.stateSub?.();
    this.stateSub = null;
    remove(this.presenceRef).catch(() => {});
    this.listeners.clear();
  }
}

function requireDb(): Database {
  const db = getDb();
  if (!db)
    throw new Error(
      'Firebase is not configured. Fill in src/firebase.ts to play multiplayer.'
    );
  return db;
}
