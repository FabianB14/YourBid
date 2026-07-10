// Shared domain types for YourBid.

export type Phase = 'lobby' | 'generating' | 'auction' | 'rating' | 'results';

export type Mode = 'practice' | 'multiplayer';

/** A single auctionable item generated from the topic. */
export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Best-effort real image (movie poster, album/song art, product photo).
   *  Resolved at generation time from free, keyless sources; may be absent. */
  imageUrl?: string;
}

/** An item after it has been won, including who paid what and its ratings. */
export interface WonItem {
  key: string; // globally unique key for this won item
  item: Item;
  ownerId: string;
  price: number;
  /** raterId -> rating (1..10). */
  ratings: Record<string, number>;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  currency: number;
  wonItems: WonItem[];
}

export interface Settings {
  startingCurrency: number;
  slotsPerPlayer: number;
  baseItemCount: number;
  /** Google Programmable Search Engine ID (cx) for the "See real images"
   *  widget. Public by design, so it's synced to all players. Empty = off. */
  imageSearchCx: string;
}

export type AuctionPhase = 'opening' | 'raising';

export interface AuctionState {
  order: string[]; // turn order for the current item
  openerIndex: number; // pointer into `order` during the opening phase
  phase: AuctionPhase;
  highBid: number;
  highBidderId: string | null;
  /** epoch ms when the 5s raise timer expires; null during opening. */
  deadline: number | null;
  passedIds: string[]; // players who passed on opening this item
}

export interface GenerationState {
  status: 'idle' | 'loading' | 'done' | 'error';
  message?: string;
  found?: number;
  requested?: number;
}

export interface GameState {
  mode: Mode;
  phase: Phase;
  code: string;
  hostId: string;
  players: Record<string, Player>;
  playerOrder: string[]; // stable join order
  settings: Settings;
  topic: string;
  items: Item[]; // shuffled, trimmed to totalItems
  totalItems: number;
  currentItemIndex: number;
  discardedCount: number;
  auction: AuctionState | null;
  lastWinnerId: string | null;
  generation: GenerationState;
  version: number; // bumped on every state transition
}

/** A row in the final results leaderboard. */
export interface ResultRow {
  playerId: string;
  name: string;
  isBot: boolean;
  itemsValue: number;
  penalty: number;
  unfilledSlots: number;
  score: number;
  items: Array<{ item: Item; value: number; price: number }>;
}
