// A GameController owns the game state and exposes a uniform API to the UI,
// hiding whether we're running locally (practice) or over Firebase
// (multiplayer). Screens never touch the reducer or the network directly.

import type { GameState, Settings } from '../types';
import type { Action } from '../game/reducer';

export interface GameController {
  readonly mode: GameState['mode'];
  /** The id of the player using THIS client. */
  readonly localPlayerId: string;

  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;

  // Lobby / setup
  updateSettings(settings: Partial<Settings>): void;
  setTopic(topic: string): void;
  /** Generate items then begin the auction. Host-only in multiplayer. */
  startGame(): Promise<void>;

  // Auction actions (issued by the local player)
  openBid(amount: number): void;
  pass(): void;
  raise(amount: number): void;

  // Rating
  submitRating(key: string, value: number): void;

  // Results
  playAgain(): void;

  /** Raw escape hatch (used sparingly, e.g. join/leave). */
  dispatch(action: Action): void;

  destroy(): void;
}
