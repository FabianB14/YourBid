// Pure, framework-free game logic. Shared by the practice engine and the
// Firebase host reducer, and unit-testable in isolation.

import type { GameState, Item, Player, ResultRow, Settings } from '../types';
import { round1 } from '../utils/misc';

/**
 * Total number of items to auction.
 *
 *   total = max(baseItemCount, players * slots)
 *
 * i.e. at least enough items to fill every roster slot, and at least the base
 * item count. When the base count exceeds total capacity (e.g. base 15 with
 * 2 players × 6 slots = 12), the extra items become headroom — players can pass
 * on some items and still fill their rosters.
 */
export function computeTotalItems(
  playerCount: number,
  settings: Settings
): number {
  const { slotsPerPlayer, baseItemCount } = settings;
  const capacity = playerCount * slotsPerPlayer;
  return Math.max(baseItemCount, capacity);
}

/** Number of slots a player has filled = number of items they've won. */
export function slotsFilled(player: Player): number {
  return player.wonItems.length;
}

/** A player can still receive items if they have a free slot and currency. */
export function canBid(player: Player, settings: Settings): boolean {
  return (
    player.connected &&
    slotsFilled(player) < settings.slotsPerPlayer &&
    player.currency > 0
  );
}

/** True when no player can bid on anything anymore. */
export function auctionExhausted(state: GameState): boolean {
  const players = state.playerOrder.map((id) => state.players[id]);
  return !players.some((p) => canBid(p, state.settings));
}

/**
 * Compute the turn order for the next item.
 *
 * Rotates the previous order left by one so the front-of-line advances each
 * item, then forces the winner of the previous item to the back ("bids last").
 */
export function nextTurnOrder(
  prevOrder: string[],
  winnerId: string | null
): string[] {
  if (prevOrder.length === 0) return [];
  let order = [...prevOrder.slice(1), prevOrder[0]]; // rotate left by 1
  if (winnerId) {
    order = order.filter((id) => id !== winnerId);
    order.push(winnerId);
  }
  return order;
}

/**
 * Deduplicate generated items by normalized name, preserving first occurrence.
 */
export function dedupeItems(items: Item[]): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Item value = average of all submitted ratings, to one decimal. */
export function itemValue(ratings: Record<string, number>): number {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return round1(sum / values.length);
}

/**
 * Compute the final leaderboard.
 *
 * Player score = sum of won-item values − 1 point per unfilled slot.
 * Leftover currency is worth nothing.
 */
export function computeResults(state: GameState): ResultRow[] {
  const rows: ResultRow[] = state.playerOrder.map((id) => {
    const player = state.players[id];
    const items = player.wonItems.map((w) => ({
      item: w.item,
      value: itemValue(w.ratings),
      price: w.price,
    }));
    const itemsValue = round1(items.reduce((a, b) => a + b.value, 0));
    const unfilledSlots = Math.max(
      0,
      state.settings.slotsPerPlayer - player.wonItems.length
    );
    const penalty = unfilledSlots; // 1 point per unfilled slot
    return {
      playerId: id,
      name: player.name,
      isBot: player.isBot,
      itemsValue,
      penalty,
      unfilledSlots,
      score: round1(itemsValue - penalty),
      items,
    };
  });
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

/** Flatten every won item across all players (the rating target list). */
export function allWonItems(state: GameState) {
  const out: Array<{ ownerId: string; key: string }> = [];
  for (const id of state.playerOrder) {
    for (const w of state.players[id].wonItems) {
      out.push({ ownerId: id, key: w.key });
    }
  }
  return out;
}
