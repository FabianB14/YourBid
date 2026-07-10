// Bot opponents for practice mode. Pure decision helpers — the practice engine
// is responsible for *when* to call these (with human-like delays).

import type { GameState, Player } from '../types';
import { MIN_OPENING_BID, RATING_MAX, RATING_MIN } from '../config/gameConfig';
import { canBid, slotsFilled } from './logic';
import { clamp } from '../utils/misc';

/** Deterministic 0..1 pseudo-random from a string seed (stable per item). */
function seededUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to 0..1
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * How much a bot is willing to pay for the current item. Stable within an item
 * (seeded by bot + item index) so a bot doesn't overshoot its own cap while
 * raising repeatedly. Roughly spreads its budget across remaining slots.
 */
export function botWillingness(
  player: Player,
  state: GameState
): number {
  const free = state.settings.slotsPerPlayer - slotsFilled(player);
  if (free <= 0 || player.currency <= 0) return 0;
  const avgSpread = player.currency / free;
  const factor = 0.55 + seededUnit(`${player.id}:${state.currentItemIndex}`) * 1.1; // 0.55..1.65
  return clamp(Math.round(avgSpread * factor), 1, player.currency);
}

/** Decision for a bot that is the current opener. */
export function botOpenDecision(
  player: Player,
  state: GameState
): { action: 'open'; amount: number } | { action: 'pass' } {
  if (!canBid(player, state.settings)) return { action: 'pass' };
  const willing = botWillingness(player, state);
  if (willing < MIN_OPENING_BID) return { action: 'pass' };
  // Occasionally pass to create scarcity, but usually open low so others can
  // compete.
  const passRoll = seededUnit(`pass:${player.id}:${state.currentItemIndex}`);
  if (passRoll < 0.12) return { action: 'pass' };
  const opening = clamp(MIN_OPENING_BID, MIN_OPENING_BID, willing);
  return { action: 'open', amount: opening };
}

/** Decision for a bot in the raising phase. Returns a raise amount or null. */
export function botRaiseDecision(
  player: Player,
  state: GameState
): number | null {
  const a = state.auction;
  if (!a || a.phase !== 'raising') return null;
  if (a.highBidderId === player.id) return null;
  if (!canBid(player, state.settings)) return null;
  const willing = botWillingness(player, state);
  const next = a.highBid + 1;
  if (next > willing || next > player.currency) return null;
  return next;
}

/** A bot's rating for an item (1..10), stable per (rater, item key). */
export function botRating(raterId: string, itemKey: string): number {
  const u = seededUnit(`${raterId}:${itemKey}`);
  // Center ratings around the middle with some spread.
  return clamp(Math.round(RATING_MIN + u * (RATING_MAX - RATING_MIN)), RATING_MIN, RATING_MAX);
}
