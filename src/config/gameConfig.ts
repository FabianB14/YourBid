// Central game tuning constants and defaults (all host-adjustable ones live in
// Settings; the rest are fixed rules of the game).

import type { Settings } from '../types';

export const MAX_PLAYERS = 5;

export const DEFAULT_SETTINGS: Settings = {
  startingCurrency: 20,
  slotsPerPlayer: 6,
  baseItemCount: 15,
  imageSearchCx: '',
};

export const SLOTS_RANGE = { min: 3, max: 10 } as const;
export const STARTING_CURRENCY_RANGE = { min: 5, max: 100 } as const;
export const BASE_ITEM_RANGE = { min: 5, max: 40 } as const;

/** Seconds on the raise timer after any bid. */
export const RAISE_SECONDS = 5;

/** Minimum opening bid. */
export const MIN_OPENING_BID = 1;

/** Ratings scale. */
export const RATING_MIN = 1;
export const RATING_MAX = 10;

/** Value auto-assigned to a disconnected player's pending ratings. */
export const DISCONNECT_AUTO_RATING = 5;
